// Zufallstest: drückt Tasten, tippt auf die Spielwelt, wechselt Fahrzeuge, Werkzeuge und Welten. Jeder Seitenfehler lässt den Test scheitern.
// Aufruf: node tests/fuzz.mjs   (FUZZ_SEC=Sekunden, FUZZ_SEED=Startwert)
import { createRequire } from 'module';
import { serve } from './server.mjs';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const SEC = +process.env.FUZZ_SEC || 40;
let seed = +process.env.FUZZ_SEED || Date.now() % 100000;
console.log('Startwert ' + seed + ', ' + SEC + ' s');
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const pick = a => a[Math.floor(rnd() * a.length)];

const srv = await serve();
const url = 'http://127.0.0.1:' + srv.address().port + '/';
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const ctx = await browser.newContext({ ...devices['Pixel 7'], serviceWorkers: 'block', bypassCSP: true });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|fonts\.g/.test(m.text())) errs.push(m.text()); });
const ev = s => page.evaluate(s => window.__ev(s), s);
await page.goto(url);
await page.waitForFunction(() => window.__ev && window.__ev('ready'), null, { timeout: 20000 });
await ev('OVS.forEach(o=>o.hidden=true); paused=false; energy=MAXE; gold=500');

const KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'f', 't', 'k', 'e', 'x', 'Escape'];
const MODES = ['walk', 'car', 'plane', 'ski', 'bagger', 'loader', 'dumper', 'tbm', 'rocket', 'sub', 'balloon', 'heli', 'boat', 'bug'];
const TOOLS = ['shovel', 'pick', 'bow', 'earth', 'water', 'lava', 'rope', null];
const PLACES = ['1500', 'MISX', 'SCOPEX', 'VOLC-200', 'WRECKS[0]&&WRECKS[0].x', 'HARPS[0]&&HARPS[0].x0', 'GEYS[1]', 'BOXX[2]'];
const vp = page.viewportSize();
const t0 = Date.now(); let n = 0, last = '';
while (Date.now() - t0 < SEC * 1000 && !errs.length) {
  const r = rnd(); n++;
  try {
    if (r < .35) { const k = pick(KEYS); last = 'Taste ' + k; await page.keyboard.down(k); await page.waitForTimeout(40 + rnd() * 400); await page.keyboard.up(k); }
    else if (r < .55) { const x = 20 + rnd() * (vp.width - 40), y = 200 + rnd() * (vp.height - 400); last = 'Tipp ' + Math.round(x) + ',' + Math.round(y); await page.mouse.click(x, y); }
    else if (r < .65) { const m = pick(MODES); last = 'Modus ' + m; await ev("OVS.forEach(o=>o.hidden=true); paused=false; energy=MAXE; MODES.indexOf('" + m + "')>=0&&setMode('" + m + "')"); }
    else if (r < .75) { const t = pick(TOOLS); last = 'Werkzeug ' + t; await ev("OVS.forEach(o=>o.hidden=true); paused=false; energy=MAXE; setMode('walk'); setTool(" + (t ? "'" + t + "'" : 'null') + ',true)'); }
    else if (r < .83) { const p = pick(PLACES); last = 'Ort ' + p; await ev("OVS.forEach(o=>o.hidden=true); paused=false; { const x=" + p + "; if(x>0) teleport(x); }"); await page.waitForTimeout(300); }
    else if (r < .87) { last = 'Nacht'; await ev('nightOn=!nightOn'); }
    else if (r < .89) { const w = pick(['moon', '', 'ice', '']); last = 'Reise ' + w; await ev("OVS.forEach(o=>o.hidden=true); paused=false; energy=MAXE; RLM['" + w + "']||'" + w + "'===''?travel('" + w + "'):0"); await page.waitForTimeout(3500); }
    else if (r < .92) { last = 'Mission'; await ev("OVS.forEach(o=>o.hidden=true); paused=false; setMode('walk'); teleport(MISX); P.x=MISX; P.y=ground(MISX); P.on=true; doAction()"); await page.waitForTimeout(500); }
    else if (r < .95) { last = 'Fernrohr'; await ev("OVS.forEach(o=>o.hidden=true); paused=false; realm===''&&scopeOpen()"); await page.waitForTimeout(200); await page.mouse.click(vp.width / 2, vp.height * .62); }
    else if (r < .96) { last = 'Seilrutsche'; await ev("OVS.forEach(o=>o.hidden=true); paused=false; setMode('walk'); zipAdd&&zipAdd(P.x-40,P.y-120,P.x+260,P.y-20); doAction()"); }
    else if (r < .97) { last = 'Haken'; await ev("OVS.forEach(o=>o.hidden=true); paused=false; energy=MAXE; setMode('heli'); doAction(); doAction()"); }
    else if (r < .98) { last = 'Neuladen'; await ev('saveGame(false)'); await page.waitForTimeout(800); await page.reload(); await page.waitForFunction(() => window.__ev && window.__ev('ready'), null, { timeout: 20000 }); await ev('OVS.forEach(o=>o.hidden=true); paused=false; energy=MAXE'); }
    else { last = 'Warten'; await page.waitForTimeout(600); }
  } catch (e) { errs.push('Testschritt „' + last + '“: ' + e.message); }
}
await browser.close(); srv.close();
if (errs.length) { console.log('FAIL nach ' + n + ' Schritten, zuletzt ' + last + '\n     ' + errs.join('\n     ')); process.exit(1); }
console.log('ok   ' + n + ' Zufallsschritte ohne Seitenfehler');
