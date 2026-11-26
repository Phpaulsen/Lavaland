/* ---------- Rohrwand im Nah-Modus (Backlog-Idee 6, Schritte 3 und 4) ---------- */
// Über einer Rohr-Maschine mit eingebauter Grotte hängt eine Wand aus Rohrstücken. Steht der Held davor, zoomt die Kamera heran,
// Malen und Werkzeuge ruhen, und jedes Tippen dreht ein Rohr. Rätsel, Stufen, Zahnräder und Protokoll sind dieselben wie in der Rohr-Maschine
// (core/puzzles/rohre.js, pzWinWith); nur Zeichnen und Tippen sind neu. Gilt nur für Maschinen mit gebautem Ort in rw.
// Den Maschinenkasten zeichnet render/world.js an solchen Orten nicht mehr; die Wand steht an seiner Stelle.
// Zwei Wände je Ort: k 0 an der Maschine (immer wieder spielbar), k 1 in der Grotte vor der Tür zur Nebenkammer (einmal, Stufe +2).
// Ist eine Wand gelöst, meldet RQ.solved das sofort an systems/rohrwand.js, das Sperre oder Tür öffnet; dessen Satz folgt nach dem Lob.
// Was das Modul vom übrigen Spiel braucht, kommt über den Port RQ.
import { rw } from '../state/rohrwand.js';
import { P, cam, hero, talkLock } from '../state/game.js';
import { clamp, TAU } from '../core/world/const.js';
import { rhFlow, rhDone, RMASK } from '../core/puzzles/rohre.js';
import { sfx } from '../audio/sound.js';
import { pzWinWith, pzHintMaxWith } from './puzzles.js';

/** @typedef {Record<string, any>} Port */

/** Kachelgröße in Weltpixeln und Zoom im Nah-Modus. */
export const RWT=22, RWZ=2;
/** Die laufende Wand (dasselbe Objekt wie pzc), oder null. @type {any} */
export let rwc=null;
let zk=0, cool=0, sayNext='';
/** Zuletzt gelöste Wand: startet erst wieder, wenn der Held einmal weggegangen ist. @type {{m: any, k: number, x: number, y: number}|null} */
let rest=null;

/** Hat die Maschine eine gebaute Grotte? @param {any} m @returns {boolean} */
export function rwHas(m){ const o=rw[m.id]; return !!o&&o.mc!==undefined; }
/** Wände einer Maschine: Fußpunkt (x, y), Seite s, Art k. @param {Port} RQ @param {any} m @returns {{x: number, y: number, s: number, k: number}[]} */
function wallsOf(RQ,m){
  const o=rw[m.id]; if(!o||o.mc===undefined) return [];
  const a=[{x:m.x,y:m.y,s:o.s||1,k:0}];
  if(o.st===1){ const d=RQ.doorAt(m); if(d) a.push({x:d.x,y:d.y,s:d.s,k:1}); }
  return a;
}
/** Lage der Wand über ihrem Fußpunkt: linke Kante (gespiegelt nach Seite s), oberer Rand, Kachelzahl. @param {{x: number, y: number, s: number}} a @param {number} w @param {number} h */
function geo(a,w,h){ return {s:a.s,lx0:-w*RWT/2,top:a.y-46-h*RWT,w:w,h:h}; }

