// Lernaufgaben: aus einem Faktschlüssel die Aufgabe bauen (mkQWith), dazu Zahlenfolgen (mkSeqWith) und die Text- und Bildbausteine. Bewegt aus legacy.js (PR 6).
// Zufall (rand), Bildtabellen (IC, QI) und Lernstand (FS) kommen als Parameter. Anzeigen, Tippen und Vorlesen bleiben in app/wire.js.
import { riWith, shuffleWith } from '../rng.js';
import { WORDS, SYL, CLAP, RHYW, LETTERS, fStage } from './facts.js';

/**
 * @typedef {{L: number, f: string, ans: string, opts: string[], html: string, say: string, word: boolean, pad: boolean, inp: string, tries: number, miss: boolean, lock: boolean,
 *   type?: string, sol?: string, dots?: string, nofast?: boolean, pics?: boolean, free?: boolean, box?: number}} Question
 * Eine Lernaufgabe. f: Faktschlüssel, L: Stufe, ans/opts: Antwort und Auswahl, html/say/sol: Anzeige, Ansage, Lösungssatz, pad: Ziffernblock, word: Wortkarte.
 * inp, tries, miss, lock, box setzt die Oberfläche.
 */
/** @typedef {Record<string, string>} Icons SVG-Inhalt je Bildschlüssel */

/** @param {number} n @returns {string} */
export function dots(n){ return new Array(n+1).join('●'); }
/* Zwanzigerfeld für Lösungen über die 10: erst die obere Reihe voll machen, dann weiter unten. Bei Minus werden die weggenommenen Punkte durchgestrichen. */
/** @param {number} a @param {number} b @param {boolean} sub @returns {string} */
export function zw(a,b,sub){
  let f='';
  for(let i=0;i<20;i++){ let c=''; if(sub){ if(i<a-b) c='on'; else if(i<a) c='off'; } else { if(i<a) c='on'; else if(i<a+b) c='on2'; } f+='<i'+(c?' class="'+c+'"':'')+'></i>'; }
  return '<div class="zf z20">'+f+'</div>';
}
/** @param {Icons} IC @param {Icons} QI @param {string} key @returns {string} */
export function qpicWith(IC,QI,key){ return '<svg class="qpic" viewBox="0 0 24 24" aria-hidden="true">'+(IC[key]||QI[key])+'</svg>'; }
/** Anfangsbuchstabe plus n−1 Ablenker. @param {() => number} rand @param {import('./facts.js').Word} wd @param {number} n @returns {string[]} */
export function lettersForWith(rand,wd,n){
  const c=wd.w.charAt(0);
  return shuffleWith(rand,[c].concat(shuffleWith(rand,LETTERS.split('').filter(function(ch){ return ch!==c&&wd.no.indexOf(ch)<0; })).slice(0,n-1)));
}
export const HOLE='<span class="hole">?</span>';
/* Zehnerübergang wird in zwei Schritten erklärt: erst bis zur 10, dann der Rest. */
/** @param {number} a @param {number} b @returns {string} */
export function solAdd(a,b){
  const s=a+b;
  if(a<10&&s>10){ const t=10-a; return a+' plus '+t+' ist 10. Dann noch '+(b-t)+' dazu, das ist '+s+'.'; }
  return a+' plus '+b+' ist '+s+'.';
}
/** @param {number} a @param {number} b @returns {string} */
export function solSub(a,b){
  const s=a-b;
  if(a>10&&s<10&&b>a%10){ const t=a%10; return a+' minus '+t+' ist 10. Dann noch '+(b-t)+' weg, das ist '+s+'.'; }
  return a+' minus '+b+' ist '+s+'.';
}
/**
 * Baut die Aufgabe zu einem Fakt.
 * @param {() => number} rand Zufallsquelle in [0, 1) (im Spiel Math.random)
 * @param {Icons} IC Tastenbilder (gelesen: star und Wortbilder)
 * @param {Icons} QI weitere Bilder (Wortbilder)
 * @param {string} k Faktschlüssel
 * @returns {Question}
 */
