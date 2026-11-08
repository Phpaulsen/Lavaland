// Zellautomat: Lava, Wasser, Feuer und Dampf, das Rechenfenster um die Kamera und das Setzen einzelner Zellen. Bewegt aus legacy.js (PR 9).
// Der Fensterzustand (rx0…qx1, bx0…, px0…, winC, winR, sx0, tick, Zähler) gehört diesem Modul: Nur die Funktionen hier schreiben ihn,
// legacy.js liest ihn über Importe (direkte Bindungen, kein Getter). Gitter, Stempel und Brenndauer kommen direkt aus state/world.js.
// step, scanMobile und steam bekommen SP vorn: Ports für das, was noch in legacy.js steht (cam, trees, genF, dust, spawn, wc).
// Sonst ist der Text unverändert, Math.random bleibt (kein core/, Golden Master unberührt). Nicht nach core/: ADR 0001, Nachtrag 8.11.2026.
import { grid, stamp, LIFE } from './world.js';
import { BED, CELL, FIRE, GX, GY, ICE, LAVA, MAX_FIRE, MAX_LAVA, MAX_WATER, ROCK, ROWW, SNOW, SW, TOP, WATER, WINW, WOOD } from '../core/world/const.js';
import { inGrid } from '../core/world/shape.js';

/** Ports aus legacy.js (const SP dort). @typedef {Record<string, any>} SimPorts */

export let bx0=GX,bx1=-1,by0=GY,by1=-1, lavaCount=0, waterCount=0, fireCount=0, tick=0, sx0=0, winR=0;
/* Pro Zeile merken, wo Flüssigkeit liegt, damit die Simulation tiefe Welten nicht komplett durchsuchen muss. */
export let rx0=new Int16Array(GY).fill(GX), rx1=new Int16Array(GY).fill(-1), qx0=new Int16Array(GY).fill(GX), qx1=new Int16Array(GY).fill(-1);
export let px0=GX,px1=-1,py0=GY,py1=-1;
export let winC=-9999;

