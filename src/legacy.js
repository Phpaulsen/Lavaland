// @ts-nocheck
import { SIDE, register, safeWith, drawLayer } from './systems/index.js';
import { rng, hash2, riWith, shuffleWith } from './core/rng.js';
import { HOME_W, HOME_GX, WORLD_W0, WORLD_W, CELL, GX, GY, GY0, KEEPR, WINW, SW, ROWW, SH, TOP, VOLC, G, TAU, LAVA, FIRE, WATER, EARTH, ROCK, ICE, WOOD, BED, DEEP, HOT, CORE, GOLD, GEM, SNOW, SHELL, MAX_LAVA, MAX_WATER, MAX_FIRE, SKY_TOP, SKYL, SKY_END, MOON, STALL_X, SITE, FLAT, clamp, baseG, bump, siteY, rawH, B0, EXT_X, EXC, HOME_END, WL, WLR } from './core/world/const.js';
import { idxs } from './core/puzzles/util.js';
import { tkKey, mkMusterWith } from './core/puzzles/muster.js';
import { mkSternWith } from './core/puzzles/stern.js';
import { mkSpiegelWith } from './core/puzzles/spiegel.js';
import { RBD, mkRoboWith } from './core/puzzles/robo.js';
import { mkWaageWith } from './core/puzzles/waage.js';
import { mkEchoWith } from './core/puzzles/echo.js';
import { rhFlow, rhDone, mkRohreWith } from './core/puzzles/rohre.js';
import { sdOk, mkSudokuWith } from './core/puzzles/sudoku.js';
import { WORDS, SYL, RHYW, CASES, STAGES, fDom, fStage, fKind, fName } from './core/learn/facts.js';
import { BOXD, NEWDAY, FASTMS, schoolOkWith, fUnlockWith, mixPreferWith, fParkedWith } from './core/learn/leitner.js';
import { mkQWith, mkSeqWith } from './core/learn/tasks.js';
import { g0, grid, stamp, LIFE, zS1, z4, zS2, zS3, grow0, rA, rB, rD, rH, rC, mtop, bio, bio2, bmx, bix, noCave, liqM, liqY } from './state/world.js';
import { ST } from './state/facade.js';
import { hero, P, parked, cam, pan, keys } from './state/game.js';
import { ERRK, SAVEKEY, K_HERO, K_FINDS, K_SKILL, K_FACTS, K_SCHOOL, K_LIMIT, K_DAY, K_REALM, K_FOG, K_MARKS, K_MUTE, K_LEFTY, K_NEWS, K_BAK_AT, K_VOICE, K_VMISS, K_OPT, realmKey } from './persistence/keys.js';
import { idbOpen, idbDoWith } from './persistence/db.js';
import { packRunsWith, unpackRunsWith, runsOk } from './core/world/pack.js';
import { bx0, bx1, by0, by1, lavaCount, waterCount, fireCount, tick, sx0, winR, rx0, rx1, qx0, qx1, px0, px1, py0, py1, winC, ext, extI, react, cellAt, hotAt, lifeS, put, stepWith, scanMobileWith, steamWith } from './state/sim.js';
import { winterColWith, carveCaveWith, carveCircleWith, carvePathWith, fillBlockWith, rawXWith, rawGWith, layoutWith, addTreeWith, addCreWith, populateWith, zoneColsWith, shapeWorldWith, blkWith, buildWith, genColWith, genWith, makeTrackWith, deepWorldWith, deepFarWith, planetDeepWith, vaultPlanWith } from './core/world/gen.js';
import { SNX, SL0, PEAK, BACK, BEND, MH, SNB, CHX, CAVE, SNC0, SNC1, msurf, vnoise, inGrid, ellipse, PX0, PM, PMC, LANDX, PADH, BT, sm, colOf, hBio, craters, roomY, vFloor, WSX, LIFTX, SEA_T, SEA_L, SEA_B, HOUSE, FH } from './core/world/shape.js';
import { BAK_DBS, BAK_ST, BAK_MAX, TYPED, BADK, bakOk, b64, unb64, enc, dec, dbDump, dbLoad, bakMakeWith, bakLoadWith } from './persistence/transfer.js';
import { K_ALIVE, logWith } from './log/log.js';
import { snapshotWith, saveGameWith, autosaveWith, packStartWith, packStepWith, saveHeroWith, saveFindsWith, saveFactsWith } from './persistence/save.js';
import { AU, audio, jingle, VRATES, VOICE, voicesDe, VCLIP, speakStop, synth, speakWith, blip, sfx, tone } from './audio/sound.js';
import { sightsWith, METS, MROCKS, FLIES, JAR } from './systems/sights.js';
import { mobsWith, shootWith, monStrikeWith, ARROWS, MONS } from './systems/mobs.js';
import { creHitWith, creTickWith, drawCresWith, throws } from './systems/creatures.js';
import { pickTickWith, padsTickWith, secretsTickWith } from './systems/finds.js';
import { worldWith } from './systems/worldtick.js';
import { questsWith, questTickWith, qEventWith, skyMarkWith, newQuestWith, showQuestWith, questPointWith } from './systems/quests.js';
import { winterWith, throwBallWith, fireworkWith, burstWith, addManWith, drawManWith, pinFlyWith, yetiHitWith, stEnterWith } from './systems/winter.js';
(function(){
'use strict';
const $=id=>document.getElementById(id);
/* Ports für den Zellautomaten in state/sim.js (PR 9). Getter lesen erst beim Aufruf. */
const SP={
  get cam(){ return cam; }, get trees(){ return trees; }, get genF(){ return genF; },
  dust, spawn, wc
};
/* Port für persistence/transfer.js (Spielstand umziehen): Speichern, Ton, aktuelle Welt, bakIn (setzt bakPick), Herzschlag-Schlüssel aus log/. */
const TP={
  get realm(){ return realm; },
  get bakIn(){ return bakIn; }, set bakIn(v){ bakIn=v; },
  idbDo,
  tone,
  get K_ALIVE(){ return K_ALIVE; },
  saveFinds,
  saveHero,
  snapshot
};
/* Port für persistence/save.js: was das Speichern vom übrigen Spiel braucht (Rückmeldung, Welt, Lernkern). */
const SV={
  get FS(){ return FS; },
  get SEED(){ return SEED; },
  get genF(){ return genF; },
  get realm(){ return realm; },
  get trees(){ return trees; },
  banner,
  flash,
  hudLoot,
  idbDo,
  packRuns,
  park,
  speak,
  svg24,
  tone,
  get $(){ return $; },
  get QI(){ return QI; }
};
/* Weltobjekt für die Weltgenerierung in core/world/gen.js (PR 8b): Felder direkt, neu zugewiesene Namen über get/set, dazu Ports
   für Funktionen, die noch hier stehen. Die Getter lesen erst beim Aufruf, deshalb darf WD vor den Deklarationen stehen. */
const WD={
  LIFE, bio, bio2, bix, bmx, g0, grid, grow0, liqM, liqY, mtop, noCave, rA, rB, rC, rD, rH, stamp, z4, zS1, zS2, zS3,
  get BIO(){ return ST.BIO; }, set BIO(v){ ST.BIO=v; },
  get CRE(){ return ST.CRE; }, set CRE(v){ ST.CRE=v; },
  get DECO(){ return ST.DECO; }, set DECO(v){ ST.DECO=v; },
  get PICKS(){ return ST.PICKS; }, set PICKS(v){ ST.PICKS=v; },
  get LOOT(){ return ST.LOOT; }, set LOOT(v){ ST.LOOT=v; },
  get PADS(){ return ST.PADS; }, set PADS(v){ ST.PADS=v; },
  get EGGS(){ return ST.EGGS; }, set EGGS(v){ ST.EGGS=v; },
  get STR(){ return ST.STR; }, set STR(v){ ST.STR=v; },
  get DROPS(){ return ST.DROPS; }, set DROPS(v){ ST.DROPS=v; },
  get stI(){ return ST.stI; }, set stI(v){ ST.stI=v; },
  get MACH(){ return MACH; }, set MACH(v){ MACH=v; },
  get MATS(){ return MATS; }, set MATS(v){ MATS=v; },
  get OLD_END(){ return OLD_END; }, set OLD_END(v){ OLD_END=v; },
  get OLD_N(){ return OLD_N; }, set OLD_N(v){ OLD_N=v; },
  get RC0(){ return RC0; },
  get RC1(){ return RC1; },
  get RW(){ return RW; },
  get SEED(){ return SEED; },
  get SPACE(){ return SPACE; }, set SPACE(v){ SPACE=v; },
  get VAULTS(){ return VAULTS; }, set VAULTS(v){ VAULTS=v; },
  get ZDEC(){ return ZDEC; }, set ZDEC(v){ ZDEC=v; },
  get genF(){ return genF; }, set genF(v){ genF=v; },
  get realm(){ return realm; },
  get tracks(){ return ST.tracks; },
  get BUILD(){ return BUILD; },
  get HOME_C(){ return HOME_C; },
  get HOME_T(){ return HOME_T; },
  get ORBS(){ return ORBS; },
  get RLM(){ return RLM; },
  get ZN(){ return ZN; },
  get clouds(){ return clouds; },
  get trees(){ return trees; },
  colTop, ext, ground, lifeS, rlm, scanMobile, setCell, skyLim, wc
};
/* Fehlerprotokoll: Technische Fehler bleiben nur auf diesem Gerät (höchstens 20, gleiche zusammengefasst) und stehen in der Elternansicht. So lässt sich ein Problem auf dem Handy des Kindes nachvollziehen. */
function errLoad(){ try{ const a=JSON.parse(localStorage.getItem(ERRK)||'[]'); return Array.isArray(a)?a.filter(function(e){ return e&&typeof e.m==='string'; }):[]; }catch(_){ return []; } }
function errAdd(m,w){
  m=String(m||'Unbekannter Fehler').slice(0,200); w=String(w||'').slice(0,80);
  const a=errLoad(), o=a.find(function(e){ return e.m===m&&e.w===w; });
  if(o){ o.n=(o.n|0)+1; o.t=Date.now(); } else{ a.push({t:Date.now(),m:m,w:w,n:1}); if(a.length>20) a.shift(); }
  try{ localStorage.setItem(ERRK,JSON.stringify(a)); }catch(_){}
}
window.addEventListener('error',function(e){ if(e&&e.message) errAdd(e.message,(String(e.filename||'').split('/').pop()||'')+':'+(e.lineno|0)); });
window.addEventListener('unhandledrejection',function(e){ const r=e&&e.reason; errAdd('Promise: '+(r&&r.message||r),''); });
const cv=$('c'); let ctx=cv.getContext('2d');
/* Elternoptionen: Höhlenmonster an/aus, ruhige Darstellung (wie „Bewegung reduzieren“ im System). */
let OPT={mon:true,calm:false}; try{ const o=JSON.parse(localStorage.getItem(K_OPT)||'{}')||{}; OPT.mon=o.mon!==false; OPT.calm=o.calm===true; }catch(_){}
function optSave(){ try{ localStorage.setItem(K_OPT,JSON.stringify(OPT)); }catch(_){} }
const reducedSys=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
let reduced=reducedSys||OPT.calm;
const K='#1d2a3a';

/* ---------- Bilder für die Tasten ---------- */
const S1='stroke="'+K+'" stroke-linejoin="round" stroke-linecap="round"';
const IC={
  walk:'<circle cx="12" cy="4.5" r="3" fill="'+K+'"/><path d="M12 9v7M12 16l-4 6M12 16l4 6M6 13l6-3 6 3" '+S1+' stroke-width="2.6" fill="none"/>',
  car:'<path d="M2 16v-4l2-1 3-5h8l4 5 3 1v4z" fill="#e63946" '+S1+' stroke-width="1.6"/><circle cx="7" cy="17" r="2.8" fill="'+K+'"/><circle cx="17" cy="17" r="2.8" fill="'+K+'"/>',
  plane:'<path d="M3 10V4l5 5z" fill="#2f6fd6" '+S1+' stroke-width="1.4"/><path d="M2 12c0-2 3-3 7-3h8c3 0 5 1.4 5 3s-2 3-5 3H9c-4 0-7-1-7-3z" fill="#ffc21a" '+S1+' stroke-width="1.6"/><path d="M9 13h9l-6 7H9z" fill="#2f6fd6" '+S1+' stroke-width="1.4"/>',
  bagger:'<rect x="1.5" y="17" width="14" height="5" rx="2.5" fill="'+K+'"/><path d="M3 17v-5h4V7h5l2 5v5z" fill="#ffc21a" '+S1+' stroke-width="1.5"/><path d="M11 11l6-8 4 6" fill="none" '+S1+' stroke-width="2.6"/><path d="M18.5 8.5l4 1.5-1.5 5-4.5-1.5z" fill="'+K+'"/>',
  coaster:'<path d="M1 20c4 0 4-14 8-14s3 12 7 12 3-7 7-7" stroke="#e0304a" stroke-width="3" stroke-linecap="round" fill="none"/><rect x="5" y="2.5" width="8" height="5" rx="1.5" fill="#7b4fd6" '+S1+' stroke-width="1.4"/>',
  lava:'<path d="M12 2c4 6 7 9 7 13a7 7 0 0 1-14 0c0-4 3-7 7-13z" fill="#ff5a1f" '+S1+' stroke-width="1.6"/><path d="M12 11c2 3 3 4 3 6a3 3 0 0 1-6 0c0-2 1-3 3-6z" fill="#ffd23f"/>',
  fire:'<path d="M13 2c0 4 6 6 6 13a7 7 0 0 1-14 0c0-3 2-5 3-8 1 2 2 3 3 3 1-2 2-5 2-8z" fill="#ff9a1f" '+S1+' stroke-width="1.6"/><path d="M12 13c1 2 3 3 3 5a3 3 0 0 1-6 0c0-2 2-3 3-5z" fill="#ffe066"/>',
  water:'<path d="M12 2c4 6 7 9 7 13a7 7 0 0 1-14 0c0-4 3-7 7-13z" fill="#3aa0e8" '+S1+' stroke-width="1.6"/><path d="M9 15a3.4 3.4 0 0 0 3 3.4" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>',
  ice:'<path d="M12 2l8.5 4.5v10L12 21l-8.5-4.5v-10z" fill="#bfeaf7" '+S1+' stroke-width="1.6"/><path d="M3.5 6.5L12 11l8.5-4.5M12 11v10" fill="none" '+S1+' stroke-width="1.6"/><path d="M7 11.5v3" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
  earth:'<path d="M2 21c1.5-8 5.5-13 10-13s8.5 5 10 13z" fill="#8a5a3c" '+S1+' stroke-width="1.6"/><path d="M6.5 12.5c2.5-3.5 8.5-3.5 11 0" stroke="#58b548" stroke-width="3.4" stroke-linecap="round" fill="none"/>',
  blocks:'<rect x="2.5" y="12.5" width="9" height="9" rx="1" fill="#e2574c" '+S1+' stroke-width="1.6"/><rect x="12.5" y="12.5" width="9" height="9" rx="1" fill="#4f9ad8" '+S1+' stroke-width="1.6"/><rect x="7.5" y="2.5" width="9" height="9" rx="1" fill="#f2b632" '+S1+' stroke-width="1.6"/>',
  track:'<path d="M3 21L10 3M14 21l7-18" stroke="#e0304a" stroke-width="2.6" stroke-linecap="round"/><path d="M5 17h11M7 12h11M9 7h11" '+S1+' stroke-width="2.2"/>',
  erase:'<path d="M8 20l-5-5L14 4l7 7-9 9z" fill="#ff9fb0" '+S1+' stroke-width="1.6"/><path d="M3 15l5 5h4l3-3-7-7z" fill="#fff8e6" '+S1+' stroke-width="1.6"/>',
  star:'<path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21.1l1.5-7L2 9.3l7-.8z" fill="#ffd23f" '+S1+' stroke-width="1.6"/>',
  reset:'<path d="M5 12a7 7 0 1 0 2.5-5.4" '+S1+' stroke-width="2.6" fill="none"/><path d="M3 3l1.5 6L10 7z" fill="'+K+'"/>'
};
const AI={
  jump:'<path d="M12 3l8 9h-5v9H9v-9H4z" fill="currentColor"/>',
  chute:'<path d="M2.5 11a9.5 9.5 0 0 1 19 0z" fill="currentColor"/><path d="M3 11l9 10 9-10M12 11v10" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  down:'<path d="M12 21l8-9h-5V3H9v9H4z" fill="currentColor"/>',
  turbo:'<path d="M13.5 2L4 14h6l-1.5 8L19 10h-6z" fill="currentColor"/>',
  exit:'<path d="M12 4H5v16h7" stroke="currentColor" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 12h11m-4.5-4.5L21 12l-4.5 4.5" stroke="currentColor" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  dig:'<path d="M3 4l7 2 2 6" stroke="currentColor" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 11l8 1.5-1 8-8-3z" fill="currentColor"/><path d="M19 15v6M16 18.5l3 2.5 3-2.5" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
};
const S2=S1+' stroke-width="2.5"';
const QI={
  haus:'<path d="M2.5 11.5L12 3l9.5 8.5z" fill="#e2574c" '+S1+' stroke-width="1.5"/><rect x="5" y="11.5" width="14" height="9.5" fill="#f2b632" '+S1+' stroke-width="1.5"/><rect x="10" y="14.5" width="4" height="6.5" fill="#7a4a2c"/>',
  mond:'<path d="M15 3a9 9 0 1 0 6 13A8 8 0 0 1 15 3z" fill="#ffd23f" '+S1+' stroke-width="1.5"/>',
  sonne:'<circle cx="12" cy="12" r="5" fill="#ffd23f" '+S1+' stroke-width="1.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" '+S1+' stroke-width="1.8"/>',
  baum:'<rect x="10.5" y="13" width="3" height="9" fill="#7a4a2c" '+S1+' stroke-width="1.2"/><circle cx="12" cy="9" r="7" fill="#3fa85a" '+S1+' stroke-width="1.5"/>',
  wolke:'<path d="M6.5 18a4.5 4.5 0 0 1 .3-9 6 6 0 0 1 11.4 1.3A3.9 3.9 0 0 1 17.5 18z" fill="#fff" '+S1+' stroke-width="1.6"/>',
  apfel:'<path d="M12 8c-3-2.5-8-.5-8 5 0 4.5 3 8.5 5.5 8.5 1 0 1.5-.5 2.5-.5s1.5.5 2.5.5c2.5 0 5.5-4 5.5-8.5 0-5.5-5-7.5-8-5z" fill="#e63946" '+S1+' stroke-width="1.5"/><path d="M12 8c0-2 .5-3.5 2-5" fill="none" '+S1+' stroke-width="1.6"/><path d="M14.5 5c1.5-1.5 3.5-1.5 4.5-1-.5 1.5-2.5 2.5-4.5 1z" fill="#58b548" '+S1+' stroke-width="1.2"/>',
  ball:'<circle cx="12" cy="12" r="9" fill="#4f9ad8" '+S1+' stroke-width="1.5"/><path d="M3.5 9.500c5 2.5 12 2.5 17 0M3.5 14.500c5-2.5 12-2.5 17 0" fill="none" stroke="#ffd23f" stroke-width="2"/>',
  fisch:'<path d="M2.5 12c3-5 9-6.5 13.5-2l5-3.500v11L16 14c-4.5 4.5-10.5 3-13.5-2z" fill="#ff8a1f" '+S1+' stroke-width="1.5"/><circle cx="7" cy="11" r="1.3" fill="'+K+'"/>',
  banane:'<path d="M4 7c1 7 6 12 14 11 1.500-.200 2.500-1 2.500-2-6 1-11-3-13-10z" fill="#f5d33f" '+S1+' stroke-width="1.500"/><path d="M4 7l-.800-2.200 1.600-.300z" fill="#6b4a2b"/>',
  tomate:'<circle cx="12" cy="13.500" r="7.500" fill="#e2423c" '+S1+' stroke-width="1.500"/><path d="M8 7.500l2.500 1 1.500-3 1.500 3 2.500-1-1 2.500h-6z" fill="#3fa34d" '+S1+' stroke-width="1.200"/>',
  maus:'<path d="M3 17c0-5 4-8 9-8s8 3 8 7v1H3z" fill="#9aa3ad" '+S1+' stroke-width="1.5"/><circle cx="8" cy="8.5" r="2.8" fill="#c7cdd4" '+S1+' stroke-width="1.3"/><circle cx="18.5" cy="14" r="1" fill="'+K+'"/><path d="M3 17c-1.500 0-2 2 0 3" '+S1+' stroke-width="1.3" fill="none"/>',
  tisch:'<rect x="2.5" y="8" width="19" height="3.500" rx="1" fill="#b77a47" '+S1+' stroke-width="1.500"/><path d="M5 11.500V20M19 11.500V20" '+S1+' stroke-width="2.200"/>',
  tonne:'<path d="M5.500 7h13l-1.500 14h-10z" fill="#5a8f4e" '+S1+' stroke-width="1.500"/><rect x="4" y="4.500" width="16" height="2.800" rx="1" fill="#6fa862" '+S1+' stroke-width="1.400"/><path d="M10 10v8M14 10v8" '+S1+' stroke-width="1.200"/>',
  hose:'<path d="M6 3h12l1.500 18h-5L12 10l-2.500 11h-5z" fill="#3b6fd1" '+S1+' stroke-width="1.500"/><path d="M6 6h12" '+S1+' stroke-width="1.200"/>',
  rose:'<path d="M12 13v9" stroke="#2f8a3e" stroke-width="2" stroke-linecap="round"/><path d="M12 18c2-2 4-2 5-1-1 2-3 2-5 1z" fill="#3fa34d"/><circle cx="12" cy="8.500" r="5" fill="#e2423c" '+S1+' stroke-width="1.500"/><path d="M10 8.500c1-2 3-2 4 0-1 1.500-3 1.500-4 0z" fill="#b8312c"/>',
  tanne:'<path d="M12 2l6 8h-3l5 7H4l5-7H6z" fill="#2f8a4a" '+S1+' stroke-width="1.500"/><rect x="10.500" y="17" width="3" height="4.500" fill="#7a4a2c" '+S1+' stroke-width="1.200"/>',
  kanne:'<path d="M6 13.500L2 9.500" '+S1+' stroke-width="2.600"/><path d="M19 11.500c3.500 0 3.500 6 0 6" '+S1+' stroke-width="1.800" fill="none"/><path d="M5 12.500c0-2.500 3-4 7-4s7 1.500 7 4V16c0 3-3 4.500-7 4.500S5 19 5 16z" fill="#e5a33a" '+S1+' stroke-width="1.500"/><path d="M8 8.500c0-2.500 8-2.500 8 0z" fill="#f2c26b" '+S1+' stroke-width="1.400"/><circle cx="12" cy="5" r="1.300" fill="#f2c26b" '+S1+' stroke-width="1.200"/>',
  lock:'<path d="M8 10.5V7.500a4 4 0 0 1 8 0v3" fill="none" '+S1+' stroke-width="2.6"/><rect x="5" y="10.5" width="14" height="10.5" rx="2.5" fill="#ffd23f" '+S1+' stroke-width="1.6"/>'
};

IC.rocket='<path d="M8 13l-3.5 6 3.5-1zM16 13l3.5 6-3.5-1z" fill="#e63946" '+S1+' stroke-width="1.3"/><path d="M10 17.5l2 4.5 2-4.5z" fill="#ffd23f" '+S1+' stroke-width="1.2"/><path d="M12 2c4 3 5 8.5 4 15.5H8C7 10.5 8 5 12 2z" fill="#f3f1ea" '+S1+' stroke-width="1.5"/><path d="M12 2c1.9 1.4 3.2 3.4 3.8 5.800H8.2C8.800 5.4 10.1 3.4 12 2z" fill="#e63946" '+S1+' stroke-width="1.5"/><circle cx="12" cy="11.5" r="2.1" fill="#bfe9f5" '+S1+' stroke-width="1.3"/>';
IC.loader='<path d="M2.5 16v-5h5V6h5l1.5 5h2v5z" fill="#f2a81d" '+S1+' stroke-width="1.5"/><path d="M15 12.5l3 1" fill="none" '+S1+' stroke-width="2.4"/><path d="M17 9.5h4.5l1.5 6.5h-6z" fill="'+K+'"/><circle cx="6.5" cy="17.5" r="3.3" fill="'+K+'"/><circle cx="14" cy="17.5" r="3.3" fill="'+K+'"/>';
IC.dumper='<path d="M1.5 6.5h13.5l-1.5 8.500H3z" fill="#f2a81d" '+S1+' stroke-width="1.5"/><path d="M16 9h3.5l3 4v3.5H16z" fill="#2f6fd6" '+S1+' stroke-width="1.5"/><path d="M2 16.5h20.5" '+S1+' stroke-width="2"/><circle cx="6" cy="18.5" r="2.900" fill="'+K+'"/><circle cx="18.5" cy="18.5" r="2.900" fill="'+K+'"/>';
IC.tbm='<rect x="1.5" y="6.5" width="13.5" height="11" rx="3" fill="#9aa7b4" '+S1+' stroke-width="1.5"/><rect x="1.5" y="10" width="13.5" height="3" fill="#ffc21a"/><rect x="2" y="18" width="12.5" height="3.2" rx="1.6" fill="'+K+'"/><ellipse cx="18.5" cy="12" rx="3.6" ry="9" fill="#ff8a1f" '+S1+' stroke-width="1.5"/><path d="M17 7.5h3M16.5 12h4M17 16.5h3" '+S1+' stroke-width="1.6"/>';
QI.hand='<path d="M14.5 3.5l6 6L10 20l-6.5 .5L4 14z" fill="#f2b632" '+S1+' stroke-width="1.6"/><path d="M3.5 20.5L4 14l6 6z" fill="#7a4a2c" '+S1+' stroke-width="1.4"/><path d="M12 6l6 6" '+S1+' stroke-width="1.6"/>';
QI.gem='<path d="M6 4h12l4 6-10 11L2 10z" fill="#5fd4e6" '+S1+' stroke-width="1.6"/><path d="M2 10h20M9 4l-2 6 5 11 5-11-2-6" fill="none" '+S1+' stroke-width="1.2"/>';
QI.save='<path d="M4 4h12.5L20 7.5V20H4z" fill="#4f9ad8" '+S1+' stroke-width="1.6"/><rect x="7.5" y="4" width="7.5" height="5" fill="#fff8e6" '+S1+' stroke-width="1.2"/><rect x="7" y="13" width="10" height="7" fill="#fff8e6" '+S1+' stroke-width="1.2"/>';
QI.fs='<path d="M3 9V3h6M15 3h6v6M21 15v6h-6M9 21H3v-6" fill="none" '+S1+' stroke-width="2.6"/><rect x="7.5" y="7.5" width="9" height="9" rx="1.5" fill="#4f9ad8" '+S1+' stroke-width="1.5"/>';
QI.fsx='<path d="M9 3v6H3M21 9h-6V3M15 21v-6h6M3 15h6v6" fill="none" '+S1+' stroke-width="2.6"/>';
QI.exp='<path d="M3 13v8h18v-8" fill="#f2b632" '+S1+' stroke-width="1.6"/><path d="M12 15V3M7 7.5L12 3l5 4.5" fill="none" stroke="#2f8f4a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
QI.imp='<path d="M3 13v8h18v-8" fill="#f2b632" '+S1+' stroke-width="1.6"/><path d="M12 3v12M7 10.5L12 15l5-4.5" fill="none" stroke="#2f6fd6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';

IC.shovel='<path d="M17 3l4 4M19 5l-8.500 8.500" '+S1+' stroke-width="2.600"/><path d="M10.500 9.500l4 4-4.500 4.500c-2 2-5.500 2.500-7.500 2.500 0-2 .5-5.500 2.500-7.500z" fill="#9aa7b4" '+S1+' stroke-width="1.500"/>';
IC.pick='<path d="M4 21L15 10" stroke="#a0632f" stroke-width="3.2" stroke-linecap="round"/><path d="M4 21L15 10" '+S1+' stroke-width="1" fill="none"/><path d="M8 4.500c4-2 9-1.500 12.500 1.500l-1 1c-3-1.500-6-1.500-8.500 0zM20.500 6c2 4 1.500 8.500-1 12l-1-1c1.500-2.500 1.500-6 0-9z" fill="#9aa7b4" '+S1+' stroke-width="1.400"/><path d="M13 8l3 3" '+S1+' stroke-width="3.200"/>';
IC.bow='<path d="M6 3c8 2 13 7 15 15" stroke="#a0632f" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M6 3c8 2 13 7 15 15" '+S1+' stroke-width="1" fill="none"/><path d="M6 3l15 15" stroke="'+K+'" stroke-width="1.200"/><path d="M3 21L17 7" '+S1+' stroke-width="2"/><path d="M17 7l1-4 3 3z" fill="#9aa7b4" '+S1+' stroke-width="1.200"/><path d="M3 21l1-3.500M3 21l3.500-1" stroke="#e63946" stroke-width="2.200" stroke-linecap="round"/>';
IC.tnt='<circle cx="10.5" cy="14.5" r="7.5" fill="#3a3438" '+S1+' stroke-width="1.6"/><path d="M15.5 9l3-3" '+S1+' stroke-width="2.4"/><path d="M18.5 6l.8-3M18.5 6l3-.6M18.5 6l2.4 1.800" stroke="#ff8a1f" stroke-width="1.8" stroke-linecap="round"/><path d="M7 12a4 4 0 0 1 3-2" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"/>';

QI.bolt='<path d="M13.5 2L4 14h6l-1.5 8L19 10h-6z" fill="#ffd23f" '+S1+' stroke-width="1.6"/>';
QI.gear='<path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" '+S1+' stroke-width="3"/><circle cx="12" cy="12" r="6.5" fill="#9aa7b4" '+S1+' stroke-width="1.6"/><circle cx="12" cy="12" r="2.6" fill="#fff8e6" '+S1+' stroke-width="1.4"/>';
QI.sound='<path d="M3 9h4l5-4v14l-5-4H3z" fill="'+K+'"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" '+S1+' stroke-width="2.2" fill="none"/>';
QI.talk='<path d="M4 5h16v10H10l-5 4v-4H4z" fill="'+K+'"/><circle cx="9" cy="10" r="1.3" fill="#fff"/><circle cx="12.5" cy="10" r="1.3" fill="#fff"/><circle cx="16" cy="10" r="1.3" fill="#fff"/>';
QI.mute='<path d="M3 9h4l5-4v14l-5-4H3z" fill="'+K+'"/><path d="M16 9l5 6M21 9l-5 6" stroke="#e63946" stroke-width="2.6" stroke-linecap="round"/>';

IC.ski='<path d="M3 17.5l17 4.500" '+S1+' stroke-width="2.6"/><circle cx="14" cy="4.5" r="2.800" fill="#e63946" '+S1+' stroke-width="1.2"/><path d="M13.5 8.500L10 13l4.500 3-1.500 3.500M12 10.500l5.500 2" '+S1+' stroke-width="2.4" fill="none"/>';
IC.snow='<path d="M12 2v20M3.300 7l17.400 10M20.700 7L3.300 17M12 2l-2.500 2.500M12 2l2.500 2.500M12 22l-2.500-2.500M12 22l2.500-2.500" stroke="#3aa0e8" stroke-width="2.4" stroke-linecap="round" fill="none"/>';
IC.ball='<circle cx="14.500" cy="12" r="7" fill="#fff" '+S1+' stroke-width="1.6"/><path d="M2 8h4M1 12h4.500M2 16h4" '+S1+' stroke-width="2"/>';
IC.man='<circle cx="12" cy="16" r="6" fill="#fff" '+S1+' stroke-width="1.5"/><circle cx="12" cy="7.500" r="4" fill="#fff" '+S1+' stroke-width="1.5"/><path d="M12 8l4.500 1" stroke="#ff8a1f" stroke-width="2.200" stroke-linecap="round"/><rect x="8.500" y="1.200" width="7" height="3" fill="'+K+'"/>';
IC.fw='<path d="M12 12V3M12 12l6.400-6.400M12 12h9M12 12l6.400 6.400M12 12v9M12 12l-6.400 6.400M12 12H3M12 12L5.600 5.600" stroke="#e63946" stroke-width="2.200" stroke-linecap="round"/><circle cx="12" cy="12" r="2.800" fill="#ffd23f" '+S1+' stroke-width="1.2"/>';
IC.dragon='<path d="M6 9l-4-5 7 2z" fill="#a02622" '+S1+' stroke-width="1.2"/><path d="M2 16c0-4.500 3.500-7.500 8.500-7.500l2.500-4 1.500 4c4 .5 7.500 2.500 7.500 5.500 0 2-1.500 3-3.500 3H12l-2 3.500-1.500-3.500C5 17 2 17.500 2 16z" fill="#e2452f" '+S1+' stroke-width="1.5"/><circle cx="15.500" cy="12" r="1.500" fill="'+K+'"/>';
AI.lift='<path d="M2 5l20-3" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M12 3.500V8" stroke="currentColor" stroke-width="2.4"/><rect x="5" y="8" width="14" height="12" rx="3" fill="currentColor"/>';
AI.spin='<path d="M19 12a7 7 0 1 1-2.500-5.400" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M21.500 3l-1.500 6.500-5.500-2.500z" fill="currentColor"/>';
AI.flame='<path d="M13 2c0 4 6 6 6 13a7 7 0 0 1-14 0c0-3 2-5 3-8 1 2 2 3 3 3 1-2 2-5 2-8z" fill="currentColor"/>';

QI.egg='<path d="M12 2.500c4 0 7 6 7 10.800a7 7 0 0 1-14 0C5 8.500 8 2.500 12 2.500z" fill="#ffd23f" '+S1+' stroke-width="1.6"/><path d="M9 9.500c.500-1.800 1.500-3 2.800-3.600" stroke="#fff" stroke-width="1.800" stroke-linecap="round" fill="none"/>';
QI.map='<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" fill="#bfe6a8" '+S1+' stroke-width="1.6"/><path d="M9 4v14M15 6v14" '+S1+' stroke-width="1.4"/><circle cx="12" cy="10.500" r="2" fill="#e63946" '+S1+' stroke-width="1"/>';
IC.balloon='<path d="M12 2a7.5 7.5 0 0 0-7.5 7.5c0 3.6 3 6 5.2 8h4.6c2.2-2 5.2-4.4 5.2-8A7.5 7.5 0 0 0 12 2z" fill="#e63946" '+S1+' stroke-width="1.5"/><path d="M12 2c-2 2-2.8 4.8-2.8 7.5 0 3.200 1 6 .5 8M12 2c2 2 2.800 4.800 2.800 7.500 0 3.200-1 6-.5 8" fill="#ffd23f" '+S1+' stroke-width="1.2"/><rect x="9" y="19" width="6" height="3.5" rx="1" fill="#a0632f" '+S1+' stroke-width="1.3"/>';
IC.heli='<path d="M3 4.5h18M12 4.5v3" '+S1+' stroke-width="2.2"/><path d="M4 14c0-3.5 3-6.5 7.5-6.5S19 10 19 13.5V16H6.5C5 16 4 15.2 4 14z" fill="#58b548" '+S1+' stroke-width="1.5"/><path d="M13 9.5c2.5 0 4 1.500 4 3.500h-4z" fill="#bfe9f5" '+S1+' stroke-width="1.2"/><path d="M4.500 12H1.500M1.5 9.5v5M8 16v3.5M15 16v3.5M5.5 19.5h12" '+S1+' stroke-width="1.8"/>';
IC.boat='<path d="M12 2v14" '+S1+' stroke-width="1.8"/><path d="M12.8 3c3.500 2.500 6 6.500 6.500 11H12.800z" fill="#fff8e6" '+S1+' stroke-width="1.4"/><path d="M11.2 6c-2.500 2-4 4.500-4.500 8h4.500z" fill="#e63946" '+S1+' stroke-width="1.4"/><path d="M2.5 16h19l-3 5.5H5.5z" fill="#a0632f" '+S1+' stroke-width="1.6"/>';
IC.bug='<path d="M5 10L1.5 7.5M5 14H1.5M5.5 17.5L2 20M19 10l3.5-2.5M19 14h3.5M18.5 17.5L22 20" '+S1+' stroke-width="1.8"/><ellipse cx="12" cy="14" rx="7.5" ry="7" fill="#e63946" '+S1+' stroke-width="1.5"/><path d="M12 7v14" '+S1+' stroke-width="1.4"/><circle cx="9" cy="12" r="1.4" fill="'+K+'"/><circle cx="15" cy="16" r="1.4" fill="'+K+'"/><circle cx="12" cy="5" r="3" fill="#bfe9f5" '+S1+' stroke-width="1.4"/>';
IC.rope='<path d="M2 4l20 9" '+S1+' stroke-width="2"/><rect x="1" y="2" width="3" height="20" rx="1" fill="#a0632f" '+S1+' stroke-width="1.2"/><rect x="20" y="11" width="3" height="11" rx="1" fill="#a0632f" '+S1+' stroke-width="1.2"/><path d="M12 8.5v4" '+S1+' stroke-width="1.8"/><circle cx="12" cy="15.5" r="3" fill="#ffd2a8" '+S1+' stroke-width="1.3"/>';
IC.sub='<path d="M9 9V5.500h4" fill="none" '+S1+' stroke-width="2"/><rect x="2" y="9" width="18" height="10" rx="5" fill="#ffc21a" '+S1+' stroke-width="1.6"/><circle cx="13" cy="14" r="2.400" fill="#bfe9f5" '+S1+' stroke-width="1.3"/><circle cx="7" cy="14" r="1.500" fill="#bfe9f5" '+S1+' stroke-width="1.1"/><path d="M21.500 10.500v7" '+S1+' stroke-width="2.4"/>';
AI.hook='<path d="M12 2v9" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><path d="M12 11a4.500 4.500 0 1 1-4.500 4.500" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M5 13.500l2.500 2 2-2.500" stroke="currentColor" stroke-width="2.400" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
AI.horn='<path d="M3 9h4l8-5v16l-8-5H3z" fill="currentColor"/><path d="M18 8.5a5 5 0 0 1 0 7M20.500 6a8.500 8.500 0 0 1 0 12" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
AI.scope='<path d="M3 13l13-7 3 5-13 7z" fill="currentColor"/><path d="M10 15l-3 7M10 15l3 7" stroke="currentColor" stroke-width="2.400" stroke-linecap="round"/><circle cx="20" cy="5" r="1.600" fill="currentColor"/>';
AI.bow='<path d="M5 3c9 1.500 14 6.500 16 16" stroke="currentColor" stroke-width="2.800" fill="none" stroke-linecap="round"/><path d="M5 3l16 16M2 12h13" stroke="currentColor" stroke-width="1.800" stroke-linecap="round"/><path d="M15 9l5 3-5 3z" fill="currentColor"/>';
AI.sonar='<circle cx="12" cy="12" r="2.600" fill="currentColor"/><path d="M6.500 6.500a8 8 0 0 0 0 11M17.500 6.500a8 8 0 0 1 0 11M3.500 3.500a12 12 0 0 0 0 17M20.500 3.500a12 12 0 0 1 0 17" stroke="currentColor" stroke-width="2.200" fill="none" stroke-linecap="round"/>';

/* ---------- Welt ---------- */
for(let i=0;i<GX+2;i++) g0[i]=rawH(i*CELL);
function ground(x){ const f=clamp(x/CELL,0,GX), i=Math.floor(f); return g0[i]+(g0[i+1]-g0[i])*(f-i); }

/* Harte Schichten und Zonen in der Tiefe: Oberkante je Spalte. zS1, zS2, zS3 sind die harten Schichten, z4 trennt Pilzgrotten und Urzeit-Höhlen. */
for(let cx=0;cx<GX;cx++){ zS1[cx]=630+Math.round(3*Math.sin(cx*.027+1)); z4[cx]=960+Math.round(10*Math.sin(cx*.013+2)); zS2[cx]=1290+Math.round(4*Math.sin(cx*.022)); zS3[cx]=1640+Math.round(4*Math.sin(cx*.019+4)); }
for(let cx=0;cx<GX;cx++){
  const x=(cx+.5)*CELL;
  grow0[cx]=Math.ceil((rawH(x)-TOP)/CELL-.5);
  const gb=Math.ceil((baseG(x)-TOP)/CELL-.5), t=-bump(x)-8;
  rA[cx]=grow0[cx]+(t>0?Math.round(t/CELL)+2:0);
  rB[cx]=Math.max(rA[cx],gb+30+Math.round(5*Math.sin(cx*.05)));
  rD[cx]=gb+190+Math.round(8*Math.sin(cx*.021));
  rH[cx]=gb+400+Math.round(10*Math.sin(cx*.017+2));
  rC[cx]=GY-52+Math.round(4*Math.sin(cx*.03));
}
/* ---------- Schneeberg: Er steht auf dem alten Boden. grow0 bleibt der alte Boden, mtop ist die Oberkante vom Berg. Vorn und hinten führt eine Piste hinunter. ---------- */
for(let cx=0;cx<GX;cx++) mtop[cx]=cx<SNC0||cx>SNC1?grow0[cx]:Math.min(grow0[cx],Math.ceil((msurf((cx+.5)*CELL)-TOP)/CELL-.5));
/* Eine Spalte vom Berg: oben Schnee, innen Fels mit Eiskristallen. Am Fuß liegt eine dünne Schneedecke. */
function winterCol(cx){ return winterColWith(WD,cx); }
/* Die Höhle, aus der das Hick kommt */
function carveCave(){ return carveCaveWith(WD); }
/* Alte Spielstände bekommen den Berg nachträglich. Was dort stand, rückt nach oben auf den Schnee. */
function migrateSnow(){
  for(let cx=SNC0;cx<Math.min(genF,SNC1);cx++) winterCol(cx);
  carveCave();
  const up=function(o){ if(o&&o.x>SL0&&o.x<BEND&&o.y>msurf(o.x)) o.y=msurf(o.x); };
  for(const k in parked) up(parked[k]);
  ST.props.forEach(up);
  if(P.x>SL0&&P.y>msurf(P.x)&&P.y<rawH(P.x)+8) P.y=msurf(P.x)-2;
  for(const h of ST.hidden){
    if(h.got||h.x<SL0) continue;
    if(h.tree>=0&&trees[h.tree]){ const t=trees[h.tree]; h.y=t.gy-t.h-4; }
    else if(h.zone==='shallow'||h.zone==='edge') h.y-=rawH(h.x)-msurf(h.x);
    else if(h.zone==='sky'&&h.y>msurf(h.x)-20) h.y=msurf(h.x)-24;
  }
}
let SEED=1;

function setCell(cx,cy,m,lf){ if(!inGrid(cx,cy)) return; const i=cy*GX+cx; grid[i]=m; lifeS(i,lf||0); if(m>0&&m<4) ext(cx,cy); }
function carveCircle(x,y,r){ return carveCircleWith(WD,x,y,r); }
function fillBlock(bx,by){ return fillBlockWith(WD,bx,by); }
/* ---------- Große Welt: Hinter dem Schneeberg folgen Länder, die aus der Welt-Nummer berechnet werden.
   Ihre Spalten entstehen erst, wenn der Held in die Nähe kommt. Flüssigkeiten rechnen nur rund um die Kamera. ---------- */
const ORBS=[MOON];
let genF=0;
/* ---------- Andere Welten: Der Mond und die Planeten sind ganze Welten mit Ländern, Höhlen und Tiefe, so rund wie die Erde.
   Wer auf einem landet, reist dorthin. Die Erde wird so lange gespeichert. Eine fremde Welt liegt im Gitter ab x=PX0 und ist RW breit;
   wer an einem Ende hinausläuft, kommt am anderen wieder herein. Links und rechts liegt je ein Streifen, der das andere Ende zeigt. ---------- */
const RLM={
  moon:{e:'🌙',n:'den Mond',w:28800,salt:101,lands:[13,14],exit:-2600,orb:function(){ return MOON; },
    pal:{deep:[86,88,102],hot:[110,84,70],z:[[[70,110,150],[150,200,235],[20,40,62]],[[44,120,110],[90,200,170],[10,44,40]],[[110,80,170],[180,150,240],[30,20,60]],[[120,70,40],[190,110,60],[40,18,12]]]},
    zn:[['🪨','den Mondfels'],['🟤','das Glühgestein'],['🧊','die Eisgrotten'],['✨','die Leuchthöhlen'],['🔮','die Kristallkammern'],['⚙️','den Eisenkern']],
    mat:[['mo',18,0],['fe',10,1],['kr',5,5]],
    zc:[null,null,null,['🐧','sit',1,'BRRR!','',22],['🐛','sit',1,'GLÜH!','sparkle',18],['👾','sit',1,'PIEP?','sparkle',22],['🤖','sit',1,'BIEP BUUP!','',24]],
    lk:[0,0,0,ICE,WATER,WATER,LAVA],
    hello:'Du bist auf dem Mond gelandet! Er ist eine ganze Welt mit Bergen, Kratern und tiefen Höhlen. Lauf herum und grab tiefe Löcher. Wenn du heim willst, flieg mit der Rakete ganz hoch hinauf.'}
};
RLM.ice={e:'❄️',n:'den Eisplaneten',w:43200,salt:202,lands:[15,16],exit:-2600,orb:function(){ return SPACE.ice||{x:1900,y:-16000,r:420}; },
  pal:{deep:[96,130,170],hot:[150,90,96],z:[[[150,200,230],[220,240,255],[40,70,100]],[[120,96,80],[190,160,130],[44,32,26]],[[60,140,120],[120,230,170],[14,40,44]],[[130,40,30],[210,90,50],[40,10,8]]]},
  zn:[['🧊','das Eisgestein'],['🔥','das warme Gestein'],['❄️','die Frostgrotten'],['🦣','die Mammuthöhlen'],['🌌','die Polarlichtgrotten'],['🌋','das Lavaherz']],
  mat:[['ei',20,0],['fe',8,1],['kn',6,3],['fp',5,6]],
  zc:[null,null,null,['🦭','sit',1,'ORK ORK!','',24],['🦣','walk',1,'TÖRÖÖÖ!','bront',40],['🐧','sit',1,'BRRR!','',22],['🐲','sit',1,'FAUCH!','',26]],
  lk:[0,0,0,ICE,WATER,ICE,LAVA],
  hello:'Du bist auf dem Eisplaneten gelandet! Er ist riesig, mit Gletschern, einem zugefrorenen Meer und Höhlen voller Eis. Wenn du heim willst, flieg mit der Rakete ganz hoch hinauf.'};
RLM.jun={e:'🫧',n:'den Blubberplaneten',w:36000,salt:303,lands:[17,18],exit:-2600,orb:function(){ return SPACE.jun||{x:6100,y:-19200,r:330}; },
  pal:{deep:[96,70,120],hot:[150,70,100],z:[[[60,130,70],[120,220,110],[16,44,20]],[[150,90,60],[230,170,110],[50,26,16]],[[190,110,170],[255,190,235],[60,24,54]],[[140,40,60],[230,90,90],[44,10,16]]]},
  zn:[['🟣','das Blubbergestein'],['🔥','das Glutgestein'],['🟢','die Schleimhöhlen'],['🍄','die Riesenpilzgrotten'],['🫧','die Seifenblasenhallen'],['🌋','den Glutkern']],
  mat:[['fe',8,1],['pi',10,3],['kn',6,4],['kr',5,5]],
  zc:[null,null,null,['🐌','walk',1,'SCHLEIM!','slow',22],['🐛','sit',1,'GLÜH!','sparkle',18],['👾','sit',1,'BLUBB?','sparkle',22],['🐲','sit',1,'FAUCH!','',26]],
  lk:[0,0,0,WATER,WATER,WATER,LAVA],
  hello:'Du bist auf dem Blubberplaneten gelandet! Hier wachsen lila Wälder und Riesenpilze, und im Sumpf blubbert grüner Glibber. Blubb wohnt hier. Wenn du heim willst, flieg mit der Rakete ganz hoch hinauf.'};
let realm='', RW=WORLD_W, RX0=0, RC0=0, RC1=GX;
function rlm(){ return realm?RLM[realm]:null; }
function setRealm(id){
  realm=id&&RLM[id]?id:'';
  const R=rlm();
  RW=R?R.w:WORLD_W; RX0=R?PX0:0; RC0=Math.floor(RX0/CELL); RC1=Math.min(GX-PMC-1,RC0+Math.round(RW/CELL));
  if(typeof setPal==='function') setPal(R);
}
/* Spalte, deren Boden eine Randspalte zeigt: links das Ende der Welt, rechts der Anfang. */
function wc(cx){ return !realm?cx:cx<RC0?cx+(RC1-RC0):cx>=RC1?cx-(RC1-RC0):cx; }



/* Reihenfolge der Länder: Alle Arten kommen einmal dran, dann wird neu gemischt. Am Schluss liegt das Ende der Welt.
   Die Welt ist doppelt so breit wie früher. Die Länder der alten Hälfte bleiben genau so, wie sie waren; wo früher das Ende der Welt lag, geht es mit neuen Ländern weiter. */
let OLD_N=0, OLD_END=0;
function addTree(x,k,r){ return addTreeWith(WD,x,k,r); }
function addCre(b,f,r,x,y){ return addCreWith(WD,b,f,r,x,y); }
/* Bauwerke, goldene Eier und Besonderes für jede Land-Art */
const BUILD=[];
BUILD[1]=function(b,r){
  ST.STR.push({k:'pyr',x:b.qx,y:b.hq,c1:colOf(b.qx+170)});
  ST.EGGS.push({b:b.i,x:b.qx-10,y:b.hq-12});
  addCre(b,['🧟','sit',1,'UAAAH!','mummy',24],r,b.qx+14,b.hq);
  addTree(b.px-86,'palm',r); addTree(b.px+90,'palm',r);
};
BUILD[2]=function(b,r){
  addTree(b.qx,'giant',r);
  ST.EGGS.push({b:b.i,x:b.qx,y:ground(b.qx)-264});
  addCre(b,['🗿','sit',1,'UGA UGA!','',34],r,b.px,ground(b.px));
};
BUILD[3]=function(b,r){
  ST.STR.push({k:'house',x:b.qx,y:b.hq,w:5,h:3,m:WOOD,c1:colOf(b.qx+80)});
  ST.EGGS.push({b:b.i,x:b.qx+26,y:b.hq-12});
  addCre(b,['👵','sit',1,'KEKSE?','gift',22],r,b.qx-2,b.hq);
};
BUILD[4]=function(b,r){
  const hs=[70,128,192], xs=[-150,-60,40];
  for(let k=0;k<3;k++){ const x=b.qx+xs[k]; ST.PADS.push({k:'shroom',x:x,y:ground(x)-hs[k],w:30+k*4,h:hs[k],pow:560+k*60,c:k,bt:0}); }
  ST.EGGS.push({b:b.i,x:b.qx+40,y:ground(b.qx+40)-216});
  for(let n=0;n<6;n++){ const x=b.x0+300+r()*(b.x1-b.x0-600), h=40+r()*60; if(Math.abs(x-b.qx)>240) ST.PADS.push({k:'shroom',x:x,y:ground(x)-h,w:26+r()*10,h:h,pow:520+h,c:n,bt:0}); }
};
BUILD[5]=function(b,r){
  ST.STR.push({k:'tower',x:b.qx,y:b.hq,c1:colOf(b.qx+80)});
  ST.EGGS.push({b:b.i,x:b.qx+12,y:b.hq-108});
  addCre(b,['🧛','sit',1,'TOMATENSAFT?','',24],r,b.qx+14,b.hq);
};
BUILD[6]=function(b,r){
  ST.STR.push({k:'pillar',x:b.px,y:b.ly-18,c1:colOf(b.px+20)});
  ST.EGGS.push({b:b.i,x:b.px,y:b.ly-32});
  addCre(b,['🥚','sit',1,'KNACK?','nest',30],r,b.qx,ground(b.qx));
};
BUILD[7]=function(b,r,tier){
  ST.STR.push({k:'wreck',x:b.qx,y:b.hq,c1:colOf(b.qx+110)});
  ST.EGGS.push({b:b.i,x:b.qx+12,y:b.hq-12});
  ST.DECO.push({k:'mast',x:b.qx+12,y:b.hq-72});
  ST.LOOT.push({id:b.i*4+3,x:b.px+26,y:ground(b.px+26)+46,g:60+20*tier,bur:true,xm:true});
  addTree(b.px-44,'palm',r); addTree(b.px+52,'palm',r);
};
BUILD[8]=function(b,r){
  const y=ground(b.qx)+150;
  ST.STR.push({k:'geode',x:b.qx,y:y,c1:colOf(b.qx+140)});
  ST.EGGS.push({b:b.i,x:b.qx,y:y+30,hint:true});
};
BUILD[9]=function(b,r){
  const g=ground(b.qx); let ix=b.qx, iy=g;
  for(let k=0;k<5;k++){
    ix=b.qx-k*170; iy=g-(150+k*100);
    ST.STR.push({k:'isle',x:ix,y:iy,rx:58+r()*24,c1:colOf(ix+90)});
    if(k===1||k===3) addCre(b,['🐑','sit',1,'MÄH!','',22],r,ix-18,iy-13);
    if(k===2) ST.LOOT.push({id:b.i*4+3,x:ix,y:iy-26,g:40,bur:false,pot:true});
  }
  ST.EGGS.push({b:b.i,x:ix,y:iy-28});
  ST.STR.push({k:'rb',x:ix-44,y:iy-34,x2:ix-560,y2:ground(ix-560)-26,c1:colOf(ix)});
};
BUILD[10]=function(b,r,tier){
  const qb=b.qx/24, hT=11+tier, bxE=Math.floor((b.x1-340)/24); let bx=Math.ceil((b.x0+430)/24);
  ST.STR.push({k:'bld',bx:qb-2,w:5,h:hT,y:b.hq,c1:colOf((qb+3)*24+6)});
  ST.EGGS.push({b:b.i,x:b.qx+12,y:b.hq-24*hT-12});
  while(bx<bxE){
    const wB=2+Math.floor(r()*3), hB=3+Math.floor(r()*(6+2*tier));
    if(bx+wB<qb-3||bx>qb+4) ST.STR.push({k:'bld',bx:bx,w:wB,h:hB,y:b.hq,c1:colOf((bx+wB)*24+6)});
    bx+=wB+1+Math.floor(r()*3);
  }
};
BUILD[11]=function(b,r){
  ST.STR.push({k:'house',x:b.qx,y:b.hq,w:6,h:3,m:WOOD,c1:colOf(b.qx+110)});
  ST.EGGS.push({b:b.i,x:b.qx+50,y:b.hq-12});
  ST.DECO.push({k:'mill',x:b.px,y:ground(b.px)});
  for(let n=0;n<5;n++){ const x=b.x0+300+r()*(b.x1-b.x0-600); if(Math.abs(x-b.qx)>180) ST.PADS.push({k:'hay',x:x,y:ground(x)-20,w:17,h:20,pow:540,c:n,bt:0}); }
};
BUILD[12]=function(b,r){
  ST.DECO.push({k:'sign',x:b.qx-220,y:ground(b.qx-220),e:'🏁'});
  addCre(b,['🐑','sit',1,'MÄH. ENDE.','',24],r,b.qx-60,b.hq);
  ST.LOOT.push({id:b.i*4+3,x:b.qx+40,y:b.hq-16,g:200,bur:false,tro:true});
  ST.DECO.push({k:'door',x:WORLD_W-12,y:ground(WORLD_W-40)});
};
BUILD[13]=function(b,r){
  ST.STR.push({k:'house',x:b.qx,y:b.hq,w:5,h:3,m:ROCK,c1:colOf(b.qx+80)});
  ST.DECO.push({k:'sign',x:b.qx+90,y:b.hq,e:'🚩'});
  addCre(b,['👩‍🚀','sit',1,'WILLKOMMEN IN DER MONDSTATION!','',24],r,b.qx-2,b.hq);
  ST.LOOT.push({id:b.i*4+3,x:b.qx+26,y:b.hq-16,g:40,bur:false});
};
BUILD[14]=function(b,r){
  const y=ground(b.qx)+150;
  ST.STR.push({k:'geode',x:b.qx,y:y,c1:colOf(b.qx+140)});
  ST.LOOT.push({id:b.i*4+3,x:b.qx,y:y+30,g:60,bur:false});
};
const HOME_T=[], HOME_C=[];
function shapeWorld(){ return shapeWorldWith(WD); }

/* Setzt ein Bauwerk in die fertig erzeugten Spalten. */
function build(s){ return buildWith(WD,s); }

function scanMobile(){ return scanMobileWith(SP); }
/* Erzeugt eine Spalte der Welt: Schichten, Höhlen, Gold und Edelsteine, Wasser oder Lava in Becken, den Schneeberg. */
function genCol(cx,from){ return genColWith(WD,cx,from); }
/* Die Heimat entsteht sofort, der Rest der Welt wächst beim Reisen. */
function gen(){ return genWith(WD); }
/* Eine fremde Welt zum ersten Mal: Sie entsteht rund um den Landeplatz und wächst beim Reisen. */
function planetGen(){
  grid.fill(0); LIFE.clear(); stamp.fill(0); genF=0; ST.stI=0;
  grow(LANDX+3200);
}
function grow(toX){
  const c1=Math.min(GX,Math.ceil(toX/CELL)+1);
  if(c1<=genF) return;
  for(let cx=genF;cx<c1;cx++) genCol(cx);
  genF=c1;
  while(ST.stI<ST.STR.length&&ST.STR[ST.stI].c1<genF){ build(ST.STR[ST.stI]); ST.stI++; }
}
function packRuns(f){ return packRunsWith(grid,f); }
function unpackRuns(b,f){ return unpackRunsWith(grid,b,f); }
let cutX=0;
function loadCells(sv){
  const old=sv.v<4, f0=sv.v>=3?sv.f:HOME_GX;
  let f=Math.min(f0,GX);
  if(old&&sv.v===3) f=Math.min(f,Math.floor((OLD_END-300)/CELL));
  /* Spielstände aus der halb so breiten Welt: Wo früher das Ende der Welt lag, liegt jetzt ein neues Land. Dieser Teil wird neu erzeugt. */
  cutX=0;
  if(sv.v>=4&&!sv.w&&f>Math.floor((OLD_END-300)/CELL)){ f=Math.floor((OLD_END-300)/CELL); cutX=f*CELL-300; }
  grid.fill(0);
  if(sv.v>=5){ if(!unpackRuns(sv.runs,f0)) throw new Error('runs'); }
  else{
    const rows=old?KEEPR:GY;
    for(let cy=0;cy<rows;cy++) grid.set(sv.grid.subarray(cy*f0,cy*f0+f),cy*GX);
  }
  genF=sv.v>=3?f:HOME_GX-1;
  if(old) for(let cx=0;cx<genF;cx++) genCol(cx,KEEPR);
  ST.stI=0;
  while(ST.stI<ST.STR.length&&ST.STR[ST.stI].c1<genF){ if(old&&ST.STR[ST.stI].nw) build(ST.STR[ST.stI]); ST.stI++; }
  /* Spielstände von vor den Wissenstüren bekommen die Schatzkammern in schon erzeugte Tiefe nachträglich. */
  if(!sv.vt&&!old) for(const s of ST.STR) if(s.k==='vault'&&s.c1<genF) build(s);
  ST.seen=sv.seen||{}; ST.eggGot=sv.eggGot||{}; ST.lootGot=sv.lootGot||{}; ST.orbGot=sv.orbGot||{}; ST.DROPS=[];
}

function putUp(cx,cy,t){
  if(cx<1||cx>=GX-1) return;
  let n=0; while(n<8&&cy>1&&grid[cy*GX+cx]>=4){cy--;n++;}
  put(cx,cy,t);
}
function inMoon(wx,wy){ for(const o of ORBS){ const dx=wx-o.x, dy=wy-o.y; if(dx*dx+dy*dy<o.r*o.r) return true; } return false; }
function solidW(wx,wy){ return wy<-3000?inMoon(wx,wy):cellAt(wx,wy)>=4; }
function burns(wx,wy){ const m=cellAt(wx,wy); return (m===FIRE&&hero.up.heat<1)||(m===LAVA&&hero.up.heat<2); }
function colTop(cx,r){
  if(cx<0)cx=0; else if(cx>=GX)cx=GX-1;
  if(r<0)r=0;
  let i=r*GX+cx;
  while(r<GY&&grid[i]<4){r++;i+=GX;}
  return r;
}
function floorAt(x,yRef,step){
  if(yRef<-3000){
    const st=yRef-step; let best=1e9;
    for(const o of ORBS){
      const dx=x-o.x;
      if(Math.abs(dx)>=o.r||Math.abs(o.y-yRef)>40000) continue;
      const hh=Math.sqrt(o.r*o.r-dx*dx);
      if(st<=o.y-hh){ if(o.y-hh<best) best=o.y-hh; }
      else if(st<o.y+hh) return st;
    }
    if(best<1e8) return best;
  }
  const r0=Math.floor((yRef-step-TOP)/CELL), fx=x/CELL-.5, c=Math.floor(fx), u=fx-c;
  const a=colTop(c,r0), b=colTop(c+1,r0);
  if(Math.abs(a-b)>2) return TOP+(u<.5?a:b)*CELL;
  return TOP+(a+(b-a)*u)*CELL;
}
function surfaceY(x){ return TOP+colTop(Math.floor(x/CELL),2)*CELL; }

function steam(x,y){ return steamWith(SP,x,y); }

function step(){ return stepWith(SP); }

/* ---------- Bäume, Wolken ---------- */
const rnd=rng(20261004);
const trees=[], clouds=[];
for(let x=260;x<HOME_W-200;x+=130+rnd()*210){
  if(Math.abs(x-VOLC)<620||Math.abs(x-470)<80||Math.abs(x-3150)<80||Math.abs(x-SITE.chest-40)<90) continue;
  let near=false; for(const k of FLAT) if(Math.abs(x-SITE[k])<(k==='pond'?250:190)) near=true;
  if(near) continue;
  if(x>980&&x<2000&&rnd()<.6) continue;
  trees.push({x:x,gy:ground(x),row:grow0[Math.floor(x/CELL)],h:62+rnd()*40,state:0,t:0,s:.85+rnd()*.4});
}
for(let i=0;i<36;i++) clouds.push({x:rnd()*HOME_W,y:-170-rnd()*980,s:.7+rnd()*1.1});
/* Auf dem Schneeberg stehen die Bäume oben auf dem Schnee und sind verschneite Tannen. */
for(const tr of trees){ const cx=Math.floor(tr.x/CELL); if(mtop[cx]<grow0[cx]){ tr.row=mtop[cx]; tr.gy=TOP+mtop[cx]*CELL; } if(tr.x>SNX) tr.fir=true; }
ST.NT0=trees.length; ST.NC0=clouds.length;
for(const t of trees) HOME_T.push(Object.assign({},t));
for(const c of clouds) HOME_C.push(Object.assign({},c));

/* ---------- Schienen ---------- */
function makeTrack(raw,user){ return makeTrackWith(WD,raw,user); }
const Q={x:0,y:0,tx:1,ty:0};
function trackAt(T,s){
  const n=T.pts.length, f=clamp(s/8,0,n-1.001), i=Math.floor(f), u=f-i;
  const a=T.pts[i], b=T.pts[i+1], p=T.pts[Math.max(0,i-1)], q=T.pts[Math.min(n-1,i+2)];
  Q.x=a[0]+(b[0]-a[0])*u; Q.y=a[1]+(b[1]-a[1])*u;
  const tx=q[0]-p[0], ty=q[1]-p[1], l=Math.hypot(tx,ty)||1;
  Q.tx=tx/l; Q.ty=ty/l;
  return Q;
}
function demoTrack(){
  let b=1e9; for(let x=1040;x<=1960;x+=40) b=Math.min(b,ground(x));
  b-=26;
  const raw=[[1050,b],[1090,b-10]];
  for(let i=1;i<=10;i++) raw.push([1090+i*14,b-10-i*26]);
  for(let i=1;i<=12;i++){ const t=i/12; raw.push([1230+t*150,b-270+(1-Math.cos(t*Math.PI))/2*265]); }
  for(let i=0;i<=24;i++){ const a=i/24*TAU; raw.push([1440+70*Math.sin(a)+a*5,b-75+70*Math.cos(a)]); }
  for(let i=1;i<=14;i++){ const t=i/14; raw.push([1471+t*330,b-5-80*Math.sin(t*Math.PI)-t*40]); }
  raw.push([1840,b-15],[1880,b-5],[1920,b-15],[1950,b-40]);
  return makeTrack(raw,false);
}

/* ---------- Teilchen ---------- */
const parts=[];
/* Teilchen-Obergrenze: Ist sie erreicht, werden neue Teilchen einfach weggelassen (kostet nichts). Nur Ausrufe wie „BUMM!“ verdrängen das älteste. Auf langsamen Geräten liegt die Grenze niedriger. */
function pmax(){ return maxDpr<=1?240:460; }
function spawn(type,x,y,vx,vy,lf,size,c,col){
  if(parts.length>=pmax()){ if(type!==9) return; parts.shift(); }
  parts.push({type:type,x:x,y:y,vx:vx,vy:vy,life:lf,max:lf,size:size,c:c||0,col:col||'#fff'});
}
function smoke(x,y,n){ for(let i=0;i<n;i++) spawn(0,x+(Math.random()-.5)*20,y+(Math.random()-.5)*14,(Math.random()-.5)*60,-30-Math.random()*60,.8+Math.random(),6+Math.random()*7); }
function dust(x,y){ for(let i=0;i<7;i++) spawn(3,x+(Math.random()-.5)*20,y-2,(Math.random()-.5)*140,-40-Math.random()*90,.5,3+Math.random()*3); }
const CONF=['#e63946','#ffd23f','#3aa0e8','#58b548','#7b4fd6','#ff8a1f'];
function confetti(x,y){ for(let i=0,n=reduced?18:70;i<n;i++) spawn(6,x+(Math.random()-.5)*30,y-30,(Math.random()-.5)*420,-180-Math.random()*380,1.4+Math.random(),3+Math.random()*2,CONF[i%6]); }
let shake=0, popG=0, popM=0, popT=0;
function explode(x,y){
  const cx=Math.floor(x/CELL), r=colTop(cx,Math.floor((y-TOP)/CELL)-4);
  for(let dx=-5;dx<=5;dx++) for(let dy=1;dy<=3;dy++) if(Math.random()<.9-dy*.2) putUp(cx+dx,r-dy,FIRE);
  for(let i=0;i<34;i++) spawn(1,x,y-10,(Math.random()-.5)*380,-60-Math.random()*340,.5+Math.random()*.6,8+Math.random()*9);
  for(let i=0;i<14;i++) spawn(5,x,y-10,(Math.random()-.5)*500,-150-Math.random()*380,.9,2);
  smoke(x,y-20,14); shake=.5; sfx('boom');
}

/* ---------- Spielfigur ---------- */
function grav(){ return P.y<-1700?G*.3:G; }
let ghost=null;
let time=0, volT=3, stroke=null, strokeId=null, strokeExt=null;

function park(){ return {x:P.x,y:P.y,vy:P.vy,ang:P.mode==='rocket'?0:P.ang,face:P.face,arm:P.arm,lift:P.lift,da:P.da,load:P.load}; }
function leaveVehicle(){
  const m=P.mode;
  if(m==='walk'||m==='coaster'||m==='ski') return;
  if(m==='heli'&&heliLoad) heliDrop();
  if(m==='dragon'){ smoke(P.x,P.y-40,10); return; }
  if((m==='plane'||m==='rocket')&&!P.on) ghost={kind:m,x:P.x,y:P.y,vx:m==='plane'?(Math.abs(P.vx)>120?P.vx:P.face*220):P.vx,vy:P.vy};
  else parked[m]=park();
}
function setMode(m){
  if(m===P.mode&&m!=='coaster') return;
  if(m==='coaster'){
    if(!ST.tracks.length){ setTool('track',true); pulse('tool-track'); return; }
    leaveVehicle();
    let best=ST.tracks[0], bd=1e12;
    for(const T of ST.tracks){ const d=Math.abs(T.pts[0][0]-P.x)+Math.abs(T.pts[0][1]-P.y)-(T.user?4000:0); if(d<bd){bd=d;best=T;} }
    P.track=best; P.s=0; P.v=130;
  }else{
    const jumped=(P.mode==='plane'||P.mode==='rocket'||P.mode==='dragon'||P.mode==='balloon')&&!P.on;
    leaveVehicle();
    if(m!=='walk'){
      const pk=parked[m];
      P.load=pk?pk.load:(m==='dumper'?200:0);
      P.arm=.75; P.lift=0; P.da=0; P.ang=0; P.bed=0; P.climb=0;
      if(m!=='ski'&&m!=='dragon') parked[m]=null;
      if(m==='plane'&&!P.on) P.vx=P.face*250;
      if(m==='dragon'){ smoke(P.x,P.y-40,10); sfx('roar'); }
    }
    if(m==='walk'&&jumped){ P.vy=-230; P.vx*=.5; pulse('act'); }
  }
  P.mode=m; P.chute=false; P.air=0; P.turbo=0; P.ball=0; P.spin=0; P.rot=0; P.wall=false; P.zip=null;
  if(m==='coaster') P.on=false;
  syncUI();
}
function setTool(t,force){ ST.tool=(ST.tool===t&&!force)?null:t; stroke=null; strokeId=null; syncUI(); }
function syncUI(){
  for(const m of MODES) $('mode-'+m).setAttribute('aria-pressed',String(P.mode===m));
  for(const t of TOOLN) $('tool-'+t).setAttribute('aria-pressed',String(ST.tool===t));
  $('btn-veh').firstChild.innerHTML=IC[P.mode];
  $('btn-tool').firstChild.innerHTML=ST.tool?IC[ST.tool]:QI.hand;
  $('btn-tool').setAttribute('aria-pressed',String(!!ST.tool));
  $('tool-magic').setAttribute('aria-pressed',String(!!PAINT[ST.tool]));
}
function pulse(id){
  if(id.indexOf('mode-')===0) pulse('btn-veh'); else if(id.indexOf('tool-')===0){ pulse('btn-tool'); if(PAINT[id.slice(5)]) pulse('tool-magic'); }
  const el=$(id); if(!el||el.classList.contains('pulse')) return;
  el.classList.add('pulse');
  setTimeout(function(){el.classList.remove('pulse');},2700);
}
function flash(id,cls){ const el=$(id); el.classList.add(cls); setTimeout(function(){el.classList.remove(cls);},1300); }
function rot(lx,ly){ const c=Math.cos(P.ang), sn=Math.sin(P.ang); return [P.x+lx*c-ly*sn, P.y+lx*sn+ly*c]; }
function bucket(){ return rot(P.face*(8+56*Math.cos(P.arm)),-34+56*Math.sin(P.arm)); }
function scoop(){ return rot(P.face*38,-12-P.lift); }
function drillHead(){ return [P.x+P.face*24*Math.cos(P.da),P.y-27+24*Math.sin(P.da)]; }
/* Eine Zelle abbauen. Erdkern und Weltrand bleiben. */
function take(i){
  const m=grid[i];
  if(m<4||m===BED||m===CORE) return 0;
  if(m===SHELL&&!shellOk(i)) return 0;
  grid[i]=0;
  if(quest&&quest.type==='dig'&&!quest.done) quest.p++;
  if(m===GOLD||m===GEM){
    /* Gold und Edelsteine zählen nicht mehr (Vereinfachungsplan Schritt 2): Erz klingt und glitzert nur. */
    if(m===GOLD) qEvent('gold',1); else qEvent('gems',1);
    ST.lootDirty=true; sfx('coin');
    if(Math.random()<.5){ const y=(i/GX)|0; spawn(5,(i-y*GX)*CELL+3,TOP+y*CELL+3,(Math.random()-.5)*120,-80-Math.random()*120,.7,2); }
  }
  return 1;
}
function pile(cx,cy,k,sp){
  let n=0; sp=sp||4;
  while(k-->0){
    let c=cx-sp+(Math.random()*(2*sp+1)|0); const c2=cx-sp+(Math.random()*(2*sp+1)|0);
    if(colTop(c2,cy)>colTop(c,cy)) c=c2;
    const r=colTop(c,cy)-1;
    if(inGrid(c,r)&&grid[r*GX+c]<4){ grid[r*GX+c]=EARTH; n++; }
  }
  return n;
}
/* Auskippen: steht der Kipper unter der Schaufel, landet die Erde auf seiner Ladefläche. */
function dumpAt(b,k){
  const tk=parked.dumper;
  if(tk&&Math.abs(tk.x-b[0])<42&&b[1]<tk.y-8&&b[1]>tk.y-160){
    const n=Math.min(k,400-tk.load); tk.load+=n; if(n) dust(tk.x,tk.y-34);
    return n;
  }
  return pile(Math.floor(b[0]/CELL),Math.floor((b[1]-TOP)/CELL),k);
}
function dig(){
  const b=bucket(), cx=Math.floor(b[0]/CELL), cy=Math.floor((b[1]-TOP)/CELL);
  let n=0;
  const ea=3.6+.5*hero.up.dig, eb=5.4+.6*hero.up.dig;
  for(let dy=-8;dy<=8;dy++) for(let dx=-5;dx<=5;dx++){
    if(Math.pow(Math.abs(dx)/ea,4)+Math.pow(Math.abs(dy)/eb,4)>1) continue;
    if(inGrid(cx+dx,cy+dy)) n+=take((cy+dy)*GX+cx+dx);
  }
  if(n){
    sfx('dig');
    P.load=Math.min(400,P.load+n);
    for(let i=0;i<6;i++) spawn(3,b[0]+(Math.random()-.5)*24,b[1]+(Math.random()-.5)*30,(Math.random()-.5)*160,-60-Math.random()*120,.6,3+Math.random()*3);
    shake=Math.max(shake,.08);
  }
  return n;
}
/* Graben-Taste: gräbt, was der Löffel trifft. Trifft er nichts, senkt sich der Arm; ist er ganz unten, rollt der Bagger vor.
   Auskippen nur mit hochgehobenem Arm, damit Halten der Taste nicht abwechselnd gräbt und wieder zuschüttet. */
function baggerAct(){
  if(dig()) return;
  if(P.arm<-.15&&P.load>0){ P.load-=dumpAt(bucket(),Math.min(16,P.load)); return; }
  if(P.arm<1.25) P.arm=Math.min(1.25,P.arm+.22);
  else if(P.on) P.vx=P.face*90;
}
/* Radlader: schiebt und schaufelt auf Bodenhöhe, gräbt nicht nach unten. Schaufel oben = auskippen. */
function loaderAct(){
  const b=scoop(), cx=Math.floor(b[0]/CELL), cy=Math.floor((b[1]-TOP)/CELL);
  let n=0;
  if(P.load<200) for(let dy=-3;dy<=0;dy++) for(let dx=-3;dx<=3;dx++) if(inGrid(cx+dx,cy+dy)) n+=take((cy+dy)*GX+cx+dx);
  if(n){ P.load+=n; dust(b[0],b[1]); sfx('dig'); return; }
  if(P.lift>18&&P.load>0){ P.load-=dumpAt([b[0]+P.face*24,b[1]],Math.min(24,P.load)); return; }
  if(P.on&&P.lift<=18) P.vx=P.face*120;
}
function dumperAct(){
  P.bed=1;
  if(P.load<=0) return;
  const b=rot(-P.face*78,-66);
  P.load-=pile(Math.floor(b[0]/CELL),Math.floor((b[1]-TOP)/CELL),Math.min(18,P.load),7);
}
function bore(x,y,r){
  const c0=Math.floor((x-r)/CELL), c1=Math.floor((x+r)/CELL), r0=Math.floor((y-r-TOP)/CELL), r1=Math.floor((y+r-TOP)/CELL);
  let n=0;
  for(let cy=r0;cy<=r1;cy++) for(let cx=c0;cx<=c1;cx++){
    if(!inGrid(cx,cy)) continue;
    const dx=(cx+.5)*CELL-x, dy=TOP+(cy+.5)*CELL-y;
    if(dx*dx+dy*dy<=r*r) n+=take(cy*GX+cx);
  }
  return n;
}
function bulldoze(dir){
  const xa=P.x+dir*12, xb=P.x+dir*38, c0=Math.floor(Math.min(xa,xb)/CELL), c1=Math.floor(Math.max(xa,xb)/CELL);
  const r0=Math.floor((P.y-50-TOP)/CELL), r1=Math.floor((P.y-2-TOP)/CELL);
  let n=0;
  for(let cy=r0;cy<=r1;cy++) for(let cx=c0;cx<=c1;cx++) if(inGrid(cx,cy)) n+=take(cy*GX+cx);
  if(n) dust(P.x+dir*24,P.y-10);
  return n;
}
function doAction(){
  if(P.zip){ keys.u=true; zipRide(0); keys.u=false; return; }
  if(P.mode==='walk'){
    const zn=zipNear(); if(zn){ zipGo(zn); return; }
    if(nearScope()){ scopeOpen(); return; }
    if(deepAct()) return;
    if(nearLift()){ rideLift(); return; }
    if(ST.tool==='bow'){ shoot(); return; }
    if(DIGT[ST.tool]){ handDig(); return; }
    if(P.on){ P.vy=-400*(FX.sugar>0?1.3:1)*(FX.tiny>0?.8:1); P.on=false; P.air=0; sfx('jump'); }
    else P.chute=!P.chute;
  }else if(P.mode==='car'){
    P.turbo=1.5; if(P.on) P.vx=P.face*520; else P.vx+=P.face*200;
  }else if(P.mode==='bagger'){ baggerAct(); P.digT=.25; }
  else if(P.mode==='loader'){ loaderAct(); P.digT=.25; }
  else if(P.mode==='dumper'){ dumperAct(); P.digT=.2; }
  else if(P.mode==='tbm'){ P.digT=0; }
  else if(P.mode==='ski') skiAct();
  else if(P.mode==='dragon'){ P.digT=0; }
  else if(P.mode==='sub') sonar();
  else if(P.mode==='heli'&&(!P.on||heliLoad)) heliHook();
  else if(P.mode==='boat'&&boatWet()){ blip(220,210,.5,'sawtooth',.06); shout(P.x,P.y-90,'TUUT!'); }
  else setMode('walk');
}
function burn(){
  P.hurt=.9; P.soot=4; P.vy=-440; P.on=false; P.vx+=(Math.random()-.5)*160;
  smoke(P.x,P.y-16,9); shake=Math.max(shake,.25);
}
function boundsX(){
  if(realm){ if(P.x<RX0) wrapX(RW); else if(P.x>=RX0+RW) wrapX(-RW); return; }
  if(P.x<40){P.x=40; if(P.vx<0)P.vx=0; if(P.mode==='plane')P.face=1;}
  if(P.x>WORLD_W-40){P.x=WORLD_W-40; if(P.vx>0)P.vx=0; if(P.mode==='plane')P.face=-1;}
}
/* Auf einer fremden Welt geht es rundherum: Wer am Ende hinausläuft, kommt am Anfang wieder herein. */
function wrapX(d){
  P.x+=d; cam.x+=d; pet.x+=d; parts.length=0; ghost=null;
  grow(Math.max(P.x,cam.x)+3200); scanMobile();
  if(!ST.seen.round&&ST.BIO.every(function(b){ return ST.seen[b.i]; })){ ST.seen.round=1; ST.lootDirty=true; confetti(P.x,P.y); jingle(); banner('🌍',2400); say('','Du bist einmal ganz um '+rlm().n+' herum gereist!'); }
}
function mover(dt,hw,h,step,half){
  let hit=false;
  if(solidW(P.x,P.y-step-3)&&solidW(P.x,P.y-h*.5)){ P.y-=5; if(P.vy>0)P.vy=0; }
  if(P.vx!==0){
    const nx=P.x+P.vx*dt, ex=nx+(P.vx>0?hw:-hw);
    if(solidW(ex,P.y-step-2)||solidW(ex,P.y-h*.55)||solidW(ex,P.y-h+2)) hit=true; else P.x=nx;
    boundsX();
  }
  let ny=P.y+P.vy*dt;
  if(P.vy<0&&(solidW(P.x,ny-h)||solidW(P.x-hw*.6,ny-h)||solidW(P.x+hw*.6,ny-h))){ ny=P.y; P.vy=0; }
  const sl=skyLim(); if(ny<sl){ ny=sl; if(P.vy<0)P.vy=0; }
  const fc=floorAt(P.x,P.y,step), fb=floorAt(P.x-half,P.y,step), ff=floorAt(P.x+half,P.y,step);
  const f=Math.min(fc,(fb+ff)/2);
  P.gs=clamp((ff-fb)/(2*half),-1.3,1.3);
  P.landed=false;
  if(ny>=f){ if(!P.on) P.landed=true; ny=f; P.on=true; }
  else if(f-ny>2.5) P.on=false;
  P.y=ny;
  return hit;
}

function updWalk(dt,ix,u,d){
  if(FX.slip>0){ ix=P.face; u=0; }
  if(ix) P.face=ix;
  if(d) P.chute=false;
  const wm=cellAt(P.x,P.y-12), wet=wm===WATER||(wm===LAVA&&hero.up.heat>=2), icy=P.on&&cellAt(P.x,P.y+2)===ICE;
  if(P.on) P.vx+=(ix*150*fxSpeed()*(1+.1*hero.up.motor)-P.vx)*Math.min(1,dt*(icy?1.2:10));
  else if(ix) P.vx+=(ix*(P.chute?120:220)-P.vx)*Math.min(1,dt*2.5);
  else P.vx-=P.vx*Math.min(1,dt*.5);
  if(u){
    P.vy+=((P.y<-1200?-430:-240)*(1+.25*hero.up.jet)-P.vy)*Math.min(1,dt*6); P.on=false; P.chute=false;
    if(!wet&&Math.random()<dt*40) spawn(1,P.x-P.face*8,P.y-14,(Math.random()-.5)*30,130,.25,4);
  }
  else if(FX.float>0){ P.vy+=(-110-P.vy)*Math.min(1,dt*4); P.on=false; }
  else if(P.chute) P.vy+=(75-P.vy)*Math.min(1,dt*4);
  else P.vy+=grav()*dt;
  if(wet){ P.soot=0; P.chute=false; P.vx-=P.vx*Math.min(1,dt*2); if(!u){ P.vy-=G*.8*dt; P.vy-=P.vy*Math.min(1,dt*3); } }
  if(P.vy>700) P.vy=700;
  const pv=P.vy;
  mover(dt,5,30,14,3);
  if(P.on){
    if(P.landed&&pv>350){ dust(P.x,P.y); if(FX.big>0) shake=Math.max(shake,.3); }
    P.chute=false; P.air=0; P.vy=P.gs*P.vx; P.run+=Math.abs(P.vx)*dt*.11;
  }else{
    P.air+=dt;
    if(!P.chute&&!u&&!wet&&P.vy>520&&floorAt(P.x,P.y,0)-P.y<300) P.chute=true;
  }
}
function updCar(dt,ix,u,d){
  if(ix) P.face=ix;
  const maxv=(P.turbo>0?520:300)*(1+.15*hero.up.motor), icy=P.on&&cellAt(P.x,P.y+2)===ICE, wet=cellAt(P.x,P.y-10)===WATER;
  if(P.climb>0){ P.climb-=dt; P.vx=P.face*70; P.vy=0; }
  else{
    if(P.on){
      const tgt=d?0:ix*maxv;
      P.vx+=(tgt-P.vx)*Math.min(1,dt*(icy?.4:(ix||d?2.5:1)));
      if(P.turbo>0&&Math.abs(P.vx)<maxv) P.vx+=P.face*600*dt;
      if(u){ P.vy=-380; P.on=false; sfx('jump'); }
    }else P.vx+=ix*80*dt;
    P.vy=Math.min(P.vy+grav()*dt,800);
  }
  if(wet){ P.vx-=P.vx*Math.min(1,dt*2); P.soot=0; }
  if(P.turbo>0&&Math.random()<dt*50) spawn(1,P.x-P.face*30,P.y-13,-P.face*120,(Math.random()-.5)*40,.3,6);
  const pv=P.vy;
  if(mover(dt,24,32,26,17)){
    /* Auch das Auto bleibt in keinem Loch stecken: an einer Wand klettert es hoch, unter einem Überhang schiebt es sich frei. */
    const top=P.y-54;
    if(!ix) P.vx*=-.2;
    else if(!solidW(P.x,top)&&!solidW(P.x-15,top)&&!solidW(P.x+15,top)){ P.y-=150*dt; P.on=false; P.climb=.25; }
    else bulldoze(ix);
  }
  if(P.on){ if(P.landed&&pv>300) dust(P.x,P.y); P.vy=P.gs*P.vx; P.climb=0; }
  const ta=P.climb>0?-P.face*.6:(P.on?Math.atan(P.gs):Math.atan2(P.vy,Math.abs(P.vx)+200)*P.face*.5);
  P.ang+=(ta-P.ang)*Math.min(1,dt*10);
}
/* Baufahrzeuge fahren sich nie fest: an einer Wand klettern sie hoch; ist darüber kein Platz, räumen sie sich den Weg frei. */
function drive(dt,ix,sp,hw,h,half,vmax){
  if(ix) P.face=ix;
  if(P.climb>0){ P.climb-=dt; P.vx=P.face*70; P.vy=0; }
  else{
    if(P.on) P.vx+=(ix*sp*(1+.2*hero.up.motor)-P.vx)*Math.min(1,dt*5); else P.vx+=(ix*70-P.vx)*Math.min(1,dt*2);
    P.vy=Math.min(P.vy+grav()*dt,vmax||800);
  }
  if(cellAt(P.x,P.y-10)===WATER){ P.vx-=P.vx*Math.min(1,dt*2); P.soot=0; }
  const pv=P.vy;
  if(mover(dt,hw,h,32,half)){
    if(ix){
      const top=P.y-h-20;
      if(!solidW(P.x,top)&&!solidW(P.x-15,top)&&!solidW(P.x+15,top)){ P.y-=150*dt; P.on=false; P.climb=.25; }
      else bulldoze(ix);
    }else P.vx=0;
  }
  if(P.on){ if(P.landed&&pv>300) dust(P.x,P.y); P.vy=P.gs*P.vx; P.climb=0; }
  P.ang+=((P.climb>0?-P.face*.6:(P.on?Math.atan(P.gs):0))-P.ang)*Math.min(1,dt*10);
}
function updBagger(dt,ix,u,d){
  P.arm=clamp(P.arm+(d-u)*1.7*dt,-.95,1.25);
  drive(dt,ix,110,22,28,15);
  if(keys.a){ P.digT-=dt; if(P.digT<=0){ baggerAct(); P.digT=.17/(1+.35*hero.up.dig); } }
}
function updLoader(dt,ix,u,d){
  P.lift=clamp(P.lift+(u-d)*90*dt,0,64);
  drive(dt,ix,170,26,30,17);
  if(keys.a){ P.digT-=dt; if(P.digT<=0){ loaderAct(); P.digT=.17/(1+.35*hero.up.dig); } }
}
function updDumper(dt,ix,u,d){
  drive(dt,ix,230,30,32,20);
  P.bed=Math.max(0,P.bed-dt*1.6);
  if(keys.a){ P.digT-=dt; if(P.digT<=0){ dumperAct(); P.digT=.14; } }
}
/* Tunnelbohrmaschine: bohrt beim Fahren ein rundes Loch in Fahrtrichtung, auch durch Fels. ▲/▼ kippt den Bohrkopf, bis senkrecht nach oben oder unten. Ganz gekippt bohrt ▲ oder ▼ allein weiter.
   Steil nach oben fährt sie dem Bohrkopf nach statt waagerecht, und im Schacht hält sie sich fest, statt zurückzurutschen. */
function updTbm(dt,ix,u,d){
  P.da=clamp(P.da+(d-u)*1.3*dt,-1.5,1.5);
  let go=ix||(keys.a?P.face:0), cutN=0;
  if(!go&&((u&&P.da<=-1.45)||(d&&P.da>=1.45))) go=P.face;
  const up=P.da<-.6, shaft=solidW(P.x-30,P.y-20)||solidW(P.x+30,P.y-20);
  if(go){
    P.face=go;
    const hd=drillHead();
    cutN=bore(hd[0],hd[1],27);
    if(up) cutN+=bore(P.x,P.y-27,27);
    else if(P.da>.2) cutN+=bore(P.x+go*14,P.y-27,27);
    if(cutN){
      shake=Math.max(shake,.04); sfx('dig');
      if(Math.random()<dt*16) spawn(3,hd[0]+(Math.random()-.5)*30,hd[1]+(Math.random()-.5)*40,-go*(40+Math.random()*120),-40-Math.random()*90,.6,3+Math.random()*3);
    }
  }
  if(up&&go&&(cutN||shaft)){
    const sp=80*(1+.15*hero.up.dig);
    P.vx=go*sp*Math.cos(P.da); P.vy=sp*Math.sin(P.da); P.on=false; P.climb=0;
    mover(dt,24,46,32,14);
    P.ang-=P.ang*Math.min(1,dt*10);
  }else if(up&&!go&&shaft&&!P.on){ P.vx=0; P.vy=0; }
  else drive(dt,go,P.da>0?85*Math.max(.3,Math.cos(P.da)):95,24,46,14,170+60*hero.up.dig);
}
/* Rakete: ▲ zündet das Triebwerk, ◀ ▶ steuert in der Luft. Ohne Schub sinkt sie langsam. */
function updRocket(dt,ix,u,d){
  if(u){
    if(P.on){ P.on=false; P.y-=3; shake=Math.max(shake,.3); smoke(P.x,P.y,8); }
    P.vy+=(-800*(1+.2*hero.up.jet)-P.vy)*Math.min(1,dt*1.5);
    if(Math.random()<dt*50) spawn(1,P.x+(Math.random()-.5)*8,P.y+6,(Math.random()-.5)*50,160+Math.random()*120,.35,7);
  }
  else P.vy=Math.min(P.vy+grav()*.8*dt,d?720:400);
  if(P.on) P.vx-=P.vx*Math.min(1,dt*8);
  else{ P.vx+=(ix*230-P.vx)*Math.min(1,dt*2.5); if(ix) P.face=ix; }
  const pv=P.vy;
  if(mover(dt,13,56,26,9)) P.vx*=-.3;
  if(P.on){ if(P.landed&&pv>200) dust(P.x,P.y); P.vy=0; }
  P.ang+=((P.on?0:clamp(P.vx/230,-1,1)*.35)-P.ang)*Math.min(1,dt*6);
}
function updPlane(dt,ix,u,d){
  if(ix) P.face=ix;
  if(P.on){
    P.vx+=(ix*260-P.vx)*Math.min(1,dt*(ix?1.3:(P.y<-3000?4:.9)));
    if(u&&Math.abs(P.vx)<130) P.vx+=P.face*320*dt;
    P.upT=u?(P.upT||0)+dt:0;
    P.vy=Math.min(P.vy+grav()*dt,800);
    if(mover(dt,30,28,26,18)) P.vx=0;
    if(P.on){
      P.vy=P.gs*P.vx; P.ang=Math.atan(P.gs);
      /* Abheben geht auch ohne Anlauf, damit das Flugzeug aus jedem Loch herauskommt. */
      if((u&&Math.abs(P.vx)>120)||Math.abs(P.vx)>235||P.upT>.45){ P.on=false; P.vy=u?-130:-60; P.y-=3; P.upT=0; }
    }
  }else{
    P.vx+=(P.face*250*(1+.15*hero.up.jet)-P.vx)*Math.min(1,dt*2);
    P.vy+=((d-u)*(P.y<-1200?430:190)*(1+.2*hero.up.jet)-P.vy)*Math.min(1,dt*3);
    if(P.y<-1200&&Math.random()<dt*40) spawn(1,P.x-P.face*36,P.y-16,-P.face*90,(Math.random()-.5)*30,.3,6);
    if(mover(dt,30,28,26,18)){ P.face=-P.face; P.vx=P.face*80; }
    if(P.on){ P.vy=0; dust(P.x,P.y); }
  }
}
function updCoaster(dt,ix){
  const T=P.track;
  if(T.lift){ liftRide(dt); return; }
  let q=trackAt(T,P.s);
  P.v+=G*.9*q.ty*dt+ix*T.dir*220*dt;
  P.v-=P.v*.08*dt;
  if(P.v<90) P.v+=(90-P.v)*Math.min(1,dt*4);
  if(P.v>1000) P.v=1000;
  P.s+=P.v*dt;
  q=trackAt(T,P.s);
  P.x=q.x; P.y=q.y; P.vx=q.tx*P.v; P.vy=q.ty*P.v; P.ang=Math.atan2(q.ty,q.tx); P.face=T.dir;
  if(P.s>=T.len){
    qEvent('ride',1);
    P.vy-=90; P.mode='walk'; P.on=false; P.air=.2; P.chute=false;
    syncUI();
  }
}
function settle(o,dt){
  const f=floorAt(o.x,o.y,26);
  if(o.y<f-1){ o.vy+=G*dt; if(o===parked.balloon&&o.vy>70) o.vy=70; o.y=Math.min(f,o.y+o.vy*dt); }
  else{ o.y=f; o.vy=0; o.ang+=(Math.atan(clamp((floorAt(o.x+16,o.y,26)-floorAt(o.x-16,o.y,26))/32,-1.3,1.3))-o.ang)*Math.min(1,dt*10); }
}

function update(dt){
  time+=dt;
  const ix=(keys.r?1:0)-(keys.l?1:0), u=keys.u?1:0, d=keys.d?1:0;
  if(P.hurt>0)P.hurt-=dt; if(P.soot>0)P.soot-=dt; if(P.frost>0)P.frost-=dt; if(P.turbo>0)P.turbo-=dt; if(shake>0)shake-=dt;
  popT-=dt;
  if(popT<=0&&(popG||popM)){
    if(popG) spawn(9,P.x-12,P.y-60,0,-55,.9,17,'+'+popG,'#ffd23f');
    if(popM) spawn(9,P.x+16,P.y-74,0,-55,.9,17,'+'+popM,'#7fe3f0');
    popG=0; popM=0; popT=.4;
  }
  if(P.swing>0) P.swing=Math.max(0,P.swing-dt*5);
  if(keys.a&&DIGT[ST.tool]&&P.mode==='walk'&&!ST.paused&&!zipNear()&&!deepIcon()) handDig();
  else if(P.mode==='walk'&&!ST.paused&&(ix||u||d)) pushDig(ix,u,d);
  if(P.zip) zipRide(dt);
  else if(P.mode==='walk') updWalk(dt,ix,u,d);
  else if(P.mode==='car') updCar(dt,ix,u,d);
  else if(P.mode==='plane') updPlane(dt,ix,u,d);
  else if(P.mode==='bagger') updBagger(dt,ix,u,d);
  else if(P.mode==='loader') updLoader(dt,ix,u,d);
  else if(P.mode==='dumper') updDumper(dt,ix,u,d);
  else if(P.mode==='tbm') updTbm(dt,ix,u,d);
  else if(P.mode==='rocket') updRocket(dt,ix,u,d);
  else if(P.mode==='ski') updSki(dt,ix,u,d);
  else if(P.mode==='dragon') updDragon(dt,ix,u,d);
  else if(P.mode==='sub') updSub(dt,ix,u,d);
  else if(P.mode==='balloon') updBalloon(dt,ix,u,d);
  else if(P.mode==='heli') updHeli(dt,ix,u,d);
  else if(P.mode==='boat') updBoat(dt,ix,u,d);
  else if(P.mode==='bug') updBug(dt,ix,u,d);
  else updCoaster(dt,ix);

  if(P.mode!=='coaster'&&P.mode!=='dragon'&&P.hurt<=0&&FX.star<=0){
    let hot=burns(P.x,P.y-4)||burns(P.x,P.y-16);
    if(P.mode!=='walk'&&P.mode!=='ski'&&P.mode!=='plane'&&P.mode!=='rocket') hot=hot||burns(P.x-20,P.y-5)||burns(P.x+20,P.y-5);
    if(P.mode==='plane') hot=hot||burns(P.x+24*P.face,P.y-10);
    if(cellAt(P.x,P.y+3)===CORE) qEvent('core',1);
    if(hot||(hero.up.heat<3&&cellAt(P.x,P.y+3)===CORE)) burn();
  }
  if(P.soot>0&&Math.random()<dt*8) spawn(0,P.x,P.y-30,(Math.random()-.5)*20,-40,.7,4);

  for(let i=bombs.length-1;i>=0;i--){
    const bm=bombs[i]; bm.t-=dt;
    if(!solidW(bm.x,bm.y+7)){ bm.vy=Math.min(bm.vy+G*dt,560); bm.y+=bm.vy*dt; } else bm.vy=0;
    if(bm.t<=0){ bombs.splice(i,1); blast(bm.x,bm.y); }
  }
  if(hero.pet){ pet.x+=(P.x-P.face*30-pet.x)*Math.min(1,dt*4); pet.y+=(P.y-16-pet.y)*Math.min(1,dt*5); }
  for(const k in parked) if(parked[k]&&!(k===heliLoad&&P.mode==='heli')) settle(parked[k],dt);
  if(parked.rocket) parked.rocket.ang=0;
  if(ghost){
    ghost.vy+=150*dt; ghost.x+=ghost.vx*dt; ghost.y+=ghost.vy*dt;
    if(ghost.x<50||ghost.x>WORLD_W-50) ghost.vx*=-1;
    if(Math.random()<dt*18) spawn(0,ghost.x,ghost.y-14,0,-10,.9,5);
    if(solidW(ghost.x,ghost.y)||solidW(ghost.x+(ghost.vx>0?30:-30),ghost.y-14)||hotAt(ghost.x,ghost.y-8)){ explode(ghost.x,ghost.y); ghost=null; }
  }
  for(const tr of trees){
    if(tr.state!==1) continue;
    tr.t-=dt;
    if(Math.random()<dt*22) spawn(1,tr.x+(Math.random()-.5)*34*tr.s,tr.gy-tr.h+(Math.random()-.3)*30,(Math.random()-.5)*20,-50-Math.random()*50,.5+Math.random()*.4,6+Math.random()*5);
    if(Math.random()<dt*5) spawn(0,tr.x,tr.gy-tr.h-20,(Math.random()-.5)*20,-50,1.2,7);
    if(tr.t<=0) tr.state=2;
  }
  if(Math.abs(cam.x-VOLC)<1500){
    const cy=ground(VOLC)-30, live=cellAt(VOLC,cy+8)===LAVA||cellAt(VOLC-30,cy+8)===LAVA||cellAt(VOLC+30,cy+8)===LAVA;
    if(live&&Math.random()<dt*5) spawn(0,VOLC+(Math.random()-.5)*90,cy,(Math.random()-.5)*20,-45-Math.random()*30,2.2,9+Math.random()*8);
    volT-=dt;
    if(volT<=0){
      volT=6+Math.random()*6;
      if(live) for(let i=0;i<10;i++) spawn(4,VOLC+(Math.random()-.5)*60,cy,(Math.random()-.5)*340,-380-Math.random()*220,2.4,4+Math.random()*3);
    }
    /* Ab und zu ein großer Ausbruch: Es rumpelt, Lava spritzt hoch und ein paar glühende Lavabrocken landen am Hang. Dem Kind passiert nichts. */
    eruT-=dt;
    if(live&&eruT<=0&&Math.abs(P.x-VOLC)<900){
      eruT=80+Math.random()*50; eruOn=3; blip(70,40,1.2,'sawtooth',.09); shout(VOLC,cy-120,'RUMMS!','#ff9a3c');
      for(let i=0;i<3&&MROCKS.length<6;i++){ const d=(i%2?1:-1), tx=VOLC+d*(140+Math.random()*180), ty=ground(tx), tt=1.6, sy=cy-10;
        METS.push({x:VOLC,y:sy,vx:(tx-VOLC)/tt,vy:(ty-sy-300*tt*tt)/tt,g:600,t:tt,land:true,tr:[]}); }
    }
    if(eruOn>0){ eruOn-=dt; for(let i=0;i<3;i++) spawn(4,VOLC+(Math.random()-.5)*40,cy,(Math.random()-.5)*260,-520-Math.random()*300,2.6,4+Math.random()*4); if(Math.random()<dt*20) spawn(0,VOLC+(Math.random()-.5)*60,cy-20,(Math.random()-.5)*30,-90,3,14+Math.random()*10); }
  }
  let pw=0;
  for(let i=0;i<parts.length;i++){
    const p=parts[i]; p.life-=dt;
    if(p.life<=0) continue;
    parts[pw++]=p;
    if(p.type===0||p.type===7){ p.vy-=20*dt; p.size+=9*dt; }
    else if(p.type===1) p.vy-=70*dt;
    else if(p.type===2) p.vy-=10*dt;
    else if(p.type===6){ p.vy+=G*.35*dt; p.vx-=p.vx*dt*1.5; }
    else if(p.type<8) p.vy+=G*.6*dt;
    else if(p.type===10) p.vy+=G*.45*dt;
    else if(p.type===12){ p.vy-=18*dt; p.size+=5*dt; }
    p.x+=p.vx*dt; p.y+=p.vy*dt;
    if(p.type===4&&p.vy>0&&solidW(p.x,p.y)) p.life=0;
  }
  parts.length=pw;
  const vw=W/S, vh=H/S;
  /* Beim Schienenmalen schiebt der Finger am Bildrand die Kamera weiter, so lassen sich lange und hohe Bahnen in einem Zug malen. */
  const sp=strokeId!==null&&stroke?pointers.get(strokeId):null;
  if(sp){
    const v=330*dt, topS=Math.min(H*.4,150);
    if(sp.x<64) pan.x-=v; else if(sp.x>W-64) pan.x+=v;
    if(sp.y<topS+56) pan.y-=v; else if(sp.y>H-190) pan.y+=v;
    pan.x=clamp(pan.x,-3000,3000); pan.y=clamp(pan.y,-5200,1500);
    const w=toWorld(sp.x,sp.y), l=stroke[stroke.length-1];
    if(stroke.length<900&&Math.hypot(w[0]-l[0],w[1]-l[1])>10) stroke.push(w);
  }else{ pan.x-=pan.x*Math.min(1,dt*2.5); pan.y-=pan.y*Math.min(1,dt*2.5); }
  const tx=P.x+clamp(P.vx*.3,-110,110)+pan.x, ty=P.y-vh*.08-20+pan.y;
  cam.x+=(tx-cam.x)*Math.min(1,dt*4); cam.y+=(ty-cam.y)*Math.min(1,dt*5);
  if(!realm&&vw<WORLD_W) cam.x=clamp(cam.x,vw/2,WORLD_W-vw/2);
}

/* ---------- Malen mit dem Finger ---------- */
const pointers=new Map();
function toWorld(sx,sy){ return [cam.x+(sx-W/2)/S, cam.y+(sy-H/2)/S]; }
function disc(cx,cy,r,m){
  const n=Math.ceil(r);
  for(let dy=-n;dy<=n;dy++) for(let dx=-n;dx<=n;dx++){
    if(dx*dx+dy*dy>r*r) continue;
    const x=cx+dx, y=cy+dy;
    if(inGrid(x,y)&&grid[y*GX+x]<4){ grid[y*GX+x]=m; lifeS(y*GX+x,0); }
  }
}
function erase(wx,wy){
  const cx=Math.floor(wx/CELL), cy=Math.floor((wy-TOP)/CELL);
  for(let dy=-4;dy<=4;dy++) for(let dx=-4;dx<=4;dx++){
    if(dx*dx+dy*dy>18) continue;
    const x=cx+dx, y=cy+dy;
    if(!inGrid(x,y)) continue;
    const m=grid[y*GX+x];
    if(m===LAVA||m===FIRE||m===WATER||m===ICE||m===WOOD||m===SNOW){ grid[y*GX+x]=0; lifeS(y*GX+x,0); }
  }
  ST.props=ST.props.filter(function(o){ return Math.abs(o.x-wx)>30||wy>o.y+10||wy<o.y-110; });
  for(let k=ST.tracks.length-1;k>=0;k--){
    const T=ST.tracks[k];
    if(wx<T.minX-20||wx>T.maxX+20) continue;
    for(let i=0;i<T.pts.length;i+=2){
      const p=T.pts[i];
      if(Math.abs(p[0]-wx)<18&&Math.abs(p[1]-wy)<18){
        if(P.mode==='coaster'&&P.track===T) setMode('walk');
        ST.tracks.splice(k,1); break;
      }
    }
  }
}
/* Zauberkasten: Malen kostet Akku je Zelle, die wirklich neu den Stoff bekommt (Entscheidung 8.11.). Gezählt wird im Pinselbereich vorher und nachher;
   putUp klettert bis zu 8 Zellen nach oben, darum reicht das Fenster 11 Zellen hoch. Wählen und Stillhalten kosten nichts. */
const PAINTM={lava:LAVA,fire:FIRE,water:WATER,ice:ICE,earth:EARTH,snow:SNOW}, PAINTC=.012;
function paintCount(cx,cy,m){
  let n=0;
  for(let y=cy-11;y<=cy+3;y++) for(let x=cx-3;x<=cx+3;x++) if(inGrid(x,y)&&grid[y*GX+x]===m) n++;
  return n;
}
function paintAt(wx,wy){
  const cx=Math.floor(wx/CELL), cy=Math.floor((wy-TOP)/CELL);
  const pm=PAINTM[ST.tool], n0=pm===undefined?0:paintCount(cx,cy,pm);
  paintDo(wx,wy,cx,cy);
  if(pm!==undefined){ const d=paintCount(cx,cy,pm)-n0; if(d>0) paintPay(d*PAINTC); }
}
function paintPay(e){
  if(ST.energy<=0) return;
  ST.energy=Math.max(0,ST.energy-e);
  if(ST.energy<=0) drain(0);
}
function paintDo(wx,wy,cx,cy){
  if(ST.tool==='lava'||ST.tool==='water'){
    const t=ST.tool==='lava'?LAVA:WATER;
    if(t===LAVA?lavaCount>=MAX_LAVA:waterCount>=MAX_WATER){ pulse('tool-erase'); return; }
    putUp(cx,cy,t);putUp(cx+1,cy,t);putUp(cx-1,cy,t);putUp(cx,cy-1,t);putUp(cx,cy+1,t);
    if(t===WATER){ putUp(cx+1,cy-1,t); putUp(cx-1,cy-1,t); }
  }
  else if(ST.tool==='fire'){ putUp(cx,cy,FIRE); putUp(cx+1,cy,FIRE); }
  else if(ST.tool==='earth') disc(cx,cy,1.7,EARTH);
  else if(ST.tool==='ice') disc(cx,cy,2.3,ICE);
  else if(ST.tool==='snow') disc(cx,cy,2.3,SNOW);
  else if(ST.tool==='blocks') fillBlock(cx>>2,cy>>2);
  else if(ST.tool==='erase') erase(wx,wy);
}
function paintStep(){
  if(!ST.tool||ST.tool==='track'||ST.tool==='rope') return;
  if(ST.tool==='bow'){ pointers.forEach(function(p){ if(!p.has){ p.has=true; const w=toWorld(p.x,p.y); shoot(w[0],w[1]); } }); return; }
  if(HANDT[ST.tool]){ pointers.forEach(function(p){ const w=toWorld(p.x,p.y); if(Math.hypot(w[0]-P.x,w[1]-P.y+20)<95) handDig(w[0],w[1]); }); return; }
  pointers.forEach(function(p){
    const w=toWorld(p.x,p.y);
    if(ST.tool==='tnt'){ if(!p.has){ p.has=true; dropBomb(w[0],w[1]); } return; }
    if(ST.tool==='ball'||ST.tool==='fw'){ if(!p.has||time-p.bt>(ST.tool==='ball'?.28:.4)){ p.has=true; p.bt=time; if(ST.tool==='ball') throwBall(w[0],w[1]); else firework(w[0],w[1]); } return; }
    if(ST.tool==='man'){ if(!p.has){ p.has=true; addMan(w[0]); } return; }
    if(p.has){
      const dist=Math.hypot(w[0]-p.lx,w[1]-p.ly), n=Math.min(18,Math.max(1,Math.ceil(dist/CELL)));
      for(let k=1;k<=n;k++) paintAt(p.lx+(w[0]-p.lx)*k/n,p.ly+(w[1]-p.ly)*k/n);
    }else paintAt(w[0],w[1]);
    p.lx=w[0]; p.ly=w[1]; p.has=true;
  });
}
cv.addEventListener('pointerdown',function(e){
  e.preventDefault();
  try{cv.setPointerCapture(e.pointerId);}catch(_){}
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,has:false,lx:0,ly:0});
  armGhost(cv);
  if(!ST.tool) tapWorld(e.clientX,e.clientY);
  if(ST.tool==='rope') pointers.get(e.pointerId).rs=toWorld(e.clientX,e.clientY);
  if(ST.tool==='track'&&strokeId===null){
    const w=toWorld(e.clientX,e.clientY);
    strokeId=e.pointerId; strokeExt=null; stroke=[w];
    for(const T of ST.tracks){
      const a=T.pts[0], b=T.pts[T.pts.length-1];
      if(Math.hypot(w[0]-b[0],w[1]-b[1])<46){ strokeExt={T:T,end:true}; stroke=[[b[0],b[1]]]; break; }
      if(Math.hypot(w[0]-a[0],w[1]-a[1])<46){ strokeExt={T:T,end:false}; stroke=[[a[0],a[1]]]; break; }
    }
  }
});
cv.addEventListener('pointermove',function(e){
  const p=pointers.get(e.pointerId); if(!p) return;
  p.x=e.clientX; p.y=e.clientY;
  if(e.pointerId===strokeId&&stroke&&stroke.length<900){
    const w=toWorld(p.x,p.y), l=stroke[stroke.length-1];
    if(Math.hypot(w[0]-l[0],w[1]-l[1])>10) stroke.push(w);
  }
});
function endPointer(e){
  const pp=pointers.get(e.pointerId);
  if(pp&&pp.rs&&ST.tool==='rope'){ const w=toWorld(pp.x,pp.y); zipAdd(pp.rs[0],pp.rs[1],w[0],w[1]); }
  pointers.delete(e.pointerId);
  if(e.pointerId===strokeId){
    const ex=strokeExt, k=ex?ST.tracks.indexOf(ex.T):-1;
    if(ex&&k>=0){
      if(stroke&&stroke.length>2){
        const add=stroke.slice(1);
        let raw=ex.end?ex.T.raw.concat(add):add.reverse().concat(ex.T.raw);
        if(raw.length>2600) raw=ex.end?raw.slice(raw.length-2600):raw.slice(0,2600);
        const N=makeTrack(raw,true);
        if(N){
          if(P.mode==='coaster'&&P.track===ex.T){ if(!ex.end) P.s+=N.len-ex.T.len; P.track=N; }
          ST.tracks[k]=N; pulse('mode-coaster');
        }
      }
    }else{
      const T=makeTrack(stroke,true);
      if(T){ ST.tracks.push(T); if(ST.tracks.length>12) ST.tracks.shift(); pulse('mode-coaster'); }
      else if(stroke&&stroke.length>1) pulse('tool-track');
    }
    stroke=null; strokeId=null; strokeExt=null;
  }
}
cv.addEventListener('pointerup',endPointer);
cv.addEventListener('pointercancel',endPointer);

/* ---------- Ton und Sprache (Klänge und Vorlesen in src/audio/sound.js; hier, was Speicher und Spielzustand braucht) ---------- */
try{ const o=JSON.parse(localStorage.getItem(K_VOICE)||'null'); if(o&&typeof o==='object'){ if(typeof o.v==='string') VOICE.v=o.v.slice(0,120); if(VRATES.indexOf(o.r)>=0) VOICE.r=o.r; } }catch(_){}
try{ if('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged',function(){ if(typeof parLoad==='function'&&!$('par').hidden) parLoad(); }); }catch(_){}
function voiceSave(){ try{ localStorage.setItem(K_VOICE,JSON.stringify(VOICE)); }catch(_){} }
/* Sätze ohne Aufnahme merken (die letzten 40), damit sie beim nächsten Erzeugen dazukommen. Sie stehen in der Elternansicht. */
function vcMiss(t){ try{ const a=JSON.parse(localStorage.getItem(K_VMISS)||'[]'); if(!Array.isArray(a)||a.indexOf(t)>=0) return; a.push(String(t).slice(0,300)); localStorage.setItem(K_VMISS,JSON.stringify(a.slice(-40))); }catch(_){} }
function speak(text){ return speakWith(AP,text); }
const AP={ get talkLock(){ return ST.talkLock; }, vcMiss };
/* Port für systems/mobs.js: Zeit, Welt, Einstellungen, Teilchen und Zeichenhelfer für Pfeile und Höhlenmonster. */
const MP={
  get OPT(){ return OPT; },
  get S(){ return S; },
  get W(){ return W; },
  get realm(){ return realm; },
  get time(){ return time; },
  get INK(){ return INK; },
  banner,
  burst,
  circle,
  confetti,
  ground,
  ri,
  shout,
  solidW,
  spawn
};
/* Port für systems/sights.js: Zeit, Welt, Teilchen, Belohnung und Zeichenhelfer für Geysire, Sternschnuppen, Wracks, Glühwürmchen und Harfen. */
const SY={
  get S(){ return S; },
  get SEED(){ return SEED; },
  get W(){ return W; },
  get nightA(){ return nightA; },
  get realm(){ return realm; },
  get time(){ return time; },
  get INK(){ return INK; },
  get trees(){ return trees; },
  banner,
  circle,
  confetti,
  ground,
  reward,
  shout,
  spawn
};
/* Port für systems/creatures.js: Zeit, Welt, Effekte, Wackeln, Belohnung und Zeichenhelfer für die Tiere. */
const CR={
  get genF(){ return genF; },
  get time(){ return time; },
  get shake(){ return shake; },
  set shake(v){ shake=v; },
  get FX(){ return FX; },
  get reduced(){ return reduced; },
  get discoT(){ return discoT; },
  boxCount,
  confetti,
  emo,
  floorAt,
  qEvent,
  saveHero,
  say,
  shout,
  solidW,
  spawn,
  surfaceY
};
/* Port für systems/finds.js: Zeit, Welt, Effekte, Belohnung, Oberfläche und Werkzeugspitzen für Fundsachen, Sprungpilze, goldene Eier und Schätze. */
const FP={
  get FX(){ return FX; },
  get time(){ return time; },
  get genF(){ return genF; },
  get EGGSVG(){ return EGGSVG; },
  get WEAR(){ return WEAR; },
  banner,
  bucket,
  confetti,
  drillHead,
  firework,
  pulse,
  qEvent,
  renderAlbum,
  saveHero,
  say,
  scoop,
  shout,
  solidW,
  spawn,
  surfaceY
};
/* Port für systems/worldtick.js: Welt, Tag und Nacht, Disco, Wolken, Blitz, UFO und die Ticks der Tiere und Fundsachen. Zustände, die worldTick schreibt, haben einen Setter. */
const WT={
  get genF(){ return genF; },
  get FX(){ return FX; },
  get nightA(){ return nightA; },
  set nightA(v){ nightA=v; },
  get nightOn(){ return nightOn; },
  get realm(){ return realm; },
  get ORBS(){ return ORBS; },
  get ORBN(){ return ORBN; },
  get clouds(){ return clouds; },
  get bolt(){ return bolt; },
  set bolt(v){ bolt=v; },
  get time(){ return time; },
  get skyBonk(){ return skyBonk; },
  set skyBonk(v){ skyBonk=v; },
  get skySay(){ return skySay; },
  set skySay(v){ skySay=v; },
  get idleT(){ return idleT; },
  set idleT(v){ idleT=v; },
  get zT(){ return zT; },
  set zT(v){ zT=v; },
  get discoT(){ return discoT; },
  set discoT(v){ discoT=v; },
  get beatT(){ return beatT; },
  set beatT(v){ beatT=v; },
  get CONF(){ return CONF; },
  get slipWas(){ return slipWas; },
  set slipWas(v){ slipWas=v; },
  get ufo(){ return ufo; },
  set ufo(v){ ufo=v; },
  get ufoNext(){ return ufoNext; },
  set ufoNext(v){ ufoNext=v; },
  banner,
  confetti,
  creTick,
  disco,
  discover,
  dust,
  grow,
  padsTick,
  pickTick,
  portalTick,
  pulse,
  saveHero,
  say,
  secretsTick,
  shout,
  skyLim,
  smoke,
  spawn
};
/* Port für systems/quests.js: Auftragsdaten, Welt, Werkstatt, Rätselmaschinen, Oberfläche und Sprache für die Aufträge. Der Auftrag selbst (quest, qShown, qDoneT) bleibt in legacy.js, weil Zeichnen, Speichern und Tests ihn lesen; geschrieben wird er über Setter. */
const QP={
  get QSKY(){ return QSKY; },
  get realm(){ return realm; },
  get GEAR(){ return GEAR; },
  get QDEEP(){ return QDEEP; },
  get quest(){ return quest; },
  set quest(v){ quest=v; },
  get QSCRIPT(){ return QSCRIPT; },
  get QDEF(){ return QDEF; },
  get $(){ return $; },
  get qShown(){ return qShown; },
  set qShown(v){ qShown=v; },
  get qDoneT(){ return qDoneT; },
  set qDoneT(v){ qDoneT=v; },
  get SPACE(){ return SPACE; },
  get LIFT0(){ return LIFT0; },
  banner,
  canBuild,
  confetti,
  eggLand,
  gearLv,
  ground,
  nextLand,
  nextMach,
  onSnow,
  pulse,
  ri,
  saveHero,
  solidW,
  speak,
  stationY,
  surfaceY
};
/* Port für systems/winter.js: Winterzustand (Schneebälle, Feuerwerk, Figuren, Warteschlange), Welt, Teilchen und Zeichenhelfer für Schneebälle, Feuerwerk, Schneemänner, Pinguine und die Figuren am Schneeberg und am Vulkan. */
const WP={
  get balls(){ return balls; },
  get N(){ return N; },
  get fws(){ return fws; },
  get CONF(){ return CONF; },
  get reduced(){ return reduced; },
  get time(){ return time; },
  get pinT(){ return pinT; },
  set pinT(v){ pinT=v; },
  get pinN(){ return pinN; },
  set pinN(v){ pinN=v; },
  get PENX(){ return PENX; },
  get YETX(){ return YETX; },
  get RIMY(){ return RIMY; },
  get stq(){ return stq; },
  get realm(){ return realm; },
  get manT(){ return manT; },
  set manT(v){ manT=v; },
  confetti,
  disc,
  drawSnowman,
  flX,
  floorAt,
  puff,
  ri,
  shout,
  solidW,
  spawn,
  steam,
  surfaceY
};
/* Drei Stufen: alles an, nur Sprache (ohne Piepen und Klänge), alles aus. Sprache braucht das Kind, Effekte nerven manchmal die Großen. */
try{ const mv=localStorage.getItem(K_MUTE); AU.muted=mv==='1'; AU.fxOff=mv==='s'; }catch(_){}
document.addEventListener('pointerdown',function(e){
  audio(); AU.tapT=performance.now();
  if(e.target&&e.target.closest&&e.target.closest('.btn,.card,.opt,.round,.xb,#batt,#quest,.album button')) sfx('tick');
},true);

/* ---------- Hilfen: Zellen zählen, an einen Ort springen. Die Bau-Aufgaben mit Sternen gibt es nicht mehr (Vereinfachungsplan Schritt 3). ---------- */
function boxCount(x0,x1,y0,y1,fn){
  const c0=clamp(Math.floor(x0/CELL),1,GX-2), c1=clamp(Math.floor(x1/CELL),1,GX-2), r0=clamp(Math.floor((y0-TOP)/CELL),1,GY-4), r1=clamp(Math.floor((y1-TOP)/CELL),1,GY-4);
  let n=0;
  for(let cy=r0;cy<=r1;cy++) for(let cx=c0;cx<=c1;cx++) if(fn(grid[cy*GX+cx],cy*GX+cx)) n++;
  return n;
}
function teleport(x){
  if(P.mode!=='walk') setMode('walk');
  grow(x+3200);
  P.x=clamp(x,RX0+60,RX0+RW-60); P.y=surfaceY(P.x); P.vx=0; P.vy=0; P.on=true; P.chute=false; P.hurt=.5;
  cam.x=P.x; cam.y=P.y-80;
  smoke(P.x,P.y-20,6);
}
/* ---------- Funde: In jeder Welt sind 14 Dinge versteckt, bevorzugt solche, die im Album noch fehlen. ---------- */
const FINDS=[
  ['bone','🦴','einen Dino-Knochen','shallow'],['key','🔑','einen alten Schlüssel','shallow'],['bell','🔔','eine Glocke','shallow'],['boot','👢','einen Stiefel','shallow'],
  ['ball','⚽','einen Fußball','tree'],['owl','🦉','eine Eule','tree'],
  ['vase','🏺','eine uralte Vase','deep'],['skull','💀','einen Schädel','deep'],['sword','⚔️','zwei Schwerter','deep'],['turtle','🐢','eine Schildkröte','deep'],
  ['rex','🦖','einen T-Rex','deeper'],['dino','🦕','einen Langhals-Dino','deeper'],['crown','👑','eine Krone','deeper'],['trumpet','🎺','eine Trompete','deeper'],
  ['diamond','💎','einen Riesen-Diamanten','hot'],['dragon','🐉','einen Drachen','hot'],['crystal','🔮','den Kristall vom Erdkern','core'],
  ['bat','🦇','eine Fledermaus','cave'],['spider','🕷️','eine Spinne','cave'],['ghost','👻','ein Gespenst','cave'],['mush','🍄','einen Pilz','cave'],
  ['anchor','⚓','einen Anker','lake'],['octo','🐙','einen Tintenfisch','lake'],['shell','🐚','eine Muschel','pond'],
  ['ufo','🛸','ein UFO','space'],['sat','🛰️','einen Satelliten','space'],['comet','☄️','einen Kometen','space'],['alien','👽','einen Außerirdischen','moon'],
  ['rainbow','🌈','einen Regenbogen','sky'],['unicorn','🦄','ein Einhorn','sky'],
  ['robot','🤖','einen Roboter','volcano'],['trophy','🏆','einen Pokal','house'],['statue','🗿','eine Steinfigur','edge'],['gift','🎁','ein Geschenk','edge']
];
let nearT=0;
try{ const o=JSON.parse(localStorage.getItem(K_FINDS)||'{}')||{}; ST.found=o.ids||{}; ST.gold=o.gold|0; ST.gems=o.gems|0; }catch(_){ ST.found={}; }
function saveFinds(){ return saveFindsWith(SV); }
function placeFind(zone,r){
  const anyX=function(){
    for(let k=0;k<40;k++){
      const x=260+r()*(HOME_W-520);
      let ok=Math.abs(x-VOLC)>620&&Math.abs(x-470)>120&&Math.abs(x-3150)>120&&Math.abs(x-CHX)>170&&x<SNX-40&&!(x>720&&x<1160);
      for(const k2 of FLAT) if(Math.abs(x-SITE[k2])<230) ok=false;
      if(ok) return x;
    }
    return 2000+r()*300;
  };
  let x, y;
  if(zone==='shallow'){ x=anyX(); return [x,ground(x)+50+r()*90,r()<.6]; }
  if(zone==='deep'){ x=anyX(); return [x,ground(x)+330+r()*600,r()<.3]; }
  if(zone==='deeper'){ x=200+r()*(HOME_W-400); return [x,1250+r()*1000,false]; }
  if(zone==='hot'){ x=200+r()*(HOME_W-400); return [x,2470+r()*330,false]; }
  if(zone==='cave'){
    for(let k=0;k<300;k++){
      x=1400+r()*5500; y=300+r()*2000;
      const cx=Math.floor(x/CELL), cy=Math.floor((y-TOP)/CELL);
      if(grid[cy*GX+cx]===0){ const f=colTop(cx,cy); if(f-cy<12&&f<rC[cx]-2) return [x,TOP+f*CELL-12,false]; }
    }
    return null;
  }
  if(zone==='lake'){ x=830+r()*220; return [x,TOP+colTop(Math.floor(x/CELL),Math.floor((ground(700)+235-TOP)/CELL))*CELL-10,false]; }
  if(zone==='pond'){ x=SITE.pond+(r()-.5)*120; return [x,TOP+colTop(Math.floor(x/CELL),Math.floor((siteY.pond-30-TOP)/CELL))*CELL-10,false]; }
  if(zone==='tree'){
    const cand=[]; trees.forEach(function(t,i){ if(t.state===0&&i<ST.NT0) cand.push(i); });
    if(!cand.length) return null;
    const i=cand[Math.floor(r()*cand.length)], t=trees[i];
    return [t.x,t.gy-t.h-4,false,i];
  }
  if(zone==='house'){ const k=grow0[Math.floor(SITE.smash/CELL)]>>2, b0=Math.round(SITE.smash/24)-2; return [(b0+3)*24+12,TOP+(k-2)*24+12,false]; }
  if(zone==='sky'){ const c=clouds[Math.floor(r()*clouds.length)]; return [c.x,c.y-6,false]; }
  if(zone==='space'){
    for(let k=0;k<30;k++){ x=300+r()*(HOME_W-600); y=-2700-r()*2500; if(Math.hypot(x-MOON.x,y-MOON.y)>MOON.r+90) return [x,y,false]; }
    return [800,-3000,false];
  }
  if(zone==='moon'){ const a=.6+r()*1.9; return [MOON.x+Math.cos(a)*(MOON.r+22),MOON.y+Math.sin(a)*(MOON.r+22),false]; }
  if(zone==='volcano'){ x=VOLC+(r()<.5?-1:1)*(170+r()*150); return [x,ground(x)+45+r()*60,false]; }
  if(zone==='edge'){ x=r()<.5?70+r()*50:HOME_W-70-r()*50; return [x,surfaceY(x)-16,false]; }
  return null;
}
function hideFinds(){
  const r=rng(SEED*7+13), order=FINDS.slice();
  for(let i=order.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)), t=order[i]; order[i]=order[j]; order[j]=t; }
  order.sort(function(a,b){ return (ST.found[a[0]]?1:0)-(ST.found[b[0]]?1:0); });
  ST.hidden=[];
  for(const f of order){
    if(ST.hidden.length>=14) break;
    const q=placeFind(f[3],r);
    if(q&&f[3]==='sky'&&solidW(q[0],q[1])) q[1]=surfaceY(q[0])-22;
    if(q) ST.hidden.push({id:f[0],e:f[1],name:f[2],zone:f[3],x:q[0],y:q[1],hint:!!q[2],tree:q[3]===undefined?-1:q[3],got:false});
  }
  /* Ein Fund liegt immer glitzernd gleich neben dem Start, damit der erste Schatz sicher gelingt. */
  const first=ST.hidden.find(function(h){return h.zone==='shallow';})||ST.hidden.find(function(h){return h.zone==='deep';});
  if(first){ first.zone='shallow'; first.x=772; first.y=ground(772)+58; first.hint=true; }
}
function findOpen(h){
  if(h.zone==='sky'||h.zone==='space'||h.zone==='moon'||h.zone==='edge'||h.zone==='core') return true;
  if(h.tree>=0) return trees[h.tree].state>=1;
  return !solidW(h.x,h.y);
}
function collect(h){
  h.got=true; ST.found[h.id]=1; saveFinds(); renderAlbum();
  confetti(h.x,h.y+20); jingle(); speak('Du hast '+h.name+' gefunden!');
  ST.lootDirty=true; qEvent('find',1); sfx('pop');
  spawn(8,h.x,h.y,0,-46,2.4,30,h.e); pulse('btn-finds');
}
function findsTick(dt){
  const pts=[[P.x,P.y-18]];
  if(P.mode==='bagger') pts.push(bucket()); else if(P.mode==='loader') pts.push(scoop()); else if(P.mode==='tbm') pts.push(drillHead());
  let best=1e9, nf=null;
  for(const h of ST.hidden){
    if(h.got) continue;
    let d=1e9;
    for(const q of pts) d=Math.min(d,Math.hypot(q[0]-h.x,q[1]-h.y));
    if(d<best){ best=d; nf=h; }
    if(d<36&&(findOpen(h)||(h.tree>=0&&d<24))) collect(h);
  }
  nearF=nf; nearD=best;
  if(cellAt(P.x,P.y+3)===CORE&&!ST.found.crystal) collect({id:'crystal',e:'🔮',name:'den Kristall vom Erdkern',zone:'core',x:P.x,y:P.y-30,tree:-1,got:false});
  nearT-=dt;
  if(nearT<=0){
    nearT=.3;
    const b=$('btn-finds'); b.classList.toggle('near',best<420&&best>=170); b.classList.toggle('hot',best<170);
  }
}
function star4(x,y,r){ ctx.beginPath(); ctx.moveTo(x,y-r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.quadraticCurveTo(x,y,x,y+r); ctx.quadraticCurveTo(x,y,x-r,y); ctx.quadraticCurveTo(x,y,x,y-r); ctx.fill(); }
function drawFinds(front,x0,x1,y0,y1){
  ctx.textAlign='center'; ctx.textBaseline='middle';
  for(const h of ST.hidden){
    if(h.got||h.x<x0-40||h.x>x1+40) continue;
    const behind=h.zone==='sky'||(h.tree>=0&&trees[h.tree].state===0), vis=h.y>y0-40&&h.y<y1+40;
    if(!front){ if(behind&&vis){ ctx.font='26px serif'; ctx.fillStyle='#000'; ctx.fillText(h.e,h.x,h.y); } continue; }
    if(behind) continue;
    if(findOpen(h)){
      if(!vis) continue;
      const bob=reduced?0:3*Math.sin(time*3+h.x);
      ctx.fillStyle='rgba(255,236,150,.4)'; circle(h.x,h.y+bob,18+2*Math.sin(time*5));
      ctx.font='26px serif'; ctx.fillStyle='#000'; ctx.fillText(h.e,h.x,h.y+bob+1);
    }else if(h.hint){
      const sy=surfaceY(h.x)-12, a=Math.max(0,Math.sin(time*2.2+h.x));
      if(sy>y0&&sy<y1&&a>0){ ctx.globalAlpha=a; ctx.fillStyle='#fff8e6'; star4(h.x,sy,8); ctx.globalAlpha=1; }
    }
  }
}
function renderAlbum(){
  let n=0;
  $('album').innerHTML=FINDS.map(function(f){
    const g=!!ST.found[f[0]]; if(g) n++;
    return '<button class="'+(g?'':'q')+'" data-find="'+f[0]+'" aria-label="'+(g?f[2]:'Noch nicht gefunden')+'">'+(g?f[1]:'?')+'</button>';
  }).join('');
  $('found').textContent=String(n); $('found').hidden=n===0; $('found-n').textContent=n+'/'+FINDS.length;
  renderEggs();
}

/* ---------- Speichern: Die ganze Welt liegt als ein Eintrag in der Browser-Datenbank dieses Geräts. ---------- */
function idbDo(mode,fn){ return idbDoWith(ST.diskLock,mode,fn); }
function snapshot(pre,pf){ return snapshotWith(SV,pre,pf); }
function packStart(){ return packStartWith(SV); }
function packStep(){ return packStepWith(SV); }
function saveGame(manual){ return saveGameWith(SV,manual); }
function autosave(dt){ return autosaveWith(SV,dt); }
function restore(sv){
  SEED=sv.seed; shapeWorld(); loadCells(sv); LIFE.clear(); stamp.fill(0);
  parts.length=0; ghost=null; stroke=null; strokeId=null;
  trees.forEach(function(t,i){ t.state=(sv.trees&&sv.trees[i])|0; t.t=0; });
  ST.zips=Array.isArray(sv.zips)?sv.zips.filter(zipOk).slice(-ZIPMAX):[]; P.zip=null; MONS.length=0; METS.length=0; MROCKS.length=0; FLIES.length=0; ARROWS.length=0;
  ST.tracks=[]; (sv.tracks||[]).forEach(function(t){ const T=makeTrack(t.raw,t.user); if(T){ if(t.rb) T.rb=true; ST.tracks.push(T); } });
  ST.hidden=sv.hidden||[]; ST.props=(sv.props||[]).filter(function(o){ return o.type==='man'; }); bombs.length=0;
  for(const k in parked) parked[k]=(sv.parked&&sv.parked[k])||null; heliLoad='';
  P.mode='walk'; P.x=sv.px; P.y=sv.py; P.vx=0; P.vy=0; P.on=false; P.face=1; P.chute=false; P.soot=0; P.hurt=0; P.turbo=0; P.track=null; P.load=0;
  P.ball=0; P.spin=0; P.rot=0; P.frost=0;
  deepRestore(sv);
  if(!sv.snow) migrateSnow();
  grow(Math.max(HOME_END*CELL,P.x+3200));
  ST.energy=sv.energy||0; cam.x=P.x; cam.y=P.y-80; ST.tool=null; pan.x=0; pan.y=0;
  scanMobile();
}
function newSeed(){ return 1+Math.floor(Math.random()*999983); }

/* ---------- Reisen zwischen den Welten: Die Welt, die man verlässt, wird gespeichert, die neue geladen oder zum ersten Mal erzeugt. ---------- */
let portalT=0, portalOff='', exitHint=false, portO=null;
function orbsOf(id){ const R=RLM[id]; return R.orb?[R.orb()]:R.orbs(); }
function newRealm(){
  ST.seen={}; ST.eggGot={}; ST.lootGot={}; ST.orbGot={}; ST.matGot={}; ST.pzGot={};
  shapeWorld(); planetGen();
  parts.length=0; ghost=null; stroke=null; strokeId=null;
  for(const tr of trees){ tr.state=0; tr.t=0; }
  ST.tracks=[]; ST.zips=[]; P.zip=null; MONS.length=0; METS.length=0; MROCKS.length=0; FLIES.length=0; ARROWS.length=0; ST.props=[]; bombs.length=0; ST.hidden=[]; guide=null;
  for(const k in parked) parked[k]=null;
  P.x=LANDX; P.y=surfaceY(LANDX);
  scanMobile();
}
function travel(to){
  if(ST.traveling||to===realm||(to&&!RLM[to])) return;
  ST.traveling=true; portalT=0;
  const from=realm, m=P.mode, en=ST.energy, f=$('fade');
  f.hidden=false; void f.offsetWidth; f.classList.add('on'); sfx('whoosh');
  const done=function(){ f.classList.remove('on'); setTimeout(function(){ f.hidden=true; },380); ST.traveling=false; };
  setTimeout(function(){
    let sv0=null;
    try{ sv0=snapshot(); }catch(_){ done(); return; }
    idbDo('readwrite',function(st){ return st.put(sv0,realmKey(from)); }).then(function(){
      return idbDo('readonly',function(st){ return st.get(realmKey(to)); });
    }).then(function(sv){
      try{
        setRealm(to);
        if(sv&&runsOk(sv)&&sv.seed===SEED&&(sv.rl||'')===to) restore(sv);
        else if(to) newRealm();
        else throw new Error('earth');
      }catch(e){
        setRealm(from); try{ restore(sv0); }catch(_){}
        ST.energy=en; done(); tone([170],'sawtooth'); return;
      }
      ST.energy=en; arrive(from,to,m);
      try{ if(to) localStorage.setItem(K_REALM,to); else localStorage.removeItem(K_REALM); }catch(_){}
      ST.traveling=false; saveGame(false); ST.traveling=true;
      done();
    },function(){ done(); tone([170],'sawtooth'); });
  },450);
}
function arrive(from,to,m){
  const R=rlm();
  if(m==='rocket'||m==='plane'){ P.mode=m; parked[m]=null; P.ang=0; }
  if(R){
    P.x=LANDX; P.y=surfaceY(LANDX)-(P.mode==='walk'?2:260);
    if(!ST.seen.hi){ ST.seen.hi=1; later(1,function(){ say('',R.hello); }); }
    else later(.6,function(){ banner(R.e,1800); speak('Wieder auf '+R.n+'.'); });
    if(to==='moon'){ skyMark('moon'); if(quest&&quest.type==='moon') quest.p=1; }
    if(to==='disco') disco(12);
  }else{
    const L=orbsOf(from); let o=L[0];
    for(const q of L) if(portO&&Math.hypot(q.x-portO.x,q.y-portO.y)<1) o=q;
    portO=o; grow(o.x+3200);
    P.x=o.x; P.y=o.y-o.r-40; portalOff=from;
    later(.6,function(){ say('','Zurück im Weltraum! Unten liegt die Erde.'); });
  }
  P.vx=0; P.vy=0; P.on=false; P.chute=false;
  cam.x=P.x; cam.y=P.y-80; dkA=darkAt(cam.y); exitHint=false;
  scanMobile(); syncUI();
}
/* Landet man auf dem Mond oder einem Planeten und bleibt kurz stehen, beginnt die Reise. Oben über einer fremden Welt geht es zurück. */
function portalTick(dt){
  if(ST.traveling||uiOpen()) return;
  const R=rlm();
  if(R){
    if(P.y<-1400&&!exitHint){ exitHint=true; say('','Flieg noch ein Stück höher, dann geht es zurück zur Erde.'); }
    if(P.y<R.exit) travel('');
    return;
  }
  let hit='';
  if(P.y<-3000) for(const id in RLM) for(const o of orbsOf(id)){
    const d=Math.hypot(P.x-o.x,P.y-o.y);
    if(portalOff===id){ if(d>o.r+260&&o===portO) portalOff=''; continue; }
    if(P.on&&d<o.r+30&&(P.mode==='walk'||P.mode==='rocket'||P.mode==='plane')){ hit=id; portO=o; }
  }
  if(hit){ portalT+=dt; if(portalT>.9) travel(hit); } else portalT=0;
}

/* ---------- Held: Stufen der Verbesserungen, Bomben aus dem alten Vorrat, Aufträge und Werkstatt-Stand. ---------- */
try{
  const o=JSON.parse(localStorage.getItem(K_HERO)||'null');
  if(o&&o.up){ for(const k in hero.up) hero.up[k]=clamp(o.up[k]|0,0,3); hero.xp=o.xp|0; hero.lvl=Math.max(1,o.lvl|0); hero.own=o.own||{}; hero.pet=''; hero.hat=''; hero.tnt=o.tnt|0; hero.qn=o.qn|0; hero.quest=o.quest||null; hero.day=o.day||'';  hero.eggs=o.eggs|0; hero.trail=!!o.trail; hero.ext=!!o.ext; hero.big=!!o.big; hero.dr=clamp(o.dr|0,0,3); hero.rk=clamp(o.rk|0,0,3); hero.lp=clamp(o.lp|0,0,3); hero.zn=clamp(o.zn|0,0,6); hero.mat=o.mat||{}; hero.mk=o.mk||{}; hero.pz=o.pz||{}; hero.pzn=o.pzn|0; hero.deep=!!o.deep; hero.fin=o.fin|0; }
}catch(_){}
let nearF=null, nearD=1e9;
const bombs=[], pet={x:820,y:0};
function saveHero(){ return saveHeroWith(SV); }
function hudLoot(){
  $('tnt-n').textContent=String(hero.tnt); $('tnt-n').hidden=hero.tnt<=0;
}
/* Eine Bombe kostet BOMBE Akku. Bomben aus dem alten Vorrat werden zuerst verbraucht. */
const BOMBE=15;
function dropBomb(x,y){
  if(hero.tnt>0){ hero.tnt--; ST.heroDirty=true; hudLoot(); }
  else{ if(ST.energy<=0) return; paintPay(BOMBE); }
  bombs.push({x:x,y:y,vy:0,t:1.8});
}
function blast(x,y){
  bore(x,y,58);
  for(const tr of trees) if(tr.state<3&&Math.hypot(tr.x-x,tr.gy-20-y)<70) tr.state=3;
  for(let i=0;i<30;i++) spawn(1,x,y,(Math.random()-.5)*420,(Math.random()-.6)*420,.5+Math.random()*.5,8+Math.random()*9);
  for(let i=0;i<14;i++) spawn(5,x,y,(Math.random()-.5)*520,-120-Math.random()*380,.9,2);
  smoke(x,y-10,12); shake=.5; sfx('boom'); qEvent('bomb',1);
  if(P.mode!=='coaster'&&Math.hypot(P.x-x,P.y-16-y)<84) burn();
}
function drawProp(o){ if(o.type==='man') drawMan(o); }
/* Pfeil zu einem Ziel: im Bild direkt darüber, sonst am Bildrand. */
function pointTo(mx,my,col){
  const sx=(mx-cam.x)*S+W/2, sy=(my-cam.y)*S+H/2, topS=Math.min(H*.4,215), botS=H-Math.min(H*.3,170);
  if(sx>24&&sx<W-24&&sy>topS-40&&sy<botS){ arrow(mx,my-16+(reduced?0:5*Math.sin(time*6)),Math.PI/2,13,col); return; }
  ctx.save(); ctx.setTransform(DPR,0,0,DPR,0,0);
  const ex=clamp(sx,34,W-34), ey=clamp(sy,topS,botS);
  ctx.fillStyle='rgba(255,248,230,.92)'; circle(ex,ey,24); ctx.strokeStyle=INK; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(ex,ey,24,0,TAU); ctx.stroke();
  arrow(ex,ey,Math.atan2(sy-ey,sx-ex),13,col);
  ctx.restore();
}

/* ---------- Aufträge: Immer ein kleines Ziel mit Belohnung. Die ersten sieben führen durch das Spiel. Danach zeigt der Auftrag auf das nächste Ziel
   in der Tiefe oder im Weltraum (Vereinfachungsplan Schritt 3). Ist es noch zu, nennt er das fehlende Gerät und schickt zu den Rätselmaschinen.
   Nur wenn dafür Meistersteine fehlen oder alles erreicht ist, kommt ein Zufallsauftrag. ---------- */
const QSCRIPT=[{type:'quiz',goal:1},{type:'drive',goal:400,veh:'car'},{type:'dig',goal:200},{type:'find',goal:1},{type:'pz',goal:1},{type:'deep',goal:500},{type:'high',goal:2500}];
const VNAME={car:'dem Auto',dumper:'dem Kipper',loader:'dem Radlader',tbm:'der Tunnelbohrmaschine'};
const QDEF={
  quiz:{ic:function(){return QI.bolt;},say:function(q){return q.goal>1?'Löse '+q.goal+' Lernaufgaben beim ersten Versuch.':'Tippe auf den Akku und löse eine Lernaufgabe.';},hint:function(){return 'batt';}},
  drive:{ic:function(q){return IC[q.veh];},say:function(q){return 'Fahre ein Stück mit '+VNAME[q.veh]+'.';},hint:function(q){return 'mode-'+q.veh;}},
  dig:{ic:function(){return IC.bagger;},say:function(){return 'Grabe mit dem Bagger. Halte die rote Taste gedrückt.';},hint:function(){return 'mode-bagger';}},
  find:{ic:function(){return QI.gem;},say:function(){return 'Finde etwas Verstecktes. Folge dem grünen Pfeil und grabe dort.';},hint:function(){return 'mode-bagger';}},
  deep:{ic:function(){return IC.tbm;},say:function(q){return 'Bohre dich '+q.goal+' tief in die Erde.';},hint:function(){return 'mode-tbm';}},
  high:{ic:function(){return IC.rocket;},say:function(){return 'Fliege mit der Rakete hoch in den Weltraum.';},hint:function(){return 'mode-rocket';}},
  ride:{ic:function(){return IC.coaster;},say:function(){return 'Fahre eine Runde Achterbahn.';},hint:function(){return 'mode-coaster';}},
  moon:{ic:function(){return QI.mond;},say:function(){return 'Lande auf dem Mond.';},hint:function(){return 'mode-rocket';}},
  core:{ic:function(){return IC.lava;},say:function(){return 'Grabe bis zum glühenden Erdkern.';},hint:function(){return 'mode-tbm';}},
  bomb:{ic:function(){return IC.tnt;},say:function(){return 'Sprenge etwas mit einer Bombe.';},hint:function(){return 'tool-tnt';}},
  ski:{ic:function(){return IC.ski;},say:function(){return 'Fahre Ski auf dem Schneeberg. Der Lift bringt dich hoch.';},hint:function(){return 'mode-ski';}},
  salto:{ic:function(){return IC.ski;},say:function(q){return (q.goal>1?'Mach '+q.goal+' Saltos':'Mach einen Salto')+' mit den Ski. Spring und drück in der Luft die rote Taste.';},hint:function(){return 'mode-ski';}},
  land:{ic:function(){return QI.map;},say:function(){return 'Entdecke ein neues Land. Es liegt rechts hinter dem Schneeberg.';},hint:function(){return 'btn-map';}},
  poke:{ic:function(){return QI.fisch;},say:function(q){return 'Begrüße '+q.goal+' Tiere. Lauf zu ihnen hin oder tippe sie an.';},hint:function(){return 'btn-map';}},
  egg:{ic:function(){return QI.egg;},say:function(){return 'Finde ein goldenes Ei. In jedem Land ist eins versteckt.';},hint:function(){return 'btn-map';}},
  pz:{ic:function(){return QI.lab;},say:function(q){return (q.g?'Für '+GEAR[q.g].art+' braucht Professor Zahnrad noch '+(q.goal>1?q.goal+' Zahnräder. ':'ein Zahnrad. '):'')+(q.goal>1?'Löse '+q.goal+' Rätselmaschinen.':'Löse eine Rätselmaschine.')+' Über ihnen schwebt ein Zahnrad. Folge dem grünen Pfeil.';},hint:function(){return 'btn-lab';}},
  zone:{ic:function(q){return qEmo(ZN[q.z].e);},say:function(q){return 'Entdecke '+ZN[q.z].n+'. Fahr mit dem Aufzug so tief du kannst und bohr dich weiter nach unten.';},hint:function(){return 'mode-tbm';}},
  orb:{ic:function(q){return qEmo(QSKY[q.k][1]);},say:function(q){return QSKY[q.k][2];},hint:function(){return 'mode-rocket';}},
  make:{ic:function(q){return qEmo(GEAR[q.g].e);},say:function(q){return 'Du hast alles für '+GEAR[q.g].art+'. Geh zur Werkstatt und lass Professor Zahnrad bauen.';},hint:function(){return 'btn-lab';}},
};
function qEmo(e){ return '<text x="12" y="19" font-size="17" text-anchor="middle">'+e+'</text>'; }
/* Die Kette: Zonen mit der nötigen Bohrerstufe, Ziele im Weltraum mit der nötigen Raketenstufe, ganz unten der Erdkern mit Schutz Stufe 3.
   Besuchte Weltraumziele merkt sich hero.mk.o als Bitmaske (neu, fehlt in alten Spielständen; dort zählen ST.orbGot, hero.fin und hero.rk). */
const QDEEP=[[1,0],[2,0],[3,1],[4,1],[5,2],[6,3]];
const QSKY={moon:[1,'🌙','Lande mit der Rakete auf dem Mond.',0],stn:[2,'🛰️','Flieg mit der Rakete über den Mond hinaus und lande auf der Raumstation.',1],
  ice:[4,'🧊','Flieg mit der Rakete weit hinauf und lande auf dem Eisplaneten.',2],jun:[8,'🟣','Flieg mit der Rakete weit hinauf und lande auf dem Blubberplaneten.',2],
  gate:[16,'🌀','Flieg mit der Rakete bis zum Sternentor am Ende des Weltraums.',3]};
function skyMark(k){ return skyMarkWith(QP,k); }
let quest=null, qShown='', qDoneT=0, bannerT=0;
function banner(html,ms){
  $('banner-in').innerHTML=html; $('banner').classList.add('show');
  clearTimeout(bannerT); bannerT=setTimeout(function(){ $('banner').classList.remove('show'); },ms||1800);
}
function qEvent(type,n){ return qEventWith(QP,type,n); }
function newQuest(){ return newQuestWith(QP); }
function showQuest(talk){ return showQuestWith(QP,talk); }
function questPoint(){ return questPointWith(QP); }
function questTick(dt){ return questTickWith(QP,dt); }
/* Höchste Zahl beim Sternezählen im Fernrohr: nach Schulstand bis 10 oder 20. */
function postMax(){ return SCH.on&&SCH.zr<=1?10:20; }

const OVS=Array.prototype.slice.call(document.querySelectorAll('.ov,#quiz,#pz'));
function uiOpen(){ for(const o of OVS) if(!o.hidden) return true; return false; }
function syncSound(){ $('sound').innerHTML=svg24(AU.muted?QI.mute:AU.fxOff?QI.talk:QI.sound); $('sound').setAttribute('aria-pressed',String(!AU.muted)); $('sound').setAttribute('aria-label',AU.muted?'Ton ist aus':AU.fxOff?'Nur Sprache':'Ton ist an'); }

/* ---------- Winter: Ski, Lift, Schneebälle, Schneemänner, Pinguine, Feuerwerk, Drachenflug und die Geschichte vom Hick im Berg ---------- */
const FLX=5892, HAREX=6885, YETX=7052, IGX=7128, LIFT0=5790, LIFT1=6935, PENX=5952, RIMY=Math.min(ground(VOLC-92),ground(VOLC+92));
const balls=[], fws=[], stq=[], FLK=[];
for(let i=0;i<70;i++) FLK.push([Math.random(),Math.random(),.6+Math.random()*1.6,22+Math.random()*30,Math.random()*TAU]);
let sayT=0, swishT=0, manT=0, pinT=-9, pinN=0;
const N={hare:{x:HAREX,y:0},yeti:{x:YETX,y:0,hits:0,laugh:0,roll:0,hick:6,hop:0},fau:{x:CAVE[0],y:CAVE[1]+30,face:-1},mama:{up:0},pen:[]};
for(let i=0;i<6;i++) N.pen.push({hx:PENX+i*15,x:PENX+i*15,y:0,vx:0,vy:0,rot:0,vr:0,s:0,t:0});
const LIFT=(function(){
  const raw=[[LIFT0,msurf(LIFT0)-62]];
  for(let x=5860;x<=6900;x+=65) raw.push([x,msurf(x)-94]);
  raw.push([LIFT1,msurf(LIFT1)-62]);
  const T=makeTrack(raw,false); T.lift=true; return T;
})();

function puff(x,y,n){ for(let i=0;i<n;i++) spawn(10,x+(Math.random()-.5)*16,y+(Math.random()-.5)*8,(Math.random()-.5)*170,-40-Math.random()*120,.45+Math.random()*.35,2.5+Math.random()*3); }
function shout(x,y,s,col){ spawn(9,x,y,0,-48,1.3,19,s,col||'#fff8e6'); }
function emo(e,x,y,sz){ ctx.font=sz+'px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#000'; ctx.fillText(e,x,y); }
function flX(){ return FLX; }

/* Erzählen: Der Text wird vorgelesen und steht zum Mitlesen unten im Bild. Solange erzählt wird, schweigen die anderen Ansagen. */
function say(who,text){
  const ms=900+text.length*72;
  $('say-in').innerHTML=(who?'<b>'+who+':</b> ':'')+text; $('say').classList.add('show');
  clearTimeout(sayT); sayT=setTimeout(function(){ $('say').classList.remove('show'); },ms+500);
  ST.talkLock=0; speak(text); ST.talkLock=performance.now()+ms;
  return ms/1000;
}
function later(sec,fn){ stq.push({t:sec,fn:fn}); }
function tell(lines,done){
  let i=0;
  const next=function(){ if(i>=lines.length){ if(done) done(); return; } const l=lines[i++]; later(say(l[0],l[1])+.2,next); };
  next();
}
function reward(){
  ST.lootDirty=true; confetti(P.x,P.y); jingle();
  banner('⭐',2300);
}

/* ---------- Lift ---------- */
function nearLift(){ return (P.mode==='walk'||P.mode==='ski')&&P.on&&P.ball<=0&&Math.abs(P.x-LIFT0)<48&&Math.abs(P.y-surfaceY(LIFT0))<60; }
function rideLift(){
  need(function(){ P.back=P.mode==='ski'; P.mode='coaster'; P.track=LIFT; P.s=0; P.v=220; P.on=false; P.chute=false; P.spin=0; P.rot=0; syncUI(); sfx('pop'); });
}
function liftRide(dt){
  P.s+=220*dt;
  const q=trackAt(LIFT,P.s);
  P.x=q.x; P.y=q.y+46; P.vx=q.tx*220; P.vy=q.ty*220; P.ang=0; P.face=1;
  if(P.s>=LIFT.len){ P.mode=P.back?'ski':'walk'; P.on=false; P.air=0; P.vx=60; P.vy=0; P.chute=false; syncUI(); }
}

/* Unter den Füßen liegt Schnee oder Eis. Zwei Tiefen, weil der Boden am Hang zwischen zwei Zellen liegt. */
function onSnow(){ const a=cellAt(P.x,P.y+3), b=cellAt(P.x,P.y+9); return a===SNOW||a===ICE||b===SNOW||b===ICE; }
/* ---------- Ski: ◀ ▶ anschieben, ▼ bremsen, ▲ Düse, rote Taste springt und macht in der Luft einen Salto ---------- */
function updSki(dt,ix,u,d){
  if(P.ball>0){ updRoll(dt); return; }
  const snow=onSnow(), gk=hero.own.goldski?1:0;
  if(ix) P.face=ix;
  if(u){
    P.vy+=(-230*(1+.25*hero.up.jet)-P.vy)*Math.min(1,dt*6); P.on=false; P.jet=true;
    if(Math.random()<dt*40) spawn(1,P.x-P.face*8,P.y-14,(Math.random()-.5)*30,130,.25,4);
  }
  if(P.on){
    const gs=P.gs, v=Math.abs(P.vx);
    P.vx+=G*gs/(1+gs*gs)*dt*(snow?1:.3);
    /* Unten im Auslauf liegt tiefer Schnee: Er bremst, damit man neben dem Lift zum Stehen kommt. */
    P.vx-=P.vx*Math.min(1,dt*((d?(snow?2.6:5):(snow?.15-.05*gk:2.8))+(P.vx<0&&P.x<6060&&P.x>5700?1.9:0)));
    if(ix&&P.vx*ix<190+25*hero.up.motor+50*gk) P.vx+=ix*(snow?320:200)*dt;
    P.vx=clamp(P.vx,-820,820);
    if(snow){
      if(v>90&&Math.random()<dt*(d?40:v*.03)) spawn(10,P.x-P.face*12,P.y-2,-P.vx*.2+(Math.random()-.5)*40,-30-Math.random()*(d?130:60),.4,2+Math.random()*2.5);
      if(v>220){ swishT-=dt; if(swishT<=0){ swishT=.3; sfx('swish'); } }
      if(gk&&v>200&&Math.random()<dt*14) spawn(5,P.x-P.face*14,P.y-3,0,-30,.5,2);
    }
  }else{
    if(!u) P.vy=Math.min(P.vy+grav()*dt,780);
    P.vx+=ix*60*dt;
    if(P.spin){ const st=Math.sign(P.spin)*Math.min(Math.abs(P.spin),10.5*dt); P.ang+=st; P.spin-=st; P.rot+=Math.abs(st); }
  }
  const pv=P.vy, wasAir=P.air;
  if(mover(dt,6,30,18,10)){ if(Math.abs(P.vx)>150) puff(P.x+P.face*8,P.y-12,6); P.vx*=-.25; }
  if(P.on){
    if(P.landed){
      if(Math.abs(P.spin)>.9){ P.ball=1.7; shout(P.x,P.y-52,'PLUMPS!'); sfx('splat'); puff(P.x,P.y-8,12); }
      else{
        const n=Math.round(P.rot/TAU);
        if(n>0){ shout(P.x,P.y-54,n>1?n+' × SALTO!':'SALTO!','#ffd23f'); ST.lootDirty=true; sfx('pop'); qEvent('salto',n); }
        else if(wasAir>1&&!P.jet) shout(P.x,P.y-54,'JUHU!');
        if(pv>260) puff(P.x,P.y-2,7);
        P.ang=Math.atan(P.gs);
      }
      P.spin=0; P.rot=0; P.jet=false;
    }
    P.air=0; P.vy=P.gs*P.vx;
    if(P.ball<=0) P.ang+=(Math.atan(P.gs)-P.ang)*Math.min(1,dt*14);
    /* Wer an einer Tanne vorbeisaust, schüttelt den Schnee herunter. */
    if(Math.abs(P.vx)>120) for(const tr of trees) if(tr.fir&&tr.state===0&&Math.abs(tr.x-P.x)<9&&Math.abs(tr.gy-P.y)<40&&!(tr.sh>time)){ tr.sh=time+1.5; puff(tr.x,tr.gy-tr.h*.7,12); }
  }else P.air+=dt;
}
/* Mitten im Salto gelandet: Der Held kugelt als Schneeball weiter und plumpst dann wieder heraus. */
function updRoll(dt){
  P.ball-=dt;
  if(P.on){ const gs=P.gs; P.vx+=G*gs/(1+gs*gs)*dt; P.vx-=P.vx*Math.min(1,dt*(onSnow()?.5:3)); }
  else P.vy=Math.min(P.vy+grav()*dt,780);
  if(mover(dt,9,26,18,8)) P.vx*=-.4;
  if(P.on) P.vy=P.gs*P.vx;
  P.ang+=P.vx/16*dt;
  if(Math.random()<dt*14) puff(P.x,P.y-4,1);
  if(P.ball<=0){ P.ball=0; P.ang=0; P.spin=0; P.rot=0; puff(P.x,P.y-14,16); shout(P.x,P.y-50,'PLOPP!'); sfx('pop'); P.vy=-190; P.on=false; }
}
function skiAct(){
  if(P.ball>0) return;
  if(nearLift()){ rideLift(); return; }
  if(P.on){ P.vy-=350; P.y-=3; P.on=false; P.air=0; P.jet=false; sfx('jump'); }
  else if(Math.abs(P.spin)<TAU*1.5){ P.spin+=(P.vx>=0?-1:1)*TAU; sfx('whoosh'); }
}

/* ---------- Drachenflug auf Mama Glut: fliegt frei in alle Richtungen, die rote Taste spuckt Feuer und schmilzt Schnee ---------- */
function updDragon(dt,ix,u,d){
  if(ix) P.face=ix;
  P.vx+=(ix*310*(1+.15*hero.up.jet)-P.vx)*Math.min(1,dt*3);
  if(P.on&&!u) P.vy=Math.min(P.vy+grav()*dt,300);
  else P.vy+=((d-u)*270+((u||d||reduced)?0:16*Math.sin(time*3))-P.vy)*Math.min(1,dt*4);
  if(u&&P.on){ P.on=false; P.y-=3; }
  if(mover(dt,24,58,22,16)) P.vx*=-.2;
  if(P.on) P.vy=0;
  P.ang+=(clamp(P.vy/500,-.35,.35)*P.face-P.ang)*Math.min(1,dt*6);
  if(keys.a){ P.digT-=dt; if(P.digT<=0){ P.digT=.05; breathe(); } }
}
function melt(cx,cy){
  for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++){
    if(dx*dx+dy*dy>5) continue;
    const x=cx+dx, y=cy+dy; if(!inGrid(x,y)) continue;
    const i=y*GX+x;
    if(grid[i]===SNOW||grid[i]===ICE){ grid[i]=0; steam(x,y); }
  }
}
function breathe(){
  const mx=P.x+P.face*62, my=P.y-63;
  for(let k=0;k<2;k++) spawn(1,mx,my,P.face*(300+Math.random()*160)+P.vx,(Math.random()-.3)*120+P.vy*.5,.35+Math.random()*.2,7+Math.random()*6);
  sfx('flame');
  for(let r=20;r<=170;r+=12){
    const x=mx+P.face*r, y=my+r*.24, cx=Math.floor(x/CELL), cy=Math.floor((y-TOP)/CELL);
    if(!inGrid(cx,cy)) break;
    const m=grid[cy*GX+cx];
    if(m===SNOW||m===ICE){ melt(cx,cy); break; }
    if(m===WATER){ steam(cx,cy); break; }
    if(m>=4){ if(Math.random()<.5) putUp(cx-P.face,cy,FIRE); break; }
  }
}

/* ---------- Schneebälle ---------- */
function throwBall(tx,ty,from){ return throwBallWith(WP,tx,ty,from); }

/* ---------- Feuerwerk ---------- */
function firework(x,y){ return fireworkWith(WP,x,y); }
function burst(x,y,c){ return burstWith(WP,x,y,c); }

/* ---------- Schneemänner zum Hinstellen. Sie winken, wenn der Held kommt, und schmelzen neben Feuer und Lava. ---------- */
function addMan(x){ return addManWith(WP,x); }
function drawMan(o){ return drawManWith(WP,o); }

/* ---------- Pinguine: Sie stehen unten an der Piste wie Kegel. Wer hineinsaust, lässt sie fliegen. ---------- */
function pinFly(p,vx){ return pinFlyWith(WP,p,vx); }

/* ---------- Die Figuren am Schneeberg und am Vulkan. Die Geschichte gibt es nicht mehr (Vereinfachungsplan Schritt 3), sie stehen so da wie nach ihrem Ende. ---------- */
function yetiHit(){ return yetiHitWith(WP); }

function stEnter(){ return stEnterWith(WP); }
function syncOwn(){
  $('mode-dragon').classList.toggle('gone',!hero.own.dragon);
  $('tool-fw').classList.toggle('gone',!hero.own.fw);
}
/* ---------- Winter malen ---------- */
function drawSnowman(x,y,s,nose,wave,hat,sad){
  ctx.save(); ctx.translate(x,y); ctx.scale(s,s); ctx.lineCap='round';
  ctx.fillStyle='#9fb4cc'; circle(0,-11,13.4); circle(0,-30,10.4); circle(0,-45,8.4);
  ctx.fillStyle='#fff'; circle(0,-11,12); circle(0,-30,9); circle(0,-45,7);
  ctx.strokeStyle='#7a4a2c'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-8,-32); ctx.lineTo(-19,-37); ctx.moveTo(8,-32); ctx.lineTo(19,-39-7*wave); ctx.stroke();
  ctx.strokeStyle='#e63946'; ctx.lineWidth=3.2; ctx.beginPath(); ctx.moveTo(-6,-38.5); ctx.lineTo(6,-38.5); ctx.moveTo(4,-38); ctx.lineTo(7,-31); ctx.stroke();
  ctx.fillStyle=INK; circle(-2.6,-47,1.2); circle(3,-47,1.2); circle(0,-32,1.3); circle(0,-26,1.3);
  ctx.strokeStyle=INK; ctx.lineWidth=1.1; ctx.beginPath();
  if(sad) ctx.arc(.5,-40.2,2.6,Math.PI*1.15,Math.PI*1.85); else ctx.arc(.5,-43.8,2.8,Math.PI*.15,Math.PI*.85);
  ctx.stroke();
  if(nose){ ctx.fillStyle='#ff8a1f'; ctx.beginPath(); ctx.moveTo(.5,-45.8); ctx.lineTo(11,-44.2); ctx.lineTo(.5,-42.8); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle=hat; ctx.fillRect(-7.5,-53.5,15,2.6); ctx.fillRect(-4.8,-62,9.6,9);
  ctx.restore();
}
function drawYeti(x,y,face,mood,wob){
  ctx.save(); ctx.translate(x,y); ctx.rotate(wob); ctx.scale(face,1);
  const fur=function(col,g){
    ctx.fillStyle=col; rr(-22-g,-58-g,44+2*g,58+2*g,18);
    circle(-21,-12,9+g); circle(21,-12,9+g); circle(-25,-34,8.5+g); circle(25,-34,8.5+g); circle(-12,-60,9+g); circle(3,-64,10+g); circle(15,-59,8+g);
  };
  fur('#9fb4cc',2); fur('#f4f8fc',0);
  ctx.fillStyle='#8fb0d6'; rr(-20,-7,16,9,4); rr(4,-7,16,9,4);
  ctx.beginPath(); ctx.ellipse(3,-40,14.5,12.5,0,0,TAU); ctx.fill();
  ctx.fillStyle='#fff'; circle(-3,-43,4.2); circle(9,-43,4.2);
  ctx.fillStyle=INK; circle(-2,-43,2); circle(10,-43,2);
  ctx.strokeStyle=INK; ctx.lineWidth=2; ctx.lineCap='round'; ctx.beginPath();
  if(mood===0){ ctx.moveTo(-8,-50.5); ctx.lineTo(0,-47.5); ctx.moveTo(15,-50.5); ctx.lineTo(7,-47.5); ctx.moveTo(-3,-32); ctx.quadraticCurveTo(4,-36.5,11,-32); }
  else if(mood===1){ ctx.moveTo(-4,-35); ctx.quadraticCurveTo(4,-29,12,-35); }
  ctx.stroke();
  if(mood===2){ ctx.fillStyle=INK; ctx.beginPath(); ctx.ellipse(4,-33,7,5.5,0,0,TAU); ctx.fill(); ctx.fillStyle='#e63946'; ctx.beginPath(); ctx.ellipse(4,-31.5,4.5,2.8,0,0,TAU); ctx.fill(); }
  ctx.restore();
}
/* Drache: warm 0 ist blau gefroren, 1 ist feuerrot. Mit Reiter sitzt der Held auf dem Rücken. */
function drawDragon(x,y,s,face,warm,flap,rider){
  const body=mix([86,146,214],[226,69,47],warm), belly=mix([196,226,246],[255,201,92],warm), dark=mix([52,100,170],[160,38,34],warm);
  ctx.save(); ctx.translate(x,y); ctx.scale(face*s,s); ctx.lineJoin='round'; ctx.lineCap='round';
  ctx.strokeStyle=body; ctx.lineWidth=7; ctx.beginPath(); ctx.moveTo(-12,-9); ctx.quadraticCurveTo(-30,-3,-33,-18); ctx.stroke();
  ctx.fillStyle=dark; ctx.beginPath(); ctx.moveTo(-33,-27); ctx.lineTo(-39,-17); ctx.lineTo(-28,-17); ctx.closePath(); ctx.fill();
  const wy=-30-15*flap;
  ctx.beginPath(); ctx.moveTo(-3,-20); ctx.lineTo(-27,wy-6); ctx.lineTo(-19,wy+7); ctx.lineTo(-13,wy+2); ctx.lineTo(-9,wy+10); ctx.lineTo(-4,-12); ctx.closePath(); ctx.fill();
  ctx.fillStyle=body; rr(-11,-7,7,7,3); rr(2,-7,7,7,3);
  ctx.beginPath(); ctx.ellipse(-2,-15,15,11.5,0,0,TAU); ctx.fill();
  ctx.fillStyle=belly; ctx.beginPath(); ctx.ellipse(2,-12,8.5,7.5,0,0,TAU); ctx.fill();
  if(rider){ ctx.save(); ctx.translate(-5,-25); ctx.scale(1/s,1/s); ctx.fillStyle=P.soot>0?'#3a3438':'#2f6fd6'; rr(-6,-16,12,18,5); head(0,-22,7); ctx.restore(); }
  ctx.fillStyle=body; ctx.beginPath(); ctx.ellipse(11,-26,6,10,.55,0,TAU); ctx.fill();
  ctx.fillStyle=dark; ctx.beginPath(); ctx.moveTo(9,-41); ctx.lineTo(7,-50); ctx.lineTo(14,-44); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(15,-44); ctx.lineTo(16,-52); ctx.lineTo(21,-44); ctx.closePath(); ctx.fill();
  ctx.fillStyle=body; circle(16,-36,9.5); rr(18,-38,15,9,4.5);
  ctx.fillStyle='#fff'; circle(18,-38,3.6); ctx.fillStyle=INK; circle(19.2,-38,1.8); circle(30.5,-35.5,1);
  ctx.strokeStyle=INK; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(22,-31.5); ctx.quadraticCurveTo(27,-29.5,32,-31.5); ctx.stroke();
  ctx.restore();
}
function drawIgloo(x,y){
  ctx.fillStyle='#9fb4cc'; ctx.beginPath(); ctx.arc(x,y,37,Math.PI,0); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#f4f8fc'; ctx.beginPath(); ctx.arc(x,y,35,Math.PI,0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#bcd0e4'; ctx.lineWidth=1.5; ctx.beginPath();
  ctx.moveTo(x-33,y-11); ctx.lineTo(x+33,y-11); ctx.moveTo(x-26,y-23); ctx.lineTo(x+26,y-23);
  ctx.moveTo(x-16,y); ctx.lineTo(x-16,y-11); ctx.moveTo(x+18,y); ctx.lineTo(x+18,y-11); ctx.moveTo(x-6,y-11); ctx.lineTo(x-6,y-23); ctx.moveTo(x+10,y-11); ctx.lineTo(x+10,y-23); ctx.moveTo(x+2,y-23); ctx.lineTo(x+2,y-34);
  ctx.stroke();
  ctx.fillStyle='#2b3c52'; ctx.beginPath(); ctx.arc(x-2,y,12,Math.PI,0); ctx.closePath(); ctx.fill();
}
function drawGondola(x,y,occ){
  ctx.strokeStyle=INK; ctx.lineWidth=2; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,y+14); ctx.stroke();
  ctx.fillStyle=INK; rr(x-16,y+13,32,34,8);
  ctx.fillStyle='#e63946'; rr(x-14,y+15,28,30,6);
  ctx.fillStyle='#bfe9f5'; rr(x-10,y+19,20,13,3);
  if(occ) head(x,y+27,5);
  ctx.fillStyle='#ffd23f'; ctx.fillRect(x-14,y+35,28,3);
}
function drawStation(x,y){
  ctx.fillStyle='#7a4a2c'; ctx.fillRect(x-27,y-58,5,60); ctx.fillRect(x+22,y-58,5,60);
  ctx.fillStyle='#e63946'; ctx.beginPath(); ctx.moveTo(x-38,y-56); ctx.lineTo(x,y-80); ctx.lineTo(x+38,y-56); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(x-19,y-68); ctx.lineTo(x,y-80); ctx.lineTo(x+19,y-68); ctx.lineTo(x+10,y-66); ctx.lineTo(x+3,y-70); ctx.lineTo(x-6,y-65); ctx.closePath(); ctx.fill();
}
function drawLift(){
  ctx.lineCap='round'; ctx.strokeStyle='#5f6b7a'; ctx.lineWidth=4; ctx.beginPath();
  for(let x=5860;x<=6840;x+=195){ const gy=msurf(x); ctx.moveTo(x,gy+6); ctx.lineTo(x,gy-95); ctx.moveTo(x-9,gy-95); ctx.lineTo(x+9,gy-95); }
  ctx.stroke();
  const pts=LIFT.pts;
  ctx.strokeStyle=INK; ctx.lineWidth=1.8; ctx.lineJoin='round'; ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
  for(let i=3;i<pts.length;i+=3) ctx.lineTo(pts[i][0],pts[i][1]);
  ctx.lineTo(pts[pts.length-1][0],pts[pts.length-1][1]); ctx.stroke();
  for(let k=0;k<4;k++){ const q=trackAt(LIFT,((reduced?0:time*70)+k*LIFT.len/4)%LIFT.len); drawGondola(q.x,q.y,false); }
  drawStation(LIFT0,surfaceY(LIFT0)); drawStation(LIFT1,surfaceY(LIFT1));
}
function drawSkier(x,y,ang,face,brake,air){
  const sooty=P.soot>0, suit=sooty?'#3a3438':P.frost>0?'#dfeefa':'#2f6fd6', sp=Math.min(9,Math.abs(P.vx)/50);
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(face,1); ctx.lineCap='round'; ctx.lineJoin='round';
  ctx.strokeStyle=INK; ctx.lineWidth=4.8; ctx.beginPath(); ctx.moveTo(-17,-1.5); ctx.lineTo(17,-1.5); ctx.quadraticCurveTo(22,-1.5,23,-6.5); ctx.stroke();
  ctx.strokeStyle=hero.own.goldski?'#ffd23f':'#e63946'; ctx.lineWidth=2.6; ctx.stroke();
  ctx.strokeStyle=INK; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(-2,-3.5); ctx.lineTo(4,-9); ctx.lineTo(-2,-15); ctx.stroke();
  ctx.strokeStyle='#8d99a6'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(7,-21); if(air) ctx.lineTo(-15,-31); else ctx.lineTo(brake?12:-9,-2.5); ctx.stroke();
  ctx.translate(-2,-15); ctx.rotate(brake?.1:.4);
  ctx.strokeStyle='#e63946'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-2,-17); ctx.quadraticCurveTo(-9,-19+(reduced?0:2*Math.sin(time*14)),-11-sp,-16+(reduced?0:3*Math.sin(time*11))); ctx.stroke();
  ctx.fillStyle='#8d99a6'; rr(-10,-15,6,12,2);
  ctx.fillStyle=suit; rr(-6,-17,12,18,5);
  ctx.strokeStyle=suit; ctx.lineWidth=3.5; ctx.beginPath(); ctx.moveTo(0,-12); ctx.lineTo(9,-6); ctx.stroke();
  head(1,-23,7);
  ctx.restore();
}
function drawRoll(){
  const r=15+7*(1-P.ball/1.7);
  ctx.save(); ctx.translate(P.x,P.y-r); ctx.rotate(P.ang); ctx.lineCap='round';
  ctx.strokeStyle=INK; ctx.lineWidth=4.6; ctx.beginPath(); ctx.moveTo(-r-11,5); ctx.lineTo(-r+4,2); ctx.moveTo(r-4,-6); ctx.lineTo(r+12,-10); ctx.stroke();
  ctx.strokeStyle=hero.own.goldski?'#ffd23f':'#e63946'; ctx.lineWidth=2.4; ctx.stroke();
  ctx.fillStyle='#9fb4cc'; circle(0,0,r+1.5); ctx.fillStyle='#fff'; circle(0,0,r);
  ctx.fillStyle='#dbe7f3'; circle(-r*.3,r*.2,r*.22); circle(r*.35,-r*.3,r*.16);
  head(0,-r-3,6);
  ctx.restore();
}
/* Alles vom Winter, das hinter dem Helden steht */
function drawWinter(x0,x1){
  const f=N.fau, m=N.mama;
  if(x1>VOLC-260&&x0<VOLC+260){
    if(m.up>.02){
      ctx.save(); ctx.beginPath(); ctx.rect(VOLC-240,RIMY-430,480,438); ctx.clip();
      drawDragon(VOLC-6,RIMY+52+130*(1-m.up),2.4,P.x<VOLC?-1:1,1,reduced?0:.3*Math.sin(time*2),false);
      ctx.restore();
    }
    drawDragon(f.x,f.y,.8,f.face,1,reduced?0:.4*Math.sin(time*5),false);
  }
  if(x1<LIFT0-90||x0>8500) return;
  drawLift();
  drawIgloo(IGX,surfaceY(IGX));
  const fx=flX();
  drawSnowman(fx,surfaceY(fx),1.1,true,(!reduced&&Math.abs(P.x-fx)<230)?Math.sin(time*9):0,INK,false);
  const h=N.hare;
  emo('🐇',h.x,h.y-11,22);
  const yt=N.yeti, mood=(yt.laugh>0||yt.roll>0)?2:1;
  const wob=reduced?0:(yt.roll>0?-1.35+.18*Math.sin(time*22):yt.laugh>0?.1*Math.sin(time*38):0);
  drawYeti(yt.x,yt.y-(yt.hop>0?16*Math.sin(yt.hop/.35*Math.PI):0)-(yt.roll>0?18:0),P.x<yt.x?-1:1,mood,wob);
  N.pen.forEach(function(p){
    ctx.save(); ctx.translate(p.x,p.y-11); ctx.rotate(p.rot); emo('🐧',0,0,20); ctx.restore();
  });
}
/* Alles vom Winter, das vor dem Helden fliegt */
function drawFront(){
  if(balls.length){
    ctx.fillStyle='#9fb4cc'; for(const b of balls) circle(b.x,b.y,5.2);
    ctx.fillStyle='#fff'; for(const b of balls) circle(b.x,b.y,4.2);
  }
  for(const f of fws){ ctx.fillStyle=CONF[f.c]; rr(f.x-2,f.y-8,4,11,2); ctx.fillStyle='#ffd23f'; circle(f.x,f.y+5,2.6); }
}
function drawSnowfall(){
  const amt=clamp((cam.x-5250)/500,0,1)*clamp((9100-cam.x)/500,0,1)*clamp((cam.y+1700)/400,0,1)*clamp((500-cam.y)/300,0,1);
  if(amt<.02) return;
  ctx.save(); ctx.setTransform(DPR,0,0,DPR,0,0); ctx.fillStyle='#fff';
  const t=reduced?0:time;
  for(const f of FLK){
    const x=((f[0]*W+Math.sin(t*.8+f[4])*18-cam.x*S*.2*f[2])%W+W)%W, y=((f[1]*H+t*f[3]*f[2]-cam.y*S*.4)%H+H)%H;
    ctx.globalAlpha=amt*(.45+.25*f[2]); circle(x,y,f[2]*S*.9+.4);
  }
  ctx.restore(); ctx.globalAlpha=1;
}

/* ---------- Leben in der großen Welt: Tiere, Fundsachen, Sprungpilze, goldene Eier, Schätze, Planeten, U-Boot, Karte und versteckte Späße ---------- */
const FX={hot:0,slip:0,sugar:0,big:0,tiny:0,pump:0,star:0,float:0,stink:0,rainbow:0,sonar:0};
const PETS={dog:'🐕',cat:'🐈',dragon:'🐉',chick:'🐥',dino:'🦕',rex:'🦖',uni:'🦄',ghost:'👻',robot:'🤖',ufo:'🛸',alien:'👽',sala:'🦎'}, EHAT={cap:'🧢',grad:'🎓',helm:'⛑️'};
/* Belohnungen für goldene Eier: Anzahl, Art, Kennung, Name */
/* Haustiere und Hüte gibt es nicht mehr (Vereinfachungsplan Schritt 2). Für goldene Eier bleibt die Regenbogen-Spur. */
const WEAR=[[5,'trail','trail','eine Regenbogen-Spur']];
const ORBN=['Du bist auf dem Käsemond gelandet! Hier wohnen die Mäuse.','Ein Planet aus Keks! Bitte nicht alles aufessen.','Der Disco-Planet! Hier tanzen alle.','Hilfe, der Planet guckt dich an! Das ist Glubschi.'];
/* Die vier kleinen Planeten. Zu jeder Art gibt es mehrere Planeten am Himmel, die alle in dieselbe kleine Welt führen. */
[['cheese',19,[[250,200,90],[200,120,60],['🪨','den Käsefels'],['🧀','das warme Käsegestein'],['🐭','die Mäusehöhlen'],['🕳️','die Käselöcher'],['💎','die Kristallkäsehallen'],['🫕','den Fonduekern']]],
 ['cookie',20,[[150,100,60],[120,70,50],['🍪','den Keksboden'],['🍫','die Schokoschicht'],['🥐','die Krümelhöhlen'],['🍬','die Zuckergrotten'],['🍭','die Bonbonhallen'],['🍯','den Karamellkern']]],
 ['disco',21,[[70,40,120],[150,40,120],['🔊','den Bassfels'],['✨','die Glitzerschicht'],['🕺','die Tanzhöhlen'],['💡','die Lichtgrotten'],['🪞','die Spiegelhallen'],['🌟','den Funkelkern']]],
 ['eye',22,[[170,90,130],[150,60,80],['👁️','den Glubschfels'],['👀','die Glotzschicht'],['😵','die Augenhöhlen'],['😉','die Zwinkergrotten'],['🦋','die Wimpernhallen'],['⚫','den Pupillenkern']]]].forEach(function(q,k){
  const c=q[2];
  RLM[q[0]]={e:BT[q[1]].e,n:'diesen kleinen Planeten',w:12000,salt:404+k,lands:[q[1]],exit:-2600,small:k,
    orbs:function(){ return ORBS.filter(function(o){ return o.i&&o.k===k; }); },
    pal:{deep:c[0],hot:c[1],z:[[c[0],BT[q[1]].cg,[30,20,40]],[c[1],BT[q[1]].ce,[40,20,20]],[BT[q[1]].cr,BT[q[1]].cg,[20,20,40]],[[130,40,30],[210,90,50],[40,10,8]]]},
    zn:c.slice(2), mat:[['fe',5,1],['pi',3,3]],
    zc:[null,null,null,BT[q[1]].fauna[0],null,BT[q[1]].fauna[1],['🐲','sit',1,'FAUCH!','',26]],
    lk:[0,0,0,WATER,0,WATER,LAVA],
    hello:ORBN[k]+' Diese kleine Welt ist rund. Lauf einmal ganz herum! Zum Heimflug flieg mit der Rakete ganz hoch hinauf.'};
});
const NIGHT_T=[10,14,44], NIGHT_B=[40,40,96], MD={st:[84,191,230],sb:[212,244,238],h1:'#9bd8c4',h2:'#74c493',nl:0,w1:'rgba(48,140,224,.74)',w2:'rgba(132,204,246,.8)'};
const EGGSVG='<svg viewBox="0 0 24 24" aria-hidden="true">'+QI.egg+'</svg>';
let eruT=40, eruOn=0;
let skySay=0, ufo=null, ufoNext=20, skyRb=0, tkN=0, tkT=0, nightOn=false, nightA=0, discoT=0, beatT=0, keySeq='', dTaps=[], idleT=0, zT=0, skyBonk=0, bolt=null, mapPg=0, slipWas=false;

function fxSpeed(){ return (FX.slip>0?2.5:1)*(FX.hot>0?1.7:1)*(FX.sugar>0?1.8:1)*(FX.star>0?1.4:1)*(FX.rainbow>0?1.6:1)*(FX.big>0?1.2:1)*(FX.tiny>0?.8:1); }
function kidScale(){
  if(FX.big>0) return 1+1.2*Math.min(1,(12-FX.big)*4,FX.big*2);
  if(FX.tiny>0) return 1-.55*Math.min(1,(12-FX.tiny)*4,FX.tiny*2);
  return 1;
}
function nextLand(){ for(const b of ST.BIO) if(!ST.seen[b.i]) return b; return null; }
function eggLand(){ for(const b of ST.BIO) if(ST.seen[b.i]&&!ST.eggGot[b.i]&&b.t<12) return b; return null; }

/* ---------- Tiere ---------- */
function creHit(c,tap){ return creHitWith(CR,c,tap); }
function creTick(dt){ return creTickWith(CR,dt); }
function drawCres(x0,x1,y0,y1){ return drawCresWith(CR,ctx,x0,x1,y0,y1); }

/* ---------- Fundsachen: Jede macht etwas anderes mit dem Helden. ---------- */
function pickTick(dt){ return pickTickWith(FP,dt); }
function padsTick(){ return padsTickWith(FP); }
function secretsTick(){ return secretsTickWith(FP); }
function sonarTarget(){
  let b=null, bd=1e12;
  for(const e of ST.EGGS){ if(ST.eggGot[e.b]||e.x>(genF-10)*CELL) continue; const d=Math.hypot(e.x-P.x,e.y-P.y); if(d<bd){ bd=d; b=e; } }
  if(bd>4000) for(const l of ST.LOOT){ if(ST.lootGot[l.id]||l.x>(genF-10)*CELL) continue; const d=Math.hypot(l.x-P.x,l.y-P.y)*1.5; if(d<bd){ bd=d; b=l; } }
  return b?[b.x,b.y]:null;
}
function discover(b){
  const T=BT[b.t]; ST.seen[b.i]=1; ST.lootDirty=true; qEvent('land',1); jingle(); confetti(P.x,P.y);
  banner(T.e+' ⭐',2400);
  say('','Du hast '+(b.n?T.n2:T.n)+' entdeckt!');
}
function disco(n){ discoT=n; beatT=0; shout(P.x,P.y-70,'DISCO!','#ff7ad9'); }
function pups(){
  shout(P.x,P.y-50,'PUPS!','#9bd84a'); sfx('pups'); P.vy=-170; P.on=false;
  for(let i=0;i<10;i++) spawn(12,P.x-P.face*8,P.y-10,-P.face*(30+Math.random()*60),-10-Math.random()*30,1,5,'#9bd84a');
}
/* Geheime Tasten: dreimal schnell nach unten macht Pups, hoch hoch runter runter links rechts links rechts startet die Disco. */
function keyTap(k){
  idleT=0; keySeq=(keySeq+k).slice(-8);
  if(keySeq==='uuddlrlr'){ keySeq=''; disco(12); }
  if(k==='d'){
    const now=performance.now(); dTaps.push(now); if(dTaps.length>3) dTaps.shift();
    if(dTaps.length===3&&now-dTaps[0]<900&&P.mode==='walk'&&P.on){ dTaps=[]; pups(); }
  }
}
function rainCloud(c){
  c.rain=2; c.taps=(time-(c.tapT||-9)<6?(c.taps||0):0)+1; c.tapT=time; sfx('pop'); skyRb=time+14;
  if(c.taps>=3){
    c.taps=0;
    const gy=surfaceY(c.x), cx=Math.floor(c.x/CELL), cy=Math.floor((gy-TOP)/CELL);
    bolt={x:c.x,y0:c.y+14*c.s,y1:gy,t:.35}; shake=Math.max(shake,.4); sfx('boom'); shout(c.x,c.y+50,'DONNER!','#fff7a8');
    for(let d=-1;d<=1;d++) putUp(cx+d,cy-1,FIRE);
  }
}
function shakeTree(tr){
  if(tr.dr>time) return;
  tr.sh=time+.6; tr.dr=time+8; sfx('tick');
  const k=tr.kind, top=tr.gy-tr.h*.7, drop=function(e){ if(ST.DROPS.length<40) ST.DROPS.push({e:e,ty:'food',x:tr.x+(Math.random()-.5)*24,y:top,life:22}); };
  if(tr.fir) puff(tr.x,top,12);
  else if(k==='cactus') shout(tr.x,top-20,'PIEKS!');
  else if(k==='palm') drop('🥥');
  else if(k==='lolly'||k==='cane') drop('🍬');
  else if(k==='crystal'){ ST.lootDirty=true; sfx('coin'); }
  else if(k==='dead') spawn(8,tr.x,top,40,-60,1.6,20,'🦇');
  else if(k==='grave') shout(tr.x,top-24,'BUH!');
  else if(k==='flower') spawn(8,tr.x,top,30,-40,1.6,16,'🐝');
  else if(k==='jungle'||k==='giant') drop('🍌');
  else if(!k) drop('🍎');
}
/* Tippen ohne Werkzeug: Sonne, Tiere, Wolken, Bäume und die Tür am Ende der Welt reagieren. */
function tapWorld(sx,sy){
  if(ST.paused) return;
  const w=toWorld(sx,sy), wx=w[0], wy=w[1];
  if(deepTap(wx,wy)) return;
  if(Math.hypot(sx-(W-74),sy-(H*.34-cam.y*S*.03))<32*S+10&&cam.y>-1500&&!solidW(wx,wy)){ nightOn=!nightOn; sfx('pop'); speak(nightOn?'Gute Nacht!':'Guten Morgen!'); return; }
  /* Den Helden kitzeln: Beim fünften Mal muss er pupsen. */
  if(P.mode==='walk'&&Math.hypot(wx-P.x,wy-(P.y-20))<26){
    tkN=time-tkT<3?tkN+1:1; tkT=time;
    if(tkN>=5){ tkN=0; pups(); } else{ shout(P.x,P.y-54,['HIHI!','HEY!','DAS KITZELT!'][tkN%3]); sfx('quack'); if(P.on){ P.vy=-150; P.on=false; } }
    return;
  }
  for(const c of ST.CRE){
    if(!c.ok||c.gone>time||Math.abs(c.x-wx)>14+c.sz*.4||Math.abs(c.y-c.sz*.5-wy)>14+c.sz*.5) continue;
    if(c.fl==='bury'&&solidW(c.x,c.y-8)) continue;
    creHit(c,true); return;
  }
  if(wx>5700&&wx<7300){
    const y=N.yeti, fx=flX(), fy=surfaceY(fx);
    if(Math.abs(wx-y.x)<28&&wy>y.y-70&&wy<y.y){ yetiHit(); return; }
    for(const p of N.pen) if(p.s===0&&Math.abs(wx-p.x)<12&&Math.abs(wy-(p.y-10))<16){ pinFly(p,(Math.random()-.5)*160); return; }
    if(Math.abs(wx-fx)<16&&wy>fy-64&&wy<fy){ shout(fx,fy-74,'HIHI!'); sfx('quack'); return; }
  }
  for(const d of ST.DECO) if(d.k==='door'&&Math.abs(d.x-wx)<28&&Math.abs(d.y-18-wy)<32){ say('','Klopf, klopf. Wer ist da? Niemand. Hier ist die Welt wirklich zu Ende.'); return; }
  for(const c of clouds) if(Math.abs(c.x-wx)<40*c.s&&Math.abs(c.y-wy)<24*c.s){ rainCloud(c); return; }
  let best=null, bd=26;
  for(const tr of trees){ if(tr.state!==0||Math.abs(tr.x-wx)>bd||wy>tr.gy+6||wy<tr.gy-tr.h-30) continue; bd=Math.abs(tr.x-wx); best=tr; }
  if(best) shakeTree(best);
}

/* ---------- U-Boot: fährt frei durchs Wasser, die rote Taste ist das Sonar und zeigt zum nächsten Geheimnis. ---------- */
function updSub(dt,ix,u,d){
  if(ix) P.face=ix;
  const wet=cellAt(P.x,P.y-14)===WATER;
  if(wet){
    P.on=false;
    P.vx+=(ix*230*(1+.15*hero.up.motor)-P.vx)*Math.min(1,dt*2.5);
    P.vy+=((d-u)*190-P.vy)*Math.min(1,dt*3);
    if(Math.random()<dt*(5+Math.abs(P.vx)*.05)) spawn(7,P.x-P.face*30,P.y-16,-P.face*20,-30,.8,2);
  }else{
    P.vx+=(ix*40-P.vx)*Math.min(1,dt*3); P.vy=Math.min(P.vy+grav()*dt,700);
  }
  if(mover(dt,26,30,20,16)) P.vx*=-.2;
  if(P.on) P.vy=0;
  P.ang+=((wet?clamp(P.vy/400,-.4,.4)*P.face:(P.on?Math.atan(P.gs):0))-P.ang)*Math.min(1,dt*6);
}
/* Heißluftballon: Hoch heizt, dann steigt er. Ohne Heizen sinkt er langsam, Runter lässt Luft ab. Der Wind treibt ihn sanft, mit Links und Rechts lenkt man nur ein wenig. Höher als die Wolken kommt er nicht, die Luft wird zu dünn. */
const BALLOON_TOP=-1250;
function updBalloon(dt,ix,u,d){
  if(ix) P.face=ix;
  const wind=Math.sin(time*.07+P.x*.0004)*45;
  if(P.on){ P.vx-=P.vx*Math.min(1,dt*6); }
  else P.vx+=(ix*95+wind-P.vx)*Math.min(1,dt*.9);
  let ty=u?-125:d?150:45;
  if(P.y<BALLOON_TOP&&ty<20){ ty=20; if(u&&P.balT<=0){ P.balT=4; say('','Höher kommt der Ballon nicht. Die Luft ist hier oben zu dünn.'); } }
  if(P.balT>0) P.balT-=dt;
  P.vy+=(ty-P.vy)*Math.min(1,dt*(u?1.1:.8));
  if(u){ if(P.on){ P.on=false; P.y-=2; } if(Math.random()<dt*20) spawn(1,P.x+(Math.random()-.5)*6,P.y-46,(Math.random()-.5)*20,-60,.25,5); }
  if(mover(dt,15,120,14,10)) P.vx*=-.3;
  if(P.on){ if(P.landed&&P.vy>90) dust(P.x,P.y); P.vy=0; }
  P.ang+=(clamp(P.vx/600,-.12,.12)-P.ang)*Math.min(1,dt*3);
}
/* Hubschrauber: steht in der Luft still, wenn man nichts drückt. Mit der Aktionstaste hängt er ein geparktes Fahrzeug unter sich an den Haken und lässt es wieder los. So kommt das U-Boot zum Meer und der Bagger auf den Berg. */
let heliLoad='';
function updHeli(dt,ix,u,d){
  if(ix) P.face=ix;
  if(P.on){ P.vx-=P.vx*Math.min(1,dt*6); if(u){ P.on=false; P.y-=2; } }
  else P.vx+=(ix*240-P.vx)*Math.min(1,dt*2);
  let ty=(d-u)*190;
  if(P.y<BALLOON_TOP&&ty<0){ ty=0; if(u&&P.balT<=0){ P.balT=4; say('','Höher kommt der Hubschrauber nicht. Für den Weltraum brauchst du die Rakete.'); } }
  if(P.balT>0) P.balT-=dt;
  if(!P.on) P.vy+=(ty-P.vy)*Math.min(1,dt*3); else P.vy=0;
  if(!P.on&&(ix||u)&&Math.random()<dt*6) spawn(3,P.x+(Math.random()-.5)*60,P.y+4,(Math.random()-.5)*80,-20,.4,3);
  if(mover(dt,30,46,16,18)) P.vx*=-.3;
  if(P.on){ if(P.landed&&P.vy>120) dust(P.x,P.y); P.vy=0; }
  P.ang+=((P.on?Math.atan(P.gs)*.5:clamp(P.vx/240,-1,1)*.22*P.face)-P.ang)*Math.min(1,dt*5);
  const o=heliLoad&&parked[heliLoad];
  if(o){ o.x=P.x; o.y=P.y+70; o.vy=0; o.ang=0; o.face=P.face; if(P.on||solidW(o.x,o.y+2)) heliDrop(); }
  else heliLoad='';
}
function heliHook(){
  if(heliLoad){ heliDrop(); return; }
  let best='', bd=1e9;
  for(const k in parked){ const o=parked[k]; if(!o||k==='heli') continue; const dx=Math.abs(o.x-P.x), dy=o.y-P.y; if(dx<70&&dy>-10&&dy<170&&dx+dy<bd){ bd=dx+dy; best=k; } }
  if(best){ heliLoad=best; sfx('pop'); }
  else{ tone([330,262],'triangle'); pulse('act'); }
}
function heliDrop(){ if(heliLoad&&parked[heliLoad]) parked[heliLoad].vy=0; heliLoad=''; sfx('pop'); }
/* Segelboot: schwimmt auf jedem Wasser, auch auf selbst gemaltem. Der Wind hilft beim Segeln, an Land rutscht es nur mühsam. Hoch lässt es über Wellen hüpfen, die Aktionstaste tutet. */
function boatWet(){ return cellAt(P.x,P.y+5)===WATER||cellAt(P.x-14,P.y+5)===WATER||cellAt(P.x+14,P.y+5)===WATER; }
function updBoat(dt,ix,u,d){
  if(ix) P.face=ix;
  const wet=boatWet(), deep=cellAt(P.x,P.y-5)===WATER;
  if(wet){
    const wind=Math.sin(time*.05+P.x*.0003)*50;
    P.vx+=(ix*210*(1+.15*hero.up.motor)+wind*(ix?1:.5)-P.vx)*Math.min(1,dt*1.2);
    if(deep) P.vy+=(-140-P.vy)*Math.min(1,dt*5);
    else{ P.vy+=(0-P.vy)*Math.min(1,dt*6); if(u&&P.balT<=0){ P.vy=-260; P.balT=.6; sfx('jump'); } }
    if(Math.abs(P.vx)>60&&Math.random()<dt*14) spawn(7,P.x-P.face*26,P.y,-P.face*30,-30,.5,3);
    P.soot=0;
  }else{
    P.vx+=(ix*45-P.vx)*Math.min(1,dt*3);
    P.vy=Math.min(P.vy+grav()*dt,700);
  }
  if(P.balT>0) P.balT-=dt;
  if(mover(dt,26,50,20,16)) P.vx*=-.25;
  if(P.on){ if(P.landed&&P.vy>200) dust(P.x,P.y); P.vy=0; }
  const ta=wet&&!P.on?(reduced?0:Math.sin(time*2.2)*.06):(P.on?Math.atan(P.gs):0);
  P.ang+=(ta-P.ang)*Math.min(1,dt*4);
}
/* Kletterkäfer: läuft gegen eine Wand und krabbelt an ihr hoch. An der Wand hält er sich fest, Hoch und Runter klettern. Oben angekommen zieht er sich über die Kante. Für steile Schluchten und hohe Höhlen. */
function bugWall(){ const x=P.x+P.face*17; return solidW(x,P.y-6)||solidW(x,P.y-18); }
function updBug(dt,ix,u,d){
  if(ix&&!P.wall) P.face=ix;
  if(P.wall){
    if(ix===-P.face){ P.wall=false; P.face=ix; P.vx=ix*90; P.vy=-60; }
    else{
      P.vx=0; P.vy=(d-u-(ix===P.face?1:0))*140; if(P.vy<-140) P.vy=-140;
      if(!bugWall()){ P.wall=false; P.vx=P.face*90; P.vy=-90; }
    }
  }else{
    if(P.on) P.vx+=(ix*170*(1+.15*hero.up.motor)-P.vx)*Math.min(1,dt*8); else P.vx+=(ix*120-P.vx)*Math.min(1,dt*2);
    P.vy=Math.min(P.vy+grav()*dt,700);
  }
  if(P.wall){
    const ny=P.y+P.vy*dt;
    if(P.vy<0&&solidW(P.x,ny-26)) P.vy=0; else P.y=ny;
    const f=floorAt(P.x,P.y,4); if(P.y>=f){ P.y=f; if(P.vy>0) P.vy=0; }
    P.on=false;
  }else if(mover(dt,14,26,10,8)&&ix&&bugWall()){ P.wall=true; P.vy=0; sfx('pop'); }
  if(P.on&&!P.wall) P.vy=P.gs*P.vx;
  P.run+=(Math.abs(P.vx)+Math.abs(P.wall?P.vy:0))*dt*.12;
  const ta=P.wall?-P.face*Math.PI/2:(P.on?Math.atan(P.gs):0);
  P.ang+=(ta-P.ang)*Math.min(1,dt*10);
}
/* Seilrutsche: Mit dem Werkzeug zieht man ein Seil von einem Punkt zum anderen. Am oberen Ende hängt man sich mit der Aktionstaste dran und saust hinunter. Rutschen kostet keinen Akku, nur das Spannen. */
const ZIPMAX=8;
function zipOk(z){ return z&&Array.isArray(z.a)&&Array.isArray(z.b)&&isFinite(z.a[0]+z.a[1]+z.b[0]+z.b[1]); }
function zipAdd(x0,y0,x1,y1){
  const L=Math.hypot(x1-x0,y1-y0);
  if(L<120||L>2400||Math.abs(y1-y0)<10){ pulse('tool-rope'); tone([200],'triangle'); return; }
  const z=y0<=y1?{a:[x0,y0],b:[x1,y1]}:{a:[x1,y1],b:[x0,y0]};
  ST.zips.push(z); if(ST.zips.length>ZIPMAX) ST.zips.shift(); sfx('pop');
}
function zipNear(){
  if(P.mode!=='walk'||P.zip) return null;
  for(const z of ST.zips){ const dx=P.x-z.a[0], dy=P.y-46-z.a[1]; if(Math.abs(dx)<44&&dy>-40&&dy<140) return z; }
  return null;
}
function zipGo(z){ P.zip={z:z,s:0,v:120}; P.chute=false; P.on=false; sfx('whoosh'); }
function zipRide(dt){
  const z=P.zip.z, L=Math.hypot(z.b[0]-z.a[0],z.b[1]-z.a[1]), ux=(z.b[0]-z.a[0])/L, uy=(z.b[1]-z.a[1])/L;
  P.zip.v=clamp(P.zip.v+G*.7*uy*dt-P.zip.v*.15*dt,90,620); P.zip.s+=P.zip.v*dt;
  P.x=z.a[0]+ux*P.zip.s; P.y=z.a[1]+uy*P.zip.s+46; P.face=ux>=0?1:-1;
  const end=P.zip.s>=L-14||keys.u||(P.zip.s>24&&solidW(P.x+P.face*8,P.y-14));
  if(Math.random()<dt*8) spawn(3,P.x,P.y-46,(Math.random()-.5)*40,-20,.3,2);
  if(end){ P.vx=ux*P.zip.v*.8; P.vy=uy*P.zip.v*.5-(keys.u?160:40); P.zip=null; P.air=0; if(keys.u) sfx('jump'); }
}
function drawZips(x0,x1){
  for(const z of ST.zips){
    if(Math.max(z.a[0],z.b[0])<x0-40||Math.min(z.a[0],z.b[0])>x1+40) continue;
    for(const e of [z.a,z.b]){
      const cx=Math.floor(e[0]/CELL), r0=Math.floor((e[1]-TOP)/CELL);
      if(r0>=0&&r0<GY&&grid[r0*GX+cx]<4){ const r=Math.min(colTop(cx,r0),r0+90); ctx.fillStyle=INK; ctx.fillRect(e[0]-4,e[1]-6,8,TOP+r*CELL-e[1]+8); ctx.fillStyle='#a0632f'; ctx.fillRect(e[0]-2.5,e[1]-5,5,TOP+r*CELL-e[1]+6); }
    }
    ctx.strokeStyle=INK; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(z.a[0],z.a[1]); ctx.lineTo(z.b[0],z.b[1]); ctx.stroke();
    ctx.fillStyle='#ffd23f'; circle(z.a[0],z.a[1],5); ctx.strokeStyle=INK; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(z.a[0],z.a[1],5,0,TAU); ctx.stroke();
  }
  if(P.zip){ ctx.fillStyle=INK; circle(P.x,P.y-46,4.5); ctx.strokeStyle=INK; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(P.x,P.y-46); ctx.lineTo(P.x,P.y-40); ctx.stroke(); }
  pointers.forEach(function(p){ if(ST.tool==='rope'&&p.rs){ const w=toWorld(p.x,p.y); ctx.strokeStyle='#a0632f'; ctx.lineWidth=4; ctx.setLineDash([10,9]); ctx.beginPath(); ctx.moveTo(p.rs[0],p.rs[1]); ctx.lineTo(w[0],w[1]); ctx.stroke(); ctx.setLineDash([]); } });
}
/* Schaufel und Spitzhacke: zu Fuß graben, ohne Akku. Die Schaufel ist schnell, schafft aber nur Erde, Sand und Schnee. Die Spitzhacke schafft auch Fels und Eis, nur langsamer. Harte Schichten bleiben wie beim Bagger dem Bohrer vorbehalten. Aktionstaste gräbt in die Richtung, die man drückt: nach vorn, oben, unten oder schräg. */
const HANDT={shovel:1,pick:1,bow:1}, DIGT={shovel:1,pick:1}, SOFT={4:1,14:1};
let handT=0, handHint=0;
function handDig(wx,wy){
  if(P.mode!=='walk'||P.zip||time<handT) return 0;
  const sh=ST.tool==='shovel', r=(sh?15:12)*(1+.12*hero.up.dig);
  handT=time+(sh?.14:.22); P.swing=1;
  if(wx===undefined){
    const hx=(keys.r?1:0)-(keys.l?1:0);
    if(keys.u){ wx=P.x+hx*13; wy=P.y-(hx?36:40); }
    else if(keys.d){ wx=P.x+hx*13; wy=P.y+(hx?4:9); }
    else{ wx=P.x+P.face*15; wy=P.y-17; }
  }
  else if(Math.abs(wx-P.x)>4) P.face=wx>P.x?1:-1;
  if(monStrike(wx,wy,r)) return 0;
  const c0=Math.floor((wx-r)/CELL), c1=Math.floor((wx+r)/CELL), r0=Math.floor((wy-r*1.5-TOP)/CELL), r1=Math.floor((wy+r*1.5-TOP)/CELL);
  let n=0, hard=0;
  for(let cy=r0;cy<=r1;cy++) for(let cx=c0;cx<=c1;cx++){
    if(!inGrid(cx,cy)) continue;
    const dx=(cx+.5)*CELL-wx, dy=(TOP+(cy+.5)*CELL-wy)/1.5;
    if(dx*dx+dy*dy>r*r) continue;
    const i=cy*GX+cx, m=grid[i];
    if(m<4) continue;
    if(sh&&!SOFT[m]){ if(m!==BED&&m!==CORE&&m!==SHELL) hard++; continue; }
    n+=take(i);
  }
  if(n){
    sfx('dig');
    for(let k=0;k<4;k++) spawn(3,wx+(Math.random()-.5)*16,wy+(Math.random()-.5)*16,(Math.random()-.5)*140-P.face*40,-60-Math.random()*100,.5,2.5+Math.random()*2);
  }else if(hard){
    sfx('tick'); for(let k=0;k<3;k++) spawn(5,wx,wy,(Math.random()-.5)*160,-50-Math.random()*90,.4,2);
    if(time>handHint){ handHint=time+60; say('','Tock! Das ist zu hart für die Schaufel. Nimm die Spitzhacke.'); pulse('tool-pick'); }
  }
  return n;
}
/* Unter der Erde gräbt man sich frei, indem man einfach dagegen drückt, auch ohne Werkzeug: gegen eine Wand, nach oben gegen die Decke oder im Stehen nach unten. Das geht so schnell wie mit der Spitzhacke, mit der Schaufel nur durch weiche Erde. An der Oberfläche passiert nichts, damit das Laufen dort bleibt, wie es ist. */
function pushDig(ix,u,d){
  if(P.zip||P.y<-3000||P.y<ground(P.x)+24) return;
  const ex=P.x+ix*10;
  if((ix&&(solidW(ex,P.y-16)||solidW(ex,P.y-28)))||(u&&(solidW(P.x,P.y-34)||solidW(P.x-4,P.y-34)||solidW(P.x+4,P.y-34)))||(d&&P.on)) handDig();
}
function shoot(wx,wy){ return shootWith(MP,wx,wy); }
function monStrike(wx,wy,r){ return monStrikeWith(MP,wx,wy,r); }
/* Sternwarte: Zwischen Missionsbrett und Zielscheiben steht ein Fernrohr. Ein Blick hinein zeigt ein Sternbild. Wie viele Sterne hat es? Drei große Zahlen zum Antippen. Bei einem Fehler zählt das Fernrohr die Sterne laut vor. Zahlenraum aus dem Schulstand. */
const SCOPEX=1450;
let SCQ=null;
function nearScope(){ return !realm&&P.mode==='walk'&&(P.on||P.air<.3)&&Math.abs(P.x-SCOPEX)<44&&Math.abs(P.y-ground(SCOPEX))<60; }
function scopeOpen(){
  const mx=Math.min(postMax(),12), n=3+Math.floor(Math.random()*(mx-2)), cells=[];
  for(let gy=0;gy<5;gy++) for(let gx=0;gx<5;gx++){ const x=18+gx*16+(Math.random()-.5)*8, y=18+gy*16+(Math.random()-.5)*8; if(Math.hypot(x-50,y-50)<38) cells.push([x,y]); }
  const pts=shuffle(cells).slice(0,n);
  pts.sort(function(a,b){ return Math.atan2(a[1]-50,a[0]-50)-Math.atan2(b[1]-50,b[0]-50); });
  const opt=[n]; while(opt.length<3){ const o=Math.max(2,n+(Math.random()<.5?-1:1)*(1+Math.floor(Math.random()*2))); if(opt.indexOf(o)<0) opt.push(o); }
  SCQ={n:n,pts:pts,opt:shuffle(opt),done:false};
  scopeRender(-1); $('scope').hidden=false; speak('Wie viele Sterne siehst du?');
}
function scopeRender(cnt){
  const q=SCQ; let s='<path d="M'+q.pts.map(function(p){ return p[0].toFixed(1)+' '+p[1].toFixed(1); }).join('L')+'Z" stroke="rgba(160,190,255,.35)" stroke-width=".8" fill="none"/>';
  q.pts.forEach(function(p,i){
    s+='<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="'+(i<cnt?4.2:3)+'" fill="'+(i<cnt?'#ffd23f':'#fff8e6')+'"/>';
    if(i<cnt) s+='<text x="'+p[0].toFixed(1)+'" y="'+(p[1]-6).toFixed(1)+'" fill="#ffd23f" font-size="7" font-weight="700" text-anchor="middle">'+(i+1)+'</text>';
  });
  $('scope-v').innerHTML=s;
  $('scope-b').innerHTML=q.done?'<button class="ok" data-sc="next" aria-label="Noch ein Sternbild">▶️</button>':q.opt.map(function(o){ return '<button data-sc="'+o+'">'+o+'</button>'; }).join('');
}
function scopePick(v){
  const q=SCQ; if(!q||q.done) return;
  if(v===q.n){ q.done=true; scopeRender(q.n); speak(q.n+' Sterne! Richtig!'); jingle(); ST.lootDirty=true; banner('🔭',1800); return; }
  q.done=true; $('scope-b').innerHTML='';
  for(let i=1;i<=q.n;i++) setTimeout(function(){ if(SCQ!==q) return; scopeRender(i); speak(String(i)); if(i===q.n) setTimeout(function(){ if(SCQ===q){ scopeRender(q.n); speak('Es sind '+q.n+' Sterne.'); } },700); },i*700);
}
$('scope-b').addEventListener('click',function(e){ const b=e.target.closest('[data-sc]'); if(!b) return; if(b.dataset.sc==='next') scopeOpen(); else scopePick(+b.dataset.sc); });
function drawScope(x0,x1){
  if(realm||SCOPEX<x0-80||SCOPEX>x1+80) return;
  const x=SCOPEX, gy=ground(x);
  ctx.strokeStyle=INK; ctx.lineWidth=4; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(x,gy-34); ctx.lineTo(x-14,gy); ctx.moveTo(x,gy-34); ctx.lineTo(x+14,gy); ctx.moveTo(x,gy-34); ctx.lineTo(x,gy); ctx.stroke();
  ctx.save(); ctx.translate(x,gy-38); ctx.rotate(-.7);
  ctx.fillStyle=INK; ctx.fillRect(-20,-8,46,16); ctx.fillStyle='#3a4a8a'; ctx.fillRect(-18,-6,42,12); ctx.fillStyle='#ffd23f'; ctx.fillRect(16,-6,4,12); ctx.fillStyle='#9fd3ff'; ctx.fillRect(24,-5,2,10);
  ctx.restore();
}
function drawHandTool(){
  if(!HANDT[ST.tool]||P.mode!=='walk'||P.zip) return;
  const ks=kidScale(), sw=P.swing||0, dn=keys.d;
  ctx.save(); ctx.translate(P.x+P.face*5*ks,P.y-22*ks); ctx.scale(P.face*ks,ks);
  if(ST.tool==='bow'){
    ctx.rotate(P.aim);
    ctx.strokeStyle=INK; ctx.lineWidth=4.5; ctx.lineCap='round'; ctx.beginPath(); ctx.arc(-2,0,15,-1.25,1.25); ctx.stroke();
    ctx.strokeStyle='#a0632f'; ctx.lineWidth=2.6; ctx.stroke();
    const pull=sw*7; ctx.strokeStyle=INK; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-2+15*Math.cos(1.25),-15*Math.sin(1.25)); ctx.lineTo(-pull+.5,0); ctx.lineTo(-2+15*Math.cos(1.25),15*Math.sin(1.25)); ctx.stroke();
    ctx.restore(); return;
  }
  ctx.rotate((dn?1.3:.2)-sw*1.4);
  ctx.strokeStyle=INK; ctx.lineWidth=4.5; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(22,0); ctx.stroke();
  ctx.strokeStyle='#a0632f'; ctx.lineWidth=2.6; ctx.stroke();
  ctx.fillStyle=INK;
  if(ST.tool==='shovel'){ ctx.beginPath(); ctx.moveTo(20,-6); ctx.lineTo(33,-5); ctx.quadraticCurveTo(38,0,33,5); ctx.lineTo(20,6); ctx.closePath(); ctx.fill(); ctx.fillStyle='#b9c4cf'; ctx.beginPath(); ctx.moveTo(21.5,-4.5); ctx.lineTo(32,-3.5); ctx.quadraticCurveTo(35.5,0,32,3.5); ctx.lineTo(21.5,4.5); ctx.closePath(); ctx.fill(); }
  else{ ctx.beginPath(); ctx.moveTo(21,-14); ctx.quadraticCurveTo(28,-4,21,0); ctx.quadraticCurveTo(28,4,21,14); ctx.lineTo(25,0); ctx.closePath(); ctx.fill(); ctx.lineWidth=5; ctx.strokeStyle=INK; ctx.beginPath(); ctx.moveTo(22,-13); ctx.quadraticCurveTo(29,0,22,13); ctx.stroke(); ctx.lineWidth=2.6; ctx.strokeStyle='#b9c4cf'; ctx.stroke(); }
  ctx.restore();
}
function sonar(){
  FX.sonar=7; blip(1500,1500,.5,'sine',.07);
  for(let i=0;i<16;i++){ const a=i/16*TAU; spawn(5,P.x+Math.cos(a)*14,P.y-16+Math.sin(a)*14,Math.cos(a)*160,Math.sin(a)*160,.6,2); }
}
function drawSub(x,y,ang,face,occ){
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(face,1);
  ctx.fillStyle=INK; rr(-31,-31,62,27,13);
  ctx.fillStyle=occ&&P.soot>0?'#5a4a30':'#ffc21a'; rr(-29,-29,58,23,11.5);
  ctx.fillStyle=INK; rr(-9,-42,20,14,4); ctx.fillStyle='#f2a81d'; rr(-7,-40,16,11,3);
  ctx.strokeStyle=INK; ctx.lineWidth=3; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.beginPath(); ctx.moveTo(5,-41); ctx.lineTo(5,-51); ctx.lineTo(11,-51); ctx.stroke();
  ctx.fillStyle=INK; circle(10,-17.5,8.5); ctx.fillStyle='#bfe9f5'; circle(10,-17.5,6.8);
  if(occ) head(10,-17,4.6);
  ctx.fillStyle=INK; circle(-12,-17.5,4.5); ctx.fillStyle='#bfe9f5'; circle(-12,-17.5,3.2);
  ctx.fillStyle=INK; ctx.beginPath(); ctx.ellipse(-33,-17.5,3,3+(occ&&!reduced?8*Math.abs(Math.sin(time*24)):6),0,0,TAU); ctx.fill();
  ctx.fillStyle='#e63946'; ctx.fillRect(-27,-10,54,3);
  ctx.restore();
}

function drawBalloon(x,y,ang,occ,heat){
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang);
  ctx.strokeStyle=INK; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(-12,-18); ctx.lineTo(-20,-52); ctx.moveTo(12,-18); ctx.lineTo(20,-52); ctx.moveTo(-4,-18); ctx.lineTo(-7,-50); ctx.moveTo(4,-18); ctx.lineTo(7,-50); ctx.stroke();
  if(heat){ ctx.fillStyle='#ff7a1f'; ctx.beginPath(); ctx.moveTo(-5,-34); ctx.lineTo(0,-50-Math.random()*10); ctx.lineTo(5,-34); ctx.closePath(); ctx.fill(); ctx.fillStyle='#ffe066'; ctx.beginPath(); ctx.moveTo(-2.5,-34); ctx.lineTo(0,-43-Math.random()*5); ctx.lineTo(2.5,-34); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle=INK; rr(-7,-35,14,4,1.5);
  const cols=['#e63946','#ffd23f','#3aa0e8','#ffd23f','#e63946'];
  ctx.save(); ctx.beginPath(); ctx.moveTo(-20,-52); ctx.bezierCurveTo(-52,-78,-50,-138,0,-140); ctx.bezierCurveTo(50,-138,52,-78,20,-52); ctx.closePath();
  ctx.fillStyle=INK; ctx.fill(); ctx.clip();
  for(let i=0;i<5;i++){ ctx.fillStyle=cols[i]; ctx.beginPath(); ctx.ellipse(0,-96,46-i*9.2,46,0,0,TAU); ctx.fill(); }
  ctx.restore();
  ctx.lineWidth=3; ctx.strokeStyle=INK; ctx.beginPath(); ctx.moveTo(-20,-52); ctx.bezierCurveTo(-52,-78,-50,-138,0,-140); ctx.bezierCurveTo(50,-138,52,-78,20,-52); ctx.closePath(); ctx.stroke();
  ctx.fillStyle='#fff8e6'; ctx.globalAlpha=.35; ctx.beginPath(); ctx.ellipse(-22,-108,6,15,-.4,0,TAU); ctx.fill(); ctx.globalAlpha=1;
  ctx.fillStyle=INK; rr(-15,-20,30,20,4); ctx.fillStyle='#a0632f'; rr(-13,-18,26,16,3);
  ctx.strokeStyle='#7a4a22'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(-13,-10); ctx.lineTo(13,-10); ctx.stroke();
  if(occ) head(2,-24,5.5);
  ctx.restore();
}

function drawHeli(x,y,ang,face,occ,spin){
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(face,1);
  if(occ&&heliLoad&&parked[heliLoad]){ ctx.strokeStyle=INK; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,-6); ctx.lineTo(0,40); ctx.stroke(); }
  ctx.strokeStyle=INK; ctx.lineWidth=3; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(-20,-2); ctx.lineTo(22,-2); ctx.moveTo(-12,-2); ctx.lineTo(-10,-10); ctx.moveTo(12,-2); ctx.lineTo(10,-10); ctx.stroke();
  ctx.fillStyle=INK; rr(-46,-28,34,6,3); ctx.fillStyle='#3f8f3a'; rr(-45,-27,32,4,2);
  ctx.save(); ctx.translate(-46,-25); ctx.rotate(spin*3); ctx.fillStyle=INK; ctx.fillRect(-1.5,-9,3,18); ctx.restore();
  ctx.fillStyle=INK; ctx.beginPath(); ctx.ellipse(2,-25,24,16,0,0,TAU); ctx.fill();
  ctx.fillStyle=occ&&P.soot>0?'#3d4a30':'#58b548'; ctx.beginPath(); ctx.ellipse(2,-25,22,14,0,0,TAU); ctx.fill();
  ctx.fillStyle='#bfe9f5'; ctx.beginPath(); ctx.moveTo(6,-37); ctx.quadraticCurveTo(22,-36,23,-24); ctx.lineTo(6,-24); ctx.closePath(); ctx.fill();
  if(occ) head(10,-28,5);
  ctx.fillStyle=INK; ctx.fillRect(0,-46,4,8);
  const w=40*Math.abs(Math.cos(spin)); ctx.fillRect(2-w-4,-48,2*w+8,3);
  ctx.restore();
}

function drawBoat(x,y,ang,face,occ,wind){
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(face,1);
  ctx.strokeStyle=INK; ctx.lineWidth=3; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(0,-74); ctx.stroke();
  const b=1+.12*wind;
  ctx.fillStyle=INK; ctx.beginPath(); ctx.moveTo(3,-72); ctx.quadraticCurveTo(26*b,-46,30*b,-14); ctx.lineTo(3,-14); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#fff8e6'; ctx.beginPath(); ctx.moveTo(5,-67); ctx.quadraticCurveTo(24*b,-45,27*b,-16); ctx.lineTo(5,-16); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#3aa0e8'; ctx.fillRect(5,-36,22*b,5);
  ctx.fillStyle=INK; ctx.beginPath(); ctx.moveTo(-3,-60); ctx.quadraticCurveTo(-18,-38,-20,-14); ctx.lineTo(-3,-14); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#e63946'; ctx.beginPath(); ctx.moveTo(-5,-55); ctx.quadraticCurveTo(-16,-37,-17.5,-16); ctx.lineTo(-5,-16); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#ffd23f'; ctx.beginPath(); ctx.moveTo(0,-74); ctx.lineTo(-12,-70); ctx.lineTo(0,-66); ctx.closePath(); ctx.fill();
  if(occ) head(-9,-17,5);
  ctx.fillStyle=INK; ctx.beginPath(); ctx.moveTo(-34,-14); ctx.lineTo(36,-14); ctx.lineTo(24,2); ctx.lineTo(-24,2); ctx.closePath(); ctx.fill();
  ctx.fillStyle=occ&&P.soot>0?'#5a4030':'#a0632f'; ctx.beginPath(); ctx.moveTo(-31,-12); ctx.lineTo(33,-12); ctx.lineTo(22.5,0); ctx.lineTo(-22.5,0); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#fff8e6'; ctx.fillRect(-26,-8,50,2.5);
  ctx.restore();
}

function drawBug(x,y,ang,face,occ,run){
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(face,1);
  ctx.strokeStyle=INK; ctx.lineWidth=2.5; ctx.lineCap='round'; ctx.beginPath();
  for(let i=0;i<3;i++){ const lx=-10+i*10, sw=reduced?0:Math.sin(run+i*2.1)*4; ctx.moveTo(lx,-8); ctx.lineTo(lx-4+sw,-3); ctx.lineTo(lx-2+sw,0); }
  ctx.stroke();
  ctx.fillStyle=INK; ctx.beginPath(); ctx.ellipse(0,-15,19,12,0,Math.PI,0); ctx.lineTo(19,-6); ctx.lineTo(-19,-6); ctx.closePath(); ctx.fill();
  ctx.fillStyle=occ&&P.soot>0?'#5a3438':'#e63946'; ctx.beginPath(); ctx.ellipse(0,-15,17,10,0,Math.PI,0); ctx.lineTo(17,-8); ctx.lineTo(-17,-8); ctx.closePath(); ctx.fill();
  ctx.fillStyle=INK; circle(-8,-16,2.6); circle(4,-20,2.2); circle(-1,-11,2); circle(10,-12,2.2);
  ctx.fillStyle=INK; circle(19,-12,7); ctx.fillStyle='#bfe9f5'; circle(19,-12,5.6);
  if(occ) head(19,-11,3.8);
  ctx.strokeStyle=INK; ctx.lineWidth=1.8; ctx.beginPath(); ctx.moveTo(22,-18); ctx.quadraticCurveTo(26,-26,31,-25); ctx.moveTo(18,-18); ctx.quadraticCurveTo(20,-28,25,-30); ctx.stroke();
  ctx.restore();
}

/* ---------- Stimmung: Jedes Land färbt Himmel, Hügel und Wasser. Nachts wird es dunkel. ---------- */
function mood(){
  const ia=bix[clamp(Math.floor((cam.x-260)/CELL),0,GX-1)], ib=bix[clamp(Math.floor((cam.x+260)/CELL),0,GX-1)];
  const A=BT[ia?ST.BIO[ia-1].t:0], B=BT[ib?ST.BIO[ib-1].t:0];
  let t=0; if(ia!==ib&&ib) t=clamp((cam.x-(ST.BIO[ib-1].x0-260))/520,0,1);
  const nl=Math.max(nightA,A.night+(B.night-A.night)*t), dk=1-.5*nl, D=t<.5?A:B;
  const h1=lerpC(A.hill[0],B.hill[0],t), h2=lerpC(A.hill[1],B.hill[1],t);
  MD.st=lerpC(A.sky[0],B.sky[0],t); MD.sb=lerpC(A.sky[1],B.sky[1],t); MD.nl=nl;
  MD.h1='rgb('+(h1[0]*dk|0)+','+(h1[1]*dk|0)+','+(h1[2]*dk|0)+')'; MD.h2='rgb('+(h2[0]*dk|0)+','+(h2[1]*dk|0)+','+(h2[2]*dk|0)+')';
  MD.w1=D.wat?D.wat[0]:'rgba(48,140,224,.74)'; MD.w2=D.wat?D.wat[1]:'rgba(132,204,246,.8)';
  return MD;
}
function drawMood(){
  const nl=MD.nl;
  if(nl<.03&&discoT<=0) return;
  ctx.save(); ctx.setTransform(DPR,0,0,DPR,0,0);
  if(nl>=.03){
    ctx.fillStyle='rgba(8,12,48,'+(.36*nl).toFixed(3)+')'; ctx.fillRect(0,0,W,H);
    if(cam.y>-900&&cam.y<400){
      ctx.fillStyle='#ffe98a';
      for(let i=0;i<12;i++){
        const t=reduced?i:time*.3+i*1.7, x=(((Math.sin(t*1.3+i)*.5+.5)*W+i*97-cam.x*S*.6)%W+W)%W, y=H*(.35+.3*(Math.sin(t+i*2.1)*.5+.5));
        ctx.globalAlpha=nl*(.3+.7*Math.abs(Math.sin(t*3+i))); circle(x,y,1.8*S+.6);
      }
      ctx.globalAlpha=1;
    }
  }
  if(discoT>0){ ctx.globalAlpha=.16; ctx.fillStyle='hsl('+(reduced?300:Math.floor(time*240)%360)+',90%,55%)'; ctx.fillRect(0,0,W,H); }
  ctx.restore(); ctx.globalAlpha=1;
}

/* ---------- Die große Welt malen ---------- */
function drawFlora(tr,x,y,h,s){
  const k=tr.kind, on=tr.state===1, ci=Math.floor(tr.x)%6;
  ctx.lineCap='round'; ctx.lineJoin='round';
  if(k==='cactus'){
    ctx.fillStyle=on?'#7a5a24':'#3f9d57';
    rr(x-6*s,y-h,12*s,h+4,6*s); rr(x-17*s,y-h*.66,8*s,h*.36,4*s); rr(x-17*s,y-h*.38,14*s,7*s,3.5*s); rr(x+9*s,y-h*.84,8*s,h*.38,4*s); rr(x+3*s,y-h*.54,14*s,7*s,3.5*s);
    ctx.fillStyle='#ff7ab0'; circle(x,y-h-1,3*s);
  }else if(k==='palm'){
    const tx=x+4*s, ty=y-h;
    ctx.strokeStyle='#8a5a3c'; ctx.lineWidth=6*s; ctx.beginPath(); ctx.moveTo(x,y+4); ctx.quadraticCurveTo(x+10*s,y-h*.5,tx,ty); ctx.stroke();
    ctx.strokeStyle=on?'#7a5a24':'#2f8f4a'; ctx.lineWidth=5*s; ctx.beginPath();
    for(let i=0;i<5;i++){ const a=-2.7+i*.565; ctx.moveTo(tx,ty); ctx.quadraticCurveTo(tx+22*s*Math.cos(a),ty+22*s*Math.sin(a),tx+38*s*Math.cos(a),ty+22*s*Math.sin(a)+16*s); }
    ctx.stroke();
    ctx.fillStyle='#6a4428'; circle(tx-3*s,ty+4*s,3.4*s); circle(tx+4*s,ty+5*s,3.4*s);
  }else if(k==='jungle'||k==='giant'){
    const g=k==='giant'?2:1;
    ctx.fillStyle='#6a4428'; ctx.fillRect(x-4.5*s*g,y-h*.82,9*s*g,h*.82+6);
    ctx.strokeStyle='#3d8f3a'; ctx.lineWidth=1.6; ctx.beginPath();
    for(let i=-1;i<=1;i++){ ctx.moveTo(x+i*15*s*g,y-h*.72); ctx.quadraticCurveTo(x+i*15*s*g+4,y-h*.55,x+i*13*s*g,y-h*.72+34+i*8); }
    ctx.stroke();
    ctx.fillStyle=on?'#7a5a24':'#1f7a44'; circle(x-18*s*g,y-h*.8,21*s*g); circle(x+18*s*g,y-h*.82,21*s*g);
    ctx.fillStyle=on?'#96702a':'#2a9552'; circle(x,y-h,25*s*g);
  }else if(k==='lolly'){
    ctx.strokeStyle='#fff'; ctx.lineWidth=3.2*s; ctx.beginPath(); ctx.moveTo(x,y+3); ctx.lineTo(x,y-h); ctx.stroke();
    ctx.fillStyle=CONF[ci]; circle(x,y-h,13*s);
    ctx.strokeStyle='#fff'; ctx.lineWidth=2.4*s; ctx.beginPath(); ctx.arc(x,y-h,8*s,0,4.4); ctx.moveTo(x+3.5*s,y-h); ctx.arc(x,y-h,3.5*s,0,4); ctx.stroke();
  }else if(k==='cane'){
    ctx.lineWidth=6*s; ctx.strokeStyle='#fff'; ctx.beginPath(); ctx.moveTo(x,y+3); ctx.lineTo(x,y-h+9*s); ctx.arc(x+9*s,y-h+9*s,9*s,Math.PI,0); ctx.stroke();
    ctx.strokeStyle='#e63946'; ctx.setLineDash([6*s,7*s]); ctx.lineCap='butt'; ctx.stroke(); ctx.setLineDash([]);
  }else if(k==='shroom'){
    ctx.fillStyle='#f3e9d2'; rr(x-2.5*s,y-h*.6,5*s,h*.6+3,2);
    ctx.fillStyle=['#e63946','#ff8a1f','#7b4fd6','#3aa0e8','#ff7ab0','#58b548'][ci]; ctx.beginPath(); ctx.arc(x,y-h*.6,8*s,Math.PI,0); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#fff'; circle(x-3*s,y-h*.6-3.5*s,1.5*s); circle(x+3*s,y-h*.6-4.5*s,1.8*s);
  }else if(k==='dead'){
    ctx.strokeStyle='#3a3244'; ctx.lineWidth=6*s; ctx.beginPath(); ctx.moveTo(x,y+4); ctx.lineTo(x,y-h*.75); ctx.stroke();
    ctx.lineWidth=3*s; ctx.beginPath(); ctx.moveTo(x,y-h*.5); ctx.lineTo(x-16*s,y-h*.85); ctx.moveTo(x,y-h*.62); ctx.lineTo(x+14*s,y-h); ctx.moveTo(x-9*s,y-h*.7); ctx.lineTo(x-20*s,y-h*.7); ctx.stroke();
  }else if(k==='grave'){
    ctx.fillStyle='#6f7688'; rr(x-9*s,y-h-1,18*s,h+4,8*s);
    ctx.fillStyle='#9aa0b2'; rr(x-7*s,y-h+1,14*s,h+2,6.5*s);
    ctx.strokeStyle='#6f7688'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x,y-h*.8); ctx.lineTo(x,y-h*.3); ctx.moveTo(x-4*s,y-h*.62); ctx.lineTo(x+4*s,y-h*.62); ctx.stroke();
  }else if(k==='fern'){
    ctx.strokeStyle=on?'#7a5a24':'#2f9a4a'; ctx.lineWidth=3*s; ctx.beginPath();
    for(let i=-2;i<=2;i++){ ctx.moveTo(x,y+2); ctx.quadraticCurveTo(x+i*8*s,y-h,x+i*15*s,y-h*.55); }
    ctx.stroke();
  }else if(k==='crystal'){
    const col=['#7fe3f0','#c79bff','#8ef0b8'][ci%3];
    ctx.fillStyle='#4a5a8a'; ctx.beginPath(); ctx.moveTo(x-9*s,y+3); ctx.lineTo(x-3*s,y-h-2); ctx.lineTo(x+6*s,y-h*.8-2); ctx.lineTo(x+10*s,y+3); ctx.closePath(); ctx.fill();
    ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x-7*s,y+3); ctx.lineTo(x-3*s,y-h); ctx.lineTo(x+5*s,y-h*.8); ctx.lineTo(x+8*s,y+3); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x-17*s,y+3); ctx.lineTo(x-13*s,y-h*.5); ctx.lineTo(x-8*s,y+3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(x-3*s,y-h+4); ctx.lineTo(x-4.5*s,y-4); ctx.stroke();
  }else if(k==='flower'){
    ctx.strokeStyle='#2f8f4a'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x,y+2); ctx.lineTo(x,y-h); ctx.stroke();
    ctx.fillStyle=CONF[ci]; for(let i=0;i<5;i++){ const a=i*1.257; circle(x+4.2*s*Math.cos(a),y-h+4.2*s*Math.sin(a),2.8*s); }
    ctx.fillStyle='#ffd23f'; circle(x,y-h,2.4*s);
  }else{
    ctx.fillStyle=on?'#7a5a24':'#3d9a50'; circle(x-8*s,y-h*.4,9*s); circle(x+8*s,y-h*.4,9*s); circle(x,y-h*.75,10*s);
  }
}
function drawDeco(d){
  const x=d.x;
  if(d.k==='gate'){
    const g=ground(x), on=ST.seen[d.b.i];
    ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle=INK; ctx.lineWidth=8; ctx.beginPath(); ctx.moveTo(x-26,g+4); ctx.lineTo(x-26,g-56); ctx.quadraticCurveTo(x,g-86,x+26,g-56); ctx.lineTo(x+26,g+4); ctx.stroke();
    ctx.strokeStyle=on?'#ffd23f':'#cfd6dd'; ctx.lineWidth=4; ctx.stroke();
    ctx.fillStyle=INK; circle(x,g-80,18); ctx.fillStyle='#fff8e6'; circle(x,g-80,15.5); emo(BT[d.b.t].e,x,g-79,19);
  }else if(d.k==='mill'){
    const y=d.y;
    ctx.fillStyle='#fff8e6'; ctx.beginPath(); ctx.moveTo(x-17,y+3); ctx.lineTo(x-10,y-70); ctx.lineTo(x+10,y-70); ctx.lineTo(x+17,y+3); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#e63946'; ctx.beginPath(); ctx.moveTo(x-13,y-70); ctx.lineTo(x,y-88); ctx.lineTo(x+13,y-70); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#7a4a2c'; rr(x-5,y-16,10,19,3);
    ctx.strokeStyle='#7a4a2c'; ctx.lineWidth=4; ctx.lineCap='round'; ctx.beginPath();
    for(let k=0;k<4;k++){ const a=(reduced?.4:time*.9)+k*Math.PI/2; ctx.moveTo(x,y-66); ctx.lineTo(x+40*Math.cos(a),y-66+40*Math.sin(a)); }
    ctx.stroke(); ctx.fillStyle=INK; circle(x,y-66,4);
  }else if(d.k==='sign'){
    ctx.fillStyle='#7a4a2c'; ctx.fillRect(x-2.5,d.y-40,5,43);
    ctx.fillStyle=INK; rr(x-19,d.y-62,38,28,6); ctx.fillStyle='#fff8e6'; rr(x-17,d.y-60,34,24,4.5); emo(d.e,x,d.y-47,17);
  }else if(d.k==='mast'){
    ctx.strokeStyle='#7a4a2c'; ctx.lineWidth=5; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x,d.y); ctx.lineTo(x,d.y-70); ctx.stroke();
    ctx.fillStyle=INK; ctx.beginPath(); ctx.moveTo(x,d.y-70); ctx.lineTo(x+30,d.y-60); ctx.lineTo(x,d.y-48); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#fff'; circle(x+10,d.y-60,4);
  }else if(d.k==='door'){
    ctx.fillStyle=INK; rr(x-13,d.y-38,24,40,10); ctx.fillStyle='#b9793a'; rr(x-11,d.y-36,20,38,8); ctx.fillStyle='#ffd23f'; circle(x+4,d.y-16,2.4);
  }
}
function drawPad(p){
  const sq=p.bt>time?(p.bt-time)/.25:0;
  if(p.k==='hay'){
    ctx.fillStyle='#c79a2e'; rr(p.x-p.w-1,p.y-1+sq*5,p.w*2+2,p.h+4-sq*5,6);
    ctx.fillStyle='#ecc94e'; rr(p.x-p.w+1,p.y+1+sq*5,p.w*2-2,p.h-sq*5,4.5);
    ctx.strokeStyle='#c79a2e'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(p.x-5,p.y+3+sq*5); ctx.lineTo(p.x-5,p.y+p.h); ctx.moveTo(p.x+6,p.y+3+sq*5); ctx.lineTo(p.x+6,p.y+p.h); ctx.stroke();
    return;
  }
  const cy=p.y+sq*7, w=p.w+sq*5;
  ctx.fillStyle='#f3e9d2'; rr(p.x-6,cy,12,p.y+p.h-cy+3,5);
  ctx.fillStyle=['#e63946','#ff8a1f','#7b4fd6','#3aa0e8','#ff7ab0','#58b548'][p.c%6]; ctx.beginPath(); ctx.ellipse(p.x,cy+3,w+4,17-sq*5,0,Math.PI,0); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#fff'; circle(p.x-w*.45,cy-4,3.2); circle(p.x+w*.3,cy-8,3.8); circle(p.x+w*.62,cy-2,2.4);
}
function drawEgg(x,y){
  ctx.fillStyle='rgba(255,220,90,.35)'; circle(x,y-2,17+(reduced?0:2*Math.sin(time*5)));
  ctx.fillStyle=INK; ctx.beginPath(); ctx.ellipse(x,y-2,9.5,12.5,0,0,TAU); ctx.fill();
  ctx.fillStyle='#ffd23f'; ctx.beginPath(); ctx.ellipse(x,y-2,8,11,0,0,TAU); ctx.fill();
  ctx.fillStyle='#fff3b0'; ctx.beginPath(); ctx.ellipse(x-3,y-6,2,3.4,-.5,0,TAU); ctx.fill();
}
function drawSecrets(x0,x1,y0,y1){
  for(const e of ST.EGGS){
    if(ST.eggGot[e.b]||e.x<x0-30||e.x>x1+30) continue;
    if(solidW(e.x,e.y)){
      if(e.hint){ const sy=surfaceY(e.x)-12, a=Math.max(0,Math.sin(time*2.2+e.x)); if(a>0){ ctx.globalAlpha=a; ctx.fillStyle='#ffd23f'; star4(e.x,sy,9); ctx.globalAlpha=1; } }
      continue;
    }
    if(e.y>y0-30&&e.y<y1+30) drawEgg(e.x,e.y+(reduced?0:2.5*Math.sin(time*3+e.x)));
  }
  for(const l of ST.LOOT){
    if(ST.lootGot[l.id]||l.x<x0-30||l.x>x1+30) continue;
    if(l.bur&&solidW(l.x,l.y)){
      const sy=surfaceY(l.x), a=Math.max(0,Math.sin(time*2.2+l.x));
      if(l.xm){ ctx.strokeStyle='#e63946'; ctx.lineWidth=4; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(l.x-8,sy-9); ctx.lineTo(l.x+8,sy+5); ctx.moveTo(l.x+8,sy-9); ctx.lineTo(l.x-8,sy+5); ctx.stroke(); }
      else if(a>0){ ctx.globalAlpha=a; ctx.fillStyle='#fff8e6'; star4(l.x,sy-12,8); ctx.globalAlpha=1; }
      continue;
    }
    if(l.tro) emo('🏆',l.x,l.y-8,36);
    else if(l.pot){ ctx.fillStyle='#ffd23f'; circle(l.x-5,l.y-9,4.5); circle(l.x+4,l.y-10,4.5); circle(l.x,l.y-13,4.5); ctx.fillStyle=INK; rr(l.x-12,l.y-8,24,18,8); ctx.fillRect(l.x-14,l.y-9,28,4); }
    else{ ctx.fillStyle=INK; rr(l.x-13,l.y-9,26,19,3); ctx.fillStyle='#b9793a'; rr(l.x-11,l.y-7,22,15,2); ctx.fillStyle='#d89a4a'; rr(l.x-11,l.y-13,22,9,4.5); ctx.fillStyle='#ffd23f'; rr(l.x-2.5,l.y-6,5,6,1.5); }
  }
}
const OHOLE=[[-.4,-.3,.2],[.3,-.45,.13],[.45,.1,.22],[-.1,.35,.16],[-.55,.25,.11],[.1,-.05,.09]];
function drawOrb(o){
  const x=o.x, y=o.y, r=o.r;
  if(o.k===0||o.k===1){
    ctx.fillStyle=o.k?'#d9a066':'#f5c63c'; circle(x,y,r);
    ctx.fillStyle=o.k?'#5a3620':'#d9a520'; for(const q of OHOLE) circle(x+q[0]*r,y+q[1]*r,q[2]*r*(o.k?.6:1));
    emo(o.k?'🍪':'🐭',x,y-r-12,24);
  }else if(o.k===2){
    ctx.fillStyle='#aab3c2'; circle(x,y,r);
    for(let i=0;i<14;i++){ const a=i*2.4, d=r*(.2+.7*((i*37)%10)/10); ctx.fillStyle='hsl('+((i*47+(reduced?0:Math.floor(time*90)))%360)+',80%,70%)'; ctx.fillRect(x+d*Math.cos(a)-7,y+d*Math.sin(a)-7,14,14); }
    emo('🕺',x,y-r-14,24);
  }else{
    const a=Math.atan2(P.y-y,P.x-x), ix=x+r*.34*Math.cos(a), iy=y+r*.34*Math.sin(a);
    ctx.fillStyle='#f4f8fc'; circle(x,y,r); ctx.fillStyle='#3aa0e8'; circle(ix,iy,r*.46); ctx.fillStyle=INK; circle(ix,iy,r*.24); ctx.fillStyle='#fff'; circle(ix-r*.12,iy-r*.14,r*.08);
  }
}
/* Alles aus der großen Welt, das hinter dem Helden steht */
function drawWorldBack(x0,x1,y0,y1){
  for(const d of ST.DECO) if(d.x>x0-70&&d.x<x1+70) drawDeco(d);
  for(const p of ST.PADS) if(p.x>x0-60&&p.x<x1+60) drawPad(p);
  drawSecrets(x0,x1,y0,y1);
  drawCres(x0,x1,y0,y1);
  const pk=function(q){ const b=reduced?0:2.5*Math.sin(time*3.4+q.x); ctx.fillStyle='rgba(255,255,255,.35)'; circle(q.x,q.y+b,13); emo(q.e,q.x,q.y+b+1,19); };
  for(const q of ST.PICKS) if(q.t<=time&&q.y===q.y&&q.x>x0-20&&q.x<x1+20) pk(q);
  for(const d of ST.DROPS) if(d.x>x0-20&&d.x<x1+20) pk(d);
}
/* Alles aus der großen Welt, das vor dem Helden fliegt */
function drawWorldFront(){
  for(const t of throws) emo(t.e,t.x,t.y,18);
  if(bolt){
    ctx.strokeStyle='#fff7a8'; ctx.lineWidth=4; ctx.lineJoin='miter'; ctx.beginPath(); ctx.moveTo(bolt.x,bolt.y0);
    let y=bolt.y0, k=0; while(y<bolt.y1){ y+=34; ctx.lineTo(bolt.x+((k++%2)?-14:14),Math.min(y,bolt.y1)); }
    ctx.stroke();
  }
  if(ufo){
    if(ufo.beam&&ufo.t<10){ ctx.fillStyle='rgba(255,246,160,.3)'; ctx.beginPath(); ctx.moveTo(ufo.x-8,ufo.y+6); ctx.lineTo(ufo.x+8,ufo.y+6); ctx.lineTo(ufo.x+34,P.y+4); ctx.lineTo(ufo.x-34,P.y+4); ctx.closePath(); ctx.fill(); }
    emo('🛸',ufo.x,ufo.y+(reduced?0:3*Math.sin(time*5)),30);
  }
  if(P.mode!=='walk') return;
  if(FX.float>0){
    const ks=kidScale();
    ctx.strokeStyle=INK; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(P.x+P.face*4,P.y-22*ks); ctx.lineTo(P.x+P.face*6,P.y-52*ks); ctx.stroke();
    emo('🎈',P.x+P.face*6,P.y-64*ks,24);
  }
  if(FX.stink>0){ ctx.fillStyle=INK; for(let i=0;i<3;i++){ const a=time*7+i*2.1; circle(P.x+16*Math.cos(a),P.y-34+9*Math.sin(a*1.3),1.6); } }
}

/* ---------- Karte zum Reisen und die Belohnungen für goldene Eier ---------- */
function renderMap(){
  const R=rlm(), L=R?[{e:R.e,x:LANDX,n:'zum Landeplatz',k:-2}]:[{e:'🏠',x:820,n:'nach Hause',k:-2},{e:'⛷️',x:5700,n:'zum Schneeberg',k:-1}], per=11;
  for(const b of ST.BIO) if(ST.seen[b.i]) L.push({e:BT[b.t].e,x:b.x0+240,n:BT[b.t].to,k:b.i,num:b.n+1});
  /* Leuchtmarken sind Reiseziele: Dort war man schon, also umgeht das keinen Bohrer. */
  marks().forEach(function(m,i){ L.push({e:'🔆',x:m[0],y:m[1],n:'zur Leuchtmarke',k:'m'+i,num:i+1}); });
  const pages=Math.max(1,Math.ceil(L.length/per)); if(mapPg>=pages) mapPg=0;
  const here=bix[clamp(Math.floor(P.x/CELL),0,GX-1)]-1, cur=here>=0?here:(P.x>5600&&!R?-1:-2);
  let h='';
  L.slice(mapPg*per,mapPg*per+per).forEach(function(q){
    h+='<button class="card place'+(q.k===cur?' cur':'')+'" data-go="'+q.x+'"'+(q.y!=null?' data-gy="'+q.y+'"':'')+' data-say="'+q.n+'" aria-label="Reise '+q.n+'"><span aria-hidden="true">'+q.e+'</span>'+(q.num>1?'<small>'+q.num+'</small>':'')+'</button>';
  });
  if(pages>1) h+='<button class="card place" data-go="next" aria-label="Weitere Orte zeigen"><span aria-hidden="true">➡️</span></button>';
  else if(nextLand()) h+='<button class="card place shut" data-go="" aria-label="Noch nicht entdeckt"><span aria-hidden="true">❓</span></button>';
  $('map-cards').innerHTML=h;
}
/* ---------- Erkundungskarte: Ein Querschnitt der Welt. Sichtbar ist nur, wo man schon war; die Lampe deckt mehr auf. ---------- */
const FGT=40, FGW=Math.ceil(GX/FGT), FGH=Math.ceil(GY/FGT), FOG={};
function fRow(y){ return clamp(Math.floor((y-TOP)/CELL/FGT),0,FGH-1); }
let fogDirty=false, fogT=0;
function fogKey(){ return K_FOG+(realm?'-'+realm:''); }
function fogArr(){
  const k=fogKey(); if(FOG[k]) return FOG[k];
  const a=new Uint8Array(Math.ceil(FGW*FGH/8)); let got=false;
  try{ const b=localStorage.getItem(k); if(b){ const t=atob(b); if(t.length===a.length){ for(let i=0;i<t.length;i++) a[i]=t.charCodeAt(i); got=true; } } }catch(_){}
  FOG[k]=a; if(!got) fogSeed(a);
  return a;
}
function fogSet(a,tx,ty){ if(tx<0||ty<0||tx>=FGW||ty>=FGH) return; const i=ty*FGW+tx; if(!(a[i>>3]&(1<<(i&7)))){ a[i>>3]|=1<<(i&7); fogDirty=true; } }
function fogHas(a,tx,ty){ const i=ty*FGW+tx; return !!(a[i>>3]&(1<<(i&7))); }
/* Alte Spielstände: Oberfläche entdeckter Länder und der Aufzugschacht bis zur erreichten Zone sind schon bekannt. */
function fogSeed(a){
  const c0=Math.floor(RC0/FGT), c1=Math.min(FGW-1,Math.floor(Math.min(RC1,genF)/FGT));
  for(let tx=c0;tx<=c1;tx++){
    const x=(tx+.5)*FGT*CELL, bi=bix[clamp(Math.floor(x/CELL),0,GX-1)];
    if(!realm&&!(x<BEND||(bi&&ST.seen[bi-1]))) continue;
    if(realm&&Math.abs(x-LANDX)>3000) continue;
    const gy=fRow(ground(x)); for(let ty=0;ty<=gy+1;ty++) fogSet(a,tx,ty);
  }
  if(!realm&&hero.zn>0){ const tx=Math.floor(LIFTX/CELL/FGT), r=ZN[Math.min(hero.zn,ZN.length-1)].row; for(let ty=0;ty<=Math.floor(r/FGT)+1;ty++){ fogSet(a,tx,ty); fogSet(a,tx-1,ty); } }
  fogDirty=true;
}
function fogTick(dt){
  fogT-=dt; if(fogT>0) return; fogT=.4;
  const a=fogArr(), tx=Math.floor(P.x/CELL/FGT), ty=fRow(P.y), r=1+(hero.lp|0);
  for(let dy=-r;dy<=r;dy++) for(let dx=-r-1;dx<=r+1;dx++) if(dx*dx+dy*dy<=(r+1)*(r+1)) fogSet(a,tx+dx,ty+dy);
  if(P.y<ground(P.x)) for(let y=0,gy=fRow(ground(P.x));y<=gy;y++) fogSet(a,tx,y);
}
function fogSave(){
  if(!fogDirty||ST.frozen) return; fogDirty=false;
  for(const k in FOG){ let t=''; const a=FOG[k]; for(let i=0;i<a.length;i+=4096) t+=String.fromCharCode.apply(null,a.subarray(i,i+4096)); try{ localStorage.setItem(k,btoa(t)); }catch(_){} }
}
setInterval(fogSave,15000);
document.addEventListener('visibilitychange',function(){ if(document.hidden) fogSave(); });
const FCOL=['','#ff6a1f','#ffb02e','#3a8fe0','#8a5a35','#7a7a84','#bfe8ff','#8a5a2b','#2b2b36','#4d4660','#8c3a2a','#ff3d00','#f2c84b','#61d6e8','#ffffff','#e8d6b0'];
function renderFog(){
  const a=fogArr(), cv=$('map-c'), S=4, c0=Math.floor(RC0/FGT), c1=Math.min(FGW-1,Math.floor(RC1/FGT)), w=c1-c0+1, dpr=Math.min(2,window.devicePixelRatio||1);
  /* Nur so tief zeigen, wie schon erkundet ist, plus ein Stück Dunkel darunter. */
  let deep=0; for(let ty=FGH-1;ty>0&&!deep;ty--) for(let tx=c0;tx<=c1;tx++) if(fogHas(a,tx,ty)){ deep=ty; break; }
  const FH=Math.min(FGH,Math.max(16,deep+5));
  cv.width=w*S*dpr; cv.height=FH*S*dpr; cv.style.width=(w*S)+'px'; cv.style.height=(FH*S)+'px';
  const g=cv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); g.fillStyle='#151522'; g.fillRect(0,0,w*S,FH*S);
  for(let tx=c0;tx<=c1;tx++){
    const cx=Math.min(GX-1,tx*FGT+(FGT>>1)), gr=(ground(cx*CELL)-TOP)/CELL;
    for(let ty=0;ty<FH;ty++){
      if(!fogHas(a,tx,ty)) continue;
      const cy=ty*FGT+(FGT>>1); let m=cx<genF?grid[cy*GX+cx]:0;
      g.fillStyle=m?(FCOL[m]||'#666'):(cy<gr?'#8fcdf0':'#2c2638');
      g.fillRect((tx-c0)*S,ty*S,S,S);
    }
  }
  g.font='12px sans-serif'; g.textAlign='center'; g.textBaseline='middle';
  const mark=function(x,y,e){ const tx=Math.floor(x/CELL/FGT), ty=fRow(y); if(tx<c0||tx>c1||!fogHas(a,tx,ty)) return; g.fillText(e,(tx-c0+.5)*S,ty*S+S/2-4); };
  for(const m of MACH) if(!ST.pzGot[m.id]&&!m.gone&&m.y===m.y) mark(m.x,m.y-20,'⚙️');
  for(const v of VAULTS) if(doorShut(v)) mark(v.x,v.fy-20,'🚪');
  for(const m of marks()) mark(m[0],m[1]-14,'🔆');
  if(!realm) mark(WSX,ground(WSX)-30,'🏠'); else mark(LANDX,ground(LANDX)-30,'🚀');
  const px=(P.x/CELL/FGT-c0)*S, py=clamp((P.y-TOP)/CELL/FGT,0,FH)*S;
  g.fillStyle='#ff3b3b'; g.strokeStyle='#fff'; g.lineWidth=2; g.beginPath(); g.arc(px,py,5,0,TAU); g.fill(); g.stroke();
  const v=$('map-v'); requestAnimationFrame(function(){ v.scrollLeft=px-v.clientWidth/2; });
}
function mapClick(e){
  const b=e.target.closest('[data-go]'); if(!b) return;
  const go=b.dataset.go;
  if(go==='next'){ mapPg++; renderMap(); return; }
  if(go===''){ speak('Weiter rechts liegen noch mehr Länder. Die musst du erst entdecken.'); return; }
  $('map').hidden=true;
  if(b.dataset.gy){ if(P.mode!=='walk') setMode('walk'); grow(+go+3200); P.x=+go; P.y=+b.dataset.gy-2; P.vx=0; P.vy=0; cam.x=P.x; cam.y=P.y-80; smoke(P.x,P.y-20,6); speak('Zur Leuchtmarke!'); return; }
  teleport(+go); speak('Auf '+b.dataset.say+'!');
}
function renderEggs(){
  $('eggs').innerHTML='<span class="eggn">'+EGGSVG+'<b>'+(hero.eggs|0)+'</b></span>'+WEAR.map(function(q){
    const own=q[0]<0?!!hero.own[q[2]]:(hero.eggs|0)>=q[0], on=hero.pet===q[2]||hero.hat===q[2]||(q[1]==='trail'&&hero.trail);
    if(q[0]<0&&!own) return '';
    const pic=q[1]==='pet'?PETS[q[2]]:q[1]==='hat'?EHAT[q[2]]:'🌈';
    return '<button class="'+(own?(on?'on':''):'q')+'" data-wear="'+q[2]+'" aria-label="'+(own?q[3]:'Für '+q[0]+' goldene Eier')+'">'+(own?pic:q[0])+'</button>';
  }).join('');
}
function eggClick(e){
  const b=e.target.closest('[data-wear]'); if(!b) return;
  const q=WEAR.find(function(w){return w[2]===b.dataset.wear;}), own=q[0]<0?!!hero.own[q[2]]:(hero.eggs|0)>=q[0];
  if(!own){ tone([170],'sawtooth'); speak('Dafür brauchst du '+q[0]+' goldene Eier.'); return; }
  hero.trail=!hero.trail;
  tone([660]); saveHero(); renderEggs();
}

/* ---------- Tiefe und Höhe: Unter dem heißen Gestein liegen vier neue Zonen, getrennt durch harte Schichten. Über dem Mond geht der Weltraum weiter.
   Bohrer, Rakete, Lampe und Schutz werden in der Werkstatt stufenweise besser. Dafür braucht es Zahnräder aus den Rätselmaschinen und ab Stufe 2 Meistersteine. ---------- */
QI.lab='<path d="M14.5 3a5 5 0 0 0-4.6 6.9L3.6 16.2a2.3 2.3 0 0 0 3.2 3.2l6.300-6.300A5 5 0 0 0 20 8.500l-3 3-3.500-1-1-3.500 3-3z" fill="#9aa7b4" '+S1+' stroke-width="1.6"/><circle cx="5.300" cy="17.700" r="1" fill="'+K+'"/>';
AI.lab='<path d="M14.5 3a5 5 0 0 0-4.6 6.9L3.6 16.2a2.3 2.3 0 0 0 3.2 3.2l6.300-6.300A5 5 0 0 0 20 8.500l-3 3-3.500-1-1-3.500 3-3z" fill="currentColor"/>';
AI.pz='<path d="M8.300 9a3.700 3.700 0 1 1 5.600 3.200c-1.200.7-1.900 1.500-1.900 2.800" stroke="currentColor" stroke-width="3.200" fill="none" stroke-linecap="round"/><circle cx="12" cy="19.500" r="2" fill="currentColor"/>';
/* Stationen vom Aufzug, von oben nach unten */
const ZN=[
  {e:'🏠',n:'dein Zuhause',need:''},
  {e:'⛏️',n:'das Tiefengestein',s:'Tiefengestein',row:412,need:'Bohr dich mit der Tunnelbohrmaschine nach unten, bis das Gestein dunkel wird.'},
  {e:'♨️',n:'das heiße Gestein',s:'Heißes Gestein',row:586,need:'Bohr dich mit der Tunnelbohrmaschine nach unten, bis das Gestein rot wird.'},
  {e:'🍄',n:'die Pilzgrotten',s:'Pilzgrotten',row:700,need:'Sie liegen unter der rostroten Schicht. Dafür brauchst du den Bohrer Stufe 1.'},
  {e:'🦕',n:'die Urzeit-Höhlen',s:'Urzeit-Höhlen',row:1010,need:'Sie liegen unter den Pilzgrotten. Dafür brauchst du den Bohrer Stufe 1.'},
  {e:'🔮',n:'die Kristalltiefen',s:'Kristalltiefen',row:1360,need:'Sie liegen unter der lila Schicht. Dafür brauchst du den Bohrer Stufe 2.'},
  {e:'🌋',n:'das Lavameer',s:'Lavameer',row:1710,need:'Es liegt unter der schwarzen Schicht. Dafür brauchst du den Bohrer Stufe 3.'}
];
/* Werkstatt-Zählstand: Bild, Name, Mehrzahl, wo man es bekommt */
const MAT={
  ms:['💠','Meisterstein','Meistersteine','Meistersteine bekommst du, wenn eine Aufgabe richtig gut sitzt: Wenn du sie an verschiedenen Tagen immer wieder richtig weißt. Auf der Rechentafel siehst du, welche schon fast so weit sind.'],
  pk:['🪐','Planetenkern','Planetenkerne','Planetenkerne liegen ganz unten in den großen Planeten, unter der schwarzen Schicht: einer im Mond, einer im Eisplaneten und einer im Blubberplaneten. Dafür brauchst du den Bohrer Stufe 3.'],
  zr:['⚙️','Zahnrad','Zahnräder','Zahnräder bekommst du, wenn du eine Rätselmaschine löst. Über jeder schwebt ein Zahnrad.'],
};
/* Eisen, Mondsteine und die anderen Bauteile gibt es nicht mehr (Vereinfachungsplan Schritt 2). Sie bleiben in der Weltliste MATS,
   damit die Welt gleich entsteht, werden aber weder gezeigt noch eingesammelt. Gesammelte Stücke bleiben im Spielstand liegen. Planetenkerne bleiben als Fund. */
const MATK=['zr','ms','pk'], MATON={pk:1};
/* Die Geräte und ihre Preise: nur Zahnräder (aus Rätseln) und Meistersteine (aus gemeisterten Aufgaben), Vereinfachungsplan Schritt 2. */
const GEAR={
  dr:{e:'⛏️',n:'Bohrer',art:'den Bohrer',rc:[{zr:3},{zr:6,ms:2},{zr:9,ms:5}],
    what:['Er kommt dann durch die rostrote Schicht. Darunter liegen die Pilzgrotten.','Er kommt dann durch die lila Schicht. Darunter liegen die Kristalltiefen.','Er kommt dann durch die schwarze Schicht. Darunter liegt das Lavameer.'],
    done:['Der Eisenbohrer ist fertig! Jetzt kommst du durch die rostrote Schicht unter dem heißen Gestein.','Der Sternenbohrer ist fertig! Jetzt kommst du durch die lila Schicht unter den Urzeit-Höhlen.','Der Kristallbohrer ist fertig! Jetzt kommst du durch die schwarze Schicht bis zum Lavameer.']},
  rk:{e:'🚀',n:'Rakete',art:'die Rakete',rc:[{zr:3},{zr:5,ms:1},{zr:8,ms:3}],
    what:['Sie fliegt dann höher als der Mond, bis zu den Felsbrocken.','Sie fliegt dann bis zu den fernen Planeten.','Sie fliegt dann bis zum Sternentor am Ende des Weltraums.'],
    done:['Die Rakete ist stärker! Sie fliegt jetzt bis zu den Felsbrocken über dem Mond.','Die Rakete ist noch stärker! Sie fliegt jetzt bis zu den fernen Planeten.','Die Rakete ist fertig! Sie fliegt jetzt bis zum Sternentor.']},
  lp:{e:'🔦',n:'Lampe',art:'die Lampe',rc:[{zr:1},{zr:2},{zr:4}],
    what:['Sie leuchtet dann weiter.','Sie leuchtet dann noch weiter.','Dann ist es unter der Erde überall hell.'],
    done:['Die Lampe leuchtet jetzt weiter.','Die Lampe leuchtet jetzt noch weiter.','Die Sonnenlampe ist fertig! Jetzt ist es unter der Erde überall hell.']}
};
/* Schutz kam früher vom Markt und hat seine Stufe in hero.up.heat. Er kostet nur Zahnräder (Vereinfachungsplan Schritt 2). */
GEAR.hs={e:'🛡️',n:'Schutz',art:'den Schutz',rc:[{zr:2},{zr:3},{zr:4}],
  what:['Dann tut dir Feuer nichts mehr.','Dann tut dir Lava nichts mehr.','Dann tut dir der glühende Erdkern nichts mehr.'],
  done:['Der Schutz ist fertig! Feuer tut dir jetzt nichts mehr.','Der Schutz ist stärker! Lava tut dir jetzt nichts mehr.','Der Schutz ist ganz stark! Jetzt tut dir sogar der Erdkern nichts mehr.']};
const GEARK=['dr','rk','lp','hs'];
function gearLv(g){ return (g==='hs'?hero.up.heat:hero[g])|0; }
function gearSet(g,v){ if(g==='hs') hero.up.heat=v; else hero[g]=v; }
let MATS=[], MACH=[], ZDEC=[], SPACE={}, guide=null, klT=0, klS=0, klN=0, labHi=false, dkA=0, mhT=0, liftBusy=false;
const dkc=document.createElement('canvas'), dkx=dkc.getContext('2d');

function skyLim(){ return SKYL[hero.rk|0]; }
function stationY(k){ return k?ZN[k].y:ground(LIFTX); }
function zoneAt(x,y){
  if(y<700) return 0;
  const cx=clamp(Math.floor(x/CELL),0,GX-1), cy=Math.floor((y-TOP)/CELL);
  return cy>=zS3[cx]+SH?6:cy>=zS2[cx]+SH?5:cy>=z4[cx]?4:cy>=zS1[cx]+SH?3:cy>=rH[cx]?2:cy>=rD[cx]?1:0;
}
/* Die harten Schichten: Ohne den passenden Bohrer prallt alles ab. */
function shellOk(i){
  const y=(i/GX)|0, cx=i-y*GX, need=y<z4[cx]?1:y<zS3[cx]?2:3;
  if(hero.dr>=need) return true;
  if(time>klT){
    klT=time+.7;
    const wx=cx*CELL+3, wy=TOP+y*CELL;
    for(let k=0;k<5;k++) spawn(5,wx,wy,(Math.random()-.5)*200,-60-Math.random()*140,.5,2);
    shout(wx,wy-22,'KLONK!','#ffd23f'); sfx('tick'); shake=Math.max(shake,.1);
  }
  if(time>klS||klN!==need){
    klS=time+90; klN=need;
    say('','Klonk! Diese Schicht ist zu hart. Dafür brauchst du den Bohrer Stufe '+need+'. Schau in der Werkstatt nach, was dafür fehlt.');
    pulse('btn-lab');
  }
  return false;
}

/* ---------- Wissenstüren: Tief unten liegen Schatzkammern mit fester Wand. Die Tür geht auf, wenn man drei Lernaufgaben richtig löst.
   Sie haben eine eigene Zufallsreihe, damit sich an allem anderen nichts ändert. ---------- */
let VAULTS=[], doorQ=null;
function doorCols(v){ return [Math.floor((v.x-v.rx-20)/CELL),Math.floor((v.x-v.rx*.55)/CELL)]; }
function doorShut(v){ const c=Math.floor((v.x-v.rx-8)/CELL); return c<genF&&grid[(vFloor(v)-3)*GX+c]===BED; }
function nearDoor(){ for(const v of VAULTS) if(Math.abs(P.x-(v.x-v.rx-28))<46&&Math.abs(P.y-v.fy)<44&&doorShut(v)) return v; return null; }
/* Jede zweite Tür ist eine Rätseltür: Statt drei Aufgaben öffnet sie ein Rätsel, eine Stufe kniffliger als sonst. Das Zeichen an der Tür verrät vorher, welches. */
const DOORPZ=['muster','spiegel','waage','robo','stern'];
function doorPz(v){ return v.id%2?DOORPZ[(v.id>>1)%DOORPZ.length]:''; }
function doorAsk(v){
  if(!$('quiz').hidden||!$('pz').hidden) return;
  const pt=doorPz(v);
  if(pt){ pzOpen({t:pt,zb:1,quiz:true,door:v}); return; }
  doorQ={v:v,n:0}; $('quiz-pz').hidden=true;
  openQuiz(null);
  banner('🚪 ○○○',1800);
}
function doorOpen(v){
  const c=doorCols(v), fr=vFloor(v);
  for(let cx=c[0];cx<=c[1];cx++) for(let cy=fr-8;cy<fr;cy++){ grid[cy*GX+cx]=0; lifeS(cy*GX+cx,0); }
  scanMobile(); sfx('pop'); jingle(); confetti(v.x-v.rx,v.fy-30);
  say('','Die Wissenstür ist offen! Drinnen liegt ein Schatz.'); dayAdd('z','🚪'); campSoon();
}
function drawDoor(v){
  const x=v.x-v.rx-8, y=v.fy, g=reduced?.6:.6+.4*Math.sin(time*3);
  ctx.fillStyle='rgba(255,210,63,'+(.25*g).toFixed(3)+')'; rr(x-22,y-58,44,60,10);
  ctx.fillStyle='#6b4a2e'; rr(x-15,y-50,30,50,8);
  ctx.fillStyle='#8a6240'; rr(x-11,y-46,22,44,6);
  const pt=doorPz(v); emo(pt?PZI[pt].e:'❓',x,y-28,18);
}
/* Rund um Werkstatt und Aufzug stehen keine Bäume. */
function deepHome(){ for(let i=0;i<ST.NT0&&i<trees.length;i++){ const t=trees[i]; if(Math.abs(t.x-WSX)<64||Math.abs(t.x-LIFTX)<50||Math.abs(t.x-1330)<30) t.state=3; } }
/* Nach dem Laden: Was in der alten, breiteren Welt hinter der neuen Grenze lag, kommt nach Hause. */
function deepRestore(sv){
  ST.matGot=sv.matGot||{}; ST.pzGot=sv.pzGot||{}; guide=null; dkA=0;
  if(sv.v<4){
    /* Wer auf dem alten Erdkern stand, steht jetzt knapp über der neuen harten Schicht. */
    const deep=TOP+KEEPR*CELL-14;
    if(P.y>deep) P.y=deep;
    for(const n in parked){ const o=parked[n]; if(o&&o.y>deep) o.y=deep; }
  }
  if(sv.v===3||cutX){
    const lim=sv.v===3?genF*CELL-300:cutX;
    if(P.x>lim){ P.x=820; P.y=surfaceY(820)-2; }
    let k=0;
    for(const n in parked){ const o=parked[n]; if(o&&o.x>lim){ o.x=560+k*46; o.y=surfaceY(o.x); o.vy=0; o.ang=0; k++; } }
    ST.props=ST.props.filter(function(o){ return o.x<lim; });
    ST.tracks=ST.tracks.filter(function(T){ return T.maxX<lim; });
    ST.hidden=ST.hidden.filter(function(h){ return h.x<lim; });
  }
  deepHome();
}

/* ---------- Jede Sekunde: Zonen entdecken, Planetenkerne einsammeln, Maschinen auf den Boden stellen, Ziele erreichen ---------- */
function matFound(m){
  const k=m.k, n=(hero.mat[k]|0)+1;
  ST.matGot[m.id]=1; hero.mat[k]=n; ST.heroDirty=true;
  sfx('coin'); dayAdd('mat');
  for(let i=0;i<10;i++) spawn(5,m.x,m.y,(Math.random()-.5)*180,-60-Math.random()*160,.7,2);
  hero.mk.pk=1; ST.lootDirty=true; confetti(m.x,m.y); jingle(); banner('🪐 '+n+' / 3',2600); say('',n>=3?'Alle drei Planetenkerne! Du hast jede große Welt bis ganz nach unten erforscht.':'Ein Planetenkern! Er leuchtet wie ein kleiner Stern. In jedem großen Planeten liegt einer.'); dayAdd('z','🪐'); campSoon(); labBadge(true);
}
function canBuild(g){
  const t=gearLv(g); if(t>=3) return false;
  const rc=GEAR[g].rc[t];
  for(const k in rc) if((hero.mat[k]|0)<rc[k]) return false;
  return true;
}
function labBadge(talk){
  const can=GEARK.some(canBuild), el=$('lab-n');
  if(el) el.hidden=!can;
  if(can&&!labHi&&talk){ later(2.2,function(){ say('','Du hast genug gesammelt! In der Werkstatt kannst du jetzt etwas Neues bauen.'); pulse('btn-lab'); }); }
  labHi=can;
}
function finale(n){
  hero.fin|=n;
  if(n===1){
    for(let i=0;i<8;i++) later(i*.35,function(){ firework(P.x-240+Math.random()*480,P.y-140-Math.random()*160); });
    banner('🌟',3000);
    say('','Du hast das Sternentor erreicht, ganz am Ende vom Weltraum!');
  }else{
    banner('🌋',3000);
    say('','Du stehst auf dem glühenden Erdkern! Tiefer geht es nicht.');
  }
  ST.lootDirty=true; confetti(P.x,P.y); jingle(); saveHero(); renderEggs();
  if(hero.fin===3) later(10,function(){ banner('🏆',3200); say('','Ganz unten und ganz oben: Du hast alles erforscht. Du bist der größte Forscher von Lavaland!'); });
}
function deepIntro(){
  if(hero.deep) return;
  hero.deep=true; saveHero();
  if(quest&&!quest.done&&quest.type!=='find'){ hero.quest={type:'pz',goal:1,p:0}; showQuest(false); }
  pulse('btn-lab');
  tell([['Professor Zahnrad','Hallo! Ich bin Professor Zahnrad. Meine Werkstatt steht jetzt bei dir zu Hause.'],
    ['Professor Zahnrad','Unter der Erde geht es jetzt viel tiefer, und der Weltraum ist riesig. Aber dafür brauchst du einen besseren Bohrer und eine stärkere Rakete.'],
    ['Professor Zahnrad','Die baue ich dir. Bring mir Zahnräder und später Meistersteine. Zahnräder bekommst du von meinen Rätselmaschinen. Die erste steht gleich rechts neben dem Aufzug.']]);
}
/* Was früher die Geschichte schenkte, gibt es jetzt für Zonen (Vereinfachungsplan Schritt 3): Feuerwerk, goldene Ski, Drache.
   Wer es schon hat, behält es. Beim Start wird nachgeholt, was zur erreichten Zone gehört. */
const ZGIFT=[[1,'fw','Das Feuerwerk','Es liegt bei den Werkzeugen.','tool-fw'],[3,'goldski','Die goldenen Ski','Nimm die Ski, dann siehst du sie.','mode-ski'],[5,'dragon','Mama Glut, der Drache','Sie wartet bei den Fahrzeugen. Jetzt kannst du auf ihr fliegen.','mode-dragon']];
function zoneGifts(talk){
  let got=null;
  for(const g of ZGIFT) if(hero.zn>=g[0]&&!hero.own[g[1]]){ hero.own[g[1]]=1; got=g; }
  if(!got) return;
  saveHero(); syncOwn();
  if(talk) later(3,function(){ banner('🎁',2400); say('',got[2]+' gehört jetzt dir! '+got[3]); pulse(got[4]); });
}
function deepTick(dt){
  mhT-=dt;
  if(mhT<=0){ mhT=.6; const lim=(genF-8)*CELL; for(const m of MACH) if(m.sf&&m.x<lim) m.y=surfaceY(m.x); }
  if(P.mode!=='coaster'){
    const z=zoneAt(P.x,P.y-12), R=rlm();
    if(R){
      if(z&&!ST.seen['z'+z]){ ST.seen['z'+z]=1; jingle(); confetti(P.x,P.y); banner(R.zn[z-1][0]+' ⭐',2400); say('','Du hast '+R.zn[z-1][1]+' erreicht!'); dayAdd('z',R.zn[z-1][0]); campSoon(); }
    }else if(z>hero.zn){
      hero.zn=z; saveHero(); jingle(); confetti(P.x,P.y); banner(ZN[z].e+' ⭐',2400);
      say('','Du hast '+ZN[z].n+' erreicht! Der Aufzug zu Hause fährt jetzt bis hierher.'); dayAdd('z',ZN[z].e); campSoon();
      zoneGifts(true);
    }
  }
  const pts=[[P.x,P.y-16]];
  if(P.mode==='bagger') pts.push(bucket()); else if(P.mode==='loader') pts.push(scoop()); else if(P.mode==='tbm') pts.push(drillHead());
  for(const m of MATS){
    if(ST.matGot[m.id]||!MATON[m.k]||Math.abs(m.x-P.x)>260||Math.abs(m.y-P.y)>260) continue;
    for(const q of pts) if(Math.hypot(q[0]-m.x,q[1]-m.y)<30){ matFound(m); break; }
  }
  if(P.on&&P.y<-6000&&SPACE.gate){
    for(const k of ['stn','ice','jun']){
      const o=SPACE[k];
      if(ST.orbGot[k]||Math.hypot(P.x-o.x,P.y-o.y)>o.r+40) continue;
      ST.orbGot[k]=1; skyMark(k); ST.lootDirty=true; confetti(P.x,P.y); jingle(); banner('⭐',2400);
      say('',k==='stn'?'Du bist auf der Raumstation gelandet! Ringsum schweben große Felsbrocken.':k==='ice'?'Du bist auf dem Eisplaneten gelandet!':'Du bist auf dem Blubberplaneten gelandet! Hier wohnt Blubb.');
    }
    if(!(hero.fin&1)&&Math.hypot(P.x-SPACE.gate.x,P.y-SPACE.gate.y)<SPACE.gate.r+40) finale(1);
  }
  if(!(hero.fin&2)&&!realm&&P.y>9000&&cellAt(P.x,P.y+3)===CORE) finale(2);
  if(!hero.deep&&performance.now()>ST.talkLock&&Math.abs(P.x-WSX)<110&&Math.abs(P.y-ground(WSX))<90) deepIntro();
  if(guide&&time>guide.t) guide=null;
}
function nextMach(){
  let b=null, bd=1e12; const lim=(genF-8)*CELL;
  for(const m of MACH){
    if(ST.pzGot[m.id]||m.y!==m.y||m.x>lim) continue;
    const d=Math.abs(m.x-P.x)+2.5*Math.abs(m.y-P.y);
    if(d<bd){ bd=d; b=m; }
  }
  return b;
}
function nearMach(){ for(const m of MACH) if(m.y===m.y&&Math.abs(P.x-m.x)<34&&Math.abs(P.y-m.y)<52) return m; return null; }
function nearCab(){ if(Math.abs(P.x-LIFTX)>46) return -1; for(let k=0;k<ZN.length;k++) if(Math.abs(P.y-stationY(k))<64) return k; return -1; }
function atLab(){ return Math.abs(P.x-WSX)<110&&Math.abs(P.y-ground(WSX))<120; }
function deepIcon(){ if(!P.on) return ''; return nearMach()||nearDoor()?'pz':nearCab()>=0?'lift':Math.abs(P.x-WSX)<44&&Math.abs(P.y-ground(WSX))<60?'lab':''; }
function deepAct(){
  if(!P.on) return false;
  const m=nearMach();
  if(m){ pzOpen(m); return true; }
  const v=nearDoor();
  if(v){ doorAsk(v); return true; }
  if(nearCab()>=0){ openMine(); return true; }
  if(Math.abs(P.x-WSX)<44&&Math.abs(P.y-ground(WSX))<60){ openLab(); return true; }
  return false;
}
function deepTap(wx,wy){
  const gy=ground(WSX);
  if(Math.abs(wx-WSX)<60&&wy>gy-100&&wy<gy+8&&Math.abs(cam.y-gy)<700){ openLab(); return true; }
  if(Math.abs(wx-LIFTX)<34) for(let k=0;k<ZN.length;k++){
    const y=stationY(k);
    if(wy<y-(k?58:112)||wy>y+8) continue;
    if(Math.hypot(P.x-LIFTX,P.y-y)<190) openMine(); else say('','Geh erst zum Aufzug hin.');
    return true;
  }
  for(const v of VAULTS){
    if(Math.abs(wx-(v.x-v.rx-8))>26||wy<v.fy-56||wy>v.fy+4||!doorShut(v)) continue;
    if(Math.hypot(P.x-v.x+v.rx,P.y-v.fy)<200) doorAsk(v); else say('','Geh erst näher an die Tür heran.');
    return true;
  }
  for(const m of MACH){
    if(m.y!==m.y||Math.abs(wx-m.x)>28||wy<m.y-74||wy>m.y+8) continue;
    if(Math.hypot(P.x-m.x,P.y-m.y)<360) pzOpen(m); else say('','Geh erst näher an die Rätselmaschine heran.');
    return true;
  }
  return false;
}
/* Pfeil zur nächsten Rätselmaschine (Zahnrad), zur Werkstatt oder zum nächsten Planetenkern. */
function matWhere(k){
  if(k==='zr'){ const m=nextMach(); return m?[m.x,m.y-52]:null; }
  if(realm){
    /* Auf fremden Welten: zum nächsten Stück, sonst nach oben, heim zur Erde. */
    let b=null, bd=1e12;
    if(k!=='lab') for(const m of MATS){ if(m.k!==k||ST.matGot[m.id]) continue; const d=Math.hypot(m.x-P.x,m.y-P.y); if(d<bd){ bd=d; b=m; } }
    return b?[b.x,b.y]:[P.x,P.y-500];
  }
  if(k==='lab') return [WSX,ground(WSX)-96];
  let b=null, bd=1e12;
  for(const m of MATS){ if(m.k!==k||ST.matGot[m.id]) continue; const d=Math.hypot(m.x-P.x,m.y-P.y); if(d<bd){ bd=d; b=m; } }
  return b?[b.x,b.y]:null;
}
function guidePoint(){ return guide?matWhere(guide.k):null; }

/* ---------- Werkstatt ---------- */
function missing(g){
  const t=gearLv(g), rc=GEAR[g].rc[t], out=[];
  for(const k in rc){ const d=rc[k]-(hero.mat[k]|0); if(d>0) out.push(d+' '+MAT[k][d>1?2:1]); }
  return out.length>1?out.slice(0,-1).join(', ')+' und '+out[out.length-1]:out[0]||'';
}
function renderLab(){
  let h='';
  for(const k of MATK){
    const n=hero.mat[k]|0, kn=!!hero.mk[k]||n>0;
    h+='<button class="'+(kn?'':'none')+'" data-mat="'+k+'" aria-label="'+MAT[k][1]+': '+n+'"><span aria-hidden="true">'+MAT[k][0]+'</span><b>'+n+'</b></button>';
  }
  $('lab-inv').innerHTML=h;
  h='';
  for(const g of GEARK){
    const G=GEAR[g], t=gearLv(g), rc=t<3?G.rc[t]:null, can=canBuild(g);
    h+='<div class="rc"><button class="tl" data-tl="'+g+'" aria-label="'+G.n+', Stufe '+t+' von 3"><span aria-hidden="true">'+G.e+'</span><i aria-hidden="true">'+'●'.repeat(t)+'○'.repeat(3-t)+'</i></button><div class="need">';
    if(rc) for(const k in rc){
      const n=hero.mat[k]|0;
      h+='<button class="chipm '+(n>=rc[k]?'ok':'no')+'" data-mat="'+k+'" aria-label="'+MAT[k][1]+': '+Math.min(n,rc[k])+' von '+rc[k]+'"><span aria-hidden="true">'+MAT[k][0]+'</span>'+Math.min(n,rc[k])+'/'+rc[k]+'</button>';
    }
    h+='</div><button class="mk '+(t>=3?'max':can?'go':'wait')+'" data-mk="'+g+'" aria-label="'+G.n+(t>=3?' ist fertig':' bauen')+'">'+(t>=3?'✓':'🔨')+'</button></div>';
  }
  $('lab-rcp').innerHTML=h;
  h='';
  for(const p of PZON){ const l=hero.pz[p.id]|0; h+='<button data-pzt="'+p.id+'" aria-label="'+p.n+': Stufe '+(l+1)+' von 10"><span aria-hidden="true">'+p.e+'</span><i><b style="width:'+((l+1)*10)+'%"></b></i></button>'; }
  $('lab-brain').innerHTML=h;
  $('lab-taf').innerHTML='<span aria-hidden="true">🔢</span><span aria-hidden="true">💠</span>'+(hero.mat.ms|0);
}
function openLab(){
  renderLab(); $('lab').hidden=false; ST.talkLock=0;
  if(!hero.deep){ hero.deep=true; saveHero(); speak('Das ist die Werkstatt von Professor Zahnrad. Hier siehst du, was du für einen besseren Bohrer, eine stärkere Rakete, eine hellere Lampe und einen Schutz gegen Feuer brauchst. Tippe auf ein Bild, dann sage ich dir, wo du es findest.'); }
}
function labBuild(g){
  const G=GEAR[g], t=gearLv(g);
  if(t>=3){ speak(G.n+' ist schon ganz fertig.'); return; }
  if(!canBuild(g)){ tone([170],'sawtooth'); speak('Für '+G.art+' fehlen noch '+missing(g)+'. Tippe auf ein Bild, dann sage ich dir, wo du es findest.'); return; }
  if(!atLab()){ tone([170],'sawtooth'); guide={k:'lab',t:time+120}; speak('Du hast alles zusammen! Bauen kann aber nur Professor Zahnrad. Komm zur Werkstatt. Sie steht bei dir zu Hause.'); return; }
  const rc=G.rc[t];
  for(const k in rc) hero.mat[k]-=rc[k];
  gearSet(g,t+1); saveHero(); guide=null;
  $('lab').hidden=true; confetti(P.x,P.y); jingle();
  banner(G.e+' '+'●'.repeat(t+1)+'○'.repeat(2-t),2600);
  say('Professor Zahnrad',G.done[t]);
  labBadge(false);
}
$('lab').addEventListener('click',function(e){
  let b=e.target.closest('[data-mat]');
  if(b&&b.dataset.mat==='ms'){ speak(MAT.ms[1]+'. Du hast '+(hero.mat.ms|0)+'. '+MAT.ms[3]); return; }
  if(b){ const k=b.dataset.mat; guide={k:k,t:time+300}; speak(MAT[k][1]+'. Du hast '+(hero.mat[k]|0)+'. '+MAT[k][3]+' Der orange Pfeil zeigt dir den Weg.'); return; }
  b=e.target.closest('[data-tl]');
  if(b){ const g=b.dataset.tl, G=GEAR[g], t=gearLv(g); speak(t>=3?G.n+' ist ganz fertig.':G.n+', Stufe '+(t+1)+'. '+G.what[t]+(canBuild(g)?' Du hast alles dafür. Tippe auf den Hammer.':' Dafür fehlen noch '+missing(g)+'.')); return; }
  b=e.target.closest('[data-mk]');
  if(b){ labBuild(b.dataset.mk); return; }
  b=e.target.closest('[data-pzt]');
  if(b){ const p=PZI[b.dataset.pzt]; speak(p.n+': Stufe '+((hero.pz[p.id]|0)+1)+' von 10. Je mehr Rätsel du ohne Fehler löst, desto kniffliger werden sie.'); }
});

/* ---------- Aufzug: fährt zu jeder Zone, die man selbst schon erreicht hat. Bodenfahrzeuge fahren mit. ---------- */
function renderMine(){
  const cur=nearCab(); let h='';
  for(let k=0;k<ZN.length;k++){
    const ok=k<=hero.zn;
    h+='<button class="card place'+(k===cur?' cur':'')+(ok?'':' shut')+'" data-st="'+k+'" aria-label="'+(ok?'Fahre in '+ZN[k].n:'Noch verschlossen: '+ZN[k].n)+'"><span aria-hidden="true">'+(ok?ZN[k].e:'🔒')+'</span>'+(ok?'':'<small aria-hidden="true">'+ZN[k].e+'</small>')+'</button>';
  }
  $('mine-cards').innerHTML=h;
}
function openMine(){ if(liftBusy) return; renderMine(); $('mine').hidden=false; ST.talkLock=0; speak('Wohin soll der Aufzug fahren?'); }
function liftGo(k){
  if(liftBusy) return;
  const f=$('fade'), m=P.mode;
  if(m!=='walk'&&m!=='car'&&m!=='bagger'&&m!=='loader'&&m!=='dumper'&&m!=='tbm') setMode('walk');
  liftBusy=true; f.hidden=false; void f.offsetWidth; f.classList.add('on'); sfx('whoosh');
  setTimeout(function(){
    P.x=LIFTX; P.y=stationY(k)-2; P.vx=0; P.vy=0; P.on=false; P.chute=false; P.ang=0;
    cam.x=P.x; cam.y=P.y-80; dkA=darkAt(cam.y); scanMobile();
    f.classList.remove('on');
    setTimeout(function(){ f.hidden=true; liftBusy=false; },380);
    speak(k?'Station '+ZN[k].s+'.':'Wieder zu Hause.');
  },430);
}
$('mine-cards').addEventListener('click',function(e){
  const b=e.target.closest('[data-st]'); if(!b) return;
  const k=+b.dataset.st;
  if(k>hero.zn){ tone([170],'sawtooth'); speak('Dahin fährt der Aufzug erst, wenn du selbst einmal dort warst. '+ZN[k].need); return; }
  $('mine').hidden=true; liftGo(k);
});

/* ---------- Zeichnen ---------- */
function gearShape(x,y,r,a,col){
  ctx.save(); ctx.translate(x,y); ctx.rotate(a);
  ctx.fillStyle=INK; for(let i=0;i<8;i++){ ctx.rotate(TAU/8); ctx.fillRect(-r*.22-1.2,-r*1.34-1.2,r*.44+2.4,r*.7); } circle(0,0,r+1.4);
  ctx.fillStyle=col; for(let i=0;i<8;i++){ ctx.rotate(TAU/8); ctx.fillRect(-r*.22,-r*1.34,r*.44,r*.7); } circle(0,0,r);
  ctx.fillStyle=INK; circle(0,0,r*.4);
  ctx.restore();
}
function drawLab(){
  const x=WSX, y=ground(x);
  ctx.fillStyle=INK; rr(x-39,y-54,78,58,6);
  ctx.fillStyle='#c98b4a'; rr(x-36,y-51,72,54,4);
  ctx.fillStyle='#8a5a3c'; ctx.strokeStyle=INK; ctx.lineWidth=3; ctx.lineJoin='round';
  ctx.beginPath(); ctx.moveTo(x-48,y-50); ctx.lineTo(x,y-84); ctx.lineTo(x+48,y-50); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#4a3424'; rr(x-11,y-32,22,34,3);
  ctx.fillStyle='#ffd23f'; circle(x+6,y-14,2);
  ctx.fillStyle=INK; rr(x+15,y-41,17,17,3); ctx.fillStyle='#bfe9f5'; rr(x+17,y-39,13,13,2);
  gearShape(x,y-88,12,reduced?0:time*.8,'#9aa7b4');
  emo('🤖',x-56,y-14+(reduced?0:1.5*Math.sin(time*3)),27);
}
function drawCab(x,y,top){
  if(top){
    ctx.strokeStyle=INK; ctx.lineWidth=5; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(x-30,y+2); ctx.lineTo(x-9,y-96); ctx.moveTo(x+30,y+2); ctx.lineTo(x+9,y-96); ctx.moveTo(x-20,y-52); ctx.lineTo(x+20,y-52); ctx.stroke();
    ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x,y-96); ctx.lineTo(x,y-44); ctx.stroke();
    ctx.fillStyle=INK; circle(x,y-100,13); ctx.fillStyle='#e63946'; circle(x,y-100,10); ctx.fillStyle=INK; circle(x,y-100,3.5);
  }
  ctx.fillStyle=INK; rr(x-17,y-46,34,48,5);
  ctx.fillStyle='#ffd23f'; rr(x-14,y-43,28,42,3);
  ctx.fillStyle=INK; ctx.fillRect(x-1,y-43,2,42);
  ctx.fillStyle='#bfe9f5'; rr(x-11,y-38,8,11,2); rr(x+3,y-38,8,11,2);
  ctx.fillStyle=INK; circle(x,y-51,5.5); ctx.fillStyle=reduced||(time*2|0)%2?'#58b548':'#c9f5b8'; circle(x,y-51,3.6);
}
function drawMach(m){
  const x=m.x, y=m.y, done=!!ST.pzGot[m.id], T=PZI[m.t], b=reduced?0:2.5*Math.sin(time*3+x);
  ctx.strokeStyle=INK; ctx.lineWidth=2.5; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x,y-40); ctx.lineTo(x,y-50); ctx.stroke();
  ctx.fillStyle=done?'#58b548':((time*3|0)%2&&!reduced?'#ffd23f':'#ff5a1f'); circle(x,y-52,3.6);
  ctx.fillStyle=INK; rr(x-17,y-42,34,40,7); rr(x-13,y-4,8,6,2); rr(x+5,y-4,8,6,2);
  ctx.fillStyle=done?'#a9dba6':T.col; rr(x-14,y-39,28,34,5);
  ctx.fillStyle=INK; rr(x-11,y-35,22,19,3); ctx.fillStyle='#fff8e6'; rr(x-9.500,y-33.500,19,16,2);
  emo(T.e,x,y-25,13);
  ctx.fillStyle=INK; circle(x-6,y-10,2.2); circle(x,y-10,2.2); circle(x+6,y-10,2.2);
  if(done) emo('✅',x+13,y-40,13);
  else{ ctx.fillStyle='rgba(255,255,255,.4)'; circle(x,y-68+b,12); gearShape(x,y-68+b,7,reduced?0:time*1.5,'#ffd23f'); }
}
function drawMat(m){
  const b=reduced?0:2*Math.sin(time*3+m.x), emb=m.y>-3000&&cellAt(m.x,m.y)>=4;
  ctx.fillStyle=emb?'rgba(20,24,40,.5)':'rgba(255,255,255,.32)'; circle(m.x,m.y+b,13);
  if(emb){ ctx.strokeStyle='rgba(255,248,230,.85)'; ctx.lineWidth=1.5; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.arc(m.x,m.y+b,13,0,TAU); ctx.stroke(); ctx.setLineDash([]); }
  emo(MAT[m.k][0],m.x,m.y+b+1,emb?15:18);
}
function drawBone(d){
  if(cellAt(d.x,d.y)<4) return;
  ctx.save(); ctx.translate(d.x,d.y); ctx.scale(d.s*d.f,d.s);
  ctx.strokeStyle='rgba(250,240,214,.8)'; ctx.fillStyle='rgba(250,240,214,.8)'; ctx.lineWidth=3; ctx.lineCap='round'; ctx.lineJoin='round';
  if(d.v===0){
    ctx.beginPath(); ctx.moveTo(-26,0); ctx.lineTo(20,0);
    for(let i=0;i<5;i++){ const x=-18+i*8, h=10-Math.abs(i-2)*2; ctx.moveTo(x,-h); ctx.lineTo(x,h); }
    ctx.moveTo(-26,0); ctx.lineTo(-34,-7); ctx.moveTo(-26,0); ctx.lineTo(-34,7); ctx.stroke(); circle(26,0,6);
  }else if(d.v===1){
    ctx.beginPath(); ctx.moveTo(2,0);
    for(let a=.3;a<13;a+=.3){ const r=2+a*1.5; ctx.lineTo(r*Math.cos(a),r*Math.sin(a)); }
    ctx.stroke();
  }else{
    ctx.beginPath(); ctx.ellipse(0,0,20,12,0,0,TAU); ctx.stroke(); circle(-7,-3,3.2);
    ctx.beginPath(); ctx.moveTo(4,9); ctx.lineTo(4,14); ctx.moveTo(10,8); ctx.lineTo(10,13); ctx.moveTo(15,5); ctx.lineTo(15,10); ctx.stroke();
  }
  ctx.restore();
}
const CRYC=['#7fe3f0','#c77dff','#ff9fd0'], CRYH=[30,46,38,24];
function drawCry(d){
  ctx.save(); ctx.translate(d.x,d.y); ctx.scale(d.s,d.s);
  for(let i=0;i<4;i++){
    const h=CRYH[i];
    ctx.save(); ctx.rotate(-.6+i*.4);
    ctx.fillStyle=CRYC[(d.c+i)%3]; ctx.beginPath(); ctx.moveTo(-6,0); ctx.lineTo(-5,-h+8); ctx.lineTo(0,-h); ctx.lineTo(5,-h+8); ctx.lineTo(6,0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(-2,-4); ctx.lineTo(-2,-h+11); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
/* ---------- Leuchtmarken: Unter der Erde kann man bis zu acht Lichter setzen, um sich Stellen zu merken. Sie leuchten im Dunkeln und stehen auf der Karte. ---------- */
const MKMAX=8, MKS={};
function mkKey(){ return K_MARKS+(realm?'-'+realm:''); }
function marks(){
  const k=mkKey(); if(MKS[k]) return MKS[k];
  let a=[]; try{ a=JSON.parse(localStorage.getItem(k)||'[]'); }catch(_){}
  if(!Array.isArray(a)) a=[];
  MKS[k]=a.filter(function(m){ return Array.isArray(m)&&isFinite(m[0])&&isFinite(m[1]); }).slice(0,MKMAX);
  return MKS[k];
}
function mkSave(){ try{ localStorage.setItem(mkKey(),JSON.stringify(marks())); }catch(_){} }
function mkNear(){ const a=marks(); for(let i=0;i<a.length;i++) if(Math.abs(a[i][0]-P.x)<40&&Math.abs(a[i][1]-P.y)<50) return i; return -1; }
function mkCan(){ return P.mode==='walk'&&P.on&&P.y>ground(P.x)+60; }
let mkShown=null;
function mkTick(){
  const c=mkCan(), n=c?mkNear():-1, st=c?(n>=0?'on':'off'):'';
  if(st===mkShown) return; mkShown=st;
  const b=$('mark'); b.hidden=!c; b.classList.toggle('on',n>=0);
}
function mkTap(){
  if(!mkCan()) return;
  const a=marks(), i=mkNear();
  if(i>=0){ a.splice(i,1); mkSave(); sfx('tick'); speak('Leuchtmarke aufgehoben. Du hast noch '+(MKMAX-a.length)+'.'); }
  else if(a.length>=MKMAX){ tone([170],'sawtooth'); speak('Alle acht Leuchtmarken sind schon gesetzt. Geh zu einer hin und heb sie auf, dann kannst du sie woanders hinstellen.'); }
  else{ a.push([Math.round(P.x),Math.round(P.y)]); mkSave(); sfx('pop'); spawn(5,P.x,P.y-10,0,-80,.6,2); if(a.length===1) speak('Eine Leuchtmarke! Sie leuchtet im Dunkeln und steht auf der Karte. Du hast acht davon.'); }
  mkShown=null;
}
$('mark').addEventListener('click',function(e){ e.preventDefault(); mkTap(); });
function drawMark(x,y){
  const t=performance.now()/600, k=.75+.25*Math.sin(t+x);
  ctx.fillStyle='rgba(255,226,122,'+(.25*k).toFixed(3)+')'; circle(x,y-14,16);
  ctx.fillStyle=INK; ctx.fillRect(x-2,y-10,4,10);
  ctx.fillStyle='#ffe27a'; ctx.beginPath(); ctx.moveTo(x,y-24); ctx.lineTo(x+7,y-14); ctx.lineTo(x,y-6); ctx.lineTo(x-7,y-14); ctx.closePath(); ctx.fill();
  ctx.strokeStyle=INK; ctx.lineWidth=2; ctx.stroke();
}
function drawDeep(x0,x1,y0,y1){
  const gy=ground(WSX);
  if(WSX>x0-80&&WSX<x1+80&&gy>y0-10&&gy<y1+100) drawLab();
  if(LIFTX>x0-50&&LIFTX<x1+50) for(let k=0;k<ZN.length;k++){ const y=stationY(k); if(y>y0-10&&y<y1+120) drawCab(LIFTX,y,k===0); }
  for(const d of ZDEC) if(d.x>x0-60&&d.x<x1+60&&d.y>y0-60&&d.y<y1+60){ if(d.k==='bone') drawBone(d); else drawCry(d); }
  for(const m of MACH) if(m.y===m.y&&m.x>x0-30&&m.x<x1+30&&m.y>y0-10&&m.y<y1+90) drawMach(m);
  for(const v of VAULTS) if(v.x-v.rx>x0-40&&v.x-v.rx<x1+40&&v.fy>y0-10&&v.fy<y1+70&&doorShut(v)) drawDoor(v);
  for(const m of MATS) if(!ST.matGot[m.id]&&MATON[m.k]&&m.x>x0-20&&m.x<x1+20&&m.y>y0-20&&m.y<y1+20) drawMat(m);
  for(const m of marks()) if(m[0]>x0-30&&m[0]<x1+30&&m[1]>y0-10&&m[1]<y1+40) drawMark(m[0],m[1]);
}
/* Unter der Erde wird es dunkel. Die Lampe und alles, was leuchtet, machen helle Flecken. Ganz schwarz wird es nie. */
function darkAt(y){
  if(hero.lp>=3) return 0;
  const d=y-900;
  if(d<=0) return 0;
  return d<1700?.46*d/1700:.46+.3*Math.min(1,(d-1700)/1500);
}
function drawDark(){
  dkA+=(darkAt(cam.y)-dkA)*.08;
  if(dkA<.02) return;
  const q=4, w=Math.ceil(W/q), h=Math.ceil(H/q);
  if(dkc.width!==w||dkc.height!==h){ dkc.width=w; dkc.height=h; }
  dkx.globalCompositeOperation='source-over'; dkx.clearRect(0,0,w,h);
  dkx.fillStyle='rgba(6,8,22,'+dkA.toFixed(3)+')'; dkx.fillRect(0,0,w,h);
  dkx.globalCompositeOperation='destination-out';
  const hole=function(wx,wy,r,k){
    const sx=((wx-cam.x)*S+W/2)/q, sy=((wy-cam.y)*S+H/2)/q, rd=r*S/q;
    if(sx<-rd||sx>w+rd||sy<-rd||sy>h+rd) return;
    const g=dkx.createRadialGradient(sx,sy,rd*.3,sx,sy,rd);
    g.addColorStop(0,'rgba(0,0,0,'+k+')'); g.addColorStop(1,'rgba(0,0,0,0)');
    dkx.fillStyle=g; dkx.fillRect(sx-rd,sy-rd,2*rd,2*rd);
  };
  hole(P.x,P.y-20,[135,195,275,400][hero.lp|0]+JAR.length*32,1);
  const vw=W/S+200, vh=H/S+200;
  for(const m of MATS) if(!ST.matGot[m.id]&&MATON[m.k]&&Math.abs(m.x-cam.x)<vw&&Math.abs(m.y-cam.y)<vh) hole(m.x,m.y,46,.75);
  for(const m of MACH) if(m.y===m.y&&Math.abs(m.x-cam.x)<vw&&Math.abs(m.y-cam.y)<vh) hole(m.x,m.y-30,90,.9);
  for(const v of VAULTS) if(Math.abs(v.x-cam.x)<vw&&Math.abs(v.y-cam.y)<vh) hole(v.x-v.rx-8,v.fy-28,70,.85);
  for(const m of marks()) if(Math.abs(m[0]-cam.x)<vw&&Math.abs(m[1]-cam.y)<vh) hole(m[0],m[1]-14,150,.9);
  for(const p of ST.PADS) if(p.y>900&&Math.abs(p.x-cam.x)<vw&&Math.abs(p.y-cam.y)<vh) hole(p.x,p.y,80,.8);
  for(const d of ZDEC) if(d.k==='cry'&&Math.abs(d.x-cam.x)<vw&&Math.abs(d.y-cam.y)<vh) hole(d.x,d.y-20,100,.8);
  if(Math.abs(LIFTX-cam.x)<vw) for(let k=1;k<ZN.length;k++) if(Math.abs(ZN[k].y-cam.y)<vh) hole(LIFTX,ZN[k].y-30,150,.95);
  ctx.save(); ctx.setTransform(DPR,0,0,DPR,0,0); ctx.imageSmoothingEnabled=true;
  ctx.drawImage(dkc,0,0,w,h,0,0,W,H);
  ctx.restore();
}
/* Der ferne Weltraum: Felsbrocken, Station, Planeten, Sternentor und die Grenze, bis zu der die Rakete kommt. */
function drawFar(){
  const vw=W/S, vh=H/S;
  for(const o of ORBS){
    if(!o.z||Math.abs(o.x-cam.x)>vw/2+o.r+180||Math.abs(o.y-cam.y)>vh/2+o.r+180) continue;
    const x=o.x, y=o.y, r=o.r;
    if(o.z==='ast'){
      ctx.fillStyle='#8d8378'; circle(x,y,r);
      ctx.fillStyle='#6f665e'; circle(x-r*.3,y-r*.2,r*.24); circle(x+r*.36,y+r*.16,r*.18); circle(x+((o.s%7)-3)*r*.08,y+r*.5,r*.14);
      ctx.fillStyle='rgba(255,255,255,.14)'; ctx.beginPath(); ctx.arc(x,y,r,-2.7,-.5); ctx.closePath(); ctx.fill();
    }else if(o.z==='stn'){
      ctx.fillStyle=INK; ctx.fillRect(x-r-78,y-3,r*2+156,6);
      for(const sx of [x-r-74,x+r+10]){ ctx.fillStyle=INK; ctx.fillRect(sx-3,y-27,70,54); ctx.fillStyle='#3aa0e8'; ctx.fillRect(sx,y-24,64,48); ctx.strokeStyle='#9bd8ff'; ctx.lineWidth=1.5; ctx.beginPath(); for(let i=1;i<4;i++){ ctx.moveTo(sx+i*16,y-24); ctx.lineTo(sx+i*16,y+24); } ctx.moveTo(sx,y); ctx.lineTo(sx+64,y); ctx.stroke(); }
      ctx.fillStyle='#cfd3dc'; circle(x,y,r);
      ctx.fillStyle='#aab3c2'; ctx.beginPath(); ctx.ellipse(x,y+12,r*.97,r*.3,0,0,TAU); ctx.fill();
      for(let i=-1;i<=1;i++){ ctx.fillStyle=INK; circle(x+i*38,y-18,12); ctx.fillStyle='#bfe9f5'; circle(x+i*38,y-18,9); }
    }else if(o.z==='ice'){
      ctx.strokeStyle='rgba(255,255,255,.45)'; ctx.lineWidth=12; ctx.beginPath(); ctx.ellipse(x,y+r*.25,r*1.36,r*.24,-.12,Math.PI,TAU); ctx.stroke();
      ctx.fillStyle='#bfe6f7'; circle(x,y,r);
      ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(x,y,r,-2.5,-.64); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#9fd0ea'; circle(x-r*.4,y+r*.1,r*.16); circle(x+r*.3,y+r*.4,r*.22); circle(x+r*.5,y-r*.1,r*.1);
      ctx.strokeStyle='rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(x,y+r*.25,r*1.36,r*.24,-.12,0,Math.PI); ctx.stroke();
    }else if(o.z==='jun'){
      ctx.fillStyle='#4fb36a'; circle(x,y,r);
      ctx.fillStyle='#8a5fd6'; circle(x-r*.35,y-r*.25,r*.2); circle(x+r*.3,y+r*.05,r*.26); circle(x-r*.1,y+r*.5,r*.16);
      ctx.fillStyle='#ffd23f'; circle(x+r*.45,y-r*.45,r*.1); circle(x-r*.55,y+r*.2,r*.08);
    }else{
      ctx.fillStyle='#ffd98a'; circle(x,y,r);
      ctx.fillStyle='#ffb86b'; ctx.beginPath(); ctx.ellipse(x,y+r*.1,r*.96,r*.2,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(x,y+r*.55,r*.8,r*.12,0,0,TAU); ctx.fill();
      const ty=y-r+4; ctx.lineWidth=8; ctx.lineCap='butt';
      for(let k=0;k<6;k++){ ctx.strokeStyle=RBC[(k+(reduced?0:Math.floor(time*5)))%6]; ctx.beginPath(); ctx.arc(x,ty,84-k*8,Math.PI,TAU); ctx.stroke(); }
      emo('🌟',x,ty-22+(reduced?0:3*Math.sin(time*3)),34);
    }
  }
  if(hero.rk<3){
    const ly=skyLim()-30;
    if(Math.abs(ly-cam.y)<vh/2+60){
      ctx.strokeStyle='rgba(255,248,230,.55)'; ctx.lineWidth=3; ctx.setLineDash([14,12]); ctx.beginPath(); ctx.moveTo(cam.x-vw/2-20,ly); ctx.lineTo(cam.x+vw/2+20,ly); ctx.stroke(); ctx.setLineDash([]);
      emo('🔒',cam.x-17,ly-22,20); emo('🚀',cam.x+12,ly-22,20);
    }
  }
}
function drawNebula(){
  const a=clamp((-cam.y-5200)/1500,0,1);
  const band=cam.y>-12000?0:cam.y>-22000?1:2, cols=[['255,150,80','170,120,100'],['80,200,220','150,90,230'],['255,120,200','255,210,90']][band];
  for(let i=0;i<3;i++){
    const x=(((i*.37+.2)*W-cam.x*.02)%W+W)%W, y=(((i*.29+.3)*H-cam.y*.02)%H+H)%H, r=(150+i*70)*S;
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,'rgba('+cols[i%2]+','+(.2*a).toFixed(3)+')'); g.addColorStop(1,'rgba('+cols[i%2]+',0)');
    ctx.fillStyle=g; ctx.fillRect(x-r,y-r,2*r,2*r);
  }
}

/* ---------- Rätselmaschinen: sieben Arten von Denkaufgaben. Jede Art hat zehn Stufen und wird schwerer, wenn ein Rätsel ohne Fehler und ohne Tipp gelingt.
   Muster fortsetzen, Spiegelbild malen, Roboter programmieren, Waage ausgleichen, Reihenfolge merken, Rohre verbinden, Bilder-Sudoku.
   Falsche Versuche kosten nichts. Der Roboter behält sein Programm, damit man den Fehler suchen kann. ---------- */
const PCOL=['#e63946','#3aa0e8','#ffd23f','#58b548','#9b5de5','#ff8a1f'];
const PSHP=['<circle cx="12" cy="12" r="8.5"','<rect x="4" y="4" width="16" height="16" rx="2.5"','<path d="M12 3.5l9 16H3z"','<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"','<path d="M12 2.5l8.5 9.5-8.5 9.5L3.500 12z"'];
function tok(s,c){ return '<svg class="tok" viewBox="0 0 24 24" aria-hidden="true">'+PSHP[s]+' fill="'+PCOL[c]+'" stroke="#1d2a3a" stroke-width="2" stroke-linejoin="round"/></svg>'; }
const PZT=[
  {id:'muster',e:'🎨',n:'Muster',col:'#ffb3d1',make:mkMuster,draw:drMuster,act:acMuster,hint:hiMuster,say:syMuster},
  {id:'spiegel',e:'🦋',n:'Spiegelbild',col:'#9bd8ff',make:mkSpiegel,draw:drSpiegel,act:acSpiegel,hint:hiSpiegel,say:sySpiegel},
  {id:'robo',e:'🤖',n:'Roboter',col:'#c9d2dc',make:mkRobo,draw:drRobo,act:acRobo,hint:hiRobo,say:syRobo},
  {id:'waage',e:'⚖️',n:'Waage',col:'#ffd38a',make:mkWaage,draw:drWaage,act:acWaage,hint:hiWaage,say:syWaage,post:poWaage},
  {id:'echo',e:'🎵',n:'Kristall-Echo',col:'#c9a6ff',make:mkEcho,draw:drEcho,act:acEcho,hint:hiEcho,say:syEcho,start:stEcho},
  {id:'rohre',e:'💧',n:'Rohre',col:'#8fd8ff',make:mkRohre,draw:drRohre,act:acRohre,hint:hiRohre,say:syRohre},
  {id:'sudoku',e:'🔢',n:'Bilder-Sudoku',col:'#b9e89a',make:mkSudoku,draw:drSudoku,act:acSudoku,hint:hiSudoku,say:sySudoku},
  {id:'stern',e:'✨',n:'Sternbild',col:'#a8b8ff',make:mkStern,draw:drStern,act:acStern,hint:hiStern,say:syStern}
];
const PZI={}; for(const p of PZT) PZI[p.id]=p;
/* Arten, die das Kind antrifft: Kristall-Echo und Bilder-Sudoku sind eingefroren und kommen weder in der Welt noch am Akku noch in der Werkstatt vor (Vereinfachungsplan Schritt 1). In der Elternansicht bleiben sie wegen alter Protokolle. */
const PZON=PZT.filter(function(p){ return p.id!=='echo'&&p.id!=='sudoku'; });
let pzc=null, pzTm=[];
function pzLater(ms,fn){ const c=pzc; pzTm.push(setTimeout(function(){ if(pzc===c&&c) fn(); },ms)); }
function pzClear(){ for(const t of pzTm) clearTimeout(t); pzTm=[]; }
function pzCell(c,r,ctl){
  const land=H<=480, aw=land?(ctl?Math.min(W*.5,380):Math.min(W-90,560)):Math.min(W-64,480), ah=land?H-124:H-(ctl?340:215);
  return Math.max(20,Math.min(56,Math.floor(aw/c)-4,Math.floor(ah/r)-4));
}
function pzOpen(m){
  const T=PZI[m.t], lv=clamp((hero.pz[m.t]|0)+(m.zb|0),0,9);
  keys.l=keys.r=keys.u=keys.d=keys.a=false; ST.talkLock=0;
  pzc={m:m,T:T,lv:lv,fails:0,hint:0,won:false,busy:false,st:null}; LOG.pStart(pzc);
  $('pz-ic').textContent=T.e;
  let h=''; for(let i=0;i<10;i++) h+='<i'+(i<=lv?' class="on"':'')+'></i>';
  $('pz-lv').innerHTML=h;
  $('pz-sheet').setAttribute('aria-label','Rätselmaschine: '+T.n+', Stufe '+(lv+1)+' von 10');
  $('pz-body').classList.remove('win');
  pzc.st=T.make(lv);
  $('pz').hidden=false;
  pzDraw(); pzHintUi(); speak(T.say(pzc.st));
  if(T.start) T.start(pzc.st);
}
function pzDraw(){
  const c=pzc, o=c.T.draw(c.st);
  $('pz-body').innerHTML=o[0]; $('pz-ctl').innerHTML=o[1]||'';
  $('pz-sheet').classList.toggle('noctl',!o[1]);
  if(c.T.post) c.T.post(c.st);
}
function pzClose(){
  if($('pz').hidden) return;
  const c=pzc;
  LOG.pQuit(c);
  pzClear(); $('pz').hidden=true; pzc=null;
  speakStop();
  /* Wer nach vielen Fehlversuchen aufgibt, bekommt beim nächsten Mal ein leichteres Rätsel dieser Art. */
  if(c&&!c.won&&c.fails>=3){ hero.pz[c.T.id]=Math.max(0,(hero.pz[c.T.id]|0)-1); saveHero(); }
  /* Vom Akku aus geöffnet: wie beim Schließen der Lernaufgabe. Ist schon etwas geladen, geht es mit dem weiter, wofür der Akku gebraucht wurde. Sonst bliebe der Auftrag liegen und käme viel später aus dem Nichts. */
  if(c&&c.m.quiz&&!c.won){ const f=pending; pending=null; if(ST.energy>0){ if(f) f(); } else{ setTool(null,true); if(P.mode!=='walk') setMode('walk'); pulse('batt'); } }
}
/* Tipps: erst nach dem ersten Fehlversuch, einer pro Rätsel (ab Stufe 7 zwei). So hilft der Tipp beim Hängenbleiben, löst aber nicht das Rätsel. */
function pzHintMax(c){ return c.lv>=6?2:1; }
function pzHintUi(){ const c=pzc; if(c) $('pz-hint').classList.toggle('off',c.fails<1||c.hint>=pzHintMax(c)); }
function pzFail(quiet){
  const c=pzc; c.fails++;
  if(!quiet) tone([170],'sawtooth');
  if(c.fails===3&&c.hint<pzHintMax(c)) pulse('pz-hint');
  pzHintUi();
}
/* Falsche Antwort bei Auswahl-Rätseln: Lösung kurz zeigen, dann ein neues Rätsel gleicher Stufe. Durchprobieren der übrigen Antworten geht so nicht. */
function pzReveal(text){
  const c=pzc; c.busy=true; speak(text);
  pzLater(2200,function(){ c.busy=false; c.st=c.T.make(c.lv); pzDraw(); speak(c.T.say(c.st)); });
}
function pzWin(){
  const c=pzc; if(!c||c.won) return;
  c.won=true; c.busy=true; pzClear(); LOG.pWin(c);
  const id=c.T.id, first=!c.m.quiz&&!ST.pzGot[c.m.id], clean=c.fails<=1&&!c.hint;
  tone([523,659,784,1047]);
  if(clean) hero.pz[id]=Math.min(9,(hero.pz[id]|0)+1);
  else if(c.fails>=5||c.hint>=2) hero.pz[id]=Math.max(0,(hero.pz[id]|0)-1);
  hero.pzn=(hero.pzn|0)+1; dayAdd('pz');
  /* Akku: voll nur ohne Fehler und Tipp, sonst ein Strich weniger je Fehler und Tipp, mindestens einer. */
  const segs=clean?5:Math.max(1,5-c.fails-c.hint), full=segs>=5||ST.energy>=MAXE;
  ST.lootDirty=true; ST.energy=Math.max(ST.energy,segs*SEG); battShown=-1; renderBatt(); qEvent('pz',1);
  if(first){ ST.pzGot[c.m.id]=1; hero.mat.zr=(hero.mat.zr|0)+1; hero.mk.zr=1; }
  saveHero();
  $('pz-body').classList.add('win');
  banner(first?'⚙️ +1':'⭐',2000);
  setTimeout(function(){
    if(pzc!==c) return;
    $('pz').hidden=true; pzc=null; confetti(P.x,P.y); jingle();
    if(c.m.door){ labBadge(true); doorOpen(c.m.door); return; }
    if(first) say('',hero.pzn===1?'Geschafft! Die Maschine läuft wieder und schenkt dir ein Zahnrad. Der Akku ist auch wieder geladen. Zahnräder braucht Professor Zahnrad in der Werkstatt.':clean?'Geschafft, ganz ohne Fehler! Noch ein Zahnrad. Das nächste Rätsel dieser Art wird kniffliger.':'Geschafft! Noch ein Zahnrad.');
    else if(clean) say('',c.m.quiz?'Ohne Fehler! Der Akku ist voll. Das nächste Rätsel dieser Art wird kniffliger.':'Ohne Fehler! Das nächste Rätsel dieser Art wird kniffliger.');
    else if(c.m.quiz) say('',full?'Geschafft! Der Akku ist wieder voll.':'Geschafft! Der Akku ist ein Stück geladen. Ohne Fehler und Tipp wird er ganz voll.');
    labBadge(true);
    if(c.m.quiz){ const f=pending; pending=null; if(f) f(); }
  },1500);
}
$('pz').addEventListener('click',function(e){
  if(e.target===$('pz')||e.target.closest('.xb')){ pzClose(); return; }
  if(!pzc) return;
  if(e.target.closest('#pz-say')){ speak(pzc.T.say(pzc.st)); return; }
  if(pzc.busy) return;
  if(e.target.closest('#pz-hint')){
    if(pzc.hint>=pzHintMax(pzc)){ speak('Den Tipp hast du schon bekommen. Du schaffst den Rest!'); return; }
    if(pzc.fails<1){ speak('Probier es erst einmal selbst. Wenn es nicht klappt, gibt es einen Tipp.'); return; }
    LOG.pHint(pzc); pzc.hint++; pzHintUi(); pzc.T.hint(pzc.st); return;
  }
  const b=e.target.closest('[data-a]');
  if(b&&!b.disabled) pzc.T.act(pzc.st,b.dataset.a,b);
});

/* Am Akku: ein Rätsel statt fünf Lernaufgaben. Die Arten wechseln der Reihe nach, damit keine ausgelassen wird. */
$('quiz-pz').addEventListener('click',function(){
  LOG.qSwitch();
  $('quiz').hidden=true; ST.paused=false;
  pzOpen({id:'quiz',t:PZON[(hero.pzn|0)%PZON.length].id,zb:0,quiz:true});
});

/* ---------- 1. Muster: Welches Bild fehlt in der Reihe? ---------- */
function tkHtml(t){ return t.n!==undefined?'<span class="pzn">'+t.n+'</span>':tok(t.s,t.c); }
function mkMuster(lv){ return mkMusterWith(Math.random,lv); }
function drMuster(st){
  let h='<div class="pzrow">';
  st.seq.forEach(function(t,i){ h+=i===st.hole?'<span class="pzhole" id="pz-hole">?</span>':'<span class="pzt">'+tkHtml(t)+'</span>'; });
  h+='</div>';
  let c='<div class="pzopts">';
  st.opts.forEach(function(t,i){ c+='<button class="pzb" data-a="'+i+'" aria-label="Antwort '+(i+1)+'">'+tkHtml(t)+'</button>'; });
  return [h,c+'</div>'];
}
function acMuster(st,a,b){
  const t=st.opts[+a];
  if(tkKey(t)===st.ans){ b.classList.add('ok'); const h=$('pz-hole'); h.innerHTML=tkHtml(t); h.style.border='0'; pzWin(); }
  else{
    b.classList.add('no'); pzFail();
    for(const o of $('pz-ctl').querySelectorAll('[data-a]')){ o.disabled=true; if(tkKey(st.opts[+o.dataset.a])===st.ans) o.classList.add('ok'); }
    const h=$('pz-hole'), t=st.seq[st.hole]; h.innerHTML=tkHtml(t); h.style.borderColor='#58b548';
    pzReveal('Schau, das hier gehört in die Lücke. Jetzt kommt eine neue Reihe.');
  }
}
function hiMuster(st){
  /* Zeigt den Teil, der sich wiederholt, statt eine Antwort wegzustreichen. */
  if(st.u){ const ts=$('pz-body').querySelectorAll('.pzrow>span'); for(let i=0;i<st.u&&i<ts.length;i++) if(i!==st.hole) ts[i].classList.add('flash'); }
  speak(st.k==='cnt'?'Zähle von einer Zahl zur nächsten. Wie viel kommt jedes Mal dazu oder geht weg?':st.k==='two'?'Schau erst nur auf die Form. Dann schau nur auf die Farbe.':'Sprich die Reihe laut mit. Was wiederholt sich immer wieder?');
}
function syMuster(st){ return st.k==='cnt'?'Welche Zahl fehlt? Schau, wie die Zahlen größer oder kleiner werden.':st.k==='two'?'Welches Bild fehlt? Achte auf die Form und auf die Farbe.':'Welches Bild fehlt in der Reihe? Schau, was sich wiederholt.'; }

/* ---------- Sternbild: Sterne mit Zahlen der Reihe nach verbinden, bis ein Bild entsteht. Zählt bis 10 oder bis 20, je nach Schulstand, später in Zweierschritten. ---------- */
function mkStern(lv){ return mkSternWith(Math.random,FS,lv); }
function stSide(){ const land=H<=480; return Math.max(220,Math.min(land?H-130:W-56,land?420:H-300,440)); }
function drStern(st){
  const w=stSide(), m=26, sc=w-2*m;
  let h='<div class="pzsky" id="pz-sky" style="width:'+w+'px;height:'+w+'px"><svg viewBox="0 0 '+w+' '+w+'" aria-hidden="true"><polyline id="pz-line" fill="none" stroke="#9bd8ff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" points=""/></svg>';
  st.pts.forEach(function(p,i){ h+='<button class="pzdot" data-a="'+i+'" style="left:'+(m+p[0]*sc).toFixed(1)+'px;top:'+(m+p[1]*sc).toFixed(1)+'px" aria-label="Stern '+p[2]+'">'+p[2]+'</button>'; });
  return [h+'</div>'];
}
function stLine(st,close){
  const w=stSide(), m=26, sc=w-2*m, L=st.pts.slice(0,st.k);
  if(close) L.push(st.pts[0]);
  const el=$('pz-line'); if(el) el.setAttribute('points',L.map(function(p){ return (m+p[0]*sc).toFixed(1)+','+(m+p[1]*sc).toFixed(1); }).join(' '));
}
function acStern(st,a,b){
  const i=+a;
  if(i<st.k) return;
  if(i===st.k){
    st.k++; b.classList.remove('no'); b.classList.add('done'); stLine(st,false);
    const f=330+st.k*30; blip(f,f*1.2,.12,'triangle',.06);
    if(st.k===st.pts.length){
      stLine(st,true);
      $('pz-sky').insertAdjacentHTML('beforeend','<div class="pzshape" aria-hidden="true">'+st.sh.e+'</div>');
      speak('Das ist '+st.sh.n+'!'); pzWin();
    }
    return;
  }
  /* Falsch: Der richtige Stern blinkt und es wird gesagt, welche Zahl kommt. Das Bild bleibt, wie es ist. */
  b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); pzFail();
  const nx=$('pz-sky').querySelector('[data-a="'+st.k+'"]'); if(nx){ nx.classList.remove('flash'); void nx.offsetWidth; nx.classList.add('flash'); }
  const want=st.pts[st.k][2];
  speak(st.k?'Nach '+st.pts[st.k-1][2]+' kommt '+want+'.':'Fang bei '+want+' an.');
}
function hiStern(st){
  const nx=$('pz-sky').querySelector('[data-a="'+st.k+'"]'); if(nx){ nx.classList.remove('flash'); void nx.offsetWidth; nx.classList.add('flash'); }
  speak(st.two?'Immer zwei weiter: 2, 4, 6 und so fort.':'Zähl laut mit. Welche Zahl kommt als Nächstes?');
}
function syStern(st){ return 'Verbinde die Sterne der Reihe nach. Fang bei '+st.pts[0][2]+' an'+(st.two?' und zähl immer zwei weiter.':'.'); }

/* ---------- 2. Spiegelbild: Die andere Seite so ausmalen, als stünde in der Mitte ein Spiegel. ---------- */
function mkSpiegel(lv){ return mkSpiegelWith(Math.random,lv); }
function spWant(st,i){ const c=i%st.w, r=(i-c)/st.w; return st.ax?st.a[(st.h-1-r)*st.w+c]:st.a[r*st.w+(st.w-1-c)]; }
function spGrid(st,arr,act){
  let h='<div class="pzg" style="grid-template-columns:repeat('+st.w+',var(--cs))">';
  for(let i=0;i<arr.length;i++) h+=act?'<button class="pzc sp'+arr[i]+'" data-a="'+i+'" aria-label="Feld '+(i+1)+'"></button>':'<span class="pzc fix sp'+arr[i]+'"></span>';
  return h+'</div>';
}
function drSpiegel(st){
  const cs=st.ax?pzCell(st.w,st.h*2+.6,false):pzCell(st.w*2+.6,st.h,false);
  return ['<div class="pzmir'+(st.ax?' hz':'')+'" style="--cs:'+cs+'px">'+spGrid(st,st.a,false)+'<i class="mline"></i>'+spGrid(st,st.b,true)+'</div>',''];
}
function spDone(st){ for(let i=0;i<st.b.length;i++) if(st.b[i]!==spWant(st,i)) return false; return true; }
function acSpiegel(st,a,b){
  const i=+a, want=spWant(st,i), old=st.b[i];
  st.b[i]=(old+1)%(st.nc+1);
  b.className='pzc sp'+st.b[i]; sfx('tick');
  if(st.b[i]!==want&&(old===want||want===0)) pzFail(true);
  if(spDone(st)) pzWin();
}
function hiSpiegel(st){
  const bad=idxs(st.b.length).filter(function(i){ return st.b[i]!==spWant(st,i); });
  if(bad.length){
    const i=bad[ri(0,bad.length-1)]; st.b[i]=spWant(st,i);
    const b=$('pz-body').querySelector('[data-a="'+i+'"]'); b.className='pzc flash sp'+st.b[i];
  }
  speak(st.ax?'Stell dir vor, auf der roten Linie liegt ein Spiegel. Was oben nah an der Linie ist, ist unten auch nah an der Linie.':'Stell dir vor, auf der roten Linie steht ein Spiegel. Was links nah an der Linie ist, ist rechts auch nah an der Linie.');
  if(spDone(st)) pzWin();
}
function sySpiegel(st){ return (st.ax?'Male unten das Spiegelbild von oben.':'Male rechts das Spiegelbild von links.')+' Tippe auf die leeren Felder.'+(st.nc>1?' Tippe mehrmals, dann wechselt die Farbe.':''); }

/* ---------- 3. Roboter: eine Folge von Pfeilen planen, dann läuft der Roboter sie ab. ---------- */
const ARW=['➡️','⬇️','⬅️','⬆️'];
function mkRobo(lv){ return mkRoboWith(Math.random,lv); }
function drRobo(st){
  const cs=pzCell(st.w,st.h+1.3,true);
  let h='<div class="pzg" style="--cs:'+cs+'px;grid-template-columns:repeat('+st.w+',var(--cs))">';
  for(let i=0;i<st.w*st.h;i++){
    const wl=st.wall.has(i), lv=st.lava.has(i), gi=st.gems.indexOf(i);
    let c='';
    if(i===st.pos) c='🤖'; else if(i===st.g) c='🏁'; else if(gi>=0&&!((st.got>>gi)&1)) c='💎'; else if(lv) c='🔥';
    h+='<span class="pzc fix'+(wl?' wall':lv?' lava':'')+(i===st.pos?' me':'')+'">'+c+'</span>';
  }
  h+='</div><div class="prog" aria-label="Dein Programm">';
  for(let i=0;i<st.max;i++){ const q=st.prog[i]; h+='<span class="slot'+(q?' on':'')+(i===st.bad?' bad':'')+(i===st.cur?' cur':'')+'">'+(q?ARW[q.d]+(q.n>1?'<b>'+q.n+'</b>':''):'')+'</span>'; }
  h+='</div>';
  const ctl='<div class="rbctl"><span class="dpad"><button class="pzb sm u" data-a="3" aria-label="Nach oben">⬆️</button><button class="pzb sm l" data-a="2" aria-label="Nach links">⬅️</button><button class="pzb sm d" data-a="1" aria-label="Nach unten">⬇️</button><button class="pzb sm r" data-a="0" aria-label="Nach rechts">➡️</button></span>'+
    '<span class="rbside"><button class="pzb sm go" data-a="run" aria-label="Los">▶</button><button class="pzb sm" data-a="del" aria-label="Letzten Pfeil löschen">↩️</button></span></div>';
  return [h,ctl];
}
function acRobo(st,a){
  if(a==='run'){ rbRun(st); return; }
  st.bad=-1;
  const l=st.prog[st.prog.length-1];
  if(a==='del'){ if(l){ if(l.n>1) l.n--; else st.prog.pop(); } }
  else{
    const d=+a;
    if(l&&l.d===d&&l.n<9) l.n++;
    else if(st.prog.length<st.max) st.prog.push({d:d,n:1});
    else{ tone([170],'sawtooth'); speak('Mehr Pfeile passen nicht hinein. Findest du einen Weg mit weniger Kurven?'); return; }
  }
  sfx('tick'); pzDraw();
}
function rbRun(st){
  if(!st.prog.length){ speak('Tippe erst auf die Pfeile. Dann auf Los.'); return; }
  const c=pzc, steps=[], all=(1<<st.gems.length)-1;
  st.prog.forEach(function(q,i){ for(let k=0;k<q.n;k++) steps.push([q.d,i]); });
  c.busy=true; st.pos=st.s; st.got=0; st.bad=-1; st.cur=-1;
  let i=0;
  const fail=function(slot,why){
    st.bad=slot; st.cur=-1; pzDraw(); pzFail(); if(why) speak(why);
    pzLater(1000,function(){ st.pos=st.s; st.got=0; c.busy=false; pzDraw(); });
  };
  const next=function(){
    if(i>=steps.length){ fail(st.prog.length-1,st.pos===st.g?'Erst alle Edelsteine einsammeln, dann zur Fahne.':'Der Roboter ist noch nicht bei der Fahne. Was fehlt noch?'); return; }
    const d=steps[i][0], x=st.pos%st.w, y=(st.pos-x)/st.w, nx=x+RBD[d][0], ny=y+RBD[d][1], np=ny*st.w+nx;
    st.cur=steps[i][1];
    if(nx<0||ny<0||nx>=st.w||ny>=st.h||st.wall.has(np)){ sfx('splat'); fail(steps[i][1],'Rums! Da geht es nicht weiter. Schau, welcher Pfeil rot ist.'); return; }
    st.pos=np;
    const gi=st.gems.indexOf(np);
    if(gi>=0&&!((st.got>>gi)&1)){ st.got|=1<<gi; sfx('coin'); } else sfx('tick');
    if(st.lava.has(np)){ fail(steps[i][1],'Heiß! Der Roboter darf nicht ins Feuer.'); return; }
    if(np===st.g&&st.got===all){ st.cur=-1; pzDraw(); c.busy=false; pzWin(); return; }
    i++; pzDraw(); pzLater(300,next);
  };
  pzDraw(); pzLater(260,next);
}
function hiRobo(st){
  const n=Math.max(1,Math.min(Math.floor(st.sol.length/2),pzc.hint));
  st.prog=st.sol.slice(0,n).map(function(q){ return {d:q.d,n:q.n}; }); st.bad=-1; st.pos=st.s; st.got=0;
  pzDraw(); speak('Ich zeige dir den Anfang. Fahr den Weg mit dem Finger nach. Wie geht es weiter?');
}
function syRobo(st){
  return 'Bring den Roboter zur Fahne. Tippe die Pfeile in der richtigen Reihenfolge, dann auf Los.'+(st.gems.length?' Sammle unterwegs '+(st.gems.length>1?'alle Edelsteine':'den Edelstein')+' ein.':'')+(st.lava.size?' Pass auf das Feuer auf.':'')+(st.max<st.sol.length+3?' Du hast nur wenige Felder. Gleiche Pfeile hintereinander brauchen nur ein Feld.':'');
}

/* ---------- 4. Waage: beide Seiten gleich schwer machen oder herausfinden, wie schwer das Geschenk ist. ---------- */
function mkWaage(lv){ return mkWaageWith(Math.random,SCH,lv); }
function wgDiff(st){ let d=0; for(const v of st.L) d+=v<0?st.box:v; for(const q of st.R) d-=q.w<0?st.box:q.w; return d; }
function wgW(w,cls,attr){ return w<0?'<span class="wt box" aria-label="Geschenk">🎁</span>':'<'+(attr?'button':'span')+' class="wt'+(w>=10?' w10':'')+(cls||'')+'"'+(attr||'')+'>'+w+'</'+(attr?'button':'span')+'>'; }
function drWaage(st){
  let h='<div class="wg"><div class="beam" id="pz-beam" style="transform:rotate('+st.ang+'deg)"><div class="pan l">';
  for(const v of st.L) h+=wgW(v,' fixw');
  h+='</div><div class="pan r">';
  st.R.forEach(function(q,i){ h+=q.fix?wgW(q.w,' fixw'):wgW(q.w,'',' data-a="r'+i+'" aria-label="Gewicht '+q.w+' wieder herunternehmen"'); });
  h+='</div></div><i class="post"></i></div>';
  let c='<div class="pzopts">';
  if(st.box) for(const v of st.opts) c+='<button class="pzb" data-a="o'+v+'">'+v+'</button>';
  else if(st.items) st.items.forEach(function(q,i){ c+='<button class="pzb sm'+(q.used?' no':'')+'" data-a="p'+i+'"'+(q.used?' disabled':'')+' aria-label="Gewicht '+q.w+' auflegen">'+q.w+'</button>'; });
  else st.pal.forEach(function(w,i){ c+='<button class="pzb" data-a="p'+i+'" aria-label="Gewicht '+w+' auflegen">'+w+'</button>'; });
  return [h,c+'</div>'];
}
/* Der Balken kippt erst nach dem Zeichnen, damit man die Bewegung sieht. */
function poWaage(st){
  const a=clamp(-wgDiff(st)*2.2,-11,11);
  if(a===st.ang) return;
  st.ang=a;
  requestAnimationFrame(function(){ const b=$('pz-beam'); if(b) b.style.transform='rotate('+a+'deg)'; });
}
function acWaage(st,a,b){
  const k=a.charAt(0), i=+a.slice(1);
  if(k==='o'){
    if(i===st.box){ b.classList.add('ok'); pzWin(); return; }
    b.classList.add('no'); pzFail();
    for(const o of $('pz-ctl').querySelectorAll('[data-a^="o"]')){ o.disabled=true; if(o.dataset.a==='o'+st.box) o.classList.add('ok'); }
    pzReveal('Das Geschenk wiegt '+st.box+'. Jetzt kommt eine neue Waage.');
    return;
  }
  if(k==='p'){
    if(st.R.length>=14) return;
    if(st.items){ if(st.items[i].used) return; st.items[i].used=true; st.R.push({w:st.items[i].w,i:i}); }
    else st.R.push({w:st.pal[i],i:-1});
  }else{
    const q=st.R[i]; if(!q||q.fix) return;
    st.R.splice(i,1); if(q.i>=0) st.items[q.i].used=false;
  }
  sfx('tick');
  const d=wgDiff(st);
  if(d<0&&!st.over){ st.over=true; pzFail(true); } else if(d>=0) st.over=false;
  pzDraw();
  if(d===0){ pzc.busy=true; pzLater(650,function(){ pzc.busy=false; pzWin(); }); }
}
function hiWaage(st){
  const d=wgDiff(st);
  if(st.box) speak('Nimm in Gedanken auf beiden Seiten gleich viel weg. Was bleibt dann für das Geschenk übrig?');
  else if(d>=10&&st.pal&&st.pal.indexOf(10)>=0) speak('Links ist es mehr als 10. Lege erst die 10 auf, dann den Rest.');
  else if(d>0) speak('Zähle erst links alles zusammen, dann rechts. Wie viel fehlt rechts noch?');
  else speak('Rechts ist es zu schwer. Zähle beide Seiten zusammen. Tippe rechts ein Gewicht an, dann kommt es wieder herunter.');
}
function syWaage(st){
  if(st.box) return 'Die Waage steht gerade. Wie schwer ist das Geschenk?'+(st.L.filter(function(v){ return v<0; }).length>1?' Alle Geschenke sind gleich schwer.':'');
  return 'Lege rechts Gewichte auf, bis die Waage gerade steht.'+(st.items?' Jedes Gewicht gibt es nur einmal.':'');
}

/* ---------- 5. Kristall-Echo: Reihenfolge merken und nachtippen, auf hohen Stufen auch rückwärts. ---------- */
const ECF=[262,330,392,523,659,784];
function mkEcho(lv){ return mkEchoWith(Math.random,lv); }
function drEcho(st){
  let h='<div class="ec ec'+st.n+'">';
  for(let i=0;i<st.n;i++) h+='<button class="padb'+(st.lit===i?' lit':'')+'" style="--c:'+PCOL[i]+'" data-a="'+i+'" aria-label="Kristall '+(i+1)+'"></button>';
  h+='</div>';
  let c='<div class="ecst"><span aria-hidden="true">'+(st.ph==='in'?(st.rev?'⏪':'👉'):'👀')+'</span><span class="ecd">';
  for(let i=0;i<st.seq.length;i++) c+='<i'+(i<st.pos?' class="on"':'')+'></i>';
  c+='</span><button class="pzb sm" data-a="rep" aria-label="Noch einmal zeigen">🔁</button></div>';
  return [h,c];
}
function ecPlay(st){
  const c=pzc; let i=0;
  c.busy=true; st.ph='show'; st.pos=0; st.lit=-1;
  const step=function(){
    if(i>=st.seq.length){ st.lit=-1; st.ph='in'; c.busy=false; pzDraw(); return; }
    st.lit=st.seq[i]; blip(ECF[st.lit],ECF[st.lit],.3,'triangle',.14); pzDraw();
    pzLater(st.sp*.7,function(){ st.lit=-1; pzDraw(); pzLater(st.sp*.3,function(){ i++; step(); }); });
  };
  pzDraw(); pzLater(450,step);
}
function stEcho(st){ pzc.busy=true; pzLater(AU.muted?700:(st.rev?5200:3600),function(){ ecPlay(st); }); }
function acEcho(st,a){
  if(a==='rep'){ ecPlay(st); return; }
  if(st.ph!=='in') return;
  const v=+a, want=st.rev?st.seq[st.seq.length-1-st.pos]:st.seq[st.pos];
  blip(ECF[v],ECF[v],.22,'triangle',.14);
  st.lit=v;
  if(v===want){
    st.pos++; pzDraw();
    if(st.pos>=st.seq.length){ pzc.busy=true; pzLater(380,function(){ pzc.busy=false; pzWin(); }); }
    else pzLater(170,function(){ st.lit=-1; pzDraw(); });
  }else{
    pzDraw(); pzFail(); pzc.busy=true;
    pzLater(950,function(){ ecPlay(st); });
  }
}
function hiEcho(st){ st.sp=850; ecPlay(st); }
function syEcho(st){ return st.rev?'Achtung, jetzt rückwärts! Merk dir, in welcher Reihenfolge die Kristalle leuchten. Dann tippe sie von hinten nach vorn: den letzten zuerst.':'Merk dir, in welcher Reihenfolge die Kristalle leuchten. Dann tippe sie genauso nach.'; }

/* ---------- 6. Rohre: Rohrstücke drehen, bis das Wasser von links bis zur Pflanze fließt. ---------- */
const RSVG=['<path d="M0 12h24"','<path d="M12 0v5a7 7 0 0 0 7 7h5"','<path d="M0 12h24M12 0v12"'];
function mkRohre(lv){ return mkRohreWith(Math.random,lv); }
function drRohre(st){
  const cs=pzCell(st.w+2,st.h,false), f=rhFlow(st), done=rhDone(st,f);
  let h='<div class="pzg" style="--cs:'+cs+'px;grid-template-columns:repeat('+(st.w+2)+',var(--cs))">';
  for(let y=0;y<st.h;y++){
    h+='<span class="ends" aria-hidden="true">'+(y===st.ys?'🚰':'')+'</span>';
    for(let x=0;x<st.w;x++){
      const p=y*st.w+x, t=st.t[p];
      if(t===3) h+='<span class="pzc pp rock"></span>';
      else h+='<button class="pzc pp'+(f.has(p)?' wet':'')+(st.lk[p]?' lk':'')+'" data-a="'+p+'" aria-label="Rohr drehen"><svg viewBox="0 0 24 24" style="transform:rotate('+st.ang[p]+'deg)" aria-hidden="true">'+RSVG[t]+' stroke="currentColor" stroke-width="7" fill="none"/></svg></button>';
    }
    h+='<span class="ends"'+(y===st.ye?' id="pz-sink"':'')+' aria-hidden="true">'+(y===st.ye?(done?'🌻':'🌱'):'')+'</span>';
  }
  return [h+'</div>',''];
}
function rhPaint(st){
  const f=rhFlow(st), done=rhDone(st,f);
  for(const b of $('pz-body').querySelectorAll('[data-a]')) b.classList.toggle('wet',f.has(+b.dataset.a));
  if(done){ $('pz-sink').textContent='🌻'; pzWin(); }
}
function acRohre(st,a,b){
  const p=+a; if(st.lk[p]) return;
  st.r[p]=(st.r[p]+1)%4; st.ang[p]+=90; st.taps++;
  b.firstChild.style.transform='rotate('+st.ang[p]+'deg)'; sfx('tick');
  if(st.taps===st.need*2+6) pzc.fails=Math.max(pzc.fails,2);
  rhPaint(st);
}
function hiRohre(st){
  const bad=idxs(st.t.length).filter(function(p){ return st.sr[p]>=0&&!st.lk[p]; });
  const wrong=bad.filter(function(p){ return st.t[p]===0?(st.r[p]&1)!==(st.sr[p]&1):st.r[p]!==st.sr[p]; });
  const pick=wrong.length?wrong:bad;
  if(pick.length){
    const p=pick[ri(0,pick.length-1)], d=(st.sr[p]-st.r[p]+4)%4;
    st.r[p]=st.sr[p]; st.ang[p]+=d*90; st.lk[p]=true;
    const b=$('pz-body').querySelector('[data-a="'+p+'"]'); b.classList.add('lk'); b.firstChild.style.transform='rotate('+st.ang[p]+'deg)';
  }
  speak('Ein Rohr habe ich für dich festgeschraubt. Fang links beim Wasserhahn an und geh Stück für Stück weiter.');
  rhPaint(st);
}
function syRohre(){ return 'Dreh die Rohre, bis das Wasser vom Wasserhahn bis zur Pflanze fließt. Tippe auf ein Rohr, dann dreht es sich.'; }

/* ---------- 7. Bilder-Sudoku: In jeder Reihe und Spalte kommt jedes Bild genau einmal vor. ---------- */
function mkSudoku(lv){ return mkSudokuWith(Math.random,lv); }
function sdTok(st,v){ return tok(st.sy[v],st.co[v]); }
function drSudoku(st){
  const n=st.n, cs=pzCell(n+.3,n+.3,false);
  let h='<div class="pzg" style="--cs:'+cs+'px;grid-template-columns:repeat('+n+',auto)">';
  for(let i=0;i<n*n;i++){
    const c=i%n, r=(i-c)/n, v=st.cur[i], bx=n===4?(c===1?' bxr':'')+(r===1?' bxb':''):'';
    if(st.giv[i]>=0) h+='<span class="pzc fix'+bx+'">'+sdTok(st,v)+'</span>';
    else h+='<button class="pzc'+bx+(v>=0&&!sdOk(st.cur,n,i,v)?' bad':'')+'" data-a="'+i+'" aria-label="Feld in Reihe '+(r+1)+', Spalte '+(c+1)+'">'+(v>=0?sdTok(st,v):'')+'</button>';
  }
  return [h+'</div>',''];
}
function sdCheck(st){
  const n=st.n; let full=true, ok=true;
  for(let i=0;i<n*n;i++){ const v=st.cur[i]; if(v<0) full=false; else if(!sdOk(st.cur,n,i,v)) ok=false; }
  if(full&&ok){ pzWin(); return; }
  if(full&&!st.full) pzFail();
  st.full=full;
}
function acSudoku(st,a){
  const i=+a; st.cur[i]=st.cur[i]>=st.n-1?-1:st.cur[i]+1;
  sfx('tick'); pzDraw(); sdCheck(st);
}
function hiSudoku(st){
  const open=idxs(st.n*st.n).filter(function(i){ return st.giv[i]<0&&st.cur[i]!==st.sol[i]; });
  if(open.length){ const i=open[ri(0,open.length-1)]; st.cur[i]=st.sol[i]; st.giv[i]=st.sol[i]; }
  pzDraw();
  speak('Such eine Reihe, in der nur noch ein Bild fehlt. Welches Bild gibt es dort noch nicht?');
  sdCheck(st);
}
function sySudoku(st){ return 'In jeder Reihe und in jeder Spalte darf jedes Bild nur einmal vorkommen.'+(st.n===4?' Auch in jedem der vier Kästchen.':'')+' Tippe auf ein leeres Feld, bis das richtige Bild da ist. Rot heißt: Das Bild gibt es dort schon.'; }

/* ---------- Tasten ---------- */
const VEH=[['walk','Laufen'],['ski','Ski fahren'],['car','Auto'],['plane','Flugzeug'],['rocket','Rakete'],['bagger','Bagger'],['loader','Radlader'],['dumper','Kipper'],['tbm','Tunnelbohrmaschine'],['sub','U-Boot'],['balloon','Heißluftballon'],['heli','Hubschrauber'],['boat','Segelboot'],['bug','Kletterkäfer'],['coaster','Achterbahn fahren'],['dragon','Auf Mama Glut fliegen']];
const TOOLS=[['tnt','Bombe legen'],['lava','Lava malen'],['fire','Feuer malen'],['water','Wasser malen'],['ice','Eis malen'],['earth','Erde malen'],['blocks','Bauklötze setzen'],['track','Schiene malen'],['erase','Radierer'],['snow','Schnee malen'],['ball','Schneeball werfen'],['man','Schneemann bauen'],['fw','Feuerwerk zünden'],['rope','Seilrutsche spannen'],['shovel','Schaufel'],['pick','Spitzhacke'],['bow','Pfeil und Bogen']];
const MODES=VEH.map(function(v){return v[0];}), TOOLN=TOOLS.map(function(t){return t[0];});
/* Zauberkasten (Vereinfachungsplan 1b): Die sechs Malstoffe stecken in einer Karte der Werkzeugkiste und öffnen sich als eigenes Fenster. */
const PAINT={lava:1,fire:1,water:1,ice:1,earth:1,snow:1};
function svg24(inner){ return '<svg viewBox="0 0 24 24" aria-hidden="true">'+inner+'</svg>'; }
const LOCK='<span class="lock">'+svg24(QI.lock)+'</span>';
$('grid').innerHTML=
  '<button class="btn veh cool" id="btn-veh" aria-label="Fahrzeug wählen">'+svg24(IC.walk)+LOCK+'</button>'+
  '<button class="btn cool" id="btn-tool" aria-label="Werkzeug wählen" aria-pressed="false">'+svg24(QI.hand)+LOCK+'</button>'+
  '<button class="btn" id="btn-map" aria-label="Karte: zu einem entdeckten Land reisen">'+svg24(QI.map)+'</button>'+
  '<button class="btn" id="btn-lab" aria-label="Werkstatt: Bohrer, Rakete, Lampe und Schutz bauen">'+svg24(QI.lab)+'<span class="badge" id="lab-n" hidden>!</span></button>'+
  '<button class="btn" id="btn-finds" aria-label="Funde ansehen">'+svg24(QI.gem)+'<span class="badge" id="found" hidden>0</span></button>'+
  '<button class="btn" id="btn-menu" aria-label="Menü: Speichern, Ton, neue Welt, Vollbild, Spielstand umziehen">'+svg24(QI.gear)+'</button>';
$('save').innerHTML=svg24(QI.save); $('reset').innerHTML=svg24(IC.reset); $('exp').innerHTML=svg24(QI.exp); $('imp').innerHTML=svg24(QI.imp);
$('imp-ask').innerHTML=svg24(QI.imp)+'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h14m-6-6l6 6-6 6" stroke="'+K+'" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>'+svg24(IC.blocks);
$('ask').innerHTML=svg24(IC.blocks)+'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h14m-6-6l6 6-6 6" stroke="'+K+'" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>'+svg24(IC.reset);
$('garage-cards').innerHTML=VEH.map(function(v){
  const cool=v[0]!=='walk';
  return '<button class="card pick'+(cool?' cool':'')+'" id="mode-'+v[0]+'" data-mode="'+v[0]+'" aria-label="'+v[1]+'" aria-pressed="false">'+svg24(IC[v[0]])+(cool?LOCK:'')+'</button>';
}).join('');
const toolCard=function(t){
  const cool=!HANDT[t[0]];
  return '<button class="card pick'+(cool?' cool':'')+'" id="tool-'+t[0]+'" data-tool="'+t[0]+'" aria-label="'+t[1]+'" aria-pressed="false">'+svg24(IC[t[0]])+(cool?LOCK:'')+(t[0]==='tnt'?'<span class="badge" id="tnt-n" hidden>0</span>':'')+'</button>';
};
$('tool-cards').innerHTML=TOOLS.filter(function(t){ return !PAINT[t[0]]; }).map(function(t,i){
  return (i===1?'<button class="card pick cool" id="tool-magic" aria-label="Zauberkasten: Lava, Feuer, Wasser, Eis, Erde oder Schnee malen" aria-pressed="false"><span class="mg" aria-hidden="true">🪄</span>'+LOCK+'</button>':'')+toolCard(t);
}).join('');
$('magic-cards').innerHTML=TOOLS.filter(function(t){ return PAINT[t[0]]; }).map(toolCard).join('');

/* Geister-Klick: Öffnet ein Tippen schon beim Aufsetzen ein Fenster, landet der Klick nach dem Loslassen im neuen Fenster, etwa auf dem Hintergrund, der es wieder schließt. Ein Klick, der nicht dort ankommt, wo der Finger aufgesetzt hat, wird verschluckt. */
let ghostEl=null;
function armGhost(el){ ghostEl=el; }
window.addEventListener('pointerdown',function(){ ghostEl=null; },true);
window.addEventListener('keydown',function(){ ghostEl=null; },true);
window.addEventListener('click',function(e){
  const g=ghostEl; ghostEl=null;
  if(g&&!g.contains(e.target)){ e.stopPropagation(); e.preventDefault(); }
},true);
function tap(el,fn){
  el.addEventListener('pointerdown',function(e){ e.preventDefault(); armGhost(el); fn(e); });
  el.addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); fn(e); } });
}
function hold(id,k){
  const el=$(id);
  const dn=function(e){ e.preventDefault(); try{el.setPointerCapture(e.pointerId);}catch(_){} keys[k]=true; el.classList.add('down'); keyTap(k); };
  const up=function(){ keys[k]=false; el.classList.remove('down'); };
  el.addEventListener('pointerdown',dn); el.addEventListener('pointerup',up);
  el.addEventListener('pointercancel',up); el.addEventListener('lostpointercapture',up);
}
hold('key-l','l'); hold('key-r','r'); hold('key-u','u'); hold('key-d','d');
const actEl=$('act');
actEl.addEventListener('pointerdown',function(e){ e.preventDefault(); try{actEl.setPointerCapture(e.pointerId);}catch(_){} actEl.classList.add('down'); keys.a=true; doAction(); });
['pointerup','pointercancel','lostpointercapture'].forEach(function(n){ actEl.addEventListener(n,function(){ actEl.classList.remove('down'); keys.a=false; }); });
actEl.addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); doAction(); } });
document.querySelectorAll('[data-mode]').forEach(function(b){ b.addEventListener('click',function(){
  const m=b.dataset.mode;
  $('garage').hidden=true;
  if(m==='walk') setMode(m); else need(function(){ setMode(m); });
}); });
document.querySelectorAll('[data-tool]').forEach(function(b){ b.addEventListener('click',function(){
  $('toolbox').hidden=true; $('magic').hidden=true;
  if(HANDT[b.dataset.tool]){ if(P.mode!=='walk') setMode('walk'); setTool(b.dataset.tool); return; }
  need(function(){ setTool(b.dataset.tool); });
}); });
tap($('btn-veh'),function(){ $('garage').hidden=false; });
tap($('btn-tool'),function(){ $('toolbox').hidden=false; });
$('tool-magic').addEventListener('click',function(){ $('toolbox').hidden=true; $('magic').hidden=false; });
tap($('btn-finds'),function(){ renderAlbum(); $('finds').hidden=false; });
tap($('save'),function(){ saveGame(true); });
$('album').addEventListener('click',function(e){
  const b=e.target.closest('[data-find]');
  if(b&&ST.found[b.dataset.find]){ const f=FINDS.find(function(q){return q[0]===b.dataset.find;}); speak(f[2].replace(/^(einen|eine|ein|den|zwei) /,'')); }
});
document.querySelectorAll('.ov').forEach(function(o){
  o.addEventListener('click',function(e){ if(e.target===o||e.target.closest('.xb')) o.hidden=true; });
});
tap($('batt'),function(){ openQuiz(null); });
$('quiz-x').addEventListener('click',closeQuiz);
$('quiz-go').addEventListener('click',closeQuiz);
$('quiz-say').addEventListener('click',function(){ if(qcur) speak(qcur.say); });
tap($('btn-menu'),function(){ $('menu').hidden=false; });
tap($('btn-map'),function(){ mapPg=0; renderMap(); $('map').hidden=false; renderFog(); });
tap($('btn-lab'),openLab);
$('map-cards').addEventListener('click',mapClick);
$('eggs').addEventListener('click',eggClick);
tap($('quest'),function(){ if(quest&&!quest.done){ const d=QDEF[quest.type]; speak(d.say(quest)); pulse(d.hint(quest)); } });
/* Linkshänder: Laufen rechts, Springen und Aktion links. */
document.body.classList.toggle('calm',OPT.calm);
let lefty=false; try{ lefty=localStorage.getItem(K_LEFTY)==='1'; }catch(_){}
function syncHand(){ document.body.classList.toggle('lefty',lefty); $('hand').innerHTML='<span style="font-size:34px;display:inline-block;transform:scaleX('+(lefty?-1:1)+')" aria-hidden="true">🫲</span>'; $('hand').setAttribute('aria-pressed',String(lefty)); }
$('hand').addEventListener('click',function(){ lefty=!lefty; try{ localStorage.setItem(K_LEFTY,lefty?'1':'0'); }catch(_){} syncHand(); sfx('pop'); speak(lefty?'Steuerung gespiegelt: Laufen jetzt rechts.':'Steuerung wie vorher: Laufen links.'); });
syncHand();
$('sound').addEventListener('click',function(){
  if(AU.muted){ AU.muted=false; AU.fxOff=false; } else if(AU.fxOff){ AU.muted=true; AU.fxOff=false; } else AU.fxOff=true;
  try{ localStorage.setItem(K_MUTE,AU.muted?'1':AU.fxOff?'s':'0'); }catch(_){} if(AU.muted) speakStop();
  syncSound(); sfx('pop');
  if(AU.fxOff) speak('Nur Sprache.');
});
/* ---------- Spielstand umziehen: Alles aus diesem Browser (Welt, Held, Funde, Einstellungen, Protokoll) als eine Datei. Der Speicher gehört zur Adresse, darum braucht der Umzug vom Artefakt auf eine eigene Seite oder in die Homescreen-App diesen Weg. ---------- */
let bakIn=null;
function bakMake(){ return bakMakeWith(TP); }
function bakDone(ok){
  if(ok){ flash('exp','ok'); tone([660,880]); try{ localStorage.setItem(K_BAK_AT,String(Date.now())); }catch(_){} }
  else { flash('exp','warn'); tone([170],'sawtooth'); }
}
function bakSave(){
  bakMake().then(function(b){
    const name='lavaland-'+b.at.slice(0,10)+'.json';
    const blob=new Blob([JSON.stringify(b)],{type:'application/json'});
    const dl=function(){
      try{
        const a=document.createElement('a'), u=URL.createObjectURL(blob);
        a.href=u; a.download=name; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function(){ URL.revokeObjectURL(u); },4000); bakDone(true);
      }catch(_){ bakDone(false); }
    };
    let f=null;
    try{ f=new File([blob],name,{type:'application/json'}); }catch(_){}
    if(f&&navigator.canShare&&navigator.canShare({files:[f]})){
      navigator.share({files:[f]}).then(function(){ bakDone(true); },function(e){ if(e&&e.name==='AbortError') return; dl(); });
    } else dl();
  },function(){ bakDone(false); });
}
function bakPick(file){
  if(!file) return;
  if(file.size>BAK_MAX){ flash('imp','warn'); tone([170],'sawtooth'); return; }
  const rd=new FileReader();
  rd.onload=function(){
    let b=null;
    try{ b=JSON.parse(rd.result); }catch(_){}
    if(!bakOk(b)){ flash('imp','warn'); tone([170],'sawtooth'); return; }
    bakIn=b; $('menu').hidden=true; $('imp-ok').hidden=false; speak('Spielstand laden? Die Welt hier wird dann ersetzt.');
  };
  rd.onerror=function(){ flash('imp','warn'); tone([170],'sawtooth'); };
  rd.readAsText(file);
}
function bakLoad(){ return bakLoadWith(TP); }

/* ---------- Vollbild im Browser-Tab (Android, Desktop). iPhone kennt das nicht, dort hilft nur „Zum Home-Bildschirm“. Als installierte App ist das Spiel schon im Vollbild, der Knopf bleibt dann weg. ---------- */
const DE=document.documentElement;
function fsOn(){ return !!(document.fullscreenElement||document.webkitFullscreenElement); }
function fsSync(){ const on=fsOn(); $('fs').innerHTML=svg24(on?QI.fsx:QI.fs); $('fs').setAttribute('aria-pressed',String(on)); }
function fsToggle(){
  try{
    if(fsOn()){ (document.exitFullscreen||document.webkitExitFullscreen).call(document); return; }
    const p=(DE.requestFullscreen||DE.webkitRequestFullscreen).call(DE,{navigationUI:'hide'});
    if(p&&p.catch) p.catch(function(){ flash('fs','warn'); });
    $('menu').hidden=true;
  }catch(_){ flash('fs','warn'); }
}
(function(){
  let app=false;
  try{ app=matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches||navigator.standalone===true; }catch(_){}
  const can=!!((document.fullscreenEnabled||document.webkitFullscreenEnabled)&&(DE.requestFullscreen||DE.webkitRequestFullscreen));
  $('fs').hidden=app||!can; fsSync();
  document.addEventListener('fullscreenchange',fsSync); document.addEventListener('webkitfullscreenchange',fsSync);
  /* Installiert bittet das Spiel darum, dass der Browser den Spielstand nicht von sich aus löscht. */
  /* Auch im Browser-Tab: Chrome entscheidet selbst, ob es zustimmt. Eine Frage an das Kind gibt es nicht. */
  if(navigator.storage&&navigator.storage.persist) navigator.storage.persist().catch(function(){});
  if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){ try{ navigator.serviceWorker.register('sw.js').catch(function(){}); }catch(_){} }
})();
$('fs').addEventListener('click',fsToggle);
$('exp').addEventListener('click',bakSave);
$('imp').addEventListener('click',function(){ $('imp-file').value=''; $('imp-file').click(); });
$('imp-file').addEventListener('change',function(){ bakPick($('imp-file').files[0]); });
$('imp-no').addEventListener('click',function(){ bakIn=null; $('imp-ok').hidden=true; });
$('imp-yes').addEventListener('click',function(){ $('imp-ok').hidden=true; bakLoad(); });
/* Neue Welt fragt erst nach, weil dabei alles Gebaute verloren geht. */
$('reset').addEventListener('click',function(){ $('menu').hidden=true; $('confirm').hidden=false; speak('Neue Welt? Alles Gebaute geht dann verloren.'); });
$('no').addEventListener('click',function(){ $('confirm').hidden=true; });
$('yes').addEventListener('click',function(){
  $('confirm').hidden=true; resetWorld(newSeed());
  if(!hero.quest||hero.quest.done) hero.quest=newQuest();
  showQuest(false);
  saveGame(false); sfx('pop');
});

/* ---------- Lernen: Der Akku wird mit richtig gelösten Aufgaben geladen und läuft leer, solange ein Fahrzeug oder Werkzeug benutzt wird. ---------- */
const SEG=75, MAXE=5*SEG;
let qcur=null, pending=null, battShown=-1, battLow=false, warnS=0;
function renderBatt(){
  const k=Math.ceil(ST.energy/SEG*8);
  if(k===battShown) return;
  battShown=k;
  for(const id of ['batt-cells','quiz-cells']){
    const cells=$(id).children;
    for(let i=0;i<5;i++) cells[i].firstChild.style.height=Math.round(clamp((ST.energy-i*SEG)/SEG,0,1)*100)+'%';
  }
  document.body.classList.toggle('locked',ST.energy<=0);
  $('quiz-go').hidden=ST.energy<=0;
}
function need(fn){ if(ST.energy>0) fn(); else openQuiz(fn); }
function openQuiz(then){
  if(then) pending=then;
  ST.paused=true; keys.l=keys.r=keys.u=keys.d=keys.a=false; ST.talkLock=0;
  $('quiz').hidden=false; LOG.qOpen(); nextQ();
  $('quiz-pz').textContent=PZON[(hero.pzn|0)%PZON.length].e; $('quiz-pz').classList.toggle('near',(hero.pzn|0)<3);
}
function closeQuiz(){
  LOG.qClose();
  doorQ=null; $('quiz-pz').hidden=false;
  $('quiz').hidden=true; ST.paused=false;
  speakStop();
  const f=pending; pending=null;
  if(ST.energy>0){ if(f) f(); }
  else{ if(!HANDT[ST.tool]) setTool(null,true); if(P.mode!=='walk'){ const air=!P.on; setMode('walk'); if(air){ P.chute=true; P.vy=Math.min(P.vy,0); } } pulse('batt'); }
}
function drain(dt){
  if(P.mode!=='walk'||(ST.tool&&!HANDT[ST.tool]&&(!PAINT[ST.tool]&&ST.tool!=='tnt'||ST.energy<=0))){
    ST.energy-=dt;
    if(ST.energy<=0){ ST.energy=0; battLow=false; $('batt').classList.remove('low'); renderBatt(); openQuiz(null); return; }
    /* Kurz vor leer blinkt der Akku und tickt, damit die Lernaufgabe nicht aus dem Nichts kommt. */
    if(ST.energy<6&&Math.ceil(ST.energy)!==warnS){ warnS=Math.ceil(ST.energy); blip(660,660,.06,'square',.05); }
  }
  const low=ST.energy>0&&ST.energy<12;
  if(low!==battLow){ battLow=low; $('batt').classList.toggle('low',low); }
  renderBatt();
}
function ri(a,b){ return riWith(Math.random,a,b); }
function shuffle(a){ return shuffleWith(Math.random,a); }
function numOpts(ans,n,max){
  const o=[ans]; let guard=0;
  while(o.length<n&&guard++<80){ const v=ans+ri(-3,3); if(v>=0&&v<=max&&o.indexOf(v)<0) o.push(v); }
  return shuffle(o).map(String);
}
/* ---------- Lernkern: Jede Aufgabe ist ein eigener Fakt (7+5, Anlaut von Maus) mit einem Fach nach Leitner.
   Fach 1 kommt in derselben Runde wieder, Fach 2 morgen, dann nach 2, 4 und 8 Tagen. Fach 5 heißt: sitzt.
   Neue Fakten kommen in Schulbuch-Reihenfolge: bis 5, bis 10, bis 20 ohne und dann mit Zehnerübergang. ---------- */
function dayNo(t){ const d=t?new Date(t):new Date(); return Math.floor((d.getTime()-d.getTimezoneOffset()*6e4)/864e5); }
let FS=null;
function loadFacts(){
  try{ FS=JSON.parse(localStorage.getItem(K_FACTS)||'null'); }catch(_){ FS=null; }
  if(!FS||FS.v!==1||!FS.f){
    /* Wer schon mit dem alten Zähler weit war, startet eine Stufe höher. Den Rest erledigt der Schnellaufstieg. */
    let sk=0; try{ sk=parseInt(localStorage.getItem(K_SKILL)||'0',10)||0; }catch(_){}
    const t=sk>=22?2:sk>=8?1:0;
    FS={v:1,u:{m:t,l:t},f:{},nd:0,nn:{m:0,l:0},ft:{m:0,l:0}};
  }
  /* Stufen und Zähler absichern: Eine Stufe über der letzten würde jede Aufgabe abstürzen lassen. */
  if(!FS.u||typeof FS.u!=='object') FS.u={m:0,l:0};
  if(!FS.nn||typeof FS.nn!=='object') FS.nn={m:0,l:0};
  if(!FS.ft||typeof FS.ft!=='object') FS.ft={m:0,l:0};
  ['m','l'].forEach(function(d){ FS.u[d]=clamp(FS.u[d]|0,0,STAGES[d].length-1); FS.nn[d]=FS.nn[d]|0; FS.ft[d]=FS.ft[d]|0; });
  if(!FS.dm||typeof FS.dm!=='object'||!FS.dm.c||typeof FS.dm.c!=='object') delete FS.dm;
  for(const k in FS.f){ const r=FS.f[k]; if(!Array.isArray(r)||!(r[0]>=0)||!isFinite(r[1])) delete FS.f[k]; else r[0]=clamp(r[0]|0,0,5); }
}
function saveFacts(){ return saveFactsWith(SV); }
loadFacts();
/* Wer schon Fakten in Fach 4 oder 5 hat, bekommt die Meistersteine dafür beim ersten Start nachträglich. */
(function(){ if(FS.mg) return; FS.mg={}; let n=0; for(const k in FS.f) if(FS.f[k][0]>=MBOX){ FS.mg[k]=1; n++; } if(n){ hero.mat.ms=(hero.mat.ms|0)+n; hero.mk.ms=1; saveHero(); } saveFacts(); })();
/* Schulstand: Eltern stellen ein, welcher Zahlenraum und welche Buchstaben in der Schule schon dran waren. Neue Fakten kommen dann nur daraus.
   Schon Geübtes wird weiter wiederholt. Ohne Eintrag gilt alles wie bisher. */
const ZRN=['bis 5','bis 10','bis 20 ohne Zehnerübergang','bis 20 mit Zehnerübergang'], ABC='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
let SCH={on:false,zr:3,l:'',at:0};
try{ const o=JSON.parse(localStorage.getItem(K_SCHOOL)||'null'); if(o&&typeof o==='object'){ SCH.on=!!o.on; SCH.zr=clamp(o.zr|0,0,3); SCH.l=String(o.l||'').replace(/[^A-Z]/g,''); SCH.at=+o.at||0; } }catch(_){}
function saveSchool(){ SCH.at=Date.now(); try{ localStorage.setItem(K_SCHOOL,JSON.stringify(SCH)); }catch(_){} }
function schoolOk(k,s){ return schoolOkWith(SCH,k,s); }
function fUnlock(d){ return fUnlockWith(FS,d); }
const retry=[];
let lastF='', lastDom='';
/* Abwechslung: Aufgabenart (Plus, Minus, Zahlenhaus, Silben …). Gemischtes Üben hält wach und trainiert, die passende Strategie zu erkennen (Interleaving). Kommt dieselbe Art zweimal hintereinander, wird beim dritten Mal eine andere bevorzugt, wenn es eine gibt. */
let kindHist=[];
function mixPrefer(a){ return mixPreferWith(Math.random,kindHist,a); }
function pickFact(){ const k=pickFact0(); kindHist.unshift(fKind(k)); kindHist.length=Math.min(kindHist.length,2); return k; }
function pickFact0(){
  const today=dayNo();
  if(FS.nd!==today){ FS.nd=today; FS.nn={m:0,l:0}; }
  for(let i=0;i<retry.length;i++) retry[i].n--;
  const ri0=retry.findIndex(function(r){ return r.n<=0&&r.k!==lastF; });
  if(ri0>=0) return retry.splice(ri0,1)[0].k;
  const doms=Math.random()<.6?['m','l']:['l','m'];
  for(let p=0;p<2;p++){
    for(const d of doms){
      const due=[], fresh=[];
      for(let s=0;s<=FS.u[d];s++) STAGES[d][s].forEach(function(k){
        if(k===lastF||retry.some(function(r){ return r.k===k; })) return;
        const r=FS.f[k];
        if(!r){ if(schoolOk(k,s)) fresh.push([k,s]); }
        else if(r[1]<=today) due.push(k);
      });
      /* Fällige zuerst, die schwächsten vorn. Neue nur in Maßen, damit nicht zu viel Ungeübtes auf einmal kommt. */
      if(due.length&&(p||Math.random()<.75||!fresh.length)){
        due.sort(function(a,b){ return FS.f[a][0]-FS.f[b][0]||FS.f[a][1]-FS.f[b][1]; });
        const dv=mixPrefer(due.slice(0,6));
        return dv[ri(0,Math.min(2,dv.length-1))];
      }
      let open=0; for(const k in FS.f) if(fDom(k)===d&&FS.f[k][0]===1) open++;
      if(fresh.length&&FS.nn[d]<NEWDAY&&open<4){
        /* Meist aus der höchsten offenen Stufe, damit nach der Einstufung nicht das längst Gekonnte drankommt. */
        const top=fresh.filter(function(x){ return x[1]===FS.u[d]; }), pool=top.length&&Math.random()<.7?top:fresh;
        const pv=mixPrefer(pool.map(function(x){ return x[0]; }));
        return pv[ri(0,pv.length-1)];
      }
    }
  }
  /* Nichts fällig und nichts Neues: früh wiederholen, ohne dass das Fach steigt. */
  const any=Object.keys(FS.f).filter(function(k){ return k!==lastF&&!fParked(k,today); });
  if(any.length){ any.sort(function(a,b){ return FS.f[a][1]-FS.f[b][1]; }); return any[ri(0,Math.min(4,any.length-1))]; }
  return STAGES.m[0][ri(0,STAGES.m[0].length-1)];
}
function fParked(k,today){ return fParkedWith(FS,k,today); }
/* how: 'ok' beim ersten Versuch, 'ok2' beim zweiten Versuch am Ziffernblock, 'miss' falsch. */
function factDone(q,how,fast){
  const k=q.f, d=fDom(k), today=dayNo();
  let r=FS.f[k];
  const isNew=!r;
  if(isNew){ r=FS.f[k]=[0,today]; FS.nn[d]++; }
  const wasDue=r[1]<=today;
  if(how==='miss'){
    r[0]=1; r[1]=today; FS.ft[d]=0;
    /* Dreimal am selben Tag falsch: Der Fakt ruht bis morgen. Sonst kommt er immer wieder, und aus Üben wird Frust (Reim auf Tanne: 8 Fehler an einem Nachmittag). */
    if(!FS.dm||FS.dm.d!==today) FS.dm={d:today,c:{}};
    FS.dm.c[k]=(FS.dm.c[k]|0)+1;
    if(fParked(k,today)){ r[1]=today+1; for(let i=retry.length-1;i>=0;i--) if(retry[i].k===k) retry.splice(i,1); }
    else retry.push({k:k,n:ri(2,3)});
  }else if(how==='ok2'){
    r[0]=Math.max(1,r[0]); r[1]=today+1; FS.ft[d]=0;
  }else if(isNew&&fast){
    r[0]=3; r[1]=today+BOXD[3];
    if(fStage(k)===FS.u[d]) FS.ft[d]++;
  }else if(isNew||wasDue){
    r[0]=Math.min(5,Math.max(1,r[0])+1); r[1]=today+BOXD[r[0]];
    if(isNew) FS.ft[d]=0;
  }
  const mg=r[0]>=MBOX&&!q.free&&masterGive(k);
  fUnlock(d); saveFacts();
  return mg;
}
/* Meisterschaft: Sitzt ein Fakt in Fach 4 (also an verschiedenen Tagen richtig), gibt es einmal einen Meisterstein. Fach 5 leuchtet auf der Rechentafel golden. */
const MBOX=4;
function masterGive(k){
  if(!FS.mg) FS.mg={};
  if(FS.mg[k]) return false;
  FS.mg[k]=1; hero.mat.ms=(hero.mat.ms|0)+1; dayAdd('ms'); hero.mk.ms=1; ST.heroDirty=true; saveHero();
  labBadge(true);
  return true;
}
function mkQ(k){ return mkQWith(Math.random,IC,QI,k); }
function mkSeq(){ return mkSeqWith(Math.random,FS); }
function genQ(){
  if(Math.random()<.1&&lastF.indexOf('seq:')!==0){ const q=mkSeq(); lastF=q.f; lastDom='m'; return q; }
  const k=pickFact(), q=mkQ(k), r=FS.f[k];
  q.box=r?r[0]:0; lastF=k; lastDom=fDom(k);
  return q;
}
const PADK=['1','2','3','4','5','6','7','8','9','del','0','ok'];
function nextQ(){
  qcur=genQ();
  const q=qcur;
  $('q').innerHTML=q.html;
  const ans=$('ans'); ans.innerHTML=''; ans.classList.toggle('kp',q.pad);
  if(q.pad){
    ans.style.gridTemplateColumns='repeat(3,minmax(0,1fr))';
    PADK.forEach(function(k){
      const b=document.createElement('button');
      b.className='opt key'+(k==='ok'?' go':'')+(k==='del'?' del':'');
      b.dataset.k=k;
      if(k==='ok'){ b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'; b.setAttribute('aria-label','Fertig'); }
      else if(k==='del'){ b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h11v14H9l-6-7z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M12 9l5 6M17 9l-5 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'; b.setAttribute('aria-label','Löschen'); }
      else b.textContent=k;
      b.addEventListener('click',function(){ padKey(k); });
      ans.appendChild(b);
    });
  }else{
    ans.style.gridTemplateColumns='repeat('+(q.word?2:3)+',minmax(0,1fr))';
    q.opts.forEach(function(v){
      const b=document.createElement('button');
      b.className='opt'+(q.word?' word':'')+(q.type==='syl'?' clap':'')+(q.pics?' pic':''); b.dataset.v=v;
      if(q.pics){ b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+QI[RHYW[v].ic]+'</svg>'; b.setAttribute('aria-label',v); } else b.textContent=v;
      b.addEventListener('click',function(){ answer(b,v); });
      ans.appendChild(b);
    });
  }
  battShown=-1; renderBatt();
  const u=speak(q.say);
  LOG.qStart(q,u);
  /* Für den Schnellaufstieg zählt die Zeit ab Ende der Vorlesung. */
  q.t0=performance.now(); q.te=q.t0;
  if(u){ const prev=u.onend; u.onend=function(e){ if(prev) prev(e); q.te=performance.now(); }; }
}
function holeShow(t){ const h=$('q').querySelector('.hole'); if(h) h.textContent=t; }
function padKey(k){
  const q=qcur;
  if(!q||q.lock||!q.pad) return;
  if(k==='ok'){ if(q.inp) padSubmit(); return; }
  if(k==='del') q.inp=q.inp.slice(0,-1);
  else{ if(!q.k1) q.k1=performance.now(); if(q.inp==='0') q.inp=k; else if(q.inp.length<2) q.inp+=k; }
  holeShow(q.inp||'?');
}
function padSubmit(){
  const q=qcur, v=String(+q.inp);
  if(v===q.ans){ LOG.qTap(v); win(q,q.tries?'ok2':'ok'); return; }
  if(!q.tries){
    /* Erster Fehler am Ziffernblock: nochmal, denn oft ist es nur vertippt. */
    q.tries=1; q.inp=''; LOG.qTap(v,true); tone([300,240]);
    const h=$('q').querySelector('.hole'); if(h){ h.textContent='?'; h.classList.remove('bump'); void h.offsetWidth; h.classList.add('bump'); }
    const z=$('q').querySelector('.zf.blink'); if(z){ z.classList.remove('blink'); void z.offsetWidth; z.classList.add('blink'); }
    speak('Noch einmal.');
    return;
  }
  LOG.qTap(v); lose(q);
}
function answer(b,v){
  const q=qcur;
  if(!q||q.lock) return;
  if(!q.k1) q.k1=performance.now();
  LOG.qTap(v);
  if(v===q.ans){ b.classList.add('ok'); win(q,'ok'); return; }
  b.classList.add('no');
  for(const o of $('ans').children){ o.disabled=true; if((o.dataset.v||o.textContent)===q.ans) o.classList.add('ok'); }
  lose(q);
}
function win(q,how){
  q.lock=true; holeShow(q.ans);
  const h=$('q').querySelector('.hole'); if(h) h.classList.add('ok');
  const fast=how==='ok'&&!q.nofast&&q.k1&&q.k1-Math.max(q.t0,q.te)<FASTMS;
  const mg=!q.free&&factDone(q,how,fast);
  if(mg){ banner('💠 '+(hero.mat.ms|0),2400); setTimeout(function(){ jingle(); speak('Meisterstein! '+fName(q.f)+' sitzt jetzt richtig gut.'); },350); labBadge(false); }
  dayAdd('q');
  ST.energy=Math.min(MAXE,ST.energy+SEG); tone(how==='ok'?[660,880]:[520,660]); qEvent('quiz',1);
  battShown=-1; renderBatt();
  if(doorQ){
    doorQ.n++; banner('🚪 '+'●'.repeat(doorQ.n)+'○'.repeat(Math.max(0,3-doorQ.n)),1500);
    if(doorQ.n>=3){ const v=doorQ.v; setTimeout(function(){ if(qcur!==q) return; closeQuiz(); doorOpen(v); },800); return; }
  }
  setTimeout(function(){ if($('quiz').hidden||qcur!==q) return; if(ST.energy>=MAXE&&!doorQ) closeQuiz(); else nextQ(); },800);
}
/* Falsch: Die Lösung wird gezeigt und vorgelesen, beim Rechnen mit Punkten. Keine Strafe, der Fakt kommt bald wieder. */
function lose(q){
  q.lock=true; q.miss=true; tone([170],'sawtooth');
  if(!q.free) factDone(q,'miss',false);
  holeShow(q.ans);
  const h=$('q').querySelector('.hole'); if(h) h.classList.add('sol');
  if(q.pad){
    if(q.dots&&!$('q').querySelector('.dots')) $('q').insertAdjacentHTML('beforeend',q.dots);
    for(const o of $('ans').children) o.disabled=true;
  }
  speak(q.sol);
  setTimeout(function(){ if($('quiz').hidden||qcur!==q) return; nextQ(); },q.pad?3600:2200);
}

const keymap={ArrowLeft:'l',ArrowRight:'r',ArrowUp:'u',ArrowDown:'d',a:'l',d:'r',w:'u',s:'d'};
window.addEventListener('keydown',function(e){
  if(qcur&&qcur.pad&&!$('quiz').hidden){
    if(/^[0-9]$/.test(e.key)){ padKey(e.key); e.preventDefault(); return; }
    if(e.key==='Backspace'){ padKey('del'); e.preventDefault(); return; }
    if(e.key==='Enter'){ padKey('ok'); e.preventDefault(); return; }
  }
  /* Escape schließt die Aufgabe wie das X, sonst bliebe das Spiel pausiert. */
  if(e.key==='Escape'&&!$('quiz').hidden){ closeQuiz(); return; }
  if(e.key==='Escape'){ document.querySelectorAll('.ov').forEach(function(o){ o.hidden=true; }); pzClose(); return; }
  if(ST.paused||uiOpen()||(e.target&&e.target.tagName==='BUTTON'&&e.key==='Enter')) return;
  const k=keymap[e.key];
  if(k){ if(!e.repeat) keyTap(k); keys[k]=true; e.preventDefault(); }
  else if(e.key===' '){ if(!e.repeat){ keys.a=true; doAction(); } e.preventDefault(); }
  else if(!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey) keyShort(e.key.toLowerCase());
});
/* Tastenkürzel für Tablet-Tastatur und Laptop: dieselben Knöpfe wie oben in der Leiste. Fragezeichen zeigt die Liste. */
const SHORT={f:'btn-veh',t:'btn-tool',k:'btn-map',e:'batt',m:'btn-menu'};
function keyShort(k){
  if(k==='x'){ if(P.mode!=='walk') setMode('walk'); else if(ST.tool) setTool(null,true); return; }
  if(k==='?'||k==='h'){ banner('⌨️ F Fahrzeuge · T Werkzeug · K Karte · E Aufgabe · B Buch · M Menü · X Aussteigen',4200); return; }
  const el=SHORT[k]&&$(SHORT[k]);
  if(el&&!el.hidden&&el.offsetParent) el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'}));
}
window.addEventListener('keyup',function(e){ const k=keymap[e.key]; if(k) keys[k]=false; if(e.key===' ') keys.a=false; });
window.addEventListener('blur',function(){ keys.l=keys.r=keys.u=keys.d=keys.a=false; });
document.addEventListener('contextmenu',function(e){ e.preventDefault(); });
// Wischen bleibt gesperrt, damit die Seite beim Spielen nicht wackelt. Ausnahme: ein Fenster hat mehr Inhalt als Platz (Elternansicht, Rechentafel, Karte, Fenster im Querformat).
function canScroll(n){
  for(;n&&n.nodeType===1&&n!==document.body;n=n.parentElement){
    if(n.scrollHeight>n.clientHeight+1||n.scrollWidth>n.clientWidth+1){
      const cs=getComputedStyle(n);
      if(n.scrollHeight>n.clientHeight+1&&/auto|scroll/.test(cs.overflowY)) return true;
      if(n.scrollWidth>n.clientWidth+1&&/auto|scroll/.test(cs.overflowX)) return true;
    }
  }
  return false;
}
document.addEventListener('touchmove',function(e){ if(!canScroll(e.target)) e.preventDefault(); },{passive:false});
document.addEventListener('gesturestart',function(e){ e.preventDefault(); });

/* ---------- Zeichnen ---------- */
let W=0,H=0,DPR=1,S=1, maxDpr=2, perfT=0, perfN=0;
function resize(){
  DPR=Math.min(window.devicePixelRatio||1,maxDpr);
  W=window.innerWidth; H=window.innerHeight;
  cv.width=Math.max(1,Math.round(W*DPR)); cv.height=Math.max(1,Math.round(H*DPR));
  S=Math.min(W/460,H/400);
}
window.addEventListener('resize',resize);

function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();ctx.fill();}
function circle(x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();}
function mix(a,b,t){return 'rgb('+((a[0]+(b[0]-a[0])*t)|0)+','+((a[1]+(b[1]-a[1])*t)|0)+','+((a[2]+(b[2]-a[2])*t)|0)+')';}
const SKY_T=[84,191,230], SKY_TH=[29,79,156], SKY_B=[212,244,238], SKY_BH=[127,208,232], SPACE_T=[6,8,30], SPACE_B=[28,24,74];
function lerpC(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
const starsBg=[]; for(let i=0;i<120;i++) starsBg.push([Math.random(),Math.random(),1+Math.random()*1.6,.6+Math.random()*2]);
const INK=K;

function c32(r,g,b){ return (255<<24|b<<16|g<<8|r)>>>0; }
function pal(list){ return new Uint32Array(list.map(function(c){return c32(c[0],c[1],c[2]);})); }
const P_GRASS=pal([[88,181,72],[80,170,66],[96,188,80],[84,176,70]]), P_GRASS2=pal([[72,150,62],[66,142,58],[78,156,66],[70,146,60]]);
const P_EARTH=pal([[138,90,60],[130,84,56],[144,96,64],[134,88,58]]), P_ROCK=pal([[88,80,96],[80,73,88],[96,88,104],[84,76,92]]);
const P_ICE=pal([[190,234,247],[176,226,244],[214,244,251],[184,230,246]]);
const P_WALLE=pal([[74,50,38],[70,47,36],[78,53,40],[72,49,37]]), P_WALLR=pal([[46,42,52],[43,39,49],[49,45,55],[45,41,51]]);
const WOODS=[[226,87,76],[242,182,50],[79,154,216],[88,179,104],[216,165,106]];
const P_WOOD=pal(WOODS), P_WOODD=pal(WOODS.map(function(c){return [Math.floor(c[0]*.7),Math.floor(c[1]*.7),Math.floor(c[2]*.7)];}));
const C_BED=c32(30,26,34);
let P_DEEP=pal([[58,62,84],[52,56,78],[64,68,92],[55,59,80]]), P_HOT=pal([[104,50,44],[96,44,40],[114,56,46],[100,48,42]]);
const P_CORE=pal([[255,236,150],[255,214,90],[255,180,60],[255,246,205]]), P_GOLD=pal([[240,196,50],[228,180,40],[250,214,80],[236,190,46]]);
const P_GEM=pal([[80,220,230],[230,110,220],[120,240,170],[255,255,255]]);
let P_WALLD=pal([[28,30,44],[26,28,41],[31,33,48],[27,29,43]]), P_WALLH=pal([[58,26,24],[54,24,22],[62,28,26],[56,25,23]]);
const P_SNOW=pal([[226,238,249],[218,232,246],[234,243,251],[222,235,247]]), P_SNOWT=pal([[255,255,255],[250,253,255],[255,255,255],[246,251,255]]), P_WALLS=pal([[66,94,130],[62,89,124],[71,100,137],[64,91,127]]);
/* Jedes Land hat eigene Farben für Gras, Erde, Fels und Höhlenwände. Nummer 0 ist die Heimat. */
function pal4(c,f){ const q=function(d){ return [clamp(Math.round(c[0]*f+d),0,255),clamp(Math.round(c[1]*f+d),0,255),clamp(Math.round(c[2]*f+d),0,255)]; }; return pal([q(0),q(-8),q(7),q(-4)]); }
const PGR=[P_GRASS], PGR2=[P_GRASS2], PEA=[P_EARTH], PRO=[P_ROCK], PWE=[P_WALLE], PWR=[P_WALLR];
for(let b=1;b<BT.length;b++){ const T=BT[b]; PGR.push(pal4(T.cg,1)); PGR2.push(pal4(T.cg,.82)); PEA.push(pal4(T.ce,1)); PRO.push(pal4(T.cr,1)); PWE.push(pal4(T.ce,.5)); PWR.push(pal4(T.cr,.48)); }
const RBC=['#e63946','#ff8a1f','#ffd23f','#58b548','#3aa0e8','#7b4fd6'];
/* Farben der Tiefe: Pilzgrotten, Urzeit-Höhlen, Kristalltiefen, Lavameer. Dazu die drei harten Schichten. */
let PZR=[pal4([44,104,110],1),pal4([156,120,74],1),pal4([92,80,160],1),pal4([62,42,48],1)], PZE=[pal4([84,170,120],1),pal4([206,170,104],1),pal4([150,180,235],1),pal4([120,56,44],1)], PZW=[pal4([16,44,52],1),pal4([58,42,28],1),pal4([24,20,58],1),pal4([30,12,14],1)];
/* Fremde Welten haben eigene Farben für die Tiefe. Die Erdfarben bleiben hier liegen. */
const EPAL={deep:P_DEEP,hot:P_HOT,wd:P_WALLD,wh:P_WALLH,zr:PZR,ze:PZE,zw:PZW};
function setPal(R){
  if(!R){ P_DEEP=EPAL.deep; P_HOT=EPAL.hot; P_WALLD=EPAL.wd; P_WALLH=EPAL.wh; PZR=EPAL.zr; PZE=EPAL.ze; PZW=EPAL.zw; return; }
  const q=R.pal;
  P_DEEP=pal4(q.deep,1); P_HOT=pal4(q.hot,1); P_WALLD=pal4(q.deep,.4); P_WALLH=pal4(q.hot,.45);
  PZR=q.z.map(function(z){ return pal4(z[0],1); }); PZE=q.z.map(function(z){ return pal4(z[1],1); }); PZW=q.z.map(function(z){ return pal4(z[2],1); });
}
const PSH=[pal([[168,84,40],[146,70,32],[214,128,66]]),pal([[150,70,190],[128,56,168],[204,134,238]]),pal([[30,26,40],[20,16,28],[84,72,110]])];
const IMG=256, oc=document.createElement('canvas'); oc.width=IMG; oc.height=IMG;
const octx=oc.getContext('2d'), img=octx.createImageData(IMG,IMG), px=new Uint32Array(img.data.buffer);

function drawCells(x0,x1,y0,y1){
  const cx0=clamp(Math.floor(x0/CELL),0,GX-1), cy0=clamp(Math.floor((y0-TOP)/CELL),0,GY-1);
  const cx1=Math.min(clamp(Math.floor(x1/CELL),0,GX-1),cx0+IMG-1), cy1=Math.min(clamp(Math.floor((y1-TOP)/CELL),0,GY-1),cy0+IMG-1);
  const nc=cx1-cx0+1, nr=cy1-cy0+1, ph=(time*5)|0;
  for(let y=cy0;y<=cy1;y++){
    let o=(y-cy0)*IMG; const row=y*GX;
    for(let x=cx0;x<=cx1;x++,o++){
      const m=grid[row+x], hv=(Math.imul(x,73856093)^Math.imul(y,19349663))>>>13, h=hv&3, g=grow0[x], b=bmx[x]&&((hv>>>2)&255)<bmx[x]?bio2[x]:bio[x];
      let c;
      if(m<4) c=y<g?(y<mtop[x]?0:P_WALLS[h]):(y>=zS1[x]?PZW[y<z4[x]?0:y<zS2[x]?1:y<zS3[x]?2:3][h]:y>=rH[x]?P_WALLH[h]:y>=rD[x]?P_WALLD[h]:(y<rA[x]||y>=rB[x])?PWR[b][h]:PWE[b][h]);
      else if(m===EARTH){
        if(y<=g+6&&y>1&&grid[row-GX+x]<4) c=PGR[b][h];
        else if(y<=g+6&&y>2&&grid[row-2*GX+x]<4) c=PGR2[b][h];
        else c=y>=zS1[x]?PZE[y<z4[x]?0:y<zS2[x]?1:y<zS3[x]?2:3][h]:PEA[b][h];
      }
      else if(m===ROCK) c=y>=zS1[x]?PZR[y<z4[x]?0:y<zS2[x]?1:y<zS3[x]?2:3][h]:PRO[b][h];
      else if(m===ICE) c=P_ICE[h];
      else if(m===WOOD){ const k=((Math.imul(x>>2,40503)^Math.imul(y>>2,9973))>>>3)%5; c=((x&3)===0||(y&3)===0)?P_WOODD[k]:P_WOOD[k]; }
      else if(m===DEEP) c=P_DEEP[h];
      else if(m===HOT) c=P_HOT[h];
      else if(m===CORE) c=P_CORE[(x+y*2+ph)&3];
      else if(m===GOLD) c=P_GOLD[h];
      else if(m===GEM) c=P_GEM[(h+(ph>>1))&3];
      else if(m===SNOW) c=(y>1&&grid[row-GX+x]<4)?P_SNOWT[h]:P_SNOW[h];
      else if(m===SHELL) c=PSH[y<z4[x]?0:y<zS3[x]?1:2][(((x>>1)+(y>>1))&3)===0?2:h&1];
      else c=C_BED;
      px[o]=c;
    }
  }
  octx.putImageData(img,0,0,0,0,nc,nr);
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(oc,0,0,nc,nr,cx0*CELL,TOP+cy0*CELL,nc*CELL,nr*CELL);
}

function head(x,y,r){
  const sooty=P.soot>0;
  ctx.fillStyle=sooty?'#6b5a50':'#ffd2a8'; circle(x,y,r);
  ctx.fillStyle=sooty?'#4a4046':P.frost>0?'#ffffff':'#ff8a1f'; ctx.beginPath(); ctx.arc(x,y-1,r+.7,Math.PI,0); ctx.closePath(); ctx.fill();
  ctx.fillStyle=INK; circle(x+r*.45,y+1,1.2);
  if(hero.hat==='crown'){
    ctx.fillStyle='#ffd23f'; ctx.beginPath(); ctx.moveTo(x-r,y-r*.7); ctx.lineTo(x-r,y-r*1.75); ctx.lineTo(x-r*.45,y-r*1.2); ctx.lineTo(x,y-r*1.95);
    ctx.lineTo(x+r*.45,y-r*1.2); ctx.lineTo(x+r,y-r*1.75); ctx.lineTo(x+r,y-r*.7); ctx.closePath(); ctx.fill();
  }else if(hero.hat==='tophat'){
    ctx.fillStyle=INK; ctx.fillRect(x-r*1.3,y-r*1.05,r*2.6,r*.38); ctx.fillRect(x-r*.82,y-r*2.2,r*1.64,r*1.2);
    ctx.fillStyle='#e63946'; ctx.fillRect(x-r*.82,y-r*1.4,r*1.64,r*.3);
  }else if(hero.hat==='beanie'){
    ctx.fillStyle='#e63946'; ctx.beginPath(); ctx.arc(x,y-r*.35,r*1.1,Math.PI,0); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#fff'; ctx.fillRect(x-r*1.12,y-r*.58,r*2.24,r*.38); circle(x,y-r*1.52,r*.44);
  }else if(EHAT[hero.hat]) emo(EHAT[hero.hat],x,y-r*1.15,r*2.5);
  if(FX.pump>0) emo('🎃',x,y,r*2.9);
}
function drawKid(x,y,face,run,up){
  const sooty=P.soot>0, suit=sooty?'#3a3438':P.frost>0?'#dfeefa':'#2f6fd6', sw=Math.sin(run)*7;
  const ks=kidScale();
  ctx.save(); ctx.translate(x,y); ctx.scale(face*ks,ks);
  ctx.lineCap='round'; ctx.strokeStyle=INK; ctx.lineWidth=4;
  ctx.beginPath(); ctx.moveTo(-1,-13); ctx.lineTo(-1+sw,-2); ctx.moveTo(1,-13); ctx.lineTo(1-sw,-2); ctx.stroke();
  ctx.fillStyle='#8d99a6'; rr(-11,-28,6,13,2);
  ctx.fillStyle=suit; rr(-6,-29,12,18,5);
  ctx.strokeStyle=suit; ctx.lineWidth=3.5; ctx.beginPath();
  if(up){ ctx.moveTo(-3,-25); ctx.lineTo(-7,-39); ctx.moveTo(3,-25); ctx.lineTo(8,-39); }
  else{ ctx.moveTo(0,-25); ctx.lineTo(5-sw*.6,-16); }
  ctx.stroke();
  head(0,-35,7);
  ctx.restore();
}
function drawChute(x,y){
  const cy=y-98;
  ctx.strokeStyle=INK; ctx.lineWidth=1; ctx.beginPath();
  for(let i=-2;i<=2;i++){ ctx.moveTo(x+i*19,cy); ctx.lineTo(x,y-27); }
  ctx.stroke();
  for(let i=0;i<4;i++){
    ctx.fillStyle=i%2?'#fff8e6':'#e63946';
    ctx.beginPath(); ctx.moveTo(x,cy); ctx.arc(x,cy,40,Math.PI+i*Math.PI/4,Math.PI+(i+1)*Math.PI/4+.02); ctx.closePath(); ctx.fill();
  }
}
function drawCar(x,y,ang,face,occupied,turbo){
  const sooty=occupied&&P.soot>0;
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(face,1);
  if(turbo){ ctx.fillStyle='#ffd23f'; ctx.beginPath(); ctx.moveTo(-30,-20); ctx.lineTo(-48-Math.random()*12,-15); ctx.lineTo(-30,-10); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle=sooty?'#4a3438':'#e63946';
  rr(-30,-23,60,15,6);
  ctx.beginPath(); ctx.moveTo(-20,-22); ctx.lineTo(-13,-37); ctx.lineTo(9,-37); ctx.lineTo(19,-22); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#bfe9f5'; ctx.beginPath(); ctx.moveTo(-14,-23); ctx.lineTo(-10,-33); ctx.lineTo(7,-33); ctx.lineTo(14,-23); ctx.closePath(); ctx.fill();
  if(occupied) head(0,-27,4.6);
  ctx.fillStyle='#ffd23f'; circle(28,-17,2.6);
  ctx.fillStyle=INK; circle(-17,-8,8); circle(17,-8,8);
  ctx.fillStyle='#cfd6dd'; circle(-17,-8,3); circle(17,-8,3);
  ctx.restore();
}
function drawBagger(x,y,ang,face,arm,load,occupied){
  const sooty=occupied&&P.soot>0, yel=sooty?'#5a4a30':'#ffc21a';
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(face,1);
  ctx.fillStyle=INK; rr(-24,-13,48,13,6);
  ctx.fillStyle='#8d99a6'; circle(-16,-6.5,3.4); circle(0,-6.5,3.4); circle(16,-6.5,3.4);
  ctx.fillStyle=yel; rr(-21,-27,40,15,4); rr(-17,-46,23,21,4);
  ctx.fillStyle='#bfe9f5'; rr(-13,-43,16,13,2);
  if(occupied) head(-5,-35,4.6);
  const pxv=8, pyv=-34, bx=pxv+56*Math.cos(arm), by=pyv+56*Math.sin(arm);
  const ex=(pxv+bx)/2+17*Math.sin(arm), ey=(pyv+by)/2-17*Math.cos(arm);
  ctx.lineCap='round'; ctx.lineJoin='round';
  ctx.beginPath(); ctx.moveTo(pxv,pyv); ctx.lineTo(ex,ey); ctx.lineTo(bx,by);
  ctx.strokeStyle=INK; ctx.lineWidth=8; ctx.stroke();
  ctx.strokeStyle=yel; ctx.lineWidth=4.5; ctx.stroke();
  ctx.translate(bx,by); ctx.rotate(arm+.5);
  if(load>0){ ctx.fillStyle='#8a5a3c'; circle(1,-7,7); }
  ctx.fillStyle=INK; ctx.beginPath(); ctx.moveTo(-9,-7); ctx.lineTo(10,-7); ctx.lineTo(12,4); ctx.lineTo(3,11); ctx.lineTo(-9,6); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawLoader(x,y,ang,face,lift,load,occupied){
  const sooty=occupied&&P.soot>0, yel=sooty?'#5a4a30':'#f2a81d', bx=38, by=-12-lift;
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(face,1);
  ctx.fillStyle=yel; rr(-30,-31,46,19,5); rr(-25,-50,23,23,4);
  ctx.fillStyle='#bfe9f5'; rr(-21,-47,16,13,2);
  if(occupied) head(-13,-39,4.6);
  ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(8,-25); ctx.lineTo(bx-6,by-2);
  ctx.strokeStyle=INK; ctx.lineWidth=8; ctx.stroke();
  ctx.strokeStyle=yel; ctx.lineWidth=4.5; ctx.stroke();
  if(load>0){ ctx.fillStyle='#8a5a3c'; circle(bx+2,by-9,5+Math.min(6,load/30)); }
  ctx.fillStyle=INK; ctx.beginPath(); ctx.moveTo(bx-10,by-10); ctx.lineTo(bx+6,by-10); ctx.lineTo(bx+17,by+8); ctx.lineTo(bx-8,by+8); ctx.closePath(); ctx.fill();
  ctx.fillStyle=INK; circle(-17,-10,10); circle(13,-10,10);
  ctx.fillStyle='#cfd6dd'; circle(-17,-10,4); circle(13,-10,4);
  ctx.restore();
}
function drawDumper(x,y,ang,face,load,bed,occupied){
  const sooty=occupied&&P.soot>0;
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(face,1);
  ctx.save(); ctx.translate(-32,-19); ctx.rotate(-bed*.75);
  if(load>0){ const hh=5+load/400*20; ctx.fillStyle='#8a5a3c'; ctx.beginPath(); ctx.moveTo(4,-17); ctx.quadraticCurveTo(22,-17-hh*1.7,42,-17); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle=sooty?'#5a4a30':'#f2a81d'; ctx.beginPath(); ctx.moveTo(-4,-21); ctx.lineTo(48,-21); ctx.lineTo(44,0); ctx.lineTo(4,0); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle=INK; rr(-34,-21,68,6,3);
  ctx.fillStyle=sooty?'#3a3438':'#2f6fd6'; rr(17,-44,19,25,4);
  ctx.fillStyle='#bfe9f5'; rr(23,-41,11,11,2);
  if(occupied) head(28,-34,4.4);
  ctx.fillStyle=INK; circle(-22,-9,9); circle(-3,-9,9); circle(25,-9,9);
  ctx.fillStyle='#cfd6dd'; circle(-22,-9,3.5); circle(-3,-9,3.5); circle(25,-9,3.5);
  ctx.restore();
}
function drawTbm(x,y,ang,face,da,occupied,spin){
  const sooty=occupied&&P.soot>0;
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(face,1);
  ctx.fillStyle=INK; rr(-36,-9,50,9,4);
  ctx.fillStyle=sooty?'#4a4a50':'#9aa7b4'; rr(-38,-47,50,39,8);
  ctx.fillStyle='#ffc21a'; ctx.fillRect(-38,-33,50,7);
  ctx.fillStyle='#bfe9f5'; rr(-31,-45,15,10,2);
  if(occupied) head(-23,-39,4);
  ctx.translate(24*Math.cos(da),-27+24*Math.sin(da)); ctx.rotate(da);
  ctx.fillStyle=INK; ctx.beginPath(); ctx.ellipse(0,0,10,27,0,0,TAU); ctx.fill();
  ctx.fillStyle='#ff8a1f'; ctx.beginPath(); ctx.ellipse(1,0,6.5,23,0,0,TAU); ctx.fill();
  ctx.strokeStyle=INK; ctx.lineWidth=3; ctx.lineCap='round'; ctx.beginPath();
  for(let k=0;k<4;k++){ const t=((spin+k/4)%1)*40-20; ctx.moveTo(-4,t); ctx.lineTo(6,t); }
  ctx.stroke();
  ctx.restore();
}
function drawRocket(x,y,ang,occupied,thrust){
  const sooty=occupied&&P.soot>0;
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang);
  if(thrust){
    ctx.fillStyle='#ff7a1f'; ctx.beginPath(); ctx.moveTo(-8,-5); ctx.lineTo(0,18+Math.random()*18); ctx.lineTo(8,-5); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#ffe066'; ctx.beginPath(); ctx.moveTo(-4,-5); ctx.lineTo(0,8+Math.random()*10); ctx.lineTo(4,-5); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle='#e63946';
  ctx.beginPath(); ctx.moveTo(-9,-24); ctx.lineTo(-21,0); ctx.lineTo(-9,-5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(9,-24); ctx.lineTo(21,0); ctx.lineTo(9,-5); ctx.closePath(); ctx.fill();
  ctx.fillStyle=sooty?'#6a6460':'#f3f1ea';
  ctx.beginPath(); ctx.moveTo(0,-64); ctx.bezierCurveTo(15,-50,14,-20,10,-4); ctx.lineTo(-10,-4); ctx.bezierCurveTo(-14,-20,-15,-50,0,-64); ctx.fill();
  ctx.fillStyle='#e63946';
  ctx.beginPath(); ctx.moveTo(0,-64); ctx.bezierCurveTo(7,-57,10,-51,11.5,-45); ctx.lineTo(-11.5,-45); ctx.bezierCurveTo(-10,-51,-7,-57,0,-64); ctx.fill();
  ctx.fillStyle=INK; circle(0,-31,8); ctx.fillStyle='#bfe9f5'; circle(0,-31,6.4);
  if(occupied) head(0,-30,4.4);
  ctx.restore();
}
function drawPlane(x,y,vx,vy,face,on,ang,occupied){
  const sooty=occupied&&P.soot>0;
  ctx.save(); ctx.translate(x,y-16);
  ctx.rotate(on?ang:Math.atan2(vy,Math.abs(vx)+60)*face);
  ctx.scale(face,1);
  ctx.strokeStyle=INK; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(8,6); ctx.lineTo(10,13); ctx.moveTo(-22,5); ctx.lineTo(-23,12); ctx.stroke();
  ctx.fillStyle=INK; circle(10,13,3.6); circle(-23,12,2.6);
  ctx.fillStyle='#2f6fd6'; ctx.beginPath(); ctx.moveTo(-24,-3); ctx.lineTo(-41,-25); ctx.lineTo(-30,-25); ctx.lineTo(-12,-7); ctx.closePath(); ctx.fill();
  ctx.fillStyle=sooty?'#5a4a30':'#ffc21a'; ctx.beginPath(); ctx.ellipse(0,0,38,11,0,0,TAU); ctx.fill();
  if(occupied) head(5,-10,5);
  ctx.globalAlpha=.6; ctx.fillStyle='#bfe9f5'; ctx.beginPath(); ctx.arc(6,-7,10,Math.PI,0); ctx.closePath(); ctx.fill(); ctx.globalAlpha=1;
  ctx.fillStyle='#2f6fd6'; rr(-12,1,30,6,3);
  ctx.fillStyle=INK; ctx.beginPath(); ctx.ellipse(39,0,2.5,3+13*Math.abs(Math.sin(time*31)),0,0,TAU); ctx.fill();
  ctx.restore();
}
function drawCart(x,y,ang,dir,occupied,fast){
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(1,dir);
  ctx.fillStyle=INK; circle(-10,-4,4); circle(10,-4,4);
  if(occupied){
    if(fast){ ctx.strokeStyle='#2f6fd6'; ctx.lineWidth=3.5; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(-3,-22); ctx.lineTo(-8,-38); ctx.moveTo(3,-22); ctx.lineTo(8,-38); ctx.stroke(); }
    head(0,-27,6);
  }
  ctx.fillStyle='#7b4fd6'; rr(-17,-21,34,15,5);
  ctx.fillStyle='#ffd23f'; rr(-17,-13,34,3,1);
  ctx.restore();
}
function drawTree(tr){
  const x=tr.x+(tr.sh>time&&!reduced?2*Math.sin(time*40):0), y=tr.gy, h=tr.h, s=tr.s;
  if(tr.state===3) return;
  if(tr.state===2){
    ctx.strokeStyle='#2b2528'; ctx.lineCap='round'; ctx.lineWidth=6*s;
    ctx.beginPath(); ctx.moveTo(x,y+4); ctx.lineTo(x,y-h*.75); ctx.stroke();
    ctx.lineWidth=3*s; ctx.beginPath(); ctx.moveTo(x,y-h*.5); ctx.lineTo(x-14*s,y-h*.8); ctx.moveTo(x,y-h*.6); ctx.lineTo(x+12*s,y-h*.9); ctx.stroke();
    return;
  }
  if(tr.kind){ drawFlora(tr,x,y,h,s); return; }
  if(tr.fir){
    const w=0, on=tr.state===1;
    ctx.fillStyle='#7a4a2c'; ctx.fillRect(x-3*s,y-h*.3,6*s,h*.3+6);
    for(let k=0;k<3;k++){
      const by=y-h*(.22+k*.26), hw=(22-k*5)*s, th=h*.36;
      ctx.fillStyle=on?'#7a5a24':(k%2?'#2f8f4a':'#27804a'); ctx.beginPath(); ctx.moveTo(x-hw+w,by); ctx.lineTo(x+w,by-th); ctx.lineTo(x+hw+w,by); ctx.closePath(); ctx.fill();
      if(!on){ ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(x+w,by-th); ctx.lineTo(x-hw*.5+w,by-th*.5); ctx.lineTo(x-hw*.2+w,by-th*.38); ctx.lineTo(x+w,by-th*.52); ctx.lineTo(x+hw*.25+w,by-th*.36); ctx.lineTo(x+hw*.5+w,by-th*.5); ctx.closePath(); ctx.fill(); }
    }
    return;
  }
  ctx.fillStyle='#7a4a2c'; ctx.fillRect(x-4*s,y-h*.7,8*s,h*.7+6);
  ctx.fillStyle=tr.state===1?'#7a5a24':'#2f8f4a';
  circle(x-15*s,y-h+10,17*s); circle(x+15*s,y-h+10,17*s);
  ctx.fillStyle=tr.state===1?'#96702a':'#3fa85a';
  circle(x,y-h-6,22*s);
}
function drawCloud(c){
  const s=c.s;
  ctx.fillStyle='rgba(255,255,255,.88)';
  circle(c.x-22*s,c.y+4*s,16*s); circle(c.x-3*s,c.y-7*s,22*s); circle(c.x+20*s,c.y+2*s,17*s);
  rr(c.x-36*s,c.y+4*s,72*s,15*s,7*s);
}
function arrow(x,y,ang,r,col){
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang);
  ctx.beginPath(); ctx.moveTo(r,0); ctx.lineTo(-r*.7,-r*.85); ctx.lineTo(-r*.3,0); ctx.lineTo(-r*.7,r*.85); ctx.closePath();
  ctx.fillStyle=col||'#ffd23f'; ctx.fill(); ctx.strokeStyle=INK; ctx.lineWidth=r*.2; ctx.lineJoin='round'; ctx.stroke();
  ctx.restore();
}
const MOONC=[[-90,-60,38],[60,-110,26],[110,10,44],[-20,70,30],[-140,60,22],[30,-20,18],[-60,-160,20]];
function drawSpace(){
  const R=rlm();
  if(R){
    /* Über einer fremden Welt: die Linie, hinter der es heim zur Erde geht */
    const vw=W/S, ly=R.exit+20;
    if(Math.abs(ly-cam.y)<H/S/2+60){ ctx.strokeStyle='rgba(120,200,255,.6)'; ctx.lineWidth=3; ctx.setLineDash([14,12]); ctx.beginPath(); ctx.moveTo(cam.x-vw/2-20,ly); ctx.lineTo(cam.x+vw/2+20,ly); ctx.stroke(); ctx.setLineDash([]); emo('🌍',cam.x,ly-24,24); }
    return;
  }
  for(const o of ORBS) if(o.i&&Math.abs(o.x-cam.x)<1700) drawOrb(o);
  drawFar();
  ctx.strokeStyle='#f0d9a0'; ctx.lineWidth=9; ctx.lineCap='butt';
  ctx.beginPath(); ctx.ellipse(1500,-3700,140,34,-.3,Math.PI,TAU); ctx.stroke();
  ctx.fillStyle='#e2a94e'; circle(1500,-3700,78);
  ctx.fillStyle='#cf9440'; ctx.beginPath(); ctx.ellipse(1500,-3690,74,14,-.3,0,TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(1500,-3700,140,34,-.3,0,Math.PI); ctx.stroke();
  ctx.fillStyle='#d9623f'; circle(5800,-4900,62);
  ctx.fillStyle='#b84a2e'; circle(5780,-4915,16); circle(5822,-4880,10);
  ctx.fillStyle='#cfd3dc'; circle(MOON.x,MOON.y,MOON.r);
  ctx.fillStyle='#b3b8c4'; for(const c of MOONC) circle(MOON.x+c[0],MOON.y+c[1],c[2]);
}
function knob(x,y,r){
  ctx.fillStyle='#ffd23f'; circle(x,y,r);
  ctx.strokeStyle=INK; ctx.lineWidth=2.5; ctx.lineCap='round'; ctx.beginPath(); ctx.arc(x,y,r,0,TAU);
  ctx.moveTo(x-r*.5,y); ctx.lineTo(x+r*.5,y); ctx.moveTo(x,y-r*.5); ctx.lineTo(x,y+r*.5); ctx.stroke();
}
function hills(f,off,amp,col,k){
  ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(0,H+2);
  for(let sx=0;sx<=W+24;sx+=24){
    const wx=cam.x*f+sx/S;
    ctx.lineTo(sx,H/2+(-cam.y*f+off+amp*Math.sin(wx*k)+amp*.5*Math.sin(wx*k*2.3+1))*S);
  }
  ctx.lineTo(W+24,H+2); ctx.closePath(); ctx.fill();
}
const LB=2*(MAX_LAVA+2000), WB=2*(MAX_WATER+2000);
const bufA=new Int16Array(LB), bufB=new Int16Array(LB), bufC=new Int16Array(LB), bufW=new Int16Array(WB), bufV=new Int16Array(WB), bufF=new Int16Array(2*(MAX_FIRE+800));
function fillCells(buf,n,col,lift){
  if(!n) return;
  ctx.fillStyle=col; ctx.beginPath();
  for(let i=0;i<n;i+=2) ctx.rect(buf[i]*CELL,TOP+buf[i+1]*CELL-lift,CELL+.5,CELL+.5+lift);
  ctx.fill();
}

function draw(){
  const vw=W/S, vh=H/S;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  const md=mood(), spc=realm&&BT[bio[clamp(Math.floor(cam.x/CELL),0,GX-1)]].space, nl=md.nl, alt=spc?0:clamp(-cam.y/1100,0,1), sp=clamp((-cam.y-1500)/1400,0,1), sa=spc?1:Math.max(sp,nl*.9);
  const sky=ctx.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,mix(lerpC(lerpC(md.st,SKY_TH,alt),NIGHT_T,nl),SPACE_T,sp)); sky.addColorStop(1,mix(lerpC(lerpC(md.sb,SKY_BH,alt),NIGHT_B,nl),SPACE_B,sp));
  ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
  if(sa>0){
    ctx.fillStyle='#ffffff';
    for(const st of starsBg){
      const sx=((st[0]*W-cam.x*.04)%W+W)%W, sy=((st[1]*H-cam.y*.04)%H+H)%H;
      ctx.globalAlpha=sa*(.45+.55*Math.abs(Math.sin(time*st[3]+st[0]*40)));
      ctx.fillRect(sx,sy,st[2],st[2]);
    }
    ctx.globalAlpha=1;
  }
  if(cam.y<-5200) drawNebula();
  /* Tagsüber scheint die Sonne, nachts der Mond. Ein Tipp auf die Sonne schaltet um. */
  const sunX=W-74, sunY=H*.34-cam.y*S*.03;
  if(nl<.98){ ctx.globalAlpha=1-nl; ctx.fillStyle='rgba(255,210,63,.28)'; circle(sunX,sunY,46*S); ctx.fillStyle='#ffd23f'; circle(sunX,sunY,30*S); }
  if(nl>.02){ ctx.globalAlpha=nl; ctx.fillStyle='rgba(244,240,216,.22)'; circle(sunX,sunY,40*S); ctx.fillStyle='#f4f0d8'; circle(sunX,sunY,26*S); ctx.fillStyle='#d8d2b4'; circle(sunX-8*S,sunY-6*S,6*S); circle(sunX+9*S,sunY+7*S,4*S); }
  ctx.globalAlpha=1;
  /* Von fremden Welten aus sieht man die Erde am Himmel. */
  if(realm){ const ex=W*.3, ey=H*.32-cam.y*S*.02, er=34*S; ctx.fillStyle='rgba(120,190,255,.25)'; circle(ex,ey,er*1.25); ctx.fillStyle='#3aa0e8'; circle(ex,ey,er); ctx.fillStyle='#58b548'; circle(ex-er*.35,ey-er*.2,er*.35); circle(ex+er*.3,ey+er*.3,er*.28); ctx.fillStyle='rgba(255,255,255,.8)'; circle(ex+er*.1,ey-er*.6,er*.18); }
  hills(.22,-30,45,md.h1,.004);
  if(skyRb>time&&nl<.5){ ctx.globalAlpha=Math.min(.75,(skyRb-time)*.4)*(1-nl); ctx.lineWidth=7*S; for(let k=0;k<6;k++){ ctx.strokeStyle=RBC[k]; ctx.beginPath(); ctx.arc(W*.5,H*.66,W*.46-k*7*S,Math.PI,0); ctx.stroke(); } ctx.globalAlpha=1; }
  hills(.48,-2,30,md.h2,.007);

  const shx=(shake>0&&!reduced)?(Math.random()-.5)*shake*16:0, shy=(shake>0&&!reduced)?(Math.random()-.5)*shake*16:0;
  ctx.setTransform(DPR*S,0,0,DPR*S,(W/2-cam.x*S+shx)*DPR,(H/2-cam.y*S+shy)*DPR);
  const x0=cam.x-vw/2-20, x1=cam.x+vw/2+20, y0=cam.y-vh/2-20, y1=cam.y+vh/2+20;

  drawFinds(false,x0,x1,y0,y1);
  for(const c of clouds) if(c.x>x0-70&&c.x<x1+70&&c.y>y0-50&&c.y<y1+50) drawCloud(c);
  if(y0<-2500) drawSpace();
  for(const tr of trees) if(tr.x>x0-40&&tr.x<x1+40) drawTree(tr);
  drawCells(x0,x1,y0,y1);
  drawFinds(true,x0,x1,y0,y1);
  for(const o of ST.props) if(o.x>x0-60&&o.x<x1+60) drawProp(o);
  drawWinter(x0,x1);
  drawWorldBack(x0,x1,y0,y1);
  drawDeep(x0,x1,y0,y1);

  for(const T of ST.tracks){
    if(T.maxX<x0||T.minX>x1) continue;
    if(T.rb){ ctx.lineWidth=3.2; ctx.lineCap='round'; ctx.lineJoin='round'; for(let k=0;k<6;k++){ ctx.strokeStyle=RBC[k]; ctx.beginPath(); ctx.moveTo(T.pts[0][0],T.pts[0][1]+k*3-8); for(let i=2;i<T.pts.length;i+=2) ctx.lineTo(T.pts[i][0],T.pts[i][1]+k*3-8); ctx.stroke(); } continue; }
    ctx.strokeStyle='#7d8a99'; ctx.lineWidth=3; ctx.lineCap='butt'; ctx.beginPath();
    for(let i=0;i<T.pts.length;i+=9){
      const p=T.pts[i], cx=Math.floor(p[0]/CELL), r0=Math.floor((p[1]-TOP)/CELL);
      if(r0<0||grid[r0*GX+cx]>=4) continue;
      const r=Math.min(colTop(cx,r0),r0+70);
      if(r-r0>2){ ctx.moveTo(p[0],p[1]); ctx.lineTo(p[0],TOP+r*CELL+2); }
    }
    ctx.stroke();
    ctx.lineJoin='round'; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(T.pts[0][0],T.pts[0][1]);
    for(let i=1;i<T.pts.length;i++) ctx.lineTo(T.pts[i][0],T.pts[i][1]);
    ctx.strokeStyle='#a81c33'; ctx.lineWidth=7; ctx.stroke();
    ctx.strokeStyle='#ff6f86'; ctx.lineWidth=2.6; ctx.stroke();
    if(!(P.mode==='coaster'&&P.track===T)){ const q=trackAt(T,10); drawCart(q.x,q.y,Math.atan2(q.ty,q.tx),T.dir,false,false); }
  }
  drawZips(x0,x1);
  drawLayer(ctx,'back',x0,x1);
  drawScope(x0,x1);
  drawLayer(ctx,'mid',x0,x1);
  drawLayer(ctx,'mob',x0,x1);
  if(ST.tool==='track'){
    for(const T of ST.tracks){ const a=T.pts[0], b=T.pts[T.pts.length-1]; knob(a[0],a[1],8); knob(b[0],b[1],11); }
  }
  if(stroke&&stroke.length>1){
    ctx.strokeStyle='#e0304a'; ctx.lineWidth=5; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.setLineDash([10,9]);
    ctx.beginPath(); ctx.moveTo(stroke[0][0],stroke[0][1]);
    for(let i=1;i<stroke.length;i++) ctx.lineTo(stroke[i][0],stroke[i][1]);
    ctx.stroke(); ctx.setLineDash([]);
  }

  let o=parked.plane; if(o) drawPlane(o.x,o.y,0,0,o.face,true,o.ang,false);
  o=parked.rocket; if(o) drawRocket(o.x,o.y,0,false,false);
  o=parked.car; if(o) drawCar(o.x,o.y,o.ang,o.face,false,false);
  o=parked.dumper; if(o) drawDumper(o.x,o.y,o.ang,o.face,o.load,0,false);
  o=parked.loader; if(o) drawLoader(o.x,o.y,o.ang,o.face,o.lift||0,o.load,false);
  o=parked.tbm; if(o) drawTbm(o.x,o.y,o.ang,o.face,o.da||0,false,0);
  o=parked.bagger; if(o) drawBagger(o.x,o.y,o.ang,o.face,o.arm,o.load,false);
  o=parked.sub; if(o) drawSub(o.x,o.y,o.ang,o.face,false);
  o=parked.balloon; if(o) drawBalloon(o.x,o.y,o.ang,false,false);
  o=parked.heli; if(o) drawHeli(o.x,o.y,o.ang,o.face,false,0);
  o=parked.boat; if(o) drawBoat(o.x,o.y,o.ang,o.face,false,0);
  o=parked.bug; if(o) drawBug(o.x,o.y,o.ang,o.face,false,0);
  if(ghost){
    if(ghost.kind==='rocket') drawRocket(ghost.x,ghost.y,Math.atan2(ghost.vx,-ghost.vy-200)*.5,false,false);
    else drawPlane(ghost.x,ghost.y,ghost.vx,ghost.vy,ghost.vx>=0?1:-1,false,0,false);
  }

  if(P.mode==='walk'){
    if(P.chute) drawChute(P.x,P.y);
    drawKid(P.x,P.y,P.face,P.on?P.run:1.1,!!P.zip||P.chute||(!P.on&&P.vy>220));
    drawHandTool();
  }
  else if(P.mode==='car') drawCar(P.x,P.y,P.ang,P.face,true,P.turbo>0);
  else if(P.mode==='bagger') drawBagger(P.x,P.y,P.ang,P.face,P.arm,P.load,true);
  else if(P.mode==='loader') drawLoader(P.x,P.y,P.ang,P.face,P.lift,P.load,true);
  else if(P.mode==='dumper') drawDumper(P.x,P.y,P.ang,P.face,P.load,Math.min(1,P.bed),true);
  else if(P.mode==='tbm') drawTbm(P.x,P.y,P.ang,P.face,P.da,true,Math.abs(P.vx)>5?time*2.5:0);
  else if(P.mode==='rocket') drawRocket(P.x,P.y,P.ang,true,keys.u&&!ST.paused);
  else if(P.mode==='plane') drawPlane(P.x,P.y,P.vx,P.vy,P.face,P.on,P.ang,true);
  else if(P.mode==='sub') drawSub(P.x,P.y,P.ang,P.face,true);
  else if(P.mode==='balloon') drawBalloon(P.x,P.y,P.ang,true,keys.u&&!ST.paused);
  else if(P.mode==='bug') drawBug(P.x+P.face*15*Math.min(1,Math.abs(P.ang)/1.57),P.y,P.ang,P.face,true,P.run);
  else if(P.mode==='boat') drawBoat(P.x,P.y,P.ang,P.face,true,boatWet()?Math.min(1,Math.abs(P.vx)/200):0);
  else if(P.mode==='heli') drawHeli(P.x,P.y,P.ang,P.face,true,reduced?.6:time*(P.on?6:22));
  else if(P.mode==='ski'){ if(P.ball>0) drawRoll(); else drawSkier(P.x,P.y,P.ang,P.face,keys.d&&P.on,!P.on); }
  else if(P.mode==='dragon'){ ctx.save(); ctx.translate(P.x,P.y); ctx.rotate(P.ang); drawDragon(0,0,1.9,P.face,1,reduced?0:Math.sin(time*(P.on?3:10)),true); ctx.restore(); }
  else if(P.track.lift) drawGondola(P.x,P.y-46,true);
  else drawCart(P.x,P.y,P.ang,P.track.dir,true,P.v>300);
  if(hero.pet){
    const pe=PETS[hero.pet]||'🐉', pf=hero.pet==='dragon'||hero.pet==='ghost'||hero.pet==='ufo';
    ctx.font='20px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#000';
    ctx.fillText(pe,pet.x,pet.y-(pf?26:-4)+(reduced?0:2.5*Math.sin(time*7)));
  }
  for(const bm of bombs){
    ctx.fillStyle='#3a3438'; circle(bm.x,bm.y,7);
    ctx.fillStyle=(bm.t*8|0)%2?'#ffd23f':'#ff5a1f'; circle(bm.x+6,bm.y-8,3);
  }
  drawFront();
  drawWorldFront();

  drawDark();
  drawLayer(ctx,'glow',x0,x1);
  if(bx1>=bx0){
    const cx0=Math.max(bx0,Math.floor(x0/CELL),1), cx1=Math.min(bx1,Math.floor(x1/CELL),GX-2);
    const cy0=Math.max(by0,Math.floor((y0-TOP)/CELL),1), cy1=Math.min(by1,Math.floor((y1-TOP)/CELL),GY-2);
    let nA=0,nB=0,nC=0,nW=0,nV=0,nF=0; const ph=(time*4)|0, LA=LB-2, LW=WB-2, LF=bufF.length-2;
    for(let y=cy0;y<=cy1;y++){
      const row=y*GX, xb=Math.min(cx1,rx1[y]);
      for(let x=Math.max(cx0,rx0[y]);x<=xb;x++){
        const t=grid[row+x];
        if(t===0||t>3) continue;
        const up=grid[row-GX+x];
        if(t===LAVA){
          if(up!==LAVA&&up<4){
            if(nC<LA){bufC[nC++]=x;bufC[nC++]=y;}
            if(Math.random()<.003) spawn(2,x*CELL+3,TOP+y*CELL,(Math.random()-.5)*14,-28-Math.random()*30,.9,1.6);
          }
          else if((x*7+y*13+ph)%6===0){ if(nB<LA){bufB[nB++]=x;bufB[nB++]=y;} }
          else if(nA<LA){bufA[nA++]=x;bufA[nA++]=y;}
        }
        else if(t===WATER){
          if(up===0){ if(nV<LW){bufV[nV++]=x;bufV[nV++]=y;} }
          else if(nW<LW){bufW[nW++]=x;bufW[nW++]=y;}
        }
        else if(nF<LF){bufF[nF++]=x;bufF[nF++]=y;}
      }
    }
    fillCells(bufA,nA,'#ff5a1f',0); fillCells(bufB,nB,'#e2331c',0); fillCells(bufC,nC,'#ffc233',1.5);
    fillCells(bufW,nW,MD.w1,0); fillCells(bufV,nV,MD.w2,0);
    for(let pass=0;pass<2;pass++){
      ctx.fillStyle=pass?'#ffe066':'#ff7a1f'; ctx.beginPath();
      const w=pass?2.6:5, k=pass?.55:1;
      for(let i=0;i<nF;i+=2){
        const fx=bufF[i]*CELL+3, by=TOP+(bufF[i+1]+1)*CELL;
        const hgt=(13+6*Math.sin(time*13+bufF[i]*1.7+bufF[i+1]))*k, sway=2.5*Math.sin(time*9+bufF[i]*2.3);
        ctx.moveTo(fx-w,by); ctx.quadraticCurveTo(fx-w-1,by-hgt*.5,fx+sway,by-hgt);
        ctx.quadraticCurveTo(fx+w+1,by-hgt*.5,fx+w,by); ctx.closePath();
      }
      ctx.fill();
    }
  }

  for(const p of parts){
    if(p.x<x0-60||p.x>x1+60||p.y<y0-60||p.y>y1+60) continue;
    const a=p.life/p.max; let col, r=p.size;
    if(p.type===9){
      ctx.globalAlpha=Math.min(1,a*2.5); ctx.font='700 '+p.size+'px system-ui,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.lineWidth=3.5; ctx.lineJoin='round'; ctx.strokeStyle=INK; ctx.strokeText(p.c,p.x,p.y); ctx.fillStyle=p.col; ctx.fillText(p.c,p.x,p.y); continue;
    }
    if(p.type===8){
      ctx.globalAlpha=Math.min(1,a*2); ctx.font=Math.round(p.size*(2-a))+'px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle='#000'; ctx.fillText(p.c,p.x,p.y); continue;
    }
    if(p.type===0){ ctx.globalAlpha=a*.5; col='#5b5560'; }
    else if(p.type===1){ ctx.globalAlpha=Math.min(1,a*1.6); col=a>.5?'#ffd23f':'#ff6a1f'; r=p.size*(.3+a*.7); }
    else if(p.type===2){ ctx.globalAlpha=a; col='#ffb321'; }
    else if(p.type===3){ ctx.globalAlpha=a*.7; col='#c9a57a'; }
    else if(p.type===4){ ctx.globalAlpha=1; col='#ff5a1f'; }
    else if(p.type===6){ ctx.globalAlpha=Math.min(1,a*2); col=p.c; }
    else if(p.type===7){ ctx.globalAlpha=a*.6; col='#ffffff'; }
    else if(p.type===10){ ctx.globalAlpha=Math.min(1,a*1.6); col='#ffffff'; }
    else if(p.type===12){ ctx.globalAlpha=a*.7; col=p.c; }
    else { ctx.globalAlpha=a; col='#ffe066'; }
    ctx.fillStyle=col; circle(p.x,p.y,Math.max(.5,r));
  }
  ctx.globalAlpha=1;
  drawSnowfall();
  drawMood();

  { const qp=questPoint(); if(qp) pointTo(qp[0],qp[1],'#58b548'); }
  if(FX.sonar>0){ const so=sonarTarget(); if(so) pointTo(so[0],so[1],'#ffd23f'); }
  const gp=guidePoint(); if(gp) pointTo(gp[0],gp[1],'#ff8a1f');
  if(hero.up.compass>0&&nearF&&!nearF.got&&nearD<[0,900,2600,1e9][hero.up.compass]) pointTo(nearF.x,nearF.y,'#5fd4e6');
}

function actIcon(){
  if(P.zip) return 'jump';
  if(P.mode==='walk'){ if(zipNear()) return 'hook'; if(nearScope()) return 'scope'; const da=deepIcon(); if(da) return da; }
  if(P.mode==='walk') return nearLift()?'lift':ST.tool==='bow'?'bow':DIGT[ST.tool]?'dig':(P.chute?'down':(P.on||P.air<.15?'jump':'chute'));
  if(P.mode==='ski') return nearLift()?'lift':(P.on||P.ball>0?'jump':'spin');
  if(P.mode==='dragon') return 'flame';
  if(P.mode==='sub') return 'sonar';
  if(P.mode==='boat') return boatWet()?'horn':'exit';
  if(P.mode==='heli') return P.on&&!heliLoad?'exit':'hook';
  if(P.mode==='car') return 'turbo';
  if(P.mode==='bagger') return (P.arm<-.15&&P.load>0)?'down':'dig';
  if(P.mode==='loader') return (P.lift>18&&P.load>0)?'down':'dig';
  if(P.mode==='dumper') return 'down';
  if(P.mode==='tbm') return 'dig';
  if(P.mode==='plane'||P.mode==='rocket'||P.mode==='balloon') return P.on?'exit':'chute';
  return 'exit';
}

function resetWorld(seed){
  SEED=seed||newSeed();
  /* Eine neue Erde: Mond und Planeten werden dann auch neu. */
  setRealm('');
  try{ localStorage.removeItem(K_REALM); for(const k in FOG) delete FOG[k]; for(const k in MKS) delete MKS[k]; Object.keys(localStorage).forEach(function(k){ if(k.indexOf(K_FOG)===0||k.indexOf(K_MARKS)===0) localStorage.removeItem(k); }); }catch(_){}
  idbDo('readwrite',function(st){ for(const id in RLM) st.delete(realmKey(id)); return st.count(); }).catch(function(){});
  ST.seen={}; ST.eggGot={}; ST.lootGot={}; ST.orbGot={}; ST.matGot={}; ST.pzGot={};
  shapeWorld();
  gen();
  parts.length=0; ghost=null; stroke=null; strokeId=null;
  for(const tr of trees){ tr.state=0; tr.t=0; }
  ST.tracks=[]; ST.zips=[]; P.zip=null; const d=demoTrack(); if(d) ST.tracks.push(d);
  P.mode='walk'; P.x=820; P.y=surfaceY(820); P.vx=0; P.vy=0; P.on=true; P.face=1; P.chute=false; P.soot=0; P.hurt=0; P.turbo=0; P.track=null; P.load=0; P.arm=.75; P.ball=0; P.spin=0; P.rot=0; P.frost=0;
  for(const k in parked) parked[k]=null;
  heliLoad='';
  parked.car={x:720,y:surfaceY(720),vy:0,ang:0,face:1,arm:0,load:0};
  parked.plane={x:630,y:surfaceY(630),vy:0,ang:0,face:1};
  parked.rocket={x:556,y:surfaceY(556),vy:0,ang:0,face:1,load:0};
  cam.x=P.x; cam.y=P.y-80; ST.tool=null; pan.x=0; pan.y=0; ST.props=[]; bombs.length=0;
  deepHome();
  hideFinds();
  stEnter();
  syncUI();
  scanMobile();
}

/* ---------- Spielprotokoll für Eltern: Was er wann spielt und wie er Aufgaben löst. Liegt nur auf diesem Gerät, in einer eigenen Datenbank, damit ein Fehler hier nie den Spielstand trifft. Das Protokoll schaut nur zu: Nichts davon ändert Belohnung oder Schwierigkeit. ---------- */
/* Was das Protokoll vom Spiel liest (log/ darf state/ nicht importieren, ADR 0001). */
const LP={
  get energy(){ return ST.energy; },
  get frozen(){ return ST.frozen; },
  get paused(){ return ST.paused; },
  get pzc(){ return pzc; },
  get ready(){ return ST.ready; },
  get realm(){ return realm; },
  get tool(){ return ST.tool; },
  get MAXE(){ return MAXE; },
  get P(){ return P; },
  get SEG(){ return SEG; },
  get parts(){ return parts; },
  get fireCount(){ return fireCount; },
  get lavaCount(){ return lavaCount; },
  get waterCount(){ return waterCount; },
  errAdd, uiOpen, $
};
const LOG=logWith(LP);
/* ---------- Elternansicht: 3 Sekunden auf eine freie Stelle im Menü drücken, dann eine Malaufgabe. Die Schranke wird nicht vorgelesen, sonst wäre sie nur ein weiteres Rätsel. ---------- */
const QNAME={count:'Zählen',fb:'Blitzblick',nb:'Nachbarzahl',zl:'Zerlegen',syl:'Silben',rhy:'Reime',add:'Plus',sub:'Minus',seq:'Zahlenfolge',anlaut:'Anlaut',case:'Groß/klein',word:'Wort zum Bild'};
const SNAME={quiz:'Rechnen/Buchstaben',pz:'Rätsel',play:'Sandbox',empty:'Sandbox, Akku leer',ui:'Menüs'};
const SCOL={quiz:'#2f6fd6',pz:'#7b4fd6',play:'#58b548',empty:'#ff5a1f',ui:'#c4bca6'};
const PMIN=20;
let pgA=0, pgB=0, pgIn='', pgMiss=0, parRange=7, parDel=false, holdT=0;
$('menu').querySelector('.sheet').addEventListener('pointerdown',function(e){
  if(e.target.closest('button')) return;
  clearTimeout(holdT); holdT=setTimeout(pgOpen,3000);
});
['pointerup','pointercancel','pointerleave'].forEach(function(n){ $('menu').querySelector('.sheet').addEventListener(n,function(){ clearTimeout(holdT); }); });
function pgOpen(){
  $('menu').hidden=true; pgA=ri(3,9); pgB=ri(3,9); pgIn=''; pgMiss=0;
  speakStop();
  pgDraw(); $('pgate').hidden=false;
}
function pgDraw(){ $('pg-q').textContent=pgA+' × '+pgB+' = '+(pgIn||'?'); }
$('pg-keys').innerHTML=[1,2,3,4,5,6,7,8,9,'⌫',0,'OK'].map(function(k){ return '<button class="pzb sm" data-k="'+k+'">'+k+'</button>'; }).join('');
$('pg-keys').addEventListener('click',function(e){
  const b=e.target.closest('[data-k]'); if(!b) return;
  const k=b.dataset.k;
  if(k==='⌫') pgIn=pgIn.slice(0,-1);
  else if(k==='OK'){
    if(+pgIn===pgA*pgB){ $('pgate').hidden=true; parOpen(); return; }
    pgIn=''; if(++pgMiss>=2){ $('pgate').hidden=true; return; }
    pgA=ri(3,9); pgB=ri(3,9);
  }
  else if(pgIn.length<3) pgIn+=k;
  pgDraw();
});
$('pgate').querySelector('.xb').addEventListener('click',function(){ $('pgate').hidden=true; });
$('par').querySelector('.xb').addEventListener('click',function(){ $('par').hidden=true; });
function parOpen(){
  parDel=false; parStoreInfo(); $('par').hidden=false; $('par-body').innerHTML='<p>Lade …</p>';
  LOG.flush();
  setTimeout(parLoad,150);
}
function parGet(){
  return LOG.trx(['ev','day'],'readonly').then(function(tx){
    return new Promise(function(res,rej){
      const o={ev:[],day:[]};
      tx.objectStore('ev').getAll().onsuccess=function(e){ o.ev=e.target.result; };
      tx.objectStore('day').getAll().onsuccess=function(e){ o.day=e.target.result; };
      tx.oncomplete=function(){ res(o); }; tx.onerror=function(){ rej(tx.error); };
    });
  });
}
function med(a){ if(!a.length) return null; const s=a.slice().sort(function(x,y){return x-y;}), m=s.length>>1; return s.length%2?s[m]:(s[m-1]+s[m])/2; }
function pct(x){ return Math.round(x*100)+' %'; }
function mins(s){ return s<90?Math.round(s)+' s':Math.round(s/60)+' min'; }
/* Geraten: erster Tap falsch und dabei zu schnell (vor Ende der Vorlesung), Taps dicht hintereinander oder alle Antworten durchprobiert. */
function guessed(e){
  if(!e.taps.length||e.first) return false;
  const t=e.taps, lim=e.tts||1500;
  if(t[0][1]<lim) return true;
  for(let i=1;i<t.length;i++) if(t[i][1]-t[i-1][1]<700) return true;
  return t.length>=e.n;
}
function parLoad(){
  parGet().then(parRender,function(){ $('par-body').innerHTML='<p>Das Protokoll ist auf diesem Gerät nicht lesbar (privater Modus oder blockierter Speicher).</p>'; });
}
function parRender(o){
  const now=Date.now(), from=LOG.day(now-(parRange-1)*864e5);
  const ev=o.ev.filter(function(e){ return e.d>=from; }), days=o.day.filter(function(r){ return r.d>=from; });
  const sum={quiz:0,pz:0,play:0,empty:0,ui:0,idle:0}; let sess=0;
  days.forEach(function(r){ for(const k in sum) sum[k]+=r.sec[k]||0; sess+=r.sess|0; });
  const act=sum.quiz+sum.pz+sum.play+sum.empty+sum.ui, learn=sum.quiz+sum.pz;
  let h='<div class="par-tabs">'+[1,7,30].map(function(n){ return '<button data-r="'+n+'"'+(n===parRange?' class="on"':'')+'>'+(n===1?'Heute':n+' Tage')+'</button>'; }).join('')+'</div>';
  h=parNews()+h;
  h+=parSchool();
  h+=parSafe();
  h+=parVoice();
  h+='<h3>Zeit</h3>';
  if(!act) h+='<p>Noch keine Spielzeit in diesem Zeitraum.</p>';
  else{
    h+='<p><b>Lernanteil '+pct(learn/act)+'</b> von '+mins(act)+' aktiver Zeit in '+sess+' Sitzung'+(sess===1?'':'en')+'. Dazu '+mins(sum.idle)+' ohne Berührung.</p>';
    h+=parBars(o.day);
    h+='<div class="par-leg">'+Object.keys(SNAME).map(function(k){ return '<span><i style="background:'+SCOL[k]+'"></i>'+SNAME[k]+' '+mins(sum[k])+'</span>'; }).join('')+'</div>';
  }
  h+=parSand(days,act);
  const qs=ev.filter(function(e){ return e.k==='q'&&e.taps.length; });
  const qo=ev.filter(function(e){ return e.k==='qo'; }).length, xq=ev.filter(function(e){ return e.k==='x'&&e.what==='quiz'; }).length, xs=ev.filter(function(e){ return e.k==='x'&&e.what==='switch'; }).length;
  const ps=ev.filter(function(e){ return e.k==='p'; }), pq=ps.filter(function(e){ return e.end==='quit'; }).length;
  h+='<h3>Umgehung</h3><table><tr><td>Sandbox mit leerem Akku</td><td'+(act&&sum.empty>learn&&sum.empty>300?' class="warn"':'')+'>'+mins(sum.empty)+'</td></tr>';
  h+='<tr><td>Lernaufgaben-Fenster geöffnet</td><td>'+qo+'</td></tr><tr><td>davon vorzeitig geschlossen</td><td>'+xq+'</td></tr>';
  h+='<tr><td>„Lieber ein Rätsel“ gewählt</td><td>'+xs+'</td></tr><tr><td>Rätsel ohne Lösung geschlossen</td><td>'+pq+' von '+ps.length+'</td></tr></table>';
  h+='<h3>Rechnen und Buchstaben</h3>';
  h+=parFacts();
  if(!qs.length) h+='<p>Noch keine beantworteten Aufgaben.</p>';
  else{
    h+='<p>Denkanteil = Treffer beim ersten Tippen, um Zufall bereinigt. 0 % ist reines Raten, 100 % immer gleich richtig. Unter '+PMIN+' Aufgaben grau.</p>';
    h+='<table><tr><th>Typ</th><th>Anzahl</th><th>Denkanteil</th><th>Zeit bis 1. Tipp</th><th>geraten</th></tr>';
    const by={}; qs.forEach(function(e){ (by[e.ty]=by[e.ty]||[]).push(e); });
    const row=function(name,a){
      const p=a.filter(function(e){ return e.first; }).length/a.length, c=a.reduce(function(s,e){ return s+1/e.n; },0)/a.length;
      const k=(p-c)/(1-c), few=a.length<PMIN, m=med(a.map(function(e){ return e.taps[0][1]; })), g=a.filter(guessed).length/a.length;
      return '<tr'+(few?' class="few"':'')+'><td>'+name+'</td><td>'+a.length+'</td><td'+(!few&&k<.3?' class="warn"':'')+'>'+(k<0?'0 % ↓':pct(k))+'</td><td>'+(m/1000).toFixed(1)+' s</td><td'+(!few&&g>.3?' class="warn"':'')+'>'+pct(g)+'</td></tr>';
    };
    Object.keys(QNAME).forEach(function(t){ if(by[t]) h+=row(QNAME[t],by[t]); });
    h+=row('<b>Alle</b>',qs)+'</table>';
  }
  h+=parStumble(qs);
  h+='<div class="par-act"><button id="par-sheet">Übungsblatt drucken</button></div>';
  h+='<h3>Rätselmaschinen</h3><table><tr><th>Maschine</th><th>Stufe</th><th>gelöst</th><th>Fehler</th><th>Tipps</th><th>abgebr.</th></tr>';
  PZT.forEach(function(T){
    const a=ps.filter(function(e){ return e.id===T.id; }), w=a.filter(function(e){ return e.end==='won'; }), n=w.length||1;
    const lv0=a.length?a[0].lv+1:null, lv1=(hero.pz[T.id]|0)+1;
    const sf=w.reduce(function(s,e){ return s+e.fails; },0)/n, sh=w.reduce(function(s,e){ return s+e.hint; },0)/n;
    h+='<tr'+(a.length<5?' class="few"':'')+'><td>'+T.e+'&nbsp;'+T.n.replace('Kristall-','').replace('Bilder-','')+'</td><td>'+(lv0&&lv0!==lv1?lv0+' → ':'')+lv1+'</td><td>'+w.length+'</td><td>'+(w.length?sf.toFixed(1):'–')+'</td><td'+(w.length>=5&&sh>=1?' class="warn"':'')+'>'+(w.length?sh.toFixed(1):'–')+'</td><td>'+(a.length-w.length)+'</td></tr>';
  });
  h+='</table><p>Fehler und Tipps je gelöstem Rätsel. „0 % ↓“ oben heißt: schlechter als reines Raten. Fehler sind zwischen Maschinen nicht vergleichbar (Spiegel und Rohre zählen einzelne Fehlklicks). Vergleiche eine Maschine mit sich selbst über die Zeit.</p>';
  h+=parErr();
  h+='<h3>Daten</h3><p>Alles liegt nur in diesem Browser. Rohdaten werden nach 90 Tagen gelöscht, die Tageszeiten bleiben.</p><details class="par-news"><summary>Datenschutz</summary><ul><li>Das Spiel sendet nichts: kein Konto, keine Werbung, keine Statistik, keine Anfragen an fremde Server. Spielstand und Protokoll verlassen das Gerät nur, wenn Sie selbst sichern oder exportieren.</li><li>Beim Laden der Seite sieht GitHub (Betreiber von GitHub Pages) wie bei jeder Webseite die IP-Adresse. Die installierte App lädt danach aus dem Speicher.</li><li>Vorlesen: Stimmen mit ☁ (unter „Vorlesen“) sind Online-Stimmen des Browser-Herstellers. Mit ihnen geht der vorgelesene Text (Aufgaben, Ansagen, nie Namen) an dessen Server. Lokale Stimmen arbeiten nur auf dem Gerät.</li></ul></details><div class="par-act"><button id="par-exp">Protokoll exportieren</button><button id="par-del">'+(parDel?'Wirklich löschen?':'Protokoll löschen')+'</button></div>';
  $('par-body').innerHTML=h;
}
/* Sandbox-Zeit nach Fahrzeug und Werkzeug, als Anteil an der aktiven Zeit. Über 20 % ist markiert: Ab da frisst ein Nebensystem laut Plan zu viel Denkzeit. */
function parSand(days,act){
  const by={};
  days.forEach(function(r){ for(const k in r.sec) if(/^[mt]:/.test(k)) by[k]=(by[k]||0)+r.sec[k]; });
  const ks=Object.keys(by).filter(function(k){ return by[k]>=30; }).sort(function(a,b){ return by[b]-by[a]; });
  if(!act||!ks.length) return '';
  const nm={}; VEH.forEach(function(v){ nm['m:'+v[0]]=v[1]; }); TOOLS.forEach(function(t){ nm['t:'+t[0]]=t[1]; });
  let h='<h3>Sandbox: womit</h3><table><tr><th>Fahrzeug / Werkzeug</th><th>Zeit</th><th>Anteil</th></tr>';
  ks.forEach(function(k){ const p=by[k]/act; h+='<tr><td>'+esc(nm[k]||k.slice(2))+'</td><td>'+mins(by[k])+'</td><td'+(p>.2&&k!=='m:walk'?' class="warn"':'')+'>'+pct(p)+'</td></tr>'; });
  return h+'</table><p>Anteil an der ganzen aktiven Zeit. Werkzeuge laufen neben dem Fahrzeug mit. Erst ab diesem Update gezählt.</p>';
}
function parSchool(){
  let h='<h3>Schulstand</h3>';
  const wk=SCH.on?Math.floor((Date.now()-SCH.at)/(7*864e5)):0;
  if(SCH.on&&wk>=4) h+='<p class="par-note">Der Schulstand wurde seit '+wk+' Wochen nicht geändert. Stimmt er noch?</p>';
  h+='<p>'+(SCH.on?'Neue Aufgaben kommen nur aus dem, was hier eingestellt ist.':'Noch nicht eingestellt: Das Spiel nimmt alles in Schulbuch-Reihenfolge.')+'</p>';
  h+='<div class="par-tabs">'+ZRN.map(function(n,i){ return '<button data-zr="'+i+'"'+(SCH.on&&SCH.zr===i?' class="on"':'')+'>'+n+'</button>'; }).join('')+'</div>';
  h+='<p>Buchstaben, die schon dran waren:</p><div class="par-lt">'+ABC.map(function(c){ return '<button data-lt="'+c+'"'+(SCH.on&&SCH.l.indexOf(c)>=0?' class="on"':'')+'>'+c+'</button>'; }).join('')+'</div>';
  if(SCH.on) h+='<div class="par-act"><button id="par-sall">Schulstand aufheben</button></div>';
  dayLoad();
  h+='<h3>Spielzeit am Tag</h3><p>Heute bisher '+mins(DAY.t)+'. Ist die Zeit erreicht, kommt das Lagerfeuer mit Gute-Nacht-Ansage, danach alle 10 Minuten wieder. Das Spiel sperrt nicht.</p>';
  h+='<div class="par-tabs">'+LIMS.map(function(n){ return '<button data-lim="'+n+'"'+(LIM===n?' class="on"':'')+'>'+(n?n+' min':'aus')+'</button>'; }).join('')+'</div>';
  h+='<h3>Spielwelt</h3><p>Höhlenmonster tief unter der Erde. Sie tun nichts, schubsen nur zurück und platzen bei einem Treffer zu Sternen.</p>';
  h+='<div class="par-tabs"><button data-opt="mon1"'+(OPT.mon?' class="on"':'')+'>an</button><button data-opt="mon0"'+(OPT.mon?'':' class="on"')+'>aus</button></div>';
  h+='<p>Ruhige Darstellung: kein Wackeln, kein Blinken, weniger Konfetti.'+(reducedSys?' Ist schon an, weil das Gerät „Bewegung reduzieren“ eingestellt hat.':'')+'</p>';
  h+='<div class="par-tabs"><button data-opt="calm1"'+(reduced?' class="on"':'')+'>an</button><button data-opt="calm0"'+(reduced?'':' class="on"')+'>aus</button></div>';
  return h;
}
/* Was ist neu: kurze Liste für Eltern. Beim ersten Öffnen nach einem Update steht sie offen oben, danach zugeklappt. */
const NEWS={v:4,t:'Fahrzeuge, Missionen, Werkzeuge',items:[
  'Neue Fahrzeuge: Heißluftballon, Hubschrauber mit Lastenhaken, Segelboot, Kletterkäfer. Dazu eine Seilrutsche zum Selberspannen.',
  'Schaufel und Spitzhacke zum Graben zu Fuß, Pfeil und Bogen mit Schießstand. Höhlenmonster aus Glibber lassen sich besiegen und tun nichts Schlimmes (hier unten abschaltbar).',
  'Missionsbrett mit Aufträgen: Küken retten, Paketdienst (Zahlen lesen), Schatzkarte (Plusaufgabe), Obstkorb (genau abzählen), Feuerwehr, Flaggen auf den Planetengipfeln.',
  'Neues zum Entdecken: Geysire, Sternschnuppen mit Sternsteinen, Schiffswrack im Inselmeer, Sternwarte zum Sternezählen, Glühwürmchen in der Nacht, Kristallharfe, Vulkanausbruch.',
  'Für Eltern: ruhige Darstellung ohne Wackeln und Blinken (hier unten), Sandbox-Zeit je Fahrzeug und Werkzeug, Tastenkürzel am Rechner (Taste ? zeigt sie).',
  'Unter der Haube: Fehler in einem Teil des Spiels halten nicht mehr das ganze Spiel an, weniger Rechenlast bei vielen Funken.']};
let newsOpen=null;
function parNews(){
  if(newsOpen===null){ let seen=0; try{ seen=+localStorage.getItem(K_NEWS)||0; }catch(_){} newsOpen=seen<NEWS.v; if(newsOpen) try{ localStorage.setItem(K_NEWS,String(NEWS.v)); }catch(_){} }
  const fresh=newsOpen;
  return '<details class="par-news"'+(fresh?' open':'')+'><summary>Neu: '+NEWS.t+'</summary><ul>'+NEWS.items.map(function(t){ return '<li>'+t+'</li>'; }).join('')+'</ul></details>';
}
/* Spielstand absichern: Der Stand liegt nur in diesem Browser. Wann zuletzt gesichert wurde und ob der Browser den Speicher schützt, steht hier. */
let parStore='';
function parSafe(){
  let at=0; try{ at=+localStorage.getItem(K_BAK_AT)||0; }catch(_){}
  const d=at?Math.floor((Date.now()-at)/864e5):-1;
  let h='<h3>Spielstand</h3>';
  if(d<0||d>=14) h+='<p class="par-note">'+(d<0?'Noch nie als Datei gesichert.':'Letzte Sicherung vor '+d+' Tagen.')+' Wird der Browser-Speicher gelöscht, ist sonst alles weg.</p>';
  else h+='<p>Zuletzt gesichert '+(d===0?'heute':d===1?'gestern':'vor '+d+' Tagen')+'.</p>';
  if(parStore) h+='<p>'+parStore+'</p>';
  /* Welche Spielversion läuft: Datum, an dem GitHub Pages die geladene Seite veröffentlicht hat (kommt auch aus dem Offline-Speicher mit). */
  const lm=new Date(document.lastModified);
  /* Ohne Last-Modified-Kopf meldet der Browser die Ladezeit; die wäre keine Version. */
  if(!isNaN(lm)&&Math.abs(lm-(performance.timeOrigin||0))>5000) h+='<p>Spielversion vom '+lm.toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})+'.</p>';
  return h+'<div class="par-act"><button id="par-bak">Jetzt sichern</button></div>';
}
function parStoreInfo(){
  if(!(navigator.storage&&navigator.storage.persisted)) return;
  Promise.all([navigator.storage.persisted(),navigator.storage.estimate?navigator.storage.estimate():Promise.resolve(null)]).then(function(r){
    const t=(r[0]?'Der Browser schützt den Speicher vor automatischem Löschen.':'Der Browser darf den Speicher bei Platzmangel löschen. Installiert (Zum Startbildschirm) ist er meist geschützt.')+(r[1]&&r[1].usage?' Belegt: '+(r[1].usage/1048576).toFixed(1)+' MB.':'');
    if(t!==parStore){ parStore=t; if(!$('par').hidden) parLoad(); }
  }).catch(function(){});
}
function parErr(){
  const a=errLoad();
  if(!a.length) return '';
  let h='<h3>Technische Fehler</h3><p>Diese Fehler sind im Spiel aufgetreten. Für eine Fehlermeldung kopieren und weitergeben, es stehen keine persönlichen Daten darin.</p><table class="par-err">';
  a.slice().reverse().forEach(function(e){ h+='<tr><td>'+new Date(e.t).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})+'</td><td>'+esc(e.m)+(e.w?' <small>('+esc(e.w)+')</small>':'')+(e.n>1?' ×'+(e.n|0):'')+'</td></tr>'; });
  return h+'</table><div class="par-act"><button id="par-errc">Kopieren</button><button id="par-errx">Löschen</button></div>';
}
function parVoice(){
  const vs=voicesDe();
  let miss=[]; try{ miss=JSON.parse(localStorage.getItem(K_VMISS)||'[]'); if(!Array.isArray(miss)) miss=[]; }catch(_){}
  let h='<h3>Vorlesen</h3>'+(VCLIP?'<p>Vorgelesen wird mit Aufnahmen einer natürlichen Stimme ('+Object.keys(VCLIP).length+' Sätze). Die Browserstimme springt nur bei Sätzen ohne Aufnahme ein'+(miss.length?', bisher '+miss.length+'. <button id="par-vmc">Sätze kopieren</button>':'.')+'</p>':'')+'<p>Tempo der Vorlesestimme:</p><div class="par-tabs">'+VRATES.map(function(r,i){ return '<button data-vr="'+r+'"'+(VOICE.r===r?' class="on"':'')+'>'+['langsam','normal','schnell'][i]+'</button>'; }).join('')+'</div>';
  if(vs.length>1){
    h+='<p>'+(VCLIP?'Browserstimme für Sätze ohne Aufnahme:':'Stimme:')+'</p><div class="par-tabs par-voices"><button data-vv=""'+(!VOICE.v?' class="on"':'')+'>Standard</button>';
    vs.forEach(function(v){ h+='<button data-vv="'+esc(v.name)+'"'+(VOICE.v===v.name?' class="on"':'')+'>'+esc(v.name.replace(/^(Google|Microsoft)\s*/,'').replace(/\s*\(.*\)$/,'').slice(0,28))+(v.localService?'':' ☁')+'</button>'; });
    h+='</div>';
  }
  return h+'<div class="par-act"><button id="par-vt">Probe hören</button>'+(VCLIP&&vs.length?'<button id="par-vs">Browserstimme hören</button>':'')+'</div>'+(vs.some(function(v){ return !v.localService; })?'<p class="par-note">☁ = braucht Internet.</p>':'');
}
/* Übungsblatt: Die gerade wackligen Rechenaufgaben (Fach 0 bis 2, Stolperaufgaben zuerst) als Blatt zum Ausdrucken, für Üben mit Stift am Küchentisch. Reicht das nicht für ein Blatt, kommen die nächsten neuen Aufgaben dazu. */
const SHEETN=16;
function sheetOk(k){ return /^\d+[+-]\d+$/.test(k)||/^zl:\d+:\d+$/.test(k)||/^nb:[+-]:\d+$/.test(k); }
function sheetPick(stumble){
  const out=[], seen={};
  const add=function(k){ if(out.length<SHEETN&&!seen[k]&&sheetOk(k)){ seen[k]=1; out.push(k); } };
  stumble.forEach(add);
  Object.keys(FS.f).filter(function(k){ return FS.f[k][0]<=2; }).sort(function(a,b){ return FS.f[a][0]-FS.f[b][0]; }).forEach(add);
  for(let st=0;st<STAGES.m.length&&out.length<SHEETN;st++){
    const fr=STAGES.m[st].filter(function(k){ return !FS.f[k]&&schoolOk(k,st); });
    for(let i=fr.length-1;i>0;i--){ const j=ri(0,i), t=fr[i]; fr[i]=fr[j]; fr[j]=t; }
    fr.forEach(add);
    if(st>=FS.u.m&&out.length>=8) break;
  }
  for(let i=out.length-1;i>0;i--){ const j=ri(0,i), t=out[i]; out[i]=out[j]; out[j]=t; }
  return out;
}
function sheetLine(k){
  const bl='<span class="bl"></span>'; let m;
  if((m=/^(\d+)([+-])(\d+)$/.exec(k))) return m[1]+(m[2]==='+'?' + ':' − ')+m[3]+' = '+bl;
  if((m=/^zl:(\d+):(\d+)$/.exec(k))) return m[1]+' = '+m[2]+' + '+bl;
  if((m=/^nb:\+:(\d+)$/.exec(k))) return m[1]+', '+bl;
  if((m=/^nb:-:(\d+)$/.exec(k))) return bl+', '+m[1];
  return '';
}
function sheetPrint(stumble){
  const ks=sheetPick(stumble||[]);
  const ls=(SCH.on&&SCH.l?SCH.l:CASES).split('').filter(function(c){ return CASES.indexOf(c)>=0||SCH.on; }).slice(0,9);
  let h='<h1>Übungsblatt</h1><div class="sd">'+new Date().toLocaleDateString('de-DE')+' · Lavaland</div><div class="sg">';
  ks.forEach(function(k){ h+='<div>'+sheetLine(k)+'</div>'; });
  h+='</div><h2>Groß und klein</h2><div class="sd">Den kleinen Buchstaben dazuschreiben.</div><div class="cs">';
  ls.forEach(function(c){ h+='<div>'+esc(c)+' <span class="bl"></span></div>'; });
  $('sheet').innerHTML=h+'</div>';
  window.print();
}
/* Stolperaufgaben: Fakten, die im Zeitraum oft nicht auf Anhieb saßen, mit der häufigsten falschen Antwort. Daten aus der Sicherung gelten als fremd, darum wird alles maskiert. */
function esc(t){ return String(t).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function fLabel(k){
  let m;
  if((m=/^(\d+)([+-])(\d+)$/.exec(k))) return m[1]+(m[2]==='+'?' + ':' − ')+m[3];
  if((m=/^zl:(\d+):(\d+)$/.exec(k))) return m[1]+' = '+m[2]+' + ?';
  if((m=/^fb:(\d+)$/.exec(k))) return m[1]+' Punkte (Blitzblick)';
  if((m=/^nb:([+-]):(\d+)$/.exec(k))) return m[1]==='+'?m[2]+' → ?':'? ← '+m[2];
  if((m=/^count:(\d+)$/.exec(k))) return m[1]+' Sterne zählen';
  if((m=/^(anlaut|syl|rhy|word|case):(.+)$/.exec(k))) return ({anlaut:'Anlaut ',syl:'Silben ',rhy:'Reim auf ',word:'Wort ',case:'Klein zu '})[m[1]]+m[2];
  return k;
}
let parStum=[];
function parStumble(qs){
  const by={};
  qs.forEach(function(e){ if(typeof e.f!=='string'||e.f.indexOf('seq:')===0) return; const r=by[e.f]||(by[e.f]={n:0,x:0,w:{}}); r.n++; if(!e.first){ r.x++; const v=e.taps[0]&&e.taps[0][0]; if(v!=null&&v!==e.ok) r.w[v]=(r.w[v]||0)+1; } });
  const L0=Object.keys(by).filter(function(k){ return by[k].n>=2&&by[k].x>0; }).sort(function(a,b){ return by[b].x/by[b].n-by[a].x/by[a].n||by[b].n-by[a].n; });
  parStum=L0; const L=L0.slice(0,6);
  let h='<h3>Stolperaufgaben</h3>';
  if(!L.length) return h+'<p>Keine Aufgabe ist im Zeitraum mehrfach danebengegangen.</p>';
  h+='<table><tr><th>Aufgabe</th><th>gestellt</th><th>nicht auf Anhieb</th><th>meist getippt</th></tr>';
  L.forEach(function(k){ const r=by[k], w=Object.keys(r.w).sort(function(a,b){ return r.w[b]-r.w[a]; })[0]; h+='<tr><td>'+esc(fLabel(k))+'</td><td>'+r.n+'</td><td>'+r.x+'</td><td>'+(w!=null?esc(w):'–')+'</td></tr>'; });
  return h+'</table><p>Das Spiel holt diese Aufgaben von selbst öfter. Wenn eine dauerhaft hakt, hilft oft ein Gespräch mit Material (Finger, Steckwürfel).</p>';
}
/* ---------- Rechentafel: Alle Plus- und Minusaufgaben bis 20 und die Buchstaben. Die Farbe zeigt, wie gut eine Aufgabe sitzt; 💠 heißt Meisterstein, ⭐ heißt ganz sicher. ---------- */
let tafTab='p';
function tafCell(k,t){ const r=FS.f[k], b=r?r[0]:0; return '<span class="'+(b?'b'+b:'')+'">'+(b>=5?'⭐':b>=MBOX?'💠':t)+'</span>'; }
function renderTafel(){
  $('taf-tabs').innerHTML=[['p','＋'],['m','−'],['z','🏠'],['l','Aa']].map(function(q){ return '<button data-tt="'+q[0]+'"'+(tafTab===q[0]?' class="on"':'')+' aria-label="'+(q[0]==='p'?'Plus':q[0]==='m'?'Minus':q[0]==='z'?'Zahlenhäuser':'Buchstaben')+'">'+q[1]+'</button>'; }).join('');
  const all={}; STAGES.m.forEach(function(s){ s.forEach(function(k){ all[k]=1; }); }); STAGES.l.forEach(function(s){ s.forEach(function(k){ all[k]=1; }); });
  let h='', cols=9;
  if(tafTab==='z'){
    cols=10;
    for(let n=4;n<=10;n++){ h+='<span class="hd">'+n+'</span>'; for(let a=1;a<=9;a++) h+=a<n?tafCell('zl:'+n+':'+a,a+'+'+(n-a)):'<span class="x"></span>'; }
  }else if(tafTab==='l'){
    cols=4;
    WORDS.forEach(function(wd){ h+=tafCell('anlaut:'+wd.w,wd.w.charAt(0)+'…')+tafCell('word:'+wd.w,wd.w); });
    SYL.forEach(function(x){ h+=tafCell('syl:'+x[0],x[2].replace(/-/g,'·')); });
    Object.keys(RHYW).forEach(function(w){ h+=tafCell('rhy:'+w,w+'~'); });
    CASES.split('').forEach(function(c){ h+=tafCell('case:'+c,c+' '+c.toLowerCase()); });
  }else{
    const op=tafTab==='p'?'+':'-';
    for(let a=1;a<=19;a++){
      let row='', any=false;
      for(let b=1;b<=9;b++){ const k=a+op+b; if(all[k]){ any=true; row+=tafCell(k,a+(op==='+'?'+':'−')+b); } else row+='<span class="x"></span>'; }
      if(any) h+=row;
    }
  }
  const g=$('taf-grid'); g.style.gridTemplateColumns='repeat('+cols+',minmax(0,1fr))'; g.innerHTML=h;
}
function openTafel(){ tafTab='p'; renderTafel(); $('tafel').hidden=false; speak('Deine Rechentafel. Je mehr Farbe, desto besser sitzt die Aufgabe. Ein blauer Stein ist ein Meisterstein.'); }
$('lab-taf').addEventListener('click',function(){ $('lab').hidden=true; openTafel(); });
$('tafel').addEventListener('click',function(e){
  if(e.target===$('tafel')||e.target.closest('.xb')){ $('tafel').hidden=true; return; }
  const b=e.target.closest('[data-tt]'); if(b){ tafTab=b.dataset.tt; renderTafel(); }
});
/* Tagesbilanz und Lagerfeuer: Nach einem neuen Ort lädt ein Lagerfeuer zur Pause ein. Weiterspielen ist immer erlaubt. */
let DAY=null;
function dayLoad(){
  const d=new Date().toDateString();
  if(!DAY){ try{ DAY=JSON.parse(localStorage.getItem(K_DAY)||'null'); }catch(_){ DAY=null; } }
  if(!DAY||typeof DAY!=='object'||DAY.d!==d) DAY={d:d,q:0,pz:0,ms:0,mat:0,z:[],t:0,fire:0};
  if(!Array.isArray(DAY.z)) DAY.z=[];
  ['q','pz','ms','mat','t','fire','lim'].forEach(function(k){ DAY[k]=+DAY[k]||0; }); DAY.z=DAY.z.filter(function(z){ return typeof z==='string'&&z.length<9; }).slice(0,12);
  return DAY;
}
function daySave(){ try{ localStorage.setItem(K_DAY,JSON.stringify(DAY)); }catch(_){} }
function dayAdd(k,v){ dayLoad(); if(k==='z'){ if(DAY.z.length<12) DAY.z.push(v); } else DAY[k]=(DAY[k]|0)+1; daySave(); }
let dayT=0;
function dayTick(dt){ dayT+=dt; if(dayT>=5){ dayLoad(); DAY.t+=dayT; dayT=0; daySave(); limCheck(); } }
/* Elternlimit (optional): Ist die eingestellte Zeit erreicht, kommt das Lagerfeuer mit Gute-Nacht-Ansage, danach alle zehn Minuten wieder. Gesperrt wird nichts. */
const LIMS=[0,20,30,45,60,90];
let LIM=0; try{ LIM=LIMS.indexOf(+localStorage.getItem(K_LIMIT))>0?+localStorage.getItem(K_LIMIT):0; }catch(_){}
function limCheck(){
  if(!LIM||DAY.t<LIM*60||$('camp').hidden===false) return;
  if(DAY.lim&&DAY.t-DAY.lim<CAMPGAP) return;
  if(uiOpen()||ST.paused) return;
  DAY.lim=DAY.t; daySave(); openCamp('lim');
}
const CAMPGAP=600;
let campT=null;
/* Höchstens alle zehn Spielminuten, und nur wenn gerade nichts anderes offen ist. */
function campSoon(){
  dayLoad(); if(DAY.t-DAY.fire<CAMPGAP||campT) return;
  campT=setTimeout(function tryCamp(){ if(uiOpen()||ST.paused||!ST.ready){ campT=setTimeout(tryCamp,3000); return; } campT=null; openCamp(''); },4500);
}
function plural(n,a,b){ return n+' '+(n===1?a:b); }
function openCamp(why){
  dayLoad(); DAY.fire=DAY.t; daySave();
  const st=[['✅',DAY.q,'Aufgaben richtig'],['⚙️',DAY.pz,'Rätsel gelöst'],['💠',DAY.ms,'Meistersteine'],['🎒',DAY.mat,'Fundstücke']];
  $('camp-st').innerHTML=st.filter(function(x){ return x[1]>0; }).map(function(x){ return '<span aria-label="'+x[1]+' '+x[2]+'"><i aria-hidden="true">'+x[0]+'</i>'+x[1]+'</span>'; }).join('');
  $('camp-z').textContent=DAY.z.join('');
  $('camp-s').classList.remove('night'); $('camp-s').classList.toggle('lim',why==='lim');
  $('camp').hidden=false; sfx('pop');
  const bits=[];
  if(DAY.q) bits.push(plural(DAY.q,'Aufgabe','Aufgaben')+' richtig gelöst');
  if(DAY.pz) bits.push(plural(DAY.pz,'Rätsel','Rätsel')+' geknackt');
  if(DAY.ms) bits.push(plural(DAY.ms,'Meisterstein','Meistersteine')+' bekommen');
  if(DAY.z.length) bits.push(plural(DAY.z.length,'neuen Ort','neue Orte')+' entdeckt');
  const sum=bits.length?'Heute hast du '+(bits.length>1?bits.slice(0,-1).join(', ')+' und '+bits[bits.length-1]:bits[0])+'. ':'';
  if(why==='lim') speak('Für heute ist die Spielzeit um, die deine Eltern eingestellt haben. '+sum+'Tippe auf den Mond. Morgen geht es genau hier weiter.');
  else speak('Ein Lagerfeuer! Zeit für eine kleine Pause. '+sum+'Du kannst weiterspielen, oder für heute Schluss machen.');
}
function campRest(){
  saveGame(false);
  $('camp-s').classList.add('night');
  speak('Gute Nacht! Dein Spiel ist gespeichert. Morgen geht es genau hier weiter.');
}
$('camp-go').addEventListener('click',function(){ $('camp').hidden=true; });
$('camp-rest').addEventListener('click',function(){ if($('camp-s').classList.contains('night')){ $('camp').hidden=true; return; } campRest(); });
/* Lernstand nach Leitner: wie viele Fakten in welchem Fach liegen, getrennt nach Rechnen und Buchstaben. */
function parFacts(){
  const c={m:[0,0,0,0,0,0],l:[0,0,0,0,0,0]};
  for(const k in FS.f) c[fDom(k)][FS.f[k][0]]++;
  const tot={m:0,l:0}; ['m','l'].forEach(function(d){ STAGES[d].forEach(function(s,i){ if(i<=FS.u[d]) tot[d]+=s.length; }); });
  const row=function(n,d){ const a=c[d]; return '<tr><td>'+n+'</td><td>'+(tot[d]-a[1]-a[2]-a[3]-a[4]-a[5])+'</td><td>'+a[1]+'</td><td>'+a[2]+'</td><td>'+(a[3]+a[4])+'</td><td>'+a[5]+'</td><td>'+(FS.u[d]+1)+' / '+STAGES[d].length+'</td></tr>'; };
  return '<table><tr><th>Fakten</th><th>neu</th><th>Fach 1</th><th>Fach 2</th><th>Fach 3–4</th><th>sitzt</th><th>Stufe</th></tr>'+row('Rechnen','m')+row('Buchstaben','l')+'</table><p>Fach 1 übt er gerade, „sitzt“ heißt mehrfach mit Abstand richtig. Neu zählt nur, was in den freigeschalteten Stufen noch nicht drankam.</p>';
}
/* Gestapelte Balken für die letzten 14 Tage, Minuten je Tag. */
function parBars(all){
  const n=14, W=320, H=110, bw=W/n, by={}, ks=Object.keys(SNAME);
  all.forEach(function(r){ by[r.d]=r; });
  const ds=[]; for(let i=n-1;i>=0;i--) ds.push(LOG.day(Date.now()-i*864e5));
  let mx=1; ds.forEach(function(d){ const r=by[d]; if(r){ let s=0; ks.forEach(function(k){ s+=r.sec[k]||0; }); mx=Math.max(mx,s); } });
  let g='';
  ds.forEach(function(d,i){
    const r=by[d]; let y=H;
    if(r) ks.forEach(function(k){ const v=(r.sec[k]||0)/mx*(H-14); if(v>0){ y-=v; g+='<rect x="'+(i*bw+2).toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+(bw-4).toFixed(1)+'" height="'+v.toFixed(1)+'" fill="'+SCOL[k]+'"><title>'+d+' '+SNAME[k]+': '+mins(r.sec[k])+'</title></rect>'; } });
    if(i%2===n%2||i===n-1) g+='<text x="'+(i*bw+bw/2).toFixed(1)+'" y="'+(H+12)+'" text-anchor="middle">'+(+d.slice(8))+'.</text>';
  });
  g+='<text x="0" y="9">'+mins(mx)+'</text>';
  return '<svg class="par-ch" viewBox="0 0 '+W+' '+(H+16)+'" role="img" aria-label="Spielzeit je Tag, letzte 14 Tage">'+g+'</svg>';
}
$('par-body').addEventListener('click',function(e){
  const r=e.target.closest('[data-r]');
  if(r){ parRange=+r.dataset.r; parLoad(); return; }
  const z=e.target.closest('[data-zr]'), lt=e.target.closest('[data-lt]');
  if(z||lt){
    if(!SCH.on){ SCH.on=true; SCH.l=''; }
    if(z) SCH.zr=+z.dataset.zr;
    else{ const c=lt.dataset.lt; SCH.l=SCH.l.indexOf(c)>=0?SCH.l.replace(c,''):SCH.l+c; }
    saveSchool(); parLoad(); return;
  }
  if(e.target.closest('#par-errc')){
    const t=errLoad().map(function(x){ return new Date(x.t).toISOString()+' '+x.m+(x.w?' ('+x.w+')':'')+(x.n>1?' x'+x.n:''); }).join('\n')+'\n'+navigator.userAgent;
    if(navigator.clipboard) navigator.clipboard.writeText(t).then(function(){ flash('par-errc','ok'); },function(){});
    return;
  }
  if(e.target.closest('#par-errx')){ try{ localStorage.removeItem(ERRK); }catch(_){} parLoad(); return; }
  const vr=e.target.closest('[data-vr]'), vv=e.target.closest('[data-vv]');
  if(vr||vv){ if(vr) VOICE.r=+vr.dataset.vr; else VOICE.v=vv.dataset.vv; voiceSave(); if(vv){ speakStop(); synth('Hallo! So klinge ich.'); } else speak('Hallo! So klinge ich.'); parLoad(); return; }
  if(e.target.closest('#par-vt')){ speak('Hallo! Wie viel ist 3 plus 4?'); return; }
  if(e.target.closest('#par-vs')){ speakStop(); synth('Hallo! Wie viel ist 3 plus 4?'); return; }
  if(e.target.closest('#par-vmc')){
    let t=''; try{ t=JSON.parse(localStorage.getItem(K_VMISS)||'[]').join('\n'); }catch(_){}
    if(navigator.clipboard) navigator.clipboard.writeText(t).then(function(){ flash('par-vmc','ok'); },function(){});
    return;
  }
  if(e.target.closest('#par-sheet')){ sheetPrint(parStum); return; }
  if(e.target.closest('#par-bak')){ bakSave(); setTimeout(parLoad,1500); return; }
  if(e.target.closest('#par-sall')){ SCH.on=false; saveSchool(); parLoad(); return; }
  const op=e.target.closest('[data-opt]');
  if(op){ const k=op.dataset.opt; if(k==='mon1'||k==='mon0') OPT.mon=k==='mon1'; else { OPT.calm=k==='calm1'; reduced=reducedSys||OPT.calm; document.body.classList.toggle('calm',OPT.calm); } optSave(); parLoad(); return; }
  const lm=e.target.closest('[data-lim]');
  if(lm){ LIM=+lm.dataset.lim; try{ localStorage.setItem(K_LIMIT,String(LIM)); }catch(_){} dayLoad(); DAY.lim=0; daySave(); parLoad(); return; }
  if(e.target.closest('#par-exp')){
    parGet().then(function(o){
      const b=new Blob([JSON.stringify({app:'lavaland-log',at:new Date().toISOString(),ev:o.ev,day:o.day,err:errLoad(),dev:{ua:navigator.userAgent,mem:navigator.deviceMemory||null,w:innerWidth,h:innerHeight,dpr:devicePixelRatio}})],{type:'application/json'});
      const a=document.createElement('a'), u=URL.createObjectURL(b);
      a.href=u; a.download='lavaland-protokoll-'+LOG.day()+'.json'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){ URL.revokeObjectURL(u); },4000);
    }).catch(function(){});
    return;
  }
  if(e.target.closest('#par-del')){
    if(!parDel){ parDel=true; e.target.closest('#par-del').textContent='Wirklich löschen?'; return; }
    LOG.trx(['ev','day'],'readwrite').then(function(tx){
      tx.objectStore('ev').clear(); tx.objectStore('day').clear();
      tx.oncomplete=function(){ parDel=false; parLoad(); };
    }).catch(function(){});
  }
});

let last=0, accum=0, lastIcon='', drawN=0;
function frame(t){
  /* Der nächste Frame wird zuerst bestellt: Ein Fehler irgendwo darf das Spiel nicht einfrieren. */
  requestAnimationFrame(frame);
  try{
    const raw=(t-last)/1000||0, dt=Math.min(.034,raw); last=t;
    LOG.tick(raw); LOG.beat(raw);
    if(ST.ready&&!document.hidden){ const ls=LOG.state(); if(ls&&ls!=='idle') dayTick(Math.min(1,raw)); }
    /* Solange ein Fenster offen ist, steht das Spiel still und der Akku läuft nicht leer. */
    if(!(ST.paused||uiOpen())){
      accum+=dt; let n=0;
      while(accum>=1/30&&n<2){ paintStep(); step(); accum-=1/30; n++; }
      if(accum>.1) accum=0;
      update(dt); for(const f of SIDE) safe(f,dt);
      /* Läuft es auf diesem Gerät zu langsam, sinkt die Auflösung in Stufen. */
      if(raw<.2){ perfT+=raw; perfN++; }
      if(perfN>=150){ if(perfT/perfN>.026&&maxDpr>1){ maxDpr=Math.max(1,maxDpr-.5); resize(); } perfT=0; perfN=0; }
    }
    /* Akku sparen: Hinter einem offenen Fenster steht die Welt still, dann reichen 6 Bilder pro Sekunde. Ohne Berührung reichen 30. */
    drawN++;
    const every=(ST.paused||uiOpen())?10:LOG.state()==='idle'?2:1;
    if(drawN>=every){ drawN=0; draw(); }
    const ic=actIcon(); if(ic!==lastIcon){ actEl.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+AI[ic]+'</svg>'; lastIcon=ic; }
  }catch(e){
    errAdd((e&&e.message)||e,'frame'); console.error(e);
    try{ if(ctx.reset) ctx.reset(); else ctx.setTransform(1,0,0,1,0,0); }catch(_){}
  }
}
/* Absturzschutz für Nebensysteme: Wirft eins dreimal einen Fehler, wird es für diese Sitzung abgeschaltet und steht im Fehlerprotokoll. Der Rest läuft weiter. */
for(const s of mobsWith(MP)) register(s.name,s.tick,s.draw);
for(const s of sightsWith(SY)) register(s.name,s.tick,s.draw);
for(const s of worldWith(WT)) register(s.name,s.tick,s.draw);
register('deepTick',deepTick);
for(const s of winterWith(WP)) register(s.name,s.tick,s.draw);
register('findsTick',findsTick);
for(const s of questsWith(QP)) register(s.name,s.tick,s.draw);
register('autosave',autosave);
register('drain',drain);
register('fogTick',fogTick);
register('mkTick',mkTick);
function safe(s,dt){ safeWith(errAdd,s,dt); }

/* Gold und Edelsteine gibt es nicht mehr (Vereinfachungsplan Schritt 2). Was noch da ist, wird einmal in Zahnräder getauscht:
   je angefangene GOLDZ Gold und je angefangene GEMZ Edelsteine ein Zahnrad. Danach stehen beide auf 0, also passiert es nur einmal. */
const GOLDZ=50, GEMZ=10;
function goldSwap(){
  const g=Math.max(0,ST.gold|0), m=Math.max(0,ST.gems|0);
  if(!g&&!m) return;
  const z=Math.ceil(g/GOLDZ)+Math.ceil(m/GEMZ);
  hero.mat.zr=(hero.mat.zr|0)+z; hero.mk.zr=1; ST.gold=0; ST.gems=0;
  saveHero(); saveFinds(); labBadge(false);
  setTimeout(function(){ banner('⚙️ +'+z,2600); say('','Professor Zahnrad hat deinen Schatz in '+z+(z>1?' Zahnräder':' Zahnrad')+' getauscht. Damit kannst du in der Werkstatt bauen.'); },1300);
}
function start(){
  resize();
  const go=function(){
    ST.ready=true; LOG.start(); renderAlbum(); syncUI(); syncSound(); battShown=-1; renderBatt();
    stEnter(); syncOwn(); zoneGifts(false);
    if(!hero.big) setTimeout(function(){ if(!uiOpen()&&!ST.paused){ hero.big=true; if(nextLand()){ hero.quest={type:'land',goal:1,p:0}; showQuest(false); } saveHero(); say('','Neu! Hinter dem Schneeberg liegen jetzt viele fremde Länder. Fahr hinten am Berg hinunter und entdecke sie!'); pulse('btn-map'); } },2800);
    if(hero.quest&&hero.quest.type==='core'&&hero.dr<3) hero.quest=null;
    if(hero.big&&!hero.deep) setTimeout(function(){ if(!uiOpen()&&!ST.paused) deepIntro(); },2800);
    labBadge(false);
    if(!hero.quest||hero.quest.done||!QDEF[hero.quest.type]) hero.quest=newQuest();
    showQuest(false); pulse('quest');
    /* Einmal am Tag gibt es ein kleines Geschenk. Kein Zähler, nichts geht verloren, wenn man einen Tag auslässt. */
    const today=new Date().toDateString();
    if(hero.day!==today){ hero.day=today; saveHero(); }
    goldSwap();
    hudLoot();
    if(ST.energy<=0) pulse('batt');
    requestAnimationFrame(function(t){ last=t; requestAnimationFrame(frame); });
  };
  const tryLoad=function(sv){
    /* Ein Spielstand aus der alten, kleinen Welt bleibt zur Sicherheit unter eigenem Namen liegen. */
    if(sv&&sv.v<4) idbDo('readwrite',function(st){ return st.put(sv,sv.v===2?'world-alt':'world-v3'); }).catch(function(){});
    if(sv&&(runsOk(sv)||(sv.grid&&((sv.v===4&&sv.gy===GY&&sv.grid.length===sv.f*GY)||(sv.v===3&&sv.grid.length===sv.f*GY0)||(sv.v===2&&sv.grid.length===HOME_GX*GY0))))){ try{ restore(sv); return true; }catch(_){} }
    return false;
  };
  /* Erst der neue Spielstand, dann der alte. Erst wenn beides fehlt oder kaputt ist, gibt es eine neue Welt. */
  /* Ein Spielstand, der da ist, sich aber nicht laden lässt (etwa nach einem Fehler in einer neuen Spielversion), wird nie überschrieben:
     Er bleibt vorher unter 'rescue-…' liegen und kommt mit „Spielstand sichern“ in die Datei. Dasselbe gilt für Mond und Planeten, die zu ihm gehören. */
  const rescue=function(keys,why){
    errAdd('Spielstand nicht ladbar, gerettet: '+keys.join(', '),why);
    return idbDo('readwrite',function(st){
      keys.forEach(function(k){
        const g=st.get(k);
        g.onsuccess=function(){
          const v=g.result; if(v===undefined) return;
          /* Derselbe kaputte Stand wird nur einmal abgelegt, auch wenn das Laden bei jedem Start scheitert. */
          const rk='rescue-'+k+'-'+(v&&v.seed)+'-'+(v&&(v.runs||v.grid)?(v.runs||v.grid).length:0), r=st.get(rk);
          r.onsuccess=function(){ if(r.result===undefined) st.put(v,rk); };
        };
      });
      return st.count();
    }).catch(function(){});
  };
  const planets=function(){ return Object.keys(RLM).map(realmKey); };
  /* War das Kind zuletzt auf dem Mond oder einem Planeten, geht es dort weiter. Klappt das nicht, geht es auf der Erde weiter. */
  let rl=''; try{ rl=localStorage.getItem(K_REALM)||''; }catch(_){}
  const load=function(retry){
    const away=RLM[rl]?idbDo('readonly',function(st){ return st.get(realmKey(rl)); }).then(function(sv){
      if(sv===undefined) return false;
      if(sv&&runsOk(sv)&&sv.rl===rl){ try{ setRealm(rl); restore(sv); return true; }catch(_){ setRealm(''); } }
      return rescue([realmKey(rl)],'start '+rl).then(function(){ return false; });
    }):Promise.resolve(false);
    return away.then(function(ok){
      if(ok) return true;
      setRealm('');
      return idbDo('readonly',function(st){ return st.get(SAVEKEY); }).then(function(sv){
        if(tryLoad(sv)) return true;
        const bad=sv!==undefined;
        return (bad?rescue([SAVEKEY].concat(planets()),'start'):Promise.resolve()).then(function(){
          return idbDo('readonly',function(st){ return st.get('world'); });
        }).then(function(old){
          if(tryLoad(old)) return true;
          /* Eine neue Erde löscht Mond und Planeten. Gehörten sie zu einem Stand, der nicht ladbar war, sind sie oben schon gerettet. */
          resetWorld(newSeed()); return true;
        });
      });
    }).catch(function(e){
      /* Die Datenbank ist gerade nicht lesbar (auf Android etwa bei vollem Speicher). Erst noch einmal versuchen, dann ohne Speichern weiterspielen. */
      if(!retry) return new Promise(function(res){ setTimeout(res,800); }).then(function(){ return load(true); });
      errAdd('Datenbank nicht lesbar: '+((e&&e.message)||e),'start');
      ST.diskLock=true; setRealm(''); resetWorld(newSeed()); return true;
    });
  };
  load(false).then(go,function(){ ST.diskLock=true; setRealm(''); resetWorld(newSeed()); go(); });
}
/*@test-hook*/
document.addEventListener('visibilitychange',function(){ if(document.hidden) saveGame(false); });
const hot=window.claude&&window.claude.hot;
if(hot&&hot.snapshot){ try{ hot.snapshot(function(){ saveGame(false); return {}; }); }catch(_){} }
if(hot&&hot.ready) hot.ready(start); else start();
})();
