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

**Entschieden 5.11.2026 (Maintainer): Streichen vor PR 16.** PR 1–15 sind davon unabhängig. **Vor PR 16** laufen die Streich-PRs aus dem Vereinfachungsplan als eigene, ausdrücklich verhaltensändernde PRs (nicht Teil der Migration, eigene Freigabe). Danach geht die Migration mit weniger Code weiter. Golden-Master: Erzeugen die gestrichenen Systeme Dinge in der Welt, wird vorher geprüft, ob sie einen eigenen Zufallsstrom haben; teilen sie ihn mit anderem, verschiebt das Streichen alles danach, und das ist dann eine Entscheidung, keine Nebenwirkung.


## 4. PR-Liste

### PR 1: Gerüst ohne Verhaltensänderung

- **Ziel:** esbuild-Build, Quellen in `src/`, Tests auf das Bundle.
- **Bewegt:** `index.html` Zeilen 4–614 → `src/styles.css`; Zeilen 1–3 und 615–785 sowie 9215–9217 mit den Marken `<!-- @css -->` und `<!-- @js -->` → `src/index.html`; Skript 786–9214 **unverändert** → `src/legacy.js`, davor `// @ts-nocheck`; `src/main.js` mit `import './legacy.js'`. Einzige Ergänzung im Code: die Kommentarmarke `/*@test-hook*/` direkt vor dem alten Testanker (`index.html:9210`).
- **Neu:** `package.json` (acorn 8.19.0, esbuild 0.28.2, playwright 1.56.1, typescript 6.0.3), `package-lock.json`, `tools/build.mjs`, `tsconfig.json`, `.gitattributes`, `dist/` in `.gitignore`, `tests/prod.mjs` (Produktionsbundle mit echter CSP), `tools/arch/samecode.mjs`. CI: `npm ci`, „Bundle aktuell“, Build, `tsc`, `prod.mjs`.
- **Tests umstellen:** `server.mjs` liefert `dist/index.test.html` als `/index.html` aus; der Text-Anker bleibt nur für `/old/` (Altstand in `upgrade.mjs`). `static.mjs`: Syntax, Größe, fremde Skripte an `index.html`; `$('id')`, doppelte IDs und `localStorage` an `src/`. `collect.mjs` liest `src/**/*.js`.
- **Nachweis gleich:** `tools/arch/samecode.mjs` vergleicht das Skript von `main` mit dem im Bundle als AST. Außerhalb des Skripts byte-gleich. Erlaubte Umschreibungen stehen einzeln begründet im Skript: Kurzschreibweise `{m}`, `void 0`, einzelner Befehl in `{ }`, Verbinden von String-Literalen, verdeckende lokale Namen mit Ziffer. Top-Level- und Eigenschaftsnamen müssen gleich sein. Für den Testbuild zusätzlich: genau eine Zusatzanweisung, der Testzugang.
- **`tsc`:** prüft `src/**/*.js` außer `legacy.js`, vorerst nur `main.js`.
- **Risiken:** esbuild schreibt mehr um als gelistet; Testbuild und Produktion weichen ab. **Absicherung:** AST-Vergleich für beide Builds, `prod.mjs` mit echter CSP, Upgrade-Test, Vorlesesätze identisch mit `tools/voice/texts.json`. `sw.js` bleibt unverändert (Dateiliste gleich, `CACHE` bleibt `lavaland-v4`).

### PR 2: Charakterisierungstests

