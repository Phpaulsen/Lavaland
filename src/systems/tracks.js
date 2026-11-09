/* ---------- Schienen: die Vorführbahn neben dem Start ---------- */
// PR 29g1. Bewegt aus legacy.js. makeTrack kommt über den Port TK.
// app/wire.js ruft demoTrack über einen Einzeiler.
import { ground } from '../state/queries.js';
import { TAU } from '../core/world/const.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} TK */
export function demoTrackWith(TK){
  let b=1e9; for(let x=1040;x<=1960;x+=40) b=Math.min(b,ground(x));
  b-=26;
  const raw=[[1050,b],[1090,b-10]];
  for(let i=1;i<=10;i++) raw.push([1090+i*14,b-10-i*26]);
  for(let i=1;i<=12;i++){ const t=i/12; raw.push([1230+t*150,b-270+(1-Math.cos(t*Math.PI))/2*265]); }
  for(let i=0;i<=24;i++){ const a=i/24*TAU; raw.push([1440+70*Math.sin(a)+a*5,b-75+70*Math.cos(a)]); }
  for(let i=1;i<=14;i++){ const t=i/14; raw.push([1471+t*330,b-5-80*Math.sin(t*Math.PI)-t*40]); }
  raw.push([1840,b-15],[1880,b-5],[1920,b-15],[1950,b-40]);
  return TK.makeTrack(raw,false);
}
