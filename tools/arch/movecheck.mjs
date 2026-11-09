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
//   world    { "param": "WD", "names": [...], "from": "ST", "fromNames": [...] }
//                                             nur in bewegten Funktionen, die param als Parameter bekommen: x wird zu WD.x,
//                                             ST.x (für x in fromNames) ebenfalls zu WD.x (Weltobjekt statt globaler Felder, PR 8b)
//   literals { "wert": "NAME" }               überall (auch außerhalb bewegter Funktionen): das String-Literal 'wert' wird zur Konstante NAME
//                                             (Schlüsselnamen an einer Stelle, PR 11). Schlüssel in Objektliteralen bleiben Literale.
//   iife     [neuerName, ...]                 der alte Name war const X=(function(){…})(); die Funktion zieht als function neuerName(…){…} um
//                                             (Körper gleich, mit params/world wie oben; PR 13, LOG → logWith(LP))
//   changed  [...]                            Name bleibt, Inhalt ändert sich bewusst (z. B. Einzeiler, der an core/ weitergibt)
//   rewritten [neuerName, ...]                Inhalt bewusst umgebaut, ohne Move-Nachweis (PR 23c, draw nach Ebenen zerlegt; Absicherung
//                                             nur über Bildvergleich). Gilt für einen umbenannten Namen wie für einen gleichnamigen.
//   gathered { neuerName: [lokal, ...] }      Anweisungen auf oberster Ebene (Handler) sind unverändert in den Körper der neuen Funktion
//                                             neuerName gezogen (mit params/world wie oben); die genannten Deklarationen sind dort lokal (PR 29g2b).
//                                             Jede Anweisung des Körpers muss einer alten Anweisung bzw. Deklaration entsprechen.
//   added, removed [...]                      neue bzw. gelöschte Namen
//   stmtsChanged N                            so viele Anweisungen ohne Namen ändern sich bewusst (nur verhaltensändernde PRs)
//   stmtsAdded N                              so viele Anweisungen ohne Namen kommen bewusst dazu (ebenso)
//   stmtsRemoved N                            so viele Anweisungen ohne Namen fallen bewusst weg (ebenso)
// Gestapelte PRs (jeder zielt auf main und enthält den vorigen): moves.json ist dann { "stack": [ {pr:11, …}, {pr:12, …} ] }.
//   Verglichen wird gegen main mit allen Schritten, deren pr größer ist als der höchste in der moves.json von main (schon gemergte fallen weg).
// Verglichen wird der AST ohne Positionen und ohne Schreibweise von Literalen. Anweisungen auf oberster Ebene, die nichts deklarieren
// (Ereignis-Handler, try-Blöcke beim Laden), müssen als Menge gleich bleiben. Import-Deklarationen werden nicht verglichen.
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import * as acorn from 'acorn';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };

