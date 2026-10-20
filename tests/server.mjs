// Kleiner Testserver für das Repo. Baut nur für Tests einen Zugang zu den internen Variablen in die Seite ein.
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ANCHOR = "document.addEventListener('visibilitychange',function(){ if(document.hidden) saveGame(false); });";
const TYPES = { '.html': 'text/html', '.json': 'application/json', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2' };

// extra: zusätzliche Pfade, z. B. { '/old/index.html': '/pfad/zur/alten/index.html' }
export function serve(extra = {}) {
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      if (p.endsWith('/')) p += 'index.html';
      const f = extra[p] || path.join(ROOT, path.normalize(p));
      if (!(extra[p] || f.startsWith(ROOT)) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
      let b = fs.readFileSync(f);
      if (p.endsWith('/index.html')) {
        const s = b.toString();
        if (!s.includes(ANCHOR)) throw new Error('Testanker in index.html fehlt');
        b = Buffer.from(s.replace(ANCHOR, 'window.__ev=function(s){return eval(s);};\n' + ANCHOR));
      }
      r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
      r.end(b);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

