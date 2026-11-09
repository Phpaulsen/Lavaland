/* ---------- Fahrzeuge: Graben und Schaufeln, Fahren, Fliegen, Ski, Drache, U-Boot, Ballon, Hubschrauber, Boot, Kletterkäfer ---------- */
// PR 28a. Bewegt aus legacy.js. Laufen, mover, update, setMode und die Seilrutsche bleiben vorerst in legacy.js (PR 28b).
// Was die Fahrzeuge vom übrigen Spiel brauchen, kommt über den Port VH.
import { grid } from '../../state/world.js';
import { BED, CORE, SHELL, GOLD, GEM, GX, CELL, TOP, EARTH, ICE, WATER, clamp, G, SNOW, TAU, FIRE } from '../../core/world/const.js';
import { ST } from '../../state/facade.js';
import { sfx, tone } from '../../audio/sound.js';
import { inGrid } from '../../core/world/shape.js';
import { parked, hero, P, keys } from '../../state/game.js';
import { cellAt } from '../../state/sim.js';

/** @typedef {Record<string, any>} Port */

/* Eine Zelle abbauen. Erdkern und Weltrand bleiben. */
/** @param {Port} VH @param {any} i */
export function takeWith(VH,i){
  const m=grid[i];
  if(m<4||m===BED||m===CORE) return 0;
  if(m===SHELL&&!VH.shellOk(i)) return 0;
  grid[i]=0;
  if(VH.quest&&VH.quest.type==='dig'&&!VH.quest.done) VH.quest.p++;
  if(m===GOLD||m===GEM){
    /* Gold und Edelsteine zählen nicht mehr (Vereinfachungsplan Schritt 2): Erz klingt und glitzert nur. */
    if(m===GOLD) VH.qEvent('gold',1); else VH.qEvent('gems',1);
    ST.lootDirty=true; sfx('coin');
    if(Math.random()<.5){ const y=(i/GX)|0; VH.spawn(5,(i-y*GX)*CELL+3,TOP+y*CELL+3,(Math.random()-.5)*120,-80-Math.random()*120,.7,2); }
  }
  return 1;
}
/** @param {Port} VH @param {any} cx @param {any} cy @param {any} k @param {any} [sp] */
export function pileWith(VH,cx,cy,k,sp){
  let n=0; sp=sp||4;
  while(k-->0){
    let c=cx-sp+(Math.random()*(2*sp+1)|0); const c2=cx-sp+(Math.random()*(2*sp+1)|0);
    if(VH.colTop(c2,cy)>VH.colTop(c,cy)) c=c2;
    const r=VH.colTop(c,cy)-1;
    if(inGrid(c,r)&&grid[r*GX+c]<4){ grid[r*GX+c]=EARTH; n++; }
  }
  return n;
}
/* Auskippen: steht der Kipper unter der Schaufel, landet die Erde auf seiner Ladefläche. */
/** @param {Port} VH @param {any} b @param {any} k */
export function dumpAtWith(VH,b,k){
  const tk=parked.dumper;
  if(tk&&Math.abs(tk.x-b[0])<42&&b[1]<tk.y-8&&b[1]>tk.y-160){
    const n=Math.min(k,400-tk.load); tk.load+=n; if(n) VH.dust(tk.x,tk.y-34);
    return n;
  }
  return pileWith(VH,Math.floor(b[0]/CELL),Math.floor((b[1]-TOP)/CELL),k);
}
/** @param {Port} VH */
export function digWith(VH){
  const b=VH.bucket(), cx=Math.floor(b[0]/CELL), cy=Math.floor((b[1]-TOP)/CELL);
  let n=0;
  const ea=3.6+.5*hero.up.dig, eb=5.4+.6*hero.up.dig;
  for(let dy=-8;dy<=8;dy++) for(let dx=-5;dx<=5;dx++){
    if(Math.pow(Math.abs(dx)/ea,4)+Math.pow(Math.abs(dy)/eb,4)>1) continue;
    if(inGrid(cx+dx,cy+dy)) n+=takeWith(VH,(cy+dy)*GX+cx+dx);
  }
  if(n){
    sfx('dig');
    P.load=Math.min(400,P.load+n);
    for(let i=0;i<6;i++) VH.spawn(3,b[0]+(Math.random()-.5)*24,b[1]+(Math.random()-.5)*30,(Math.random()-.5)*160,-60-Math.random()*120,.6,3+Math.random()*3);
    VH.shake=Math.max(VH.shake,.08);
  }
  return n;
}
/** @param {Port} VH */
export function baggerActWith(VH){
  if(digWith(VH)) return;
  if(P.arm<-.15&&P.load>0){ P.load-=dumpAtWith(VH,VH.bucket(),Math.min(16,P.load)); return; }
  if(P.arm<1.25) P.arm=Math.min(1.25,P.arm+.22);
  else if(P.on) P.vx=P.face*90;
}
/* Radlader: schiebt und schaufelt auf Bodenhöhe, gräbt nicht nach unten. Schaufel oben = auskippen. */
/** @param {Port} VH */
export function loaderActWith(VH){
  const b=VH.scoop(), cx=Math.floor(b[0]/CELL), cy=Math.floor((b[1]-TOP)/CELL);
  let n=0;
  if(P.load<200) for(let dy=-3;dy<=0;dy++) for(let dx=-3;dx<=3;dx++) if(inGrid(cx+dx,cy+dy)) n+=takeWith(VH,(cy+dy)*GX+cx+dx);
  if(n){ P.load+=n; VH.dust(b[0],b[1]); sfx('dig'); return; }
  if(P.lift>18&&P.load>0){ P.load-=dumpAtWith(VH,[b[0]+P.face*24,b[1]],Math.min(24,P.load)); return; }
  if(P.on&&P.lift<=18) P.vx=P.face*120;
}
/** @param {Port} VH */
export function dumperActWith(VH){
  P.bed=1;
  if(P.load<=0) return;
  const b=VH.rot(-P.face*78,-66);
  P.load-=pileWith(VH,Math.floor(b[0]/CELL),Math.floor((b[1]-TOP)/CELL),Math.min(18,P.load),7);
}
/** @param {Port} VH @param {any} x @param {any} y @param {any} r */
export function boreWith(VH,x,y,r){
  const c0=Math.floor((x-r)/CELL), c1=Math.floor((x+r)/CELL), r0=Math.floor((y-r-TOP)/CELL), r1=Math.floor((y+r-TOP)/CELL);
  let n=0;
  for(let cy=r0;cy<=r1;cy++) for(let cx=c0;cx<=c1;cx++){
    if(!inGrid(cx,cy)) continue;
    const dx=(cx+.5)*CELL-x, dy=TOP+(cy+.5)*CELL-y;
    if(dx*dx+dy*dy<=r*r) n+=takeWith(VH,cy*GX+cx);
  }
  return n;
}
/** @param {Port} VH @param {any} dir */
export function bulldozeWith(VH,dir){
  const xa=P.x+dir*12, xb=P.x+dir*38, c0=Math.floor(Math.min(xa,xb)/CELL), c1=Math.floor(Math.max(xa,xb)/CELL);
  const r0=Math.floor((P.y-50-TOP)/CELL), r1=Math.floor((P.y-2-TOP)/CELL);
  let n=0;
  for(let cy=r0;cy<=r1;cy++) for(let cx=c0;cx<=c1;cx++) if(inGrid(cx,cy)) n+=takeWith(VH,cy*GX+cx);
  if(n) VH.dust(P.x+dir*24,P.y-10);
  return n;
}
/** @param {Port} VH @param {any} dt @param {any} ix @param {any} u @param {any} d */
export function updCarWith(VH,dt,ix,u,d){
  if(ix) P.face=ix;
  const maxv=(P.turbo>0?520:300)*(1+.15*hero.up.motor), icy=P.on&&cellAt(P.x,P.y+2)===ICE, wet=cellAt(P.x,P.y-10)===WATER;
  if(P.climb>0){ P.climb-=dt; P.vx=P.face*70; P.vy=0; }
  else{
    if(P.on){
      const tgt=d?0:ix*maxv;
      P.vx+=(tgt-P.vx)*Math.min(1,dt*(icy?.4:(ix||d?2.5:1)));
      if(P.turbo>0&&Math.abs(P.vx)<maxv) P.vx+=P.face*600*dt;
      if(u){ P.vy=-380; P.on=false; sfx('jump'); }
    }else P.vx+=ix*80*dt;
    P.vy=Math.min(P.vy+VH.grav()*dt,800);
  }
  if(wet){ P.vx-=P.vx*Math.min(1,dt*2); P.soot=0; }
  if(P.turbo>0&&Math.random()<dt*50) VH.spawn(1,P.x-P.face*30,P.y-13,-P.face*120,(Math.random()-.5)*40,.3,6);
  const pv=P.vy;
  if(VH.mover(dt,24,32,26,17)){
    /* Auch das Auto bleibt in keinem Loch stecken: an einer Wand klettert es hoch, unter einem Überhang schiebt es sich frei. */
    const top=P.y-54;
    if(!ix) P.vx*=-.2;
    else if(!VH.solidW(P.x,top)&&!VH.solidW(P.x-15,top)&&!VH.solidW(P.x+15,top)){ P.y-=150*dt; P.on=false; P.climb=.25; }
    else bulldozeWith(VH,ix);
  }
  if(P.on){ if(P.landed&&pv>300) VH.dust(P.x,P.y); P.vy=P.gs*P.vx; P.climb=0; }
  const ta=P.climb>0?-P.face*.6:(P.on?Math.atan(P.gs):Math.atan2(P.vy,Math.abs(P.vx)+200)*P.face*.5);
  P.ang+=(ta-P.ang)*Math.min(1,dt*10);
}
/* Baufahrzeuge fahren sich nie fest: an einer Wand klettern sie hoch; ist darüber kein Platz, räumen sie sich den Weg frei. */
/** @param {Port} VH @param {any} dt @param {any} ix @param {any} sp @param {any} hw @param {any} h @param {any} half @param {any} [vmax] */
export function driveWith(VH,dt,ix,sp,hw,h,half,vmax){
  if(ix) P.face=ix;
  if(P.climb>0){ P.climb-=dt; P.vx=P.face*70; P.vy=0; }
  else{
    if(P.on) P.vx+=(ix*sp*(1+.2*hero.up.motor)-P.vx)*Math.min(1,dt*5); else P.vx+=(ix*70-P.vx)*Math.min(1,dt*2);
    P.vy=Math.min(P.vy+VH.grav()*dt,vmax||800);
  }
  if(cellAt(P.x,P.y-10)===WATER){ P.vx-=P.vx*Math.min(1,dt*2); P.soot=0; }
  const pv=P.vy;
  if(VH.mover(dt,hw,h,32,half)){
    if(ix){
      const top=P.y-h-20;
      if(!VH.solidW(P.x,top)&&!VH.solidW(P.x-15,top)&&!VH.solidW(P.x+15,top)){ P.y-=150*dt; P.on=false; P.climb=.25; }
      else bulldozeWith(VH,ix);
    }else P.vx=0;
  }
  if(P.on){ if(P.landed&&pv>300) VH.dust(P.x,P.y); P.vy=P.gs*P.vx; P.climb=0; }
  P.ang+=((P.climb>0?-P.face*.6:(P.on?Math.atan(P.gs):0))-P.ang)*Math.min(1,dt*10);
}
/** @param {Port} VH @param {any} dt @param {any} ix @param {any} u @param {any} d */
export function updBaggerWith(VH,dt,ix,u,d){
  P.arm=clamp(P.arm+(d-u)*1.7*dt,-.95,1.25);
  driveWith(VH,dt,ix,110,22,28,15);
  if(keys.a){ P.digT-=dt; if(P.digT<=0){ baggerActWith(VH); P.digT=.17/(1+.35*hero.up.dig); } }
}
/** @param {Port} VH @param {any} dt @param {any} ix @param {any} u @param {any} d */
export function updLoaderWith(VH,dt,ix,u,d){
  P.lift=clamp(P.lift+(u-d)*90*dt,0,64);
  driveWith(VH,dt,ix,170,26,30,17);
  if(keys.a){ P.digT-=dt; if(P.digT<=0){ loaderActWith(VH); P.digT=.17/(1+.35*hero.up.dig); } }
}
/** @param {Port} VH @param {any} dt @param {any} ix @param {any} u @param {any} d */
export function updDumperWith(VH,dt,ix,u,d){
  driveWith(VH,dt,ix,230,30,32,20);
  P.bed=Math.max(0,P.bed-dt*1.6);
  if(keys.a){ P.digT-=dt; if(P.digT<=0){ dumperActWith(VH); P.digT=.14; } }
}
/** @param {Port} VH @param {any} dt @param {any} ix @param {any} u @param {any} d */
export function updTbmWith(VH,dt,ix,u,d){
  P.da=clamp(P.da+(d-u)*1.3*dt,-1.5,1.5);
  let go=ix||(keys.a?P.face:0), cutN=0;
  if(!go&&((u&&P.da<=-1.45)||(d&&P.da>=1.45))) go=P.face;
  const up=P.da<-.6, shaft=VH.solidW(P.x-30,P.y-20)||VH.solidW(P.x+30,P.y-20);
  if(go){
    P.face=go;
    const hd=VH.drillHead();
    cutN=boreWith(VH,hd[0],hd[1],27);
    if(up) cutN+=boreWith(VH,P.x,P.y-27,27);
    else if(P.da>.2) cutN+=boreWith(VH,P.x+go*14,P.y-27,27);
    if(cutN){
      VH.shake=Math.max(VH.shake,.04); sfx('dig');
      if(Math.random()<dt*16) VH.spawn(3,hd[0]+(Math.random()-.5)*30,hd[1]+(Math.random()-.5)*40,-go*(40+Math.random()*120),-40-Math.random()*90,.6,3+Math.random()*3);
    }
  }
  if(up&&go&&(cutN||shaft)){
    const sp=80*(1+.15*hero.up.dig);
    P.vx=go*sp*Math.cos(P.da); P.vy=sp*Math.sin(P.da); P.on=false; P.climb=0;
    VH.mover(dt,24,46,32,14);
    P.ang-=P.ang*Math.min(1,dt*10);
  }else if(up&&!go&&shaft&&!P.on){ P.vx=0; P.vy=0; }
  else driveWith(VH,dt,go,P.da>0?85*Math.max(.3,Math.cos(P.da)):95,24,46,14,170+60*hero.up.dig);
}
/* Rakete: ▲ zündet das Triebwerk, ◀ ▶ steuert in der Luft. Ohne Schub sinkt sie langsam. */
/** @param {Port} VH @param {any} dt @param {any} ix @param {any} u @param {any} d */
export function updRocketWith(VH,dt,ix,u,d){
  if(u){
    if(P.on){ P.on=false; P.y-=3; VH.shake=Math.max(VH.shake,.3); VH.smoke(P.x,P.y,8); }
    P.vy+=(-800*(1+.2*hero.up.jet)-P.vy)*Math.min(1,dt*1.5);
    if(Math.random()<dt*50) VH.spawn(1,P.x+(Math.random()-.5)*8,P.y+6,(Math.random()-.5)*50,160+Math.random()*120,.35,7);
  }
  else P.vy=Math.min(P.vy+VH.grav()*.8*dt,d?720:400);
  if(P.on) P.vx-=P.vx*Math.min(1,dt*8);
  else{ P.vx+=(ix*230-P.vx)*Math.min(1,dt*2.5); if(ix) P.face=ix; }
  const pv=P.vy;
  if(VH.mover(dt,13,56,26,9)) P.vx*=-.3;
  if(P.on){ if(P.landed&&pv>200) VH.dust(P.x,P.y); P.vy=0; }
  P.ang+=((P.on?0:clamp(P.vx/230,-1,1)*.35)-P.ang)*Math.min(1,dt*6);
}
/** @param {Port} VH @param {any} dt @param {any} ix @param {any} u @param {any} d */
export function updPlaneWith(VH,dt,ix,u,d){
  if(ix) P.face=ix;
  if(P.on){
    P.vx+=(ix*260-P.vx)*Math.min(1,dt*(ix?1.3:(P.y<-3000?4:.9)));
    if(u&&Math.abs(P.vx)<130) P.vx+=P.face*320*dt;
    /** @type {any} */ (P).upT=u?(/** @type {any} */ (P).upT||0)+dt:0;
    P.vy=Math.min(P.vy+VH.grav()*dt,800);
    if(VH.mover(dt,30,28,26,18)) P.vx=0;
    if(P.on){
      P.vy=P.gs*P.vx; P.ang=Math.atan(P.gs);
      /* Abheben geht auch ohne Anlauf, damit das Flugzeug aus jedem Loch herauskommt. */
      if((u&&Math.abs(P.vx)>120)||Math.abs(P.vx)>235||/** @type {any} */ (P).upT>.45){ P.on=false; P.vy=u?-130:-60; P.y-=3; /** @type {any} */ (P).upT=0; }
    }
  }else{
    P.vx+=(P.face*250*(1+.15*hero.up.jet)-P.vx)*Math.min(1,dt*2);
    P.vy+=((d-u)*(P.y<-1200?430:190)*(1+.2*hero.up.jet)-P.vy)*Math.min(1,dt*3);
    if(P.y<-1200&&Math.random()<dt*40) VH.spawn(1,P.x-P.face*36,P.y-16,-P.face*90,(Math.random()-.5)*30,.3,6);
    if(VH.mover(dt,30,28,26,18)){ P.face=-P.face; P.vx=P.face*80; }
    if(P.on){ P.vy=0; VH.dust(P.x,P.y); }
  }
}
/** @param {Port} VH @param {any} dt @param {any} ix */
export function updCoasterWith(VH,dt,ix){
  const T=/** @type {any} */ (P.track);
  if(T.lift){ VH.liftRide(dt); return; }
  let q=VH.trackAt(T,P.s);
  P.v+=G*.9*q.ty*dt+ix*T.dir*220*dt;
  P.v-=P.v*.08*dt;
  if(P.v<90) P.v+=(90-P.v)*Math.min(1,dt*4);
  if(P.v>1000) P.v=1000;
  P.s+=P.v*dt;
  q=VH.trackAt(T,P.s);
  P.x=q.x; P.y=q.y; P.vx=q.tx*P.v; P.vy=q.ty*P.v; P.ang=Math.atan2(q.ty,q.tx); P.face=T.dir;
  if(P.s>=T.len){
    VH.qEvent('ride',1);
    P.vy-=90; P.mode='walk'; P.on=false; P.air=.2; P.chute=false;
    VH.syncUI();
  }
}
/* Unter den Füßen liegt Schnee oder Eis. Zwei Tiefen, weil der Boden am Hang zwischen zwei Zellen liegt. */
/** @param {Port} VH */
export function onSnowWith(VH){ const a=cellAt(P.x,P.y+3), b=cellAt(P.x,P.y+9); return a===SNOW||a===ICE||b===SNOW||b===ICE; }
/** @param {Port} VH @param {any} dt @param {any} ix @param {any} u @param {any} d */
export function updSkiWith(VH,dt,ix,u,d){
  if(P.ball>0){ updRollWith(VH,dt); return; }
  const snow=onSnowWith(VH), gk=hero.own.goldski?1:0;
  if(ix) P.face=ix;
  if(u){
    P.vy+=(-230*(1+.25*hero.up.jet)-P.vy)*Math.min(1,dt*6); P.on=false; P.jet=true;
    if(Math.random()<dt*40) VH.spawn(1,P.x-P.face*8,P.y-14,(Math.random()-.5)*30,130,.25,4);
  }
  if(P.on){
    const gs=P.gs, v=Math.abs(P.vx);
    P.vx+=G*gs/(1+gs*gs)*dt*(snow?1:.3);
    /* Unten im Auslauf liegt tiefer Schnee: Er bremst, damit man neben dem Lift zum Stehen kommt. */
    P.vx-=P.vx*Math.min(1,dt*((d?(snow?2.6:5):(snow?.15-.05*gk:2.8))+(P.vx<0&&P.x<6060&&P.x>5700?1.9:0)));
    if(ix&&P.vx*ix<190+25*hero.up.motor+50*gk) P.vx+=ix*(snow?320:200)*dt;
    P.vx=clamp(P.vx,-820,820);
    if(snow){
      if(v>90&&Math.random()<dt*(d?40:v*.03)) VH.spawn(10,P.x-P.face*12,P.y-2,-P.vx*.2+(Math.random()-.5)*40,-30-Math.random()*(d?130:60),.4,2+Math.random()*2.5);
      if(v>220){ VH.swishT-=dt; if(VH.swishT<=0){ VH.swishT=.3; sfx('swish'); } }
      if(gk&&v>200&&Math.random()<dt*14) VH.spawn(5,P.x-P.face*14,P.y-3,0,-30,.5,2);
    }
  }else{
    if(!u) P.vy=Math.min(P.vy+VH.grav()*dt,780);
    P.vx+=ix*60*dt;
    if(P.spin){ const st=Math.sign(P.spin)*Math.min(Math.abs(P.spin),10.5*dt); P.ang+=st; P.spin-=st; P.rot+=Math.abs(st); }
  }
  const pv=P.vy, wasAir=P.air;
  if(VH.mover(dt,6,30,18,10)){ if(Math.abs(P.vx)>150) VH.puff(P.x+P.face*8,P.y-12,6); P.vx*=-.25; }
  if(P.on){
    if(P.landed){
      if(Math.abs(P.spin)>.9){ P.ball=1.7; VH.shout(P.x,P.y-52,'PLUMPS!'); sfx('splat'); VH.puff(P.x,P.y-8,12); }
      else{
        const n=Math.round(P.rot/TAU);
        if(n>0){ VH.shout(P.x,P.y-54,n>1?n+' × SALTO!':'SALTO!','#ffd23f'); ST.lootDirty=true; sfx('pop'); VH.qEvent('salto',n); }
        else if(wasAir>1&&!P.jet) VH.shout(P.x,P.y-54,'JUHU!');
        if(pv>260) VH.puff(P.x,P.y-2,7);
        P.ang=Math.atan(P.gs);
      }
      P.spin=0; P.rot=0; P.jet=false;
    }
    P.air=0; P.vy=P.gs*P.vx;
    if(P.ball<=0) P.ang+=(Math.atan(P.gs)-P.ang)*Math.min(1,dt*14);
    /* Wer an einer Tanne vorbeisaust, schüttelt den Schnee herunter. */
    if(Math.abs(P.vx)>120) for(const tr of VH.trees) if(tr.fir&&tr.state===0&&Math.abs(tr.x-P.x)<9&&Math.abs(tr.gy-P.y)<40&&!(tr.sh>VH.time)){ tr.sh=VH.time+1.5; VH.puff(tr.x,tr.gy-tr.h*.7,12); }
  }else P.air+=dt;
}
/* Mitten im Salto gelandet: Der Held kugelt als Schneeball weiter und plumpst dann wieder heraus. */
/** @param {Port} VH @param {any} dt */
export function updRollWith(VH,dt){
  P.ball-=dt;
  if(P.on){ const gs=P.gs; P.vx+=G*gs/(1+gs*gs)*dt; P.vx-=P.vx*Math.min(1,dt*(onSnowWith(VH)?.5:3)); }
  else P.vy=Math.min(P.vy+VH.grav()*dt,780);
  if(VH.mover(dt,9,26,18,8)) P.vx*=-.4;
  if(P.on) P.vy=P.gs*P.vx;
  P.ang+=P.vx/16*dt;
  if(Math.random()<dt*14) VH.puff(P.x,P.y-4,1);
  if(P.ball<=0){ P.ball=0; P.ang=0; P.spin=0; P.rot=0; VH.puff(P.x,P.y-14,16); VH.shout(P.x,P.y-50,'PLOPP!'); sfx('pop'); P.vy=-190; P.on=false; }
}
/** @param {Port} VH */
export function skiActWith(VH){
  if(P.ball>0) return;
  if(VH.nearLift()){ VH.rideLift(); return; }
  if(P.on){ P.vy-=350; P.y-=3; P.on=false; P.air=0; P.jet=false; sfx('jump'); }
  else if(Math.abs(P.spin)<TAU*1.5){ P.spin+=(P.vx>=0?-1:1)*TAU; sfx('whoosh'); }
}
/** @param {Port} VH @param {any} dt @param {any} ix @param {any} u @param {any} d */
export function updDragonWith(VH,dt,ix,u,d){
  if(ix) P.face=ix;
  P.vx+=(ix*310*(1+.15*hero.up.jet)-P.vx)*Math.min(1,dt*3);
  if(P.on&&!u) P.vy=Math.min(P.vy+VH.grav()*dt,300);
  else P.vy+=((d-u)*270+((u||d||VH.reduced)?0:16*Math.sin(VH.time*3))-P.vy)*Math.min(1,dt*4);
  if(u&&P.on){ P.on=false; P.y-=3; }
  if(VH.mover(dt,24,58,22,16)) P.vx*=-.2;
  if(P.on) P.vy=0;
  P.ang+=(clamp(P.vy/500,-.35,.35)*P.face-P.ang)*Math.min(1,dt*6);
  if(keys.a){ P.digT-=dt; if(P.digT<=0){ P.digT=.05; breatheWith(VH); } }
}
/** @param {Port} VH @param {any} cx @param {any} cy */
export function meltWith(VH,cx,cy){
  for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++){
    if(dx*dx+dy*dy>5) continue;
    const x=cx+dx, y=cy+dy; if(!inGrid(x,y)) continue;
    const i=y*GX+x;
    if(grid[i]===SNOW||grid[i]===ICE){ grid[i]=0; VH.steam(x,y); }
  }
}
/** @param {Port} VH */
export function breatheWith(VH){
  const mx=P.x+P.face*62, my=P.y-63;
  for(let k=0;k<2;k++) VH.spawn(1,mx,my,P.face*(300+Math.random()*160)+P.vx,(Math.random()-.3)*120+P.vy*.5,.35+Math.random()*.2,7+Math.random()*6);
  sfx('flame');
  for(let r=20;r<=170;r+=12){
    const x=mx+P.face*r, y=my+r*.24, cx=Math.floor(x/CELL), cy=Math.floor((y-TOP)/CELL);
    if(!inGrid(cx,cy)) break;
    const m=grid[cy*GX+cx];
    if(m===SNOW||m===ICE){ meltWith(VH,cx,cy); break; }
    if(m===WATER){ VH.steam(cx,cy); break; }
    if(m>=4){ if(Math.random()<.5) VH.putUp(cx-P.face,cy,FIRE); break; }
  }
}
/** @param {Port} VH @param {any} dt @param {any} ix @param {any} u @param {any} d */
export function updSubWith(VH,dt,ix,u,d){
  if(ix) P.face=ix;
  const wet=cellAt(P.x,P.y-14)===WATER;
  if(wet){
    P.on=false;
    P.vx+=(ix*230*(1+.15*hero.up.motor)-P.vx)*Math.min(1,dt*2.5);
    P.vy+=((d-u)*190-P.vy)*Math.min(1,dt*3);
    if(Math.random()<dt*(5+Math.abs(P.vx)*.05)) VH.spawn(7,P.x-P.face*30,P.y-16,-P.face*20,-30,.8,2);
  }else{
    P.vx+=(ix*40-P.vx)*Math.min(1,dt*3); P.vy=Math.min(P.vy+VH.grav()*dt,700);
  }
  if(VH.mover(dt,26,30,20,16)) P.vx*=-.2;
  if(P.on) P.vy=0;
  P.ang+=((wet?clamp(P.vy/400,-.4,.4)*P.face:(P.on?Math.atan(P.gs):0))-P.ang)*Math.min(1,dt*6);
}
/** @param {Port} VH @param {any} dt @param {any} ix @param {any} u @param {any} d */
export function updBalloonWith(VH,dt,ix,u,d){
  if(ix) P.face=ix;
  const wind=Math.sin(VH.time*.07+P.x*.0004)*45;
  if(P.on){ P.vx-=P.vx*Math.min(1,dt*6); }
  else P.vx+=(ix*95+wind-P.vx)*Math.min(1,dt*.9);
  let ty=u?-125:d?150:45;
  if(P.y<VH.BALLOON_TOP&&ty<20){ ty=20; if(u&&P.balT<=0){ P.balT=4; VH.say('','Höher kommt der Ballon nicht. Die Luft ist hier oben zu dünn.'); } }
  if(P.balT>0) P.balT-=dt;
  P.vy+=(ty-P.vy)*Math.min(1,dt*(u?1.1:.8));
  if(u){ if(P.on){ P.on=false; P.y-=2; } if(Math.random()<dt*20) VH.spawn(1,P.x+(Math.random()-.5)*6,P.y-46,(Math.random()-.5)*20,-60,.25,5); }
  if(VH.mover(dt,15,120,14,10)) P.vx*=-.3;
  if(P.on){ if(P.landed&&P.vy>90) VH.dust(P.x,P.y); P.vy=0; }
  P.ang+=(clamp(P.vx/600,-.12,.12)-P.ang)*Math.min(1,dt*3);
}
/** @param {Port} VH @param {any} dt @param {any} ix @param {any} u @param {any} d */
export function updHeliWith(VH,dt,ix,u,d){
  if(ix) P.face=ix;
  if(P.on){ P.vx-=P.vx*Math.min(1,dt*6); if(u){ P.on=false; P.y-=2; } }
  else P.vx+=(ix*240-P.vx)*Math.min(1,dt*2);
  let ty=(d-u)*190;
  if(P.y<VH.BALLOON_TOP&&ty<0){ ty=0; if(u&&P.balT<=0){ P.balT=4; VH.say('','Höher kommt der Hubschrauber nicht. Für den Weltraum brauchst du die Rakete.'); } }
  if(P.balT>0) P.balT-=dt;
  if(!P.on) P.vy+=(ty-P.vy)*Math.min(1,dt*3); else P.vy=0;
  if(!P.on&&(ix||u)&&Math.random()<dt*6) VH.spawn(3,P.x+(Math.random()-.5)*60,P.y+4,(Math.random()-.5)*80,-20,.4,3);
  if(VH.mover(dt,30,46,16,18)) P.vx*=-.3;
  if(P.on){ if(P.landed&&P.vy>120) VH.dust(P.x,P.y); P.vy=0; }
  P.ang+=((P.on?Math.atan(P.gs)*.5:clamp(P.vx/240,-1,1)*.22*P.face)-P.ang)*Math.min(1,dt*5);
  const o=VH.heliLoad&&parked[VH.heliLoad];
  if(o){ o.x=P.x; o.y=P.y+70; o.vy=0; o.ang=0; o.face=P.face; if(P.on||VH.solidW(o.x,o.y+2)) heliDropWith(VH); }
  else VH.heliLoad='';
}
/** @param {Port} VH */
export function heliHookWith(VH){
  if(VH.heliLoad){ heliDropWith(VH); return; }
  let best='', bd=1e9;
  for(const k in parked){ const o=parked[k]; if(!o||k==='heli') continue; const dx=Math.abs(o.x-P.x), dy=o.y-P.y; if(dx<70&&dy>-10&&dy<170&&dx+dy<bd){ bd=dx+dy; best=k; } }
  if(best){ VH.heliLoad=best; sfx('pop'); }
  else{ tone([330,262],'triangle'); VH.pulse('act'); }
}
/** @param {Port} VH */
export function heliDropWith(VH){ if(VH.heliLoad&&parked[VH.heliLoad]) parked[VH.heliLoad].vy=0; VH.heliLoad=''; sfx('pop'); }
/* Segelboot: schwimmt auf jedem Wasser, auch auf selbst gemaltem. Der Wind hilft beim Segeln, an Land rutscht es nur mühsam. Hoch lässt es über Wellen hüpfen, die Aktionstaste tutet. */
/** @param {Port} VH */
export function boatWetWith(VH){ return cellAt(P.x,P.y+5)===WATER||cellAt(P.x-14,P.y+5)===WATER||cellAt(P.x+14,P.y+5)===WATER; }
/** @param {Port} VH @param {any} dt @param {any} ix @param {any} u @param {any} d */
export function updBoatWith(VH,dt,ix,u,d){
  if(ix) P.face=ix;
  const wet=boatWetWith(VH), deep=cellAt(P.x,P.y-5)===WATER;
  if(wet){
    const wind=Math.sin(VH.time*.05+P.x*.0003)*50;
    P.vx+=(ix*210*(1+.15*hero.up.motor)+wind*(ix?1:.5)-P.vx)*Math.min(1,dt*1.2);
    if(deep) P.vy+=(-140-P.vy)*Math.min(1,dt*5);
    else{ P.vy+=(0-P.vy)*Math.min(1,dt*6); if(u&&P.balT<=0){ P.vy=-260; P.balT=.6; sfx('jump'); } }
    if(Math.abs(P.vx)>60&&Math.random()<dt*14) VH.spawn(7,P.x-P.face*26,P.y,-P.face*30,-30,.5,3);
    P.soot=0;
  }else{
    P.vx+=(ix*45-P.vx)*Math.min(1,dt*3);
    P.vy=Math.min(P.vy+VH.grav()*dt,700);
  }
  if(P.balT>0) P.balT-=dt;
  if(VH.mover(dt,26,50,20,16)) P.vx*=-.25;
  if(P.on){ if(P.landed&&P.vy>200) VH.dust(P.x,P.y); P.vy=0; }
  const ta=wet&&!P.on?(VH.reduced?0:Math.sin(VH.time*2.2)*.06):(P.on?Math.atan(P.gs):0);
  P.ang+=(ta-P.ang)*Math.min(1,dt*4);
}
/* Kletterkäfer: läuft gegen eine Wand und krabbelt an ihr hoch. An der Wand hält er sich fest, Hoch und Runter klettern. Oben angekommen zieht er sich über die Kante. Für steile Schluchten und hohe Höhlen. */
/** @param {Port} VH */
export function bugWallWith(VH){ const x=P.x+P.face*17; return VH.solidW(x,P.y-6)||VH.solidW(x,P.y-18); }
/** @param {Port} VH @param {any} dt @param {any} ix @param {any} u @param {any} d */
export function updBugWith(VH,dt,ix,u,d){
  if(ix&&!P.wall) P.face=ix;
  if(P.wall){
    if(ix===-P.face){ P.wall=false; P.face=ix; P.vx=ix*90; P.vy=-60; }
    else{
      P.vx=0; P.vy=(d-u-(ix===P.face?1:0))*140; if(P.vy<-140) P.vy=-140;
      if(!bugWallWith(VH)){ P.wall=false; P.vx=P.face*90; P.vy=-90; }
    }
  }else{
    if(P.on) P.vx+=(ix*170*(1+.15*hero.up.motor)-P.vx)*Math.min(1,dt*8); else P.vx+=(ix*120-P.vx)*Math.min(1,dt*2);
    P.vy=Math.min(P.vy+VH.grav()*dt,700);
  }
  if(P.wall){
    const ny=P.y+P.vy*dt;
    if(P.vy<0&&VH.solidW(P.x,ny-26)) P.vy=0; else P.y=ny;
    const f=VH.floorAt(P.x,P.y,4); if(P.y>=f){ P.y=f; if(P.vy>0) P.vy=0; }
    P.on=false;
  }else if(VH.mover(dt,14,26,10,8)&&ix&&bugWallWith(VH)){ P.wall=true; P.vy=0; sfx('pop'); }
  if(P.on&&!P.wall) P.vy=P.gs*P.vx;
  P.run+=(Math.abs(P.vx)+Math.abs(P.wall?P.vy:0))*dt*.12;
  const ta=P.wall?-P.face*Math.PI/2:(P.on?Math.atan(P.gs):0);
  P.ang+=(ta-P.ang)*Math.min(1,dt*10);
}
