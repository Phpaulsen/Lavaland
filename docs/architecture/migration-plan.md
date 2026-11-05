# Migrationsplan

Geordnete PR-Liste für Phase 2. Grundlage: `target.md`, `adr/0001-modularisierung.md`, Zahlen aus `current.md`. Sektionsnummern `Sxx` wie in `current.md` Abschnitt 2.

## 1. Regeln für jeden PR

- Ein eigener Branch, ein Ziel. Höchstens eine Sektion oder ein Subsystem, unter ~800 geänderten Zeilen ohne reine Moves.
- Verhaltensneutral. Keine Features, keine Stil-Refactorings außerhalb des bewegten Codes. Gefundene Fehler kommen in `findings.md`, nicht in den PR.
- CI grün: alles Bestehende plus Golden-Master (ab PR 2), `upgrade.mjs`, „Bundle aktuell“, `deps.mjs` und `tsc` (ab PR 3).
- **Move-Nachweis:** `tools/arch/movecheck.mjs` (kommt mit PR 3) vergleicht den AST jeder bewegten Funktion vor und nach dem PR. Erlaubt sind nur die im PR-Text genannten mechanischen Umschreibungen (`x` → `G.x`, `Math.random` → Parameter). Alles andere ist ein Fehler.
- **Golden-Master ändert sich: Der Move ist falsch.** Fixtures werden nie aktualisiert.
- Weicht die Wirklichkeit vom Plan ab (z. B. ein Zyklus, der hier nicht steht), wird zuerst dieser Plan angepasst und im PR-Text begründet. Betrifft es eine Entscheidung im ADR: anhalten und fragen.
- Berührt ein PR `step`, `draw`, `update` oder `frame`: Leistungsvergleich mit `tests/perf.mjs` (PR 2) im PR-Text, alt gegen neu, gleicher Rechner.
- Nennt der PR Namen aus der Testliste (`current.md` Abschnitt 8), stellt er die betroffenen Tests im selben PR um.
- Merge macht der Maintainer.

## 2. Voraussetzung vor PR 1

- **PR #92** (Speicher, `life` als `Map`) ist offen und ändert `index.html`. Er wird vor PR 1 gemergt oder geschlossen. Sonst muss er danach von Hand auf `src/legacy.js` übertragen werden.
- Ab PR 1 keine Änderungen mehr direkt an `index.html`. Bugfixes während der Migration gehen gegen `src/`.

## 3. Weiche: Streichen vor den Systemen

`plan-vereinfachung.md` (Stand 20.10.) sieht vor, Markt, Missionen, Winter-Nebensysteme, Kristall-Echo, Bilder-Sudoku und das Glücks-Upgrade zu streichen. Das betrifft rund 1 000 Zeilen (`S16` teilweise, `S18`, `S19`–`S27`, `S52`, `S54`), umgesetzt ist davon nichts. Diese Teile umzuziehen und danach zu löschen ist doppelte Arbeit und doppelte Prüfung.

Vorschlag: PR 1–15 sind davon unabhängig. **Vor PR 16** laufen die Streich-PRs aus dem Vereinfachungsplan als eigene, ausdrücklich verhaltensändernde PRs (nicht Teil der Migration, eigene Freigabe). Danach geht die Migration mit weniger Code weiter. Golden-Master: Erzeugen die gestrichenen Systeme Dinge in der Welt, wird vorher geprüft, ob sie einen eigenen Zufallsstrom haben; teilen sie ihn mit anderem, verschiebt das Streichen alles danach, und das ist dann eine Entscheidung, keine Nebenwirkung.

Ohne diese Weiche gilt die Liste unverändert, nur länger.

## 4. PR-Liste

### PR 1: Gerüst ohne Verhaltensänderung

