// Bildvergleich (Migrationsplan PR 17, Pfeile und Monster seit PR 18): Feste Szenen werden mit dem Stand von main (OLD) und dem neuen Testbuild gezeichnet.
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
const FREEZE = `(function(){
  window.__raf=window.requestAnimationFrame; window.requestAnimationFrame=function(){ return 0; };
})()`;
const CLEAN = `parts.length=0; MONS.length=0; ARROWS.length=0; ST.CRE.length=0; shake=0; ufo=null; bolt=null; METS.length=0; MROCKS.length=0; FLIES.length=0; JAR.length=0; for(const k in FX) FX[k]=0`;
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
