/* ---------- Zellen malen: Farbpaletten der Welt und der Länder, Farben der Tiefe, Paletten fremder Welten und das Zellbild ---------- */
// PR 29b2. Bewegt aus legacy.js. Die Paletten liegen als Modulbindungen hier, damit drawCells im heißen Pfad ohne Port liest; nur setPal schreibt sie.
// app/wire.js importiert pal und setPal (Port RM) und ruft drawCells über einen Einzeiler (Port DR). Über den Port CL kommt nur time.
import { clamp, CELL, GX, TOP, GY, EARTH, ROCK, ICE, WOOD, DEEP, HOT, CORE, GOLD, GEM, SNOW, SHELL } from '../core/world/const.js';
import { BT } from '../core/world/shape.js';
import { grid, grow0, bmx, bio2, bio, mtop, zS1, z4, zS2, zS3, rH, rD, rA, rB } from '../state/world.js';

/** @typedef {Record<string, any>} Port */

/** @param {any} r @param {any} g @param {any} b */
function c32(r,g,b){ return (255<<24|b<<16|g<<8|r)>>>0; }
/** @param {any} list */
export function pal(list){ return new Uint32Array(list.map(/** @param {any} c */ function(c){return c32(c[0],c[1],c[2]);})); }
const P_GRASS=pal([[88,181,72],[80,170,66],[96,188,80],[84,176,70]]), P_GRASS2=pal([[72,150,62],[66,142,58],[78,156,66],[70,146,60]]);
const P_EARTH=pal([[138,90,60],[130,84,56],[144,96,64],[134,88,58]]), P_ROCK=pal([[88,80,96],[80,73,88],[96,88,104],[84,76,92]]);
const P_ICE=pal([[190,234,247],[176,226,244],[214,244,251],[184,230,246]]);
const P_WALLE=pal([[74,50,38],[70,47,36],[78,53,40],[72,49,37]]), P_WALLR=pal([[46,42,52],[43,39,49],[49,45,55],[45,41,51]]);
const WOODS=[[226,87,76],[242,182,50],[79,154,216],[88,179,104],[216,165,106]];
const P_WOOD=pal(WOODS), P_WOODD=pal(WOODS.map(function(c){return [Math.floor(c[0]*.7),Math.floor(c[1]*.7),Math.floor(c[2]*.7)];}));
const C_BED=c32(30,26,34);
let P_DEEP=pal([[58,62,84],[52,56,78],[64,68,92],[55,59,80]]), P_HOT=pal([[104,50,44],[96,44,40],[114,56,46],[100,48,42]]);
const P_CORE=pal([[255,236,150],[255,214,90],[255,180,60],[255,246,205]]), P_GOLD=pal([[240,196,50],[228,180,40],[250,214,80],[236,190,46]]);
const P_GEM=pal([[80,220,230],[230,110,220],[120,240,170],[255,255,255]]);
let P_WALLD=pal([[28,30,44],[26,28,41],[31,33,48],[27,29,43]]), P_WALLH=pal([[58,26,24],[54,24,22],[62,28,26],[56,25,23]]);
const P_SNOW=pal([[226,238,249],[218,232,246],[234,243,251],[222,235,247]]), P_SNOWT=pal([[255,255,255],[250,253,255],[255,255,255],[246,251,255]]), P_WALLS=pal([[66,94,130],[62,89,124],[71,100,137],[64,91,127]]);
/* Jedes Land hat eigene Farben für Gras, Erde, Fels und Höhlenwände. Nummer 0 ist die Heimat. */
/** @param {any} c @param {any} f */
function pal4(c,f){ const q=/** @param {any} d */ function(d){ return [clamp(Math.round(c[0]*f+d),0,255),clamp(Math.round(c[1]*f+d),0,255),clamp(Math.round(c[2]*f+d),0,255)]; }; return pal([q(0),q(-8),q(7),q(-4)]); }
const PGR=[P_GRASS], PGR2=[P_GRASS2], PEA=[P_EARTH], PRO=[P_ROCK], PWE=[P_WALLE], PWR=[P_WALLR];
for(let b=1;b<BT.length;b++){ const T=BT[b]; PGR.push(pal4(T.cg,1)); PGR2.push(pal4(T.cg,.82)); PEA.push(pal4(T.ce,1)); PRO.push(pal4(T.cr,1)); PWE.push(pal4(T.ce,.5)); PWR.push(pal4(T.cr,.48)); }
/* Farben der Tiefe: Pilzgrotten, Urzeit-Höhlen, Kristalltiefen, Lavameer. Dazu die drei harten Schichten. */
let PZR=[pal4([44,104,110],1),pal4([156,120,74],1),pal4([92,80,160],1),pal4([62,42,48],1)], PZE=[pal4([84,170,120],1),pal4([206,170,104],1),pal4([150,180,235],1),pal4([120,56,44],1)], PZW=[pal4([16,44,52],1),pal4([58,42,28],1),pal4([24,20,58],1),pal4([30,12,14],1)];
/* Fremde Welten haben eigene Farben für die Tiefe. Die Erdfarben bleiben hier liegen. */
const EPAL={deep:P_DEEP,hot:P_HOT,wd:P_WALLD,wh:P_WALLH,zr:PZR,ze:PZE,zw:PZW};
/** @param {any} R */
export function setPal(R){
  if(!R){ P_DEEP=EPAL.deep; P_HOT=EPAL.hot; P_WALLD=EPAL.wd; P_WALLH=EPAL.wh; PZR=EPAL.zr; PZE=EPAL.ze; PZW=EPAL.zw; return; }
  const q=R.pal;
  P_DEEP=pal4(q.deep,1); P_HOT=pal4(q.hot,1); P_WALLD=pal4(q.deep,.4); P_WALLH=pal4(q.hot,.45);
  PZR=q.z.map(/** @param {any} z */ function(z){ return pal4(z[0],1); }); PZE=q.z.map(/** @param {any} z */ function(z){ return pal4(z[1],1); }); PZW=q.z.map(/** @param {any} z */ function(z){ return pal4(z[2],1); });
}
const PSH=[pal([[168,84,40],[146,70,32],[214,128,66]]),pal([[150,70,190],[128,56,168],[204,134,238]]),pal([[30,26,40],[20,16,28],[84,72,110]])];
const IMG=256, oc=document.createElement('canvas'); oc.width=IMG; oc.height=IMG;
const octx=/** @type {CanvasRenderingContext2D} */ (oc.getContext('2d')), img=octx.createImageData(IMG,IMG), px=new Uint32Array(img.data.buffer);

