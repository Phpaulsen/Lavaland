// Sehenswürdigkeiten (PR 17): Geysire, Sternschnuppen, Schiffswracks, Glühwürmchen und Kristallharfen, je mit tick und draw.
// Bewegt aus legacy.js. Was die Systeme vom übrigen Spiel brauchen (Zeit, Welt, Teilchen, Belohnung, Zeichenhelfer), kommt über den Port SY.
// Ihre Listen (GEYS, METS, MROCKS, WRECKS, FLIES, JAR, HARPS) gehören hierher; legacy.js leert METS, MROCKS und FLIES beim Weltwechsel.
import { ST } from '../state/facade.js';
import { P } from '../state/game.js';
import { blip, jingle, sfx, tone } from '../audio/sound.js';
import { CELL, GX, TAU, clamp } from '../core/world/const.js';
import { BT } from '../core/world/shape.js';
import { bio } from '../state/world.js';

/** @typedef {Record<string, any>} Port */
/** @param {Port} SY */
export function geysersWith(SY){
  const a=SY.realm?[]:[4280];
  for(const b of ST.BIO) if(GEYT[b.t]) a.push(24*Math.round((b.px+b.qx)/48));
  return a;
}
/* Geysire: In Wüste, Dino-Tal, Mondmeer, Gletscher, Eismeer und Glibbersumpf blubbert es aus einem Loch im Boden. Alle paar Sekunden schießt eine Wasserfontäne hoch und nimmt mit, wer draufsteht, auch Fahrzeuge. */
/** @type {Record<number, number>} */
const GEYT={1:1,6:1,13:1,15:1,16:1,18:1};
/** @type {number[]} */
export let GEYS=[];
export let geyKey='';
/** @param {Port} SY @param {any} x */
export function geyPhaseWith(SY,x){ return (SY.time+x*.013)%8; }
/** @param {Port} SY @param {any} dt */
export function geyTickWith(SY,dt){
  const k=SY.realm+SY.SEED+ST.BIO.length; if(k!==geyKey){ geyKey=k; GEYS=geysersWith(SY); }
  for(const x of GEYS){
    if(Math.abs(x-P.x)>SY.W/SY.S+200) continue;
    const ph=geyPhaseWith(SY,x), gy=SY.ground(x);
    if(ph<6){ if(Math.random()<dt*(ph>5?14:3)) SY.spawn(7,x+(Math.random()-.5)*10,gy-4,(Math.random()-.5)*20,-30-Math.random()*30,.9,4+Math.random()*3); continue; }
    if(Math.random()<dt*60){ SY.spawn(6,x+(Math.random()-.5)*12,gy-6,(Math.random()-.5)*70,-560-Math.random()*240,1.1,3+Math.random()*2,'#7fd0ff'); SY.spawn(7,x,gy-10,(Math.random()-.5)*60,-200-Math.random()*200,.8,7); }
    if(ph-dt<6) { sfx('whoosh'); if(Math.abs(x-P.x)<400) SY.shout(x,gy-80,'PSCHHH!','#bfe9f5'); }
    if(P.mode!=='coaster'&&!P.zip&&Math.abs(P.x-x)<26&&P.y>gy-300&&P.y<gy+24){ P.vy=Math.min(P.vy,-820); P.on=false; P.chute=false; P.wall=false; if(P.y>gy-30) P.y-=4; }
  }
}
/** @param {Port} SY @param {CanvasRenderingContext2D} ctx @param {any} x0 @param {any} x1 */
export function drawGeysWith(SY,ctx,x0,x1){
  for(const x of GEYS){
    if(x<x0-40||x>x1+40) continue;
    const gy=SY.ground(x), ph=geyPhaseWith(SY,x);
    ctx.fillStyle=SY.INK; ctx.beginPath(); ctx.ellipse(x,gy,26,9,0,Math.PI,0); ctx.fill();
    ctx.fillStyle='#9aa7b4'; ctx.beginPath(); ctx.ellipse(x,gy,23,7,0,Math.PI,0); ctx.fill();
    ctx.fillStyle='#3a6f9a'; ctx.beginPath(); ctx.ellipse(x,gy-2,9,3,0,0,TAU); ctx.fill();
    if(ph>=6){ const h=Math.min(1,(ph-6)*4)*Math.min(1,(8-ph)*3)*260; ctx.fillStyle='rgba(127,208,255,.75)'; ctx.beginPath(); ctx.moveTo(x-8,gy-2); ctx.quadraticCurveTo(x-14,gy-h*.6,x-4,gy-h); ctx.lineTo(x+4,gy-h); ctx.quadraticCurveTo(x+14,gy-h*.6,x+8,gy-2); ctx.closePath(); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.8)'; SY.circle(x,gy-h,10); }
  }
}
/* Sternschnuppen: Nachts und im Weltall ziehen ab und zu Sternschnuppen über den Himmel. Manche landen in der Nähe als glühender Sternstein. Wer hinläuft, kann ihn aufheben. Nichts davon wird gespeichert, verpasste Steine kühlen nach einer Weile aus. */
/** @type {any[]} */
export let METS=[];
/** @type {any[]} */
export let MROCKS=[];
export let metNext=8;
/** @param {Port} SY */
export function metSkyWith(SY){ return SY.nightA>.7||(SY.realm&&BT[bio[clamp(Math.floor(P.x/CELL),0,GX-1)]].space); }
/** @param {Port} SY @param {any} dt */
export function metTickWith(SY,dt){
  if(metSkyWith(SY)&&SY.time>metNext&&P.y>-2000){
    metNext=SY.time+5+Math.random()*9;
    const land=MROCKS.length<3&&Math.random()<.4, d=(Math.random()<.5?-1:1), tx=P.x+d*(140+Math.random()*240);
    const sx=land?tx-d*520:P.x+(Math.random()-.5)*600, sy=P.y-(SY.W/SY.S)*.7-200;
    const ty=land?SY.ground(tx):sy+260+Math.random()*120, tt=land?1.4:1.1;
    METS.push({x:sx,y:sy,vx:(tx-sx)/tt,vy:(ty-sy)/tt,t:tt,land:land,tr:[]});
  }
  for(const m of METS.slice()){
    m.t-=dt; if(m.g) m.vy+=m.g*dt; m.x+=m.vx*dt; m.y+=m.vy*dt; m.tr.unshift([m.x,m.y]); if(m.tr.length>14) m.tr.pop();
    if(m.t>0) continue;
    METS.splice(METS.indexOf(m),1);
    if(m.land){ const gy=SY.ground(m.x); MROCKS.push({x:m.x,y:gy,t:0}); sfx('pop'); for(let i=0;i<14;i++) SY.spawn(6,m.x,gy-4,(Math.random()-.5)*260,-120-Math.random()*220,.8,3,'#ffd23f'); if(Math.abs(m.x-P.x)<500) SY.shout(m.x,gy-50,'BUMM!','#ffd23f'); }
  }
  for(const r of MROCKS.slice()){
    r.t+=dt; r.y=SY.ground(r.x);
    if(r.t>60){ MROCKS.splice(MROCKS.indexOf(r),1); continue; }
    if(Math.abs(P.x-r.x)<28&&Math.abs(P.y-r.y)<44){ MROCKS.splice(MROCKS.indexOf(r),1); SY.reward(); }
  }
}
/** @param {Port} SY @param {CanvasRenderingContext2D} ctx */
export function drawMetsWith(SY,ctx){
  for(const m of METS){
    for(let i=1;i<m.tr.length;i++){ const a=m.tr[i-1], b=m.tr[i]; ctx.strokeStyle='rgba(255,236,170,'+(1-i/m.tr.length)+')'; ctx.lineWidth=5*(1-i/m.tr.length)+1; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); }
    ctx.fillStyle='#fff8e6'; SY.circle(m.x,m.y,4.5);
  }
  for(const r of MROCKS){
    const cool=clamp((r.t-40)/20,0,1), gl=(1-cool)*(.6+.4*Math.sin(SY.time*6+r.x));
    ctx.fillStyle='rgba(255,200,60,'+(.35*gl)+')'; SY.circle(r.x,r.y-9,22);
    ctx.fillStyle=SY.INK; SY.circle(r.x,r.y-9,11);
    ctx.fillStyle=cool<1?'#ff9a3c':'#7a7068'; SY.circle(r.x,r.y-9,8.5);
    ctx.fillStyle='rgba(255,240,170,'+gl+')'; SY.circle(r.x-3,r.y-12,2.8);
  }
}
/* Schiffswrack: Auf dem Meeresgrund jedes Inselmeers liegt ein altes Schiff. Wer hinabtaucht und die Truhe berührt, findet einmal pro Welt einen Schatz. Aus der ungeöffneten Truhe steigen Blasen, damit man sie von oben sieht. */
/** @param {Port} SY */
export function wrecksWith(SY){ const a=[]; for(const b of ST.BIO) if(b.t===7){ const x=24*Math.round((b.x0+(b.x1-b.x0)*.78)/24); a.push({x:x,k:'wr'+(SY.realm||'')+b.i}); } return a; }
/** @type {any[]} */
export let WRECKS=[];
export let wrKey='';
/** @param {Port} SY @param {any} dt */
export function wreckTickWith(SY,dt){
  const k=SY.realm+SY.SEED+ST.BIO.length; if(k!==wrKey){ wrKey=k; WRECKS=wrecksWith(SY); }
  for(const w of WRECKS){
    if(ST.orbGot[w.k]||Math.abs(w.x-P.x)>SY.W/SY.S+200) continue;
    const gy=SY.ground(w.x);
    if(Math.random()<dt*2.5) SY.spawn(7,w.x+(Math.random()-.5)*8,gy-14,(Math.random()-.5)*10,-60-Math.random()*30,1.6,3+Math.random()*2);
    if(Math.abs(P.x-w.x)<30&&P.y>gy-70&&P.y<gy+20){ ST.orbGot[w.k]=1; ST.lootDirty=true; SY.confetti(w.x,gy-20); jingle(); SY.banner('🏴‍☠️',2600); SY.shout(w.x,gy-60,'SCHATZ!','#ffd23f'); }
  }
}
/** @param {Port} SY @param {CanvasRenderingContext2D} ctx @param {any} x0 @param {any} x1 */
export function drawWrecksWith(SY,ctx,x0,x1){
  for(const w of WRECKS){
    if(w.x<x0-200||w.x>x1+200) continue;
    const gy=SY.ground(w.x), open=!!ST.orbGot[w.k];
    ctx.save(); ctx.translate(w.x-70,gy+6); ctx.rotate(-.12);
    ctx.fillStyle=SY.INK; ctx.beginPath(); ctx.moveTo(-74,-34); ctx.lineTo(54,-34); ctx.lineTo(40,0); ctx.lineTo(-58,0); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#6b4a32'; ctx.beginPath(); ctx.moveTo(-70,-31); ctx.lineTo(50,-31); ctx.lineTo(38,-3); ctx.lineTo(-56,-3); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#4e3524'; ctx.fillRect(-64,-22,108,3); ctx.fillStyle='#1d2b3a'; SY.circle(-30,-17,5); SY.circle(-4,-17,5); SY.circle(22,-17,5);
    ctx.fillStyle=SY.INK; ctx.fillRect(-12,-110,7,78); ctx.fillStyle='#8a6a4a'; ctx.fillRect(-10,-108,3,76);
    ctx.fillStyle='rgba(240,232,210,.7)'; ctx.beginPath(); ctx.moveTo(-5,-104); ctx.lineTo(28,-80); ctx.lineTo(-5,-58); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle=SY.INK; ctx.fillRect(w.x-15,gy-22,30,22);
    ctx.fillStyle='#b5762d'; ctx.fillRect(w.x-13,gy-20,26,18); ctx.fillStyle='#6b4a32'; ctx.fillRect(w.x-13,gy-13,26,3);
    if(open){ ctx.fillStyle=SY.INK; ctx.fillRect(w.x-15,gy-34,30,8); ctx.fillStyle='#b5762d'; ctx.fillRect(w.x-13,gy-33,26,6); }
    else{ ctx.fillStyle='#ffd23f'; ctx.fillRect(w.x-3,gy-15,6,6); }
  }
}
/* Glühwürmchen: Nachts tanzen an den Bäumen Glühwürmchen. Wer eins berührt, nimmt es mit (höchstens fünf). Sie kreisen um den Kopf und machen es unter der Erde heller. Nach zwei Minuten fliegen sie wieder davon. Nichts wird gespeichert. */
/** @type {any[]} */
export let FLIES=[];
/** @type {any[]} */
export let JAR=[];
/** @param {Port} SY @param {any} dt */
export function flyTickWith(SY,dt){
  const night=SY.nightA>.5&&!SY.realm;
  if(night&&FLIES.length<6&&P.y<400&&Math.random()<dt*1.5){
    const tr=SY.trees.filter(/** @param {any} t */ function(t){ return t.state===0&&Math.abs(t.x-P.x)<SY.W/SY.S*.6; });
    if(tr.length){ const t=tr[Math.floor(Math.random()*tr.length)]; FLIES.push({hx:t.x+(Math.random()-.5)*60,hy:t.gy-30-Math.random()*70,x:t.x,y:t.gy-40,ph:Math.random()*9,t:0}); }
  }
  for(const f of FLIES.slice()){
    f.t+=dt; f.x=f.hx+Math.sin(f.t*1.3+f.ph)*22; f.y=f.hy+Math.sin(f.t*1.9+f.ph*2)*12;
    if((!night&&Math.random()<dt*.5)||Math.abs(f.x-P.x)>SY.W/SY.S*1.5){ FLIES.splice(FLIES.indexOf(f),1); continue; }
    if(JAR.length<5&&Math.hypot(f.x-P.x,f.y-(P.y-20))<26){ FLIES.splice(FLIES.indexOf(f),1); JAR.push({t:120,a:Math.random()*TAU}); blip(900,1400,.12,'sine',.05); }
  }
  for(const j of JAR.slice()){ j.t-=dt; j.a+=dt*2.2; if(j.t<=0) JAR.splice(JAR.indexOf(j),1); }
}
/** @param {Port} SY @param {any} j */
export function jarPosWith(SY,j){ return [P.x+Math.cos(j.a)*24, P.y-34+Math.sin(j.a*1.7)*10]; }
/** @param {Port} SY @param {CanvasRenderingContext2D} ctx */
export function drawFliesWith(SY,ctx){
  const k=.6+.4*Math.sin(SY.time*5);
  for(const f of FLIES){ ctx.fillStyle='rgba(200,255,90,'+(.35*k)+')'; SY.circle(f.x,f.y,10); ctx.fillStyle='#eaff8a'; SY.circle(f.x,f.y,2.4); }
  for(const j of JAR){ const p=jarPosWith(SY,j), fade=Math.min(1,j.t/10); ctx.fillStyle='rgba(220,255,120,'+(.3*k*fade)+')'; SY.circle(p[0],p[1],8); ctx.fillStyle='rgba(234,255,138,'+fade+')'; SY.circle(p[0],p[1],2.6); }
}
/* Kristallharfe: In jedem Kristallgebirge stehen fünf singende Kristalle. Wer darüberläuft, spielt Töne. Einmal alle von klein nach groß gespielt, regnet es Funken. Ein Spielzeug, keine Aufgabe. */
const HARPN=[523,587,659,784,880], HARPC=['#ff7aa8','#ffb347','#ffe066','#7be0a8','#7ab8ff'];
/** @type {any[]} */
export let HARPS=[];
export let harpKey='';
/** @param {Port} SY @param {any} dt */
export function harpTickWith(SY,dt){
  const k=SY.realm+SY.SEED+ST.BIO.length;
  if(k!==harpKey){ harpKey=k; HARPS=[]; for(const b of ST.BIO) if(b.t===8){ const x0=24*Math.round(b.px/24)-68; HARPS.push({x0:x0,k:'hp'+(SY.realm||'')+b.i,last:-1,seq:[],sh:[0,0,0,0,0]}); } }
  for(const h of HARPS){
    for(let i=0;i<5;i++) h.sh[i]=Math.max(0,h.sh[i]-dt*2);
    if(P.x<h.x0-30||P.x>h.x0+166) { h.last=-1; continue; }
    const i=Math.round((P.x-h.x0)/34);
    if(i<0||i>4){ h.last=-1; continue; }
    const cx=h.x0+i*34, gy=SY.ground(cx);
    if(Math.abs(P.x-cx)>12||P.y<gy-110||P.y>gy+20||i===h.last) continue;
    h.last=i; h.sh[i]=1; tone([HARPN[i]],'sine'); SY.spawn(6,cx,gy-30-i*10,(Math.random()-.5)*60,-80,.8,3,HARPC[i]);
    h.seq.push(i); if(h.seq.length>5) h.seq.shift();
    if(h.seq.join('')==='01234'){ h.seq=[]; SY.confetti(cx,gy-60); tone([523,659,784,1046]); if(!ST.orbGot[h.k]){ ST.orbGot[h.k]=1; ST.lootDirty=true; SY.banner('🎶',2000); } }
  }
}
/** @param {Port} SY @param {CanvasRenderingContext2D} ctx @param {any} x0 @param {any} x1 */
export function drawHarpsWith(SY,ctx,x0,x1){
  for(const h of HARPS){
    if(h.x0>x1+60||h.x0+170<x0-60) continue;
    for(let i=0;i<5;i++){
      const cx=h.x0+i*34, gy=SY.ground(cx), ht=34+i*11, w=9, sh=h.sh[i]*Math.sin(SY.time*40)*2;
      ctx.fillStyle=SY.INK; ctx.beginPath(); ctx.moveTo(cx+sh,gy-ht-4); ctx.lineTo(cx+w+2,gy-ht*.35); ctx.lineTo(cx+w,gy+2); ctx.lineTo(cx-w,gy+2); ctx.lineTo(cx-w-2,gy-ht*.35); ctx.closePath(); ctx.fill();
      ctx.fillStyle=HARPC[i]; ctx.beginPath(); ctx.moveTo(cx+sh,gy-ht); ctx.lineTo(cx+w,gy-ht*.35); ctx.lineTo(cx+w-1,gy); ctx.lineTo(cx-w+1,gy); ctx.lineTo(cx-w,gy-ht*.35); ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,'+(.35+.5*h.sh[i])+')'; ctx.beginPath(); ctx.moveTo(cx+sh-1,gy-ht+4); ctx.lineTo(cx-w+3,gy-ht*.35); ctx.lineTo(cx-3,gy-4); ctx.closePath(); ctx.fill();
    }
  }
}
/* Die fünf Systeme in der Reihenfolge von SIDE. Gezeichnet wird auf festen Ebenen in draw(): 'back' nach den Seilrutschen
   (Wrack, Harfe), 'mid' nach dem Fernrohr (Geysir, Sternschnuppen), 'glow' nach der Dunkelheit (Glühwürmchen). */
