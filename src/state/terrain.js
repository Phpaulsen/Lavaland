/* ---------- Welt beim Laden: Boden der Heimat (g0), harte Schichten und Zonen je Spalte, Oberkante des Schneebergs ---------- */
// PR 29g2a. Unverändert aus legacy.js bewegt (Anweisungen auf oberster Ebene, gleiche Reihenfolge). Das Modul exportiert nichts; es füllt die Felder
// aus state/world.js einmal beim Laden. state/home.js importiert es (legacy.js über home.js); die Schleifen laufen wie vorher, bevor legacy.js die Felder liest.
import { GX, CELL, TOP, GY, rawH, baseG, bump } from '../core/world/const.js';
import { g0, zS1, z4, zS2, zS3, grow0, rA, rB, rD, rH, rC, mtop } from './world.js';
import { SNC0, SNC1, msurf } from '../core/world/shape.js';

/* ---------- Welt ---------- */
for(let i=0;i<GX+2;i++) g0[i]=rawH(i*CELL);

/* Harte Schichten und Zonen in der Tiefe: Oberkante je Spalte. zS1, zS2, zS3 sind die harten Schichten, z4 trennt Pilzgrotten und Urzeit-Höhlen. */
for(let cx=0;cx<GX;cx++){ zS1[cx]=630+Math.round(3*Math.sin(cx*.027+1)); z4[cx]=960+Math.round(10*Math.sin(cx*.013+2)); zS2[cx]=1290+Math.round(4*Math.sin(cx*.022)); zS3[cx]=1640+Math.round(4*Math.sin(cx*.019+4)); }
for(let cx=0;cx<GX;cx++){
  const x=(cx+.5)*CELL;
  grow0[cx]=Math.ceil((rawH(x)-TOP)/CELL-.5);
  const gb=Math.ceil((baseG(x)-TOP)/CELL-.5), t=-bump(x)-8;
  rA[cx]=grow0[cx]+(t>0?Math.round(t/CELL)+2:0);
  rB[cx]=Math.max(rA[cx],gb+30+Math.round(5*Math.sin(cx*.05)));
  rD[cx]=gb+190+Math.round(8*Math.sin(cx*.021));
  rH[cx]=gb+400+Math.round(10*Math.sin(cx*.017+2));
  rC[cx]=GY-52+Math.round(4*Math.sin(cx*.03));
}
/* ---------- Schneeberg: Er steht auf dem alten Boden. grow0 bleibt der alte Boden, mtop ist die Oberkante vom Berg. Vorn und hinten führt eine Piste hinunter. ---------- */
for(let cx=0;cx<GX;cx++) mtop[cx]=cx<SNC0||cx>SNC1?grow0[cx]:Math.min(grow0[cx],Math.ceil((msurf((cx+.5)*CELL)-TOP)/CELL-.5));
