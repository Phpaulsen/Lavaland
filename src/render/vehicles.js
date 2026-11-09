/* ---------- Fahrzeuge und Held malen: Kopf, Kind, Fallschirm, Auto, Bagger, Radlader, Kipper, Tunnelbohrer, Rakete, Flugzeug, Lore, U-Boot, Ballon, Hubschrauber, Boot, Käfer, Seilrutschen und Handwerkzeug ---------- */
// PR 29a. Bewegt aus legacy.js. Was das Malen vom übrigen Spiel braucht, kommt über den Port VR; gezeichnet wird auf den übergebenen ctx.
// Die Zeichenhelfer circle, rr und emo bleiben vorerst in app/wire.js (PR 29b). app/wire.js ruft alle Funktionen über Einzeiler (Port DR, WM und Abschnitte).
import { P, hero, parked, keys } from '../state/game.js';
import { TAU, CELL, TOP, GY, GX } from '../core/world/const.js';
import { ST } from '../state/facade.js';
import { grid } from '../state/world.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} VR @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} r */
export function headWith(VR,ctx,x,y,r){
  const sooty=P.soot>0;
  ctx.fillStyle=sooty?'#6b5a50':'#ffd2a8'; VR.circle(x,y,r);
  ctx.fillStyle=sooty?'#4a4046':P.frost>0?'#ffffff':'#ff8a1f'; ctx.beginPath(); ctx.arc(x,y-1,r+.7,Math.PI,0); ctx.closePath(); ctx.fill();
  ctx.fillStyle=VR.INK; VR.circle(x+r*.45,y+1,1.2);
  if(hero.hat==='crown'){
    ctx.fillStyle='#ffd23f'; ctx.beginPath(); ctx.moveTo(x-r,y-r*.7); ctx.lineTo(x-r,y-r*1.75); ctx.lineTo(x-r*.45,y-r*1.2); ctx.lineTo(x,y-r*1.95);
    ctx.lineTo(x+r*.45,y-r*1.2); ctx.lineTo(x+r,y-r*1.75); ctx.lineTo(x+r,y-r*.7); ctx.closePath(); ctx.fill();
  }else if(hero.hat==='tophat'){
    ctx.fillStyle=VR.INK; ctx.fillRect(x-r*1.3,y-r*1.05,r*2.6,r*.38); ctx.fillRect(x-r*.82,y-r*2.2,r*1.64,r*1.2);
    ctx.fillStyle='#e63946'; ctx.fillRect(x-r*.82,y-r*1.4,r*1.64,r*.3);
  }else if(hero.hat==='beanie'){
    ctx.fillStyle='#e63946'; ctx.beginPath(); ctx.arc(x,y-r*.35,r*1.1,Math.PI,0); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#fff'; ctx.fillRect(x-r*1.12,y-r*.58,r*2.24,r*.38); VR.circle(x,y-r*1.52,r*.44);
  }else if(VR.EHAT[hero.hat]) VR.emo(VR.EHAT[hero.hat],x,y-r*1.15,r*2.5);
  if(VR.FX.pump>0) VR.emo('🎃',x,y,r*2.9);
}
/** @param {Port} VR @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} face @param {any} run @param {any} up */
export function drawKidWith(VR,ctx,x,y,face,run,up){
  const sooty=P.soot>0, suit=sooty?'#3a3438':P.frost>0?'#dfeefa':'#2f6fd6', sw=Math.sin(run)*7;
  const ks=VR.kidScale();
  ctx.save(); ctx.translate(x,y); ctx.scale(face*ks,ks);
  ctx.lineCap='round'; ctx.strokeStyle=VR.INK; ctx.lineWidth=4;
  ctx.beginPath(); ctx.moveTo(-1,-13); ctx.lineTo(-1+sw,-2); ctx.moveTo(1,-13); ctx.lineTo(1-sw,-2); ctx.stroke();
  ctx.fillStyle='#8d99a6'; VR.rr(-11,-28,6,13,2);
  ctx.fillStyle=suit; VR.rr(-6,-29,12,18,5);
  ctx.strokeStyle=suit; ctx.lineWidth=3.5; ctx.beginPath();
  if(up){ ctx.moveTo(-3,-25); ctx.lineTo(-7,-39); ctx.moveTo(3,-25); ctx.lineTo(8,-39); }
  else{ ctx.moveTo(0,-25); ctx.lineTo(5-sw*.6,-16); }
  ctx.stroke();
  headWith(VR,ctx,0,-35,7);
  ctx.restore();
}
/** @param {Port} VR @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y */
export function drawChuteWith(VR,ctx,x,y){
  const cy=y-98;
  ctx.strokeStyle=VR.INK; ctx.lineWidth=1; ctx.beginPath();
  for(let i=-2;i<=2;i++){ ctx.moveTo(x+i*19,cy); ctx.lineTo(x,y-27); }
  ctx.stroke();
  for(let i=0;i<4;i++){
    ctx.fillStyle=i%2?'#fff8e6':'#e63946';
    ctx.beginPath(); ctx.moveTo(x,cy); ctx.arc(x,cy,40,Math.PI+i*Math.PI/4,Math.PI+(i+1)*Math.PI/4+.02); ctx.closePath(); ctx.fill();
  }
}
/** @param {Port} VR @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} ang @param {any} face @param {any} occupied @param {any} turbo */
export function drawCarWith(VR,ctx,x,y,ang,face,occupied,turbo){
  const sooty=occupied&&P.soot>0;
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(face,1);
  if(turbo){ ctx.fillStyle='#ffd23f'; ctx.beginPath(); ctx.moveTo(-30,-20); ctx.lineTo(-48-Math.random()*12,-15); ctx.lineTo(-30,-10); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle=sooty?'#4a3438':'#e63946';
  VR.rr(-30,-23,60,15,6);
  ctx.beginPath(); ctx.moveTo(-20,-22); ctx.lineTo(-13,-37); ctx.lineTo(9,-37); ctx.lineTo(19,-22); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#bfe9f5'; ctx.beginPath(); ctx.moveTo(-14,-23); ctx.lineTo(-10,-33); ctx.lineTo(7,-33); ctx.lineTo(14,-23); ctx.closePath(); ctx.fill();
  if(occupied) headWith(VR,ctx,0,-27,4.6);
  ctx.fillStyle='#ffd23f'; VR.circle(28,-17,2.6);
  ctx.fillStyle=VR.INK; VR.circle(-17,-8,8); VR.circle(17,-8,8);
  ctx.fillStyle='#cfd6dd'; VR.circle(-17,-8,3); VR.circle(17,-8,3);
  ctx.restore();
}
/** @param {Port} VR @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} ang @param {any} face @param {any} arm @param {any} load @param {any} occupied */
export function drawBaggerWith(VR,ctx,x,y,ang,face,arm,load,occupied){
  const sooty=occupied&&P.soot>0, yel=sooty?'#5a4a30':'#ffc21a';
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(face,1);
  ctx.fillStyle=VR.INK; VR.rr(-24,-13,48,13,6);
  ctx.fillStyle='#8d99a6'; VR.circle(-16,-6.5,3.4); VR.circle(0,-6.5,3.4); VR.circle(16,-6.5,3.4);
  ctx.fillStyle=yel; VR.rr(-21,-27,40,15,4); VR.rr(-17,-46,23,21,4);
  ctx.fillStyle='#bfe9f5'; VR.rr(-13,-43,16,13,2);
  if(occupied) headWith(VR,ctx,-5,-35,4.6);
  const pxv=8, pyv=-34, bx=pxv+56*Math.cos(arm), by=pyv+56*Math.sin(arm);
  const ex=(pxv+bx)/2+17*Math.sin(arm), ey=(pyv+by)/2-17*Math.cos(arm);
  ctx.lineCap='round'; ctx.lineJoin='round';
  ctx.beginPath(); ctx.moveTo(pxv,pyv); ctx.lineTo(ex,ey); ctx.lineTo(bx,by);
  ctx.strokeStyle=VR.INK; ctx.lineWidth=8; ctx.stroke();
  ctx.strokeStyle=yel; ctx.lineWidth=4.5; ctx.stroke();
  ctx.translate(bx,by); ctx.rotate(arm+.5);
  if(load>0){ ctx.fillStyle='#8a5a3c'; VR.circle(1,-7,7); }
  ctx.fillStyle=VR.INK; ctx.beginPath(); ctx.moveTo(-9,-7); ctx.lineTo(10,-7); ctx.lineTo(12,4); ctx.lineTo(3,11); ctx.lineTo(-9,6); ctx.closePath(); ctx.fill();
  ctx.restore();
}
/** @param {Port} VR @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} ang @param {any} face @param {any} lift @param {any} load @param {any} occupied */
export function drawLoaderWith(VR,ctx,x,y,ang,face,lift,load,occupied){
  const sooty=occupied&&P.soot>0, yel=sooty?'#5a4a30':'#f2a81d', bx=38, by=-12-lift;
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(face,1);
  ctx.fillStyle=yel; VR.rr(-30,-31,46,19,5); VR.rr(-25,-50,23,23,4);
  ctx.fillStyle='#bfe9f5'; VR.rr(-21,-47,16,13,2);
  if(occupied) headWith(VR,ctx,-13,-39,4.6);
  ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(8,-25); ctx.lineTo(bx-6,by-2);
  ctx.strokeStyle=VR.INK; ctx.lineWidth=8; ctx.stroke();
  ctx.strokeStyle=yel; ctx.lineWidth=4.5; ctx.stroke();
  if(load>0){ ctx.fillStyle='#8a5a3c'; VR.circle(bx+2,by-9,5+Math.min(6,load/30)); }
  ctx.fillStyle=VR.INK; ctx.beginPath(); ctx.moveTo(bx-10,by-10); ctx.lineTo(bx+6,by-10); ctx.lineTo(bx+17,by+8); ctx.lineTo(bx-8,by+8); ctx.closePath(); ctx.fill();
  ctx.fillStyle=VR.INK; VR.circle(-17,-10,10); VR.circle(13,-10,10);
  ctx.fillStyle='#cfd6dd'; VR.circle(-17,-10,4); VR.circle(13,-10,4);
  ctx.restore();
}
/** @param {Port} VR @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} ang @param {any} face @param {any} load @param {any} bed @param {any} occupied */
export function drawDumperWith(VR,ctx,x,y,ang,face,load,bed,occupied){
  const sooty=occupied&&P.soot>0;
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(face,1);
  ctx.save(); ctx.translate(-32,-19); ctx.rotate(-bed*.75);
  if(load>0){ const hh=5+load/400*20; ctx.fillStyle='#8a5a3c'; ctx.beginPath(); ctx.moveTo(4,-17); ctx.quadraticCurveTo(22,-17-hh*1.7,42,-17); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle=sooty?'#5a4a30':'#f2a81d'; ctx.beginPath(); ctx.moveTo(-4,-21); ctx.lineTo(48,-21); ctx.lineTo(44,0); ctx.lineTo(4,0); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle=VR.INK; VR.rr(-34,-21,68,6,3);
  ctx.fillStyle=sooty?'#3a3438':'#2f6fd6'; VR.rr(17,-44,19,25,4);
  ctx.fillStyle='#bfe9f5'; VR.rr(23,-41,11,11,2);
  if(occupied) headWith(VR,ctx,28,-34,4.4);
  ctx.fillStyle=VR.INK; VR.circle(-22,-9,9); VR.circle(-3,-9,9); VR.circle(25,-9,9);
  ctx.fillStyle='#cfd6dd'; VR.circle(-22,-9,3.5); VR.circle(-3,-9,3.5); VR.circle(25,-9,3.5);
  ctx.restore();
}
/** @param {Port} VR @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} ang @param {any} face @param {any} da @param {any} occupied @param {any} spin */
export function drawTbmWith(VR,ctx,x,y,ang,face,da,occupied,spin){
  const sooty=occupied&&P.soot>0;
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(face,1);
  ctx.fillStyle=VR.INK; VR.rr(-36,-9,50,9,4);
  ctx.fillStyle=sooty?'#4a4a50':'#9aa7b4'; VR.rr(-38,-47,50,39,8);
  ctx.fillStyle='#ffc21a'; ctx.fillRect(-38,-33,50,7);
  ctx.fillStyle='#bfe9f5'; VR.rr(-31,-45,15,10,2);
  if(occupied) headWith(VR,ctx,-23,-39,4);
  ctx.translate(24*Math.cos(da),-27+24*Math.sin(da)); ctx.rotate(da);
  ctx.fillStyle=VR.INK; ctx.beginPath(); ctx.ellipse(0,0,10,27,0,0,TAU); ctx.fill();
  ctx.fillStyle='#ff8a1f'; ctx.beginPath(); ctx.ellipse(1,0,6.5,23,0,0,TAU); ctx.fill();
  ctx.strokeStyle=VR.INK; ctx.lineWidth=3; ctx.lineCap='round'; ctx.beginPath();
  for(let k=0;k<4;k++){ const t=((spin+k/4)%1)*40-20; ctx.moveTo(-4,t); ctx.lineTo(6,t); }
  ctx.stroke();
  ctx.restore();
}
/** @param {Port} VR @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} ang @param {any} occupied @param {any} thrust */
export function drawRocketWith(VR,ctx,x,y,ang,occupied,thrust){
  const sooty=occupied&&P.soot>0;
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang);
  if(thrust){
    ctx.fillStyle='#ff7a1f'; ctx.beginPath(); ctx.moveTo(-8,-5); ctx.lineTo(0,18+Math.random()*18); ctx.lineTo(8,-5); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#ffe066'; ctx.beginPath(); ctx.moveTo(-4,-5); ctx.lineTo(0,8+Math.random()*10); ctx.lineTo(4,-5); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle='#e63946';
  ctx.beginPath(); ctx.moveTo(-9,-24); ctx.lineTo(-21,0); ctx.lineTo(-9,-5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(9,-24); ctx.lineTo(21,0); ctx.lineTo(9,-5); ctx.closePath(); ctx.fill();
  ctx.fillStyle=sooty?'#6a6460':'#f3f1ea';
  ctx.beginPath(); ctx.moveTo(0,-64); ctx.bezierCurveTo(15,-50,14,-20,10,-4); ctx.lineTo(-10,-4); ctx.bezierCurveTo(-14,-20,-15,-50,0,-64); ctx.fill();
  ctx.fillStyle='#e63946';
  ctx.beginPath(); ctx.moveTo(0,-64); ctx.bezierCurveTo(7,-57,10,-51,11.5,-45); ctx.lineTo(-11.5,-45); ctx.bezierCurveTo(-10,-51,-7,-57,0,-64); ctx.fill();
  ctx.fillStyle=VR.INK; VR.circle(0,-31,8); ctx.fillStyle='#bfe9f5'; VR.circle(0,-31,6.4);
  if(occupied) headWith(VR,ctx,0,-30,4.4);
  ctx.restore();
}
/** @param {Port} VR @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} vx @param {any} vy @param {any} face @param {any} on @param {any} ang @param {any} occupied */
export function drawPlaneWith(VR,ctx,x,y,vx,vy,face,on,ang,occupied){
  const sooty=occupied&&P.soot>0;
  ctx.save(); ctx.translate(x,y-16);
  ctx.rotate(on?ang:Math.atan2(vy,Math.abs(vx)+60)*face);
  ctx.scale(face,1);
  ctx.strokeStyle=VR.INK; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(8,6); ctx.lineTo(10,13); ctx.moveTo(-22,5); ctx.lineTo(-23,12); ctx.stroke();
  ctx.fillStyle=VR.INK; VR.circle(10,13,3.6); VR.circle(-23,12,2.6);
  ctx.fillStyle='#2f6fd6'; ctx.beginPath(); ctx.moveTo(-24,-3); ctx.lineTo(-41,-25); ctx.lineTo(-30,-25); ctx.lineTo(-12,-7); ctx.closePath(); ctx.fill();
  ctx.fillStyle=sooty?'#5a4a30':'#ffc21a'; ctx.beginPath(); ctx.ellipse(0,0,38,11,0,0,TAU); ctx.fill();
  if(occupied) headWith(VR,ctx,5,-10,5);
  ctx.globalAlpha=.6; ctx.fillStyle='#bfe9f5'; ctx.beginPath(); ctx.arc(6,-7,10,Math.PI,0); ctx.closePath(); ctx.fill(); ctx.globalAlpha=1;
  ctx.fillStyle='#2f6fd6'; VR.rr(-12,1,30,6,3);
  ctx.fillStyle=VR.INK; ctx.beginPath(); ctx.ellipse(39,0,2.5,3+13*Math.abs(Math.sin(VR.time*31)),0,0,TAU); ctx.fill();
  ctx.restore();
}
/** @param {Port} VR @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} ang @param {any} dir @param {any} occupied @param {any} fast */
export function drawCartWith(VR,ctx,x,y,ang,dir,occupied,fast){
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(1,dir);
  ctx.fillStyle=VR.INK; VR.circle(-10,-4,4); VR.circle(10,-4,4);
  if(occupied){
    if(fast){ ctx.strokeStyle='#2f6fd6'; ctx.lineWidth=3.5; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(-3,-22); ctx.lineTo(-8,-38); ctx.moveTo(3,-22); ctx.lineTo(8,-38); ctx.stroke(); }
    headWith(VR,ctx,0,-27,6);
  }
  ctx.fillStyle='#7b4fd6'; VR.rr(-17,-21,34,15,5);
  ctx.fillStyle='#ffd23f'; VR.rr(-17,-13,34,3,1);
  ctx.restore();
}
/** @param {Port} VR @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} ang @param {any} face @param {any} occ */
export function drawSubWith(VR,ctx,x,y,ang,face,occ){
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(face,1);
  ctx.fillStyle=VR.INK; VR.rr(-31,-31,62,27,13);
  ctx.fillStyle=occ&&P.soot>0?'#5a4a30':'#ffc21a'; VR.rr(-29,-29,58,23,11.5);
  ctx.fillStyle=VR.INK; VR.rr(-9,-42,20,14,4); ctx.fillStyle='#f2a81d'; VR.rr(-7,-40,16,11,3);
  ctx.strokeStyle=VR.INK; ctx.lineWidth=3; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.beginPath(); ctx.moveTo(5,-41); ctx.lineTo(5,-51); ctx.lineTo(11,-51); ctx.stroke();
  ctx.fillStyle=VR.INK; VR.circle(10,-17.5,8.5); ctx.fillStyle='#bfe9f5'; VR.circle(10,-17.5,6.8);
  if(occ) headWith(VR,ctx,10,-17,4.6);
  ctx.fillStyle=VR.INK; VR.circle(-12,-17.5,4.5); ctx.fillStyle='#bfe9f5'; VR.circle(-12,-17.5,3.2);
  ctx.fillStyle=VR.INK; ctx.beginPath(); ctx.ellipse(-33,-17.5,3,3+(occ&&!VR.reduced?8*Math.abs(Math.sin(VR.time*24)):6),0,0,TAU); ctx.fill();
  ctx.fillStyle='#e63946'; ctx.fillRect(-27,-10,54,3);
  ctx.restore();
}
/** @param {Port} VR @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} ang @param {any} occ @param {any} heat */
export function drawBalloonWith(VR,ctx,x,y,ang,occ,heat){
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang);
  ctx.strokeStyle=VR.INK; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(-12,-18); ctx.lineTo(-20,-52); ctx.moveTo(12,-18); ctx.lineTo(20,-52); ctx.moveTo(-4,-18); ctx.lineTo(-7,-50); ctx.moveTo(4,-18); ctx.lineTo(7,-50); ctx.stroke();
  if(heat){ ctx.fillStyle='#ff7a1f'; ctx.beginPath(); ctx.moveTo(-5,-34); ctx.lineTo(0,-50-Math.random()*10); ctx.lineTo(5,-34); ctx.closePath(); ctx.fill(); ctx.fillStyle='#ffe066'; ctx.beginPath(); ctx.moveTo(-2.5,-34); ctx.lineTo(0,-43-Math.random()*5); ctx.lineTo(2.5,-34); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle=VR.INK; VR.rr(-7,-35,14,4,1.5);
  const cols=['#e63946','#ffd23f','#3aa0e8','#ffd23f','#e63946'];
  ctx.save(); ctx.beginPath(); ctx.moveTo(-20,-52); ctx.bezierCurveTo(-52,-78,-50,-138,0,-140); ctx.bezierCurveTo(50,-138,52,-78,20,-52); ctx.closePath();
  ctx.fillStyle=VR.INK; ctx.fill(); ctx.clip();
  for(let i=0;i<5;i++){ ctx.fillStyle=cols[i]; ctx.beginPath(); ctx.ellipse(0,-96,46-i*9.2,46,0,0,TAU); ctx.fill(); }
  ctx.restore();
  ctx.lineWidth=3; ctx.strokeStyle=VR.INK; ctx.beginPath(); ctx.moveTo(-20,-52); ctx.bezierCurveTo(-52,-78,-50,-138,0,-140); ctx.bezierCurveTo(50,-138,52,-78,20,-52); ctx.closePath(); ctx.stroke();
  ctx.fillStyle='#fff8e6'; ctx.globalAlpha=.35; ctx.beginPath(); ctx.ellipse(-22,-108,6,15,-.4,0,TAU); ctx.fill(); ctx.globalAlpha=1;
  ctx.fillStyle=VR.INK; VR.rr(-15,-20,30,20,4); ctx.fillStyle='#a0632f'; VR.rr(-13,-18,26,16,3);
  ctx.strokeStyle='#7a4a22'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(-13,-10); ctx.lineTo(13,-10); ctx.stroke();
  if(occ) headWith(VR,ctx,2,-24,5.5);
  ctx.restore();
}
/** @param {Port} VR @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} ang @param {any} face @param {any} occ @param {any} spin */
export function drawHeliWith(VR,ctx,x,y,ang,face,occ,spin){
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(face,1);
  if(occ&&VR.heliLoad&&parked[VR.heliLoad]){ ctx.strokeStyle=VR.INK; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,-6); ctx.lineTo(0,40); ctx.stroke(); }
  ctx.strokeStyle=VR.INK; ctx.lineWidth=3; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(-20,-2); ctx.lineTo(22,-2); ctx.moveTo(-12,-2); ctx.lineTo(-10,-10); ctx.moveTo(12,-2); ctx.lineTo(10,-10); ctx.stroke();
  ctx.fillStyle=VR.INK; VR.rr(-46,-28,34,6,3); ctx.fillStyle='#3f8f3a'; VR.rr(-45,-27,32,4,2);
  ctx.save(); ctx.translate(-46,-25); ctx.rotate(spin*3); ctx.fillStyle=VR.INK; ctx.fillRect(-1.5,-9,3,18); ctx.restore();
  ctx.fillStyle=VR.INK; ctx.beginPath(); ctx.ellipse(2,-25,24,16,0,0,TAU); ctx.fill();
  ctx.fillStyle=occ&&P.soot>0?'#3d4a30':'#58b548'; ctx.beginPath(); ctx.ellipse(2,-25,22,14,0,0,TAU); ctx.fill();
  ctx.fillStyle='#bfe9f5'; ctx.beginPath(); ctx.moveTo(6,-37); ctx.quadraticCurveTo(22,-36,23,-24); ctx.lineTo(6,-24); ctx.closePath(); ctx.fill();
  if(occ) headWith(VR,ctx,10,-28,5);
  ctx.fillStyle=VR.INK; ctx.fillRect(0,-46,4,8);
  const w=40*Math.abs(Math.cos(spin)); ctx.fillRect(2-w-4,-48,2*w+8,3);
  ctx.restore();
}
/** @param {Port} VR @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} ang @param {any} face @param {any} occ @param {any} wind */
export function drawBoatWith(VR,ctx,x,y,ang,face,occ,wind){
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(face,1);
  ctx.strokeStyle=VR.INK; ctx.lineWidth=3; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(0,-74); ctx.stroke();
  const b=1+.12*wind;
  ctx.fillStyle=VR.INK; ctx.beginPath(); ctx.moveTo(3,-72); ctx.quadraticCurveTo(26*b,-46,30*b,-14); ctx.lineTo(3,-14); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#fff8e6'; ctx.beginPath(); ctx.moveTo(5,-67); ctx.quadraticCurveTo(24*b,-45,27*b,-16); ctx.lineTo(5,-16); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#3aa0e8'; ctx.fillRect(5,-36,22*b,5);
  ctx.fillStyle=VR.INK; ctx.beginPath(); ctx.moveTo(-3,-60); ctx.quadraticCurveTo(-18,-38,-20,-14); ctx.lineTo(-3,-14); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#e63946'; ctx.beginPath(); ctx.moveTo(-5,-55); ctx.quadraticCurveTo(-16,-37,-17.5,-16); ctx.lineTo(-5,-16); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#ffd23f'; ctx.beginPath(); ctx.moveTo(0,-74); ctx.lineTo(-12,-70); ctx.lineTo(0,-66); ctx.closePath(); ctx.fill();
  if(occ) headWith(VR,ctx,-9,-17,5);
  ctx.fillStyle=VR.INK; ctx.beginPath(); ctx.moveTo(-34,-14); ctx.lineTo(36,-14); ctx.lineTo(24,2); ctx.lineTo(-24,2); ctx.closePath(); ctx.fill();
  ctx.fillStyle=occ&&P.soot>0?'#5a4030':'#a0632f'; ctx.beginPath(); ctx.moveTo(-31,-12); ctx.lineTo(33,-12); ctx.lineTo(22.5,0); ctx.lineTo(-22.5,0); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#fff8e6'; ctx.fillRect(-26,-8,50,2.5);
  ctx.restore();
}
/** @param {Port} VR @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} ang @param {any} face @param {any} occ @param {any} run */
export function drawBugWith(VR,ctx,x,y,ang,face,occ,run){
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(face,1);
  ctx.strokeStyle=VR.INK; ctx.lineWidth=2.5; ctx.lineCap='round'; ctx.beginPath();
  for(let i=0;i<3;i++){ const lx=-10+i*10, sw=VR.reduced?0:Math.sin(run+i*2.1)*4; ctx.moveTo(lx,-8); ctx.lineTo(lx-4+sw,-3); ctx.lineTo(lx-2+sw,0); }
  ctx.stroke();
  ctx.fillStyle=VR.INK; ctx.beginPath(); ctx.ellipse(0,-15,19,12,0,Math.PI,0); ctx.lineTo(19,-6); ctx.lineTo(-19,-6); ctx.closePath(); ctx.fill();
  ctx.fillStyle=occ&&P.soot>0?'#5a3438':'#e63946'; ctx.beginPath(); ctx.ellipse(0,-15,17,10,0,Math.PI,0); ctx.lineTo(17,-8); ctx.lineTo(-17,-8); ctx.closePath(); ctx.fill();
  ctx.fillStyle=VR.INK; VR.circle(-8,-16,2.6); VR.circle(4,-20,2.2); VR.circle(-1,-11,2); VR.circle(10,-12,2.2);
  ctx.fillStyle=VR.INK; VR.circle(19,-12,7); ctx.fillStyle='#bfe9f5'; VR.circle(19,-12,5.6);
  if(occ) headWith(VR,ctx,19,-11,3.8);
  ctx.strokeStyle=VR.INK; ctx.lineWidth=1.8; ctx.beginPath(); ctx.moveTo(22,-18); ctx.quadraticCurveTo(26,-26,31,-25); ctx.moveTo(18,-18); ctx.quadraticCurveTo(20,-28,25,-30); ctx.stroke();
  ctx.restore();
}
/** @param {Port} VR @param {CanvasRenderingContext2D} ctx @param {any} x0 @param {any} x1 */
export function drawZipsWith(VR,ctx,x0,x1){
  for(const z of ST.zips){
    if(Math.max(z.a[0],z.b[0])<x0-40||Math.min(z.a[0],z.b[0])>x1+40) continue;
    for(const e of [z.a,z.b]){
      const cx=Math.floor(e[0]/CELL), r0=Math.floor((e[1]-TOP)/CELL);
      if(r0>=0&&r0<GY&&grid[r0*GX+cx]<4){ const r=Math.min(VR.colTop(cx,r0),r0+90); ctx.fillStyle=VR.INK; ctx.fillRect(e[0]-4,e[1]-6,8,TOP+r*CELL-e[1]+8); ctx.fillStyle='#a0632f'; ctx.fillRect(e[0]-2.5,e[1]-5,5,TOP+r*CELL-e[1]+6); }
    }
    ctx.strokeStyle=VR.INK; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(z.a[0],z.a[1]); ctx.lineTo(z.b[0],z.b[1]); ctx.stroke();
    ctx.fillStyle='#ffd23f'; VR.circle(z.a[0],z.a[1],5); ctx.strokeStyle=VR.INK; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(z.a[0],z.a[1],5,0,TAU); ctx.stroke();
  }
  if(P.zip){ ctx.fillStyle=VR.INK; VR.circle(P.x,P.y-46,4.5); ctx.strokeStyle=VR.INK; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(P.x,P.y-46); ctx.lineTo(P.x,P.y-40); ctx.stroke(); }
  VR.pointers.forEach(/** @param {any} p */ function(p){ if(ST.tool==='rope'&&p.rs){ const w=VR.toWorld(p.x,p.y); ctx.strokeStyle='#a0632f'; ctx.lineWidth=4; ctx.setLineDash([10,9]); ctx.beginPath(); ctx.moveTo(p.rs[0],p.rs[1]); ctx.lineTo(w[0],w[1]); ctx.stroke(); ctx.setLineDash([]); } });
}
/** @param {Port} VR @param {CanvasRenderingContext2D} ctx */
export function drawHandToolWith(VR,ctx){
  if(!VR.HANDT[ST.tool]||P.mode!=='walk'||P.zip) return;
  const ks=VR.kidScale(), sw=P.swing||0, dn=keys.d;
  ctx.save(); ctx.translate(P.x+P.face*5*ks,P.y-22*ks); ctx.scale(P.face*ks,ks);
  if(ST.tool==='bow'){
    ctx.rotate(P.aim);
    ctx.strokeStyle=VR.INK; ctx.lineWidth=4.5; ctx.lineCap='round'; ctx.beginPath(); ctx.arc(-2,0,15,-1.25,1.25); ctx.stroke();
    ctx.strokeStyle='#a0632f'; ctx.lineWidth=2.6; ctx.stroke();
    const pull=sw*7; ctx.strokeStyle=VR.INK; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-2+15*Math.cos(1.25),-15*Math.sin(1.25)); ctx.lineTo(-pull+.5,0); ctx.lineTo(-2+15*Math.cos(1.25),15*Math.sin(1.25)); ctx.stroke();
    ctx.restore(); return;
  }
  ctx.rotate((dn?1.3:.2)-sw*1.4);
  ctx.strokeStyle=VR.INK; ctx.lineWidth=4.5; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(22,0); ctx.stroke();
  ctx.strokeStyle='#a0632f'; ctx.lineWidth=2.6; ctx.stroke();
  ctx.fillStyle=VR.INK;
  if(ST.tool==='shovel'){ ctx.beginPath(); ctx.moveTo(20,-6); ctx.lineTo(33,-5); ctx.quadraticCurveTo(38,0,33,5); ctx.lineTo(20,6); ctx.closePath(); ctx.fill(); ctx.fillStyle='#b9c4cf'; ctx.beginPath(); ctx.moveTo(21.5,-4.5); ctx.lineTo(32,-3.5); ctx.quadraticCurveTo(35.5,0,32,3.5); ctx.lineTo(21.5,4.5); ctx.closePath(); ctx.fill(); }
  else{ ctx.beginPath(); ctx.moveTo(21,-14); ctx.quadraticCurveTo(28,-4,21,0); ctx.quadraticCurveTo(28,4,21,14); ctx.lineTo(25,0); ctx.closePath(); ctx.fill(); ctx.lineWidth=5; ctx.strokeStyle=VR.INK; ctx.beginPath(); ctx.moveTo(22,-13); ctx.quadraticCurveTo(29,0,22,13); ctx.stroke(); ctx.lineWidth=2.6; ctx.strokeStyle='#b9c4cf'; ctx.stroke(); }
  ctx.restore();
}
