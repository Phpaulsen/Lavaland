// Tiere (PR 19a): Laufen, Fliegen, Schwimmen, Anstoßen, Schlüpfen und Zeichnen. Bewegt aus legacy.js.
// Was sie vom übrigen Spiel brauchen (Zeit, Welt, Effekte, Wackeln, Belohnung, Zeichenhelfer), kommt über den Port CR.
// Tiere sind keine eigenen Systeme in SIDE: creTick läuft in worldTick, drawCres im Weltzeichnen, creHit beim Antippen; app/wire.js ruft sie über Einzeiler.
// throws (geworfene Bananen) gehört hierher; pickTick und draw in app/wire.js lesen es.
import { CELL, clamp, WORLD_W, WATER, FIRE, LAVA, WL } from '../core/world/const.js';
import { jingle, sfx } from '../audio/sound.js';
import { hero, P, cam } from '../state/game.js';
import { ST } from '../state/facade.js';
import { cellAt, hotAt } from '../state/sim.js';

/** @typedef {Record<string, any>} Port */
/** @type {any[]} */
export let throws=[];
export let trexT=0;
/** @param {Port} CR @param {any} c */
export function creInitWith(CR,c){
  if(c.k==='swim') return true;
  if(c.x>(CR.genF-6)*CELL) return false;
  if(c.y!==c.y) c.y=CR.surfaceY(c.x);
  if(c.k==='fly') c.y0=CR.surfaceY(c.hx)-64-c.ph*8;
  return true;
}
/** @param {Port} CR @param {any} c */
export function hatchWith(CR,c){
  c.fl=''; c.e='🐣'; c.say='PIEP!'; CR.confetti(c.x,c.y); jingle();
  if(!hero.own.rex){ hero.own.rex=1; CR.saveHero(); CR.say('','Knack! Ein Dino-Baby schlüpft und piept dich fröhlich an.'); }
  else{ ST.lootDirty=true; }
}
/* Der Held stößt ein Tier an oder tippt es an. Jedes sagt etwas, manche schubsen, schenken oder zaubern. */
/** @param {Port} CR @param {any} c @param {any} tap */
export function creHitWith(CR,c,tap){
  if(c.cd>0) return;
  c.cd=1.4; c.hop=.35;
  CR.shout(c.x,c.y-c.sz-12,c.say); sfx(c.sz>30?'roar':'quack');
  if(!c.met){ c.met=true; CR.qEvent('poke',1); }
  const f=c.fl, away=P.x<c.x?-1:1, foot=!tap&&(P.mode==='walk'||P.mode==='ski');
  if(f==='eat'){ c.gone=CR.time+18; ST.lootDirty=true; sfx('coin'); }
  else if(f==='gift'){ if(!(c.gt>CR.time)){ c.gt=CR.time+30; ST.lootDirty=true; CR.spawn(8,c.x,c.y-30,0,-30,1.4,18,'🍪'); } }
  else if(f==='sparkle'){ for(let i=0;i<12;i++) CR.spawn(5,c.x,c.y-10,(Math.random()-.5)*160,-40-Math.random()*120,.7,2); }
  else if(f==='mummy'){ c.k='hop'; c.follow=true; c.rng=60; }
  if(!foot) return;
  if(f==='sting'){ P.vy=-300; P.vx=away*160; P.on=false; CR.shout(P.x,P.y-56,'AUA!'); }
  else if(f==='scare'||f==='toss'||f==='trex'||f==='car'){ P.vy=-480; P.vx=away*220; P.on=false; CR.shake=Math.max(CR.shake,.3); }
  else if(f==='uni'){ CR.FX.rainbow=8; CR.shout(P.x,P.y-56,'REGENBOGEN!','#ffd23f'); }
  else if(f==='ghost'){ P.frost=2.5; P.vy=-220; P.on=false; }
}
/** @param {Port} CR @param {any} dt */
export function creTickWith(CR,dt){
  const hx=P.x, hy=P.y, foot=P.mode==='walk'||P.mode==='ski';
  for(const c of ST.CRE){
    if(Math.abs(c.x-cam.x)>1150||c.gone>CR.time) continue;
    if(!c.ok){ if(!creInitWith(CR,c)) continue; c.ok=true; }
    c.t+=dt; if(c.cd>0) c.cd-=dt; if(c.hop>0) c.hop-=dt;
    const dx=hx-c.x, dist=Math.hypot(dx,hy-16-(c.y-c.sz*.5)), f=c.fl, k=c.k;
    if(k==='walk'||k==='hop'){
      let sp=f==='slow'?7:f==='car'?150:c.sp;
      if(f==='trex'&&dist<280){
        c.dir=dx>0?1:-1; sp=74; c.idle=0;
        if(dist<230&&CR.time>trexT){ trexT=CR.time+6; CR.shout(c.x,c.y-c.sz-14,'ROAAAR!'); CR.shake=Math.max(CR.shake,.3); sfx('roar'); }
      }
      else if(CR.FX.stink>0&&dist<220){ c.dir=dx>0?-1:1; sp=Math.max(90,sp*3); c.idle=0; if(!(c.ig>CR.time)){ c.ig=CR.time+4; CR.shout(c.x,c.y-c.sz-12,'IGITT!'); } }
      else if(c.follow){ if(Math.abs(dx)>46) c.dir=dx>0?1:-1; sp=Math.abs(dx)>46?90:0; }
      else if(Math.abs(c.x-c.hx)>c.rng) c.dir=c.x<c.hx?1:-1;
      else{ c.next-=dt; if(c.next<=0){ c.next=2+Math.random()*5; c.dir=Math.random()<.5?-1:1; c.idle=Math.random()<.4?1.6:0; } }
      if(c.idle>0) c.idle-=dt;
      else if(sp>0){
        const nx=clamp(c.x+c.dir*sp*dt,50,WORLD_W-50), fl=CR.floorAt(nx,c.y,14);
        if(CR.solidW(nx,c.y-18)||fl>c.y+30||cellAt(nx,fl-8)===WATER||hotAt(nx,fl-4)) c.dir=-c.dir;
        else{ c.x=nx; c.y=fl; }
      }
      const fh=CR.floorAt(c.x,c.y,4); if(fh>c.y+1) c.y=Math.min(fh,c.y+320*dt);
      if(f==='cow'||f==='hen'){
        c.lay=(c.lay||8+Math.random()*10)-dt;
        if(c.lay<=0){
          c.lay=14+Math.random()*12;
          if(ST.DROPS.length<40) ST.DROPS.push(f==='cow'?{e:'💩',ty:'poo',x:c.x-c.dir*14,y:c.y-8,life:45}:{e:'🥚',ty:'egg1',x:c.x-c.dir*10,y:c.y-7,life:45});
        }
      }
    }else if(k==='fly'){
      if(f==='ghost'){
        /* Gespenster sind schüchtern: Sie kommen nur, wenn der Held wegschaut. */
        const look=(P.face>0)===(c.x>hx);
        if(dist<260&&look){ c.x+=(c.x>hx?1:-1)*70*dt; c.shy=true; }
        else if(dist<420){ c.x+=(dx>0?1:-1)*36*dt; c.shy=false; }
        else{ c.x+=(c.hx-c.x)*Math.min(1,dt*.3); c.shy=false; }
        c.x=clamp(c.x,c.hx-520,c.hx+520);
        c.y+=(((dist<420&&!look)?hy-26:c.y0)+10*Math.sin(c.t*2+c.ph)-c.y)*Math.min(1,dt*1.4); c.dir=dx>0?1:-1;
      }else{ c.x=c.hx+Math.sin(c.t*.6+c.ph)*140; c.y=c.y0+Math.sin(c.t*1.7+c.ph)*18; c.dir=Math.cos(c.t*.6+c.ph)>0?1:-1; }
    }else if(k==='swim'){
      c.x+=c.dir*c.sp*dt;
      if(c.x<c.a){ c.x=c.a; c.dir=1; } else if(c.x>c.z){ c.x=c.z; c.dir=-1; }
      if(cellAt(c.x+c.dir*16,c.y)>=4) c.dir=-c.dir;
      if(cellAt(c.x,c.y)!==WATER){ if(!CR.solidW(c.x,c.y+6)) c.y+=90*dt; }
      else if(cellAt(c.x,c.y+26)>=4) c.y-=24*dt;
      else if(cellAt(c.x,c.y-26)!==WATER) c.y+=24*dt;
      if(f==='jump'){ c.next-=dt; if(c.next<=0&&!(c.jmp>0)){ c.next=5+Math.random()*5; c.jmp=1; } if(c.jmp>0) c.jmp-=dt/1.1; }
    }else if(f==='monkey'){
      c.next-=dt;
      if(c.next<=0){ c.next=4+Math.random()*4; if(dist<330&&foot){ const T=.9; throws.push({e:'🍌',x:c.x,y:c.y-12,vx:dx/T,vy:(hy-20-(c.y-12))/T-350*T}); CR.shout(c.x,c.y-34,'UH UH!'); sfx('throw'); } }
    }else if(f==='nest'){
      c.next-=dt;
      if(c.next<=0){ c.next=.4; if(CR.boxCount(c.x-44,c.x+44,c.y-54,c.y+10,/** @param {any} m */ function(m){return m===FIRE||m===LAVA;})>1){ c.warm=(c.warm||0)+.4; CR.spawn(8,c.x,c.y-36,0,-26,.8,12,'❤️'); if(c.warm>=2.8) hatchWith(CR,c); } }
    }
    if(P.mode==='coaster') continue;
    const top=c.y-c.sz;
    if(f==='bront'&&P.vy>60&&Math.abs(dx)<c.sz*.55&&hy>top-8&&hy<top+c.sz*.6){ P.vy=-760; P.on=false; P.air=0; P.chute=false; CR.shout(hx,hy-56,'HUIII!'); sfx('jump'); c.hop=.3; }
    else if(c.cd<=0&&Math.abs(dx)<9+c.sz*.4&&hy>top-4&&hy<c.y+22&&!(f==='bury'&&CR.solidW(c.x,c.y-8))) creHitWith(CR,c,false);
  }
}
/** @param {Port} CR @param {CanvasRenderingContext2D} ctx @param {any} x0 @param {any} x1 @param {any} y0 @param {any} y1 */
export function drawCresWith(CR,ctx,x0,x1,y0,y1){
  for(const c of ST.CRE){
    if(!c.ok||c.x<x0-60||c.x>x1+60||c.gone>CR.time) continue;
    if(c.fl==='bury'&&CR.solidW(c.x,c.y-8)) continue;
    let y=c.y;
    if(!CR.reduced){
      if(c.hop>0) y-=Math.abs(Math.sin(c.t*16))*12;
      else if(CR.discoT>0) y-=Math.abs(Math.sin(CR.time*12+c.ph))*9;
      else if(c.k==='hop'&&!(c.idle>0)) y-=Math.abs(Math.sin(c.t*6+c.ph))*9;
      else if(c.k==='swim') y+=Math.sin(c.t*2+c.ph)*5;
    }
    if(c.jmp>0) y=WL-Math.sin((1-c.jmp)*Math.PI)*74;
    if(y<y0-60||y>y1+60) continue;
    ctx.save(); ctx.translate(c.x,y-c.sz*.5);
    if(c.dir>0) ctx.scale(-1,1);
    if(c.shy) ctx.globalAlpha=.4;
    CR.emo(c.e,0,0,c.sz); ctx.restore();
  }
  ctx.globalAlpha=1;
}
