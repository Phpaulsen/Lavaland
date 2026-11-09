/* ---------- Schienen: Punkt und Richtung auf einer Bahn ---------- */
// PR 29g1. Unverändert aus legacy.js bewegt (gleiche Namen, ohne Port). trackAt läuft in jedem Bild (Wagen, Lift, Zeichnen) und rechnet nur; Q ist der wiederverwendete Rückgabepunkt.
import { clamp } from './const.js';

export const Q={x:0,y:0,tx:1,ty:0};
/** @param {any} T @param {any} s */
export function trackAt(T,s){
  const n=T.pts.length, f=clamp(s/8,0,n-1.001), i=Math.floor(f), u=f-i;
  const a=T.pts[i], b=T.pts[i+1], p=T.pts[Math.max(0,i-1)], q=T.pts[Math.min(n-1,i+2)];
  Q.x=a[0]+(b[0]-a[0])*u; Q.y=a[1]+(b[1]-a[1])*u;
  const tx=q[0]-p[0], ty=q[1]-p[1], l=Math.hypot(tx,ty)||1;
  Q.tx=tx/l; Q.ty=ty/l;
  return Q;
}
