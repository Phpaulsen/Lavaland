# Zielarchitektur

> **Historisch.** Stand vor bzw. während der Migration (5.–9.11.2026). Die Architektur, wie sie heute ist, beschreibt [`architecture.md`](architecture.md).

Gilt für die Migration nach `adr/0001-modularisierung.md`. Ist-Zustand und Zahlen: `current.md`. Reihenfolge: `migration-plan.md`.

## 1. Was sich ändert, was nicht

- Ausgeliefert wird weiter **eine** `index.html` mit Skript und CSS inline. Audio, Fonts, Icons, `manifest.json`, `sw.js` bleiben Dateien daneben.
- Quelltext liegt in `src/` als ES-Module. `tools/build.mjs` bündelt mit esbuild zu einem IIFE-Skript und setzt es mit CSS ins Template.
- Typprüfung mit JSDoc und `tsc --noEmit --checkJs`, kein TypeScript-Quelltext.
- Spielverhalten, Speicherformate, Weltgenerierung: unverändert.

## 2. Verzeichnisse

```
src/
  index.html          Markup-Template mit <!-- @css --> und <!-- @js -->
  styles.css
  main.js             Composition Root: erzeugt Zustand, verdrahtet Ports, startet die Schleife
  app/                Abläufe, die alles zusammenführen: start, frame, travel, resetWorld, restore
  legacy.js           der noch nicht zerlegte Rest (schrumpft je PR, am Ende gelöscht)
  core/               reine Logik, kein DOM, kein Canvas, kein Storage, kein Math.random ohne Parameter
    rng.js            rng (mulberry32), hash2, ri/shuffle mit übergebener Zufallsquelle
    world/            Konstanten (GX, GY, CELL …), Zelltypen, Erzeugung, Zellautomat, Packen (RLE)
    learn/            Leitner, Faktenreihenfolge (STAGES), mkQ, Schulstand-Filter
    puzzles/          mkMuster … mkSudoku, Prüflogik der Antworten
    rules/            Freischaltungen (GEAR, Schichten), Kosten, Belohnungen
  state/              der eine Spielzustand und benannte Mutationen
    world.js          Welt-Felder (grid, life, stamp, Zonenränder, BIO …) als ein Objekt
    game.js           hero, P, gold/gems, energy, realm, SEED, UI-Modus
    facade.js         G: Übergangsfassade (Abschnitt 4)
  persistence/        IndexedDB lavaland, localStorage-Schlüssel, snapshot/restore, Umzug, Rettung, Altstände
  log/                Spielprotokoll lavaland-log (eigene Datenbank, eigener Fehlerweg)
  systems/            Tick-Systeme mit einheitlicher Schnittstelle (Abschnitt 5)
  render/             draw, Paletten, Hintergrund, Flora, Figuren
  audio/              WebAudio, Sprachclips, Browser-TTS, Vorlesen
  ui/                 Fenster, HUD, Eingabe, Elternansicht, Rätselrahmen, Vollbild, SW-Registrierung
  testing/            Testzugang (nur im Testbuild, Abschnitt 8)
```

Änderungen gegenüber dem Vorschlag im Auftrag, mit Begründung:

