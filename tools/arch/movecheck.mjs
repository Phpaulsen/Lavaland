// Move-Nachweis: Jeder Top-Level-Name aus src/ des Basisstands ist im neuen Stand entweder AST-gleich (gleiche oder andere Datei),
// mit genau den erlaubten mechanischen Umschreibungen bewegt, oder im PR ausdrücklich als geändert/entfernt genannt.
// Aufruf: node tools/arch/movecheck.mjs [--base origin/main] [--moves tools/arch/moves.json]
//         node tools/arch/movecheck.mjs --selftest
// moves.json (je PR neu, steht im PR-Text):
//   renames  { neuerName: alterName }         Funktion zieht unter neuem Namen um
//   params   { neuerName: "rand" }            Funktion bekommt den Parameter vorn; Math.random im alten Körper wird zu ihm,
//                                             Aufrufe anderer so bewegter Funktionen bekommen ihn als erstes Argument.
//            { neuerName: ["rand=Math.random", "FS"] }  mehrere; "FS" ist ein Parameter gleichen Namens statt des Top-Level-Namens
//   wrappers { alterName: neuerName }         in bewegten Funktionen wird alterName(…) zu neuerName(rand, …) (Einzeiler wie ri → riWith)
//   facade   { "name": "W", "names": [...] }  Bezug x wird zu W.x (Übergangsfassade, ADR 0001 Punkt 9)
//   changed  [...]                            Name bleibt, Inhalt ändert sich bewusst (z. B. Einzeiler, der an core/ weitergibt)
//   added, removed [...]                      neue bzw. gelöschte Namen
// Verglichen wird der AST ohne Positionen und ohne Schreibweise von Literalen. Anweisungen auf oberster Ebene, die nichts deklarieren
// (Ereignis-Handler, try-Blöcke beim Laden), müssen als Menge gleich bleiben. Import-Deklarationen werden nicht verglichen.
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import * as acorn from 'acorn';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };

/** Top-Level-Deklarationen und sonstige Anweisungen einer Datei. In legacy.js zählt der Körper der äußeren IIFE als oberste Ebene. */
export function topOf(code, file) {
  const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module', allowHashBang: true });
  const decl = new Map(), stmts = [];
  const take = body => {
    for (let s of body) {
      if (s.type === 'ImportDeclaration') continue;
      if ((s.type === 'ExportNamedDeclaration' || s.type === 'ExportDefaultDeclaration') && s.declaration) s = s.declaration;
      if (s.type === 'ExpressionStatement' && s.expression.type === 'CallExpression' && s.expression.callee.type === 'FunctionExpression' && !s.expression.arguments.length && /(^|\/)legacy\.js$/.test(file)) { take(s.expression.callee.body.body); continue; }
      if (s.type === 'FunctionDeclaration' || s.type === 'ClassDeclaration') { add(s.id.name, s); continue; }
      if (s.type === 'VariableDeclaration' && s.declarations.every(d => d.id.type === 'Identifier')) {
        for (const d of s.declarations) add(d.id.name, { type: 'Var', kind: s.kind, init: d.init });
        continue;
      }
      stmts.push(s);
    }
  };
  const add = (n, node) => { if (decl.has(n)) throw new Error(`${file}: ${n} doppelt deklariert`); decl.set(n, { node, file }); };
  take(ast.body);
  return { decl, stmts: stmts.map(s => ({ node: s, file })) };
}

const SKIP = new Set(['start', 'end', 'loc', 'range', 'raw']);
const norm = n => JSON.stringify(n, (k, v) => SKIP.has(k) ? undefined : v);
const clone = n => JSON.parse(JSON.stringify(n));
const id = name => ({ type: 'Identifier', name });