/** @param {any} i @param {any} v */
export function lifeS(i,v){
  if(v>0){ LIFE.set(i,v); if(LIFE.size>4*MAX_FIRE+4000) for(const k of LIFE.keys()) if(grid[k]!==FIRE) LIFE.delete(k); }
  else LIFE.delete(i);
}
/** @param {any} cx @param {any} cy */
export function ext(cx,cy){
  if(cx<bx0)bx0=cx; if(cx>bx1)bx1=cx; if(cy<by0)by0=cy; if(cy>by1)by1=cy;
  if(cx<px0)px0=cx; if(cx>px1)px1=cx; if(cy<py0)py0=cy; if(cy>py1)py1=cy;
  if(cx<rx0[cy])rx0[cy]=cx; if(cx>rx1[cy])rx1[cy]=cx; if(cx<qx0[cy])qx0[cy]=cx; if(cx>qx1[cy])qx1[cy]=cx;
}
/** @param {any} i */
export function extI(i){ const y=(i/GX)|0; ext(i-y*GX,y); }
/** @param {SimPorts} SP */
export function scanMobileWith(SP){
  winC=Math.floor(SP.cam.x/CELL); winR=Math.floor((SP.cam.y-TOP)/CELL); sx0=winC-WINW-4; stamp.fill(0);
  const a=Math.max(1,winC-WINW), b=Math.min(GX-2,winC+WINW), r0=Math.max(1,winR-ROWW-80), r1=Math.min(GY-4,winR+ROWW+80);
  bx0=GX;bx1=-1;by0=GY;by1=-1; rx0.fill(GX); rx1.fill(-1); qx0.fill(GX); qx1.fill(-1);
  for(let cy=r0;cy<=r1;cy++){ const row=cy*GX; for(let cx=a;cx<=b;cx++){ const m=grid[row+cx]; if(m>0&&m<4) ext(cx,cy); } }
}
/** @param {any} cx @param {any} cy @param {any} t */
export function put(cx,cy,t){
  if(!inGrid(cx,cy)) return false;
  const i=cy*GX+cx, m=grid[i];
  if((m!==0&&m!==FIRE)||m===t) return false;
  if(t===LAVA){ if(lavaCount>=MAX_LAVA) return false; lavaCount++; }
  else if(t===WATER){ if(waterCount>=MAX_WATER) return false; waterCount++; }
  else { if(fireCount>=MAX_FIRE) return false; fireCount++; }
  grid[i]=t; lifeS(i,t===FIRE?130+(Math.random()*90|0):0); ext(cx,cy);
  return true;
}
/** @param {any} wx @param {any} wy */
export function cellAt(wx,wy){
  const cx=Math.floor(wx/CELL), cy=Math.floor((wy-TOP)/CELL);
  if(cx<0||cx>=GX||cy>=GY) return BED;
  if(cy<0) return 0;
  return grid[cy*GX+cx];
}
/** @param {any} wx @param {any} wy */
export function hotAt(wx,wy){ const m=cellAt(wx,wy); return m===LAVA||m===FIRE; }
/** @param {any} i @param {any} p */
export function react(i,p){
  for(let k=0;k<4;k++){
    const n=k===0?i-GX:k===1?i+GX:k===2?i-1:i+1, m=grid[n];
    if(m===ICE){ if(Math.random()<p*1.6){ grid[n]=WATER; extI(n); } }
    else if(m===WOOD){ if(Math.random()<p){ grid[n]=FIRE; lifeS(n,150+(Math.random()*70|0)); extI(n); } }
    else if(m===SNOW){ if(Math.random()<p*1.4){ grid[n]=(waterCount<MAX_WATER-300&&Math.random()<.22)?WATER:0; extI(n); } }
  }
}
/** @param {SimPorts} SP @param {any} x @param {any} y */
export function steamWith(SP,x,y){ if(Math.random()<.3) SP.spawn(7,x*CELL+3,TOP+y*CELL,(Math.random()-.5)*20,-40-Math.random()*40,.9,5); }
/** @param {SimPorts} SP */
export function stepWith(SP){
  tick=(tick+1)&255;
  if(Math.abs(Math.floor(SP.cam.x/CELL)-winC)>80||Math.abs(Math.floor((SP.cam.y-TOP)/CELL)-winR)>70) scanMobileWith(SP);
  if(bx1<bx0){ lavaCount=0; waterCount=0; fireCount=0; }
  else{
    const cr=Math.floor((SP.cam.y-TOP)/CELL), f0=Math.max(1,by0-1), f1=Math.min(GY-4,by1+1), y0=Math.max(f0,cr-ROWW), y1=Math.min(f1,cr+ROWW), part=y0>f0||y1<f1;
    if(part){ qx0.set(rx0); qx1.set(rx1); }
    if(y1>=y0){ const e=y1<f1?y1+1:y1+2; qx0.fill(GX,y0,e); qx1.fill(-1,y0,e); }
    px0=GX;px1=-1;py0=GY;py1=-1;
    let nx0=GX,nx1=-1,ny0=GY,ny1=-1, lc=0, wc=0, fc=0;
    const ltr=tick&1;
    for(let y=y1;y>=y0;y--){
      if(rx1[y]<rx0[y]) continue;
      const row=y*GX, x0=Math.max(1,rx0[y]-3,winC-WINW), x1=Math.min(GX-2,rx1[y]+3,winC+WINW);
      for(let k=x0;k<=x1;k++){
        const x=ltr?k:x1-(k-x0), i=row+x, t=grid[i];
        if(t===0||t>3) continue;
        let j=i;
        const si=y*SW+x-sx0;
        if(stamp[si]!==tick){
          const dn=grid[i+GX];
          if(t===WATER){
            wc++;
            if(dn===0) j=i+GX;
            else{
              const d=Math.random()<.5?-1:1;
              if(grid[i+GX+d]===0) j=i+GX+d;
              else if(grid[i+GX-d]===0) j=i+GX-d;
              else if(grid[i+d]===0){ j=i+d; if(grid[j+d]===0){ j+=d; if(grid[j+d]===0) j+=d; } }
              else if(grid[i-d]===0){ j=i-d; if(grid[j-d]===0){ j-=d; if(grid[j-d]===0) j-=d; } }
            }
          }else{
            const up=grid[i-GX], l=grid[i-1], r=grid[i+1];
            if(up===WATER||dn===WATER||l===WATER||r===WATER){
              if(t===LAVA){ grid[up===WATER?i-GX:dn===WATER?i+GX:l===WATER?i-1:i+1]=0; grid[i]=ROCK; }
              else{ grid[i]=0; lifeS(i,0); }
              steamWith(SP,x,y); continue;
            }
            if(up>5||dn>5||l>5||r>5) react(i,t===LAVA?.12:.07);
            if(t===LAVA){
              lc++;
              if(dn===0) j=i+GX;
              else if(dn===FIRE){ grid[i+GX]=0; j=i+GX; }
              else{
                const d=Math.random()<.5?-1:1;
                if(grid[i+GX+d]===0) j=i+GX+d;
                else if(grid[i+GX-d]===0) j=i+GX-d;
                else if(Math.random()<.6){ if(grid[i+d]===0) j=i+d; else if(grid[i-d]===0) j=i-d; }
              }
            }else{
              let lv=/** @type {number} */ (LIFE.get(i))|0; if(lv!==255){ if(ltr&&lv>0) lifeS(i,--lv); if(lv===0){ grid[i]=0; continue; } }
              fc++;
              if(dn===0) j=i+GX;
            }
          }
          if(j!==i){ grid[j]=t; grid[i]=0; if(t===FIRE){ lifeS(j,/** @type {number} */ (LIFE.get(i))|0); LIFE.delete(i); } const dj=j-i; stamp[dj>9?si+SW+dj-GX:si+dj]=tick; }
        }
        const ty=(j/GX)|0, tx=j-ty*GX;
        if(tx<nx0)nx0=tx; if(tx>nx1)nx1=tx; if(ty<ny0)ny0=ty; if(ty>ny1)ny1=ty;
        if(tx<qx0[ty])qx0[ty]=tx; if(tx>qx1[ty])qx1[ty]=tx;
      }
    }
    if(part){ bx0=Math.min(bx0,nx0,px0);bx1=Math.max(bx1,nx1,px1);by0=Math.min(by0,ny0,py0);by1=Math.max(by1,ny1,py1); }
    else{ bx0=Math.min(nx0,px0);bx1=Math.max(nx1,px1);by0=Math.min(ny0,py0);by1=Math.max(ny1,py1); }
    const t0=rx0, t1=rx1; rx0=qx0; rx1=qx1; qx0=t0; qx1=t1;
    lavaCount=lc; waterCount=wc; fireCount=fc;
  }
  for(const tr of SP.trees){
    if(tr.state>=2) continue;
    const cx=Math.floor(tr.x/CELL);
    if(cx>=SP.genF-1) continue;
    if(grid[tr.row*GX+cx]<4){ SP.dust(tr.x,tr.gy); tr.state=3; continue; }
    if(tr.state!==0||cx<bx0-2||cx>bx1+2) continue;
    let hit=false;
    for(let dx=-1;dx<=1&&!hit;dx++) for(let dy=1;dy<=5;dy++){
      const m=grid[(tr.row-dy)*GX+cx+dx]; if(m===LAVA||m===FIRE){hit=true;break;}
    }
    if(!hit) hit=hotAt(tr.x,tr.gy-tr.h)||hotAt(tr.x-12,tr.gy-tr.h+8)||hotAt(tr.x+12,tr.gy-tr.h+8);
    if(hit){ tr.state=1; tr.t=5+Math.random()*2; }
  }
}