- **`log/` getrennt von `persistence/`.** Das Protokoll hat eine eigene Datenbank, damit ein Fehler dort nie den Spielstand trifft (`index.html:8533`). Diese Trennung soll als Modulgrenze sichtbar bleiben. `log/` darf `persistence/` nicht importieren und umgekehrt.
- **`core/` bekommt `Math.random` nur als Parameter.** Rätsel- und Aufgabengeneratoren rufen heute `ri()` → `Math.random` (`current.md` Abschnitt 7). Im Spiel bleibt `Math.random` die Quelle (Verhalten gleich), im Test lässt sich ein fester Strom einsetzen. Ohne das sind sie nicht charakterisierbar.
- **Ausnahme Zellautomat (ADR 0001 Punkt 17, 8.11.2026):** `state/sim.js` enthält Logik (`step`, `react`, `steam`, `put`, `ext`, `scanMobile`) zusammen mit dem Fensterzustand, den nur sie schreibt. Grund ist die Leistung von `step`; über ein Weltobjekt aus `core/` verdoppelte sich die Rechenzeit.
- **`state/world.js` ist ein eigenes Modul.** Die Welt-Felder (78,6 MB, `current.md` Abschnitt 6) sind der Grund für die Abstürze auf Android. Wenn nur noch ein Modul sie besitzt, wird ein späterer Umbau auf Abschnitte (Chunks) lokal statt über 13 Sektionen verteilt. Das ist **nicht** Teil der Migration, aber die Struktur soll ihn nicht verbauen.
- **`testing/`** als eigene Schicht, damit der Testzugang nie im Produktionsbundle landet.
- **`app/`** für die Abläufe, die heute DOM, Speichern und Welt in einer Funktion verbinden: `start` (`index.html:9134`), `frame` (`9099`), `travel` (`3096`), `resetWorld` (`8506`), `restore` (`3065`). Sie in eine Fachschicht zu stecken, würde dort die Regeln brechen. `app/` ist Verdrahtung, nicht Logik: Was darin rechnet, wandert nach `core/`.

## 3. Abhängigkeitsregeln

| Schicht | darf importieren |
|---|---|
| `core` | nur `core` |
| `state` | `core` |
| `persistence` | `core`, `state` |
| `log` | `core` |
| `audio` | `core` |
| `systems` | `core`, `state`, `audio` |
| `render` | `core`, `state` |
| `ui` | `core`, `state`, `audio`, `render` |
| `app` | alles außer `testing` und `legacy.js` |
| `testing` | alles |
| `main.js` | alles |
| `legacy.js` | alles (Übergang) |

Importe innerhalb derselben Schicht sind erlaubt. Dazu: keine Zyklen zwischen Dateien, auch nicht innerhalb einer Schicht. Nichts außer `main.js`, `legacy.js` und `testing/` importiert `legacy.js` (es exportiert nichts).

`ui`, `render` und `systems` rufen Speichern und Protokoll **nicht** direkt auf. Heute ruft z. B. `buy()` (`index.html:3236`) `saveHero()` direkt. Ziel: `main.js` übergibt beim Initialisieren Ports (`{ saveHero, saveGame, log }`), die Module rufen den Port. Das Verhalten bleibt gleich (gleicher Zeitpunkt, gleiche Reihenfolge), nur die Importkante fällt weg. Ein Umbau auf „dirty-Flag und später speichern“ wäre eine Verhaltensänderung und ist ausgeschlossen.

**Durchsetzung: eigenes Skript `tools/arch/deps.mjs`, kein dependency-cruiser.** Es liest das esbuild-Metafile (`metafile: true` liefert je Eingabedatei die Importe), prüft die Tabelle oben und sucht Zyklen (Tarjan, wie in `analyze.mjs`). Begründung: keine weitere Abhängigkeit mit eigenem Baum (dependency-cruiser zieht ~60 Pakete), die Regeln sind eine Tabelle mit elf Zeilen, und das Metafile ist genau die Sicht, die der Bundler auch hat. Zusätzlich prüft es per Regex, dass in `core/` weder `document`, `window`, `localStorage`, `indexedDB`, `ctx.` noch `Math.random` vorkommen.

Die Regeln gelten ab dem ersten neuen Modul für neue Module. `legacy.js` ist ausgenommen, bis es gelöscht ist.

## 4. Vom globalen Scope zum expliziten Zustand

Problem: 1 198 Namen in einem Scope, 182 davon werden außerhalb ihrer Sektion geschrieben (`current.md` Abschnitt 4), 59 von 64 Sektionen liegen in einem Zyklus. Ein Modul, das herausgelöst wird, braucht fast immer Namen, die noch in `legacy.js` stehen, und `legacy.js` braucht seine Exporte.

Vorgehen in drei Stufen, damit kein PR alles anfasst:

