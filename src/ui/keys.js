/* ---------- Tastenkürzel und Wischen: Kürzel für dieselben Knöpfe wie in der Leiste; Wischen nur, wo ein Fenster mehr Inhalt als Platz hat ---------- */
// PR 29g1. Bewegt aus legacy.js. Knöpfe, Modus und Werkzeug kommen über den Port KY; die Handler stehen seit 29g2c in keysBindWith (Port KB).
// app/wire.js ruft beide Funktionen über Einzeiler.
import { P, keys } from '../state/game.js';
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
/* Tastatur, Fokus, Kontextmenü und Wischen verdrahten. PR 29g2c: Die Anweisungen auf oberster Ebene aus legacy.js stehen unverändert in keysBindWith, app/wire.js ruft es an der alten Stelle; alles aus legacy.js kommt über den Port KB. */
/** @param {Port} KB */
export function keysBindWith(KB){
/** @type {Record<string, string>} */
const keymap={ArrowLeft:'l',ArrowRight:'r',ArrowUp:'u',ArrowDown:'d',a:'l',d:'r',w:'u',s:'d'};
window.addEventListener('keydown',function(e){
  if(KB.qcur&&KB.qcur.pad&&!KB.$('quiz').hidden){
    if(/^[0-9]$/.test(e.key)){ KB.padKey(e.key); e.preventDefault(); return; }
    if(e.key==='Backspace'){ KB.padKey('del'); e.preventDefault(); return; }
    if(e.key==='Enter'){ KB.padKey('ok'); e.preventDefault(); return; }
  }
  /* Escape schließt die Aufgabe wie das X, sonst bliebe das Spiel pausiert. */
  if(e.key==='Escape'&&!KB.$('quiz').hidden){ KB.closeQuiz(); return; }
  if(e.key==='Escape'){ document.querySelectorAll('.ov').forEach(function(o){ /** @type {any} */ (o).hidden=true; }); KB.pzClose(); return; }
  if(ST.paused||KB.uiOpen()||(e.target&&/** @type {any} */ (e.target).tagName==='BUTTON'&&e.key==='Enter')) return;
  const k=keymap[e.key];
  if(k){ if(!e.repeat) KB.keyTap(k); /** @type {any} */ (keys)[k]=true; e.preventDefault(); }
  else if(e.key===' '){ if(!e.repeat){ keys.a=true; KB.doAction(); } e.preventDefault(); }
  else if(!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey) KB.keyShort(e.key.toLowerCase());
});
window.addEventListener('keyup',function(e){ const k=keymap[e.key]; if(k) /** @type {any} */ (keys)[k]=false; if(e.key===' ') keys.a=false; });
window.addEventListener('blur',function(){ keys.l=keys.r=keys.u=keys.d=keys.a=false; });
document.addEventListener('contextmenu',function(e){ e.preventDefault(); });
document.addEventListener('touchmove',function(e){ if(!KB.canScroll(e.target)) e.preventDefault(); },{passive:false});
document.addEventListener('gesturestart',function(e){ e.preventDefault(); });
}
