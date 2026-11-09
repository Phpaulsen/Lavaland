/* ---------- Was jede Sekunde in der großen Welt passiert ---------- */
// PR 19c: Welt wachsen lassen, Effekte herunterzählen, Nacht überblenden, Länder entdecken,
// Tiere, Fundsachen, Planetenlandung, Regenwolken, Blitz, UFO, Himmelsgrenze, Einschlafen, Disco und Spuren der Fundsachen. Bewegt aus legacy.js.
// Was das braucht, kommt über den Port WT. Die Zustände (nightA, discoT, ufo …) bleiben in legacy.js, weil auch Zeichnen und Antippen sie nutzen;
// worldTick schreibt sie über Setter im Port.
import { P, cam, hero, keys } from '../state/game.js';
import { CELL, clamp, GX, TOP, WATER } from '../core/world/const.js';
import { bix } from '../state/world.js';
import { ST } from '../state/facade.js';
import { jingle, sfx, blip } from '../audio/sound.js';
import { put } from '../state/sim.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} WT @param {any} dt */
export function worldTickWith(WT,dt){
  const far=Math.max(P.x,cam.x);
  if(far+2600>WT.genF*CELL) WT.grow(Math.min(far+3200,(WT.genF+12)*CELL));
  for(const k in WT.FX) if(WT.FX[k]>0) WT.FX[k]-=dt;
  WT.nightA+=((WT.nightOn?1:0)-WT.nightA)*Math.min(1,dt*1.5);
  const bi=bix[clamp(Math.floor(P.x/CELL),0,GX-1)];
  if(bi&&!ST.seen[bi-1]&&P.x>ST.BIO[bi-1].x0+90) WT.discover(ST.BIO[bi-1]);
  WT.portalTick(dt);
  if(!hero.ext&&!WT.realm&&P.x>7340){ hero.ext=true; WT.saveHero(); WT.say('','Hinter dem Schneeberg geht die Welt weiter. Niemand weiß, wie weit!'); }
  WT.creTick(dt); WT.pickTick(dt); WT.padsTick(); WT.secretsTick();
  /* Landung auf einem fremden Planeten */
  if(P.on&&P.y<-3000) for(const o of WT.ORBS){
    if(!o.i||ST.orbGot[o.i]||Math.hypot(P.x-o.x,P.y-o.y)>o.r+30) continue;
    ST.orbGot[o.i]=1; ST.lootDirty=true; WT.confetti(P.x,P.y); jingle(); WT.banner('⭐',2400); WT.say('',WT.ORBN[o.k]);
    if(o.k===2) WT.disco(14);
  }
  /* Wolken regnen, wenn man sie antippt. */
  for(const c of WT.clouds){
    if(!(c.rain>0)) continue;
    c.rain-=dt;
    const cy=Math.floor((c.y+16*c.s-TOP)/CELL);
    for(let k=0;k<2;k++){ const x=c.x+(Math.random()-.5)*60*c.s; if(cy>1) put(Math.floor(x/CELL),cy,WATER); else WT.spawn(6,x,c.y+16*c.s,0,200,.7,2.5,'#6ab8f0'); }
  }
  if(WT.bolt){ WT.bolt.t-=dt; if(WT.bolt.t<=0) WT.bolt=null; }
  ufoTickWith(WT,dt);
  if(P.y<=WT.skyLim()+2&&WT.time>WT.skyBonk){ WT.skyBonk=WT.time+9; WT.shout(P.x,P.y+40,'STOPP!'); sfx('splat'); if(WT.time>WT.skySay){ WT.skySay=WT.time+90; WT.say('',hero.rk<3?'Höher schafft es die Rakete noch nicht. Professor Zahnrad kann sie in der Werkstatt stärker bauen.':'Hier ist der Weltraum wirklich zu Ende.'); if(hero.rk<3) WT.pulse('btn-lab'); } }
  /* Wer lange stillsteht, schläft ein. */
  if(P.mode==='walk'&&P.on&&!keys.l&&!keys.r&&!keys.u&&!keys.a&&Math.abs(P.vx)<4){
    WT.idleT+=dt;
    if(WT.idleT>25){ WT.zT-=dt; if(WT.zT<=0){ WT.zT=2.2; WT.shout(P.x+8,P.y-48,WT.idleT<28?'GÄHN!':'Zzz'); } }
  }else WT.idleT=0;
  if(WT.discoT>0){
    WT.discoT-=dt; WT.beatT-=dt;
    if(WT.beatT<=0){ WT.beatT=.24; const n=[262,330,392,523,392,330][Math.floor(WT.discoT/.24)%6]; blip(n,n,.12,'square',.05); }
  }
  /* Spuren der Fundsachen */
  const x=P.x, y=P.y;
  if(WT.FX.hot>0&&Math.random()<dt*30) WT.spawn(1,x-P.face*8,y-10,-P.face*60,-20,.35,5);
  if((WT.FX.sugar>0||WT.FX.rainbow>0||(hero.trail&&Math.abs(P.vx)>120))&&Math.random()<dt*40) WT.spawn(12,x-P.face*6,y-8-Math.random()*20,-P.vx*.1,-10,.7,3,WT.CONF[Math.floor(WT.time*12)%6]);
  if(WT.FX.star>0&&Math.random()<dt*30) WT.spawn(5,x+(Math.random()-.5)*24,y-Math.random()*40,0,-30,.5,2);
  if(WT.FX.stink>0&&Math.random()<dt*14) WT.spawn(12,x+(Math.random()-.5)*20,y-20,(Math.random()-.5)*30,-30,1,6,'#9bd84a');
  if(WT.slipWas&&WT.FX.slip<=0){ WT.shout(x,y-52,'PLUMPS!'); WT.dust(x,y); }
  WT.slipWas=WT.FX.slip>0;
}
/* Nachts kommt manchmal ein UFO. Wer unter dem Lichtstrahl stehen bleibt, wird auf einen fremden Planeten gebracht. */
/** @param {Port} WT @param {any} dt */
export function ufoTickWith(WT,dt){
  if(WT.realm){ WT.ufo=null; return; }
  if(!WT.ufo){
    if(WT.nightA>.8&&P.mode==='walk'&&P.on&&P.y>-800&&P.y<300&&WT.time>WT.ufoNext) WT.ufo={x:P.x-520,y:P.y-420,t:0,hold:0};
    return;
  }
  WT.ufo.t+=dt;
  if(WT.ufo.t>10||WT.nightA<.5){ WT.ufo.y-=260*dt; WT.ufo.x+=200*dt; if(WT.ufo.t>12||WT.nightA<.5){ WT.ufo=null; WT.ufoNext=WT.time+40+Math.random()*30; } return; }
  WT.ufo.x+=(P.x-WT.ufo.x)*Math.min(1,dt*1.6); WT.ufo.y+=(P.y-200-WT.ufo.y)*Math.min(1,dt*1.6);
  WT.ufo.beam=Math.abs(P.x-WT.ufo.x)<34;
  WT.ufo.hold=WT.ufo.beam&&P.mode==='walk'&&Math.abs(P.vx)<30?WT.ufo.hold+dt:0;
  if(WT.ufo.hold>1.6){
    const o=WT.ORBS[WT.ORBS.length>1?1:0];
    WT.ufo=null; WT.ufoNext=WT.time+70; WT.grow(o.x+3200);
    P.x=o.x; P.y=o.y-o.r-6; P.vx=0; P.vy=0; P.on=false; cam.x=P.x; cam.y=P.y-80; sfx('whoosh'); WT.smoke(P.x,P.y-20,8);
    WT.say('','Hui! Ein UFO hat dich mitgenommen und auf einem fremden Planeten abgesetzt.');
  }
}
/* Ein System in SIDE an der alten Stelle von worldTick. Es zeichnet nichts. */
/** @param {Port} WT @returns {import('./index.js').System[]} */
export function worldWith(WT){
  return [
    {name:'worldTick',tick:/** @param {any} dt */ function(dt){ worldTickWith(WT,dt); }},
  ];
}
