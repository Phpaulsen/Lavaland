// Rauchtest: startet das Spiel in einem Handy-Browser und prüft die wichtigsten Abläufe.
// Aufruf: node tests/smoke.mjs   (braucht das npm-Paket playwright und einen Chromium)
// Optional: CHROMIUM=/pfad/zu/chrome
import { createRequire } from 'module';
import { serve } from './server.mjs';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('Start ohne Fehler, Welt erzeugt', async ({ ev }) => {
  const s = await ev('({ready, w:GX, x:P.x, mode:P.mode})');
  if (!s.ready) throw new Error('Spiel nicht bereit');
  if (s.w < 10000) throw new Error('Welt zu klein: ' + s.w);
});

test('Lernschrift kommt aus dem Repo', async ({ page }) => {
  const ok = await page.evaluate(() => document.fonts.load('700 20px Andika').then(f => f.length > 0));
  if (!ok) throw new Error('Andika nicht geladen');
});

test('Laufen bewegt den Helden', async ({ ev, page }) => {
  await ev('OVS.forEach(o=>o.hidden=true); paused=false');
  const x0 = await ev('P.x');
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(1200); await page.keyboard.up('ArrowRight');
  const x1 = await ev('P.x');
  if (Math.abs(x1 - x0) < 20) throw new Error('Held hat sich nicht bewegt: ' + x0 + ' -> ' + x1);
});

test('Lernaufgabe mit Ziffernblock richtig lösen', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); paused=false; energy=0; pickFact=function(){return '2+3'}; openQuiz(); for(let i=0;i<20&&lastF!=='2+3';i++) nextQ()");
  await page.waitForTimeout(400);
  if (await ev("$('quiz').hidden")) throw new Error('Aufgabe nicht geöffnet');
  await ev("padKey('5'); padSubmit()");
  await page.waitForTimeout(2500);
  const e = await ev('energy');
  if (!(e > 0)) throw new Error('Akku nicht geladen: ' + e);
});

test('Escape schließt die Aufgabe und gibt das Spiel frei', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); paused=false; energy=MAXE; openQuiz()");
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  if (!(await ev("$('quiz').hidden")) || await ev('paused')) throw new Error('Aufgabe offen oder Spiel pausiert');
});

test('Elternansicht zeigt das Protokoll', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); paused=false; parOpen()");
  await page.waitForTimeout(1500);
  if (await ev("$('par').hidden")) throw new Error('Elternansicht nicht geöffnet');
  const t = await ev("$('par-body').textContent");
  if (!/Lernanteil/.test(t)) throw new Error('Zeitauswertung fehlt in der Elternansicht');
  if (await ev("$('par').querySelectorAll('script').length")) throw new Error('Skript in der Elternansicht');
  await ev("$('par').hidden=true");
});

test('Elternansicht zählt Sandbox-Zeit je Fahrzeug', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); paused=false; energy=MAXE; setMode('car'); for(let i=0;i<40;i++) LOG.tick(1); LOG.flush(); setMode('walk')");
  await page.waitForTimeout(500);
  await ev('parOpen()'); await page.waitForTimeout(1500);
  const t = await ev("$('par-body').textContent");
  if (!/Sandbox: womit/.test(t) || !/Auto/.test(t)) throw new Error('Fahrzeugzeit fehlt in der Elternansicht');
  await ev("$('par').hidden=true");
});

test('Mission am Brett: Küken retten', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); paused=false; MS={done:{},cur:null}; P.mode='walk'; P.x=MISX; P.y=ground(MISX); P.on=true");
  await page.waitForTimeout(300);
  await ev('doAction()');
  if (await ev("!MS.cur||MS.cur.id!=='chick'")) throw new Error('Mission nicht gestartet');
  await ev('P.x=MS.cur.x; P.y=MS.cur.y; P.vy=0'); await page.waitForTimeout(600);
  await ev('P.x=MISX+10; P.y=ground(MISX); P.vy=0'); await page.waitForTimeout(1200);
  if (await ev("!MS.done.chick")) throw new Error('Mission nicht abgeschlossen');
});

