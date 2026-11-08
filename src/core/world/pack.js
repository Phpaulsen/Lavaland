// Packen und Entpacken der Zellen für den Spielstand: Spalte für Spalte als Läufe. Bewegt aus legacy.js (PR 10).
// Das Gitter kommt als Parameter grid (gleicher Name wie in state/world.js), sonst ist der Text unverändert.
import { GX, GY } from './const.js';

/* Gespeichert wird nur der Teil der Welt, der schon erzeugt ist. Spalte für Spalte als Läufe: Zellart und wie oft sie untereinander kommt.
   Eine Welt aus langen Erd- und Felsschichten wird so etwa zwanzigmal kleiner und ist schneller geschrieben. */
/** @param {Uint8Array} grid @param {number} f @returns {Uint8Array} */
export function packRunsWith(grid,f){
  let out=new Uint8Array(1<<20), n=0;
  for(let cx=0;cx<f;cx++){
    let i=cx, cy=0;
    while(cy<GY){
      const m=grid[i]; let r=1; i+=GX; cy++;
      while(cy<GY&&grid[i]===m){ r++; i+=GX; cy++; }
      if(n+8>out.length){ const o=new Uint8Array(out.length*2); o.set(out); out=o; }
      out[n++]=m;
      while(r>=128){ out[n++]=(r&127)|128; r>>>=7; }
      out[n++]=r;
    }
  }
  return out.slice(0,n);
}
/* Schreibt die Läufe zurück ins Gitter. Passt die Länge nicht genau, ist der Spielstand kaputt: dann false. */
/** @param {Uint8Array} grid @param {Uint8Array} b @param {number} f @returns {boolean} */
export function unpackRunsWith(grid,b,f){
  let k=0;
  for(let cx=0;cx<f;cx++){
    let cy=0, i=cx;
    while(cy<GY){
      if(k>=b.length) return false;
      const m=b[k++]; let r=0, sh=0, c;
      do{ if(k>=b.length) return false; c=b[k++]; r|=(c&127)<<sh; sh+=7; }while(c&128);
      if(r<1||cy+r>GY) return false;
      for(let e=cy+r;cy<e;cy++,i+=GX) grid[i]=m;
    }
  }
  return k===b.length;
}
/** Passt ein Spielstand v5 zu dieser Welt? @param {any} sv @returns {boolean} */
export function runsOk(sv){ return sv.v===5&&sv.gy===GY&&sv.f>0&&sv.f<=GX&&sv.runs instanceof Uint8Array; }
