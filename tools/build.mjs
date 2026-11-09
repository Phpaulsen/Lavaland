// Baut aus src/ die eine ausgelieferte Datei index.html (Skript und CSS inline) und den Testbuild dist/index.test.html.
// Aufruf: node tools/build.mjs            baut beide
//         node tools/build.mjs --check    baut im Speicher und scheitert, wenn index.html nicht dazu passt (CI: „Bundle aktuell“)
//         node tools/build.mjs --watch    baut bei jeder Änderung in src/ neu
// Der Testbuild unterscheidet sich an zwei Stellen: An der Marke /*@test-hook*/ in src/app/wire.js steht die benannte Test-API window.__lv
// (Getter für jeden Namen im Scope von wire(), Setter für let, var und function; erzeugt aus dem AST, kein eval im Spiel),
// und vor dem Bundle steht ein eigenes Skript mit window.__ev(s): Es wertet den Ausdruck s der Tests über with(window.__lv) aus.
// Im Produktionsbuild bleibt nur der Kommentar, und esbuild lässt Kommentare weg.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import * as esbuild from 'esbuild';

const acorn = createRequire(import.meta.url)('acorn');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'index.html');
const OUT_TEST = path.join(ROOT, 'dist', 'index.test.html');
const HOOK = '/*@test-hook*/';
// Eigenes Skript ohne "use strict" (with ist nur dort erlaubt). __ev gibt es erst, wenn wire() __lv gesetzt hat, wie früher.
const EV_SCRIPT = '<script>window.__lvEv=function(s){with(window.__lv){return eval(s);}};</script>\n';

// Platzhalter im Quelltext und wie esbuild ihn ausgibt. Ersetzt wird er erst im fertigen Bundle, damit esbuild keine Namen umbenennt.
const PLACE = 'window.__lvHook=0;', PLACE_OUT = 'window.__lvHook = 0;';

/**
 * Namen, die an der Stelle PLACE im gebauten Bundle sichtbar sind: oberste Ebene der esbuild-Hülle (alle Module) und Körper von wire().
 * Das sind dieselben Namen, die früher eval an dieser Stelle sah. const nur lesen, let/var/function/class lesen und schreiben.
 */
export function scopeAt(js) {
  const ast = acorn.parse(js, { ecmaVersion: 'latest', sourceType: 'script' });
  const ro = new Set(), rw = new Set();
  const pat = (p, set) => { if (!p) return; if (p.type === 'Identifier') set.add(p.name); else if (p.type === 'ObjectPattern') p.properties.forEach(q => pat(q.type === 'RestElement' ? q.argument : q.value, set)); else if (p.type === 'ArrayPattern') p.elements.forEach(e => pat(e, set)); else if (p.type === 'RestElement') pat(p.argument, set); else if (p.type === 'AssignmentPattern') pat(p.left, set); };
  const take = list => {
    for (const s of list) {
      if (s.type === 'FunctionDeclaration' || s.type === 'ClassDeclaration') rw.add(s.id.name);
      else if (s.type === 'VariableDeclaration') s.declarations.forEach(d => pat(d.id, s.kind === 'const' ? ro : rw));
    }
  };
  const outer = ast.body.length === 1 && ast.body[0].expression && ast.body[0].expression.callee;
  if (!outer || !outer.body) throw new Error('Bundle ohne esbuild-Hülle');
  take(outer.body.body);
  const wire = outer.body.body.find(s => s.type === 'FunctionDeclaration' && /^wire\d*$/.test(s.id.name) && js.slice(s.start, s.end).includes(PLACE_OUT));
  if (!wire) throw new Error('Testmarke nicht im Körper von wire()');
  take(wire.body.body);
  for (const n of rw) ro.delete(n);
  return { ro: [...ro].sort(), rw: [...rw].sort() };
}

/** Quelltext für window.__lv aus den Namen von scopeAt. */
export function lvCode({ ro, rw }) {
  const parts = [...ro.map(n => `get ${n}(){return ${n};}`), ...rw.map(n => `get ${n}(){return ${n};},set ${n}(v){${n}=v;}`)];
  return 'window.__lv={' + parts.join(',') + '};window.__ev=window.__lvEv;';
}