- **Ziel:** eingefrorene Referenzen gegen den unveränderten Code.
- **Neu:** `tests/golden.mjs` und `tests/fixtures/` (`golden-input.json` Eingabe, `golden.json` 4 516 erwartete Hashes). Alle Teile mit fester Uhr (`page.clock`, keine Bilder laufen), festem `Math.random`, Zeitzone Europe/Berlin.
  - **Welt:** 3 Seeds × 8 Welten (Erde und alle 7 aus `RLM`): `SEED`, `setRealm`, `shapeWorld()`+`gen()` bzw. `newRealm()`, Hash vor jedem `step()` und noch einmal nach `grow()` bis ans Weltende. Gehasht wird nicht eine Auswahl, sondern jeder Top-Level-Name, den eine von der Generierung erreichbare Funktion schreibt (84 Namen, `analyze.mjs --json` Feld `gen.writes`), dazu `SEED` und `realm`. Die Liste steht fest im Test, damit ein Umzug sie nicht still verkleinert.
  - **Speicherformat:** Eingabe ist eine Sicherung („Spielstand sichern“, `bakMake()`) aus einer kurzen Spielrunde mit `main` (Erde und Mond, Fakten, Funde, Held, Marken, Nebel, Schulstand). Der Test legt sie mit eigenem Code (nicht dem des Spiels) in IndexedDB und localStorage, startet das Spiel, lässt alle `save…()` einmal schreiben und hasht `snapshot()` und jede Komponente von `bakMake()` (jeder `lavaland*`-Schlüssel, jeder Datenbankeintrag). Fälle: Erde, Mond (`lavaland-realm`), Spielstand v4 (rohes Gitter, mit und ohne `w`), leerer Speicher (neue Welt), Import der Sicherung über `bakLoad()`.
  - **Generatoren:** je Rätseltyp und Stufe 0–9 zwanzig `T.make(lv)` mit `Math.random = rng(99+lv)`, dann `mkQ` für jeden Fakt aus `STAGES` in Blöcken zu 25.
- **Abweichung vom ersten Entwurf:** Hashes je Komponente statt byte-gleicher Kopie des Ergebnisses (zeigt bei Rot, welcher Teil abweicht, und hält das Fixture klein); zusätzlich v4, leerer Speicher und Import. `analyze.mjs --json` liefert dafür `gen` (Wurzeln, erreichbare Funktionen, geschriebene Namen).
- **Gegenprobe vor dem Einchecken:** zweimal hintereinander gleich; vier absichtlich falsche Änderungen (v4-Laden um eine Zelle verschoben, Feldreihenfolge in `snapshot`, ein zusätzlicher Zufallsaufruf in `mkMuster`, eine Konstante in `genCol`) werden alle rot. `--write`/`--input` verweigern, wenn die Datei schon da ist.
- **Neu:** `tests/perf.mjs`: frische Welt mit festem Zufall, Wasser und Lava über dem Helden, Bildschleife angehalten; 3 Läufe × 600 Bilder in Blöcken zu 10 (`performance.now()` ist auf 0,1 ms vergröbert). Median und 90. Perzentil je Aufruf von `step`, `update` (mit `SIDE`), `draw`. Kein Schwellwert in der CI, Zahlen gehören in den PR-Text.
- **Risiken:** Zustand, der beim Laden zufällig ist (Teilchen, Feuerdauer). **Absicherung:** Welt nur direkt nach der Erzeugung hashen, nie nach `step`; im Speicher-Teil läuft kein Bild. Unterschiedliche Chromium-Versionen (lokal, CI) könnten Gleitkomma anders runden; bisher nicht beobachtet, sonst wird das hier vermerkt.

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
- Echo und Sudoku ziehen hier noch mit um, weil die Streich-PRs erst vor PR 16 laufen.

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

- Die Fassade heißt nicht `G`: `G` ist im Spiel schon die Schwerkraft (`index.html:924`). Name wird in PR 7 festgelegt (Vorschlag `ST`, vorher auf Kollision prüfen).
- **PR 7 und 14** fassen die meisten Stellen an (Codemod). Wenn der Codemod nicht sauber trennt, werden sie geteilt, nicht vergrößert.
- **PR 23** (`draw`) hat keinen Golden-Master außer dem Bildvergleich. Fehler sind dort sichtbar, aber nur in den drei Szenen.
- Schätzung: 31 PRs ohne Streichen. Weil vor PR 16 gestrichen wird, fallen PR 20 großteils und Teile von 24 und 26 weg. PR 5 läuft vorher und zieht Echo und Sudoku noch mit um.
