// Golden Master: hält fest, was das Spiel heute erzeugt und speichert, damit jeder Umzug in src/ beweisbar nichts ändert.
// Aufruf: node tests/golden.mjs            vergleicht mit tests/fixtures/golden.json
//         node tests/golden.mjs --write    legt golden.json einmalig an (nur aus unverändertem main; bricht ab, wenn die Datei schon da ist)
//         node tests/golden.mjs --input    legt die Eingabe golden-input.json einmalig an: eine Sicherung („Spielstand sichern“) aus einer kurzen Spielrunde
// Ein Move, der hier rot wird, ist falsch. golden.json und golden-input.json werden nie aktualisiert (ADR 0001, Konsequenzen).
//
// Drei Teile, jeder mit fester Uhr (keine Bilder laufen), festem Math.random und fester Zeitzone:
//   welt       Für 3 Seeds und jedes Reich: shapeWorld()+gen() bzw. newRealm(), danach grow() bis ans Ende. Hash über Gitter und alle
//              Top-Level-Namen, die von der Weltgenerierung erreichbare Funktionen schreiben (Liste: analyze.mjs --json, gen.writes).
//   speichern  Die Eingabe-Sicherung wird in IndexedDB und localStorage gelegt, das Spiel startet daraus (Erde, Mond, alte Formate v4,
//              leerer Speicher, Import über „Spielstand laden“). Danach schreiben alle Speicherfunktionen einmal, und die Sicherung bakMake() wird je Teil gehasht.
//   generatoren  Je Rätseltyp und Stufe 0–9 zwanzig Rätsel (T.make), je Lernfakt eine Aufgabe (mkQ), mit Math.random = rng(99).
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import zlib from 'zlib';
import { createRequire } from 'module';
import { serve, ROOT } from './server.mjs';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const FIX = path.join(ROOT, 'tests', 'fixtures');
const EXP = path.join(FIX, 'golden.json');
const INP = path.join(FIX, 'golden-input.json');
const T0 = Date.UTC(2026, 0, 15, 8, 0, 0);
const SEEDS = [1, 4711, 999983];
// Von der Weltgenerierung geschriebene Top-Level-Namen (node tools/arch/analyze.mjs --json, Feld gen.writes, Stand main 7b1e009),
// dazu SEED und realm. Feste Liste, damit ein Umzug die Prüfung nicht still verkleinert.
const WORLD = ('ARROWS BIO CRE DECO DROPS EGGS FLIES LIFE LOOT MACH MATS METS MONS MROCKS OLD_END OLD_N ORBS P PADS PICKS SPACE STR VAULTS ZDEC ZN ' +
  'bio bio2 bix bmx bombs bx0 bx1 by0 by1 chest clouds eggGot g0 genF ghost grid grow0 guide hidden liqM liqY lootGot matGot mtop noCave orbGot ' +
  'parked parts props px0 px1 py0 py1 pzGot qx0 qx1 rA rB rC rD rH rx0 rx1 seen stI stamp stroke strokeId sx0 task tracks trees winC winR ' +
  'z4 zS1 zS2 zS3 zips SEED realm').split(' ');

const sha = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

// Im Browser vor dem Spiel: fester Zufall, Hash-Helfer. Die Uhr stellt page.clock.
const INIT = `(() => {
  let a = 20260115;
  Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  // Kanonische Form eines Werts: Reihenfolge der Schlüssel wie im Objekt, Typed Arrays als eigener Hash, Funktionen und DOM nur als Art, Zyklen als Rückverweis.
  window.__gm = async function (v) {
    const bins = [], seen = new Map(), out = [];
    const walk = v => {
      if (v === null) return out.push('n');
      const t = typeof v;
      if (t === 'undefined') return out.push('u');
      if (t === 'number') return out.push(Object.is(v, -0) ? '-0' : String(v));
      if (t === 'string') return out.push(JSON.stringify(v));
      if (t === 'boolean' || t === 'bigint') return out.push(t[0] + v);
      if (t === 'function') return out.push('fn');
      if (seen.has(v)) return out.push('@' + seen.get(v));
      seen.set(v, seen.size);
      if (ArrayBuffer.isView(v)) { bins.push(new Uint8Array(v.buffer, v.byteOffset, v.byteLength)); return out.push(v.constructor.name + '#' + (bins.length - 1)); }
      if (typeof Node !== 'undefined' && v instanceof Node) return out.push('dom');
      if (v instanceof Map) { out.push('M{'); for (const [k, x] of v) { walk(k); out.push(':'); walk(x); out.push(','); } return out.push('}'); }
      if (v instanceof Set) { out.push('S{'); for (const x of v) { walk(x); out.push(','); } return out.push('}'); }
      if (Array.isArray(v)) { out.push('['); for (let i = 0; i < v.length; i++) { walk(v[i]); out.push(','); } for (const k of Object.keys(v)) if (!/^\\d+$/.test(k)) { out.push(JSON.stringify(k) + ':'); walk(v[k]); out.push(','); } return out.push(']'); }
      const p = Object.getPrototypeOf(v);
      out.push((p && p !== Object.prototype && p.constructor ? p.constructor.name : '') + '{');
      for (const k of Object.keys(v)) { out.push(JSON.stringify(k) + ':'); walk(v[k]); out.push(','); }
      out.push('}');
    };
    walk(v);
    const hx = b => Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('').slice(0, 16);
    const hs = []; for (const b of bins) hs.push(hx(await crypto.subtle.digest('SHA-256', b)));
    return hx(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(out.join('') + '|' + hs.join(','))));
  };
})();`;

