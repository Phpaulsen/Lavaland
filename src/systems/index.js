// Systemschnittstelle (PR 16): Nebensysteme laufen nach update() einmal je Bild, in fester Reihenfolge.
// Schicht systems: darf core/, state/, audio/ und systems/ importieren. Das Fehlerprotokoll (log/) kommt als Parameter errAdd.
// Die Tick-Funktionen stehen noch in legacy.js und werden dort registriert; PR 17–21 holen sie einzeln hierher.
/** Ebenen in draw(), von hinten nach vorn: 'back' (nach den Seilrutschen), 'mid' (nach dem Fernrohr), 'mob' (direkt danach), 'glow' (nach der Dunkelheit).
 * @typedef {'back' | 'mid' | 'mob' | 'glow'} Layer
 * @typedef {{ name: string, tick: (dt: number) => void, draw?: (ctx: CanvasRenderingContext2D, layer: Layer, x0: number, x1: number) => void }} System */
/** @type {System[]} */
export const SIDE=[];
/** @param {string} name @param {System['tick']} tick @param {System['draw']} [draw] */
export function register(name,tick,draw){ SIDE.push(draw?{name:name,tick:tick,draw:draw}:{name:name,tick:tick}); }
/* Zeichnet eine Ebene: alle Systeme mit draw in der Reihenfolge von SIDE. Ohne Fehlerschutz, wie vorher: Ein Fehler beim Zeichnen fängt frame(). */
/** @param {CanvasRenderingContext2D} ctx @param {Layer} layer @param {number} x0 @param {number} x1 */
export function drawLayer(ctx,layer,x0,x1){ for(const s of SIDE) if(s.draw) s.draw(ctx,layer,x0,x1); }
/** Fehler je System: nach drei Fehlern bleibt es abgeschaltet, das Spiel läuft weiter. @type {Map<System, number>} */
export const SAFE=new Map();
/** @param {(m: any, w: string) => void} errAdd @param {System} s @param {number} dt */
export function safeWith(errAdd,s,dt){
  const n=SAFE.get(s)||0; if(n>=3) return;
  try{ s.tick(dt); }catch(e){ SAFE.set(s,n+1); const x=/** @type {any} */ (e); errAdd((x&&x.message)||x,s.name+(n+1>=3?' (abgeschaltet)':'')); console.error(e); }
}