/** Wendet die erlaubten Umschreibungen auf einen alten Knoten an. */
export function transform(node, moves, own) {
  const ren = {}; for (const [n, o] of Object.entries(moves.renames || {})) ren[o] = n;
  const fac = moves.facade ? new Set(moves.facade.names) : null, wrap = moves.wrappers || {};
  // params: "rand" (kurz für ["rand=Math.random"]) oder eine Liste. "rand=Math.random": Math.random im alten Körper wird zu rand.
  // "FS": neuer Parameter gleichen Namens, der den Top-Level-Namen verdeckt; der Körper bleibt dafür unverändert.
  const plist = n => { const v = (moves.params || {})[n]; if (!v) return []; return (typeof v === 'string' ? [v + '=Math.random'] : v).map(e => { const [name, src] = e.split('='); return { name, random: src === 'Math.random' }; }); };
  const mine = own ? plist(own) : [], rnd = (mine.find(e => e.random) || {}).name, moved = !!own && own in (moves.renames || {});
  // Bezüge auf umbenannte Namen werden nur innerhalb bewegter Funktionen umgeschrieben; legacy.js ruft weiter den alten Namen (Einzeiler).
  const n0 = clone(node);
  const walk = (x, parent, key) => {
    if (!x || typeof x !== 'object') return x;
    if (Array.isArray(x)) { for (let i = 0; i < x.length; i++) x[i] = walk(x[i], parent, key); return x; }
    // Math.random → Parameter
    if (rnd && x.type === 'MemberExpression' && !x.computed && x.object.type === 'Identifier' && x.object.name === 'Math' && x.property.name === 'random') return id(rnd);
    if (moved && x.type === 'CallExpression' && x.callee.type === 'Identifier') {
      const c = x.callee.name;
      // Aufruf einer mit Parametern bewegten Funktion: neuer Name, ihre Parameter vorn (gleich benannt wie hier)
      if (ren[c] && plist(ren[c]).length) { x.callee = id(ren[c]); x.arguments = [...plist(ren[c]).map(e => id(e.name)), ...x.arguments.map(a => walk(a, x, 'arguments'))]; return x; }
      // Aufruf eines Einzeilers aus legacy.js (z. B. ri → riWith): die core-Fassung mit dem Zufallsparameter vorn
      if (wrap[c] && rnd) { x.callee = id(wrap[c]); x.arguments = [id(rnd), ...x.arguments.map(a => walk(a, x, 'arguments'))]; return x; }
    }
    if (x.type === 'Property' && !x.computed) { if (x.shorthand) { x.value = walk(x.value, x, 'value'); if (x.value.type !== 'Identifier' || x.value.name !== x.key.name) x.shorthand = false; return x; } x.value = walk(x.value, x, 'value'); return x; }
    if (x.type === 'MemberExpression' && !x.computed) { x.object = walk(x.object, x, 'object'); return x; }
    if (x.type === 'MethodDefinition' || x.type === 'PropertyDefinition') { if (x.computed) x.key = walk(x.key, x, 'key'); x.value = walk(x.value, x, 'value'); return x; }
    if (x.type === 'LabeledStatement' || x.type === 'BreakStatement' || x.type === 'ContinueStatement') { if (x.body) x.body = walk(x.body, x, 'body'); return x; }
    if (x.type === 'Identifier') {
      if (fac && fac.has(x.name)) return { type: 'MemberExpression', object: id(moves.facade.name), property: id(x.name), computed: false, optional: false };
      if (moved && ren[x.name]) return id(ren[x.name]);
      return x;
    }
    for (const k of Object.keys(x)) if (!SKIP.has(k) && k !== 'type') x[k] = walk(x[k], x, k);
    return x;
  };
  // Eigener Name und eigene Parameter sind Deklarationen, keine Bezüge.
  if ((n0.type === 'FunctionDeclaration' || n0.type === 'ClassDeclaration') && n0.id) { n0.id = id(own || n0.id.name); }
  const params = n0.params; if (params) n0.params = [];
  walk(n0);
  if (params) n0.params = mine.map(e => id(e.name)).concat(params);
  return n0;
}

