// Reine Formen der Welt: Schneeberg, Rauschen, Ellipse, Land-Arten und ihre Höhen. Bewegt aus legacy.js (PR 8a).
// Text unverändert, nur export davor und JSDoc-Typen für tsc. Kein Zustand: gelesen werden nur Konstanten und die Argumente.
import { hash2 } from '../rng.js';
import { CELL, GX, GY, TOP, rawH } from './const.js';

export const SNX=5830, SL0=5920, PEAK=6900, BACK=7300, BEND=8300, MH=630, SNB=rawH(SL0), CHX=330, CAVE=[6560,SNB-150];
export const SNC0=Math.floor(SNX/CELL), SNC1=Math.ceil(BEND/CELL)+20;
/** Bodenhöhe am Schneeberg (Pixel). @param {number} x @returns {number} */
export function msurf(x){
  if(x<=SL0||x>=BEND) return rawH(x);
  const t=x<PEAK?(x-SL0)/(PEAK-SL0):x>BACK?1-(x-BACK)/(BEND-BACK):1, w=Math.min(1,(x-SL0)/220,(BEND-x)/220), ww=w*w*(3-2*w);
  /* Zwei Schanzen vorn, eine hinten */
  const h=MH*t*t*(3-2*t)+44*Math.exp(-Math.pow((x-6185)/40,2))+52*Math.exp(-Math.pow((x-6510)/44,2))+46*Math.exp(-Math.pow((x-7790)/42,2));
  return Math.max(TOP+90,Math.min(rawH(x),rawH(x)*(1-ww)+SNB*ww-h));
}
/** Wertrauschen aus hash2, glatt interpoliert. @param {number} x @param {number} y @returns {number} */
export function vnoise(x,y){
  const ix=Math.floor(x), iy=Math.floor(y), fx=x-ix, fy=y-iy, sx=fx*fx*(3-2*fx), sy=fy*fy*(3-2*fy);
  const a=hash2(ix,iy), b=hash2(ix+1,iy), c=hash2(ix,iy+1), d=hash2(ix+1,iy+1);
  return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;
}
/** Liegt die Zelle im Gitter (ohne Rand)? @param {number} cx @param {number} cy @returns {boolean} */
export function inGrid(cx,cy){ return cx>=1&&cx<GX-1&&cy>=1&&cy<GY-3; }
/** Ruft fn für jede Zelle in der Ellipse. @param {number} x @param {number} y @param {number} rx @param {number} ry @param {(cx: number, cy: number, wy: number) => void} fn */
export function ellipse(x,y,rx,ry,fn){
  const c0=Math.floor((x-rx)/CELL), c1=Math.floor((x+rx)/CELL), r0=Math.floor((y-ry-TOP)/CELL), r1=Math.floor((y+ry-TOP)/CELL);
  for(let cy=r0;cy<=r1;cy++) for(let cx=c0;cx<=c1;cx++){
    if(!inGrid(cx,cy)) continue;
    const dx=((cx+.5)*CELL-x)/rx, wy=TOP+(cy+.5)*CELL, dy=(wy-y)/ry;
    if(dx*dx+dy*dy<=1) fn(cx,cy,wy);
  }
}
export const PX0=9600, PM=960, PMC=PM/CELL, LANDX=PX0+700, PADH=-20;
/* Die Land-Arten: Farben für Himmel, Hügel, Gras, Erde und Fels, dazu Pflanzen, Tiere und Fundsachen. */
/** @type {any[]} */
export const BT=[
  {id:'home',sky:[[84,191,230],[212,244,238]],hill:[[155,216,196],[116,196,147]],night:0},
  {id:'desert',e:'🏜️',n:'die Wüste',n2:'noch eine Wüste',to:'in die Wüste',w:[3000,1500],sky:[[96,190,236],[255,232,180]],hill:[[238,206,140],[226,178,104]],cg:[240,212,140],ce:[216,170,104],cr:[200,150,100],night:0,
    flat:170,fs:230,flora:['cactus','cactus','bush'],clr:230,clp:130,
    fauna:[['🐫','walk',2,'BLÖK!'],['🦂','walk',2,'PIEKS!','sting'],['🦎','walk',2,'HUSCH!']],picks:[['🌶️','chili',3]]},
  {id:'jungle',e:'🌴',n:'den Dschungel',n2:'noch einen Dschungel',to:'in den Dschungel',w:[2800,1400],sky:[[70,180,200],[190,240,210]],hill:[[70,160,110],[40,130,80]],cg:[46,150,66],ce:[110,74,50],cr:[80,88,84],night:0,
    fs:86,flora:['jungle','jungle','fern','palm','bush'],clr:60,clp:50,
    fauna:[['🐒','sit',3,'UH UH AH!','monkey'],['🦜','fly',2,'HALLO!'],['🐅','walk',1,'ROAR!','scare',30],['🐍','walk',1,'SSSS!']],picks:[['🍌','peel',3],['🍍','food',2]]},
  {id:'candy',e:'🍭',n:'das Süßigkeitenland',n2:'noch ein Süßigkeitenland',to:'ins Süßigkeitenland',w:[2800,1400],sky:[[150,210,255],[255,214,236]],hill:[[255,190,220],[250,160,200]],cg:[255,150,200],ce:[122,74,48],cr:[240,200,150],night:0,
    wat:['rgba(250,244,232,.93)','rgba(255,255,255,.97)'],flat:90,fs:150,flora:['lolly','lolly','cane'],clr:140,clp:130,
    fauna:[['🧸','hop',3,'BOING!'],['🍩','walk',3,'MAMPF!','eat']],picks:[['🍭','sugar',4],['🍬','food',4],['🍰','food',2]]},
  {id:'mush',e:'🍄',n:'den Pilzwald',n2:'noch einen Pilzwald',to:'in den Pilzwald',w:[2800,1400],sky:[[70,90,170],[200,160,220]],hill:[[120,100,180],[90,70,150]],cg:[130,90,200],ce:[80,60,110],cr:[70,70,110],night:.35,
    fs:120,flora:['shroom','shroom','fern','bush'],clr:240,
    fauna:[['🐌','walk',2,'SCHLEIM!','slow'],['🦔','walk',2,'PIEKS!','sting'],['🐸','hop',3,'QUAK!'],['🧚','fly',2,'KLING!','sparkle']],picks:[['🍄','big',3],['🍇','tiny',2]]},
  {id:'spooky',e:'👻',n:'den Gruselhügel',n2:'noch einen Gruselhügel',to:'zum Gruselhügel',w:[2800,1300],sky:[[20,20,50],[70,50,90]],hill:[[50,50,80],[36,36,60]],cg:[90,110,90],ce:[60,56,70],cr:[112,106,134],night:1,
    wat:['rgba(96,190,80,.78)','rgba(160,230,120,.84)'],flat:80,fs:140,flora:['dead','grave','dead','bush'],clr:120,
    fauna:[['👻','fly',3,'BUH!','ghost',24],['🦇','fly',3,'FIEP!'],['💀','hop',1,'KLAPPER!'],['🐈','walk',1,'MIAU!']],picks:[['🎃','pump',3],['🍬','food',2]]},
  {id:'dino',e:'🦕',n:'das Dino-Tal',n2:'noch ein Dino-Tal',to:'ins Dino-Tal',w:[3000,1400],sky:[[110,200,220],[255,236,190]],hill:[[130,200,120],[90,170,90]],cg:[100,190,70],ce:[150,100,60],cr:[110,90,84],night:0,
    fs:110,flora:['fern','palm','fern','jungle'],clr:70,clp:280,
    fauna:[['🦕','walk',2,'MÖÖÖH!','bront',44],['🦖','walk',1,'ROAAAR!','trex',40],['🐊','walk',1,'SCHNAPP!','sting',26]],picks:[['🍖','food',3],['⭐','star',1]]},
  {id:'ocean',e:'🏝️',n:'das Inselmeer',n2:'noch ein Inselmeer',to:'ans Inselmeer',w:[3400,1400],sky:[[70,180,240],[190,236,250]],hill:[[120,200,230],[90,180,220]],cg:[246,226,170],ce:[226,196,140],cr:[120,130,150],night:0,
    flat:110,
    fauna:[['🐟','swim',4,'BLUBB!'],['🐠','swim',3,'BLUBB!'],['🐡','swim',1,'PUFF!'],['🐙','swim',1,'GLIBBER!'],['🦈','swim',1,'HAPS!','toss',34],['🐬','swim',1,'KLICK KLICK!','jump',30],['🦀','walk',2,'KNEIF!','sting'],['🐢','walk',1,'GANZ LANGSAM.','slow']],picks:[['🐚','food',4],['⭐','star',1]]},
  {id:'crystal',e:'💎',n:'die Kristallberge',n2:'noch mehr Kristallberge',to:'in die Kristallberge',w:[2800,1500],sky:[[90,130,220],[200,220,250]],hill:[[140,150,210],[110,120,190]],cg:[120,200,200],ce:[90,110,140],cr:[100,104,150],night:0,
    fs:100,flora:['crystal','crystal','bush'],clr:40,
    fauna:[['🐐','hop',3,'MÄÄÄH!'],['🦅','fly',2,'KRAAH!']],picks:[['⭐','star',2]]},
  {id:'cloud',e:'🌈',n:'das Wolkenland',n2:'noch ein Wolkenland',to:'ins Wolkenland',w:[2800,1300],sky:[[120,190,255],[255,230,240]],hill:[[200,230,255],[170,220,200]],cg:[140,220,120],ce:[150,110,80],cr:[130,120,140],night:0,
    fs:120,flora:['flower','flower','tree','bush'],clr:40,
    fauna:[['🦄','walk',2,'WIEHER!','uni',28],['🕊️','fly',3,'GURR!']],picks:[['🎈','float',4]]},
  {id:'city',e:'🏙️',n:'die Klötzchenstadt',n2:'noch eine Klötzchenstadt',to:'in die Klötzchenstadt',w:[3200,1200],sky:[[130,190,230],[230,236,240]],hill:[[170,180,190],[140,150,165]],cg:[150,154,160],ce:[120,110,104],cr:[96,96,104],night:0,
    fauna:[['🤖','walk',3,'BIEP BUUP!'],['🚗','walk',2,'TUUT TUUT!','car',26],['🐕','walk',1,'WAU!'],['🐦','fly',2,'PIEP!']],picks:[['🍕','food',3],['🎈','float',2]]},
  {id:'farm',e:'🚜',n:'den Bauernhof',n2:'noch einen Bauernhof',to:'zum Bauernhof',w:[2800,1300],sky:[[84,191,230],[230,246,200]],hill:[[170,220,120],[130,200,90]],cg:[120,200,60],ce:[146,98,62],cr:[92,84,96],night:0,
    flat:100,fs:170,flora:['flower','tree','flower','bush','tree'],clr:150,clp:60,
    fauna:[['🐄','walk',3,'MUUUH!','cow',28],['🐖','walk',2,'OINK!'],['🐑','walk',3,'MÄÄH!'],['🐔','walk',3,'GACK!','hen',18],['🐴','walk',1,'WIEHER!','bront',30]],picks:[['🥕','food',3],['🍎','food',3]]},
  {id:'end',e:'🏁',n:'das Ende der Welt',n2:'das Ende der Welt',to:'ans Ende der Welt',w:[0,0],sky:[[40,40,90],[250,180,140]],hill:[[120,100,150],[90,70,120]],cg:[200,200,210],ce:[150,150,165],cr:[110,110,130],night:0,
    flat:160,fs:260,flora:['flower','bush'],clr:230},
  /* Länder auf dem Mond: dunkle Mondmeere und helle Mondberge, beide voller Krater. Der Himmel ist schwarz, Wolken gibt es keine. */
  {id:'mare',e:'🌑',n:'das Mondmeer',n2:'noch ein Mondmeer',to:'ans Mondmeer',w:[3600,1800],sky:[[4,6,22],[22,20,52]],hill:[[70,72,86],[52,54,66]],cg:[150,152,160],ce:[118,120,130],cr:[92,94,106],night:0,space:1,noCloud:1,
    flat:120,fs:420,flora:['crystal'],clr:200,
    fauna:[['🐇','hop',3,'HOPS!'],['👾','walk',2,'PIEP PIEP!']],picks:[['⭐','star',1],['🧀','food',2]]},
  {id:'mberg',e:'🏔️',n:'die Mondberge',n2:'noch mehr Mondberge',to:'in die Mondberge',w:[3200,1600],sky:[[4,6,22],[22,20,52]],hill:[[110,112,124],[86,88,100]],cg:[206,208,214],ce:[170,172,180],cr:[132,134,146],night:0,space:1,noCloud:1,
    fs:520,flora:['crystal'],clr:220,
    fauna:[['👽','sit',1,'HALLO, ERDENKIND!','gift',26],['🛸','fly',2,'WUUUSCH!'],['🐇','hop',2,'HOPS!']],picks:[['⭐','star',2]]},
  /* Länder auf dem Eisplaneten: hohe Gletscher mit Tannen und ein zugefrorenes Meer, unter dessen Eis Wasser liegt. */
  {id:'glacier',e:'🧊',n:'den Gletscher',n2:'noch einen Gletscher',to:'zum Gletscher',w:[3600,1800],sky:[[120,180,235],[225,242,255]],hill:[[200,225,245],[170,205,235]],cg:[244,250,255],ce:[205,226,242],cr:[130,160,196],night:0,
    fs:150,flora:['fir','fir','crystal'],clr:200,
    fauna:[['🐻‍❄️','walk',1,'BRUMM!','scare',30],['🦅','fly',2,'KRAAH!'],['🐺','walk',1,'AUUUU!']],picks:[['❄️','star',2],['🐟','food',2]]},
  {id:'icesea',e:'🐧',n:'das Eismeer',n2:'noch ein Eismeer',to:'ans Eismeer',w:[3400,1600],sky:[[110,170,230],[235,246,255]],hill:[[190,220,245],[160,200,235]],cg:[240,248,255],ce:[200,222,240],cr:[120,150,190],night:0,
    flat:110,fs:260,flora:['fir','crystal'],clr:240,
    fauna:[['🐧','walk',4,'QUAK QUAK!'],['🦭','sit',2,'ORK ORK!'],['🐋','sit',1,'PFFFFT!','',34]],picks:[['🐟','food',3],['⭐','star',1]]},
  /* Länder auf dem Blubberplaneten: ein lila Wald mit Riesenpilzen und ein Sumpf voller grünem Glibber. */
  {id:'blubwood',e:'🫧',n:'den Blubberwald',n2:'noch einen Blubberwald',to:'in den Blubberwald',w:[3400,1600],sky:[[120,70,170],[255,180,220]],hill:[[150,90,190],[120,70,160]],cg:[170,90,220],ce:[96,62,116],cr:[74,62,104],night:0,
    fs:100,flora:['shroom','jungle','fern','shroom'],clr:160,
    fauna:[['🐸','hop',3,'BLUBB!'],['🦋','fly',3,'FLATTER!'],['🐙','walk',1,'GLIBBER!']],picks:[['🍇','tiny',2],['🍄','big',2]]},
  {id:'goo',e:'🟢',n:'den Glibbersumpf',n2:'noch einen Glibbersumpf',to:'zum Glibbersumpf',w:[3000,1400],sky:[[100,80,160],[230,200,240]],hill:[[110,150,110],[80,120,90]],cg:[120,200,90],ce:[80,90,70],cr:[70,80,90],night:.15,
    wat:['rgba(120,220,90,.78)','rgba(170,240,130,.84)'],flat:110,fs:140,flora:['fern','shroom'],clr:240,
    fauna:[['👽','sit',1,'BLUBB? BLUBB!','gift',26],['🪼','fly',2,'SCHWABBEL!'],['🐌','walk',2,'SCHLEIM!','slow']],picks:[['🫧','float',3],['⭐','star',1]]},
  /* Die vier kleinen Planeten sind kleine runde Welten mit nur einer Land-Art. */
  {id:'cheese',e:'🧀',n:'das Käseland',n2:'noch ein Käseland',to:'ins Käseland',w:[3000,1400],sky:[[255,196,110],[255,240,200]],hill:[[250,210,110],[236,186,80]],cg:[255,214,90],ce:[240,190,70],cr:[214,164,58],night:0,noCloud:1,
    fauna:[['🐭','walk',5,'PIEP PIEP!'],['🐀','walk',1,'KÄSE HER!']],picks:[['🧀','food',4],['⭐','star',1]]},
  {id:'cookie',e:'🍪',n:'das Keksland',n2:'noch ein Keksland',to:'ins Keksland',w:[3000,1400],sky:[[150,210,255],[255,236,210]],hill:[[214,170,120],[190,140,90]],cg:[214,160,100],ce:[170,110,60],cr:[110,70,40],night:0,
    fs:160,flora:['lolly','cane'],clr:140,fauna:[['🧁','hop',3,'BOING!'],['🍩','walk',2,'MAMPF!','eat']],picks:[['🍪','food',4],['🍬','sugar',2]]},
  {id:'disco',e:'🪩',n:'die Tanzfläche',n2:'noch eine Tanzfläche',to:'zur Tanzfläche',w:[3000,1400],sky:[[30,14,70],[110,40,150]],hill:[[110,50,160],[80,30,130]],cg:[255,90,210],ce:[90,40,140],cr:[44,32,84],night:.3,noCloud:1,
    fs:200,flora:['crystal'],clr:120,fauna:[['🕺','hop',2,'YEAH!'],['💃','hop',2,'TANZ MIT!'],['🦩','walk',2,'FLAMINGO!']],picks:[['⭐','star',2],['🎈','float',2]]},
  {id:'eye',e:'👁️',n:'das Glubschland',n2:'noch ein Glubschland',to:'ins Glubschland',w:[3000,1400],sky:[[180,140,255],[255,210,240]],hill:[[240,150,200],[210,120,180]],cg:[255,150,180],ce:[200,90,130],cr:[150,70,110],night:0,
    fs:130,flora:['shroom','fern'],clr:120,fauna:[['👁️','hop',3,'GLUBSCH!'],['👀','walk',2,'ICH SEH DICH!'],['🐙','walk',1,'GLIBBER!']],picks:[['🍇','tiny',2],['⭐','star',1]]}
];
/** Glatter Übergang 0…1. @param {number} t @returns {number} */
export function sm(t){ t=t<0?0:t>1?1:t; return t*t*(3-2*t); }
/** Spalte zu einer x-Position. @param {number} x @returns {number} */
export function colOf(x){ return Math.ceil(x/CELL); }
/* Höhe vom Boden in einem Land. Jede Art hat ihre eigene Form: Dünen, Burghügel, Vulkan, Meeresbecken, Zackenberge. */
/** @param {any} b Land aus BIO @param {number} x @param {boolean} [raw] @returns {number} */
export function hBio(b,x,raw){
  const T=BT[b.t], u=(x-b.x0)/(b.x1-b.x0), p=(b.s%628)/100, a=1+.18*Math.min(3,b.n), e=sm(Math.min(u,1-u)*5);
  const roll=30*Math.sin(x*.0023+p)+14*Math.sin(x*.0061+p*2.1)+6*Math.sin(x*.014+p*3.3);
  let h;
  switch(b.t){
    case 1: h=8+a*(54*Math.sin(x*.0034+p)+20*Math.sin(x*.0093+p*1.7))+e*46*Math.exp(-Math.pow((x-b.px)/84,2)); break;
    case 2: h=roll*a+11*Math.sin(x*.021+p); break;
    case 3: h=24*a*Math.sin(x*.0042+p)+8*Math.sin(x*.011+p)+e*44*Math.exp(-Math.pow((x-b.px)/90,2)); break;
    case 4: h=roll*.8; break;
    case 5: h=roll*.5-e*160*a*Math.exp(-Math.pow((x-b.qx)/420,2)); break;
    case 6: h=roll*.5-e*190*Math.exp(-Math.pow((x-b.px)/180,2))+e*108*Math.exp(-Math.pow((x-b.px)/48,2)); break;
    case 7: { const f=sm(Math.min(u,1-u)*4.5); h=6+f*(232+16*Math.sin(x*.004+p)); h-=f*(h+46)*Math.exp(-Math.pow((x-b.px)/150,2)); break; }
    case 8: h=30-e*(a*210*Math.abs(Math.sin(x*.0058+p))+64*Math.abs(Math.sin(x*.017+p*2))); break;
    case 10: h=0; break;
    case 13: h=34+roll*.35+craters(b,x,1); break;
    case 15: { const f=sm(Math.min(u,1-u)*3.5); h=20-f*(a*190*Math.abs(Math.sin(x*.0037+p))+60*Math.abs(Math.sin(x*.012+p*2)))+roll*.3; break; }
    case 16: h=PADH+78*sm(Math.min(u,1-u)*5)+roll*.12; break;
    case 17: h=roll*.9-26*Math.abs(Math.sin(x*.0051+p)); break;
    case 19: h=roll*.4+craters(b,x,1.3); break;
    case 20: h=roll*.5-34*Math.abs(Math.sin(x*.0042+p)); break;
    case 21: h=24*Math.round(roll*.8/24); break;
    case 22: h=roll*.9; break;
    case 18: h=PADH+66*sm(Math.min(u,1-u)*5)+roll*.15; break;
    case 14: { const f=sm(Math.min(u,1-u)*3); h=24-f*(170+70*Math.sin(x*.0029+p))+roll*.7+craters(b,x,.7); break; }
    default: h=roll*.7;
  }
  if(!raw&&T.flat){ const d=Math.abs(x-b.qx); if(d<T.flat+90) h+=(b.hq-h)*sm(d<T.flat?1:1-(d-T.flat)/90); }
  return h;
}
/* Krater: eine Mulde mit einem Wall rundherum. Wo sie liegen, hängt nur vom Land ab. */
/** @param {any} b Land aus BIO @param {number} x @param {number} k @returns {number} */
export function craters(b,x,k){
  const w=b.x1-b.x0, n=Math.max(2,Math.floor(w/900)); let h=0;
  for(let i=0;i<n;i++){
    const c=b.x0+w*(i+.25+.5*hash2(b.s,i))/n, R=60+150*hash2(i,b.s), d=Math.abs(x-c);
    if(d>R+90) continue;
    h+=k*((d<R?(42+R*.25)*(1-d*d/(R*R)):0)-26*Math.exp(-Math.pow((d-R)/34,2)));
  }
  return h;
}
/** @param {{y: number, ry: number}} s @returns {number} */
export function roomY(s){ return TOP+Math.floor((s.y+s.ry*.5-TOP)/CELL)*CELL; }
/** @param {{y: number, ry: number}} v @returns {number} */
export function vFloor(v){ return Math.floor((v.y+v.ry*.5-TOP)/CELL); }

// Nachtrag (PR 8a): weitere Tabellen ohne Zustand, die die Weltgenerierung liest.
/** Aufzug und Meer in der Tiefe (x bzw. Zeilen). */
export const WSX=1032, LIFTX=1152, SEA_T=1905, SEA_L=1936, SEA_B=1962;
/** Steine eines Hauses (Spalte, Zeile). */
export const HOUSE=[[0,0],[1,0],[3,0],[4,0],[0,1],[1,1],[3,1],[4,1],[0,2],[1,2],[2,2],[3,2],[4,2],[1,3],[2,3],[3,3],[2,4]];
/** Baumhöhen je Art: Grundhöhe und Streuung. @type {Record<string, number[]>} */
export const FH={fir:[62,40],cactus:[34,26],palm:[72,30],jungle:[110,60],giant:[250,0],lolly:[46,30],cane:[40,14],shroom:[12,12],dead:[60,40],grave:[20,6],fern:[30,18],crystal:[30,44],flower:[14,10],bush:[16,10],tree:[62,40]};
