// Nachweis für PR 1 (und jeden reinen Umbau des Builds): Das Skript im gebauten index.html ist derselbe Code wie das Skript der alten index.html.
// Verglichen werden die ASTs (acorn) ohne Positionen, Kommentare und Schreibweise von Literalen (raw). Die Hülle von esbuild ((() => { … })();) wird ausgepackt.
// Außerhalb des Skripts müssen beide Dateien byte-gleich sein.
// Aufruf: git show origin/main:index.html > /tmp/alt.html && node tools/arch/samecode.mjs /tmp/alt.html index.html
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const acorn = require('acorn');
const [, , A, B] = process.argv;
if (!A || !B) { console.log('Aufruf: node tools/arch/samecode.mjs alt.html neu.html'); process.exit(2); }

const split = f => { const h = fs.readFileSync(f, 'utf8'); const m = h.match(/<script>([\s\S]*?)<\/script>/); return { before: h.slice(0, m.index), js: m[1], after: h.slice(m.index + m[0].length) }; };
const a = split(A), b = split(B);
let fail = 0;
const say = (ok, t) => { console.log((ok ? 'ok   ' : 'FAIL ') + t); if (!ok) fail++; };
say(a.before === b.before, 'HTML und CSS vor dem Skript byte-gleich');
say(a.after === b.after, 'HTML nach dem Skript byte-gleich');