- **Ziel:** esbuild-Build, Quellen in `src/`, Tests auf das Bundle.
- **Bewegt:** `index.html` Zeilen 3–615 → `src/styles.css`; Zeilen 1–2 und 616–784 plus `<!-- @css -->`/`<!-- @js -->` → `src/index.html`; Skript 786–9214 **unverändert** → `src/legacy.js`; `src/main.js` mit `import './legacy.js'`. Einzige Codeänderung: Direkt vor dem heutigen Testanker (`index.html:9210`) steht `if (__TEST__) window.__ev = function (s) { return eval(s); };` (`target.md` Abschnitt 8). Im Produktionsbuild entfernt esbuild die Zeile.
- **Neu:** `package.json` (esbuild, playwright, acorn fest gepinnt), `package-lock.json`, `tools/build.mjs`, `.gitattributes`, `dist/` in `.gitignore`. CI: `npm ci`, Build, „Bundle aktuell“.
- **Tests umstellen:** `server.mjs` liefert `dist/index.test.html` als `/index.html` aus; der Text-Anker bleibt nur für `/old/` (Altstand in `upgrade.mjs`). `static.mjs`: Bundle-Prüfungen auf `index.html`, Quellprüfungen (`$('id')`, `localStorage`) auf `src/`. `collect.mjs` liest `src/**/*.js`.
- **Nachweis gleich:** `tools/arch/samecode.mjs` parst das Skript von `main` und das Skript im neuen Bundle mit acorn, entfernt Positionen, Kommentare und `raw`, packt die esbuild-Hülle aus und vergleicht die ASTs. Erwartete Unterschiede (nur der `__TEST__`-Zweig, im Produktionsbuild entfernt) stehen als Liste im Skript; jede weitere Abweichung lässt es scheitern. Ergebnis im PR-Text. Zusätzlich: alle Tests grün, `upgrade.mjs` grün (alter Stand von `main` läuft im Bundle weiter), ein Rauchtest gegen das **Produktions**bundle (ohne `__TEST__`): Seite startet ohne Seitenfehler.
- **`tsc`:** `tsconfig.json` mit `checkJs`, `include: src/**/*.js`, `exclude: src/legacy.js`. Läuft, prüft vorerst nichts.
- **Risiken:** esbuild schreibt etwas anders als erwartet (`'use strict'` in IIFE, Zahlenliterale, `</script` in Strings); CSP unverändert, aber Inline-Skript ist jetzt Bundle-Ausgabe; Größe steigt durch `keepNames`-Helfer. **Absicherung:** AST-Vergleich, Größenbudget, `</script`-Prüfung im Build, Upgrade-Test. `sw.js` bleibt unverändert (Dateiliste gleich, `CACHE` bleibt `lavaland-v4`).

### PR 2: Charakterisierungstests

- **Ziel:** eingefrorene Referenzen gegen den unveränderten Code.
- **Neu:** `tests/golden.mjs` und `tests/fixtures/`:
  - **Welt:** Für feste Seeds (3 Stück) und jede Welt (Erde, Mond, Eisplanet, Blubberplanet, kleine Planeten aus `RLM`): `SEED` setzen, `setRealm`, `shapeWorld()`, `gen()` bzw. `newRealm()`, **vor** dem ersten `step()` SHA-256 über `grid`, `stamp`, Zonenränder (`zS1`…`zS3`, `z4`, `mtop`, `grow0` …) und die erzeugten Listen (`BIO`, `STR`, `LOOT`, `PADS`, `DROPS`, Funde, Rätselmaschinen-Orte) als JSON. Fixture: Hashwerte je Seed und Welt.
  - **Speicherformat:** Eingecheckter Spielstand (IndexedDB-Einträge `world2` und `planet-moon` plus alle `lavaland*`-Schlüssel, erzeugt einmal mit dem Code von `main`). Test: laden, `snapshot()` und alle `save…()` ausführen, Ergebnis byte-gleich mit dem Fixture vergleichen. Zusätzlich Export über „Spielstand sichern“ und Import zurück.
  - **Generatoren:** `Math.random` durch mulberry32 mit festem Seed ersetzt, dann je Rätsel und Stufe 20× `make(lv)` und je Lernstufe `mkQ` für jeden Fakt; Hash über das JSON.
- **Neu:** `tests/perf.mjs`: misst `step()` und `draw()` über 600 Frames in fester Szene, gibt Median und 90. Perzentil aus. Kein Schwellwert in der CI (Runner zu unruhig), Zahlen gehören in den PR-Text.
- **Risiken:** Hash über Zustand, der beim Laden zufällig ist (Teilchen, Feuerdauer `life` nutzt `Math.random`, `index.html:1692`). **Absicherung:** `life` nur nach Erzeugung hashen, nie nach `step`; Test zweimal hintereinander laufen lassen, beide Male gleich, bevor das Fixture eingecheckt wird.

