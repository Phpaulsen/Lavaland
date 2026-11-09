/* ---------- Weltabfragen: Boden, fest, Mond, brennt, Säulenoberkante, Boden unter einem Punkt, Oberfläche, Zelle setzen ---------- */
// PR 29d. Unverändert aus legacy.js bewegt (gleiche Namen, ohne Port und ohne Einzeiler): Diese Abfragen laufen im heißen Pfad (Physik, Fahrzeuge, Tiere).
// Sie lesen nur Modulbindungen (Gitter, Höhen, Held); legacy.js und die Ports importieren sie direkt. ORBS (Mond und Planeten am Himmel) zieht mit, weil inMoon und floorAt es lesen.
import { MOON, clamp, CELL, GX, GY, TOP, FIRE, LAVA } from '../core/world/const.js';
import { inGrid } from '../core/world/shape.js';
import { g0, grid } from './world.js';
import { cellAt, put, lifeS, ext } from './sim.js';
import { hero } from './game.js';

export const ORBS=[MOON];
/** @param {any} x */
export function ground(x){ const f=clamp(x/CELL,0,GX), i=Math.floor(f); return g0[i]+(g0[i+1]-g0[i])*(f-i); }
/** @param {any} wx @param {any} wy */
export function inMoon(wx,wy){ for(const o of ORBS){ const dx=wx-o.x, dy=wy-o.y; if(dx*dx+dy*dy<o.r*o.r) return true; } return false; }
/** @param {any} wx @param {any} wy */
export function solidW(wx,wy){ return wy<-3000?inMoon(wx,wy):cellAt(wx,wy)>=4; }
/** @param {any} wx @param {any} wy */
export function burns(wx,wy){ const m=cellAt(wx,wy); return (m===FIRE&&hero.up.heat<1)||(m===LAVA&&hero.up.heat<2); }
/** @param {any} cx @param {any} r */
export function colTop(cx,r){
  if(cx<0)cx=0; else if(cx>=GX)cx=GX-1;
  if(r<0)r=0;
  let i=r*GX+cx;
  while(r<GY&&grid[i]<4){r++;i+=GX;}
  return r;
}
/** @param {any} x @param {any} yRef @param {any} step */
export function floorAt(x,yRef,step){
  if(yRef<-3000){
    const st=yRef-step; let best=1e9;
    for(const o of ORBS){
      const dx=x-o.x;
      if(Math.abs(dx)>=o.r||Math.abs(o.y-yRef)>40000) continue;
      const hh=Math.sqrt(o.r*o.r-dx*dx);
      if(st<=o.y-hh){ if(o.y-hh<best) best=o.y-hh; }
      else if(st<o.y+hh) return st;
    }
    if(best<1e8) return best;
  }
  const r0=Math.floor((yRef-step-TOP)/CELL), fx=x/CELL-.5, c=Math.floor(fx), u=fx-c;
  const a=colTop(c,r0), b=colTop(c+1,r0);
  if(Math.abs(a-b)>2) return TOP+(u<.5?a:b)*CELL;
  return TOP+(a+(b-a)*u)*CELL;
}
/** @param {any} x */
export function surfaceY(x){ return TOP+colTop(Math.floor(x/CELL),2)*CELL; }
/** @param {any} cx @param {any} cy @param {any} t */
export function putUp(cx,cy,t){
  if(cx<1||cx>=GX-1) return;
  let n=0; while(n<8&&cy>1&&grid[cy*GX+cx]>=4){cy--;n++;}
  put(cx,cy,t);
}
/** @param {any} cx @param {any} cy @param {any} m @param {any} lf */
export function setCell(cx,cy,m,lf){ if(!inGrid(cx,cy)) return; const i=cy*GX+cx; grid[i]=m; lifeS(i,lf||0); if(m>0&&m<4) ext(cx,cy); }
