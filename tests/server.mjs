// Kleiner Testserver für das Repo. Die Seite kommt aus dem Testbuild dist/index.test.html (node tools/build.mjs), der den Zugang window.__ev schon enthält.
// Alte Stände (extra, z. B. /old/index.html von main) haben ihn nicht; dort wird er wie früher an einer festen Textstelle eingesetzt.
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const TESTPAGE = path.join(ROOT, 'dist', 'index.test.html');
const ANCHOR = "document.addEventListener('visibilitychange',function(){ if(document.hidden) saveGame(false); });";
const BUNDLE = /\n([ \t]*)document\.addEventListener\("visibilitychange", function\(\) \{\n[ \t]*if \(document\.hidden\) saveGame\(false\);\n[ \t]*\}\);/;
const HOOK = 'window.__ev=function(s){return eval(s);};';
const TYPES = { '.html': 'text/html', '.json': 'application/json', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2', '.ogg': 'audio/ogg' };

// Schalter für Netzprobleme im Test: html verzögert (ms) oder Statuscode statt der Seite.
export const net = { delay: 0, status: 0 };

// extra: zusätzliche Pfade, z. B. { '/old/index.html': '/pfad/zur/alten/index.html' }
export function serve(extra = {}) {
  if (!fs.existsSync(TESTPAGE)) throw new Error('dist/index.test.html fehlt, bitte zuerst node tools/build.mjs');
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      if (p.endsWith('/')) p += 'index.html';
      const f = extra[p] || (p === '/index.html' ? TESTPAGE : path.join(ROOT, path.normalize(p)));
      if (!(extra[p] || f.startsWith(ROOT)) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
      let b = fs.readFileSync(f);
      if (p.endsWith('/index.html') && net.status) { r.writeHead(net.status); r.end(); return; }
      if (p === '/index.html' && !b.toString().includes('window.__ev')) throw new Error('dist/index.test.html ohne Testzugang, bitte node tools/build.mjs');
      if (extra[p] && p.endsWith('/index.html')) {
        // Vor PR 1 steht die Stelle so im Quelltext, ab PR 1 kommt main aus esbuild und ist neu formatiert (BUNDLE).
        const s = b.toString(), hits = s.split(ANCHOR).length - 1, m = s.match(new RegExp(BUNDLE.source, 'g'));
        if (hits + (m ? m.length : 0) !== 1) throw new Error('Testanker in index.html nicht genau einmal');
        b = Buffer.from(hits ? s.replace(ANCHOR, HOOK + '\n' + ANCHOR) : s.replace(BUNDLE, (a, ind) => '\n' + ind + HOOK + a));
      }
      const send = () => { r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(b); };
      if (p.endsWith('/index.html') && net.delay) setTimeout(send, net.delay); else send();
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

