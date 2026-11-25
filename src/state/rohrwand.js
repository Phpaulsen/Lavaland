// Rohrwand-Orte der aktuellen Welt (Backlog-Idee 6): je Maschinen-id {mc, fr, s, dp, st} (gebaut, st 0 = verschlossen) oder {no: 1} (kein Platz, Maschine bleibt Fenster-Rätsel).
// Liegt im Spielstand der Welt unter dem neuen Feld rw, zusammen mit dem Gitter, damit beides immer zusammen gespeichert wird.
/** @type {Record<string, any>} */
export let rw={};
/** @param {Record<string, any>} v */
export function setRw(v){ rw=v; }
