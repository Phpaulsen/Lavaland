// Zufall und Rauschen ohne Seiteneffekte. Weltgenerierung nutzt rng(seed) und hash2, Spielzufall bekommt die Quelle als Parameter
// (im Spiel Math.random, im Test ein fester Strom). Bewegt aus legacy.js (PR 3), Funktionskörper unverändert.

/**
 * mulberry32: gleichverteilter Strom in [0, 1) aus einem 32-Bit-Seed.
 * @param {number} seed
 * @returns {() => number}
 */
export function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/**
 * Fester Wert in [0, 1) je Gitterpunkt (ganzzahlige Koordinaten).
 * @param {number} ix
 * @param {number} iy
 * @returns {number}
 */
export function hash2(ix,iy){ let h=Math.imul(ix,374761393)+Math.imul(iy,668265263)|0; h=Math.imul(h^(h>>>13),1274126177); return ((h^(h>>>16))>>>0)/4294967296; }

/**
 * Ganze Zufallszahl von a bis b einschließlich. Ruft rand genau einmal.
 * @param {() => number} rand
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function riWith(rand,a,b){ return a+Math.floor(rand()*(b-a+1)); }

/**
 * Mischt a an Ort und Stelle (Fisher-Yates von hinten) und gibt a zurück. Ruft rand a.length-1 Mal.
 * @template T
 * @param {() => number} rand
 * @param {T[]} a
 * @returns {T[]}
 */
export function shuffleWith(rand,a){ for(let i=a.length-1;i>0;i--){ const j=riWith(rand,0,i), t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
