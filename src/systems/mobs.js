// Pfeile und Höhlenmonster (PR 18), je mit tick und draw. Bewegt aus legacy.js.
// Was sie vom übrigen Spiel brauchen (Zeit, Welt, Einstellungen, Teilchen, Zeichenhelfer), kommt über den Port MP.
// ARROWS und MONS gehören hierher; legacy.js leert sie beim Weltwechsel, shoot und monStrike ruft es über Einzeiler.
import { P, cam, hero, keys } from '../state/game.js';
import { blip, jingle, sfx } from '../audio/sound.js';
import { G, TAU } from '../core/world/const.js';
import { ST } from '../state/facade.js';

/** @typedef {Record<string, any>} Port */
/* Pfeil und Bogen: Antippen schießt dorthin, die Aktionstaste schießt nach vorn. Pfeile fliegen im Bogen und bleiben kurz stecken. Tieren tun sie nichts. Am Schießstand hinter dem Missionsbrett stehen drei Zielscheiben. */
/** @type {any[]} */
export const ARROWS=[];
const TGT=/** @type {any[]} */ ([{x:1640,h:46},{x:1790,h:78},{x:1930,h:58}]);
export let tgtT=0, bowT=0;
/** @param {Port} MP @param {any} wx @param {any} wy */
export function shootWith(MP,wx,wy){
  if(P.mode!=='walk'||P.zip||MP.time<bowT) return;
  bowT=MP.time+.32;
  const sx=P.x+P.face*6, sy=P.y-26;
  let a;
  if(wx===undefined){ a=P.face>0?-.18:Math.PI+.18; if(keys.u) a=P.face>0?-.7:Math.PI+.7; if(keys.d) a=P.face>0?.5:Math.PI-.5; }
  else{ a=Math.atan2(wy-sy,wx-sx); P.face=Math.cos(a)>=0?1:-1; }
  P.aim=P.face>0?a:Math.PI-a; if(P.aim>Math.PI) P.aim-=2*Math.PI;
  const v=760;
  ARROWS.push({x:sx,y:sy,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:0,stuck:0});
  if(ARROWS.length>14) ARROWS.shift();
  P.swing=1; blip(520,180,.12,'triangle',.06);
}
/** @param {Port} MP @param {any} t */
export function tgtYWith(MP,t){ return MP.ground(t.x)-t.h; }
/** @param {Port} MP @param {any} dt */
export function arrowsTickWith(MP,dt){
  for(let i=ARROWS.length-1;i>=0;i--){
    const a=ARROWS[i];
    if(a.stuck){ a.stuck-=dt; if(a.stuck<=0) ARROWS.splice(i,1); continue; }
    a.t+=dt; a.vy+=G*.45*dt;
    const n=3;
    for(let k=0;k<n;k++){
      a.x+=a.vx*dt/n; a.y+=a.vy*dt/n;
      if(arrowHitWith(MP,a)){ ARROWS.splice(i,1); break; }
      if(MP.solidW(a.x,a.y)){ a.stuck=2.5; sfx('tick'); break; }
    }
    if(a.t>4&&ARROWS[i]===a) ARROWS.splice(i,1);
  }
  if(tgtT>0){ tgtT-=dt; if(tgtT<=0) for(const t of TGT) t.hit=0; }
}
/** @param {Port} MP @param {any} a */
export function arrowHitWith(MP,a){
  if(!MP.realm) for(const t of TGT){
    if(t.hit) continue;
    const ty=tgtYWith(MP,t), d=Math.hypot(a.x-t.x,a.y-ty);
    if(d<20){
      t.hit=1; const bull=d<7;
      MP.shout(t.x,ty-30,bull?'MITTE!':'TREFFER!',bull?'#ffd23f':'#fff8e6'); sfx('coin'); MP.burst(t.x,ty,bull?'#ffd23f':'#e63946');
      if(TGT.every(/** @param {any} q */ function(q){ return q.hit; })){ tgtT=12; ST.lootDirty=true; MP.confetti(t.x,ty); jingle(); MP.banner('🎯',2000); }
      return true;
    }
  }
  return typeof monHitWith==='function'&&monHitWith(MP,a);
}
/** @param {Port} MP @param {CanvasRenderingContext2D} ctx */
export function drawArrowsWith(MP,ctx){
  for(const a of ARROWS){
    const ang=Math.atan2(a.vy,a.vx);
    ctx.save(); ctx.translate(a.x,a.y); ctx.rotate(ang); if(a.stuck<1&&a.stuck>0) ctx.globalAlpha=a.stuck;
    ctx.strokeStyle=MP.INK; ctx.lineWidth=2.4; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(-22,0); ctx.lineTo(0,0); ctx.stroke();
    ctx.fillStyle='#9aa7b4'; ctx.beginPath(); ctx.moveTo(4,0); ctx.lineTo(-3,-3.5); ctx.lineTo(-3,3.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#e63946'; ctx.beginPath(); ctx.moveTo(-22,0); ctx.lineTo(-27,-4); ctx.lineTo(-18,0); ctx.lineTo(-27,4); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  if(!MP.realm) for(const t of TGT){
    if(t.x<cam.x-MP.W/MP.S||t.x>cam.x+MP.W/MP.S) continue;
    const gy=MP.ground(t.x), ty=gy-t.h;
    ctx.fillStyle=MP.INK; ctx.fillRect(t.x-3,ty,6,t.h); ctx.fillStyle='#a0632f'; ctx.fillRect(t.x-1.5,ty,3,t.h);
    ctx.save(); ctx.translate(t.x,ty); if(t.hit) ctx.scale(.25,1);
    const cs=['#1d2a3a','#fff8e6','#e63946','#fff8e6','#e63946','#ffd23f'], rs=[21,19,15,11,7,3.5];
    for(let k=0;k<cs.length;k++){ ctx.fillStyle=cs[k]; MP.circle(0,0,rs[k]); }
    ctx.restore();
  }
}
/* Höhlenmonster: Glibber hüpfen in den Höhlen unter der Erde herum, je tiefer, desto bunter und zäher. Berühren schubst das Kind nur weg, mehr passiert nicht. Besiegen: draufspringen, Pfeil oder ein Schlag mit Schaufel oder Spitzhacke. Dann zerplatzen sie zu Sternen. In Fahrzeugen lassen sie einen in Ruhe. Im engen Gang schubsen sie nur zur Seite, damit man nicht gegen die Decke geworfen wird. */
/** @type {any[]} */
export const MONS=[];
const MONC=[['#58b548','#2f8a3a'],['#3aa0e8','#1f6fb0'],['#9b5de5','#6a35b0'],['#ff5a1f','#b8360f']];
export let monT=4;
/** @param {Port} MP */
export function monDepthWith(MP){ return P.y-MP.ground(P.x); }
/** @param {Port} MP */
export function monSpawnWith(MP){
  const deep=monDepthWith(MP);
  for(let i=0;i<10;i++){
    const x=P.x+(Math.random()<.5?-1:1)*MP.ri(260,520);
    for(let y=P.y-160;y<P.y+160;y+=6){
      if(!MP.solidW(x,y)&&!MP.solidW(x,y-18)&&!MP.solidW(x,y-30)&&MP.solidW(x,y+3)&&y-MP.ground(x)>110){
        const lv=deep>1600?3:deep>1000?2:deep>500?1:0;
        MONS.push({x:x,y:y,vx:0,vy:0,on:true,hp:2+(lv>1?1:0),lv:lv,t:.5+Math.random(),face:-1,sq:0,hit:0});
        return;
      }
    }
  }
}
/** @param {Port} MP @param {any} dt */
export function monTickWith(MP,dt){
  if(ST.paused) return;
  if(!MP.OPT.mon){ if(MONS.length) MONS.length=0; return; }
  const under=monDepthWith(MP)>140;
  monT-=dt;
  if(under&&monT<=0&&MONS.length<3){ monT=5+Math.random()*5; monSpawnWith(MP); }
  for(let i=MONS.length-1;i>=0;i--){
    const m=MONS[i];
    if(Math.abs(m.x-P.x)>1100||Math.abs(m.y-P.y)>800){ MONS.splice(i,1); continue; }
    if(m.hit>0) m.hit-=dt; if(m.sq>0) m.sq-=dt*4;
    const dx=P.x-m.x, dy=P.y-m.y, near=Math.abs(dx)<420&&Math.abs(dy)<200;
    m.t-=dt;
    if(m.on&&m.t<=0){
      m.face=near?(dx>0?1:-1):(Math.random()<.5?-1:1);
      m.vx=m.face*(near?110+30*m.lv:60); m.vy=-200-Math.random()*90; m.on=false; m.t=.8+Math.random()*1.2; m.sq=1;
    }
    m.vy=Math.min(m.vy+G*.8*dt,600);
    const nx=m.x+m.vx*dt;
    if(MP.solidW(nx+(m.vx>0?11:-11),m.y-8)||MP.solidW(nx+(m.vx>0?11:-11),m.y-18)) m.vx=-m.vx*.3; else m.x=nx;
    const ny=m.y+m.vy*dt;
    if(m.vy<0&&MP.solidW(m.x,ny-22)) m.vy=0;
    else if(m.vy>=0&&MP.solidW(m.x,ny)){ let k=0; m.y=ny; while(MP.solidW(m.x,m.y-1)&&k++<20) m.y-=1; m.vy=0; if(!m.on) m.sq=1; m.on=true; m.vx=0; }
    else m.y=ny;
    if(P.mode==='walk'&&!P.zip&&Math.abs(dx)<20&&dy>-30&&dy<16){
      if(P.vy>60&&P.y<m.y-6){ P.vy=-330; P.on=false; monHurtWith(MP,m,9); }
      else if(P.hurt<=0){ const low=MP.solidW(P.x,P.y-44); P.hurt=.8; P.vx=(dx>0?1:-1)*(low?160:280); P.vy=low?0:-200; P.on=low&&P.on; MP.shout(m.x,m.y-34,'BLUBB!','#bff7b0'); sfx('jump'); }
    }
  }
}
/** @param {Port} MP @param {any} m @param {any} n */
export function monHurtWith(MP,m,n){
  m.hp-=n; m.hit=.25; m.sq=1; sfx('pop');
  if(m.hp>0){ m.vx=(m.x>P.x?1:-1)*160; m.vy=-160; m.on=false; return; }
  const i=MONS.indexOf(m); if(i>=0) MONS.splice(i,1);
  MP.burst(m.x,m.y-12,MONC[m.lv][0]); for(let k=0;k<6;k++) MP.spawn(5,m.x,m.y-12,(Math.random()-.5)*260,-90-Math.random()*160,.8,3);
  ST.lootDirty=true; sfx('coin');
  hero.mon=(hero.mon|0)+1; ST.heroDirty=true;
}
/** @param {Port} MP @param {any} a */
export function monHitWith(MP,a){
  for(const m of MONS) if(Math.abs(a.x-m.x)<16&&Math.abs(a.y-(m.y-12))<16){ monHurtWith(MP,m,1); return true; }
  return false;
}
/** @param {Port} MP @param {any} wx @param {any} wy @param {any} r */
export function monStrikeWith(MP,wx,wy,r){ let hit=false; for(const m of MONS.slice()) if(Math.hypot(wx-m.x,wy-(m.y-12))<r+14){ monHurtWith(MP,m,1); hit=true; } return hit; }
/** @param {Port} MP @param {CanvasRenderingContext2D} ctx @param {any} glow */
export function drawMonsWith(MP,ctx,glow){
  for(const m of MONS){
    const c=MONC[m.lv], s=1+(m.sq>0?.25*m.sq:0), w=13*s, h=17/s;
    if(glow){ ctx.fillStyle='#fff8e6'; MP.circle(m.x-4+m.face*2,m.y-11/s*1.1,2.6); MP.circle(m.x+4+m.face*2,m.y-11/s*1.1,2.6); continue; }
    ctx.fillStyle=MP.INK; ctx.beginPath(); ctx.ellipse(m.x,m.y-h*.5,w+2,h*.5+2,0,0,TAU); ctx.fill();
    ctx.fillStyle=m.hit>0?'#fff':c[0]; ctx.beginPath(); ctx.ellipse(m.x,m.y-h*.5,w,h*.5,0,0,TAU); ctx.fill();
    ctx.fillStyle=c[1]; ctx.beginPath(); ctx.ellipse(m.x,m.y-2,w*.8,3,0,0,TAU); ctx.fill();
    ctx.fillStyle='#fff'; MP.circle(m.x-4+m.face*2,m.y-h*.62,3.6); MP.circle(m.x+4+m.face*2,m.y-h*.62,3.6);
    ctx.fillStyle=MP.INK; MP.circle(m.x-4+m.face*3,m.y-h*.62,1.7); MP.circle(m.x+4+m.face*3,m.y-h*.62,1.7);
    if(m.lv>=1){ ctx.fillStyle=c[1]; ctx.beginPath(); ctx.moveTo(m.x-5,m.y-h); ctx.lineTo(m.x,m.y-h-6-m.lv*2); ctx.lineTo(m.x+5,m.y-h); ctx.closePath(); ctx.fill(); }
  }
}
/* Die zwei Systeme in der Reihenfolge von SIDE. Ebene 'mob' nach den Sternschnuppen (Pfeile, Zielscheiben, Monster),
   Ebene 'glow' nach der Dunkelheit (Monsteraugen leuchten, vor den Glühwürmchen). */
/** @param {Port} MP @returns {import('./index.js').System[]} */
export function mobsWith(MP){
  return [
    {name:'arrowsTick',tick:/** @param {any} dt */ function(dt){ arrowsTickWith(MP,dt); },draw:/** @param {CanvasRenderingContext2D} ctx @param {any} l */ function(ctx,l){ if(l==='mob') drawArrowsWith(MP,ctx); }},
    {name:'monTick',tick:/** @param {any} dt */ function(dt){ monTickWith(MP,dt); },draw:/** @param {CanvasRenderingContext2D} ctx @param {any} l */ function(ctx,l){ if(l==='mob') drawMonsWith(MP,ctx,false); else if(l==='glow') drawMonsWith(MP,ctx,true); }},
  ];
}
