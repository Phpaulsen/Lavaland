/* ---------- Bedienung: Tastenbilder einsetzen, Tippen und Halten, linke oder rechte Hand, Vollbild, Bombenzahl im HUD ---------- */
// PR 27a. Bewegt aus legacy.js. Die Tastenbilder (IC, QI, AI), die Listen der Fahrzeuge und Werkzeuge und alle Handler bleiben in legacy.js.
// Was die Bedienung vom übrigen Spiel braucht, kommt über den Port CT.
import { hero, keys } from '../state/game.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} CT */
export function hudLootWith(CT){
  CT.$('tnt-n').textContent=String(hero.tnt); CT.$('tnt-n').hidden=hero.tnt<=0;
}
/** @param {Port} CT @param {any} inner */
export function svg24With(CT,inner){ return '<svg viewBox="0 0 24 24" aria-hidden="true">'+inner+'</svg>'; }
/** @param {Port} CT @param {any} el */
export function armGhostWith(CT,el){ CT.ghostEl=el; }
/** @param {Port} CT @param {any} el @param {any} fn */
export function tapWith(CT,el,fn){
  el.addEventListener('pointerdown',/** @param {any} e */ function(e){ e.preventDefault(); armGhostWith(CT,el); fn(e); });
  el.addEventListener('keydown',/** @param {any} e */ function(e){ if(e.key==='Enter'){ e.preventDefault(); fn(e); } });
}
/** @param {Port} CT @param {any} id @param {any} k */
export function holdWith(CT,id,k){
  const el=CT.$(id);
  const dn=/** @param {any} e */ function(e){ e.preventDefault(); try{el.setPointerCapture(e.pointerId);}catch(_){} /** @type {any} */ (keys)[k]=true; el.classList.add('down'); CT.keyTap(k); };
  const up=function(){ /** @type {any} */ (keys)[k]=false; el.classList.remove('down'); };
  el.addEventListener('pointerdown',dn); el.addEventListener('pointerup',up);
  el.addEventListener('pointercancel',up); el.addEventListener('lostpointercapture',up);
}
/** @param {Port} CT */
export function syncHandWith(CT){ document.body.classList.toggle('lefty',CT.lefty); CT.$('hand').innerHTML='<span style="font-size:34px;display:inline-block;transform:scaleX('+(CT.lefty?-1:1)+')" aria-hidden="true">🫲</span>'; CT.$('hand').setAttribute('aria-pressed',String(CT.lefty)); }
/** @param {Port} CT */
export function fsOnWith(CT){ return !!(document.fullscreenElement||/** @type {any} */ (document).webkitFullscreenElement); }
/** @param {Port} CT */
export function fsSyncWith(CT){ const on=fsOnWith(CT); CT.$('fs').innerHTML=svg24With(CT,on?CT.QI.fsx:CT.QI.fs); CT.$('fs').setAttribute('aria-pressed',String(on)); }
/** @param {Port} CT */
export function fsToggleWith(CT){
  try{
    if(fsOnWith(CT)){ (document.exitFullscreen||/** @type {any} */ (document).webkitExitFullscreen).call(document); return; }
    const p=(CT.DE.requestFullscreen||CT.DE.webkitRequestFullscreen).call(CT.DE,{navigationUI:'hide'});
    if(p&&p.catch) p.catch(function(){ CT.flash('fs','warn'); });
    CT.$('menu').hidden=true;
  }catch(_){ CT.flash('fs','warn'); }
}
