/* ---------- Tiefe und Erkunden: Jede Sekunde (Zonen, Planetenkerne, Maschinen, Ziele), Funde, Erkundungsnebel, Leuchtmarken ---------- */
// PR 21. Bewegt aus legacy.js. Was sie vom übrigen Spiel brauchen, kommt über den Port DP.
// Die Zustände (nearF, nearD, nearT, fogT, mkShown, mhT, guide) bleiben in legacy.js, weil Zeichnen, Laden und Tests sie nutzen; geschrieben wird über Setter.
// Speichern und Laden von Nebel und Leuchtmarken (fogArr, fogSet, marks, mkSave), die Wissenstüren und alles Zeichnen bleiben in legacy.js.
// deepTick, findsTick, fogTick und mkTick laufen als Systeme in SIDE (deepWith, findsWith, marksWith); findOpen, mkTap, zoneGifts und deepIntro ruft legacy.js über Einzeiler.
import { ST } from '../state/facade.js';
import { jingle, sfx, tone } from '../audio/sound.js';
import { P, hero } from '../state/game.js';
import { cellAt } from '../state/sim.js';
import { CORE, CELL } from '../core/world/const.js';
import { WSX } from '../core/world/shape.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} DP @param {any} h */
export function findOpenWith(DP,h){
  if(h.zone==='sky'||h.zone==='space'||h.zone==='moon'||h.zone==='edge'||h.zone==='core') return true;
  if(h.tree>=0) return DP.trees[h.tree].state>=1;
  return !DP.solidW(h.x,h.y);
}
/** @param {Port} DP @param {any} h */
export function collectWith(DP,h){
  h.got=true; ST.found[h.id]=1; DP.saveFinds(); DP.renderAlbum();
  DP.confetti(h.x,h.y+20); jingle(); DP.speak('Du hast '+h.name+' gefunden!');
  ST.lootDirty=true; DP.qEvent('find',1); sfx('pop');
  DP.spawn(8,h.x,h.y,0,-46,2.4,30,h.e); DP.pulse('btn-finds');
}
/** @param {Port} DP @param {any} dt */
export function findsTickWith(DP,dt){
  const pts=[[P.x,P.y-18]];
  if(P.mode==='bagger') pts.push(DP.bucket()); else if(P.mode==='loader') pts.push(DP.scoop()); else if(P.mode==='tbm') pts.push(DP.drillHead());
  let best=1e9, nf=null;
  for(const h of ST.hidden){
    if(h.got) continue;
    let d=1e9;
    for(const q of pts) d=Math.min(d,Math.hypot(q[0]-h.x,q[1]-h.y));
    if(d<best){ best=d; nf=h; }
    if(d<36&&(findOpenWith(DP,h)||(h.tree>=0&&d<24))) collectWith(DP,h);
  }
  DP.nearF=nf; DP.nearD=best;
  if(cellAt(P.x,P.y+3)===CORE&&!ST.found.crystal) collectWith(DP,{id:'crystal',e:'🔮',name:'den Kristall vom Erdkern',zone:'core',x:P.x,y:P.y-30,tree:-1,got:false});
  DP.nearT-=dt;
  if(DP.nearT<=0){
    DP.nearT=.3;
    const b=DP.$('btn-finds'); b.classList.toggle('near',best<420&&best>=170); b.classList.toggle('hot',best<170);
  }
}
/** @param {Port} DP @param {any} dt */
export function fogTickWith(DP,dt){
  DP.fogT-=dt; if(DP.fogT>0) return; DP.fogT=.4;
  const a=DP.fogArr(), tx=Math.floor(P.x/CELL/DP.FGT), ty=DP.fRow(P.y), r=1+(hero.lp|0);
  for(let dy=-r;dy<=r;dy++) for(let dx=-r-1;dx<=r+1;dx++) if(dx*dx+dy*dy<=(r+1)*(r+1)) DP.fogSet(a,tx+dx,ty+dy);
  if(P.y<DP.ground(P.x)) for(let y=0,gy=DP.fRow(DP.ground(P.x));y<=gy;y++) DP.fogSet(a,tx,y);
}
/** @param {Port} DP */
export function mkCanWith(DP){ return P.mode==='walk'&&P.on&&P.y>DP.ground(P.x)+60; }
/** @param {Port} DP */
export function mkNearWith(DP){ const a=DP.marks(); for(let i=0;i<a.length;i++) if(Math.abs(a[i][0]-P.x)<40&&Math.abs(a[i][1]-P.y)<50) return i; return -1; }
/** @param {Port} DP */
export function mkTickWith(DP){
  const c=mkCanWith(DP), n=c?mkNearWith(DP):-1, st=c?(n>=0?'on':'off'):'';
  if(st===DP.mkShown) return; DP.mkShown=st;
  const b=DP.$('mark'); b.hidden=!c; b.classList.toggle('on',n>=0);
}
/** @param {Port} DP */
export function mkTapWith(DP){
  if(!mkCanWith(DP)) return;
  const a=DP.marks(), i=mkNearWith(DP);
  if(i>=0){ a.splice(i,1); DP.mkSave(); sfx('tick'); DP.speak('Leuchtmarke aufgehoben. Du hast noch '+(DP.MKMAX-a.length)+'.'); }
  else if(a.length>=DP.MKMAX){ tone([170],'sawtooth'); DP.speak('Alle acht Leuchtmarken sind schon gesetzt. Geh zu einer hin und heb sie auf, dann kannst du sie woanders hinstellen.'); }
  else{ a.push([Math.round(P.x),Math.round(P.y)]); DP.mkSave(); sfx('pop'); DP.spawn(5,P.x,P.y-10,0,-80,.6,2); if(a.length===1) DP.speak('Eine Leuchtmarke! Sie leuchtet im Dunkeln und steht auf der Karte. Du hast acht davon.'); }
  DP.mkShown=null;
}
/** @param {Port} DP @param {any} m */
export function matFoundWith(DP,m){
  const k=m.k, n=(hero.mat[k]|0)+1;
  ST.matGot[m.id]=1; hero.mat[k]=n; ST.heroDirty=true;
  sfx('coin'); DP.dayAdd('mat');
  for(let i=0;i<10;i++) DP.spawn(5,m.x,m.y,(Math.random()-.5)*180,-60-Math.random()*160,.7,2);
  hero.mk.pk=1; ST.lootDirty=true; DP.confetti(m.x,m.y); jingle(); DP.banner('🪐 '+n+' / 3',2600); DP.say('',n>=3?'Alle drei Planetenkerne! Du hast jede große Welt bis ganz nach unten erforscht.':'Ein Planetenkern! Er leuchtet wie ein kleiner Stern. In jedem großen Planeten liegt einer.'); DP.dayAdd('z','🪐'); DP.campSoon(); DP.labBadge(true);
}
/** @param {Port} DP @param {any} talk */
export function zoneGiftsWith(DP,talk){
  let got=null;
  for(const g of DP.ZGIFT) if(hero.zn>=g[0]&&!hero.own[g[1]]){ hero.own[g[1]]=1; got=g; }
  if(!got) return;
  DP.saveHero(); DP.syncOwn();
  if(talk) DP.later(3,function(){ DP.banner('🎁',2400); DP.say('',got[2]+' gehört jetzt dir! '+got[3]); DP.pulse(got[4]); });
}
/** @param {Port} DP @param {any} n */
export function finaleWith(DP,n){
  hero.fin|=n;
  if(n===1){
    for(let i=0;i<8;i++) DP.later(i*.35,function(){ DP.firework(P.x-240+Math.random()*480,P.y-140-Math.random()*160); });
    DP.banner('🌟',3000);
    DP.say('','Du hast das Sternentor erreicht, ganz am Ende vom Weltraum!');
  }else{
    DP.banner('🌋',3000);
    DP.say('','Du stehst auf dem glühenden Erdkern! Tiefer geht es nicht.');
  }
  ST.lootDirty=true; DP.confetti(P.x,P.y); jingle(); DP.saveHero(); DP.renderEggs();
  if(hero.fin===3) DP.later(10,function(){ DP.banner('🏆',3200); DP.say('','Ganz unten und ganz oben: Du hast alles erforscht. Du bist der größte Forscher von Lavaland!'); });
}
/** @param {Port} DP */
export function deepIntroWith(DP){
  if(hero.deep) return;
  hero.deep=true; DP.saveHero();
  if(DP.quest&&!DP.quest.done&&DP.quest.type!=='find'){ hero.quest={type:'pz',goal:1,p:0}; DP.showQuest(false); }
  DP.pulse('btn-lab');
  DP.tell([['Professor Zahnrad','Hallo! Ich bin Professor Zahnrad. Meine Werkstatt steht jetzt bei dir zu Hause.'],
    ['Professor Zahnrad','Unter der Erde geht es jetzt viel tiefer, und der Weltraum ist riesig. Aber dafür brauchst du einen besseren Bohrer und eine stärkere Rakete.'],
    ['Professor Zahnrad','Die baue ich dir. Bring mir Zahnräder und später Meistersteine. Zahnräder bekommst du von meinen Rätselmaschinen. Die erste steht gleich rechts neben dem Aufzug.']]);
}
/** @param {Port} DP @param {any} dt */
export function deepTickWith(DP,dt){
  DP.mhT-=dt;
  if(DP.mhT<=0){ DP.mhT=.6; const lim=(DP.genF-8)*CELL; for(const m of DP.MACH) if(m.sf&&m.x<lim) m.y=DP.surfaceY(m.x); }
  if(P.mode!=='coaster'){
    const z=DP.zoneAt(P.x,P.y-12), R=DP.rlm();
    if(R){
      if(z&&!ST.seen['z'+z]){ ST.seen['z'+z]=1; jingle(); DP.confetti(P.x,P.y); DP.banner(R.zn[z-1][0]+' ⭐',2400); DP.say('','Du hast '+R.zn[z-1][1]+' erreicht!'); DP.dayAdd('z',R.zn[z-1][0]); DP.campSoon(); }
    }else if(z>hero.zn){
      hero.zn=z; DP.saveHero(); jingle(); DP.confetti(P.x,P.y); DP.banner(DP.ZN[z].e+' ⭐',2400);
      DP.say('','Du hast '+DP.ZN[z].n+' erreicht! Der Aufzug zu Hause fährt jetzt bis hierher.'); DP.dayAdd('z',DP.ZN[z].e); DP.campSoon();
      zoneGiftsWith(DP,true);
    }
  }
  const pts=[[P.x,P.y-16]];
  if(P.mode==='bagger') pts.push(DP.bucket()); else if(P.mode==='loader') pts.push(DP.scoop()); else if(P.mode==='tbm') pts.push(DP.drillHead());
  for(const m of DP.MATS){
    if(ST.matGot[m.id]||!DP.MATON[m.k]||Math.abs(m.x-P.x)>260||Math.abs(m.y-P.y)>260) continue;
    for(const q of pts) if(Math.hypot(q[0]-m.x,q[1]-m.y)<30){ matFoundWith(DP,m); break; }
  }
  if(P.on&&P.y<-6000&&DP.SPACE.gate){
    for(const k of ['stn','ice','jun']){
      const o=DP.SPACE[k];
      if(ST.orbGot[k]||Math.hypot(P.x-o.x,P.y-o.y)>o.r+40) continue;
      ST.orbGot[k]=1; DP.skyMark(k); ST.lootDirty=true; DP.confetti(P.x,P.y); jingle(); DP.banner('⭐',2400);
      DP.say('',k==='stn'?'Du bist auf der Raumstation gelandet! Ringsum schweben große Felsbrocken.':k==='ice'?'Du bist auf dem Eisplaneten gelandet!':'Du bist auf dem Blubberplaneten gelandet! Hier wohnt Blubb.');
    }
    if(!(hero.fin&1)&&Math.hypot(P.x-DP.SPACE.gate.x,P.y-DP.SPACE.gate.y)<DP.SPACE.gate.r+40) finaleWith(DP,1);
  }
  if(!(hero.fin&2)&&!DP.realm&&P.y>9000&&cellAt(P.x,P.y+3)===CORE) finaleWith(DP,2);
  if(!hero.deep&&performance.now()>ST.talkLock&&Math.abs(P.x-WSX)<110&&Math.abs(P.y-DP.ground(WSX))<90) deepIntroWith(DP);
  if(DP.guide&&DP.time>DP.guide.t) DP.guide=null;
}
/* Systeme in SIDE an den alten Stellen: deepTick nach worldTick, findsTick nach winterTick, fogTick und mkTick nach drain. Gezeichnet wird weiter in draw(). */
/** @param {Port} DP @returns {import('./index.js').System[]} */
export function deepWith(DP){
  return [
    {name:'deepTick',tick:/** @param {any} dt */ function(dt){ deepTickWith(DP,dt); }},
  ];
}
/** @param {Port} DP @returns {import('./index.js').System[]} */
export function findsWith(DP){
  return [
    {name:'findsTick',tick:/** @param {any} dt */ function(dt){ findsTickWith(DP,dt); }},
  ];
}
/** @param {Port} DP @returns {import('./index.js').System[]} */
export function marksWith(DP){
  return [
    {name:'fogTick',tick:/** @param {any} dt */ function(dt){ fogTickWith(DP,dt); }},
    {name:'mkTick',tick:function(){ mkTickWith(DP); }},
  ];
}