### PR 3: Werkzeuge und das erste Modul

- **Ziel:** Abhängigkeitsprüfung scharf für neue Module; erstes Blatt.
- **Bewegt:** `rng`, `hash2` (`S06`, `S03`) → `src/core/rng.js`. `ri`, `shuffle` (`S58`) → `core/rng.js` mit Zufallsquelle als Parameter; in `legacy.js` bleiben `ri`/`shuffle` als Einzeiler, die `Math.random` übergeben.
- **Neu:** `tools/arch/deps.mjs`, `tools/arch/movecheck.mjs`, `tools/arch/codemod.mjs` (Umschreiben `x` → `G.x` über den AST). CI-Schritte für `deps` und `tsc`.
- **Risiken:** gering. `rng` hat keine Abhängigkeit (`current.md` Abschnitt 7). **Absicherung:** Golden-Master.

### PR 4: Konstanten der Welt

- **Bewegt:** `S02` Welt (62 Namen, keine ausgehende Kante) und die Konstanten aus `S04` → `core/world/const.js`. Typed Arrays `grid`, `life`, `stamp` noch **nicht**.
- **Risiken:** `S02` hat auch `const`-Objekte, die später verändert werden. **Absicherung:** `analyze.mjs --json` zeigt je Name die schreibenden Sektionen; was geschrieben wird, bleibt in `legacy.js` bis PR 7.

### PR 5: Rätselgeneratoren

- **Bewegt:** `mkMuster`, `mkStern`, `mkSpiegel`, `mkRobo`, `mkWaage`, `mkEcho`, `mkRohre`, `mkSudoku` mit ihren Datentabellen → `core/puzzles/*.js`. `dr…`, `ac…`, `hi…`, `sy…` bleiben in `legacy.js`.
- **Risiken:** `PZT` (`index.html:6453`) hält die Funktionen als Werte; die Rätsel lesen Schulstand (`SCH`) und `FS`. **Absicherung:** Generator-Golden-Master, Knopftest (`crawl.mjs`) spielt jede Stufe.
- Abhängig von der Weiche: Echo und Sudoku entfallen, wenn vorher gestrichen.

### PR 6: Lernkern ohne Oberfläche

- **Bewegt:** `STAGES`, Silben- und Wortlisten (`SYL`, `RHYW`, `WORDS`, `CASES`), `mkQ`, die Leitner-Rechnung (`BOXD` `index.html:7518`, `MBOX` `7660`, Fachwechsel `7649`–`7652`) und die reine Auswahl aus `pickFact0`/`pickFact` (`index.html:7594`) → `core/learn/`. `nextQ` bleibt (84 Funktionen in der Hülle, DOM und Speichern).
- **Risiken:** `pickFact` mischt Auswahl und Zustand (`lastF`). **Absicherung:** Generator-Golden-Master über `mkQ`, Rauchtest „Lernaufgabe“.

### PR 7: Welt-Felder in ein Modul

- **Bewegt:** `grid`, `life`, `stamp`, `zS1…zS3`, `z4`, `mtop`, `grow0`, `rA…rC`, `bio`, `bio2`, `bmx`, `bix`, `noCave`, `liqM`, `liqY` → `state/world.js`. Neu zugewiesene Listen (`BIO`, `STR`, `LOOT`, `PADS`, `DROPS`, `genF`, `seen`, `eggGot` …) → `state/world.js` mit Settern; `G` entsteht hier (`state/facade.js`).
- **Risiken:** höchstes Risiko bis hier. 13 Sektionen schreiben in `grid` (`current.md` Abschnitt 4), Leistung im Zellautomat. **Absicherung:** Codemod statt Handarbeit, Move-Nachweis, Golden-Master Welt und Speicherformat, `perf.mjs` alt gegen neu.

### PR 8: Weltgenerierung

- **Bewegt:** `shapeWorld`, `gen`, `genCol`, `build` und ihre Hilfen (`current.md` Abschnitt 7: 28 bzw. 27 Funktionen) → `core/world/gen.js`. Sie bekommen das Welt-Objekt als Parameter statt globaler Felder.
- **Risiken:** Reihenfolge der `rng`-Aufrufe je Strom. **Absicherung:** Golden-Master Welt für alle Seeds und Welten; Move-Nachweis mit erlaubter Umschreibung „Feld → Parameter“.

