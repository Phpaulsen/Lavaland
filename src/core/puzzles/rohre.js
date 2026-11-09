// Rätsel „Rohre“. Bewegt aus legacy.js (PR 5). Der Generator bekommt Zufall (rand) und gelesenen Zustand als Parameter;
// app/wire.js ruft ihn über einen Einzeiler mit Math.random. Zeichnen, Tippen, Hinweis und Vorlesen bleiben in app/wire.js.
import { riWith, shuffleWith } from '../rng.js';

export const RHL=[[3,2,0],[3,3,0],[4,3,0],[4,4,0],[4,4,1],[5,4,1],[5,5,1],[5,5,2],[6,5,2],[6,6,2]];
export const RMASK=[10,3,11];
/**
 * @typedef {{w: number, h: number, ys: number, ye: number, t: number[], r: number[], sr: number[], lk: boolean[], ang: number[], need: number, taps: number}} RohreState
 * t: Rohrart je Feld (0 gerade, 1 Bogen, 2 T-Stück, 3 Stein), r: Drehung 0–3, sr: Lösungsdrehung oder -1.
 */
/** Dreht die Anschlussmaske (Bits rechts, unten, links, oben) r-mal. @param {number} m @param {number} r @returns {number} */
export function rhRot(m,r){ for(let i=0;i<r;i++) m=((m<<1)&15)|(m>>3); return m; }
/** @param {RohreState} st @param {number} p @returns {number} */
export function rhMask(st,p){ return st.t[p]===3?0:rhRot(RMASK[st.t[p]],st.r[p]); }
/** Felder, die das Wasser vom Eingang aus erreicht. @param {RohreState} st @returns {Set<number>} */
export function rhFlow(st){
  const w=st.w, h=st.h, f=new Set(), s=st.ys*w, N=[[1,0,-1,4],[2,1,0,8],[4,0,1,1],[8,-1,0,2]];
  if(!(rhMask(st,s)&8)) return f;
  const q=[s]; f.add(s);
  while(q.length){
    const p=/** @type {number} */ (q.pop()), x=p%w, y=(p-x)/w, m=rhMask(st,p);
    for(const n of N){
      if(!(m&n[0])) continue;
      const nx=x+n[1], ny=y+n[2];
      if(nx<0||ny<0||nx>=w||ny>=h) continue;
      const np=ny*w+nx;
      if(f.has(np)||!(rhMask(st,np)&n[3])) continue;
      f.add(np); q.push(np);
    }
  }
  return f;
}
/** @param {RohreState} st @param {Set<number>} f @returns {boolean} */
export function rhDone(st,f){ const e=st.ye*st.w+st.w-1; return f.has(e)&&(rhMask(st,e)&2)>0; }
/**
 * @param {() => number} rand Zufallsquelle in [0, 1) (im Spiel Math.random)
 * @param {number} lv Stufe 0–9
 * @returns {RohreState}
 */
export function mkRohreWith(rand,lv){
  const L=RHL[lv], w=L[0], h=L[1];
  for(let tr=0;tr<80;tr++){
    const ys=riWith(rand,0,h-1), ye=riWith(rand,0,h-1), seen=new Set(), path=/** @type {number[]} */ ([]);
    const dfs=/** @type {(x: number, y: number) => boolean} */ (function(x,y){
      const p=y*w+x; seen.add(p); path.push(p);
      if(x===w-1&&y===ye) return true;
      for(const d of shuffleWith(rand,[[1,0],[0,1],[0,-1],[-1,0]])){
        const nx=x+d[0], ny=y+d[1];
        if(nx<0||ny<0||nx>=w||ny>=h||seen.has(ny*w+nx)) continue;
        if(dfs(nx,ny)) return true;
      }
      path.pop(); return false;
    });
    if(!dfs(0,ys)) continue;
    if(path.length<Math.min(w+1+(lv>>1),w*h-2)||path.length>w*h*.75) continue;
    const st=/** @type {RohreState} */ ({w:w,h:h,ys:ys,ye:ye,t:[],r:[],sr:[],lk:[],ang:[],need:0,taps:0});
    const on=/** @type {Record<number, number>} */ ({});
    for(let i=0;i<path.length;i++){
      const p=path[i], x=p%w, y=(p-x)/w; let m=0;
      for(const q of [i?path[i-1]:-1,i<path.length-1?path[i+1]:-2]){
        if(q===-1) m|=8; else if(q===-2) m|=2;
        else{ const qx=q%w, qy=(q-qx)/w; m|=qx>x?2:qx<x?8:qy>y?4:1; }
      }
      on[p]=m;
    }
    for(let p=0;p<w*h;p++){
      let /** @type {number} */ t, /** @type {number} */ r, sr=-1;
      if(on[p]!==undefined){
        const m=on[p];
        t=(m===10||m===5)?0:1;
        if(L[2]>=1&&rand()<.22) t=2;
        sr=0; while((rhRot(RMASK[t],sr)&m)!==m) sr++;
        r=(sr+riWith(rand,1,3))%4;
        if(t===0&&(r&1)===(sr&1)) r=(r+1)%4;
        st.need+=t===0?1:Math.min((sr-r+4)%4,4);
      }else{
        const q=rand();
        t=L[2]>=2&&q<.14?3:L[2]>=1&&q<.4?2:q<.72?1:0; r=riWith(rand,0,3);
      }
      st.t.push(t); st.r.push(r); st.sr.push(sr); st.lk.push(false); st.ang.push(r*90);
    }
    if(rhDone(st,rhFlow(st))) continue;
    return st;
  }
  return mkRohreWith(rand,Math.max(0,lv-1));
}
