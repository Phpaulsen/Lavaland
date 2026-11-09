/* ---------- Bedienung verdrahten: Tastenbilder in die Knöpfe, Fahrzeug- und Werkzeugkarten, Klicks auf Leiste, Menü, Fenster, Hand, Ton, Vollbild, Umzug, Neue Welt ---------- */
// PR 29g2b. Die Anweisungen auf oberster Ebene aus legacy.js stehen unverändert in uiBindWith, legacy.js ruft es an der alten Stelle (nach den Deklarationen, die
// auch außerhalb gelesen werden: VEH, TOOLS, MODES, PAINT, ghostEl, actEl, lefty, bakIn, DE). Alles aus legacy.js kommt über den Port UB.
import { QI, IC, K } from '../ui/icons.js';
import { keys, P, hero } from '../state/game.js';
import { ST } from '../state/facade.js';
import { sfx, AU, speakStop } from '../audio/sound.js';
import { newSeed } from '../state/realm.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} UB */
export function uiBindWith(UB){
const LOCK='<span class="lock">'+UB.svg24(QI.lock)+'</span>';
UB.$('grid').innerHTML=
  '<button class="btn veh cool" id="btn-veh" aria-label="Fahrzeug wählen">'+UB.svg24(IC.walk)+LOCK+'</button>'+
  '<button class="btn cool" id="btn-tool" aria-label="Werkzeug wählen" aria-pressed="false">'+UB.svg24(QI.hand)+LOCK+'</button>'+
  '<button class="btn" id="btn-map" aria-label="Karte: zu einem entdeckten Land reisen">'+UB.svg24(QI.map)+'</button>'+
  '<button class="btn" id="btn-lab" aria-label="Werkstatt: Bohrer, Rakete, Lampe und Schutz bauen">'+UB.svg24(QI.lab)+'<span class="badge" id="lab-n" hidden>!</span></button>'+
  '<button class="btn" id="btn-finds" aria-label="Funde ansehen">'+UB.svg24(QI.gem)+'<span class="badge" id="found" hidden>0</span></button>'+
  '<button class="btn" id="btn-menu" aria-label="Menü: Speichern, Ton, neue Welt, Vollbild, Spielstand umziehen">'+UB.svg24(QI.gear)+'</button>';
UB.$('save').innerHTML=UB.svg24(QI.save); UB.$('reset').innerHTML=UB.svg24(IC.reset); UB.$('exp').innerHTML=UB.svg24(QI.exp); UB.$('imp').innerHTML=UB.svg24(QI.imp);
UB.$('imp-ask').innerHTML=UB.svg24(QI.imp)+'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h14m-6-6l6 6-6 6" stroke="'+K+'" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>'+UB.svg24(IC.blocks);
UB.$('ask').innerHTML=UB.svg24(IC.blocks)+'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h14m-6-6l6 6-6 6" stroke="'+K+'" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>'+UB.svg24(IC.reset);
UB.$('garage-cards').innerHTML=UB.VEH.map(/** @param {any} v */ function(v){
  const cool=v[0]!=='walk';
  return '<button class="card pick'+(cool?' cool':'')+'" id="mode-'+v[0]+'" data-mode="'+v[0]+'" aria-label="'+v[1]+'" aria-pressed="false">'+UB.svg24(IC[v[0]])+(cool?LOCK:'')+'</button>';
}).join('');
const toolCard=/** @param {any} t */ function(t){
  const cool=!UB.HANDT[t[0]];
  return '<button class="card pick'+(cool?' cool':'')+'" id="tool-'+t[0]+'" data-tool="'+t[0]+'" aria-label="'+t[1]+'" aria-pressed="false">'+UB.svg24(IC[t[0]])+(cool?LOCK:'')+(t[0]==='tnt'?'<span class="badge" id="tnt-n" hidden>0</span>':'')+'</button>';
};
UB.$('tool-cards').innerHTML=UB.TOOLS.filter(/** @param {any} t */ function(t){ return !UB.PAINT[t[0]]; }).map(/** @param {any} t @param {any} i */ function(t,i){
  return (i===1?'<button class="card pick cool" id="tool-magic" aria-label="Zauberkasten: Lava, Feuer, Wasser, Eis, Erde oder Schnee malen" aria-pressed="false"><span class="mg" aria-hidden="true">🪄</span>'+LOCK+'</button>':'')+toolCard(t);
}).join('');
UB.$('magic-cards').innerHTML=UB.TOOLS.filter(/** @param {any} t */ function(t){ return UB.PAINT[t[0]]; }).map(toolCard).join('');
window.addEventListener('pointerdown',function(){ UB.ghostEl=null; },true);
window.addEventListener('keydown',function(){ UB.ghostEl=null; },true);
window.addEventListener('click',function(e){
  const g=UB.ghostEl; UB.ghostEl=null;
  if(g&&!g.contains(e.target)){ e.stopPropagation(); e.preventDefault(); }
},true);
UB.hold('key-l','l'); UB.hold('key-r','r'); UB.hold('key-u','u'); UB.hold('key-d','d');
UB.actEl.addEventListener('pointerdown',/** @param {any} e */ function(e){ e.preventDefault(); try{UB.actEl.setPointerCapture(e.pointerId);}catch(_){} UB.actEl.classList.add('down'); keys.a=true; UB.doAction(); });
['pointerup','pointercancel','lostpointercapture'].forEach(function(n){ UB.actEl.addEventListener(n,function(){ UB.actEl.classList.remove('down'); keys.a=false; }); });
UB.actEl.addEventListener('keydown',/** @param {any} e */ function(e){ if(e.key==='Enter'){ e.preventDefault(); UB.doAction(); } });
document.querySelectorAll('[data-mode]').forEach(function(b){ b.addEventListener('click',function(){
  const m=/** @type {any} */ (b).dataset.mode;
  UB.$('garage').hidden=true;
  if(m==='walk') UB.setMode(m); else UB.need(function(){ UB.setMode(m); });
}); });
document.querySelectorAll('[data-tool]').forEach(function(b){ b.addEventListener('click',function(){
  UB.$('toolbox').hidden=true; UB.$('magic').hidden=true;
  if(UB.HANDT[/** @type {any} */ (b).dataset.tool]){ if(P.mode!=='walk') UB.setMode('walk'); UB.setTool(/** @type {any} */ (b).dataset.tool); return; }
  UB.need(function(){ UB.setTool(/** @type {any} */ (b).dataset.tool); });
}); });
UB.tap(UB.$('btn-veh'),function(){ UB.$('garage').hidden=false; });
UB.tap(UB.$('btn-tool'),function(){ UB.$('toolbox').hidden=false; });
UB.$('tool-magic').addEventListener('click',function(){ UB.$('toolbox').hidden=true; UB.$('magic').hidden=false; });
UB.tap(UB.$('btn-finds'),function(){ UB.renderAlbum(); UB.$('finds').hidden=false; });
UB.tap(UB.$('save'),function(){ UB.saveGame(true); });
UB.$('album').addEventListener('click',/** @param {any} e */ function(e){
  const b=e.target.closest('[data-find]');
  if(b&&ST.found[b.dataset.find]){ const f=UB.FINDS.find(/** @param {any} q */ function(q){return q[0]===b.dataset.find;}); UB.speak(f[2].replace(/^(einen|eine|ein|den|zwei) /,'')); }
});
document.querySelectorAll('.ov').forEach(function(o){
  o.addEventListener('click',function(e){ if(e.target===o||/** @type {any} */ (e.target).closest('.xb')) /** @type {any} */ (o).hidden=true; });
});
UB.tap(UB.$('batt'),function(){ UB.openQuiz(null); });
UB.$('quiz-x').addEventListener('click',UB.closeQuiz);
UB.$('quiz-go').addEventListener('click',UB.closeQuiz);
UB.$('quiz-say').addEventListener('click',function(){ if(UB.qcur) UB.speak(UB.qcur.say); });
UB.tap(UB.$('btn-menu'),function(){ UB.$('menu').hidden=false; });
UB.tap(UB.$('btn-map'),function(){ UB.mapPg=0; UB.renderMap(); UB.$('map').hidden=false; UB.renderFog(); });
UB.tap(UB.$('btn-lab'),UB.openLab);
UB.$('map-cards').addEventListener('click',UB.mapClick);
UB.$('eggs').addEventListener('click',UB.eggClick);
UB.tap(UB.$('quest'),function(){ if(UB.quest&&!UB.quest.done){ const d=UB.QDEF[UB.quest.type]; UB.speak(d.say(UB.quest)); UB.pulse(d.hint(UB.quest)); } });
/* Linkshänder: Laufen rechts, Springen und Aktion links. */
document.body.classList.toggle('calm',UB.OPT.calm);
UB.$('hand').addEventListener('click',function(){ UB.lefty=!UB.lefty; try{ localStorage.setItem(UB.K_LEFTY,UB.lefty?'1':'0'); }catch(_){} UB.syncHand(); sfx('pop'); UB.speak(UB.lefty?'Steuerung gespiegelt: Laufen jetzt rechts.':'Steuerung wie vorher: Laufen links.'); });
UB.syncHand();
UB.$('sound').addEventListener('click',function(){
  if(AU.muted){ AU.muted=false; AU.fxOff=false; } else if(AU.fxOff){ AU.muted=true; AU.fxOff=false; } else AU.fxOff=true;
  try{ localStorage.setItem(UB.K_MUTE,AU.muted?'1':AU.fxOff?'s':'0'); }catch(_){} if(AU.muted) speakStop();
  UB.syncSound(); sfx('pop');
  if(AU.fxOff) UB.speak('Nur Sprache.');
});
(function(){
  let app=false;
  try{ app=matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches||/** @type {any} */ (navigator).standalone===true; }catch(_){}
  const can=!!((document.fullscreenEnabled||/** @type {any} */ (document).webkitFullscreenEnabled)&&(UB.DE.requestFullscreen||UB.DE.webkitRequestFullscreen));
  UB.$('fs').hidden=app||!can; UB.fsSync();
  document.addEventListener('fullscreenchange',UB.fsSync); document.addEventListener('webkitfullscreenchange',UB.fsSync);
  /* Installiert bittet das Spiel darum, dass der Browser den Spielstand nicht von sich aus löscht. */
  /* Auch im Browser-Tab: Chrome entscheidet selbst, ob es zustimmt. Eine Frage an das Kind gibt es nicht. */
  if(navigator.storage&&navigator.storage.persist) navigator.storage.persist().catch(function(){});
  if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){ try{ navigator.serviceWorker.register('sw.js').catch(function(){}); }catch(_){} }
})();
UB.$('fs').addEventListener('click',UB.fsToggle);
UB.$('exp').addEventListener('click',UB.bakSave);
UB.$('imp').addEventListener('click',function(){ UB.$('imp-file').value=''; UB.$('imp-file').click(); });
UB.$('imp-file').addEventListener('change',function(){ UB.bakPick(UB.$('imp-file').files[0]); });
UB.$('imp-no').addEventListener('click',function(){ UB.bakIn=null; UB.$('imp-ok').hidden=true; });
UB.$('imp-yes').addEventListener('click',function(){ UB.$('imp-ok').hidden=true; UB.bakLoad(); });
/* Neue Welt fragt erst nach, weil dabei alles Gebaute verloren geht. */
UB.$('reset').addEventListener('click',function(){ UB.$('menu').hidden=true; UB.$('confirm').hidden=false; UB.speak('Neue Welt? Alles Gebaute geht dann verloren.'); });
UB.$('no').addEventListener('click',function(){ UB.$('confirm').hidden=true; });
UB.$('yes').addEventListener('click',function(){
  UB.$('confirm').hidden=true; UB.resetWorld(newSeed());
  if(!hero.quest||hero.quest.done) hero.quest=UB.newQuest();
  UB.showQuest(false);
  UB.saveGame(false); sfx('pop');
});
}
