/* ---------- Winter malen: Schneemänner, Yeti, Drachen, Iglu, Lift mit Gondeln, Skifahrer, Schneeball-Rolle, Figuren am Berg, Schneebälle, Feuerwerk und Schneefall ---------- */
// PR 23a. Bewegt aus legacy.js. Was das Malen vom übrigen Spiel braucht, kommt über den Port WM; gezeichnet wird auf den übergebenen ctx.
// Die Zeichenhelfer circle, rr, emo und head bleiben vorerst in legacy.js und malen auf denselben Kontext.
// drawSnowman (auch für systems/winter.js), drawDragon, drawGondola, drawSkier, drawRoll, drawWinter, drawFront und drawSnowfall ruft legacy.js über Einzeiler.
import { TAU, VOLC, clamp } from '../core/world/const.js';
import { P, hero, cam } from '../state/game.js';
import { msurf } from '../core/world/shape.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} WM @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} s @param {any} nose @param {any} wave @param {any} hat @param {any} sad */
export function drawSnowmanWith(WM,ctx,x,y,s,nose,wave,hat,sad){
  ctx.save(); ctx.translate(x,y); ctx.scale(s,s); ctx.lineCap='round';
  ctx.fillStyle='#9fb4cc'; WM.circle(0,-11,13.4); WM.circle(0,-30,10.4); WM.circle(0,-45,8.4);
  ctx.fillStyle='#fff'; WM.circle(0,-11,12); WM.circle(0,-30,9); WM.circle(0,-45,7);
  ctx.strokeStyle='#7a4a2c'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-8,-32); ctx.lineTo(-19,-37); ctx.moveTo(8,-32); ctx.lineTo(19,-39-7*wave); ctx.stroke();
  ctx.strokeStyle='#e63946'; ctx.lineWidth=3.2; ctx.beginPath(); ctx.moveTo(-6,-38.5); ctx.lineTo(6,-38.5); ctx.moveTo(4,-38); ctx.lineTo(7,-31); ctx.stroke();
  ctx.fillStyle=WM.INK; WM.circle(-2.6,-47,1.2); WM.circle(3,-47,1.2); WM.circle(0,-32,1.3); WM.circle(0,-26,1.3);
  ctx.strokeStyle=WM.INK; ctx.lineWidth=1.1; ctx.beginPath();
  if(sad) ctx.arc(.5,-40.2,2.6,Math.PI*1.15,Math.PI*1.85); else ctx.arc(.5,-43.8,2.8,Math.PI*.15,Math.PI*.85);
  ctx.stroke();
  if(nose){ ctx.fillStyle='#ff8a1f'; ctx.beginPath(); ctx.moveTo(.5,-45.8); ctx.lineTo(11,-44.2); ctx.lineTo(.5,-42.8); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle=hat; ctx.fillRect(-7.5,-53.5,15,2.6); ctx.fillRect(-4.8,-62,9.6,9);
  ctx.restore();
}
/** @param {Port} WM @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} face @param {any} mood @param {any} wob */
export function drawYetiWith(WM,ctx,x,y,face,mood,wob){
  ctx.save(); ctx.translate(x,y); ctx.rotate(wob); ctx.scale(face,1);
  const fur=/** @param {any} col @param {any} g */ function(col,g){
    ctx.fillStyle=col; WM.rr(-22-g,-58-g,44+2*g,58+2*g,18);
    WM.circle(-21,-12,9+g); WM.circle(21,-12,9+g); WM.circle(-25,-34,8.5+g); WM.circle(25,-34,8.5+g); WM.circle(-12,-60,9+g); WM.circle(3,-64,10+g); WM.circle(15,-59,8+g);
  };
  fur('#9fb4cc',2); fur('#f4f8fc',0);
  ctx.fillStyle='#8fb0d6'; WM.rr(-20,-7,16,9,4); WM.rr(4,-7,16,9,4);
  ctx.beginPath(); ctx.ellipse(3,-40,14.5,12.5,0,0,TAU); ctx.fill();
  ctx.fillStyle='#fff'; WM.circle(-3,-43,4.2); WM.circle(9,-43,4.2);
  ctx.fillStyle=WM.INK; WM.circle(-2,-43,2); WM.circle(10,-43,2);
  ctx.strokeStyle=WM.INK; ctx.lineWidth=2; ctx.lineCap='round'; ctx.beginPath();
  if(mood===0){ ctx.moveTo(-8,-50.5); ctx.lineTo(0,-47.5); ctx.moveTo(15,-50.5); ctx.lineTo(7,-47.5); ctx.moveTo(-3,-32); ctx.quadraticCurveTo(4,-36.5,11,-32); }
  else if(mood===1){ ctx.moveTo(-4,-35); ctx.quadraticCurveTo(4,-29,12,-35); }
  ctx.stroke();
  if(mood===2){ ctx.fillStyle=WM.INK; ctx.beginPath(); ctx.ellipse(4,-33,7,5.5,0,0,TAU); ctx.fill(); ctx.fillStyle='#e63946'; ctx.beginPath(); ctx.ellipse(4,-31.5,4.5,2.8,0,0,TAU); ctx.fill(); }
  ctx.restore();
}
/* Drache: warm 0 ist blau gefroren, 1 ist feuerrot. Mit Reiter sitzt der Held auf dem Rücken. */
/** @param {Port} WM @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} s @param {any} face @param {any} warm @param {any} flap @param {any} rider */
export function drawDragonWith(WM,ctx,x,y,s,face,warm,flap,rider){
  const body=WM.mix([86,146,214],[226,69,47],warm), belly=WM.mix([196,226,246],[255,201,92],warm), dark=WM.mix([52,100,170],[160,38,34],warm);
  ctx.save(); ctx.translate(x,y); ctx.scale(face*s,s); ctx.lineJoin='round'; ctx.lineCap='round';
  ctx.strokeStyle=body; ctx.lineWidth=7; ctx.beginPath(); ctx.moveTo(-12,-9); ctx.quadraticCurveTo(-30,-3,-33,-18); ctx.stroke();
  ctx.fillStyle=dark; ctx.beginPath(); ctx.moveTo(-33,-27); ctx.lineTo(-39,-17); ctx.lineTo(-28,-17); ctx.closePath(); ctx.fill();
  const wy=-30-15*flap;
  ctx.beginPath(); ctx.moveTo(-3,-20); ctx.lineTo(-27,wy-6); ctx.lineTo(-19,wy+7); ctx.lineTo(-13,wy+2); ctx.lineTo(-9,wy+10); ctx.lineTo(-4,-12); ctx.closePath(); ctx.fill();
  ctx.fillStyle=body; WM.rr(-11,-7,7,7,3); WM.rr(2,-7,7,7,3);
  ctx.beginPath(); ctx.ellipse(-2,-15,15,11.5,0,0,TAU); ctx.fill();
  ctx.fillStyle=belly; ctx.beginPath(); ctx.ellipse(2,-12,8.5,7.5,0,0,TAU); ctx.fill();
  if(rider){ ctx.save(); ctx.translate(-5,-25); ctx.scale(1/s,1/s); ctx.fillStyle=P.soot>0?'#3a3438':'#2f6fd6'; WM.rr(-6,-16,12,18,5); WM.head(0,-22,7); ctx.restore(); }
  ctx.fillStyle=body; ctx.beginPath(); ctx.ellipse(11,-26,6,10,.55,0,TAU); ctx.fill();
  ctx.fillStyle=dark; ctx.beginPath(); ctx.moveTo(9,-41); ctx.lineTo(7,-50); ctx.lineTo(14,-44); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(15,-44); ctx.lineTo(16,-52); ctx.lineTo(21,-44); ctx.closePath(); ctx.fill();
  ctx.fillStyle=body; WM.circle(16,-36,9.5); WM.rr(18,-38,15,9,4.5);
  ctx.fillStyle='#fff'; WM.circle(18,-38,3.6); ctx.fillStyle=WM.INK; WM.circle(19.2,-38,1.8); WM.circle(30.5,-35.5,1);
  ctx.strokeStyle=WM.INK; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(22,-31.5); ctx.quadraticCurveTo(27,-29.5,32,-31.5); ctx.stroke();
  ctx.restore();
}
/** @param {Port} WM @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y */
export function drawIglooWith(WM,ctx,x,y){
  ctx.fillStyle='#9fb4cc'; ctx.beginPath(); ctx.arc(x,y,37,Math.PI,0); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#f4f8fc'; ctx.beginPath(); ctx.arc(x,y,35,Math.PI,0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#bcd0e4'; ctx.lineWidth=1.5; ctx.beginPath();
  ctx.moveTo(x-33,y-11); ctx.lineTo(x+33,y-11); ctx.moveTo(x-26,y-23); ctx.lineTo(x+26,y-23);
  ctx.moveTo(x-16,y); ctx.lineTo(x-16,y-11); ctx.moveTo(x+18,y); ctx.lineTo(x+18,y-11); ctx.moveTo(x-6,y-11); ctx.lineTo(x-6,y-23); ctx.moveTo(x+10,y-11); ctx.lineTo(x+10,y-23); ctx.moveTo(x+2,y-23); ctx.lineTo(x+2,y-34);
  ctx.stroke();
  ctx.fillStyle='#2b3c52'; ctx.beginPath(); ctx.arc(x-2,y,12,Math.PI,0); ctx.closePath(); ctx.fill();
}
/** @param {Port} WM @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} occ */
export function drawGondolaWith(WM,ctx,x,y,occ){
  ctx.strokeStyle=WM.INK; ctx.lineWidth=2; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,y+14); ctx.stroke();
  ctx.fillStyle=WM.INK; WM.rr(x-16,y+13,32,34,8);
  ctx.fillStyle='#e63946'; WM.rr(x-14,y+15,28,30,6);
  ctx.fillStyle='#bfe9f5'; WM.rr(x-10,y+19,20,13,3);
  if(occ) WM.head(x,y+27,5);
  ctx.fillStyle='#ffd23f'; ctx.fillRect(x-14,y+35,28,3);
}
/** @param {Port} WM @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y */
export function drawStationWith(WM,ctx,x,y){
  ctx.fillStyle='#7a4a2c'; ctx.fillRect(x-27,y-58,5,60); ctx.fillRect(x+22,y-58,5,60);
  ctx.fillStyle='#e63946'; ctx.beginPath(); ctx.moveTo(x-38,y-56); ctx.lineTo(x,y-80); ctx.lineTo(x+38,y-56); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(x-19,y-68); ctx.lineTo(x,y-80); ctx.lineTo(x+19,y-68); ctx.lineTo(x+10,y-66); ctx.lineTo(x+3,y-70); ctx.lineTo(x-6,y-65); ctx.closePath(); ctx.fill();
}
/** @param {Port} WM @param {CanvasRenderingContext2D} ctx */
export function drawLiftWith(WM,ctx){
  ctx.lineCap='round'; ctx.strokeStyle='#5f6b7a'; ctx.lineWidth=4; ctx.beginPath();
  for(let x=5860;x<=6840;x+=195){ const gy=msurf(x); ctx.moveTo(x,gy+6); ctx.lineTo(x,gy-95); ctx.moveTo(x-9,gy-95); ctx.lineTo(x+9,gy-95); }
  ctx.stroke();
  const pts=WM.LIFT.pts;
  ctx.strokeStyle=WM.INK; ctx.lineWidth=1.8; ctx.lineJoin='round'; ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
  for(let i=3;i<pts.length;i+=3) ctx.lineTo(pts[i][0],pts[i][1]);
  ctx.lineTo(pts[pts.length-1][0],pts[pts.length-1][1]); ctx.stroke();
  for(let k=0;k<4;k++){ const q=WM.trackAt(WM.LIFT,((WM.reduced?0:WM.time*70)+k*WM.LIFT.len/4)%WM.LIFT.len); drawGondolaWith(WM,ctx,q.x,q.y,false); }
  drawStationWith(WM,ctx,WM.LIFT0,WM.surfaceY(WM.LIFT0)); drawStationWith(WM,ctx,WM.LIFT1,WM.surfaceY(WM.LIFT1));
}
/** @param {Port} WM @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} ang @param {any} face @param {any} brake @param {any} air */
export function drawSkierWith(WM,ctx,x,y,ang,face,brake,air){
  const sooty=P.soot>0, suit=sooty?'#3a3438':P.frost>0?'#dfeefa':'#2f6fd6', sp=Math.min(9,Math.abs(P.vx)/50);
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(face,1); ctx.lineCap='round'; ctx.lineJoin='round';
  ctx.strokeStyle=WM.INK; ctx.lineWidth=4.8; ctx.beginPath(); ctx.moveTo(-17,-1.5); ctx.lineTo(17,-1.5); ctx.quadraticCurveTo(22,-1.5,23,-6.5); ctx.stroke();
  ctx.strokeStyle=hero.own.goldski?'#ffd23f':'#e63946'; ctx.lineWidth=2.6; ctx.stroke();
  ctx.strokeStyle=WM.INK; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(-2,-3.5); ctx.lineTo(4,-9); ctx.lineTo(-2,-15); ctx.stroke();
  ctx.strokeStyle='#8d99a6'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(7,-21); if(air) ctx.lineTo(-15,-31); else ctx.lineTo(brake?12:-9,-2.5); ctx.stroke();
  ctx.translate(-2,-15); ctx.rotate(brake?.1:.4);
  ctx.strokeStyle='#e63946'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-2,-17); ctx.quadraticCurveTo(-9,-19+(WM.reduced?0:2*Math.sin(WM.time*14)),-11-sp,-16+(WM.reduced?0:3*Math.sin(WM.time*11))); ctx.stroke();
  ctx.fillStyle='#8d99a6'; WM.rr(-10,-15,6,12,2);
  ctx.fillStyle=suit; WM.rr(-6,-17,12,18,5);
  ctx.strokeStyle=suit; ctx.lineWidth=3.5; ctx.beginPath(); ctx.moveTo(0,-12); ctx.lineTo(9,-6); ctx.stroke();
  WM.head(1,-23,7);
  ctx.restore();
}
/** @param {Port} WM @param {CanvasRenderingContext2D} ctx */
export function drawRollWith(WM,ctx){
  const r=15+7*(1-P.ball/1.7);
  ctx.save(); ctx.translate(P.x,P.y-r); ctx.rotate(P.ang); ctx.lineCap='round';
  ctx.strokeStyle=WM.INK; ctx.lineWidth=4.6; ctx.beginPath(); ctx.moveTo(-r-11,5); ctx.lineTo(-r+4,2); ctx.moveTo(r-4,-6); ctx.lineTo(r+12,-10); ctx.stroke();
  ctx.strokeStyle=hero.own.goldski?'#ffd23f':'#e63946'; ctx.lineWidth=2.4; ctx.stroke();
  ctx.fillStyle='#9fb4cc'; WM.circle(0,0,r+1.5); ctx.fillStyle='#fff'; WM.circle(0,0,r);
  ctx.fillStyle='#dbe7f3'; WM.circle(-r*.3,r*.2,r*.22); WM.circle(r*.35,-r*.3,r*.16);
  WM.head(0,-r-3,6);
  ctx.restore();
}
/* Alles vom Winter, das hinter dem Helden steht */
/** @param {Port} WM @param {CanvasRenderingContext2D} ctx @param {any} x0 @param {any} x1 */
export function drawWinterWith(WM,ctx,x0,x1){
  const f=WM.N.fau, m=WM.N.mama;
  if(x1>VOLC-260&&x0<VOLC+260){
    if(m.up>.02){
      ctx.save(); ctx.beginPath(); ctx.rect(VOLC-240,WM.RIMY-430,480,438); ctx.clip();
      drawDragonWith(WM,ctx,VOLC-6,WM.RIMY+52+130*(1-m.up),2.4,P.x<VOLC?-1:1,1,WM.reduced?0:.3*Math.sin(WM.time*2),false);
      ctx.restore();
    }
    drawDragonWith(WM,ctx,f.x,f.y,.8,f.face,1,WM.reduced?0:.4*Math.sin(WM.time*5),false);
  }
  if(x1<WM.LIFT0-90||x0>8500) return;
  drawLiftWith(WM,ctx);
  drawIglooWith(WM,ctx,WM.IGX,WM.surfaceY(WM.IGX));
  const fx=WM.flX();
  drawSnowmanWith(WM,ctx,fx,WM.surfaceY(fx),1.1,true,(!WM.reduced&&Math.abs(P.x-fx)<230)?Math.sin(WM.time*9):0,WM.INK,false);
  const h=WM.N.hare;
  WM.emo('🐇',h.x,h.y-11,22);
  const yt=WM.N.yeti, mood=(yt.laugh>0||yt.roll>0)?2:1;
  const wob=WM.reduced?0:(yt.roll>0?-1.35+.18*Math.sin(WM.time*22):yt.laugh>0?.1*Math.sin(WM.time*38):0);
  drawYetiWith(WM,ctx,yt.x,yt.y-(yt.hop>0?16*Math.sin(yt.hop/.35*Math.PI):0)-(yt.roll>0?18:0),P.x<yt.x?-1:1,mood,wob);
  WM.N.pen.forEach(/** @param {any} p */ function(p){
    ctx.save(); ctx.translate(p.x,p.y-11); ctx.rotate(p.rot); WM.emo('🐧',0,0,20); ctx.restore();
  });
}
/* Alles vom Winter, das vor dem Helden fliegt */
/** @param {Port} WM @param {CanvasRenderingContext2D} ctx */
export function drawFrontWith(WM,ctx){
  if(WM.balls.length){
    ctx.fillStyle='#9fb4cc'; for(const b of WM.balls) WM.circle(b.x,b.y,5.2);
    ctx.fillStyle='#fff'; for(const b of WM.balls) WM.circle(b.x,b.y,4.2);
  }
  for(const f of WM.fws){ ctx.fillStyle=WM.CONF[f.c]; WM.rr(f.x-2,f.y-8,4,11,2); ctx.fillStyle='#ffd23f'; WM.circle(f.x,f.y+5,2.6); }
}
/** @param {Port} WM @param {CanvasRenderingContext2D} ctx */
export function drawSnowfallWith(WM,ctx){
  const amt=clamp((cam.x-5250)/500,0,1)*clamp((9100-cam.x)/500,0,1)*clamp((cam.y+1700)/400,0,1)*clamp((500-cam.y)/300,0,1);
  if(amt<.02) return;
  ctx.save(); ctx.setTransform(WM.DPR,0,0,WM.DPR,0,0); ctx.fillStyle='#fff';
  const t=WM.reduced?0:WM.time;
  for(const f of WM.FLK){
    const x=((f[0]*WM.W+Math.sin(t*.8+f[4])*18-cam.x*WM.S*.2*f[2])%WM.W+WM.W)%WM.W, y=((f[1]*WM.H+t*f[3]*f[2]-cam.y*WM.S*.4)%WM.H+WM.H)%WM.H;
    ctx.globalAlpha=amt*(.45+.25*f[2]); WM.circle(x,y,f[2]*WM.S*.9+.4);
  }
  ctx.restore(); ctx.globalAlpha=1;
}
