/* ---------- Fortschritt: Höhengrenze der Rakete, nächstes unentdecktes Land, Land mit noch verstecktem Ei ---------- */
// PR 29f2. Unverändert aus legacy.js bewegt (gleiche Namen, ohne Port): skyLim ruft die Weltentstehung schon beim Start, als Import gibt es keinen TDZ-Fehler.
import { SKYL } from '../core/world/const.js';
import { hero } from './game.js';
import { ST } from './facade.js';

export function skyLim(){ return SKYL[hero.rk|0]; }
export function nextLand(){ for(const b of ST.BIO) if(!ST.seen[b.i]) return b; return null; }
export function eggLand(){ for(const b of ST.BIO) if(ST.seen[b.i]&&!ST.eggGot[b.i]&&b.t<12) return b; return null; }
