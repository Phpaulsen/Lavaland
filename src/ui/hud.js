/* ---------- Oberfläche: Werkzeug wählen, Leiste abgleichen, Knopf-Puls, Blitz, Banner, Sprechblasen und Ansagen, Belohnung, Besitz, Aktionsknopf ---------- */
// PR 29f. Bewegt aus legacy.js. Was die Oberfläche vom übrigen Spiel braucht, kommt über den Port HU; Zeitgeber (bannerT, sayT) und Strich-Zustand bleiben vorerst in legacy.js, geschrieben über Setter.
// legacy.js ruft alle Funktionen über Einzeiler (viele Abschnitte, Ports und Tests). Tastenkürzel und Wischsperre (keyShort, canScroll) bleiben bei den Handlern.
import { ST } from '../state/facade.js';
import { P, hero } from '../state/game.js';
import { AU, jingle } from '../audio/sound.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} HU @param {any} t @param {any} force */
export function setToolWith(HU,t,force){ ST.tool=(ST.tool===t&&!force)?null:t; HU.stroke=null; HU.strokeId=null; syncUIWith(HU); }
/** @param {Port} HU */
export function syncUIWith(HU){
  for(const m of HU.MODES) HU.$('mode-'+m).setAttribute('aria-pressed',String(P.mode===m));
  for(const t of HU.TOOLN) HU.$('tool-'+t).setAttribute('aria-pressed',String(ST.tool===t));
  HU.$('btn-veh').firstChild.innerHTML=HU.IC[P.mode];
  HU.$('btn-tool').firstChild.innerHTML=ST.tool?HU.IC[ST.tool]:HU.QI.hand;
  HU.$('btn-tool').setAttribute('aria-pressed',String(!!ST.tool));
  HU.$('tool-magic').setAttribute('aria-pressed',String(!!HU.PAINT[ST.tool]));
}
/** @param {Port} HU @param {any} id */
export function pulseWith(HU,id){
  if(id.indexOf('mode-')===0) pulseWith(HU,'btn-veh'); else if(id.indexOf('tool-')===0){ pulseWith(HU,'btn-tool'); if(HU.PAINT[id.slice(5)]) pulseWith(HU,'tool-magic'); }
  const el=HU.$(id); if(!el||el.classList.contains('pulse')) return;
  el.classList.add('pulse');
  setTimeout(function(){el.classList.remove('pulse');},2700);
}
/** @param {Port} HU @param {any} id @param {any} cls */
export function flashWith(HU,id,cls){ const el=HU.$(id); el.classList.add(cls); setTimeout(function(){el.classList.remove(cls);},1300); }
/** @param {Port} HU @param {any} html @param {any} ms */
export function bannerWith(HU,html,ms){
  HU.$('banner-in').innerHTML=html; HU.$('banner').classList.add('show');
  clearTimeout(HU.bannerT); HU.bannerT=setTimeout(function(){ HU.$('banner').classList.remove('show'); },ms||1800);
}
/* Höchste Zahl beim Sternezählen im Fernrohr: nach Schulstand bis 10 oder 20. */
/** @param {Port} HU */
export function postMaxWith(HU){ return HU.SCH.on&&HU.SCH.zr<=1?10:20; }
/** @param {Port} HU */
export function uiOpenWith(HU){ for(const o of HU.OVS) if(!o.hidden) return true; return false; }
/** @param {Port} HU */
export function syncSoundWith(HU){ HU.$('sound').innerHTML=HU.svg24(AU.muted?HU.QI.mute:AU.fxOff?HU.QI.talk:HU.QI.sound); HU.$('sound').setAttribute('aria-pressed',String(!AU.muted)); HU.$('sound').setAttribute('aria-label',AU.muted?'Ton ist aus':AU.fxOff?'Nur Sprache':'Ton ist an'); }
/** @param {Port} HU @param {any} x @param {any} y @param {any} n */
export function puffWith(HU,x,y,n){ for(let i=0;i<n;i++) HU.spawn(10,x+(Math.random()-.5)*16,y+(Math.random()-.5)*8,(Math.random()-.5)*170,-40-Math.random()*120,.45+Math.random()*.35,2.5+Math.random()*3); }
/** @param {Port} HU @param {any} x @param {any} y @param {any} s @param {any} col */
export function shoutWith(HU,x,y,s,col){ HU.spawn(9,x,y,0,-48,1.3,19,s,col||'#fff8e6'); }
/** @param {Port} HU */
export function flXWith(HU){ return HU.FLX; }
/* Erzählen: Der Text wird vorgelesen und steht zum Mitlesen unten im Bild. Solange erzählt wird, schweigen die anderen Ansagen. */
/** @param {Port} HU @param {any} who @param {any} text */
export function sayWith(HU,who,text){
  const ms=900+text.length*72;
  HU.$('say-in').innerHTML=(who?'<b>'+who+':</b> ':'')+text; HU.$('say').classList.add('show');
  clearTimeout(HU.sayT); HU.sayT=setTimeout(function(){ HU.$('say').classList.remove('show'); },ms+500);
  ST.talkLock=0; HU.speak(text); ST.talkLock=performance.now()+ms;
  return ms/1000;
}
/** @param {Port} HU @param {any} sec @param {any} fn */
export function laterWith(HU,sec,fn){ HU.stq.push({t:sec,fn:fn}); }
/** @param {Port} HU @param {any} lines @param {any} done */
export function tellWith(HU,lines,done){
  let i=0;
  const next=function(){ if(i>=lines.length){ if(done) done(); return; } const l=lines[i++]; laterWith(HU,sayWith(HU,l[0],l[1])+.2,next); };
  next();
}
/** @param {Port} HU */
export function rewardWith(HU){
  ST.lootDirty=true; HU.confetti(P.x,P.y); jingle();
  bannerWith(HU,'⭐',2300);
}
/** @param {Port} HU */
export function syncOwnWith(HU){
  HU.$('mode-dragon').classList.toggle('gone',!hero.own.dragon);
  HU.$('tool-fw').classList.toggle('gone',!hero.own.fw);
}
/** @param {Port} HU @param {any} e */
export function qEmoWith(HU,e){ return '<text x="12" y="19" font-size="17" text-anchor="middle">'+e+'</text>'; }
/** @param {Port} HU */
export function actIconWith(HU){
  if(P.zip) return 'jump';
  if(P.mode==='walk'){ if(HU.zipNear()) return 'hook'; if(HU.nearScope()) return 'scope'; const da=HU.deepIcon(); if(da) return da; }
  if(P.mode==='walk') return HU.nearLift()?'lift':ST.tool==='bow'?'bow':HU.DIGT[ST.tool]?'dig':(P.chute?'down':(P.on||P.air<.15?'jump':'chute'));
  if(P.mode==='ski') return HU.nearLift()?'lift':(P.on||P.ball>0?'jump':'spin');
  if(P.mode==='dragon') return 'flame';
  if(P.mode==='sub') return 'sonar';
  if(P.mode==='boat') return HU.boatWet()?'horn':'exit';
  if(P.mode==='heli') return P.on&&!HU.heliLoad?'exit':'hook';
  if(P.mode==='car') return 'turbo';
  if(P.mode==='bagger') return (P.arm<-.15&&P.load>0)?'down':'dig';
  if(P.mode==='loader') return (P.lift>18&&P.load>0)?'down':'dig';
  if(P.mode==='dumper') return 'down';
  if(P.mode==='tbm') return 'dig';
  if(P.mode==='plane'||P.mode==='rocket'||P.mode==='balloon') return P.on?'exit':'chute';
  return 'exit';
}