function hookPlugin(test) {
  return {
    name: 'test-hook',
    setup(b) {
      b.onLoad({ filter: /[\\/]src[\\/]app[\\/]wire\.js$/ }, async a => {
        const t = await fs.promises.readFile(a.path, 'utf8');
        if (t.split(HOOK).length !== 2) throw new Error('Marke ' + HOOK + ' muss genau einmal in src/app/wire.js stehen');
        return { contents: test ? t.replace(HOOK, PLACE) : t, loader: 'js' };
      });
    },
  };
}

async function bundle(test) {
  const r = await esbuild.build({
    entryPoints: [path.join(SRC, 'main.js')],
    bundle: true,
    format: 'iife',
    target: 'es2020',
    charset: 'utf8',
    legalComments: 'none',
    minify: false,
    write: false,
    metafile: true,
    logLevel: 'silent',
    plugins: [hookPlugin(test)],
    // tsconfig.json gilt nur für tsc. Sonst liest esbuild daraus „strict“ und setzt ein zusätzliches "use strict" vor das Bundle.
    tsconfigRaw: {},
  });
  // Jede Warnung bricht ab (auch im Testbuild: Er enthält kein eval mehr).
  const warn = r.warnings;
  if (warn.length) throw new Error('esbuild-Warnungen:\n' + (await esbuild.formatMessages(warn, { kind: 'warning' })).join('\n'));
  let js = r.outputFiles[0].text;
  if (test) {
    if (js.split(PLACE_OUT).length !== 2) throw new Error('Platzhalter für __lv nicht genau einmal im Testbundle');
    js = js.replace(PLACE_OUT, () => lvCode(scopeAt(js)));
  }
  if (/<\/script/i.test(js)) throw new Error('Bundle enthält </script');
  return { js, metafile: r.metafile };
}

export async function build({ test = false } = {}) {
  let tpl = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(SRC, 'styles.css'), 'utf8').replace(/\n$/, '');
  const { js, metafile } = await bundle(test);
  for (const m of ['<!-- @css -->', '<!-- @js -->']) if (tpl.split(m).length !== 2) throw new Error('Marke ' + m + ' muss genau einmal in src/index.html stehen');
  if (test) {
    const at = '<script>\n<!-- @js -->';
    if (tpl.split(at).length !== 2) throw new Error('<script> muss direkt vor <!-- @js --> stehen');
    tpl = tpl.replace(at, () => EV_SCRIPT + at);
  }
  const html = tpl.replace('<!-- @css -->', () => css).replace('<!-- @js -->', () => js.replace(/\n$/, ''));
  return { html, metafile };
}

async function writeAll() {
  const prod = await build();
  const test = await build({ test: true });
  fs.writeFileSync(OUT, prod.html);
  fs.mkdirSync(path.dirname(OUT_TEST), { recursive: true });
  fs.writeFileSync(OUT_TEST, test.html);
  fs.writeFileSync(path.join(ROOT, 'dist', 'meta.json'), JSON.stringify(prod.metafile));
  console.log('index.html ' + Math.round(Buffer.byteLength(prod.html) / 1024) + ' KB, dist/index.test.html');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--check')) {
    const { html } = await build();
    const cur = fs.readFileSync(OUT, 'utf8');
    if (cur !== html) { console.log('FAIL index.html passt nicht zu src/. Bitte „node tools/build.mjs“ ausführen und das Ergebnis committen.'); process.exit(1); }
    console.log('ok   index.html ist aus src/ gebaut');
  } else if (process.argv.includes('--watch')) {
    await writeAll();
    let t = null;
    fs.watch(SRC, { recursive: true }, () => { clearTimeout(t); t = setTimeout(() => writeAll().catch(e => console.error(e.message)), 100); });
    console.log('beobachte src/ …');
  } else await writeAll();
}
