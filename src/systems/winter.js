/* ---------- Winter-Leben: Schneebälle, Feuerwerk, Schneemänner, Pinguine und die Figuren am Schneeberg und am Vulkan ---------- */
// PR 20b. Bewegt aus legacy.js. Was sie vom übrigen Spiel brauchen, kommt über den Port WP.
// Die Zustände (balls, fws, stq, N, manT, pinT, pinN) bleiben in app/wire.js, weil Zeichnen, Antippen und Weltwechsel sie nutzen; geschrieben wird über Setter.
// Ski, Lift und Drachenflug sind Fahrzeuge und ziehen mit ihnen um. winterTick läuft als System in SIDE (winterWith);
// throwBall, firework, burst, addMan, drawMan, pinFly, yetiHit und stEnter ruft app/wire.js über Einzeiler.
import { P, cam } from '../state/game.js';
import { clamp, WORLD_W, LAVA, FIRE, CELL, TOP, WATER, SNOW, TAU, G, GY, VOLC } from '../core/world/const.js';
import { sfx, jingle } from '../audio/sound.js';
import { cellAt, hotAt } from '../state/sim.js';
import { ST } from '../state/facade.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} WP @param {any} tx @param {any} ty @param {any} from */
export function throwBallWith(WP,tx,ty,from){
  if(WP.balls.length>14) WP.balls.shift();
  const sx=from?from[0]:P.x+P.face*6, sy=from?from[1]:P.y-30, dx=tx-sx, dy=ty-sy, T=clamp(Math.hypot(dx,dy)/520,.3,.95);
  WP.balls.push({x:sx,y:sy,vx:dx/T,vy:dy/T-300*T,foe:!!from,t:0});
  if(!from){ if(dx&&P.mode==='walk') P.face=dx>0?1:-1; sfx('throw'); }
}
/** @param {Port} WP @param {any} b */
export function npcHitWith(WP,b){
  const y=WP.N.yeti, fx=WP.flX(), h=WP.N.hare;
  if(Math.abs(b.x-y.x)<27&&b.y>y.y-70&&b.y<y.y){ yetiHitWith(WP); return true; }
  for(const p of WP.N.pen) if(p.s===0&&Math.abs(b.x-p.x)<10&&Math.abs(b.y-(p.y-10))<14){ pinFlyWith(WP,p,b.vx*.5); return true; }
  if(Math.abs(b.x-fx)<13&&b.y>WP.surfaceY(fx)-58&&b.y<WP.surfaceY(fx)){ WP.shout(fx,WP.surfaceY(fx)-72,'HEY!'); return true; }
  if(Math.abs(b.x-h.x)<12&&Math.abs(b.y-(h.y-10))<14){ WP.shout(h.x,h.y-36,'MIEP!'); sfx('quack'); return true; }
  return false;
}
/** @param {Port} WP @param {any} dt */
export function ballsTickWith(WP,dt){
  for(let i=WP.balls.length-1;i>=0;i--){
    const b=WP.balls[i], ox=b.x, oy=b.y;
    b.t+=dt; b.vy+=600*dt; b.x+=b.vx*dt; b.y+=b.vy*dt;
    let hit=b.t>4||b.x<10||b.x>WORLD_W-10;
    if(!hit){
      if(b.foe){ if(P.mode!=='coaster'&&Math.hypot(b.x-P.x,b.y-(P.y-20))<20){ hit=true; P.frost=2.5; WP.shout(P.x,P.y-56,'PLATSCH!'); } }
      else if(b.x>5600) hit=npcHitWith(WP,b);
    }
    if(!hit){
      const m=cellAt(b.x,b.y);
      if(m===LAVA||m===FIRE){ hit=true; WP.steam(Math.floor(b.x/CELL),Math.floor((b.y-TOP)/CELL)); }
      else if(m===WATER) hit=true;
      else if(m>=4){ hit=true; if(!b.foe) WP.disc(Math.floor(ox/CELL),Math.floor((oy-TOP)/CELL),1.3,SNOW); }
    }
    if(hit){ WP.balls.splice(i,1); WP.puff(b.x,b.y,6); sfx('splat'); }
  }
}
/** @param {Port} WP @param {any} x @param {any} y */
export function fireworkWith(WP,x,y){
  if(WP.fws.length>8) return;
  x=clamp(x,20,WORLD_W-20);
  WP.fws.push({x:x,y:Math.max(y+70,Math.min(WP.surfaceY(x),y+420)),ty:y,c:WP.ri(0,5)}); sfx('fw');
}
/** @param {Port} WP @param {any} x @param {any} y @param {any} c */
export function burstWith(WP,x,y,c){
  const n=40, c2=WP.CONF[(c+2+WP.ri(0,2))%6];
  for(let i=0;i<n;i++){ const a=i/n*TAU, v=150+Math.random()*130; WP.spawn(6,x,y,Math.cos(a)*v,Math.sin(a)*v-60,1.1+Math.random()*.6,3,i%3?WP.CONF[c]:c2); }
  for(let i=0;i<8;i++) WP.spawn(5,x,y,(Math.random()-.5)*200,(Math.random()-.5)*200,.6,2);
  sfx('bang');
}
/** @param {Port} WP @param {any} dt */
export function fwsTickWith(WP,dt){
  for(let i=WP.fws.length-1;i>=0;i--){
    const f=WP.fws[i]; f.y-=620*dt;
    if(Math.random()<dt*40) WP.spawn(5,f.x,f.y+8,(Math.random()-.5)*30,90,.3,2);
    if(f.y<=f.ty){ WP.fws.splice(i,1); burstWith(WP,f.x,f.ty,f.c); }
  }
}
/** @param {Port} WP @param {any} x */
export function addManWith(WP,x){
  x=clamp(x,60,WORLD_W-60);
  let n=0; for(const o of ST.props) if(o.type==='man') n++;
  if(n>=24) ST.props.splice(ST.props.findIndex(function(o){return o.type==='man';}),1);
  const y=WP.surfaceY(x);
  ST.props.push({type:'man',x:x,y:y}); WP.puff(x,y-24,12); sfx('pop'); WP.shout(x,y-72,'HALLO!');
}
/** @param {Port} WP @param {any} o */
export function drawManWith(WP,o){
  const near=!WP.reduced&&Math.abs(P.x-o.x)<80&&Math.abs(P.y-o.y)<90;
  WP.drawSnowman(o.x,o.y,.92,true,near?Math.sin(WP.time*11):0,WP.CONF[Math.floor(o.x)%6],false);
}
/** @param {Port} WP */
export function menTickWith(WP){
  for(let i=ST.props.length-1;i>=0;i--){
    const o=ST.props[i]; if(o.type!=='man') continue;
    o.y=WP.floorAt(o.x,o.y,12);
    if(hotAt(o.x,o.y-6)||hotAt(o.x-9,o.y-3)||hotAt(o.x+9,o.y-3)||hotAt(o.x,o.y+4)){
      ST.props.splice(i,1);
      for(let k=0;k<8;k++) WP.steam(Math.floor(o.x/CELL)+k%3-1,Math.floor((o.y-TOP)/CELL)-(k>>1));
      WP.shout(o.x,o.y-62,'OH NEIN!'); WP.spawn(8,o.x,o.y-30,0,-30,1.6,20,'🥕'); sfx('splat');
    }
  }
}
/** @param {Port} WP @param {any} p @param {any} vx */
export function pinFlyWith(WP,p,vx){
  p.s=1; p.vx=vx+(Math.random()-.5)*120; p.vy=-240-Math.random()*240; p.vr=(Math.random()<.5?-1:1)*(7+Math.random()*9); sfx('quack');
  if(WP.time-WP.pinT>2.5){ WP.pinT=WP.time; WP.pinN=0; }
  if(++WP.pinN===6){ WP.shout(WP.PENX+38,p.y-74,'STRIKE!','#ffd23f'); WP.confetti(WP.PENX+38,p.y-20); ST.lootDirty=true; jingle(); }
}
/** @param {Port} WP @param {any} dt */
export function pensTickWith(WP,dt){
  for(const p of WP.N.pen){
    if(p.s===0){
      p.x=p.hx; p.y=WP.surfaceY(p.hx); p.rot=0;
      if(P.mode!=='coaster'&&Math.abs(P.x-p.x)<13&&P.y>p.y-26&&P.y<p.y+34&&Math.abs(P.vx)>110) pinFlyWith(WP,p,P.vx*.7);
    }else if(p.s===1){
      p.vy+=G*.8*dt; p.x=clamp(p.x+p.vx*dt,30,WORLD_W-30); p.y+=p.vy*dt; p.rot+=p.vr*dt;
      if((p.vy>0&&WP.solidW(p.x,p.y+2))||p.y>TOP+GY*CELL){ p.y=WP.surfaceY(p.x); p.s=2; p.t=1.6+Math.random()*1.5; p.rot=1.57; WP.puff(p.x,p.y-4,4); }
    }else if(p.s===2){ p.t-=dt; if(p.t<=0) p.s=3; }
    else{
      const dd=p.hx-p.x; p.x+=Math.sign(dd)*Math.min(Math.abs(dd),70*dt); p.y=WP.surfaceY(p.x); p.rot=.25*Math.sin(WP.time*14);
      if(Math.abs(dd)<1) p.s=0;
    }
  }
}
/** @param {Port} WP */
export function hareTickWith(WP){
  const h=WP.N.hare; h.x=WP.flX()+28; h.y=WP.surfaceY(h.x);
}
/** @param {Port} WP */
export function yetiPupsWith(WP){
  const y=WP.N.yeti; y.roll=1.8;
  for(let i=0;i<26;i++) WP.spawn(7,y.x+24+Math.random()*10,y.y-14,60+Math.random()*130,-20-Math.random()*50,1.4,7+Math.random()*6);
  WP.shout(y.x+44,y.y-34,'PUPS!'); sfx('pups');
}
/** @param {Port} WP */
export function yetiHitWith(WP){
  const y=WP.N.yeti; y.laugh=.7; y.hits++; WP.shout(y.x,y.y-88,['HIHI!','HOHO!','HAHA!'][y.hits%3]); sfx('laugh');
  if(y.hits%5===0) yetiPupsWith(WP);
}
/** @param {Port} WP @param {any} dt */
export function yetiTickWith(WP,dt){
  const y=WP.N.yeti; y.y=WP.surfaceY(WP.YETX);
  if(y.laugh>0) y.laugh-=dt; if(y.roll>0) y.roll-=dt; if(y.hop>0) y.hop-=dt;
  y.hick-=dt;
  if(y.hick<=0){ y.hick=6+Math.random()*6; if(Math.abs(cam.x-y.x)<500){ WP.shout(y.x,y.y-92,'HICK!'); y.hop=.35; sfx('hick'); } }
}
/** @param {Port} WP @param {any} dt */
export function fauTickWith(WP,dt){
  const f=WP.N.fau, tx=VOLC+88, ty=WP.surfaceY(VOLC+88);
  f.x+=(tx-f.x)*Math.min(1,dt*3); f.y+=(ty-f.y)*Math.min(1,dt*3); f.face=-1;
}
/** @param {Port} WP @param {any} dt */
export function mamaTickWith(WP,dt){
  const m=WP.N.mama, tgt=P.mode!=='dragon'?1:0;
  m.up+=(tgt-m.up)*Math.min(1,dt*1.3);
  if(m.up>.9&&Math.abs(cam.x-VOLC)<700&&Math.random()<dt*.8) WP.spawn(0,VOLC+(P.x<VOLC?-78:66),WP.RIMY-28,(Math.random()-.5)*10,-30,1.4,5);
}
/** @param {Port} WP */
export function stEnterWith(WP){
  WP.stq.length=0; WP.N.fau.x=VOLC+88; WP.N.fau.y=WP.surfaceY(VOLC+88);
}
/** @param {Port} WP @param {any} dt */
export function winterTickWith(WP,dt){
  const due=[];
  for(let i=WP.stq.length-1;i>=0;i--){ const q=WP.stq[i]; q.t-=dt; if(q.t<=0){ due.push(q); WP.stq.splice(i,1); } }
  for(const q of due) q.fn();
  if(WP.balls.length) ballsTickWith(WP,dt);
  if(WP.fws.length) fwsTickWith(WP,dt);
  if(WP.realm) return;
  if(cam.x>5100&&cam.x<9600){ hareTickWith(WP); yetiTickWith(WP,dt); pensTickWith(WP,dt); }
  fauTickWith(WP,dt); mamaTickWith(WP,dt);
  WP.manT-=dt; if(WP.manT<=0){ WP.manT=.4; menTickWith(WP); }
}
/* Ein System in SIDE an der alten Stelle von winterTick. Gezeichnet wird weiter in draw() (Winter malen). */
/** @param {Port} WP @returns {import('./index.js').System[]} */
export function winterWith(WP){
  return [
    {name:'winterTick',tick:/** @param {any} dt */ function(dt){ winterTickWith(WP,dt); }},
  ];
}
