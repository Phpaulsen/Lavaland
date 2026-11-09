// Rätsel „Bilder-Sudoku“ (Streichkandidat, plan-vereinfachung.md). Bewegt aus legacy.js (PR 5). Der Generator bekommt Zufall (rand) und gelesenen Zustand als Parameter;
// app/wire.js ruft ihn über einen Einzeiler mit Math.random. Zeichnen, Tippen, Hinweis und Vorlesen bleiben in app/wire.js.
import { riWith, shuffleWith } from '../rng.js';
import { idxs } from './util.js';

export const SDL=[[3,2],[3,3],[3,4],[3,5],[3,6],[4,4],[4,6],[4,7],[4,8],[4,10]];
/** @typedef {{n: number, sol: number[], giv: number[], cur: number[], sy: number[], co: number[], full: boolean}} SudokuState giv: Vorgabe mit -1 für leer */
/** Darf v an Stelle i stehen (Zeile, Spalte, bei 4×4 auch Block)? @param {number[]} a @param {number} n @param {number} i @param {number} v @returns {boolean} */
export function sdOk(a,n,i,v){
  const c=i%n, r=(i-c)/n;
  for(let k=0;k<n;k++){ if(k!==c&&a[r*n+k]===v) return false; if(k!==r&&a[k*n+c]===v) return false; }
  if(n===4){ const br=r&2, bc=c&2; for(let y=br;y<br+2;y++) for(let x=bc;x<bc+2;x++) if((y!==r||x!==c)&&a[y*4+x]===v) return false; }
  return true;
}
/** Anzahl Lösungen, höchstens 2 (füllt a vorübergehend, danach unverändert). @param {number[]} a @param {number} n @returns {number} */
export function sdCount(a,n){
  const i=a.indexOf(-1); if(i<0) return 1;
  let s=0;
  for(let v=0;v<n&&s<2;v++) if(sdOk(a,n,i,v)){ a[i]=v; s+=sdCount(a,n); a[i]=-1; }
  return s;
}
/**
 * @param {() => number} rand Zufallsquelle in [0, 1) (im Spiel Math.random)
 * @param {number} lv Stufe 0–9
 * @returns {SudokuState}
 */
export function mkSudokuWith(rand,lv){
  const n=SDL[lv][0], want=SDL[lv][1], g=[];
  if(n===3){ const b=shuffleWith(rand,[0,1,2]), sh=riWith(rand,1,2); for(let r=0;r<3;r++) for(let c=0;c<3;c++) g.push(b[(c+r*sh)%3]); }
  else{
    const base=[0,1,2,3,2,3,0,1,1,0,3,2,3,2,1,0], sy=shuffleWith(rand,[0,1,2,3]);
    const mix=function(){ let o=[0,1,2,3]; if(riWith(rand,0,1)) o=[1,0,2,3]; if(riWith(rand,0,1)) o=[o[0],o[1],3,2]; if(riWith(rand,0,1)) o=[o[2],o[3],o[0],o[1]]; return o; };
    const rows=mix(), cols=mix();
    for(let r=0;r<4;r++) for(let c=0;c<4;c++) g.push(sy[base[rows[r]*4+cols[c]]]);
  }
  const giv=g.slice(); let bl=0;
  for(const i of shuffleWith(rand,idxs(n*n))){ if(bl>=want) break; const v=giv[i]; giv[i]=-1; if(sdCount(giv,n)===1) bl++; else giv[i]=v; }
  return {n:n,sol:g,giv:giv,cur:giv.slice(),sy:shuffleWith(rand,[0,1,2,3]),co:shuffleWith(rand,[0,1,2,3]),full:false};
}
