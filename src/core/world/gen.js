// Weltgenerierung: Form der Welt, Länder, Höhlen, Tiefe, Planeten und das spaltenweise Erzeugen. Bewegt aus legacy.js (PR 8b).
// Jede Funktion bekommt das Weltobjekt WD vorn (app/wire.js: const WD). Bezüge auf Felder und Zustand der Welt lauten WD.x statt x,
// Aufrufe untereinander geben WD weiter. Sonst ist der Text unverändert. Zufall nur über rng(seed) und hash2, kein Math.random.
/** Weltobjekt aus legacy.js: Felder, Zustand und Ports der Welt (siehe const WD dort). @typedef {Record<string, any>} World */
import { rng } from '../rng.js';
import { HOME_W, HOME_GX, WORLD_W0, WORLD_W, CELL, GX, GY, SH, TOP, VOLC, LAVA, WATER, EARTH, ROCK, ICE, WOOD, BED, DEEP, HOT, CORE, GOLD, GEM, SNOW, SHELL, MOON, SITE, clamp, baseG, siteY, rawH, B0, EXT_X, EXC, HOME_END, WL, WLR } from './const.js';
import { SL0, BEND, CAVE, SNC0, SNC1, msurf, vnoise, inGrid, ellipse, PX0, PMC, LANDX, PADH, BT, sm, colOf, hBio, roomY, vFloor, LIFTX, SEA_T, SEA_L, SEA_B, HOUSE, FH } from './shape.js';
/* Eine Spalte vom Berg: oben Schnee, innen Fels mit Eiskristallen. Am Fuß liegt eine dünne Schneedecke. */
/** @param {World} WD @param {any} cx */
export function winterColWith(WD,cx){
  const x=(cx+.5)*CELL, mt=WD.mtop[cx], g=WD.grow0[cx], s3=(WD.SEED%389)*7.77;
  for(let cy=mt;cy<g;cy++){
    const i=cy*GX+cx, m=WD.grid[i], d=cy-mt;
    if(m>=4&&m!==EARTH) continue;
    WD.grid[i]=d<9?SNOW:(d>18&&vnoise(x/30+s3,(TOP+cy*CELL)/30)>.87?GEM:ROCK); if(WD.LIFE.size) WD.LIFE.delete(i);
  }
  if(mt>=g-1&&(x<SL0+60||x>BEND-90)){
    const r=WD.colTop(cx,2);
    for(let k=0;k<2;k++) if(r+k<GY-3&&WD.grid[(r+k)*GX+cx]===EARTH) WD.grid[(r+k)*GX+cx]=SNOW;
  }
}
/* Die Höhle, aus der das Hick kommt */
/** @param {World} WD */
export function carveCaveWith(WD){ ellipse(CAVE[0],CAVE[1],74,30,/** @param {any} cx @param {any} cy */ function(cx,cy){ WD.grid[cy*GX+cx]=0; }); }
/** @param {World} WD @param {any} x @param {any} y @param {any} r */
export function carveCircleWith(WD,x,y,r){
  const c0=Math.floor((x-r)/CELL), c1=Math.floor((x+r)/CELL), r0=Math.floor((y-r-TOP)/CELL), r1=Math.floor((y+r-TOP)/CELL);
  for(let cy=r0;cy<=r1;cy++) for(let cx=c0;cx<=c1;cx++){
    if(!inGrid(cx,cy)) continue;
    const dx=(cx+.5)*CELL-x, dy=TOP+(cy+.5)*CELL-y;
    if(dx*dx+dy*dy<=r*r) WD.grid[cy*GX+cx]=0;
  }
}
/** @param {World} WD @param {any} pts @param {any} r */
export function carvePathWith(WD,pts,r){
  for(let i=0;i<pts.length-1;i++){
    const a=pts[i], b=pts[i+1], n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/8);
    for(let k=0;k<=n;k++) carveCircleWith(WD,a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n,r);
  }
}
/** @param {World} WD */
export function fillCraterWith(WD){
  const level=Math.min(WD.ground(VOLC-105),WD.ground(VOLC+105))+16;
  for(let cx=Math.floor((VOLC-100)/CELL);cx<=Math.floor((VOLC+100)/CELL);cx++){
    for(let cy=WD.grow0[cx]-1;cy>=1;cy--){
      if(TOP+(cy+.5)*CELL<level) break;
      if(WD.grid[cy*GX+cx]===0) WD.setCell(cx,cy,LAVA);
    }
  }
}
/** @param {World} WD */
export function fillPondWith(WD){
  const lv=Math.floor((siteY.pond+8-TOP)/CELL);
  for(let cx=Math.floor((SITE.pond-170)/CELL);cx<=Math.floor((SITE.pond+170)/CELL);cx++)
    for(let cy=lv;cy<WD.grow0[cx];cy++) if(WD.grid[cy*GX+cx]===0) WD.setCell(cx,cy,WATER);
}
/** @param {World} WD @param {keyof typeof SITE} site */
export function houseBlocksWith(WD,site){
  const k=WD.grow0[Math.floor(SITE[site]/CELL)]>>2, b0=Math.round(SITE[site]/24)-2;
  return HOUSE.map(/** @param {any} h */ function(h){return [b0+h[0],k-1-h[1]];});
}
/** @param {World} WD @param {any} bx @param {any} by */
export function fillBlockWith(WD,bx,by){
  for(let y=by*4;y<by*4+4;y++) for(let x=bx*4;x<bx*4+4;x++) if(inGrid(x,y)&&WD.grid[y*GX+x]<4) WD.grid[y*GX+x]=WOOD;
}
/** @param {World} WD @param {any} x */
export function rawXWith(WD,x){
  let k=WD.bix[clamp(Math.floor(x/CELL),0,GX-1)]-1; if(k<0) k=0;
  const b=WD.BIO[k], d0=x-b.x0, d1=b.x1-x;
  let h=hBio(b,x);
  if(WD.realm){
    /* Auf fremden Welten: Am Landeplatz und an beiden Enden ist der Boden gleich hoch, damit die Welt rundherum zusammenpasst. */
    const dl=Math.abs(x-LANDX); if(dl<420) h+=(PADH-h)*sm(dl<260?1:1-(dl-260)/160);
    if(k===0&&d0<300) return PADH+(h-PADH)*sm(d0/300);
    if(k===WD.BIO.length-1&&d1<300) return PADH+(h-PADH)*sm(d1/300);
  }
  if(d0<220){ const o=k>0?hBio(WD.BIO[k-1],x):rawH(x); return o+(h-o)*sm((d0+220)/440); }
  if(d1<220&&k<WD.BIO.length-1){ const o=hBio(WD.BIO[k+1],x); return h+(o-h)*sm((220-d1)/440); }
  return h;
}
/** @param {World} WD @param {any} x */
export function rawGWith(WD,x){ return (x<EXT_X||!WD.BIO.length)?rawH(x):rawXWith(WD,x); }
/** @param {World} WD */
export function layoutWith(WD){
  WD.BIO=[]; let r=rng(WD.SEED*13+7); const cnt=/** @type {Record<string, number>} */ ({}); let x=B0, bag=/** @type {any[]} */ ([]), i=0, last=0;
  const R=WD.rlm();
  if(R){ r=rng(WD.SEED*13+R.salt); x=PX0; }
  const add=/** @param {any} t @param {any} w */ function(t,w){
    const b=/** @type {any} */ ({t:t,x0:x,x1:x+w,i:i++,s:Math.floor(r()*1e6),n:cnt[t]|0});
    cnt[t]=b.n+1; last=t;
    b.px=x+w*(.24+.14*r()); b.qx=24*Math.round((x+w*(.62+.16*r()))/24);
    if(t===12) b.qx=24*Math.round((WORLD_W-700)/24);
    b.hq=TOP+24*Math.round((hBio(b,b.qx,true)-TOP)/24);
    WD.BIO.push(b); x+=w;
  };
  const fill=/** @param {any} end */ function(end){
    while(x<end-5600||i<11){
      if(!bag.length){
        for(let t=1;t<=11;t++) bag.push(t);
        for(let k=10;k>0;k--){ const j=Math.floor(r()*(k+1)), q=bag[k]; bag[k]=bag[j]; bag[j]=q; }
        if(bag[10]===last){ const q=bag[10]; bag[10]=bag[0]; bag[0]=q; }
      }
      const t=bag.pop(); add(t,BT[t].w[0]+Math.floor(r()*BT[t].w[1]));
    }
  };
  if(R){
    /* Eine fremde Welt: ihre Länder wechseln sich ab, das letzte reicht genau bis zum Ende. */
    const E=PX0+WD.RW;
    while(x<E){
      const t=R.lands[i%R.lands.length]; let w=BT[t].w[0]+Math.floor(r()*BT[t].w[1]);
      if(E-x-w<BT[t].w[0]*.6) w=E-x;
      add(t,w);
    }
    return;
  }
  fill(WORLD_W0); WD.OLD_N=i; WD.OLD_END=x;
  r=rng(WD.SEED*29+11); fill(WORLD_W);
  add(12,WORLD_W-x);
}
/** @param {World} WD @param {any} x @param {any} k @param {any} r */
export function addTreeWith(WD,x,k,r){
  const f=FH[k], t=/** @type {any} */ ({x:x,gy:WD.ground(x),row:WD.grow0[Math.floor(x/CELL)],h:f[0]+r()*f[1],state:0,t:0,s:.85+r()*.4});
  if(k==='fir') t.fir=true; else if(k!=='tree') t.kind=k;
  WD.trees.push(t); return t;
}
/** @param {World} WD @param {any} b @param {any} f @param {any} r @param {any} [x] @param {any} [y] */
export function addCreWith(WD,b,f,r,x,y){
  const k=f[1], w=b.x1-b.x0, isle=b.t===7&&k!=='swim'&&x===undefined;
  if(x===undefined) x=isle?b.px+(r()-.5)*150:b.x0+280+r()*(w-560);
  const c=/** @type {any} */ ({e:f[0],k:k,x:x,hx:x,y:y===undefined?NaN:y,dir:r()<.5?-1:1,t:r()*9,cd:0,hop:0,say:f[3],fl:f[4]||'',b:b.i,sz:f[5]||22,sp:22+r()*10,ph:r()*6,next:3+r()*6,gone:0,rng:isle?70:170,ok:false});
  if(k==='swim'){ c.a=b.x0+140; c.z=b.x1-140; c.sp=28+r()*30; c.y=WL+40+r()*110; }
  WD.CRE.push(c); return c;
}
/** @param {World} WD @param {any} b */
export function populateWith(WD,b){
  const T=BT[b.t], r=rng(b.s*7+b.i), w=b.x1-b.x0, tier=Math.min(3,b.n), t0=WD.trees.length;
  WD.DECO.push({k:'gate',x:b.x0+240,b:b});
  if(T.flora) for(let x=b.x0+70;x<b.x1-70;x+=T.fs*(.55+r()*.9)){
    if(Math.abs(x-b.x0-240)<50||Math.abs(x-b.qx)<(T.clr||150)||Math.abs(x-b.px)<(T.clp||0)||WD.liqM[Math.floor(x/CELL)]) continue;
    addTreeWith(WD,x,T.flora[Math.floor(r()*T.flora.length)],r);
  }
  for(const f of T.fauna||[]) for(let n=0;n<f[2];n++){
    const c=addCreWith(WD,b,f,r);
    if(f[4]==='monkey'&&WD.trees.length>t0){ const tr=WD.trees[t0+Math.floor(r()*(WD.trees.length-t0))]; c.x=c.hx=tr.x; c.y=tr.gy-tr.h*.86; }
  }
  for(const q of T.picks||[]) for(let n=0;n<q[2];n++) WD.PICKS.push({e:q[0],ty:q[1],x:b.x0+300+r()*(w-600),y:NaN,t:0});
  for(let n=0;n<2;n++){ const x=b.x0+320+r()*(w-640); if(Math.abs(x-b.qx)>250&&Math.abs(x-b.px)>210) WD.LOOT.push({id:b.i*4+n,x:x,y:WD.ground(x)+56+r()*50,g:20+10*tier,bur:true}); }
  if(!T.noCloud) for(let n=0;n<w/800;n++) WD.clouds.push({x:b.x0+r()*w,y:-190-r()*900,s:.7+r()*1.1});
  if(WD.BUILD[b.t]) WD.BUILD[b.t](b,r,tier);
}
/* Berechnet die ganze Welt neu aus der Welt-Nummer: Bodenform, Farben, Pflanzen, Tiere, Bauwerke, Planeten. Die Zellen selbst entstehen später. */
/** @param {World} WD */
export function zoneColsWith(WD){ for(let cx=0;cx<GX;cx++){ const c=WD.wc(cx); WD.zS1[cx]=630+Math.round(3*Math.sin(c*.027+1)); WD.z4[cx]=960+Math.round(10*Math.sin(c*.013+2)); WD.zS2[cx]=1290+Math.round(4*Math.sin(c*.022)); WD.zS3[cx]=1640+Math.round(4*Math.sin(c*.019+4)); } }
/** @param {World} WD */
export function shapeWorldWith(WD){
  layoutWith(WD);
  const R=WD.rlm(), C0=R?WD.RC0:EXC, C1=R?WD.RC1:GX;
  zoneColsWith(WD);
  WD.bix.fill(0); WD.bio.fill(0); WD.bmx.fill(0); WD.noCave.fill(0); WD.liqM.fill(0); WD.liqY.fill(0);
  for(const b of WD.BIO){ const c0=Math.floor(b.x0/CELL), c1=Math.min(GX,Math.floor(b.x1/CELL)); for(let cx=c0;cx<c1;cx++){ WD.bix[cx]=b.i+1; WD.bio[cx]=b.t; } }
  /* Am Rand zweier Länder mischen sich die Farben. */
  for(let k=0;k<WD.BIO.length;k++){
    const c0=Math.floor(WD.BIO[k].x0/CELL), pt=k?WD.BIO[k-1].t:R?WD.BIO[WD.BIO.length-1].t:0;
    for(let d=-20;d<20;d++){ const cx=c0+d; if(cx>0&&cx<GX){ WD.bio[cx]=pt; WD.bio2[cx]=WD.BIO[k].t; WD.bmx[cx]=Math.max(1,Math.round((d+20)/40*255)); } }
  }
  for(let i=C0;i<(R?C1:GX+2);i++) WD.g0[i]=rawGWith(WD,i*CELL);
  for(const b of WD.BIO){ if(b.t===1||b.t===3) b.ly=Math.min(rawGWith(WD,b.px-98),rawGWith(WD,b.px+98))+9; else if(b.t===6) b.ly=Math.min(rawGWith(WD,b.px-92),rawGWith(WD,b.px+92))+14; }
  for(let cx=C0;cx<C1;cx++){
    const x=(cx+.5)*CELL, g=Math.ceil((rawGWith(WD,x)-TOP)/CELL-.5), b=WD.bix[cx]?WD.BIO[WD.bix[cx]-1]:null;
    const rock=b&&(b.t===8||(b.t===6&&Math.abs(x-b.px)<300));
    WD.grow0[cx]=g; WD.mtop[cx]=g;
    WD.rA[cx]=g+(rock?70:0); WD.rB[cx]=Math.max(WD.rA[cx],g+30+Math.round(5*Math.sin(cx*.05)));
    WD.rD[cx]=342+Math.round(8*Math.sin(cx*.021)); WD.rH[cx]=552+Math.round(10*Math.sin(cx*.017+2)); WD.rC[cx]=GY-52+Math.round(4*Math.sin(cx*.03));
    if(!b) continue;
    const dq=Math.abs(x-b.qx), dp=Math.abs(x-b.px), t=b.t;
    if(t===7){ WD.noCave[cx]=2; if(x>b.x0+50&&x<b.x1-50){ WD.liqM[cx]=WATER; WD.liqY[cx]=WLR; } }
    else if(t===6&&dp<320){ WD.noCave[cx]=2; if(dp<92){ WD.liqM[cx]=LAVA; WD.liqY[cx]=Math.floor((b.ly-TOP)/CELL); } }
    else if((t===1||t===3)&&dp<240){ WD.noCave[cx]=1; if(dp<100){ WD.liqM[cx]=WATER; WD.liqY[cx]=Math.floor((b.ly-TOP)/CELL); } }
    else if(t===10||dq<240) WD.noCave[cx]=1;
    if(t===18&&x>b.x0+260&&x<b.x1-260&&dq>=240){ WD.noCave[cx]=2; WD.liqM[cx]=WATER; WD.liqY[cx]=Math.floor((PADH+8-TOP)/CELL); }
    if(t===16&&x>b.x0+260&&x<b.x1-260&&dq>=240){ WD.noCave[cx]=2; WD.liqM[cx]=ICE; WD.liqY[cx]=Math.floor((PADH+8-TOP)/CELL); }
  }
  WD.trees.length=0; WD.clouds.length=0; WD.CRE=[]; WD.PICKS=[]; WD.PADS=[]; WD.DECO=[]; WD.EGGS=[]; WD.LOOT=[]; WD.STR=[]; WD.DROPS=[]; WD.ORBS.length=0;
  if(R){
    /* Die Randstreifen zeigen das jeweils andere Ende der Welt. */
    const L=[WD.g0,WD.grow0,WD.mtop,WD.rA,WD.rB,WD.rD,WD.rH,WD.rC,WD.bix,WD.bio,WD.bio2,WD.bmx,WD.noCave,WD.liqM,WD.liqY];
    for(let d=0;d<PMC;d++) for(const a of L){ a[WD.RC0-PMC+d]=a[WD.RC1-PMC+d]; a[WD.RC1+d]=a[WD.RC0+d]; }
    WD.g0[WD.RC1+PMC]=WD.g0[WD.RC0+PMC];
    for(const b of WD.BIO) populateWith(WD,b);
    WD.DECO.push({k:'sign',x:LANDX-90,y:WD.ground(LANDX-90),e:'🚀'});
    planetDeepWith(WD,R);
    return;
  }
  for(const t of WD.HOME_T) WD.trees.push(Object.assign({},t));
  for(const c of WD.HOME_C) WD.clouds.push(Object.assign({},c));
  WD.ORBS.push(MOON);
  /* Rund um die Heimat: Tannen hinten am Berg, Nessie im Höhlensee, ein Maulwurf unter dem Start, ein Wegweiser und drei Fundsachen. */
  const r=rng(WD.SEED*5+3), hb={i:-1,x0:0,x1:HOME_W,t:0};
  for(let x=7380;x<8250;x+=120+r()*90){ const cx=Math.floor(x/CELL); WD.trees.push({x:x,gy:TOP+WD.mtop[cx]*CELL,row:WD.mtop[cx],h:62+r()*40,state:0,t:0,s:.85+r()*.4,fir:true}); }
  const ns=addCreWith(WD,hb,['🦕','swim',1,'NESSIE!','',34],r,940); ns.a=800; ns.z=1090; ns.sp=20; ns.y=WD.ground(700)+266;
  addCreWith(WD,hb,['🐭','sit',1,'HEY! LOCH ZU!','bury',22],r,858,WD.ground(858)+310);
  WD.DECO.push({k:'sign',x:7240,y:msurf(7240),e:'➡️'},{k:'sign',x:8420,y:WD.ground(8420),e:'🌍'});
  WD.PICKS.push({e:'🎈',ty:'float',x:1190,y:NaN,t:0},{e:'🍄',ty:'big',x:2130,y:NaN,t:0},{e:'⭐',ty:'star',x:3900,y:NaN,t:0},{e:'🌶️',ty:'chili',x:5300,y:NaN,t:0});
  for(const b of WD.BIO) populateWith(WD,b);
  WD.STR.sort(/** @param {any} p @param {any} q */ function(p,q){ return p.c1-q.c1; });
  const ro=rng(WD.SEED*3+1); let k=0;
  for(let x=13000;x<WORLD_W-4000;x+=7000+ro()*5000){ WD.ORBS.push({x:x,y:-3800-ro()*1000,r:140+ro()*90,k:k%4,i:k+1}); k++; }
  deepWorldWith(WD);
}
/** @param {World} WD @param {any} bx @param {any} by @param {any} m */
export function blkWith(WD,bx,by,m){
  for(let y=by*4;y<by*4+4;y++) for(let x=bx*4;x<bx*4+4;x++) if(inGrid(x,y)){ WD.grid[y*GX+x]=m; if(m===WATER) WD.ext(x,y); }
}
/* Setzt ein Bauwerk in die fertig erzeugten Spalten. */
/** @param {World} WD @param {any} s */
export function buildWith(WD,s){
  const k=s.k;
  if(k==='pyr'){
    const gq=Math.round((s.y-TOP)/CELL), c0=Math.floor((s.x-156)/CELL), c1=Math.floor((s.x+156)/CELL);
    for(let cx=c0;cx<=c1;cx++){
      const d=Math.abs((cx+.5)*CELL-s.x), st=Math.min(10,Math.floor((156-d)/14)); if(st<0) continue;
      for(let cy=gq-2*(st+1);cy<gq+14;cy++) if(inGrid(cx,cy)&&WD.grid[cy*GX+cx]<4) WD.grid[cy*GX+cx]=ROCK;
      if(d<38) for(let cy=gq-7;cy<gq;cy++) WD.grid[cy*GX+cx]=0;
    }
  }else if(k==='house'||k==='tower'||k==='bld'||k==='wreck'){
    const kq=Math.round((s.y-TOP)/24), w=k==='tower'?5:k==='wreck'?7:s.w, h=k==='tower'?8:k==='wreck'?3:s.h;
    const b0=k==='bld'?s.bx:Math.round(s.x/24)-(k==='wreck'?3:2), base=k==='tower'||k==='bld'?ROCK:EARTH;
    if(k!=='wreck') for(let i=0;i<w;i++) for(let y=kq*4;y<kq*4+10;y++) for(let x=(b0+i)*4;x<(b0+i)*4+4;x++) if(inGrid(x,y)&&WD.grid[y*GX+x]<4) WD.grid[y*GX+x]=base;
    for(let j=0;j<=h;j++) for(let i=0;i<w;i++){
      let m=0;
      if(k==='house'){ if(i===0||i===w-1||j===h) m=s.m; if(i===0&&j<2) m=0; }
      else if(k==='tower'){ if(j<h&&(i===0||i===4)) m=ROCK; if((j===3&&i!==1)||(j===7&&i!==3)) m=ROCK; if(j===h) m=i%2?0:ROCK; if(i===0&&j<2) m=0; }
      else if(k==='bld'){ if(j===h) continue; m=(j%2===1&&i>0&&i<w-1&&(i+j)%2===0)?0:WOOD; }
      else{ if(j<h) m=(i===0||i===6)?WOOD:WATER; else m=i<3?WOOD:WATER; }
      blkWith(WD,b0+i,kq-1-j,m);
    }
    if(k==='house') for(let j=1;j<=2;j++) for(let i=j;i<w-j;i++) blkWith(WD,b0+i,kq-1-h-j,s.m);
  }else if(k==='geode'){
    ellipse(s.x,s.y,128,58,/** @param {any} cx @param {any} cy @param {any} wy */ function(cx,cy,wy){
      const dx=((cx+.5)*CELL-s.x)/110, dy=(wy-s.y)/46, i=cy*GX+cx;
      if(dx*dx+dy*dy<=1) WD.grid[i]=0; else if(WD.grid[i]>=4&&WD.grid[i]!==BED) WD.grid[i]=GEM;
    });
  }else if(k==='isle'){
    ellipse(s.x,s.y,s.rx,14,/** @param {any} cx @param {any} cy */ function(cx,cy){ if(WD.grid[cy*GX+cx]<4) WD.grid[cy*GX+cx]=SNOW; });
  }else if(k==='pillar'){
    const c0=Math.floor((s.x-12)/CELL);
    for(let cx=c0;cx<c0+4;cx++) for(let cy=Math.floor((s.y-TOP)/CELL);cy<WD.grow0[cx]+2;cy++) if(inGrid(cx,cy)) WD.grid[cy*GX+cx]=ROCK;
  }else if(k==='room'||k==='lake'){
    const lk=k==='lake', fr=Math.floor((s.y+s.ry*.5-TOP)/CELL), pad=lk?12:0;
    ellipse(s.x,s.y,s.rx+pad,s.ry+pad,/** @param {any} cx @param {any} cy @param {any} wy */ function(cx,cy,wy){
      const i=cy*GX+cx, m=WD.grid[i];
      if(m===BED||m===SHELL||m===CORE) return;
      const dx=((cx+.5)*CELL-s.x)/s.rx, dy=(wy-s.y)/s.ry, inn=dx*dx+dy*dy<=1;
      if(!lk){ if(cy<fr){ WD.grid[i]=0; WD.lifeS(i,0); } else if(m<4) WD.grid[i]=ROCK; }
      else if(inn){ WD.grid[i]=wy>s.y+s.ry*.15?s.m:0; WD.lifeS(i,0); }
      else if(m<4&&wy>s.y-6) WD.grid[i]=ROCK;
    });
    if(s.hw){
      const c0=Math.floor((s.x-s.rx-s.hw)/CELL), c1=Math.floor((s.x-s.rx+12)/CELL);
      for(let cx=c0;cx<=c1;cx++) for(let cy=fr-8;cy<fr;cy++) if(inGrid(cx,cy)){ const m=WD.grid[cy*GX+cx]; if(m!==BED&&m!==SHELL&&m!==CORE) WD.grid[cy*GX+cx]=0; }
    }
  }else if(k==='vault'){
    /* Schatzkammer: eine feste Wand, durch die kein Bohrer kommt, und links eine Tür. Davor ist eine kleine Nische frei. */
    const v=s.v, fr=vFloor(v);
    ellipse(v.x,v.y,v.rx+14,v.ry+14,/** @param {any} cx @param {any} cy @param {any} wy */ function(cx,cy,wy){
      const i=cy*GX+cx, dx=((cx+.5)*CELL-v.x)/v.rx, dy=(wy-v.y)/v.ry;
      if(dx*dx+dy*dy<=1&&cy<fr){ WD.grid[i]=0; WD.lifeS(i,0); } else WD.grid[i]=BED;
    });
    for(let cx=Math.floor((v.x-v.rx-64)/CELL);cx<Math.floor((v.x-v.rx-16)/CELL);cx++) for(let cy=fr-9;cy<fr;cy++) if(inGrid(cx,cy)){ const m=WD.grid[cy*GX+cx]; if(m!==BED&&m!==SHELL&&m!==CORE){ WD.grid[cy*GX+cx]=0; WD.lifeS(cy*GX+cx,0); } }
  }else if(k==='rb'){
    const raw=[];
    for(let n=0;n<=24;n++){ const t=n/24; raw.push([s.x+(s.x2-s.x)*t,s.y+(s.y2-s.y)*t*t-70*Math.sin(Math.PI*t)*(1-t)]); }
    const T=makeTrackWith(WD,raw,false); if(T){ T.rb=true; WD.tracks.push(T); }
  }
}
/* Erzeugt eine Spalte der Welt: Schichten, Höhlen, Gold und Edelsteine, Wasser oder Lava in Becken, den Schneeberg. */
/** @param {World} WD @param {any} cx @param {any} [from] */
export function genColWith(WD,cx,from){
  if(WD.realm&&(cx<WD.RC0-PMC||cx>=WD.RC1+PMC)){ for(let cy=0;cy<GY;cy++) WD.grid[cy*GX+cx]=BED; return; }
  const x=(WD.wc(cx)+.5)*CELL, g=WD.grow0[cx], cA=WD.rA[cx], cB=WD.rB[cx], cD=WD.rD[cx], cH=WD.rH[cx], cC=WD.rC[cx];
  const a1=WD.zS1[cx], a2=WD.z4[cx], a3=WD.zS2[cx], a4=WD.zS3[cx], edge=cx>0&&cx<GX-1;
  const ns=WD.realm?WD.SEED*31+WD.RLM[WD.realm].salt:WD.SEED, s1=(ns%977)*3.17, s2=(ns%613)*5.31, s3=(ns%389)*7.77;
  let safe, pond, gb, rich=false;
  if(cx<HOME_GX&&!WD.realm){ safe=!(x<1300||(x>2400&&x<3640)||Math.abs(x-SITE.chest-40)<150); pond=Math.abs(x-SITE.pond)<240; gb=Math.ceil((baseG(x)-TOP)/CELL-.5); }
  else{ safe=WD.noCave[cx]<2; pond=WD.noCave[cx]===1; gb=g; rich=WD.bix[cx]>0&&WD.BIO[WD.bix[cx]-1].t===8; }
  if(!from) for(let cy=0;cy<g;cy++) WD.grid[cy*GX+cx]=0;
  /* Im Lavameer stehen Felswände. Dazwischen liegt Lava in einer langen Höhle. Zu den Wänden hin steigt der Boden an und bildet ein trockenes Ufer. */
  const pil=vnoise(x/240+s1,9.5), seaT=SEA_T+Math.round(14*vnoise(x/170+s2,3.3)), bch=Math.min(1,Math.max(0,(.6-pil)/.07)), seaB=Math.round(SEA_L-5+(SEA_B+10*vnoise(x/130+s3,5.1)-SEA_L+5)*bch*bch);
  for(let cy=Math.max(g,from|0);cy<GY;cy++){
    const wy=TOP+cy*CELL;
    let m;
    if(cy<a1){
      m=cy>=cH?HOT:cy>=cD?DEEP:(cy<cA||cy>=cB)?ROCK:EARTH;
      if(edge){
        const d=(cy-g)*CELL;
        if(d>70&&cy<a1-6&&((cy-gb)*CELL>420||(safe&&!(pond&&d<200)))){
          if(Math.abs(vnoise(x/200+s1,wy/120)-.5)<.055*Math.min(1,(d-70)/90)) m=0;
          else if(d>900&&vnoise(x/380+s2,wy/250)>.76) m=0;
        }
        if(m&&d>260&&vnoise(x/30+s3,wy/30)>.86) m=cy>=cD?GEM:GOLD;
        else if(m&&rich&&d>18&&vnoise(x/26+s3,wy/26)>.8) m=GEM;
      }
    }
    else if(cy>=cC) m=CORE;
    else if(cy<a1+SH||(cy>=a3&&cy<a3+SH)||(cy>=a4&&cy<a4+SH)) m=SHELL;
    else{
      const z=cy<a2?1:cy<a3?2:cy<a4?3:4;
      m=ROCK;
      if(edge){
        const lo=z===1?a1+SH:z===2?a2-60:z===3?a3+SH:a4+SH, hi=z===1?a2+60:z===2?a3:z===3?a4:cC;
        if(cy>lo+4&&cy<hi-5){
          const n1=Math.abs(vnoise(x/200+s1,wy/120)-.5), n2=vnoise(x/380+s2,wy/250);
          if(z===1){ if(n2>.6||n1<.04) m=0; else if(n2>.555) m=EARTH; }
          else if(z===2){ if(n1<.065||n2>.8) m=0; else if(vnoise(x/110+s2,wy/36)>.7) m=EARTH; }
          else if(z===3){ if(n2>.68||n1<.035) m=0; else if(n2>.63) m=ICE; }
          else if(cy>=seaT-3){ if(cy>=seaT&&cy<seaB&&pil<.6) m=cy>=SEA_L?LAVA:0; }
          else if(n2>.7||n1<.045) m=0;
        }
        if(m===ROCK&&vnoise(x/30+s3,wy/30)>(z===3?.8:.86)) m=z===4?GOLD:GEM;
      }
    }
    WD.grid[cy*GX+cx]=m;
  }
  if(!from&&WD.liqM[cx]) for(let cy=Math.max(1,WD.liqY[cx]);cy<g;cy++) WD.grid[cy*GX+cx]=WD.liqM[cx]===ICE&&cy>WD.liqY[cx]+2?WATER:WD.liqM[cx];
  if(cx===0||cx===GX-1) for(let cy=0;cy<GY;cy++) WD.grid[cy*GX+cx]=BED;
  for(let cy=GY-3;cy<GY;cy++) WD.grid[cy*GX+cx]=BED;
  if(!from&&!WD.realm&&cx>=SNC0&&cx<=SNC1) winterColWith(WD,cx);
}
/* Die Heimat entsteht sofort, der Rest der Welt wächst beim Reisen. */
/** @param {World} WD */
export function genWith(WD){
  WD.grid.fill(0); WD.LIFE.clear(); WD.stamp.fill(0);
  for(let cx=0;cx<HOME_END;cx++) genColWith(WD,cx);
  WD.genF=HOME_END; WD.stI=0;
  /* Höhle beim Start, mit See */
  const gc=WD.ground(700);
  carvePathWith(WD,[[470,WD.ground(470)-4],[560,gc+70],[680,gc+150],[790,gc+212]],26);
  ellipse(940,gc+235,190,52,/** @param {any} cx @param {any} cy */ function(cx,cy){WD.grid[cy*GX+cx]=0;});
  ellipse(940,gc+235,190,52,/** @param {any} cx @param {any} cy @param {any} wy */ function(cx,cy,wy){ if(wy>gc+247) WD.grid[cy*GX+cx]=WATER; });
  /* Lavahöhle hinter dem Vulkan */
  const gl=WD.ground(3250);
  carvePathWith(WD,[[3150,WD.ground(3150)-4],[3230,gl+75],[3300,gl+140]],26);
  ellipse(3400,gl+165,130,44,/** @param {any} cx @param {any} cy */ function(cx,cy){WD.grid[cy*GX+cx]=0;});
  ellipse(3400,gl+165,130,44,/** @param {any} cx @param {any} cy @param {any} wy */ function(cx,cy,wy){ if(wy>gl+180) WD.grid[cy*GX+cx]=LAVA; });
  /* Magmakammer und Schlot unter dem Vulkan */
  const mc=baseG(VOLC)+150, vc=Math.floor(VOLC/CELL), mr=Math.floor((mc-TOP)/CELL);
  ellipse(VOLC,mc,110,38,/** @param {any} cx @param {any} cy */ function(cx,cy){WD.grid[cy*GX+cx]=LAVA;});
  for(let cx=vc-1;cx<=vc+1;cx++) for(let cy=WD.grow0[cx];cy<=mr;cy++) WD.grid[cy*GX+cx]=LAVA;
  carveCaveWith(WD);
  while(WD.stI<WD.STR.length&&WD.STR[WD.stI].c1<WD.genF){ buildWith(WD,WD.STR[WD.stI]); WD.stI++; }
  WD.scanMobile();
  fillCraterWith(WD); fillPondWith(WD);
  houseBlocksWith(WD,'smash').forEach(/** @param {any} b */ function(b){fillBlockWith(WD,b[0],b[1]);});
}
/** @param {World} WD @param {any} raw @param {any} user @returns {any} */
export function makeTrackWith(WD,raw,user){
  if(!raw||raw.length<2) return null;
  let pts=raw.map(/** @param {any} p */ function(p){return [clamp(p[0],30,WORLD_W-30),clamp(p[1],WD.skyLim()+120,TOP+(GY-8)*CELL)];});
  for(let k=0;k<2;k++){
    const o=[pts[0]];
    for(let i=0;i<pts.length-1;i++){
      const a=pts[i],b=pts[i+1];
      o.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75]);
    }
    o.push(pts[pts.length-1]); pts=o;
  }
  const R=[[pts[0][0],pts[0][1]]]; let acc=0;
  for(let i=1;i<pts.length;i++){
    let ax=pts[i-1][0], ay=pts[i-1][1]; const bx=pts[i][0], by=pts[i][1];
    let seg=Math.hypot(bx-ax,by-ay);
    while(seg>0&&acc+seg>=8){
      const t=(8-acc)/seg; ax+=(bx-ax)*t; ay+=(by-ay)*t; R.push([ax,ay]);
      seg=Math.hypot(bx-ax,by-ay); acc=0;
    }
    acc+=seg;
  }
  if(R.length<16) return null;
  let minX=1e9,maxX=-1e9;
  for(const p of R){ if(p[0]<minX)minX=p[0]; if(p[0]>maxX)maxX=p[0]; }
  return {pts:R,len:(R.length-1)*8,minX:minX,maxX:maxX,user:!!user,
    dir:R[R.length-1][0]>=R[0][0]?1:-1,
    raw:raw.map(/** @param {any} p */ function(p){return [Math.round(p[0]),Math.round(p[1])];})};
}
/* Legt fest, wo Material, Rätselmaschinen, Stationen, Seen, Höhlen und die Körper im Weltraum liegen. Alles hängt nur von der Welt-Nummer ab. */
/** @param {World} WD */
export function deepWorldWith(WD){
  WD.MATS=[]; WD.MACH=[]; WD.ZDEC=[];
  const r=rng(WD.SEED*17+5), WW=WORLD_W0, hb={i:-1,x0:0,x1:WORLD_W,t:0};
  let mi=0, di=0, ti=0;
  const mat=/** @param {any} k @param {any} x @param {any} y */ function(k,x,y){ WD.MATS.push({id:mi++,k:k,x:x,y:y}); };
  const yr=/** @param {any} a @param {any} b */ function(a,b){ return TOP+CELL*(a+r()*(b-a)); };
  const xr=/** @param {any} near */ function(near){ return near?170+r()*8500:9000+r()*(WW-9900); };
  const types=['muster','spiegel','robo','waage','echo','rohre','sudoku'];
  for(let k=6;k>0;k--){ const j=Math.floor(r()*(k+1)), q=types[k]; types[k]=types[j]; types[j]=q; }
  /* Kristall-Echo und Bilder-Sudoku spawnen nicht mehr (Vereinfachungsplan Schritt 1). Gemischt wird weiter über alle sieben, damit der Zufallsstrom und damit die Welt gleich bleiben; nur die Arten der Maschinen ändern sich. */
  const pzs=types.filter(function(t){ return t!=='echo'&&t!=='sudoku'; });
  const nt=function(){ return pzs[ti++%5]; };
  const room=/** @param {any} x @param {any} y @param {any} rx @param {any} ry @param {any} hw */ function(x,y,rx,ry,hw){ const s={k:'room',x:x,y:y,rx:rx,ry:ry,hw:hw||0,nw:1,c1:colOf(x+rx+14)}; WD.STR.push(s); return roomY(s); };
  const dm=/** @param {any} x @param {any} row @param {any} zb @param {any} hw */ function(x,row,zb,hw){ const y=room(x,TOP+row*CELL,92,44,hw); WD.MACH.push({id:'d'+(di++),t:nt(),x:x,y:y,zb:zb}); };
  const far=/** @param {any} x */ function(x){ return Math.abs(x-LIFTX)>560; };
  const ZA=[660,978,1322,1672], ZB=[944,1272,1622,1880], ZBN=[1,1,2,3];

  /* Material unter der Erde. Mehr als die Hälfte liegt unter der Heimat, weil dort der Aufzug hinunterfährt. */
  for(let n=0;n<36;n++) mat('fe',xr(n<24),yr(368,616));
  for(let n=0;n<18;n++) mat('pi',xr(n<11),yr(ZA[0]+4,ZB[0]-4));
  for(let n=0;n<18;n++) mat('kn',xr(n<11),yr(ZA[1]+4,ZB[1]-4));
  for(let n=0;n<18;n++) mat('kr',xr(n<11),yr(ZA[2]+2,ZB[2]-2));
  for(let n=0;n<12;n++) mat('fp',xr(n<8),n%2?yr(SEA_L+3,SEA_B-6):yr(ZA[3]+4,ZB[3]));
  /* Mondsteine liegen jetzt auf dem Mond selbst, der eine eigene Welt ist. Die alten Plätze behalten ihre Nummern, liegen aber nirgends mehr. */
  for(let n=0;n<8;n++){ r(); WD.MATS.push({id:mi++,k:'mo',x:-1e5,y:-1e5,off:1}); }

  /* Rätselmaschinen: drei in der Heimat, eine in jedem Land, je drei in jeder tiefen Zone, vier im Weltraum. */
  WD.MACH.push({id:'h0',t:'muster',x:1330,y:NaN,sf:1,zb:0},{id:'h1',t:'robo',x:4280,y:NaN,sf:1,zb:0},{id:'h2',t:'spiegel',x:8590,y:NaN,sf:1,zb:0},{id:'n0',t:'stern',x:7010,y:NaN,sf:1,zb:0});
  /* Länder der neuen Hälfte bekommen ihre Maschinen-Arten aus einer eigenen Reihe, damit sich an den alten nichts ändert. */
  let ti2=0;
  for(const b of WD.BIO) if(b.t!==12) WD.MACH.push({id:'b'+b.i,t:b.i<WD.OLD_N?nt():pzs[(ti2++)%5],x:b.t===7?b.px-12:b.t===10?b.x0+330:b.qx+150,y:NaN,sf:1,zb:b.i<4?0:1});
  for(let k=1;k<=6;k++) WD.ZN[k].y=room(LIFTX,TOP+WD.ZN[k].row*CELL,124,48,0);
  dm(LIFTX+300,WD.ZN[1].row,0,90); dm(LIFTX+300,WD.ZN[2].row,1,90);
  for(let z=0;z<4;z++){
    const a=ZA[z], b=ZB[z];
    dm(LIFTX+300,WD.ZN[z+3].row,ZBN[z],90);
    dm(2400+r()*5600,a+24+r()*(b-a-48),ZBN[z],0);
    dm(9400+r()*(WW-10600),a+24+r()*(b-a-48),ZBN[z],0);
  }

  /* Pilzgrotten: Sprungpilze und Leuchtkäfer */
  for(let n=0;n<16;n++){
    const x=xr(n<9), yy=yr(ZA[0]+12,ZB[0]-12), rx=54+r()*30, h=34+r()*40;
    if(!far(x)) continue;
    const y=room(x,yy,rx,34,0);
    WD.PADS.push({k:'shroom',x:x,y:y-h,w:26+r()*8,h:h,pow:560+h*2,c:n,bt:0});
    if(n%3===0) addCreWith(WD,hb,['🐛','sit',1,'GLÜH!','sparkle',18],r,x+40,y);
  }
  /* Urzeit-Höhlen: Versteinerungen im Fels, Seen und kleine Dinos */
  for(let n=0;n<22;n++) WD.ZDEC.push({k:'bone',x:xr(n<12),y:yr(ZA[1]+6,ZB[1]-6),s:.8+r()*.9,f:r()<.5?-1:1,v:n%3});
  for(let n=0;n<10;n++){
    const x=xr(n<6), yy=yr(ZA[1]+20,ZB[1]-20), rx=120+r()*50;
    if(!far(x)) continue;
    const y=room(x,yy,rx,46,0);
    addCreWith(WD,hb,n%2?['🦕','walk',1,'MÖÖÖH!','bront',40]:['🦖','sit',1,'ROAR!','',28],r,x,y).rng=60;
  }
  const lake=/** @param {any} m @param {any} a @param {any} b @param {any} n */ function(m,a,b,n){
    for(let i=0;i<n;i++){
      const x=xr(i<n*.45), rx=64+r()*70, y=yr(a,b), ry=26+r()*14;
      if(far(x)) WD.STR.push({k:'lake',x:x,y:y,rx:rx,ry:ry,m:m,nw:1,c1:colOf(x+rx+26)});
    }
  };
  lake(WATER,ZA[1]+16,ZB[1]-16,22); lake(WATER,ZA[2]+16,ZB[2]-16,36); lake(LAVA,ZA[3]+16,ZB[3]-30,26);
  /* Kristalltiefen: Kristallhallen und Pinguine */
  for(let n=0;n<16;n++){
    const x=xr(n<9), yy=yr(ZA[2]+16,ZB[2]-16), rx=70+r()*50, sc=.8+r()*.8, cc=Math.floor(r()*3);
    if(!far(x)) continue;
    const y=room(x,yy,rx,40,0);
    WD.ZDEC.push({k:'cry',x:x,y:y,s:sc,c:cc});
    if(n%4===1) addCreWith(WD,hb,['🐧','sit',1,'BRRR!','',22],r,x+34,y);
  }
  /* Lavameer: Drachenkinder in ihren Nestern */
  for(let n=0;n<8;n++){
    const x=xr(n<5), yy=yr(ZA[3]+16,ZB[3]-30);
    if(!far(x)) continue;
    addCreWith(WD,hb,['🐲','sit',1,'FAUCH!','',26],r,x,room(x,yy,80,40,0));
  }

  /* Weltraum über der Heimat: Felsbrocken, eine Station, zwei Planeten und ganz oben das Sternentor */
  const stn={x:2400,y:-9100,r:84,z:'stn'}, ice={x:1900,y:-16000,r:420,z:'ice'}, jun={x:6100,y:-19200,r:330,z:'jun'}, gate={x:3900,y:-28300,r:470,z:'gate'}, ast=[];
  for(let n=0;n<34;n++){
    const big=n<12; let o=null;
    for(let g=0;g<10&&!o;g++){
      const q={x:260+r()*8800,y:-6500-r()*4600,r:big?46+r()*22:22+r()*20,z:'ast',s:Math.floor(r()*1e6)};
      let ok=Math.hypot(q.x-stn.x,q.y-stn.y)>280;
      for(const p of ast) if(Math.hypot(p.x-q.x,p.y-q.y)<p.r+q.r+70) ok=false;
      if(ok) o=q;
    }
    if(!o) continue;
    ast.push(o); WD.ORBS.push(o);
    if(big) mat('st',o.x,o.y-o.r-12);
  }
  WD.ORBS.push(stn,ice,jun,gate);
  const top=/** @param {any} o @param {any} dx */ function(o,dx){ return o.y-Math.sqrt(o.r*o.r-dx*dx); };
  /* Eiskerne liegen jetzt auf dem Eisplaneten selbst. Die alten Plätze behalten ihre Nummern, liegen aber nirgends mehr. */
  for(let n=0;n<12;n++){ r(); WD.MATS.push({id:mi++,k:'ei',x:-1e5,y:-1e5,off:1}); }
  WD.MACH.push({id:'s0',t:nt(),x:stn.x,y:top(stn,0),zb:1},{id:'s1',t:nt(),x:ice.x+382,y:top(ice,382),zb:2,gone:1},{id:'s2',t:nt(),x:jun.x-30,y:top(jun,-30),zb:2,gone:1},{id:'s3',t:nt(),x:gate.x+170,y:top(gate,170),zb:3});
  /* Auf dem Eisplaneten selbst stehen jetzt eigene Rätselmaschinen. */
  WD.MACH=WD.MACH.filter(/** @param {any} m */ function(m){ return !m.gone; });
  for(let k=0;k<5;k++) r();
  for(let k=0;k<5;k++) r();
  addCreWith(WD,hb,['👽','sit',1,'WILLKOMMEN!','sparkle',26],r,gate.x-150,top(gate,-150));
  addCreWith(WD,hb,['👾','sit',1,'PIEP PIEP!','sparkle',24],r,gate.x-210,top(gate,-210));
  WD.SPACE={stn:stn,ice:ice,jun:jun,gate:gate};
  deepFarWith(WD,hb);
  vaultPlanWith(WD,7,2,9500,WORLD_W-11000,4);
  WD.STR.sort(/** @param {any} p @param {any} q */ function(p,q){ return p.c1-q.c1; });
}
/* Die Tiefe unter der neuen Hälfte der Welt: Material, Rätselmaschinen, Höhlen und Tiere wie in der alten Hälfte, aus einer eigenen Zufallsreihe. */
/** @param {World} WD @param {any} hb */
export function deepFarWith(WD,hb){
  const r=rng(WD.SEED*31+17), X0=WORLD_W0+300, XW=WORLD_W-X0-900;
  let mi=WD.MATS.length;
  const mat=/** @param {any} k @param {any} x @param {any} y */ function(k,x,y){ WD.MATS.push({id:mi++,k:k,x:x,y:y}); };
  const yr=/** @param {any} a @param {any} b */ function(a,b){ return TOP+CELL*(a+r()*(b-a)); };
  const xr=function(){ return X0+r()*XW; };
  const types=['muster','spiegel','robo','waage','rohre'];
  let di=100, ti=Math.floor(r()*7);
  const room=/** @param {any} x @param {any} y @param {any} rx @param {any} ry */ function(x,y,rx,ry){ const s={k:'room',x:x,y:y,rx:rx,ry:ry,hw:0,nw:1,c1:colOf(x+rx+14)}; WD.STR.push(s); return roomY(s); };
  const ZA=[660,978,1322,1672], ZB=[944,1272,1622,1880], ZBN=[1,1,2,3];
  for(let n=0;n<12;n++) mat('fe',xr(),yr(368,616));
  for(let n=0;n<7;n++) mat('pi',xr(),yr(ZA[0]+4,ZB[0]-4));
  for(let n=0;n<7;n++) mat('kn',xr(),yr(ZA[1]+4,ZB[1]-4));
  for(let n=0;n<7;n++) mat('kr',xr(),yr(ZA[2]+2,ZB[2]-2));
  for(let n=0;n<4;n++) mat('fp',xr(),n%2?yr(SEA_L+3,SEA_B-6):yr(ZA[3]+4,ZB[3]));
  for(let z=0;z<4;z++){
    const a=ZA[z], b=ZB[z], x=xr();
    WD.MACH.push({id:'d'+(di++),t:types[(ti++)%5],x:x,y:room(x,a+24+r()*(b-a-48),92,44),zb:ZBN[z]});
  }
  for(let n=0;n<8;n++){
    const x=xr(), y=room(x,yr(ZA[0]+12,ZB[0]-12),54+r()*30,34), h=34+r()*40;
    WD.PADS.push({k:'shroom',x:x,y:y-h,w:26+r()*8,h:h,pow:560+h*2,c:n,bt:0});
    if(n%3===0) addCreWith(WD,hb,['🐛','sit',1,'GLÜH!','sparkle',18],r,x+40,y);
  }
  for(let n=0;n<10;n++) WD.ZDEC.push({k:'bone',x:xr(),y:yr(ZA[1]+6,ZB[1]-6),s:.8+r()*.9,f:r()<.5?-1:1,v:n%3});
  for(let n=0;n<5;n++){ const x=xr(), y=room(x,yr(ZA[1]+20,ZB[1]-20),120+r()*50,46); addCreWith(WD,hb,n%2?['🦕','walk',1,'MÖÖÖH!','bront',40]:['🦖','sit',1,'ROAR!','',28],r,x,y).rng=60; }
  const lake=/** @param {any} m @param {any} a @param {any} b @param {any} n */ function(m,a,b,n){ for(let i=0;i<n;i++){ const x=xr(), rx=64+r()*70, y=yr(a,b), ry=26+r()*14; WD.STR.push({k:'lake',x:x,y:y,rx:rx,ry:ry,m:m,nw:1,c1:colOf(x+rx+26)}); } };
  lake(WATER,ZA[1]+16,ZB[1]-16,10); lake(WATER,ZA[2]+16,ZB[2]-16,16); lake(LAVA,ZA[3]+16,ZB[3]-30,12);
  for(let n=0;n<8;n++){ const x=xr(), y=room(x,yr(ZA[2]+16,ZB[2]-16),70+r()*50,40); WD.ZDEC.push({k:'cry',x:x,y:y,s:.8+r()*.8,c:Math.floor(r()*3)}); if(n%4===1) addCreWith(WD,hb,['🐧','sit',1,'BRRR!','',22],r,x+34,y); }
  for(let n=0;n<4;n++){ const x=xr(); addCreWith(WD,hb,['🐲','sit',1,'FAUCH!','',26],r,x,room(x,yr(ZA[3]+16,ZB[3]-30),80,40)); }
}
/* Die Tiefe einer fremden Welt: dieselben harten Schichten wie auf der Erde, aber eigene Zonen, Material, Rätselmaschinen und Bewohner. */
/** @param {World} WD @param {any} R */
export function planetDeepWith(WD,R){
  WD.MATS=[]; WD.MACH=[]; WD.ZDEC=[]; WD.SPACE={};
  const r=rng(WD.SEED*37+R.salt), X0=PX0+300, XW=WD.RW-600, hb={i:-1,x0:PX0,x1:PX0+WD.RW,t:0};
  let mi=0, di=0, ti=Math.floor(r()*4);
  const mat=/** @param {any} k @param {any} x @param {any} y */ function(k,x,y){ WD.MATS.push({id:mi++,k:k,x:x,y:y}); };
  const yr=/** @param {any} a @param {any} b */ function(a,b){ return TOP+CELL*(a+r()*(b-a)); };
  const xr=function(){ return X0+r()*XW; };
  const types=['stern','muster','spiegel','robo','waage'];
  const room=/** @param {any} x @param {any} y @param {any} rx @param {any} ry */ function(x,y,rx,ry){ const s={k:'room',x:x,y:y,rx:rx,ry:ry,hw:0,nw:1,c1:colOf(x+rx+14)}; WD.STR.push(s); return roomY(s); };
  const ZA=[368,560,660,978,1322,1672], ZB=[552,616,944,1272,1622,1880], ZBN=[0,1,1,1,2,3];
  /* Material: Zone 0 heißt oben auf dem Boden oder knapp darunter. */
  for(const q of R.mat) for(let n=0;n<q[1];n++){
    const x=xr();
    if(q[2]) mat(q[0],x,yr(ZA[q[2]-1]+4,ZB[q[2]-1]-4));
    else mat(q[0],x,n%2?WD.ground(x)-12:WD.ground(x)+30+r()*90);
  }
  /* Zwei Rätselmaschinen oben, eine in jeder tiefen Zone */
  for(let n=0;n<2;n++) WD.MACH.push({id:'p'+(di++),t:n?types[(ti++)%5]:'stern',x:PX0+WD.RW*(.3+.4*n)+r()*900,y:NaN,sf:1,zb:n});
  for(let z=2;z<6;z++){ const x=xr(); WD.MACH.push({id:'p'+(di++),t:types[(ti++)%5],x:x,y:room(x,ZA[z]+24+r()*(ZB[z]-ZA[z]-48),92,44),zb:ZBN[z]}); }
  /* Höhlen mit Bewohnern, Seen und Kristallen */
  for(let z=3;z<=6;z++){
    const a=ZA[z-1], b=ZB[z-1], f=R.zc[z];
    for(let n=0;n<8;n++){
      const x=xr(), y=room(x,yr(a+16,b-16),60+r()*60,38);
      if(z===4&&n%2===0){ const h=34+r()*40; WD.PADS.push({k:'shroom',x:x,y:y-h,w:26+r()*8,h:h,pow:560+h*2,c:n,bt:0}); }
      else if(z===5&&n%2===0) WD.ZDEC.push({k:'cry',x:x,y:y,s:.8+r()*.8,c:Math.floor(r()*3)});
      if(f&&n%3===0) addCreWith(WD,hb,f,r,x+30,y);
    }
    if(R.lk[z]) for(let n=0;n<10;n++){ const x=xr(), rx=64+r()*70, y=yr(a+16,b-30), ry=26+r()*14; WD.STR.push({k:'lake',x:x,y:y,rx:rx,ry:ry,m:R.lk[z],nw:1,c1:colOf(x+rx+26)}); }
  }
  vaultPlanWith(WD,R.salt,0,PX0+400,WD.RW-800,R.small!==undefined?1:2);
  /* Jeder große Planet hat ganz unten einen Planetenkern. Eigene Zufallsreihe und als letztes Stück, damit sich an allem anderen nichts ändert. */
  if(R.small===undefined){ const rc=rng(WD.SEED*53+R.salt), x=X0+rc()*XW; mat('pk',x,TOP+CELL*(ZA[5]+40+rc()*(ZB[5]-ZA[5]-80))); }
  WD.STR.sort(/** @param {any} p @param {any} q */ function(p,q){ return p.c1-q.c1; });
}
/** @param {World} WD @param {any} salt @param {any} near @param {any} X0 @param {any} XW @param {any} per */
export function vaultPlanWith(WD,salt,near,X0,XW,per){
  WD.VAULTS=[];
  const r=rng(WD.SEED*41+salt), ZA=[368,660,978,1322,1672], ZB=[616,944,1272,1622,1880];
  for(let z=0;z<5;z++) for(let n=0;n<per;n++){
    const x=n<near?1500+r()*7200:X0+r()*XW, y=TOP+CELL*(ZA[z]+30+r()*(ZB[z]-ZA[z]-60));
    const v=/** @type {any} */ ({id:WD.VAULTS.length,x:x,y:y,z:z,rx:66,ry:34});
    v.fy=TOP+vFloor(v)*CELL;
    WD.VAULTS.push(v); WD.STR.push({k:'vault',v:v,nw:1,c1:colOf(x+v.rx+40)});
    WD.LOOT.push({id:5000+v.id,x:x+10,y:v.fy-14,g:40+30*z,bur:false});
  }
}
