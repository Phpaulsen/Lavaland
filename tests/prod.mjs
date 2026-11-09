// Rauchtest gegen das Produktionsbundle: Alle anderen Browser-Tests laufen gegen den Testbuild (mit Testzugang).
// Dieser lädt die ausgelieferte index.html so, wie sie im Repo liegt, mit echter Content-Security-Policy, und prüft:
// Seite startet ohne Seitenfehler, das Spiel zeichnet, nichts landet im Fehlerprotokoll, und es gibt keinen Testzugang.
// Aufruf: node tests/prod.mjs
import { createRequire } from 'module';
import path from 'path';
import { serve, ROOT } from './server.mjs';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const srv = await serve({ '/prod.html': path.join(ROOT, 'index.html') });
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const ctx = await browser.newContext({ ...devices['Pixel 7'], serviceWorkers: 'block' });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
let fail = '';
try {
  await page.goto('http://127.0.0.1:' + srv.address().port + '/prod.html');
  await page.waitForTimeout(4000);
  const s = await page.evaluate(() => {
    const c = document.getElementById('c'), g = c.getContext('2d');
    const d = g.getImageData(c.width >> 1, c.height >> 1, 1, 1).data;
    return { ev: typeof window.__ev + typeof window.__lv + typeof window.__lvEv, drawn: d[3] > 0, err: localStorage.getItem('lavaland-err') };
  });
  if (s.ev !== 'undefinedundefinedundefined') fail = 'Produktionsbundle enthält den Testzugang';
  else if (!s.drawn) fail = 'Spielwelt nicht gezeichnet';
  else if (s.err && s.err !== '[]') fail = 'Fehlerprotokoll: ' + s.err;
  else if (errs.length) fail = 'Seitenfehler: ' + errs.join(' | ');
} catch (e) { fail = e.message || String(e); }
await browser.close(); srv.close();
console.log(fail ? 'FAIL prod: ' + fail : 'ok   Produktionsbundle startet mit echter CSP ohne Fehler und ohne Testzugang');
process.exit(fail ? 1 : 0);
