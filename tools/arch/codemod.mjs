// Umschreiben über den AST: Bezüge auf Top-Level-Namen x werden zu F.x (Übergangsfassade, ADR 0001 Punkt 9).
// Aufruf: node tools/arch/codemod.mjs --file src/legacy.js --facade F --names a,b,c [--write]
//         node tools/arch/codemod.mjs --selftest
// Umgeschrieben wird jeder Bezug (lesen, schreiben, ++, typeof, Kurzschreibweise {x} → {x: F.x}, Destrukturieren in Zuweisungen),
// der nicht auf eine lokale Deklaration zeigt. Nicht angefasst: Eigenschaftsnamen (o.x, {x: 1}), Sprungmarken, Deklarationen und
// alles, was einen gleichnamigen lokalen Namen sieht (Parameter, let/const/var/function/class in inneren Blöcken und Funktionen, catch).
// Steht der Name selbst noch auf oberster Ebene deklariert, bricht das Skript ab: Erst die Deklaration umziehen, dann umschreiben.
// Ohne --write wird nur gezählt. Die Formatierung bleibt, ersetzt werden genau die Bezugsstellen.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as acorn from 'acorn';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const FN = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);

/**
 * @param {string} code
 * @param {string} facade
 * @param {string[]} names
 * @returns {{ code: string, n: number, per: Record<string, number> }}
 */