/** Vergleicht zwei Stände ({ Pfad: Code }). Gibt Fehler und Bericht zurück. */
export function compare(base, head, moves) {
  const B = { decl: new Map(), stmts: [] }, H = { decl: new Map(), stmts: [] };
  for (const [S, files] of [[B, base], [H, head]]) for (const [f, c] of Object.entries(files)) {
    const t = topOf(c, f);
    for (const [n, d] of t.decl) { if (S.decl.has(n)) throw new Error(`${n} in ${S.decl.get(n).file} und ${f}`); S.decl.set(n, d); }
    S.stmts.push(...t.stmts);
  }
  const err = [], rep = { same: 0, moved: [], changed: [], added: [], removed: [] };
  const renames = moves.renames || {}, srcOf = new Set(Object.values(renames));
  const listed = k => new Set(moves[k] || []);
  const changed = listed('changed'), added = listed('added'), removed = listed('removed');
  for (const [n, o] of Object.entries(renames)) {
    if (!B.decl.has(o)) { err.push(`rename ${n}=${o}: ${o} gibt es im Basisstand nicht`); continue; }
    if (!H.decl.has(n)) { err.push(`rename ${n}=${o}: ${n} gibt es im neuen Stand nicht`); continue; }
    if (norm(transform(B.decl.get(o).node, moves, n)) !== norm(H.decl.get(n).node)) err.push(`${o} → ${n} (${H.decl.get(n).file}): AST weicht über die erlaubten Umschreibungen hinaus ab`);
    else rep.moved.push(`${o} → ${H.decl.get(n).file}:${n}`);
  }
  for (const [n, b] of B.decl) {
    const h = H.decl.get(n);
    if (!h) { if (srcOf.has(n)) continue; if (removed.has(n)) rep.removed.push(n); else err.push(`${n} (${b.file}) fehlt im neuen Stand und steht nicht unter removed`); continue; }
    const same = norm(transform(b.node, moves, n)) === norm(h.node);
    if (same) { if (b.file === h.file) rep.same++; else rep.moved.push(`${n}: ${b.file} → ${h.file}`); if (changed.has(n)) err.push(`${n} steht unter changed, ist aber unverändert`); }
    else if (changed.has(n)) rep.changed.push(`${n} (${h.file})`);
    else err.push(`${n} (${b.file} → ${h.file}): AST verschieden, steht nicht unter changed`);
  }
  for (const [n, h] of H.decl) if (!B.decl.has(n) && !(n in renames)) { if (added.has(n)) rep.added.push(`${n} (${h.file})`); else err.push(`${n} (${h.file}) ist neu und steht nicht unter added`); }
  const ms = s => s.map(x => norm(transform(x.node, moves))).sort(), hs = H.stmts.map(x => norm(x.node)).sort(), bs = ms(B.stmts);
  if (bs.join('\n') !== hs.join('\n')) err.push(`Anweisungen auf oberster Ebene verschieden (${bs.length} vorher, ${hs.length} nachher)`);
  return { err, rep };
}

