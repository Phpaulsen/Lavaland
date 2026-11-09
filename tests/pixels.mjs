// Bildvergleich (Migrationsplan PR 17, Pfeile und Monster seit PR 18, Tiere seit PR 19a, Winter seit PR 20b, Werkstatt, Tiefe und Planeten seit PR 22, Lift seit PR 23): Feste Szenen werden mit dem Stand von main (OLD) und dem neuen Testbuild gezeichnet.
// Die Bilder müssen Pixel für Pixel gleich sein. So fällt auf, wenn ein Umzug die Zeichenreihenfolge ändert.
// Kein fester Hash im Repo: Pixel hängen von der Chromium-Version ab. Verglichen wird im selben Browser.
// Aufruf: OLD=/pfad/zur/alten/index.html node tests/pixels.mjs   (im CI wie beim Update-Test aus origin/main)
// Zum Nachsehen: DUMP=/pfad/praefix speichert jede Szene als PNG.
import fs from 'fs';
import { serve } from './server.mjs';
import { launch, phone } from './browser.mjs';

const OLD = process.env.OLD;
if (!OLD || !fs.existsSync(OLD)) { console.log('skip pixels: OLD nicht gesetzt'); process.exit(0); }

// Fester Zufall ab dem ersten Skript: Gleiche Schritte geben auf beiden Seiten dieselben Zufallszahlen.
const SEEDED = `(function(){ let s=12345; Math.random=function(){ s=(s*16807)%2147483647; return (s-1)/2147483646; }; })();`;

// Das Spiel anhalten: Kein neues Bild, keine Ticks. Danach wird alles Bewegliche, das nicht zur Szene gehört, geleert (auch die Tiere: sie laufen zufallsabhängig).
// Der Auftrag auch: Ob unterwegs ein Land entdeckt und ein neuer Auftrag gewählt wurde, hängt davon ab, wie viele Bilder in der Wartezeit liefen;
// sein Zeigerpfeil am Bildrand machte die Szene sonst gelegentlich unfest (Harfe, gesehen am 9.11.).
const FREEZE = `(function(){
  window.__raf=window.requestAnimationFrame; window.requestAnimationFrame=function(){ return 0; };
})()`;
const CLEAN = `quest=null; parts.length=0; MONS.length=0; ARROWS.length=0; ST.CRE.length=0; shake=0; ufo=null; bolt=null; METS.length=0; MROCKS.length=0; FLIES.length=0; JAR.length=0; for(const k in FX) FX[k]=0`;
const HASH = `(function(){
  const d=ctx.getImageData(0,0,cv.width,cv.height).data; let h=2166136261;
  for(let i=0;i<d.length;i+=4){ h^=d[i]|(d[i+1]<<8)|(d[i+2]<<16); h=Math.imul(h,16777619); }
  return cv.width+'x'+cv.height+':'+(h>>>0).toString(16);
})()`;
const THAW = `window.requestAnimationFrame=window.__raf; requestAnimationFrame(frame)`;

