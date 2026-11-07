// Ist-Analyse von index.html: Sektionen, Top-Level-Namen, wer welchen Namen liest/schreibt/aufruft, Zyklen, große Funktionen, DOM/Canvas/Speicher-Mischung, Zugriffe der Tests auf Interna.
// Aufruf: npm ci && node tools/arch/analyze.mjs [--html alte-index.html] [--json out.json] [--write docs/architecture/current.md]
// Ohne --html: analysiert src/legacy.js, Zeilen beziehen sich dann auf diese Datei.
// Mit --write werden die Abschnitte zwischen <!-- arch:NAME --> und <!-- /arch:NAME --> in der Datei ersetzt; alles andere bleibt.
// Verfahren: acorn parst das eine Skript, eigene Gültigkeitsbereiche (var/let/const/function/class/catch/Parameter) lösen jeden Namen auf.
// Ein Name zählt als Top-Level, wenn er direkt im Rumpf der umschließenden IIFE deklariert ist. Zuordnung zu Sektionen über die Kommentare /* ---------- Titel ---------- */.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const acorn = require('acorn');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };

// Ab PR 1 steht das Spiel in src/legacy.js; die gebaute index.html ist umformatiert. --html datei analysiert eine alte index.html (z. B. git show 76ae808:index.html).
const HTMLF = arg('--html');
const html = HTMLF ? fs.readFileSync(HTMLF, 'utf8') : fs.readFileSync(path.join(ROOT, 'src', 'legacy.js'), 'utf8');
const lines = html.split('\n');
const m = HTMLF ? html.match(/<script>([\s\S]*?)<\/script>/) : { index: 0, 1: html, 0: html };
const scriptStart = HTMLF ? html.slice(0, m.index + '<script>'.length).split('\n').length : 1; // Zeile, in der der Skripttext beginnt
const src = m[1];
const L = n => n + scriptStart - 1; // Skriptzeile -> Zeile in index.html

const comments = [];
// src/legacy.js ist ab PR 3 ein Modul (importiert aus core/), die alte index.html ein Skript.
const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: HTMLF ? 'script' : 'module', locations: true, onComment: (block, text, s, e, ls) => { if (block) comments.push({ text, line: L(ls.line) }); } });

// Die IIFE finden: (function(){ 'use strict'; ... })();
const iife = ast.body.find(s => s.type === 'ExpressionStatement' && s.expression.type === 'CallExpression');
const body = iife.expression.callee.body.body;

// ---- Sektionen
const SEC = [{ title: '(Vorspann: Fehlerprotokoll, Canvas, Optionen)', line: L(iife.loc.start.line) }];
for (const c of comments) {
  const t = c.text.trim();
  if (!t.startsWith('---------- ')) continue;
  let title = t.slice(11).split('\n')[0].replace(/\s*-{5,}\s*$/, '').trim();
  title = title.replace(/^(\d)\. /, '$1) ').split(/:\s|\.\s|\.$/)[0].trim();
  if (title.length > 48) title = title.slice(0, 46) + '…';
  SEC.push({ title, line: c.line });
}
SEC.forEach((s, i) => { s.id = i; s.end = i + 1 < SEC.length ? SEC[i + 1].line - 1 : L(iife.loc.end.line); s.label = 'S' + String(i).padStart(2, '0'); });
// Doppelte Titel unterscheidbar machen
const seenT = {}; for (const s of SEC) { if (seenT[s.title]) s.title += ' (' + (++seenT[s.title]) + ')'; else seenT[s.title] = 1; }
const secOf = line => { let r = SEC[0]; for (const s of SEC) if (s.line <= line) r = s; return r.id; };

// ---- Gruppen (für den lesbaren Graphen): Sektionen nach Zuständigkeit zusammengefasst. Grenzen per Titel, nicht per Zeile.
const GROUPS = [
  ['Vorspann', /^\(Vorspann/],
  ['Tastenbilder', /^Bilder für die Tasten/],
  ['Welt', /^(Welt|Schneeberg|Große Welt|Andere Welten|Bäume, Wolken|Schienen|Teilchen)/],
  ['Held+Steuerung', /^(Spielfigur|Tasten)$/],
  ['Malen', /^(Malen mit dem Finger|Winter malen)/],
  ['Ton+Sprache', /^Ton und Sprache/],
  ['Lernen', /^(Aufgaben|Lernen|Lernkern|Rechentafel)/],
  ['Funde', /^Funde/],
  ['Speichern', /^(Speichern|Spielstand umziehen)/],
  ['Reisen', /^Reisen/],
  ['Held+Markt', /^Held, Verbesserungen/],
  ['Aufträge+Missionen', /^(Aufträge|Missionen)/],
  ['Winter+Geschichte', /^(Winter|Lift|Ski|Drachenflug|Schneebälle|Feuerwerk|Schneemänner|Pinguine|Die Figuren|Die Geschichte)/],
  ['Leben (Tiere, U-Boot …)', /^(Leben in der großen Welt|Tiere|Fundsachen|U-Boot|Was jede Sekunde|Stimmung)/],
  ['Render', /^(Die große Welt malen|Zeichnen)/],
  ['Karte', /^(Karte zum Reisen|Erkundungskarte|Leuchtmarken)/],
  ['Tiefe+Werkstatt', /^(Tiefe und Höhe|Wissenstüren|Jede Sekunde|Werkstatt|Aufzug)/],
  ['Rätsel', /^(Rätselmaschinen|\d\) |Sternbild)/],
  ['Vollbild', /^Vollbild/],
  ['Protokoll+Eltern', /^(Spielprotokoll|Elternansicht)/],
];
SEC.forEach(s => { const g = GROUPS.find(g => g[1].test(s.title)); s.group = g ? g[0] : '?' + s.title; });

