// Erzeugt die maschinell gepflegten Abschnitte von docs/architecture/architecture.md: Dateibaum mit Zweck, Importtabelle der Schichten,
// Module mit Exporten und eigenem Zustand. Alles dazwischen ist Handtext und bleibt unberührt.
// Aufruf: node tools/arch/doc.mjs          schreibt die Abschnitte neu
//         node tools/arch/doc.mjs --check  scheitert, wenn ein Abschnitt nicht zum Code passt (CI: „Architekturdoku aktuell“)
// Ein Abschnitt steht zwischen <!-- doc.mjs:NAME --> und <!-- /doc.mjs -->. Der Zweck einer Datei ist der erste Satz ihres ersten Kommentars.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { LAYERS, ALLOW, layerOf, graphOf } from './deps.mjs';

const acorn = createRequire(import.meta.url)('acorn');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DOC = path.join(ROOT, 'docs', 'architecture', 'architecture.md');

const rel = p => path.relative(ROOT, p).split(path.sep).join('/');
function walk(dir, keep) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, keep)); else if (keep(e.name)) out.push(p);
  }
  return out;
}

/** Erster Satz des ersten Kommentars (JS) oder der ersten Überschrift (Markdown) oder des Docstrings (Python). */
export function purpose(text, name) {
  let s = '';
  if (name.endsWith('.md')) s = (text.match(/^#\s+(.+)$/m) || [])[1] || '';
  else if (name.endsWith('.py')) s = (text.match(/"""([\s\S]*?)"""/) || [])[1] || '';
  else {
    const lines = text.split('\n').filter(l => !/^\s*\/\/\s*@ts-/.test(l));
    const t = lines.join('\n').trimStart();
    if (t.startsWith('/*')) s = t.slice(2, t.indexOf('*/'));
    else if (t.startsWith('//')) { const m = []; for (const l of t.split('\n')) { if (!l.startsWith('//')) break; m.push(l.slice(2)); } s = m.join(' '); }
  }
  s = s.replace(/^[\s*-]+|[\s*-]+$/g, '').replace(/\s+/g, ' ');
  const end = s.search(/[.?!](\s|$)/);
  if (end > 0) s = s.slice(0, end + 1);
  if (s.length > 180) s = s.slice(0, s.lastIndexOf(' ', 177)).replace(/[,;:]$/, '') + ' …';
  else if (s && !/[.?!…)]$/.test(s)) s += '.';
  return s.replace(/\|/g, '\\|');
}

function tree() {
  const groups = [
    ['src', walk(path.join(ROOT, 'src'), n => /\.(js|css|html)$/.test(n))],
    ['tools', walk(path.join(ROOT, 'tools'), n => /\.(mjs|py|md)$/.test(n))],
    ['tests', walk(path.join(ROOT, 'tests'), n => /\.mjs$/.test(n))],
  ];
  const fixed = { 'src/index.html': 'Vorlage der ausgelieferten Seite: HTML, CSP und Marken für CSS und Skript.', 'src/styles.css': 'Alle Stile, inline in die Seite gebaut.' };
  const out = ['| Datei | Zweck |', '|---|---|'];
  for (const [, files] of groups) for (const f of files) {
    const r = rel(f);
    out.push(`| \`${r}\` | ${fixed[r] || purpose(fs.readFileSync(f, 'utf8'), r) || '–'} |`);
  }
  return out.join('\n');
}

function imports(graph) {
  const cnt = {};
  for (const [f, imps] of Object.entries(graph)) for (const t of imps) {
    const a = layerOf(f), b = layerOf(t); if (!a || !b) continue;
    cnt[a] = cnt[a] || {}; cnt[a][b] = (cnt[a][b] || 0) + 1;
  }
  const rows = [...LAYERS, 'main'];
  const out = ['Zeile importiert Spalte: Zahl = Importe heute, · = erlaubt und ungenutzt, leer = verboten (`tools/arch/deps.mjs`).', '',
    '| von \\ nach | ' + LAYERS.join(' | ') + ' |', '|---|' + LAYERS.map(() => '---:').join('|') + '|'];
  for (const a of rows) {
    if (!ALLOW[a]) continue;
    out.push(`| **${a}** | ` + LAYERS.map(b => cnt[a] && cnt[a][b] ? String(cnt[a][b]) : ALLOW[a].includes(b) ? '·' : '').join(' | ') + ' |');
  }
  return out.join('\n');
}

/** Exporte einer Datei; export let ist eigener Zustand des Moduls. */
export function exportsOf(code) {
  const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
  const fn = [], val = [], state = [];
  for (const s of ast.body) {
    if (s.type !== 'ExportNamedDeclaration') continue;
    const d = s.declaration;
    if (!d) { s.specifiers.forEach(x => val.push(x.exported.name)); continue; }
    if (d.type === 'FunctionDeclaration' || d.type === 'ClassDeclaration') fn.push(d.id.name);
    else if (d.type === 'VariableDeclaration') for (const v of d.declarations) if (v.id.type === 'Identifier') (d.kind === 'const' ? val : state).push(v.id.name);
  }
  return { fn, val, state };
}

function modules(graph) {
  const files = Object.keys(graph).sort();
  const out = [];
  for (const L of [...LAYERS, 'main']) {
    const fs_ = files.filter(f => layerOf(f) === L); if (!fs_.length) continue;
    out.push(`#### ${L}`, '');
    for (const f of fs_) {
      const code = fs.readFileSync(path.join(ROOT, 'src', f), 'utf8');
      const e = exportsOf(code), parts = [];
      if (e.fn.length) parts.push('Funktionen: ' + e.fn.map(n => '`' + n + '`').join(', '));
      if (e.val.length) parts.push('Werte: ' + e.val.map(n => '`' + n + '`').join(', '));
      if (e.state.length) parts.push('Zustand (`export let`): ' + e.state.map(n => '`' + n + '`').join(', '));
      out.push(`- \`src/${f}\`: ${purpose(code, f)}${parts.length ? '\n  ' + parts.join('. ') + '.' : ''}`);
    }
    out.push('');
  }
  return out.join('\n').trimEnd();
}

export async function generate(doc) {
  const { build } = await import('../build.mjs');
  const { metafile } = await build();
  const graph = graphOf(metafile);
  const gen = { tree: tree(), imports: imports(graph), modules: modules(graph) };
  const seen = new Set();
  const outText = doc.replace(/<!-- doc\.mjs:(\w+) -->\n[\s\S]*?<!-- \/doc\.mjs -->/g, (m, name) => {
    if (!(name in gen)) throw new Error('unbekannter Abschnitt doc.mjs:' + name);
    seen.add(name);
    return `<!-- doc.mjs:${name} -->\n${gen[name]}\n<!-- /doc.mjs -->`;
  });
  for (const n of Object.keys(gen)) if (!seen.has(n)) throw new Error('Abschnitt <!-- doc.mjs:' + n + ' --> fehlt in ' + rel(DOC));
  return outText;
}

function selftest() {
  const cases = [
    [purpose('// @ts-nocheck\n/* ---------- Bilder: Tasten ---------- */\n', 'a.js'), 'Bilder: Tasten.'],
    [purpose('// Zufall ohne Seiteneffekte. Mehr dazu\n// zweite Zeile\n', 'a.js'), 'Zufall ohne Seiteneffekte.'],
    [purpose('# Vorlesestimme\n', 'R.md'), 'Vorlesestimme.'],
    [JSON.stringify(exportsOf('export function f(){}\nexport const A=1;\nexport let s=0;')), JSON.stringify({ fn: ['f'], val: ['A'], state: ['s'] })],
  ];
  let bad = 0;
  cases.forEach(([got, want], i) => { if (got !== want) { bad++; console.log(`FAIL Selbsttest ${i}: ${JSON.stringify(got)} statt ${JSON.stringify(want)}`); } });
  if (bad) process.exit(1);
  console.log(`ok   doc.mjs Selbsttest (${cases.length} Fälle)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) selftest();
  else {
    const cur = fs.readFileSync(DOC, 'utf8');
    const next = await generate(cur);
    if (process.argv.includes('--check')) {
      if (cur !== next) { console.log('FAIL docs/architecture/architecture.md passt nicht zum Code. Bitte „node tools/arch/doc.mjs“ ausführen und das Ergebnis committen.'); process.exit(1); }
      console.log('ok   docs/architecture/architecture.md ist aktuell');
    } else { fs.writeFileSync(DOC, next); console.log('docs/architecture/architecture.md neu erzeugt'); }
  }
}
