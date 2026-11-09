/* ---------- Unter Tage: Erkundungsnebel, Werkstatt-Stufen, Zonen und harte Schichten, Wissenstüren, Heimweg aus der Tiefe, Maschinen und Werkstatt-Nähe, Leuchtmarken speichern und Dunkelheit ---------- */
// PR 29e2. Bewegt aus legacy.js. Was die Funktionen vom übrigen Spiel brauchen, kommt über den Port ZO; die Speicherschlüssel K_FOG und K_MARKS kommen über den Port (Schichtregel).
// pzOpen läuft über einen Getter (Tests ersetzen es), canBuild über den Port (Rückruf). In app/wire.js bleiben marks (marksWith gibt es schon in systems/deep.js) und skyLim (die Weltentstehung ruft es vor dem Port). app/wire.js ruft alle Funktionen über Einzeiler.
import { clamp, TOP, CELL, GX, SH, BED, KEEPR } from '../core/world/const.js';
import { realm, RC0, RC1 } from '../state/realm.js';
import { bix, zS3, zS2, z4, zS1, rH, rD, grid } from '../state/world.js';
import { BEND, LANDX, LIFTX, vFloor, WSX } from '../core/world/shape.js';
import { ST } from '../state/facade.js';
import { ground, surfaceY } from '../state/queries.js';
import { hero, P, parked, cam } from '../state/game.js';
import { sfx, jingle } from '../audio/sound.js';
import { lifeS } from '../state/sim.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} ZO @param {any} y */
export function fRowWith(ZO,y){ return clamp(Math.floor((y-TOP)/CELL/ZO.FGT),0,ZO.FGH-1); }
/** @param {Port} ZO */
export function fogKeyWith(ZO){ return ZO.K_FOG+(realm?'-'+realm:''); }
/** @param {Port} ZO */
export function fogArrWith(ZO){
  const k=fogKeyWith(ZO); if(ZO.FOG[k]) return ZO.FOG[k];
  const a=new Uint8Array(Math.ceil(ZO.FGW*ZO.FGH/8)); let got=false;
  try{ const b=localStorage.getItem(k); if(b){ const t=atob(b); if(t.length===a.length){ for(let i=0;i<t.length;i++) a[i]=t.charCodeAt(i); got=true; } } }catch(_){}
  ZO.FOG[k]=a; if(!got) fogSeedWith(ZO,a);
  return a;
}
/** @param {Port} ZO @param {any} a @param {any} tx @param {any} ty */
export function fogSetWith(ZO,a,tx,ty){ if(tx<0||ty<0||tx>=ZO.FGW||ty>=ZO.FGH) return; const i=ty*ZO.FGW+tx; if(!(a[i>>3]&(1<<(i&7)))){ a[i>>3]|=1<<(i&7); ZO.fogDirty=true; } }
/** @param {Port} ZO @param {any} a @param {any} tx @param {any} ty */
export function fogHasWith(ZO,a,tx,ty){ const i=ty*ZO.FGW+tx; return !!(a[i>>3]&(1<<(i&7))); }
/* Alte Spielstände: Oberfläche entdeckter Länder und der Aufzugschacht bis zur erreichten Zone sind schon bekannt. */
/** @param {Port} ZO @param {any} a */
export function fogSeedWith(ZO,a){
  const c0=Math.floor(RC0/ZO.FGT), c1=Math.min(ZO.FGW-1,Math.floor(Math.min(RC1,ZO.genF)/ZO.FGT));
  for(let tx=c0;tx<=c1;tx++){
    const x=(tx+.5)*ZO.FGT*CELL, bi=bix[clamp(Math.floor(x/CELL),0,GX-1)];
    if(!realm&&!(x<BEND||(bi&&ST.seen[bi-1]))) continue;
    if(realm&&Math.abs(x-LANDX)>3000) continue;
    const gy=fRowWith(ZO,ground(x)); for(let ty=0;ty<=gy+1;ty++) fogSetWith(ZO,a,tx,ty);
  }
  if(!realm&&hero.zn>0){ const tx=Math.floor(LIFTX/CELL/ZO.FGT), r=ZO.ZN[Math.min(hero.zn,ZO.ZN.length-1)].row; for(let ty=0;ty<=Math.floor(r/ZO.FGT)+1;ty++){ fogSetWith(ZO,a,tx,ty); fogSetWith(ZO,a,tx-1,ty); } }
  ZO.fogDirty=true;
}
/** @param {Port} ZO */
export function fogSaveWith(ZO){
  if(!ZO.fogDirty||ST.frozen) return; ZO.fogDirty=false;
  for(const k in ZO.FOG){ let t=''; const a=ZO.FOG[k]; for(let i=0;i<a.length;i+=4096) t+=String.fromCharCode.apply(null,a.subarray(i,i+4096)); try{ localStorage.setItem(k,btoa(t)); }catch(_){} }
}
/** @param {Port} ZO @param {any} g */
export function gearLvWith(ZO,g){ return (g==='hs'?hero.up.heat:hero[g])|0; }
/** @param {Port} ZO @param {any} g @param {any} v */
export function gearSetWith(ZO,g,v){ if(g==='hs') hero.up.heat=v; else hero[g]=v; }
/** @param {Port} ZO @param {any} k */
export function stationYWith(ZO,k){ return k?ZO.ZN[k].y:ground(LIFTX); }
/** @param {Port} ZO @param {any} x @param {any} y */
export function zoneAtWith(ZO,x,y){
  if(y<700) return 0;
  const cx=clamp(Math.floor(x/CELL),0,GX-1), cy=Math.floor((y-TOP)/CELL);
  return cy>=zS3[cx]+SH?6:cy>=zS2[cx]+SH?5:cy>=z4[cx]?4:cy>=zS1[cx]+SH?3:cy>=rH[cx]?2:cy>=rD[cx]?1:0;
}
/* Die harten Schichten: Ohne den passenden Bohrer prallt alles ab. */
/** @param {Port} ZO @param {any} i */
export function shellOkWith(ZO,i){
  const y=(i/GX)|0, cx=i-y*GX, need=y<z4[cx]?1:y<zS3[cx]?2:3;
  if(hero.dr>=need) return true;
  if(ZO.time>ZO.klT){
    ZO.klT=ZO.time+.7;
    const wx=cx*CELL+3, wy=TOP+y*CELL;
    for(let k=0;k<5;k++) ZO.spawn(5,wx,wy,(Math.random()-.5)*200,-60-Math.random()*140,.5,2);
    ZO.shout(wx,wy-22,'KLONK!','#ffd23f'); sfx('tick'); ZO.shake=Math.max(ZO.shake,.1);
  }
  if(ZO.time>ZO.klS||ZO.klN!==need){
    ZO.klS=ZO.time+90; ZO.klN=need;
    ZO.say('','Klonk! Diese Schicht ist zu hart. Dafür brauchst du den Bohrer Stufe '+need+'. Schau in der Werkstatt nach, was dafür fehlt.');
    ZO.pulse('btn-lab');
  }
  return false;
}
/** @param {Port} ZO @param {any} v */
export function doorColsWith(ZO,v){ return [Math.floor((v.x-v.rx-20)/CELL),Math.floor((v.x-v.rx*.55)/CELL)]; }
/** @param {Port} ZO @param {any} v */
export function doorShutWith(ZO,v){ const c=Math.floor((v.x-v.rx-8)/CELL); return c<ZO.genF&&grid[(vFloor(v)-3)*GX+c]===BED; }
/** @param {Port} ZO */
export function nearDoorWith(ZO){ for(const v of ZO.VAULTS) if(Math.abs(P.x-(v.x-v.rx-28))<46&&Math.abs(P.y-v.fy)<44&&doorShutWith(ZO,v)) return v; return null; }
/** @param {Port} ZO @param {any} v */
export function doorPzWith(ZO,v){ return v.id%2?ZO.DOORPZ[(v.id>>1)%ZO.DOORPZ.length]:''; }
/** @param {Port} ZO @param {any} v */
export function doorAskWith(ZO,v){
  if(!ZO.$('quiz').hidden||!ZO.$('pz').hidden) return;
  const pt=doorPzWith(ZO,v);
  if(pt){ ZO.pzOpen({t:pt,zb:1,quiz:true,door:v}); return; }
  ZO.doorQ={v:v,n:0}; ZO.$('quiz-pz').hidden=true;
  ZO.openQuiz(null);
  ZO.banner('🚪 ○○○',1800);
}
/** @param {Port} ZO @param {any} v */
export function doorOpenWith(ZO,v){
  const c=doorColsWith(ZO,v), fr=vFloor(v);
  for(let cx=c[0];cx<=c[1];cx++) for(let cy=fr-8;cy<fr;cy++){ grid[cy*GX+cx]=0; lifeS(cy*GX+cx,0); }
  ZO.scanMobile(); sfx('pop'); jingle(); ZO.confetti(v.x-v.rx,v.fy-30);
  ZO.say('','Die Wissenstür ist offen! Drinnen liegt ein Schatz.'); ZO.dayAdd('z','🚪'); ZO.campSoon();
}
/* Rund um Werkstatt und Aufzug stehen keine Bäume. */
/** @param {Port} ZO */
export function deepHomeWith(ZO){ for(let i=0;i<ST.NT0&&i<ZO.trees.length;i++){ const t=ZO.trees[i]; if(Math.abs(t.x-WSX)<64||Math.abs(t.x-LIFTX)<50||Math.abs(t.x-1330)<30) t.state=3; } }
/* Nach dem Laden: Was in der alten, breiteren Welt hinter der neuen Grenze lag, kommt nach Hause. */
/** @param {Port} ZO @param {any} sv */
export function deepRestoreWith(ZO,sv){
  ST.matGot=sv.matGot||{}; ST.pzGot=sv.pzGot||{}; ZO.guide=null; ZO.dkA=0;
  if(sv.v<4){
    /* Wer auf dem alten Erdkern stand, steht jetzt knapp über der neuen harten Schicht. */
    const deep=TOP+KEEPR*CELL-14;
    if(P.y>deep) P.y=deep;
    for(const n in parked){ const o=parked[n]; if(o&&o.y>deep) o.y=deep; }
  }
  if(sv.v===3||ZO.cutX){
    const lim=sv.v===3?ZO.genF*CELL-300:ZO.cutX;
    if(P.x>lim){ P.x=820; P.y=surfaceY(820)-2; }
    let k=0;
    for(const n in parked){ const o=parked[n]; if(o&&o.x>lim){ o.x=560+k*46; o.y=surfaceY(o.x); o.vy=0; o.ang=0; k++; } }
    ST.props=ST.props.filter(function(o){ return o.x<lim; });
    ST.tracks=ST.tracks.filter(function(T){ return T.maxX<lim; });
    ST.hidden=ST.hidden.filter(function(h){ return h.x<lim; });
  }
  deepHomeWith(ZO);
}
/** @param {Port} ZO @param {any} g */
export function canBuildWith(ZO,g){
  const t=gearLvWith(ZO,g); if(t>=3) return false;
  const rc=ZO.GEAR[g].rc[t];
  for(const k in rc) if((hero.mat[k]|0)<rc[k]) return false;
  return true;
}
/** @param {Port} ZO @param {any} talk */
export function labBadgeWith(ZO,talk){
  const can=ZO.GEARK.some(ZO.canBuild), el=ZO.$('lab-n');
  if(el) el.hidden=!can;
  if(can&&!ZO.labHi&&talk){ ZO.later(2.2,function(){ ZO.say('','Du hast genug gesammelt! In der Werkstatt kannst du jetzt etwas Neues bauen.'); ZO.pulse('btn-lab'); }); }
  ZO.labHi=can;
}
/** @param {Port} ZO */
export function nextMachWith(ZO){
  let b=null, bd=1e12; const lim=(ZO.genF-8)*CELL;
  for(const m of ZO.MACH){
    if(ST.pzGot[m.id]||m.y!==m.y||m.x>lim) continue;
    const d=Math.abs(m.x-P.x)+2.5*Math.abs(m.y-P.y);
    if(d<bd){ bd=d; b=m; }
  }
  return b;
}
/** @param {Port} ZO */
export function nearMachWith(ZO){ for(const m of ZO.MACH) if(m.y===m.y&&Math.abs(P.x-m.x)<34&&Math.abs(P.y-m.y)<52) return m; return null; }
/** @param {Port} ZO */
export function nearCabWith(ZO){ if(Math.abs(P.x-LIFTX)>46) return -1; for(let k=0;k<ZO.ZN.length;k++) if(Math.abs(P.y-stationYWith(ZO,k))<64) return k; return -1; }
/** @param {Port} ZO */
export function atLabWith(ZO){ return Math.abs(P.x-WSX)<110&&Math.abs(P.y-ground(WSX))<120; }
/** @param {Port} ZO */
export function deepIconWith(ZO){ if(!P.on) return ''; return nearMachWith(ZO)||nearDoorWith(ZO)?'pz':nearCabWith(ZO)>=0?'lift':Math.abs(P.x-WSX)<44&&Math.abs(P.y-ground(WSX))<60?'lab':''; }
/** @param {Port} ZO */
export function deepActWith(ZO){
  if(!P.on) return false;
  const m=nearMachWith(ZO);
  if(m){ ZO.pzOpen(m); return true; }
  const v=nearDoorWith(ZO);
  if(v){ doorAskWith(ZO,v); return true; }
  if(nearCabWith(ZO)>=0){ ZO.openMine(); return true; }
  if(Math.abs(P.x-WSX)<44&&Math.abs(P.y-ground(WSX))<60){ ZO.openLab(); return true; }
  return false;
}
/** @param {Port} ZO @param {any} wx @param {any} wy */
export function deepTapWith(ZO,wx,wy){
  const gy=ground(WSX);
  if(Math.abs(wx-WSX)<60&&wy>gy-100&&wy<gy+8&&Math.abs(cam.y-gy)<700){ ZO.openLab(); return true; }
  if(Math.abs(wx-LIFTX)<34) for(let k=0;k<ZO.ZN.length;k++){
    const y=stationYWith(ZO,k);
    if(wy<y-(k?58:112)||wy>y+8) continue;
    if(Math.hypot(P.x-LIFTX,P.y-y)<190) ZO.openMine(); else ZO.say('','Geh erst zum Aufzug hin.');
    return true;
  }
  for(const v of ZO.VAULTS){
    if(Math.abs(wx-(v.x-v.rx-8))>26||wy<v.fy-56||wy>v.fy+4||!doorShutWith(ZO,v)) continue;
    if(Math.hypot(P.x-v.x+v.rx,P.y-v.fy)<200) doorAskWith(ZO,v); else ZO.say('','Geh erst näher an die Tür heran.');
    return true;
  }
  for(const m of ZO.MACH){
    if(m.y!==m.y||Math.abs(wx-m.x)>28||wy<m.y-74||wy>m.y+8) continue;
    if(Math.hypot(P.x-m.x,P.y-m.y)<360) ZO.pzOpen(m); else ZO.say('','Geh erst näher an die Rätselmaschine heran.');
    return true;
  }
  return false;
}
/* Pfeil zur nächsten Rätselmaschine (Zahnrad), zur Werkstatt oder zum nächsten Planetenkern. */
/** @param {Port} ZO @param {any} k */
export function matWhereWith(ZO,k){
  if(k==='zr'){ const m=nextMachWith(ZO); return m?[m.x,m.y-52]:null; }
  if(realm){
    /* Auf fremden Welten: zum nächsten Stück, sonst nach oben, heim zur Erde. */
    let b=null, bd=1e12;
    if(k!=='lab') for(const m of ZO.MATS){ if(m.k!==k||ST.matGot[m.id]) continue; const d=Math.hypot(m.x-P.x,m.y-P.y); if(d<bd){ bd=d; b=m; } }
    return b?[b.x,b.y]:[P.x,P.y-500];
  }
  if(k==='lab') return [WSX,ground(WSX)-96];
  let b=null, bd=1e12;
  for(const m of ZO.MATS){ if(m.k!==k||ST.matGot[m.id]) continue; const d=Math.hypot(m.x-P.x,m.y-P.y); if(d<bd){ bd=d; b=m; } }
  return b?[b.x,b.y]:null;
}
/** @param {Port} ZO */
export function guidePointWith(ZO){ return ZO.guide?matWhereWith(ZO,ZO.guide.k):null; }
/** @param {Port} ZO */
export function mkKeyWith(ZO){ return ZO.K_MARKS+(realm?'-'+realm:''); }
/** @param {Port} ZO */
export function mkSaveWith(ZO){ try{ localStorage.setItem(mkKeyWith(ZO),JSON.stringify(ZO.marks())); }catch(_){} }
/* Unter der Erde wird es dunkel. Die Lampe und alles, was leuchtet, machen helle Flecken. Ganz schwarz wird es nie. */
/** @param {Port} ZO @param {any} y */
export function darkAtWith(ZO,y){
  if(hero.lp>=3) return 0;
  const d=y-900;
  if(d<=0) return 0;
  return d<1700?.46*d/1700:.46+.3*Math.min(1,(d-1700)/1500);
}
