/* ---------- Spielen in der Welt: Zellen zählen, Springen, Funde verstecken, Album, Sternentor, Bomben, Sonar, Entdecken, Disco, Tippen in die Welt (Regenwolke, Baum schütteln) und Fernrohr ---------- */
// PR 29e. Bewegt aus legacy.js. Was die Funktionen vom übrigen Spiel brauchen, kommt über den Port TW. Zustand (Zähler, Tor, Fernrohr-Frage) bleibt vorerst in legacy.js, geschrieben über Setter.
// legacy.js ruft alle Funktionen über Einzeiler (Abschnitte, Ports und Tests). Malen (star4, pointTo) bleibt für 29f.
import { clamp, CELL, GX, TOP, GY, HOME_W, VOLC, FLAT, SITE, siteY, MOON, FIRE, TAU } from '../core/world/const.js';
import { grid, rC, grow0 } from '../state/world.js';
import { P, cam, hero } from '../state/game.js';
import { RX0, RW, realm } from '../state/realm.js';
import { surfaceY, ground, colTop, solidW, putUp } from '../state/queries.js';
import { CHX, SNX, BT } from '../core/world/shape.js';
import { ST } from '../state/facade.js';
import { rng } from '../core/rng.js';
import { sfx, jingle, blip } from '../audio/sound.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} TW @param {any} x0 @param {any} x1 @param {any} y0 @param {any} y1 @param {any} fn */
export function boxCountWith(TW,x0,x1,y0,y1,fn){
  const c0=clamp(Math.floor(x0/CELL),1,GX-2), c1=clamp(Math.floor(x1/CELL),1,GX-2), r0=clamp(Math.floor((y0-TOP)/CELL),1,GY-4), r1=clamp(Math.floor((y1-TOP)/CELL),1,GY-4);
  let n=0;
  for(let cy=r0;cy<=r1;cy++) for(let cx=c0;cx<=c1;cx++) if(fn(grid[cy*GX+cx],cy*GX+cx)) n++;
  return n;
}
/** @param {Port} TW @param {any} x */
export function teleportWith(TW,x){
  if(P.mode!=='walk') TW.setMode('walk');
  TW.grow(x+3200);
  P.x=clamp(x,RX0+60,RX0+RW-60); P.y=surfaceY(P.x); P.vx=0; P.vy=0; P.on=true; P.chute=false; P.hurt=.5;
  cam.x=P.x; cam.y=P.y-80;
  TW.smoke(P.x,P.y-20,6);
}
/** @param {Port} TW @param {any} zone @param {any} r */
export function placeFindWith(TW,zone,r){
  const anyX=function(){
    for(let k=0;k<40;k++){
      const x=260+r()*(HOME_W-520);
      let ok=Math.abs(x-VOLC)>620&&Math.abs(x-470)>120&&Math.abs(x-3150)>120&&Math.abs(x-CHX)>170&&x<SNX-40&&!(x>720&&x<1160);
      for(const k2 of FLAT) if(Math.abs(x-SITE[k2])<230) ok=false;
      if(ok) return x;
    }
    return 2000+r()*300;
  };
  let x, y;
  if(zone==='shallow'){ x=anyX(); return [x,ground(x)+50+r()*90,r()<.6]; }
  if(zone==='deep'){ x=anyX(); return [x,ground(x)+330+r()*600,r()<.3]; }
  if(zone==='deeper'){ x=200+r()*(HOME_W-400); return [x,1250+r()*1000,false]; }
  if(zone==='hot'){ x=200+r()*(HOME_W-400); return [x,2470+r()*330,false]; }
  if(zone==='cave'){
    for(let k=0;k<300;k++){
      x=1400+r()*5500; y=300+r()*2000;
      const cx=Math.floor(x/CELL), cy=Math.floor((y-TOP)/CELL);
      if(grid[cy*GX+cx]===0){ const f=colTop(cx,cy); if(f-cy<12&&f<rC[cx]-2) return [x,TOP+f*CELL-12,false]; }
    }
    return null;
  }
  if(zone==='lake'){ x=830+r()*220; return [x,TOP+colTop(Math.floor(x/CELL),Math.floor((ground(700)+235-TOP)/CELL))*CELL-10,false]; }
  if(zone==='pond'){ x=SITE.pond+(r()-.5)*120; return [x,TOP+colTop(Math.floor(x/CELL),Math.floor((siteY.pond-30-TOP)/CELL))*CELL-10,false]; }
  if(zone==='tree'){
    const cand=/** @type {any[]} */ ([]); TW.trees.forEach(/** @param {any} t @param {any} i */ function(t,i){ if(t.state===0&&i<ST.NT0) cand.push(i); });
    if(!cand.length) return null;
    const i=cand[Math.floor(r()*cand.length)], t=TW.trees[i];
    return [t.x,t.gy-t.h-4,false,i];
  }
  if(zone==='house'){ const k=grow0[Math.floor(SITE.smash/CELL)]>>2, b0=Math.round(SITE.smash/24)-2; return [(b0+3)*24+12,TOP+(k-2)*24+12,false]; }
  if(zone==='sky'){ const c=TW.clouds[Math.floor(r()*TW.clouds.length)]; return [c.x,c.y-6,false]; }
  if(zone==='space'){
    for(let k=0;k<30;k++){ x=300+r()*(HOME_W-600); y=-2700-r()*2500; if(Math.hypot(x-MOON.x,y-MOON.y)>MOON.r+90) return [x,y,false]; }
    return [800,-3000,false];
  }
  if(zone==='moon'){ const a=.6+r()*1.9; return [MOON.x+Math.cos(a)*(MOON.r+22),MOON.y+Math.sin(a)*(MOON.r+22),false]; }
  if(zone==='volcano'){ x=VOLC+(r()<.5?-1:1)*(170+r()*150); return [x,ground(x)+45+r()*60,false]; }
  if(zone==='edge'){ x=r()<.5?70+r()*50:HOME_W-70-r()*50; return [x,surfaceY(x)-16,false]; }
  return null;
}
/** @param {Port} TW */
export function hideFindsWith(TW){
  const r=rng(TW.SEED*7+13), order=TW.FINDS.slice();
  for(let i=order.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)), t=order[i]; order[i]=order[j]; order[j]=t; }
  order.sort(/** @param {any} a @param {any} b */ function(a,b){ return (ST.found[a[0]]?1:0)-(ST.found[b[0]]?1:0); });
  ST.hidden=[];
  for(const f of order){
    if(ST.hidden.length>=14) break;
    const q=placeFindWith(TW,f[3],r);
    if(q&&f[3]==='sky'&&solidW(q[0],q[1])) q[1]=surfaceY(q[0])-22;
    if(q) ST.hidden.push({id:f[0],e:f[1],name:f[2],zone:f[3],x:q[0],y:q[1],hint:!!q[2],tree:q[3]===undefined?-1:q[3],got:false});
  }
  /* Ein Fund liegt immer glitzernd gleich neben dem Start, damit der erste Schatz sicher gelingt. */
  const first=ST.hidden.find(function(h){return h.zone==='shallow';})||ST.hidden.find(function(h){return h.zone==='deep';});
  if(first){ first.zone='shallow'; first.x=772; first.y=ground(772)+58; first.hint=true; }
}
/** @param {Port} TW */
export function renderAlbumWith(TW){
  let n=0;
  TW.$('album').innerHTML=TW.FINDS.map(/** @param {any} f */ function(f){
    const g=!!ST.found[f[0]]; if(g) n++;
    return '<button class="'+(g?'':'q')+'" data-find="'+f[0]+'" aria-label="'+(g?f[2]:'Noch nicht gefunden')+'">'+(g?f[1]:'?')+'</button>';
  }).join('');
  TW.$('found').textContent=String(n); TW.$('found').hidden=n===0; TW.$('found-n').textContent=n+'/'+TW.FINDS.length;
  TW.renderEggs();
}
/** @param {Port} TW @param {any} id */
export function orbsOfWith(TW,id){ const R=TW.RLM[id]; return R.orb?[R.orb()]:R.orbs(); }
/* Landet man auf dem Mond oder einem Planeten und bleibt kurz stehen, beginnt die Reise. Oben über einer fremden Welt geht es zurück. */
/** @param {Port} TW @param {any} dt */
export function portalTickWith(TW,dt){
  if(ST.traveling||TW.uiOpen()) return;
  const R=TW.rlm();
  if(R){
    if(P.y<-1400&&!TW.exitHint){ TW.exitHint=true; TW.say('','Flieg noch ein Stück höher, dann geht es zurück zur Erde.'); }
    if(P.y<R.exit) TW.travel('');
    return;
  }
  let hit='';
  if(P.y<-3000) for(const id in TW.RLM) for(const o of orbsOfWith(TW,id)){
    const d=Math.hypot(P.x-o.x,P.y-o.y);
    if(TW.portalOff===id){ if(d>o.r+260&&o===TW.portO) TW.portalOff=''; continue; }
    if(P.on&&d<o.r+30&&(P.mode==='walk'||P.mode==='rocket'||P.mode==='plane')){ hit=id; TW.portO=o; }
  }
  if(hit){ TW.portalT+=dt; if(TW.portalT>.9) TW.travel(hit); } else TW.portalT=0;
}
/** @param {Port} TW @param {any} x @param {any} y */
export function dropBombWith(TW,x,y){
  if(hero.tnt>0){ hero.tnt--; ST.heroDirty=true; TW.hudLoot(); }
  else{ if(ST.energy<=0) return; TW.paintPay(TW.BOMBE); }
  TW.bombs.push({x:x,y:y,vy:0,t:1.8});
}
/** @param {Port} TW @param {any} x @param {any} y */
export function blastWith(TW,x,y){
  TW.bore(x,y,58);
  for(const tr of TW.trees) if(tr.state<3&&Math.hypot(tr.x-x,tr.gy-20-y)<70) tr.state=3;
  for(let i=0;i<30;i++) TW.spawn(1,x,y,(Math.random()-.5)*420,(Math.random()-.6)*420,.5+Math.random()*.5,8+Math.random()*9);
  for(let i=0;i<14;i++) TW.spawn(5,x,y,(Math.random()-.5)*520,-120-Math.random()*380,.9,2);
  TW.smoke(x,y-10,12); TW.shake=.5; sfx('boom'); TW.qEvent('bomb',1);
  if(P.mode!=='coaster'&&Math.hypot(P.x-x,P.y-16-y)<84) TW.burn();
}
/** @param {Port} TW */
export function sonarTargetWith(TW){
  let b=null, bd=1e12;
  for(const e of ST.EGGS){ if(ST.eggGot[e.b]||e.x>(TW.genF-10)*CELL) continue; const d=Math.hypot(e.x-P.x,e.y-P.y); if(d<bd){ bd=d; b=e; } }
  if(bd>4000) for(const l of ST.LOOT){ if(ST.lootGot[l.id]||l.x>(TW.genF-10)*CELL) continue; const d=Math.hypot(l.x-P.x,l.y-P.y)*1.5; if(d<bd){ bd=d; b=l; } }
  return b?[b.x,b.y]:null;
}
/** @param {Port} TW @param {any} b */
export function discoverWith(TW,b){
  const T=BT[b.t]; ST.seen[b.i]=1; ST.lootDirty=true; TW.qEvent('land',1); jingle(); TW.confetti(P.x,P.y);
  TW.banner(T.e+' ⭐',2400);
  TW.say('','Du hast '+(b.n?T.n2:T.n)+' entdeckt!');
}
/** @param {Port} TW @param {any} n */
export function discoWith(TW,n){ TW.discoT=n; TW.beatT=0; TW.shout(P.x,P.y-70,'DISCO!','#ff7ad9'); }
/** @param {Port} TW */
export function pupsWith(TW){
  TW.shout(P.x,P.y-50,'PUPS!','#9bd84a'); sfx('pups'); P.vy=-170; P.on=false;
  for(let i=0;i<10;i++) TW.spawn(12,P.x-P.face*8,P.y-10,-P.face*(30+Math.random()*60),-10-Math.random()*30,1,5,'#9bd84a');
}
/* Geheime Tasten: dreimal schnell nach unten macht Pups, hoch hoch runter runter links rechts links rechts startet die Disco. */
/** @param {Port} TW @param {any} k */
export function keyTapWith(TW,k){
  TW.idleT=0; TW.keySeq=(TW.keySeq+k).slice(-8);
  if(TW.keySeq==='uuddlrlr'){ TW.keySeq=''; discoWith(TW,12); }
  if(k==='d'){
    const now=performance.now(); TW.dTaps.push(now); if(TW.dTaps.length>3) TW.dTaps.shift();
    if(TW.dTaps.length===3&&now-TW.dTaps[0]<900&&P.mode==='walk'&&P.on){ TW.dTaps=[]; pupsWith(TW); }
  }
}
/** @param {Port} TW @param {any} c */
export function rainCloudWith(TW,c){
  c.rain=2; c.taps=(TW.time-(c.tapT||-9)<6?(c.taps||0):0)+1; c.tapT=TW.time; sfx('pop'); TW.skyRb=TW.time+14;
  if(c.taps>=3){
    c.taps=0;
    const gy=surfaceY(c.x), cx=Math.floor(c.x/CELL), cy=Math.floor((gy-TOP)/CELL);
    TW.bolt={x:c.x,y0:c.y+14*c.s,y1:gy,t:.35}; TW.shake=Math.max(TW.shake,.4); sfx('boom'); TW.shout(c.x,c.y+50,'DONNER!','#fff7a8');
    for(let d=-1;d<=1;d++) putUp(cx+d,cy-1,FIRE);
  }
}
/** @param {Port} TW @param {any} tr */
export function shakeTreeWith(TW,tr){
  if(tr.dr>TW.time) return;
  tr.sh=TW.time+.6; tr.dr=TW.time+8; sfx('tick');
  const k=tr.kind, top=tr.gy-tr.h*.7, drop=/** @param {any} e */ function(e){ if(ST.DROPS.length<40) ST.DROPS.push({e:e,ty:'food',x:tr.x+(Math.random()-.5)*24,y:top,life:22}); };
  if(tr.fir) TW.puff(tr.x,top,12);
  else if(k==='cactus') TW.shout(tr.x,top-20,'PIEKS!');
  else if(k==='palm') drop('🥥');
  else if(k==='lolly'||k==='cane') drop('🍬');
  else if(k==='crystal'){ ST.lootDirty=true; sfx('coin'); }
  else if(k==='dead') TW.spawn(8,tr.x,top,40,-60,1.6,20,'🦇');
  else if(k==='grave') TW.shout(tr.x,top-24,'BUH!');
  else if(k==='flower') TW.spawn(8,tr.x,top,30,-40,1.6,16,'🐝');
  else if(k==='jungle'||k==='giant') drop('🍌');
  else if(!k) drop('🍎');
}
/* Tippen ohne Werkzeug: Sonne, Tiere, Wolken, Bäume und die Tür am Ende der Welt reagieren. */
/** @param {Port} TW @param {any} sx @param {any} sy */
export function tapWorldWith(TW,sx,sy){
  if(ST.paused) return;
  const w=TW.toWorld(sx,sy), wx=w[0], wy=w[1];
  if(TW.deepTap(wx,wy)) return;
  if(Math.hypot(sx-(TW.W-74),sy-(TW.H*.34-cam.y*TW.S*.03))<32*TW.S+10&&cam.y>-1500&&!solidW(wx,wy)){ TW.nightOn=!TW.nightOn; sfx('pop'); TW.speak(TW.nightOn?'Gute Nacht!':'Guten Morgen!'); return; }
  /* Den Helden kitzeln: Beim fünften Mal muss er pupsen. */
  if(P.mode==='walk'&&Math.hypot(wx-P.x,wy-(P.y-20))<26){
    TW.tkN=TW.time-TW.tkT<3?TW.tkN+1:1; TW.tkT=TW.time;
    if(TW.tkN>=5){ TW.tkN=0; pupsWith(TW); } else{ TW.shout(P.x,P.y-54,['HIHI!','HEY!','DAS KITZELT!'][TW.tkN%3]); sfx('quack'); if(P.on){ P.vy=-150; P.on=false; } }
    return;
  }
  for(const c of ST.CRE){
    if(!c.ok||c.gone>TW.time||Math.abs(c.x-wx)>14+c.sz*.4||Math.abs(c.y-c.sz*.5-wy)>14+c.sz*.5) continue;
    if(c.fl==='bury'&&solidW(c.x,c.y-8)) continue;
    TW.creHit(c,true); return;
  }
  if(wx>5700&&wx<7300){
    const y=TW.N.yeti, fx=TW.flX(), fy=surfaceY(fx);
    if(Math.abs(wx-y.x)<28&&wy>y.y-70&&wy<y.y){ TW.yetiHit(); return; }
    for(const p of TW.N.pen) if(p.s===0&&Math.abs(wx-p.x)<12&&Math.abs(wy-(p.y-10))<16){ TW.pinFly(p,(Math.random()-.5)*160); return; }
    if(Math.abs(wx-fx)<16&&wy>fy-64&&wy<fy){ TW.shout(fx,fy-74,'HIHI!'); sfx('quack'); return; }
  }
  for(const d of ST.DECO) if(d.k==='door'&&Math.abs(d.x-wx)<28&&Math.abs(d.y-18-wy)<32){ TW.say('','Klopf, klopf. Wer ist da? Niemand. Hier ist die Welt wirklich zu Ende.'); return; }
  for(const c of TW.clouds) if(Math.abs(c.x-wx)<40*c.s&&Math.abs(c.y-wy)<24*c.s){ rainCloudWith(TW,c); return; }
  let best=null, bd=26;
  for(const tr of TW.trees){ if(tr.state!==0||Math.abs(tr.x-wx)>bd||wy>tr.gy+6||wy<tr.gy-tr.h-30) continue; bd=Math.abs(tr.x-wx); best=tr; }
  if(best) shakeTreeWith(TW,best);
}
/** @param {Port} TW */
export function nearScopeWith(TW){ return !realm&&P.mode==='walk'&&(P.on||P.air<.3)&&Math.abs(P.x-TW.SCOPEX)<44&&Math.abs(P.y-ground(TW.SCOPEX))<60; }
/** @param {Port} TW */
export function scopeOpenWith(TW){
  const mx=Math.min(TW.postMax(),12), n=3+Math.floor(Math.random()*(mx-2)), cells=[];
  for(let gy=0;gy<5;gy++) for(let gx=0;gx<5;gx++){ const x=18+gx*16+(Math.random()-.5)*8, y=18+gy*16+(Math.random()-.5)*8; if(Math.hypot(x-50,y-50)<38) cells.push([x,y]); }
  const pts=TW.shuffle(cells).slice(0,n);
  pts.sort(/** @param {any} a @param {any} b */ function(a,b){ return Math.atan2(a[1]-50,a[0]-50)-Math.atan2(b[1]-50,b[0]-50); });
  const opt=[n]; while(opt.length<3){ const o=Math.max(2,n+(Math.random()<.5?-1:1)*(1+Math.floor(Math.random()*2))); if(opt.indexOf(o)<0) opt.push(o); }
  TW.SCQ={n:n,pts:pts,opt:TW.shuffle(opt),done:false};
  scopeRenderWith(TW,-1); TW.$('scope').hidden=false; TW.speak('Wie viele Sterne siehst du?');
}
/** @param {Port} TW @param {any} cnt */
export function scopeRenderWith(TW,cnt){
  const q=TW.SCQ; let s='<path d="M'+q.pts.map(/** @param {any} p */ function(p){ return p[0].toFixed(1)+' '+p[1].toFixed(1); }).join('L')+'Z" stroke="rgba(160,190,255,.35)" stroke-width=".8" fill="none"/>';
  q.pts.forEach(/** @param {any} p @param {any} i */ function(p,i){
    s+='<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="'+(i<cnt?4.2:3)+'" fill="'+(i<cnt?'#ffd23f':'#fff8e6')+'"/>';
    if(i<cnt) s+='<text x="'+p[0].toFixed(1)+'" y="'+(p[1]-6).toFixed(1)+'" fill="#ffd23f" font-size="7" font-weight="700" text-anchor="middle">'+(i+1)+'</text>';
  });
  TW.$('scope-v').innerHTML=s;
  TW.$('scope-b').innerHTML=q.done?'<button class="ok" data-sc="next" aria-label="Noch ein Sternbild">▶️</button>':q.opt.map(/** @param {any} o */ function(o){ return '<button data-sc="'+o+'">'+o+'</button>'; }).join('');
}
/** @param {Port} TW @param {any} v */
export function scopePickWith(TW,v){
  const q=TW.SCQ; if(!q||q.done) return;
  if(v===q.n){ q.done=true; scopeRenderWith(TW,q.n); TW.speak(q.n+' Sterne! Richtig!'); jingle(); ST.lootDirty=true; TW.banner('🔭',1800); return; }
  q.done=true; TW.$('scope-b').innerHTML='';
  for(let i=1;i<=q.n;i++) setTimeout(function(){ if(TW.SCQ!==q) return; scopeRenderWith(TW,i); TW.speak(String(i)); if(i===q.n) setTimeout(function(){ if(TW.SCQ===q){ scopeRenderWith(TW,q.n); TW.speak('Es sind '+q.n+' Sterne.'); } },700); },i*700);
}
/** @param {Port} TW */
export function sonarWith(TW){
  TW.FX.sonar=7; blip(1500,1500,.5,'sine',.07);
  for(let i=0;i<16;i++){ const a=i/16*TAU; TW.spawn(5,P.x+Math.cos(a)*14,P.y-16+Math.sin(a)*14,Math.cos(a)*160,Math.sin(a)*160,.6,2); }
}
