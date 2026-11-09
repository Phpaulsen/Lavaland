// Spielprotokoll für Eltern. Bewegt aus legacy.js (PR 13): const LOG=(function(){…})() wird export function logWith(LP){…},
// app/wire.js ruft const LOG=logWith(LP). Was das Protokoll vom Spiel liest, kommt über den Port LP; sonst ist der Text unverändert.
// Eigene Datenbank lavaland-log: Ein Fehler hier trifft nie den Spielstand. log/ importiert weder state/ noch persistence/.
import { CELL, TOP } from '../core/world/const.js';

/* ---------- Spielprotokoll für Eltern: Was er wann spielt und wie er Aufgaben löst. Liegt nur auf diesem Gerät, in einer eigenen Datenbank, damit ein Fehler hier nie den Spielstand trifft. Das Protokoll schaut nur zu: Nichts davon ändert Belohnung oder Schwierigkeit. ---------- */
/* Herzschlag für die Absturzerkennung. Gehört dem Protokoll; „Spielstand sichern“ lässt ihn aus. */
export const K_ALIVE='lavaland-alive';

/** @param {any} LP */
export function logWith(LP){
  const KEEP=90, IDLE=60, buf=/** @type {any} */ ([]), acc=/** @type {any} */ ({});
  let dbp=/** @type {any} */ (null), q=/** @type {any} */ (null), flushT=0, lastIn=performance.now(), accDay='';
  /** @param {any} [t] */ function day(t){ const d=t?new Date(t):new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  /* Fehlt etwas (etwa nach einem Spielstand-Umzug, der nur die Daten mitbringt), wird die Datenbank eine Version höher neu eingerichtet. */
  /** @param {any} ver */ function op(ver){
    return new Promise(/** @param {any} res @param {any} rej */ function(res,rej){
      /** @type {any} */ let rq;
      try{ rq=ver?indexedDB.open('lavaland-log',ver):indexedDB.open('lavaland-log'); }catch(e){ rej(e); return; }
      rq.onupgradeneeded=function(){
        const db=rq.result;
        if(!db.objectStoreNames.contains('ev')) db.createObjectStore('ev',{autoIncrement:true});
        if(!db.objectStoreNames.contains('day')) db.createObjectStore('day',{keyPath:'d'});
        const es=rq.transaction.objectStore('ev'); if(!es.indexNames.contains('d')) es.createIndex('d','d');
      };
      rq.onsuccess=function(){
        const db=rq.result;
        let ok=false; try{ ok=db.objectStoreNames.contains('day')&&db.transaction('ev').objectStore('ev').indexNames.contains('d'); }catch(_){}
        if(!ok){ const v=db.version+1; db.close(); if(ver) rej(new Error('log db')); else op(v).then(res,rej); return; }
        db.onversionchange=function(){ db.close(); dbp=null; }; res(db);
      };
      rq.onerror=function(){ rej(rq.error); };
    });
  }
  function open(){
    if(!dbp){ dbp=op(0).then(/** @param {any} db */ function(db){ db.onclose=function(){ dbp=null; }; return db; }); dbp.catch(function(){ dbp=null; }); }
    return dbp;
  }
  /* Android kann eine offene Datenbankverbindung jederzeit schließen (Speicherdruck, Hintergrund). Bisher blieb dann die tote Verbindung gemerkt:
     Das Protokoll schrieb nichts mehr und die Elternansicht meldete „nicht lesbar“ bis zum Neustart. Jetzt wird einmal neu geöffnet. */
  /** @param {any} stores @param {any} mode */ function trx(stores,mode){
    return open().then(/** @param {any} db */ function(db){
      try{ return db.transaction(stores,mode); }
      catch(e){
        dbp=null; try{ db.close(); }catch(_){}
        LP.errAdd('Protokoll-Datenbank neu geöffnet: '+((/** @type {any} */ (e)&&/** @type {any} */ (e).name)||e),'log');
        return open().then(/** @param {any} d */ function(d){ return d.transaction(stores,mode); });
      }
    });
  }
  /** @param {any} e */ function push(e){ if(LP.frozen) return; e.d=day(e.t); buf.push(e); }
  function flush(){
    if(LP.frozen||(!buf.length&&!accDay)) return;
    const evs=buf.splice(0), d=accDay, sec=Object.assign({},acc), ss=acc.$s|0;
    for(const k in acc) delete acc[k]; accDay='';
    trx(['ev','day'],'readwrite').then(/** @param {any} tx */ function(tx){
      const es=tx.objectStore('ev');
      evs.forEach(/** @param {any} e */ function(e){ es.add(e); });
      if(d){
        const ds=tx.objectStore('day'), g=ds.get(d);
        g.onsuccess=function(){
          const r=g.result||{d:d,sec:{},sess:0};
          for(const k in sec) if(k!=='$s') r.sec[k]=Math.round(((r.sec[k]||0)+sec[k])*10)/10;
          r.sess=(r.sess|0)+ss; ds.put(r);
        };
      }
    }).catch(function(){});
  }
  /* Rohereignisse nach 90 Tagen weg, die Tagesbilanzen bleiben. */
  function prune(){
    const cut=day(Date.now()-KEEP*864e5);
    trx('ev','readwrite').then(/** @param {any} tx */ function(tx){
      const c=tx.objectStore('ev').index('d').openCursor(IDBKeyRange.upperBound(cut,true));
      c.onsuccess=function(){ const k=c.result; if(k){ k.delete(); k.continue(); } };
    }).catch(function(){});
  }
  function state(){
    if(!LP.$('par').hidden||!LP.$('pgate').hidden) return '';
    if((performance.now()-lastIn)/1000>IDLE) return 'idle';
    if(LP.pzc) return 'pz';
    if(!LP.$('quiz').hidden) return 'quiz';
    if(LP.paused||LP.uiOpen()) return 'ui';
    return LP.energy<=0?'empty':'play';
  }
  /** @param {any} how */ function qEnd(how){
    if(!q) return;
    const e=q; q=null; delete e.p0; e.end=how; e.first=e.taps.length>0&&e.taps[0][0]===e.ok; push(e);
  }
  /** @param {any} c @param {any} how */ function pEnd(c,how){
    if(!c||!c.lg) return;
    const g=c.lg; c.lg=null;
    push({k:'p',t:g.t,id:c.T.id,lv:c.lv,src:c.m.quiz?'akku':'welt',ms:Math.round(performance.now()-g.p0),fails:c.fails,hint:c.hint,fph:g.fph,end:how});
  }
  ['pointerdown','keydown'].forEach(/** @param {any} n */ function(n){ document.addEventListener(n,function(){ lastIn=performance.now(); },true); });
  /* Absturzerkennung: Solange das Spiel sichtbar läuft, steht alle 2 s ein kurzer Zwischenstand im localStorage (geht auch bei einem Absturz nicht verloren).
     Wird das Spiel ordentlich verlassen (in den Hintergrund, Neuladen), steht dort ok:1. Steht beim nächsten Start ok:0, wurde es mitten im Spiel beendet:
     vom Betriebssystem (meist Speichermangel) oder weil es hing. Dann kommt ein Eintrag ins Protokoll und ins Fehlerprotokoll, mit dem, was zuletzt lief. */
  const ALK=K_ALIVE;
  let beatT=0, beatJ=0, beat0=Date.now(), beatSkip=false;
  /** @param {any} ok */ function aliveW(ok){
    try{
      const o=/** @type {any} */ ({t:Date.now(),ok:ok,up:Math.round((Date.now()-beat0)/1000),s:state()||'',m:LP.P.mode,tl:LP.tool||'',rl:LP.realm,y:Math.round((LP.P.y-TOP)/CELL),w:LP.waterCount,l:LP.lavaCount,f:LP.fireCount,pa:LP.parts.length,j:Math.round(beatJ)});
      const pm=/** @type {any} */ (performance).memory; if(pm&&pm.usedJSHeapSize) o.mb=Math.round(pm.usedJSHeapSize/1048576);
      localStorage.setItem(ALK,JSON.stringify(o)); beatJ=0;
    }catch(_){}
  }
  function crashCheck(){
    let a=null; try{ a=JSON.parse(localStorage.getItem(ALK)||'null'); }catch(_){}
    if(!a||a.ok!==0||!(a.t>0)) return;
    const e=/** @type {any} */ ({k:'c',t:a.t,up:a.up|0,s:String(a.s||''),m:String(a.m||''),tl:String(a.tl||''),rl:String(a.rl||''),y:a.y|0,w:a.w|0,l:a.l|0,f:a.f|0,pa:a.pa|0,j:a.j|0});
    if(a.mb) e.mb=a.mb|0;
    push(e);
    LP.errAdd('Spiel unerwartet beendet nach '+e.up+' s: '+e.m+(e.tl?' + '+e.tl:'')+(e.rl?' auf '+e.rl:'')+', Zeile '+e.y+', Wasser '+e.w+', Lava '+e.l+', Teilchen '+e.pa+', längster Frame '+e.j+' ms'+(e.mb?', JS '+e.mb+' MB':''),'Absturz');
  }
  document.addEventListener('visibilitychange',function(){ if(document.hidden){ flush(); if(LP.ready) aliveW(1); } else beatSkip=true; });
  window.addEventListener('pagehide',function(){ flush(); if(LP.ready) aliveW(1); });
  return {
    open:open, trx:trx, day:day, flush:flush, state:state,
    start:function(){ try{ crashCheck(); beat0=Date.now(); aliveW(0); }catch(_){} try{ prune(); acc.$s=(acc.$s|0)+1; accDay=day(); push({k:'s',t:Date.now()}); flush(); }catch(_){} },
    beat:/** @param {any} raw */ function(raw){
      try{
        if(document.hidden||!LP.ready) return;
        /* Der erste Frame nach dem Zurückholen aus dem Hintergrund zählt nicht als Hänger. */
        if(beatSkip){ beatSkip=false; aliveW(0); return; }
        beatJ=Math.max(beatJ,raw*1000); beatT+=Math.min(raw,2);
        if(beatT>=2){ beatT=0; aliveW(0); }
      }catch(_){}
    },
    tick:/** @param {any} raw */ function(raw){
      try{
        if(document.hidden) return;
        const s=state(), d=day();
        if(accDay&&accDay!==d) flush();
        if(s){
          accDay=d; const r=Math.min(1,raw); acc[s]=(acc[s]||0)+r;
          /* Wobei die Sandbox-Zeit vergeht: je Fahrzeug und Werkzeug. Laut Plan fliegen Nebensysteme raus, die mehr als ein Fünftel der Zeit fressen. */
          if(s==='play'||s==='empty'){ const m='m:'+LP.P.mode; acc[m]=(acc[m]||0)+r; if(LP.tool){ const t='t:'+LP.tool; acc[t]=(acc[t]||0)+r; } }
        }
        flushT+=raw; if(flushT>30){ flushT=0; flush(); }
      }catch(_){}
    },
    qOpen:function(){ try{ push({k:'qo',t:Date.now()}); }catch(_){} },
    qStart:/** @param {any} c @param {any} u */ function(c,u){
      try{
        qEnd('skip');
        const e=/** @type {any} */ ({k:'q',t:Date.now(),ty:c.type,f:c.f,L:c.L,n:c.pad?21:c.opts.length,bx:c.box,ok:c.ans,taps:[],tts:null,p0:performance.now()});
        q=e;
        if(u){ const p0=e.p0; u.onend=function(){ e.tts=Math.round(performance.now()-p0); }; }
      }catch(_){}
    },
    qTap:/** @param {any} v @param {any} more */ function(v,more){ try{ if(!q) return; q.taps.push([v,Math.round(performance.now()-q.p0)]); if(!more) qEnd(v===q.ok?'ok':'miss'); }catch(_){} },
    qClose:function(){ try{ if(q){ qEnd('quit'); push({k:'x',t:Date.now(),what:'quiz',left:Math.ceil((LP.MAXE-LP.energy)/LP.SEG)}); } }catch(_){} },
    qSwitch:function(){ try{ qEnd('switch'); push({k:'x',t:Date.now(),what:'switch'}); }catch(_){} },
    pStart:/** @param {any} c */ function(c){ try{ c.lg={t:Date.now(),p0:performance.now(),fph:null}; }catch(_){} },
    pHint:/** @param {any} c */ function(c){ try{ if(c&&c.lg&&c.lg.fph===null) c.lg.fph=c.fails; }catch(_){} },
    pWin:/** @param {any} c */ function(c){ try{ pEnd(c,'won'); }catch(_){} },
    pQuit:/** @param {any} c */ function(c){ try{ if(c&&!c.won) pEnd(c,'quit'); }catch(_){} }
  };
}
