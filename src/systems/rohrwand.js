// Rohrwand (Backlog-Idee 6, Schritt 2): Baut neben jeder Rohr-Maschine einmal Glutstein-Sperre, Schacht, Grotte und Nebenkammer ins Gitter,
// sobald der Held in die Nähe kommt. Nur auf der Erde, nur in schon erzeugten Spalten, nur wo der Held laut Nebelkarte noch nie war und nichts liegt
// (Maschinen, Räume, Tiere, Funde, Fahrzeuge, Schienen, Aufzug). Findet sich kein Platz, bleibt die Maschine, wie sie ist.
// Zufall: eigener Strom je Ort aus Welt-Nummer und Maschinen-id, kein Math.random.
// Schritt 4: Lösen wirkt (rwSolvedWith). Erste Wand: Wasser auf die Sperre, Grotte offen, Rahmen wird Fels, zwei Funde. Zweite Wand: Tür offen, ein Fund in der Nebenkammer. Später: Wasser läuft nach.
import { grid } from '../state/world.js';
import { lifeS, waterCount } from '../state/sim.js';
import { setCell } from '../state/queries.js';
import { ST } from '../state/facade.js';
import { rw } from '../state/rohrwand.js';
import { CELL, TOP, GX, GY, ROCK, WATER, GLUT, BED, MAX_WATER } from '../core/world/const.js';
import { LIFTX } from '../core/world/shape.js';
import { P, parked } from '../state/game.js';
import { rng } from '../core/rng.js';
import { rwPlan, rwFits, rwBox, rwSpots, RWDEPTH } from '../core/world/rohrwand.js';

/** @typedef {Record<string, any>} Port */

/** Schalter für den Einbau (seit Schritt 4 an). */
export const RWON={on:true};
let rwT=0;

/** Eigener Zufallsstrom je Ort. @param {number} seed @param {string} id @param {{s: number, dp: number}} sp @returns {() => number} */
export function rwRand(seed,id,sp){ let h=seed|0; for(let k=0;k<id.length;k++) h=Math.imul(h,31)+id.charCodeAt(k)|0; return rng(Math.imul(h,97)+sp.s*7+sp.dp*131); }
/** Bodenzeile unter der Maschine: erste feste Zelle ab ihrer Fußhöhe. @param {any} m @returns {number} */
function floorRow(m){
  const mc=Math.floor(m.x/CELL); let r=Math.floor((m.y-TOP)/CELL)-1;
  for(let k=0;k<8&&r<GY-1&&grid[r*GX+mc]<4;k++) r++;
  return r;
}
/** Liegt etwas im Kasten (Zellen x0…x1, y0…y1), das nicht überbaut werden darf? @param {Port} RP @param {any} m @param {{x0: number, x1: number, y0: number, y1: number}} pl @returns {boolean} */
function blocked(RP,m,pl){
  const X0=pl.x0*CELL-12, X1=(pl.x1+1)*CELL+12, Y0=TOP+pl.y0*CELL-12, Y1=TOP+(pl.y1+1)*CELL+12;
  const inB=/** @param {any} x @param {any} y */ function(x,y){ return x>=X0&&x<=X1&&y>=Y0&&y<=Y1; };
  const any=/** @param {any[]} a @param {(o: any) => boolean} f */ function(a,f){ return !!a&&a.some(f); };
  if(LIFTX+80>X0&&LIFTX-80<X1) return true;
  /* Nebelkarte: Wo der Held schon war, könnte er gegraben oder gebaut haben. */
  const fa=RP.fogArr(), F=RP.FGT;
  for(let ty=Math.floor(pl.y0/F);ty<=Math.floor(pl.y1/F);ty++) for(let tx=Math.floor(pl.x0/F);tx<=Math.floor(pl.x1/F);tx++) if(RP.fogHas(fa,tx,ty)) return true;
  if(any(RP.MACH,function(q){ return q!==m&&inB(q.x,q.y); })) return true;
  if(any(ST.STR,function(q){ return q.k==='room'&&Math.abs(q.x-m.x)>1&&inB(q.x,q.y); })) return true;
  if(any(RP.VAULTS,function(q){ return inB(q.x,q.fy); })) return true;
  if(any(RP.MATS,function(q){ return !ST.matGot[q.id]&&inB(q.x,q.y); })) return true;
  for(const a of [ST.CRE,ST.PADS,ST.EGGS,ST.LOOT,ST.props,ST.hidden,RP.ZDEC]) if(any(a,function(q){ return inB(q.x,q.y); })) return true;
  for(const k in parked){ const o=parked[k]; if(o&&inB(o.x,o.y)) return true; }
  if(any(ST.tracks,function(T){ return T.pts.some(/** @param {any} q */ function(q){ return inB(q[0],q[1]); }); })) return true;
  if(any(ST.zips,function(z){ return inB(z.a[0],z.a[1])||inB(z.b[0],z.b[1]); })) return true;
  return false;
}
/**
 * Versucht den Einbau an einer Maschine. Ergebnis: der Ort, null (kein Platz, endgültig) oder 'wait' (der Held steht im Weg, später noch einmal).
 * @param {Port} RP Port: SEED, genF, MACH, MATS, VAULTS, ZDEC, fogArr, fogHas, FGT
 * @param {any} m Maschine
 * @returns {any}
 */
