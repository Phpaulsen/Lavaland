// Spielstand-Test: Der Spielstand des Kindes darf nie verloren gehen.
// 1. Ein Stand, der sich nicht laden lässt, wird gerettet statt überschrieben.
// 2. Ist die Datenbank beim Start nicht lesbar, schreibt das Spiel nichts hinein; beim nächsten Start ist der alte Stand wieder da.
// 3. Sichern und Laden über die Datei bringt alles zurück (Welt, Held, Lernstand, Protokoll, Karte).
// Aufruf: node tests/save.mjs
import { createRequire } from 'module';
import { serve } from './server.mjs';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const srv = await serve();
const url = 'http://127.0.0.1:' + srv.address().port + '/';
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const ctx = await browser.newContext({ ...devices['Pixel 7'], serviceWorkers: 'block', bypassCSP: true });
// Schalter für Teil 2: Bis zu dieser Uhrzeit lässt sich keine Datenbank öffnen, danach wieder (kurze Störung wie auf Android bei vollem Speicher).
await ctx.addInitScript(() => {
  const open = indexedDB.open.bind(indexedDB);
  indexedDB.open = function () { if (+sessionStorage.getItem('test-idb-kaputt-bis') > Date.now()) throw new Error('Test: Datenbank kaputt'); return open.apply(null, arguments); };
});
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
const ev = s => page.evaluate(s => window.__ev(s), s);
const ready = () => page.waitForFunction(() => window.__ev && window.__ev('ready'), null, { timeout: 20000 });
// Liest einen Eintrag direkt aus der Datenbank, ohne das Spiel.
const raw = key => page.evaluate(k => new Promise((res, rej) => {
  const rq = indexedDB.open('lavaland', 1);
  rq.onsuccess = () => { const db = rq.result, g = db.transaction('save').objectStore('save').get(k); g.onsuccess = () => { db.close(); res(g.result === undefined ? null : { seed: g.result.seed, n: (g.result.runs || []).length, px: g.result.px }); }; g.onerror = () => rej(g.error); };
  rq.onerror = () => rej(rq.error);
}), key);
const keys = () => page.evaluate(() => new Promise(res => { const rq = indexedDB.open('lavaland', 1); rq.onsuccess = () => { const db = rq.result, g = db.transaction('save').objectStore('save').getAllKeys(); g.onsuccess = () => { db.close(); res(g.result); }; }; }));

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('Nicht ladbarer Spielstand wird gerettet, nicht überschrieben', async () => {
  await page.goto(url); await ready();
  await ev('saveGame(false)'); await page.waitForTimeout(1200);
  const good = await raw('world2');
  // Kaputt machen: Die Läufe passen nicht mehr zur Welt, restore() wirft.
  await page.evaluate(() => new Promise(res => { const rq = indexedDB.open('lavaland', 1); rq.onsuccess = () => { const db = rq.result, tx = db.transaction('save', 'readwrite'), st = tx.objectStore('save'), g = st.get('world2'); g.onsuccess = () => { const v = g.result; v.runs = v.runs.slice(0, v.runs.length - 5); st.put(v, 'world2'); }; tx.oncomplete = () => { db.close(); res(); }; }; }));
  const broken = await raw('world2');
  await page.reload(); await ready();
  await ev('saveGame(false)'); await page.waitForTimeout(1200);
  const ks = await keys();
  const rk = ks.find(k => /^rescue-world2-/.test(k));
  if (!rk) throw new Error('kein Rettungseintrag: ' + ks.join(', '));
  const r = await raw(rk);
  if (r.seed !== good.seed || r.n !== broken.n) throw new Error('Rettung enthält nicht den alten Stand');
  if (!(await ev("errLoad().some(e=>/gerettet/.test(e.m))"))) throw new Error('Rettung fehlt im Fehlerprotokoll');
  await ev('localStorage.removeItem(ERRK)');
});

test('Datenbank beim Start kurz nicht lesbar: nichts wird überschrieben', async () => {
  await page.goto(url); await ready();
  await ev('saveGame(false)'); await page.waitForTimeout(1200);
  const before = await raw('world2');
  // Kurzer Aussetzer: Der zweite Versuch klappt, der alte Stand ist sofort da.
  await page.evaluate(() => sessionStorage.setItem('test-idb-kaputt-bis', String(Date.now() + 400)));
  await page.reload(); await ready();
  if (await ev('SEED') !== before.seed || await ev('diskLock')) throw new Error('Nach kurzem Aussetzer nicht der alte Stand');
  // Längerer Aussetzer: Ersatzwelt, die nach der Störung nicht gespeichert wird.
  await page.evaluate(() => sessionStorage.setItem('test-idb-kaputt-bis', String(Date.now() + 3000)));
  await page.reload(); await ready();
  await page.waitForTimeout(3200);
  await ev('saveGame(false); packStart(); for(let i=0;i<500&&packJob;i++) packStep()'); await page.waitForTimeout(800);
  await page.reload(); await ready();
  const after = await raw('world2');
  if (after.seed !== before.seed || await ev('SEED') !== before.seed) throw new Error('Alter Stand weg: Seed ' + before.seed + ' -> ' + after.seed);
  await ev('localStorage.removeItem(ERRK)');
});

test('Sichern und Laden bringt alles zurück', async () => {
  await page.goto(url); await ready();
  await ev("OVS.forEach(o=>o.hidden=true); gold=2468; hero.xp=33; FS.f['2+3']=[4,dayNo()+3]; saveFacts(); fogSet(fogArr(),3,3); fogSave(); LOG.qOpen(); LOG.flush()");
  await page.waitForTimeout(800);
  const want = await ev("({gold, xp:hero.xp, seed:SEED, f:FS.f['2+3'][0], fog:localStorage.getItem(fogKey())})");
  const bak = await page.evaluate(() => window.__ev('bakMake()').then(b => JSON.stringify(b)));
  // Danach alles anders: neue Welt, wenig Gold, Lernstand weg.
  await ev("resetWorld(newSeed()); gold=1; hero.xp=0; FS.f={}; saveFacts(); saveFinds(); saveHero(); saveGame(false); fogSet(fogArr(),9,9); fogDirty=true");
  await page.waitForTimeout(1200);
  await page.evaluate(s => { window.__ev('bakIn=' + s + '; bakLoad()'); }, bak);
  await page.waitForEvent('load', { timeout: 20000 }); await ready();
  await page.waitForTimeout(500);
  const got = await ev("({gold, xp:hero.xp, seed:SEED, f:(FS.f['2+3']||[0])[0], fog:localStorage.getItem(fogKey())})");
  for (const k in want) if (got[k] !== want[k]) throw new Error(k + ': ' + JSON.stringify(want[k]).slice(0, 40) + ' -> ' + JSON.stringify(got[k]).slice(0, 40));
  const ev0 = await page.evaluate(() => window.__ev('parGet()').then(o => o.ev.length));
  if (!(ev0 > 0)) throw new Error('Protokoll nicht zurück');
});

let failed = 0;
for (const t of tests) {
  const n = errs.length;
  try {
    await t.fn();
    if (errs.length > n) throw new Error('Seitenfehler: ' + errs.slice(n).join(' | '));
    console.log('ok   ' + t.name);
  } catch (e) { failed++; console.log('FAIL ' + t.name + '\n     ' + (e.message || e)); }
}
await browser.close(); srv.close();
console.log(failed ? failed + ' von ' + tests.length + ' Tests fehlgeschlagen' : 'alle ' + tests.length + ' Spielstand-Tests ok');
process.exit(failed ? 1 : 0);
