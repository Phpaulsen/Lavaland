// Bauplan der Rohrwand-Grotte (Backlog-Idee 6, Schritt 2). Neben einer Rohr-Maschine liegt im Boden eine Sperre aus Glutstein,
// darunter ein Schacht in eine große Grotte, an deren Ende eine zweite Glutstein-Tür in eine Nebenkammer führt.
// Alles ist in Grundgestein gefasst, solange es verschlossen ist. core/ rechnet nur: Zellen liest der Plan über at(cx, cy), Zufall kommt als rand.
import { BED, CORE, SHELL, GLUT, GX } from './const.js';

/** Maße in Zellen. d zählt seitlich von der Maschine weg (Richtung s), Zeilen nach unten ab dem Boden der Maschine.
 * P0/P1 Sperre (Spalten), PH Sperrenhöhe, G0/GW Grotte, GH Grottenhöhe, WALL Trennwand, NW/NH Nebenkammer, DH Türhöhe, FR Rahmen. */
export const RWM={P0:7,P1:13,PH:4,G0:-4,GW:150,GH:36,WALL:4,NW:44,NH:20,DH:7,FR:3};
/** Schachttiefen, die der Plan der Reihe nach versucht. */
export const RWDEPTH=[6,24,48];

/** @typedef {{mc: number, fr: number, s: number, dp: number}} RwSpot  Maschinen-Spalte, Bodenzeile, Seite (+1 rechts, −1 links), Schachttiefe
 * @typedef {{cells: number[], x0: number, x1: number, y0: number, y1: number, plug: number[], door: number[], keep: number[]}} RwPlan
 * cells: Zellindex und Material paarweise; plug/door: Zellindizes der beiden Glutstein-Sperren; keep: Rahmenzellen um Tür und Nebenkammer, die beim Öffnen der Grotte Grundgestein bleiben. */

/** Umriss eines Orts in Zellen, ohne Zufall: zum schnellen Ausschließen vor dem teuren Plan. @param {RwSpot} sp @returns {{x0: number, x1: number, y0: number, y1: number}} */
export function rwBox(sp){
  const M=RWM, a=sp.mc+sp.s*(M.G0-M.FR), b=sp.mc+sp.s*(M.G0+M.GW+M.WALL+M.NW+M.FR-1);
  return {x0:Math.min(a,b),x1:Math.max(a,b),y0:sp.fr,y1:sp.fr+M.PH+sp.dp+M.GH-1+M.FR};
}
/**
 * Rechnet den Plan für einen Ort. Gleicher Ort und gleicher Zufallsstrom ergeben denselben Plan.
 * @param {RwSpot} sp
 * @param {() => number} rand Zufallsquelle (eigener Strom je Maschine)
 * @returns {RwPlan}
 */
