/* ---------- Fehlerprotokoll und fehlende Sprachaufnahmen: Technische Fehler bleiben nur auf diesem Gerät (höchstens 20, gleiche zusammengefasst); Sätze ohne Aufnahme werden gemerkt ---------- */
// PR 29f2. Unverändert aus legacy.js bewegt (gleiche Namen, ohne Port): Die Funktionen lesen nur localStorage und die Schlüssel. legacy.js importiert sie, darum gibt es keinen TDZ-Fehler beim Start.
import { ERRK, K_VMISS } from './keys.js';

export function errLoad(){ try{ const a=JSON.parse(localStorage.getItem(ERRK)||'[]'); return Array.isArray(a)?a.filter(function(e){ return e&&typeof e.m==='string'; }):[]; }catch(_){ return []; } }
/** @param {any} m @param {any} w */
export function errAdd(m,w){
  m=String(m||'Unbekannter Fehler').slice(0,200); w=String(w||'').slice(0,80);
  const a=errLoad(), o=a.find(function(e){ return e.m===m&&e.w===w; });
  if(o){ o.n=(o.n|0)+1; o.t=Date.now(); } else{ a.push({t:Date.now(),m:m,w:w,n:1}); if(a.length>20) a.shift(); }
  try{ localStorage.setItem(ERRK,JSON.stringify(a)); }catch(_){}
}
/** @param {any} t */
export function vcMiss(t){ try{ const a=JSON.parse(localStorage.getItem(K_VMISS)||'[]'); if(!Array.isArray(a)||a.indexOf(t)>=0) return; a.push(String(t).slice(0,300)); localStorage.setItem(K_VMISS,JSON.stringify(a.slice(-40))); }catch(_){} }