const parse = s => acorn.parse(s, { ecmaVersion: 'latest', sourceType: 'script' });
// esbuild-Hülle: genau eine Anweisung (() => { … })(); deren Rumpf das alte Programm ist.
function unwrap(p) {
  const s = p.body;
  if (s.length === 1 && s[0].type === 'ExpressionStatement' && s[0].expression.type === 'CallExpression') {
    const c = s[0].expression.callee;
    if (c.type === 'ArrowFunctionExpression' && c.params.length === 0 && c.body.type === 'BlockStatement') return c.body.body;
  }
  return s;
}
// Normalisieren: Positionen, Kommentare und raw weg.
// Bekannte Umschreibungen von esbuild ohne Bedeutungsunterschied, jede einzeln begründet:
//  1. {m:m} wird {m}: gleiche Eigenschaft, gleicher Wert.
//  2. undefined wird void 0: im strikten Modus nicht überschreibbar, gleicher Wert.
//  3. Lokale Namen, die einen äußeren Namen verdecken, bekommen eine Ziffer (last → last2). esbuild vermeidet so Verdeckung im Bundle.
//     Erlaubt nur für Bindungen unterhalb des IIFE-Rumpfs, nur als Name + Ziffern, und nur konsistent (ein alter Name je neuem Namen innerhalb einer Funktion).
//     Top-Level-Namen des Spiels (die Tests per eval ansprechen) und Eigenschaftsnamen müssen gleich bleiben.
//  4. Ein einzelner Befehl als Rumpf von if/for/while wird in { } gesetzt (z. B. if(a) for(let …) …). Ein Block mit genau einer Anweisung,
//     die keine Deklaration ist, verhält sich wie die Anweisung selbst. Wird auf beiden Seiten gleich ausgepackt.
//  5. Zusammengesetzte String-Literale werden vorab verbunden ('a'+'b' → 'ab', (x+'a')+'b' → x+'ab'). Gleicher Wert: x+'a' ist schon ein String,
//     und x wird in beiden Fällen genau einmal in einen primitiven Wert verwandelt. Auf beiden Seiten gleich gefaltet.
const BODY = { IfStatement: ['consequent', 'alternate'], ForStatement: ['body'], ForInStatement: ['body'], ForOfStatement: ['body'], WhileStatement: ['body'], DoWhileStatement: ['body'], LabeledStatement: ['body'] };
const single = c => c && c.type === 'BlockStatement' && c.body.length === 1 && !/Declaration$/.test(c.body[0].type) ? c.body[0] : c;
const SKIP = new Set(['start', 'end', 'loc', 'range', 'raw', 'directive']);
function norm(n) {
  if (Array.isArray(n)) return n.map(norm);
  if (!n || typeof n !== 'object') return n;
  if (n.type === 'Identifier' && n.name === 'undefined') return norm({ type: 'UnaryExpression', operator: 'void', prefix: true, argument: { type: 'Literal', value: 0 } });
  const o = {};
  for (const k of Object.keys(n).sort()) {
    if (SKIP.has(k)) continue;
    if (BODY[n.type] && BODY[n.type].includes(k)) { o[k] = norm(single(n[k])); continue; }
    if (k === 'shorthand' && n.type === 'Property') continue;
    o[k] = norm(n[k]);
  }
  if (o.type === 'BinaryExpression' && o.operator === '+' && o.left.type === 'Literal' && o.right.type === 'Literal' && typeof o.left.value === 'string' && typeof o.right.value === 'string') return { type: 'Literal', value: o.left.value + o.right.value };
  const isStr = x => x && x.type === 'Literal' && typeof x.value === 'string';
  if (o.type === 'BinaryExpression' && o.operator === '+' && isStr(o.right) && o.left.type === 'BinaryExpression' && o.left.operator === '+' && isStr(o.left.right)) return { left: o.left.left, operator: '+', right: { type: 'Literal', value: o.left.right.value + o.right.value }, type: 'BinaryExpression' };
  return o;
}
const ra = unwrap(parse(a.js)), rb = unwrap(parse(b.js));
const IIFE = '$[0].expression.callee';
// Testbuild: Die einzige erlaubte Zusatzanweisung ist der Testzugang an der Stelle von /*@test-hook*/.
const HOOK = 'window.__ev=function(s){return eval(s);};';
const ib = rb[0] && rb[0].expression && rb[0].expression.callee && rb[0].expression.callee.body && rb[0].expression.callee.body.body;
let hooks = 0;
if (ib) for (let i = ib.length - 1; i >= 0; i--) if (b.js.slice(ib[i].start, ib[i].end).replace(/\s+/g, '').replace(/"/g, "'") === HOOK.replace(/\s+/g, '')) { ib.splice(i, 1); hooks++; }
if (hooks) say(hooks === 1, 'Testzugang genau einmal vorhanden und für den Vergleich entfernt');
const ta = norm(ra), tb = norm(rb);
const renames = new Map(); let diff = null, nRen = 0;
function cmp(x, y, pth, fnId, keyCtx) {
  if (diff) return;
  if (Array.isArray(x) !== Array.isArray(y)) { diff = pth; return; }
  if (Array.isArray(x)) { if (x.length !== y.length) { diff = pth + '.length'; return; } x.forEach((v, i) => cmp(v, y[i], pth + '[' + i + ']', fnId, false)); return; }
  if (!x || typeof x !== 'object' || !y || typeof y !== 'object') { if (x !== y) diff = pth + ' (' + JSON.stringify(x) + ' / ' + JSON.stringify(y) + ')'; return; }
  if (x.type !== y.type) { diff = pth + ' Typ ' + x.type + ' / ' + y.type; return; }
  if (/Function/.test(x.type)) fnId = pth;
  if (x.type === 'Identifier' && x.name !== y.name) {
    const ok = !keyCtx && fnId !== IIFE && y.name.startsWith(x.name) && /^\d+$/.test(y.name.slice(x.name.length));
    const k = fnId + '|' + y.name;
    if (!ok || (renames.has(k) && renames.get(k) !== x.name)) { diff = pth + ' Name ' + x.name + ' / ' + y.name; return; }
    renames.set(k, x.name); nRen++; return;
  }
  const ks = Object.keys(x); if (ks.join() !== Object.keys(y).join()) { diff = pth + ' Felder'; return; }
  for (const k of ks) {
    // Eigenschaftsnamen (a.b, {b:…}, Methoden) dürfen nie umbenannt sein.
    const isKey = (k === 'property' && x.type === 'MemberExpression' && !x.computed) || (k === 'key' && !x.computed) || k === 'label';
    cmp(x[k], y[k], pth + '.' + k, fnId, isKey);
  }
}
cmp(ta, tb, '$', '$', false);
if (!diff) say(true, 'Skript: AST gleich bis auf ' + nRen + ' Bezüge auf ' + new Set([...renames.keys()].map(k => k.split('|')[1])).size + ' umbenannte lokale Namen (Umschreibung 3)');
else say(false, 'Skript: AST verschieden bei ' + diff);
process.exit(fail ? 1 : 0);