// Sicherung → IndexedDB und localStorage, unabhängig vom Spielcode (damit ein Umzug den Leser nicht mitprüft, den er gerade verändert).
const LOAD = async b => {
  const unb = s => { const t = atob(s), u = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) u[i] = t.charCodeAt(i); return u; };
  const dec = v => {
    if (Array.isArray(v)) return v.map(dec);
    if (v && typeof v === 'object') {
      if (typeof v.$t === 'string') { if (v.$t === 'Date') return new Date(v.$d); const u = unb(v.$b); return v.$t === 'ArrayBuffer' ? u.buffer : new window[v.$t](u.buffer); }
      const o = {}; for (const k in v) o[k] = dec(v[k]); return o;
    }
    return v;
  };
  localStorage.clear();
  for (const k in b.ls) localStorage.setItem(k, b.ls[k]);
  for (const n in b.db) {
    const d = dec(b.db[n]);
    await new Promise((res, rej) => {
      const rq = indexedDB.open(n, d.v);
      rq.onupgradeneeded = () => { for (const s in d.st) { const o = { autoIncrement: !!d.st[s].ai }; if (d.st[s].kp != null) o.keyPath = d.st[s].kp; rq.result.createObjectStore(s, o); } };
      rq.onerror = () => rej(rq.error);
      rq.onsuccess = () => {
        const db = rq.result, tx = db.transaction(Object.keys(d.st), 'readwrite');
        for (const s in d.st) { const os = tx.objectStore(s), e = d.st[s]; for (let i = 0; i < e.r.length; i++) if (os.keyPath != null) os.put(e.r[i]); else os.put(e.r[i], e.k[i]); }
        tx.oncomplete = () => { db.close(); res(); }; tx.onerror = () => rej(tx.error);
      };
    });
  }
};

// Spielstand v5 (Läufe) → v4 (rohes Gitter, Zeilen der Breite f), wie ihn ältere Versionen schrieben.
function toV4(sv, GY, wide) {
  const runs = Buffer.from(sv.runs.$b, 'base64'), f = sv.f, g = new Uint8Array(f * GY);
  let k = 0;
  for (let cx = 0; cx < f; cx++) for (let cy = 0; cy < GY;) {
    const m = runs[k++]; let r = 0, sh = 0, c;
    do { c = runs[k++]; r |= (c & 127) << sh; sh += 7; } while (c & 128);
    for (const e = cy + r; cy < e; cy++) g[cy * f + cx] = m;
  }
  if (k !== runs.length) throw new Error('Läufe in der Eingabe passen nicht');
  const o = { ...sv, v: 4, grid: { $t: 'Uint8Array', $b: Buffer.from(g).toString('base64') } };
  delete o.runs; if (!wide) delete o.w;
  return o;
}

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const srv = await serve();
const url = 'http://127.0.0.1:' + srv.address().port + '/';
const errs = [];

async function open({ fixed = true, input = null } = {}) {
  const ctx = await browser.newContext({ ...devices['Pixel 7'], serviceWorkers: 'block', bypassCSP: true, timezoneId: 'Europe/Berlin', locale: 'de-DE' });
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push(e.message));
  if (fixed) { await page.clock.install({ time: T0 }); await page.clock.pauseAt(T0); await page.addInitScript(INIT); }
  if (input) {
    await page.route(url + 'golden-blank', r => r.fulfill({ body: '<!doctype html><title>x</title>', contentType: 'text/html' }));
    await page.goto(url + 'golden-blank');
    await page.evaluate(LOAD, input);
  }
  await page.goto(url);
  await waitReady(page);
  return { ctx, page, ev: s => page.evaluate(s => window.__ev(s), s) };
}
async function waitReady(page) {
  for (let i = 0; ; i++) {
    if (await page.evaluate(() => !!(window.__ev && window.__ev('ST.ready'))).catch(() => false)) return;
    if (i > 300) throw new Error('Spiel nicht bereit');
    await new Promise(r => setTimeout(r, 100));
  }
}

