/* ---------- Elternansicht: Schranke, Auswertung des Spielprotokolls, Schulstand, Neuigkeiten, Speicher, Fehler, Stimme, Übungsblatt, Rechentafel-Balken ---------- */
// PR 27a. Bewegt aus legacy.js. Das Protokoll selbst liegt in log/, das Laden der Daten (errLoad, dayLoad) und die Zustände bleiben in legacy.js.
// Was die Elternansicht vom übrigen Spiel braucht, kommt über den Port PV. parLoad, parRender und guessed laufen auch hier über den Port,
// weil sie als Rückruf weitergegeben werden (setTimeout, then, sort); der Move-Nachweis kennt nur Aufrufe.
import { speakStop, voicesDe, VCLIP, VRATES, VOICE } from '../audio/sound.js';
import { hero } from '../state/game.js';
import { STAGES, CASES, fDom } from '../core/learn/facts.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} PV */
export function pgOpenWith(PV){
  PV.$('menu').hidden=true; PV.pgA=PV.ri(3,9); PV.pgB=PV.ri(3,9); PV.pgIn=''; PV.pgMiss=0;
  speakStop();
  pgDrawWith(PV); PV.$('pgate').hidden=false;
}
/** @param {Port} PV */
export function pgDrawWith(PV){ PV.$('pg-q').textContent=PV.pgA+' × '+PV.pgB+' = '+(PV.pgIn||'?'); }
/** @param {Port} PV */
export function parOpenWith(PV){
  PV.parDel=false; parStoreInfoWith(PV); PV.$('par').hidden=false; PV.$('par-body').innerHTML='<p>Lade …</p>';
  PV.LOG.flush();
  setTimeout(PV.parLoad,150);
}
/** @param {Port} PV */
export function parGetWith(PV){
  return PV.LOG.trx(['ev','day'],'readonly').then(/** @param {any} tx */ function(tx){
    return new Promise(function(res,rej){
      const o=/** @type {any} */ ({ev:[],day:[]});
      tx.objectStore('ev').getAll().onsuccess=/** @param {any} e */ function(e){ o.ev=e.target.result; };
      tx.objectStore('day').getAll().onsuccess=/** @param {any} e */ function(e){ o.day=e.target.result; };
      tx.oncomplete=function(){ res(o); }; tx.onerror=function(){ rej(tx.error); };
    });
  });
}
/** @param {Port} PV @param {any} a */
export function medWith(PV,a){ if(!a.length) return null; const s=a.slice().sort(/** @param {any} x @param {any} y */ function(x,y){return x-y;}), m=s.length>>1; return s.length%2?s[m]:(s[m-1]+s[m])/2; }
/** @param {Port} PV @param {any} x */
export function pctWith(PV,x){ return Math.round(x*100)+' %'; }
/** @param {Port} PV @param {any} s */
export function minsWith(PV,s){ return s<90?Math.round(s)+' s':Math.round(s/60)+' min'; }
/* Geraten: erster Tap falsch und dabei zu schnell (vor Ende der Vorlesung), Taps dicht hintereinander oder alle Antworten durchprobiert. */
/** @param {Port} PV @param {any} e */
export function guessedWith(PV,e){
  if(!e.taps.length||e.first) return false;
  const t=e.taps, lim=e.tts||1500;
  if(t[0][1]<lim) return true;
  for(let i=1;i<t.length;i++) if(t[i][1]-t[i-1][1]<700) return true;
  return t.length>=e.n;
}
/** @param {Port} PV */
export function parLoadWith(PV){
  parGetWith(PV).then(PV.parRender,function(){ PV.$('par-body').innerHTML='<p>Das Protokoll ist auf diesem Gerät nicht lesbar (privater Modus oder blockierter Speicher).</p>'; });
}
/** @param {Port} PV @param {any} o */
export function parRenderWith(PV,o){
  const now=Date.now(), from=PV.LOG.day(now-(PV.parRange-1)*864e5);
  const ev=o.ev.filter(/** @param {any} e */ function(e){ return e.d>=from; }), days=o.day.filter(/** @param {any} r */ function(r){ return r.d>=from; });
  const sum=/** @type {any} */ ({quiz:0,pz:0,play:0,empty:0,ui:0,idle:0}); let sess=0;
  days.forEach(/** @param {any} r */ function(r){ for(const k in sum) sum[k]+=r.sec[k]||0; sess+=r.sess|0; });
  const act=sum.quiz+sum.pz+sum.play+sum.empty+sum.ui, learn=sum.quiz+sum.pz;
  let h='<div class="par-tabs">'+[1,7,30].map(function(n){ return '<button data-r="'+n+'"'+(n===PV.parRange?' class="on"':'')+'>'+(n===1?'Heute':n+' Tage')+'</button>'; }).join('')+'</div>';
  h=parNewsWith(PV)+h;
  h+=parSchoolWith(PV);
  h+=parSafeWith(PV);
  h+=parVoiceWith(PV);
  h+='<h3>Zeit</h3>';
  if(!act) h+='<p>Noch keine Spielzeit in diesem Zeitraum.</p>';
  else{
    h+='<p><b>Lernanteil '+pctWith(PV,learn/act)+'</b> von '+minsWith(PV,act)+' aktiver Zeit in '+sess+' Sitzung'+(sess===1?'':'en')+'. Dazu '+minsWith(PV,sum.idle)+' ohne Berührung.</p>';
    h+=parBarsWith(PV,o.day);
    h+='<div class="par-leg">'+Object.keys(PV.SNAME).map(function(k){ return '<span><i style="background:'+PV.SCOL[k]+'"></i>'+PV.SNAME[k]+' '+minsWith(PV,sum[k])+'</span>'; }).join('')+'</div>';
  }
  h+=parSandWith(PV,days,act);
  const qs=ev.filter(/** @param {any} e */ function(e){ return e.k==='q'&&e.taps.length; });
  const qo=ev.filter(/** @param {any} e */ function(e){ return e.k==='qo'; }).length, xq=ev.filter(/** @param {any} e */ function(e){ return e.k==='x'&&e.what==='quiz'; }).length, xs=ev.filter(/** @param {any} e */ function(e){ return e.k==='x'&&e.what==='switch'; }).length;
  const ps=ev.filter(/** @param {any} e */ function(e){ return e.k==='p'; }), pq=ps.filter(/** @param {any} e */ function(e){ return e.end==='quit'; }).length;
  h+='<h3>Umgehung</h3><table><tr><td>Sandbox mit leerem Akku</td><td'+(act&&sum.empty>learn&&sum.empty>300?' class="warn"':'')+'>'+minsWith(PV,sum.empty)+'</td></tr>';
  h+='<tr><td>Lernaufgaben-Fenster geöffnet</td><td>'+qo+'</td></tr><tr><td>davon vorzeitig geschlossen</td><td>'+xq+'</td></tr>';
  h+='<tr><td>„Lieber ein Rätsel“ gewählt</td><td>'+xs+'</td></tr><tr><td>Rätsel ohne Lösung geschlossen</td><td>'+pq+' von '+ps.length+'</td></tr></table>';
  h+='<h3>Rechnen und Buchstaben</h3>';
  h+=parFactsWith(PV);
  if(!qs.length) h+='<p>Noch keine beantworteten Aufgaben.</p>';
  else{
    h+='<p>Denkanteil = Treffer beim ersten Tippen, um Zufall bereinigt. 0 % ist reines Raten, 100 % immer gleich richtig. Unter '+PV.PMIN+' Aufgaben grau.</p>';
    h+='<table><tr><th>Typ</th><th>Anzahl</th><th>Denkanteil</th><th>Zeit bis 1. Tipp</th><th>geraten</th></tr>';
    const by=/** @type {any} */ ({}); qs.forEach(/** @param {any} e */ function(e){ (by[e.ty]=by[e.ty]||[]).push(e); });
    const row=/** @param {any} name @param {any} a */ function(name,a){
      const p=a.filter(/** @param {any} e */ function(e){ return e.first; }).length/a.length, c=a.reduce(/** @param {any} s @param {any} e */ function(s,e){ return s+1/e.n; },0)/a.length;
      const k=(p-c)/(1-c), few=a.length<PV.PMIN, m=medWith(PV,a.map(/** @param {any} e */ function(e){ return e.taps[0][1]; })), g=a.filter(PV.guessed).length/a.length;
      return '<tr'+(few?' class="few"':'')+'><td>'+name+'</td><td>'+a.length+'</td><td'+(!few&&k<.3?' class="warn"':'')+'>'+(k<0?'0 % ↓':pctWith(PV,k))+'</td><td>'+(m/1000).toFixed(1)+' s</td><td'+(!few&&g>.3?' class="warn"':'')+'>'+pctWith(PV,g)+'</td></tr>';
    };
    Object.keys(PV.QNAME).forEach(function(t){ if(by[t]) h+=row(PV.QNAME[t],by[t]); });
    h+=row('<b>Alle</b>',qs)+'</table>';
  }
  h+=parStumbleWith(PV,qs);
  h+='<div class="par-act"><button id="par-sheet">Übungsblatt drucken</button></div>';
  h+='<h3>Rätselmaschinen</h3><table><tr><th>Maschine</th><th>Stufe</th><th>gelöst</th><th>Fehler</th><th>Tipps</th><th>abgebr.</th></tr>';
  PV.PZT.forEach(/** @param {any} T */ function(T){
    const a=ps.filter(/** @param {any} e */ function(e){ return e.id===T.id; }), w=a.filter(/** @param {any} e */ function(e){ return e.end==='won'; }), n=w.length||1;
    const lv0=a.length?a[0].lv+1:null, lv1=(hero.pz[T.id]|0)+1;
    const sf=w.reduce(/** @param {any} s @param {any} e */ function(s,e){ return s+e.fails; },0)/n, sh=w.reduce(/** @param {any} s @param {any} e */ function(s,e){ return s+e.hint; },0)/n;
    h+='<tr'+(a.length<5?' class="few"':'')+'><td>'+T.e+'&nbsp;'+T.n.replace('Kristall-','').replace('Bilder-','')+'</td><td>'+(lv0&&lv0!==lv1?lv0+' → ':'')+lv1+'</td><td>'+w.length+'</td><td>'+(w.length?sf.toFixed(1):'–')+'</td><td'+(w.length>=5&&sh>=1?' class="warn"':'')+'>'+(w.length?sh.toFixed(1):'–')+'</td><td>'+(a.length-w.length)+'</td></tr>';
  });
  h+='</table><p>Fehler und Tipps je gelöstem Rätsel. „0 % ↓“ oben heißt: schlechter als reines Raten. Fehler sind zwischen Maschinen nicht vergleichbar (Spiegel und Rohre zählen einzelne Fehlklicks). Vergleiche eine Maschine mit sich selbst über die Zeit.</p>';
  h+=parErrWith(PV);
  h+='<h3>Daten</h3><p>Alles liegt nur in diesem Browser. Rohdaten werden nach 90 Tagen gelöscht, die Tageszeiten bleiben.</p><details class="par-news"><summary>Datenschutz</summary><ul><li>Das Spiel sendet nichts: kein Konto, keine Werbung, keine Statistik, keine Anfragen an fremde Server. Spielstand und Protokoll verlassen das Gerät nur, wenn Sie selbst sichern oder exportieren.</li><li>Beim Laden der Seite sieht GitHub (Betreiber von GitHub Pages) wie bei jeder Webseite die IP-Adresse. Die installierte App lädt danach aus dem Speicher.</li><li>Vorlesen: Stimmen mit ☁ (unter „Vorlesen“) sind Online-Stimmen des Browser-Herstellers. Mit ihnen geht der vorgelesene Text (Aufgaben, Ansagen, nie Namen) an dessen Server. Lokale Stimmen arbeiten nur auf dem Gerät.</li></ul></details><div class="par-act"><button id="par-exp">Protokoll exportieren</button><button id="par-del">'+(PV.parDel?'Wirklich löschen?':'Protokoll löschen')+'</button></div>';
  PV.$('par-body').innerHTML=h;
}
/* Sandbox-Zeit nach Fahrzeug und Werkzeug, als Anteil an der aktiven Zeit. Über 20 % ist markiert: Ab da frisst ein Nebensystem laut Plan zu viel Denkzeit. */
/** @param {Port} PV @param {any} days @param {any} act */
export function parSandWith(PV,days,act){
  const by=/** @type {any} */ ({});
  days.forEach(/** @param {any} r */ function(r){ for(const k in r.sec) if(/^[mt]:/.test(k)) by[k]=(by[k]||0)+r.sec[k]; });
  const ks=Object.keys(by).filter(function(k){ return by[k]>=30; }).sort(function(a,b){ return by[b]-by[a]; });
  if(!act||!ks.length) return '';
  const nm=/** @type {any} */ ({}); PV.VEH.forEach(/** @param {any} v */ function(v){ nm['m:'+v[0]]=v[1]; }); PV.TOOLS.forEach(/** @param {any} t */ function(t){ nm['t:'+t[0]]=t[1]; });
  let h='<h3>Sandbox: womit</h3><table><tr><th>Fahrzeug / Werkzeug</th><th>Zeit</th><th>Anteil</th></tr>';
  ks.forEach(function(k){ const p=by[k]/act; h+='<tr><td>'+escWith(PV,nm[k]||k.slice(2))+'</td><td>'+minsWith(PV,by[k])+'</td><td'+(p>.2&&k!=='m:walk'?' class="warn"':'')+'>'+pctWith(PV,p)+'</td></tr>'; });
  return h+'</table><p>Anteil an der ganzen aktiven Zeit. Werkzeuge laufen neben dem Fahrzeug mit. Erst ab diesem Update gezählt.</p>';
}
/** @param {Port} PV */
export function parSchoolWith(PV){
  let h='<h3>Schulstand</h3>';
  const wk=PV.SCH.on?Math.floor((Date.now()-PV.SCH.at)/(7*864e5)):0;
  if(PV.SCH.on&&wk>=4) h+='<p class="par-note">Der Schulstand wurde seit '+wk+' Wochen nicht geändert. Stimmt er noch?</p>';
  h+='<p>'+(PV.SCH.on?'Neue Aufgaben kommen nur aus dem, was hier eingestellt ist.':'Noch nicht eingestellt: Das Spiel nimmt alles in Schulbuch-Reihenfolge.')+'</p>';
  h+='<div class="par-tabs">'+PV.ZRN.map(/** @param {any} n @param {any} i */ function(n,i){ return '<button data-zr="'+i+'"'+(PV.SCH.on&&PV.SCH.zr===i?' class="on"':'')+'>'+n+'</button>'; }).join('')+'</div>';
  h+='<p>Buchstaben, die schon dran waren:</p><div class="par-lt">'+PV.ABC.map(/** @param {any} c */ function(c){ return '<button data-lt="'+c+'"'+(PV.SCH.on&&PV.SCH.l.indexOf(c)>=0?' class="on"':'')+'>'+c+'</button>'; }).join('')+'</div>';
  if(PV.SCH.on) h+='<div class="par-act"><button id="par-sall">Schulstand aufheben</button></div>';
  PV.dayLoad();
  h+='<h3>Spielzeit am Tag</h3><p>Heute bisher '+minsWith(PV,PV.DAY.t)+'. Ist die Zeit erreicht, kommt das Lagerfeuer mit Gute-Nacht-Ansage, danach alle 10 Minuten wieder. Das Spiel sperrt nicht.</p>';
  h+='<div class="par-tabs">'+PV.LIMS.map(/** @param {any} n */ function(n){ return '<button data-lim="'+n+'"'+(PV.LIM===n?' class="on"':'')+'>'+(n?n+' min':'aus')+'</button>'; }).join('')+'</div>';
  h+='<h3>Spielwelt</h3><p>Höhlenmonster tief unter der Erde. Sie tun nichts, schubsen nur zurück und platzen bei einem Treffer zu Sternen.</p>';
  h+='<div class="par-tabs"><button data-opt="mon1"'+(PV.OPT.mon?' class="on"':'')+'>an</button><button data-opt="mon0"'+(PV.OPT.mon?'':' class="on"')+'>aus</button></div>';
  h+='<p>Ruhige Darstellung: kein Wackeln, kein Blinken, weniger Konfetti.'+(PV.reducedSys?' Ist schon an, weil das Gerät „Bewegung reduzieren“ eingestellt hat.':'')+'</p>';
  h+='<div class="par-tabs"><button data-opt="calm1"'+(PV.reduced?' class="on"':'')+'>an</button><button data-opt="calm0"'+(PV.reduced?'':' class="on"')+'>aus</button></div>';
  return h;
}
/** @param {Port} PV */
export function parNewsWith(PV){
  if(PV.newsOpen===null){ let seen=0; try{ seen=+/** @type {any} */ (localStorage.getItem(PV.K_NEWS))||0; }catch(_){} PV.newsOpen=seen<PV.NEWS.v; if(PV.newsOpen) try{ localStorage.setItem(PV.K_NEWS,String(PV.NEWS.v)); }catch(_){} }
  const fresh=PV.newsOpen;
  return '<details class="par-news"'+(fresh?' open':'')+'><summary>Neu: '+PV.NEWS.t+'</summary><ul>'+PV.NEWS.items.map(/** @param {any} t */ function(t){ return '<li>'+t+'</li>'; }).join('')+'</ul></details>';
}
/** @param {Port} PV */
export function parSafeWith(PV){
  let at=0; try{ at=+/** @type {any} */ (localStorage.getItem(PV.K_BAK_AT))||0; }catch(_){}
  const d=at?Math.floor((Date.now()-at)/864e5):-1;
  let h='<h3>Spielstand</h3>';
  if(d<0||d>=14) h+='<p class="par-note">'+(d<0?'Noch nie als Datei gesichert.':'Letzte Sicherung vor '+d+' Tagen.')+' Wird der Browser-Speicher gelöscht, ist sonst alles weg.</p>';
  else h+='<p>Zuletzt gesichert '+(d===0?'heute':d===1?'gestern':'vor '+d+' Tagen')+'.</p>';
  if(PV.parStore) h+='<p>'+PV.parStore+'</p>';
  /* Welche Spielversion läuft: Datum, an dem GitHub Pages die geladene Seite veröffentlicht hat (kommt auch aus dem Offline-Speicher mit). */
  const lm=/** @type {any} */ (new Date(document.lastModified));
  /* Ohne Last-Modified-Kopf meldet der Browser die Ladezeit; die wäre keine Version. */
  if(!isNaN(lm)&&Math.abs(lm-(performance.timeOrigin||0))>5000) h+='<p>Spielversion vom '+lm.toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})+'.</p>';
  return h+'<div class="par-act"><button id="par-bak">Jetzt sichern</button></div>';
}
/** @param {Port} PV */
export function parStoreInfoWith(PV){
  if(!(navigator.storage&&navigator.storage.persisted)) return;
  Promise.all([navigator.storage.persisted(),navigator.storage.estimate?navigator.storage.estimate():Promise.resolve(null)]).then(function(r){
    const t=(r[0]?'Der Browser schützt den Speicher vor automatischem Löschen.':'Der Browser darf den Speicher bei Platzmangel löschen. Installiert (Zum Startbildschirm) ist er meist geschützt.')+(r[1]&&r[1].usage?' Belegt: '+(r[1].usage/1048576).toFixed(1)+' MB.':'');
    if(t!==PV.parStore){ PV.parStore=t; if(!PV.$('par').hidden) PV.parLoad(); }
  }).catch(function(){});
}
/** @param {Port} PV */
export function parErrWith(PV){
  const a=PV.errLoad();
  if(!a.length) return '';
  let h='<h3>Technische Fehler</h3><p>Diese Fehler sind im Spiel aufgetreten. Für eine Fehlermeldung kopieren und weitergeben, es stehen keine persönlichen Daten darin.</p><table class="par-err">';
  a.slice().reverse().forEach(/** @param {any} e */ function(e){ h+='<tr><td>'+new Date(e.t).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})+'</td><td>'+escWith(PV,e.m)+(e.w?' <small>('+escWith(PV,e.w)+')</small>':'')+(e.n>1?' ×'+(e.n|0):'')+'</td></tr>'; });
  return h+'</table><div class="par-act"><button id="par-errc">Kopieren</button><button id="par-errx">Löschen</button></div>';
}
/** @param {Port} PV */
export function parVoiceWith(PV){
  const vs=voicesDe();
  let miss=[]; try{ miss=JSON.parse(localStorage.getItem(PV.K_VMISS)||'[]'); if(!Array.isArray(miss)) miss=[]; }catch(_){}
  let h='<h3>Vorlesen</h3>'+(VCLIP?'<p>Vorgelesen wird mit Aufnahmen einer natürlichen Stimme ('+Object.keys(VCLIP).length+' Sätze). Die Browserstimme springt nur bei Sätzen ohne Aufnahme ein'+(miss.length?', bisher '+miss.length+'. <button id="par-vmc">Sätze kopieren</button>':'.')+'</p>':'')+'<p>Tempo der Vorlesestimme:</p><div class="par-tabs">'+VRATES.map(function(r,i){ return '<button data-vr="'+r+'"'+(VOICE.r===r?' class="on"':'')+'>'+['langsam','normal','schnell'][i]+'</button>'; }).join('')+'</div>';
  if(vs.length>1){
    h+='<p>'+(VCLIP?'Browserstimme für Sätze ohne Aufnahme:':'Stimme:')+'</p><div class="par-tabs par-voices"><button data-vv=""'+(!VOICE.v?' class="on"':'')+'>Standard</button>';
    vs.forEach(function(v){ h+='<button data-vv="'+escWith(PV,v.name)+'"'+(VOICE.v===v.name?' class="on"':'')+'>'+escWith(PV,v.name.replace(/^(Google|Microsoft)\s*/,'').replace(/\s*\(.*\)$/,'').slice(0,28))+(v.localService?'':' ☁')+'</button>'; });
    h+='</div>';
  }
  return h+'<div class="par-act"><button id="par-vt">Probe hören</button>'+(VCLIP&&vs.length?'<button id="par-vs">Browserstimme hören</button>':'')+'</div>'+(vs.some(function(v){ return !v.localService; })?'<p class="par-note">☁ = braucht Internet.</p>':'');
}
/** @param {Port} PV @param {any} k */
export function sheetOkWith(PV,k){ return /^\d+[+-]\d+$/.test(k)||/^zl:\d+:\d+$/.test(k)||/^nb:[+-]:\d+$/.test(k); }
/** @param {Port} PV @param {any} stumble */
export function sheetPickWith(PV,stumble){
  const out=/** @type {any} */ ([]), seen=/** @type {any} */ ({});
  const add=/** @param {any} k */ function(k){ if(out.length<PV.SHEETN&&!seen[k]&&sheetOkWith(PV,k)){ seen[k]=1; out.push(k); } };
  stumble.forEach(add);
  Object.keys(PV.FS.f).filter(function(k){ return PV.FS.f[k][0]<=2; }).sort(function(a,b){ return PV.FS.f[a][0]-PV.FS.f[b][0]; }).forEach(add);
  for(let st=0;st<STAGES.m.length&&out.length<PV.SHEETN;st++){
    const fr=STAGES.m[st].filter(function(k){ return !PV.FS.f[k]&&PV.schoolOk(k,st); });
    for(let i=fr.length-1;i>0;i--){ const j=PV.ri(0,i), t=fr[i]; fr[i]=fr[j]; fr[j]=t; }
    fr.forEach(add);
    if(st>=PV.FS.u.m&&out.length>=8) break;
  }
  for(let i=out.length-1;i>0;i--){ const j=PV.ri(0,i), t=out[i]; out[i]=out[j]; out[j]=t; }
  return out;
}
/** @param {Port} PV @param {any} k */
export function sheetLineWith(PV,k){
  const bl='<span class="bl"></span>'; let m;
  if((m=/^(\d+)([+-])(\d+)$/.exec(k))) return m[1]+(m[2]==='+'?' + ':' − ')+m[3]+' = '+bl;
  if((m=/^zl:(\d+):(\d+)$/.exec(k))) return m[1]+' = '+m[2]+' + '+bl;
  if((m=/^nb:\+:(\d+)$/.exec(k))) return m[1]+', '+bl;
  if((m=/^nb:-:(\d+)$/.exec(k))) return bl+', '+m[1];
  return '';
}
/** @param {Port} PV @param {any} stumble */
export function sheetPrintWith(PV,stumble){
  const ks=sheetPickWith(PV,stumble||[]);
  const ls=(PV.SCH.on&&PV.SCH.l?PV.SCH.l:CASES).split('').filter(/** @param {any} c */ function(c){ return CASES.indexOf(c)>=0||PV.SCH.on; }).slice(0,9);
  let h='<h1>Übungsblatt</h1><div class="sd">'+new Date().toLocaleDateString('de-DE')+' · Lavaland</div><div class="sg">';
  ks.forEach(/** @param {any} k */ function(k){ h+='<div>'+sheetLineWith(PV,k)+'</div>'; });
  h+='</div><h2>Groß und klein</h2><div class="sd">Den kleinen Buchstaben dazuschreiben.</div><div class="cs">';
  ls.forEach(/** @param {any} c */ function(c){ h+='<div>'+escWith(PV,c)+' <span class="bl"></span></div>'; });
  PV.$('sheet').innerHTML=h+'</div>';
  window.print();
}
/* Stolperaufgaben: Fakten, die im Zeitraum oft nicht auf Anhieb saßen, mit der häufigsten falschen Antwort. Daten aus der Sicherung gelten als fremd, darum wird alles maskiert. */
/** @param {Port} PV @param {any} t */
export function escWith(PV,t){ return String(t).replace(/[&<>"']/g,function(c){ return /** @type {any} */ ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
/** @param {Port} PV @param {any} k */
export function fLabelWith(PV,k){
  let m;
  if((m=/^(\d+)([+-])(\d+)$/.exec(k))) return m[1]+(m[2]==='+'?' + ':' − ')+m[3];
  if((m=/^zl:(\d+):(\d+)$/.exec(k))) return m[1]+' = '+m[2]+' + ?';
  if((m=/^fb:(\d+)$/.exec(k))) return m[1]+' Punkte (Blitzblick)';
  if((m=/^nb:([+-]):(\d+)$/.exec(k))) return m[1]==='+'?m[2]+' → ?':'? ← '+m[2];
  if((m=/^count:(\d+)$/.exec(k))) return m[1]+' Sterne zählen';
  if((m=/^(anlaut|syl|rhy|word|case):(.+)$/.exec(k))) return ({anlaut:'Anlaut ',syl:'Silben ',rhy:'Reim auf ',word:'Wort ',case:'Klein zu '})[m[1]]+m[2];
  return k;
}
/** @param {Port} PV @param {any} qs */
export function parStumbleWith(PV,qs){
  const by=/** @type {any} */ ({});
  qs.forEach(/** @param {any} e */ function(e){ if(typeof e.f!=='string'||e.f.indexOf('seq:')===0) return; const r=by[e.f]||(by[e.f]={n:0,x:0,w:{}}); r.n++; if(!e.first){ r.x++; const v=e.taps[0]&&e.taps[0][0]; if(v!=null&&v!==e.ok) r.w[v]=(r.w[v]||0)+1; } });
  const L0=Object.keys(by).filter(function(k){ return by[k].n>=2&&by[k].x>0; }).sort(function(a,b){ return by[b].x/by[b].n-by[a].x/by[a].n||by[b].n-by[a].n; });
  PV.parStum=L0; const L=L0.slice(0,6);
  let h='<h3>Stolperaufgaben</h3>';
  if(!L.length) return h+'<p>Keine Aufgabe ist im Zeitraum mehrfach danebengegangen.</p>';
  h+='<table><tr><th>Aufgabe</th><th>gestellt</th><th>nicht auf Anhieb</th><th>meist getippt</th></tr>';
  L.forEach(function(k){ const r=by[k], w=Object.keys(r.w).sort(function(a,b){ return r.w[b]-r.w[a]; })[0]; h+='<tr><td>'+escWith(PV,fLabelWith(PV,k))+'</td><td>'+r.n+'</td><td>'+r.x+'</td><td>'+(w!=null?escWith(PV,w):'–')+'</td></tr>'; });
  return h+'</table><p>Das Spiel holt diese Aufgaben von selbst öfter. Wenn eine dauerhaft hakt, hilft oft ein Gespräch mit Material (Finger, Steckwürfel).</p>';
}
/* Lernstand nach Leitner: wie viele Fakten in welchem Fach liegen, getrennt nach Rechnen und Buchstaben. */
/** @param {Port} PV */
export function parFactsWith(PV){
  const c=/** @type {any} */ ({m:[0,0,0,0,0,0],l:[0,0,0,0,0,0]});
  for(const k in PV.FS.f) c[fDom(k)][PV.FS.f[k][0]]++;
  const tot=/** @type {any} */ ({m:0,l:0}); ['m','l'].forEach(function(d){ /** @type {any} */ (STAGES)[d].forEach(/** @param {any} s @param {any} i */ function(s,i){ if(i<=PV.FS.u[d]) tot[d]+=s.length; }); });
  const row=/** @param {any} n @param {any} d */ function(n,d){ const a=c[d]; return '<tr><td>'+n+'</td><td>'+(tot[d]-a[1]-a[2]-a[3]-a[4]-a[5])+'</td><td>'+a[1]+'</td><td>'+a[2]+'</td><td>'+(a[3]+a[4])+'</td><td>'+a[5]+'</td><td>'+(PV.FS.u[d]+1)+' / '+/** @type {any} */ (STAGES)[d].length+'</td></tr>'; };
  return '<table><tr><th>Fakten</th><th>neu</th><th>Fach 1</th><th>Fach 2</th><th>Fach 3–4</th><th>sitzt</th><th>Stufe</th></tr>'+row('Rechnen','m')+row('Buchstaben','l')+'</table><p>Fach 1 übt er gerade, „sitzt“ heißt mehrfach mit Abstand richtig. Neu zählt nur, was in den freigeschalteten Stufen noch nicht drankam.</p>';
}
/* Gestapelte Balken für die letzten 14 Tage, Minuten je Tag. */
/** @param {Port} PV @param {any} all */
export function parBarsWith(PV,all){
  const n=14, W=320, H=110, bw=W/n, by=/** @type {any} */ ({}), ks=Object.keys(PV.SNAME);
  all.forEach(/** @param {any} r */ function(r){ by[r.d]=r; });
  const ds=[]; for(let i=n-1;i>=0;i--) ds.push(PV.LOG.day(Date.now()-i*864e5));
  let mx=1; ds.forEach(function(d){ const r=by[d]; if(r){ let s=0; ks.forEach(function(k){ s+=r.sec[k]||0; }); mx=Math.max(mx,s); } });
  let g='';
  ds.forEach(function(d,i){
    const r=by[d]; let y=H;
    if(r) ks.forEach(function(k){ const v=(r.sec[k]||0)/mx*(H-14); if(v>0){ y-=v; g+='<rect x="'+(i*bw+2).toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+(bw-4).toFixed(1)+'" height="'+v.toFixed(1)+'" fill="'+PV.SCOL[k]+'"><title>'+d+' '+PV.SNAME[k]+': '+minsWith(PV,r.sec[k])+'</title></rect>'; } });
    if(i%2===n%2||i===n-1) g+='<text x="'+(i*bw+bw/2).toFixed(1)+'" y="'+(H+12)+'" text-anchor="middle">'+(+d.slice(8))+'.</text>';
  });
  g+='<text x="0" y="9">'+minsWith(PV,mx)+'</text>';
  return '<svg class="par-ch" viewBox="0 0 '+W+' '+(H+16)+'" role="img" aria-label="Spielzeit je Tag, letzte 14 Tage">'+g+'</svg>';
}