export function rwPlan(sp,rand){
  const M=RWM, s=sp.s, fr=sp.fr, top=fr+M.PH+sp.dp, bot=top+M.GH-1;
  const cx=/** @param {number} d */ function(d){ return sp.mc+s*d; };
  /* Boden und Decke der Grotte wellen sich sanft: je 12 Spalten ein Stützwert, dazwischen linear. */
  const nk=Math.ceil(M.GW/12)+2, up=/** @type {number[]} */ ([]), dn=/** @type {number[]} */ ([]);
  for(let k=0;k<nk;k++){ up.push(Math.floor(rand()*5)); dn.push(Math.floor(rand()*4)); }
  const wave=/** @param {number[]} a @param {number} d */ function(a,d){ const f=d/12, k=Math.floor(f), t=f-k; return Math.round(a[k]*(1-t)+a[k+1]*t); };
  const open=new Map(), nb=new Set(), plug=/** @type {number[]} */ ([]), door=/** @type {number[]} */ ([]), keep=/** @type {number[]} */ ([]);
  const put=/** @param {number} d @param {number} y @param {number} m */ function(d,y,m){ open.set(y*GX+cx(d),m); };
  for(let d=M.P0;d<=M.P1;d++){
    for(let y=fr;y<fr+M.PH;y++){ put(d,y,GLUT); plug.push(y*GX+cx(d)); }
    for(let y=fr+M.PH;y<top+6;y++) put(d,y,0);
  }
  for(let d=M.G0;d<M.G0+M.GW;d++){
    const e=d-M.G0, rt=Math.max(0,10-Math.min(e,M.GW-1-e)), y0=top+wave(up,e)+Math.round(rt*rt/10), y1=bot-wave(dn,e)-(e<3?3-e:0);
    for(let y=y0;y<=y1;y++) put(d,y,0);
  }
  for(let d=M.G0+M.GW;d<M.G0+M.GW+M.WALL;d++) for(let y=bot-M.DH+1;y<=bot;y++){ put(d,y,GLUT); door.push(y*GX+cx(d)); nb.add(y*GX+cx(d)); }
  for(let d=M.G0+M.GW+M.WALL;d<M.G0+M.GW+M.WALL+M.NW;d++){
    const e=d-M.G0-M.GW-M.WALL, rt=Math.max(0,6-Math.min(e,M.NW-1-e));
    for(let y=bot-M.NH+1+Math.round(rt*rt/6);y<=bot;y++){ put(d,y,0); nb.add(y*GX+cx(d)); }
  }
  /* Rahmen aus Grundgestein: alles in FR Zellen Abstand um das Offene, aber nicht über dem Boden der Maschine. */
  const dA=M.G0-M.FR, dB=M.G0+M.GW+M.WALL+M.NW+M.FR-1, yB=bot+M.FR;
  const cells=/** @type {number[]} */ ([]);
  for(let y=fr;y<=yB;y++) for(let d=dA;d<=dB;d++){
    const i=y*GX+cx(d);
    if(open.has(i)){ cells.push(i,open.get(i)); continue; }
    let near=false;
    for(let v=-M.FR;v<=M.FR&&!near;v++) for(let u=-M.FR;u<=M.FR;u++) if(open.has((y+v)*GX+cx(d+u))){ near=true; break; }
    if(!near) continue;
    cells.push(i,BED);
    const R=M.FR+1; let nk=false;
    for(let v=-R;v<=R&&!nk;v++) for(let u=-R;u<=R;u++) if(nb.has((y+v)*GX+cx(d+u))){ nk=true; break; }
    if(nk) keep.push(i);
  }
  const xa=cx(dA), xb=cx(dB);
  return {cells:cells,x0:Math.min(xa,xb),x1:Math.max(xa,xb),y0:fr,y1:yB,plug:plug,door:door,keep:keep};
}

/**
 * Orte in der Grotte in Zellen: Spalte der zweiten Rohrwand (vor der Tür), Spalten der Funde (zwei in der Grotte, einer in der Nebenkammer),
 * dazu die Zeile mitten in der Grotte, ab der man nach unten den Boden sucht.
 * @param {RwSpot} sp
 * @returns {{wall: number, door: number, finds: number[], mid: number}}
 */
export function rwSpots(sp){
  const M=RWM, cx=/** @param {number} d */ function(d){ return sp.mc+sp.s*d; }, top=sp.fr+M.PH+sp.dp;
  return {wall:cx(M.G0+M.GW-10),door:cx(M.G0+M.GW),finds:[cx(M.G0+50),cx(M.G0+105),cx(M.G0+M.GW+M.WALL+(M.NW>>1))],mid:top+(M.GH>>1)};
}
/**
 * Passt der Plan ins Gitter? Er muss in erzeugten Spalten liegen und darf keine harte Schicht (Grundgestein, Erdkern, Zonengrenze) und keinen Glutstein überschreiben.
 * Natürliche Höhlen darf er überbauen; ob der Held dort schon war, prüft systems/rohrwand.js über die Nebelkarte.
 * @param {RwPlan} pl
 * @param {(i: number) => number} at Zelle am Index
 * @param {number} gy Zeilen im Gitter
 * @param {number} f erste Spalte, die noch nicht erzeugt ist
 * @returns {boolean}
 */
export function rwFits(pl,at,gy,f){
  if(pl.x0<1||pl.x1>=f-8||pl.y0<1||pl.y1>=gy-4) return false;
  for(let k=0;k<pl.cells.length;k+=2){ const m=at(pl.cells[k]); if(m===BED||m===CORE||m===SHELL||m===GLUT) return false; }
  return true;
}
