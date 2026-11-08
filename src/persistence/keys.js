// Namen der Speicherplätze an einer Stelle. Bewegt aus legacy.js (PR 11). Die Werte sind wörtlich die alten:
// Ein anderer Name hieße, dass ein Kind seinen Spielstand verliert. „Spielstand sichern“ nimmt nur Schlüssel mit, die mit lavaland anfangen.

/* localStorage */
export const K_HERO='lavaland-hero';
export const K_FINDS='lavaland-finds';
export const K_STARS='lavaland-stars';
export const K_SKILL='lavaland-skill';
export const K_FACTS='lavaland-facts';
export const K_SCHOOL='lavaland-school';
export const K_LIMIT='lavaland-limit';
export const K_DAY='lavaland-day';
export const K_REALM='lavaland-realm';
export const K_FOG='lavaland-fog';
export const K_MARKS='lavaland-marks';
export const K_MUTE='lavaland-mute';
export const K_LEFTY='lavaland-lefty';
export const K_PSST='lavaland-psst';
export const K_NEWS='lavaland-news';
export const K_BAK_AT='lavaland-bak-at';
export const K_VOICE='lavaland-voice';
export const K_VMISS='lavaland-vmiss';
export const K_OPT='lavaland-opt';
/* Fehlerprotokoll (Elternansicht) und Missionen */
export const ERRK='lavaland-err';
export const MISK='lavaland-mis';

/* IndexedDB lavaland, Ablage save */
/* Der Spielstand liegt unter 'world2'. Unter 'world' bleibt der letzte Stand im alten Format liegen, falls eine ältere Spielversion ihn noch braucht. */
export const SAVEKEY='world2';
/** @param {string} id @returns {string} */
export function realmKey(id){ return id?'planet-'+id:SAVEKEY; }