1. **Konstanten und Typed Arrays ziehen zuerst um** (`GX`, `GY`, `CELL`, `TOP`, Zelltypen, `grid`, `stamp`, `zS1…`). Sie sind `const`, Mutation über Index bleibt erlaubt, Importe sind echte Bindungen ohne Umweg. `legacy.js` importiert sie, sein Code ändert sich nicht.
2. **Neu zugewiesene Namen** (`let`, z. B. `gold`, `realm`, `SEED`, `BIO`, `paused`) bekommen ein Zuhause in `state/` mit Lese- und Setzfunktion. Damit `legacy.js` nicht an hundert Stellen umgeschrieben werden muss, gibt es übergangsweise die Fassade `G` (`state/facade.js`): ein Objekt mit Getter/Setter je Name.
   - Wandert ein Name nach `state/`, bleibt er in `legacy.js` als **lokales Alias** nur dort bestehen, wo er gelesen wird, wenn das ohne Verhaltensänderung geht. Sonst wird `x` in `legacy.js` mechanisch zu `G.x` umgeschrieben (Codemod über den AST, `tools/arch/codemod.mjs`, im PR ausgeführt und im Diff nachprüfbar).
   - Heiße Schleifen (Zellautomat `step`, `draw`) greifen nicht über Getter zu, sondern auf die Felder direkt oder über lokale Kopien am Funktionsanfang. Grund: Getter pro Zelle kosten auf dem Handy messbar.
3. **Einengen:** Je System wird aus `G.x` ein Parameter oder ein Aufruf einer benannten Mutation (`addGold(n)` statt `gold+=n; lootDirty=true`). Das passiert erst, wenn das System selbst umzieht, nicht vorher. `G` ist leer und gelöscht, wenn `legacy.js` gelöscht ist.

Hinweis (PR 1): Der Name `G` ist im Spiel schon vergeben (Schwerkraft, `index.html:924`). Der Arbeitstitel `G` in diesen Dokumenten meint die Fassade; im Code bekommt sie in PR 7 einen freien Namen.

Regel: Die Fassade ist eine Brücke, kein Ziel. Neue Module bekommen ihren Zustand als Parameter oder importieren ihn aus `state/`; `G` dürfen nur `legacy.js`, `testing/` und noch nicht eingeengte Systeme benutzen. `deps.mjs` zählt die Importe von `facade.js` und gibt die Zahl aus, damit sie sichtbar sinkt.

## 5. Systeme

Heute gibt es schon eine Liste: `SIDE` (`index.html:9127`), 18 Tick-Funktionen, jede über `safe()` mit Fehlerschutz (3 Fehler, dann aus, Eintrag in `lavaland-err`). Das wird die Schnittstelle:

```js
/** @typedef {{ name: string, init?: (s: GameState) => void, tick?: (dt: number) => void, draw?: (ctx: CanvasRenderingContext2D, layer: Layer) => void }} System */
```

- `name` ersetzt `f.name` in `safe()`. Heute steht im Fehlerprotokoll der Funktionsname (`index.html:9131`); damit die Einträge gleich bleiben, ist `name` genau dieser Funktionsname (`'monTick'`, nicht `'Monster'`).
- `draw` bekommt eine Ebene, weil `draw()` (`index.html:8278`) Systeme an festen Stellen zwischen Hintergrund, Welt, Figur und Vordergrund zeichnet. Die Reihenfolge der Ebenen ist Verhalten und bleibt.
- `systems/index.js` exportiert die Liste in **derselben Reihenfolge** wie `SIDE`. Die Reihenfolge ist Verhalten (z. B. `autosave` nach `questTick`).
- `autosave` und `drain` stehen heute in `SIDE`, sind aber Kern (Speichern, Akku leeren). Sie bleiben in der Migration in der Liste und im Fehlerschutz, weil alles andere eine Verhaltensänderung wäre. Notiert in `findings.md`.

## 6. Build und Auslieferung

`tools/build.mjs`:

