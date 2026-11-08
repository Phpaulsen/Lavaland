// Übergangsfassade ST (ADR 0001 Punkt 9): ein Objekt mit get/set je neu zugewiesenem Namen, der aus legacy.js umgezogen ist (Welt: world.js, Spielzustand: game.js).
// legacy.js schreibt x als ST.x (Codemod, tools/arch/codemod.mjs). Lesen gibt den aktuellen Wert des Moduls, Schreiben ruft den Setter.
// Name ST statt G: G ist die Schwerkraft (core/world/const.js). Die Fassade wird leer und gelöscht, wenn legacy.js leer ist (PR 29).
import { BIO, STR, CRE, PICKS, PADS, DECO, EGGS, LOOT, DROPS, stI, NT0, NC0, seen, eggGot, lootGot, orbGot,
  setBIO, setSTR, setCRE, setPICKS, setPADS, setDECO, setEGGS, setLOOT, setDROPS, setStI, setNT0, setNC0, setSeen, setEggGot, setLootGot, setOrbGot } from './world.js';
import { gold, gems, lootDirty, heroDirty, setGold, setGems, setLootDirty, setHeroDirty, ready, saving, frozen, diskLock, traveling, paused, tool, task, talkLock, setReady, setSaving, setFrozen, setDiskLock, setTraveling, setPaused, setToolV, setTask, setTalkLock } from './game.js';

/** @type {{ BIO: any[], STR: any[], CRE: any[], PICKS: any[], PADS: any[], DECO: any[], EGGS: any[], LOOT: any[], DROPS: any[], stI: number, NT0: number, NC0: number, seen: Record<string, any>, eggGot: Record<string, any>, lootGot: Record<string, any>, orbGot: Record<string, any>, gold: number, gems: number, lootDirty: boolean, heroDirty: boolean, ready: boolean, saving: boolean, frozen: boolean, diskLock: boolean, traveling: boolean, paused: boolean, tool: any, task: any, talkLock: number }} */
export const ST={
  get BIO(){ return BIO; }, set BIO(v){ setBIO(v); },
  get STR(){ return STR; }, set STR(v){ setSTR(v); },
  get CRE(){ return CRE; }, set CRE(v){ setCRE(v); },
  get PICKS(){ return PICKS; }, set PICKS(v){ setPICKS(v); },
  get PADS(){ return PADS; }, set PADS(v){ setPADS(v); },
  get DECO(){ return DECO; }, set DECO(v){ setDECO(v); },
  get EGGS(){ return EGGS; }, set EGGS(v){ setEGGS(v); },
  get LOOT(){ return LOOT; }, set LOOT(v){ setLOOT(v); },
  get DROPS(){ return DROPS; }, set DROPS(v){ setDROPS(v); },
  get stI(){ return stI; }, set stI(v){ setStI(v); },
  get NT0(){ return NT0; }, set NT0(v){ setNT0(v); },
  get NC0(){ return NC0; }, set NC0(v){ setNC0(v); },
  get seen(){ return seen; }, set seen(v){ setSeen(v); },
  get eggGot(){ return eggGot; }, set eggGot(v){ setEggGot(v); },
  get lootGot(){ return lootGot; }, set lootGot(v){ setLootGot(v); },
  get orbGot(){ return orbGot; }, set orbGot(v){ setOrbGot(v); },
  get gold(){ return gold; }, set gold(v){ setGold(v); },
  get gems(){ return gems; }, set gems(v){ setGems(v); },
  get lootDirty(){ return lootDirty; }, set lootDirty(v){ setLootDirty(v); },
  get heroDirty(){ return heroDirty; }, set heroDirty(v){ setHeroDirty(v); },
  get ready(){ return ready; }, set ready(v){ setReady(v); },
  get saving(){ return saving; }, set saving(v){ setSaving(v); },
  get frozen(){ return frozen; }, set frozen(v){ setFrozen(v); },
  get diskLock(){ return diskLock; }, set diskLock(v){ setDiskLock(v); },
  get traveling(){ return traveling; }, set traveling(v){ setTraveling(v); },
  get paused(){ return paused; }, set paused(v){ setPaused(v); },
  get tool(){ return tool; }, set tool(v){ setToolV(v); },
  get task(){ return task; }, set task(v){ setTask(v); },
  get talkLock(){ return talkLock; }, set talkLock(v){ setTalkLock(v); }
};
