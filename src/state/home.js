/* ---------- Heimat beim Laden: Bäume und Wolken der Heimatwelt (fester Zufallsstrom rng(20261004)) und ihre Kopien für die Rückkehr ---------- */
// PR 29g2a. Unverändert aus legacy.js bewegt (Anweisungen auf oberster Ebene, gleiche Reihenfolge). Braucht den Boden aus state/terrain.js, darum der Import zuerst.
import './terrain.js';
import { rng } from '../core/rng.js';
import { HOME_W, VOLC, SITE, FLAT, CELL, TOP } from '../core/world/const.js';
import { ground } from './queries.js';
import { grow0, mtop } from './world.js';
import { SNX } from '../core/world/shape.js';
import { ST } from './facade.js';

export const HOME_T=/** @type {any[]} */ ([]), HOME_C=/** @type {any[]} */ ([]);
/* ---------- Bäume, Wolken ---------- */
const rnd=rng(20261004);
export const trees=/** @type {any[]} */ ([]), clouds=/** @type {any[]} */ ([]);
for(let x=260;x<HOME_W-200;x+=130+rnd()*210){
  if(Math.abs(x-VOLC)<620||Math.abs(x-470)<80||Math.abs(x-3150)<80||Math.abs(x-SITE.chest-40)<90) continue;
  let near=false; for(const k of FLAT) if(Math.abs(x-SITE[k])<(k==='pond'?250:190)) near=true;
  if(near) continue;
  if(x>980&&x<2000&&rnd()<.6) continue;
  trees.push({x:x,gy:ground(x),row:grow0[Math.floor(x/CELL)],h:62+rnd()*40,state:0,t:0,s:.85+rnd()*.4});
}
for(let i=0;i<36;i++) clouds.push({x:rnd()*HOME_W,y:-170-rnd()*980,s:.7+rnd()*1.1});
/* Auf dem Schneeberg stehen die Bäume oben auf dem Schnee und sind verschneite Tannen. */
for(const tr of trees){ const cx=Math.floor(tr.x/CELL); if(mtop[cx]<grow0[cx]){ tr.row=mtop[cx]; tr.gy=TOP+mtop[cx]*CELL; } if(tr.x>SNX) tr.fir=true; }
ST.NT0=trees.length; ST.NC0=clouds.length;
for(const t of trees) HOME_T.push(Object.assign({},t));
for(const c of clouds) HOME_C.push(Object.assign({},c));