export function rewrite(code, facade, names) {
  const want = new Set(names);
  const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module', allowHashBang: true });
  const scopeOf = new WeakMap(), tops = new Set();
  const mk = (node, top = false) => { const s = new Set(); scopeOf.set(node, s); if (top) tops.add(s); return s; };

  // 1. Deklarationen je Gültigkeitsbereich sammeln (mit Hoisting von var und Funktionen).
  const declPat = (p, s) => {
    if (!p) return;
    if (p.type === 'Identifier') s.add(p.name);
    else if (p.type === 'ObjectPattern') p.properties.forEach(q => declPat(q.type === 'RestElement' ? q.argument : q.value, s));
    else if (p.type === 'ArrayPattern') p.elements.forEach(e => declPat(e, s));
    else if (p.type === 'RestElement') declPat(p.argument, s);
    else if (p.type === 'AssignmentPattern') declPat(p.left, s);
  };
  const collect = (node, fnS, blkS) => {
    if (!node || typeof node.type !== 'string') return;
    if (FN.has(node.type)) {
      if (node.type === 'FunctionDeclaration' && node.id) blkS.add(node.id.name);
      // Äußere IIFE von legacy.js: ihr Körper ist die oberste Ebene.
      const iife = node.type === 'FunctionExpression' && node._iife;
      const s = mk(node, iife);
      if (node.type === 'FunctionExpression' && node.id) s.add(node.id.name);
      node.params.forEach(p => declPat(p, s));
      if (node.body.type === 'BlockStatement') { scopeOf.set(node.body, s); node.body.body.forEach(c => collect(c, s, s)); node.params.forEach(p => collectInner(p, s, s)); }
      else { node.params.forEach(p => collectInner(p, s, s)); collect(node.body, s, s); }
      return;
    }
    if (node.type === 'VariableDeclaration') {
      const s = node.kind === 'var' ? fnS : blkS;
      node.declarations.forEach(d => { declPat(d.id, s); collectInner(d.id, fnS, blkS); collect(d.init, fnS, blkS); });
      return;
    }
    if (node.type === 'ClassDeclaration') { if (node.id) blkS.add(node.id.name); collect(node.superClass, fnS, blkS); collect(node.body, fnS, blkS); return; }
    if (node.type === 'CatchClause') { const s = mk(node); declPat(node.param, s); collectInner(node.param, fnS, s); scopeOf.set(node.body, s); node.body.body.forEach(c => collect(c, fnS, s)); return; }
    if (node.type === 'BlockStatement' || node.type === 'ForStatement' || node.type === 'ForInStatement' || node.type === 'ForOfStatement' || node.type === 'SwitchStatement') {
      const s = mk(node);
      for (const k of Object.keys(node)) child(node[k], fnS, s);
      return;
    }
    for (const k of Object.keys(node)) child(node[k], fnS, blkS);
  };
  const child = (v, fnS, blkS) => { if (Array.isArray(v)) v.forEach(x => collect(x, fnS, blkS)); else if (v && typeof v.type === 'string') collect(v, fnS, blkS); };
  // Standardwerte und berechnete Schlüssel in Mustern sind Ausdrücke und können Funktionen enthalten.
  const collectInner = (p, fnS, blkS) => {
    if (!p) return;
    if (p.type === 'AssignmentPattern') { collectInner(p.left, fnS, blkS); collect(p.right, fnS, blkS); }
    else if (p.type === 'ObjectPattern') p.properties.forEach(q => { if (q.type === 'RestElement') collectInner(q.argument, fnS, blkS); else { if (q.computed) collect(q.key, fnS, blkS); collectInner(q.value, fnS, blkS); } });
    else if (p.type === 'ArrayPattern') p.elements.forEach(e => collectInner(e, fnS, blkS));
    else if (p.type === 'RestElement') collectInner(p.argument, fnS, blkS);
  };
  for (const s of ast.body) if (s.type === 'ExpressionStatement' && s.expression.type === 'CallExpression' && s.expression.callee.type === 'FunctionExpression') s.expression.callee._iife = true;
  const prog = mk(ast, true);
  ast.body.forEach(s => collect(s, prog, prog));
  for (const s of tops) for (const n of want) if (s.has(n)) throw new Error(`${n} ist auf oberster Ebene noch deklariert. Erst die Deklaration umziehen, dann umschreiben.`);

  // 2. Bezüge auflösen und umschreiben.
  const edits = [], per = {};
  const ref = (id, stack, shorthandProp) => {
    if (!want.has(id.name)) return;
    for (let i = stack.length - 1; i >= 0; i--) if (stack[i].has(id.name) && !tops.has(stack[i])) return;
    per[id.name] = (per[id.name] || 0) + 1;
    if (shorthandProp) edits.push([shorthandProp.start, shorthandProp.start, id.name + ': ']);
    edits.push([id.start, id.end, facade + '.' + id.name]);
  };
  const visit = (node, stack, parent, key) => {
    if (!node || typeof node.type !== 'string') return;
    const s = scopeOf.get(node); if (s && stack[stack.length - 1] !== s) stack = stack.concat([s]);
    switch (node.type) {
      case 'Identifier': ref(node, stack, null); return;
      case 'MemberExpression': visit(node.object, stack); if (node.computed) visit(node.property, stack); return;
      case 'Property':
        if (node.computed) visit(node.key, stack);
        if (node.shorthand && node.value.type === 'Identifier') { if (!parent || !parent._decl) ref(node.value, stack, node); return; }
        if (node.shorthand && node.value.type === 'AssignmentPattern' && node.value.left.type === 'Identifier' && !(parent && parent._decl)) { ref(node.value.left, stack, node); visit(node.value.right, stack); return; }
        if (parent && parent._decl) { pat(node.value, stack); return; }
        visit(node.value, stack); return;
      case 'MethodDefinition': case 'PropertyDefinition': if (node.computed) visit(node.key, stack); visit(node.value, stack); return;
      case 'LabeledStatement': visit(node.body, stack); return;
      case 'BreakStatement': case 'ContinueStatement': case 'MetaProperty': return;
      case 'VariableDeclarator': pat(node.id, stack); visit(node.init, stack); return;
      case 'FunctionDeclaration': case 'FunctionExpression': case 'ArrowFunctionExpression':
        node.params.forEach(p => pat(p, stack)); visit(node.body, stack); return;
      case 'ClassDeclaration': case 'ClassExpression': visit(node.superClass, stack); visit(node.body, stack); return;
      case 'CatchClause': pat(node.param, stack); visit(node.body, stack); return;
      case 'ImportDeclaration': case 'ExportAllDeclaration': return;
      case 'ExportNamedDeclaration': if (node.declaration) visit(node.declaration, stack); return;
    }
    for (const k of Object.keys(node)) { const v = node[k]; if (Array.isArray(v)) v.forEach(x => visit(x, stack, node, k)); else if (v && typeof v.type === 'string') visit(v, stack, node, k); }
  };
  // Muster in Deklarationen: Namen sind Deklarationen, Standardwerte und berechnete Schlüssel sind Bezüge.
  const pat = (p, stack) => {
    if (!p) return;
    if (p.type === 'Identifier') return;
    if (p.type === 'ObjectPattern') { p._decl = true; p.properties.forEach(q => q.type === 'RestElement' ? pat(q.argument, stack) : visit(q, stack, p)); }
    else if (p.type === 'ArrayPattern') p.elements.forEach(e => pat(e, stack));
    else if (p.type === 'RestElement') pat(p.argument, stack);
    else if (p.type === 'AssignmentPattern') { pat(p.left, stack); visit(p.right, stack); }
    else visit(p, stack);
  };
  visit(ast, []);
  edits.sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  let out = code;
  for (const [s, e, t] of edits) out = out.slice(0, s) + t + out.slice(e);
  acorn.parse(out, { ecmaVersion: 'latest', sourceType: 'module', allowHashBang: true });
  return { code: out, n: Object.values(per).reduce((a, b) => a + b, 0), per };
}

