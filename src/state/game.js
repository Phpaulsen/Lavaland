// Spielzustand (PR 14a/b): Held, Gold, Edelsteine, Merker fürs Speichern; Spielfigur P, geparkte Fahrzeuge, Kamera, Verschieben, Tasten. Bewegt aus legacy.js.
// hero, P, parked, cam, pan und keys werden nie neu zugewiesen, nur verändert: legacy.js importiert sie direkt (Live-Binding), ohne Fassade.
// gold, gems, lootDirty und heroDirty werden neu zugewiesen: legacy.js schreibt sie als ST.x, die Fassade ruft die Setter.

/** @type {any} */
export let hero={xp:0,lvl:1,up:{dig:0,motor:0,jet:0,compass:0,luck:0,heat:0},own:{},pet:'',hat:'',tnt:0,qn:0,quest:null,day:'',st:{ch:1,on:false},eggs:0,trail:false,ext:false,big:false,dr:0,rk:0,lp:0,zn:0,mat:{},mk:{},pz:{},pzn:0,deep:false,fin:0};
export let gold=0, gems=0, lootDirty=false, heroDirty=false;

/** @param {number} v */ export function setGold(v){ gold=v; }
/** @param {number} v */ export function setGems(v){ gems=v; }
/** @param {boolean} v */ export function setLootDirty(v){ lootDirty=v; }
/** @param {boolean} v */ export function setHeroDirty(v){ heroDirty=v; }

/* Spielfigur, geparkte Fahrzeuge, Kamera, Verschieben der Ansicht, gedrückte Tasten (PR 14b) */
export const P={mode:'walk',x:820,y:0,vx:0,vy:0,on:true,landed:false,gs:0,face:1,chute:false,air:0,run:0,ang:0,turbo:0,soot:0,hurt:0,track:null,s:0,v:0,arm:.75,load:0,digT:0,climb:0,lift:0,da:0,bed:0,ball:0,spin:0,rot:0,frost:0,jet:false,back:false,balT:0,wall:false,zip:null,swing:0,aim:0};
export const parked={car:null,plane:null,rocket:null,bagger:null,loader:null,dumper:null,tbm:null,sub:null,balloon:null,heli:null,boat:null,bug:null};
export const cam={x:820,y:-60}, pan={x:0,y:0};
export const keys={l:false,r:false,u:false,d:false,a:false};