// ---- Top-Level-Deklarationen
const TOP = new Map(); // name -> {name, kind, line, end, sec, node}
const addTop = (name, kind, node, decl) => TOP.set(name, { name, kind, line: L(node.loc.start.line), end: L((decl || node).loc.end.line), sec: secOf(L(node.loc.start.line)), init: decl && decl.init ? decl.init.type : null, reads: new Map(), writes: new Map(), mutates: new Map(), calls: new Map() });
const patNames = (p, out = []) => {
  if (!p) return out;
  if (p.type === 'Identifier') out.push(p);
  else if (p.type === 'ObjectPattern') p.properties.forEach(q => patNames(q.type === 'RestElement' ? q.argument : q.value, out));
  else if (p.type === 'ArrayPattern') p.elements.forEach(e => patNames(e, out));
  else if (p.type === 'AssignmentPattern') patNames(p.left, out);
  else if (p.type === 'RestElement') patNames(p.argument, out);
  return out;
};
for (const st of body) {
  if (st.type === 'FunctionDeclaration') addTop(st.id.name, 'function', st, st);
  else if (st.type === 'ClassDeclaration') addTop(st.id.name, 'class', st, st);
  else if (st.type === 'VariableDeclaration') for (const d of st.declarations) for (const id of patNames(d.id)) addTop(id.name, st.kind, id, d);
}