function selftest() {
  const T = [
    ['lesen, schreiben, ++, typeof', 'x=1; f(x); x++; typeof x;', 'F.x=1; f(F.x); F.x++; typeof F.x;'],
    ['Eigenschaft und Schlüssel bleiben', 'o.x; o[x]; ({x: 1}); ({[x]: 1});', 'o.x; o[F.x]; ({x: 1}); ({[F.x]: 1});'],
    ['Kurzschreibweise', 'g({x, y});', 'g({x: F.x, y});'],
    ['Parameter verdeckt', 'function f(x){ return x; } function g(){ return x; }', 'function f(x){ return x; } function g(){ return F.x; }'],
    ['let im Block verdeckt nur dort', '{ let x=2; x; } x;', '{ let x=2; x; } F.x;'],
    ['var wird gehoben', 'function f(){ x; if(1){ var x=1; } } x;', 'function f(){ x; if(1){ var x=1; } } F.x;'],
    ['Funktion im Block verdeckt', 'function f(){ { function x(){} x(); } x(); }', 'function f(){ { function x(){} x(); } F.x(); }'],
    ['catch verdeckt', 'try{}catch(x){ x; } x;', 'try{}catch(x){ x; } F.x;'],
    ['Pfeil, Destrukturieren', 'const g=(x)=>x; const {x: y}=o; [x]=a; ({x}=o);', 'const g=(x)=>x; const {x: y}=o; [F.x]=a; ({x: F.x}=o);'],
    ['Standardwert im Muster', 'function f(a=x){ const {b=x}=o; }', 'function f(a=F.x){ const {b=F.x}=o; }'],
    ['Sprungmarke und Methode', 'x: for(;;){ break x; } class C{ x(){ return x; } }', 'x: for(;;){ break x; } class C{ x(){ return F.x; } }'],
    ['legacy-IIFE', '(function(){ function f(){ return x; } })();', '(function(){ function f(){ return F.x; } })();'],
    ['for-let verdeckt', 'for(let x=0;x<3;x++){} x;', 'for(let x=0;x<3;x++){} F.x;'],
    ['Kurzschreibweise mit Standardwert in Zuweisung', '({x=1}=o);', '({x: F.x=1}=o);'],
  ];
  let bad = 0;
  for (const [name, a, b] of T) { const r = rewrite(a, 'F', ['x']).code; if (r !== b) { bad++; console.log(`FAIL Selbsttest „${name}“:\n  erwartet ${b}\n  bekommen ${r}`); } }
  try { rewrite('(function(){ let x=1; })();', 'F', ['x']); bad++; console.log('FAIL Selbsttest: Deklaration auf oberster Ebene nicht erkannt'); } catch (_) {}
  if (bad) process.exit(1);
  console.log(`ok   codemod.mjs Selbsttest (${T.length + 1} Fälle)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) selftest();
  else {
    const file = arg('--file'), facade = arg('--facade'), names = (arg('--names') || '').split(',').filter(Boolean);
    if (!file || !facade || !names.length) { console.log('Aufruf: node tools/arch/codemod.mjs --file src/legacy.js --facade F --names a,b [--write]'); process.exit(2); }
    const r = rewrite(fs.readFileSync(file, 'utf8'), facade, names);
    for (const n of names) console.log(`     ${n}: ${r.per[n] || 0}`);
    if (process.argv.includes('--write')) fs.writeFileSync(file, r.code);
    console.log(`ok   ${r.n} Bezüge ${process.argv.includes('--write') ? 'umgeschrieben' : 'gefunden (ohne --write nichts geändert)'} in ${file}`);
  }
}