export function rwBuildWith(RP,m){
  if(rw[m.id]) return null;
  const mc=Math.floor(m.x/CELL), fr=floorRow(m), at=/** @param {number} i */ function(i){ return grid[i]; };
  const pc=Math.floor(P.x/CELL), pr=Math.floor((P.y-2-TOP)/CELL);
  let wait=false;
  for(const dp of RWDEPTH) for(const s of [1,-1]){
    const sp={mc:mc,fr:fr,s:s,dp:dp}, bx=rwBox(sp);
    if(bx.x0<1||bx.x1>=RP.genF-8||bx.y1>=GY-4||blocked(RP,m,bx)) continue;
    const pl=rwPlan(sp,rwRand(RP.SEED,m.id,sp));
    if(!rwFits(pl,at,GY,RP.genF)) continue;
    if(pc>=pl.x0-4&&pc<=pl.x1+4&&pr>=pl.y0&&pr<=pl.y1+4){ wait=true; continue; }
    for(let k=0;k<pl.cells.length;k+=2){ const i=pl.cells[k]; grid[i]=pl.cells[k+1]; lifeS(i,0); }
    rw[m.id]={mc:mc,fr:fr,s:s,dp:dp,st:0};
    return sp;
  }
  if(wait) return 'wait';
  rw[m.id]={no:1};
  return null;
}
/** Plan eines gebauten Orts neu rechnen (gleicher Zufallsstrom wie beim Einbau). @param {Port} RP @param {any} m @param {any} o */
function planOf(RP,m,o){ const sp={mc:o.mc,fr:o.fr,s:o.s,dp:o.dp}; return {sp:sp,pl:rwPlan(sp,rwRand(RP.SEED,m.id,sp))}; }
/** Erste feste Zeile ab Zeile r nach unten in Spalte c. @param {number} c @param {number} r */
function floorBelow(c,r){ for(let k=0;k<80&&r<GY-1&&grid[r*GX+c]<4;k++) r++; return r; }
/** Wasser in leere Zellen eines Felds setzen, höchstens n. @param {number[]} idx @param {number} n */
function pour(idx,n){
  let k=0;
  for(const i of idx){ if(k>=n||waterCount>=MAX_WATER-50) break; if(grid[i]===0){ const y=(i/GX)|0; setCell(i-y*GX,y,WATER,0); k++; } }
  return k;
}
/** Funde an Spalten legen: Fundarten, die im Album noch fehlen, zuerst; Zufall aus eigenem Strom. @param {Port} RP @param {any} m @param {number[]} cols @param {number} row @param {string} tag */
function hide(RP,m,cols,row,tag){
  const r=rwRand(RP.SEED,m.id+tag,{s:0,dp:0}), pool=RP.FINDS.filter(/** @param {any} f */ function(f){ return f[3]!=='space'&&f[3]!=='moon'&&f[3]!=='core'; });
  for(let i=pool.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)), t=pool[i]; pool[i]=pool[j]; pool[j]=t; }
  pool.sort(/** @param {any} a @param {any} b */ function(a,b){ return (ST.found[a[0]]?1:0)-(ST.found[b[0]]?1:0); });
  cols.forEach(function(c,k){
    const f=pool[k%pool.length], fy=floorBelow(c,row);
    ST.hidden.push({id:f[0],e:f[1],name:f[2],zone:'cave',x:(c+.5)*CELL,y:TOP+fy*CELL-14,hint:true,tree:-1,got:false,rw:m.id});
  });
}
/** Ort der zweiten Rohrwand (vor der Tür zur Nebenkammer), in Weltpixeln. @param {any} m @returns {{x: number, y: number, s: number}|null} */
export function rwDoorAt(m){
  const o=rw[m.id]; if(!o||o.mc===undefined) return null;
  const q=rwSpots({mc:o.mc,fr:o.fr,s:o.s,dp:o.dp});
  return {x:(q.wall+.5)*CELL,y:TOP+floorBelow(q.wall,q.mid)*CELL,s:o.s};
}
/**
 * Eine Rohrwand ist gelöst. k 0: Wand an der Maschine, k 1: Wand vor der Tür.
 * @param {Port} RP Port: SEED, FINDS, scanMobile
 * @param {any} m Maschine
 * @param {number} k
 * @returns {string} Satz für den Helden (leer, wenn nichts Neues aufging); die Oberfläche sagt ihn nach dem Lob der Maschine
 */
