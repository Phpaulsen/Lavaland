/* ---------- Malen mit dem Finger: Bildschirm zu Welt, Pinsel, Radierer, Zauberkasten-Kosten, Werkzeuge je Finger, Loslassen ---------- */
// PR 27b. Bewegt aus legacy.js. Die Finger (pointers), die Pointer-Handler, die Werkzeuge selbst (putUp, fillBlock, handDig, shoot …) und der Strich
// für Schienen und Seile bleiben in app/wire.js. Was das Malen vom übrigen Spiel braucht, kommt über den Port PT.
import { cam, P } from '../state/game.js';
import { inGrid } from '../core/world/shape.js';
import { grid } from '../state/world.js';
import { GX, CELL, TOP, LAVA, FIRE, WATER, ICE, WOOD, SNOW, MAX_LAVA, MAX_WATER, EARTH } from '../core/world/const.js';
import { lifeS, lavaCount, waterCount } from '../state/sim.js';
import { ST } from '../state/facade.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} PT @param {any} sx @param {any} sy */
export function toWorldWith(PT,sx,sy){ return [cam.x+(sx-PT.W/2)/PT.S, cam.y+(sy-PT.H/2)/PT.S]; }
/** @param {Port} PT @param {any} cx @param {any} cy @param {any} r @param {any} m */
export function discWith(PT,cx,cy,r,m){
  const n=Math.ceil(r);
  for(let dy=-n;dy<=n;dy++) for(let dx=-n;dx<=n;dx++){
    if(dx*dx+dy*dy>r*r) continue;
    const x=cx+dx, y=cy+dy;
    if(inGrid(x,y)&&grid[y*GX+x]<4){ grid[y*GX+x]=m; lifeS(y*GX+x,0); }
  }
}
/** @param {Port} PT @param {any} wx @param {any} wy */
export function eraseWith(PT,wx,wy){
  const cx=Math.floor(wx/CELL), cy=Math.floor((wy-TOP)/CELL);
  for(let dy=-4;dy<=4;dy++) for(let dx=-4;dx<=4;dx++){
    if(dx*dx+dy*dy>18) continue;
    const x=cx+dx, y=cy+dy;
    if(!inGrid(x,y)) continue;
    const m=grid[y*GX+x];
    if(m===LAVA||m===FIRE||m===WATER||m===ICE||m===WOOD||m===SNOW){ grid[y*GX+x]=0; lifeS(y*GX+x,0); }
  }
  ST.props=ST.props.filter(function(o){ return Math.abs(o.x-wx)>30||wy>o.y+10||wy<o.y-110; });
  for(let k=ST.tracks.length-1;k>=0;k--){
    const T=ST.tracks[k];
    if(wx<T.minX-20||wx>T.maxX+20) continue;
    for(let i=0;i<T.pts.length;i+=2){
      const p=T.pts[i];
      if(Math.abs(p[0]-wx)<18&&Math.abs(p[1]-wy)<18){
        if(P.mode==='coaster'&&P.track===T) PT.setMode('walk');
        ST.tracks.splice(k,1); break;
      }
    }
  }
}
/** @param {Port} PT @param {any} cx @param {any} cy @param {any} m */
export function paintCountWith(PT,cx,cy,m){
  let n=0;
  for(let y=cy-11;y<=cy+3;y++) for(let x=cx-3;x<=cx+3;x++) if(inGrid(x,y)&&grid[y*GX+x]===m) n++;
  return n;
}
/** @param {Port} PT @param {any} wx @param {any} wy */
export function paintAtWith(PT,wx,wy){
  const cx=Math.floor(wx/CELL), cy=Math.floor((wy-TOP)/CELL);
  const pm=PT.PAINTM[ST.tool], n0=pm===undefined?0:paintCountWith(PT,cx,cy,pm);
  paintDoWith(PT,wx,wy,cx,cy);
  if(pm!==undefined){ const d=paintCountWith(PT,cx,cy,pm)-n0; if(d>0) paintPayWith(PT,d*PT.PAINTC); }
}
/** @param {Port} PT @param {any} e */
export function paintPayWith(PT,e){
  if(ST.energy<=0) return;
  ST.energy=Math.max(0,ST.energy-e);
  if(ST.energy<=0) PT.drain(0);
}
/** @param {Port} PT @param {any} wx @param {any} wy @param {any} cx @param {any} cy */
export function paintDoWith(PT,wx,wy,cx,cy){
  if(ST.tool==='lava'||ST.tool==='water'){
    const t=ST.tool==='lava'?LAVA:WATER;
    if(t===LAVA?lavaCount>=MAX_LAVA:waterCount>=MAX_WATER){ PT.pulse('tool-erase'); return; }
    PT.putUp(cx,cy,t);PT.putUp(cx+1,cy,t);PT.putUp(cx-1,cy,t);PT.putUp(cx,cy-1,t);PT.putUp(cx,cy+1,t);
    if(t===WATER){ PT.putUp(cx+1,cy-1,t); PT.putUp(cx-1,cy-1,t); }
  }
  else if(ST.tool==='fire'){ PT.putUp(cx,cy,FIRE); PT.putUp(cx+1,cy,FIRE); }
  else if(ST.tool==='earth') discWith(PT,cx,cy,1.7,EARTH);
  else if(ST.tool==='ice') discWith(PT,cx,cy,2.3,ICE);
  else if(ST.tool==='snow') discWith(PT,cx,cy,2.3,SNOW);
  else if(ST.tool==='blocks') PT.fillBlock(cx>>2,cy>>2);
  else if(ST.tool==='erase') eraseWith(PT,wx,wy);
}
/** @param {Port} PT */
export function paintStepWith(PT){
  if(!ST.tool||ST.tool==='track'||ST.tool==='rope') return;
  if(ST.tool==='bow'){ PT.pointers.forEach(/** @param {any} p */ function(p){ if(!p.has){ p.has=true; const w=toWorldWith(PT,p.x,p.y); PT.shoot(w[0],w[1]); } }); return; }
  if(PT.HANDT[ST.tool]){ PT.pointers.forEach(/** @param {any} p */ function(p){ const w=toWorldWith(PT,p.x,p.y); if(Math.hypot(w[0]-P.x,w[1]-P.y+20)<95) PT.handDig(w[0],w[1]); }); return; }
  PT.pointers.forEach(/** @param {any} p */ function(p){
    const w=toWorldWith(PT,p.x,p.y);
    if(ST.tool==='tnt'){ if(!p.has){ p.has=true; PT.dropBomb(w[0],w[1]); } return; }
    if(ST.tool==='ball'||ST.tool==='fw'){ if(!p.has||PT.time-p.bt>(ST.tool==='ball'?.28:.4)){ p.has=true; p.bt=PT.time; if(ST.tool==='ball') PT.throwBall(w[0],w[1]); else PT.firework(w[0],w[1]); } return; }
    if(ST.tool==='man'){ if(!p.has){ p.has=true; PT.addMan(w[0]); } return; }
    if(p.has){
      const dist=Math.hypot(w[0]-p.lx,w[1]-p.ly), n=Math.min(18,Math.max(1,Math.ceil(dist/CELL)));
      for(let k=1;k<=n;k++) paintAtWith(PT,p.lx+(w[0]-p.lx)*k/n,p.ly+(w[1]-p.ly)*k/n);
    }else paintAtWith(PT,w[0],w[1]);
    p.lx=w[0]; p.ly=w[1]; p.has=true;
  });
}
/** @param {Port} PT @param {any} e */
export function endPointerWith(PT,e){
  const pp=PT.pointers.get(e.pointerId);
  if(pp&&pp.rs&&ST.tool==='rope'){ const w=toWorldWith(PT,pp.x,pp.y); PT.zipAdd(pp.rs[0],pp.rs[1],w[0],w[1]); }
  PT.pointers.delete(e.pointerId);
  if(e.pointerId===PT.strokeId){
    const ex=PT.strokeExt, k=ex?ST.tracks.indexOf(ex.T):-1;
    if(ex&&k>=0){
      if(PT.stroke&&PT.stroke.length>2){
        const add=PT.stroke.slice(1);
        let raw=ex.end?ex.T.raw.concat(add):add.reverse().concat(ex.T.raw);
        if(raw.length>2600) raw=ex.end?raw.slice(raw.length-2600):raw.slice(0,2600);
        const N=PT.makeTrack(raw,true);
        if(N){
          if(P.mode==='coaster'&&P.track===ex.T){ if(!ex.end) P.s+=N.len-ex.T.len; P.track=N; }
          ST.tracks[k]=N; PT.pulse('mode-coaster');
        }
      }
    }else{
      const T=PT.makeTrack(PT.stroke,true);
      if(T){ ST.tracks.push(T); if(ST.tracks.length>12) ST.tracks.shift(); PT.pulse('mode-coaster'); }
      else if(PT.stroke&&PT.stroke.length>1) PT.pulse('tool-track');
    }
    PT.stroke=null; PT.strokeId=null; PT.strokeExt=null;
  }
}
/* Zeiger auf der Leinwand verdrahten (Tippen, Malen, Loslassen). PR 29g2d: Die Anweisungen auf oberster Ebene aus legacy.js stehen unverändert in ptrBindWith, app/wire.js ruft es an der alten Stelle; alles aus legacy.js kommt über den Port PN. */
/** @param {Port} PN */
export function ptrBindWith(PN){
PN.cv.addEventListener('pointerdown',/** @param {any} e */ function(e){
  e.preventDefault();
  try{PN.cv.setPointerCapture(e.pointerId);}catch(_){}
  PN.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,has:false,lx:0,ly:0});
  PN.armGhost(PN.cv);
  if(!ST.tool) PN.tapWorld(e.clientX,e.clientY);
  if(ST.tool==='rope') PN.pointers.get(e.pointerId).rs=PN.toWorld(e.clientX,e.clientY);
  if(ST.tool==='track'&&PN.strokeId===null){
    const w=PN.toWorld(e.clientX,e.clientY);
    PN.strokeId=e.pointerId; PN.strokeExt=null; PN.stroke=[w];
    for(const T of ST.tracks){
      const a=T.pts[0], b=T.pts[T.pts.length-1];
      if(Math.hypot(w[0]-b[0],w[1]-b[1])<46){ PN.strokeExt={T:T,end:true}; PN.stroke=[[b[0],b[1]]]; break; }
      if(Math.hypot(w[0]-a[0],w[1]-a[1])<46){ PN.strokeExt={T:T,end:false}; PN.stroke=[[a[0],a[1]]]; break; }
    }
  }
});
PN.cv.addEventListener('pointermove',/** @param {any} e */ function(e){
  const p=PN.pointers.get(e.pointerId); if(!p) return;
  p.x=e.clientX; p.y=e.clientY;
  if(e.pointerId===PN.strokeId&&PN.stroke&&PN.stroke.length<900){
    const w=PN.toWorld(p.x,p.y), l=PN.stroke[PN.stroke.length-1];
    if(Math.hypot(w[0]-l[0],w[1]-l[1])>10) PN.stroke.push(w);
  }
});
PN.cv.addEventListener('pointerup',PN.endPointer);
PN.cv.addEventListener('pointercancel',PN.endPointer);
}
