// Rätsel „Waage“ (Zahlen bis 20, richtet sich nach dem Schulstand). Bewegt aus legacy.js (PR 5). Der Generator bekommt Zufall (rand) und gelesenen Zustand als Parameter;
// legacy.js ruft ihn über einen Einzeiler mit Math.random. Zeichnen, Tippen, Hinweis und Vorlesen bleiben in legacy.js.
import { riWith, shuffleWith } from '../rng.js';

/**
 * @typedef {{L: number[], R: {w: number, fix: number}[], pal: number[]|null, items: any[]|null, box: number, opts: number[]|null, over: boolean, ang: number}} WaageState
 * L, R: Gewichte links und rechts (-1 = Kiste mit unbekanntem Gewicht box). items: erst Zahlen, dann {w, used}.
 */
/**
 * @param {() => number} rand Zufallsquelle in [0, 1) (im Spiel Math.random)
 * @param {{on: boolean, zr: number}} SCH Schulstand (gelesen: an, Zahlenraum)
 * @param {number} lv Stufe 0–9
 * @returns {WaageState}
 */
export function mkWaageWith(rand,SCH,lv){
  const st=/** @type {WaageState} */ ({L:[],R:[],pal:null,items:null,box:0,opts:null,over:false,ang:0});
  const pick=/** @type {(arr: number[], n: number) => number[]} */ (function(arr,n){ return shuffleWith(rand,arr.slice()).slice(0,n); }), sum=/** @type {(a: number[]) => number} */ (function(a){ let s=0; for(const v of a) s+=v; return s; });
  /* Zahlen bis 20: ab Stufe 3 gibt es die 10, ab Stufe 4 muss man über die 10 hinweg rechnen. Der Schulstand begrenzt die Stufe. */
  if(SCH.on) lv=Math.min(lv,[0,2,3,9][SCH.zr]);
  if(lv===0){ st.pal=[1,2]; st.L=[riWith(rand,3,5)]; }
  else if(lv===1){ st.pal=[1,2,5]; st.L=[riWith(rand,6,10)]; }
  else if(lv===2){ st.pal=[1,2,5]; st.L=[riWith(rand,2,5),riWith(rand,2,5)]; }
  else if(lv===3){ st.pal=[1,2,10]; st.L=[riWith(rand,11,15)]; }
  else if(lv===4){ const a=riWith(rand,6,9); st.pal=[1,2,5,10]; st.L=[a,riWith(rand,11-a,9)]; }
  else if(lv===5){ const b=riWith(rand,2,9), a=riWith(rand,5,10); st.box=b; st.L=[-1,a]; st.R=[{w:a+b,fix:1}]; }
  else if(lv===6){ st.items=[10,5,5,2,2,1,1]; let t; do t=sum(pick(st.items,riWith(rand,3,4))); while(t>20); st.L=[t]; }
  else if(lv===7){ const pre=riWith(rand,5,10); st.items=[1,2,3,4,5,6]; st.R=[{w:pre,fix:1}]; st.L=[Math.min(20,pre+sum(pick(st.items,2)))]; }
  else if(lv===8){ const b=riWith(rand,3,8), a=riWith(rand,1,4); st.box=b; st.L=[-1,-1,a]; st.R=[{w:2*b+a,fix:1}]; }
  else{ const b=riWith(rand,3,8), a=riWith(rand,1,4); st.box=b; st.L=[-1,-1,a]; st.R=[{w:-1,fix:1},{w:b+a,fix:1}]; }
  if(st.items) st.items=st.items.map(function(w){ return {w:w,used:false}; });
  if(st.box){ const o=[st.box]; for(const v of shuffleWith(rand,[st.box-1,st.box+1,st.box+2,st.box-2,st.box+3])) if(o.length<4&&v>0&&o.indexOf(v)<0) o.push(v); st.opts=shuffleWith(rand,o); }
  return st;
}
