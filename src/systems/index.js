// Systemschnittstelle (PR 16): Nebensysteme laufen nach update() einmal je Bild, in fester Reihenfolge.
// Schicht systems: darf core/, state/, audio/ und systems/ importieren. Das Fehlerprotokoll (log/) kommt als Parameter errAdd.
// Die Tick-Funktionen stehen noch in legacy.js und werden dort registriert; PR 17–21 holen sie einzeln hierher.
/** @typedef {{ name: string, tick: (dt: number) => void }} System */
/** @type {System[]} */
export const SIDE=[];
/** @param {string} name @param {(dt: number) => void} tick */
export function register(name,tick){ SIDE.push({name:name,tick:tick}); }
/** Fehler je System: nach drei Fehlern bleibt es abgeschaltet, das Spiel läuft weiter. @type {Map<System, number>} */
export const SAFE=new Map();
/** @param {(m: any, w: string) => void} errAdd @param {System} s @param {number} dt */
export function safeWith(errAdd,s,dt){
  const n=SAFE.get(s)||0; if(n>=3) return;
  try{ s.tick(dt); }catch(e){ SAFE.set(s,n+1); const x=/** @type {any} */ (e); errAdd((x&&x.message)||x,s.name+(n+1>=3?' (abgeschaltet)':'')); console.error(e); }
}