### PR 9: Zellautomat

- **Bewegt:** `step`, `react`, `steam` (`S05`, `index.html:1746`) → `core/world/sim.js`, Zufall als Parameter.
- **Risiken:** Leistung; `step` läuft 30× pro Sekunde über die sichtbare Welt. **Absicherung:** `perf.mjs`, Fuzz-Test, Upgrade-Test.

### PR 10: Packen und Laden der Zellen

- **Bewegt:** `packRuns`, `loadCells`, `runsOk`, `migrateSnow` → `core/world/pack.js`.
- **Absicherung:** Golden-Master Speicherformat, `save.mjs`, Upgrade-Test.

### PR 11: Speichern

- **Bewegt:** `idbOpen`, `idbDo`, `SAVEKEY`, `realmKey`, `snapshot`, `saveGame`, `autosave`, `packStart`/`packStep`, `saveHero`, `saveFinds`, `saveFacts` → `persistence/`. Eine Datei `persistence/keys.js` mit allen `localStorage`-Schlüsseln als Konstanten, Werte wörtlich wie heute (Tabelle im README).
- **Risiken:** `saveGame` ruft Banner, Ton und Sprache (`index.html:3049`). **Absicherung:** Rückmeldung wird als Port übergeben (`target.md` Abschnitt 3), gleiche Reihenfolge; `save.mjs`, `offline.mjs`, Golden-Master Speicherformat.

### PR 12: Umzug, Rettung, Altstände

- **Bewegt:** `S56` Spielstand umziehen (`bakMake`, `bakLoad`, `bakIn`), Rettungslogik aus `start` (`rescue`, `tryLoad`), Laden alter Formate `v2`–`v4` → `persistence/transfer.js`, `persistence/rescue.js`.
- **Absicherung:** `save.mjs` (Rettung, Datenbankstörung, Sichern/Laden), Upgrade-Test, Golden-Master.

### PR 13: Spielprotokoll

- **Bewegt:** `S61` (`LOG`, eine Deklaration, eigene Datenbank) → `log/`.
- **Risiken:** `LOG` liest Spielzustand (`paused`, `energy`, `P`, `tool`, `realm`) für die Zeitzuordnung. **Absicherung:** über `G` gelesen; Rauchtest Elternansicht, `save.mjs` (Protokoll im Export).

### PR 14a/b/c: Spielzustand

- **14a:** `hero`, `gold`, `gems`, `lootDirty`, `heroDirty` → `state/game.js`. Benannte Mutation `addGold(n)` noch nicht (wäre 15 Sektionen Umbau), nur `G`.
- **14b:** `P`, `cam`, `pan`, `parked`, `keys` → `state/game.js`.
- **14c:** `realm`, `SEED`, `setRealm`, UI-Modus (`paused`, `tool`, `task`, `talkLock`, `OVS`, `uiOpen`) und Speicherschalter (`frozen`, `diskLock`, `saving`, `traveling`, `ready`).
- **Risiken:** Viele Testnamen (`gold`, `hero`, `P`, `paused`, `ready` stehen in fast jedem Test). **Absicherung:** Tests im selben PR auf `G` umstellen; Codemod; Move-Nachweis.

### PR 15: Ton und Sprache

- **Bewegt:** `S11` → `audio/`. Sprachclips, TTS, `speak`, `sfx`, `tone`, `jingle`.
- **Absicherung:** `voice.mjs`, Rauchtest (Clip-Abruf `clipGet`, `speakSplit`).

*Hier greift die Weiche aus Abschnitt 3.*

### PR 16: Systemschnittstelle

- **Bewegt:** `SIDE`, `SAFE`, `safe()` → `systems/index.js` mit `{ name, tick }` je Eintrag, gleiche Reihenfolge, `name` = heutiger Funktionsname. Die Tick-Funktionen selbst bleiben noch in `legacy.js` und werden nur registriert.
- **Absicherung:** Rauchtest prüft `SIDE` (steht in der Testliste), Eintrag im Fehlerprotokoll mit gleichem Namen.

### PR 17–21: Systeme einzeln

