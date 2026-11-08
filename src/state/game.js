// Spielzustand, Teil 1 (PR 14a): Held, Gold, Edelsteine und die Merker fürs Speichern. Bewegt aus legacy.js.
// hero wird nie neu zugewiesen, nur verändert: legacy.js importiert ihn direkt (Live-Binding), ohne Fassade.
// gold, gems, lootDirty und heroDirty werden neu zugewiesen: legacy.js schreibt sie als ST.x, die Fassade ruft die Setter.

/** @type {any} */
export let hero={xp:0,lvl:1,up:{dig:0,motor:0,jet:0,compass:0,luck:0,heat:0},own:{},pet:'',hat:'',tnt:0,qn:0,quest:null,day:'',st:{ch:1,on:false},eggs:0,trail:false,ext:false,big:false,dr:0,rk:0,lp:0,zn:0,mat:{},mk:{},pz:{},pzn:0,deep:false,fin:0};
export let gold=0, gems=0, lootDirty=false, heroDirty=false;

/** @param {number} v */ export function setGold(v){ gold=v; }
/** @param {number} v */ export function setGems(v){ gems=v; }
/** @param {boolean} v */ export function setLootDirty(v){ lootDirty=v; }
/** @param {boolean} v */ export function setHeroDirty(v){ heroDirty=v; }
