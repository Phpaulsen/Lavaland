/* ---------- Kulisse und Zeichenhelfer: Rundrechteck, Kreis, Farbmischung, Emoji, Pfeil, Knopf, Bäume, Wolken, Weltraum, Hügel, Dunkelheit, ferner Weltraum, Nebel, Funde, Requisiten, Wissenstüren und Fernrohr ---------- */
// PR 29b. Bewegt aus legacy.js. Was das Malen vom übrigen Spiel braucht, kommt über den Port SC; gezeichnet wird auf den übergebenen ctx.
// legacy.js ruft alle Funktionen über Einzeiler (andere Ports reichen circle, rr, emo, mix, lerpC weiter). Paletten und drawCells bleiben für einen eigenen Schritt.
import { TAU, MOON, clamp } from '../core/world/const.js';
import { cam, P, hero } from '../state/game.js';
import { ST } from '../state/facade.js';
import { LIFTX } from '../core/world/shape.js';
import { realm } from '../state/realm.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} SC @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} w @param {any} h @param {any} r */
export function rrWith(SC,ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();ctx.fill();}
/** @param {Port} SC @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} r */
export function circleWith(SC,ctx,x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();}
/** @param {Port} SC @param {any} a @param {any} b @param {any} t */
export function mixWith(SC,a,b,t){return 'rgb('+((a[0]+(b[0]-a[0])*t)|0)+','+((a[1]+(b[1]-a[1])*t)|0)+','+((a[2]+(b[2]-a[2])*t)|0)+')';}
/** @param {Port} SC @param {any} a @param {any} b @param {any} t */
export function lerpCWith(SC,a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
/** @param {Port} SC @param {CanvasRenderingContext2D} ctx @param {any} e @param {any} x @param {any} y @param {any} sz */
export function emoWith(SC,ctx,e,x,y,sz){ ctx.font=sz+'px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#000'; ctx.fillText(e,x,y); }
/** @param {Port} SC @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} ang @param {any} r @param {any} col */
export function arrowWith(SC,ctx,x,y,ang,r,col){
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang);
  ctx.beginPath(); ctx.moveTo(r,0); ctx.lineTo(-r*.7,-r*.85); ctx.lineTo(-r*.3,0); ctx.lineTo(-r*.7,r*.85); ctx.closePath();
  ctx.fillStyle=col||'#ffd23f'; ctx.fill(); ctx.strokeStyle=SC.INK; ctx.lineWidth=r*.2; ctx.lineJoin='round'; ctx.stroke();
  ctx.restore();
}
/** @param {Port} SC @param {CanvasRenderingContext2D} ctx @param {any} x @param {any} y @param {any} r */
export function knobWith(SC,ctx,x,y,r){
  ctx.fillStyle='#ffd23f'; circleWith(SC,ctx,x,y,r);
  ctx.strokeStyle=SC.INK; ctx.lineWidth=2.5; ctx.lineCap='round'; ctx.beginPath(); ctx.arc(x,y,r,0,TAU);
  ctx.moveTo(x-r*.5,y); ctx.lineTo(x+r*.5,y); ctx.moveTo(x,y-r*.5); ctx.lineTo(x,y+r*.5); ctx.stroke();
}
/** @param {Port} SC @param {CanvasRenderingContext2D} ctx @param {any} tr */
export function drawTreeWith(SC,ctx,tr){
  const x=tr.x+(tr.sh>SC.time&&!SC.reduced?2*Math.sin(SC.time*40):0), y=tr.gy, h=tr.h, s=tr.s;
  if(tr.state===3) return;
  if(tr.state===2){
    ctx.strokeStyle='#2b2528'; ctx.lineCap='round'; ctx.lineWidth=6*s;
    ctx.beginPath(); ctx.moveTo(x,y+4); ctx.lineTo(x,y-h*.75); ctx.stroke();
    ctx.lineWidth=3*s; ctx.beginPath(); ctx.moveTo(x,y-h*.5); ctx.lineTo(x-14*s,y-h*.8); ctx.moveTo(x,y-h*.6); ctx.lineTo(x+12*s,y-h*.9); ctx.stroke();
    return;
  }
  if(tr.kind){ SC.drawFlora(tr,x,y,h,s); return; }
  if(tr.fir){
    const w=0, on=tr.state===1;
    ctx.fillStyle='#7a4a2c'; ctx.fillRect(x-3*s,y-h*.3,6*s,h*.3+6);
    for(let k=0;k<3;k++){
      const by=y-h*(.22+k*.26), hw=(22-k*5)*s, th=h*.36;
      ctx.fillStyle=on?'#7a5a24':(k%2?'#2f8f4a':'#27804a'); ctx.beginPath(); ctx.moveTo(x-hw+w,by); ctx.lineTo(x+w,by-th); ctx.lineTo(x+hw+w,by); ctx.closePath(); ctx.fill();
      if(!on){ ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(x+w,by-th); ctx.lineTo(x-hw*.5+w,by-th*.5); ctx.lineTo(x-hw*.2+w,by-th*.38); ctx.lineTo(x+w,by-th*.52); ctx.lineTo(x+hw*.25+w,by-th*.36); ctx.lineTo(x+hw*.5+w,by-th*.5); ctx.closePath(); ctx.fill(); }
    }
    return;
  }
  ctx.fillStyle='#7a4a2c'; ctx.fillRect(x-4*s,y-h*.7,8*s,h*.7+6);
  ctx.fillStyle=tr.state===1?'#7a5a24':'#2f8f4a';
  circleWith(SC,ctx,x-15*s,y-h+10,17*s); circleWith(SC,ctx,x+15*s,y-h+10,17*s);
  ctx.fillStyle=tr.state===1?'#96702a':'#3fa85a';
  circleWith(SC,ctx,x,y-h-6,22*s);
}
/** @param {Port} SC @param {CanvasRenderingContext2D} ctx @param {any} c */
export function drawCloudWith(SC,ctx,c){
  const s=c.s;
  ctx.fillStyle='rgba(255,255,255,.88)';
  circleWith(SC,ctx,c.x-22*s,c.y+4*s,16*s); circleWith(SC,ctx,c.x-3*s,c.y-7*s,22*s); circleWith(SC,ctx,c.x+20*s,c.y+2*s,17*s);
  rrWith(SC,ctx,c.x-36*s,c.y+4*s,72*s,15*s,7*s);
}
/** @param {Port} SC @param {CanvasRenderingContext2D} ctx */
export function drawSpaceWith(SC,ctx){
  const R=SC.rlm();
  if(R){
    /* Über einer fremden Welt: die Linie, hinter der es heim zur Erde geht */
    const vw=SC.W/SC.S, ly=R.exit+20;
    if(Math.abs(ly-cam.y)<SC.H/SC.S/2+60){ ctx.strokeStyle='rgba(120,200,255,.6)'; ctx.lineWidth=3; ctx.setLineDash([14,12]); ctx.beginPath(); ctx.moveTo(cam.x-vw/2-20,ly); ctx.lineTo(cam.x+vw/2+20,ly); ctx.stroke(); ctx.setLineDash([]); emoWith(SC,ctx,'🌍',cam.x,ly-24,24); }
    return;
  }
  for(const o of SC.ORBS) if(o.i&&Math.abs(o.x-cam.x)<1700) SC.drawOrb(o);
  drawFarWith(SC,ctx);
  ctx.strokeStyle='#f0d9a0'; ctx.lineWidth=9; ctx.lineCap='butt';
  ctx.beginPath(); ctx.ellipse(1500,-3700,140,34,-.3,Math.PI,TAU); ctx.stroke();
  ctx.fillStyle='#e2a94e'; circleWith(SC,ctx,1500,-3700,78);
  ctx.fillStyle='#cf9440'; ctx.beginPath(); ctx.ellipse(1500,-3690,74,14,-.3,0,TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(1500,-3700,140,34,-.3,0,Math.PI); ctx.stroke();
  ctx.fillStyle='#d9623f'; circleWith(SC,ctx,5800,-4900,62);
  ctx.fillStyle='#b84a2e'; circleWith(SC,ctx,5780,-4915,16); circleWith(SC,ctx,5822,-4880,10);
  ctx.fillStyle='#cfd3dc'; circleWith(SC,ctx,MOON.x,MOON.y,MOON.r);
  ctx.fillStyle='#b3b8c4'; for(const c of SC.MOONC) circleWith(SC,ctx,MOON.x+c[0],MOON.y+c[1],c[2]);
}
/** @param {Port} SC @param {CanvasRenderingContext2D} ctx @param {any} f @param {any} off @param {any} amp @param {any} col @param {any} k */
export function hillsWith(SC,ctx,f,off,amp,col,k){
  ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(0,SC.H+2);
  for(let sx=0;sx<=SC.W+24;sx+=24){
    const wx=cam.x*f+sx/SC.S;
    ctx.lineTo(sx,SC.H/2+(-cam.y*f+off+amp*Math.sin(wx*k)+amp*.5*Math.sin(wx*k*2.3+1))*SC.S);
  }
  ctx.lineTo(SC.W+24,SC.H+2); ctx.closePath(); ctx.fill();
}
/** @param {Port} SC @param {CanvasRenderingContext2D} ctx */
export function drawDarkWith(SC,ctx){
  SC.dkA+=(SC.darkAt(cam.y)-SC.dkA)*.08;
  if(SC.dkA<.02) return;
  const q=4, w=Math.ceil(SC.W/q), h=Math.ceil(SC.H/q);
  if(SC.dkc.width!==w||SC.dkc.height!==h){ SC.dkc.width=w; SC.dkc.height=h; }
  SC.dkx.globalCompositeOperation='source-over'; SC.dkx.clearRect(0,0,w,h);
  SC.dkx.fillStyle='rgba(6,8,22,'+SC.dkA.toFixed(3)+')'; SC.dkx.fillRect(0,0,w,h);
  SC.dkx.globalCompositeOperation='destination-out';
  const hole=/** @param {any} wx @param {any} wy @param {any} r @param {any} k */ function(wx,wy,r,k){
    const sx=((wx-cam.x)*SC.S+SC.W/2)/q, sy=((wy-cam.y)*SC.S+SC.H/2)/q, rd=r*SC.S/q;
    if(sx<-rd||sx>w+rd||sy<-rd||sy>h+rd) return;
    const g=SC.dkx.createRadialGradient(sx,sy,rd*.3,sx,sy,rd);
    g.addColorStop(0,'rgba(0,0,0,'+k+')'); g.addColorStop(1,'rgba(0,0,0,0)');
    SC.dkx.fillStyle=g; SC.dkx.fillRect(sx-rd,sy-rd,2*rd,2*rd);
  };
  hole(P.x,P.y-20,[135,195,275,400][hero.lp|0]+SC.JAR.length*32,1);
  const vw=SC.W/SC.S+200, vh=SC.H/SC.S+200;
  for(const m of SC.MATS) if(!ST.matGot[m.id]&&SC.MATON[m.k]&&Math.abs(m.x-cam.x)<vw&&Math.abs(m.y-cam.y)<vh) hole(m.x,m.y,46,.75);
  for(const m of SC.MACH) if(m.y===m.y&&Math.abs(m.x-cam.x)<vw&&Math.abs(m.y-cam.y)<vh) hole(m.x,m.y-30,90,.9);
  for(const v of SC.VAULTS) if(Math.abs(v.x-cam.x)<vw&&Math.abs(v.y-cam.y)<vh) hole(v.x-v.rx-8,v.fy-28,70,.85);
  for(const m of SC.marks()) if(Math.abs(m[0]-cam.x)<vw&&Math.abs(m[1]-cam.y)<vh) hole(m[0],m[1]-14,150,.9);
  for(const p of ST.PADS) if(p.y>900&&Math.abs(p.x-cam.x)<vw&&Math.abs(p.y-cam.y)<vh) hole(p.x,p.y,80,.8);
  for(const d of SC.ZDEC) if(d.k==='cry'&&Math.abs(d.x-cam.x)<vw&&Math.abs(d.y-cam.y)<vh) hole(d.x,d.y-20,100,.8);
  if(Math.abs(LIFTX-cam.x)<vw) for(let k=1;k<SC.ZN.length;k++) if(Math.abs(SC.ZN[k].y-cam.y)<vh) hole(LIFTX,SC.ZN[k].y-30,150,.95);
  ctx.save(); ctx.setTransform(SC.DPR,0,0,SC.DPR,0,0); ctx.imageSmoothingEnabled=true;
  ctx.drawImage(SC.dkc,0,0,w,h,0,0,SC.W,SC.H);
  ctx.restore();
}
/* Der ferne Weltraum: Felsbrocken, Station, Planeten, Sternentor und die Grenze, bis zu der die Rakete kommt. */
/** @param {Port} SC @param {CanvasRenderingContext2D} ctx */
export function drawFarWith(SC,ctx){
  const vw=SC.W/SC.S, vh=SC.H/SC.S;
  for(const o of SC.ORBS){
    if(!o.z||Math.abs(o.x-cam.x)>vw/2+o.r+180||Math.abs(o.y-cam.y)>vh/2+o.r+180) continue;
    const x=o.x, y=o.y, r=o.r;
    if(o.z==='ast'){
      ctx.fillStyle='#8d8378'; circleWith(SC,ctx,x,y,r);
      ctx.fillStyle='#6f665e'; circleWith(SC,ctx,x-r*.3,y-r*.2,r*.24); circleWith(SC,ctx,x+r*.36,y+r*.16,r*.18); circleWith(SC,ctx,x+((o.s%7)-3)*r*.08,y+r*.5,r*.14);
      ctx.fillStyle='rgba(255,255,255,.14)'; ctx.beginPath(); ctx.arc(x,y,r,-2.7,-.5); ctx.closePath(); ctx.fill();
    }else if(o.z==='stn'){
      ctx.fillStyle=SC.INK; ctx.fillRect(x-r-78,y-3,r*2+156,6);
      for(const sx of [x-r-74,x+r+10]){ ctx.fillStyle=SC.INK; ctx.fillRect(sx-3,y-27,70,54); ctx.fillStyle='#3aa0e8'; ctx.fillRect(sx,y-24,64,48); ctx.strokeStyle='#9bd8ff'; ctx.lineWidth=1.5; ctx.beginPath(); for(let i=1;i<4;i++){ ctx.moveTo(sx+i*16,y-24); ctx.lineTo(sx+i*16,y+24); } ctx.moveTo(sx,y); ctx.lineTo(sx+64,y); ctx.stroke(); }
      ctx.fillStyle='#cfd3dc'; circleWith(SC,ctx,x,y,r);
      ctx.fillStyle='#aab3c2'; ctx.beginPath(); ctx.ellipse(x,y+12,r*.97,r*.3,0,0,TAU); ctx.fill();
      for(let i=-1;i<=1;i++){ ctx.fillStyle=SC.INK; circleWith(SC,ctx,x+i*38,y-18,12); ctx.fillStyle='#bfe9f5'; circleWith(SC,ctx,x+i*38,y-18,9); }
    }else if(o.z==='ice'){
      ctx.strokeStyle='rgba(255,255,255,.45)'; ctx.lineWidth=12; ctx.beginPath(); ctx.ellipse(x,y+r*.25,r*1.36,r*.24,-.12,Math.PI,TAU); ctx.stroke();
      ctx.fillStyle='#bfe6f7'; circleWith(SC,ctx,x,y,r);
      ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(x,y,r,-2.5,-.64); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#9fd0ea'; circleWith(SC,ctx,x-r*.4,y+r*.1,r*.16); circleWith(SC,ctx,x+r*.3,y+r*.4,r*.22); circleWith(SC,ctx,x+r*.5,y-r*.1,r*.1);
      ctx.strokeStyle='rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(x,y+r*.25,r*1.36,r*.24,-.12,0,Math.PI); ctx.stroke();
    }else if(o.z==='jun'){
      ctx.fillStyle='#4fb36a'; circleWith(SC,ctx,x,y,r);
      ctx.fillStyle='#8a5fd6'; circleWith(SC,ctx,x-r*.35,y-r*.25,r*.2); circleWith(SC,ctx,x+r*.3,y+r*.05,r*.26); circleWith(SC,ctx,x-r*.1,y+r*.5,r*.16);
      ctx.fillStyle='#ffd23f'; circleWith(SC,ctx,x+r*.45,y-r*.45,r*.1); circleWith(SC,ctx,x-r*.55,y+r*.2,r*.08);
    }else{
      ctx.fillStyle='#ffd98a'; circleWith(SC,ctx,x,y,r);
      ctx.fillStyle='#ffb86b'; ctx.beginPath(); ctx.ellipse(x,y+r*.1,r*.96,r*.2,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(x,y+r*.55,r*.8,r*.12,0,0,TAU); ctx.fill();
      const ty=y-r+4; ctx.lineWidth=8; ctx.lineCap='butt';
      for(let k=0;k<6;k++){ ctx.strokeStyle=SC.RBC[(k+(SC.reduced?0:Math.floor(SC.time*5)))%6]; ctx.beginPath(); ctx.arc(x,ty,84-k*8,Math.PI,TAU); ctx.stroke(); }
      emoWith(SC,ctx,'🌟',x,ty-22+(SC.reduced?0:3*Math.sin(SC.time*3)),34);
    }
  }
  if(hero.rk<3){
    const ly=SC.skyLim()-30;
    if(Math.abs(ly-cam.y)<vh/2+60){
      ctx.strokeStyle='rgba(255,248,230,.55)'; ctx.lineWidth=3; ctx.setLineDash([14,12]); ctx.beginPath(); ctx.moveTo(cam.x-vw/2-20,ly); ctx.lineTo(cam.x+vw/2+20,ly); ctx.stroke(); ctx.setLineDash([]);
      emoWith(SC,ctx,'🔒',cam.x-17,ly-22,20); emoWith(SC,ctx,'🚀',cam.x+12,ly-22,20);
    }
  }
}
/** @param {Port} SC @param {CanvasRenderingContext2D} ctx */
export function drawNebulaWith(SC,ctx){
  const a=clamp((-cam.y-5200)/1500,0,1);
  const band=cam.y>-12000?0:cam.y>-22000?1:2, cols=[['255,150,80','170,120,100'],['80,200,220','150,90,230'],['255,120,200','255,210,90']][band];
  for(let i=0;i<3;i++){
    const x=(((i*.37+.2)*SC.W-cam.x*.02)%SC.W+SC.W)%SC.W, y=(((i*.29+.3)*SC.H-cam.y*.02)%SC.H+SC.H)%SC.H, r=(150+i*70)*SC.S;
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,'rgba('+cols[i%2]+','+(.2*a).toFixed(3)+')'); g.addColorStop(1,'rgba('+cols[i%2]+',0)');
    ctx.fillStyle=g; ctx.fillRect(x-r,y-r,2*r,2*r);
  }
}
/** @param {Port} SC @param {CanvasRenderingContext2D} ctx @param {any} front @param {any} x0 @param {any} x1 @param {any} y0 @param {any} y1 */
export function drawFindsWith(SC,ctx,front,x0,x1,y0,y1){
  ctx.textAlign='center'; ctx.textBaseline='middle';
  for(const h of ST.hidden){
    if(h.got||h.x<x0-40||h.x>x1+40) continue;
    const behind=h.zone==='sky'||(h.tree>=0&&SC.trees[h.tree].state===0), vis=h.y>y0-40&&h.y<y1+40;
    if(!front){ if(behind&&vis){ ctx.font='26px serif'; ctx.fillStyle='#000'; ctx.fillText(h.e,h.x,h.y); } continue; }
    if(behind) continue;
    if(SC.findOpen(h)){
      if(!vis) continue;
      const bob=SC.reduced?0:3*Math.sin(SC.time*3+h.x);
      ctx.fillStyle='rgba(255,236,150,.4)'; circleWith(SC,ctx,h.x,h.y+bob,18+2*Math.sin(SC.time*5));
      ctx.font='26px serif'; ctx.fillStyle='#000'; ctx.fillText(h.e,h.x,h.y+bob+1);
    }else if(h.hint){
      const sy=SC.surfaceY(h.x)-12, a=Math.max(0,Math.sin(SC.time*2.2+h.x));
      if(sy>y0&&sy<y1&&a>0){ ctx.globalAlpha=a; ctx.fillStyle='#fff8e6'; SC.star4(h.x,sy,8); ctx.globalAlpha=1; }
    }
  }
}
/** @param {Port} SC @param {CanvasRenderingContext2D} ctx @param {any} o */
export function drawPropWith(SC,ctx,o){ if(o.type==='man') SC.drawMan(o); }
/** @param {Port} SC @param {CanvasRenderingContext2D} ctx @param {any} v */
export function drawDoorWith(SC,ctx,v){
  const x=v.x-v.rx-8, y=v.fy, g=SC.reduced?.6:.6+.4*Math.sin(SC.time*3);
  ctx.fillStyle='rgba(255,210,63,'+(.25*g).toFixed(3)+')'; rrWith(SC,ctx,x-22,y-58,44,60,10);
  ctx.fillStyle='#6b4a2e'; rrWith(SC,ctx,x-15,y-50,30,50,8);
  ctx.fillStyle='#8a6240'; rrWith(SC,ctx,x-11,y-46,22,44,6);
  const pt=SC.doorPz(v); emoWith(SC,ctx,pt?SC.PZI[pt].e:'❓',x,y-28,18);
}
/** @param {Port} SC @param {CanvasRenderingContext2D} ctx @param {any} x0 @param {any} x1 */
export function drawScopeWith(SC,ctx,x0,x1){
  if(realm||SC.SCOPEX<x0-80||SC.SCOPEX>x1+80) return;
  const x=SC.SCOPEX, gy=SC.ground(x);
  ctx.strokeStyle=SC.INK; ctx.lineWidth=4; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(x,gy-34); ctx.lineTo(x-14,gy); ctx.moveTo(x,gy-34); ctx.lineTo(x+14,gy); ctx.moveTo(x,gy-34); ctx.lineTo(x,gy); ctx.stroke();
  ctx.save(); ctx.translate(x,gy-38); ctx.rotate(-.7);
  ctx.fillStyle=SC.INK; ctx.fillRect(-20,-8,46,16); ctx.fillStyle='#3a4a8a'; ctx.fillRect(-18,-6,42,12); ctx.fillStyle='#ffd23f'; ctx.fillRect(16,-6,4,12); ctx.fillStyle='#9fd3ff'; ctx.fillRect(24,-5,2,10);
  ctx.restore();
}
