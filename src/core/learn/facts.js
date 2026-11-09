// Lernfakten: Wort-, Silben- und Reimlisten, die Stufen (Schulbuch-Reihenfolge) und reine Hilfen über Faktschlüssel. Bewegt aus legacy.js (PR 6).
// Ein Faktschlüssel ist ein String wie '7+5', 'count:4', 'anlaut:Maus'. Fach, Fälligkeit und Auswahl stehen in leitner.js und app/wire.js.
/** @typedef {'m'|'l'} Domain Fachgebiet: m Mathe, l Lesen */
/** @typedef {{w: string, ic: string, no: string}} Word w: Wort, ic: Bildschlüssel, no: Buchstaben, die als Ablenker nicht vorkommen dürfen */
/** @type {Word[]} */
export const WORDS=[
  {w:'Auto',ic:'car',no:''},{w:'Flugzeug',ic:'plane',no:''},{w:'Bagger',ic:'bagger',no:''},{w:'Feuer',ic:'fire',no:'TNH'},
  {w:'Stern',ic:'star',no:''},{w:'Haus',ic:'haus',no:'MLR'},{w:'Mond',ic:'mond',no:'F'},{w:'Sonne',ic:'sonne',no:'TWN'},
  {w:'Baum',ic:'baum',no:'RS'},{w:'Wolke',ic:'wolke',no:''},{w:'Apfel',ic:'apfel',no:''},{w:'Ball',ic:'ball',no:'FHW'},{w:'Fisch',ic:'fisch',no:'TW'},
  /* Dazu die Bilder aus Silben und Reimen. Reimpaare (Maus/Haus, Tanne/Kanne) schließen sich gegenseitig als Ablenker aus, sonst wäre beides richtig. */
  {w:'Maus',ic:'maus',no:'HLR'},{w:'Tisch',ic:'tisch',no:'FW'},{w:'Tonne',ic:'tonne',no:'SW'},{w:'Hose',ic:'hose',no:'RDL'},{w:'Rose',ic:'rose',no:'HDL'},
  {w:'Tanne',ic:'tanne',no:'KWP'},{w:'Kanne',ic:'kanne',no:'TWP'},{w:'Banane',ic:'banane',no:''},{w:'Tomate',ic:'tomate',no:''}
];
/* Silben klatschen: Bild ansehen, Wort hören, mitklatschen. Die Silben stehen farbig darunter, wie im Silbenlesen in der Schule. */
/** @type {string[][]} Wort, Bild, Silben mit Bindestrich */
export const SYL=[['Auto','car','Au-to'],['Flugzeug','plane','Flug-zeug'],['Bagger','bagger','Bag-ger'],['Feuer','fire','Feu-er'],['Stern','star','Stern'],['Haus','haus','Haus'],['Mond','mond','Mond'],
  ['Sonne','sonne','Son-ne'],['Baum','baum','Baum'],['Wolke','wolke','Wol-ke'],['Apfel','apfel','Ap-fel'],['Ball','ball','Ball'],['Fisch','fisch','Fisch'],
  ['Rakete','rocket','Ra-ke-te'],['Feuerwerk','fw','Feu-er-werk'],['Banane','banane','Ba-na-ne'],['Tomate','tomate','To-ma-te']];
