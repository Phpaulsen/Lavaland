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
import { rlmWith, setRealmWith, wcWith, realm, RW, RX0, RC0, RC1, newSeed } from './state/realm.js';
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
import { optSaveWith, voiceSaveWith, marksLoadWith } from './persistence/prefs.js';
import { star4With, pointToWith } from './render/hints.js';
import { bakDoneWith, bakSaveWith, bakPickWith } from './ui/backup.js';
import { keyShortWith, canScrollWith } from './ui/keys.js';
import { demoTrackWith } from './systems/tracks.js';
import { Q, trackAt } from './core/world/track.js';
import { FX, fxSpeed, kidScale } from './state/fx.js';
import { K, S1, IC, AI, S2, QI } from './ui/icons.js';
import { HOME_T, HOME_C, trees, clouds } from './state/home.js';
import { uiBindWith } from './ui/bind.js';
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
function optSave(){ return optSaveWith(PF); }
/* Einstellungen und Leuchtmarken speichern (persistence/prefs.js) */
const PF={
  get OPT(){ return OPT; },
  get VOICE(){ return VOICE; },
  get MKS(){ return MKS; },
  get MKMAX(){ return MKMAX; },
  mkKey
};
const reducedSys=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
let reduced=reducedSys||OPT.calm;

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


/* ---------- Schienen ---------- */
function makeTrack(raw,user){ return makeTrackWith(WD,raw,user); }
function demoTrack(){ return demoTrackWith(TK); }
/* Vorführbahn (systems/tracks.js) */
const TK={
  makeTrack
};

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
function voiceSave(){ return voiceSaveWith(PF); }
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
function star4(x,y,r){ return star4With(HI,ctx,x,y,r); }
/* Funkeln und Zielpfeil (render/hints.js) */
const HI={
  get S(){ return S; },
  get W(){ return W; },
  get H(){ return H; },
  get reduced(){ return reduced; },
  get time(){ return time; },
  get DPR(){ return DPR; },
  get INK(){ return INK; },
  arrow,
  circle
};
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
function pointTo(mx,my,col){ return pointToWith(HI,ctx,mx,my,col); }

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
function marks(){ return marksLoadWith(PF); }
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

/* Geister-Klick: Öffnet ein Tippen schon beim Aufsetzen ein Fenster, landet der Klick nach dem Loslassen im neuen Fenster, etwa auf dem Hintergrund, der es wieder schließt. Ein Klick, der nicht dort ankommt, wo der Finger aufgesetzt hat, wird verschluckt. */
let ghostEl=null;
function armGhost(el){ return armGhostWith(CT,el); }
function tap(el,fn){ return tapWith(CT,el,fn); }
function hold(id,k){ return holdWith(CT,id,k); }
const actEl=$('act');
let lefty=false; try{ lefty=localStorage.getItem(K_LEFTY)==='1'; }catch(_){}
function syncHand(){ return syncHandWith(CT); }
/* ---------- Spielstand umziehen: Alles aus diesem Browser (Welt, Held, Funde, Einstellungen, Protokoll) als eine Datei. Der Speicher gehört zur Adresse, darum braucht der Umzug vom Artefakt auf eine eigene Seite oder in die Homescreen-App diesen Weg. ---------- */
let bakIn=null;
function bakMake(){ return bakMakeWith(TP); }
function bakDone(ok){ return bakDoneWith(BK,ok); }
/* Spielstand als Datei sichern und wählen (ui/backup.js) */
const BK={
  get K_BAK_AT(){ return K_BAK_AT; },
  get BAK_MAX(){ return BAK_MAX; },
  get bakOk(){ return bakOk; },
  get bakIn(){ return bakIn; },
  set bakIn(v){ bakIn=v; },
  get $(){ return $; },
  bakMake,
  flash,
  speak
};
function bakSave(){ return bakSaveWith(BK); }
function bakPick(file){ return bakPickWith(BK,file); }
function bakLoad(){ return bakLoadWith(TP); }

/* ---------- Vollbild im Browser-Tab (Android, Desktop). iPhone kennt das nicht, dort hilft nur „Zum Home-Bildschirm“. Als installierte App ist das Spiel schon im Vollbild, der Knopf bleibt dann weg. ---------- */
const DE=document.documentElement;
function fsSync(){ return fsSyncWith(CT); }
function fsToggle(){ return fsToggleWith(CT); }
function uiBind(){ return uiBindWith(UB); }
/* Knöpfe und Fenster der Bedienung verdrahten (ui/bind.js) */
const UB={
  get $(){ return $; },
  get VEH(){ return VEH; },
  get HANDT(){ return HANDT; },
  get TOOLS(){ return TOOLS; },
  get PAINT(){ return PAINT; },
  get ghostEl(){ return ghostEl; },
  set ghostEl(v){ ghostEl=v; },
  get actEl(){ return actEl; },
  get FINDS(){ return FINDS; },
  get qcur(){ return qcur; },
  get mapPg(){ return mapPg; },
  set mapPg(v){ mapPg=v; },
  get quest(){ return quest; },
  get QDEF(){ return QDEF; },
  get OPT(){ return OPT; },
  get lefty(){ return lefty; },
  set lefty(v){ lefty=v; },
  get K_LEFTY(){ return K_LEFTY; },
  get K_MUTE(){ return K_MUTE; },
  get DE(){ return DE; },
  get bakIn(){ return bakIn; },
  set bakIn(v){ bakIn=v; },
  bakLoad,
  bakPick,
  bakSave,
  closeQuiz,
  doAction,
  eggClick,
  fsSync,
  fsToggle,
  hold,
  mapClick,
  need,
  newQuest,
  openLab,
  openQuiz,
  pulse,
  renderAlbum,
  renderFog,
  renderMap,
  resetWorld,
  saveGame,
  setMode,
  setTool,
  showQuest,
  speak,
  svg24,
  syncHand,
  syncSound,
  tap
};
uiBind();

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
function keyShort(k){ return keyShortWith(KY,k); }
/* Tastenkürzel und Wischen in Fenstern (ui/keys.js) */
const KY={
  get SHORT(){ return SHORT; },
  get $(){ return $; },
  banner,
  setMode,
  setTool
};
window.addEventListener('keyup',function(e){ const k=keymap[e.key]; if(k) keys[k]=false; if(e.key===' ') keys.a=false; });
window.addEventListener('blur',function(){ keys.l=keys.r=keys.u=keys.d=keys.a=false; });
document.addEventListener('contextmenu',function(e){ e.preventDefault(); });
function canScroll(n){ return canScrollWith(KY,n); }
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