- esbuild `bundle: true`, `format: 'iife'`, `target: 'es2020'`, `minify: false`, `charset: 'utf8'`, `legalComments: 'none'`, `metafile: true`.
- **Kein `keepNames`** (geändert in PR 1, vorher geplant). Gemessen: esbuild benennt im Bundle nur lokale Namen um, die einen äußeren verdecken (`last` → `last2`, 38 Namen). Die Top-Level-Namen der IIFE, darunter alle Funktionen in `SIDE`, deren `f.name` ins Fehlerprotokoll geht, bleiben gleich; `tools/arch/samecode.mjs` prüft genau das. `keepNames` hätte jede Funktion in `__name(…)` gewickelt und den AST-Vergleich mit dem alten Stand unmöglich gemacht. Ab PR 16 trägt jedes System seinen Namen ohnehin als Feld.
- Kein Minify: 572 KB liegen unter dem Budget von 800 KB, und lesbarer Code im Bundle hält Fehlerzeilen in `lavaland-err` und Diffs nachvollziehbar.
- Das Bundle darf `</script` nicht enthalten (Build bricht ab). Jede esbuild-Warnung bricht ab, außer direktem `eval` im Testbuild.
- Der Build schreibt immer beide Dateien: `index.html` und den Testbuild `dist/index.test.html`. Sie unterscheiden sich nur an der Marke `/*@test-hook*/` in `src/legacy.js`, die im Testbuild zum Testzugang wird (Abschnitt 8). Im Produktionsbuild bleibt nur der Kommentar, und esbuild lässt Kommentare weg. Geändert in PR 1: Ein `__TEST__`-Zweig per `define` bliebe ohne Minify als `if (false)` im Bundle stehen, samt `eval`.
- Größe: Die Einrückung von esbuild macht das Bundle 703 KB statt 572 KB, gzip aber 183 statt 190 KB. Das Budget von 800 KB bleibt.

### Entscheidung: gebaute `index.html` wird committet (Variante a)

| | (a) Bundle im Repo | (b) Pages per Action aus `dist/` |
|---|---|---|
| Pages, PWA-Adresse, `sw.js` | unverändert | Workflow-Umbau, Pages-Quelle auf „GitHub Actions“ |
| `file://` und Artefakt | `index.html` aus dem Repo laden wie heute | Release-Download nötig |
| `upgrade.mjs` | unverändert: `git show main:index.html` ist genau das, was live ist | muss `main` bauen oder die Live-Seite laden |
| Diff-Rauschen | jede Änderung doppelt (Quelle + Bundle) | nur Quelle |
| Merge-Konflikte | in `index.html` bei parallelen PRs | keine im Bundle |
| Risiko „Quelle ≠ Bundle“ | CI-Prüfung nötig | ausgeschlossen |

Entscheidung: **(a) während der Migration.** Begründung: Jeder Merge geht sofort live. Während Code bewegt wird, soll sich nicht gleichzeitig der Weg ändern, auf dem er ausgeliefert wird; ein Fehler im Deploy-Workflow wäre ein zweiter, unabhängiger Ausfallgrund. `upgrade.mjs` vergleicht weiter wörtlich mit dem, was das Kind gerade spielt. Der Weg zum Artefakt und zu `file://` bleibt „Datei aus dem Repo nehmen“.

Gegenmaßnahmen für die Nachteile:

- `.gitattributes`: `index.html linguist-generated=true`, damit GitHub das Bundle im PR-Diff zuklappt.
- CI-Schritt „Bundle aktuell“: `node tools/build.mjs && git diff --exit-code index.html`. Wer `src/` ändert und nicht baut, bekommt Rot.
- Konflikt in `index.html` beim Rebase: nie von Hand lösen, sondern `node tools/build.mjs` und das Ergebnis committen.

Nach der Migration neu bewerten (eigenes ADR). Dann sind die Moves vorbei und der Nutzen von (b), saubere Diffs, überwiegt eher.

### Was die Tests danach lesen

