// Vorlesetexte: Gibt es zu jedem Satz, den das Spiel vorlesen kann, eine Aufnahme? Sonst springt die Browserstimme ein (anders klingend, auf manchen Handys gar keine).
// Aufruf: node tools/voice/collect.mjs > /tmp/texts.json && node tests/voice.mjs /tmp/texts.json
// Meldet fehlende Sätze als Warnung im CI, bricht aber nicht ab: Die Aufnahmen entstehen nur lokal (tools/voice/README.md).
import fs from 'fs';
import path from 'path';
import { ROOT } from './server.mjs';

const texts = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'audio', 'index.json'), 'utf8'));
const miss = texts.filter(t => !idx.c[t]);
const gone = Object.values(idx.c).filter(id => !fs.existsSync(path.join(ROOT, 'audio', id + '.ogg')));
if (gone.length) { console.log('FAIL Aufnahmen fehlen als Datei: ' + gone.slice(0, 10).join(', ')); process.exit(1); }
if (miss.length) {
  const msg = miss.length + ' Sätze ohne Aufnahme, bitte tools/voice neu bauen: ' + miss.slice(0, 8).join(' | ');
  console.log(process.env.GITHUB_ACTIONS ? '::warning title=Vorlesetexte::' + msg : 'WARN ' + msg);
} else console.log('ok   alle ' + texts.length + ' Vorlesesätze haben eine Aufnahme');
