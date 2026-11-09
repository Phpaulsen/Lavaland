// Rätsel „Sternbild“. Bewegt aus legacy.js (PR 5). Der Generator bekommt Zufall (rand) und gelesenen Zustand als Parameter;
// app/wire.js ruft ihn über einen Einzeiler mit Math.random. Zeichnen, Tippen, Hinweis und Vorlesen bleiben in app/wire.js.
import { riWith, shuffleWith } from '../rng.js';

export const SHAPES=[
  {n:'ein Stern',e:'⭐',p:[[.5,.05],[.62,.38],[.96,.38],[.69,.6],[.8,.94],[.5,.74],[.2,.94],[.31,.6],[.04,.38],[.38,.38]]},
  {n:'ein Haus',e:'🏠',p:[[.15,.94],[.15,.46],[.5,.08],[.85,.46],[.85,.94]]},
  {n:'eine Rakete',e:'🚀',p:[[.5,.04],[.68,.3],[.68,.7],[.86,.94],[.5,.82],[.14,.94],[.32,.7],[.32,.3]]},
  {n:'ein Fisch',e:'🐟',p:[[.04,.5],[.3,.22],[.62,.25],[.8,.45],[.96,.22],[.96,.78],[.8,.55],[.62,.75],[.3,.78]]},
  {n:'ein Herz',e:'❤️',p:[[.5,.3],[.65,.1],[.88,.12],[.96,.35],[.85,.6],[.5,.93],[.15,.6],[.04,.35],[.12,.12],[.35,.1]]},
  {n:'ein Kristall',e:'💎',p:[[.3,.1],[.7,.1],[.92,.38],[.5,.94],[.08,.38]]},
  {n:'eine Tanne',e:'🌲',p:[[.5,.04],[.78,.38],[.64,.38],[.9,.74],[.56,.74],[.56,.95],[.44,.95],[.44,.74],[.1,.74],[.36,.38],[.22,.38]]}
];
/** @typedef {{sh: (typeof SHAPES)[number], pts: number[][], k: number, two: boolean}} SternState pts: [x, y, Zahl] in Einheiten des Feldes */
/**
 * @param {() => number} rand Zufallsquelle in [0, 1) (im Spiel Math.random)
 * @param {{u: {m: number}}} FS Lernstand (gelesen: Stufe Mathe)
 * @param {number} lv Stufe 0–9
 * @returns {SternState}
 */
export function mkSternWith(rand,FS,lv){
  const N=[5,6,7,8,9,10,10,11,10,10][lv], big=FS.u.m>=2, two=big&&lv>=8, step=two?2:1;
  let n=big?N:Math.min(N,10), a=1;
  if(two) a=2; else if(big&&lv>=6) a=riWith(rand,2,20-n+1);
  const sh=shuffleWith(rand,SHAPES.filter(function(q){ return q.p.length<=n; }))[0];
  /* Alle Ecken bleiben, auf den längsten Kanten kommen Sterne dazu, bis es genug sind. */
  let pts=sh.p.map(function(q){ return q.slice(); });
  while(pts.length<n){
    let bi=0, bd=0;
    for(let i=0;i<pts.length;i++){ const p=pts[i], q=pts[(i+1)%pts.length], d=Math.hypot(p[0]-q[0],p[1]-q[1]); if(d>bd){ bd=d; bi=i; } }
    const p=pts[bi], q=pts[(bi+1)%pts.length]; pts.splice(bi+1,0,[(p[0]+q[0])/2,(p[1]+q[1])/2]);
  }
  const o=riWith(rand,0,n-1), dir=riWith(rand,0,1)?1:-1, ord=[];
  for(let i=0;i<n;i++) ord.push(pts[((o+dir*i)%n+n)%n]);
  return {sh:sh,pts:ord.map(function(p,i){ return [p[0],p[1],a+i*step]; }),k:0,two:two};
}