| Test | heute | danach |
|---|---|---|
| `static.mjs` Syntax, Größenbudget, keine fremden Skripte, doppelte IDs, Offline-Dateiliste | `index.html` roh | **Bundle** `index.html` (gleiche Prüfung, Budget gilt fürs Bundle) |
| `static.mjs` `$('id')`-Abgleich, `localStorage`-Präfix | Regex auf `index.html` | Regex auf **Quellen** `src/**/*.js` gegen `src/index.html`. Grund: esbuild schreibt Strings mit `"`, die Regex mit `'` trifft im Bundle nichts mehr |
| `static.mjs` neu | – | „Bundle aktuell“ (siehe oben), `deps.mjs`, `tsc` |
| `tools/voice/collect.mjs` Literale | `index.html` | `src/**/*.js` (gleiche Regex) |
| Browser-Tests | `index.html` über `serve()` mit Text-Anker | Testbuild `dist/index.test.html` ohne Anker (Abschnitt 8) |
| `upgrade.mjs` | alt `git show main:index.html`, neu `index.html` | alt unverändert, neu `dist/index.test.html`. Der Altstand braucht weiter den Anker, `server.mjs` behält ihn nur für `/old/` |

## 7. Lokale Entwicklung

- `npm ci` einmal, danach `npm run dev`: baut `index.html` und `dist/index.test.html` bei jeder Änderung in `src/` neu. Ausliefern mit einem beliebigen lokalen Server aus dem Repo-Wurzelverzeichnis (z. B. `npx http-server`, nicht im Repo).
- ES-Module laden unter `file://` nicht. Das betrifft nur die Quellen; das Bundle ist ein klassisches Skript und läuft weiter per Doppelklick.
- `npm test` führt `static`, `tsc`, `deps` und die Browser-Tests in der Reihenfolge der CI aus.
- `package.json` mit `devDependencies` und **festen Versionen**, `package-lock.json` im Repo. Laufzeitabhängigkeiten: keine.

## 8. Testzugang

Heute: Text-Anker plus `eval` im IIFE-Scope (`current.md` Abschnitt 8). Das bricht, sobald (1) esbuild den Code neu druckt und (2) Namen in Module wandern.

Ziel:

1. In `src/legacy.js` steht an der Stelle des alten Ankers die Marke `/*@test-hook*/`. Der Testbuild ersetzt sie durch `window.__ev=function(s){return eval(s);};`. Direktes `eval` in `legacy.js` sieht weiter alles, was in `legacy.js` steht oder importiert ist. esbuild warnt bei direktem `eval` und benennt dann im betroffenen Scope nichts um; das ist hier erwünscht.
2. Wandert ein Name, den ein Test benutzt (132 Stück, `current.md` Abschnitt 8), aus `legacy.js` heraus, kommt er im selben PR in `G` und der Test wird von `gold=500` auf `G.gold=500` umgestellt. Die Liste in `current.md` ist die Checkliste dafür.
3. Am Ende gibt es kein `eval` mehr: `testing/` exportiert eine benannte Test-API (`window.__lv = { G, saveGame, travel, … }`), die Tests rufen nur diese.

Produktion bleibt ohne Testzugang. Die CSP erlaubt kein `eval`; Tests laufen weiter mit `bypassCSP: true`.

## 9. Was diese Architektur bewusst nicht löst

- **Speicherverbrauch.** 78,6 MB Welt-Felder bleiben. Modularisierung macht den Umbau möglich, nicht überflüssig.
- **Vereinfachung.** Die Streich-Schritte aus `plan-vereinfachung.md` (Markt, Missionen, Winter-Nebensysteme, Echo, Sudoku, Glück) sind Verhaltensänderungen und deshalb nicht Teil der Migration. Rund 1 000 Zeilen der heutigen Sektionen stehen dort zur Streichung (`S16` teilweise, `S18`, `S19`–`S27`, `S52`, `S54`). Sie umzuziehen und danach zu löschen ist doppelte Arbeit. Vorschlag zur Reihenfolge in `migration-plan.md` Abschnitt 3.
- **Typen in `legacy.js`.** `tsc` prüft nur neue Module. `legacy.js` trägt `// @ts-nocheck`.
