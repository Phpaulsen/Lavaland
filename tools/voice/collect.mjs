// Sammelt alle Sätze, die das Spiel vorlesen kann, als Liste für die Sprachaufnahmen.
// Aufruf: node tools/voice/collect.mjs > tools/voice/texts.json   (braucht playwright, wie die Tests)
// Quellen: 1. alle festen Sätze im Quelltext, 2. alle Lernaufgaben samt Lösung, 3. Rätselansagen und Aufträge mit ihren Zahlen.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { serve, ROOT } from '../../tests/server.mjs';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

// Dieselbe Satztrennung wie speakSplit() im Spiel.
const split = t => (t.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []).map(s => s.trim()).filter(Boolean);
const out = new Set();
const add = t => { for (const s of split(t)) if (/[a-zäöüß]/.test(s) && !/[<>{}=]|\\/.test(s)) out.add(s); };

// 1. Feste Sätze: jedes String-Literal, davon nur vollständige Sätze (Anfang mit Großbuchstabe, Ende mit Satzzeichen).
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
for (const m of src.matchAll(/'((?:[^'\\\n]|\\.)*)'/g)) {
  const lit = m[1];
  if (!/^[A-ZÄÖÜ]/.test(lit)) continue;
  const parts = split(lit);
  for (const s of parts) if (/^[A-ZÄÖÜ]/.test(s) && /[.!?]$/.test(s)) add(s);
}

const srv = await serve();
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const ctx = await browser.newContext({ ...devices['Pixel 7'], serviceWorkers: 'block' });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:' + srv.address().port + '/');
await page.waitForFunction(() => window.__ev && window.__ev('ready'), null, { timeout: 20000 });
const dyn = await page.evaluate(() => window.__ev(`(function(){
  const r=[];
  // 2. Lernaufgaben
  STAGES.m.concat(STAGES.l).forEach(function(st){ st.forEach(function(k){ const q=mkQ(k); r.push(q.say,q.sol,'Meisterstein! '+fName(k)+' sitzt jetzt richtig gut.'); }); });
  for(let n=1;n<=20;n++) r.push('Hier fehlt die '+n+'.');
  // 3. Rätsel: Ansagen für viele zufällige Rätsel jeder Stufe
  PZT.forEach(function(T){ for(let lv=0;lv<10;lv++) for(let i=0;i<40;i++){ try{ r.push(T.say(T.make(lv))); }catch(_){} } });
  // Aufträge mit typischen Zielzahlen
  Object.keys(QDEF).forEach(function(t){ [1,2,3,4,5,10,15,20,25,30,40,50,100,200,300,500].forEach(function(g){ Object.keys(VNAME).forEach(function(v){ try{ r.push(QDEF[t].say({type:t,goal:g,veh:v})); }catch(_){} }); }); });
  return r;
})()`));
dyn.forEach(t => typeof t === 'string' && add(t));
await browser.close(); srv.close();
process.stdout.write(JSON.stringify([...out].sort((a, b) => a.localeCompare(b, 'de')), null, 0).replace(/","/g, '",\n"') + '\n');