test('Schaufel gräbt zu Fuß ohne Akku', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); paused=false; energy=0; setMode('walk'); P.x=1500; P.y=ground(1500); P.on=true; $('tool-cards').querySelector('[data-tool=shovel]').click()");
  const y0 = await ev('P.y');
  await ev('keys.d=true; keys.a=true'); await page.waitForTimeout(1500); await ev('keys.a=false; keys.d=false; setTool(null,true)');
  if (!(await ev('P.y') > y0 + 30)) throw new Error('nicht nach unten gegraben');
  if (!(await ev("$('quiz').hidden"))) throw new Error('Schaufel hat die Lernaufgabe verlangt');
});

test('Sternschnuppe landet und gibt Gold', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); paused=false; setMode('walk'); P.x=1500; P.y=ground(1500); P.on=true; METS=[]; MROCKS=[]; nightOn=true; nightA=1; METS.push({x:P.x-300,y:P.y-400,vx:0,vy:0,t:.05,land:true,tr:[]})");
  await page.waitForTimeout(400);
  if (await ev('MROCKS.length') !== 1) throw new Error('kein Sternstein gelandet');
  const g = await ev('gold');
  await ev('P.x=MROCKS[0].x; P.y=ground(P.x); P.vy=0'); await page.waitForTimeout(400);
  if (await ev('MROCKS.length') || !(await ev('gold') > g)) throw new Error('Sternstein nicht aufgehoben');
  await ev('nightOn=false; nightA=0; metNext=time+999');
});

test('Schiffswrack: Truhe gibt einmal einen Schatz', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); paused=false; setMode('walk'); teleport(WRECKS[0].x+400)");
  await page.waitForTimeout(800);
  const g = await ev('gold');
  await ev('OVS.forEach(o=>o.hidden=true); paused=false; P.x=WRECKS[0].x; P.y=ground(P.x)-10; P.vy=0'); await page.waitForTimeout(150);
  const g2 = await ev('gold');
  if (!(g2 > g) || !(await ev('orbGot[WRECKS[0].k]'))) throw new Error('kein Schatz');
  await ev('P.x=WRECKS[0].x+2; P.y=ground(P.x)-10'); await page.waitForTimeout(400);
  if (await ev('gold') !== g2) throw new Error('Schatz doppelt');
  await ev('teleport(1500)'); await page.waitForTimeout(500);
});

test('Fernrohr: Sterne zählen', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); paused=false; setMode('walk'); for(const k in FX) FX[k]=0; P.x=SCOPEX+10; P.y=surfaceY(P.x); P.on=true; P.vy=0");
  await page.waitForTimeout(300);
  if (await ev('actIcon()') !== 'scope') throw new Error('Fernrohr-Knopf fehlt: ' + await ev('actIcon()'));
  await ev('doAction()'); await page.waitForTimeout(300);
  if (await ev("$('scope').hidden")) throw new Error('Fernrohr nicht geöffnet');
  const g = await ev('gold');
  await ev("$('scope-b').querySelector('[data-sc=\"'+SCQ.n+'\"]').click()");
  if (!(await ev('gold') > g)) throw new Error('richtige Zahl ohne Belohnung');
  await ev("$('scope').hidden=true");
});

test('Glühwürmchen fangen', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); paused=false; setMode('walk'); JAR=[]; FLIES=[{hx:P.x,hy:P.y-20,x:P.x,y:P.y-20,ph:0,t:0}]; nightOn=true; nightA=1");
  await page.waitForTimeout(300);
  if (await ev('JAR.length') !== 1) throw new Error('Glühwürmchen nicht gefangen');
  await ev('nightOn=false; nightA=0; JAR=[]; FLIES=[]');
});

test('Kristallharfe von klein nach groß', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); paused=false; setMode('walk'); for(const k in FX) FX[k]=0; teleport(HARPS[0].x0-80)");
  await page.waitForTimeout(800);
  const g = await ev('gold');
  for (let i = 0; i < 5; i++) { await ev('OVS.forEach(o=>o.hidden=true); P.x=HARPS[0].x0+' + i + '*34; P.y=ground(P.x); P.vy=0'); await page.waitForTimeout(150); }
  if (!(await ev('gold') > g) || !(await ev('orbGot[HARPS[0].k]'))) throw new Error('Tonleiter nicht erkannt');
  await ev('teleport(1500)'); await page.waitForTimeout(500);
});

