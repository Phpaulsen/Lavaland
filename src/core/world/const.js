// Feste Größen der Welt und reine Höhenfunktionen. Bewegt aus legacy.js (PR 4): Sektion „Welt“ ohne Gitter, Zonen und alles,
// was die Weltgenerierung später überschreibt (g0, ground, grid, stamp, LIFE, zS*, grow0, r*), dazu die Konstanten aus „Große Welt“.
// Text unverändert, nur export davor und JSDoc-Typen für tsc. Was hier steht, schreibt niemand (analyze.mjs: keine Schreiber außerhalb).

/* Die Heimat ist 7200 breit. Dahinter liegen die fremden Länder. Nach unten reicht die Welt dreimal so tief wie früher. */
export const HOME_W=7200, HOME_GX=1200, WORLD_W0=57600, WORLD_W=115200, CELL=6, GX=WORLD_W/CELL, GY=2048, GY0=686, KEEPR=626, WINW=420, SW=2*WINW+9, ROWW=320, SH=14, TOP=-912, VOLC=2700, G=900, TAU=6.2832;
/* Schichten nach unten: Erde, Fels, Tiefengestein, heißes Gestein, Erdkern. Gold und Edelsteine stecken im Gestein. */
export const LAVA=1, FIRE=2, WATER=3, EARTH=4, ROCK=5, ICE=6, WOOD=7, BED=8, DEEP=9, HOT=10, CORE=11, GOLD=12, GEM=13, SNOW=14, SHELL=15;
export const MAX_LAVA=7000, MAX_WATER=30000, MAX_FIRE=1400;
export const SKY_TOP=-5600, SKYL=[-5600,-12000,-22000,-32000], SKY_END=-32000, MOON={x:3600,y:-4400,r:250}, STALL_X=905;
export const SITE={build:3700, smash:4090, fire:4470, pond:4960, volb:5580, chest:6300};
/** @type {(keyof typeof SITE)[]} */
export const FLAT=['build','smash','fire','pond','volb'];

/** @param {number} v @param {number} a @param {number} b @returns {number} */
export function clamp(v,a,b){return v<a?a:v>b?b:v}
/** Grundform der Heimat (ohne Vulkan und Plätze). @param {number} x @returns {number} */
export function baseG(x){return 55*Math.sin(x*0.0021+1)+30*Math.sin(x*0.0057+2.2)+10*Math.sin(x*0.013)}
/** Vulkan bei VOLC. @param {number} x @returns {number} */
export function bump(x){const d=x-VOLC;return -430*Math.exp(-(d*d)/144400)+125*Math.exp(-(d*d)/4900)}
/** @type {Record<string, number>} */
export const siteY={};
for(const k of FLAT) siteY[k]=TOP+24*Math.round((baseG(SITE[k])-TOP)/24);
/** Bodenhöhe der Heimat mit Vulkan, ebenen Plätzen und Teich. @param {number} x @returns {number} */
export function rawH(x){
  let g=baseG(x)+bump(x);
  for(const k of FLAT){
    const d=Math.abs(x-SITE[k]);
    if(d<230){ let w=d<140?1:1-(d-140)/90; w=w*w*(3-2*w); g+=(siteY[k]-g)*w; }
  }
  const dp=x-SITE.pond; g+=62*Math.exp(-(dp*dp)/10000);
  return g;
}

/* Aus „Große Welt“: Grenze zu den fremden Ländern, Ende der Heimat, Wasserlinie. */
export const B0=8760, EXT_X=B0-220, EXC=Math.floor(EXT_X/CELL), HOME_END=1400, WL=14, WLR=Math.floor((WL-TOP)/CELL);
