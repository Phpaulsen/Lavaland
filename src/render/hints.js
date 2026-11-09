/* ---------- Hinweise malen: Funkelstern und Pfeil zu einem Ziel (im Bild darüber, sonst am Bildrand) ---------- */
// PR 29g1. Bewegt aus legacy.js. Bildgröße, Zeit und Zeichenhelfer kommen über den Port HI, ctx als Parameter.
// app/wire.js ruft beide Funktionen über Einzeiler.
import { cam } from '../state/game.js';
import { clamp, TAU } from '../core/world/const.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} HI @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} r */
export function star4With(HI,ctx,x,y,r){ ctx.beginPath(); ctx.moveTo(x,y-r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.quadraticCurveTo(x,y,x,y+r); ctx.quadraticCurveTo(x,y,x-r,y); ctx.quadraticCurveTo(x,y,x,y-r); ctx.fill(); }
/* Pfeil zu einem Ziel: im Bild direkt darüber, sonst am Bildrand. */
/** @param {Port} HI @param {CanvasRenderingContext2D} ctx @param {any} mx @param {any} my @param {any} col */
export function pointToWith(HI,ctx,mx,my,col){
  const sx=(mx-cam.x)*HI.S+HI.W/2, sy=(my-cam.y)*HI.S+HI.H/2, topS=Math.min(HI.H*.4,215), botS=HI.H-Math.min(HI.H*.3,170);
  if(sx>24&&sx<HI.W-24&&sy>topS-40&&sy<botS){ HI.arrow(mx,my-16+(HI.reduced?0:5*Math.sin(HI.time*6)),Math.PI/2,13,col); return; }
  ctx.save(); ctx.setTransform(HI.DPR,0,0,HI.DPR,0,0);
  const ex=clamp(sx,34,HI.W-34), ey=clamp(sy,topS,botS);
  ctx.fillStyle='rgba(255,248,230,.92)'; HI.circle(ex,ey,24); ctx.strokeStyle=HI.INK; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(ex,ey,24,0,TAU); ctx.stroke();
  HI.arrow(ex,ey,Math.atan2(sy-ey,sx-ex),13,col);
  ctx.restore();
}
