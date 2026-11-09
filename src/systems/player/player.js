/* ---------- Spielfigur: Modus wechseln, Laufen, Aktionstaste, Lift, Seilrutsche, Graben zu Fuß und das Update je Bild ---------- */
// PR 28b. Bewegt aus legacy.js. Die Fahrzeuge liegen in vehicles.js und kommen wie alles übrige Spiel über den Port PL
// (vehicles.js erreicht die Spielfigur weiter über seinen Port VH und die Einzeiler in legacy.js).
import { P, parked, keys, cam, hero, pan } from '../../state/game.js';
import { G, WORLD_W, clamp, WATER, LAVA, ICE, CORE, VOLC, CELL, TOP, GX, BED, SHELL } from '../../core/world/const.js';
import { ST } from '../../state/facade.js';
import { sfx, blip, jingle, tone } from '../../audio/sound.js';
import { cellAt, hotAt } from '../../state/sim.js';
import { MROCKS, METS } from '../sights.js';
import { inGrid } from '../../core/world/shape.js';
import { grid } from '../../state/world.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} PL */
export function gravWith(PL){ return P.y<-1700?G*.3:G; }
/** @param {Port} PL */
export function parkWith(PL){ return {x:P.x,y:P.y,vy:P.vy,ang:P.mode==='rocket'?0:P.ang,face:P.face,arm:P.arm,lift:P.lift,da:P.da,load:P.load}; }
/** @param {Port} PL */
export function leaveVehicleWith(PL){
  const m=P.mode;
  if(m==='walk'||m==='coaster'||m==='ski') return;
  if(m==='heli'&&PL.heliLoad) PL.heliDrop();
  if(m==='dragon'){ PL.smoke(P.x,P.y-40,10); return; }
  if((m==='plane'||m==='rocket')&&!P.on) PL.ghost={kind:m,x:P.x,y:P.y,vx:m==='plane'?(Math.abs(P.vx)>120?P.vx:P.face*220):P.vx,vy:P.vy};
  else parked[m]=parkWith(PL);
}
/** @param {Port} PL @param {any} m */
export function setModeWith(PL,m){
  if(m===P.mode&&m!=='coaster') return;
  if(m==='coaster'){
    if(!ST.tracks.length){ PL.setTool('track',true); PL.pulse('tool-track'); return; }
    leaveVehicleWith(PL);
    let best=ST.tracks[0], bd=1e12;
    for(const T of ST.tracks){ const d=Math.abs(T.pts[0][0]-P.x)+Math.abs(T.pts[0][1]-P.y)-(T.user?4000:0); if(d<bd){bd=d;best=T;} }
    P.track=best; P.s=0; P.v=130;
  }else{
    const jumped=(P.mode==='plane'||P.mode==='rocket'||P.mode==='dragon'||P.mode==='balloon')&&!P.on;
    leaveVehicleWith(PL);
    if(m!=='walk'){
      const pk=parked[m];
      P.load=pk?pk.load:(m==='dumper'?200:0);
      P.arm=.75; P.lift=0; P.da=0; P.ang=0; P.bed=0; P.climb=0;
      if(m!=='ski'&&m!=='dragon') parked[m]=null;
      if(m==='plane'&&!P.on) P.vx=P.face*250;
      if(m==='dragon'){ PL.smoke(P.x,P.y-40,10); sfx('roar'); }
    }
    if(m==='walk'&&jumped){ P.vy=-230; P.vx*=.5; PL.pulse('act'); }
  }
  P.mode=m; P.chute=false; P.air=0; P.turbo=0; P.ball=0; P.spin=0; P.rot=0; P.wall=false; P.zip=null;
  if(m==='coaster') P.on=false;
  PL.syncUI();
}
/** @param {Port} PL @param {any} lx @param {any} ly */
export function rotWith(PL,lx,ly){ const c=Math.cos(P.ang), sn=Math.sin(P.ang); return [P.x+lx*c-ly*sn, P.y+lx*sn+ly*c]; }
/** @param {Port} PL */
export function bucketWith(PL){ return rotWith(PL,P.face*(8+56*Math.cos(P.arm)),-34+56*Math.sin(P.arm)); }
/** @param {Port} PL */
export function scoopWith(PL){ return rotWith(PL,P.face*38,-12-P.lift); }
/** @param {Port} PL */
export function drillHeadWith(PL){ return [P.x+P.face*24*Math.cos(P.da),P.y-27+24*Math.sin(P.da)]; }
/** @param {Port} PL */
export function doActionWith(PL){
  if(P.zip){ keys.u=true; zipRideWith(PL,0); keys.u=false; return; }
  if(P.mode==='walk'){
    const zn=zipNearWith(PL); if(zn){ zipGoWith(PL,zn); return; }
    if(PL.nearScope()){ PL.scopeOpen(); return; }
    if(PL.deepAct()) return;
    if(nearLiftWith(PL)){ rideLiftWith(PL); return; }
    if(ST.tool==='bow'){ PL.shoot(); return; }
    if(PL.DIGT[ST.tool]){ handDigWith(PL); return; }
    if(P.on){ P.vy=-400*(PL.FX.sugar>0?1.3:1)*(PL.FX.tiny>0?.8:1); P.on=false; P.air=0; sfx('jump'); }
    else P.chute=!P.chute;
  }else if(P.mode==='car'){
    P.turbo=1.5; if(P.on) P.vx=P.face*520; else P.vx+=P.face*200;
  }else if(P.mode==='bagger'){ PL.baggerAct(); P.digT=.25; }
  else if(P.mode==='loader'){ PL.loaderAct(); P.digT=.25; }
  else if(P.mode==='dumper'){ PL.dumperAct(); P.digT=.2; }
  else if(P.mode==='tbm'){ P.digT=0; }
  else if(P.mode==='ski') PL.skiAct();
  else if(P.mode==='dragon'){ P.digT=0; }
  else if(P.mode==='sub') PL.sonar();
  else if(P.mode==='heli'&&(!P.on||PL.heliLoad)) PL.heliHook();
  else if(P.mode==='boat'&&PL.boatWet()){ blip(220,210,.5,'sawtooth',.06); PL.shout(P.x,P.y-90,'TUUT!'); }
  else setModeWith(PL,'walk');
}
/** @param {Port} PL */
export function burnWith(PL){
  P.hurt=.9; P.soot=4; P.vy=-440; P.on=false; P.vx+=(Math.random()-.5)*160;
  PL.smoke(P.x,P.y-16,9); PL.shake=Math.max(PL.shake,.25);
}
/** @param {Port} PL */
export function boundsXWith(PL){
  if(PL.realm){ if(P.x<PL.RX0) wrapXWith(PL,PL.RW); else if(P.x>=PL.RX0+PL.RW) wrapXWith(PL,-PL.RW); return; }
  if(P.x<40){P.x=40; if(P.vx<0)P.vx=0; if(P.mode==='plane')P.face=1;}
  if(P.x>WORLD_W-40){P.x=WORLD_W-40; if(P.vx>0)P.vx=0; if(P.mode==='plane')P.face=-1;}
}
/* Auf einer fremden Welt geht es rundherum: Wer am Ende hinausläuft, kommt am Anfang wieder herein. */
/** @param {Port} PL @param {any} d */
export function wrapXWith(PL,d){
  P.x+=d; cam.x+=d; PL.pet.x+=d; PL.parts.length=0; PL.ghost=null;
  PL.grow(Math.max(P.x,cam.x)+3200); PL.scanMobile();
  if(!ST.seen.round&&ST.BIO.every(function(b){ return ST.seen[b.i]; })){ ST.seen.round=1; ST.lootDirty=true; PL.confetti(P.x,P.y); jingle(); PL.banner('🌍',2400); PL.say('','Du bist einmal ganz um '+PL.rlm().n+' herum gereist!'); }
}
/** @param {Port} PL @param {any} dt @param {any} hw @param {any} h @param {any} step @param {any} half */
export function moverWith(PL,dt,hw,h,step,half){
  let hit=false;
  if(PL.solidW(P.x,P.y-step-3)&&PL.solidW(P.x,P.y-h*.5)){ P.y-=5; if(P.vy>0)P.vy=0; }
  if(P.vx!==0){
    const nx=P.x+P.vx*dt, ex=nx+(P.vx>0?hw:-hw);
    if(PL.solidW(ex,P.y-step-2)||PL.solidW(ex,P.y-h*.55)||PL.solidW(ex,P.y-h+2)) hit=true; else P.x=nx;
    boundsXWith(PL);
  }
  let ny=P.y+P.vy*dt;
  if(P.vy<0&&(PL.solidW(P.x,ny-h)||PL.solidW(P.x-hw*.6,ny-h)||PL.solidW(P.x+hw*.6,ny-h))){ ny=P.y; P.vy=0; }
  const sl=PL.skyLim(); if(ny<sl){ ny=sl; if(P.vy<0)P.vy=0; }
  const fc=PL.floorAt(P.x,P.y,step), fb=PL.floorAt(P.x-half,P.y,step), ff=PL.floorAt(P.x+half,P.y,step);
  const f=Math.min(fc,(fb+ff)/2);
  P.gs=clamp((ff-fb)/(2*half),-1.3,1.3);
  P.landed=false;
  if(ny>=f){ if(!P.on) P.landed=true; ny=f; P.on=true; }
  else if(f-ny>2.5) P.on=false;
  P.y=ny;
  return hit;
}
/** @param {Port} PL @param {any} dt @param {any} ix @param {any} u @param {any} d */
export function updWalkWith(PL,dt,ix,u,d){
  if(PL.FX.slip>0){ ix=P.face; u=0; }
  if(ix) P.face=ix;
  if(d) P.chute=false;
  const wm=cellAt(P.x,P.y-12), wet=wm===WATER||(wm===LAVA&&hero.up.heat>=2), icy=P.on&&cellAt(P.x,P.y+2)===ICE;
  if(P.on) P.vx+=(ix*150*PL.fxSpeed()*(1+.1*hero.up.motor)-P.vx)*Math.min(1,dt*(icy?1.2:10));
  else if(ix) P.vx+=(ix*(P.chute?120:220)-P.vx)*Math.min(1,dt*2.5);
  else P.vx-=P.vx*Math.min(1,dt*.5);
  if(u){
    P.vy+=((P.y<-1200?-430:-240)*(1+.25*hero.up.jet)-P.vy)*Math.min(1,dt*6); P.on=false; P.chute=false;
    if(!wet&&Math.random()<dt*40) PL.spawn(1,P.x-P.face*8,P.y-14,(Math.random()-.5)*30,130,.25,4);
  }
  else if(PL.FX.float>0){ P.vy+=(-110-P.vy)*Math.min(1,dt*4); P.on=false; }
  else if(P.chute) P.vy+=(75-P.vy)*Math.min(1,dt*4);
  else P.vy+=gravWith(PL)*dt;
  if(wet){ P.soot=0; P.chute=false; P.vx-=P.vx*Math.min(1,dt*2); if(!u){ P.vy-=G*.8*dt; P.vy-=P.vy*Math.min(1,dt*3); } }
  if(P.vy>700) P.vy=700;
  const pv=P.vy;
  moverWith(PL,dt,5,30,14,3);
  if(P.on){
    if(P.landed&&pv>350){ PL.dust(P.x,P.y); if(PL.FX.big>0) PL.shake=Math.max(PL.shake,.3); }
    P.chute=false; P.air=0; P.vy=P.gs*P.vx; P.run+=Math.abs(P.vx)*dt*.11;
  }else{
    P.air+=dt;
    if(!P.chute&&!u&&!wet&&P.vy>520&&PL.floorAt(P.x,P.y,0)-P.y<300) P.chute=true;
  }
}
/** @param {Port} PL @param {any} o @param {any} dt */
export function settleWith(PL,o,dt){
  const f=PL.floorAt(o.x,o.y,26);
  if(o.y<f-1){ o.vy+=G*dt; if(o===parked.balloon&&o.vy>70) o.vy=70; o.y=Math.min(f,o.y+o.vy*dt); }
  else{ o.y=f; o.vy=0; o.ang+=(Math.atan(clamp((PL.floorAt(o.x+16,o.y,26)-PL.floorAt(o.x-16,o.y,26))/32,-1.3,1.3))-o.ang)*Math.min(1,dt*10); }
}
/** @param {Port} PL @param {any} dt */
export function updateWith(PL,dt){
  PL.time+=dt;
  const ix=(keys.r?1:0)-(keys.l?1:0), u=keys.u?1:0, d=keys.d?1:0;
  if(P.hurt>0)P.hurt-=dt; if(P.soot>0)P.soot-=dt; if(P.frost>0)P.frost-=dt; if(P.turbo>0)P.turbo-=dt; if(PL.shake>0)PL.shake-=dt;
  PL.popT-=dt;
  if(PL.popT<=0&&(PL.popG||PL.popM)){
    if(PL.popG) PL.spawn(9,P.x-12,P.y-60,0,-55,.9,17,'+'+PL.popG,'#ffd23f');
    if(PL.popM) PL.spawn(9,P.x+16,P.y-74,0,-55,.9,17,'+'+PL.popM,'#7fe3f0');
    PL.popG=0; PL.popM=0; PL.popT=.4;
  }
  if(P.swing>0) P.swing=Math.max(0,P.swing-dt*5);
  if(keys.a&&PL.DIGT[ST.tool]&&P.mode==='walk'&&!ST.paused&&!zipNearWith(PL)&&!PL.deepIcon()) handDigWith(PL);
  else if(P.mode==='walk'&&!ST.paused&&(ix||u||d)) pushDigWith(PL,ix,u,d);
  if(P.zip) zipRideWith(PL,dt);
  else if(P.mode==='walk') updWalkWith(PL,dt,ix,u,d);
  else if(P.mode==='car') PL.updCar(dt,ix,u,d);
  else if(P.mode==='plane') PL.updPlane(dt,ix,u,d);
  else if(P.mode==='bagger') PL.updBagger(dt,ix,u,d);
  else if(P.mode==='loader') PL.updLoader(dt,ix,u,d);
  else if(P.mode==='dumper') PL.updDumper(dt,ix,u,d);
  else if(P.mode==='tbm') PL.updTbm(dt,ix,u,d);
  else if(P.mode==='rocket') PL.updRocket(dt,ix,u,d);
  else if(P.mode==='ski') PL.updSki(dt,ix,u,d);
  else if(P.mode==='dragon') PL.updDragon(dt,ix,u,d);
  else if(P.mode==='sub') PL.updSub(dt,ix,u,d);
  else if(P.mode==='balloon') PL.updBalloon(dt,ix,u,d);
  else if(P.mode==='heli') PL.updHeli(dt,ix,u,d);
  else if(P.mode==='boat') PL.updBoat(dt,ix,u,d);
  else if(P.mode==='bug') PL.updBug(dt,ix,u,d);
  else PL.updCoaster(dt,ix);

  if(P.mode!=='coaster'&&P.mode!=='dragon'&&P.hurt<=0&&PL.FX.star<=0){
    let hot=PL.burns(P.x,P.y-4)||PL.burns(P.x,P.y-16);
    if(P.mode!=='walk'&&P.mode!=='ski'&&P.mode!=='plane'&&P.mode!=='rocket') hot=hot||PL.burns(P.x-20,P.y-5)||PL.burns(P.x+20,P.y-5);
    if(P.mode==='plane') hot=hot||PL.burns(P.x+24*P.face,P.y-10);
    if(cellAt(P.x,P.y+3)===CORE) PL.qEvent('core',1);
    if(hot||(hero.up.heat<3&&cellAt(P.x,P.y+3)===CORE)) burnWith(PL);
  }
  if(P.soot>0&&Math.random()<dt*8) PL.spawn(0,P.x,P.y-30,(Math.random()-.5)*20,-40,.7,4);

  for(let i=PL.bombs.length-1;i>=0;i--){
    const bm=PL.bombs[i]; bm.t-=dt;
    if(!PL.solidW(bm.x,bm.y+7)){ bm.vy=Math.min(bm.vy+G*dt,560); bm.y+=bm.vy*dt; } else bm.vy=0;
    if(bm.t<=0){ PL.bombs.splice(i,1); PL.blast(bm.x,bm.y); }
  }
  if(hero.pet){ PL.pet.x+=(P.x-P.face*30-PL.pet.x)*Math.min(1,dt*4); PL.pet.y+=(P.y-16-PL.pet.y)*Math.min(1,dt*5); }
  for(const k in parked) if(parked[k]&&!(k===PL.heliLoad&&P.mode==='heli')) settleWith(PL,parked[k],dt);
  if(parked.rocket) parked.rocket.ang=0;
  if(PL.ghost){
    PL.ghost.vy+=150*dt; PL.ghost.x+=PL.ghost.vx*dt; PL.ghost.y+=PL.ghost.vy*dt;
    if(PL.ghost.x<50||PL.ghost.x>WORLD_W-50) PL.ghost.vx*=-1;
    if(Math.random()<dt*18) PL.spawn(0,PL.ghost.x,PL.ghost.y-14,0,-10,.9,5);
    if(PL.solidW(PL.ghost.x,PL.ghost.y)||PL.solidW(PL.ghost.x+(PL.ghost.vx>0?30:-30),PL.ghost.y-14)||hotAt(PL.ghost.x,PL.ghost.y-8)){ PL.explode(PL.ghost.x,PL.ghost.y); PL.ghost=null; }
  }
  for(const tr of PL.trees){
    if(tr.state!==1) continue;
    tr.t-=dt;
    if(Math.random()<dt*22) PL.spawn(1,tr.x+(Math.random()-.5)*34*tr.s,tr.gy-tr.h+(Math.random()-.3)*30,(Math.random()-.5)*20,-50-Math.random()*50,.5+Math.random()*.4,6+Math.random()*5);
    if(Math.random()<dt*5) PL.spawn(0,tr.x,tr.gy-tr.h-20,(Math.random()-.5)*20,-50,1.2,7);
    if(tr.t<=0) tr.state=2;
  }
  if(Math.abs(cam.x-VOLC)<1500){
    const cy=PL.ground(VOLC)-30, live=cellAt(VOLC,cy+8)===LAVA||cellAt(VOLC-30,cy+8)===LAVA||cellAt(VOLC+30,cy+8)===LAVA;
    if(live&&Math.random()<dt*5) PL.spawn(0,VOLC+(Math.random()-.5)*90,cy,(Math.random()-.5)*20,-45-Math.random()*30,2.2,9+Math.random()*8);
    PL.volT-=dt;
    if(PL.volT<=0){
      PL.volT=6+Math.random()*6;
      if(live) for(let i=0;i<10;i++) PL.spawn(4,VOLC+(Math.random()-.5)*60,cy,(Math.random()-.5)*340,-380-Math.random()*220,2.4,4+Math.random()*3);
    }
    /* Ab und zu ein großer Ausbruch: Es rumpelt, Lava spritzt hoch und ein paar glühende Lavabrocken landen am Hang. Dem Kind passiert nichts. */
    PL.eruT-=dt;
    if(live&&PL.eruT<=0&&Math.abs(P.x-VOLC)<900){
      PL.eruT=80+Math.random()*50; PL.eruOn=3; blip(70,40,1.2,'sawtooth',.09); PL.shout(VOLC,cy-120,'RUMMS!','#ff9a3c');
      for(let i=0;i<3&&MROCKS.length<6;i++){ const d=(i%2?1:-1), tx=VOLC+d*(140+Math.random()*180), ty=PL.ground(tx), tt=1.6, sy=cy-10;
        METS.push({x:VOLC,y:sy,vx:(tx-VOLC)/tt,vy:(ty-sy-300*tt*tt)/tt,g:600,t:tt,land:true,tr:[]}); }
    }
    if(PL.eruOn>0){ PL.eruOn-=dt; for(let i=0;i<3;i++) PL.spawn(4,VOLC+(Math.random()-.5)*40,cy,(Math.random()-.5)*260,-520-Math.random()*300,2.6,4+Math.random()*4); if(Math.random()<dt*20) PL.spawn(0,VOLC+(Math.random()-.5)*60,cy-20,(Math.random()-.5)*30,-90,3,14+Math.random()*10); }
  }
  let pw=0;
  for(let i=0;i<PL.parts.length;i++){
    const p=PL.parts[i]; p.life-=dt;
    if(p.life<=0) continue;
    PL.parts[pw++]=p;
    if(p.type===0||p.type===7){ p.vy-=20*dt; p.size+=9*dt; }
    else if(p.type===1) p.vy-=70*dt;
    else if(p.type===2) p.vy-=10*dt;
    else if(p.type===6){ p.vy+=G*.35*dt; p.vx-=p.vx*dt*1.5; }
    else if(p.type<8) p.vy+=G*.6*dt;
    else if(p.type===10) p.vy+=G*.45*dt;
    else if(p.type===12){ p.vy-=18*dt; p.size+=5*dt; }
    p.x+=p.vx*dt; p.y+=p.vy*dt;
    if(p.type===4&&p.vy>0&&PL.solidW(p.x,p.y)) p.life=0;
  }
  PL.parts.length=pw;
  const vw=PL.W/PL.S, vh=PL.H/PL.S;
  /* Beim Schienenmalen schiebt der Finger am Bildrand die Kamera weiter, so lassen sich lange und hohe Bahnen in einem Zug malen. */
  const sp=PL.strokeId!==null&&PL.stroke?PL.pointers.get(PL.strokeId):null;
  if(sp){
    const v=330*dt, topS=Math.min(PL.H*.4,150);
    if(sp.x<64) pan.x-=v; else if(sp.x>PL.W-64) pan.x+=v;
    if(sp.y<topS+56) pan.y-=v; else if(sp.y>PL.H-190) pan.y+=v;
    pan.x=clamp(pan.x,-3000,3000); pan.y=clamp(pan.y,-5200,1500);
    const w=PL.toWorld(sp.x,sp.y), l=PL.stroke[PL.stroke.length-1];
    if(PL.stroke.length<900&&Math.hypot(w[0]-l[0],w[1]-l[1])>10) PL.stroke.push(w);
  }else{ pan.x-=pan.x*Math.min(1,dt*2.5); pan.y-=pan.y*Math.min(1,dt*2.5); }
  const tx=P.x+clamp(P.vx*.3,-110,110)+pan.x, ty=P.y-vh*.08-20+pan.y;
  cam.x+=(tx-cam.x)*Math.min(1,dt*4); cam.y+=(ty-cam.y)*Math.min(1,dt*5);
  if(!PL.realm&&vw<WORLD_W) cam.x=clamp(cam.x,vw/2,WORLD_W-vw/2);
}
/** @param {Port} PL */
export function nearLiftWith(PL){ return (P.mode==='walk'||P.mode==='ski')&&P.on&&P.ball<=0&&Math.abs(P.x-PL.LIFT0)<48&&Math.abs(P.y-PL.surfaceY(PL.LIFT0))<60; }
/** @param {Port} PL */
export function rideLiftWith(PL){
  PL.need(function(){ P.back=P.mode==='ski'; P.mode='coaster'; P.track=PL.LIFT; P.s=0; P.v=220; P.on=false; P.chute=false; P.spin=0; P.rot=0; PL.syncUI(); sfx('pop'); });
}
/** @param {Port} PL @param {any} dt */
export function liftRideWith(PL,dt){
  P.s+=220*dt;
  const q=PL.trackAt(PL.LIFT,P.s);
  P.x=q.x; P.y=q.y+46; P.vx=q.tx*220; P.vy=q.ty*220; P.ang=0; P.face=1;
  if(P.s>=PL.LIFT.len){ P.mode=P.back?'ski':'walk'; P.on=false; P.air=0; P.vx=60; P.vy=0; P.chute=false; PL.syncUI(); }
}
/** @param {Port} PL @param {any} z */
export function zipOkWith(PL,z){ return z&&Array.isArray(z.a)&&Array.isArray(z.b)&&isFinite(z.a[0]+z.a[1]+z.b[0]+z.b[1]); }
/** @param {Port} PL @param {any} x0 @param {any} y0 @param {any} x1 @param {any} y1 */
export function zipAddWith(PL,x0,y0,x1,y1){
  const L=Math.hypot(x1-x0,y1-y0);
  if(L<120||L>2400||Math.abs(y1-y0)<10){ PL.pulse('tool-rope'); tone([200],'triangle'); return; }
  const z=y0<=y1?{a:[x0,y0],b:[x1,y1]}:{a:[x1,y1],b:[x0,y0]};
  ST.zips.push(z); if(ST.zips.length>PL.ZIPMAX) ST.zips.shift(); sfx('pop');
}
/** @param {Port} PL */
export function zipNearWith(PL){
  if(P.mode!=='walk'||P.zip) return null;
  for(const z of ST.zips){ const dx=P.x-z.a[0], dy=P.y-46-z.a[1]; if(Math.abs(dx)<44&&dy>-40&&dy<140) return z; }
  return null;
}
/** @param {Port} PL @param {any} z */
export function zipGoWith(PL,z){ /** @type {any} */ (P).zip={z:z,s:0,v:120}; P.chute=false; P.on=false; sfx('whoosh'); }
/** @param {Port} PL @param {any} dt */
export function zipRideWith(PL,dt){
  const z=/** @type {any} */ (P).zip.z, L=Math.hypot(z.b[0]-z.a[0],z.b[1]-z.a[1]), ux=(z.b[0]-z.a[0])/L, uy=(z.b[1]-z.a[1])/L;
  /** @type {any} */ (P).zip.v=clamp(/** @type {any} */ (P).zip.v+G*.7*uy*dt-/** @type {any} */ (P).zip.v*.15*dt,90,620); /** @type {any} */ (P).zip.s+=/** @type {any} */ (P).zip.v*dt;
  P.x=z.a[0]+ux*/** @type {any} */ (P).zip.s; P.y=z.a[1]+uy*/** @type {any} */ (P).zip.s+46; P.face=ux>=0?1:-1;
  const end=/** @type {any} */ (P).zip.s>=L-14||keys.u||(/** @type {any} */ (P).zip.s>24&&PL.solidW(P.x+P.face*8,P.y-14));
  if(Math.random()<dt*8) PL.spawn(3,P.x,P.y-46,(Math.random()-.5)*40,-20,.3,2);
  if(end){ P.vx=ux*/** @type {any} */ (P).zip.v*.8; P.vy=uy*/** @type {any} */ (P).zip.v*.5-(keys.u?160:40); /** @type {any} */ (P).zip=null; P.air=0; if(keys.u) sfx('jump'); }
}
/** @param {Port} PL @param {any} [wx] @param {any} [wy] */
export function handDigWith(PL,wx,wy){
  if(P.mode!=='walk'||P.zip||PL.time<PL.handT) return 0;
  const sh=ST.tool==='shovel', r=(sh?15:12)*(1+.12*hero.up.dig);
  PL.handT=PL.time+(sh?.14:.22); P.swing=1;
  if(wx===undefined){
    const hx=(keys.r?1:0)-(keys.l?1:0);
    if(keys.u){ wx=P.x+hx*13; wy=P.y-(hx?36:40); }
    else if(keys.d){ wx=P.x+hx*13; wy=P.y+(hx?4:9); }
    else{ wx=P.x+P.face*15; wy=P.y-17; }
  }
  else if(Math.abs(wx-P.x)>4) P.face=wx>P.x?1:-1;
  if(PL.monStrike(wx,wy,r)) return 0;
  const c0=Math.floor((wx-r)/CELL), c1=Math.floor((wx+r)/CELL), r0=Math.floor((wy-r*1.5-TOP)/CELL), r1=Math.floor((wy+r*1.5-TOP)/CELL);
  let n=0, hard=0;
  for(let cy=r0;cy<=r1;cy++) for(let cx=c0;cx<=c1;cx++){
    if(!inGrid(cx,cy)) continue;
    const dx=(cx+.5)*CELL-wx, dy=(TOP+(cy+.5)*CELL-wy)/1.5;
    if(dx*dx+dy*dy>r*r) continue;
    const i=cy*GX+cx, m=grid[i];
    if(m<4) continue;
    if(sh&&!PL.SOFT[m]){ if(m!==BED&&m!==CORE&&m!==SHELL) hard++; continue; }
    n+=PL.take(i);
  }
  if(n){
    sfx('dig');
    for(let k=0;k<4;k++) PL.spawn(3,wx+(Math.random()-.5)*16,wy+(Math.random()-.5)*16,(Math.random()-.5)*140-P.face*40,-60-Math.random()*100,.5,2.5+Math.random()*2);
  }else if(hard){
    sfx('tick'); for(let k=0;k<3;k++) PL.spawn(5,wx,wy,(Math.random()-.5)*160,-50-Math.random()*90,.4,2);
    if(PL.time>PL.handHint){ PL.handHint=PL.time+60; PL.say('','Tock! Das ist zu hart für die Schaufel. Nimm die Spitzhacke.'); PL.pulse('tool-pick'); }
  }
  return n;
}
/* Unter der Erde gräbt man sich frei, indem man einfach dagegen drückt, auch ohne Werkzeug: gegen eine Wand, nach oben gegen die Decke oder im Stehen nach unten. Das geht so schnell wie mit der Spitzhacke, mit der Schaufel nur durch weiche Erde. An der Oberfläche passiert nichts, damit das Laufen dort bleibt, wie es ist. */
/** @param {Port} PL @param {any} ix @param {any} u @param {any} d */
export function pushDigWith(PL,ix,u,d){
  if(P.zip||P.y<-3000||P.y<PL.ground(P.x)+24) return;
  const ex=P.x+ix*10;
  if((ix&&(PL.solidW(ex,P.y-16)||PL.solidW(ex,P.y-28)))||(u&&(PL.solidW(P.x,P.y-34)||PL.solidW(P.x-4,P.y-34)||PL.solidW(P.x+4,P.y-34)))||(d&&P.on)) handDigWith(PL);
}