export function rwSolvedWith(RP,m,k){
  const o=rw[m.id]; if(!o||o.mc===undefined) return '';
  const {sp,pl}=planOf(RP,m,o);
  if(k===0&&!o.st){
    const keep=new Set(pl.keep);
    for(let j=0;j<pl.cells.length;j+=2){ const i=pl.cells[j]; if(grid[i]===BED&&pl.cells[j+1]===BED&&!keep.has(i)) grid[i]=ROCK; }
    for(const i of pl.plug) if(grid[i]===GLUT){ grid[i]=0; lifeS(i,0); }
    pour(pl.plug,pl.plug.length);
    o.st=1; RP.scanMobile();
    const q=rwSpots(sp); hide(RP,m,q.finds.slice(0,2),q.mid,'a');
    return 'Das Wasser hat die Glut gelöscht! Unten wartet eine große Höhle.';
  }else if(k===1&&o.st===1){
    for(let j=0;j<pl.cells.length;j+=2){ const i=pl.cells[j]; if(grid[i]===BED&&pl.cells[j+1]===BED) grid[i]=ROCK; }
    for(const i of pl.door) if(grid[i]===GLUT){ grid[i]=0; lifeS(i,0); }
    pour(pl.door,8);
    o.st=2; RP.scanMobile();
    const q=rwSpots(sp); hide(RP,m,q.finds.slice(2),q.mid,'b');
    return 'Die zweite Tür ist offen! Dahinter liegt noch eine Kammer.';
  }else if(k===0){
    /* Wieder gelöst: Es läuft noch einmal Wasser durch die Sperre hinunter. */
    pour(pl.plug,14); RP.scanMobile();
  }
  return '';
}
/** Alle halbe Sekunde: Rohr-Maschinen in der Nähe, die noch keinen Ort haben. @param {Port} RP @param {number} dt */
export function rwTickWith(RP,dt){
  if(!RWON.on||RP.realm) return;
  rwT-=dt; if(rwT>0) return; rwT=.5;
  for(const m of RP.MACH) if(m.t==='rohre'&&!rw[m.id]&&m.y===m.y&&m.y>-3000&&Math.abs(P.x-m.x)<1800&&Math.abs(P.y-m.y)<1400){ rwBuildWith(RP,m); return; }
}
/** @param {Port} RP @returns {import('./index.js').System[]} */
export function rohrWith(RP){
  return [
    {name:'rohrTick',tick:/** @param {any} dt */ function(dt){ rwTickWith(RP,dt); }},
  ];
}