/** @param {Port} CL @param {CanvasRenderingContext2D} ctx @param {any} x0 @param {any} x1 @param {any} y0 @param {any} y1 */
export function drawCellsWith(CL,ctx,x0,x1,y0,y1){
  const cx0=clamp(Math.floor(x0/CELL),0,GX-1), cy0=clamp(Math.floor((y0-TOP)/CELL),0,GY-1);
  const cx1=Math.min(clamp(Math.floor(x1/CELL),0,GX-1),cx0+IMG-1), cy1=Math.min(clamp(Math.floor((y1-TOP)/CELL),0,GY-1),cy0+IMG-1);
  const nc=cx1-cx0+1, nr=cy1-cy0+1, ph=(CL.time*5)|0;
  for(let y=cy0;y<=cy1;y++){
    let o=(y-cy0)*IMG; const row=y*GX;
    for(let x=cx0;x<=cx1;x++,o++){
      const m=grid[row+x], hv=(Math.imul(x,73856093)^Math.imul(y,19349663))>>>13, h=hv&3, g=grow0[x], b=bmx[x]&&((hv>>>2)&255)<bmx[x]?bio2[x]:bio[x];
      let c;
      if(m<4) c=y<g?(y<mtop[x]?0:P_WALLS[h]):(y>=zS1[x]?PZW[y<z4[x]?0:y<zS2[x]?1:y<zS3[x]?2:3][h]:y>=rH[x]?P_WALLH[h]:y>=rD[x]?P_WALLD[h]:(y<rA[x]||y>=rB[x])?PWR[b][h]:PWE[b][h]);
      else if(m===EARTH){
        if(y<=g+6&&y>1&&grid[row-GX+x]<4) c=PGR[b][h];
        else if(y<=g+6&&y>2&&grid[row-2*GX+x]<4) c=PGR2[b][h];
        else c=y>=zS1[x]?PZE[y<z4[x]?0:y<zS2[x]?1:y<zS3[x]?2:3][h]:PEA[b][h];
      }
      else if(m===ROCK) c=y>=zS1[x]?PZR[y<z4[x]?0:y<zS2[x]?1:y<zS3[x]?2:3][h]:PRO[b][h];
      else if(m===ICE) c=P_ICE[h];
      else if(m===WOOD){ const k=((Math.imul(x>>2,40503)^Math.imul(y>>2,9973))>>>3)%5; c=((x&3)===0||(y&3)===0)?P_WOODD[k]:P_WOOD[k]; }
      else if(m===DEEP) c=P_DEEP[h];
      else if(m===HOT) c=P_HOT[h];
      else if(m===CORE) c=P_CORE[(x+y*2+ph)&3];
      else if(m===GOLD) c=P_GOLD[h];
      else if(m===GEM) c=P_GEM[(h+(ph>>1))&3];
      else if(m===SNOW) c=(y>1&&grid[row-GX+x]<4)?P_SNOWT[h]:P_SNOW[h];
      else if(m===SHELL) c=PSH[y<z4[x]?0:y<zS3[x]?1:2][(((x>>1)+(y>>1))&3)===0?2:h&1];
      else c=C_BED;
      px[o]=c;
    }
  }
  octx.putImageData(img,0,0,0,0,nc,nr);
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(oc,0,0,nc,nr,cx0*CELL,TOP+cy0*CELL,nc*CELL,nr*CELL);
}
