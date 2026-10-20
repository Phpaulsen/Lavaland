// Offline-Test: Nach dem ersten Besuch muss das Spiel ohne Netz starten (installierte App im Funkloch).
// Aufruf: node tests/offline.mjs
import { createRequire } from 'module';
import { serve } from './server.mjs';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const srv = await serve();
const url = 'http://127.0.0.1:' + srv.address().port + '/';
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const ctx = await browser.newContext({ ...devices['Pixel 7'], bypassCSP: true });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
const ready = () => page.waitForFunction(() => window.__ev && window.__ev('ready'), null, { timeout: 20000 });
let fail = '';
try {
  await page.goto(url); await ready();
  // Warten, bis der Service Worker aktiv ist und alle Kerndateien im Speicher liegen.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.evaluate(async () => { for (let i = 0; i < 50; i++) { const c = await caches.keys(); if (c.length) { const k = await (await caches.open(c[0])).keys(); if (k.length >= 8) return; } await new Promise(r => setTimeout(r, 200)); } });
  await page.evaluate(() => window.__ev("gold=777; saveFinds(); saveGame(false)"));
  await page.waitForTimeout(1500);
  await ctx.setOffline(true);
  await page.reload(); await ready();
  const s = await page.evaluate(() => window.__ev('({g:gold, c:!!navigator.serviceWorker.controller})'));
  if (s.g !== 777) fail = 'Spielstand offline nicht geladen (Gold ' + s.g + ')';
  else if (!s.c) fail = 'Seite nicht vom Service Worker gesteuert';
  else {
    const font = await page.evaluate(() => document.fonts.load('700 20px Andika').then(f => f.length > 0));
    if (!font) fail = 'Lernschrift offline nicht verfügbar';
  }
  if (!fail && errs.length) fail = 'Seitenfehler: ' + errs.join(' | ');
} catch (e) { fail = e.message || String(e); }
await browser.close(); srv.close();
console.log(fail ? 'FAIL offline: ' + fail : 'ok   Spiel startet offline mit Spielstand und Schrift');
process.exit(fail ? 1 : 0);
