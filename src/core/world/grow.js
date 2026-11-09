/* ---------- Schneeberg nachrüsten, Länder wachsen lassen, Planeten erzeugen, Zellen aus dem Spielstand laden ---------- */
// PR 28d. Bewegt aus legacy.js. core/ rechnet nur: Gitter, Held, Fahrzeuge und Fassade kommen über den Port WG (Schichtregel),
// ebenso die Spaltenerzeugung (genCol, build, winterCol, carveCave), die über das Weltobjekt WD läuft.
import { SNC0, SNC1, SL0, BEND, msurf, LANDX } from './shape.js';
import { rawH, GX, CELL, HOME_GX, KEEPR, GY } from './const.js';

/** @typedef {Record<string, any>} Port */

/* Alte Spielstände bekommen den Berg nachträglich. Was dort stand, rückt nach oben auf den Schnee. */
/** @param {Port} WG */
export function migrateSnowWith(WG){
  for(let cx=SNC0;cx<Math.min(WG.genF,SNC1);cx++) WG.winterCol(cx);
  WG.carveCave();
  const up=/** @param {any} o */ function(o){ if(o&&o.x>SL0&&o.x<BEND&&o.y>msurf(o.x)) o.y=msurf(o.x); };
  for(const k in WG.parked) up(WG.parked[k]);
  WG.ST.props.forEach(up);
  if(WG.P.x>SL0&&WG.P.y>msurf(WG.P.x)&&WG.P.y<rawH(WG.P.x)+8) WG.P.y=msurf(WG.P.x)-2;
  for(const h of WG.ST.hidden){
    if(h.got||h.x<SL0) continue;
    if(h.tree>=0&&WG.trees[h.tree]){ const t=WG.trees[h.tree]; h.y=t.gy-t.h-4; }
    else if(h.zone==='shallow'||h.zone==='edge') h.y-=rawH(h.x)-msurf(h.x);
    else if(h.zone==='sky'&&h.y>msurf(h.x)-20) h.y=msurf(h.x)-24;
  }
}
/* Eine fremde Welt zum ersten Mal: Sie entsteht rund um den Landeplatz und wächst beim Reisen. */
/** @param {Port} WG */
export function planetGenWith(WG){
  WG.grid.fill(0); WG.LIFE.clear(); WG.stamp.fill(0); WG.genF=0; WG.ST.stI=0;
  growWith(WG,LANDX+3200);
}
/** @param {Port} WG @param {any} toX */
export function growWith(WG,toX){
  const c1=Math.min(GX,Math.ceil(toX/CELL)+1);
  if(c1<=WG.genF) return;
  for(let cx=WG.genF;cx<c1;cx++) WG.genCol(cx);
  WG.genF=c1;
  while(WG.ST.stI<WG.ST.STR.length&&WG.ST.STR[WG.ST.stI].c1<WG.genF){ WG.build(WG.ST.STR[WG.ST.stI]); WG.ST.stI++; }
}
/** @param {Port} WG @param {any} sv */
export function loadCellsWith(WG,sv){
  const old=sv.v<4, f0=sv.v>=3?sv.f:HOME_GX;
  let f=Math.min(f0,GX);
  if(old&&sv.v===3) f=Math.min(f,Math.floor((WG.OLD_END-300)/CELL));
  /* Spielstände aus der halb so breiten Welt: Wo früher das Ende der Welt lag, liegt jetzt ein neues Land. Dieser Teil wird neu erzeugt. */
  WG.cutX=0;
  if(sv.v>=4&&!sv.w&&f>Math.floor((WG.OLD_END-300)/CELL)){ f=Math.floor((WG.OLD_END-300)/CELL); WG.cutX=f*CELL-300; }
  WG.grid.fill(0);
  if(sv.v>=5){ if(!WG.unpackRuns(sv.runs,f0)) throw new Error('runs'); }
  else{
    const rows=old?KEEPR:GY;
    for(let cy=0;cy<rows;cy++) WG.grid.set(sv.grid.subarray(cy*f0,cy*f0+f),cy*GX);
  }
  WG.genF=sv.v>=3?f:HOME_GX-1;
  if(old) for(let cx=0;cx<WG.genF;cx++) WG.genCol(cx,KEEPR);
  WG.ST.stI=0;
  while(WG.ST.stI<WG.ST.STR.length&&WG.ST.STR[WG.ST.stI].c1<WG.genF){ if(old&&WG.ST.STR[WG.ST.stI].nw) WG.build(WG.ST.STR[WG.ST.stI]); WG.ST.stI++; }
  /* Spielstände von vor den Wissenstüren bekommen die Schatzkammern in schon erzeugte Tiefe nachträglich. */
  if(!sv.vt&&!old) for(const s of WG.ST.STR) if(s.k==='vault'&&s.c1<WG.genF) WG.build(s);
  WG.ST.seen=sv.seen||{}; WG.ST.eggGot=sv.eggGot||{}; WG.ST.lootGot=sv.lootGot||{}; WG.ST.orbGot=sv.orbGot||{}; WG.ST.DROPS=[];
}
