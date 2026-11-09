// Aktuelle Welt: Erde oder Mond/Planet (realm), ihre Breite und Lage im Gitter, Randspalten. Bewegt aus legacy.js (PR 28e).
// realm, RW, RX0, RC0, RC1 sind export let: legacy.js und die Ports lesen sie als Live-Binding, geschrieben werden sie nur in setRealm.
// Die Weltliste RLM und setPal kommen über den Port RM.
import { WORLD_W, CELL, GX } from '../core/world/const.js';
import { PX0, PMC } from '../core/world/shape.js';

/** @typedef {Record<string, any>} Port */
export let realm='';
export let RW=WORLD_W;
export let RX0=0;
export let RC0=0;
export let RC1=GX;
/** @param {Port} RM */
export function rlmWith(RM){ return realm?RM.RLM[realm]:null; }
/** @param {Port} RM @param {any} id */
export function setRealmWith(RM,id){
  realm=id&&RM.RLM[id]?id:'';
  const R=rlmWith(RM);
  RW=R?R.w:WORLD_W; RX0=R?PX0:0; RC0=Math.floor(RX0/CELL); RC1=Math.min(GX-PMC-1,RC0+Math.round(RW/CELL));
  if(typeof RM.setPal==='function') RM.setPal(R);
}
/* Spalte, deren Boden eine Randspalte zeigt: links das Ende der Welt, rechts der Anfang. */
/** @param {Port} RM @param {any} cx */
export function wcWith(RM,cx){ return !realm?cx:cx<RC0?cx+(RC1-RC0):cx>=RC1?cx-(RC1-RC0):cx; }