/** @param {Port} SY @returns {import('./index.js').System[]} */
export function sightsWith(SY){
  return [
    {name:'geyTick',tick:/** @param {any} dt */ function(dt){ geyTickWith(SY,dt); },draw:/** @param {CanvasRenderingContext2D} ctx @param {any} l @param {any} x0 @param {any} x1 */ function(ctx,l,x0,x1){ if(l==='mid') drawGeysWith(SY,ctx,x0,x1); }},
    {name:'metTick',tick:/** @param {any} dt */ function(dt){ metTickWith(SY,dt); },draw:/** @param {CanvasRenderingContext2D} ctx @param {any} l */ function(ctx,l){ if(l==='mid') drawMetsWith(SY,ctx); }},
    {name:'wreckTick',tick:/** @param {any} dt */ function(dt){ wreckTickWith(SY,dt); },draw:/** @param {CanvasRenderingContext2D} ctx @param {any} l @param {any} x0 @param {any} x1 */ function(ctx,l,x0,x1){ if(l==='back') drawWrecksWith(SY,ctx,x0,x1); }},
    {name:'flyTick',tick:/** @param {any} dt */ function(dt){ flyTickWith(SY,dt); },draw:/** @param {CanvasRenderingContext2D} ctx @param {any} l */ function(ctx,l){ if(l==='glow') drawFliesWith(SY,ctx); }},
    {name:'harpTick',tick:/** @param {any} dt */ function(dt){ harpTickWith(SY,dt); },draw:/** @param {CanvasRenderingContext2D} ctx @param {any} l @param {any} x0 @param {any} x1 */ function(ctx,l,x0,x1){ if(l==='back') drawHarpsWith(SY,ctx,x0,x1); }},
  ];
}
