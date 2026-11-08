// Ton und Sprache (PR 15): Klänge über Web Audio, Vorlesen mit Aufnahmen aus audio/ oder der Browserstimme.
// Schicht audio: darf nur core/ und audio/ importieren. Was Speicher oder Spielzustand braucht, kommt über den Port AP
// (talkLock, vcMiss); legacy.js schreibt muted, fxOff und tapT über die Fassade AU.
/** @type {any} */
export let AC=null;
export let tapT=0;
export function audio(){
  if(!AC){ try{ AC=new (window.AudioContext||/** @type {any} */ (window).webkitAudioContext)(); }catch(_){ AC=null; } }
  if(AC&&AC.state==='suspended'){ try{AC.resume();}catch(_){} }
}
export function jingle(){
  if(!AC||muted||fxOff) return;
  try{
    const t=AC.currentTime;
    [523,659,784,1047].forEach(/** @param {any} f @param {any} i */ function(f,i){
      const o=AC.createOscillator(), g=AC.createGain(), s=t+i*.11;
      o.type='triangle'; o.frequency.value=f;
      g.gain.setValueAtTime(.0001,s); g.gain.linearRampToValueAtTime(.18,s+.02); g.gain.exponentialRampToValueAtTime(.001,s+.4);
      o.connect(g); g.connect(AC.destination); o.start(s); o.stop(s+.45);
    });
  }catch(_){}
}
/* Vorlesestimme: Feste Sätze kommen als Aufnahme aus audio/ (eine natürliche deutsche Stimme, erzeugt mit tools/voice). Nur Sätze ohne Aufnahme spricht die Browserstimme, deren Stimme Eltern in der Elternansicht wählen können. Das Tempo gilt für beide. */
export const VRATES=[.75,.95,1.1];
/** @type {{ v: string, r: number }} */
export let VOICE={v:'',r:.95};
export function voicesDe(){ try{ return speechSynthesis.getVoices().filter(/** @param {any} v */ function(v){ return /^de([-_]|$)/i.test(v.lang); }); }catch(_){ return []; } }
export function voiceGet(){ if(!VOICE.v) return null; return voicesDe().find(/** @param {any} v */ function(v){ return v.name===VOICE.v; })||null; }
/* Aufnahmen: audio/index.json ordnet jedem Satz eine Datei zu. Ein Text wird in Sätze geteilt. Nur wenn es für jeden Satz eine Aufnahme gibt, kommen die Aufnahmen, sonst spricht die Browserstimme den ganzen Text. So stecken nie zwei Stimmen in einer Ansage. */
/** @type {Record<string, string> | null} */
export let VCLIP=null;
export let vcSeq=0;
/** @type {any} */
export let vcAud=null;
/** @type {Record<string, Promise<string>>} */
export const vcUrl={};
/** @param {any} t */
export function speakSplit(t){ return (String(t).replace(/\s+/g,' ').trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[]).map(/** @param {any} s */ function(s){ return s.trim(); }).filter(Boolean); }
try{
  const a=document.createElement('audio');
  if(a.canPlayType&&a.canPlayType('audio/ogg; codecs=opus')) fetch('audio/index.json').then(/** @param {any} r */ function(r){ return r.ok?r.json():null; }).then(/** @param {any} j */ function(j){ if(j&&j.v===1&&j.c) VCLIP=j.c; }).catch(function(){});
}catch(_){}
/** @param {any} id */
export function clipGet(id){
  if(!vcUrl[id]){ vcUrl[id]=fetch('audio/'+id+'.ogg').then(/** @param {any} r */ function(r){ if(!r.ok) throw new Error('clip'); return r.blob(); }).then(/** @param {any} b */ function(b){ return URL.createObjectURL(b); }); vcUrl[id].catch(function(){ delete vcUrl[id]; }); }
  return vcUrl[id];
}
export function speakStop(){
  vcSeq++;
  try{ if(vcAud){ vcAud.onended=null; vcAud.pause(); vcAud=null; } }catch(_){}
  try{ if(window.speechSynthesis) window.speechSynthesis.cancel(); }catch(_){}
}
/* Die Browserstimme liest eine Ziffer vor einem Punkt gern als Ordnungszahl („die 8.“ wird „die achte“), deshalb bekommt sie Zahlen als Wörter. Bildzeichen liest sie nicht mit. */
export const NUMW=['null','eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun','zehn','elf','zwölf','dreizehn','vierzehn','fünfzehn','sechzehn','siebzehn','achtzehn','neunzehn'];
export const NUMT=['','','zwanzig','dreißig','vierzig','fünfzig','sechzig','siebzig','achtzig','neunzig'];
/** @param {any} n @returns {string} */
export function numWord(n){
  if(n<20) return NUMW[n];
  if(n<100) return (n%10?(n%10===1?'ein':NUMW[n%10])+'und':'')+NUMT[Math.floor(n/10)];
  if(n<1000) return (Math.floor(n/100)===1?'ein':NUMW[Math.floor(n/100)])+'hundert'+(n%100?numWord(n%100):'');
  return String(n);
}
/** @param {any} t */
export function synthText(t){ return String(t).replace(/\d+/g,/** @param {any} d */ function(d){ return numWord(+d); }).replace(/ – /g,', ').replace(/[←-⯿️‍]|[\uD83C-\uD83E][\uDC00-\uDFFF]/g,'').replace(/\s+/g,' ').trim(); }
/** @param {any} text */
export function synth(text){
  if(!('speechSynthesis' in window)) return;
  const u=new SpeechSynthesisUtterance(synthText(text));
  u.lang='de-DE'; u.rate=VOICE.r; u.pitch=1;
  /* Ohne Wahl der Eltern eine Stimme für Deutsch aus Deutschland, damit kein englischer Standard deutsche Wörter verdreht. */
  const vo=voiceGet()||voicesDe().find(/** @param {any} v */ function(v){ return /^de[-_]DE$/i.test(v.lang); }); if(vo) u.voice=vo;
  window.speechSynthesis.speak(u);
  return u;
}
/** @param {any} ids @param {any} text */
export function clipPlay(ids,text){
  const seq=vcSeq, h=/** @type {{ onend: any }} */ ({onend:null});
  const done=function(){ if(seq===vcSeq&&h.onend){ const f=h.onend; h.onend=null; f(); } };
  const fail=function(){ if(seq!==vcSeq) return; const u=synth(text); if(u) u.onend=done; else done(); };
  Promise.all(ids.map(clipGet)).then(/** @param {any} urls */ function(urls){
    let i=0;
    const next=function(){
      if(seq!==vcSeq) return;
      if(i>=urls.length){ vcAud=null; done(); return; }
      const a=new Audio(urls[i++]); vcAud=a;
      /* Langsam und schnell aus der Elternansicht gelten auch hier, die Tonhöhe bleibt dabei gleich. */
      a.playbackRate=VOICE.r/.95; a.onended=next;
      const p=a.play(); if(p&&p.catch) p.catch(function(){ if(i===1) fail(); else next(); });
    };
    next();
  }).catch(fail);
  return h;
}
/** @param {any} AP @param {any} text */
export function speakWith(AP,text){
  try{
    if(performance.now()<AP.talkLock&&performance.now()-tapT>450) return;
    if(muted) return;
    speakStop();
    const ss=speakSplit(text);
    if(VCLIP){
      const ids=ss.map(/** @param {any} s */ function(s){ return /** @type {Record<string, string>} */ (VCLIP)[s]; });
      if(ss.length&&ids.every(Boolean)) return clipPlay(ids,text);
      AP.vcMiss(text);
    }
    return synth(text);
  }catch(_){}
}
export let muted=false, fxOff=false;
/** @type {any} */
export let noiseBuf=null;
export let coinT=0, coinN=0, digSfxT=0, flameSfx=0;
/** @param {any} f0 @param {any} f1 @param {any} dur @param {any} type @param {any} vol */
export function blip(f0,f1,dur,type,vol){
  if(!AC||muted||fxOff) return;
  try{
    const t=AC.currentTime, o=AC.createOscillator(), g=AC.createGain();
    o.type=type||'sine'; o.frequency.setValueAtTime(f0,t); if(f1!==f0) o.frequency.exponentialRampToValueAtTime(f1,t+dur);
    g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.001,t+dur);
    o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t+dur+.02);
  }catch(_){}
}
/** @param {any} dur @param {any} freq @param {any} vol */
export function noise(dur,freq,vol){
  if(!AC||muted||fxOff) return;
  try{
    if(!noiseBuf){ noiseBuf=AC.createBuffer(1,Math.floor(AC.sampleRate*.6),AC.sampleRate); const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; }
    const t=AC.currentTime, src=AC.createBufferSource(), f=AC.createBiquadFilter(), g=AC.createGain();
    src.buffer=noiseBuf; f.type='lowpass'; f.frequency.setValueAtTime(freq,t); f.frequency.exponentialRampToValueAtTime(Math.max(60,freq*.3),t+dur);
    g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.001,t+dur);
    src.connect(f); f.connect(g); g.connect(AC.destination); src.start(t); src.stop(t+dur+.02);
  }catch(_){}
}
/* Kurze Geräusche. Gold klingt mit jedem Stück in Folge etwas höher. */
/** @param {string} k */
export function sfx(k){
  const now=performance.now();
  if(k==='coin'){ if(now-coinT<70) return; coinN=now-coinT<700?Math.min(12,coinN+1):0; coinT=now; const f=880*Math.pow(1.06,coinN); blip(f,f*1.5,.09,'triangle',.12); }
  else if(k==='dig'){ if(now-digSfxT<95) return; digSfxT=now; noise(.07,500+Math.random()*300,.16); }
  else if(k==='jump') blip(300,620,.12,'sine',.1);
  else if(k==='boom'){ noise(.55,900,.4); blip(120,40,.4,'sine',.3); }
  else if(k==='tick') blip(900,700,.03,'square',.03);
  else if(k==='pop') blip(520,880,.1,'triangle',.12);
  else if(k==='throw') blip(520,240,.09,'sine',.06);
  else if(k==='splat') noise(.09,1500,.12);
  else if(k==='swish') noise(.18,3200,.03);
  else if(k==='hick') blip(430,920,.08,'square',.05);
  else if(k==='laugh') tone([392,523,392,523]);
  else if(k==='pups'){ blip(150,52,.45,'sawtooth',.2); noise(.3,320,.1); }
  else if(k==='burp') blip(120,62,.55,'sawtooth',.22);
  else if(k==='quack') blip(760,380,.1,'square',.05);
  else if(k==='whoosh') blip(280,900,.24,'sine',.06);
  else if(k==='fw') blip(500,1500,.3,'sine',.04);
  else if(k==='bang'){ noise(.35,2600,.2); blip(170,60,.22,'sine',.14); }
  else if(k==='roar') blip(80,190,.5,'sawtooth',.15);
  else if(k==='flame'){ if(now-flameSfx<110) return; flameSfx=now; noise(.14,1000,.07); }
}
/** @param {any} list @param {any} [type] */
export function tone(list,type){
  if(!AC||muted||fxOff) return;
  try{
    const t=AC.currentTime;
    list.forEach(/** @param {any} f @param {any} i */ function(f,i){
      const o=AC.createOscillator(), g=AC.createGain(), s=t+i*.1;
      o.type=type||'triangle'; o.frequency.value=f;
      g.gain.setValueAtTime(.0001,s); g.gain.linearRampToValueAtTime(.16,s+.02); g.gain.exponentialRampToValueAtTime(.001,s+.25);
      o.connect(g); g.connect(AC.destination); o.start(s); o.stop(s+.3);
    });
  }catch(_){}
}

/** Übergangsfassade für die Namen, die legacy.js neu zuweist (wie ST). */
export const AU={
  get muted(){ return muted; }, set muted/** @param {any} v */ (v){ muted=v; },
  get fxOff(){ return fxOff; }, set fxOff/** @param {any} v */ (v){ fxOff=v; },
  get tapT(){ return tapT; }, set tapT/** @param {any} v */ (v){ tapT=v; },
};
