// Rätsel „Kristall-Echo“ (Streichkandidat, plan-vereinfachung.md). Bewegt aus legacy.js (PR 5). Der Generator bekommt Zufall (rand) und gelesenen Zustand als Parameter;
// legacy.js ruft ihn über einen Einzeiler mit Math.random. Zeichnen, Tippen, Hinweis und Vorlesen bleiben in legacy.js.
import { riWith } from '../rng.js';

export const ECL=[[4,2,0],[4,3,0],[4,3,0],[4,4,0],[6,4,0],[4,5,0],[6,5,0],[4,3,1],[6,6,0],[6,4,1]];
/** @typedef {{n: number, seq: number[], rev: number, pos: number, lit: number, ph: string, sp: number}} EchoState */
/**
 * @param {() => number} rand Zufallsquelle in [0, 1) (im Spiel Math.random)
 * @param {number} lv Stufe 0–9
 * @returns {EchoState}
 */
export function mkEchoWith(rand,lv){
  const L=ECL[lv], st=/** @type {EchoState} */ ({n:L[0],seq:[],rev:L[2],pos:0,lit:-1,ph:'wait',sp:lv>=2?430:580});
  for(let i=0;i<L[1];i++){ let v=riWith(rand,0,L[0]-1); if(i&&v===st.seq[i-1]) v=(v+1)%L[0]; st.seq.push(v); }
  return st;
}