// Alle Speicherfunktionen einmal schreiben lassen, dann die Sicherung je Teil hashen.
const SAVEALL = `(function(){ ST.frozen=false; fogDirty=true; optSave(); voiceSave(); saveStars(); saveFinds(); saveHero(); misSave(); fogSave(); mkSave(); saveFacts(); saveSchool(); daySave(); return bakMake().then(function(b){ return {snap:enc(snapshot()), bak:b}; }); })()`;
function saveParts(r) {
  const o = { at: r.bak.at, snapshot: {} };
  for (const k in r.snap) o.snapshot[k] = sha(JSON.stringify(r.snap[k]));
  for (const k of Object.keys(r.bak.ls).sort()) o['ls ' + k] = sha(r.bak.ls[k]);
  for (const n in r.bak.db) for (const s in r.bak.db[n].st) {
    const e = r.bak.db[n].st[s];
    o['db ' + n + '/' + s + ' keys'] = sha(JSON.stringify(e.k));
    e.k.forEach((k, i) => { o['db ' + n + '/' + s + ' ' + JSON.stringify(k)] = sha(JSON.stringify(e.r[i])); });
  }
  return o;
}

async function makeInput() {
  if (fs.existsSync(INP)) throw new Error(INP + ' gibt es schon. Die Eingabe wird nie neu erzeugt.');
  const { ctx, page, ev } = await open({ fixed: false });
  await ev(`OVS.forEach(o=>o.hidden=true); ST.paused=false;
    STAGES.m[0].slice(0,30).concat(STAGES.m[1].slice(0,10),STAGES.l[0].slice(0,15),STAGES.l[1].slice(0,5)).forEach(function(k,i){ factDone(mkQ(k), i%7===3?'miss':i%11===5?'ok2':'ok', i%3===0); });
    ST.gold+=137; ST.gems+=4; ST.energy=MAXE; hero.xp+=230; hero.up.dig=2; hero.up.jet=1; hero.pz.muster=3; hero.pz.waage=2; hero.eggs=2;
    MS.done.chick=1; marks().push([P.x|0,P.y|0,1]); OPT.calm=true; VOICE.r=1.05; SCH.on=true; SCH.zr=2; SCH.l='MAMILO';
    for(let i=0;i<40;i++){ const cx=(P.x/CELL|0)+i; setCell(cx,((surfaceY(cx*CELL)-TOP)/CELL|0)+3,0); }
    1`);
  await page.waitForTimeout(3000);
  await ev("travel('moon')"); await page.waitForTimeout(4000);
  if (await ev('realm') !== 'moon') throw new Error('Reise zum Mond fehlgeschlagen');
  await ev("OVS.forEach(o=>o.hidden=true); ST.paused=false; for(let i=0;i<20;i++){ const cx=(P.x/CELL|0)+i; setCell(cx,((surfaceY(cx*CELL)-TOP)/CELL|0)+2,0); } marks().push([P.x|0,P.y|0,2]); fogDirty=true; 1");
  await page.waitForTimeout(2000);
  await ev("travel('')"); await page.waitForTimeout(4000);
  if (await ev('realm') !== '') throw new Error('Rückreise fehlgeschlagen');
  const b = await ev(SAVEALL.replace('return {snap:enc(snapshot()), bak:b};', 'return b;'));
  delete b.ls['lavaland-err'];
  if (!b.db.lavaland || !b.db.lavaland.st.save.k.includes('planet-moon')) throw new Error('Mond fehlt in der Sicherung');
  fs.mkdirSync(FIX, { recursive: true });
  fs.writeFileSync(INP, JSON.stringify(b) + '\n');
  console.log('golden-input.json ' + Math.round(fs.statSync(INP).size / 1024) + ' KB, gzip ' + Math.round(zlib.gzipSync(fs.readFileSync(INP)).length / 1024) + ' KB, Schlüssel ' + b.db.lavaland.st.save.k.join(', '));
  await ctx.close();
}

