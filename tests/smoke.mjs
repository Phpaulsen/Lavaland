// Rauchtest: startet das Spiel in einem Handy-Browser und prüft die wichtigsten Abläufe.
// Aufruf: node tests/smoke.mjs   (braucht das npm-Paket playwright und einen Chromium)
// Optional: CHROMIUM=/pfad/zu/chrome
import { createRequire } from 'module';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ANCHOR = "document.addEventListener('visibilitychange',function(){ if(document.hidden) saveGame(false); });";
const TYPES = { '.html': 'text/html', '.json': 'application/json', '.js': 'text/javascript', '.png': 'image/png' };

// Kleiner Server, der in die Seite einen Zugang zu den internen Variablen einbaut (nur für den Test).
function serve() {
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const f = path.join(ROOT, path.normalize(p));
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
      let b = fs.readFileSync(f);
      if (p === '/index.html') {
        const s = b.toString();
        if (!s.includes(ANCHOR)) throw new Error('Testanker in index.html fehlt');
        b = Buffer.from(s.replace(ANCHOR, 'window.__ev=function(s){return eval(s);};\n' + ANCHOR));
      }
      r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
      r.end(b);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('Start ohne Fehler, Welt erzeugt', async ({ ev }) => {
  const s = await ev('({ready, w:GX, x:P.x, mode:P.mode})');
  if (!s.ready) throw new Error('Spiel nicht bereit');
  if (s.w < 10000) throw new Error('Welt zu klein: ' + s.w);
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

test('Elternansicht zeigt das Protokoll', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); paused=false; parOpen()");
  await page.waitForTimeout(1500);
  if (await ev("$('par').hidden")) throw new Error('Elternansicht nicht geöffnet');
  const t = await ev("$('par-body').textContent");
  if (!/Lernanteil/.test(t)) throw new Error('Zeitauswertung fehlt in der Elternansicht');
  if (await ev("$('par').querySelectorAll('script').length")) throw new Error('Skript in der Elternansicht');
  await ev("$('par').hidden=true");
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
