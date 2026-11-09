// Rätsel „Muster“: Welches Bild fehlt in der Reihe? Bewegt aus legacy.js (PR 5). Der Generator bekommt Zufall (rand) und gelesenen Zustand als Parameter;
// app/wire.js ruft ihn über einen Einzeiler mit Math.random. Zeichnen, Tippen, Hinweis und Vorlesen bleiben in app/wire.js.
import { riWith, shuffleWith } from '../rng.js';

/** @typedef {any} Tok Ein Bild {s, c} (Form, Farbe) oder eine Zahl {n}. */
/** Schlüssel eines Bildes oder einer Zahl. @param {Tok} t @returns {string} */
export function tkKey(t){ return t.n!==undefined?'n'+t.n:t.s+'-'+t.c; }
/**
 * @typedef {{k: string, seq: Tok[], hole: number, opts: Tok[], ans: string, u?: number, ps?: any, pc?: any, sh?: any, co?: any}} MusterState
 * k: rep (Wiederholung), cnt (Zahlenreihe), two (zwei Merkmale). u nur bei rep, ps/pc/sh/co nur bei two.
 */
/**
 * @param {() => number} rand Zufallsquelle in [0, 1) (im Spiel Math.random)
 * @param {number} lv Stufe 0–9
 * @returns {MusterState}
 */
export function mkMusterWith(rand,lv){
  const sh=shuffleWith(rand,[0,1,2,3,4]), co=shuffleWith(rand,[0,1,2,3,4,5]), T=[0,1,2,3].map(function(i){ return {s:sh[i],c:co[i]}; });
  const st=/** @type {MusterState} */ ({k:'rep',seq:[],hole:0,opts:[],ans:''});
  let unit=/** @type {number[]|null} */ (null), len=6, mid=false;
  if(lv===0){ unit=[0,1]; len=6; }
  else if(lv===1){ unit=riWith(rand,0,1)?[0,0,1]:[0,1,1]; len=7; }
  else if(lv===2){ unit=[0,1,2]; len=7; }
  else if(lv===3){ unit=[[0,1],[0,0,1],[0,1,2]][riWith(rand,0,2)]; len=8; mid=true; }
  else if(lv===4){ unit=riWith(rand,0,1)?[0,0,1,1]:[0,1,0,2]; len=9; mid=riWith(rand,0,1)===1; }
  else if(lv===5||lv===7){
    /* Zahlenreihe: immer gleich viel dazu oder weg */
    const step=lv===5?1:riWith(rand,2,3), down=lv===7&&riWith(rand,0,1)===1, a=down?step*4+riWith(rand,1,6):riWith(rand,1,5);
    st.k='cnt'; for(let i=0;i<5;i++) st.seq.push({n:down?a-i*step:a+i*step});
    st.hole=lv===5?4:riWith(rand,2,4);
  }else{
    /* Zwei Merkmale: Die Form wechselt in einem Takt, die Farbe in einem anderen. */
    const ps=lv===9?3:2, pc=lv===9?2:3;
    st.k='two'; len=lv===6?7:9;
    for(let i=0;i<len;i++) st.seq.push({s:sh[i%ps],c:co[i%pc]});
    st.hole=lv===6?len-1:riWith(rand,4,len-2);
    st.ps=ps; st.pc=pc; st.sh=sh; st.co=co;
  }
  if(unit){ for(let i=0;i<len;i++) st.seq.push(T[unit[i%unit.length]]); st.hole=mid?riWith(rand,2,len-3):len-1; st.u=unit.length; }
  const ans=st.seq[st.hole], nOpt=lv<3?3:4; let /** @type {Tok[]} */ opts;
  if(st.k==='cnt'){
    const set=[ans.n];
    for(const v of shuffleWith(rand,[ans.n-1,ans.n+1,ans.n+2,ans.n-2,ans.n+3])) if(set.length<4&&v>0&&set.indexOf(v)<0) set.push(v);
    opts=set.map(function(n){ return {n:n}; });
  }else if(st.k==='two'){
    const os=st.sh[(st.sh.indexOf(ans.s)+1)%st.ps], oc=st.co[(st.co.indexOf(ans.c)+1)%st.pc];
    opts=[ans,{s:ans.s,c:oc},{s:os,c:ans.c},{s:os,c:oc}];
  }else{
    opts=[ans];
    for(const t of T) if(opts.length<nOpt&&t!==ans) opts.push(t);
  }
  st.opts=shuffleWith(rand,opts); st.ans=tkKey(ans);
  return st;
}