/** @param {Port} RQ @param {any} m @param {{x: number, y: number, s: number, k: number}} a */
function rwStartWith(RQ,m,a){
  const lv=clamp((hero.pz.rohre|0)+(m.zb|0)+(a.k?2:0),0,9), st=RQ.mkRohre(lv);
  rwc={m:m,a:a,T:RQ.PZI.rohre,lv:lv,fails:0,hint:0,won:false,busy:false,st:st,wall:true,da:st.ang.slice(),told:false};
  RQ.pzc=rwc; RQ.LOG.pStart(rwc);
  RQ.speak('Dreh die Rohre, bis das Wasser von der Quelle bis zur Glut fließt. Tippe auf ein Rohr, dann dreht es sich.');
}
/** Nah-Modus beginnen, halten oder beenden; Kamera und Zoom nachführen. @param {Port} RQ @param {number} dt */
export function rwUiTickWith(RQ,dt){
  cool-=dt;
  if(rest&&(Math.abs(P.x-rest.x)>80||Math.abs(P.y-rest.y)>80)) rest=null;
  if(rwc){
    const a=rwc.a;
    if(rwc.won&&!rwc.told){ rwc.told=true; sayNext=RQ.solved(rwc.m,a.k)||''; }
    if(RQ.pzc!==rwc){ if(rwc.won) rest={m:rwc.m,k:a.k,x:a.x,y:a.y}; rwc=null; cool=2; }
    else if(!rwc.won&&(Math.abs(P.x-a.x)>70||Math.abs(P.y-a.y)>70||P.mode!=='walk')){ RQ.LOG.pQuit(rwc); RQ.pzc=null; rwc=null; cool=1; }
  }else if(cool<=0&&!sayNext&&!RQ.pzc&&P.on&&P.mode==='walk'&&!RQ.uiOpen()){
    out: for(const m of RQ.MACH) if(m.t==='rohre'&&rwHas(m)&&Math.abs(P.x-m.x)<1600) for(const a of wallsOf(RQ,m)) if(Math.abs(P.x-a.x)<40&&Math.abs(P.y-a.y)<52&&!(rest&&rest.m===m&&rest.k===a.k)){ rwStartWith(RQ,m,a); break out; }
  }
  /* Den Satz zur offenen Grotte erst nach dem Lob der Maschine sagen, sonst schneidet eins das andere ab. */
  if(sayNext&&!rwc&&performance.now()>talkLock){ RQ.say('',sayNext); sayNext=''; }
  zk+=((rwc?1:0)-zk)*Math.min(1,dt*5); if(zk<.002) zk=0;
  RQ.zoom(1+(RWZ-1)*zk);
  const c=rwc||null;
  if(c){
    const g=geo(c.a,c.st.w,c.st.h), tx=c.a.x, ty=g.top+g.h*RWT/2+20;
    cam.x+=(tx-cam.x)*zk; cam.y+=(ty-cam.y)*zk;
    for(let p=0;p<c.da.length;p++) c.da[p]+=(c.st.ang[p]-c.da[p])*Math.min(1,dt*14);
  }
}
/** Tippen auf die Leinwand im Nah-Modus. Gibt true zurück, wenn der Nah-Modus das Tippen nimmt (dann malt nichts). @param {Port} RQ @param {number} wx @param {number} wy @returns {boolean} */
export function rwTapWith(RQ,wx,wy){
  const c=rwc; if(!c) return false;
  if(c.busy||c.won) return true;
  const st=c.st, g=geo(c.a,st.w,st.h), lx=(wx-c.a.x)*g.s, x=Math.floor((lx-g.lx0)/RWT), y=Math.floor((wy-g.top)/RWT);
  if(x<0||y<0||x>=st.w||y>=st.h) return true;
  const p=y*st.w+x; if(st.t[p]===3||st.lk[p]) return true;
  st.r[p]=(st.r[p]+1)%4; st.ang[p]+=90; st.taps++; sfx('tick');
  if(st.taps===st.need*2+6) c.fails=Math.max(c.fails,2);
  if(rhDone(st,rhFlow(st))) pzWinWith(RQ.PZ);
  return true;
}
/** Aktionsknopf im Nah-Modus: Tipp wie in der Maschine (erst nach Fehlversuchen, höchstens pzHintMax). @param {Port} RQ @returns {boolean} */
export function rwHintWith(RQ){
  const c=rwc; if(!c) return false;
  if(c.busy||c.won) return true;
  if(c.hint>=pzHintMaxWith(RQ.PZ,c)){ RQ.speak('Den Tipp hast du schon bekommen. Du schaffst den Rest!'); return true; }
  if(c.fails<1){ RQ.speak('Probier es erst einmal selbst. Wenn es nicht klappt, gibt es einen Tipp.'); return true; }
  RQ.LOG.pHint(c); c.hint++;
  const st=c.st, bad=[], wrong=[];
  for(let p=0;p<st.t.length;p++) if(st.sr[p]>=0&&!st.lk[p]){ bad.push(p); if(st.t[p]===0?(st.r[p]&1)!==(st.sr[p]&1):st.r[p]!==st.sr[p]) wrong.push(p); }
  const pick=wrong.length?wrong:bad;
  if(pick.length){ const p=pick[Math.floor(Math.random()*pick.length)]; st.ang[p]+=((st.sr[p]-st.r[p]+4)%4)*90; st.r[p]=st.sr[p]; st.lk[p]=true; }
  RQ.speak('Ein Rohr habe ich für dich festgeschraubt. Fang bei der Quelle an und geh Stück für Stück weiter.');
  if(rhDone(st,rhFlow(st))) pzWinWith(RQ.PZ);
  return true;
}
/** Ein Rohrstück: Anschlüsse aus der Grundform, um den angezeigten Winkel gedreht. @param {CanvasRenderingContext2D} ctx @param {number} t @param {number} deg @param {string} col */
function pipe(ctx,t,deg,col){
  ctx.save(); ctx.rotate(deg*TAU/360);
  const m=RMASK[t], q=RWT/2;
  ctx.lineCap='round'; ctx.lineWidth=RWT*.42; ctx.strokeStyle='#1b1a24'; ctx.beginPath();
  for(const [b,x,y] of [[1,0,-q],[2,q,0],[4,0,q],[8,-q,0]]) if(m&b){ ctx.moveTo(0,0); ctx.lineTo(x,y); }
  ctx.stroke(); ctx.lineWidth=RWT*.26; ctx.strokeStyle=col; ctx.stroke();
  ctx.restore();
}
/** Zeichnet die Wände in der Ebene 'glow' (über der Dunkelheit). @param {Port} RQ @param {CanvasRenderingContext2D} ctx @param {string} layer @param {number} x0 @param {number} x1 */
export function rwDrawWith(RQ,ctx,layer,x0,x1){
  if(layer!=='glow') return;
  for(const m of RQ.MACH) if(m.t==='rohre'&&m.x>x0-1300&&m.x<x1+1300&&rwHas(m)) for(const a of wallsOf(RQ,m)){
    if(a.x<x0-200||a.x>x1+200) continue;
    const c=rwc&&rwc.m===m&&rwc.a.k===a.k?rwc:null, st=c?c.st:null, w=st?st.w:4, h=st?st.h:3, g=geo(a,w,h);
    const f=st?rhFlow(st):null, done=st?rhDone(st,/** @type {Set<number>} */ (f)):false;
    ctx.save(); ctx.translate(a.x,0); ctx.scale(g.s,1);
    ctx.fillStyle='#1b1a24'; RQ.rr(g.lx0-RWT-6,g.top-6,(w+2)*RWT+12,h*RWT+12,8);
    ctx.fillStyle=c?'#5a4f6e':'#3b3448'; RQ.rr(g.lx0-RWT-3,g.top-3,(w+2)*RWT+6,h*RWT+6,6);
    const ys=st?st.ys:1, ye=st?st.ye:1, sx=g.lx0+w*RWT+RWT/2;
    /* Auslass: Rohr von der rechten Kante hinunter zur Glutstein-Sperre (k 0) bzw. zur Tür (k 1). */
    ctx.lineCap='round'; ctx.lineWidth=RWT*.42; ctx.strokeStyle='#1b1a24'; ctx.beginPath(); ctx.moveTo(sx-RWT/2,g.top+(ye+.5)*RWT); ctx.lineTo(sx,g.top+(ye+.5)*RWT); ctx.lineTo(sx,a.y+2); ctx.stroke();
    ctx.lineWidth=RWT*.26; ctx.strokeStyle=done?'#4fb3ff':'#8a8796'; ctx.stroke();
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){
      const p=y*w+x, cx=g.lx0+(x+.5)*RWT, cy=g.top+(y+.5)*RWT;
      ctx.fillStyle=(x+y)&1?'#4a4159':'#443c52'; ctx.fillRect(cx-RWT/2+1,cy-RWT/2+1,RWT-2,RWT-2);
      ctx.save(); ctx.translate(cx,cy);
      if(!st){ pipe(ctx,(x+y)%2,((x*3+y)%4)*90,'#8a8796'); ctx.restore(); continue; }
      if(st.t[p]===3){ ctx.fillStyle='#6d6a78'; RQ.rr(-RWT*.4,-RWT*.4,RWT*.8,RWT*.8,4); ctx.restore(); continue; }
      pipe(ctx,st.t[p],c.da[p],/** @type {Set<number>} */ (f).has(p)?'#4fb3ff':'#b9b4c6');
      if(st.lk[p]){ ctx.fillStyle='#ffd23f'; RQ.circle(0,0,RWT*.12); }
      ctx.restore();
    }
    ctx.restore();
    const qx=a.x+g.s*(g.lx0-RWT/2);
    RQ.emo('🚰',qx,g.top+(ys+.5)*RWT,RWT*.8);
    /* Statt des Maschinenkastens: über der ersten Wand ein Zahnrad, solange sie noch nie gelöst ist, danach ein Haken. */
    if(!a.k) RQ.emo(RQ.got(m)?'✅':'⚙️',a.x,g.top-16,RWT*.8);
  }
}
/** Nah-Modus aktiv? (für Tests und den Port) @returns {boolean} */
export function rwNah(){ return !!rwc; }
