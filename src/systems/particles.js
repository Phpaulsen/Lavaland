/* ---------- Teilchen erzeugen: Obergrenze, Funken, Rauch, Staub, Konfetti und Explosion ---------- */
// PR 29d2. Bewegt aus legacy.js. Die Teilchenliste parts, CONF, maxDpr, reduced und shake (mit Setter) kommen über den Port PA.
// app/wire.js ruft alle Funktionen über Einzeiler (viele Abschnitte und Ports).
import { CELL, TOP, FIRE } from '../core/world/const.js';
import { colTop, putUp } from '../state/queries.js';
import { sfx } from '../audio/sound.js';

/** @typedef {Record<string, any>} Port */

/* Teilchen-Obergrenze: Ist sie erreicht, werden neue Teilchen einfach weggelassen (kostet nichts). Nur Ausrufe wie „BUMM!“ verdrängen das älteste. Auf langsamen Geräten liegt die Grenze niedriger. */
/** @param {Port} PA */
export function pmaxWith(PA){ return PA.maxDpr<=1?240:460; }
/** @param {Port} PA @param {any} type @param {any} x @param {any} y @param {any} vx @param {any} vy @param {any} lf @param {any} size @param {any} [c] @param {any} [col] */
export function spawnWith(PA,type,x,y,vx,vy,lf,size,c,col){
  if(PA.parts.length>=pmaxWith(PA)){ if(type!==9) return; PA.parts.shift(); }
  PA.parts.push({type:type,x:x,y:y,vx:vx,vy:vy,life:lf,max:lf,size:size,c:c||0,col:col||'#fff'});
}
/** @param {Port} PA @param {any} x @param {any} y @param {any} n */
export function smokeWith(PA,x,y,n){ for(let i=0;i<n;i++) spawnWith(PA,0,x+(Math.random()-.5)*20,y+(Math.random()-.5)*14,(Math.random()-.5)*60,-30-Math.random()*60,.8+Math.random(),6+Math.random()*7); }
/** @param {Port} PA @param {any} x @param {any} y */
export function dustWith(PA,x,y){ for(let i=0;i<7;i++) spawnWith(PA,3,x+(Math.random()-.5)*20,y-2,(Math.random()-.5)*140,-40-Math.random()*90,.5,3+Math.random()*3); }
/** @param {Port} PA @param {any} x @param {any} y */
export function confettiWith(PA,x,y){ for(let i=0,n=PA.reduced?18:70;i<n;i++) spawnWith(PA,6,x+(Math.random()-.5)*30,y-30,(Math.random()-.5)*420,-180-Math.random()*380,1.4+Math.random(),3+Math.random()*2,PA.CONF[i%6]); }
/** @param {Port} PA @param {any} x @param {any} y */
export function explodeWith(PA,x,y){
  const cx=Math.floor(x/CELL), r=colTop(cx,Math.floor((y-TOP)/CELL)-4);
  for(let dx=-5;dx<=5;dx++) for(let dy=1;dy<=3;dy++) if(Math.random()<.9-dy*.2) putUp(cx+dx,r-dy,FIRE);
  for(let i=0;i<34;i++) spawnWith(PA,1,x,y-10,(Math.random()-.5)*380,-60-Math.random()*340,.5+Math.random()*.6,8+Math.random()*9);
  for(let i=0;i<14;i++) spawnWith(PA,5,x,y-10,(Math.random()-.5)*500,-150-Math.random()*380,.9,2);
  smokeWith(PA,x,y-20,14); PA.shake=.5; sfx('boom');
}