// ---- Gültigkeitsbereiche und Namensauflösung
const isFn = n => /^(FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/.test(n.type);
function hoistVars(node, set) { // var und Funktionsdeklarationen im Funktionsrumpf, ohne in innere Funktionen zu gehen
  if (!node || typeof node.type !== 'string') return;
  if (node.type === 'VariableDeclaration' && node.kind === 'var') node.declarations.forEach(d => patNames(d.id).forEach(i => set.add(i.name)));
  for (const k in node) {
    if (k === 'loc' || k === 'type') continue;
    const v = node[k];
    if (Array.isArray(v)) v.forEach(c => c && typeof c.type === 'string' && !isFn(c) && hoistVars(c, set));
    else if (v && typeof v.type === 'string' && !isFn(v)) hoistVars(v, set);
  }
}
function blockDecls(stmts, set) {
  for (const s of stmts) {
    if (!s) continue;
    if (s.type === 'VariableDeclaration' && s.kind !== 'var') s.declarations.forEach(d => patNames(d.id).forEach(i => set.add(i.name)));
    else if (s.type === 'FunctionDeclaration' || s.type === 'ClassDeclaration') set.add(s.id.name);
  }
}

const USE = []; // alle Bezüge auf Top-Level-Namen: {name, how, line, ctx}
const UNDECL = new Map(); // nicht deklarierte Namen -> {n, line, write}
const FUNCS = []; // alle Funktionen mit Länge
let ctxName = null, stIdx = -1; // aktuelle Top-Level-Deklaration bzw. Anweisung, in der wir stehen

function resolve(scopes, name) { for (let i = scopes.length - 1; i >= 0; i--) if (scopes[i].has(name)) return i; return -1; }
function ref(scopes, id, how, line) {
  const i = resolve(scopes, id.name);
  if (i === 0) USE.push({ name: id.name, how, line, ctx: ctxName, st: stIdx });
  else if (i < 0) { const u = UNDECL.get(id.name) || { n: 0, line, write: false }; u.n++; if (how === 'write') u.write = true; UNDECL.set(id.name, u); }
}
const rootId = e => { while (e && (e.type === 'MemberExpression' || e.type === 'ChainExpression')) e = e.type === 'ChainExpression' ? e.expression : e.object; return e && e.type === 'Identifier' ? e : null; };

function walk(n, scopes, parent) {
  if (!n || typeof n.type !== 'string') return;
  const line = L(n.loc.start.line);
  switch (n.type) {
    case 'Identifier': ref(scopes, n, parent && parent.type === 'CallExpression' && parent.callee === n ? 'call' : 'read', line); return;
    case 'FunctionDeclaration': case 'FunctionExpression': case 'ArrowFunctionExpression': {
      FUNCS.push({ name: n.id ? n.id.name : (parent && parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier' ? parent.id.name : (parent && parent.type === 'Property' && parent.key.name) || '(anonym)'), line, len: n.loc.end.line - n.loc.start.line + 1, node: n });
      const s = new Set(); n.params.forEach(p => patNames(p).forEach(i => s.add(i.name)));
      if (n.type === 'FunctionExpression' && n.id) s.add(n.id.name);
      if (n.body.type === 'BlockStatement') { hoistVars(n.body, s); blockDecls(n.body.body, s); }
      const sc = scopes.concat([s]);
      n.params.forEach(p => walkPat(p, sc, true));
      if (n.body.type === 'BlockStatement') n.body.body.forEach(c => walk(c, sc, n.body)); else walk(n.body, sc, n);
      return;
    }
    case 'BlockStatement': case 'StaticBlock': { const s = new Set(); blockDecls(n.body, s); const sc = scopes.concat([s]); n.body.forEach(c => walk(c, sc, n)); return; }
    case 'ForStatement': case 'ForInStatement': case 'ForOfStatement': {
      const s = new Set(); const init = n.init || n.left;
      if (init && init.type === 'VariableDeclaration' && init.kind !== 'var') init.declarations.forEach(d => patNames(d.id).forEach(i => s.add(i.name)));
      const sc = scopes.concat([s]);
      for (const k of ['init', 'left', 'test', 'update', 'right', 'body']) if (n[k]) { if (k === 'left' && n[k].type !== 'VariableDeclaration') walkPat(n[k], sc, false); else walk(n[k], sc, n); }
      return;
    }
    case 'SwitchStatement': { walk(n.discriminant, scopes, n); const s = new Set(); n.cases.forEach(c => blockDecls(c.consequent, s)); const sc = scopes.concat([s]); n.cases.forEach(c => { if (c.test) walk(c.test, sc, c); c.consequent.forEach(x => walk(x, sc, c)); }); return; }
    case 'CatchClause': { const s = new Set(); patNames(n.param).forEach(i => s.add(i.name)); const sc = scopes.concat([s]); walk(n.body, sc, n); return; }
    case 'ClassDeclaration': case 'ClassExpression': { if (n.superClass) walk(n.superClass, scopes, n); n.body.body.forEach(b => { if (b.computed) walk(b.key, scopes, b); if (b.value) walk(b.value, scopes, b); }); return; }
    case 'VariableDeclarator': walkPat(n.id, scopes, true); if (n.init) walk(n.init, scopes, n); return;
    case 'MemberExpression': walk(n.object, scopes, n); if (n.computed) walk(n.property, scopes, n); return;
    case 'Property': if (n.computed) walk(n.key, scopes, n); walk(n.value, scopes, n); return;
    case 'PropertyDefinition': case 'MethodDefinition': if (n.computed) walk(n.key, scopes, n); if (n.value) walk(n.value, scopes, n); return;
    case 'LabeledStatement': walk(n.body, scopes, n); return;
    case 'BreakStatement': case 'ContinueStatement': return;
    case 'AssignmentExpression': {
      if (n.left.type === 'Identifier') { ref(scopes, n.left, 'write', line); if (n.operator !== '=') ref(scopes, n.left, 'read', line); }
      else if (n.left.type === 'MemberExpression') { const r = rootId(n.left); if (r) ref(scopes, r, 'mutate', line); walk(n.left, scopes, n); }
      else walkPat(n.left, scopes, false);
      walk(n.right, scopes, n); return;
    }
    case 'UpdateExpression': {
      if (n.argument.type === 'Identifier') { ref(scopes, n.argument, 'write', line); ref(scopes, n.argument, 'read', line); }
      else { const r = rootId(n.argument); if (r) ref(scopes, r, 'mutate', line); walk(n.argument, scopes, n); }
      return;
    }
    case 'UnaryExpression': if (n.operator === 'delete') { const r = rootId(n.argument); if (r) ref(scopes, r, 'mutate', line); } break;
    case 'CallExpression': { // a.push(...), a.fill(...), a.set(...) etc. auf einem Top-Level-Namen = Mutation
      const c = n.callee;
      if (c.type === 'MemberExpression' && !c.computed && /^(push|pop|shift|unshift|splice|sort|reverse|fill|set|copyWithin|add|delete|clear)$/.test(c.property.name)) { const r = rootId(c.object); if (r) ref(scopes, r, 'mutate', line); }
      break;
    }
  }
  for (const k in n) {
    if (k === 'loc' || k === 'type' || k === 'start' || k === 'end') continue;
    const v = n[k];
    if (Array.isArray(v)) v.forEach(c => c && typeof c.type === 'string' && walk(c, scopes, n));
    else if (v && typeof v.type === 'string') walk(v, scopes, n);
  }
}
function walkPat(p, scopes, decl) {
  if (!p) return;
  if (p.type === 'Identifier') { if (!decl) ref(scopes, p, 'write', L(p.loc.start.line)); return; }
  if (p.type === 'MemberExpression') { const r = rootId(p); if (r) ref(scopes, r, 'mutate', L(p.loc.start.line)); walk(p, scopes, null); return; }
  if (p.type === 'ObjectPattern') p.properties.forEach(q => { if (q.type === 'RestElement') walkPat(q.argument, scopes, decl); else { if (q.computed) walk(q.key, scopes, q); walkPat(q.value, scopes, decl); } });
  else if (p.type === 'ArrayPattern') p.elements.forEach(e => walkPat(e, scopes, decl));
  else if (p.type === 'AssignmentPattern') { walkPat(p.left, scopes, decl); walk(p.right, scopes, p); }
  else if (p.type === 'RestElement') walkPat(p.argument, scopes, decl);
}

const TOPSET = new Set(TOP.keys());
for (const st of body) {
  stIdx++;
  ctxName = st.type === 'FunctionDeclaration' || st.type === 'ClassDeclaration' ? st.id.name : (st.type === 'VariableDeclaration' ? patNames(st.declarations[0].id)[0].name : null);
  const line = L(st.loc.start.line);
  if (st.type === 'VariableDeclaration') {
    for (const d of st.declarations) { ctxName = patNames(d.id)[0] ? patNames(d.id)[0].name : ctxName; if (d.init) walk(d.init, [TOPSET], d); if (d.id.type !== 'Identifier') walkPat(d.id, [TOPSET], true); }
  } else walk(st, [TOPSET], null);
  void line;
}

// ---- Auswertung je Bezug
const hows = ['read', 'write', 'mutate', 'call'];
for (const u of USE) {
  const t = TOP.get(u.name); const s = secOf(u.line);
  const mp = t[u.how === 'call' ? 'calls' : u.how + 's'];
  mp.set(s, (mp.get(s) || 0) + 1);
}
// Sektionsgraph: Kante A->B, wenn Code in A einen Namen aus B benutzt (lesen, schreiben, ändern, aufrufen).
const edges = new Map(); // "a>b" -> {read, write, mutate, call}
const gedges = new Map();
for (const u of USE) {
  const a = secOf(u.line), b = TOP.get(u.name).sec;
  if (a === b) continue;
  const k = a + '>' + b; const e = edges.get(k) || { a, b, read: 0, write: 0, mutate: 0, call: 0, names: new Set() }; e[u.how]++; e.names.add(u.name); edges.set(k, e);
  const ga = SEC[a].group, gb = SEC[b].group; if (ga === gb) continue;
  const gk = ga + '>' + gb; const g = gedges.get(gk) || { a: ga, b: gb, read: 0, write: 0, mutate: 0, call: 0, names: new Set() }; g[u.how]++; g.names.add(u.name); gedges.set(gk, g);
}

// Tarjan: stark zusammenhängende Komponenten
function scc(nodes, adj) {
  let idx = 0; const st = [], on = new Set(), I = new Map(), low = new Map(), out = [];
  const go = v => {
    I.set(v, idx); low.set(v, idx); idx++; st.push(v); on.add(v);
    for (const w of adj.get(v) || []) { if (!I.has(w)) { go(w); low.set(v, Math.min(low.get(v), low.get(w))); } else if (on.has(w)) low.set(v, Math.min(low.get(v), I.get(w))); }
    if (low.get(v) === I.get(v)) { const c = []; let w; do { w = st.pop(); on.delete(w); c.push(w); } while (w !== v); out.push(c); }
  };
  nodes.forEach(v => { if (!I.has(v)) go(v); });
  return out.filter(c => c.length > 1).sort((a, b) => b.length - a.length);
}
const adjOf = em => { const a = new Map(); for (const e of em.values()) { if (!a.has(e.a)) a.set(e.a, []); a.get(e.a).push(e.b); } return a; };
const secSCC = scc(SEC.map(s => s.id), adjOf(edges));
const grpNames = [...new Set(SEC.map(s => s.group))];
const grpSCC = scc(grpNames, adjOf(gedges));

// ---- Geteilter veränderlicher Zustand: let/var oder Objekte/Arrays, die außerhalb der eigenen Sektion geschrieben oder verändert werden
const shared = [...TOP.values()].filter(t => t.kind !== 'function' && t.kind !== 'class').map(t => {
  const ws = new Set([...t.writes.keys(), ...t.mutates.keys()]);
  const rs = new Set([...t.reads.keys(), ...t.calls.keys()]);
  return { ...t, ws, rs, foreignW: [...ws].filter(s => s !== t.sec).length, foreignR: [...rs].filter(s => s !== t.sec).length };
}).filter(t => t.foreignW > 0).sort((a, b) => (b.foreignW - a.foreignW) || (b.foreignR - a.foreignR));

// ---- Funktionen: Länge und Mischung von Zuständigkeiten
const CANVAS = /\b(ctx|g|octx|dkx|x)\.(fillRect|fillText|beginPath|arc|stroke|fill|drawImage|putImageData|save|restore|translate|lineTo|moveTo|setTransform|strokeRect|clearRect|ellipse|quadraticCurveTo)\b|\bfillStyle\s*=/;
const DOM = /\$\('|document\.(getElementById|createElement|querySelector|body)|\.innerHTML\s*=|\.hidden\s*=|\.classList\.|\.style\.|\.textContent\s*=/;
const STORE = /\blocalStorage\.|\bindexedDB\.|\bidbDo\(|\bsaveGame\(|\bsaveHero\(|\bsaveFinds\(|\bsaveFacts\(|\blogEv\(|\blogDb\(/;
const textOf = n => src.slice(n.start, n.end);
FUNCS.forEach(f => { const t = textOf(f.node); f.canvas = CANVAS.test(t); f.dom = DOM.test(t); f.store = STORE.test(t); f.rnd = (t.match(/Math\.random\(/g) || []).length; f.sec = secOf(f.line); });
const god = FUNCS.filter(f => f.len > 150).sort((a, b) => b.len - a.len);
const topFuncs = FUNCS.filter(f => TOP.has(f.name) && TOP.get(f.name).line === f.line);
const mixed = topFuncs.filter(f => [f.canvas, f.dom, f.store].filter(Boolean).length >= 2).sort((a, b) => b.len - a.len);

// ---- Je Sektion: Zählungen
const secStat = SEC.map(s => {
  const chunk = lines.slice(s.line - 1, s.end).join('\n');
  const cnt = re => (chunk.match(re) || []).length;
  return { ...s, n: s.end - s.line + 1, decl: [...TOP.values()].filter(t => t.sec === s.id).length,
    dom: cnt(/\$\('|document\.\w+|\.innerHTML\s*=|\.classList\./g), handlers: cnt(/addEventListener\(|\.onclick\s*=|\.on(pointer|touch|key|mouse|input|change)\w*\s*=/g),
    canvas: cnt(/\b(ctx|octx|dkx)\.\w+/g), store: cnt(/localStorage\.\w+|indexedDB\.\w+|\bidbDo\(/g), rnd: cnt(/Math\.random\(/g), rng: cnt(/\brng\(|\bhash2\(/g) };
});

// ---- Tests: welche internen Namen sprechen sie über window.__ev / page.evaluate an?
const TESTFILES = ['tests/smoke.mjs', 'tests/save.mjs', 'tests/offline.mjs', 'tests/fuzz.mjs', 'tests/crawl.mjs', 'tests/upgrade.mjs', 'tools/voice/collect.mjs'];
const testUse = new Map(); // name -> Set(files)
for (const f of TESTFILES) {
  const t = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const strs = [...t.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)].map(x => x[1] ?? x[2] ?? x[3]);
  for (const s of strs) for (const id of s.match(/[A-Za-z_$][\w$]*/g) || []) if (TOP.has(id)) { if (!testUse.has(id)) testUse.set(id, new Set()); testUse.get(id).add(path.basename(f)); }
}
const BROWSER = new Set(Object.getOwnPropertyNames(globalThis).concat(['window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'indexedDB', 'IDBKeyRange', 'location', 'history', 'screen', 'performance', 'requestAnimationFrame', 'cancelAnimationFrame', 'matchMedia', 'getComputedStyle', 'innerWidth', 'innerHeight', 'devicePixelRatio', 'speechSynthesis', 'SpeechSynthesisUtterance', 'AudioContext', 'webkitAudioContext', 'Image', 'Audio', 'Blob', 'File', 'FileReader', 'URL', 'Event', 'CustomEvent', 'HTMLElement', 'caches', 'alert', 'confirm', 'prompt', 'open', 'close', 'fetch', 'Response', 'Request', 'Headers', 'OffscreenCanvas', 'ImageData', 'Path2D', 'DOMException', 'visualViewport', 'scrollTo', 'onerror', 'self', 'top', 'parent', 'frames', 'name', 'origin', 'crypto', 'TextEncoder', 'TextDecoder', 'CompressionStream', 'DecompressionStream', 'ResizeObserver', 'MutationObserver', 'IntersectionObserver', 'Notification', 'outerWidth', 'outerHeight', 'screenX', 'screenY', 'pageXOffset', 'pageYOffset', 'scrollX', 'scrollY', 'atob', 'btoa', 'MediaRecorder', 'createImageBitmap', 'PointerEvent', 'TouchEvent', 'KeyboardEvent', 'MouseEvent', 'AbortController', 'Worker', 'BroadcastChannel', 'MessageChannel', 'structuredClone', 'queueMicrotask', 'isSecureContext']));
// Aus Modulen importierte Namen sind deklariert, nur nicht in legacy.js.
const IMPORTED = new Set(ast.body.filter(s => s.type === 'ImportDeclaration').flatMap(s => s.specifiers.map(x => x.local.name)));
const undecl = [...UNDECL.entries()].filter(([k]) => !BROWSER.has(k) && !IMPORTED.has(k)).sort((a, b) => b[1].n - a[1].n);
const unused = [...TOP.values()].filter(t => !USE.some(u => u.name === t.name && !(u.line >= t.line && u.line <= t.end)) && !testUse.has(t.name));

// ---- Weltgenerierung: Welche Top-Level-Funktionen sind von den Erzeugern aus erreichbar, und wo ruft eine davon Math.random()?
// Bezug = jeder Bezug auf einen Funktionsnamen (Aufruf oder Weitergabe als Wert). Das überschätzt eher, als dass es etwas übersieht.
const GENROOTS = ['shapeWorld', 'gen', 'newRealm'].filter(n => TOP.has(n));
const fadj = new Map();
for (const u of USE) { const t = TOP.get(u.name); if (!u.ctx || t.kind !== 'function' || u.ctx === u.name) continue; if (!fadj.has(u.ctx)) fadj.set(u.ctx, new Set()); fadj.get(u.ctx).add(u.name); }
const reach = new Set(GENROOTS); const q = [...GENROOTS];
while (q.length) { const v = q.pop(); for (const w of fadj.get(v) || []) if (!reach.has(w)) { reach.add(w); q.push(w); } }
const funcByName = new Map(topFuncs.map(f => [f.name, f]));
const genRnd = [...reach].map(n => funcByName.get(n)).filter(f => f && f.rnd).sort((a, b) => a.line - b.line);
const bigChars = topFuncs.map(f => ({ ...f, chars: f.node.end - f.node.start })).sort((a, b) => b.chars - a.chars).slice(0, 25);

// ---- Kandidaten für core/: Was zieht eine Funktion transitiv nach (Funktionen und Zustand), und ist darin DOM, Canvas, Speicher oder Math.random?
const useBy = new Map(); // ctx -> Set(names)
for (const u of USE) { if (!u.ctx || u.ctx === u.name) continue; if (!useBy.has(u.ctx)) useBy.set(u.ctx, new Set()); useBy.get(u.ctx).add(u.name); }
const writesBy = new Map(); // ctx -> Set(names written/mutated)
for (const u of USE) { if (!u.ctx || (u.how !== 'write' && u.how !== 'mutate')) continue; if (!writesBy.has(u.ctx)) writesBy.set(u.ctx, new Set()); writesBy.get(u.ctx).add(u.name); }
function closure(root) {
  const seen = new Set([root]), q = [root];
  while (q.length) { const v = q.pop(); const t = TOP.get(v); if (!t || t.kind !== 'function') continue; for (const w of useBy.get(v) || []) if (!seen.has(w)) { seen.add(w); q.push(w); } }
  return seen;
}
const LEAFROOTS = ['rng', 'hash2', 'shapeWorld', 'gen', 'newRealm', 'mkQ', 'nextQ', 'mkMuster', 'mkStern', 'mkSpiegel', 'mkRobo', 'mkWaage', 'mkEcho', 'mkRohre', 'mkSudoku', 'snapshot', 'restore', 'packRuns', 'loadCells', 'step', 'idbDo'].filter(n => TOP.has(n));
const leaves = LEAFROOTS.map(r => {
  const c = closure(r); const fs = [...c].map(n => funcByName.get(n)).filter(Boolean);
  const vars = [...c].filter(n => TOP.get(n).kind !== 'function');
  const wr = new Set(); for (const n of c) for (const w of writesBy.get(n) || []) wr.add(w);
  return { r, line: TOP.get(r).line, nf: fs.length, nv: vars.length, canvas: fs.filter(f => f.canvas).map(f => f.name), dom: fs.filter(f => f.dom).map(f => f.name), store: fs.filter(f => f.store).map(f => f.name), rnd: fs.filter(f => f.rnd).map(f => f.name), wr: [...wr] };
});
const short = a => a.length ? a.slice(0, 4).map(n => '`' + n + '`').join(' ') + (a.length > 4 ? ' +' + (a.length - 4) : '') : '–';

// ---- Beim Laden ausgeführter Code, der let/const/class liest, die erst weiter unten deklariert sind (Zeitliche Totzone, ReferenceError beim Start).
// Erfasst direkte Bezüge in Anweisungen, die keine Funktionsdeklaration sind, ohne Rückrufe auszuschließen: Treffer sind Kandidaten, von Hand prüfen.
const tdz = [];
body.forEach((st, i) => {
  if (st.type === 'FunctionDeclaration' || st.type === 'ClassDeclaration') return;
  const ln = L(st.loc.start.line);
  const hit = new Map();
  for (const u of USE) if (u.st === i) { const t = TOP.get(u.name); if (t.kind !== 'function' && t.line > ln && !hit.has(u.name)) hit.set(u.name, u.line); }
  // eine Ebene tiefer: direkt aufgerufene Top-Level-Funktionen
  for (const u of USE) if (u.st === i && u.how === 'call') for (const w of useBy.get(u.name) || []) { const t = TOP.get(w); if (t && t.kind !== 'function' && t.line > ln && !hit.has(w)) hit.set(w, u.line); }
  for (const [n, at] of hit) tdz.push({ stmt: ln, at, name: n, decl: TOP.get(n).line });
});

// ---- Ausgabe
const fmtSecs = set => [...set].sort((a, b) => a - b).map(i => SEC[i].label).join(' ');
const out = {};
out.summary = [
  `Gemessen an \`${HTMLF ? 'index.html' : 'src/legacy.js'}\` (${lines.length} Zeilen, ${Math.round(Buffer.byteLength(html) / 1024)} KB). Skript: Zeilen ${L(iife.loc.start.line)}–${L(iife.loc.end.line)}, eine IIFE mit \`'use strict'\`.`,
  '',
  `| Größe | Wert |`, `|---|---|`,
  `| Sektionen (Kommentarmarken) | ${SEC.length} |`,
  `| Top-Level-Namen im IIFE-Rumpf | ${TOP.size} (function ${[...TOP.values()].filter(t => t.kind === 'function').length}, const ${[...TOP.values()].filter(t => t.kind === 'const').length}, let ${[...TOP.values()].filter(t => t.kind === 'let').length}, var ${[...TOP.values()].filter(t => t.kind === 'var').length}) |`,
  `| Funktionen insgesamt (inkl. innerer und Pfeilfunktionen) | ${FUNCS.length} |`,
  `| Funktionen > 150 Zeilen | ${god.length} |`,
  `| Bezüge auf Top-Level-Namen | ${USE.length}, davon sektionsübergreifend ${[...edges.values()].reduce((s, e) => s + e.read + e.write + e.mutate + e.call, 0)} |`,
  `| Kanten zwischen Sektionen | ${edges.size} |`,
  `| Zustand, der außerhalb der eigenen Sektion geschrieben wird | ${shared.length} Namen |`,
  `| Größter Zyklus (Sektionen) | ${secSCC[0] ? secSCC[0].length : 0} von ${SEC.length} |`,
  `| Größter Zyklus (Gruppen) | ${grpSCC[0] ? grpSCC[0].length : 0} von ${grpNames.length} |`,
  `| \`Math.random()\` | ${secStat.reduce((s, x) => s + x.rnd, 0)} Aufrufe |`,
  `| Von Tests angesprochene interne Namen | ${testUse.size} |`,
].join('\n');

out.sections = ['| Nr | Sektion | Gruppe | Zeilen | Länge | Namen | DOM | Handler | Canvas | Speicher | `Math.random` | `rng`/`hash2` |', '|---|---|---|---|---|---|---|---|---|---|---|---|']
  .concat(secStat.map(s => `| ${s.label} | ${s.title} | ${s.group} | ${s.line}–${s.end} | ${s.n} | ${s.decl} | ${s.dom} | ${s.handlers} | ${s.canvas} | ${s.store} | ${s.rnd} | ${s.rng} |`)).join('\n');

const G = grpNames;
const cell = (a, b) => { const e = gedges.get(a + '>' + b); return e ? String(e.read + e.write + e.mutate + e.call) + (e.write + e.mutate ? '*' : '') : ''; };
out.groups = ['Zeile benutzt Spalte. Zahl = Bezüge, `*` = schreibt oder verändert dabei Zustand der Spalte.', '',
  '| benutzt → | ' + G.map((g, i) => 'G' + i).join(' | ') + ' |', '|---|' + G.map(() => '---|').join(''),
  ...G.map((a, i) => `| G${i} ${a} | ` + G.map(b => cell(a, b)).join(' | ') + ' |')].join('\n');

out.cycles = [
  '**Gruppen:** ' + (grpSCC.length ? grpSCC.map(c => `{${c.map(g => 'G' + G.indexOf(g) + ' ' + g).join(', ')}}`).join('; ') : 'keine'),
  '',
  '**Sektionen:** ' + (secSCC.length ? secSCC.map(c => `${c.length} Sektionen: ${c.map(i => SEC[i].label).sort().join(' ')}`).join('; ') : 'keine'),
  '',
  'Sektionen außerhalb jedes Zyklus: ' + SEC.filter(s => !secSCC.some(c => c.includes(s.id))).map(s => `${s.label} ${s.title}`).join(', ') + '.',
].join('\n');

out.edges = ['| von | nach | lesen | schreiben | ändern | aufrufen | Beispiele |', '|---|---|---|---|---|---|---|']
  .concat([...edges.values()].sort((x, y) => (x.a - y.a) || (x.b - y.b)).map(e => `| ${SEC[e.a].label} | ${SEC[e.b].label} | ${e.read} | ${e.write} | ${e.mutate} | ${e.call} | ${[...e.names].slice(0, 5).map(n => '`' + n + '`').join(' ')} |`)).join('\n');

out.state = ['Sortiert nach Anzahl fremder Sektionen, die schreiben oder verändern (Zuweisung, Eigenschaft setzen, `push`/`fill`/`set` …).', '',
  '| Name | Art | deklariert | schreibende Sektionen | lesende Sektionen |', '|---|---|---|---|---|']
  .concat(shared.slice(0, 60).map(t => `| \`${t.name}\` | ${t.kind} | ${t.line} (${SEC[t.sec].label}) | ${t.ws.size}: ${fmtSecs(t.ws)} | ${t.rs.size} |`))
  .concat(shared.length > 60 ? ['', `… und ${shared.length - 60} weitere (\`--json\` liefert alle).`] : []).join('\n');

out.god = ['| Funktion | Zeile | Länge | Sektion | Canvas | DOM | Speicher | `Math.random` |', '|---|---|---|---|---|---|---|---|']
  .concat(god.map(f => `| \`${f.name}\` | ${f.line} | ${f.len} | ${SEC[f.sec].label} ${SEC[f.sec].title} | ${f.canvas ? 'ja' : ''} | ${f.dom ? 'ja' : ''} | ${f.store ? 'ja' : ''} | ${f.rnd || ''} |`)).join('\n');

out.mixed = ['Top-Level-Funktionen, die mindestens zwei von Canvas-Zeichnen, DOM und Speichern selbst enthalten (Text der Funktion, inkl. innerer Funktionen), längste zuerst.', '',
  '| Funktion | Zeile | Länge | Canvas | DOM | Speicher |', '|---|---|---|---|---|---|']
  .concat(mixed.slice(0, 40).map(f => `| \`${f.name}\` | ${f.line} | ${f.len} | ${f.canvas ? 'ja' : ''} | ${f.dom ? 'ja' : ''} | ${f.store ? 'ja' : ''} |`))
  .concat(mixed.length > 40 ? ['', `… und ${mixed.length - 40} weitere.`] : []).join('\n');

out.tests = ['| Name | deklariert | Art | benutzt in |', '|---|---|---|---|']
  .concat([...testUse.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([n, fs]) => `| \`${n}\` | ${TOP.get(n).line} | ${TOP.get(n).kind} | ${[...fs].join(', ')} |`)).join('\n');

out.undecl = undecl.length ? ['| Name | Bezüge | erste Zeile | wird zugewiesen |', '|---|---|---|---|'].concat(undecl.map(([k, v]) => `| \`${k}\` | ${v.n} | ${v.line} | ${v.write ? 'ja' : ''} |`)).join('\n') : 'keine';
out.unused = unused.length ? unused.map(t => `\`${t.name}\` (${t.line})`).join(', ') : 'keine';

out.gen = [`Wurzeln: ${GENROOTS.map(n => '`' + n + '`').join(', ')}. Erreichbar: ${reach.size} Top-Level-Funktionen.`, '',
  genRnd.length ? 'Erreichbare Funktionen mit `Math.random()`:' : 'Keine erreichbare Funktion ruft `Math.random()`.', '',
  ...(genRnd.length ? ['| Funktion | Zeile | Sektion | `Math.random` |', '|---|---|---|---|', ...genRnd.map(f => `| \`${f.name}\` | ${f.line} | ${SEC[f.sec].label} | ${f.rnd} |`)] : [])].join('\n');

out.bigchars = ['Der Code ist dicht (viele Anweisungen je Zeile). Zeilen allein unterschätzen die Größe, deshalb hier die 25 größten Top-Level-Funktionen nach Zeichen.', '',
  '| Funktion | Zeile | Zeilen | Zeichen | Sektion | Canvas | DOM | Speicher |', '|---|---|---|---|---|---|---|---|']
  .concat(bigChars.map(f => `| \`${f.name}\` | ${f.line} | ${f.len} | ${f.chars} | ${SEC[f.sec].label} | ${f.canvas ? 'ja' : ''} | ${f.dom ? 'ja' : ''} | ${f.store ? 'ja' : ''} |`)).join('\n');

out.leaves = ['Transitive Hülle über Top-Level-Bezüge (jede Erwähnung zählt, auch als Wert). „schreibt“ = Top-Level-Zustand, den die Hülle zuweist oder verändert.', '',
  '| Wurzel | Zeile | Funktionen | Zustand gelesen | DOM in | Canvas in | Speicher in | `Math.random` in | schreibt |', '|---|---|---|---|---|---|---|---|---|']
  .concat(leaves.map(l => `| \`${l.r}\` | ${l.line} | ${l.nf} | ${l.nv} | ${short(l.dom)} | ${short(l.canvas)} | ${short(l.store)} | ${short(l.rnd)} | ${l.wr.length}: ${short(l.wr)} |`)).join('\n');

out.tdz = tdz.length ? ['Kandidaten (Anweisung beim Laden, Bezug, später deklarierter Name). Ein Treffer in einem Rückruf (`addEventListener`, `setTimeout`) ist harmlos, ein Treffer in sofort ausgeführtem Code wirft beim Start.', '',
  '| Anweisung ab Zeile | Bezug in Zeile | Name | deklariert in Zeile |', '|---|---|---|---|'].concat(tdz.map(t => `| ${t.stmt} | ${t.at} | \`${t.name}\` | ${t.decl} |`)).join('\n') : 'keine';

if (arg('--json')) fs.writeFileSync(arg('--json'), JSON.stringify({ sections: secStat, top: [...TOP.values()].map(t => ({ name: t.name, kind: t.kind, line: t.line, sec: t.sec, reads: Object.fromEntries(t.reads), writes: Object.fromEntries(t.writes), mutates: Object.fromEntries(t.mutates), calls: Object.fromEntries(t.calls) })), edges: [...edges.values()].map(e => ({ ...e, names: [...e.names] })), secSCC, grpSCC, god: god.map(({ node, ...f }) => f), mixed: mixed.map(({ node, ...f }) => f), testUse: Object.fromEntries([...testUse].map(([k, v]) => [k, [...v]])), undecl, unused: unused.map(t => t.name), gen: { roots: GENROOTS, reach: [...reach].sort(), writes: [...new Set([...reach].flatMap(n => [...(writesBy.get(n) || [])]))].sort() } }, null, 1));
const target = arg('--write');
if (target) {
  let doc = fs.readFileSync(target, 'utf8');
  for (const k in out) {
    const re = new RegExp(`(<!-- arch:${k} -->)[\\s\\S]*?(<!-- /arch:${k} -->)`);
    if (re.test(doc)) doc = doc.replace(re, (_, a, b) => a + '\n' + out[k] + '\n' + b);
  }
  fs.writeFileSync(target, doc);
  console.log('geschrieben: ' + target);
} else for (const k in out) console.log('\n## ' + k + '\n\n' + out[k]);