const SCENES = [
  { name: 'Wrack und Meer', go: 'teleport(WRECKS[0].x+40)', set: 'P.x=WRECKS[0].x+40; P.y=ground(P.x)-2; time=5; nightA=0' },
  { name: 'Kristallharfe', go: 'teleport(HARPS[0].x0+60)', set: 'P.x=HARPS[0].x0+60; P.y=ground(P.x)-2; for(const h of HARPS) h.sh=[1,.5,0,.25,.75]; time=7; nightA=0' },
  { name: 'Geysir bei Nacht mit Sternschnuppe und Glühwürmchen', go: 'teleport(GEYS[0]-60)',
    set: `P.x=GEYS[0]-60; P.y=ground(P.x)-2; time=((7-GEYS[0]*.013)%8+8)%8+80; nightA=1;
      METS.push({x:P.x-120,y:P.y-260,vx:300,vy:200,t:1,land:false,tr:[[P.x-120,P.y-260],[P.x-140,P.y-272],[P.x-160,P.y-284],[P.x-180,P.y-296]]});
      MROCKS.push({x:P.x+90,y:ground(P.x+90),t:10});
      FLIES.push({hx:P.x-40,hy:P.y-60,x:P.x-40,y:P.y-60,ph:1,t:0},{hx:P.x+30,hy:P.y-90,x:P.x+30,y:P.y-90,ph:2,t:0});
      JAR.push({t:100,a:1},{t:5,a:3})` },
  { name: 'Zielscheiben mit Pfeilen und Monstern', go: 'teleport(1790)',
    set: `P.x=1790; P.y=ground(P.x)-2; time=3; nightA=.6;
      ARROWS.push({x:1700,y:ground(1700)-60,vx:500,vy:-120,t:.3,stuck:0},{x:1880,y:ground(1880)-30,vx:-300,vy:200,t:1,stuck:.5});
      MONS.push({x:1720,y:ground(1720),vx:0,vy:0,on:true,hp:2,lv:0,t:1,face:1,sq:0,hit:0},{x:1860,y:ground(1860)-20,vx:0,vy:0,on:false,hp:3,lv:2,t:1,face:-1,sq:.5,hit:.1})` },
  { name: 'Tiere mit Banane', go: 'teleport(1300)',
    set: `P.x=1300; P.y=ground(P.x)-2; time=4; nightA=0; discoT=0; throws.length=0;
      ST.CRE.push({ok:true,e:'🐄',x:1210,y:ground(1210),sz:34,k:'walk',fl:'cow',t:0,hop:0,dir:1,ph:0,idle:0},
        {ok:true,e:'🐇',x:1260,y:ground(1260),sz:22,k:'hop',fl:'',t:1.3,hop:0,dir:-1,ph:.5,idle:0},
        {ok:true,e:'🐔',x:1350,y:ground(1350),sz:20,k:'walk',fl:'hen',t:2,hop:.2,dir:-1,ph:1,idle:0},
        {ok:true,e:'👻',x:1400,y:ground(1400)-90,sz:28,k:'fly',fl:'ghost',t:3,hop:0,dir:1,ph:2,shy:true});
      throws.push({e:'🍌',x:1320,y:ground(1320)-70,vx:0,vy:0})` },
  { name: 'Schneemänner, Schneebälle und Feuerwerk', go: 'teleport(6000)',
    set: `P.x=6000; P.y=ground(P.x)-2; time=6; nightA=.5; balls.length=0; fws.length=0;
      ST.props=ST.props.filter(function(o){ return o.type!=='man'; });
      ST.props.push({type:'man',x:5950,y:surfaceY(5950)},{type:'man',x:6150,y:surfaceY(6150)});
      balls.push({x:6040,y:ground(6040)-80,vx:0,vy:0,foe:false,t:0},{x:6100,y:ground(6100)-40,vx:0,vy:0,foe:true,t:0});
      fws.push({x:5880,y:ground(5880)-150,ty:0,c:2},{x:6200,y:ground(6200)-60,ty:0,c:4})` },
  { name: 'Werkstatt, Aufzug und erste Maschine', go: 'teleport(WSX+40)', set: 'P.x=WSX+40; P.y=ground(P.x)-2; time=2; nightA=0; discoT=0' },
  { name: 'Kristalle in der Tiefe', go: "teleport(ZDEC.find(function(d){ return d.k==='cry'; }).x)",
    set: "const d=ZDEC.find(function(d){ return d.k==='cry'; }); P.x=d.x-70; P.y=d.y; time=3; nightA=0" },
  { name: 'Planeten im Weltraum', go: 'teleport(SPACE.ice.x)', set: 'P.x=SPACE.ice.x-SPACE.ice.r-160; P.y=SPACE.ice.y; time=4; nightA=0' },
  // Zuletzt, weil die Szene den Helden auf Ski stellt. Der Yeti hüpft zufällig (Schluckauf), darum Hüpfen, Lachen, Rollen und Pinguine fest.
  // Goldene Ski fest: Die Kristall-Szene erreicht eine Zone, deren Geschenk je nach Zeitpunkt schon da ist oder nicht.
  { name: 'Lift, Iglu, Yeti und Skifahrer', go: 'teleport(IGX+60)', set: `P.x=IGX+60; P.y=surfaceY(P.x)-2; P.mode='ski'; P.ang=0; P.on=true; P.ball=0; time=5; nightA=0;
      hero.own.goldski=1; N.yeti.hop=0; N.yeti.laugh=0; N.yeti.roll=0; for(const p of N.pen){ p.s=0; p.x=p.hx; p.y=surfaceY(p.hx); p.rot=0; }` },
];

async function shoot(browser, url) {
  const ctx = await browser.newContext({ ...phone(), serviceWorkers: 'block', bypassCSP: true });
  await ctx.addInitScript(SEEDED);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  const ev = s => page.evaluate(s => window.__ev(s), s);
  await page.goto(url);
  await page.waitForFunction(() => window.__ev && window.__ev('ready'), null, { timeout: 30000 });
  await ev("OVS.forEach(o=>o.hidden=true); ST.paused=false; setMode('walk')");
  // Wrack, Harfe und Geysir liegen in Ländern weiter rechts: Welt bis dorthin erzeugen und warten, bis die Ticks sie gefunden haben.
  await ev('grow(30000)');
  await page.waitForFunction(() => window.__ev('WRECKS.length&&HARPS.length&&GEYS.length'), null, { timeout: 30000 });
  const out = [];
  for (const s of SCENES) {
    await ev(s.go); await page.waitForTimeout(900);
    await ev(FREEZE); await page.waitForTimeout(100);
    await ev(CLEAN + '; ' + s.set + '; cam.x=P.x; cam.y=P.y-80; dkA=darkAt(cam.y); draw()');
    out.push(await ev(HASH));
    if (process.env.DUMP) fs.writeFileSync(process.env.DUMP + '-' + out.length + '-' + Date.now() + '.png', Buffer.from((await ev("cv.toDataURL('image/png')")).split(',')[1], 'base64'));
    await ev(CLEAN + '; nightA=0; ' + THAW);
  }
  if (errs.length) throw new Error('Seitenfehler: ' + errs.join(' | '));
  await ctx.close();
  return out;
}

const srv = await serve({ '/old/index.html': OLD });
const base = 'http://127.0.0.1:' + srv.address().port;
const browser = await launch();
let fail = '';
try {
  const a = await shoot(browser, base + '/old/'), a2 = await shoot(browser, base + '/old/'), b = await shoot(browser, base + '/');
  SCENES.forEach((s, i) => {
    if (a[i] !== a2[i]) fail += `\n     ${s.name}: Szene ist nicht fest (main zweimal: ${a[i]} / ${a2[i]})`;
    else if (a[i] !== b[i]) fail += `\n     ${s.name}: anders als main (${a[i]} → ${b[i]})`;
  });
} catch (e) { fail = '\n     ' + e.message; }
await browser.close(); srv.close();
if (fail) { console.log('FAIL Bildvergleich mit main:' + fail); process.exit(1); }
console.log('ok   Bildvergleich mit main: ' + SCENES.length + ' Szenen gleich');
