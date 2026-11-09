/* ---------- Zeichnen: Ein Bild der Welt, von hinten nach vorn: Himmel, Hügel, Welt, Systeme, Fahrzeuge, Held, Flüssigkeiten, Teilchen, Stimmung, Zeiger ---------- */
// PR 23b. draw und fillCells samt Puffern für Lava, Wasser und Feuer bewegt aus legacy.js, unverändert. Was draw vom übrigen Spiel braucht, kommt über den Port DR.
// drawLayer kommt über den Port, weil render nicht aus systems importieren darf.
// PR 23c: draw nach Ebenen zerlegt. drawWith ruft die Ebenen in der alten Reihenfolge; Zufall (Wackeln, Lavafunken) bleibt in derselben Reihenfolge.
// app/wire.js ruft draw über einen Einzeiler.
import { BT } from '../core/world/shape.js';
import { bio, grid } from '../state/world.js';
import { clamp, CELL, GX, TOP, GY, LAVA, WATER, MAX_LAVA, MAX_WATER, MAX_FIRE } from '../core/world/const.js';
import { cam, P, parked, keys, hero } from '../state/game.js';
import { ST } from '../state/facade.js';
import { bx1, bx0, by0, by1, rx1, rx0 } from '../state/sim.js';

/** @typedef {Record<string, any>} Port */
const LB=2*(MAX_LAVA+2000);
const WB=2*(MAX_WATER+2000);
const bufA=new Int16Array(LB);
const bufB=new Int16Array(LB);
const bufC=new Int16Array(LB);
const bufW=new Int16Array(WB);
const bufV=new Int16Array(WB);
const bufF=new Int16Array(2*(MAX_FIRE+800));
/** @param {Port} DR @param {CanvasRenderingContext2D} ctx */
export function drawWith(DR,ctx){
  const vw=DR.W/DR.S, vh=DR.H/DR.S;
  drawSkyWith(DR,ctx);

  const shx=(DR.shake>0&&!DR.reduced)?(Math.random()-.5)*DR.shake*16:0, shy=(DR.shake>0&&!DR.reduced)?(Math.random()-.5)*DR.shake*16:0;
  ctx.setTransform(DR.DPR*DR.S,0,0,DR.DPR*DR.S,(DR.W/2-cam.x*DR.S+shx)*DR.DPR,(DR.H/2-cam.y*DR.S+shy)*DR.DPR);
  const x0=cam.x-vw/2-20, x1=cam.x+vw/2+20, y0=cam.y-vh/2-20, y1=cam.y+vh/2+20;

  drawBackWith(DR,ctx,x0,x1,y0,y1);
  drawTracksWith(DR,ctx,x0,x1);
  DR.drawZips(x0,x1);
  DR.drawLayer(ctx,'back',x0,x1);
  DR.drawScope(x0,x1);
  DR.drawLayer(ctx,'mid',x0,x1);
  DR.drawLayer(ctx,'mob',x0,x1);
  drawEditWith(DR,ctx);

  drawParkedWith(DR);
  drawHeroWith(DR,ctx);
  drawBombsWith(DR,ctx);
  DR.drawFront();
  DR.drawWorldFront();

  DR.drawDark();
  DR.drawLayer(ctx,'glow',x0,x1);
  drawLiquidsWith(DR,ctx,x0,x1,y0,y1);

  drawPartsWith(DR,ctx,x0,x1,y0,y1);
  DR.drawSnowfall();
  DR.drawMood();

  drawPointersWith(DR);
}
/** Himmel: Verlauf, Sterne, Nebel, Sonne oder Mond, Erde, Hügel, Regenbogen. Bildschirmkoordinaten. @param {Port} DR @param {CanvasRenderingContext2D} ctx */
function drawSkyWith(DR,ctx){
  ctx.setTransform(DR.DPR,0,0,DR.DPR,0,0);
  const md=DR.mood(), spc=DR.realm&&BT[bio[clamp(Math.floor(cam.x/CELL),0,GX-1)]].space, nl=md.nl, alt=spc?0:clamp(-cam.y/1100,0,1), sp=clamp((-cam.y-1500)/1400,0,1), sa=spc?1:Math.max(sp,nl*.9);
  const sky=ctx.createLinearGradient(0,0,0,DR.H);
  sky.addColorStop(0,DR.mix(DR.lerpC(DR.lerpC(md.st,DR.SKY_TH,alt),DR.NIGHT_T,nl),DR.SPACE_T,sp)); sky.addColorStop(1,DR.mix(DR.lerpC(DR.lerpC(md.sb,DR.SKY_BH,alt),DR.NIGHT_B,nl),DR.SPACE_B,sp));
  ctx.fillStyle=sky; ctx.fillRect(0,0,DR.W,DR.H);
  if(sa>0){
    ctx.fillStyle='#ffffff';
    for(const st of DR.starsBg){
      const sx=((st[0]*DR.W-cam.x*.04)%DR.W+DR.W)%DR.W, sy=((st[1]*DR.H-cam.y*.04)%DR.H+DR.H)%DR.H;
      ctx.globalAlpha=sa*(.45+.55*Math.abs(Math.sin(DR.time*st[3]+st[0]*40)));
      ctx.fillRect(sx,sy,st[2],st[2]);
    }
    ctx.globalAlpha=1;
  }
  if(cam.y<-5200) DR.drawNebula();
  /* Tagsüber scheint die Sonne, nachts der Mond. Ein Tipp auf die Sonne schaltet um. */
  const sunX=DR.W-74, sunY=DR.H*.34-cam.y*DR.S*.03;
  if(nl<.98){ ctx.globalAlpha=1-nl; ctx.fillStyle='rgba(255,210,63,.28)'; DR.circle(sunX,sunY,46*DR.S); ctx.fillStyle='#ffd23f'; DR.circle(sunX,sunY,30*DR.S); }
  if(nl>.02){ ctx.globalAlpha=nl; ctx.fillStyle='rgba(244,240,216,.22)'; DR.circle(sunX,sunY,40*DR.S); ctx.fillStyle='#f4f0d8'; DR.circle(sunX,sunY,26*DR.S); ctx.fillStyle='#d8d2b4'; DR.circle(sunX-8*DR.S,sunY-6*DR.S,6*DR.S); DR.circle(sunX+9*DR.S,sunY+7*DR.S,4*DR.S); }
  ctx.globalAlpha=1;
  /* Von fremden Welten aus sieht man die Erde am Himmel. */
  if(DR.realm){ const ex=DR.W*.3, ey=DR.H*.32-cam.y*DR.S*.02, er=34*DR.S; ctx.fillStyle='rgba(120,190,255,.25)'; DR.circle(ex,ey,er*1.25); ctx.fillStyle='#3aa0e8'; DR.circle(ex,ey,er); ctx.fillStyle='#58b548'; DR.circle(ex-er*.35,ey-er*.2,er*.35); DR.circle(ex+er*.3,ey+er*.3,er*.28); ctx.fillStyle='rgba(255,255,255,.8)'; DR.circle(ex+er*.1,ey-er*.6,er*.18); }
  DR.hills(.22,-30,45,md.h1,.004);
  if(DR.skyRb>DR.time&&nl<.5){ ctx.globalAlpha=Math.min(.75,(DR.skyRb-DR.time)*.4)*(1-nl); ctx.lineWidth=7*DR.S; for(let k=0;k<6;k++){ ctx.strokeStyle=DR.RBC[k]; ctx.beginPath(); ctx.arc(DR.W*.5,DR.H*.66,DR.W*.46-k*7*DR.S,Math.PI,0); ctx.stroke(); } ctx.globalAlpha=1; }
  DR.hills(.48,-2,30,md.h2,.007);
}
/** Welt hinter den Bahnen: Funde, Wolken, Weltraum, Bäume, Zellen, Dinge, Winter, große Welt, Tiefe. @param {Port} DR @param {CanvasRenderingContext2D} ctx @param {number} x0 @param {number} x1 @param {number} y0 @param {number} y1 */
function drawBackWith(DR,ctx,x0,x1,y0,y1){
  DR.drawFinds(false,x0,x1,y0,y1);
  for(const c of DR.clouds) if(c.x>x0-70&&c.x<x1+70&&c.y>y0-50&&c.y<y1+50) DR.drawCloud(c);
  if(y0<-2500) DR.drawSpace();
  for(const tr of DR.trees) if(tr.x>x0-40&&tr.x<x1+40) DR.drawTree(tr);
  DR.drawCells(x0,x1,y0,y1);
  DR.drawFinds(true,x0,x1,y0,y1);
  for(const o of ST.props) if(o.x>x0-60&&o.x<x1+60) DR.drawProp(o);
  DR.drawWinter(x0,x1);
  DR.drawWorldBack(x0,x1,y0,y1);
  DR.drawDeep(x0,x1,y0,y1);
}
/** Achterbahnen mit Stützen und Wagen. @param {Port} DR @param {CanvasRenderingContext2D} ctx @param {number} x0 @param {number} x1 */
function drawTracksWith(DR,ctx,x0,x1){
  for(const T of ST.tracks){
    if(T.maxX<x0||T.minX>x1) continue;
    if(T.rb){ ctx.lineWidth=3.2; ctx.lineCap='round'; ctx.lineJoin='round'; for(let k=0;k<6;k++){ ctx.strokeStyle=DR.RBC[k]; ctx.beginPath(); ctx.moveTo(T.pts[0][0],T.pts[0][1]+k*3-8); for(let i=2;i<T.pts.length;i+=2) ctx.lineTo(T.pts[i][0],T.pts[i][1]+k*3-8); ctx.stroke(); } continue; }
    ctx.strokeStyle='#7d8a99'; ctx.lineWidth=3; ctx.lineCap='butt'; ctx.beginPath();
    for(let i=0;i<T.pts.length;i+=9){
      const p=T.pts[i], cx=Math.floor(p[0]/CELL), r0=Math.floor((p[1]-TOP)/CELL);
      if(r0<0||grid[r0*GX+cx]>=4) continue;
      const r=Math.min(DR.colTop(cx,r0),r0+70);
      if(r-r0>2){ ctx.moveTo(p[0],p[1]); ctx.lineTo(p[0],TOP+r*CELL+2); }
    }
    ctx.stroke();
    ctx.lineJoin='round'; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(T.pts[0][0],T.pts[0][1]);
    for(let i=1;i<T.pts.length;i++) ctx.lineTo(T.pts[i][0],T.pts[i][1]);
    ctx.strokeStyle='#a81c33'; ctx.lineWidth=7; ctx.stroke();
    ctx.strokeStyle='#ff6f86'; ctx.lineWidth=2.6; ctx.stroke();
    if(!(P.mode==='coaster'&&P.track===T)){ const q=DR.trackAt(T,10); DR.drawCart(q.x,q.y,Math.atan2(q.ty,q.tx),T.dir,false,false); }
  }
}
/** Bauhilfen: Enden der Bahnen beim Bahnbau, gestrichelter Strich beim Zeichnen. @param {Port} DR @param {CanvasRenderingContext2D} ctx */
function drawEditWith(DR,ctx){
  if(ST.tool==='track'){
    for(const T of ST.tracks){ const a=T.pts[0], b=T.pts[T.pts.length-1]; DR.knob(a[0],a[1],8); DR.knob(b[0],b[1],11); }
  }
  if(DR.stroke&&DR.stroke.length>1){
    ctx.strokeStyle='#e0304a'; ctx.lineWidth=5; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.setLineDash([10,9]);
    ctx.beginPath(); ctx.moveTo(DR.stroke[0][0],DR.stroke[0][1]);
    for(let i=1;i<DR.stroke.length;i++) ctx.lineTo(DR.stroke[i][0],DR.stroke[i][1]);
    ctx.stroke(); ctx.setLineDash([]);
  }
}
/** Abgestellte Fahrzeuge und der Geist der letzten Fahrt. @param {Port} DR */
function drawParkedWith(DR){
  let o=parked.plane; if(o) DR.drawPlane(o.x,o.y,0,0,o.face,true,o.ang,false);
  o=parked.rocket; if(o) DR.drawRocket(o.x,o.y,0,false,false);
  o=parked.car; if(o) DR.drawCar(o.x,o.y,o.ang,o.face,false,false);
  o=parked.dumper; if(o) DR.drawDumper(o.x,o.y,o.ang,o.face,o.load,0,false);
  o=parked.loader; if(o) DR.drawLoader(o.x,o.y,o.ang,o.face,o.lift||0,o.load,false);
  o=parked.tbm; if(o) DR.drawTbm(o.x,o.y,o.ang,o.face,o.da||0,false,0);
  o=parked.bagger; if(o) DR.drawBagger(o.x,o.y,o.ang,o.face,o.arm,o.load,false);
  o=parked.sub; if(o) DR.drawSub(o.x,o.y,o.ang,o.face,false);
  o=parked.balloon; if(o) DR.drawBalloon(o.x,o.y,o.ang,false,false);
  o=parked.heli; if(o) DR.drawHeli(o.x,o.y,o.ang,o.face,false,0);
  o=parked.boat; if(o) DR.drawBoat(o.x,o.y,o.ang,o.face,false,0);
  o=parked.bug; if(o) DR.drawBug(o.x,o.y,o.ang,o.face,false,0);
  if(DR.ghost){
    if(DR.ghost.kind==='rocket') DR.drawRocket(DR.ghost.x,DR.ghost.y,Math.atan2(DR.ghost.vx,-DR.ghost.vy-200)*.5,false,false);
    else DR.drawPlane(DR.ghost.x,DR.ghost.y,DR.ghost.vx,DR.ghost.vy,DR.ghost.vx>=0?1:-1,false,0,false);
  }
}
/** Held: zu Fuß oder im Fahrzeug, dazu das Haustier. @param {Port} DR @param {CanvasRenderingContext2D} ctx */
function drawHeroWith(DR,ctx){
  if(P.mode==='walk'){
    if(P.chute) DR.drawChute(P.x,P.y);
    DR.drawKid(P.x,P.y,P.face,P.on?P.run:1.1,!!P.zip||P.chute||(!P.on&&P.vy>220));
    DR.drawHandTool();
  }
  else if(P.mode==='car') DR.drawCar(P.x,P.y,P.ang,P.face,true,P.turbo>0);
  else if(P.mode==='bagger') DR.drawBagger(P.x,P.y,P.ang,P.face,P.arm,P.load,true);
  else if(P.mode==='loader') DR.drawLoader(P.x,P.y,P.ang,P.face,P.lift,P.load,true);
  else if(P.mode==='dumper') DR.drawDumper(P.x,P.y,P.ang,P.face,P.load,Math.min(1,P.bed),true);
  else if(P.mode==='tbm') DR.drawTbm(P.x,P.y,P.ang,P.face,P.da,true,Math.abs(P.vx)>5?DR.time*2.5:0);
  else if(P.mode==='rocket') DR.drawRocket(P.x,P.y,P.ang,true,keys.u&&!ST.paused);
  else if(P.mode==='plane') DR.drawPlane(P.x,P.y,P.vx,P.vy,P.face,P.on,P.ang,true);
  else if(P.mode==='sub') DR.drawSub(P.x,P.y,P.ang,P.face,true);
  else if(P.mode==='balloon') DR.drawBalloon(P.x,P.y,P.ang,true,keys.u&&!ST.paused);
  else if(P.mode==='bug') DR.drawBug(P.x+P.face*15*Math.min(1,Math.abs(P.ang)/1.57),P.y,P.ang,P.face,true,P.run);
  else if(P.mode==='boat') DR.drawBoat(P.x,P.y,P.ang,P.face,true,DR.boatWet()?Math.min(1,Math.abs(P.vx)/200):0);
  else if(P.mode==='heli') DR.drawHeli(P.x,P.y,P.ang,P.face,true,DR.reduced?.6:DR.time*(P.on?6:22));
  else if(P.mode==='ski'){ if(P.ball>0) DR.drawRoll(); else DR.drawSkier(P.x,P.y,P.ang,P.face,keys.d&&P.on,!P.on); }
  else if(P.mode==='dragon'){ ctx.save(); ctx.translate(P.x,P.y); ctx.rotate(P.ang); DR.drawDragon(0,0,1.9,P.face,1,DR.reduced?0:Math.sin(DR.time*(P.on?3:10)),true); ctx.restore(); }
  else if(/** @type {any} */ (P.track).lift) DR.drawGondola(P.x,P.y-46,true);
  else DR.drawCart(P.x,P.y,P.ang,/** @type {any} */ (P.track).dir,true,P.v>300);
  if(hero.pet){
    const pe=DR.PETS[hero.pet]||'🐉', pf=hero.pet==='dragon'||hero.pet==='ghost'||hero.pet==='ufo';
    ctx.font='20px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#000';
    ctx.fillText(pe,DR.pet.x,DR.pet.y-(pf?26:-4)+(DR.reduced?0:2.5*Math.sin(DR.time*7)));
  }
}
/** Bomben mit blinkender Zündschnur. @param {Port} DR @param {CanvasRenderingContext2D} ctx */
function drawBombsWith(DR,ctx){
  for(const bm of DR.bombs){
    ctx.fillStyle='#3a3438'; DR.circle(bm.x,bm.y,7);
    ctx.fillStyle=(bm.t*8|0)%2?'#ffd23f':'#ff5a1f'; DR.circle(bm.x+6,bm.y-8,3);
  }
}
/** Flüssigkeiten und Feuer im sichtbaren Teil der Simulation. @param {Port} DR @param {CanvasRenderingContext2D} ctx @param {number} x0 @param {number} x1 @param {number} y0 @param {number} y1 */
function drawLiquidsWith(DR,ctx,x0,x1,y0,y1){
  if(bx1<bx0) return;
  const cx0=Math.max(bx0,Math.floor(x0/CELL),1), cx1=Math.min(bx1,Math.floor(x1/CELL),GX-2);
  const cy0=Math.max(by0,Math.floor((y0-TOP)/CELL),1), cy1=Math.min(by1,Math.floor((y1-TOP)/CELL),GY-2);
  let nA=0,nB=0,nC=0,nW=0,nV=0,nF=0; const ph=(DR.time*4)|0, LA=LB-2, LW=WB-2, LF=bufF.length-2;
  for(let y=cy0;y<=cy1;y++){
    const row=y*GX, xb=Math.min(cx1,rx1[y]);
    for(let x=Math.max(cx0,rx0[y]);x<=xb;x++){
      const t=grid[row+x];
      if(t===0||t>3) continue;
      const up=grid[row-GX+x];
      if(t===LAVA){
        if(up!==LAVA&&up<4){
          if(nC<LA){bufC[nC++]=x;bufC[nC++]=y;}
          if(Math.random()<.003) DR.spawn(2,x*CELL+3,TOP+y*CELL,(Math.random()-.5)*14,-28-Math.random()*30,.9,1.6);
        }
        else if((x*7+y*13+ph)%6===0){ if(nB<LA){bufB[nB++]=x;bufB[nB++]=y;} }
        else if(nA<LA){bufA[nA++]=x;bufA[nA++]=y;}
      }
      else if(t===WATER){
        if(up===0){ if(nV<LW){bufV[nV++]=x;bufV[nV++]=y;} }
        else if(nW<LW){bufW[nW++]=x;bufW[nW++]=y;}
      }
      else if(nF<LF){bufF[nF++]=x;bufF[nF++]=y;}
    }
  }
  fillCellsWith(DR,ctx,bufA,nA,'#ff5a1f',0); fillCellsWith(DR,ctx,bufB,nB,'#e2331c',0); fillCellsWith(DR,ctx,bufC,nC,'#ffc233',1.5);
  fillCellsWith(DR,ctx,bufW,nW,DR.MD.w1,0); fillCellsWith(DR,ctx,bufV,nV,DR.MD.w2,0);
  for(let pass=0;pass<2;pass++){
    ctx.fillStyle=pass?'#ffe066':'#ff7a1f'; ctx.beginPath();
    const w=pass?2.6:5, k=pass?.55:1;
    for(let i=0;i<nF;i+=2){
      const fx=bufF[i]*CELL+3, by=TOP+(bufF[i+1]+1)*CELL;
      const hgt=(13+6*Math.sin(DR.time*13+bufF[i]*1.7+bufF[i+1]))*k, sway=2.5*Math.sin(DR.time*9+bufF[i]*2.3);
      ctx.moveTo(fx-w,by); ctx.quadraticCurveTo(fx-w-1,by-hgt*.5,fx+sway,by-hgt);
      ctx.quadraticCurveTo(fx+w+1,by-hgt*.5,fx+w,by); ctx.closePath();
    }
    ctx.fill();
  }
}
/** Teilchen: Rauch, Funken, Staub, Zahlen, Bildchen. @param {Port} DR @param {CanvasRenderingContext2D} ctx @param {number} x0 @param {number} x1 @param {number} y0 @param {number} y1 */
function drawPartsWith(DR,ctx,x0,x1,y0,y1){
  for(const p of DR.parts){
    if(p.x<x0-60||p.x>x1+60||p.y<y0-60||p.y>y1+60) continue;
    const a=p.life/p.max; let col, r=p.size;
    if(p.type===9){
      ctx.globalAlpha=Math.min(1,a*2.5); ctx.font='700 '+p.size+'px system-ui,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.lineWidth=3.5; ctx.lineJoin='round'; ctx.strokeStyle=DR.INK; ctx.strokeText(p.c,p.x,p.y); ctx.fillStyle=p.col; ctx.fillText(p.c,p.x,p.y); continue;
    }
    if(p.type===8){
      ctx.globalAlpha=Math.min(1,a*2); ctx.font=Math.round(p.size*(2-a))+'px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle='#000'; ctx.fillText(p.c,p.x,p.y); continue;
    }
    if(p.type===0){ ctx.globalAlpha=a*.5; col='#5b5560'; }
    else if(p.type===1){ ctx.globalAlpha=Math.min(1,a*1.6); col=a>.5?'#ffd23f':'#ff6a1f'; r=p.size*(.3+a*.7); }
    else if(p.type===2){ ctx.globalAlpha=a; col='#ffb321'; }
    else if(p.type===3){ ctx.globalAlpha=a*.7; col='#c9a57a'; }
    else if(p.type===4){ ctx.globalAlpha=1; col='#ff5a1f'; }
    else if(p.type===6){ ctx.globalAlpha=Math.min(1,a*2); col=p.c; }
    else if(p.type===7){ ctx.globalAlpha=a*.6; col='#ffffff'; }
    else if(p.type===10){ ctx.globalAlpha=Math.min(1,a*1.6); col='#ffffff'; }
    else if(p.type===12){ ctx.globalAlpha=a*.7; col=p.c; }
    else { ctx.globalAlpha=a; col='#ffe066'; }
    ctx.fillStyle=col; DR.circle(p.x,p.y,Math.max(.5,r));
  }
  ctx.globalAlpha=1;
}
/** Zeiger am Rand: Auftrag, Sonar, Leuchtmarke, Kompass. @param {Port} DR */
function drawPointersWith(DR){
  { const qp=DR.questPoint(); if(qp) DR.pointTo(qp[0],qp[1],'#58b548'); }
  if(DR.FX.sonar>0){ const so=DR.sonarTarget(); if(so) DR.pointTo(so[0],so[1],'#ffd23f'); }
  const gp=DR.guidePoint(); if(gp) DR.pointTo(gp[0],gp[1],'#ff8a1f');
  if(hero.up.compass>0&&DR.nearF&&!DR.nearF.got&&DR.nearD<[0,900,2600,1e9][hero.up.compass]) DR.pointTo(DR.nearF.x,DR.nearF.y,'#5fd4e6');
}
/** @param {Port} DR @param {CanvasRenderingContext2D} ctx @param {any} buf @param {any} n @param {any} col @param {any} lift */
export function fillCellsWith(DR,ctx,buf,n,col,lift){
  if(!n) return;
  ctx.fillStyle=col; ctx.beginPath();
  for(let i=0;i<n;i+=2) ctx.rect(buf[i]*CELL,TOP+buf[i+1]*CELL-lift,CELL+.5,CELL+.5+lift);
  ctx.fill();
}
