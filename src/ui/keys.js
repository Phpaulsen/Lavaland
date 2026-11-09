/* ---------- Tastenkürzel und Wischen: Kürzel für dieselben Knöpfe wie in der Leiste; Wischen nur, wo ein Fenster mehr Inhalt als Platz hat ---------- */
// PR 29g1. Bewegt aus legacy.js. Die Handler bleiben vorerst in legacy.js; Knöpfe, Modus und Werkzeug kommen über den Port KY.
// legacy.js ruft beide Funktionen über Einzeiler.
import { P } from '../state/game.js';
import { ST } from '../state/facade.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} KY @param {any} k */
export function keyShortWith(KY,k){
  if(k==='x'){ if(P.mode!=='walk') KY.setMode('walk'); else if(ST.tool) KY.setTool(null,true); return; }
  if(k==='?'||k==='h'){ KY.banner('⌨️ F Fahrzeuge · T Werkzeug · K Karte · E Aufgabe · B Buch · M Menü · X Aussteigen',4200); return; }
  const el=KY.SHORT[k]&&KY.$(KY.SHORT[k]);
  if(el&&!el.hidden&&el.offsetParent) el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'}));
}
// Wischen bleibt gesperrt, damit die Seite beim Spielen nicht wackelt. Ausnahme: ein Fenster hat mehr Inhalt als Platz (Elternansicht, Rechentafel, Karte, Fenster im Querformat).
/** @param {Port} KY @param {any} n */
export function canScrollWith(KY,n){
  for(;n&&n.nodeType===1&&n!==document.body;n=n.parentElement){
    if(n.scrollHeight>n.clientHeight+1||n.scrollWidth>n.clientWidth+1){
      const cs=getComputedStyle(n);
      if(n.scrollHeight>n.clientHeight+1&&/auto|scroll/.test(cs.overflowY)) return true;
      if(n.scrollWidth>n.clientWidth+1&&/auto|scroll/.test(cs.overflowX)) return true;
    }
  }
  return false;
}
