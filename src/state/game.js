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
/** @type {Record<string, any>} */
export const parked={car:null,plane:null,rocket:null,bagger:null,loader:null,dumper:null,tbm:null,sub:null,balloon:null,heli:null,boat:null,bug:null};
export const cam={x:820,y:-60}, pan={x:0,y:0};
export const keys={l:false,r:false,u:false,d:false,a:false};

/* Speicherschalter und Bedienzustand (PR 14c) */
/* frozen: true, solange ein geladener Spielstand eingespielt wird: dann schreibt das Spiel nichts mehr. */
/* diskLock: true, wenn die Datenbank beim Start nicht lesbar war: Dann läuft das Spiel mit einer Ersatzwelt, schreibt aber nichts in die Datenbank, damit der echte Spielstand beim nächsten Start wieder da ist. */
export let ready=false, saving=false, frozen=false, diskLock=false, traveling=false, paused=false, tool=null, task=null, talkLock=0;
/** @param {boolean} v */ export function setReady(v){ ready=v; }
/** @param {boolean} v */ export function setSaving(v){ saving=v; }
/** @param {boolean} v */ export function setFrozen(v){ frozen=v; }
/** @param {boolean} v */ export function setDiskLock(v){ diskLock=v; }
/** @param {boolean} v */ export function setTraveling(v){ traveling=v; }
/** @param {boolean} v */ export function setPaused(v){ paused=v; }
/** @param {any} v (setTool gibt es schon in legacy.js: Werkzeug wählen) */ export function setToolV(v){ tool=v; }
/** @param {any} v */ export function setTask(v){ task=v; }
/** @param {number} v */ export function setTalkLock(v){ talkLock=v; }

/* Was der Spielstand außer Welt und Held enthält (PR 14d): Energie, Funde, versteckte Dinge, Bauteile, Bahnen, Seilrutschen, gesammeltes Material und Rätselfunde */
export let energy=0, found={}, hidden=/** @type {any[]} */ ([]), props=/** @type {any[]} */ ([]), tracks=/** @type {any[]} */ ([]), zips=/** @type {any[]} */ ([]), matGot={}, pzGot={};
/** @param {number} v */ export function setEnergy(v){ energy=v; }
/** @param {any} v */ export function setFound(v){ found=v; }
/** @param {any[]} v */ export function setHidden(v){ hidden=v; }
/** @param {any[]} v */ export function setProps(v){ props=v; }
/** @param {any[]} v */ export function setTracks(v){ tracks=v; }
/** @param {any[]} v */ export function setZips(v){ zips=v; }
/** @param {any} v */ export function setMatGot(v){ matGot=v; }
/** @param {any} v */ export function setPzGot(v){ pzGot=v; }
