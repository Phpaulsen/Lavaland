/* ---------- Abläufe: Start mit Laden und Rettung, Bildschleife, Reisen zwischen den Welten, neue Welt ---------- */
// PR 28c. Bewegt aus legacy.js. app/ ist Verdrahtung: Was die Abläufe vom übrigen Spiel brauchen, kommt über den Port APP.
// rescue, tryLoad und das Laden alter Formate bleiben Closures in start (migration-plan.md, PR 14).
import { LIFE, stamp } from '../state/world.js';
import { ST } from '../state/facade.js';
import { P, parked, cam, pan, hero } from '../state/game.js';
import { MONS, ARROWS } from '../systems/mobs.js';
import { METS, MROCKS, FLIES } from '../systems/sights.js';
import { HOME_END, CELL, GY, GY0, HOME_GX } from '../core/world/const.js';
import { LANDX } from '../core/world/shape.js';
import { sfx, tone } from '../audio/sound.js';
import { realmKey, K_REALM, K_FOG, K_MARKS, SAVEKEY } from '../persistence/keys.js';
import { runsOk } from '../core/world/pack.js';
import { SIDE } from '../systems/index.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} APP @param {any} sv */
export function restoreWith(APP,sv){
  APP.SEED=sv.seed; APP.shapeWorld(); APP.loadCells(sv); LIFE.clear(); stamp.fill(0);
  APP.parts.length=0; APP.ghost=null; APP.stroke=null; APP.strokeId=null;
  APP.trees.forEach(/** @param {any} t @param {any} i */ function(t,i){ t.state=(sv.trees&&sv.trees[i])|0; t.t=0; });
  ST.zips=Array.isArray(sv.zips)?sv.zips.filter(APP.zipOk).slice(-APP.ZIPMAX):[]; P.zip=null; MONS.length=0; METS.length=0; MROCKS.length=0; FLIES.length=0; ARROWS.length=0;
  ST.tracks=[]; (sv.tracks||[]).forEach(/** @param {any} t */ function(t){ const T=APP.makeTrack(t.raw,t.user); if(T){ if(t.rb) T.rb=true; ST.tracks.push(T); } });
  ST.hidden=sv.hidden||[]; ST.props=(sv.props||[]).filter(/** @param {any} o */ function(o){ return o.type==='man'; }); APP.bombs.length=0;
  for(const k in parked) parked[k]=(sv.parked&&sv.parked[k])||null; APP.heliLoad='';
  P.mode='walk'; P.x=sv.px; P.y=sv.py; P.vx=0; P.vy=0; P.on=false; P.face=1; P.chute=false; P.soot=0; P.hurt=0; P.turbo=0; P.track=null; P.load=0;
  P.ball=0; P.spin=0; P.rot=0; P.frost=0;
  APP.deepRestore(sv);
  if(!sv.snow) APP.migrateSnow();
  APP.grow(Math.max(HOME_END*CELL,P.x+3200));
  ST.energy=sv.energy||0; cam.x=P.x; cam.y=P.y-80; ST.tool=null; pan.x=0; pan.y=0;
  APP.scanMobile();
}
/** @param {Port} APP */
export function newRealmWith(APP){
  ST.seen={}; ST.eggGot={}; ST.lootGot={}; ST.orbGot={}; ST.matGot={}; ST.pzGot={};
  APP.shapeWorld(); APP.planetGen();
  APP.parts.length=0; APP.ghost=null; APP.stroke=null; APP.strokeId=null;
  for(const tr of APP.trees){ tr.state=0; tr.t=0; }
  ST.tracks=[]; ST.zips=[]; P.zip=null; MONS.length=0; METS.length=0; MROCKS.length=0; FLIES.length=0; ARROWS.length=0; ST.props=[]; APP.bombs.length=0; ST.hidden=[]; APP.guide=null;
  for(const k in parked) parked[k]=null;
  P.x=LANDX; P.y=APP.surfaceY(LANDX);
  APP.scanMobile();
}
/** @param {Port} APP @param {any} to */
export function travelWith(APP,to){
  if(ST.traveling||to===APP.realm||(to&&!APP.RLM[to])) return;
  ST.traveling=true; APP.portalT=0;
  const from=APP.realm, m=P.mode, en=ST.energy, f=APP.$('fade');
  f.hidden=false; void f.offsetWidth; f.classList.add('on'); sfx('whoosh');
  const done=function(){ f.classList.remove('on'); setTimeout(function(){ f.hidden=true; },380); ST.traveling=false; };
  setTimeout(function(){
    let sv0=null;
    try{ sv0=APP.snapshot(); }catch(_){ done(); return; }
    APP.idbDo('readwrite',/** @param {any} st */ function(st){ return st.put(sv0,realmKey(from)); }).then(function(){
      return APP.idbDo('readonly',/** @param {any} st */ function(st){ return st.get(realmKey(to)); });
    }).then(/** @param {any} sv */ function(sv){
      try{
        APP.setRealm(to);
        if(sv&&runsOk(sv)&&sv.seed===APP.SEED&&(sv.rl||'')===to) restoreWith(APP,sv);
        else if(to) newRealmWith(APP);
        else throw new Error('earth');
      }catch(e){
        APP.setRealm(from); try{ restoreWith(APP,sv0); }catch(_){}
        ST.energy=en; done(); tone([170],'sawtooth'); return;
      }
      ST.energy=en; arriveWith(APP,from,to,m);
      try{ if(to) localStorage.setItem(K_REALM,to); else localStorage.removeItem(K_REALM); }catch(_){}
      ST.traveling=false; APP.saveGame(false); ST.traveling=true;
      done();
    },function(){ done(); tone([170],'sawtooth'); });
  },450);
}
/** @param {Port} APP @param {any} from @param {any} to @param {any} m */
export function arriveWith(APP,from,to,m){
  const R=APP.rlm();
  if(m==='rocket'||m==='plane'){ P.mode=m; parked[m]=null; P.ang=0; }
  if(R){
    P.x=LANDX; P.y=APP.surfaceY(LANDX)-(P.mode==='walk'?2:260);
    if(!ST.seen.hi){ ST.seen.hi=1; APP.later(1,function(){ APP.say('',R.hello); }); }
    else APP.later(.6,function(){ APP.banner(R.e,1800); APP.speak('Wieder auf '+R.n+'.'); });
    if(to==='moon'){ APP.skyMark('moon'); if(APP.quest&&APP.quest.type==='moon') APP.quest.p=1; }
    if(to==='disco') APP.disco(12);
  }else{
    const L=APP.orbsOf(from); let o=L[0];
    for(const q of L) if(APP.portO&&Math.hypot(q.x-APP.portO.x,q.y-APP.portO.y)<1) o=q;
    APP.portO=o; APP.grow(o.x+3200);
    P.x=o.x; P.y=o.y-o.r-40; APP.portalOff=from;
    APP.later(.6,function(){ APP.say('','Zurück im Weltraum! Unten liegt die Erde.'); });
  }
  P.vx=0; P.vy=0; P.on=false; P.chute=false;
  cam.x=P.x; cam.y=P.y-80; APP.dkA=APP.darkAt(cam.y); APP.exitHint=false;
  APP.scanMobile(); APP.syncUI();
}
/** @param {Port} APP @param {any} seed */
export function resetWorldWith(APP,seed){
  APP.SEED=seed||APP.newSeed();
  /* Eine neue Erde: Mond und Planeten werden dann auch neu. */
  APP.setRealm('');
  try{ localStorage.removeItem(K_REALM); for(const k in APP.FOG) delete APP.FOG[k]; for(const k in APP.MKS) delete APP.MKS[k]; Object.keys(localStorage).forEach(function(k){ if(k.indexOf(K_FOG)===0||k.indexOf(K_MARKS)===0) localStorage.removeItem(k); }); }catch(_){}
  APP.idbDo('readwrite',/** @param {any} st */ function(st){ for(const id in APP.RLM) st.delete(realmKey(id)); return st.count(); }).catch(function(){});
  ST.seen={}; ST.eggGot={}; ST.lootGot={}; ST.orbGot={}; ST.matGot={}; ST.pzGot={};
  APP.shapeWorld();
  APP.gen();
  APP.parts.length=0; APP.ghost=null; APP.stroke=null; APP.strokeId=null;
  for(const tr of APP.trees){ tr.state=0; tr.t=0; }
  ST.tracks=[]; ST.zips=[]; P.zip=null; const d=APP.demoTrack(); if(d) ST.tracks.push(d);
  P.mode='walk'; P.x=820; P.y=APP.surfaceY(820); P.vx=0; P.vy=0; P.on=true; P.face=1; P.chute=false; P.soot=0; P.hurt=0; P.turbo=0; P.track=null; P.load=0; P.arm=.75; P.ball=0; P.spin=0; P.rot=0; P.frost=0;
  for(const k in parked) parked[k]=null;
  APP.heliLoad='';
  parked.car={x:720,y:APP.surfaceY(720),vy:0,ang:0,face:1,arm:0,load:0};
  parked.plane={x:630,y:APP.surfaceY(630),vy:0,ang:0,face:1};
  parked.rocket={x:556,y:APP.surfaceY(556),vy:0,ang:0,face:1,load:0};
  cam.x=P.x; cam.y=P.y-80; ST.tool=null; pan.x=0; pan.y=0; ST.props=[]; APP.bombs.length=0;
  APP.deepHome();
  APP.hideFinds();
  APP.stEnter();
  APP.syncUI();
  APP.scanMobile();
}
/** @param {Port} APP @param {any} t */
export function frameWith(APP,t){
  /* Der nächste Frame wird zuerst bestellt: Ein Fehler irgendwo darf das Spiel nicht einfrieren. */
  requestAnimationFrame(APP.frame);
  try{
    const raw=(t-APP.last)/1000||0, dt=Math.min(.034,raw); APP.last=t;
    APP.LOG.tick(raw); APP.LOG.beat(raw);
    if(ST.ready&&!document.hidden){ const ls=APP.LOG.state(); if(ls&&ls!=='idle') APP.dayTick(Math.min(1,raw)); }
    /* Solange ein Fenster offen ist, steht das Spiel still und der Akku läuft nicht leer. */
    if(!(ST.paused||APP.uiOpen())){
      APP.accum+=dt; let n=0;
      while(APP.accum>=1/30&&n<2){ APP.paintStep(); APP.step(); APP.accum-=1/30; n++; }
      if(APP.accum>.1) APP.accum=0;
      APP.update(dt); for(const f of SIDE) APP.safe(f,dt);
      /* Läuft es auf diesem Gerät zu langsam, sinkt die Auflösung in Stufen. */
      if(raw<.2){ APP.perfT+=raw; APP.perfN++; }
      if(APP.perfN>=150){ if(APP.perfT/APP.perfN>.026&&APP.maxDpr>1){ APP.maxDpr=Math.max(1,APP.maxDpr-.5); APP.resize(); } APP.perfT=0; APP.perfN=0; }
    }
    /* Akku sparen: Hinter einem offenen Fenster steht die Welt still, dann reichen 6 Bilder pro Sekunde. Ohne Berührung reichen 30. */
    APP.drawN++;
    const every=(ST.paused||APP.uiOpen())?10:APP.LOG.state()==='idle'?2:1;
    if(APP.drawN>=every){ APP.drawN=0; APP.draw(); }
    const ic=APP.actIcon(); if(ic!==APP.lastIcon){ APP.actEl.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+APP.AI[ic]+'</svg>'; APP.lastIcon=ic; }
  }catch(e){
    APP.errAdd((e&&/** @type {any} */ (e).message)||e,'frame'); console.error(e);
    try{ if(APP.ctx.reset) APP.ctx.reset(); else APP.ctx.setTransform(1,0,0,1,0,0); }catch(_){}
  }
}
/** @param {Port} APP */
export function startWith(APP){
  APP.resize();
  const go=function(){
    ST.ready=true; APP.LOG.start(); APP.renderAlbum(); APP.syncUI(); APP.syncSound(); APP.battShown=-1; APP.renderBatt();
    APP.stEnter(); APP.syncOwn(); APP.zoneGifts(false);
    if(!hero.big) setTimeout(function(){ if(!APP.uiOpen()&&!ST.paused){ hero.big=true; if(APP.nextLand()){ hero.quest={type:'land',goal:1,p:0}; APP.showQuest(false); } APP.saveHero(); APP.say('','Neu! Hinter dem Schneeberg liegen jetzt viele fremde Länder. Fahr hinten am Berg hinunter und entdecke sie!'); APP.pulse('btn-map'); } },2800);
    if(hero.quest&&hero.quest.type==='core'&&hero.dr<3) hero.quest=null;
    if(hero.big&&!hero.deep) setTimeout(function(){ if(!APP.uiOpen()&&!ST.paused) APP.deepIntro(); },2800);
    APP.labBadge(false);
    if(!hero.quest||hero.quest.done||!APP.QDEF[hero.quest.type]) hero.quest=APP.newQuest();
    APP.showQuest(false); APP.pulse('quest');
    /* Einmal am Tag gibt es ein kleines Geschenk. Kein Zähler, nichts geht verloren, wenn man einen Tag auslässt. */
    const today=new Date().toDateString();
    if(hero.day!==today){ hero.day=today; APP.saveHero(); }
    APP.goldSwap();
    APP.hudLoot();
    if(ST.energy<=0) APP.pulse('batt');
    requestAnimationFrame(function(t){ APP.last=t; requestAnimationFrame(APP.frame); });
  };
  const tryLoad=/** @param {any} sv */ function(sv){
    /* Ein Spielstand aus der alten, kleinen Welt bleibt zur Sicherheit unter eigenem Namen liegen. */
    if(sv&&sv.v<4) APP.idbDo('readwrite',/** @param {any} st */ function(st){ return st.put(sv,sv.v===2?'world-alt':'world-v3'); }).catch(function(){});
    if(sv&&(runsOk(sv)||(sv.grid&&((sv.v===4&&sv.gy===GY&&sv.grid.length===sv.f*GY)||(sv.v===3&&sv.grid.length===sv.f*GY0)||(sv.v===2&&sv.grid.length===HOME_GX*GY0))))){ try{ restoreWith(APP,sv); return true; }catch(_){} }
    return false;
  };
  /* Erst der neue Spielstand, dann der alte. Erst wenn beides fehlt oder kaputt ist, gibt es eine neue Welt. */
  /* Ein Spielstand, der da ist, sich aber nicht laden lässt (etwa nach einem Fehler in einer neuen Spielversion), wird nie überschrieben:
     Er bleibt vorher unter 'rescue-…' liegen und kommt mit „Spielstand sichern“ in die Datei. Dasselbe gilt für Mond und Planeten, die zu ihm gehören. */
  const rescue=/** @param {any} keys @param {any} why */ function(keys,why){
    APP.errAdd('Spielstand nicht ladbar, gerettet: '+keys.join(', '),why);
    return APP.idbDo('readwrite',/** @param {any} st */ function(st){
      keys.forEach(/** @param {any} k */ function(k){
        const g=st.get(k);
        g.onsuccess=function(){
          const v=g.result; if(v===undefined) return;
          /* Derselbe kaputte Stand wird nur einmal abgelegt, auch wenn das Laden bei jedem Start scheitert. */
          const rk='rescue-'+k+'-'+(v&&v.seed)+'-'+(v&&(v.runs||v.grid)?(v.runs||v.grid).length:0), r=st.get(rk);
          r.onsuccess=function(){ if(r.result===undefined) st.put(v,rk); };
        };
      });
      return st.count();
    }).catch(function(){});
  };
  const planets=function(){ return Object.keys(APP.RLM).map(realmKey); };
  /* War das Kind zuletzt auf dem Mond oder einem Planeten, geht es dort weiter. Klappt das nicht, geht es auf der Erde weiter. */
  let rl=''; try{ rl=localStorage.getItem(K_REALM)||''; }catch(_){}
  const load=/** @param {any} retry */ function(retry){
    const away=APP.RLM[rl]?APP.idbDo('readonly',/** @param {any} st */ function(st){ return st.get(realmKey(rl)); }).then(/** @param {any} sv */ function(sv){
      if(sv===undefined) return false;
      if(sv&&runsOk(sv)&&sv.rl===rl){ try{ APP.setRealm(rl); restoreWith(APP,sv); return true; }catch(_){ APP.setRealm(''); } }
      return rescue([realmKey(rl)],'start '+rl).then(function(){ return false; });
    }):Promise.resolve(false);
    return away.then(/** @param {any} ok */ function(ok){
      if(ok) return true;
      APP.setRealm('');
      return APP.idbDo('readonly',/** @param {any} st */ function(st){ return st.get(SAVEKEY); }).then(/** @param {any} sv */ function(sv){
        if(tryLoad(sv)) return true;
        const bad=sv!==undefined;
        return (bad?rescue([SAVEKEY].concat(planets()),'start'):Promise.resolve()).then(function(){
          return APP.idbDo('readonly',/** @param {any} st */ function(st){ return st.get('world'); });
        }).then(/** @param {any} old */ function(old){
          if(tryLoad(old)) return true;
          /* Eine neue Erde löscht Mond und Planeten. Gehörten sie zu einem Stand, der nicht ladbar war, sind sie oben schon gerettet. */
          resetWorldWith(APP,APP.newSeed()); return true;
        });
      });
    }).catch(/** @param {any} e */ function(e){
      /* Die Datenbank ist gerade nicht lesbar (auf Android etwa bei vollem Speicher). Erst noch einmal versuchen, dann ohne Speichern weiterspielen. */
      if(!retry) return new Promise(function(res){ setTimeout(res,800); }).then(function(){ return load(true); });
      APP.errAdd('Datenbank nicht lesbar: '+((e&&e.message)||e),'start');
      ST.diskLock=true; APP.setRealm(''); resetWorldWith(APP,APP.newSeed()); return true;
    });
  };
  load(false).then(go,function(){ ST.diskLock=true; APP.setRealm(''); resetWorldWith(APP,APP.newSeed()); go(); });
}