test('Vulkanausbruch wirft Lavabrocken', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); paused=false; setMode('walk'); METS=[]; MROCKS=[]; P.x=2380; P.y=surfaceY(P.x); P.vy=0; eruT=0");
  await page.waitForTimeout(2400);
  if (!(await ev('MROCKS.length') >= 1)) throw new Error('kein Lavabrocken gelandet');
  await ev('MROCKS=[]; METS=[]; teleport(1500)'); await page.waitForTimeout(500);
});

test('Elternansicht: Monster aus, ruhige Darstellung an', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); paused=false; parOpen()"); await page.waitForTimeout(1500);
  await ev("$('par-body').querySelector('[data-opt=mon0]').click()"); await page.waitForTimeout(800);
  await ev("$('par-body').querySelector('[data-opt=calm1]').click()"); await page.waitForTimeout(800);
  if (await ev('OPT.mon') || !(await ev('OPT.calm && reduced && document.body.classList.contains("calm")'))) throw new Error('Optionen nicht übernommen');
  await ev("$('par').hidden=true; MONS.push({x:P.x,y:P.y,lv:0,face:1,hp:1,hit:0,sq:0,vx:0,vy:0,t:0}); paused=false"); await page.waitForTimeout(300);
  if (await ev('MONS.length')) throw new Error('Monster trotz aus');
  await ev("OPT.mon=true; OPT.calm=false; reduced=reducedSys; document.body.classList.remove('calm'); optSave()");
});

test('Tastenkürzel: F öffnet Fahrzeuge, X steigt aus', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); paused=false; setMode('walk')");
  await page.keyboard.press('f'); await page.waitForTimeout(200);
  if (await ev("$('garage').hidden")) throw new Error('F öffnet die Garage nicht');
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  await ev("energy=MAXE; setMode('car')"); await page.keyboard.press('x'); await page.waitForTimeout(200);
  if (await ev('P.mode') !== 'walk') throw new Error('X steigt nicht aus');
});

test('Reise zum Mond und zurück', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); paused=false; energy=MAXE; travel('moon')");
  await page.waitForTimeout(3500);
  if (await ev('realm') !== 'moon') throw new Error('Nicht auf dem Mond: ' + await ev('realm'));
  await ev("OVS.forEach(o=>o.hidden=true); paused=false; travel('')");
  await page.waitForTimeout(3500);
  if (await ev('realm') !== '') throw new Error('Nicht zurück auf der Erde');
});

test('Spielstand übersteht Neuladen', async ({ ev, page }) => {
  await ev('OVS.forEach(o=>o.hidden=true); paused=false; gold=4321; saveFinds(); saveGame(false)');
  await page.waitForTimeout(1500);
  await page.reload(); await page.waitForFunction(() => window.__ev && window.__ev('ready'), null, { timeout: 20000 });
  const g = await ev('gold');
  if (g !== 4321) throw new Error('Gold nach Neuladen: ' + g);
});

const srv = await serve();
const url = 'http://127.0.0.1:' + srv.address().port + '/';
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const ctx = await browser.newContext({ ...devices['Pixel 7'], serviceWorkers: 'block', bypassCSP: true });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|fonts\.g/.test(m.text())) errs.push(m.text()); });
const ev = s => page.evaluate(s => window.__ev(s), s);
await page.goto(url);
await page.waitForFunction(() => window.__ev && window.__ev('ready'), null, { timeout: 20000 });

let failed = 0;
for (const t of tests) {
  const n = errs.length;
  try {
    await t.fn({ ev, page });
    if (errs.length > n) throw new Error('Seitenfehler: ' + errs.slice(n).join(' | '));
    console.log('ok   ' + t.name);
  } catch (e) {
    failed++;
    console.log('FAIL ' + t.name + '\n     ' + (e.message || e));
  }
}
await browser.close(); srv.close();
console.log(failed ? failed + ' von ' + tests.length + ' Tests fehlgeschlagen' : 'alle ' + tests.length + ' Tests ok');
process.exit(failed ? 1 : 0);