export function mkQWith(rand,IC,QI,k){
  const st=fStage(k), q=/** @type {Question} */ ({L:st,f:k,ans:'',opts:[],html:'',say:'',word:false,pad:false,inp:'',tries:0,miss:false,lock:false});
  /** @type {any} Treffer des passenden Musters */
  let m;
  if((m=/^count:(\d+)$/.exec(k))){
    const n=+m[1]; q.type='count'; q.pad=true; q.ans=String(n);
    /* Höchstens fünf je Reihe (Kraft der 5), aber nie mehr Spalten als Sterne: Ein einzelner Stern steht sonst links am Rand und sieht nach Verzierung aus statt nach Aufgabe. */
    q.html='<div class="objs" style="grid-template-columns:repeat('+Math.min(n,5)+',var(--ob))">'+new Array(n+1).join('<svg viewBox="0 0 24 24" aria-hidden="true">'+IC.star+'</svg>')+'</div><div class="eq">'+HOLE+'</div>';
    q.say='Wie viele Sterne sind das?'; q.sol=n===1?'Das ist ein Stern.':'Das sind '+n+' Sterne.';
  }else if((m=/^(\d+)([+-])(\d+)$/.exec(k))){
    const a=+m[1], b=+m[3], add=m[2]==='+', r=add?a+b:a-b;
    q.type=add?'add':'sub'; q.pad=true; q.ans=String(r);
    q.dots=add?'<div class="dots"><span class="da">'+dots(a)+'</span> <span class="db">'+dots(b)+'</span></div>':'<div class="dots"><span class="da">'+dots(r)+'</span><span class="dx">'+dots(b)+'</span></div>';
    if((add?r:a)>10) q.dots=zw(a,b,!add);
    q.html='<div class="eq">'+a+(add?' + ':' − ')+b+' = '+HOLE+'</div>'+(st<2?q.dots:'');
    q.say='Wie viel ist '+a+(add?' plus ':' minus ')+b+'?'; q.sol=add?solAdd(a,b):solSub(a,b);
  }else if((m=/^fb:(\d+)$/.exec(k))){
    const n=+m[1];
    let f=''; for(let i=0;i<10;i++) f+='<i'+(i<n?' class="on"':'')+'></i>';
    q.type='fb'; q.pad=true; q.ans=String(n);
    q.html='<div class="zf blink">'+f+'</div><div class="eq">'+HOLE+'</div>';
    q.dots='<div class="zf">'+f+'</div>';
    q.say='Schau genau! Wie viele Punkte?'; q.sol=n>5?'Oben 5, unten '+(n-5)+'. Das sind '+n+'.':'Das sind '+n+' Punkte.';
  }else if((m=/^nb:([+-]):(\d+)$/.exec(k))){
    const n=+m[2], up=m[1]==='+', r=up?n+1:n-1;
    q.type='nb'; q.pad=true; q.ans=String(r);
    q.html='<div class="eq">'+(up?n+' &nbsp; '+HOLE:HOLE+' &nbsp; '+n)+'</div><div class="nbar">'+(up?'➡️':'⬅️')+'</div>';
    q.say=up?'Welche Zahl kommt nach der '+n+'?':'Welche Zahl kommt vor der '+n+'?'; q.sol=up?'Nach der '+n+' kommt die '+r+'.':'Vor der '+n+' kommt die '+r+'.';
    q.dots='<div class="dots">'+(up?n+' → '+r:r+' ← '+n)+'</div>';
  }else if((m=/^zl:(\d+):(\d+)$/.exec(k))){
    const n=+m[1], a=+m[2], b=n-a;
    q.type='zl'; q.pad=true; q.ans=String(b);
    q.dots='<div class="dots"><span class="da">'+dots(a)+'</span><span class="db">'+dots(b)+'</span></div>';
    q.html='<div class="haus"><div class="roof">'+n+'</div><span class="rm">'+a+'</span><span class="rm">'+HOLE+'</span></div>'+(st<1?'<div class="dots"><span class="da">'+dots(n)+'</span></div>':'');
    q.say=n+' ist '+a+' und wie viel?'; q.sol=n+' ist '+a+' und '+b+'.'+(n===10?' Das sind Zehnerfreunde.':'');
  }else if((m=/^syl:(.+)$/.exec(k))){
    const x=SYL.find(function(y){ return y[0]===m[1]; })||SYL[0], sy=x[2].split('-'), n=sy.length;
    q.type='syl'; q.ans=CLAP[n-1]; q.opts=CLAP.slice(); q.nofast=true;
    q.html=qpicWith(IC,QI,x[1])+'<div class="syl">'+sy.map(function(t,i){ return '<b class="s'+(i%2)+'">'+t+'</b>'; }).join('')+'</div><div class="eq">'+HOLE+'</div>';
    q.say='Klatsch mit: '+x[0]+'. Wie oft hast du geklatscht?'; q.sol=sy.join(' – ')+'. '+x[0]+' hat '+(n===1?'eine Silbe':n+' Silben')+'.';
  }else if((m=/^rhy:(.+)$/.exec(k))){
    const w=RHYW[m[1]]?m[1]:'Haus', x=RHYW[w], others=shuffleWith(rand,Object.keys(RHYW).filter(function(v){ return v!==w&&v!==x.to; })).slice(0,2);
    q.type='rhy'; q.ans=x.to; q.opts=shuffleWith(rand,[x.to].concat(others)); q.pics=true; q.nofast=true;
    q.html=qpicWith(IC,QI,x.ic)+'<div class="syl">'+w+'</div>';
    q.say='Was reimt sich auf '+w+'?'; q.sol=w+' und '+x.to+', das reimt sich.';
  }else if((m=/^anlaut:(.+)$/.exec(k))){
    const wd=WORDS.find(function(w){ return w.w===m[1]; })||WORDS[0], c=wd.w.charAt(0);
    q.type='anlaut'; q.ans=c; q.opts=lettersForWith(rand,wd,6);
    q.html=qpicWith(IC,QI,wd.ic)+'<div class="eq">'+HOLE+wd.w.slice(1)+'</div>';
    q.say='Womit fängt '+wd.w+' an?'; q.sol=wd.w+' fängt mit '+c+' an.';
  }else if((m=/^case:(.)$/.exec(k))){
    const c=m[1], lc=c.toLowerCase();
    q.type='case'; q.ans=lc; q.opts=shuffleWith(rand,[lc].concat(shuffleWith(rand,'abdefghklmnrtu'.split('').filter(function(ch){ return ch!==lc; })).slice(0,5)));
    q.html='<div class="eq big">'+c+' → '+HOLE+'</div>';
    q.say='Welcher kleine Buchstabe gehört zum großen '+c+'?'; q.sol='Zum großen '+c+' gehört das kleine '+lc+'.';
  }else{
    const w=k.slice(5), wd=WORDS.find(function(x){ return x.w===w; })||WORDS[0];
    q.type='word'; q.word=true; q.ans=wd.w;
    q.opts=shuffleWith(rand,[wd.w].concat(shuffleWith(rand,WORDS.filter(function(x){ return x!==wd; })).slice(0,3).map(function(x){ return x.w; })));
    q.html=qpicWith(IC,QI,wd.ic);
    q.say='Welches Wort passt zum Bild?'; q.sol='Hier steht '+q.ans+'.';
  }
  return q;
}
/* Zahlenfolgen bleiben als Abwechslung dabei, ohne Fach. */
/** @param {() => number} rand @param {import('./leitner.js').FactStore} FS (gelesen: u.m) @returns {Question} */
export function mkSeqWith(rand,FS){
  const big=FS.u.m>=2, st=big?riWith(rand,1,2):1, max=big?20:10, a=riWith(rand,1,max-2*st), gap=riWith(rand,1,2), seq=[a,a+st,a+2*st];
  return {L:FS.u.m,type:'seq',pad:true,inp:'',tries:0,ans:String(seq[gap]),opts:[],word:false,miss:false,lock:false,free:true,
    html:'<div class="eq">'+seq.map(function(v,i){ return i===gap?HOLE:String(v); }).join(' &nbsp; ')+'</div>',
    say:'Welche Zahl fehlt?',sol:'Hier fehlt die '+seq[gap]+'.',f:'seq:'+seq.map(function(v,i){ return i===gap?'_':v; }).join(',')};
}
