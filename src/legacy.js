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
import { deepWith, findsWith, marksWith, findOpenWith, mkTapWith, zoneGiftsWith, deepIntroWith } from './systems/deep.js';
import { moodWith, drawMoodWith, drawFloraWith, drawOrbWith, drawWorldBackWith, drawWorldFrontWith, drawDeepWith } from './render/world.js';
import { drawSnowmanWith, drawDragonWith, drawGondolaWith, drawSkierWith, drawRollWith, drawWinterWith, drawFrontWith, drawSnowfallWith } from './render/winter.js';
import { drawWith } from './render/draw.js';
import { pzOpenWith, pzCloseWith, pzHintMaxWith, pzHintUiWith, drMusterWith, acMusterWith, hiMusterWith, syMusterWith, drSternWith, acSternWith, hiSternWith, sySternWith, drSpiegelWith, acSpiegelWith, hiSpiegelWith, sySpiegelWith, drRoboWith, acRoboWith, hiRoboWith, syRoboWith, drWaageWith, poWaageWith, acWaageWith, hiWaageWith, syWaageWith, drEchoWith, stEchoWith, acEchoWith, hiEchoWith, syEchoWith, drRohreWith, acRohreWith, hiRohreWith, syRohreWith, drSudokuWith, acSudokuWith, hiSudokuWith, sySudokuWith } from './ui/puzzles.js';
import { renderBattWith, needWith, openQuizWith, closeQuizWith, nextQWith, padKeyWith, padSubmitWith, tafCellWith, renderTafelWith, openTafelWith } from './ui/learn.js';
import { renderMapWith, renderFogWith, mapClickWith, renderEggsWith, eggClickWith, missingWith, openLabWith, labBuildWith, openMineWith, liftGoWith } from './ui/map.js';
import { pgOpenWith, pgDrawWith, parOpenWith, parGetWith, guessedWith, parLoadWith, parRenderWith, sheetPrintWith } from './ui/parent.js';
import { hudLootWith, svg24With, armGhostWith, tapWith, holdWith, syncHandWith, fsSyncWith, fsToggleWith } from './ui/controls.js';
import { toWorldWith, discWith, paintPayWith, paintStepWith, endPointerWith } from './ui/paint.js';
import { takeWith, baggerActWith, loaderActWith, dumperActWith, boreWith, updCarWith, updBaggerWith, updLoaderWith, updDumperWith, updTbmWith, updRocketWith, updPlaneWith, updCoasterWith, onSnowWith, updSkiWith, skiActWith, updDragonWith, updSubWith, updBalloonWith, updHeliWith, heliHookWith, heliDropWith, boatWetWith, updBoatWith, updBugWith } from './systems/player/vehicles.js';
import { gravWith, parkWith, setModeWith, rotWith, bucketWith, scoopWith, drillHeadWith, doActionWith, burnWith, moverWith, updateWith, nearLiftWith, rideLiftWith, liftRideWith, zipOkWith, zipAddWith, zipNearWith, handDigWith } from './systems/player/player.js';
import { restoreWith, newRealmWith, travelWith, resetWorldWith, frameWith, startWith } from './app/app.js';
import { migrateSnowWith, planetGenWith, growWith, loadCellsWith } from './core/world/grow.js';
import { rlmWith, setRealmWith, wcWith, realm, RW, RX0, RC0, RC1 } from './state/realm.js';
import { pal, setPal, drawCellsWith } from './render/cells.js';
import { headWith, drawKidWith, drawChuteWith, drawCarWith, drawBaggerWith, drawLoaderWith, drawDumperWith, drawTbmWith, drawRocketWith, drawPlaneWith, drawCartWith, drawSubWith, drawBalloonWith, drawHeliWith, drawBoatWith, drawBugWith, drawZipsWith, drawHandToolWith } from './render/vehicles.js';
import { rrWith, circleWith, mixWith, lerpCWith, emoWith, arrowWith, knobWith, drawTreeWith, drawCloudWith, drawSpaceWith, hillsWith, drawDarkWith, drawFarWith, drawNebulaWith, drawFindsWith, drawPropWith, drawDoorWith, drawScopeWith } from './render/scenery.js';
import { drainWith, numOptsWith, dayNoWith, loadFactsWith, pickFactWith, pickFact0With, factDoneWith, masterGiveWith, genQWith, saveSchoolWith } from './systems/learn.js';
import { ORBS, ground, inMoon, solidW, burns, colTop, floorAt, surfaceY, putUp, setCell } from './state/queries.js';
import { pmaxWith, spawnWith, smokeWith, dustWith, confettiWith, explodeWith } from './systems/particles.js';
import { boxCountWith, teleportWith, placeFindWith, hideFindsWith, renderAlbumWith, orbsOfWith, portalTickWith, dropBombWith, blastWith, sonarTargetWith, discoverWith, discoWith, pupsWith, keyTapWith, rainCloudWith, shakeTreeWith, tapWorldWith, nearScopeWith, scopeOpenWith, scopeRenderWith, scopePickWith, sonarWith } from './systems/play.js';
import { fRowWith, fogKeyWith, fogArrWith, fogSetWith, fogHasWith, fogSeedWith, fogSaveWith, gearLvWith, gearSetWith, stationYWith, zoneAtWith, shellOkWith, doorColsWith, doorShutWith, nearDoorWith, doorPzWith, doorAskWith, doorOpenWith, deepHomeWith, deepRestoreWith, canBuildWith, labBadgeWith, nextMachWith, nearMachWith, nearCabWith, atLabWith, deepIconWith, deepActWith, deepTapWith, matWhereWith, guidePointWith, mkKeyWith, mkSaveWith, darkAtWith } from './systems/zones.js';
import { setToolWith, syncUIWith, pulseWith, flashWith, bannerWith, postMaxWith, uiOpenWith, syncSoundWith, puffWith, shoutWith, flXWith, sayWith, laterWith, tellWith, rewardWith, syncOwnWith, qEmoWith, actIconWith } from './ui/hud.js';
import { dayLoadWith, daySaveWith, dayAddWith, dayTickWith, limCheckWith, campSoonWith, pluralWith, openCampWith, campRestWith, goldSwapWith } from './systems/day.js';
import { errLoad, errAdd, vcMiss } from './persistence/errlog.js';
import { skyLim, nextLand, eggLand } from './state/progress.js';
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
function migrateSnow(){ return migrateSnowWith(WG); }
let SEED=1;

function carveCircle(x,y,r){ return carveCircleWith(WD,x,y,r); }
function fillBlock(bx,by){ return fillBlockWith(WD,bx,by); }
/* ---------- Große Welt: Hinter dem Schneeberg folgen Länder, die aus der Welt-Nummer berechnet werden.
   Ihre Spalten entstehen erst, wenn der Held in die Nähe kommt. Flüssigkeiten rechnen nur rund um die Kamera. ---------- */
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
function rlm(){ return rlmWith(RM); }
function setRealm(id){ return setRealmWith(RM,id); }
function wc(cx){ return wcWith(RM,cx); }



/* Reihenfolge der Länder: Alle Arten kommen einmal dran, dann wird neu gemischt. Am Schluss liegt das Ende der Welt.
   Die Welt ist doppelt so breit wie früher. Die Länder der alten Hälfte bleiben genau so, wie sie waren; wo früher das Ende der Welt lag, geht es mit neuen Ländern weiter. */
let OLD_N=0, OLD_END=0;
/* Port für state/realm.js: die Welten (RLM) und die Farben der Welt (setPal). */
const RM={
  RLM:RLM,
  setPal
};
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
function planetGen(){ return planetGenWith(WG); }
function grow(toX){ return growWith(WG,toX); }
function packRuns(f){ return packRunsWith(grid,f); }
function unpackRuns(b,f){ return unpackRunsWith(grid,b,f); }
let cutX=0;
/* Port für core/world/grow.js: Welt wachsen lassen, Planeten erzeugen, Zellen laden und den Schneeberg nachrüsten. core/ darf state/ nicht importieren, darum kommen Gitter, Held, Fahrzeuge und Fassade über den Port. */
const WG={
  get genF(){ return genF; },
  set genF(v){ genF=v; },
  parked:parked,
  ST:ST,
  P:P,
  get trees(){ return trees; },
  grid:grid,
  LIFE:LIFE,
  stamp:stamp,
  get OLD_END(){ return OLD_END; },
  get cutX(){ return cutX; },
  set cutX(v){ cutX=v; },
  build,
  carveCave,
  genCol,
  unpackRuns,
  winterCol
};
function loadCells(sv){ return loadCellsWith(WG,sv); }


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
function pmax(){ return pmaxWith(PA); }
function spawn(type,x,y,vx,vy,lf,size,c,col){ return spawnWith(PA,type,x,y,vx,vy,lf,size,c,col); }
function smoke(x,y,n){ return smokeWith(PA,x,y,n); }
function dust(x,y){ return dustWith(PA,x,y); }
const CONF=['#e63946','#ffd23f','#3aa0e8','#58b548','#7b4fd6','#ff8a1f'];
function confetti(x,y){ return confettiWith(PA,x,y); }
let shake=0, popG=0, popM=0, popT=0;
/* Teilchen erzeugen (systems/particles.js) */
const PA={
  get maxDpr(){ return maxDpr; },
  parts,
  get reduced(){ return reduced; },
  CONF,
  get shake(){ return shake; },
  set shake(v){ shake=v; }
};
function explode(x,y){ return explodeWith(PA,x,y); }

/* ---------- Spielfigur ---------- */
function grav(){ return gravWith(PL); }
let ghost=null;
let time=0, volT=3, stroke=null, strokeId=null, strokeExt=null;
/* Oberfläche (ui/hud.js) */
const HU={
  get stroke(){ return stroke; },
  set stroke(v){ stroke=v; },
  get strokeId(){ return strokeId; },
  set strokeId(v){ strokeId=v; },
  get MODES(){ return MODES; },
  get $(){ return $; },
  get TOOLN(){ return TOOLN; },
  IC,
  QI,
  get PAINT(){ return PAINT; },
  get bannerT(){ return bannerT; },
  set bannerT(v){ bannerT=v; },
  get SCH(){ return SCH; },
  get OVS(){ return OVS; },
  get FLX(){ return FLX; },
  get sayT(){ return sayT; },
  set sayT(v){ sayT=v; },
  get stq(){ return stq; },
  get DIGT(){ return DIGT; },
  get heliLoad(){ return heliLoad; },
  boatWet,
  confetti,
  deepIcon,
  nearLift,
  nearScope,
  spawn,
  speak,
  svg24,
  zipNear
};

