/* ---------- Lernkern-Rest: Akku leeren, Antwortauswahl, Tageszahl, Fakten laden, Fakt wählen, Fakt verbuchen, Meisterstein, Aufgabe erzeugen, Schulstand speichern ---------- */
// PR 29c. Bewegt aus legacy.js. Zustand (FS, SCH, kindHist, retry, lastF, lastDom) bleibt vorerst in app/wire.js und kommt mit Settern über den Port LK.
// Die Speicherschlüssel K_FACTS, K_SKILL, K_SCHOOL kommen über den Port (systems/ darf persistence/ nicht importieren). app/wire.js ruft alle Funktionen über Einzeiler (Start, Ports QZ, PV und Tests).
// genQ ruft pickFact über den Port (Getter auf den Einzeiler), damit Tests ihn in app/wire.js ersetzen können.
import { P, hero } from '../state/game.js';
import { ST } from '../state/facade.js';
import { blip } from '../audio/sound.js';
import { clamp } from '../core/world/const.js';
import { STAGES, fKind, fDom, fStage } from '../core/learn/facts.js';
import { NEWDAY, BOXD } from '../core/learn/leitner.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} LK @param {any} dt */
export function drainWith(LK,dt){
  if(P.mode!=='walk'||(ST.tool&&!LK.HANDT[ST.tool]&&(!LK.PAINT[ST.tool]&&ST.tool!=='tnt'||ST.energy<=0))){
    ST.energy-=dt;
    if(ST.energy<=0){ ST.energy=0; LK.battLow=false; LK.$('batt').classList.remove('low'); LK.renderBatt(); LK.openQuiz(null); return; }
    /* Kurz vor leer blinkt der Akku und tickt, damit die Lernaufgabe nicht aus dem Nichts kommt. */
    if(ST.energy<6&&Math.ceil(ST.energy)!==LK.warnS){ LK.warnS=Math.ceil(ST.energy); blip(660,660,.06,'square',.05); }
  }
  const low=ST.energy>0&&ST.energy<12;
  if(low!==LK.battLow){ LK.battLow=low; LK.$('batt').classList.toggle('low',low); }
  LK.renderBatt();
}
/** @param {Port} LK @param {any} ans @param {any} n @param {any} max */
export function numOptsWith(LK,ans,n,max){
  const o=[ans]; let guard=0;
  while(o.length<n&&guard++<80){ const v=ans+LK.ri(-3,3); if(v>=0&&v<=max&&o.indexOf(v)<0) o.push(v); }
  return LK.shuffle(o).map(String);
}
/** @param {Port} LK @param {any} [t] */
export function dayNoWith(LK,t){ const d=t?new Date(t):new Date(); return Math.floor((d.getTime()-d.getTimezoneOffset()*6e4)/864e5); }
/** @param {Port} LK */
export function loadFactsWith(LK){
  try{ LK.FS=JSON.parse(localStorage.getItem(LK.K_FACTS)||'null'); }catch(_){ LK.FS=null; }
  if(!LK.FS||LK.FS.v!==1||!LK.FS.f){
    /* Wer schon mit dem alten Zähler weit war, startet eine Stufe höher. Den Rest erledigt der Schnellaufstieg. */
    let sk=0; try{ sk=parseInt(localStorage.getItem(LK.K_SKILL)||'0',10)||0; }catch(_){}
    const t=sk>=22?2:sk>=8?1:0;
    LK.FS={v:1,u:{m:t,l:t},f:{},nd:0,nn:{m:0,l:0},ft:{m:0,l:0}};
  }
  /* Stufen und Zähler absichern: Eine Stufe über der letzten würde jede Aufgabe abstürzen lassen. */
  if(!LK.FS.u||typeof LK.FS.u!=='object') LK.FS.u={m:0,l:0};
  if(!LK.FS.nn||typeof LK.FS.nn!=='object') LK.FS.nn={m:0,l:0};
  if(!LK.FS.ft||typeof LK.FS.ft!=='object') LK.FS.ft={m:0,l:0};
  ['m','l'].forEach(function(d){ LK.FS.u[d]=clamp(LK.FS.u[d]|0,0,/** @type {any} */ (STAGES)[d].length-1); LK.FS.nn[d]=LK.FS.nn[d]|0; LK.FS.ft[d]=LK.FS.ft[d]|0; });
  if(!LK.FS.dm||typeof LK.FS.dm!=='object'||!LK.FS.dm.c||typeof LK.FS.dm.c!=='object') delete LK.FS.dm;
  for(const k in LK.FS.f){ const r=LK.FS.f[k]; if(!Array.isArray(r)||!(r[0]>=0)||!isFinite(r[1])) delete LK.FS.f[k]; else r[0]=clamp(r[0]|0,0,5); }
}
/** @param {Port} LK */
export function pickFactWith(LK){ const k=pickFact0With(LK); LK.kindHist.unshift(fKind(k)); LK.kindHist.length=Math.min(LK.kindHist.length,2); return k; }
/** @param {Port} LK */
export function pickFact0With(LK){
  const today=dayNoWith(LK);
  if(LK.FS.nd!==today){ LK.FS.nd=today; LK.FS.nn={m:0,l:0}; }
  for(let i=0;i<LK.retry.length;i++) LK.retry[i].n--;
  const ri0=LK.retry.findIndex(/** @param {any} r */ function(r){ return r.n<=0&&r.k!==LK.lastF; });
  if(ri0>=0) return LK.retry.splice(ri0,1)[0].k;
  const doms=Math.random()<.6?['m','l']:['l','m'];
  for(let p=0;p<2;p++){
    for(const d of doms){
      const due=/** @type {any[]} */ ([]), fresh=/** @type {any[]} */ ([]);
      for(let s=0;s<=LK.FS.u[d];s++) /** @type {any} */ (STAGES)[d][s].forEach(/** @param {any} k */ function(k){
        if(k===LK.lastF||LK.retry.some(/** @param {any} r */ function(r){ return r.k===k; })) return;
        const r=LK.FS.f[k];
        if(!r){ if(LK.schoolOk(k,s)) fresh.push([k,s]); }
        else if(r[1]<=today) due.push(k);
      });
      /* Fällige zuerst, die schwächsten vorn. Neue nur in Maßen, damit nicht zu viel Ungeübtes auf einmal kommt. */
      if(due.length&&(p||Math.random()<.75||!fresh.length)){
        due.sort(function(a,b){ return LK.FS.f[a][0]-LK.FS.f[b][0]||LK.FS.f[a][1]-LK.FS.f[b][1]; });
        const dv=LK.mixPrefer(due.slice(0,6));
        return dv[LK.ri(0,Math.min(2,dv.length-1))];
      }
      let open=0; for(const k in LK.FS.f) if(fDom(k)===d&&LK.FS.f[k][0]===1) open++;
      if(fresh.length&&LK.FS.nn[d]<NEWDAY&&open<4){
        /* Meist aus der höchsten offenen Stufe, damit nach der Einstufung nicht das längst Gekonnte drankommt. */
        const top=fresh.filter(function(x){ return x[1]===LK.FS.u[d]; }), pool=top.length&&Math.random()<.7?top:fresh;
        const pv=LK.mixPrefer(pool.map(function(x){ return x[0]; }));
        return pv[LK.ri(0,pv.length-1)];
      }
    }
  }
  /* Nichts fällig und nichts Neues: früh wiederholen, ohne dass das Fach steigt. */
  const any=Object.keys(LK.FS.f).filter(function(k){ return k!==LK.lastF&&!LK.fParked(k,today); });
  if(any.length){ any.sort(function(a,b){ return LK.FS.f[a][1]-LK.FS.f[b][1]; }); return any[LK.ri(0,Math.min(4,any.length-1))]; }
  return STAGES.m[0][LK.ri(0,STAGES.m[0].length-1)];
}
/* how: 'ok' beim ersten Versuch, 'ok2' beim zweiten Versuch am Ziffernblock, 'miss' falsch. */
/** @param {Port} LK @param {any} q @param {any} how @param {any} fast */
export function factDoneWith(LK,q,how,fast){
  const k=q.f, d=fDom(k), today=dayNoWith(LK);
  let r=LK.FS.f[k];
  const isNew=!r;
  if(isNew){ r=LK.FS.f[k]=[0,today]; LK.FS.nn[d]++; }
  const wasDue=r[1]<=today;
  if(how==='miss'){
    r[0]=1; r[1]=today; LK.FS.ft[d]=0;
    /* Dreimal am selben Tag falsch: Der Fakt ruht bis morgen. Sonst kommt er immer wieder, und aus Üben wird Frust (Reim auf Tanne: 8 Fehler an einem Nachmittag). */
    if(!LK.FS.dm||LK.FS.dm.d!==today) LK.FS.dm={d:today,c:{}};
    LK.FS.dm.c[k]=(LK.FS.dm.c[k]|0)+1;
    if(LK.fParked(k,today)){ r[1]=today+1; for(let i=LK.retry.length-1;i>=0;i--) if(LK.retry[i].k===k) LK.retry.splice(i,1); }
    else LK.retry.push({k:k,n:LK.ri(2,3)});
  }else if(how==='ok2'){
    r[0]=Math.max(1,r[0]); r[1]=today+1; LK.FS.ft[d]=0;
  }else if(isNew&&fast){
    r[0]=3; r[1]=today+BOXD[3];
    if(fStage(k)===LK.FS.u[d]) LK.FS.ft[d]++;
  }else if(isNew||wasDue){
    r[0]=Math.min(5,Math.max(1,r[0])+1); r[1]=today+BOXD[r[0]];
    if(isNew) LK.FS.ft[d]=0;
  }
  const mg=r[0]>=LK.MBOX&&!q.free&&masterGiveWith(LK,k);
  LK.fUnlock(d); LK.saveFacts();
  return mg;
}
/** @param {Port} LK @param {any} k */
export function masterGiveWith(LK,k){
  if(!LK.FS.mg) LK.FS.mg={};
  if(LK.FS.mg[k]) return false;
  LK.FS.mg[k]=1; hero.mat.ms=(hero.mat.ms|0)+1; LK.dayAdd('ms'); hero.mk.ms=1; ST.heroDirty=true; LK.saveHero();
  LK.labBadge(true);
  return true;
}
/** @param {Port} LK */
export function genQWith(LK){
  if(Math.random()<.1&&LK.lastF.indexOf('seq:')!==0){ const q=LK.mkSeq(); LK.lastF=q.f; LK.lastDom='m'; return q; }
  const k=LK.pickFact(), q=LK.mkQ(k), r=LK.FS.f[k];
  q.box=r?r[0]:0; LK.lastF=k; LK.lastDom=fDom(k);
  return q;
}
/** @param {Port} LK */
export function saveSchoolWith(LK){ LK.SCH.at=Date.now(); try{ localStorage.setItem(LK.K_SCHOOL,JSON.stringify(LK.SCH)); }catch(_){} }