export const CLAP=['👏','👏👏','👏👏👏'];
/* Reime: zu einem Bild das passende Reimbild finden. */
/** @type {string[][]} Wort, Bild, Reimwort, Bild */
export const RHY=[['Haus','haus','Maus','maus'],['Fisch','fisch','Tisch','tisch'],['Sonne','sonne','Tonne','tonne'],['Hose','hose','Rose','rose'],['Tanne','tanne','Kanne','kanne']];
/** Reimwort je Wort, in beide Richtungen. */
export const RHYW=/** @type {Record<string, {ic: string, to: string}>} */ ({}); RHY.forEach(function(r){ RHYW[r[0]]={ic:r[1],to:r[2]}; RHYW[r[2]]={ic:r[3],to:r[0]}; });
export const LETTERS='AEIOUMLRSTNFBHWKDP', CASES='ABDEFGHLMNRT';
/** Fakten je Fachgebiet und Stufe, in Schulbuch-Reihenfolge. @type {Record<Domain, string[][]>} */
export const STAGES=(function(){
  const m=/** @type {string[][]} */ ([[],[],[],[]]), l=/** @type {string[][]} */ ([[],[],[]]);
  for(let n=1;n<=10;n++) m[n<=6?0:1].push('count:'+n);
  for(let a=1;a<=9;a++) for(let b=1;b<=9;b++){ const s=a+b; if(s<=5) m[0].push(a+'+'+b); else if(s<=10) m[1].push(a+'+'+b); else m[3].push(a+'+'+b); }
  for(let a=2;a<=10;a++) for(let b=1;b<a;b++) m[a<=5?0:1].push(a+'-'+b);
  for(let a=10;a<=19;a++) for(let b=1;b<=9;b++){ if(a%10+b<=9) m[2].push(a+'+'+b); }
  for(let a=11;a<=19;a++) for(let b=1;b<=9;b++){ if(b<=a%10) m[2].push(a+'-'+b); else if(a-b>=2&&a<=18) m[3].push(a+'-'+b); }
  SYL.forEach(function(x){ l[0].push('syl:'+x[0]); });
  Object.keys(RHYW).forEach(function(w){ l[0].push('rhy:'+w); });
  WORDS.forEach(function(wd){ l[0].push('anlaut:'+wd.w); l[2].push('word:'+wd.w); });
  CASES.split('').forEach(function(c){ l[1].push('case:'+c); });
  /* Zahlzerlegung (Zahlenhaus): 4 und 5 zuerst, dann 6 bis 10. Die Zehnerfreunde sind die Grundlage für den Zehnerübergang. */
  for(let n=4;n<=10;n++) for(let a=1;a<n;a++) m[n<=5?0:1].push('zl:'+n+':'+a);
  /* Blitzblick: Punkte im Zehnerfeld kurz sehen und ohne Abzählen erkennen (Kraft der 5). */
  for(let n=2;n<=10;n++) m[n<=5?0:1].push('fb:'+n);
  /* Nachbarzahlen: Welche Zahl kommt davor oder danach? Bis 10, dann bis 20. */
  for(let n=1;n<=19;n++){ m[n<10?1:2].push('nb:+:'+n); m[n<10?1:2].push('nb:-:'+(n+1)); }
  return {m:m,l:l};
})();
/** @param {string} k Faktschlüssel @returns {Domain} */
export function fDom(k){ return /^(anlaut|case|word|syl|rhy):/.test(k)?'l':'m'; }
/** Stufe eines Fakts in STAGES, 0 wenn unbekannt. @param {string} k @returns {number} */
export function fStage(k){ const d=fDom(k), S=STAGES[d]; for(let i=0;i<S.length;i++) if(S[i].indexOf(k)>=0) return i; return 0; }
/** Aufgabenart (add, sub, count, syl …) für die Abwechslung. @param {string} k @returns {string} */
export function fKind(k){ const i=k.indexOf(':'); return i>0?k.slice(0,i):k.indexOf('+')>0?'add':'sub'; }
/** Name des Fakts zum Vorlesen („7 plus 5“). @param {string} k @returns {string} */
export function fName(k){
  let m;
  if((m=/^(\d+)([+-])(\d+)$/.exec(k))) return m[1]+(m[2]==='+'?' plus ':' minus ')+m[3];
  if((m=/^count:(\d+)$/.exec(k))) return m[1]+' Sterne zählen';
  if((m=/^fb:(\d+)$/.exec(k))) return m[1]+' Punkte auf einen Blick';
  if((m=/^nb:([+-]):(\d+)$/.exec(k))) return (m[1]==='+'?'die Zahl nach der ':'die Zahl vor der ')+m[2];
  if((m=/^zl:(\d+):(\d+)$/.exec(k))) return m[1]+' ist '+m[2]+' und '+(/** @type {any} */ (m[1])-/** @type {any} */ (m[2]));
  if((m=/^anlaut:(.+)$/.exec(k))) return 'der Anfang von '+m[1];
  if((m=/^syl:(.+)$/.exec(k))) return 'die Silben von '+m[1];
  if((m=/^rhy:(.+)$/.exec(k))) return 'der Reim auf '+m[1];
  if((m=/^case:(.)$/.exec(k))) return 'das kleine '+m[1].toLowerCase();
  return 'das Wort '+k.slice(5);
}
