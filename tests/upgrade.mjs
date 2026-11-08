// Update-Test: Ein Spielstand der Live-Version (main) muss nach dem Update unverändert weiterlaufen.
// Aufruf: OLD=/pfad/zur/alten/index.html node tests/upgrade.mjs
// Im CI: git show origin/main:index.html > /tmp/old.html
import { createRequire } from 'module';
import fs from 'fs';
import { serve } from './server.mjs';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const OLD = process.env.OLD;
if (!OLD || !fs.existsSync(OLD)) { console.log('skip upgrade: OLD nicht gesetzt'); process.exit(0); }

const srv = await serve({ '/old/index.html': OLD });
const base = 'http://127.0.0.1:' + srv.address().port;
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const ctx = await browser.newContext({ ...devices['Pixel 7'], serviceWorkers: 'block', bypassCSP: true });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
const ev = s => page.evaluate(s => window.__ev(s), s);
// Seit PR 14a liegen gold und gems hinter der Fassade ST. Die alte Seite kann älter sein: dann gibt es noch die bloßen Namen.
const V = n => `('${n}' in ST?ST.${n}:${n})`;
// Die alte Seite (main) kann ready noch als bloßen Namen haben: Im Bündel liegen Modulnamen im selben Gültigkeitsbereich, darum geht ready auf beiden.
const ready = () => page.waitForFunction(() => window.__ev && window.__ev('ready'), null, { timeout: 30000 });

// Ein Loch an fester Stelle graben: 20 Spalten, 6 Zeilen unter der Oberfläche.
const DIG = `(function(){
  const out=[];
  for(let cx=400;cx<420;cx++){ let r=0; while(r<GY&&grid[r*GX+cx]===0) r++; for(let k=2;k<8;k++){ grid[(r+k)*GX+cx]=0; out.push([cx,r+k]); } }
  return out; })()`;
let fail = '';
try {
  await page.goto(base + '/old/'); await ready();
  const holes = await ev(DIG);
  const before = await ev('({gold:'+V('gold')+', gems:'+V('gems')+', zr:hero.mat.zr|0, lv:hero.lv|0, xp:hero.xp|0, x:Math.round(P.x), gy:GY, top:TOP, seed:SEED})');
  await ev("('gold' in ST?(ST.gold=4242):(gold=4242)); saveFinds(); saveHero(); saveGame(false)");
  await page.waitForTimeout(2000);
  errs.length = 0;
  await page.goto(base + '/'); await ready();
  await page.waitForTimeout(1000);
  const after = await ev('({gold:'+V('gold')+', gems:'+V('gems')+', zr:hero.mat.zr|0, lv:hero.lv|0, xp:hero.xp|0, x:Math.round(P.x), gy:GY, top:TOP, seed:SEED})');
  const dug = await ev('(' + JSON.stringify(holes) + ').filter(function(h){ return grid[h[1]*GX+h[0]]!==0; }).length');
  // Seit Streich-PR 2a wird Gold beim Start einmal in Zahnräder getauscht: je angefangene 50 Gold und 10 Edelsteine ein Zahnrad.
  const zr = before.zr + Math.ceil(4242 / 50) + Math.ceil(before.gems / 10);
  if (after.gold !== 0 || after.gems !== 0) fail = 'Gold/Edelsteine nicht getauscht: ' + after.gold + '/' + after.gems;
  else if (after.zr !== zr) fail = 'Zahnräder nach Tausch: ' + after.zr + ' statt ' + zr;
  else if (after.seed !== before.seed) fail = 'Neue Welt statt alter: Seed ' + before.seed + ' -> ' + after.seed;
  else if (after.lv !== before.lv || after.xp !== before.xp) fail = 'Heldenstand verändert';
  else if (Math.abs(after.x - before.x) > 60) fail = 'Position verloren: ' + before.x + ' -> ' + after.x;
  else if (dug) fail = dug + ' gegrabene Zellen wieder voll';
  else if (errs.length) fail = 'Seitenfehler: ' + errs.join(' | ');
} catch (e) { fail = e.message || String(e); }
await browser.close(); srv.close();
console.log(fail ? 'FAIL upgrade: ' + fail : 'ok   Spielstand der Live-Version läuft nach dem Update weiter');
process.exit(fail ? 1 : 0);
