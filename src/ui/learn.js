/* ---------- Lernen auf dem Bildschirm: Akku-Anzeige, Lernaufgabe mit Ziffernblock, Rechentafel ---------- */
// PR 25. Bewegt aus legacy.js. Die Fakten, Leitner und die Aufgaben selbst liegen in core/learn/, Auswahl und Buchführung (pickFact, factDone, genQ)
// bleiben vorerst in legacy.js. Was die Oberfläche vom übrigen Spiel braucht, kommt über den Port QZ.
import { ST } from '../state/facade.js';
import { clamp } from '../core/world/const.js';
import { keys, hero, P } from '../state/game.js';
import { speakStop, tone, jingle } from '../audio/sound.js';
import { RHYW, fName, STAGES, WORDS, SYL, CASES } from '../core/learn/facts.js';
import { FASTMS } from '../core/learn/leitner.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} QZ */
export function renderBattWith(QZ){
  const k=Math.ceil(ST.energy/QZ.SEG*8);
  if(k===QZ.battShown) return;
  QZ.battShown=k;
  for(const id of ['batt-cells','quiz-cells']){
    const cells=QZ.$(id).children;
    for(let i=0;i<5;i++) cells[i].firstChild.style.height=Math.round(clamp((ST.energy-i*QZ.SEG)/QZ.SEG,0,1)*100)+'%';
  }
  document.body.classList.toggle('locked',ST.energy<=0);
  QZ.$('quiz-go').hidden=ST.energy<=0;
}
/** @param {Port} QZ @param {any} fn */
export function needWith(QZ,fn){ if(ST.energy>0) fn(); else openQuizWith(QZ,fn); }
/** @param {Port} QZ @param {any} then */
export function openQuizWith(QZ,then){
  if(then) QZ.pending=then;
  ST.paused=true; keys.l=keys.r=keys.u=keys.d=keys.a=false; ST.talkLock=0;
  QZ.$('quiz').hidden=false; QZ.LOG.qOpen(); nextQWith(QZ);
  QZ.$('quiz-pz').textContent=QZ.PZON[(hero.pzn|0)%QZ.PZON.length].e; QZ.$('quiz-pz').classList.toggle('near',(hero.pzn|0)<3);
}
/** @param {Port} QZ */
export function closeQuizWith(QZ){
  QZ.LOG.qClose();
  QZ.doorQ=null; QZ.$('quiz-pz').hidden=false;
  QZ.$('quiz').hidden=true; ST.paused=false;
  speakStop();
  const f=QZ.pending; QZ.pending=null;
  if(ST.energy>0){ if(f) f(); }
  else{ if(!QZ.HANDT[ST.tool]) QZ.setTool(null,true); if(P.mode!=='walk'){ const air=!P.on; QZ.setMode('walk'); if(air){ P.chute=true; P.vy=Math.min(P.vy,0); } } QZ.pulse('batt'); }
}
/** @param {Port} QZ */
export function nextQWith(QZ){
  QZ.qcur=QZ.genQ();
  const q=QZ.qcur;
  QZ.$('q').innerHTML=q.html;
  const ans=QZ.$('ans'); ans.innerHTML=''; ans.classList.toggle('kp',q.pad);
  if(q.pad){
    ans.style.gridTemplateColumns='repeat(3,minmax(0,1fr))';
    QZ.PADK.forEach(/** @param {any} k */ function(k){
      const b=document.createElement('button');
      b.className='opt key'+(k==='ok'?' go':'')+(k==='del'?' del':'');
      b.dataset.k=k;
      if(k==='ok'){ b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'; b.setAttribute('aria-label','Fertig'); }
      else if(k==='del'){ b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h11v14H9l-6-7z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M12 9l5 6M17 9l-5 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'; b.setAttribute('aria-label','Löschen'); }
      else b.textContent=k;
      b.addEventListener('click',function(){ padKeyWith(QZ,k); });
      ans.appendChild(b);
    });
  }else{
    ans.style.gridTemplateColumns='repeat('+(q.word?2:3)+',minmax(0,1fr))';
    q.opts.forEach(/** @param {any} v */ function(v){
      const b=document.createElement('button');
      b.className='opt'+(q.word?' word':'')+(q.type==='syl'?' clap':'')+(q.pics?' pic':''); b.dataset.v=v;
      if(q.pics){ b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+QZ.QI[RHYW[v].ic]+'</svg>'; b.setAttribute('aria-label',v); } else b.textContent=v;
      b.addEventListener('click',function(){ answerWith(QZ,b,v); });
      ans.appendChild(b);
    });
  }
  QZ.battShown=-1; renderBattWith(QZ);
  const u=QZ.speak(q.say);
  QZ.LOG.qStart(q,u);
  /* Für den Schnellaufstieg zählt die Zeit ab Ende der Vorlesung. */
  q.t0=performance.now(); q.te=q.t0;
  if(u){ const prev=u.onend; u.onend=/** @param {any} e */ function(e){ if(prev) prev(e); q.te=performance.now(); }; }
}
/** @param {Port} QZ @param {any} t */
export function holeShowWith(QZ,t){ const h=QZ.$('q').querySelector('.hole'); if(h) h.textContent=t; }
/** @param {Port} QZ @param {any} k */
export function padKeyWith(QZ,k){
  const q=QZ.qcur;
  if(!q||q.lock||!q.pad) return;
  if(k==='ok'){ if(q.inp) padSubmitWith(QZ); return; }
  if(k==='del') q.inp=q.inp.slice(0,-1);
  else{ if(!q.k1) q.k1=performance.now(); if(q.inp==='0') q.inp=k; else if(q.inp.length<2) q.inp+=k; }
  holeShowWith(QZ,q.inp||'?');
}
/** @param {Port} QZ */
export function padSubmitWith(QZ){
  const q=QZ.qcur, v=String(+q.inp);
  if(v===q.ans){ QZ.LOG.qTap(v); winWith(QZ,q,q.tries?'ok2':'ok'); return; }
  if(!q.tries){
    /* Erster Fehler am Ziffernblock: nochmal, denn oft ist es nur vertippt. */
    q.tries=1; q.inp=''; QZ.LOG.qTap(v,true); tone([300,240]);
    const h=QZ.$('q').querySelector('.hole'); if(h){ h.textContent='?'; h.classList.remove('bump'); void h.offsetWidth; h.classList.add('bump'); }
    const z=QZ.$('q').querySelector('.zf.blink'); if(z){ z.classList.remove('blink'); void z.offsetWidth; z.classList.add('blink'); }
    QZ.speak('Noch einmal.');
    return;
  }
  QZ.LOG.qTap(v); loseWith(QZ,q);
}
/** @param {Port} QZ @param {any} b @param {any} v */
export function answerWith(QZ,b,v){
  const q=QZ.qcur;
  if(!q||q.lock) return;
  if(!q.k1) q.k1=performance.now();
  QZ.LOG.qTap(v);
  if(v===q.ans){ b.classList.add('ok'); winWith(QZ,q,'ok'); return; }
  b.classList.add('no');
  for(const o of QZ.$('ans').children){ o.disabled=true; if((o.dataset.v||o.textContent)===q.ans) o.classList.add('ok'); }
  loseWith(QZ,q);
}
/** @param {Port} QZ @param {any} q @param {any} how */
export function winWith(QZ,q,how){
  q.lock=true; holeShowWith(QZ,q.ans);
  const h=QZ.$('q').querySelector('.hole'); if(h) h.classList.add('ok');
  const fast=how==='ok'&&!q.nofast&&q.k1&&q.k1-Math.max(q.t0,q.te)<FASTMS;
  const mg=!q.free&&QZ.factDone(q,how,fast);
  if(mg){ QZ.banner('💠 '+(hero.mat.ms|0),2400); setTimeout(function(){ jingle(); QZ.speak('Meisterstein! '+fName(q.f)+' sitzt jetzt richtig gut.'); },350); QZ.labBadge(false); }
  QZ.dayAdd('q');
  ST.energy=Math.min(QZ.MAXE,ST.energy+QZ.SEG); tone(how==='ok'?[660,880]:[520,660]); QZ.qEvent('quiz',1);
  QZ.battShown=-1; renderBattWith(QZ);
  if(QZ.doorQ){
    QZ.doorQ.n++; QZ.banner('🚪 '+'●'.repeat(QZ.doorQ.n)+'○'.repeat(Math.max(0,3-QZ.doorQ.n)),1500);
    if(QZ.doorQ.n>=3){ const v=QZ.doorQ.v; setTimeout(function(){ if(QZ.qcur!==q) return; closeQuizWith(QZ); QZ.doorOpen(v); },800); return; }
  }
  setTimeout(function(){ if(QZ.$('quiz').hidden||QZ.qcur!==q) return; if(ST.energy>=QZ.MAXE&&!QZ.doorQ) closeQuizWith(QZ); else nextQWith(QZ); },800);
}
/* Falsch: Die Lösung wird gezeigt und vorgelesen, beim Rechnen mit Punkten. Keine Strafe, der Fakt kommt bald wieder. */
/** @param {Port} QZ @param {any} q */
export function loseWith(QZ,q){
  q.lock=true; q.miss=true; tone([170],'sawtooth');
  if(!q.free) QZ.factDone(q,'miss',false);
  holeShowWith(QZ,q.ans);
  const h=QZ.$('q').querySelector('.hole'); if(h) h.classList.add('sol');
  if(q.pad){
    if(q.dots&&!QZ.$('q').querySelector('.dots')) QZ.$('q').insertAdjacentHTML('beforeend',q.dots);
    for(const o of QZ.$('ans').children) o.disabled=true;
  }
  QZ.speak(q.sol);
  setTimeout(function(){ if(QZ.$('quiz').hidden||QZ.qcur!==q) return; nextQWith(QZ); },q.pad?3600:2200);
}
/** @param {Port} QZ @param {any} k @param {any} t */
export function tafCellWith(QZ,k,t){ const r=QZ.FS.f[k], b=r?r[0]:0; return '<span class="'+(b?'b'+b:'')+'">'+(b>=5?'⭐':b>=QZ.MBOX?'💠':t)+'</span>'; }
/** @param {Port} QZ */
export function renderTafelWith(QZ){
  QZ.$('taf-tabs').innerHTML=[['p','＋'],['m','−'],['z','🏠'],['l','Aa']].map(function(q){ return '<button data-tt="'+q[0]+'"'+(QZ.tafTab===q[0]?' class="on"':'')+' aria-label="'+(q[0]==='p'?'Plus':q[0]==='m'?'Minus':q[0]==='z'?'Zahlenhäuser':'Buchstaben')+'">'+q[1]+'</button>'; }).join('');
  const all=/** @type {Record<string, number>} */ ({}); STAGES.m.forEach(function(s){ s.forEach(function(k){ all[k]=1; }); }); STAGES.l.forEach(function(s){ s.forEach(function(k){ all[k]=1; }); });
  let h='', cols=9;
  if(QZ.tafTab==='z'){
    cols=10;
    for(let n=4;n<=10;n++){ h+='<span class="hd">'+n+'</span>'; for(let a=1;a<=9;a++) h+=a<n?tafCellWith(QZ,'zl:'+n+':'+a,a+'+'+(n-a)):'<span class="x"></span>'; }
  }else if(QZ.tafTab==='l'){
    cols=4;
    WORDS.forEach(function(wd){ h+=tafCellWith(QZ,'anlaut:'+wd.w,wd.w.charAt(0)+'…')+tafCellWith(QZ,'word:'+wd.w,wd.w); });
    SYL.forEach(function(x){ h+=tafCellWith(QZ,'syl:'+x[0],x[2].replace(/-/g,'·')); });
    Object.keys(RHYW).forEach(function(w){ h+=tafCellWith(QZ,'rhy:'+w,w+'~'); });
    CASES.split('').forEach(function(c){ h+=tafCellWith(QZ,'case:'+c,c+' '+c.toLowerCase()); });
  }else{
    const op=QZ.tafTab==='p'?'+':'-';
    for(let a=1;a<=19;a++){
      let row='', any=false;
      for(let b=1;b<=9;b++){ const k=a+op+b; if(all[k]){ any=true; row+=tafCellWith(QZ,k,a+(op==='+'?'+':'−')+b); } else row+='<span class="x"></span>'; }
      if(any) h+=row;
    }
  }
  const g=QZ.$('taf-grid'); g.style.gridTemplateColumns='repeat('+cols+',minmax(0,1fr))'; g.innerHTML=h;
}
/** @param {Port} QZ */
export function openTafelWith(QZ){ QZ.tafTab='p'; renderTafelWith(QZ); QZ.$('tafel').hidden=false; QZ.speak('Deine Rechentafel. Je mehr Farbe, desto besser sitzt die Aufgabe. Ein blauer Stein ist ein Meisterstein.'); }
