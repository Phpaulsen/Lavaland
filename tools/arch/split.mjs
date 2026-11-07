// Einmalig für PR 1: zerlegt eine alte index.html (ein <style>, ein <script>) in src/index.html, src/styles.css und src/legacy.js.
// Das Skript wird unverändert übernommen; davor kommt // @ts-nocheck, vor den alten Testanker die Marke /*@test-hook*/.
// Aufruf: git show origin/main:index.html > /tmp/alt.html && node tools/arch/split.mjs /tmp/alt.html
// Damit lässt sich prüfen, dass src/ genau aus main entstanden ist: split ausführen, git diff src/ muss leer sein.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ANCHOR = "document.addEventListener('visibilitychange',function(){ if(document.hidden) saveGame(false); });";
const L = fs.readFileSync(process.argv[2], 'utf8').split('\n');
const at = t => { const i = L.indexOf(t); if (i < 0 || L.indexOf(t, i + 1) >= 0) throw new Error('Zeile „' + t + '“ nicht genau einmal'); return i; };
const s0 = at('<style>'), s1 = at('</style>'), j0 = at('<script>'), j1 = at('</script>');
const js = L.slice(j0 + 1, j1);
const a = js.indexOf(ANCHOR); if (a < 0) throw new Error('Testanker fehlt');
js.splice(a, 0, '/*@test-hook*/');
fs.mkdirSync(path.join(ROOT, 'src'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'src', 'index.html'), L.slice(0, s0 + 1).concat(['<!-- @css -->'], L.slice(s1, j0 + 1), ['<!-- @js -->'], L.slice(j1)).join('\n'));
fs.writeFileSync(path.join(ROOT, 'src', 'styles.css'), L.slice(s0 + 1, s1).join('\n') + '\n');
fs.writeFileSync(path.join(ROOT, 'src', 'legacy.js'), '// @ts-nocheck\n' + js.join('\n') + '\n');
console.log('src/ aus ' + process.argv[2] + ': CSS ' + (s1 - s0 - 1) + ' Zeilen, Skript ' + (j1 - j0 - 1) + ' Zeilen');