async function run() {
  const res = { welt: {}, speichern: {}, generatoren: {} };
  const input = JSON.parse(fs.readFileSync(INP, 'utf8'));

  // Speichern: aus der Sicherung starten (Erde, Mond, v4 breit, v4 schmal) und leerer Speicher.
  const save = input.db.lavaland.st.save, wi = save.k.indexOf('world2');
  const variant = f => { const b = JSON.parse(JSON.stringify(input)); f(b, b.db.lavaland.st.save); return b; };
  const GY = 2048;
  const cases = {
    erde: input,
    mond: variant(b => { b.ls['lavaland-realm'] = 'moon'; }),
    v4: variant((b, s) => { s.r[wi] = toV4(save.r[wi], GY, true); }),
    'v4-schmal': variant((b, s) => { s.r[wi] = toV4(save.r[wi], GY, false); }),
    leer: null,
  };
  let fresh = null;
  for (const [name, inp] of Object.entries(cases)) {
    const o = await open({ input: inp });
    if (await o.ev('GY') !== GY) throw new Error('GY hat sich geändert');
    res.speichern[name] = saveParts(await o.ev(SAVEALL));
    res.speichern[name].start = await o.page.evaluate(() => window.__gm(window.__ev('({realm, SEED, genF, x:P.x, y:P.y, energy: ST.energy, gold:ST.gold, gems:ST.gems, cutX})')));
    if (name === 'leer') fresh = o; else await o.ctx.close();
  }
  // Import der Sicherung über „Spielstand laden“ (bakLoad lädt die Seite neu), danach wie oben.
  {
    const o = await open();
    if (!await o.page.evaluate(b => { window.__gmIn = b; return window.__ev('bakIn=window.__gmIn; bakOk(bakIn)'); }, input)) throw new Error('Eingabe-Sicherung nicht gültig (bakOk)');
    await Promise.all([o.page.waitForNavigation(), o.ev('bakLoad()')]);
    await waitReady(o.page);
    res.speichern.import = saveParts(await o.ev(SAVEALL));
    res.speichern.import.start = await o.page.evaluate(() => window.__gm(window.__ev('({realm, SEED, genF, x:P.x, y:P.y, energy: ST.energy, gold:ST.gold, gems:ST.gems, cutX})')));
    await o.ctx.close();
  }

  // Generatoren: im frischen Spiel.
  res.generatoren = await fresh.page.evaluate(() => window.__ev(`(async function(){
    const o={};
    for(const T of PZT) for(let lv=0;lv<10;lv++){ Math.random=rng(99+lv); const a=[]; for(let i=0;i<20;i++) a.push(T.make(lv)); o['pz '+T.id+' '+lv]=await window.__gm(a); }
    Math.random=rng(99); const ks=STAGES.m.concat(STAGES.l).flat();
    for(let i=0;i<ks.length;i+=25){ const a=[]; for(const k of ks.slice(i,i+25)) a.push(mkQ(k)); o['mkQ '+ks[i]+' …']=await window.__gm(a); }
    o['mkQ Anzahl']=String(ks.length);
    return o;
  })()`));

  // Welt: Seeds × Reiche, nach der Erzeugung und nach grow() bis ans Ende.
  const realms = [''].concat(await fresh.ev('Object.keys(RLM)'));
  for (const seed of SEEDS) for (const rl of realms) {
    const key = seed + ' ' + (rl || 'erde');
    res.welt[key] = await fresh.page.evaluate(([seed, rl, names]) => window.__ev(`(async function(){
      Math.random=rng(7); SEED=${seed}; setRealm(${JSON.stringify(rl)});
      if(realm) newRealm(); else { shapeWorld(); gen(); }
      const h={}, all=async function(p){ for(const n of ${JSON.stringify(names)}) h[p+n]=await window.__gm(eval(n)); };
      await all('');
      grow(GX*CELL); await all('grow ');
      return h;
    })()`), [seed, rl, WORLD]);
  }
  await fresh.ctx.close();
  if (errs.length) throw new Error('Seitenfehler: ' + errs.join(' | '));
  return res;
}

function diff(a, b, p = '') {
  const out = [];
  for (const k of new Set([...Object.keys(a || {}), ...Object.keys(b || {})])) {
    const x = a && a[k], y = b && b[k];
    if (x && typeof x === 'object' && y && typeof y === 'object') out.push(...diff(x, y, p + k + ' / '));
    else if (x !== y) out.push(p + k + ': erwartet ' + x + ', jetzt ' + y);
  }
  return out;
}

try {
  if (process.argv.includes('--input')) await makeInput();
  else {
    const t = Date.now(), res = await run();
    const n = o => Object.values(o).reduce((s, v) => s + (typeof v === 'object' ? n(v) : 1), 0);
    if (process.argv.includes('--write')) {
      if (fs.existsSync(EXP)) throw new Error(EXP + ' gibt es schon. Der Golden Master wird nie aktualisiert; ein Move, der ihn ändert, ist falsch.');
      fs.writeFileSync(EXP, JSON.stringify(res, null, 1) + '\n');
      console.log('golden.json geschrieben: ' + n(res) + ' Hashes');
    } else {
      const d = diff(JSON.parse(fs.readFileSync(EXP, 'utf8')), res);
      if (d.length) { console.log('FAIL Golden Master weicht ab (' + d.length + '):\n  ' + d.slice(0, 40).join('\n  ') + (d.length > 40 ? '\n  …' : '')); process.exitCode = 1; }
      else console.log('ok   Golden Master gleich: ' + n(res) + ' Hashes (' + Math.round((Date.now() - t) / 1000) + ' s)');
    }
  }
} finally { await browser.close(); srv.close(); }
