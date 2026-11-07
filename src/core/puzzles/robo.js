// Rätsel „Roboter“: Weg mit den wenigsten Richtungswechseln. Bewegt aus legacy.js (PR 5). Der Generator bekommt Zufall (rand) und gelesenen Zustand als Parameter;
// legacy.js ruft ihn über einen Einzeiler mit Math.random. Zeichnen, Tippen, Hinweis und Vorlesen bleiben in legacy.js.
import { shuffleWith } from '../rng.js';
import { idxs } from './util.js';

export const RBL=[[4,3,1,0,0,9],[4,4,3,0,0,9],[5,4,5,0,0,9],[5,5,7,0,0,9],[5,5,6,1,0,9],[6,5,8,1,2,9],[6,5,8,2,2,2],[6,6,10,2,3,1],[7,6,12,3,4,1],[7,6,14,3,5,0]];
export const RBD=[[1,0],[0,1],[-1,0],[0,-1]];
/**
 * @typedef {{d: number, n: number}} RoboStep Richtung (Index in RBD) und Anzahl Felder
 * @typedef {{w: number, h: number, s: number, g: number, gems: number[], wall: Set<number>, lava: Set<number>, prog: any[], max: number, sol: RoboStep[]|null, pos: number, got: number, bad: number, cur: number}} RoboState
 */
/* Sucht den Weg mit den wenigsten Richtungswechseln: erst alle Edelsteine, dann zur Fahne. */
/** @param {RoboState} st @returns {RoboStep[]|null} */
export function rbSolve(st){
  const w=st.w, h=st.h, n=w*h, G=st.gems, full=(1<<G.length)-1;
  const dist=new Int16Array(n*40).fill(999), prev=new Int32Array(n*40).fill(-1), k0=(st.s*5+4)*8, dq=[k0];
  let end=-1; dist[k0]=0;
  while(dq.length){
    const k=/** @type {number} */ (dq.shift()), m=k&7, pd=k>>3, d=pd%5, p=(pd-d)/5;
    if(p===st.g&&m===full){ end=k; break; }
    const x=p%w, y=(p-x)/w;
    for(let nd=0;nd<4;nd++){
      const nx=x+RBD[nd][0], ny=y+RBD[nd][1];
      if(nx<0||ny<0||nx>=w||ny>=h) continue;
      const np=ny*w+nx;
      if(st.wall.has(np)||st.lava.has(np)) continue;
      const gi=G.indexOf(np), nm=gi>=0?m|(1<<gi):m, c=dist[k]+(nd===d?0:1), nk=(np*5+nd)*8+nm;
      if(c<dist[nk]){ dist[nk]=c; prev[nk]=k; if(nd===d) dq.unshift(nk); else dq.push(nk); }
    }
  }
  if(end<0) return null;
  const dirs=[]; for(let k=end;prev[k]>=0;k=prev[k]) dirs.push((k>>3)%5);
  dirs.reverse();
  const /** @type {RoboStep[]} */ sol=[];
  for(const d of dirs){ const l=sol[sol.length-1]; if(l&&l.d===d&&l.n<9) l.n++; else sol.push({d:d,n:1}); }
  return sol;
}
/**
 * @param {() => number} rand Zufallsquelle in [0, 1) (im Spiel Math.random)
 * @param {number} lv Stufe 0–9
 * @returns {RoboState}
 */
export function mkRoboWith(rand,lv){
  const L=RBL[lv], w=L[0], h=L[1];
  for(let tr=0;tr<120;tr++){
    const c=shuffleWith(rand,idxs(w*h)), a=2+L[3], b=a+L[2];
    const st=/** @type {RoboState} */ ({w:w,h:h,s:c[0],g:c[1],gems:c.slice(2,a),wall:new Set(c.slice(a,b)),lava:new Set(c.slice(b,b+L[4])),prog:[],max:12,sol:null,pos:c[0],got:0,bad:-1,cur:-1});
    const sol=rbSolve(st); if(!sol) continue;
    let steps=0; for(const q of sol) steps+=q.n;
    if(steps<Math.min(3+lv,9)||sol.length<Math.min(2+(lv>>1),4)||sol.length>9) continue;
    st.sol=sol; st.max=L[5]===9?Math.max(sol.length+3,6):sol.length+L[5];
    return st;
  }
  return mkRoboWith(rand,Math.max(0,lv-1));
}
