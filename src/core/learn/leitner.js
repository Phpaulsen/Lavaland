// Leitner-Regeln ohne Speicher und Uhr: Konstanten, Stufenaufstieg, Schulstand-Filter, Abwechslung, Ruhen nach Fehlern. Bewegt aus legacy.js (PR 6).
// Gelesener und geschriebener Zustand (FS, SCH, kindHist) kommt als Parameter; legacy.js übergibt ihn über Einzeiler zur Aufrufzeit.
// Fachwechsel (factDone), Auswahl (pickFact0) und MBOX bleiben in legacy.js, siehe migration-plan.md PR 6.
import { STAGES, fDom, fKind } from './facts.js';

/**
 * @typedef {{v: number, u: Record<string, number>, f: Record<string, number[]>, nd: number, nn: Record<string, number>, ft: Record<string, number>, dm?: {d: number, c: Record<string, number>}, mg?: Record<string, number>}} FactStore
 * Lernstand (localStorage lavaland-facts). u: offene Stufe je Fachgebiet, f: [Fach, fällig am Tag] je Fakt, nd/nn: neue Fakten heute,
 * ft: schnelle Treffer in Folge (Einstufung), dm: Fehler heute je Fakt, mg: schon vergebene Meistersteine.
 */
/** @typedef {{on: boolean, zr: number, l: string}} School Schulstand: an, Zahlenraum 0–3, schon gelernte Buchstaben */

/** Tage bis zur nächsten Fälligkeit je Fach; Grenze neuer Fakten am Tag; schnell in ms; Fehler am Tag, nach denen ein Fakt ruht. */
export const BOXD=[0,0,1,2,4,8], NEWDAY=12, FASTMS=3000, DAYMISS=3;
/** Darf ein neuer Fakt der Stufe s nach dem Schulstand kommen? @param {School} SCH @param {string} k @param {number} s @returns {boolean} */
export function schoolOkWith(SCH,k,s){
  if(!SCH.on) return true;
  if(fDom(k)==='m') return s<=SCH.zr;
  if(k.indexOf('syl:')===0||k.indexOf('rhy:')===0) return true;
  const v=k.slice(k.indexOf(':')+1).toUpperCase();
  if(k.indexOf('word:')===0) return v.split('').every(function(c){ return SCH.l.indexOf(c)>=0; });
  return SCH.l.indexOf(v.charAt(0))>=0;
}
/* Eine Stufe öffnet die nächste, wenn 60 % ihrer Fakten mindestens in Fach 2 sind, oder sofort, wenn die letzten vier neuen Fakten alle auf Anhieb und schnell saßen (Einstufung). */
/** @param {FactStore} FS wird verändert (u, ft) @param {import('./facts.js').Domain} d @returns {void} */
export function fUnlockWith(FS,d){
  const S=STAGES[d], top=FS.u[d];
  if(top>=S.length-1) return;
  const st=S[top]; let n=0;
  st.forEach(function(k){ const r=FS.f[k]; if(r&&r[0]>=2) n++; });
  if(n>=st.length*.6||FS.ft[d]>=4){ FS.u[d]=top+1; FS.ft[d]=0; }
}
/**
 * Bevorzugt eine andere Aufgabenart als die letzte.
 * @param {() => number} rand Zufallsquelle in [0, 1) (im Spiel Math.random)
 * @param {string[]} kindHist letzte Aufgabenarten, neueste vorn
 * @param {string[]} a Kandidaten
 * @returns {string[]}
 */
export function mixPreferWith(rand,kindHist,a){
  if(kindHist.length<2||kindHist[0]!==kindHist[1]) { const o=a.filter(function(k){ return fKind(k)!==kindHist[0]; }); return o.length&&rand()<.5?o:a; }
  const o=a.filter(function(k){ return fKind(k)!==kindHist[0]; });
  return o.length?o:a;
}
/** Ruht der Fakt heute nach zu vielen Fehlern? @param {FactStore} FS @param {string} k @param {number} today Tagesnummer @returns {boolean} */
export function fParkedWith(FS,k,today){ return !!FS.dm&&FS.dm.d===today&&FS.dm.c[k]>=DAYMISS; }
