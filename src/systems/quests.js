// Aufträge (PR 20): Einführungskette, Kette aus Tiefe und Höhe, Zufallsaufträge, Fortschritt, Anzeige und Zeiger. Bewegt aus legacy.js.
// Was sie vom übrigen Spiel brauchen, kommt über den Port QP. Die Auftragsdaten (QSCRIPT, QDEF, QDEEP, QSKY) und qEmo bleiben vorerst in legacy.js,
// weil QDEF Texte mit Bildchen aus der Oberfläche baut. quest, qShown und qDoneT bleiben dort und werden über Setter geschrieben.
// questTick läuft als System in SIDE (questsWith); qEvent, skyMark, newQuest, showQuest, questPoint und questTick (für den Rauchtest) ruft legacy.js über Einzeiler.
import { hero, P } from '../state/game.js';
import { ST } from '../state/facade.js';
import { WORLD_W, VOLC, STALL_X, MOON } from '../core/world/const.js';
import { jingle } from '../audio/sound.js';
import { WSX, LIFTX } from '../core/world/shape.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} QP @param {any} k */
export function skyMarkWith(QP,k){ const b=QP.QSKY[k][0], o=hero.mk.o|0; if(o&b) return; hero.mk.o=o|b; ST.heroDirty=true; }
/** @param {Port} QP @param {any} k */
export function skyDoneWith(QP,k){
  if((hero.mk.o|0)&QP.QSKY[k][0]) return true;
  if(k==='gate') return !!(hero.fin&1);
  if(k==='moon') return hero.rk>=1||(hero.mk.o|0)>1;
  return !QP.realm&&!!ST.orbGot[k];
}
/* Nächster Schritt zu Gerät g: bauen, wenn alles da ist, sonst Zahnräder aus Rätseln. null, wenn nur Meistersteine fehlen. */
/** @param {Port} QP @param {any} g */
export function gearStepWith(QP,g){
  if(QP.canBuild(g)) return {type:'make',g:g,lv:QP.gearLv(g)+1,goal:1,p:0};
  const t=QP.gearLv(g); if(t>=3) return null;
  const miss=(QP.GEAR[g].rc[t].zr|0)-(hero.mat.zr|0);
  return miss>0&&QP.nextMach()?{type:'pz',g:g,goal:Math.min(3,miss),p:0}:null;
}
/** @param {Port} QP @param {any} kind */
export function chainQuestWith(QP,kind){
  if(kind==='d'){
    for(const s of QP.QDEEP) if(hero.zn<s[0]) return hero.dr>=s[1]?{type:'zone',z:s[0],goal:1,p:0}:gearStepWith(QP,'dr');
    if(hero.fin&2) return null;
    return hero.up.heat>=3?{type:'core',goal:1,p:0}:gearStepWith(QP,'hs');
  }
  if(QP.realm) return null;
  for(const k in QP.QSKY) if(!skyDoneWith(QP,k)) return hero.rk>=QP.QSKY[k][3]?{type:'orb',k:k,goal:1,p:0}:gearStepWith(QP,'rk');
  return null;
}
/** @param {Port} QP @param {any} type @param {any} n */
export function qEventWith(QP,type,n){ if(QP.quest&&QP.quest.type===type&&!QP.quest.done) QP.quest.p+=n; }
/** @param {Port} QP */
export function newQuestWith(QP){
  const n=hero.qn;
  if(n<QP.QSCRIPT.length) return Object.assign({p:0},QP.QSCRIPT[n]);
  const first=n&1?'h':'d', cq=chainQuestWith(QP,first)||chainQuestWith(QP,first==='d'?'h':'d');
  if(cq) return cq;
  const tier=Math.floor((n-QP.QSCRIPT.length)/4), lastT=hero.quest?hero.quest.type:'';
  const pool=['dig','quiz','drive','deep','high','ride','moon','ski','salto','pz','pz'];
  if(QP.nextLand()) pool.push('land','land'); if(QP.eggLand()) pool.push('egg','poke');
  if(ST.hidden.some(function(h){return !h.got;})) pool.push('find','find');
  pool.push('bomb');
  let type=pool[QP.ri(0,pool.length-1)], guard=0;
  while(type===lastT&&guard++<20) type=pool[QP.ri(0,pool.length-1)];
  const q=/** @type {any} */ ({type:type,goal:1,p:0});
  if(type==='dig') q.goal=400+200*Math.min(tier,8);
  else if(type==='quiz') q.goal=2+Math.min(tier,3);
  else if(type==='drive'){ q.veh=['car','dumper','loader','tbm'][QP.ri(0,3)]; q.goal=1200; }
  else if(type==='deep') q.goal=[800,1500,2300][QP.ri(0,2)];
  else if(type==='high') q.goal=4000;
  else if(type==='ski') q.goal=1500+500*Math.min(tier,4);
  else if(type==='salto') q.goal=1+Math.min(tier,3);
  else if(type==='poke') q.goal=3+Math.min(tier,4);
  else if(type==='pz') q.goal=1+Math.min(tier,2);
  return q;
}
/* Für einen Such-Auftrag wird ein noch fehlender Fund glitzernd in die Nähe gelegt, damit er sicher zu schaffen ist. */
/** @param {Port} QP */
export function prepFindWith(QP){
  let h=null;
  for(const q of ST.hidden) if(!q.got&&(q.zone==='shallow'||q.zone==='deep'||q.zone==='deeper'||q.zone==='hot')){ h=q; if(q.zone==='shallow') break; }
  if(!h) return;
  if(h.hint&&h.zone==='shallow'&&Math.abs(h.x-P.x)<700) return;
  const offs=[170,-170,260,-260,360,-360,480,-480];
  for(const o of offs){
    const x=P.x+o;
    if(x<120||x>WORLD_W-120||Math.abs(x-VOLC)<560||Math.abs(x-STALL_X)<70) continue;
    const gy=QP.ground(x);
    if(Math.abs(QP.surfaceY(x)-gy)>14||!QP.solidW(x,gy+58)) continue;
    h.zone='shallow'; h.x=x; h.y=gy+58; h.hint=true; h.tree=-1;
    return;
  }
}
/** @param {Port} QP @param {any} talk */
export function showQuestWith(QP,talk){
  QP.quest=hero.quest;
  if(QP.quest.type==='find'&&!QP.quest.prep){ QP.quest.prep=true; prepFindWith(QP); }
  const d=QP.QDEF[QP.quest.type];
  QP.$('q-ic').innerHTML=d.ic(QP.quest); QP.$('quest').classList.remove('done'); QP.qShown=''; renderQuestWith(QP);
  if(talk){ QP.speak(d.say(QP.quest)); QP.pulse(d.hint(QP.quest)); QP.pulse('quest'); }
}
/** @param {Port} QP */
export function renderQuestWith(QP){
  if(!QP.quest) return;
  const v=Math.min(QP.quest.goal,Math.max(0,Math.floor(QP.quest.p))), txt=v+'/'+QP.quest.goal;
  if(txt===QP.qShown) return;
  QP.qShown=txt;
  QP.$('q-txt').textContent=QP.quest.goal>1?txt:''; QP.$('q-bar').style.width=Math.round(v/QP.quest.goal*100)+'%';
}
/** @param {Port} QP @param {any} dt */
export function questTickWith(QP,dt){
  if(!QP.quest) return;
  if(QP.quest.done){
    QP.qDoneT-=dt;
    if(QP.qDoneT<=0){ hero.quest=newQuestWith(QP); QP.saveHero(); showQuestWith(QP,true); }
    return;
  }
  const t=QP.quest.type;
  if(t==='deep') QP.quest.p=Math.max(QP.quest.p,P.y);
  else if(t==='high') QP.quest.p=Math.max(QP.quest.p,-P.y);
  else if(t==='moon'){ if((P.on&&P.y<-3000&&P.mode!=='coaster')||QP.realm==='moon') QP.quest.p=1; }
  else if(t==='drive'){ if(P.mode===QP.quest.veh&&P.on) QP.quest.p+=Math.abs(P.vx)*dt; }
  else if(t==='ski'){ if(P.mode==='ski'&&P.on&&P.ball<=0&&QP.onSnow()) QP.quest.p+=Math.abs(P.vx)*dt; }
  else if(t==='zone'){ if(hero.zn>=QP.quest.z) QP.quest.p=1; }
  else if(t==='orb'){ if(skyDoneWith(QP,QP.quest.k)) QP.quest.p=1; }
  else if(t==='make'){ if(QP.gearLv(QP.quest.g)>=QP.quest.lv) QP.quest.p=1; }
  else if(t==='core'){ if(hero.fin&2) QP.quest.p=1; }
  renderQuestWith(QP);
  if(QP.quest.p>=QP.quest.goal){
    QP.quest.done=true; QP.qDoneT=2.3; hero.qn++; ST.lootDirty=true;
    QP.$('q-bar').style.width='100%'; QP.$('quest').classList.add('done');
    QP.banner('<svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5" stroke="#2f8f4a" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',2100);
    QP.confetti(P.x,P.y); jingle(); QP.speak('Auftrag geschafft!'); QP.saveHero();
  }
}
/** @param {Port} QP */
export function questPointWith(QP){
  if(!QP.quest||QP.quest.done) return null;
  if(QP.realm&&(QP.quest.type==='moon'||QP.quest.type==='ski'||QP.quest.type==='salto'||QP.quest.type==='orb'||QP.quest.type==='make'||QP.quest.type==='zone')) return null;
  if(QP.quest.type==='make') return [WSX,QP.ground(WSX)-70];
  if(QP.quest.type==='zone'){ const y=QP.stationY(hero.zn); return P.y<y-150?[LIFTX,y-70]:null; }
  if(QP.quest.type==='orb'){ if(QP.quest.k==='moon') return [MOON.x,MOON.y-MOON.r-26]; const o=QP.SPACE[QP.quest.k]; return o?[o.x,o.y-o.r-26]:null; }
  if(QP.quest.type==='pz'){ const m=QP.nextMach(); return m?[m.x,m.y-52]:null; }
  if(QP.quest.type==='moon') return [MOON.x,MOON.y-MOON.r-26];
  if((QP.quest.type==='ski'||QP.quest.type==='salto')&&P.x<5500) return [QP.LIFT0,QP.surfaceY(QP.LIFT0)-84];
  if(QP.quest.type==='land'||QP.quest.type==='egg'){ const b=QP.quest.type==='land'?QP.nextLand():QP.eggLand(); return b?[b.x0+240,QP.ground(b.x0+240)-70]:null; }
  if(QP.quest.type==='find'){
    let b=null, bd=1e9;
    for(const h of ST.hidden){ if(h.got) continue; const d=Math.hypot(h.x-P.x,h.y-P.y)*(h.hint?1:3); if(d<bd){bd=d;b=h;} }
    return b?[b.x,b.y]:null;
  }
  return null;
}
/* Ein System in SIDE an der alten Stelle von questTick. Es zeichnet nichts; den Zeiger malt draw() über questPoint. */
/** @param {Port} QP @returns {import('./index.js').System[]} */
export function questsWith(QP){
  return [
    {name:'questTick',tick:/** @param {any} dt */ function(dt){ questTickWith(QP,dt); }},
  ];
}
