// Prüft die Schichtregeln aus docs/architecture/target.md Abschnitt 3 auf dem esbuild-Metafile (dieselbe Sicht wie der Bundler).
// Aufruf: node tools/arch/deps.mjs            prüft den Build aus src/
//         node tools/arch/deps.mjs --selftest prüft die Prüfung an erfundenen Graphen
// Regeln: Importtabelle je Schicht, keine Zyklen zwischen Dateien, legacy.js importiert nur main.js oder testing/,
// in core/ kein document, window, localStorage, indexedDB, ctx. und Math.random. legacy.js selbst ist ausgenommen, bis es gelöscht ist.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LAYERS = ['core', 'state', 'persistence', 'log', 'audio', 'systems', 'render', 'ui', 'app', 'testing'];
const ALLOW = {
  core: ['core'],
  state: ['core', 'state'],
  persistence: ['core', 'state', 'persistence'],
  log: ['core', 'log'],
  audio: ['core', 'audio'],
  systems: ['core', 'state', 'audio', 'systems'],
  render: ['core', 'state', 'render'],
  ui: ['core', 'state', 'audio', 'render', 'ui'],
  app: LAYERS.filter(l => l !== 'testing'),
  testing: [...LAYERS, 'legacy', 'main'],
  main: [...LAYERS, 'legacy'],
  legacy: [...LAYERS],
};
const CORE_BAN = [[/\bdocument\b/, 'document'], [/\bwindow\b/, 'window'], [/\blocalStorage\b/, 'localStorage'], [/\bindexedDB\b/, 'indexedDB'], [/\bctx\./, 'ctx.'], [/\bMath\.random\b/, 'Math.random']];

/** Schicht einer Datei relativ zu src/ (z. B. core/rng.js → core), oder null für Dateien außerhalb der Tabelle. */
export function layerOf(rel) {
  if (rel === 'main.js') return 'main';
  if (rel === 'legacy.js') return 'legacy';
  const top = rel.split('/')[0];
  return LAYERS.includes(top) && rel.includes('/') ? top : null;
}

/** Tarjan: stark zusammenhängende Komponenten mit mehr als einer Datei oder einer Selbstkante. */
function cycles(nodes, adj) {
  let n = 0; const I = new Map(), low = new Map(), st = [], on = new Set(), out = [];
  const go = v => {
    I.set(v, n); low.set(v, n); n++; st.push(v); on.add(v);
    for (const w of adj.get(v) || []) {
      if (!I.has(w)) { go(w); low.set(v, Math.min(low.get(v), low.get(w))); } else if (on.has(w)) low.set(v, Math.min(low.get(v), I.get(w)));
    }
    if (low.get(v) === I.get(v)) { const c = []; let w; do { w = st.pop(); on.delete(w); c.push(w); } while (w !== v); if (c.length > 1 || (adj.get(v) || []).includes(v)) out.push(c.sort()); }
  };
  for (const v of nodes) if (!I.has(v)) go(v);
  return out;
}

/**
 * Prüft einen Importgraphen. graph: { 'core/rng.js': ['core/x.js', …], … } (Pfade relativ zu src/), text: Dateiinhalt je Pfad (für core-Verbote).
 * @returns {string[]} Fehler
 */
export function check(graph, text = {}) {
  const err = [];
  for (const [f, imps] of Object.entries(graph)) {
    const lf = layerOf(f);
    if (!lf) { err.push(`${f}: liegt in keiner Schicht (erlaubt: ${LAYERS.join(', ')}, main.js, legacy.js)`); continue; }
    for (const t of imps) {
      const lt = layerOf(t);
      if (!lt) { err.push(`${f} → ${t}: Ziel liegt in keiner Schicht`); continue; }
      if (lt === 'legacy' && lf !== 'main' && lf !== 'testing') err.push(`${f} → legacy.js: nur main.js und testing/ dürfen legacy.js importieren`);
      else if (!ALLOW[lf].includes(lt)) err.push(`${f} → ${t}: ${lf} darf ${lt} nicht importieren (erlaubt: ${ALLOW[lf].join(', ')})`);
    }
    if (lf === 'core' && text[f] != null) {
      const code = text[f].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      for (const [re, name] of CORE_BAN) if (re.test(code)) err.push(`${f}: ${name} in core/ verboten (core rechnet nur, Zufall kommt als Parameter)`);
    }
  }
  const adj = new Map(Object.entries(graph));
  for (const c of cycles(Object.keys(graph), adj)) err.push('Zyklus: ' + c.join(' → '));
  return err;
}

/** Graph aus dem esbuild-Metafile, nur Dateien unter src/. */
export function graphOf(metafile) {
  const g = {}, rel = p => path.relative(path.join(ROOT, 'src'), path.resolve(ROOT, p)).split(path.sep).join('/');
  for (const [p, inp] of Object.entries(metafile.inputs)) {
    const r = rel(p); if (r.startsWith('..')) continue;
    g[r] = inp.imports.filter(i => !i.external).map(i => rel(i.path)).filter(x => !x.startsWith('..'));
  }
  return g;
}

function selftest() {
  const cases = [
    [{ 'main.js': ['legacy.js', 'core/rng.js'], 'legacy.js': ['core/rng.js'], 'core/rng.js': [] }, {}, 0],
    [{ 'core/a.js': ['state/w.js'], 'state/w.js': [] }, {}, 1],
    [{ 'ui/a.js': ['persistence/s.js'], 'persistence/s.js': [] }, {}, 1],
    [{ 'core/a.js': ['core/b.js'], 'core/b.js': ['core/a.js'] }, {}, 1],
    [{ 'render/a.js': ['legacy.js'], 'legacy.js': [] }, {}, 1],
    [{ 'core/a.js': [] }, { 'core/a.js': 'export const f=()=>Math.random();' }, 1],
    [{ 'core/a.js': [] }, { 'core/a.js': '// Math.random nur im Kommentar\nexport const f=r=>r();' }, 0],
    [{ 'foo.js': [] }, {}, 1],
    [{ 'app/a.js': ['ui/b.js', 'systems/c.js'], 'ui/b.js': [], 'systems/c.js': [] }, {}, 0],
  ];
  let bad = 0;
  cases.forEach(([g, t, n], i) => { const e = check(g, t); if (e.length !== n) { bad++; console.log(`FAIL Selbsttest ${i}: erwartet ${n} Fehler, bekommen ${e.length}: ${e.join('; ')}`); } });
  if (bad) process.exit(1);
  console.log(`ok   deps.mjs Selbsttest (${cases.length} Fälle)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) selftest();
  else {
    const { build } = await import('../build.mjs');
    const { metafile } = await build();
    const g = graphOf(metafile), text = {};
    for (const f of Object.keys(g)) if (layerOf(f) === 'core') text[f] = fs.readFileSync(path.join(ROOT, 'src', f), 'utf8');
    const err = check(g, text);
    if (err.length) { console.log('FAIL Schichtregeln:\n  ' + err.join('\n  ')); process.exit(1); }
    console.log(`ok   Schichtregeln: ${Object.keys(g).length} Dateien, ${Object.values(g).flat().length} Importe, keine Zyklen`);
  }
}