function park(){ return parkWith(PL); }
function setMode(m){ return setModeWith(PL,m); }
function setTool(t,force){ return setToolWith(HU,t,force); }
function syncUI(){ return syncUIWith(HU); }
function pulse(id){ return pulseWith(HU,id); }
function flash(id,cls){ return flashWith(HU,id,cls); }
function rot(lx,ly){ return rotWith(PL,lx,ly); }
function bucket(){ return bucketWith(PL); }
function scoop(){ return scoopWith(PL); }
function drillHead(){ return drillHeadWith(PL); }
function take(i){ return takeWith(VH,i); }
/* Graben-Taste: gräbt, was der Löffel trifft. Trifft er nichts, senkt sich der Arm; ist er ganz unten, rollt der Bagger vor.
   Auskippen nur mit hochgehobenem Arm, damit Halten der Taste nicht abwechselnd gräbt und wieder zuschüttet. */
function baggerAct(){ return baggerActWith(VH); }
function loaderAct(){ return loaderActWith(VH); }
function dumperAct(){ return dumperActWith(VH); }
function bore(x,y,r){ return boreWith(VH,x,y,r); }
function doAction(){ return doActionWith(PL); }
function burn(){ return burnWith(PL); }
function mover(dt,hw,h,step,half){ return moverWith(PL,dt,hw,h,step,half); }

function updCar(dt,ix,u,d){ return updCarWith(VH,dt,ix,u,d); }
function updBagger(dt,ix,u,d){ return updBaggerWith(VH,dt,ix,u,d); }
function updLoader(dt,ix,u,d){ return updLoaderWith(VH,dt,ix,u,d); }
function updDumper(dt,ix,u,d){ return updDumperWith(VH,dt,ix,u,d); }
/* Tunnelbohrmaschine: bohrt beim Fahren ein rundes Loch in Fahrtrichtung, auch durch Fels. ▲/▼ kippt den Bohrkopf, bis senkrecht nach oben oder unten. Ganz gekippt bohrt ▲ oder ▼ allein weiter.
   Steil nach oben fährt sie dem Bohrkopf nach statt waagerecht, und im Schacht hält sie sich fest, statt zurückzurutschen. */
function updTbm(dt,ix,u,d){ return updTbmWith(VH,dt,ix,u,d); }
function updRocket(dt,ix,u,d){ return updRocketWith(VH,dt,ix,u,d); }
function updPlane(dt,ix,u,d){ return updPlaneWith(VH,dt,ix,u,d); }
function updCoaster(dt,ix){ return updCoasterWith(VH,dt,ix); }

function update(dt){ return updateWith(PL,dt); }

/* ---------- Malen mit dem Finger ---------- */
const pointers=new Map();
/* Port für ui/paint.js: Malen, Radieren und Werkzeuge mit dem Finger */
const PT={
  get W(){ return W; },
  get S(){ return S; },
  get H(){ return H; },
  get PAINTM(){ return PAINTM; },
  get PAINTC(){ return PAINTC; },
  get pointers(){ return pointers; },
  get HANDT(){ return HANDT; },
  get time(){ return time; },
  get strokeId(){ return strokeId; },
  set strokeId(v){ strokeId=v; },
  get strokeExt(){ return strokeExt; },
  set strokeExt(v){ strokeExt=v; },
  get stroke(){ return stroke; },
  set stroke(v){ stroke=v; },
  addMan,
  drain,
  dropBomb,
  fillBlock,
  firework,
  handDig,
  makeTrack,
  pulse,
  putUp,
  setMode,
  shoot,
  throwBall,
  zipAdd
};
function toWorld(sx,sy){ return toWorldWith(PT,sx,sy); }
function disc(cx,cy,r,m){ return discWith(PT,cx,cy,r,m); }
/* Zauberkasten: Malen kostet Akku je Zelle, die wirklich neu den Stoff bekommt (Entscheidung 8.11.). Gezählt wird im Pinselbereich vorher und nachher;
   putUp klettert bis zu 8 Zellen nach oben, darum reicht das Fenster 11 Zellen hoch. Wählen und Stillhalten kosten nichts. */
const PAINTM={lava:LAVA,fire:FIRE,water:WATER,ice:ICE,earth:EARTH,snow:SNOW}, PAINTC=.012;
function paintPay(e){ return paintPayWith(PT,e); }
function paintStep(){ return paintStepWith(PT); }
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
function endPointer(e){ return endPointerWith(PT,e); }
cv.addEventListener('pointerup',endPointer);
cv.addEventListener('pointercancel',endPointer);

/* ---------- Ton und Sprache (Klänge und Vorlesen in src/audio/sound.js; hier, was Speicher und Spielzustand braucht) ---------- */
try{ const o=JSON.parse(localStorage.getItem(K_VOICE)||'null'); if(o&&typeof o==='object'){ if(typeof o.v==='string') VOICE.v=o.v.slice(0,120); if(VRATES.indexOf(o.r)>=0) VOICE.r=o.r; } }catch(_){}
try{ if('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged',function(){ if(typeof parLoad==='function'&&!$('par').hidden) parLoad(); }); }catch(_){}
function voiceSave(){ try{ localStorage.setItem(K_VOICE,JSON.stringify(VOICE)); }catch(_){} }
/* Sätze ohne Aufnahme merken (die letzten 40), damit sie beim nächsten Erzeugen dazukommen. Sie stehen in der Elternansicht. */
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
/* Port für systems/deep.js: Welt, Tiefe (Maschinen, Planetenkerne, Zonen), Funde, Erkundungsnebel, Leuchtmarken und Oberflächenhelfer für Tiefe, Funde, Nebel und Leuchtmarken. */
const DP={
  get trees(){ return trees; },
  get nearF(){ return nearF; },
  set nearF(v){ nearF=v; },
  get nearD(){ return nearD; },
  set nearD(v){ nearD=v; },
  get nearT(){ return nearT; },
  set nearT(v){ nearT=v; },
  get $(){ return $; },
  get fogT(){ return fogT; },
  set fogT(v){ fogT=v; },
  get FGT(){ return FGT; },
  get mkShown(){ return mkShown; },
  set mkShown(v){ mkShown=v; },
  get MKMAX(){ return MKMAX; },
  get ZGIFT(){ return ZGIFT; },
  get quest(){ return quest; },
  get mhT(){ return mhT; },
  set mhT(v){ mhT=v; },
  get genF(){ return genF; },
  get MACH(){ return MACH; },
  get ZN(){ return ZN; },
  get MATS(){ return MATS; },
  get MATON(){ return MATON; },
  get SPACE(){ return SPACE; },
  get realm(){ return realm; },
  get guide(){ return guide; },
  set guide(v){ guide=v; },
  get time(){ return time; },
  banner,
  bucket,
  campSoon,
  confetti,
  dayAdd,
  drillHead,
  fRow,
  firework,
  fogArr,
  fogSet,
  ground,
  labBadge,
  later,
  marks,
  mkSave,
  pulse,
  qEvent,
  renderAlbum,
  renderEggs,
  rlm,
  saveFinds,
  saveHero,
  say,
  scoop,
  showQuest,
  skyMark,
  solidW,
  spawn,
  speak,
  surfaceY,
  syncOwn,
  tell,
  zoneAt
};
/* Port für render/world.js: Stimmung, Zeit, Bildschirm, Zeichenhelfer, Welt (Maschinen, Türen, Planetenkerne, Leuchtmarken), Tiere, Ufo und Blitz zum Malen der großen Welt und der Tiefe. */
const RP={
  get throws(){ return throws; },
  get nightA(){ return nightA; },
  get MD(){ return MD; },
  get discoT(){ return discoT; },
  get DPR(){ return DPR; },
  get W(){ return W; },
  get H(){ return H; },
  get reduced(){ return reduced; },
  get time(){ return time; },
  get S(){ return S; },
  get CONF(){ return CONF; },
  get INK(){ return INK; },
  get OHOLE(){ return OHOLE; },
  get bolt(){ return bolt; },
  get ufo(){ return ufo; },
  get FX(){ return FX; },
  get PZI(){ return PZI; },
  get MAT(){ return MAT; },
  get CRYH(){ return CRYH; },
  get CRYC(){ return CRYC; },
  get ZN(){ return ZN; },
  get ZDEC(){ return ZDEC; },
  get MACH(){ return MACH; },
  get VAULTS(){ return VAULTS; },
  get MATS(){ return MATS; },
  get MATON(){ return MATON; },
  circle,
  doorShut,
  drawCres,
  drawDoor,
  emo,
  ground,
  kidScale,
  lerpC,
  marks,
  rr,
  solidW,
  star4,
  stationY,
  surfaceY
};
/* Port für render/winter.js: Zeichenhelfer, Zeit, Bildschirm, Winterzustand (Figuren, Schneebälle, Feuerwerk, Flocken), Lift und Schneeberg zum Malen des Winters. */
const WM={
  get INK(){ return INK; },
  get LIFT(){ return LIFT; },
  get reduced(){ return reduced; },
  get time(){ return time; },
  get LIFT0(){ return LIFT0; },
  get LIFT1(){ return LIFT1; },
  get N(){ return N; },
  get RIMY(){ return RIMY; },
  get IGX(){ return IGX; },
  get balls(){ return balls; },
  get fws(){ return fws; },
  get CONF(){ return CONF; },
  get DPR(){ return DPR; },
  get FLK(){ return FLK; },
  get W(){ return W; },
  get S(){ return S; },
  get H(){ return H; },
  circle,
  emo,
  flX,
  head,
  mix,
  rr,
  surfaceY,
  trackAt
};
/* Drei Stufen: alles an, nur Sprache (ohne Piepen und Klänge), alles aus. Sprache braucht das Kind, Effekte nerven manchmal die Großen. */
try{ const mv=localStorage.getItem(K_MUTE); AU.muted=mv==='1'; AU.fxOff=mv==='s'; }catch(_){}
document.addEventListener('pointerdown',function(e){
  audio(); AU.tapT=performance.now();
  if(e.target&&e.target.closest&&e.target.closest('.btn,.card,.opt,.round,.xb,#batt,#quest,.album button')) sfx('tick');
},true);

