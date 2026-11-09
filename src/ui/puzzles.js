/* ---------- Rätselrahmen und Rätsel auf dem Bildschirm: Öffnen, Zeichnen, Antippen, Tipps, Ansagen, Gewinnen ---------- */
// PR 24. Bewegt aus legacy.js. Die Aufgaben selbst (mk…) liegen in core/puzzles/, die Tabelle der Arten (PZT) bleibt vorerst in legacy.js
// und ruft die Funktionen hier über Einzeiler. Was der Rahmen vom übrigen Spiel braucht, kommt über den Port PZ.
import { clamp } from '../core/world/const.js';
import { hero, keys, P } from '../state/game.js';
import { ST } from '../state/facade.js';
import { speakStop, tone, jingle, blip, sfx, AU } from '../audio/sound.js';
import { tkKey } from '../core/puzzles/muster.js';
import { idxs } from '../core/puzzles/util.js';
import { RBD } from '../core/puzzles/robo.js';
import { rhFlow, rhDone } from '../core/puzzles/rohre.js';
import { sdOk } from '../core/puzzles/sudoku.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} PZ @param {any} s @param {any} c */
export function tokWith(PZ,s,c){ return '<svg class="tok" viewBox="0 0 24 24" aria-hidden="true">'+PZ.PSHP[s]+' fill="'+PZ.PCOL[c]+'" stroke="#1d2a3a" stroke-width="2" stroke-linejoin="round"/></svg>'; }
/** @param {Port} PZ @param {any} ms @param {any} fn */
export function pzLaterWith(PZ,ms,fn){ const c=PZ.pzc; PZ.pzTm.push(setTimeout(function(){ if(PZ.pzc===c&&c) fn(); },ms)); }
/** @param {Port} PZ */
export function pzClearWith(PZ){ for(const t of PZ.pzTm) clearTimeout(t); PZ.pzTm=[]; }
/** @param {Port} PZ @param {any} c @param {any} r @param {any} ctl */
export function pzCellWith(PZ,c,r,ctl){
  const land=PZ.H<=480, aw=land?(ctl?Math.min(PZ.W*.5,380):Math.min(PZ.W-90,560)):Math.min(PZ.W-64,480), ah=land?PZ.H-124:PZ.H-(ctl?340:215);
  return Math.max(20,Math.min(56,Math.floor(aw/c)-4,Math.floor(ah/r)-4));
}
/** @param {Port} PZ @param {any} m */
export function pzOpenWith(PZ,m){
  const T=PZ.PZI[m.t], lv=clamp((hero.pz[m.t]|0)+(m.zb|0),0,9);
  keys.l=keys.r=keys.u=keys.d=keys.a=false; ST.talkLock=0;
  PZ.pzc={m:m,T:T,lv:lv,fails:0,hint:0,won:false,busy:false,st:null}; PZ.LOG.pStart(PZ.pzc);
  PZ.$('pz-ic').textContent=T.e;
  let h=''; for(let i=0;i<10;i++) h+='<i'+(i<=lv?' class="on"':'')+'></i>';
  PZ.$('pz-lv').innerHTML=h;
  PZ.$('pz-sheet').setAttribute('aria-label','Rätselmaschine: '+T.n+', Stufe '+(lv+1)+' von 10');
  PZ.$('pz-body').classList.remove('win');
  PZ.pzc.st=T.make(lv);
  PZ.$('pz').hidden=false;
  pzDrawWith(PZ); pzHintUiWith(PZ); PZ.speak(T.say(PZ.pzc.st));
  if(T.start) T.start(PZ.pzc.st);
}
/** @param {Port} PZ */
export function pzDrawWith(PZ){
  const c=PZ.pzc, o=c.T.draw(c.st);
  PZ.$('pz-body').innerHTML=o[0]; PZ.$('pz-ctl').innerHTML=o[1]||'';
  PZ.$('pz-sheet').classList.toggle('noctl',!o[1]);
  if(c.T.post) c.T.post(c.st);
}
/** @param {Port} PZ */
export function pzCloseWith(PZ){
  if(PZ.$('pz').hidden) return;
  const c=PZ.pzc;
  PZ.LOG.pQuit(c);
  pzClearWith(PZ); PZ.$('pz').hidden=true; PZ.pzc=null;
  speakStop();
  /* Wer nach vielen Fehlversuchen aufgibt, bekommt beim nächsten Mal ein leichteres Rätsel dieser Art. */
  if(c&&!c.won&&c.fails>=3){ hero.pz[c.T.id]=Math.max(0,(hero.pz[c.T.id]|0)-1); PZ.saveHero(); }
  /* Vom Akku aus geöffnet: wie beim Schließen der Lernaufgabe. Ist schon etwas geladen, geht es mit dem weiter, wofür der Akku gebraucht wurde. Sonst bliebe der Auftrag liegen und käme viel später aus dem Nichts. */
  if(c&&c.m.quiz&&!c.won){ const f=PZ.pending; PZ.pending=null; if(ST.energy>0){ if(f) f(); } else{ PZ.setTool(null,true); if(P.mode!=='walk') PZ.setMode('walk'); PZ.pulse('batt'); } }
}
/* Tipps: erst nach dem ersten Fehlversuch, einer pro Rätsel (ab Stufe 7 zwei). So hilft der Tipp beim Hängenbleiben, löst aber nicht das Rätsel. */
/** @param {Port} PZ @param {any} c */
export function pzHintMaxWith(PZ,c){ return c.lv>=6?2:1; }
/** @param {Port} PZ */
export function pzHintUiWith(PZ){ const c=PZ.pzc; if(c) PZ.$('pz-hint').classList.toggle('off',c.fails<1||c.hint>=pzHintMaxWith(PZ,c)); }
/** @param {Port} PZ @param {any} [quiet] */
export function pzFailWith(PZ,quiet){
  const c=PZ.pzc; c.fails++;
  if(!quiet) tone([170],'sawtooth');
  if(c.fails===3&&c.hint<pzHintMaxWith(PZ,c)) PZ.pulse('pz-hint');
  pzHintUiWith(PZ);
}
/* Falsche Antwort bei Auswahl-Rätseln: Lösung kurz zeigen, dann ein neues Rätsel gleicher Stufe. Durchprobieren der übrigen Antworten geht so nicht. */
/** @param {Port} PZ @param {any} text */
export function pzRevealWith(PZ,text){
  const c=PZ.pzc; c.busy=true; PZ.speak(text);
  pzLaterWith(PZ,2200,function(){ c.busy=false; c.st=c.T.make(c.lv); pzDrawWith(PZ); PZ.speak(c.T.say(c.st)); });
}
/** @param {Port} PZ */
export function pzWinWith(PZ){
  const c=PZ.pzc; if(!c||c.won) return;
  c.won=true; c.busy=true; pzClearWith(PZ); PZ.LOG.pWin(c);
  const id=c.T.id, first=!c.m.quiz&&!ST.pzGot[c.m.id], clean=c.fails<=1&&!c.hint;
  tone([523,659,784,1047]);
  if(clean) hero.pz[id]=Math.min(9,(hero.pz[id]|0)+1);
  else if(c.fails>=5||c.hint>=2) hero.pz[id]=Math.max(0,(hero.pz[id]|0)-1);
  hero.pzn=(hero.pzn|0)+1; PZ.dayAdd('pz');
  /* Akku: voll nur ohne Fehler und Tipp, sonst ein Strich weniger je Fehler und Tipp, mindestens einer. */
  const segs=clean?5:Math.max(1,5-c.fails-c.hint), full=segs>=5||ST.energy>=PZ.MAXE;
  ST.lootDirty=true; ST.energy=Math.max(ST.energy,segs*PZ.SEG); PZ.battShown=-1; PZ.renderBatt(); PZ.qEvent('pz',1);
  if(first){ ST.pzGot[c.m.id]=1; hero.mat.zr=(hero.mat.zr|0)+1; hero.mk.zr=1; }
  PZ.saveHero();
  PZ.$('pz-body').classList.add('win');
  PZ.banner(first?'⚙️ +1':'⭐',2000);
  setTimeout(function(){
    if(PZ.pzc!==c) return;
    PZ.$('pz').hidden=true; PZ.pzc=null; PZ.confetti(P.x,P.y); jingle();
    if(c.m.door){ PZ.labBadge(true); PZ.doorOpen(c.m.door); return; }
    if(first) PZ.say('',hero.pzn===1?'Geschafft! Die Maschine läuft wieder und schenkt dir ein Zahnrad. Der Akku ist auch wieder geladen. Zahnräder braucht Professor Zahnrad in der Werkstatt.':clean?'Geschafft, ganz ohne Fehler! Noch ein Zahnrad. Das nächste Rätsel dieser Art wird kniffliger.':'Geschafft! Noch ein Zahnrad.');
    else if(clean) PZ.say('',c.m.quiz?'Ohne Fehler! Der Akku ist voll. Das nächste Rätsel dieser Art wird kniffliger.':'Ohne Fehler! Das nächste Rätsel dieser Art wird kniffliger.');
    else if(c.m.quiz) PZ.say('',full?'Geschafft! Der Akku ist wieder voll.':'Geschafft! Der Akku ist ein Stück geladen. Ohne Fehler und Tipp wird er ganz voll.');
    PZ.labBadge(true);
    if(c.m.quiz){ const f=PZ.pending; PZ.pending=null; if(f) f(); }
  },1500);
}
/** @param {Port} PZ @param {any} t */
export function tkHtmlWith(PZ,t){ return t.n!==undefined?'<span class="pzn">'+t.n+'</span>':tokWith(PZ,t.s,t.c); }
/** @param {Port} PZ @param {any} st */
export function drMusterWith(PZ,st){
  let h='<div class="pzrow">';
  st.seq.forEach(/** @param {any} t @param {any} i */ function(t,i){ h+=i===st.hole?'<span class="pzhole" id="pz-hole">?</span>':'<span class="pzt">'+tkHtmlWith(PZ,t)+'</span>'; });
  h+='</div>';
  let c='<div class="pzopts">';
  st.opts.forEach(/** @param {any} t @param {any} i */ function(t,i){ c+='<button class="pzb" data-a="'+i+'" aria-label="Antwort '+(i+1)+'">'+tkHtmlWith(PZ,t)+'</button>'; });
  return [h,c+'</div>'];
}
/** @param {Port} PZ @param {any} st @param {any} a @param {any} b */
export function acMusterWith(PZ,st,a,b){
  const t=st.opts[+a];
  if(tkKey(t)===st.ans){ b.classList.add('ok'); const h=PZ.$('pz-hole'); h.innerHTML=tkHtmlWith(PZ,t); h.style.border='0'; pzWinWith(PZ); }
  else{
    b.classList.add('no'); pzFailWith(PZ);
    for(const o of PZ.$('pz-ctl').querySelectorAll('[data-a]')){ o.disabled=true; if(tkKey(st.opts[+o.dataset.a])===st.ans) o.classList.add('ok'); }
    const h=PZ.$('pz-hole'), t=st.seq[st.hole]; h.innerHTML=tkHtmlWith(PZ,t); h.style.borderColor='#58b548';
    pzRevealWith(PZ,'Schau, das hier gehört in die Lücke. Jetzt kommt eine neue Reihe.');
  }
}
/** @param {Port} PZ @param {any} st */
export function hiMusterWith(PZ,st){
  /* Zeigt den Teil, der sich wiederholt, statt eine Antwort wegzustreichen. */
  if(st.u){ const ts=PZ.$('pz-body').querySelectorAll('.pzrow>span'); for(let i=0;i<st.u&&i<ts.length;i++) if(i!==st.hole) ts[i].classList.add('flash'); }
  PZ.speak(st.k==='cnt'?'Zähle von einer Zahl zur nächsten. Wie viel kommt jedes Mal dazu oder geht weg?':st.k==='two'?'Schau erst nur auf die Form. Dann schau nur auf die Farbe.':'Sprich die Reihe laut mit. Was wiederholt sich immer wieder?');
}
/** @param {Port} PZ @param {any} st */
export function syMusterWith(PZ,st){ return st.k==='cnt'?'Welche Zahl fehlt? Schau, wie die Zahlen größer oder kleiner werden.':st.k==='two'?'Welches Bild fehlt? Achte auf die Form und auf die Farbe.':'Welches Bild fehlt in der Reihe? Schau, was sich wiederholt.'; }
/** @param {Port} PZ */
export function stSideWith(PZ){ const land=PZ.H<=480; return Math.max(220,Math.min(land?PZ.H-130:PZ.W-56,land?420:PZ.H-300,440)); }
/** @param {Port} PZ @param {any} st */
export function drSternWith(PZ,st){
  const w=stSideWith(PZ), m=26, sc=w-2*m;
  let h='<div class="pzsky" id="pz-sky" style="width:'+w+'px;height:'+w+'px"><svg viewBox="0 0 '+w+' '+w+'" aria-hidden="true"><polyline id="pz-line" fill="none" stroke="#9bd8ff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" points=""/></svg>';
  st.pts.forEach(/** @param {any} p @param {any} i */ function(p,i){ h+='<button class="pzdot" data-a="'+i+'" style="left:'+(m+p[0]*sc).toFixed(1)+'px;top:'+(m+p[1]*sc).toFixed(1)+'px" aria-label="Stern '+p[2]+'">'+p[2]+'</button>'; });
  return [h+'</div>'];
}
/** @param {Port} PZ @param {any} st @param {any} close */
export function stLineWith(PZ,st,close){
  const w=stSideWith(PZ), m=26, sc=w-2*m, L=st.pts.slice(0,st.k);
  if(close) L.push(st.pts[0]);
  const el=PZ.$('pz-line'); if(el) el.setAttribute('points',L.map(/** @param {any} p */ function(p){ return (m+p[0]*sc).toFixed(1)+','+(m+p[1]*sc).toFixed(1); }).join(' '));
}
/** @param {Port} PZ @param {any} st @param {any} a @param {any} b */
export function acSternWith(PZ,st,a,b){
  const i=+a;
  if(i<st.k) return;
  if(i===st.k){
    st.k++; b.classList.remove('no'); b.classList.add('done'); stLineWith(PZ,st,false);
    const f=330+st.k*30; blip(f,f*1.2,.12,'triangle',.06);
    if(st.k===st.pts.length){
      stLineWith(PZ,st,true);
      PZ.$('pz-sky').insertAdjacentHTML('beforeend','<div class="pzshape" aria-hidden="true">'+st.sh.e+'</div>');
      PZ.speak('Das ist '+st.sh.n+'!'); pzWinWith(PZ);
    }
    return;
  }
  /* Falsch: Der richtige Stern blinkt und es wird gesagt, welche Zahl kommt. Das Bild bleibt, wie es ist. */
  b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); pzFailWith(PZ);
  const nx=PZ.$('pz-sky').querySelector('[data-a="'+st.k+'"]'); if(nx){ nx.classList.remove('flash'); void nx.offsetWidth; nx.classList.add('flash'); }
  const want=st.pts[st.k][2];
  PZ.speak(st.k?'Nach '+st.pts[st.k-1][2]+' kommt '+want+'.':'Fang bei '+want+' an.');
}
/** @param {Port} PZ @param {any} st */
export function hiSternWith(PZ,st){
  const nx=PZ.$('pz-sky').querySelector('[data-a="'+st.k+'"]'); if(nx){ nx.classList.remove('flash'); void nx.offsetWidth; nx.classList.add('flash'); }
  PZ.speak(st.two?'Immer zwei weiter: 2, 4, 6 und so fort.':'Zähl laut mit. Welche Zahl kommt als Nächstes?');
}
/** @param {Port} PZ @param {any} st */
export function sySternWith(PZ,st){ return 'Verbinde die Sterne der Reihe nach. Fang bei '+st.pts[0][2]+' an'+(st.two?' und zähl immer zwei weiter.':'.'); }
/** @param {Port} PZ @param {any} st @param {any} i */
export function spWantWith(PZ,st,i){ const c=i%st.w, r=(i-c)/st.w; return st.ax?st.a[(st.h-1-r)*st.w+c]:st.a[r*st.w+(st.w-1-c)]; }
/** @param {Port} PZ @param {any} st @param {any} arr @param {any} act */
export function spGridWith(PZ,st,arr,act){
  let h='<div class="pzg" style="grid-template-columns:repeat('+st.w+',var(--cs))">';
  for(let i=0;i<arr.length;i++) h+=act?'<button class="pzc sp'+arr[i]+'" data-a="'+i+'" aria-label="Feld '+(i+1)+'"></button>':'<span class="pzc fix sp'+arr[i]+'"></span>';
  return h+'</div>';
}
/** @param {Port} PZ @param {any} st */
export function drSpiegelWith(PZ,st){
  const cs=st.ax?pzCellWith(PZ,st.w,st.h*2+.6,false):pzCellWith(PZ,st.w*2+.6,st.h,false);
  return ['<div class="pzmir'+(st.ax?' hz':'')+'" style="--cs:'+cs+'px">'+spGridWith(PZ,st,st.a,false)+'<i class="mline"></i>'+spGridWith(PZ,st,st.b,true)+'</div>',''];
}
/** @param {Port} PZ @param {any} st */
export function spDoneWith(PZ,st){ for(let i=0;i<st.b.length;i++) if(st.b[i]!==spWantWith(PZ,st,i)) return false; return true; }
/** @param {Port} PZ @param {any} st @param {any} a @param {any} b */
export function acSpiegelWith(PZ,st,a,b){
  const i=+a, want=spWantWith(PZ,st,i), old=st.b[i];
  st.b[i]=(old+1)%(st.nc+1);
  b.className='pzc sp'+st.b[i]; sfx('tick');
  if(st.b[i]!==want&&(old===want||want===0)) pzFailWith(PZ,true);
  if(spDoneWith(PZ,st)) pzWinWith(PZ);
}
/** @param {Port} PZ @param {any} st */
export function hiSpiegelWith(PZ,st){
  const bad=idxs(st.b.length).filter(function(i){ return st.b[i]!==spWantWith(PZ,st,i); });
  if(bad.length){
    const i=bad[PZ.ri(0,bad.length-1)]; st.b[i]=spWantWith(PZ,st,i);
    const b=PZ.$('pz-body').querySelector('[data-a="'+i+'"]'); b.className='pzc flash sp'+st.b[i];
  }
  PZ.speak(st.ax?'Stell dir vor, auf der roten Linie liegt ein Spiegel. Was oben nah an der Linie ist, ist unten auch nah an der Linie.':'Stell dir vor, auf der roten Linie steht ein Spiegel. Was links nah an der Linie ist, ist rechts auch nah an der Linie.');
  if(spDoneWith(PZ,st)) pzWinWith(PZ);
}
/** @param {Port} PZ @param {any} st */
export function sySpiegelWith(PZ,st){ return (st.ax?'Male unten das Spiegelbild von oben.':'Male rechts das Spiegelbild von links.')+' Tippe auf die leeren Felder.'+(st.nc>1?' Tippe mehrmals, dann wechselt die Farbe.':''); }
/** @param {Port} PZ @param {any} st */
export function drRoboWith(PZ,st){
  const cs=pzCellWith(PZ,st.w,st.h+1.3,true);
  let h='<div class="pzg" style="--cs:'+cs+'px;grid-template-columns:repeat('+st.w+',var(--cs))">';
  for(let i=0;i<st.w*st.h;i++){
    const wl=st.wall.has(i), lv=st.lava.has(i), gi=st.gems.indexOf(i);
    let c='';
    if(i===st.pos) c='🤖'; else if(i===st.g) c='🏁'; else if(gi>=0&&!((st.got>>gi)&1)) c='💎'; else if(lv) c='🔥';
    h+='<span class="pzc fix'+(wl?' wall':lv?' lava':'')+(i===st.pos?' me':'')+'">'+c+'</span>';
  }
  h+='</div><div class="prog" aria-label="Dein Programm">';
  for(let i=0;i<st.max;i++){ const q=st.prog[i]; h+='<span class="slot'+(q?' on':'')+(i===st.bad?' bad':'')+(i===st.cur?' cur':'')+'">'+(q?PZ.ARW[q.d]+(q.n>1?'<b>'+q.n+'</b>':''):'')+'</span>'; }
  h+='</div>';
  const ctl='<div class="rbctl"><span class="dpad"><button class="pzb sm u" data-a="3" aria-label="Nach oben">⬆️</button><button class="pzb sm l" data-a="2" aria-label="Nach links">⬅️</button><button class="pzb sm d" data-a="1" aria-label="Nach unten">⬇️</button><button class="pzb sm r" data-a="0" aria-label="Nach rechts">➡️</button></span>'+
    '<span class="rbside"><button class="pzb sm go" data-a="run" aria-label="Los">▶</button><button class="pzb sm" data-a="del" aria-label="Letzten Pfeil löschen">↩️</button></span></div>';
  return [h,ctl];
}
/** @param {Port} PZ @param {any} st @param {any} a */
export function acRoboWith(PZ,st,a){
  if(a==='run'){ rbRunWith(PZ,st); return; }
  st.bad=-1;
  const l=st.prog[st.prog.length-1];
  if(a==='del'){ if(l){ if(l.n>1) l.n--; else st.prog.pop(); } }
  else{
    const d=+a;
    if(l&&l.d===d&&l.n<9) l.n++;
    else if(st.prog.length<st.max) st.prog.push({d:d,n:1});
    else{ tone([170],'sawtooth'); PZ.speak('Mehr Pfeile passen nicht hinein. Findest du einen Weg mit weniger Kurven?'); return; }
  }
  sfx('tick'); pzDrawWith(PZ);
}
/** @param {Port} PZ @param {any} st */
export function rbRunWith(PZ,st){
  if(!st.prog.length){ PZ.speak('Tippe erst auf die Pfeile. Dann auf Los.'); return; }
  const c=PZ.pzc, steps=/** @type {any[]} */ ([]), all=(1<<st.gems.length)-1;
  st.prog.forEach(/** @param {any} q @param {any} i */ function(q,i){ for(let k=0;k<q.n;k++) steps.push([q.d,i]); });
  c.busy=true; st.pos=st.s; st.got=0; st.bad=-1; st.cur=-1;
  let i=0;
  const fail=/** @param {any} slot @param {any} why */ function(slot,why){
    st.bad=slot; st.cur=-1; pzDrawWith(PZ); pzFailWith(PZ); if(why) PZ.speak(why);
    pzLaterWith(PZ,1000,function(){ st.pos=st.s; st.got=0; c.busy=false; pzDrawWith(PZ); });
  };
  const next=function(){
    if(i>=steps.length){ fail(st.prog.length-1,st.pos===st.g?'Erst alle Edelsteine einsammeln, dann zur Fahne.':'Der Roboter ist noch nicht bei der Fahne. Was fehlt noch?'); return; }
    const d=steps[i][0], x=st.pos%st.w, y=(st.pos-x)/st.w, nx=x+RBD[d][0], ny=y+RBD[d][1], np=ny*st.w+nx;
    st.cur=steps[i][1];
    if(nx<0||ny<0||nx>=st.w||ny>=st.h||st.wall.has(np)){ sfx('splat'); fail(steps[i][1],'Rums! Da geht es nicht weiter. Schau, welcher Pfeil rot ist.'); return; }
    st.pos=np;
    const gi=st.gems.indexOf(np);
    if(gi>=0&&!((st.got>>gi)&1)){ st.got|=1<<gi; sfx('coin'); } else sfx('tick');
    if(st.lava.has(np)){ fail(steps[i][1],'Heiß! Der Roboter darf nicht ins Feuer.'); return; }
    if(np===st.g&&st.got===all){ st.cur=-1; pzDrawWith(PZ); c.busy=false; pzWinWith(PZ); return; }
    i++; pzDrawWith(PZ); pzLaterWith(PZ,300,next);
  };
  pzDrawWith(PZ); pzLaterWith(PZ,260,next);
}
/** @param {Port} PZ @param {any} st */
export function hiRoboWith(PZ,st){
  const n=Math.max(1,Math.min(Math.floor(st.sol.length/2),PZ.pzc.hint));
  st.prog=st.sol.slice(0,n).map(/** @param {any} q */ function(q){ return {d:q.d,n:q.n}; }); st.bad=-1; st.pos=st.s; st.got=0;
  pzDrawWith(PZ); PZ.speak('Ich zeige dir den Anfang. Fahr den Weg mit dem Finger nach. Wie geht es weiter?');
}
/** @param {Port} PZ @param {any} st */
export function syRoboWith(PZ,st){
  return 'Bring den Roboter zur Fahne. Tippe die Pfeile in der richtigen Reihenfolge, dann auf Los.'+(st.gems.length?' Sammle unterwegs '+(st.gems.length>1?'alle Edelsteine':'den Edelstein')+' ein.':'')+(st.lava.size?' Pass auf das Feuer auf.':'')+(st.max<st.sol.length+3?' Du hast nur wenige Felder. Gleiche Pfeile hintereinander brauchen nur ein Feld.':'');
}
/** @param {Port} PZ @param {any} st */
export function wgDiffWith(PZ,st){ let d=0; for(const v of st.L) d+=v<0?st.box:v; for(const q of st.R) d-=q.w<0?st.box:q.w; return d; }
/** @param {Port} PZ @param {any} w @param {any} cls @param {any} [attr] */
export function wgWWith(PZ,w,cls,attr){ return w<0?'<span class="wt box" aria-label="Geschenk">🎁</span>':'<'+(attr?'button':'span')+' class="wt'+(w>=10?' w10':'')+(cls||'')+'"'+(attr||'')+'>'+w+'</'+(attr?'button':'span')+'>'; }
/** @param {Port} PZ @param {any} st */
export function drWaageWith(PZ,st){
  let h='<div class="wg"><div class="beam" id="pz-beam" style="transform:rotate('+st.ang+'deg)"><div class="pan l">';
  for(const v of st.L) h+=wgWWith(PZ,v,' fixw');
  h+='</div><div class="pan r">';
  st.R.forEach(/** @param {any} q @param {any} i */ function(q,i){ h+=q.fix?wgWWith(PZ,q.w,' fixw'):wgWWith(PZ,q.w,'',' data-a="r'+i+'" aria-label="Gewicht '+q.w+' wieder herunternehmen"'); });
  h+='</div></div><i class="post"></i></div>';
  let c='<div class="pzopts">';
  if(st.box) for(const v of st.opts) c+='<button class="pzb" data-a="o'+v+'">'+v+'</button>';
  else if(st.items) st.items.forEach(/** @param {any} q @param {any} i */ function(q,i){ c+='<button class="pzb sm'+(q.used?' no':'')+'" data-a="p'+i+'"'+(q.used?' disabled':'')+' aria-label="Gewicht '+q.w+' auflegen">'+q.w+'</button>'; });
  else st.pal.forEach(/** @param {any} w @param {any} i */ function(w,i){ c+='<button class="pzb" data-a="p'+i+'" aria-label="Gewicht '+w+' auflegen">'+w+'</button>'; });
  return [h,c+'</div>'];
}
/* Der Balken kippt erst nach dem Zeichnen, damit man die Bewegung sieht. */
/** @param {Port} PZ @param {any} st */
export function poWaageWith(PZ,st){
  const a=clamp(-wgDiffWith(PZ,st)*2.2,-11,11);
  if(a===st.ang) return;
  st.ang=a;
  requestAnimationFrame(function(){ const b=PZ.$('pz-beam'); if(b) b.style.transform='rotate('+a+'deg)'; });
}
/** @param {Port} PZ @param {any} st @param {any} a @param {any} b */
export function acWaageWith(PZ,st,a,b){
  const k=a.charAt(0), i=+a.slice(1);
  if(k==='o'){
    if(i===st.box){ b.classList.add('ok'); pzWinWith(PZ); return; }
    b.classList.add('no'); pzFailWith(PZ);
    for(const o of PZ.$('pz-ctl').querySelectorAll('[data-a^="o"]')){ o.disabled=true; if(o.dataset.a==='o'+st.box) o.classList.add('ok'); }
    pzRevealWith(PZ,'Das Geschenk wiegt '+st.box+'. Jetzt kommt eine neue Waage.');
    return;
  }
  if(k==='p'){
    if(st.R.length>=14) return;
    if(st.items){ if(st.items[i].used) return; st.items[i].used=true; st.R.push({w:st.items[i].w,i:i}); }
    else st.R.push({w:st.pal[i],i:-1});
  }else{
    const q=st.R[i]; if(!q||q.fix) return;
    st.R.splice(i,1); if(q.i>=0) st.items[q.i].used=false;
  }
  sfx('tick');
  const d=wgDiffWith(PZ,st);
  if(d<0&&!st.over){ st.over=true; pzFailWith(PZ,true); } else if(d>=0) st.over=false;
  pzDrawWith(PZ);
  if(d===0){ PZ.pzc.busy=true; pzLaterWith(PZ,650,function(){ PZ.pzc.busy=false; pzWinWith(PZ); }); }
}
/** @param {Port} PZ @param {any} st */
export function hiWaageWith(PZ,st){
  const d=wgDiffWith(PZ,st);
  if(st.box) PZ.speak('Nimm in Gedanken auf beiden Seiten gleich viel weg. Was bleibt dann für das Geschenk übrig?');
  else if(d>=10&&st.pal&&st.pal.indexOf(10)>=0) PZ.speak('Links ist es mehr als 10. Lege erst die 10 auf, dann den Rest.');
  else if(d>0) PZ.speak('Zähle erst links alles zusammen, dann rechts. Wie viel fehlt rechts noch?');
  else PZ.speak('Rechts ist es zu schwer. Zähle beide Seiten zusammen. Tippe rechts ein Gewicht an, dann kommt es wieder herunter.');
}
/** @param {Port} PZ @param {any} st */
export function syWaageWith(PZ,st){
  if(st.box) return 'Die Waage steht gerade. Wie schwer ist das Geschenk?'+(st.L.filter(/** @param {any} v */ function(v){ return v<0; }).length>1?' Alle Geschenke sind gleich schwer.':'');
  return 'Lege rechts Gewichte auf, bis die Waage gerade steht.'+(st.items?' Jedes Gewicht gibt es nur einmal.':'');
}
/** @param {Port} PZ @param {any} st */
export function drEchoWith(PZ,st){
  let h='<div class="ec ec'+st.n+'">';
  for(let i=0;i<st.n;i++) h+='<button class="padb'+(st.lit===i?' lit':'')+'" style="--c:'+PZ.PCOL[i]+'" data-a="'+i+'" aria-label="Kristall '+(i+1)+'"></button>';
  h+='</div>';
  let c='<div class="ecst"><span aria-hidden="true">'+(st.ph==='in'?(st.rev?'⏪':'👉'):'👀')+'</span><span class="ecd">';
  for(let i=0;i<st.seq.length;i++) c+='<i'+(i<st.pos?' class="on"':'')+'></i>';
  c+='</span><button class="pzb sm" data-a="rep" aria-label="Noch einmal zeigen">🔁</button></div>';
  return [h,c];
}
/** @param {Port} PZ @param {any} st */
export function ecPlayWith(PZ,st){
  const c=PZ.pzc; let i=0;
  c.busy=true; st.ph='show'; st.pos=0; st.lit=-1;
  const step=function(){
    if(i>=st.seq.length){ st.lit=-1; st.ph='in'; c.busy=false; pzDrawWith(PZ); return; }
    st.lit=st.seq[i]; blip(PZ.ECF[st.lit],PZ.ECF[st.lit],.3,'triangle',.14); pzDrawWith(PZ);
    pzLaterWith(PZ,st.sp*.7,function(){ st.lit=-1; pzDrawWith(PZ); pzLaterWith(PZ,st.sp*.3,function(){ i++; step(); }); });
  };
  pzDrawWith(PZ); pzLaterWith(PZ,450,step);
}
/** @param {Port} PZ @param {any} st */
export function stEchoWith(PZ,st){ PZ.pzc.busy=true; pzLaterWith(PZ,AU.muted?700:(st.rev?5200:3600),function(){ ecPlayWith(PZ,st); }); }
/** @param {Port} PZ @param {any} st @param {any} a */
export function acEchoWith(PZ,st,a){
  if(a==='rep'){ ecPlayWith(PZ,st); return; }
  if(st.ph!=='in') return;
  const v=+a, want=st.rev?st.seq[st.seq.length-1-st.pos]:st.seq[st.pos];
  blip(PZ.ECF[v],PZ.ECF[v],.22,'triangle',.14);
  st.lit=v;
  if(v===want){
    st.pos++; pzDrawWith(PZ);
    if(st.pos>=st.seq.length){ PZ.pzc.busy=true; pzLaterWith(PZ,380,function(){ PZ.pzc.busy=false; pzWinWith(PZ); }); }
    else pzLaterWith(PZ,170,function(){ st.lit=-1; pzDrawWith(PZ); });
  }else{
    pzDrawWith(PZ); pzFailWith(PZ); PZ.pzc.busy=true;
    pzLaterWith(PZ,950,function(){ ecPlayWith(PZ,st); });
  }
}
/** @param {Port} PZ @param {any} st */
export function hiEchoWith(PZ,st){ st.sp=850; ecPlayWith(PZ,st); }
/** @param {Port} PZ @param {any} st */
export function syEchoWith(PZ,st){ return st.rev?'Achtung, jetzt rückwärts! Merk dir, in welcher Reihenfolge die Kristalle leuchten. Dann tippe sie von hinten nach vorn: den letzten zuerst.':'Merk dir, in welcher Reihenfolge die Kristalle leuchten. Dann tippe sie genauso nach.'; }
/** @param {Port} PZ @param {any} st */
export function drRohreWith(PZ,st){
  const cs=pzCellWith(PZ,st.w+2,st.h,false), f=rhFlow(st), done=rhDone(st,f);
  let h='<div class="pzg" style="--cs:'+cs+'px;grid-template-columns:repeat('+(st.w+2)+',var(--cs))">';
  for(let y=0;y<st.h;y++){
    h+='<span class="ends" aria-hidden="true">'+(y===st.ys?'🚰':'')+'</span>';
    for(let x=0;x<st.w;x++){
      const p=y*st.w+x, t=st.t[p];
      if(t===3) h+='<span class="pzc pp rock"></span>';
      else h+='<button class="pzc pp'+(f.has(p)?' wet':'')+(st.lk[p]?' lk':'')+'" data-a="'+p+'" aria-label="Rohr drehen"><svg viewBox="0 0 24 24" style="transform:rotate('+st.ang[p]+'deg)" aria-hidden="true">'+PZ.RSVG[t]+' stroke="currentColor" stroke-width="7" fill="none"/></svg></button>';
    }
    h+='<span class="ends"'+(y===st.ye?' id="pz-sink"':'')+' aria-hidden="true">'+(y===st.ye?(done?'🌻':'🌱'):'')+'</span>';
  }
  return [h+'</div>',''];
}
/** @param {Port} PZ @param {any} st */
export function rhPaintWith(PZ,st){
  const f=rhFlow(st), done=rhDone(st,f);
  for(const b of PZ.$('pz-body').querySelectorAll('[data-a]')) b.classList.toggle('wet',f.has(+b.dataset.a));
  if(done){ PZ.$('pz-sink').textContent='🌻'; pzWinWith(PZ); }
}
/** @param {Port} PZ @param {any} st @param {any} a @param {any} b */
export function acRohreWith(PZ,st,a,b){
  const p=+a; if(st.lk[p]) return;
  st.r[p]=(st.r[p]+1)%4; st.ang[p]+=90; st.taps++;
  b.firstChild.style.transform='rotate('+st.ang[p]+'deg)'; sfx('tick');
  if(st.taps===st.need*2+6) PZ.pzc.fails=Math.max(PZ.pzc.fails,2);
  rhPaintWith(PZ,st);
}
/** @param {Port} PZ @param {any} st */
export function hiRohreWith(PZ,st){
  const bad=idxs(st.t.length).filter(function(p){ return st.sr[p]>=0&&!st.lk[p]; });
  const wrong=bad.filter(function(p){ return st.t[p]===0?(st.r[p]&1)!==(st.sr[p]&1):st.r[p]!==st.sr[p]; });
  const pick=wrong.length?wrong:bad;
  if(pick.length){
    const p=pick[PZ.ri(0,pick.length-1)], d=(st.sr[p]-st.r[p]+4)%4;
    st.r[p]=st.sr[p]; st.ang[p]+=d*90; st.lk[p]=true;
    const b=PZ.$('pz-body').querySelector('[data-a="'+p+'"]'); b.classList.add('lk'); b.firstChild.style.transform='rotate('+st.ang[p]+'deg)';
  }
  PZ.speak('Ein Rohr habe ich für dich festgeschraubt. Fang links beim Wasserhahn an und geh Stück für Stück weiter.');
  rhPaintWith(PZ,st);
}
/** @param {Port} PZ */
export function syRohreWith(PZ){ return 'Dreh die Rohre, bis das Wasser vom Wasserhahn bis zur Pflanze fließt. Tippe auf ein Rohr, dann dreht es sich.'; }
/** @param {Port} PZ @param {any} st @param {any} v */
export function sdTokWith(PZ,st,v){ return tokWith(PZ,st.sy[v],st.co[v]); }
/** @param {Port} PZ @param {any} st */
export function drSudokuWith(PZ,st){
  const n=st.n, cs=pzCellWith(PZ,n+.3,n+.3,false);
  let h='<div class="pzg" style="--cs:'+cs+'px;grid-template-columns:repeat('+n+',auto)">';
  for(let i=0;i<n*n;i++){
    const c=i%n, r=(i-c)/n, v=st.cur[i], bx=n===4?(c===1?' bxr':'')+(r===1?' bxb':''):'';
    if(st.giv[i]>=0) h+='<span class="pzc fix'+bx+'">'+sdTokWith(PZ,st,v)+'</span>';
    else h+='<button class="pzc'+bx+(v>=0&&!sdOk(st.cur,n,i,v)?' bad':'')+'" data-a="'+i+'" aria-label="Feld in Reihe '+(r+1)+', Spalte '+(c+1)+'">'+(v>=0?sdTokWith(PZ,st,v):'')+'</button>';
  }
  return [h+'</div>',''];
}
/** @param {Port} PZ @param {any} st */
export function sdCheckWith(PZ,st){
  const n=st.n; let full=true, ok=true;
  for(let i=0;i<n*n;i++){ const v=st.cur[i]; if(v<0) full=false; else if(!sdOk(st.cur,n,i,v)) ok=false; }
  if(full&&ok){ pzWinWith(PZ); return; }
  if(full&&!st.full) pzFailWith(PZ);
  st.full=full;
}
/** @param {Port} PZ @param {any} st @param {any} a */
export function acSudokuWith(PZ,st,a){
  const i=+a; st.cur[i]=st.cur[i]>=st.n-1?-1:st.cur[i]+1;
  sfx('tick'); pzDrawWith(PZ); sdCheckWith(PZ,st);
}
/** @param {Port} PZ @param {any} st */
export function hiSudokuWith(PZ,st){
  const open=idxs(st.n*st.n).filter(function(i){ return st.giv[i]<0&&st.cur[i]!==st.sol[i]; });
  if(open.length){ const i=open[PZ.ri(0,open.length-1)]; st.cur[i]=st.sol[i]; st.giv[i]=st.sol[i]; }
  pzDrawWith(PZ);
  PZ.speak('Such eine Reihe, in der nur noch ein Bild fehlt. Welches Bild gibt es dort noch nicht?');
  sdCheckWith(PZ,st);
}
/** @param {Port} PZ @param {any} st */
export function sySudokuWith(PZ,st){ return 'In jeder Reihe und in jeder Spalte darf jedes Bild nur einmal vorkommen.'+(st.n===4?' Auch in jedem der vier Kästchen.':'')+' Tippe auf ein leeres Feld, bis das richtige Bild da ist. Rot heißt: Das Bild gibt es dort schon.'; }
/* Klicks im Rätselrahmen und am Akku verdrahten. PR 29g2d: Die Anweisungen auf oberster Ebene aus legacy.js stehen unverändert in pzBindWith, legacy.js ruft es an der alten Stelle; alles aus legacy.js kommt über den Port PQ. */
/** @param {Port} PQ */
export function pzBindWith(PQ){
PQ.$('pz').addEventListener('click',/** @param {any} e */ function(e){
  if(e.target===PQ.$('pz')||e.target.closest('.xb')){ PQ.pzClose(); return; }
  if(!PQ.pzc) return;
  if(e.target.closest('#pz-say')){ PQ.speak(PQ.pzc.T.say(PQ.pzc.st)); return; }
  if(PQ.pzc.busy) return;
  if(e.target.closest('#pz-hint')){
    if(PQ.pzc.hint>=PQ.pzHintMax(PQ.pzc)){ PQ.speak('Den Tipp hast du schon bekommen. Du schaffst den Rest!'); return; }
    if(PQ.pzc.fails<1){ PQ.speak('Probier es erst einmal selbst. Wenn es nicht klappt, gibt es einen Tipp.'); return; }
    PQ.LOG.pHint(PQ.pzc); PQ.pzc.hint++; PQ.pzHintUi(); PQ.pzc.T.hint(PQ.pzc.st); return;
  }
  const b=e.target.closest('[data-a]');
  if(b&&!b.disabled) PQ.pzc.T.act(PQ.pzc.st,b.dataset.a,b);
});
/* Am Akku: ein Rätsel statt fünf Lernaufgaben. Die Arten wechseln der Reihe nach, damit keine ausgelassen wird. */
PQ.$('quiz-pz').addEventListener('click',function(){
  PQ.LOG.qSwitch();
  PQ.$('quiz').hidden=true; ST.paused=false;
  PQ.pzOpen({id:'quiz',t:PQ.PZON[(hero.pzn|0)%PQ.PZON.length].id,zb:0,quiz:true});
});
}
