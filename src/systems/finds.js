// Fundsachen, Sprungpilze, goldene Eier und Schätze (PR 19b): Aufheben, Wirkung, Fallen der Fundsachen, geworfene Bananen. Bewegt aus legacy.js.
// Was sie vom übrigen Spiel brauchen (Zeit, Welt, Effekte, Belohnung, Oberfläche, Werkzeugspitzen), kommt über den Port FP.
// Keine eigenen Systeme in SIDE: pickTick, padsTick und secretsTick laufen in worldTick; app/wire.js ruft sie über Einzeiler.
import { P, hero } from '../state/game.js';
import { sfx, jingle } from '../audio/sound.js';
import { ST } from '../state/facade.js';
import { CELL, G, TOP, GY } from '../core/world/const.js';
import { throws } from './creatures.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} FP @param {any} q */
export function grabWith(FP,q){
  const ty=q.ty, y=P.y-54; sfx('pop');
  if(ty==='food'||ty==='egg1'){ ST.lootDirty=true; FP.shout(P.x,y,'MAMPF!'); }
  else if(ty==='chili'){ FP.FX.hot=6; FP.shout(P.x,y,'HEISS!','#ff8a1f'); }
  else if(ty==='peel'){ FP.FX.slip=1.5; FP.shout(P.x,y,'WHOAA!'); }
  else if(ty==='sugar'){ FP.FX.sugar=8; FP.shout(P.x,y,'ZUCKER!','#ff9fd0'); }
  else if(ty==='big'){ FP.FX.big=12; FP.FX.tiny=0; FP.shout(P.x,y-30,'RIESIG!'); sfx('roar'); }
  else if(ty==='tiny'){ FP.FX.tiny=12; FP.FX.big=0; FP.shout(P.x,y+16,'WINZIG!'); sfx('hick'); }
  else if(ty==='pump'){ FP.FX.pump=15; FP.shout(P.x,y,'HIHI!'); }
  else if(ty==='star'){ FP.FX.star=8; FP.shout(P.x,y,'SUPER!','#ffd23f'); jingle(); }
  else if(ty==='float'){ FP.FX.float=6; FP.shout(P.x,y,'HUIII!'); }
  else if(ty==='poo'){ FP.FX.stink=8; FP.shout(P.x,y,'IGITT!','#9bd84a'); sfx('pups'); }
}
/** @param {Port} FP @param {any} dt */
export function pickTickWith(FP,dt){
  if(P.mode==='coaster') return;
  const foot=P.mode==='walk'||P.mode==='ski';
  for(const q of ST.PICKS){
    if(q.t>FP.time||Math.abs(q.x-P.x)>500) continue;
    if(q.y!==q.y){ if(q.x>(FP.genF-6)*CELL) continue; q.y=FP.surfaceY(q.x)-14; }
    if(Math.abs(q.x-P.x)<17&&Math.abs(q.y-(P.y-14))<30&&(foot||q.ty==='food')){ q.t=FP.time+25; grabWith(FP,q); }
  }
  for(let i=ST.DROPS.length-1;i>=0;i--){
    const d=ST.DROPS[i]; d.life-=dt;
    if(!FP.solidW(d.x,d.y+9)){ d.vy=Math.min((d.vy||0)+G*dt,500); d.y+=d.vy*dt; } else d.vy=0;
    if(d.life<=0||d.y>TOP+GY*CELL){ ST.DROPS.splice(i,1); continue; }
    if(Math.abs(d.x-P.x)<17&&Math.abs(d.y-(P.y-14))<30&&(foot||d.ty==='food')){ ST.DROPS.splice(i,1); grabWith(FP,d); }
  }
  for(let i=throws.length-1;i>=0;i--){
    const t=throws[i], oy=t.y; t.vy+=700*dt; t.x+=t.vx*dt; t.y+=t.vy*dt;
    if(Math.hypot(t.x-P.x,t.y-(P.y-20))<18){ throws.splice(i,1); FP.shout(P.x,P.y-56,'BONK!'); if(foot){ P.vy=-200; P.on=false; } sfx('splat'); }
    else if(FP.solidW(t.x,t.y)||t.y>TOP+GY*CELL){ throws.splice(i,1); if(ST.DROPS.length<40) ST.DROPS.push({e:'🍌',ty:'peel',x:t.x,y:oy-6,life:25}); }
  }
}
/* Sprungpilze und Heuballen */
/** @param {Port} FP */
export function padsTickWith(FP){
  const m=P.mode;
  if(P.vy<30||m==='coaster'||m==='plane'||m==='rocket'||m==='dragon'||m==='sub') return;
  const hit=/** @param {any} x @param {any} y @param {any} w @param {any} pow @param {any} p */ function(x,y,w,pow,p){
    if(Math.abs(P.x-x)>w||P.y<y-6||P.y>y+20) return false;
    P.vy=-pow*(FP.FX.tiny>0?.8:1); P.y=y-7; P.on=false; P.air=0; P.chute=false; if(p) p.bt=FP.time+.25;
    FP.shout(x,y-30,'BOING!'); sfx('jump'); return true;
  };
  for(const p of ST.PADS) if(Math.abs(p.x-P.x)<60&&hit(p.x,p.y,p.w,p.pow,p)) return;
}
/* Goldene Eier und Schätze */
/** @param {Port} FP @param {any} w */
export function grantWith(FP,w){ hero.own[w[2]]=1; hero.trail=true; }
/** @param {Port} FP @param {any} e */
export function eggFoundWith(FP,e){
  ST.eggGot[e.b]=1; hero.eggs=(hero.eggs|0)+1; ST.lootDirty=true; FP.qEvent('egg',1);
  FP.confetti(e.x,e.y+20); jingle(); FP.pulse('btn-lab');
  FP.banner(FP.EGGSVG+' '+hero.eggs,2400);
  let w=null; for(const q of FP.WEAR) if(q[0]===hero.eggs) w=q;
  if(w){ grantWith(FP,w); FP.say('','Ein goldenes Ei! Das ist Nummer '+hero.eggs+'. Dafür bekommst du '+w[3]+'.'); }
  else FP.say('','Ein goldenes Ei! Jetzt hast du '+hero.eggs+'.');
  FP.saveHero(); FP.renderAlbum();
}
/** @param {Port} FP @param {any} l */
export function lootFoundWith(FP,l){
  ST.lootGot[l.id]=1; ST.lootDirty=true; sfx('coin'); jingle();
  for(let i=0;i<22;i++) FP.spawn(6,l.x,l.y,(Math.random()-.5)*240,-180-Math.random()*280,1.4,3.5,'#ffd23f');
  FP.banner('✨',2000);
  if(l.tro){ FP.say('','Du hast das Ende der Welt gefunden! Weiter geht es wirklich nicht. Dafür bekommst du den goldenen Pokal.'); for(let i=0;i<6;i++) FP.firework(l.x-200+i*80,l.y-160-Math.random()*120); }
  else if(l.pot) FP.say('','Ein Topf voll Gold am Regenbogen!');
  else FP.say('','Ein Schatz!');
}
/** @param {Port} FP */
export function secretsTickWith(FP){
  const pts=[[P.x,P.y-16]];
  if(P.mode==='bagger') pts.push(FP.bucket()); else if(P.mode==='loader') pts.push(FP.scoop()); else if(P.mode==='tbm') pts.push(FP.drillHead());
  for(const e of ST.EGGS){
    if(ST.eggGot[e.b]||Math.abs(e.x-P.x)>300) continue;
    for(const q of pts) if(Math.hypot(q[0]-e.x,q[1]-e.y)<30){ eggFoundWith(FP,e); break; }
  }
  for(const l of ST.LOOT){
    if(ST.lootGot[l.id]||Math.abs(l.x-P.x)>300) continue;
    for(const q of pts) if(Math.hypot(q[0]-l.x,q[1]-l.y)<32){ lootFoundWith(FP,l); break; }
  }
}
