// Vorlesetexte: Gibt es zu jedem Satz, den das Spiel vorlesen kann, eine Aufnahme? Sonst springt die Browserstimme ein (anders klingend, auf manchen Handys gar keine).
// Aufruf: node tools/voice/collect.mjs > /tmp/texts.json && node tests/voice.mjs /tmp/texts.json
// Meldet fehlende Sätze als Warnung im CI, bricht aber nicht ab: Die Aufnahmen entstehen nur lokal (tools/voice/README.md).
// Aufnahmen, die kein Satz mehr braucht, lassen CI scheitern (Ratsche gegen Wiederwachsen, Vereinfachungsplan Schritt 7).
// Mit --prune werden sie aus audio/index.json und audio/ gelöscht; dafür braucht es keine Stimme.
import fs from 'fs';
import path from 'path';
import { ROOT } from './server.mjs';

const texts = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'audio', 'index.json'), 'utf8'));
const miss = texts.filter(t => !idx.c[t]);
const gone = Object.values(idx.c).filter(id => !fs.existsSync(path.join(ROOT, 'audio', id + '.ogg')));
if (gone.length) { console.log('FAIL Aufnahmen fehlen als Datei: ' + gone.slice(0, 10).join(', ')); process.exit(1); }
const want = new Set(texts);
const unused = Object.keys(idx.c).filter(t => !want.has(t));
if (unused.length && process.argv.includes('--prune')) {
  for (const t of unused) delete idx.c[t];
  const keep = new Set(Object.values(idx.c));
  let n = 0;
  for (const f of fs.readdirSync(path.join(ROOT, 'audio'))) if (f.endsWith('.ogg') && !keep.has(f.slice(0, -4))) { fs.unlinkSync(path.join(ROOT, 'audio', f)); n++; }
  fs.writeFileSync(path.join(ROOT, 'audio', 'index.json'), JSON.stringify(idx));
  console.log('ok   ' + unused.length + ' Sätze und ' + n + ' Aufnahmen entfernt, die kein Satz mehr braucht');
} else if (unused.length) { console.log('FAIL ' + unused.length + ' Aufnahmen braucht kein Satz mehr, bitte mit --prune löschen: ' + unused.slice(0, 8).join(' | ')); process.exit(1); }
if (miss.length) {
  const msg = miss.length + ' Sätze ohne Aufnahme, bitte tools/voice neu bauen: ' + miss.slice(0, 8).join(' | ');
  console.log(process.env.GITHUB_ACTIONS ? '::warning title=Vorlesetexte::' + msg : 'WARN ' + msg);
} else console.log('ok   alle ' + texts.length + ' Vorlesesätze haben eine Aufnahme');