function filesAt(ref) {
  const out = {};
  const ls = execFileSync('git', ['ls-tree', '-r', '--name-only', ref, 'src/'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(f => f.endsWith('.js'));
  for (const f of ls) out[f.slice(4)] = execFileSync('git', ['show', ref + ':' + f], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 });
  return out;
}
function filesNow() {
  const out = {}, walk = d => { for (const e of fs.readdirSync(path.join(ROOT, 'src', d), { withFileTypes: true })) { const r = d ? d + '/' + e.name : e.name; if (e.isDirectory()) walk(r); else if (r.endsWith('.js')) out[r] = fs.readFileSync(path.join(ROOT, 'src', r), 'utf8'); } };
  walk(''); return out;
}

function selftest() {
  const L = b => '(function(){\n' + b + '\n})();';
  const T = [
    ['unverändert', { 'legacy.js': L('function a(){return 1}') }, { 'legacy.js': L('function a(){return 1}') }, {}, 0],
    ['bewegt', { 'legacy.js': L('function a(){return 1}') }, { 'legacy.js': L(''), 'core/a.js': 'export function a(){return 1}' }, {}, 0],
    ['bewegt und verändert', { 'legacy.js': L('function a(){return 1}') }, { 'legacy.js': L(''), 'core/a.js': 'export function a(){return 2}' }, {}, 1],
    ['Zufall als Parameter', { 'legacy.js': L('function ri(a,b){return a+Math.floor(Math.random()*(b-a+1))}\nfunction sh(x){const j=ri(0,3);return x[j]}') },
      { 'legacy.js': L('function ri(a,b){return riW(Math.random,a,b)}\nfunction sh(x){return shW(Math.random,x)}'), 'core/r.js': 'export function riW(r,a,b){return a+Math.floor(r()*(b-a+1))}\nexport function shW(r,x){const j=riW(r,0,3);return x[j]}' },
      { renames: { riW: 'ri', shW: 'sh' }, params: { riW: 'r', shW: 'r' }, changed: ['ri', 'sh'] }, 0],
    ['Parameter, aber anderer Aufruf', { 'legacy.js': L('function ri(a,b){return a+Math.floor(Math.random()*(b-a))}') },
      { 'legacy.js': L(''), 'core/r.js': 'export function riW(r,a,b){return a+Math.floor(r()*(b-a+1))}' }, { renames: { riW: 'ri' }, params: { riW: 'r' } }, 1],
    ['Zustand als Parameter, Einzeiler aus früherem PR', { 'legacy.js': L('let FS={u:1};\nfunction ri(a){return riW(Math.random,a)}\nfunction mk(lv){return FS.u+ri(lv)}') },
      { 'legacy.js': L('let FS={u:1};\nfunction ri(a){return riW(Math.random,a)}\nfunction mk(lv){return mkW(Math.random,FS,lv)}'), 'core/m.js': 'export function mkW(r,FS,lv){return FS.u+riW(r,lv)}' },
      { renames: { mkW: 'mk' }, params: { mkW: ['r=Math.random', 'FS'] }, wrappers: { ri: 'riW' }, changed: ['mk'] }, 0],
    ['Zustand als Parameter, Körper geändert', { 'legacy.js': L('let FS={u:1};\nfunction mk(lv){return FS.u+lv}') },
      { 'legacy.js': L('let FS={u:1};\nfunction mk(lv){return mkW(FS,lv)}'), 'core/m.js': 'export function mkW(FS,lv){return FS.u-lv}' },
      { renames: { mkW: 'mk' }, params: { mkW: ['FS'] }, changed: ['mk'] }, 1],
    ['Fassade', { 'legacy.js': L('let x=1;\nfunction f(){x++;return {x,y:x}}') }, { 'legacy.js': L('function f(){W.x++;return {x:W.x,y:W.x}}'), 'state/w.js': 'export const W={x:1}' },
      { facade: { name: 'W', names: ['x'] }, removed: ['x'], added: ['W'] }, 0],
    ['Fassade vergessen', { 'legacy.js': L('let x=1;\nfunction f(){return x}') }, { 'legacy.js': L('let x=1;\nfunction f(){return W.x}') }, {}, 1],
    ['still gelöscht', { 'legacy.js': L('function a(){}\nfunction b(){}') }, { 'legacy.js': L('function a(){}') }, {}, 1],
    ['neu ohne Angabe', { 'legacy.js': L('function a(){}') }, { 'legacy.js': L('function a(){}\nfunction b(){}') }, {}, 1],
    ['Anweisung geändert', { 'legacy.js': L('go(1);') }, { 'legacy.js': L('go(2);') }, {}, 1],
    ['changed, aber gleich', { 'legacy.js': L('function a(){}') }, { 'legacy.js': L('function a(){}') }, { changed: ['a'] }, 1],
  ];
  let bad = 0;
  for (const [name, b, h, m, n] of T) { const r = compare(b, h, m); if (r.err.length !== n) { bad++; console.log(`FAIL Selbsttest „${name}“: erwartet ${n} Fehler, bekommen ${r.err.length}: ${r.err.join('; ')}`); } }
  if (bad) process.exit(1);
  console.log(`ok   movecheck.mjs Selbsttest (${T.length} Fälle)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) selftest();
  else {
    const ref = arg('--base', 'origin/main');
    const mf = path.resolve(ROOT, arg('--moves', 'tools/arch/moves.json'));
    const moves = fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf, 'utf8')) : {};
    const base = filesAt(ref), head = filesNow();
    // Auf main selbst (nach dem Merge) gibt es nichts zu vergleichen; moves.json beschreibt dann den schon gemergten PR.
    if (JSON.stringify(Object.entries(base).sort()) === JSON.stringify(Object.entries(head).sort())) { console.log('ok   src/ gleich ' + ref + ', nichts bewegt'); process.exit(0); }
    const { err, rep } = compare(base, head, moves);
    for (const m of rep.moved) console.log('     bewegt   ' + m);
    for (const m of rep.changed) console.log('     geändert ' + m);
    for (const m of rep.added) console.log('     neu      ' + m);
    for (const m of rep.removed) console.log('     entfernt ' + m);
    if (err.length) { console.log('FAIL Move-Nachweis gegen ' + ref + ':\n  ' + err.join('\n  ')); process.exit(1); }
    console.log(`ok   Move-Nachweis gegen ${ref}: ${rep.same} unverändert, ${rep.moved.length} bewegt, ${rep.changed.length} geändert, ${rep.added.length} neu, ${rep.removed.length} entfernt`);
  }
}
