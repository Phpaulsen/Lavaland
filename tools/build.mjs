// Baut aus src/ die eine ausgelieferte Datei index.html (Skript und CSS inline) und den Testbuild dist/index.test.html.
// Aufruf: node tools/build.mjs            baut beide
//         node tools/build.mjs --check    baut im Speicher und scheitert, wenn index.html nicht dazu passt (CI: „Bundle aktuell“)
//         node tools/build.mjs --watch    baut bei jeder Änderung in src/ neu
// Der Testbuild unterscheidet sich nur an der Stelle /*@test-hook*/ in src/app/wire.js: Dort steht im Test der Zugang window.__ev (eval im Spiel-Scope).
// Im Produktionsbuild bleibt nur der Kommentar, und esbuild lässt Kommentare weg.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as esbuild from 'esbuild';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'index.html');
const OUT_TEST = path.join(ROOT, 'dist', 'index.test.html');
const HOOK = '/*@test-hook*/';
const HOOK_CODE = 'window.__ev=function(s){return eval(s);};';

function hookPlugin(test) {
  return {
    name: 'test-hook',
    setup(b) {
      b.onLoad({ filter: /[\\/]src[\\/]app[\\/]wire\.js$/ }, async a => {
        const t = await fs.promises.readFile(a.path, 'utf8');
        if (t.split(HOOK).length !== 2) throw new Error('Marke ' + HOOK + ' muss genau einmal in src/app/wire.js stehen');
        return { contents: test ? t.replace(HOOK, HOOK_CODE) : t, loader: 'js' };
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
  // Direktes eval im Testbuild ist gewollt. Jede andere Warnung bricht ab.
  const warn = r.warnings.filter(w => !(test && /direct-eval|Using direct eval/.test(w.id + ' ' + w.text)));
  if (warn.length) throw new Error('esbuild-Warnungen:\n' + (await esbuild.formatMessages(warn, { kind: 'warning' })).join('\n'));
  const js = r.outputFiles[0].text;
  if (/<\/script/i.test(js)) throw new Error('Bundle enthält </script');
  return { js, metafile: r.metafile };
}

export async function build({ test = false } = {}) {
  const tpl = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(SRC, 'styles.css'), 'utf8').replace(/\n$/, '');
  const { js, metafile } = await bundle(test);
  for (const m of ['<!-- @css -->', '<!-- @js -->']) if (tpl.split(m).length !== 2) throw new Error('Marke ' + m + ' muss genau einmal in src/index.html stehen');
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
