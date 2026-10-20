// Statischer Test ohne Browser: Syntax aller Skripte, Größenbudget, jede $('id') hat ein Element, IDs einmalig, Speicherschlüssel, Offline-Dateien.
// Aufruf: node tests/static.mjs
import fs from 'fs';
import vm from 'vm';
import zlib from 'zlib';
import path from 'path';
import { ROOT } from './server.mjs';

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let failed = 0;
const check = (name, fn) => { try { fn(); console.log('ok   ' + name); } catch (e) { failed++; console.log('FAIL ' + name + '\n     ' + (e.message || e)); } };

const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);

check('Skripte in index.html sind gültiges JavaScript', () => {
  if (!scripts.length) throw new Error('kein Skript gefunden');
  scripts.forEach((s, i) => { try { new vm.Script(s, { filename: 'index.html#script' + i }); } catch (e) { throw new Error('Skript ' + i + ': ' + e.message); } });
});

check('sw.js ist gültiges JavaScript', () => { new vm.Script(fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8'), { filename: 'sw.js' }); });

// Budget: die Seite soll auf dem Handy auch mit schwachem Netz schnell da sein.
const MAX_RAW = 800 * 1024, MAX_GZ = 240 * 1024;
check('Größenbudget index.html', () => {
  const raw = Buffer.byteLength(html), gz = zlib.gzipSync(html, { level: 9 }).length;
  console.log('     ' + Math.round(raw / 1024) + ' KB, gzip ' + Math.round(gz / 1024) + ' KB (Grenzen ' + MAX_RAW / 1024 + ' / ' + MAX_GZ / 1024 + ' KB)');
  if (raw > MAX_RAW) throw new Error('index.html zu groß: ' + raw);
  if (gz > MAX_GZ) throw new Error('index.html gzip zu groß: ' + gz);
});

check('Jede $(\'id\') im Code hat ein Element', () => {
  const used = new Set([...html.matchAll(/\$\('([\w-]+)'\)/g)].map(m => m[1]));
  // Erzeugte Knöpfe wie id="mode-'+v[0]+'" zählen über ihr Präfix.
  const made = id => { const pre = id.replace(/[^-]+$/, ''); return pre && html.includes('id="' + pre + "'+"); };
  const missing = [...used].filter(id => !html.includes('id="' + id + '"') && !html.includes("id='" + id + "'") && !made(id));
  if (missing.length) throw new Error('fehlt: ' + missing.join(', '));
});

check('Keine fremden Skripte', () => {
  const ext = [...html.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)].map(m => m[1]).filter(s => /^https?:/.test(s));
  if (ext.length) throw new Error(ext.join(', '));
});

check('Keine doppelten IDs', () => {
  const ids = [...html.matchAll(/\sid="([\w-]+)"/g)].map(m => m[1]), seen = new Set(), dup = new Set();
  for (const id of ids) (seen.has(id) ? dup : seen).add(id);
  if (dup.size) throw new Error([...dup].join(', '));
});

// „Spielstand sichern“ nimmt nur Schlüssel mit, die mit lavaland anfangen. Ein anderer Name ginge beim Umzug verloren.
check('Jeder localStorage-Schlüssel beginnt mit lavaland', () => {
  const lit = [...html.matchAll(/localStorage\.(?:setItem|getItem|removeItem)\('([^']*)'/g)].map(m => m[1]);
  const con = [...html.matchAll(/[\s,](\w+)='([^']*)'/g)].reduce((o, m) => (o[m[1]] = m[2], o), {});
  const named = [...html.matchAll(/localStorage\.(?:setItem|getItem|removeItem)\(([A-Z]\w*)[,)]/g)].map(m => con[m[1]] ?? '?' + m[1]);
  const bad = lit.concat(named).filter(k => k.indexOf('lavaland') !== 0);
  if (bad.length) throw new Error(bad.join(', '));
});

check('Alle Dateien im Offline-Speicher gibt es', () => {
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const core = JSON.parse(sw.match(/const CORE=(\[[^\]]*\])/)[1].replace(/'/g, '"'));
  const miss = core.filter(f => f !== './' && !fs.existsSync(path.join(ROOT, f)));
  if (miss.length) throw new Error(miss.join(', '));
});

console.log(failed ? failed + ' Prüfungen fehlgeschlagen' : 'alle statischen Prüfungen ok');
process.exit(failed ? 1 : 0);