/* ---------- Hilfen: Zellen zählen, an einen Ort springen. Die Bau-Aufgaben mit Sternen gibt es nicht mehr (Vereinfachungsplan Schritt 3). ---------- */
function boxCount(x0,x1,y0,y1,fn){ return boxCountWith(TW,x0,x1,y0,y1,fn); }
function teleport(x){ return teleportWith(TW,x); }
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
function placeFind(zone,r){ return placeFindWith(TW,zone,r); }
function hideFinds(){ return hideFindsWith(TW); }
function findOpen(h){ return findOpenWith(DP,h); }
function star4(x,y,r){ ctx.beginPath(); ctx.moveTo(x,y-r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.quadraticCurveTo(x,y,x,y+r); ctx.quadraticCurveTo(x,y,x-r,y); ctx.quadraticCurveTo(x,y,x,y-r); ctx.fill(); }
function drawFinds(front,x0,x1,y0,y1){ return drawFindsWith(SC,ctx,front,x0,x1,y0,y1); }
function renderAlbum(){ return renderAlbumWith(TW); }

/* ---------- Speichern: Die ganze Welt liegt als ein Eintrag in der Browser-Datenbank dieses Geräts. ---------- */
function idbDo(mode,fn){ return idbDoWith(ST.diskLock,mode,fn); }
function snapshot(pre,pf){ return snapshotWith(SV,pre,pf); }
function packStart(){ return packStartWith(SV); }
function packStep(){ return packStepWith(SV); }
function saveGame(manual){ return saveGameWith(SV,manual); }
function autosave(dt){ return autosaveWith(SV,dt); }
function restore(sv){ return restoreWith(APP,sv); }
function newSeed(){ return 1+Math.floor(Math.random()*999983); }

/* ---------- Reisen zwischen den Welten: Die Welt, die man verlässt, wird gespeichert, die neue geladen oder zum ersten Mal erzeugt. ---------- */
let portalT=0, portalOff='', exitHint=false, portO=null;
function orbsOf(id){ return orbsOfWith(TW,id); }
function newRealm(){ return newRealmWith(APP); }
function travel(to){ return travelWith(APP,to); }
function portalTick(dt){ return portalTickWith(TW,dt); }

/* ---------- Held: Stufen der Verbesserungen, Bomben aus dem alten Vorrat, Aufträge und Werkstatt-Stand. ---------- */
try{
  const o=JSON.parse(localStorage.getItem(K_HERO)||'null');
  if(o&&o.up){ for(const k in hero.up) hero.up[k]=clamp(o.up[k]|0,0,3); hero.xp=o.xp|0; hero.lvl=Math.max(1,o.lvl|0); hero.own=o.own||{}; hero.pet=''; hero.hat=''; hero.tnt=o.tnt|0; hero.qn=o.qn|0; hero.quest=o.quest||null; hero.day=o.day||'';  hero.eggs=o.eggs|0; hero.trail=!!o.trail; hero.ext=!!o.ext; hero.big=!!o.big; hero.dr=clamp(o.dr|0,0,3); hero.rk=clamp(o.rk|0,0,3); hero.lp=clamp(o.lp|0,0,3); hero.zn=clamp(o.zn|0,0,6); hero.mat=o.mat||{}; hero.mk=o.mk||{}; hero.pz=o.pz||{}; hero.pzn=o.pzn|0; hero.deep=!!o.deep; hero.fin=o.fin|0; }
}catch(_){}
let nearF=null, nearD=1e9;
const bombs=[], pet={x:820,y:0};
function saveHero(){ return saveHeroWith(SV); }
function hudLoot(){ return hudLootWith(CT); }
/* Eine Bombe kostet BOMBE Akku. Bomben aus dem alten Vorrat werden zuerst verbraucht. */
const BOMBE=15;
function dropBomb(x,y){ return dropBombWith(TW,x,y); }
function blast(x,y){ return blastWith(TW,x,y); }
function drawProp(o){ return drawPropWith(SC,ctx,o); }
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
function qEmo(e){ return qEmoWith(HU,e); }
/* Die Kette: Zonen mit der nötigen Bohrerstufe, Ziele im Weltraum mit der nötigen Raketenstufe, ganz unten der Erdkern mit Schutz Stufe 3.
   Besuchte Weltraumziele merkt sich hero.mk.o als Bitmaske (neu, fehlt in alten Spielständen; dort zählen ST.orbGot, hero.fin und hero.rk). */
const QDEEP=[[1,0],[2,0],[3,1],[4,1],[5,2],[6,3]];
const QSKY={moon:[1,'🌙','Lande mit der Rakete auf dem Mond.',0],stn:[2,'🛰️','Flieg mit der Rakete über den Mond hinaus und lande auf der Raumstation.',1],
  ice:[4,'🧊','Flieg mit der Rakete weit hinauf und lande auf dem Eisplaneten.',2],jun:[8,'🟣','Flieg mit der Rakete weit hinauf und lande auf dem Blubberplaneten.',2],
  gate:[16,'🌀','Flieg mit der Rakete bis zum Sternentor am Ende des Weltraums.',3]};
function skyMark(k){ return skyMarkWith(QP,k); }
let quest=null, qShown='', qDoneT=0, bannerT=0;
function banner(html,ms){ return bannerWith(HU,html,ms); }
function qEvent(type,n){ return qEventWith(QP,type,n); }
function newQuest(){ return newQuestWith(QP); }
function showQuest(talk){ return showQuestWith(QP,talk); }
function questPoint(){ return questPointWith(QP); }
function questTick(dt){ return questTickWith(QP,dt); }
function postMax(){ return postMaxWith(HU); }

const OVS=Array.prototype.slice.call(document.querySelectorAll('.ov,#quiz,#pz'));
function uiOpen(){ return uiOpenWith(HU); }
function syncSound(){ return syncSoundWith(HU); }

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

function puff(x,y,n){ return puffWith(HU,x,y,n); }
function shout(x,y,s,col){ return shoutWith(HU,x,y,s,col); }
function emo(e,x,y,sz){ return emoWith(SC,ctx,e,x,y,sz); }
function flX(){ return flXWith(HU); }

function say(who,text){ return sayWith(HU,who,text); }
function later(sec,fn){ return laterWith(HU,sec,fn); }
function tell(lines,done){ return tellWith(HU,lines,done); }
function reward(){ return rewardWith(HU); }

/* ---------- Lift ---------- */
function nearLift(){ return nearLiftWith(PL); }
function rideLift(){ return rideLiftWith(PL); }
function liftRide(dt){ return liftRideWith(PL,dt); }

function onSnow(){ return onSnowWith(VH); }
/* ---------- Ski: ◀ ▶ anschieben, ▼ bremsen, ▲ Düse, rote Taste springt und macht in der Luft einen Salto ---------- */
function updSki(dt,ix,u,d){ return updSkiWith(VH,dt,ix,u,d); }
function skiAct(){ return skiActWith(VH); }

/* ---------- Drachenflug auf Mama Glut: fliegt frei in alle Richtungen, die rote Taste spuckt Feuer und schmilzt Schnee ---------- */
function updDragon(dt,ix,u,d){ return updDragonWith(VH,dt,ix,u,d); }

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
function syncOwn(){ return syncOwnWith(HU); }
/* ---------- Winter malen ---------- */
function drawSnowman(x,y,s,nose,wave,hat,sad){ return drawSnowmanWith(WM,ctx,x,y,s,nose,wave,hat,sad); }
function drawDragon(x,y,s,face,warm,flap,rider){ return drawDragonWith(WM,ctx,x,y,s,face,warm,flap,rider); }
function drawGondola(x,y,occ){ return drawGondolaWith(WM,ctx,x,y,occ); }
function drawSkier(x,y,ang,face,brake,air){ return drawSkierWith(WM,ctx,x,y,ang,face,brake,air); }
function drawRoll(){ return drawRollWith(WM,ctx); }
function drawWinter(x0,x1){ return drawWinterWith(WM,ctx,x0,x1); }
function drawFront(){ return drawFrontWith(WM,ctx); }
function drawSnowfall(){ return drawSnowfallWith(WM,ctx); }

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

/* ---------- Tiere ---------- */
function creHit(c,tap){ return creHitWith(CR,c,tap); }
function creTick(dt){ return creTickWith(CR,dt); }
function drawCres(x0,x1,y0,y1){ return drawCresWith(CR,ctx,x0,x1,y0,y1); }

/* ---------- Fundsachen: Jede macht etwas anderes mit dem Helden. ---------- */
function pickTick(dt){ return pickTickWith(FP,dt); }
function padsTick(){ return padsTickWith(FP); }
function secretsTick(){ return secretsTickWith(FP); }
function sonarTarget(){ return sonarTargetWith(TW); }
function discover(b){ return discoverWith(TW,b); }
function disco(n){ return discoWith(TW,n); }
function pups(){ return pupsWith(TW); }
function keyTap(k){ return keyTapWith(TW,k); }
function rainCloud(c){ return rainCloudWith(TW,c); }
function shakeTree(tr){ return shakeTreeWith(TW,tr); }
function tapWorld(sx,sy){ return tapWorldWith(TW,sx,sy); }

/* ---------- U-Boot: fährt frei durchs Wasser, die rote Taste ist das Sonar und zeigt zum nächsten Geheimnis. ---------- */
function updSub(dt,ix,u,d){ return updSubWith(VH,dt,ix,u,d); }
/* Heißluftballon: Hoch heizt, dann steigt er. Ohne Heizen sinkt er langsam, Runter lässt Luft ab. Der Wind treibt ihn sanft, mit Links und Rechts lenkt man nur ein wenig. Höher als die Wolken kommt er nicht, die Luft wird zu dünn. */
const BALLOON_TOP=-1250;
function updBalloon(dt,ix,u,d){ return updBalloonWith(VH,dt,ix,u,d); }
/* Hubschrauber: steht in der Luft still, wenn man nichts drückt. Mit der Aktionstaste hängt er ein geparktes Fahrzeug unter sich an den Haken und lässt es wieder los. So kommt das U-Boot zum Meer und der Bagger auf den Berg. */
let heliLoad='';
/* Port für systems/player/vehicles.js: Fahrzeuge (Bagger, Radlader, Kipper, Bohrer, Auto, Flugzeug, Rakete, Achterbahn, Ski, Drache, U-Boot, Ballon, Hubschrauber, Boot, Kletterkäfer). heliLoad bleibt hier, weil update, setMode, Laden und Zeichnen ihn lesen; geschrieben wird er über den Setter. */
const VH={
  get quest(){ return quest; },
  get shake(){ return shake; },
  set shake(v){ shake=v; },
  get swishT(){ return swishT; },
  set swishT(v){ swishT=v; },
  get trees(){ return trees; },
  get time(){ return time; },
  get reduced(){ return reduced; },
  get BALLOON_TOP(){ return BALLOON_TOP; },
  get heliLoad(){ return heliLoad; },
  set heliLoad(v){ heliLoad=v; },
  bucket,
  colTop,
  drillHead,
  dust,
  floorAt,
  grav,
  liftRide,
  mover,
  nearLift,
  puff,
  pulse,
  putUp,
  qEvent,
  rideLift,
  rot,
  say,
  scoop,
  shellOk,
  shout,
  smoke,
  solidW,
  spawn,
  steam,
  syncUI,
  trackAt
};
function updHeli(dt,ix,u,d){ return updHeliWith(VH,dt,ix,u,d); }
function heliHook(){ return heliHookWith(VH); }
function heliDrop(){ return heliDropWith(VH); }
function boatWet(){ return boatWetWith(VH); }
function updBoat(dt,ix,u,d){ return updBoatWith(VH,dt,ix,u,d); }
function updBug(dt,ix,u,d){ return updBugWith(VH,dt,ix,u,d); }
/* Seilrutsche: Mit dem Werkzeug zieht man ein Seil von einem Punkt zum anderen. Am oberen Ende hängt man sich mit der Aktionstaste dran und saust hinunter. Rutschen kostet keinen Akku, nur das Spannen. */
const ZIPMAX=8;
function zipOk(z){ return zipOkWith(PL,z); }
function zipAdd(x0,y0,x1,y1){ return zipAddWith(PL,x0,y0,x1,y1); }
function zipNear(){ return zipNearWith(PL); }
function drawZips(x0,x1){ return drawZipsWith(VR,ctx,x0,x1); }
/* Schaufel und Spitzhacke: zu Fuß graben, ohne Akku. Die Schaufel ist schnell, schafft aber nur Erde, Sand und Schnee. Die Spitzhacke schafft auch Fels und Eis, nur langsamer. Harte Schichten bleiben wie beim Bagger dem Bohrer vorbehalten. Aktionstaste gräbt in die Richtung, die man drückt: nach vorn, oben, unten oder schräg. */
const HANDT={shovel:1,pick:1,bow:1}, DIGT={shovel:1,pick:1}, SOFT={4:1,14:1};
let handT=0, handHint=0;
function handDig(wx,wy){ return handDigWith(PL,wx,wy); }
function shoot(wx,wy){ return shootWith(MP,wx,wy); }
function monStrike(wx,wy,r){ return monStrikeWith(MP,wx,wy,r); }
/* Sternwarte: Zwischen Missionsbrett und Zielscheiben steht ein Fernrohr. Ein Blick hinein zeigt ein Sternbild. Wie viele Sterne hat es? Drei große Zahlen zum Antippen. Bei einem Fehler zählt das Fernrohr die Sterne laut vor. Zahlenraum aus dem Schulstand. */
const SCOPEX=1450;
let SCQ=null;
/* Spielen in der Welt (systems/play.js) */
const TW={
  trees,
  clouds,
  get SEED(){ return SEED; },
  FINDS,
  get $(){ return $; },
  RLM,
  get exitHint(){ return exitHint; },
  set exitHint(v){ exitHint=v; },
  get portalOff(){ return portalOff; },
  set portalOff(v){ portalOff=v; },
  get portO(){ return portO; },
  set portO(v){ portO=v; },
  get portalT(){ return portalT; },
  set portalT(v){ portalT=v; },
  BOMBE,
  bombs,
  get shake(){ return shake; },
  set shake(v){ shake=v; },
  get genF(){ return genF; },
  get discoT(){ return discoT; },
  set discoT(v){ discoT=v; },
  get beatT(){ return beatT; },
  set beatT(v){ beatT=v; },
  get idleT(){ return idleT; },
  set idleT(v){ idleT=v; },
  get keySeq(){ return keySeq; },
  set keySeq(v){ keySeq=v; },
  get dTaps(){ return dTaps; },
  set dTaps(v){ dTaps=v; },
  get time(){ return time; },
  get skyRb(){ return skyRb; },
  set skyRb(v){ skyRb=v; },
  get bolt(){ return bolt; },
  set bolt(v){ bolt=v; },
  get W(){ return W; },
  get H(){ return H; },
  get S(){ return S; },
  get nightOn(){ return nightOn; },
  set nightOn(v){ nightOn=v; },
  get tkN(){ return tkN; },
  set tkN(v){ tkN=v; },
  get tkT(){ return tkT; },
  set tkT(v){ tkT=v; },
  N,
  SCOPEX,
  get SCQ(){ return SCQ; },
  set SCQ(v){ SCQ=v; },
  FX,
  banner,
  bore,
  burn,
  confetti,
  creHit,
  deepTap,
  flX,
  grow,
  hudLoot,
  paintPay,
  pinFly,
  postMax,
  puff,
  qEvent,
  renderEggs,
  rlm,
  say,
  setMode,
  shout,
  shuffle,
  smoke,
  spawn,
  speak,
  toWorld,
  travel,
  uiOpen,
  yetiHit
};
function nearScope(){ return nearScopeWith(TW); }
function scopeOpen(){ return scopeOpenWith(TW); }
function scopeRender(cnt){ return scopeRenderWith(TW,cnt); }
function scopePick(v){ return scopePickWith(TW,v); }
$('scope-b').addEventListener('click',function(e){ const b=e.target.closest('[data-sc]'); if(!b) return; if(b.dataset.sc==='next') scopeOpen(); else scopePick(+b.dataset.sc); });
function drawScope(x0,x1){ return drawScopeWith(SC,ctx,x0,x1); }
function drawHandTool(){ return drawHandToolWith(VR,ctx); }
function sonar(){ return sonarWith(TW); }
function drawSub(x,y,ang,face,occ){ return drawSubWith(VR,ctx,x,y,ang,face,occ); }

function drawBalloon(x,y,ang,occ,heat){ return drawBalloonWith(VR,ctx,x,y,ang,occ,heat); }

function drawHeli(x,y,ang,face,occ,spin){ return drawHeliWith(VR,ctx,x,y,ang,face,occ,spin); }

function drawBoat(x,y,ang,face,occ,wind){ return drawBoatWith(VR,ctx,x,y,ang,face,occ,wind); }

function drawBug(x,y,ang,face,occ,run){ return drawBugWith(VR,ctx,x,y,ang,face,occ,run); }

/* ---------- Stimmung: Jedes Land färbt Himmel, Hügel und Wasser. Nachts wird es dunkel. ---------- */
function mood(){ return moodWith(RP); }
function drawMood(){ return drawMoodWith(RP,ctx); }

/* ---------- Die große Welt malen ---------- */
function drawFlora(tr,x,y,h,s){ return drawFloraWith(RP,ctx,tr,x,y,h,s); }
const OHOLE=[[-.4,-.3,.2],[.3,-.45,.13],[.45,.1,.22],[-.1,.35,.16],[-.55,.25,.11],[.1,-.05,.09]];
function drawOrb(o){ return drawOrbWith(RP,ctx,o); }
function drawWorldBack(x0,x1,y0,y1){ return drawWorldBackWith(RP,ctx,x0,x1,y0,y1); }
function drawWorldFront(){ return drawWorldFrontWith(RP,ctx); }
/* Fahrzeuge und Held malen (render/vehicles.js) */
const VR={
  get INK(){ return INK; },
  EHAT,
  FX,
  get time(){ return time; },
  get reduced(){ return reduced; },
  get heliLoad(){ return heliLoad; },
  pointers,
  HANDT,
  circle,
  colTop,
  emo,
  kidScale,
  rr,
  toWorld
};

/* ---------- Karte zum Reisen und die Belohnungen für goldene Eier ---------- */
function renderMap(){ return renderMapWith(LM); }
/* ---------- Erkundungskarte: Ein Querschnitt der Welt. Sichtbar ist nur, wo man schon war; die Lampe deckt mehr auf. ---------- */
const FGT=40, FGW=Math.ceil(GX/FGT), FGH=Math.ceil(GY/FGT), FOG={};
/* Unter Tage (systems/zones.js) */
const ZO={
  FGT,
  FGH,
  get K_FOG(){ return K_FOG; },
  FOG,
  FGW,
  get fogDirty(){ return fogDirty; },
  set fogDirty(v){ fogDirty=v; },
  get genF(){ return genF; },
  get ZN(){ return ZN; },
  get time(){ return time; },
  get klT(){ return klT; },
  set klT(v){ klT=v; },
  get shake(){ return shake; },
  set shake(v){ shake=v; },
  get klS(){ return klS; },
  set klS(v){ klS=v; },
  get klN(){ return klN; },
  set klN(v){ klN=v; },
  get VAULTS(){ return VAULTS; },
  get DOORPZ(){ return DOORPZ; },
  get $(){ return $; },
  get doorQ(){ return doorQ; },
  set doorQ(v){ doorQ=v; },
  trees,
  get guide(){ return guide; },
  set guide(v){ guide=v; },
  get dkA(){ return dkA; },
  set dkA(v){ dkA=v; },
  get cutX(){ return cutX; },
  get GEAR(){ return GEAR; },
  get GEARK(){ return GEARK; },
  get labHi(){ return labHi; },
  set labHi(v){ labHi=v; },
  get MACH(){ return MACH; },
  get MATS(){ return MATS; },
  get K_MARKS(){ return K_MARKS; },
  banner,
  campSoon,
  canBuild,
  confetti,
  dayAdd,
  later,
  marks,
  openLab,
  openMine,
  openQuiz,
  pulse,
  get pzOpen(){ return pzOpen; },
  say,
  scanMobile,
  shout,
  spawn
};
function fRow(y){ return fRowWith(ZO,y); }
let fogDirty=false, fogT=0;
function fogKey(){ return fogKeyWith(ZO); }
function fogArr(){ return fogArrWith(ZO); }
function fogSet(a,tx,ty){ return fogSetWith(ZO,a,tx,ty); }
function fogHas(a,tx,ty){ return fogHasWith(ZO,a,tx,ty); }
function fogSeed(a){ return fogSeedWith(ZO,a); }
function fogSave(){ return fogSaveWith(ZO); }
setInterval(fogSave,15000);
document.addEventListener('visibilitychange',function(){ if(document.hidden) fogSave(); });
const FCOL=['','#ff6a1f','#ffb02e','#3a8fe0','#8a5a35','#7a7a84','#bfe8ff','#8a5a2b','#2b2b36','#4d4660','#8c3a2a','#ff3d00','#f2c84b','#61d6e8','#ffffff','#e8d6b0'];
function renderFog(){ return renderFogWith(LM); }
function mapClick(e){ return mapClickWith(LM,e); }
function renderEggs(){ return renderEggsWith(LM); }
function eggClick(e){ return eggClickWith(LM,e); }

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
function gearLv(g){ return gearLvWith(ZO,g); }
function gearSet(g,v){ return gearSetWith(ZO,g,v); }
let MATS=[], MACH=[], ZDEC=[], SPACE={}, guide=null, klT=0, klS=0, klN=0, labHi=false, dkA=0, mhT=0, liftBusy=false;
const dkc=document.createElement('canvas'), dkx=dkc.getContext('2d');

function stationY(k){ return stationYWith(ZO,k); }
function zoneAt(x,y){ return zoneAtWith(ZO,x,y); }
function shellOk(i){ return shellOkWith(ZO,i); }

/* ---------- Wissenstüren: Tief unten liegen Schatzkammern mit fester Wand. Die Tür geht auf, wenn man drei Lernaufgaben richtig löst.
   Sie haben eine eigene Zufallsreihe, damit sich an allem anderen nichts ändert. ---------- */
let VAULTS=[], doorQ=null;
function doorCols(v){ return doorColsWith(ZO,v); }
function doorShut(v){ return doorShutWith(ZO,v); }
function nearDoor(){ return nearDoorWith(ZO); }
/* Jede zweite Tür ist eine Rätseltür: Statt drei Aufgaben öffnet sie ein Rätsel, eine Stufe kniffliger als sonst. Das Zeichen an der Tür verrät vorher, welches. */
const DOORPZ=['muster','spiegel','waage','robo','stern'];
function doorPz(v){ return doorPzWith(ZO,v); }
function doorAsk(v){ return doorAskWith(ZO,v); }
function doorOpen(v){ return doorOpenWith(ZO,v); }
function drawDoor(v){ return drawDoorWith(SC,ctx,v); }
function deepHome(){ return deepHomeWith(ZO); }
function deepRestore(sv){ return deepRestoreWith(ZO,sv); }

/* ---------- Jede Sekunde: Zonen entdecken, Planetenkerne einsammeln, Maschinen auf den Boden stellen, Ziele erreichen ---------- */
function canBuild(g){ return canBuildWith(ZO,g); }
function labBadge(talk){ return labBadgeWith(ZO,talk); }
function deepIntro(){ return deepIntroWith(DP); }
/* Was früher die Geschichte schenkte, gibt es jetzt für Zonen (Vereinfachungsplan Schritt 3): Feuerwerk, goldene Ski, Drache.
   Wer es schon hat, behält es. Beim Start wird nachgeholt, was zur erreichten Zone gehört. */
const ZGIFT=[[1,'fw','Das Feuerwerk','Es liegt bei den Werkzeugen.','tool-fw'],[3,'goldski','Die goldenen Ski','Nimm die Ski, dann siehst du sie.','mode-ski'],[5,'dragon','Mama Glut, der Drache','Sie wartet bei den Fahrzeugen. Jetzt kannst du auf ihr fliegen.','mode-dragon']];
function zoneGifts(talk){ return zoneGiftsWith(DP,talk); }
function nextMach(){ return nextMachWith(ZO); }
function nearMach(){ return nearMachWith(ZO); }
function nearCab(){ return nearCabWith(ZO); }
function atLab(){ return atLabWith(ZO); }
function deepIcon(){ return deepIconWith(ZO); }
function deepAct(){ return deepActWith(ZO); }
function deepTap(wx,wy){ return deepTapWith(ZO,wx,wy); }
function matWhere(k){ return matWhereWith(ZO,k); }
function guidePoint(){ return guidePointWith(ZO); }

/* ---------- Werkstatt ---------- */
/* Port für ui/map.js: Karten, Werkstatt und Aufzug */
const LM={
  get mapPg(){ return mapPg; },
  set mapPg(v){ mapPg=v; },
  get $(){ return $; },
  get RC0(){ return RC0; },
  get FGT(){ return FGT; },
  get FGW(){ return FGW; },
  get RC1(){ return RC1; },
  get FGH(){ return FGH; },
  get genF(){ return genF; },
  get FCOL(){ return FCOL; },
  get MACH(){ return MACH; },
  get VAULTS(){ return VAULTS; },
  get realm(){ return realm; },
  get EGGSVG(){ return EGGSVG; },
  get WEAR(){ return WEAR; },
  get PETS(){ return PETS; },
  get EHAT(){ return EHAT; },
  get GEAR(){ return GEAR; },
  get MAT(){ return MAT; },
  get MATK(){ return MATK; },
  get GEARK(){ return GEARK; },
  get PZON(){ return PZON; },
  get guide(){ return guide; },
  set guide(v){ guide=v; },
  get time(){ return time; },
  get ZN(){ return ZN; },
  get liftBusy(){ return liftBusy; },
  set liftBusy(v){ liftBusy=v; },
  get dkA(){ return dkA; },
  set dkA(v){ dkA=v; },
  atLab,
  banner,
  canBuild,
  confetti,
  darkAt,
  doorShut,
  fRow,
  fogArr,
  fogHas,
  gearLv,
  gearSet,
  ground,
  grow,
  labBadge,
  marks,
  nearCab,
  nextLand,
  rlm,
  saveHero,
  say,
  scanMobile,
  setMode,
  smoke,
  speak,
  stationY,
  teleport
};
function missing(g){ return missingWith(LM,g); }
function openLab(){ return openLabWith(LM); }
function labBuild(g){ return labBuildWith(LM,g); }
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
function openMine(){ return openMineWith(LM); }
function liftGo(k){ return liftGoWith(LM,k); }
$('mine-cards').addEventListener('click',function(e){
  const b=e.target.closest('[data-st]'); if(!b) return;
  const k=+b.dataset.st;
  if(k>hero.zn){ tone([170],'sawtooth'); speak('Dahin fährt der Aufzug erst, wenn du selbst einmal dort warst. '+ZN[k].need); return; }
  $('mine').hidden=true; liftGo(k);
});

/* ---------- Zeichnen ---------- */
const CRYC=['#7fe3f0','#c77dff','#ff9fd0'], CRYH=[30,46,38,24];
/* ---------- Leuchtmarken: Unter der Erde kann man bis zu acht Lichter setzen, um sich Stellen zu merken. Sie leuchten im Dunkeln und stehen auf der Karte. ---------- */
const MKMAX=8, MKS={};
function mkKey(){ return mkKeyWith(ZO); }
function marks(){
  const k=mkKey(); if(MKS[k]) return MKS[k];
  let a=[]; try{ a=JSON.parse(localStorage.getItem(k)||'[]'); }catch(_){}
  if(!Array.isArray(a)) a=[];
  MKS[k]=a.filter(function(m){ return Array.isArray(m)&&isFinite(m[0])&&isFinite(m[1]); }).slice(0,MKMAX);
  return MKS[k];
}
function mkSave(){ return mkSaveWith(ZO); }
let mkShown=null;
function mkTap(){ return mkTapWith(DP); }
$('mark').addEventListener('click',function(e){ e.preventDefault(); mkTap(); });
function drawDeep(x0,x1,y0,y1){ return drawDeepWith(RP,ctx,x0,x1,y0,y1); }
function darkAt(y){ return darkAtWith(ZO,y); }
function drawDark(){ return drawDarkWith(SC,ctx); }
function drawFar(){ return drawFarWith(SC,ctx); }
function drawNebula(){ return drawNebulaWith(SC,ctx); }

/* ---------- Rätselmaschinen: sieben Arten von Denkaufgaben. Jede Art hat zehn Stufen und wird schwerer, wenn ein Rätsel ohne Fehler und ohne Tipp gelingt.
   Muster fortsetzen, Spiegelbild malen, Roboter programmieren, Waage ausgleichen, Reihenfolge merken, Rohre verbinden, Bilder-Sudoku.
   Falsche Versuche kosten nichts. Der Roboter behält sein Programm, damit man den Fehler suchen kann. ---------- */
const PCOL=['#e63946','#3aa0e8','#ffd23f','#58b548','#9b5de5','#ff8a1f'];
const PSHP=['<circle cx="12" cy="12" r="8.5"','<rect x="4" y="4" width="16" height="16" rx="2.5"','<path d="M12 3.5l9 16H3z"','<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"','<path d="M12 2.5l8.5 9.5-8.5 9.5L3.500 12z"'];
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
/* Port für ui/puzzles.js: Rätselrahmen und das Zeichnen, Antippen, Tipps und Ansagen je Rätsel */
const PZ={
  get PSHP(){ return PSHP; },
  get PCOL(){ return PCOL; },
  get pzc(){ return pzc; },
  set pzc(v){ pzc=v; },
  get pzTm(){ return pzTm; },
  set pzTm(v){ pzTm=v; },
  get H(){ return H; },
  get W(){ return W; },
  get PZI(){ return PZI; },
  get LOG(){ return LOG; },
  get $(){ return $; },
  get pending(){ return pending; },
  set pending(v){ pending=v; },
  get MAXE(){ return MAXE; },
  get SEG(){ return SEG; },
  get battShown(){ return battShown; },
  set battShown(v){ battShown=v; },
  get ARW(){ return ARW; },
  get ECF(){ return ECF; },
  get RSVG(){ return RSVG; },
  banner,
  confetti,
  dayAdd,
  doorOpen,
  labBadge,
  pulse,
  qEvent,
  renderBatt,
  ri,
  saveHero,
  say,
  setMode,
  setTool,
  speak
};
let pzc=null, pzTm=[];
function pzOpen(m){ return pzOpenWith(PZ,m); }
function pzClose(){ return pzCloseWith(PZ); }
function pzHintMax(c){ return pzHintMaxWith(PZ,c); }
function pzHintUi(){ return pzHintUiWith(PZ); }
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
function mkMuster(lv){ return mkMusterWith(Math.random,lv); }
function drMuster(st){ return drMusterWith(PZ,st); }
function acMuster(st,a,b){ return acMusterWith(PZ,st,a,b); }
function hiMuster(st){ return hiMusterWith(PZ,st); }
function syMuster(st){ return syMusterWith(PZ,st); }

/* ---------- Sternbild: Sterne mit Zahlen der Reihe nach verbinden, bis ein Bild entsteht. Zählt bis 10 oder bis 20, je nach Schulstand, später in Zweierschritten. ---------- */
function mkStern(lv){ return mkSternWith(Math.random,FS,lv); }
function drStern(st){ return drSternWith(PZ,st); }
function acStern(st,a,b){ return acSternWith(PZ,st,a,b); }
function hiStern(st){ return hiSternWith(PZ,st); }
function syStern(st){ return sySternWith(PZ,st); }

/* ---------- 2. Spiegelbild: Die andere Seite so ausmalen, als stünde in der Mitte ein Spiegel. ---------- */
function mkSpiegel(lv){ return mkSpiegelWith(Math.random,lv); }
function drSpiegel(st){ return drSpiegelWith(PZ,st); }
function acSpiegel(st,a,b){ return acSpiegelWith(PZ,st,a,b); }
function hiSpiegel(st){ return hiSpiegelWith(PZ,st); }
function sySpiegel(st){ return sySpiegelWith(PZ,st); }

/* ---------- 3. Roboter: eine Folge von Pfeilen planen, dann läuft der Roboter sie ab. ---------- */
const ARW=['➡️','⬇️','⬅️','⬆️'];
function mkRobo(lv){ return mkRoboWith(Math.random,lv); }
function drRobo(st){ return drRoboWith(PZ,st); }
function acRobo(st,a){ return acRoboWith(PZ,st,a); }
function hiRobo(st){ return hiRoboWith(PZ,st); }
function syRobo(st){ return syRoboWith(PZ,st); }

/* ---------- 4. Waage: beide Seiten gleich schwer machen oder herausfinden, wie schwer das Geschenk ist. ---------- */
function mkWaage(lv){ return mkWaageWith(Math.random,SCH,lv); }
function drWaage(st){ return drWaageWith(PZ,st); }
function poWaage(st){ return poWaageWith(PZ,st); }
function acWaage(st,a,b){ return acWaageWith(PZ,st,a,b); }
function hiWaage(st){ return hiWaageWith(PZ,st); }
function syWaage(st){ return syWaageWith(PZ,st); }

/* ---------- 5. Kristall-Echo: Reihenfolge merken und nachtippen, auf hohen Stufen auch rückwärts. ---------- */
const ECF=[262,330,392,523,659,784];
function mkEcho(lv){ return mkEchoWith(Math.random,lv); }
function drEcho(st){ return drEchoWith(PZ,st); }
function stEcho(st){ return stEchoWith(PZ,st); }
function acEcho(st,a){ return acEchoWith(PZ,st,a); }
function hiEcho(st){ return hiEchoWith(PZ,st); }
function syEcho(st){ return syEchoWith(PZ,st); }

/* ---------- 6. Rohre: Rohrstücke drehen, bis das Wasser von links bis zur Pflanze fließt. ---------- */
const RSVG=['<path d="M0 12h24"','<path d="M12 0v5a7 7 0 0 0 7 7h5"','<path d="M0 12h24M12 0v12"'];
function mkRohre(lv){ return mkRohreWith(Math.random,lv); }
function drRohre(st){ return drRohreWith(PZ,st); }
function acRohre(st,a,b){ return acRohreWith(PZ,st,a,b); }
function hiRohre(st){ return hiRohreWith(PZ,st); }
function syRohre(){ return syRohreWith(PZ); }

/* ---------- 7. Bilder-Sudoku: In jeder Reihe und Spalte kommt jedes Bild genau einmal vor. ---------- */
function mkSudoku(lv){ return mkSudokuWith(Math.random,lv); }
function drSudoku(st){ return drSudokuWith(PZ,st); }
function acSudoku(st,a){ return acSudokuWith(PZ,st,a); }
function hiSudoku(st){ return hiSudokuWith(PZ,st); }
function sySudoku(st){ return sySudokuWith(PZ,st); }

/* ---------- Tasten ---------- */
/* Port für ui/controls.js: Tasten, Knöpfe, Händigkeit, Vollbild, Bombenzahl im HUD */
const CT={
  get $(){ return $; },
  get ghostEl(){ return ghostEl; },
  set ghostEl(v){ ghostEl=v; },
  get lefty(){ return lefty; },
  get QI(){ return QI; },
  get DE(){ return DE; },
  flash,
  keyTap
};
const VEH=[['walk','Laufen'],['ski','Ski fahren'],['car','Auto'],['plane','Flugzeug'],['rocket','Rakete'],['bagger','Bagger'],['loader','Radlader'],['dumper','Kipper'],['tbm','Tunnelbohrmaschine'],['sub','U-Boot'],['balloon','Heißluftballon'],['heli','Hubschrauber'],['boat','Segelboot'],['bug','Kletterkäfer'],['coaster','Achterbahn fahren'],['dragon','Auf Mama Glut fliegen']];
const TOOLS=[['tnt','Bombe legen'],['lava','Lava malen'],['fire','Feuer malen'],['water','Wasser malen'],['ice','Eis malen'],['earth','Erde malen'],['blocks','Bauklötze setzen'],['track','Schiene malen'],['erase','Radierer'],['snow','Schnee malen'],['ball','Schneeball werfen'],['man','Schneemann bauen'],['fw','Feuerwerk zünden'],['rope','Seilrutsche spannen'],['shovel','Schaufel'],['pick','Spitzhacke'],['bow','Pfeil und Bogen']];
const MODES=VEH.map(function(v){return v[0];}), TOOLN=TOOLS.map(function(t){return t[0];});
/* Zauberkasten (Vereinfachungsplan 1b): Die sechs Malstoffe stecken in einer Karte der Werkzeugkiste und öffnen sich als eigenes Fenster. */
const PAINT={lava:1,fire:1,water:1,ice:1,earth:1,snow:1};
function svg24(inner){ return svg24With(CT,inner); }
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
function armGhost(el){ return armGhostWith(CT,el); }
window.addEventListener('pointerdown',function(){ ghostEl=null; },true);
window.addEventListener('keydown',function(){ ghostEl=null; },true);
window.addEventListener('click',function(e){
  const g=ghostEl; ghostEl=null;
  if(g&&!g.contains(e.target)){ e.stopPropagation(); e.preventDefault(); }
},true);
function tap(el,fn){ return tapWith(CT,el,fn); }
function hold(id,k){ return holdWith(CT,id,k); }
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
function syncHand(){ return syncHandWith(CT); }
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
function fsSync(){ return fsSyncWith(CT); }
function fsToggle(){ return fsToggleWith(CT); }
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
function renderBatt(){ return renderBattWith(QZ); }
function need(fn){ return needWith(QZ,fn); }
function openQuiz(then){ return openQuizWith(QZ,then); }
function closeQuiz(){ return closeQuizWith(QZ); }
function drain(dt){ return drainWith(LK,dt); }
function ri(a,b){ return riWith(Math.random,a,b); }
function shuffle(a){ return shuffleWith(Math.random,a); }
function numOpts(ans,n,max){ return numOptsWith(LK,ans,n,max); }
/* ---------- Lernkern: Jede Aufgabe ist ein eigener Fakt (7+5, Anlaut von Maus) mit einem Fach nach Leitner.
   Fach 1 kommt in derselben Runde wieder, Fach 2 morgen, dann nach 2, 4 und 8 Tagen. Fach 5 heißt: sitzt.
   Neue Fakten kommen in Schulbuch-Reihenfolge: bis 5, bis 10, bis 20 ohne und dann mit Zehnerübergang. ---------- */
function dayNo(t){ return dayNoWith(LK,t); }
let FS=null;
/* Lernkern-Rest (systems/learn.js) */
const LK={
  get HANDT(){ return HANDT; },
  get PAINT(){ return PAINT; },
  get battLow(){ return battLow; },
  set battLow(v){ battLow=v; },
  get $(){ return $; },
  get warnS(){ return warnS; },
  set warnS(v){ warnS=v; },
  get FS(){ return FS; },
  set FS(v){ FS=v; },
  get K_FACTS(){ return K_FACTS; },
  get K_SKILL(){ return K_SKILL; },
  get kindHist(){ return kindHist; },
  get retry(){ return retry; },
  get lastF(){ return lastF; },
  set lastF(v){ lastF=v; },
  get MBOX(){ return MBOX; },
  get lastDom(){ return lastDom; },
  set lastDom(v){ lastDom=v; },
  get SCH(){ return SCH; },
  get K_SCHOOL(){ return K_SCHOOL; },
  dayAdd,
  fParked,
  fUnlock,
  labBadge,
  mixPrefer,
  mkQ,
  mkSeq,
  openQuiz,
  get pickFact(){ return pickFact; },
  renderBatt,
  ri,
  saveFacts,
  saveHero,
  schoolOk,
  shuffle
};
function loadFacts(){ return loadFactsWith(LK); }
function saveFacts(){ return saveFactsWith(SV); }
loadFacts();
/* Wer schon Fakten in Fach 4 oder 5 hat, bekommt die Meistersteine dafür beim ersten Start nachträglich. */
(function(){ if(FS.mg) return; FS.mg={}; let n=0; for(const k in FS.f) if(FS.f[k][0]>=MBOX){ FS.mg[k]=1; n++; } if(n){ hero.mat.ms=(hero.mat.ms|0)+n; hero.mk.ms=1; saveHero(); } saveFacts(); })();
/* Schulstand: Eltern stellen ein, welcher Zahlenraum und welche Buchstaben in der Schule schon dran waren. Neue Fakten kommen dann nur daraus.
   Schon Geübtes wird weiter wiederholt. Ohne Eintrag gilt alles wie bisher. */
const ZRN=['bis 5','bis 10','bis 20 ohne Zehnerübergang','bis 20 mit Zehnerübergang'], ABC='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
let SCH={on:false,zr:3,l:'',at:0};
try{ const o=JSON.parse(localStorage.getItem(K_SCHOOL)||'null'); if(o&&typeof o==='object'){ SCH.on=!!o.on; SCH.zr=clamp(o.zr|0,0,3); SCH.l=String(o.l||'').replace(/[^A-Z]/g,''); SCH.at=+o.at||0; } }catch(_){}
function saveSchool(){ return saveSchoolWith(LK); }
function schoolOk(k,s){ return schoolOkWith(SCH,k,s); }
function fUnlock(d){ return fUnlockWith(FS,d); }
const retry=[];
let lastF='', lastDom='';
/* Abwechslung: Aufgabenart (Plus, Minus, Zahlenhaus, Silben …). Gemischtes Üben hält wach und trainiert, die passende Strategie zu erkennen (Interleaving). Kommt dieselbe Art zweimal hintereinander, wird beim dritten Mal eine andere bevorzugt, wenn es eine gibt. */
let kindHist=[];
function mixPrefer(a){ return mixPreferWith(Math.random,kindHist,a); }
function pickFact(){ return pickFactWith(LK); }
function pickFact0(){ return pickFact0With(LK); }
function fParked(k,today){ return fParkedWith(FS,k,today); }
function factDone(q,how,fast){ return factDoneWith(LK,q,how,fast); }
/* Meisterschaft: Sitzt ein Fakt in Fach 4 (also an verschiedenen Tagen richtig), gibt es einmal einen Meisterstein. Fach 5 leuchtet auf der Rechentafel golden. */
const MBOX=4;
function masterGive(k){ return masterGiveWith(LK,k); }
function mkQ(k){ return mkQWith(Math.random,IC,QI,k); }
function mkSeq(){ return mkSeqWith(Math.random,FS); }
function genQ(){ return genQWith(LK); }
const PADK=['1','2','3','4','5','6','7','8','9','del','0','ok'];
/* Port für ui/learn.js: Akku, Lernaufgabe und Rechentafel auf dem Bildschirm */
const QZ={
  get SEG(){ return SEG; },
  get battShown(){ return battShown; },
  set battShown(v){ battShown=v; },
  get $(){ return $; },
  get pending(){ return pending; },
  set pending(v){ pending=v; },
  get LOG(){ return LOG; },
  get PZON(){ return PZON; },
  get doorQ(){ return doorQ; },
  set doorQ(v){ doorQ=v; },
  get HANDT(){ return HANDT; },
  get qcur(){ return qcur; },
  set qcur(v){ qcur=v; },
  get PADK(){ return PADK; },
  get QI(){ return QI; },
  get MAXE(){ return MAXE; },
  get FS(){ return FS; },
  get MBOX(){ return MBOX; },
  get tafTab(){ return tafTab; },
  set tafTab(v){ tafTab=v; },
  banner,
  dayAdd,
  doorOpen,
  factDone,
  genQ,
  labBadge,
  pulse,
  qEvent,
  setMode,
  setTool,
  speak
};
function nextQ(){ return nextQWith(QZ); }
function padKey(k){ return padKeyWith(QZ,k); }
function padSubmit(){ return padSubmitWith(QZ); }

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

function rr(x,y,w,h,r){ return rrWith(SC,ctx,x,y,w,h,r); }
function circle(x,y,r){ return circleWith(SC,ctx,x,y,r); }
function mix(a,b,t){ return mixWith(SC,a,b,t); }
const SKY_T=[84,191,230], SKY_TH=[29,79,156], SKY_B=[212,244,238], SKY_BH=[127,208,232], SPACE_T=[6,8,30], SPACE_B=[28,24,74];
function lerpC(a,b,t){ return lerpCWith(SC,a,b,t); }
const starsBg=[]; for(let i=0;i<120;i++) starsBg.push([Math.random(),Math.random(),1+Math.random()*1.6,.6+Math.random()*2]);
const INK=K;

const RBC=['#e63946','#ff8a1f','#ffd23f','#58b548','#3aa0e8','#7b4fd6'];
function drawCells(x0,x1,y0,y1){ return drawCellsWith(CL,ctx,x0,x1,y0,y1); }
/* Zellen malen (render/cells.js) */
const CL={
  get time(){ return time; }
};

function head(x,y,r){ return headWith(VR,ctx,x,y,r); }
function drawKid(x,y,face,run,up){ return drawKidWith(VR,ctx,x,y,face,run,up); }
function drawChute(x,y){ return drawChuteWith(VR,ctx,x,y); }
function drawCar(x,y,ang,face,occupied,turbo){ return drawCarWith(VR,ctx,x,y,ang,face,occupied,turbo); }
function drawBagger(x,y,ang,face,arm,load,occupied){ return drawBaggerWith(VR,ctx,x,y,ang,face,arm,load,occupied); }
function drawLoader(x,y,ang,face,lift,load,occupied){ return drawLoaderWith(VR,ctx,x,y,ang,face,lift,load,occupied); }
function drawDumper(x,y,ang,face,load,bed,occupied){ return drawDumperWith(VR,ctx,x,y,ang,face,load,bed,occupied); }
function drawTbm(x,y,ang,face,da,occupied,spin){ return drawTbmWith(VR,ctx,x,y,ang,face,da,occupied,spin); }
function drawRocket(x,y,ang,occupied,thrust){ return drawRocketWith(VR,ctx,x,y,ang,occupied,thrust); }
function drawPlane(x,y,vx,vy,face,on,ang,occupied){ return drawPlaneWith(VR,ctx,x,y,vx,vy,face,on,ang,occupied); }
function drawCart(x,y,ang,dir,occupied,fast){ return drawCartWith(VR,ctx,x,y,ang,dir,occupied,fast); }
function drawTree(tr){ return drawTreeWith(SC,ctx,tr); }
function drawCloud(c){ return drawCloudWith(SC,ctx,c); }
function arrow(x,y,ang,r,col){ return arrowWith(SC,ctx,x,y,ang,r,col); }
const MOONC=[[-90,-60,38],[60,-110,26],[110,10,44],[-20,70,30],[-140,60,22],[30,-20,18],[-60,-160,20]];
/* Kulisse und Zeichenhelfer (render/scenery.js) */
const SC={
  get JAR(){ return JAR; },
  INK,
  get time(){ return time; },
  get reduced(){ return reduced; },
  get W(){ return W; },
  get S(){ return S; },
  get H(){ return H; },
  ORBS,
  MOONC,
  get dkA(){ return dkA; },
  set dkA(v){ dkA=v; },
  dkc,
  dkx,
  get MATS(){ return MATS; },
  MATON,
  get MACH(){ return MACH; },
  get VAULTS(){ return VAULTS; },
  get ZDEC(){ return ZDEC; },
  ZN,
  get DPR(){ return DPR; },
  RBC,
  trees,
  PZI,
  SCOPEX,
  darkAt,
  doorPz,
  drawFlora,
  drawMan,
  drawOrb,
  findOpen,
  ground,
  marks,
  rlm,
  skyLim,
  star4,
  surfaceY
};
function drawSpace(){ return drawSpaceWith(SC,ctx); }
function knob(x,y,r){ return knobWith(SC,ctx,x,y,r); }
function hills(f,off,amp,col,k){ return hillsWith(SC,ctx,f,off,amp,col,k); }
/* Port für render/draw.js: Bildschirm, Zeit, Stimmung, Himmel, Zeichenfunktionen der Welt, Fahrzeuge, Figur, Winter und Tiefe, Teilchen, Zeiger und die Ebenen der Systeme (drawLayer).
   draw ist ein heißer Pfad: Konstanten stehen als Werte im Port, nur veränderliche Namen als Getter. Deshalb steht der Port hier, nach allen Konstanten. */
const DR={
  drawLayer,
  get W(){ return W; },
  get S(){ return S; },
  get H(){ return H; },
  get DPR(){ return DPR; },
  get realm(){ return realm; },
  SKY_TH:SKY_TH,
  NIGHT_T:NIGHT_T,
  SPACE_T:SPACE_T,
  SKY_BH:SKY_BH,
  NIGHT_B:NIGHT_B,
  SPACE_B:SPACE_B,
  starsBg:starsBg,
  get time(){ return time; },
  get skyRb(){ return skyRb; },
  RBC:RBC,
  get shake(){ return shake; },
  get reduced(){ return reduced; },
  clouds:clouds,
  trees:trees,
  get stroke(){ return stroke; },
  get ghost(){ return ghost; },
  PETS:PETS,
  pet:pet,
  bombs:bombs,
  MD:MD,
  parts:parts,
  INK:INK,
  FX:FX,
  get nearF(){ return nearF; },
  get nearD(){ return nearD; },
  boatWet,
  circle,
  colTop,
  drawBagger,
  drawBalloon,
  drawBoat,
  drawBug,
  drawCar,
  drawCart,
  drawCells,
  drawChute,
  drawCloud,
  drawDark,
  drawDeep,
  drawDragon,
  drawDumper,
  drawFinds,
  drawFront,
  drawGondola,
  drawHandTool,
  drawHeli,
  drawKid,
  drawLoader,
  drawMood,
  drawNebula,
  drawPlane,
  drawProp,
  drawRocket,
  drawRoll,
  drawScope,
  drawSkier,
  drawSnowfall,
  drawSpace,
  drawSub,
  drawTbm,
  drawTree,
  drawWinter,
  drawWorldBack,
  drawWorldFront,
  drawZips,
  guidePoint,
  hills,
  knob,
  lerpC,
  mix,
  mood,
  pointTo,
  questPoint,
  sonarTarget,
  spawn,
  trackAt
};
function draw(){ return drawWith(DR,ctx); }

function actIcon(){ return actIconWith(HU); }

function resetWorld(seed){ return resetWorldWith(APP,seed); }

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
/* Port für ui/parent.js: Elternansicht mit Schranke, Protokoll-Auswertung, Übungsblatt */
const PV={
  get $(){ return $; },
  get pgA(){ return pgA; },
  set pgA(v){ pgA=v; },
  get pgB(){ return pgB; },
  set pgB(v){ pgB=v; },
  get pgIn(){ return pgIn; },
  set pgIn(v){ pgIn=v; },
  get pgMiss(){ return pgMiss; },
  set pgMiss(v){ pgMiss=v; },
  get parDel(){ return parDel; },
  set parDel(v){ parDel=v; },
  get LOG(){ return LOG; },
  get parRange(){ return parRange; },
  get SNAME(){ return SNAME; },
  get SCOL(){ return SCOL; },
  get PMIN(){ return PMIN; },
  get QNAME(){ return QNAME; },
  get PZT(){ return PZT; },
  get VEH(){ return VEH; },
  get TOOLS(){ return TOOLS; },
  get SCH(){ return SCH; },
  get ZRN(){ return ZRN; },
  get ABC(){ return ABC; },
  get DAY(){ return DAY; },
  get LIMS(){ return LIMS; },
  get LIM(){ return LIM; },
  get OPT(){ return OPT; },
  get reducedSys(){ return reducedSys; },
  get reduced(){ return reduced; },
  get newsOpen(){ return newsOpen; },
  set newsOpen(v){ newsOpen=v; },
  get K_NEWS(){ return K_NEWS; },
  get NEWS(){ return NEWS; },
  get K_BAK_AT(){ return K_BAK_AT; },
  get parStore(){ return parStore; },
  set parStore(v){ parStore=v; },
  get K_VMISS(){ return K_VMISS; },
  get SHEETN(){ return SHEETN; },
  get FS(){ return FS; },
  get parStum(){ return parStum; },
  set parStum(v){ parStum=v; },
  dayLoad,
  errLoad,
  guessed,
  parLoad,
  parRender,
  ri,
  schoolOk
};
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
function pgOpen(){ return pgOpenWith(PV); }
function pgDraw(){ return pgDrawWith(PV); }
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
function parOpen(){ return parOpenWith(PV); }
function parGet(){ return parGetWith(PV); }
function guessed(e){ return guessedWith(PV,e); }
function parLoad(){ return parLoadWith(PV); }
function parRender(o){ return parRenderWith(PV,o); }
/* Was ist neu: kurze Liste für Eltern. Beim ersten Öffnen nach einem Update steht sie offen oben, danach zugeklappt. */
const NEWS={v:4,t:'Fahrzeuge, Missionen, Werkzeuge',items:[
  'Neue Fahrzeuge: Heißluftballon, Hubschrauber mit Lastenhaken, Segelboot, Kletterkäfer. Dazu eine Seilrutsche zum Selberspannen.',
  'Schaufel und Spitzhacke zum Graben zu Fuß, Pfeil und Bogen mit Schießstand. Höhlenmonster aus Glibber lassen sich besiegen und tun nichts Schlimmes (hier unten abschaltbar).',
  'Missionsbrett mit Aufträgen: Küken retten, Paketdienst (Zahlen lesen), Schatzkarte (Plusaufgabe), Obstkorb (genau abzählen), Feuerwehr, Flaggen auf den Planetengipfeln.',
  'Neues zum Entdecken: Geysire, Sternschnuppen mit Sternsteinen, Schiffswrack im Inselmeer, Sternwarte zum Sternezählen, Glühwürmchen in der Nacht, Kristallharfe, Vulkanausbruch.',
  'Für Eltern: ruhige Darstellung ohne Wackeln und Blinken (hier unten), Sandbox-Zeit je Fahrzeug und Werkzeug, Tastenkürzel am Rechner (Taste ? zeigt sie).',
  'Unter der Haube: Fehler in einem Teil des Spiels halten nicht mehr das ganze Spiel an, weniger Rechenlast bei vielen Funken.']};
let newsOpen=null;
/* Spielstand absichern: Der Stand liegt nur in diesem Browser. Wann zuletzt gesichert wurde und ob der Browser den Speicher schützt, steht hier. */
let parStore='';
/* Übungsblatt: Die gerade wackligen Rechenaufgaben (Fach 0 bis 2, Stolperaufgaben zuerst) als Blatt zum Ausdrucken, für Üben mit Stift am Küchentisch. Reicht das nicht für ein Blatt, kommen die nächsten neuen Aufgaben dazu. */
const SHEETN=16;
function sheetPrint(stumble){ return sheetPrintWith(PV,stumble); }
let parStum=[];
/* ---------- Rechentafel: Alle Plus- und Minusaufgaben bis 20 und die Buchstaben. Die Farbe zeigt, wie gut eine Aufgabe sitzt; 💠 heißt Meisterstein, ⭐ heißt ganz sicher. ---------- */
let tafTab='p';
function tafCell(k,t){ return tafCellWith(QZ,k,t); }
function renderTafel(){ return renderTafelWith(QZ); }
function openTafel(){ return openTafelWith(QZ); }
$('lab-taf').addEventListener('click',function(){ $('lab').hidden=true; openTafel(); });
$('tafel').addEventListener('click',function(e){
  if(e.target===$('tafel')||e.target.closest('.xb')){ $('tafel').hidden=true; return; }
  const b=e.target.closest('[data-tt]'); if(b){ tafTab=b.dataset.tt; renderTafel(); }
});
/* Tagesbilanz und Lagerfeuer: Nach einem neuen Ort lädt ein Lagerfeuer zur Pause ein. Weiterspielen ist immer erlaubt. */
let DAY=null;
/* Tagesbilanz und Lagerfeuer (systems/day.js) */
const DY={
  get DAY(){ return DAY; },
  set DAY(v){ DAY=v; },
  get K_DAY(){ return K_DAY; },
  get dayT(){ return dayT; },
  set dayT(v){ dayT=v; },
  get LIM(){ return LIM; },
  get $(){ return $; },
  get CAMPGAP(){ return CAMPGAP; },
  get campT(){ return campT; },
  set campT(v){ campT=v; },
  get GOLDZ(){ return GOLDZ; },
  get GEMZ(){ return GEMZ; },
  banner,
  labBadge,
  saveFinds,
  saveGame,
  saveHero,
  say,
  speak,
  uiOpen
};
function dayLoad(){ return dayLoadWith(DY); }
function daySave(){ return daySaveWith(DY); }
function dayAdd(k,v){ return dayAddWith(DY,k,v); }
let dayT=0;
function dayTick(dt){ return dayTickWith(DY,dt); }
/* Elternlimit (optional): Ist die eingestellte Zeit erreicht, kommt das Lagerfeuer mit Gute-Nacht-Ansage, danach alle zehn Minuten wieder. Gesperrt wird nichts. */
const LIMS=[0,20,30,45,60,90];
let LIM=0; try{ LIM=LIMS.indexOf(+localStorage.getItem(K_LIMIT))>0?+localStorage.getItem(K_LIMIT):0; }catch(_){}
function limCheck(){ return limCheckWith(DY); }
const CAMPGAP=600;
let campT=null;
function campSoon(){ return campSoonWith(DY); }
function plural(n,a,b){ return pluralWith(DY,n,a,b); }
function openCamp(why){ return openCampWith(DY,why); }
function campRest(){ return campRestWith(DY); }
$('camp-go').addEventListener('click',function(){ $('camp').hidden=true; });
$('camp-rest').addEventListener('click',function(){ if($('camp-s').classList.contains('night')){ $('camp').hidden=true; return; } campRest(); });
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
/* Port für app/app.js: Start, Bildschleife, Reisen zwischen den Welten, neue Welt und Laden. Steht vor frame, nach allen Konstanten: Konstanten als Werte, veränderliche Namen (let) als Getter, die die Abläufe schreiben, mit Setter. */
const APP={
  get SEED(){ return SEED; },
  set SEED(v){ SEED=v; },
  parts:parts,
  get ghost(){ return ghost; },
  set ghost(v){ ghost=v; },
  get stroke(){ return stroke; },
  set stroke(v){ stroke=v; },
  get strokeId(){ return strokeId; },
  set strokeId(v){ strokeId=v; },
  trees:trees,
  ZIPMAX:ZIPMAX,
  bombs:bombs,
  get heliLoad(){ return heliLoad; },
  set heliLoad(v){ heliLoad=v; },
  get guide(){ return guide; },
  set guide(v){ guide=v; },
  get realm(){ return realm; },
  RLM:RLM,
  get portalT(){ return portalT; },
  set portalT(v){ portalT=v; },
  $:$,
  get quest(){ return quest; },
  get portO(){ return portO; },
  set portO(v){ portO=v; },
  get portalOff(){ return portalOff; },
  set portalOff(v){ portalOff=v; },
  get dkA(){ return dkA; },
  set dkA(v){ dkA=v; },
  get exitHint(){ return exitHint; },
  set exitHint(v){ exitHint=v; },
  FOG:FOG,
  MKS:MKS,
  get last(){ return last; },
  set last(v){ last=v; },
  LOG:LOG,
  get accum(){ return accum; },
  set accum(v){ accum=v; },
  get perfT(){ return perfT; },
  set perfT(v){ perfT=v; },
  get perfN(){ return perfN; },
  set perfN(v){ perfN=v; },
  get maxDpr(){ return maxDpr; },
  set maxDpr(v){ maxDpr=v; },
  get drawN(){ return drawN; },
  set drawN(v){ drawN=v; },
  get lastIcon(){ return lastIcon; },
  set lastIcon(v){ lastIcon=v; },
  actEl:actEl,
  AI:AI,
  get ctx(){ return ctx; },
  get battShown(){ return battShown; },
  set battShown(v){ battShown=v; },
  QDEF:QDEF,
  actIcon,
  banner,
  darkAt,
  dayTick,
  deepHome,
  deepIntro,
  deepRestore,
  demoTrack,
  disco,
  draw,
  errAdd,
  frame,
  gen,
  goldSwap,
  grow,
  hideFinds,
  hudLoot,
  idbDo,
  labBadge,
  later,
  loadCells,
  makeTrack,
  migrateSnow,
  newQuest,
  newSeed,
  nextLand,
  orbsOf,
  paintStep,
  planetGen,
  pulse,
  renderAlbum,
  renderBatt,
  resize,
  rlm,
  safe,
  saveGame,
  saveHero,
  say,
  scanMobile,
  setRealm,
  shapeWorld,
  showQuest,
  skyMark,
  snapshot,
  speak,
  stEnter,
  step,
  surfaceY,
  syncOwn,
  syncSound,
  syncUI,
  uiOpen,
  update,
  zipOk,
  zoneGifts
};
/* Port für systems/player/player.js: Spielfigur, Laufen, Werkzeuge zu Fuß, Lift, Seilrutsche und das Bild-Update. Steht direkt vor frame, nach allen Konstanten: Konstanten als Werte (heißer Pfad, update läuft jedes Bild), veränderliche Namen (let) als Getter, die update schreibt, mit Setter. */
const PL={
  get heliLoad(){ return heliLoad; },
  get ghost(){ return ghost; },
  set ghost(v){ ghost=v; },
  DIGT:DIGT,
  FX:FX,
  get shake(){ return shake; },
  set shake(v){ shake=v; },
  get realm(){ return realm; },
  get RX0(){ return RX0; },
  get RW(){ return RW; },
  pet:pet,
  parts:parts,
  get time(){ return time; },
  set time(v){ time=v; },
  get popT(){ return popT; },
  set popT(v){ popT=v; },
  get popG(){ return popG; },
  set popG(v){ popG=v; },
  get popM(){ return popM; },
  set popM(v){ popM=v; },
  bombs:bombs,
  trees:trees,
  get volT(){ return volT; },
  set volT(v){ volT=v; },
  get eruT(){ return eruT; },
  set eruT(v){ eruT=v; },
  get eruOn(){ return eruOn; },
  set eruOn(v){ eruOn=v; },
  get W(){ return W; },
  get S(){ return S; },
  get H(){ return H; },
  get strokeId(){ return strokeId; },
  get stroke(){ return stroke; },
  pointers:pointers,
  LIFT0:LIFT0,
  LIFT:LIFT,
  ZIPMAX:ZIPMAX,
  get handT(){ return handT; },
  set handT(v){ handT=v; },
  SOFT:SOFT,
  get handHint(){ return handHint; },
  set handHint(v){ handHint=v; },
  baggerAct,
  banner,
  blast,
  boatWet,
  burns,
  confetti,
  deepAct,
  deepIcon,
  dumperAct,
  dust,
  explode,
  floorAt,
  fxSpeed,
  ground,
  grow,
  heliDrop,
  heliHook,
  loaderAct,
  monStrike,
  nearScope,
  need,
  pulse,
  qEvent,
  rlm,
  say,
  scanMobile,
  scopeOpen,
  setTool,
  shoot,
  shout,
  skiAct,
  skyLim,
  smoke,
  solidW,
  sonar,
  spawn,
  surfaceY,
  syncUI,
  take,
  toWorld,
  trackAt,
  updBagger,
  updBalloon,
  updBoat,
  updBug,
  updCar,
  updCoaster,
  updDragon,
  updDumper,
  updHeli,
  updLoader,
  updPlane,
  updRocket,
  updSki,
  updSub,
  updTbm
};
function frame(t){ return frameWith(APP,t); }
/* Absturzschutz für Nebensysteme: Wirft eins dreimal einen Fehler, wird es für diese Sitzung abgeschaltet und steht im Fehlerprotokoll. Der Rest läuft weiter. */
for(const s of mobsWith(MP)) register(s.name,s.tick,s.draw);
for(const s of sightsWith(SY)) register(s.name,s.tick,s.draw);
for(const s of worldWith(WT)) register(s.name,s.tick,s.draw);
for(const s of deepWith(DP)) register(s.name,s.tick,s.draw);
for(const s of winterWith(WP)) register(s.name,s.tick,s.draw);
for(const s of findsWith(DP)) register(s.name,s.tick,s.draw);
for(const s of questsWith(QP)) register(s.name,s.tick,s.draw);
register('autosave',autosave);
register('drain',drain);
for(const s of marksWith(DP)) register(s.name,s.tick,s.draw);
function safe(s,dt){ safeWith(errAdd,s,dt); }

/* Gold und Edelsteine gibt es nicht mehr (Vereinfachungsplan Schritt 2). Was noch da ist, wird einmal in Zahnräder getauscht:
   je angefangene GOLDZ Gold und je angefangene GEMZ Edelsteine ein Zahnrad. Danach stehen beide auf 0, also passiert es nur einmal. */
const GOLDZ=50, GEMZ=10;
function goldSwap(){ return goldSwapWith(DY); }
function start(){ return startWith(APP); }
/*@test-hook*/
document.addEventListener('visibilitychange',function(){ if(document.hidden) saveGame(false); });
const hot=window.claude&&window.claude.hot;
if(hot&&hot.snapshot){ try{ hot.snapshot(function(){ saveGame(false); return {}; }); }catch(_){} }
if(hot&&hot.ready) hot.ready(start); else start();
})();
