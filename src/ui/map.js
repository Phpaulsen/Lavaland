/* ---------- Karten, Werkstatt und Aufzug: Reisekarte, Erkundungskarte, goldene Eier, Werkstatt von Professor Zahnrad, Aufzugskarten ---------- */
// PR 26. Bewegt aus legacy.js. Nebel und Leuchtmarken speichern (fogArr, fogSet, marks) und die Baupläne (GEAR, canBuild, gearSet) bleiben in legacy.js.
// Was die Fenster vom übrigen Spiel brauchen, kommt über den Port LM.
import { LANDX, BT, WSX, LIFTX } from '../core/world/shape.js';
import { ST } from '../state/facade.js';
import { bix, grid } from '../state/world.js';
import { clamp, CELL, GX, TOP, TAU } from '../core/world/const.js';
import { P, cam, hero } from '../state/game.js';
import { tone, jingle, sfx } from '../audio/sound.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} LM */
export function renderMapWith(LM){
  const R=LM.rlm(), L=/** @type {any[]} */ (R?[{e:R.e,x:LANDX,n:'zum Landeplatz',k:-2}]:[{e:'🏠',x:820,n:'nach Hause',k:-2},{e:'⛷️',x:5700,n:'zum Schneeberg',k:-1}]), per=11;
  for(const b of ST.BIO) if(ST.seen[b.i]) L.push({e:BT[b.t].e,x:b.x0+240,n:BT[b.t].to,k:b.i,num:b.n+1});
  /* Leuchtmarken sind Reiseziele: Dort war man schon, also umgeht das keinen Bohrer. */
  LM.marks().forEach(/** @param {any} m @param {any} i */ function(m,i){ L.push({e:'🔆',x:m[0],y:m[1],n:'zur Leuchtmarke',k:'m'+i,num:i+1}); });
  const pages=Math.max(1,Math.ceil(L.length/per)); if(LM.mapPg>=pages) LM.mapPg=0;
  const here=bix[clamp(Math.floor(P.x/CELL),0,GX-1)]-1, cur=here>=0?here:(P.x>5600&&!R?-1:-2);
  let h='';
  L.slice(LM.mapPg*per,LM.mapPg*per+per).forEach(function(q){
    h+='<button class="card place'+(q.k===cur?' cur':'')+'" data-go="'+q.x+'"'+(q.y!=null?' data-gy="'+q.y+'"':'')+' data-say="'+q.n+'" aria-label="Reise '+q.n+'"><span aria-hidden="true">'+q.e+'</span>'+(q.num>1?'<small>'+q.num+'</small>':'')+'</button>';
  });
  if(pages>1) h+='<button class="card place" data-go="next" aria-label="Weitere Orte zeigen"><span aria-hidden="true">➡️</span></button>';
  else if(LM.nextLand()) h+='<button class="card place shut" data-go="" aria-label="Noch nicht entdeckt"><span aria-hidden="true">❓</span></button>';
  LM.$('map-cards').innerHTML=h;
}
/** @param {Port} LM */
export function renderFogWith(LM){
  const a=LM.fogArr(), cv=LM.$('map-c'), S=4, c0=Math.floor(LM.RC0/LM.FGT), c1=Math.min(LM.FGW-1,Math.floor(LM.RC1/LM.FGT)), w=c1-c0+1, dpr=Math.min(2,window.devicePixelRatio||1);
  /* Nur so tief zeigen, wie schon erkundet ist, plus ein Stück Dunkel darunter. */
  let deep=0; for(let ty=LM.FGH-1;ty>0&&!deep;ty--) for(let tx=c0;tx<=c1;tx++) if(LM.fogHas(a,tx,ty)){ deep=ty; break; }
  const FH=Math.min(LM.FGH,Math.max(16,deep+5));
  cv.width=w*S*dpr; cv.height=FH*S*dpr; cv.style.width=(w*S)+'px'; cv.style.height=(FH*S)+'px';
  const g=cv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); g.fillStyle='#151522'; g.fillRect(0,0,w*S,FH*S);
  for(let tx=c0;tx<=c1;tx++){
    const cx=Math.min(GX-1,tx*LM.FGT+(LM.FGT>>1)), gr=(LM.ground(cx*CELL)-TOP)/CELL;
    for(let ty=0;ty<FH;ty++){
      if(!LM.fogHas(a,tx,ty)) continue;
      const cy=ty*LM.FGT+(LM.FGT>>1); let m=cx<LM.genF?grid[cy*GX+cx]:0;
      g.fillStyle=m?(LM.FCOL[m]||'#666'):(cy<gr?'#8fcdf0':'#2c2638');
      g.fillRect((tx-c0)*S,ty*S,S,S);
    }
  }
  g.font='12px sans-serif'; g.textAlign='center'; g.textBaseline='middle';
  const mark=/** @param {any} x @param {any} y @param {any} e */ function(x,y,e){ const tx=Math.floor(x/CELL/LM.FGT), ty=LM.fRow(y); if(tx<c0||tx>c1||!LM.fogHas(a,tx,ty)) return; g.fillText(e,(tx-c0+.5)*S,ty*S+S/2-4); };
  for(const m of LM.MACH) if(!ST.pzGot[m.id]&&!m.gone&&m.y===m.y) mark(m.x,m.y-20,'⚙️');
  for(const v of LM.VAULTS) if(LM.doorShut(v)) mark(v.x,v.fy-20,'🚪');
  for(const m of LM.marks()) mark(m[0],m[1]-14,'🔆');
  if(!LM.realm) mark(WSX,LM.ground(WSX)-30,'🏠'); else mark(LANDX,LM.ground(LANDX)-30,'🚀');
  const px=(P.x/CELL/LM.FGT-c0)*S, py=clamp((P.y-TOP)/CELL/LM.FGT,0,FH)*S;
  g.fillStyle='#ff3b3b'; g.strokeStyle='#fff'; g.lineWidth=2; g.beginPath(); g.arc(px,py,5,0,TAU); g.fill(); g.stroke();
  const v=LM.$('map-v'); requestAnimationFrame(function(){ v.scrollLeft=px-v.clientWidth/2; });
}
/** @param {Port} LM @param {any} e */
export function mapClickWith(LM,e){
  const b=e.target.closest('[data-go]'); if(!b) return;
  const go=b.dataset.go;
  if(go==='next'){ LM.mapPg++; renderMapWith(LM); return; }
  if(go===''){ LM.speak('Weiter rechts liegen noch mehr Länder. Die musst du erst entdecken.'); return; }
  LM.$('map').hidden=true;
  if(b.dataset.gy){ if(P.mode!=='walk') LM.setMode('walk'); LM.grow(+go+3200); P.x=+go; P.y=+b.dataset.gy-2; P.vx=0; P.vy=0; cam.x=P.x; cam.y=P.y-80; LM.smoke(P.x,P.y-20,6); LM.speak('Zur Leuchtmarke!'); return; }
  LM.teleport(+go); LM.speak('Auf '+b.dataset.say+'!');
}
/** @param {Port} LM */
export function renderEggsWith(LM){
  LM.$('eggs').innerHTML='<span class="eggn">'+LM.EGGSVG+'<b>'+(hero.eggs|0)+'</b></span>'+LM.WEAR.map(/** @param {any} q */ function(q){
    const own=q[0]<0?!!hero.own[q[2]]:(hero.eggs|0)>=q[0], on=hero.pet===q[2]||hero.hat===q[2]||(q[1]==='trail'&&hero.trail);
    if(q[0]<0&&!own) return '';
    const pic=q[1]==='pet'?LM.PETS[q[2]]:q[1]==='hat'?LM.EHAT[q[2]]:'🌈';
    return '<button class="'+(own?(on?'on':''):'q')+'" data-wear="'+q[2]+'" aria-label="'+(own?q[3]:'Für '+q[0]+' goldene Eier')+'">'+(own?pic:q[0])+'</button>';
  }).join('');
}
/** @param {Port} LM @param {any} e */
export function eggClickWith(LM,e){
  const b=e.target.closest('[data-wear]'); if(!b) return;
  const q=LM.WEAR.find(/** @param {any} w */ function(w){return w[2]===b.dataset.wear;}), own=q[0]<0?!!hero.own[q[2]]:(hero.eggs|0)>=q[0];
  if(!own){ tone([170],'sawtooth'); LM.speak('Dafür brauchst du '+q[0]+' goldene Eier.'); return; }
  hero.trail=!hero.trail;
  tone([660]); LM.saveHero(); renderEggsWith(LM);
}
/** @param {Port} LM @param {any} g */
export function missingWith(LM,g){
  const t=LM.gearLv(g), rc=LM.GEAR[g].rc[t], out=[];
  for(const k in rc){ const d=rc[k]-(hero.mat[k]|0); if(d>0) out.push(d+' '+LM.MAT[k][d>1?2:1]); }
  return out.length>1?out.slice(0,-1).join(', ')+' und '+out[out.length-1]:out[0]||'';
}
/** @param {Port} LM */
export function renderLabWith(LM){
  let h='';
  for(const k of LM.MATK){
    const n=hero.mat[k]|0, kn=!!hero.mk[k]||n>0;
    h+='<button class="'+(kn?'':'none')+'" data-mat="'+k+'" aria-label="'+LM.MAT[k][1]+': '+n+'"><span aria-hidden="true">'+LM.MAT[k][0]+'</span><b>'+n+'</b></button>';
  }
  LM.$('lab-inv').innerHTML=h;
  h='';
  for(const g of LM.GEARK){
    const G=LM.GEAR[g], t=LM.gearLv(g), rc=t<3?G.rc[t]:null, can=LM.canBuild(g);
    h+='<div class="rc"><button class="tl" data-tl="'+g+'" aria-label="'+G.n+', Stufe '+t+' von 3"><span aria-hidden="true">'+G.e+'</span><i aria-hidden="true">'+'●'.repeat(t)+'○'.repeat(3-t)+'</i></button><div class="need">';
    if(rc) for(const k in rc){
      const n=hero.mat[k]|0;
      h+='<button class="chipm '+(n>=rc[k]?'ok':'no')+'" data-mat="'+k+'" aria-label="'+LM.MAT[k][1]+': '+Math.min(n,rc[k])+' von '+rc[k]+'"><span aria-hidden="true">'+LM.MAT[k][0]+'</span>'+Math.min(n,rc[k])+'/'+rc[k]+'</button>';
    }
    h+='</div><button class="mk '+(t>=3?'max':can?'go':'wait')+'" data-mk="'+g+'" aria-label="'+G.n+(t>=3?' ist fertig':' bauen')+'">'+(t>=3?'✓':'🔨')+'</button></div>';
  }
  LM.$('lab-rcp').innerHTML=h;
  h='';
  for(const p of LM.PZON){ const l=hero.pz[p.id]|0; h+='<button data-pzt="'+p.id+'" aria-label="'+p.n+': Stufe '+(l+1)+' von 10"><span aria-hidden="true">'+p.e+'</span><i><b style="width:'+((l+1)*10)+'%"></b></i></button>'; }
  LM.$('lab-brain').innerHTML=h;
  LM.$('lab-taf').innerHTML='<span aria-hidden="true">🔢</span><span aria-hidden="true">💠</span>'+(hero.mat.ms|0);
}
/** @param {Port} LM */
export function openLabWith(LM){
  renderLabWith(LM); LM.$('lab').hidden=false; ST.talkLock=0;
  if(!hero.deep){ hero.deep=true; LM.saveHero(); LM.speak('Das ist die Werkstatt von Professor Zahnrad. Hier siehst du, was du für einen besseren Bohrer, eine stärkere Rakete, eine hellere Lampe und einen Schutz gegen Feuer brauchst. Tippe auf ein Bild, dann sage ich dir, wo du es findest.'); }
}
/** @param {Port} LM @param {any} g */
export function labBuildWith(LM,g){
  const G=LM.GEAR[g], t=LM.gearLv(g);
  if(t>=3){ LM.speak(G.n+' ist schon ganz fertig.'); return; }
  if(!LM.canBuild(g)){ tone([170],'sawtooth'); LM.speak('Für '+G.art+' fehlen noch '+missingWith(LM,g)+'. Tippe auf ein Bild, dann sage ich dir, wo du es findest.'); return; }
  if(!LM.atLab()){ tone([170],'sawtooth'); LM.guide={k:'lab',t:LM.time+120}; LM.speak('Du hast alles zusammen! Bauen kann aber nur Professor Zahnrad. Komm zur Werkstatt. Sie steht bei dir zu Hause.'); return; }
  const rc=G.rc[t];
  for(const k in rc) hero.mat[k]-=rc[k];
  LM.gearSet(g,t+1); LM.saveHero(); LM.guide=null;
  LM.$('lab').hidden=true; LM.confetti(P.x,P.y); jingle();
  LM.banner(G.e+' '+'●'.repeat(t+1)+'○'.repeat(2-t),2600);
  LM.say('Professor Zahnrad',G.done[t]);
  LM.labBadge(false);
}
/** @param {Port} LM */
export function renderMineWith(LM){
  const cur=LM.nearCab(); let h='';
  for(let k=0;k<LM.ZN.length;k++){
    const ok=k<=hero.zn;
    h+='<button class="card place'+(k===cur?' cur':'')+(ok?'':' shut')+'" data-st="'+k+'" aria-label="'+(ok?'Fahre in '+LM.ZN[k].n:'Noch verschlossen: '+LM.ZN[k].n)+'"><span aria-hidden="true">'+(ok?LM.ZN[k].e:'🔒')+'</span>'+(ok?'':'<small aria-hidden="true">'+LM.ZN[k].e+'</small>')+'</button>';
  }
  LM.$('mine-cards').innerHTML=h;
}
/** @param {Port} LM */
export function openMineWith(LM){ if(LM.liftBusy) return; renderMineWith(LM); LM.$('mine').hidden=false; ST.talkLock=0; LM.speak('Wohin soll der Aufzug fahren?'); }
/** @param {Port} LM @param {any} k */
export function liftGoWith(LM,k){
  if(LM.liftBusy) return;
  const f=LM.$('fade'), m=P.mode;
  if(m!=='walk'&&m!=='car'&&m!=='bagger'&&m!=='loader'&&m!=='dumper'&&m!=='tbm') LM.setMode('walk');
  LM.liftBusy=true; f.hidden=false; void f.offsetWidth; f.classList.add('on'); sfx('whoosh');
  setTimeout(function(){
    P.x=LIFTX; P.y=LM.stationY(k)-2; P.vx=0; P.vy=0; P.on=false; P.chute=false; P.ang=0;
    cam.x=P.x; cam.y=P.y-80; LM.dkA=LM.darkAt(cam.y); LM.scanMobile();
    f.classList.remove('on');
    setTimeout(function(){ f.hidden=true; LM.liftBusy=false; },380);
    LM.speak(k?'Station '+LM.ZN[k].s+'.':'Wieder zu Hause.');
  },430);
}