/** Top-Level-Deklarationen und sonstige Anweisungen einer Datei. In legacy.js zählt der Körper der äußeren IIFE als oberste Ebene, in app/wire.js der Körper von wire(). */
export function topOf(code, file) {
  const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module', allowHashBang: true });
  const decl = new Map(), stmts = [];
  let inWire = false; // im Körper von wire() gelten dieselben Regeln wie im IIFE-Körper von legacy.js (auch für innere IIFEs)
  const take = body => {
    for (let s of body) {
      if (s.type === 'ImportDeclaration') continue;
      if ((s.type === 'ExportNamedDeclaration' || s.type === 'ExportDefaultDeclaration') && s.declaration) s = s.declaration;
      if (s.type === 'ExpressionStatement' && s.expression.type === 'CallExpression' && s.expression.callee.type === 'FunctionExpression' && !s.expression.arguments.length && (inWire || /(^|\/)legacy\.js$/.test(file))) { take(s.expression.callee.body.body); continue; }
      // Ab 29g2e steht der frühere IIFE-Körper als export function wire(){…} in app/wire.js und zählt genauso als oberste Ebene.
      if (s.type === 'FunctionDeclaration' && s.id.name === 'wire' && !s.params.length && /(^|\/)app\/wire\.js$/.test(file)) { inWire = true; take(s.body.body); inWire = false; continue; }
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

const SCOPE = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression', 'BlockStatement', 'ForStatement', 'ForInStatement', 'ForOfStatement', 'SwitchStatement', 'CatchClause', 'ClassExpression']);
/** Namen, die ein Gültigkeitsbereich selbst deklariert: Parameter, var (gehoben bis zur Funktion), Funktionen, let/const/class im Block, catch. */
export function localDecl(x) {
  const out = [];
  const pat = p => { if (!p) return; if (p.type === 'Identifier') out.push(p.name); else if (p.type === 'ObjectPattern') p.properties.forEach(q => pat(q.type === 'RestElement' ? q.argument : q.value)); else if (p.type === 'ArrayPattern') p.elements.forEach(pat); else if (p.type === 'RestElement') pat(p.argument); else if (p.type === 'AssignmentPattern') pat(p.left); };
  const vars = n => { // var-Deklarationen bis zur nächsten Funktion
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) { n.forEach(vars); return; }
    if (n.type === 'FunctionDeclaration' || n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression') return;
    if (n.type === 'VariableDeclaration' && n.kind === 'var') n.declarations.forEach(d => pat(d.id));
    for (const k of Object.keys(n)) if (!SKIP.has(k) && k !== 'type') vars(n[k]);
  };
  const lex = list => { for (const c of list || []) { if (c.type === 'VariableDeclaration' && c.kind !== 'var') c.declarations.forEach(d => pat(d.id)); else if ((c.type === 'FunctionDeclaration' || c.type === 'ClassDeclaration') && c.id) out.push(c.id.name); } };
  if (x.type === 'FunctionDeclaration' || x.type === 'FunctionExpression' || x.type === 'ArrowFunctionExpression') {
    if (x.type === 'FunctionExpression' && x.id) out.push(x.id.name);
    x.params.forEach(pat);
    if (x.body.type === 'BlockStatement') { vars(x.body.body); lex(x.body.body); }
  } else if (x.type === 'BlockStatement') lex(x.body);
  else if (x.type === 'SwitchStatement') x.cases.forEach(c => lex(c.consequent));
  else if (x.type === 'ForStatement') { if (x.init && x.init.type === 'VariableDeclaration' && x.init.kind !== 'var') x.init.declarations.forEach(d => pat(d.id)); }
  else if (x.type === 'ForInStatement' || x.type === 'ForOfStatement') { if (x.left.type === 'VariableDeclaration' && x.left.kind !== 'var') x.left.declarations.forEach(d => pat(d.id)); }
  else if (x.type === 'CatchClause') pat(x.param);
  else if (x.type === 'ClassExpression' && x.id) out.push(x.id.name);
  return out;
}

/** Wendet die erlaubten Umschreibungen auf einen alten Knoten an. */
export function transform(node, moves, own, file) {
  const ren = {}; for (const [n, o] of Object.entries(moves.renames || {})) ren[o] = n;
  // facade darf eine Liste sein (ST für Spielzustand, AU für Ton). Mit own: Datei, der die Namen gehören; dort bleiben sie bloße Namen.
  const facs = [].concat(moves.facade || []).filter(f => !f.own || f.own !== file);
  const facOf = new Map(); for (const f of facs) for (const n of f.names) facOf.set(n, f.name);
  const fac = facOf.size ? facOf : null, wrap = moves.wrappers || {};
  const lit = moves.literals || null;
  // params: "rand" (kurz für ["rand=Math.random"]) oder eine Liste. "rand=Math.random": Math.random im alten Körper wird zu rand.
  // "FS": neuer Parameter gleichen Namens, der den Top-Level-Namen verdeckt; der Körper bleibt dafür unverändert.
  const plist = n => { const v = (moves.params || {})[n]; if (!v) return []; return (typeof v === 'string' ? [v + '=Math.random'] : v).map(e => { const [name, src] = e.split('='); return { name, random: src === 'Math.random' }; }); };
  const mine = own ? plist(own) : [], rnd = (mine.find(e => e.random) || {}).name, moved = !!own && (own in (moves.renames || {}) || own in (moves.gathered || {}));
  // world darf eine Liste sein (mehrere Ports in einem Stapel, z. B. LP in PR 13 und SV in PR 14e); es gilt der Port, den die Funktion als Parameter bekommt.
  const wo = moved ? [].concat(moves.world || []).find(w => mine.some(e => e.name === w.param)) : null, wn = wo ? new Set(wo.names) : null, wf = wn ? new Set(wo.fromNames || []) : null;
  const mem = (o, p) => ({ type: 'MemberExpression', object: id(o), property: id(p), computed: false, optional: false });
  // Bezüge auf umbenannte Namen werden nur innerhalb bewegter Funktionen umgeschrieben; legacy.js ruft weiter den alten Namen (Einzeiler).
  const n0 = clone(node);
  // Fassade nur für Bezüge, die nicht auf eine gleichnamige lokale Deklaration zeigen (wie codemod.mjs). sh = verdeckte Namen.
  const shadow = (x, sh) => { if (!fac && !wn && !moved) return sh; const d = localDecl(x).filter(n => (fac && fac.has(n)) || (wn && (wn.has(n) || n === wo.from)) || (moved && ren[n])); return d.length ? new Set([...sh, ...d]) : sh; };
  const walk = (x, parent, key, sh = new Set()) => {
    if (!x || typeof x !== 'object') return x;
    if (Array.isArray(x)) { for (let i = 0; i < x.length; i++) x[i] = walk(x[i], parent, key, sh); return x; }
    if (SCOPE.has(x.type)) sh = shadow(x, sh);
    // Math.random → Parameter
    if (rnd && x.type === 'MemberExpression' && !x.computed && x.object.type === 'Identifier' && x.object.name === 'Math' && x.property.name === 'random') return id(rnd);
    // Ein Name, der über den Port kommt (world), bleibt ein Port-Aufruf, auch wenn ein früherer Schritt ihn umbenannt hat (idbDo → SV.idbDo, nicht idbDoWith).
    if (moved && x.type === 'CallExpression' && x.callee.type === 'Identifier' && !(wn && wn.has(x.callee.name) && !sh.has(x.callee.name))) {
      const c = x.callee.name;
      // Aufruf einer mit Parametern bewegten Funktion: neuer Name, ihre Parameter vorn (gleich benannt wie hier)
      if (ren[c] && !sh.has(c) && plist(ren[c]).length) { x.callee = id(ren[c]); x.arguments = [...plist(ren[c]).map(e => id(e.name)), ...x.arguments.map(a => walk(a, x, 'arguments', sh))]; return x; }
      // Aufruf eines Einzeilers aus legacy.js (z. B. ri → riWith): die core-Fassung mit dem Zufallsparameter vorn
      if (wrap[c] && rnd) { x.callee = id(wrap[c]); x.arguments = [id(rnd), ...x.arguments.map(a => walk(a, x, 'arguments', sh))]; return x; }
    }
    if (x.type === 'Property' && !x.computed) { if (x.shorthand) { x.value = walk(x.value, x, 'value', sh); if (x.value.type !== 'Identifier' || x.value.name !== x.key.name) x.shorthand = false; return x; } x.value = walk(x.value, x, 'value', sh); return x; }
    if (wn && x.type === 'MemberExpression' && !x.computed && x.object.type === 'Identifier' && x.object.name === wo.from && wf.has(x.property.name) && !sh.has(wo.from)) return mem(wo.param, x.property.name);
    if (x.type === 'MemberExpression' && !x.computed) { x.object = walk(x.object, x, 'object', sh); return x; }
    if (x.type === 'MethodDefinition' || x.type === 'PropertyDefinition') { if (x.computed) x.key = walk(x.key, x, 'key', sh); x.value = walk(x.value, x, 'value', sh); return x; }
    if (x.type === 'LabeledStatement' || x.type === 'BreakStatement' || x.type === 'ContinueStatement') { if (x.body) x.body = walk(x.body, x, 'body', sh); return x; }
    if (lit && x.type === 'Literal' && typeof x.value === 'string' && Object.hasOwn(lit, x.value)) { const k = lit[x.value]; return wn && wn.has(k) && !sh.has(k) ? mem(wo.param, k) : id(k); } // Konstante, die später über einen Port kommt
    if (x.type === 'Identifier') {
      if (wn && wn.has(x.name) && !sh.has(x.name)) return mem(wo.param, x.name);
      if (fac && fac.has(x.name) && !sh.has(x.name)) return { type: 'MemberExpression', object: id(fac.get(x.name)), property: id(x.name), computed: false, optional: false };
      if (moved && ren[x.name] && !sh.has(x.name)) return id(ren[x.name]); // eine lokale Variable gleichen Namens (const mood in drawWinter) bleibt
      return x;
    }
    for (const k of Object.keys(x)) if (!SKIP.has(k) && k !== 'type') x[k] = walk(x[k], x, k, sh);
    return x;
  };
  // Eigener Name und eigene Parameter sind Deklarationen, keine Bezüge.
  if ((n0.type === 'FunctionDeclaration' || n0.type === 'ClassDeclaration') && n0.id) { n0.id = id(own || n0.id.name); }
  // Vor dem Abnehmen der Parameter, die verdecken auch. Ebenso die neuen Parameter gleichen Namens (idbDoWith(diskLock, …) aus PR 11
  // bleibt diskLock, auch wenn diskLock später hinter die Fassade zieht).
  const sh0 = new Set([...(SCOPE.has(n0.type) ? shadow(n0, new Set()) : []), ...mine.filter(e => !e.random).map(e => e.name)]);
  const params = n0.params; if (params) n0.params = [];
  walk(n0, null, null, sh0);
  if (params) n0.params = mine.map(e => id(e.name)).concat(params);
  return n0;
}

/** Fasst die noch nicht gemergten Schritte eines Stapels zu einer Angabe zusammen. done = höchste PR-Nummer im Basisstand. */
export function mergeSteps(moves, done = -Infinity) {
  const steps = (moves.stack || [moves]).filter(s => !(s.pr <= done));
  const out = {};
  for (const s of steps) for (const [k, v] of Object.entries(s)) {
    if (k === 'pr') continue;
    if (Array.isArray(v)) out[k] = [...new Set([...(out[k] || []), ...v])];
    else if (typeof v === 'number') out[k] = (out[k] || 0) + v; // stmtsChanged addiert sich über den Stapel
    else if (k === 'world') {
      const list = [].concat(out.world || []);
      for (const w of [].concat(v)) {
        const o = list.find(x => x.param === w.param);
        if (!o) list.push(w);
        else { if (o.from !== w.from) throw new Error(`world ${w.param} in zwei Schritten verschieden`); o.names = [...new Set([...o.names, ...w.names])]; if (w.fromNames) o.fromNames = [...new Set([...(o.fromNames || []), ...w.fromNames])]; }
      }
      out.world = list.length === 1 ? list[0] : list;
    }
    else if (k === 'facade') {
      // Gleiche Fassade in zwei Schritten: Namen vereinigen. Verschiedene Fassaden (ST, AU): Liste.
      const list = [].concat(out.facade || []);
      for (const f of [].concat(v)) {
        const o = list.find(x => x.name === f.name);
        if (!o) list.push({ ...f });
        else { if ((o.own || '') !== (f.own || '')) throw new Error(`facade ${f.name} in zwei Schritten verschieden`); o.names = [...new Set([...o.names, ...f.names])]; }
      }
      out.facade = list.length === 1 ? list[0] : list;
    }

    else out[k] = Object.assign(out[k] || {}, v);
  }
  // Neu in einem Schritt und in einem späteren geändert: im Ganzen nur neu.
  if (out.added && out.changed) out.changed = out.changed.filter(n => !out.added.includes(n));
  return out;
}
/** Höchste PR-Nummer einer moves.json (alte Form {pr} oder Stapel). */
// pr ist eine Zahl; Teilschritte als Dezimalzahl (14a = 14.1). Alte Einträge wie "7b" zählen nicht.
export const doneOf = m => m ? Math.max(-Infinity, ...(m.stack || [m]).map(s => typeof s.pr === 'number' ? s.pr : -Infinity)) : -Infinity;

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
  const changed = listed('changed'), added = listed('added'), removed = listed('removed'), rewritten = listed('rewritten');
  for (const n of rewritten) changed.add(n);
  for (const [n, o] of Object.entries(renames)) {
    if (!B.decl.has(o)) { err.push(`rename ${n}=${o}: ${o} gibt es im Basisstand nicht`); continue; }
    if (!H.decl.has(n)) { err.push(`rename ${n}=${o}: ${n} gibt es im neuen Stand nicht`); continue; }
    let bn = B.decl.get(o).node;
    if ((moves.iife || []).includes(n)) {
      const c = bn.type === 'Var' && bn.init && bn.init.type === 'CallExpression' && !bn.init.arguments.length ? bn.init.callee : null;
      if (!c || c.type !== 'FunctionExpression' || c.id) { err.push(`iife ${n}=${o}: ${o} ist kein const ${o}=(function(){…})()`); continue; }
      bn = { ...c, type: 'FunctionDeclaration', id: id(n) };
    }
    if (rewritten.has(n)) { rep.changed.push(`${o} → ${n} (${H.decl.get(n).file}), umgebaut`); continue; }
    if (norm(transform(bn, moves, n, H.decl.get(n).file)) !== norm(H.decl.get(n).node)) err.push(`${o} → ${n} (${H.decl.get(n).file}): AST weicht über die erlaubten Umschreibungen hinaus ab`);
    else rep.moved.push(`${o} → ${H.decl.get(n).file}:${n}`);
  }
  // gathered: Körper der neuen Funktion gegen alte Anweisungen und Deklarationen abgleichen.
  const handled = new Set(), used = new Set();
  for (const [g, locals] of Object.entries(moves.gathered || {})) {
    const hg = H.decl.get(g);
    if (!hg || hg.node.type !== 'FunctionDeclaration') { err.push(`gathered ${g}: keine Funktion im neuen Stand`); continue; }
    const loc = new Set(locals);
    // Wie topOf in legacy.js: (function(){…})(); ohne Argumente zählt mit seinem Körper als oberste Ebene.
    const iifeBody = st => st.type === 'ExpressionStatement' && st.expression.type === 'CallExpression' && st.expression.callee.type === 'FunctionExpression' && !st.expression.arguments.length ? st.expression.callee.body.body : null;
    const flat = list => list.flatMap(st => iifeBody(st) ? flat(iifeBody(st)) : [st]);
    for (const st of flat(hg.node.body.body)) {
      if (st.type === 'VariableDeclaration' && st.declarations.every(d => d.id.type === 'Identifier')) {
        for (const d of st.declarations) {
          const nm = d.id.name, b = B.decl.get(nm);
          if (!loc.has(nm) || !b || H.decl.has(nm)) { err.push(`gathered ${g}: lokale Deklaration ${nm} steht nicht in der Liste oder gab es nicht auf oberster Ebene`); continue; }
          if (norm(transform(b.node, moves, g, hg.file)) !== norm({ type: 'Var', kind: st.kind, init: d.init })) err.push(`gathered ${g}: ${nm} weicht ab`);
          else { handled.add(nm); rep.moved.push(`${nm}: ${b.file} → ${hg.file}:${g} (lokal)`); }
        }
        continue;
      }
      const want = norm(st);
      const i = B.stmts.findIndex((x, k) => !used.has(k) && norm(transform(x.node, moves, g, hg.file)) === want);
      if (i < 0) err.push(`gathered ${g}: Anweisung ohne Gegenstück im Basisstand: ${want.slice(0, 160)}`); else used.add(i);
    }
    for (const nm of loc) if (!handled.has(nm)) err.push(`gathered ${g}: ${nm} nicht im Körper gefunden`);
    rep.changed.push(`${used.size} Anweisung(en) auf oberster Ebene in ${g} (${hg.file}) gezogen`);
  }
  for (const [n, b] of B.decl) {
    const h = H.decl.get(n);
    if (!h) { if (srcOf.has(n) || handled.has(n)) continue; if (removed.has(n)) rep.removed.push(n); else err.push(`${n} (${b.file}) fehlt im neuen Stand und steht nicht unter removed`); continue; }
    const same = norm(transform(b.node, moves, n, h.file)) === norm(h.node);
    if (same) { if (b.file === h.file) rep.same++; else rep.moved.push(`${n}: ${b.file} → ${h.file}`); if (changed.has(n)) err.push(`${n} steht unter changed, ist aber unverändert`); }
    else if (changed.has(n)) rep.changed.push(`${n} (${h.file})`);
    else err.push(`${n} (${b.file} → ${h.file}): AST verschieden, steht nicht unter changed`);
  }
  for (const [n, h] of H.decl) if (!B.decl.has(n) && !(n in renames)) { if (added.has(n)) rep.added.push(`${n} (${h.file})`); else err.push(`${n} (${h.file}) ist neu und steht nicht unter added`); }
  const ms = s => s.map(x => norm(transform(x.node, moves))).sort(), hs = H.stmts.map(x => norm(x.node)).sort(), bs = ms(B.stmts.filter((x, k) => !used.has(k)));
  if (bs.join('\n') !== hs.join('\n')) {
    // stmtsChanged: so viele Anweisungen ohne Namen (Handler, try-Blöcke) dürfen sich ändern, nur in verhaltensändernden PRs (Streich-PRs).
    const left = [...hs], gone = bs.filter(x => { const i = left.indexOf(x); if (i < 0) return true; left.splice(i, 1); return false; });
    // stmtsAdded: so viele kommen neu dazu, stmtsRemoved: so viele fallen weg.
    const n = moves.stmtsChanged || 0, a = moves.stmtsAdded || 0, r = moves.stmtsRemoved || 0;
    if (gone.length === n + r && left.length === n + a && n + a + r) rep.changed.push(`${n} Anweisung(en) auf oberster Ebene geändert, ${a} neu, ${r} weg`);
    else err.push(`Anweisungen auf oberster Ebene verschieden (${bs.length} vorher, ${hs.length} nachher, ${gone.length} weg, ${left.length} neu; erlaubt ${n} geändert, ${a} neu, ${r} weg)`);
  }
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
    ['IIFE-Körper nach wire() bewegt', { 'legacy.js': L('function a(){return 1}\na();') }, { 'legacy.js': 'import {wire} from "./app/wire.js";\nwire();', 'app/wire.js': 'export function wire(){function a(){return 1}\na();}' }, { stmtsAdded: 1 }, 0],
    ['wire() verändert', { 'legacy.js': L('function a(){return 1}\na();') }, { 'legacy.js': 'import {wire} from "./app/wire.js";\nwire();', 'app/wire.js': 'export function wire(){function a(){return 2}\na();}' }, { stmtsAdded: 1 }, 1],
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
    ['Umbenannte Funktion, lokale Variable gleichen Namens bleibt', { 'legacy.js': L('function m(){return 1}\nfunction d(){const m=2;return m}') },
      { 'legacy.js': L('function m(){return mW(P)}\nfunction d(){return dW(P)}\nconst P={}'), 'render/d.js': 'export function mW(P){return 1}\nexport function dW(P){const m=2;return m}' },
      { renames: { mW: 'm', dW: 'd' }, params: { mW: ['P'], dW: ['P'] }, changed: ['m', 'd'], added: ['P'] }, 0],
    ['Umbenannte Funktion, lokaler Name fälschlich umbenannt', { 'legacy.js': L('function m(){return 1}\nfunction d(){const m=2;return m}') },
      { 'legacy.js': L('function m(){return mW(P)}\nfunction d(){return dW(P)}\nconst P={}'), 'render/d.js': 'export function mW(P){return 1}\nexport function dW(P){const m=2;return mW}' },
      { renames: { mW: 'm', dW: 'd' }, params: { mW: ['P'], dW: ['P'] }, changed: ['m', 'd'], added: ['P'] }, 1],
    ['Fassade', { 'legacy.js': L('let x=1;\nfunction f(){x++;return {x,y:x}}') }, { 'legacy.js': L('function f(){W.x++;return {x:W.x,y:W.x}}'), 'state/w.js': 'export const W={x:1}' },
      { facade: { name: 'W', names: ['x'] }, removed: ['x'], added: ['W'] }, 0],
    ['Fassade, lokaler Name verdeckt', { 'legacy.js': L('let x=1;\nfunction f(){const x=2;return x}\nfunction g(x){return x}\nfunction h(){if(1){let x=3;x++}return x}\nfunction k(){try{}catch(x){x}for(const x of[]){x}return [1].map(x=>x)}') },
      { 'legacy.js': L('function f(){const x=2;return x}\nfunction g(x){return x}\nfunction h(){if(1){let x=3;x++}return W.x}\nfunction k(){try{}catch(x){x}for(const x of[]){x}return [1].map(x=>x)}'), 'state/w.js': 'export const W={x:1}' },
      { facade: { name: 'W', names: ['x'] }, removed: ['x'], added: ['W'] }, 0],
    ['Fassade, lokaler Name fälschlich umgeschrieben', { 'legacy.js': L('let x=1;\nfunction f(){const x=2;return x}') }, { 'legacy.js': L('function f(){const x=2;return W.x}'), 'state/w.js': 'export const W={x:1}' },
      { facade: { name: 'W', names: ['x'] }, removed: ['x'], added: ['W'] }, 1],
    ['Fassade, var gehoben', { 'legacy.js': L('let x=1;\nfunction f(){if(1){var x=2}return x}') }, { 'legacy.js': L('function f(){if(1){var x=2}return x}'), 'state/w.js': 'export const W={x:1}' },
      { facade: { name: 'W', names: ['x'] }, removed: ['x'], added: ['W'] }, 0],
    ['Weltobjekt', { 'legacy.js': L('let x=1;\nconst F={y:2};\nfunction g(){x++;return F.y+h()}\nfunction h(){const x=3;return x}') },
      { 'legacy.js': L('let x=1;\nconst F={y:2};\nconst WD={get x(){return x},set x(v){x=v},get y(){return F.y},h};\nfunction h(){return hW(WD)}'), 'core/g.js': 'export function gW(WD){WD.x++;return WD.y+hW(WD)}\nexport function hW(WD){const x=3;return x}' },
      { renames: { gW: 'g', hW: 'h' }, params: { gW: ['WD'], hW: ['WD'] }, world: { param: 'WD', names: ['x'], from: 'F', fromNames: ['y'] }, changed: ['h'], added: ['WD'] }, 0],
    ['Weltobjekt, Bezug vergessen', { 'legacy.js': L('let x=1;\nfunction g(){return x}') },
      { 'legacy.js': L('let x=1;'), 'core/g.js': 'export function gW(WD){return x}' },
      { renames: { gW: 'g' }, params: { gW: ['WD'] }, world: { param: 'WD', names: ['x'] } }, 1],
    ['Fassade vergessen', { 'legacy.js': L('let x=1;\nfunction f(){return x}') }, { 'legacy.js': L('let x=1;\nfunction f(){return W.x}') }, {}, 1],
    ['still gelöscht', { 'legacy.js': L('function a(){}\nfunction b(){}') }, { 'legacy.js': L('function a(){}') }, {}, 1],
    ['neu ohne Angabe', { 'legacy.js': L('function a(){}') }, { 'legacy.js': L('function a(){}\nfunction b(){}') }, {}, 1],
    ['Anweisung geändert', { 'legacy.js': L('go(1);') }, { 'legacy.js': L('go(2);') }, {}, 1],
    ['Literal wird Konstante', { 'legacy.js': L("function a(){return get('k-x')+({'k-x':1})['k-x']}\ngo('k-x');") },
      { 'legacy.js': L("function a(){return get(KX)+({'k-x':1})[KX]}\ngo(KX);"), 'persistence/k.js': "export const KX='k-x'" },
      { literals: { 'k-x': 'KX' }, added: ['KX'] }, 0],
    ['Literal vergessen', { 'legacy.js': L("function a(){return get('k-x')}") }, { 'legacy.js': L("function a(){return get('k-y')}") },
      { literals: { 'k-x': 'KX' } }, 1],
    ['IIFE wird Funktion mit Port', { 'legacy.js': L('let e=1;\nconst L=(function(){let b=0;function f(){return e+b}return {f}})();') },
      { 'legacy.js': L('let e=1;\nconst LP={get e(){return e}};\nconst L=lW(LP);'), 'log/l.js': 'export function lW(LP){let b=0;function f(){return LP.e+b}return {f}}' },
      { renames: { lW: 'L' }, iife: ['lW'], params: { lW: ['LP'] }, world: { param: 'LP', names: ['e'] }, changed: ['L'], added: ['LP'] }, 0],
    ['IIFE, Körper geändert', { 'legacy.js': L('let e=1;\nconst L=(function(){return e})();') },
      { 'legacy.js': L('let e=1;\nconst L=lW({});'), 'log/l.js': 'export function lW(LP){return LP.e+1}' },
      { renames: { lW: 'L' }, iife: ['lW'], params: { lW: ['LP'] }, world: { param: 'LP', names: ['e'] }, changed: ['L'] }, 1],
    ['Parameter gleichen Namens verdeckt die Fassade', { 'legacy.js': L('let d=false;\nfunction f(m){return d||m}') },
      { 'legacy.js': L('function f(m){return fW(ST.d,m)}'), 'db.js': 'export function fW(d,m){return d||m}', 'state/w.js': 'export const ST={d:false}' },
      { renames: { fW: 'f' }, params: { fW: ['d'] }, facade: { name: 'ST', names: ['d'] }, changed: ['f'], removed: ['d'], added: ['ST'] }, 0],
    ['Fassade mit Eigentümer', { 'legacy.js': L('let m=false;\nfunction t(){return m}\nfunction u(){m=true}') },
      { 'legacy.js': L('function u(){AU.m=true}'), 'audio/s.js': 'export let m=false;\nexport const AU={get m(){return m},set m(v){m=v}};\nexport function t(){return m}' },
      { facade: [{ name: 'AU', names: ['m'], own: 'audio/s.js' }], added: ['AU'] }, 0],
    ['Handler bewusst geändert', { 'legacy.js': L('let a=1;\nf(a);') }, { 'legacy.js': L('let a=1;\nf(a+1);') }, { stmtsChanged: 1 }, 0],
    ['Handler neu', { 'legacy.js': L('let a=1;') }, { 'legacy.js': L('let a=1;\nf(a);') }, { stmtsAdded: 1 }, 0],
    ['Handler in Funktion gezogen', { 'legacy.js': L('let a=1;\nconst c=a+1;\nf(a,c);\ng();') }, { 'legacy.js': L('let a=1;\nfunction b(){ return bW(P); }\nconst P={ get a(){ return a; } };\nb();\ng();'), 'ui/b.js': 'export function bW(P){\nconst c=P.a+1;\nf(P.a,c);\n}' },
      { params: { bW: ['P'] }, world: { param: 'P', names: ['a'] }, gathered: { bW: ['c'] }, added: ['b', 'P', 'bW'], stmtsAdded: 1 }, 0],
    ['Handler in Funktion gezogen, aber geändert', { 'legacy.js': L('let a=1;\nf(a);') }, { 'legacy.js': L('let a=1;\nfunction b(){ return bW(P); }\nconst P={ get a(){ return a; } };\nb();'), 'ui/b.js': 'export function bW(P){\nf(P.a+1);\n}' },
      { params: { bW: ['P'] }, world: { param: 'P', names: ['a'] }, gathered: { bW: [] }, added: ['b', 'P', 'bW'], stmtsAdded: 1 }, 2],
    ['Handler weg', { 'legacy.js': L('let a=1;\nf(a);') }, { 'legacy.js': L('let a=1;') }, { stmtsRemoved: 1 }, 0],
    ['Handler weg ohne Nachweis', { 'legacy.js': L('let a=1;\nf(a);') }, { 'legacy.js': L('let a=1;') }, {}, 1],
    ['Handler geändert, nicht angegeben', { 'legacy.js': L('let a=1;\nf(a);') }, { 'legacy.js': L('let a=1;\nf(a+1);') }, {}, 1],
    ['umgebaut nach Umzug', { 'legacy.js': L('function d(){a();b()}') }, { 'legacy.js': L('function d(){dW(P)}'), 'r/d.js': 'export function dW(P){x(P)}\nfunction x(P){P.a();P.b()}' },
      { renames: { dW: 'd' }, params: { dW: ['P'] }, changed: ['d'], rewritten: ['dW'], added: ['x'] }, 0],
    ['umgebaut, ohne Angabe', { 'legacy.js': L('function d(){a();b()}') }, { 'legacy.js': L('function d(){dW(P)}'), 'r/d.js': 'export function dW(P){x(P)}\nfunction x(P){P.a();P.b()}' },
      { renames: { dW: 'd' }, params: { dW: ['P'] }, changed: ['d'], added: ['x'] }, 1],
    ['umgebaut, gleichnamig', { 'r/d.js': 'export function dW(P){P.a();P.b()}' }, { 'r/d.js': 'export function dW(P){x(P)}\nfunction x(P){P.a();P.b()}' }, { rewritten: ['dW'], added: ['x'] }, 0],
    ['changed, aber gleich', { 'legacy.js': L('function a(){}') }, { 'legacy.js': L('function a(){}') }, { changed: ['a'] }, 1],
  ];
  const st = { stack: [{ pr: 11, renames: { a: 'b' }, added: ['x'], changed: ['c'] }, { pr: 12, renames: { d: 'e' }, changed: ['x', 'f'] }] };
  const m1 = JSON.stringify(mergeSteps(st)), m2 = JSON.stringify(mergeSteps(st, doneOf({ pr: 11 })));
  const f2 = mergeSteps({ stack: [{ pr: 1, facade: { name: 'ST', names: ['a'] } }, { pr: 2, facade: { name: 'ST', names: ['b'] } }] });
  if (JSON.stringify(f2.facade) !== JSON.stringify({ name: 'ST', names: ['a', 'b'] })) { console.log('FAIL Selbsttest Stapel Fassade: ' + JSON.stringify(f2)); process.exit(1); }
  const w2 = mergeSteps({ stack: [{ pr: 1, world: { param: 'LP', names: ['a'] } }, { pr: 2, world: { param: 'SV', names: ['b'] } }] });
  if (!Array.isArray(w2.world) || w2.world.length !== 2) { console.log('FAIL Selbsttest Stapel Ports: ' + JSON.stringify(w2)); process.exit(1); }
  if (m1 !== JSON.stringify({ renames: { a: 'b', d: 'e' }, added: ['x'], changed: ['c', 'f'] }) || m2 !== JSON.stringify({ renames: { d: 'e' }, changed: ['x', 'f'] }) || doneOf(st) !== 12 || doneOf(null) !== -Infinity) { console.log('FAIL Selbsttest Stapel: ' + m1 + ' | ' + m2); process.exit(1); }
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
    const all = fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf, 'utf8')) : {};
    let baseMoves = null; try { baseMoves = JSON.parse(execFileSync('git', ['show', ref + ':' + path.relative(ROOT, mf)], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })); } catch (_) {}
    const moves = mergeSteps(all, doneOf(baseMoves));
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
