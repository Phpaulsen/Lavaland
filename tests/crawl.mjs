// Knopftest: tippt zufällig auf alles, was gerade sichtbar und tippbar ist (Fenster, Rätsel, Elternansicht),
// und spielt jedes Rätsel auf jeder Stufe einmal durch. Jeder Seitenfehler und jeder neue Eintrag im Fehlerprotokoll lässt ihn scheitern.
// Aufruf: node tests/crawl.mjs   (CRAWL_N=Schritte, CRAWL_SEED=Startwert)
import { serve } from './server.mjs';
import { launch, phone } from './browser.mjs';

const N = +process.env.CRAWL_N || 600;
let seed = +process.env.CRAWL_SEED || Date.now() % 100000;
console.log('Startwert ' + seed + ', ' + N + ' Schritte');
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

const srv = await serve();
const url = 'http://127.0.0.1:' + srv.address().port + '/';
const browser = await launch();
const ctx = await browser.newContext({ ...phone(), serviceWorkers: 'block', bypassCSP: true });
// „Übungsblatt drucken“ ruft window.print(). Firefox öffnet dafür ein Druckfenster, das die Seite anhält: Der Knopftest hing in der CI
// jedes Mal direkt nach dem Tipp auf par-sheet (#109, #111, vorher 3 von 10 Läufen). Wie Teilen und Herunterladen wird nur das
// Fenster ersetzt, der Code hinter dem Knopf (Blatt bauen) läuft weiter.
await ctx.addInitScript(() => { window.print = () => { window.__printed = (window.__printed || 0) + 1; }; });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message + '\n' + (e.stack || '').split('\n').slice(1, 3).join('\n')));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|fonts\.g/.test(m.text())) errs.push(m.text()); });
page.on('dialog', d => d.dismiss());
const ev = s => page.evaluate(s => window.__ev(s), s);
await page.goto(url);
await page.waitForFunction(() => window.__ev && window.__ev('ready'), null, { timeout: 20000 });
await ev("localStorage.removeItem(ERRK); gold=5000; gems=50; for(const k in MAT) hero.mat[k]=20; energy=MAXE");

// Was nicht geklickt wird: Dateiauswahl, Teilen/Herunterladen, Löschen des Protokolls.
const SKIP = '#imp,#exp,#par-del,#par-dl,#par-exp,#imp-yes';
let last = '';
// Wächter: Kommt der Test 60 s lang nicht weiter, gibt er Startwert, die letzten Schritte und den Zustand der Seite aus und bricht ab.
// Sonst läuft er bis zum Job-Limit, und im Protokoll steht nichts (Firefox in CI, 7.11.).
const hist = [];
let lastT = Date.now();
const mark = s => { last = s; lastT = Date.now(); hist.push(s); if (hist.length > 15) hist.shift(); };
const seed0 = seed;
const dog = setInterval(async () => {
  if (Date.now() - lastT < 60000) return;
  clearInterval(dog);
  const alive = await Promise.race([page.evaluate(() => 1).then(() => 'antwortet (der Test wartet auf etwas)', e => 'Fehler: ' + e.message), new Promise(r => setTimeout(() => r('antwortet nicht (Endlosschleife im Spiel?)'), 5000))]);
  console.log('FAIL Knopftest hängt seit 60 s, Startwert ' + seed0 + ', Seite ' + alive + '\n     zuletzt:\n       ' + hist.join('\n       '));
  process.exit(1);
}, 5000);
const step = async () => {
  const info = await page.evaluate(([skip, r]) => {
    const all = [...document.querySelectorAll('button,[data-a],[data-go],[data-st],[data-ch],[data-shop],[data-mk],[data-pzt],[data-opt],[data-sc],[data-wear],[data-find],[data-tl]')]
      .filter(b => !b.disabled && !b.matches(skip) && b.offsetParent && b.getClientRects().length);
    // Liegt ein Fenster offen, nur darin tippen, sonst auf die Leiste.
    const ov = [...document.querySelectorAll('.ov,#quiz,#pz,#panel')].filter(o => !o.hidden).pop();
    const pool = ov ? all.filter(b => ov.contains(b)) : all;
    if (!pool.length) return null;
    const b = pool[Math.floor(r * pool.length)];
    let rc = b.getBoundingClientRect();
    if (rc.top < 0 || rc.bottom > innerHeight) { b.scrollIntoView({ block: 'center' }); rc = b.getBoundingClientRect(); }
    return { id: b.id || b.getAttribute('aria-label') || b.className, x: rc.left + rc.width / 2, y: rc.top + rc.height / 2 };
  }, [SKIP, rnd()]);
  if (!info) { await ev("OVS.forEach(o=>o.hidden=true); paused=false"); return; }
  mark('Tipp auf ' + info.id + ' (' + Math.round(info.x) + ',' + Math.round(info.y) + ')');
  await page.mouse.click(info.x, info.y);
  await page.waitForTimeout(60 + rnd() * 250);
};

let fail = '';
try {
  // 1. Jedes Rätsel auf jeder Stufe öffnen, zufällig bedienen, Tipp holen, schließen.
  const types = await ev('PZT.map(p=>p.id)');
  for (const t of types) for (let lv = 0; lv < 10; lv++) {
    mark('Rätsel ' + t + ' Stufe ' + lv);
    await ev(`OVS.forEach(o=>o.hidden=true); paused=false; hero.pz['${t}']=${lv}; pzOpen({id:'crawl-${t}-${lv}',t:'${t}',zb:0})`);
    for (let i = 0; i < 14 && !errs.length; i++) {
      const ok = await page.evaluate(r => { const bs = [...document.querySelectorAll('#pz [data-a]')].filter(b => !b.disabled && b.offsetParent); if (!bs.length) return false; bs[Math.floor(r * bs.length)].click(); return true; }, rnd());
      if (!ok) break;
      await page.waitForTimeout(20);
      if (i === 5) await ev("$('pz-hint').click()");
    }
    await ev('pzClose()');
    if (errs.length) break;
  }
  await ev("OVS.forEach(o=>o.hidden=true); paused=false; energy=MAXE");
  // 2. Zufällig tippen.
  for (let i = 0; i < N && !errs.length; i++) {
    if (i % 80 === 0) await ev("OVS.forEach(o=>o.hidden=true); pzClose(); paused=false; energy=MAXE; gold=Math.max(gold,500)");
    if (i % 150 === 75) { mark('Elternansicht'); await ev("OVS.forEach(o=>o.hidden=true); parOpen()"); await page.waitForTimeout(800); }
    await step();
  }
  const logged = await ev("errLoad().map(e=>e.m+' ('+e.w+')')");
  if (logged.length) errs.push('Fehlerprotokoll: ' + logged.join(' | '));
} catch (e) { errs.push('Testschritt „' + last + '“: ' + e.message); }
clearInterval(dog);
await browser.close(); srv.close();
if (errs.length) { console.log('FAIL Knopftest, zuletzt ' + last + '\n     ' + errs.join('\n     ')); process.exit(1); }
console.log('ok   Knopftest: alle Rätselstufen und ' + N + ' Tipps ohne Fehler');
