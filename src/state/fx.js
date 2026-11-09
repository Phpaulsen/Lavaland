/* ---------- Wirkungen auf die Spielfigur: laufende Effekte (Rutschen, Scharf, Zucker, Riesig, Winzig …), Tempo und Größe daraus ---------- */
// PR 29g1. Unverändert aus legacy.js bewegt (gleiche Namen, ohne Port). FX ist ein Objekt, das app/wire.js und die Ports nur verändern, nie neu zuweisen.

export const FX={hot:0,slip:0,sugar:0,big:0,tiny:0,pump:0,star:0,float:0,stink:0,rainbow:0,sonar:0};
export function fxSpeed(){ return (FX.slip>0?2.5:1)*(FX.hot>0?1.7:1)*(FX.sugar>0?1.8:1)*(FX.star>0?1.4:1)*(FX.rainbow>0?1.6:1)*(FX.big>0?1.2:1)*(FX.tiny>0?.8:1); }
export function kidScale(){
  if(FX.big>0) return 1+1.2*Math.min(1,(12-FX.big)*4,FX.big*2);
  if(FX.tiny>0) return 1-.55*Math.min(1,(12-FX.tiny)*4,FX.tiny*2);
  return 1;
}
