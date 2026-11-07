// Rätsel „Spiegelbild“. Bewegt aus legacy.js (PR 5). Der Generator bekommt Zufall (rand) und gelesenen Zustand als Parameter;
// legacy.js ruft ihn über einen Einzeiler mit Math.random. Zeichnen, Tippen, Hinweis und Vorlesen bleiben in legacy.js.
import { riWith, shuffleWith } from '../rng.js';
import { idxs } from './util.js';

export const SPL=[[2,3,2,1,0],[3,3,3,1,0],[3,3,5,1,0],[3,4,6,1,0],[3,4,6,2,0],[4,4,8,2,0],[4,3,6,2,1],[4,5,10,2,0],[4,4,9,3,1],[5,5,13,3,0]];
/** @typedef {{w: number, h: number, nc: number, ax: number, a: number[], b: number[]}} SpiegelState a: Vorlage, b: Antwort des Kindes */
/**
 * @param {() => number} rand Zufallsquelle in [0, 1) (im Spiel Math.random)
 * @param {number} lv Stufe 0–9
 * @returns {SpiegelState}
 */
export function mkSpiegelWith(rand,lv){
  const L=SPL[lv], w=L[0], h=L[1], st=/** @type {SpiegelState} */ ({w:w,h:h,nc:L[3],ax:L[4],a:[],b:[]});
  for(let i=0;i<w*h;i++){ st.a.push(0); st.b.push(0); }
  for(const i of shuffleWith(rand,idxs(w*h)).slice(0,L[2])) st.a[i]=riWith(rand,1,L[3]);
  return st;
}
