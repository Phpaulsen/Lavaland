/* ---------- Spielstand umziehen (Bedienung): Datei speichern oder teilen, Datei wählen und prüfen ---------- */
// PR 29g1. Bewegt aus legacy.js. Packen und Laden bleiben in persistence/transfer.js; bakMake, bakIn und die Rückmeldungen kommen über den Port BK,
// K_BAK_AT, BAK_MAX und bakOk über den Port (Schichtregel). app/wire.js ruft alle Funktionen über Einzeiler.
import { tone } from '../audio/sound.js';

/** @typedef {Record<string, any>} Port */

/** @param {Port} BK @param {any} ok */
export function bakDoneWith(BK,ok){
  if(ok){ BK.flash('exp','ok'); tone([660,880]); try{ localStorage.setItem(BK.K_BAK_AT,String(Date.now())); }catch(_){} }
  else { BK.flash('exp','warn'); tone([170],'sawtooth'); }
}
/** @param {Port} BK */
export function bakSaveWith(BK){
  BK.bakMake().then(/** @param {any} b */ function(b){
    const name='lavaland-'+b.at.slice(0,10)+'.json';
    const blob=new Blob([JSON.stringify(b)],{type:'application/json'});
    const dl=function(){
      try{
        const a=document.createElement('a'), u=URL.createObjectURL(blob);
        a.href=u; a.download=name; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function(){ URL.revokeObjectURL(u); },4000); bakDoneWith(BK,true);
      }catch(_){ bakDoneWith(BK,false); }
    };
    let f=null;
    try{ f=new File([blob],name,{type:'application/json'}); }catch(_){}
    if(f&&navigator.canShare&&navigator.canShare({files:[f]})){
      navigator.share({files:[f]}).then(function(){ bakDoneWith(BK,true); },function(e){ if(e&&e.name==='AbortError') return; dl(); });
    } else dl();
  },function(){ bakDoneWith(BK,false); });
}
/** @param {Port} BK @param {any} file */
export function bakPickWith(BK,file){
  if(!file) return;
  if(file.size>BK.BAK_MAX){ BK.flash('imp','warn'); tone([170],'sawtooth'); return; }
  const rd=new FileReader();
  rd.onload=function(){
    let b=null;
    try{ b=JSON.parse(/** @type {any} */ (rd.result)); }catch(_){}
    if(!BK.bakOk(b)){ BK.flash('imp','warn'); tone([170],'sawtooth'); return; }
    BK.bakIn=b; BK.$('menu').hidden=true; BK.$('imp-ok').hidden=false; BK.speak('Spielstand laden? Die Welt hier wird dann ersetzt.');
  };
  rd.onerror=function(){ BK.flash('imp','warn'); tone([170],'sawtooth'); };
  rd.readAsText(file);
}
