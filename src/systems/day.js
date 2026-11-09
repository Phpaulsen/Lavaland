/* ---------- Tagesbilanz und Lagerfeuer: Spielzeit des Tages, Elternlimit, Lagerfeuer zur Pause; dazu der einmalige Umtausch von altem Gold in Zahnräder ---------- */
// PR 29f2. Bewegt aus legacy.js. Zustand (DAY, dayT, LIM, campT) bleibt vorerst in legacy.js und kommt mit Settern über den Port DY; K_DAY über den Port (Schichtregel).
// legacy.js ruft alle Funktionen über Einzeiler.
import { ST } from '../state/facade.js';
import { sfx } from '../audio/sound.js';
import { hero } from '../state/game.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} DY */
export function dayLoadWith(DY){
  const d=new Date().toDateString();
  if(!DY.DAY){ try{ DY.DAY=JSON.parse(localStorage.getItem(DY.K_DAY)||'null'); }catch(_){ DY.DAY=null; } }
  if(!DY.DAY||typeof DY.DAY!=='object'||DY.DAY.d!==d) DY.DAY={d:d,q:0,pz:0,ms:0,mat:0,z:[],t:0,fire:0};
  if(!Array.isArray(DY.DAY.z)) DY.DAY.z=[];
  ['q','pz','ms','mat','t','fire','lim'].forEach(function(k){ DY.DAY[k]=+DY.DAY[k]||0; }); DY.DAY.z=DY.DAY.z.filter(/** @param {any} z */ function(z){ return typeof z==='string'&&z.length<9; }).slice(0,12);
  return DY.DAY;
}
/** @param {Port} DY */
export function daySaveWith(DY){ try{ localStorage.setItem(DY.K_DAY,JSON.stringify(DY.DAY)); }catch(_){} }
/** @param {Port} DY @param {any} k @param {any} v */
export function dayAddWith(DY,k,v){ dayLoadWith(DY); if(k==='z'){ if(DY.DAY.z.length<12) DY.DAY.z.push(v); } else DY.DAY[k]=(DY.DAY[k]|0)+1; daySaveWith(DY); }
/** @param {Port} DY @param {any} dt */
export function dayTickWith(DY,dt){ DY.dayT+=dt; if(DY.dayT>=5){ dayLoadWith(DY); DY.DAY.t+=DY.dayT; DY.dayT=0; daySaveWith(DY); limCheckWith(DY); } }
/** @param {Port} DY */
export function limCheckWith(DY){
  if(!DY.LIM||DY.DAY.t<DY.LIM*60||DY.$('camp').hidden===false) return;
  if(DY.DAY.lim&&DY.DAY.t-DY.DAY.lim<DY.CAMPGAP) return;
  if(DY.uiOpen()||ST.paused) return;
  DY.DAY.lim=DY.DAY.t; daySaveWith(DY); openCampWith(DY,'lim');
}
/* Höchstens alle zehn Spielminuten, und nur wenn gerade nichts anderes offen ist. */
/** @param {Port} DY */
export function campSoonWith(DY){
  dayLoadWith(DY); if(DY.DAY.t-DY.DAY.fire<DY.CAMPGAP||DY.campT) return;
  DY.campT=setTimeout(function tryCamp(){ if(DY.uiOpen()||ST.paused||!ST.ready){ DY.campT=setTimeout(tryCamp,3000); return; } DY.campT=null; openCampWith(DY,''); },4500);
}
/** @param {Port} DY @param {any} n @param {any} a @param {any} b */
export function pluralWith(DY,n,a,b){ return n+' '+(n===1?a:b); }
/** @param {Port} DY @param {any} why */
export function openCampWith(DY,why){
  dayLoadWith(DY); DY.DAY.fire=DY.DAY.t; daySaveWith(DY);
  const st=[['✅',DY.DAY.q,'Aufgaben richtig'],['⚙️',DY.DAY.pz,'Rätsel gelöst'],['💠',DY.DAY.ms,'Meistersteine'],['🎒',DY.DAY.mat,'Fundstücke']];
  DY.$('camp-st').innerHTML=st.filter(function(x){ return x[1]>0; }).map(function(x){ return '<span aria-label="'+x[1]+' '+x[2]+'"><i aria-hidden="true">'+x[0]+'</i>'+x[1]+'</span>'; }).join('');
  DY.$('camp-z').textContent=DY.DAY.z.join('');
  DY.$('camp-s').classList.remove('night'); DY.$('camp-s').classList.toggle('lim',why==='lim');
  DY.$('camp').hidden=false; sfx('pop');
  const bits=[];
  if(DY.DAY.q) bits.push(pluralWith(DY,DY.DAY.q,'Aufgabe','Aufgaben')+' richtig gelöst');
  if(DY.DAY.pz) bits.push(pluralWith(DY,DY.DAY.pz,'Rätsel','Rätsel')+' geknackt');
  if(DY.DAY.ms) bits.push(pluralWith(DY,DY.DAY.ms,'Meisterstein','Meistersteine')+' bekommen');
  if(DY.DAY.z.length) bits.push(pluralWith(DY,DY.DAY.z.length,'neuen Ort','neue Orte')+' entdeckt');
  const sum=bits.length?'Heute hast du '+(bits.length>1?bits.slice(0,-1).join(', ')+' und '+bits[bits.length-1]:bits[0])+'. ':'';
  if(why==='lim') DY.speak('Für heute ist die Spielzeit um, die deine Eltern eingestellt haben. '+sum+'Tippe auf den Mond. Morgen geht es genau hier weiter.');
  else DY.speak('Ein Lagerfeuer! Zeit für eine kleine Pause. '+sum+'Du kannst weiterspielen, oder für heute Schluss machen.');
}
/** @param {Port} DY */
export function campRestWith(DY){
  DY.saveGame(false);
  DY.$('camp-s').classList.add('night');
  DY.speak('Gute Nacht! Dein Spiel ist gespeichert. Morgen geht es genau hier weiter.');
}
/** @param {Port} DY */
export function goldSwapWith(DY){
  const g=Math.max(0,ST.gold|0), m=Math.max(0,ST.gems|0);
  if(!g&&!m) return;
  const z=Math.ceil(g/DY.GOLDZ)+Math.ceil(m/DY.GEMZ);
  hero.mat.zr=(hero.mat.zr|0)+z; hero.mk.zr=1; ST.gold=0; ST.gems=0;
  DY.saveHero(); DY.saveFinds(); DY.labBadge(false);
  setTimeout(function(){ DY.banner('⚙️ +'+z,2600); DY.say('','Professor Zahnrad hat deinen Schatz in '+z+(z>1?' Zahnräder':' Zahnrad')+' getauscht. Damit kannst du in der Werkstatt bauen.'); },1300);
}
