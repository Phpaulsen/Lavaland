/* ---------- Die große Welt malen: Stimmung, Pflanzen, Deko, Sprungpilze, Geheimnisse, Planeten, Werkstatt, Aufzug, Maschinen und Leuchtmarken in der Tiefe ---------- */
// PR 22. Bewegt aus legacy.js. Was das Malen vom übrigen Spiel braucht, kommt über den Port RP; gezeichnet wird auf den übergebenen ctx.
// Die Zeichenhelfer circle, rr und emo bleiben vorerst in legacy.js und malen auf denselben Kontext. draw() selbst folgt in PR 23.
// mood, drawMood, drawFlora, drawOrb, drawWorldBack, drawWorldFront und drawDeep ruft legacy.js über Einzeiler.
import { bix } from '../state/world.js';
import { clamp, CELL, GX, TAU } from '../core/world/const.js';
import { cam, P } from '../state/game.js';
import { BT, WSX, LIFTX } from '../core/world/shape.js';
import { ST } from '../state/facade.js';
import { cellAt } from '../state/sim.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} RP */
export function moodWith(RP){
  const ia=bix[clamp(Math.floor((cam.x-260)/CELL),0,GX-1)], ib=bix[clamp(Math.floor((cam.x+260)/CELL),0,GX-1)];
  const A=BT[ia?ST.BIO[ia-1].t:0], B=BT[ib?ST.BIO[ib-1].t:0];
  let t=0; if(ia!==ib&&ib) t=clamp((cam.x-(ST.BIO[ib-1].x0-260))/520,0,1);
  const nl=Math.max(RP.nightA,A.night+(B.night-A.night)*t), dk=1-.5*nl, D=t<.5?A:B;
  const h1=RP.lerpC(A.hill[0],B.hill[0],t), h2=RP.lerpC(A.hill[1],B.hill[1],t);
  RP.MD.st=RP.lerpC(A.sky[0],B.sky[0],t); RP.MD.sb=RP.lerpC(A.sky[1],B.sky[1],t); RP.MD.nl=nl;
  RP.MD.h1='rgb('+(h1[0]*dk|0)+','+(h1[1]*dk|0)+','+(h1[2]*dk|0)+')'; RP.MD.h2='rgb('+(h2[0]*dk|0)+','+(h2[1]*dk|0)+','+(h2[2]*dk|0)+')';
  RP.MD.w1=D.wat?D.wat[0]:'rgba(48,140,224,.74)'; RP.MD.w2=D.wat?D.wat[1]:'rgba(132,204,246,.8)';
  return RP.MD;
}
/** @param {Port} RP @param {CanvasRenderingContext2D} ctx */
export function drawMoodWith(RP,ctx){
  const nl=RP.MD.nl;
  if(nl<.03&&RP.discoT<=0) return;
  ctx.save(); ctx.setTransform(RP.DPR,0,0,RP.DPR,0,0);
  if(nl>=.03){
    ctx.fillStyle='rgba(8,12,48,'+(.36*nl).toFixed(3)+')'; ctx.fillRect(0,0,RP.W,RP.H);
    if(cam.y>-900&&cam.y<400){
      ctx.fillStyle='#ffe98a';
      for(let i=0;i<12;i++){
        const t=RP.reduced?i:RP.time*.3+i*1.7, x=(((Math.sin(t*1.3+i)*.5+.5)*RP.W+i*97-cam.x*RP.S*.6)%RP.W+RP.W)%RP.W, y=RP.H*(.35+.3*(Math.sin(t+i*2.1)*.5+.5));
        ctx.globalAlpha=nl*(.3+.7*Math.abs(Math.sin(t*3+i))); RP.circle(x,y,1.8*RP.S+.6);
      }
      ctx.globalAlpha=1;
    }
  }
  if(RP.discoT>0){ ctx.globalAlpha=.16; ctx.fillStyle='hsl('+(RP.reduced?300:Math.floor(RP.time*240)%360)+',90%,55%)'; ctx.fillRect(0,0,RP.W,RP.H); }
  ctx.restore(); ctx.globalAlpha=1;
}
/** @param {Port} RP @param {CanvasRenderingContext2D} ctx @param {any} tr @param {any} x @param {any} y @param {any} h @param {any} s */
export function drawFloraWith(RP,ctx,tr,x,y,h,s){
  const k=tr.kind, on=tr.state===1, ci=Math.floor(tr.x)%6;
  ctx.lineCap='round'; ctx.lineJoin='round';
  if(k==='cactus'){
    ctx.fillStyle=on?'#7a5a24':'#3f9d57';
    RP.rr(x-6*s,y-h,12*s,h+4,6*s); RP.rr(x-17*s,y-h*.66,8*s,h*.36,4*s); RP.rr(x-17*s,y-h*.38,14*s,7*s,3.5*s); RP.rr(x+9*s,y-h*.84,8*s,h*.38,4*s); RP.rr(x+3*s,y-h*.54,14*s,7*s,3.5*s);
    ctx.fillStyle='#ff7ab0'; RP.circle(x,y-h-1,3*s);
  }else if(k==='palm'){
    const tx=x+4*s, ty=y-h;
    ctx.strokeStyle='#8a5a3c'; ctx.lineWidth=6*s; ctx.beginPath(); ctx.moveTo(x,y+4); ctx.quadraticCurveTo(x+10*s,y-h*.5,tx,ty); ctx.stroke();
    ctx.strokeStyle=on?'#7a5a24':'#2f8f4a'; ctx.lineWidth=5*s; ctx.beginPath();
    for(let i=0;i<5;i++){ const a=-2.7+i*.565; ctx.moveTo(tx,ty); ctx.quadraticCurveTo(tx+22*s*Math.cos(a),ty+22*s*Math.sin(a),tx+38*s*Math.cos(a),ty+22*s*Math.sin(a)+16*s); }
    ctx.stroke();
    ctx.fillStyle='#6a4428'; RP.circle(tx-3*s,ty+4*s,3.4*s); RP.circle(tx+4*s,ty+5*s,3.4*s);
  }else if(k==='jungle'||k==='giant'){
    const g=k==='giant'?2:1;
    ctx.fillStyle='#6a4428'; ctx.fillRect(x-4.5*s*g,y-h*.82,9*s*g,h*.82+6);
    ctx.strokeStyle='#3d8f3a'; ctx.lineWidth=1.6; ctx.beginPath();
    for(let i=-1;i<=1;i++){ ctx.moveTo(x+i*15*s*g,y-h*.72); ctx.quadraticCurveTo(x+i*15*s*g+4,y-h*.55,x+i*13*s*g,y-h*.72+34+i*8); }
    ctx.stroke();
    ctx.fillStyle=on?'#7a5a24':'#1f7a44'; RP.circle(x-18*s*g,y-h*.8,21*s*g); RP.circle(x+18*s*g,y-h*.82,21*s*g);
    ctx.fillStyle=on?'#96702a':'#2a9552'; RP.circle(x,y-h,25*s*g);
  }else if(k==='lolly'){
    ctx.strokeStyle='#fff'; ctx.lineWidth=3.2*s; ctx.beginPath(); ctx.moveTo(x,y+3); ctx.lineTo(x,y-h); ctx.stroke();
    ctx.fillStyle=RP.CONF[ci]; RP.circle(x,y-h,13*s);
    ctx.strokeStyle='#fff'; ctx.lineWidth=2.4*s; ctx.beginPath(); ctx.arc(x,y-h,8*s,0,4.4); ctx.moveTo(x+3.5*s,y-h); ctx.arc(x,y-h,3.5*s,0,4); ctx.stroke();
  }else if(k==='cane'){
    ctx.lineWidth=6*s; ctx.strokeStyle='#fff'; ctx.beginPath(); ctx.moveTo(x,y+3); ctx.lineTo(x,y-h+9*s); ctx.arc(x+9*s,y-h+9*s,9*s,Math.PI,0); ctx.stroke();
    ctx.strokeStyle='#e63946'; ctx.setLineDash([6*s,7*s]); ctx.lineCap='butt'; ctx.stroke(); ctx.setLineDash([]);
  }else if(k==='shroom'){
    ctx.fillStyle='#f3e9d2'; RP.rr(x-2.5*s,y-h*.6,5*s,h*.6+3,2);
    ctx.fillStyle=['#e63946','#ff8a1f','#7b4fd6','#3aa0e8','#ff7ab0','#58b548'][ci]; ctx.beginPath(); ctx.arc(x,y-h*.6,8*s,Math.PI,0); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#fff'; RP.circle(x-3*s,y-h*.6-3.5*s,1.5*s); RP.circle(x+3*s,y-h*.6-4.5*s,1.8*s);
  }else if(k==='dead'){
    ctx.strokeStyle='#3a3244'; ctx.lineWidth=6*s; ctx.beginPath(); ctx.moveTo(x,y+4); ctx.lineTo(x,y-h*.75); ctx.stroke();
    ctx.lineWidth=3*s; ctx.beginPath(); ctx.moveTo(x,y-h*.5); ctx.lineTo(x-16*s,y-h*.85); ctx.moveTo(x,y-h*.62); ctx.lineTo(x+14*s,y-h); ctx.moveTo(x-9*s,y-h*.7); ctx.lineTo(x-20*s,y-h*.7); ctx.stroke();
  }else if(k==='grave'){
    ctx.fillStyle='#6f7688'; RP.rr(x-9*s,y-h-1,18*s,h+4,8*s);
    ctx.fillStyle='#9aa0b2'; RP.rr(x-7*s,y-h+1,14*s,h+2,6.5*s);
    ctx.strokeStyle='#6f7688'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x,y-h*.8); ctx.lineTo(x,y-h*.3); ctx.moveTo(x-4*s,y-h*.62); ctx.lineTo(x+4*s,y-h*.62); ctx.stroke();
  }else if(k==='fern'){
    ctx.strokeStyle=on?'#7a5a24':'#2f9a4a'; ctx.lineWidth=3*s; ctx.beginPath();
    for(let i=-2;i<=2;i++){ ctx.moveTo(x,y+2); ctx.quadraticCurveTo(x+i*8*s,y-h,x+i*15*s,y-h*.55); }
    ctx.stroke();
  }else if(k==='crystal'){
    const col=['#7fe3f0','#c79bff','#8ef0b8'][ci%3];
    ctx.fillStyle='#4a5a8a'; ctx.beginPath(); ctx.moveTo(x-9*s,y+3); ctx.lineTo(x-3*s,y-h-2); ctx.lineTo(x+6*s,y-h*.8-2); ctx.lineTo(x+10*s,y+3); ctx.closePath(); ctx.fill();
    ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x-7*s,y+3); ctx.lineTo(x-3*s,y-h); ctx.lineTo(x+5*s,y-h*.8); ctx.lineTo(x+8*s,y+3); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x-17*s,y+3); ctx.lineTo(x-13*s,y-h*.5); ctx.lineTo(x-8*s,y+3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(x-3*s,y-h+4); ctx.lineTo(x-4.5*s,y-4); ctx.stroke();
  }else if(k==='flower'){
    ctx.strokeStyle='#2f8f4a'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x,y+2); ctx.lineTo(x,y-h); ctx.stroke();
    ctx.fillStyle=RP.CONF[ci]; for(let i=0;i<5;i++){ const a=i*1.257; RP.circle(x+4.2*s*Math.cos(a),y-h+4.2*s*Math.sin(a),2.8*s); }
    ctx.fillStyle='#ffd23f'; RP.circle(x,y-h,2.4*s);
  }else{
    ctx.fillStyle=on?'#7a5a24':'#3d9a50'; RP.circle(x-8*s,y-h*.4,9*s); RP.circle(x+8*s,y-h*.4,9*s); RP.circle(x,y-h*.75,10*s);
  }
}
/** @param {Port} RP @param {CanvasRenderingContext2D} ctx @param {any} d */
export function drawDecoWith(RP,ctx,d){
  const x=d.x;
  if(d.k==='gate'){
    const g=RP.ground(x), on=ST.seen[d.b.i];
    ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle=RP.INK; ctx.lineWidth=8; ctx.beginPath(); ctx.moveTo(x-26,g+4); ctx.lineTo(x-26,g-56); ctx.quadraticCurveTo(x,g-86,x+26,g-56); ctx.lineTo(x+26,g+4); ctx.stroke();
    ctx.strokeStyle=on?'#ffd23f':'#cfd6dd'; ctx.lineWidth=4; ctx.stroke();
    ctx.fillStyle=RP.INK; RP.circle(x,g-80,18); ctx.fillStyle='#fff8e6'; RP.circle(x,g-80,15.5); RP.emo(BT[d.b.t].e,x,g-79,19);
  }else if(d.k==='mill'){
    const y=d.y;
    ctx.fillStyle='#fff8e6'; ctx.beginPath(); ctx.moveTo(x-17,y+3); ctx.lineTo(x-10,y-70); ctx.lineTo(x+10,y-70); ctx.lineTo(x+17,y+3); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#e63946'; ctx.beginPath(); ctx.moveTo(x-13,y-70); ctx.lineTo(x,y-88); ctx.lineTo(x+13,y-70); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#7a4a2c'; RP.rr(x-5,y-16,10,19,3);
    ctx.strokeStyle='#7a4a2c'; ctx.lineWidth=4; ctx.lineCap='round'; ctx.beginPath();
    for(let k=0;k<4;k++){ const a=(RP.reduced?.4:RP.time*.9)+k*Math.PI/2; ctx.moveTo(x,y-66); ctx.lineTo(x+40*Math.cos(a),y-66+40*Math.sin(a)); }
    ctx.stroke(); ctx.fillStyle=RP.INK; RP.circle(x,y-66,4);
  }else if(d.k==='sign'){
    ctx.fillStyle='#7a4a2c'; ctx.fillRect(x-2.5,d.y-40,5,43);
    ctx.fillStyle=RP.INK; RP.rr(x-19,d.y-62,38,28,6); ctx.fillStyle='#fff8e6'; RP.rr(x-17,d.y-60,34,24,4.5); RP.emo(d.e,x,d.y-47,17);
  }else if(d.k==='mast'){
    ctx.strokeStyle='#7a4a2c'; ctx.lineWidth=5; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x,d.y); ctx.lineTo(x,d.y-70); ctx.stroke();
    ctx.fillStyle=RP.INK; ctx.beginPath(); ctx.moveTo(x,d.y-70); ctx.lineTo(x+30,d.y-60); ctx.lineTo(x,d.y-48); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#fff'; RP.circle(x+10,d.y-60,4);
  }else if(d.k==='door'){
    ctx.fillStyle=RP.INK; RP.rr(x-13,d.y-38,24,40,10); ctx.fillStyle='#b9793a'; RP.rr(x-11,d.y-36,20,38,8); ctx.fillStyle='#ffd23f'; RP.circle(x+4,d.y-16,2.4);
  }
}
/** @param {Port} RP @param {CanvasRenderingContext2D} ctx @param {any} p */
export function drawPadWith(RP,ctx,p){
  const sq=p.bt>RP.time?(p.bt-RP.time)/.25:0;
  if(p.k==='hay'){
    ctx.fillStyle='#c79a2e'; RP.rr(p.x-p.w-1,p.y-1+sq*5,p.w*2+2,p.h+4-sq*5,6);
    ctx.fillStyle='#ecc94e'; RP.rr(p.x-p.w+1,p.y+1+sq*5,p.w*2-2,p.h-sq*5,4.5);
    ctx.strokeStyle='#c79a2e'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(p.x-5,p.y+3+sq*5); ctx.lineTo(p.x-5,p.y+p.h); ctx.moveTo(p.x+6,p.y+3+sq*5); ctx.lineTo(p.x+6,p.y+p.h); ctx.stroke();
    return;
  }
  const cy=p.y+sq*7, w=p.w+sq*5;
  ctx.fillStyle='#f3e9d2'; RP.rr(p.x-6,cy,12,p.y+p.h-cy+3,5);
  ctx.fillStyle=['#e63946','#ff8a1f','#7b4fd6','#3aa0e8','#ff7ab0','#58b548'][p.c%6]; ctx.beginPath(); ctx.ellipse(p.x,cy+3,w+4,17-sq*5,0,Math.PI,0); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#fff'; RP.circle(p.x-w*.45,cy-4,3.2); RP.circle(p.x+w*.3,cy-8,3.8); RP.circle(p.x+w*.62,cy-2,2.4);
}
/** @param {Port} RP @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y */
export function drawEggWith(RP,ctx,x,y){
  ctx.fillStyle='rgba(255,220,90,.35)'; RP.circle(x,y-2,17+(RP.reduced?0:2*Math.sin(RP.time*5)));
  ctx.fillStyle=RP.INK; ctx.beginPath(); ctx.ellipse(x,y-2,9.5,12.5,0,0,TAU); ctx.fill();
  ctx.fillStyle='#ffd23f'; ctx.beginPath(); ctx.ellipse(x,y-2,8,11,0,0,TAU); ctx.fill();
  ctx.fillStyle='#fff3b0'; ctx.beginPath(); ctx.ellipse(x-3,y-6,2,3.4,-.5,0,TAU); ctx.fill();
}
/** @param {Port} RP @param {CanvasRenderingContext2D} ctx @param {any} x0 @param {any} x1 @param {any} y0 @param {any} y1 */
export function drawSecretsWith(RP,ctx,x0,x1,y0,y1){
  for(const e of ST.EGGS){
    if(ST.eggGot[e.b]||e.x<x0-30||e.x>x1+30) continue;
    if(RP.solidW(e.x,e.y)){
      if(e.hint){ const sy=RP.surfaceY(e.x)-12, a=Math.max(0,Math.sin(RP.time*2.2+e.x)); if(a>0){ ctx.globalAlpha=a; ctx.fillStyle='#ffd23f'; RP.star4(e.x,sy,9); ctx.globalAlpha=1; } }
      continue;
    }
    if(e.y>y0-30&&e.y<y1+30) drawEggWith(RP,ctx,e.x,e.y+(RP.reduced?0:2.5*Math.sin(RP.time*3+e.x)));
  }
  for(const l of ST.LOOT){
    if(ST.lootGot[l.id]||l.x<x0-30||l.x>x1+30) continue;
    if(l.bur&&RP.solidW(l.x,l.y)){
      const sy=RP.surfaceY(l.x), a=Math.max(0,Math.sin(RP.time*2.2+l.x));
      if(l.xm){ ctx.strokeStyle='#e63946'; ctx.lineWidth=4; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(l.x-8,sy-9); ctx.lineTo(l.x+8,sy+5); ctx.moveTo(l.x+8,sy-9); ctx.lineTo(l.x-8,sy+5); ctx.stroke(); }
      else if(a>0){ ctx.globalAlpha=a; ctx.fillStyle='#fff8e6'; RP.star4(l.x,sy-12,8); ctx.globalAlpha=1; }
      continue;
    }
    if(l.tro) RP.emo('🏆',l.x,l.y-8,36);
    else if(l.pot){ ctx.fillStyle='#ffd23f'; RP.circle(l.x-5,l.y-9,4.5); RP.circle(l.x+4,l.y-10,4.5); RP.circle(l.x,l.y-13,4.5); ctx.fillStyle=RP.INK; RP.rr(l.x-12,l.y-8,24,18,8); ctx.fillRect(l.x-14,l.y-9,28,4); }
    else{ ctx.fillStyle=RP.INK; RP.rr(l.x-13,l.y-9,26,19,3); ctx.fillStyle='#b9793a'; RP.rr(l.x-11,l.y-7,22,15,2); ctx.fillStyle='#d89a4a'; RP.rr(l.x-11,l.y-13,22,9,4.5); ctx.fillStyle='#ffd23f'; RP.rr(l.x-2.5,l.y-6,5,6,1.5); }
  }
}
/** @param {Port} RP @param {CanvasRenderingContext2D} ctx @param {any} o */
export function drawOrbWith(RP,ctx,o){
  const x=o.x, y=o.y, r=o.r;
  if(o.k===0||o.k===1){
    ctx.fillStyle=o.k?'#d9a066':'#f5c63c'; RP.circle(x,y,r);
    ctx.fillStyle=o.k?'#5a3620':'#d9a520'; for(const q of RP.OHOLE) RP.circle(x+q[0]*r,y+q[1]*r,q[2]*r*(o.k?.6:1));
    RP.emo(o.k?'🍪':'🐭',x,y-r-12,24);
  }else if(o.k===2){
    ctx.fillStyle='#aab3c2'; RP.circle(x,y,r);
    for(let i=0;i<14;i++){ const a=i*2.4, d=r*(.2+.7*((i*37)%10)/10); ctx.fillStyle='hsl('+((i*47+(RP.reduced?0:Math.floor(RP.time*90)))%360)+',80%,70%)'; ctx.fillRect(x+d*Math.cos(a)-7,y+d*Math.sin(a)-7,14,14); }
    RP.emo('🕺',x,y-r-14,24);
  }else{
    const a=Math.atan2(P.y-y,P.x-x), ix=x+r*.34*Math.cos(a), iy=y+r*.34*Math.sin(a);
    ctx.fillStyle='#f4f8fc'; RP.circle(x,y,r); ctx.fillStyle='#3aa0e8'; RP.circle(ix,iy,r*.46); ctx.fillStyle=RP.INK; RP.circle(ix,iy,r*.24); ctx.fillStyle='#fff'; RP.circle(ix-r*.12,iy-r*.14,r*.08);
  }
}
/* Alles aus der großen Welt, das hinter dem Helden steht */
/** @param {Port} RP @param {CanvasRenderingContext2D} ctx @param {any} x0 @param {any} x1 @param {any} y0 @param {any} y1 */
export function drawWorldBackWith(RP,ctx,x0,x1,y0,y1){
  for(const d of ST.DECO) if(d.x>x0-70&&d.x<x1+70) drawDecoWith(RP,ctx,d);
  for(const p of ST.PADS) if(p.x>x0-60&&p.x<x1+60) drawPadWith(RP,ctx,p);
  drawSecretsWith(RP,ctx,x0,x1,y0,y1);
  RP.drawCres(x0,x1,y0,y1);
  const pk=/** @param {any} q */ function(q){ const b=RP.reduced?0:2.5*Math.sin(RP.time*3.4+q.x); ctx.fillStyle='rgba(255,255,255,.35)'; RP.circle(q.x,q.y+b,13); RP.emo(q.e,q.x,q.y+b+1,19); };
  for(const q of ST.PICKS) if(q.t<=RP.time&&q.y===q.y&&q.x>x0-20&&q.x<x1+20) pk(q);
  for(const d of ST.DROPS) if(d.x>x0-20&&d.x<x1+20) pk(d);
}
/* Alles aus der großen Welt, das vor dem Helden fliegt */
/** @param {Port} RP @param {CanvasRenderingContext2D} ctx */
export function drawWorldFrontWith(RP,ctx){
  for(const t of RP.throws) RP.emo(t.e,t.x,t.y,18);
  if(RP.bolt){
    ctx.strokeStyle='#fff7a8'; ctx.lineWidth=4; ctx.lineJoin='miter'; ctx.beginPath(); ctx.moveTo(RP.bolt.x,RP.bolt.y0);
    let y=RP.bolt.y0, k=0; while(y<RP.bolt.y1){ y+=34; ctx.lineTo(RP.bolt.x+((k++%2)?-14:14),Math.min(y,RP.bolt.y1)); }
    ctx.stroke();
  }
  if(RP.ufo){
    if(RP.ufo.beam&&RP.ufo.t<10){ ctx.fillStyle='rgba(255,246,160,.3)'; ctx.beginPath(); ctx.moveTo(RP.ufo.x-8,RP.ufo.y+6); ctx.lineTo(RP.ufo.x+8,RP.ufo.y+6); ctx.lineTo(RP.ufo.x+34,P.y+4); ctx.lineTo(RP.ufo.x-34,P.y+4); ctx.closePath(); ctx.fill(); }
    RP.emo('🛸',RP.ufo.x,RP.ufo.y+(RP.reduced?0:3*Math.sin(RP.time*5)),30);
  }
  if(P.mode!=='walk') return;
  if(RP.FX.float>0){
    const ks=RP.kidScale();
    ctx.strokeStyle=RP.INK; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(P.x+P.face*4,P.y-22*ks); ctx.lineTo(P.x+P.face*6,P.y-52*ks); ctx.stroke();
    RP.emo('🎈',P.x+P.face*6,P.y-64*ks,24);
  }
  if(RP.FX.stink>0){ ctx.fillStyle=RP.INK; for(let i=0;i<3;i++){ const a=RP.time*7+i*2.1; RP.circle(P.x+16*Math.cos(a),P.y-34+9*Math.sin(a*1.3),1.6); } }
}
/** @param {Port} RP @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} r @param {any} a @param {any} col */
export function gearShapeWith(RP,ctx,x,y,r,a,col){
  ctx.save(); ctx.translate(x,y); ctx.rotate(a);
  ctx.fillStyle=RP.INK; for(let i=0;i<8;i++){ ctx.rotate(TAU/8); ctx.fillRect(-r*.22-1.2,-r*1.34-1.2,r*.44+2.4,r*.7); } RP.circle(0,0,r+1.4);
  ctx.fillStyle=col; for(let i=0;i<8;i++){ ctx.rotate(TAU/8); ctx.fillRect(-r*.22,-r*1.34,r*.44,r*.7); } RP.circle(0,0,r);
  ctx.fillStyle=RP.INK; RP.circle(0,0,r*.4);
  ctx.restore();
}
/** @param {Port} RP @param {CanvasRenderingContext2D} ctx */
export function drawLabWith(RP,ctx){
  const x=WSX, y=RP.ground(x);
  ctx.fillStyle=RP.INK; RP.rr(x-39,y-54,78,58,6);
  ctx.fillStyle='#c98b4a'; RP.rr(x-36,y-51,72,54,4);
  ctx.fillStyle='#8a5a3c'; ctx.strokeStyle=RP.INK; ctx.lineWidth=3; ctx.lineJoin='round';
  ctx.beginPath(); ctx.moveTo(x-48,y-50); ctx.lineTo(x,y-84); ctx.lineTo(x+48,y-50); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#4a3424'; RP.rr(x-11,y-32,22,34,3);
  ctx.fillStyle='#ffd23f'; RP.circle(x+6,y-14,2);
  ctx.fillStyle=RP.INK; RP.rr(x+15,y-41,17,17,3); ctx.fillStyle='#bfe9f5'; RP.rr(x+17,y-39,13,13,2);
  gearShapeWith(RP,ctx,x,y-88,12,RP.reduced?0:RP.time*.8,'#9aa7b4');
  RP.emo('🤖',x-56,y-14+(RP.reduced?0:1.5*Math.sin(RP.time*3)),27);
}
/** @param {Port} RP @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} top */
export function drawCabWith(RP,ctx,x,y,top){
  if(top){
    ctx.strokeStyle=RP.INK; ctx.lineWidth=5; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(x-30,y+2); ctx.lineTo(x-9,y-96); ctx.moveTo(x+30,y+2); ctx.lineTo(x+9,y-96); ctx.moveTo(x-20,y-52); ctx.lineTo(x+20,y-52); ctx.stroke();
    ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x,y-96); ctx.lineTo(x,y-44); ctx.stroke();
    ctx.fillStyle=RP.INK; RP.circle(x,y-100,13); ctx.fillStyle='#e63946'; RP.circle(x,y-100,10); ctx.fillStyle=RP.INK; RP.circle(x,y-100,3.5);
  }
  ctx.fillStyle=RP.INK; RP.rr(x-17,y-46,34,48,5);
  ctx.fillStyle='#ffd23f'; RP.rr(x-14,y-43,28,42,3);
  ctx.fillStyle=RP.INK; ctx.fillRect(x-1,y-43,2,42);
  ctx.fillStyle='#bfe9f5'; RP.rr(x-11,y-38,8,11,2); RP.rr(x+3,y-38,8,11,2);
  ctx.fillStyle=RP.INK; RP.circle(x,y-51,5.5); ctx.fillStyle=RP.reduced||(RP.time*2|0)%2?'#58b548':'#c9f5b8'; RP.circle(x,y-51,3.6);
}
/** @param {Port} RP @param {CanvasRenderingContext2D} ctx @param {any} m */
export function drawMachWith(RP,ctx,m){
  const x=m.x, y=m.y, done=!!ST.pzGot[m.id], T=RP.PZI[m.t], b=RP.reduced?0:2.5*Math.sin(RP.time*3+x);
  ctx.strokeStyle=RP.INK; ctx.lineWidth=2.5; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x,y-40); ctx.lineTo(x,y-50); ctx.stroke();
  ctx.fillStyle=done?'#58b548':((RP.time*3|0)%2&&!RP.reduced?'#ffd23f':'#ff5a1f'); RP.circle(x,y-52,3.6);
  ctx.fillStyle=RP.INK; RP.rr(x-17,y-42,34,40,7); RP.rr(x-13,y-4,8,6,2); RP.rr(x+5,y-4,8,6,2);
  ctx.fillStyle=done?'#a9dba6':T.col; RP.rr(x-14,y-39,28,34,5);
  ctx.fillStyle=RP.INK; RP.rr(x-11,y-35,22,19,3); ctx.fillStyle='#fff8e6'; RP.rr(x-9.500,y-33.500,19,16,2);
  RP.emo(T.e,x,y-25,13);
  ctx.fillStyle=RP.INK; RP.circle(x-6,y-10,2.2); RP.circle(x,y-10,2.2); RP.circle(x+6,y-10,2.2);
  if(done) RP.emo('✅',x+13,y-40,13);
  else{ ctx.fillStyle='rgba(255,255,255,.4)'; RP.circle(x,y-68+b,12); gearShapeWith(RP,ctx,x,y-68+b,7,RP.reduced?0:RP.time*1.5,'#ffd23f'); }
}
/** @param {Port} RP @param {CanvasRenderingContext2D} ctx @param {any} m */
export function drawMatWith(RP,ctx,m){
  const b=RP.reduced?0:2*Math.sin(RP.time*3+m.x), emb=m.y>-3000&&cellAt(m.x,m.y)>=4;
  ctx.fillStyle=emb?'rgba(20,24,40,.5)':'rgba(255,255,255,.32)'; RP.circle(m.x,m.y+b,13);
  if(emb){ ctx.strokeStyle='rgba(255,248,230,.85)'; ctx.lineWidth=1.5; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.arc(m.x,m.y+b,13,0,TAU); ctx.stroke(); ctx.setLineDash([]); }
  RP.emo(RP.MAT[m.k][0],m.x,m.y+b+1,emb?15:18);
}
/** @param {Port} RP @param {CanvasRenderingContext2D} ctx @param {any} d */
export function drawBoneWith(RP,ctx,d){
  if(cellAt(d.x,d.y)<4) return;
  ctx.save(); ctx.translate(d.x,d.y); ctx.scale(d.s*d.f,d.s);
  ctx.strokeStyle='rgba(250,240,214,.8)'; ctx.fillStyle='rgba(250,240,214,.8)'; ctx.lineWidth=3; ctx.lineCap='round'; ctx.lineJoin='round';
  if(d.v===0){
    ctx.beginPath(); ctx.moveTo(-26,0); ctx.lineTo(20,0);
    for(let i=0;i<5;i++){ const x=-18+i*8, h=10-Math.abs(i-2)*2; ctx.moveTo(x,-h); ctx.lineTo(x,h); }
    ctx.moveTo(-26,0); ctx.lineTo(-34,-7); ctx.moveTo(-26,0); ctx.lineTo(-34,7); ctx.stroke(); RP.circle(26,0,6);
  }else if(d.v===1){
    ctx.beginPath(); ctx.moveTo(2,0);
    for(let a=.3;a<13;a+=.3){ const r=2+a*1.5; ctx.lineTo(r*Math.cos(a),r*Math.sin(a)); }
    ctx.stroke();
  }else{
    ctx.beginPath(); ctx.ellipse(0,0,20,12,0,0,TAU); ctx.stroke(); RP.circle(-7,-3,3.2);
    ctx.beginPath(); ctx.moveTo(4,9); ctx.lineTo(4,14); ctx.moveTo(10,8); ctx.lineTo(10,13); ctx.moveTo(15,5); ctx.lineTo(15,10); ctx.stroke();
  }
  ctx.restore();
}
/** @param {Port} RP @param {CanvasRenderingContext2D} ctx @param {any} d */
export function drawCryWith(RP,ctx,d){
  ctx.save(); ctx.translate(d.x,d.y); ctx.scale(d.s,d.s);
  for(let i=0;i<4;i++){
    const h=RP.CRYH[i];
    ctx.save(); ctx.rotate(-.6+i*.4);
    ctx.fillStyle=RP.CRYC[(d.c+i)%3]; ctx.beginPath(); ctx.moveTo(-6,0); ctx.lineTo(-5,-h+8); ctx.lineTo(0,-h); ctx.lineTo(5,-h+8); ctx.lineTo(6,0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(-2,-4); ctx.lineTo(-2,-h+11); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
/** @param {Port} RP @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y */
export function drawMarkWith(RP,ctx,x,y){
  const t=performance.now()/600, k=.75+.25*Math.sin(t+x);
  ctx.fillStyle='rgba(255,226,122,'+(.25*k).toFixed(3)+')'; RP.circle(x,y-14,16);
  ctx.fillStyle=RP.INK; ctx.fillRect(x-2,y-10,4,10);
  ctx.fillStyle='#ffe27a'; ctx.beginPath(); ctx.moveTo(x,y-24); ctx.lineTo(x+7,y-14); ctx.lineTo(x,y-6); ctx.lineTo(x-7,y-14); ctx.closePath(); ctx.fill();
  ctx.strokeStyle=RP.INK; ctx.lineWidth=2; ctx.stroke();
}
/** @param {Port} RP @param {CanvasRenderingContext2D} ctx @param {any} x0 @param {any} x1 @param {any} y0 @param {any} y1 */
export function drawDeepWith(RP,ctx,x0,x1,y0,y1){
  const gy=RP.ground(WSX);
  if(WSX>x0-80&&WSX<x1+80&&gy>y0-10&&gy<y1+100) drawLabWith(RP,ctx);
  if(LIFTX>x0-50&&LIFTX<x1+50) for(let k=0;k<RP.ZN.length;k++){ const y=RP.stationY(k); if(y>y0-10&&y<y1+120) drawCabWith(RP,ctx,LIFTX,y,k===0); }
  for(const d of RP.ZDEC) if(d.x>x0-60&&d.x<x1+60&&d.y>y0-60&&d.y<y1+60){ if(d.k==='bone') drawBoneWith(RP,ctx,d); else drawCryWith(RP,ctx,d); }
  for(const m of RP.MACH) if(m.y===m.y&&m.x>x0-30&&m.x<x1+30&&m.y>y0-10&&m.y<y1+90) drawMachWith(RP,ctx,m);
  for(const v of RP.VAULTS) if(v.x-v.rx>x0-40&&v.x-v.rx<x1+40&&v.fy>y0-10&&v.fy<y1+70&&RP.doorShut(v)) RP.drawDoor(v);
  for(const m of RP.MATS) if(!ST.matGot[m.id]&&RP.MATON[m.k]&&m.x>x0-20&&m.x<x1+20&&m.y>y0-20&&m.y<y1+20) drawMatWith(RP,ctx,m);
  for(const m of RP.marks()) if(m[0]>x0-30&&m[0]<x1+30&&m[1]>y0-10&&m[1]<y1+40) drawMarkWith(RP,ctx,m[0],m[1]);
}
