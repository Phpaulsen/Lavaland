/* ---------- Einstellungen und Leuchtmarken: Elternoptionen und Stimme speichern, Leuchtmarken der Welt laden ---------- */
// PR 29g1. Bewegt aus legacy.js. Zustand (OPT, MKS) bleibt vorerst in app/wire.js und kommt über den Port PF; VOICE über den Port (Schichtregel).
// app/wire.js ruft alle Funktionen über Einzeiler.
import { K_OPT, K_VOICE } from './keys.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} PF */
export function optSaveWith(PF){ try{ localStorage.setItem(K_OPT,JSON.stringify(PF.OPT)); }catch(_){} }
/** @param {Port} PF */
export function voiceSaveWith(PF){ try{ localStorage.setItem(K_VOICE,JSON.stringify(PF.VOICE)); }catch(_){} }
/** @param {Port} PF */
export function marksLoadWith(PF){
  const k=PF.mkKey(); if(PF.MKS[k]) return PF.MKS[k];
  let a=[]; try{ a=JSON.parse(localStorage.getItem(k)||'[]'); }catch(_){}
  if(!Array.isArray(a)) a=[];
  PF.MKS[k]=a.filter(function(m){ return Array.isArray(m)&&isFinite(m[0])&&isFinite(m[1]); }).slice(0,PF.MKMAX);
  return PF.MKS[k];
}
