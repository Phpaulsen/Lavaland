// Leistungsmessung für PRs, die step, update, draw oder frame berühren: Median und 90. Perzentil je Aufruf in ms.
// Aufruf: node tests/perf.mjs [--n 600] [--runs 3]
// Feste Szene: frisches Spiel mit festem Zufall (also gleicher Seed und gleiche Welt), Wasser und Lava über dem Helden, Bildschleife angehalten,
// dann n Bilder in Blöcken zu 10: je Block 10× step(), 10× update(1/30) samt SIDE, 10× draw(), Zeit je Aufruf = Block/10
// (performance.now() ist im Browser auf 0,1 ms vergröbert, ein einzelner step ist kürzer). Kein Schwellwert: Die Zahlen gehören in den PR-Text, alt gegen neu auf demselben Rechner.
import { createRequire } from 'module';
import { serve } from './server.mjs';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? +process.argv[i + 1] : d; };
const N = arg('--n', 600), RUNS = arg('--runs', 3);

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const srv = await serve();
const url = 'http://127.0.0.1:' + srv.address().port + '/';
const res = { step: [], update: [], draw: [] };
try {
  for (let run = 0; run < RUNS; run++) {
    const ctx = await browser.newContext({ ...devices['Pixel 7'], serviceWorkers: 'block', bypassCSP: true, timezoneId: 'Europe/Berlin', locale: 'de-DE' });
    const page = await ctx.newPage();
    await page.addInitScript(() => { let a = 7; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; });
    await page.goto(url);
    await page.waitForFunction(() => window.__ev && window.__ev('ST.ready'), null, { timeout: 20000 });
    const r = await page.evaluate(n => window.__ev(`(function(n){
      requestAnimationFrame=function(){}; OVS.forEach(function(o){ o.hidden=true; }); ST.paused=false; ST.frozen=true;
      /* Damit der Zellautomat zu tun hat: Wasser und Lava über dem Helden. */
      const cx=P.x/CELL|0, cy=(P.y-TOP)/CELL|0;
      for(let y=cy-90;y<cy-50;y++) for(let x=cx-60;x<cx+60;x++) if(!grid[y*GX+x]) setCell(x,y,x<cx?WATER:LAVA);
      const m={step:[],update:[],draw:[]}, now=function(){ return performance.now(); };
      for(let i=0;i<60;i++){ step(); update(1/30); for(const f of SIDE) safe(f,1/30); draw(); }
      for(let b=0;b<n;b+=10){
        let t=now(); for(let i=0;i<10;i++) step(); m.step.push((now()-t)/10);
        t=now(); for(let i=0;i<10;i++){ update(1/30); for(const f of SIDE) safe(f,1/30); } m.update.push((now()-t)/10);
        t=now(); for(let i=0;i<10;i++) draw(); m.draw.push((now()-t)/10);
      }
      return m;
    })(` + n + ')'), N);
    for (const k in res) res[k].push(...r[k]);
    await ctx.close();
  }
} finally { await browser.close(); srv.close(); }

const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
console.log('| Aufruf | Median ms | p90 ms | Blöcke |\n|---|---|---|---|');
for (const k in res) console.log(`| \`${k}\` | ${q(res[k], .5).toFixed(3)} | ${q(res[k], .9).toFixed(3)} | ${res[k].length} |`);
