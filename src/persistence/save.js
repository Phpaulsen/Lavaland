// Speichern: Spielstand packen (snapshot), sofort oder in Häppchen speichern (saveGame, autosave), Held, Funde und Lernstand in localStorage.
// Bewegt aus legacy.js (PR 14e). Was das Speichern vom übrigen Spiel braucht, kommt über den Port SV (Rückmeldung mit Banner, Ton und Sprache in gleicher Reihenfolge, Welt, Lernkern).
// Spielzustand liest es über die Fassade ST. packJob, saveT und lootT gehören nur dem Speichern und sind Modulvariablen.
import { ST } from '../state/facade.js';
import { K_FACTS, K_FINDS, K_HERO, realmKey } from './keys.js';
import { P, hero, parked } from '../state/game.js';
import { GX, GY } from '../core/world/const.js';
import { grid } from '../state/world.js';

/** @typedef {Record<string, any>} Port */
export let saveT=0, lootT=0;
/** @param {any} SV */
export function saveFindsWith(SV){ if(ST.frozen) return; try{ localStorage.setItem(K_FINDS,JSON.stringify({ids:ST.found,gold:ST.gold,gems:ST.gems})); }catch(_){} }
/** @param {any} SV @param {any} [pre] @param {any} [pf] */
export function snapshotWith(SV,pre,pf){
  const F=pf==null?SV.genF:pf, g=pre||SV.packRuns(F);
  const pk=/** @type {any} */ ({});
  for(const k in parked) pk[k]=parked[k]?Object.assign({},parked[k]):null;
  if(P.mode!=='walk'&&P.mode!=='coaster'&&P.mode!=='ski'&&P.mode!=='dragon') pk[P.mode]=SV.park();
  return {v:5,w:2,vt:1,rl:SV.realm,gy:GY,f:F,snow:1,seed:SV.SEED,runs:g,tracks:ST.tracks.map(/** @param {any} T */ function(T){return {raw:T.raw,user:T.user,rb:!!T.rb};}),zips:ST.zips,px:P.x,py:P.y,parked:pk,
    trees:SV.trees.map(/** @param {any} t */ function(t){return t.state===1?2:t.state;}),hidden:ST.hidden,energy:ST.energy,props:ST.props,seen:ST.seen,eggGot:ST.eggGot,lootGot:ST.lootGot,orbGot:ST.orbGot,matGot:ST.matGot,pzGot:ST.pzGot};
}
/* Autospeichern in Häppchen: Das Packen der Welt dauert auf einem schwachen Handy bis zu einer halben Sekunde und ruckelt dann sichtbar. Darum packt das Autospeichern pro Bild nur so viele Spalten, wie in 4 ms passen. Jede Spalte ist für sich vollständig, der Stand bleibt also immer lesbar. Ändert sich während des Packens eine schon gepackte Spalte, kommt das beim nächsten Speichern mit. Beim Verlassen, Reisen und Antippen wird weiter sofort am Stück gespeichert. */
/** @type {any} */
export let packJob=null;
/** @param {any} SV */
export function packStartWith(SV){ if(ST.saving||!ST.ready||ST.frozen||ST.traveling||packJob) return; packJob={cx:0,f:SV.genF,rl:SV.realm,out:new Uint8Array(1<<20),n:0}; }
/** @param {any} SV */
export function packStepWith(SV){
  const J=packJob;
  if(!J) return;
  if(J.rl!==SV.realm||ST.traveling||ST.frozen||!ST.ready){ packJob=null; return; }
  const t0=performance.now(), G=grid, W=GX, end0=GY*W;
  let out=J.out, n=J.n, cx=J.cx;
  while(cx<J.f){
    let i=cx; const end=cx+end0;
    while(i<end){
      const m=G[i], st=i; i+=W;
      while(i<end&&G[i]===m) i+=W;
      let r=(i-st)/W;
      if(n+8>out.length){ const o=new Uint8Array(out.length*2); o.set(out); out=o; }
      out[n++]=m; while(r>=128){ out[n++]=(r&127)|128; r>>>=7; } out[n++]=r;
    }
    cx++;
    if((cx&15)===0&&performance.now()-t0>4) break;
  }
  J.out=out; J.n=n; J.cx=cx;
  if(cx<J.f) return;
  packJob=null;
  if(ST.saving) return;
  ST.saving=true; saveFindsWith(SV); saveHeroWith(SV);
  SV.idbDo('readwrite',/** @param {any} st */ function(st){ return st.put(snapshotWith(SV,out.slice(0,n),J.f),realmKey(J.rl)); }).then(function(){ ST.saving=false; },function(){ ST.saving=false; });
}
/** @param {any} SV @param {any} manual */
export function saveGameWith(SV,manual){
  packJob=null;
  if(ST.saving||!ST.ready||ST.frozen||ST.traveling) return;
  ST.saving=true; saveFindsWith(SV); saveHeroWith(SV);
  SV.idbDo('readwrite',/** @param {any} st */ function(st){ return st.put(snapshotWith(SV),realmKey(SV.realm)); }).then(function(){
    ST.saving=false; if(manual){ SV.flash('save','ok'); SV.tone([660,880]); SV.speak('Gespeichert.'); SV.banner(SV.svg24(SV.QI.save)+'<svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5" stroke="#2f8f4a" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',1400); setTimeout(function(){ SV.$('menu').hidden=true; },500); }
  },function(){
    ST.saving=false; if(manual){ SV.flash('save','warn'); SV.tone([170],'sawtooth'); }
  });
}
/** @param {any} SV @param {any} dt */
export function autosaveWith(SV,dt){
  saveT+=dt; lootT+=dt;
  if(lootT>.5&&(ST.lootDirty||ST.heroDirty)){ lootT=0; if(ST.lootDirty) saveFindsWith(SV); if(ST.heroDirty) saveHeroWith(SV); ST.lootDirty=false; ST.heroDirty=false; SV.hudLoot(); }
  if(saveT>40){ saveT=0; packStartWith(SV); }
  packStepWith(SV);
}
/** @param {any} SV */
export function saveHeroWith(SV){ if(ST.frozen) return; try{ localStorage.setItem(K_HERO,JSON.stringify(hero)); }catch(_){} }
/** @param {any} SV */
export function saveFactsWith(SV){ if(ST.frozen) return; try{ localStorage.setItem(K_FACTS,JSON.stringify(SV.FS)); }catch(_){} }