| PR | System | Sektionen |
|---|---|---|
| 17 | Geysire, Meteore, Wrack, Glühwürmchen, Harfe (aus dem U-Boot-Sammelbecken) | Teile von `S33` |
| 18 | Tiere, Monster, Pfeile | `S31`, Teile von `S33` |
| 19 | U-Boot, Fundsachen, `worldTick` | Rest von `S33`, `S32`, `S34` |
| 20 | Aufträge, Missionen, Winter, Geschichte (sofern nicht gestrichen) | `S17`–`S28` |
| 21 | Tiefe, Wissenstüren, „Jede Sekunde“, Funde, Leuchtmarken-Logik | `S39`–`S41`, `S13`, `S45` |

Je PR: `tick` und `draw(ctx, layer)` ins System, Zeichenaufruf in `draw()` an derselben Stelle durch den Ebenenaufruf ersetzt. **Risiko:** Zeichenreihenfolge. **Absicherung:** Bildvergleich im Rauchtest für drei feste Szenen (Screenshot-Hash bei abgeschalteten Teilchen), neu in PR 17, gegen den Stand vor PR 17 erzeugt.

### PR 22–23: Rendering

- **22:** Paletten, Hintergrund, Stimmung, Flora, Deko (`S35`, `S36`, `S44`) → `render/`.
- **23:** `draw` (`S60`, 11 650 Zeichen) nach Ebenen zerlegt, Winter malen (`S29`), Porträts. `ctx` wird Parameter statt `let`; `portrait` (`index.html:4196`) bekommt seinen Kontext übergeben statt `ctx` umzuhängen.
- **Absicherung:** Bildvergleich, `perf.mjs`.

### PR 24–27: Oberfläche

| PR | Bereich | Sektionen |
|---|---|---|
| 24 | Rätselrahmen und `dr…`/`ac…`/`hi…`/`sy…` je Rätsel | `S46`–`S54` |
| 25 | Akku, Lernaufgabe, `nextQ`, Rechentafel | `S12`, `S58`, Rest `S59`, `S63` |
| 26 | Markt, Werkstatt, Aufzug, Karten | `S16`, `S42`, `S43`, `S37`, `S38`, Zeichnen `S45` |
| 27 | Elternansicht, Vollbild, Tasten, Malen, Tastenbilder | `S62`, `S57`, `S55`, `S10`, `S01` |

**Absicherung:** Knopftest (`crawl.mjs`) mit langem Lauf (`CRAWL_N=4000`) im PR, statische ID-Prüfung über `src/`.

### PR 28: Spielfigur und Abläufe

- **Bewegt:** `S09` Spielfigur, Fahrzeuge, `update` → `systems/player/`. `start`, `frame`, `travel`, `arrive`, `resetWorld`, `restore`, `newRealm` → `app/`. Schneeberg und Länder (`S03`, `S05` Rest) → `core/world/`.
- **Risiken:** `update` (6 055 Zeichen) und `frame` sind der heißeste Pfad. **Absicherung:** `perf.mjs`, Fuzz lang (`FUZZ_SEC=600`), Golden-Master.

### PR 29: Schluss

- `legacy.js` ist leer und gelöscht. `G` ist leer und gelöscht. Testzugang ist die benannte API `window.__lv` im Testbuild, kein `eval`.
- `deps.mjs` ohne Ausnahmen; `tsc` über alle Module.
- `README.md` „Entwicklung“ neu: Quellen in `src/`, `npm ci`, `npm run dev`, `node tools/build.mjs`, „nie `index.html` von Hand ändern“.
- `CLAUDE.md`: Verzeichnisse, Schichten und Importtabelle, Invarianten (Spielstand, Welt-Determinismus, Fehlerschutz, CSP, Budget, `CACHE`), Build- und Testbefehle, „Golden-Master nie aktualisieren“.
- ADR 0002: Auslieferung (a) oder (b) neu bewerten.

## 5. Größter Aufwand und Unsicherheit

- **PR 7 und 14** fassen die meisten Stellen an (Codemod). Wenn der Codemod nicht sauber trennt, werden sie geteilt, nicht vergrößert.
- **PR 23** (`draw`) hat keinen Golden-Master außer dem Bildvergleich. Fehler sind dort sichtbar, aber nur in den drei Szenen.
- Schätzung ohne Weiche: 31 PRs. Mit Weiche fallen PR 20 großteils und Teile von 5, 24, 26 weg.
