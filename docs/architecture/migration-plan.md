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
- **Gestapelt (ab PR 11, Wunsch des Maintainers vom 8.11.2026):** Jeder PR zielt auf `main` und enthält den vorigen; gemergt wird in Reihenfolge. `moves.json` ist dann `{ "stack": [ … ] }` mit einem Eintrag je PR; `movecheck.mjs` prüft gegen `main` alle Schritte, die dort noch nicht gemergt sind.

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
- **Bewegt:** `rng`, `hash2` (`S06`, `S03`) → `src/core/rng.js`, Körper unverändert. `ri`, `shuffle` (`S58`) → `core/rng.js` als `riWith(rand,a,b)` und `shuffleWith(rand,a)`; in `legacy.js` bleiben `ri`/`shuffle` als Einzeiler, die `Math.random` übergeben. Gleich viele `Math.random`-Aufrufe in gleicher Reihenfolge.
- **Neu:** `tools/arch/deps.mjs`, `tools/arch/movecheck.mjs` mit `tools/arch/moves.json` (je PR neu: Umbenennungen, Parameter, Fassade, bewusst geänderte Namen), `tools/arch/codemod.mjs` (Umschreiben `x` → `F.x` über den AST, mit Gültigkeitsbereichen). Alle drei mit `--selftest`. CI-Schritte für `deps`, Selbsttests und Move-Nachweis (nur in PRs, gegen die Spitze von main); `tsc` lief schon seit PR 1.
- **Abweichungen:** Die Namen in `core/` heißen `riWith`/`shuffleWith` statt `ri`/`shuffle`. Bei gleichem Namen benennt esbuild einen der beiden um (`ri2`), im Produktionsbuild ausgerechnet den in `legacy.js`; das ändert Namen im Fehlerprotokoll (ADR 0001 Punkt 11). `analyze.mjs` liest `legacy.js` jetzt als Modul und zählt importierte Namen als deklariert; `current.md` bleibt unverändert (wird aus 76ae808 erzeugt). `deps.mjs` erlaubt Importe innerhalb derselben Schicht (die Tabelle in `target.md` nennt sie nicht ausdrücklich), Zyklen bleiben verboten.
- **Move-Nachweis braucht einen aktuellen Branch:** Er vergleicht mit der Spitze von main. Ist main weiter, zeigt er die fremden Änderungen als Abweichung; dann main in den Branch mergen (wie beim Bundle-Konflikt).
- **Risiken:** gering. `rng` hat keine Abhängigkeit (`current.md` Abschnitt 7). **Absicherung:** Golden-Master, Move-Nachweis, `perf.mjs` (eine Aufrufebene mehr in `ri`).

### PR 4: Konstanten der Welt

- **Bewegt:** 53 Namen → `src/core/world/const.js`, Text unverändert (nur `export` und JSDoc-Typen): aus `S02` die Maße (`CELL`, `GX`, `GY`, `TOP`, `G` …), die Materialien (`LAVA` … `SHELL`), `MAX_*`, `SKY*`, `MOON`, `SITE`, `FLAT`, `clamp`, `baseG`, `bump`, `siteY` samt seiner Schleife, `rawH`; aus `S04` `B0`, `EXT_X`, `EXC`, `HOME_END`, `WL`, `WLR`. Typed Arrays `grid`, `LIFE` (seit #92 statt `life`), `stamp` noch **nicht**.
- **Bleibt in `legacy.js`, obwohl in `S02`:** `g0` und damit `ground` (die Weltgenerierung überschreibt `g0`, `S05`), `zS1`…`zS3`, `z4`, `grow0`, `rA`…`rC` (ebenfalls von `S05` beschrieben), `lifeS`. Sie ziehen mit PR 7/8 um. Die Sektionsüberschriften bleiben in `legacy.js`, damit `analyze.mjs` die Sektionen weiter erkennt.
- **Beobachtet:** esbuild gibt Modul-`const` im Bundle als `var` aus. Für korrekten Code ohne Wirkung (niemand schreibt diese Namen, `analyze.mjs` zeigt keine Schreiber); im Test über `eval` bleiben alle Namen erreichbar. Die Konstanten werden jetzt vor dem Fehlerprotokoll-Vorspann ausgewertet statt danach; sie haben keine Seiteneffekte.
- **Risiken:** `S02` hat auch `const`-Objekte, die später verändert werden. **Absicherung:** `analyze.mjs --json` zeigt je Name die schreibenden Sektionen; bewegt wurde nur, was außerhalb der eigenen Initialisierung niemand schreibt oder verändert (`MOON` und `SITE` werden gelesen, nie geschrieben). Move-Nachweis, Golden Master.

### PR 5: Rätselgeneratoren

- **Bewegt:** `mkMuster`, `mkStern`, `mkSpiegel`, `mkRobo`, `mkWaage`, `mkEcho`, `mkRohre`, `mkSudoku` als `mk…With(rand, …, lv)` nach `core/puzzles/<rätsel>.js`, dazu ihre Datentabellen (`SHAPES`, `SPL`, `RBL`, `RBD`, `ECL`, `RHL`, `RMASK`, `SDL`) und reinen Hilfen (`tkKey`, `rbSolve`, `rhRot`, `rhMask`, `rhFlow`, `rhDone`, `sdOk`, `sdCount`, `idxs` in `core/puzzles/util.js`). In `legacy.js` bleibt je Rätsel ein Einzeiler `mkX(lv)`, den `PZT` weiter hält. `dr…`, `ac…`, `hi…`, `sy…` bleiben in `legacy.js`; ebenso `ARW` (zuvor mit `RBD` in einer Deklaration) und `ECF` (mit `ECL`), weil nur Zeichnen und Ton sie lesen.
- **Gelesener Zustand als Parameter:** `mkStern` liest `FS.u.m`, `mkWaage` liest `SCH.on`/`SCH.zr`. Beide bekommen das Objekt als Parameter gleichen Namens; der Einzeiler übergibt `FS` bzw. `SCH` zur Aufrufzeit, wie vorher gelesen.
- **Werkzeug:** `movecheck.mjs` kann jetzt mehrere Parameter (`["rand=Math.random", "FS"]`) und Einzeiler früherer PRs (`wrappers`: `ri` → `riWith(rand, …)`). Die Selbstaufrufe im Rückfall (`mkRobo(lv-1)`, `mkRohre(lv-1)`) werden zu `mkRoboWith(rand, lv-1)`; der Move-Nachweis prüft das mit.
- **Typen:** JSDoc mit einem Zustandstyp je Rätsel (`MusterState` …), Umwandlungen als `/** @type */ (…)`, die den AST nicht ändern. Wo ein Feld je nach Art verschiedene Formen hat (Muster-Bilder, Waage-`items`), steht ausdrücklich `any`.
- **Risiken:** `PZT` hält die Funktionen als Werte; die Rätsel lesen Schulstand (`SCH`) und `FS`. **Absicherung:** Generator-Golden-Master, Knopftest (`crawl.mjs`) spielt jede Stufe, einmaliger Differenztest alt gegen neu (siehe PR).
- Echo und Sudoku ziehen hier noch mit um, weil die Streich-PRs erst vor PR 16 laufen.

### PR 6: Lernkern ohne Oberfläche

- **Bewegt:** 29 Namen → `core/learn/`. `facts.js`: `WORDS`, `SYL`, `CLAP`, `RHY`, `RHYW` samt seiner Füllschleife, `LETTERS`, `CASES`, `STAGES`, `fDom`, `fStage`, `fKind`, `fName`. `leitner.js`: `BOXD`, `NEWDAY`, `FASTMS`, `DAYMISS`, dazu `schoolOkWith(SCH, …)`, `fUnlockWith(FS, …)`, `mixPreferWith(rand, kindHist, …)`, `fParkedWith(FS, …)`. `tasks.js`: `mkQWith(rand, IC, QI, k)`, `mkSeqWith(rand, FS)`, `qpicWith(IC, QI, …)`, `lettersForWith(rand, …)`, `dots`, `zw`, `HOLE`, `solAdd`, `solSub`. In `legacy.js` bleibt je Funktion mit Zustand ein Einzeiler (`mkQ`, `mkSeq`, `schoolOk`, `fUnlock`, `mixPrefer`, `fParked`); `qpic` und `lettersFor` rief nur `mkQ`, sie fallen dort weg.
- **Abweichung vom Plan:** Fachwechsel (`factDone`) und Auswahl (`pickFact0`) bleiben in `legacy.js`. Sie sind keine eigenen Funktionen, sondern Teile von Funktionen, die zugleich `FS`, `retry`, `lastF`, `dayNo()` (Uhr), `masterGive` und `saveFacts` anfassen. Sie herauszulösen ist ein Umbau, kein Move, und `movecheck.mjs` könnte ihn nicht nachweisen. Sie ziehen mit dem Spielzustand (PR 14) um, wenn `FS` und `retry` ein eigenes Modul haben. `dayNo` bleibt, weil es die Uhr liest.
- **`MBOX` bleibt in `legacy.js`:** Der Nachtrag der Meistersteine beim Laden liest `MBOX` vor seiner Deklaration (`findings.md` F1). In `core/` wäre `MBOX` beim Laden schon gesetzt, der Startabbruch verschwände, und alte Stände bekämen nachträglich Meistersteine. Das wäre ein Bugfix im Move. Zieht mit, wenn F1 gesondert behoben ist.
- **Bilder als Parameter:** `mkQ` baut HTML und liest dafür `IC.star` und die Wortbilder aus `IC`/`QI`. Die Tabellen gehören zur Oberfläche und werden über die ganze Datei befüllt; sie kommen deshalb als Parameter, nicht als Import. Die Trennung „Aufgabe als Daten, HTML in `ui/`“ ist ein Umbau für PR 24–27.
- **Typen:** `FactStore`, `School`, `Question`, `Word`, `Domain` als JSDoc-Typen. `let m` in `mkQ` (Treffer je Muster) ist ausdrücklich `any`.
- **Absicherung:** Move-Nachweis (29 bewegt, 6 Einzeiler), Generator-Golden-Master über `mkQ` je Fakt und Speicher-Golden-Master über `factDone`, Rauchtest „Lernaufgabe“, einmaliger Differenztest alt gegen neu (siehe PR).

### PR 7a: Welt-Felder mit fester Größe

- **Geteilt (Abschnitt 5: „werden sie geteilt, nicht vergrößert“):** PR 7 hatte zwei verschiedene Arten von Namen. Feste Typed Arrays sind `const`, ziehen als echte Import-Bindungen um, und `legacy.js` ändert sich dabei nicht. Neu zugewiesene Namen brauchen Setter, Fassade und Codemod. 7a macht nur das Erste.
- **Bewegt:** 22 Namen → `state/world.js`, nur die Deklarationen: `g0`, `grid`, `stamp`, `LIFE` (seit #92 statt `life`), `zS1`, `z4`, `zS2`, `zS3`, `grow0`, `rA`, `rB`, `rD`, `rH`, `rC`, `mtop`, `bio`, `bio2`, `bmx`, `bix`, `noCave`, `liqM`, `liqY`. Die Schleifen, die sie beim Laden füllen, bleiben in `legacy.js` an ihrer Stelle. Sie brauchen `rawH`, `baseG`, `bump` und `msurf`, und die Reihenfolge des Füllens bleibt so dieselbe. `ORBS` stand mit `bio` in einer Deklaration und bleibt als eigene.
- **Bleibt:** `ground`, `lifeS` (Funktionen, ziehen mit PR 8/9), `rx0`, `rx1`, `qx0`, `qx1` (`let`, werden in `step` getauscht, also 7b).
- **Leistung:** esbuild legt Importe als Variablen in denselben Bundle-Scope; `step` liest `grid` ohne Umweg. `perf.mjs` alt gegen neu, je zwei Läufe: Unterschiede im Rauschen (siehe PR).
- **Absicherung:** Move-Nachweis (22 bewegt, 0 geändert), Golden-Master Welt und Speicherformat, `perf.mjs`.

### PR 7b: Neu zugewiesene Welt-Namen und die Fassade

- **Bewegt:** 16 Namen → `state/world.js` als `export let` mit je einem Setter (`setBIO`, `setStI`, `setSeen` …): `BIO`, `STR`, `CRE`, `PICKS`, `PADS`, `DECO`, `EGGS`, `LOOT`, `DROPS`, `stI`, `NT0`, `NC0`, `seen`, `eggGot`, `lootGot`, `orbGot`. Werte wie vorher.
- **Fassade `ST`** (`state/facade.js`): ein Objekt mit get/set je Name, der Setter schreibt die Modulbindung. `legacy.js` liest und schreibt `ST.x`, umgeschrieben mit `codemod.mjs` (209 Bezüge, `ST` vorher auf Kollision geprüft).
- **Abweichung: `genF` und `winC` bleiben in `legacy.js`.** Beide werden in Schleifen von `step` gelesen (`winC` je Zeile des Rechenfensters, `genF` je Spalte), `genF` auch je Kachel im Nebel. Über die Fassade kostete das messbar (`step` Median +0,01 ms, 90. Perzentil +0,06 ms, viermal gleich), und ADR 0001 Punkt 9 schließt Getter in heißen Schleifen aus. `winC` zieht mit dem Rechenfenster (`rx0`…`qx1`, `scanMobile`) in PR 9 um, `genF` mit der Weltgenerierung in PR 8, jeweils als direkte Bindung des Moduls, das sie schreibt.
- **`rx0`, `rx1`, `qx0`, `qx1`** (`let`, in `step` getauscht) ziehen ebenfalls erst mit PR 9 um, nicht mit 7b.
- **Werkzeug:** `movecheck.mjs` schreibt Fassadennamen jetzt nur um, wo kein gleichnamiger lokaler Name sie verdeckt (Parameter, `let`/`const`/`var`, Funktion, `catch`, wie `codemod.mjs`). Vorher meldete es lokale `seen` (`sheetPick`, `parNews`, `mkRohreWith`) als Abweichung. Drei neue Selbsttests, darunter einer, der eine fälschlich umgeschriebene lokale Variable rot meldet.
- **Tests:** unverändert. `window.__ev` sieht die Namen weiter, weil esbuild die Modulbindungen in denselben Bundle-Scope legt; Golden Master liest sie so.
- **Absicherung:** Move-Nachweis mit Fassade (16 bewegt, 0 geändert), Golden-Master Welt und Speicherformat, `perf.mjs` alt gegen neu.

### PR 8: Weltgenerierung

**Geteilt (8.11.2026).** Gemessen an `legacy.js` nach PR 7b: Die Hülle von `shapeWorld`, `gen`, `genCol` und `build` umfasst 47 Funktionen. Sie lesen oder schreiben 62 Namen, die noch in `legacy.js` stehen (u. a. `trees`, `clouds`, `MACH`, `MATS`, `ZDEC`, `VAULTS`, `SPACE`, `OLD_N`, `RC0`/`RC1`, `genF`, `realm`, `SEED`, `hero`, `cam`), dazu fast alle Felder aus `state/world.js`. Über `gen` hängen außerdem das Rechenfenster (`scanMobile`, `ext`, `rx0`…`qx1`, `bx0`…) und der Fehlerschutz (`safe`, `errAdd`) daran. `Math.random` kommt nicht vor (nur `rng(seed)`, `hash2`). Weil `core/` nur `core/` importieren darf, geht das nicht in einem Schritt.

- **8a: Namen ohne Zustand → `core/world/shape.js`**, Text unverändert: `SNX` … `CAVE` (eine Deklaration), `SNC0`, `SNC1`, `msurf`, `vnoise`, `inGrid`, `ellipse`, `PX0`, `PM`, `PMC`, `LANDX`, `PADH`, `BT` (Land-Arten, nie geschrieben), `sm`, `colOf`, `hBio`, `craters`, `roomY`, `vFloor`, `WSX`, `LIFTX`, `SEA_T`, `SEA_L`, `SEA_B` (eine Deklaration), `HOUSE`, `FH`; 34 Namen. Keiner wird vor seiner alten Deklaration auf oberster Ebene gelesen (geprüft), das frühere Auswerten ändert also nichts. Die Schleife, die `mtop` mit `msurf` füllt, bleibt in `legacy.js`. Nicht dabei, weil beim Laden verändert: `BUILD` (wird mit Funktionen gefüllt), `RLM` (`orb` liest `SPACE`), `ZN` (`y` beim Laden), `HOME_T`/`HOME_C`. Absicherung: Move-Nachweis (34 bewegt, 0 geändert), Golden Master, `perf.mjs` (Formen werden auch beim Zeichnen gelesen).
- **8b: Generierung nach `core/world/gen.js` mit Weltobjekt** (entschieden 8.11.2026, Maintainer). 25 Funktionen: `shapeWorld`, `gen`, `genCol`, `build`, `layout`, `populate`, `rawX`, `rawG`, `zoneCols`, `winterCol`, `deepWorld`, `deepFar`, `planetDeep`, `vaultPlan`, `addCre`, `addTree`, `blk`, `carveCave`, `carveCircle`, `carvePath`, `fillBlock`, `fillCrater`, `fillPond`, `houseBlocks`, `makeTrack` als `…With(WD, …)`. `WD` ist ein Objekt in `legacy.js`: Typed Arrays direkt, neu zugewiesene Namen (`ST.x`, `SEED`, `realm`, `MACH` …) über get/set, Tabellen, die beim Laden gefüllt werden (`BUILD`, `RLM`, `ZN`), und als Ports die Funktionen, die zu anderen PRs gehören oder heiß gelesen werden (`ground`, `colTop`, `wc`, `rlm`, `setCell`, `lifeS`, `ext`, `scanMobile`, `skyLim`; `safe` und `last` in der Analyse waren gleichnamige lokale Namen). Bezüge `x` und `ST.x` in den bewegten Körpern werden `WD.x`; `movecheck.mjs` lernt diese Umschreibung. Einzeiler in `legacy.js` für die 14 Funktionen, die auch von außen gerufen werden. `genF` bleibt in `legacy.js` (über `WD` geschrieben), weil `step` und der Nebel es in Schleifen lesen; es zieht mit dem Zustand um. Leistung: eigener Vergleich für `gen()` und 4000× `genCol` (läuft beim Laufen durch `grow`), Median gleich (131 gegen 133 ms, 349 gegen 350 ms), dazu `perf.mjs`. Typen: `WD` ist `World = Record<string, any>`, Parameter `any`, vier Objektliterale als `/** @type {any} */ (…)`; das ändert den AST nicht.

### PR 9: Zellautomat

- **Abweichung (entschieden 8.11.2026, ADR 0001 Punkt 17): `state/sim.js` statt `core/world/sim.js`.** Gemessen: Liest `step` Gitter und Fensterzustand über ein Weltobjekt wie in PR 8b, steigt die Rechenzeit von 0,27 auf 0,56 ms (Median, zwei Läufe gleich). Alle Schreiber des Fensterzustands liegen im Automaten, `put` schreibt nur die Zähler.
- **Bewegt:** 10 Funktionen, `step`, `react`, `steam`, `put`, `ext`, `extI`, `scanMobile`, `cellAt`, `hotAt`, `lifeS`, Text unverändert. Dazu 19 Namen Fensterzustand als `export let`: `bx0 bx1 by0 by1 lavaCount waterCount fireCount tick sx0 winR` (eine Deklaration), `rx0 rx1 qx0 qx1`, `px0 px1 py0 py1` (aus der Deklaration mit `SEED`, `gold` …), `winC` (aus der mit `genF`). `legacy.js` liest sie über Importe, direkte Bindungen.
- **Ports:** `step`, `scanMobile`, `steam` bekommen `SP` vorn (`const SP` in `legacy.js`: `cam`, `trees`, `genF` über Getter, `dust`, `spawn`, `wc`) und heißen `…With`; in `legacy.js` bleibt je ein Einzeiler. `movecheck.mjs` prüft das mit `world: {param: "SP"}` wie in PR 8b. `Math.random` bleibt, Golden Master unberührt.
- **Bleibt:** `genF` (liest der Nebel, schreibt `loadCells`/`restore`), `wc` (liest `realm`), Teilchen (`spawn`, `dust`).
- **Absicherung:** Move-Nachweis (29 bewegt, 3 Einzeiler), Golden Master, Fuzz, Upgrade-Test, `perf.mjs` dreimal alt gegen neu.

### PR 10: Packen und Laden der Zellen

- **Bewegt:** `packRuns`, `unpackRuns` als `packRunsWith(grid, …)`/`unpackRunsWith(grid, …)` und `runsOk` → `core/world/pack.js`. Das Gitter kommt als Parameter gleichen Namens, der Körper bleibt unverändert. In `legacy.js` bleiben `packRuns` und `unpackRuns` als Einzeiler (`snapshot`, `loadCells` rufen sie).
- **Abweichung: `loadCells` und `migrateSnow` bleiben in `legacy.js` und ziehen mit PR 12 (Altstände) um.** Beides sind Abläufe beim Laden, keine Umrechnung von Zellen: `loadCells` schreibt `genF`, `cutX`, `ST.stI`, `ST.seen` … und ruft `genCol`/`build`, `migrateSnow` verschiebt `P`, `parked`, `props`, `hidden` und Bäume. Nach `core/` gingen sie nur mit Weltobjekt und Spielzustand, der erst mit PR 14 ein Modul hat.
- **Absicherung:** Move-Nachweis (3 bewegt, 2 Einzeiler), Golden Master Speicherformat, `save.mjs`, Upgrade-Test.

### PR 11: Speicherplätze und Datenbankzugriff

- **Bewegt:** `idbOpen` und `idbDo` als `idbDoWith(diskLock, …)` → `persistence/db.js` (Parameter gleichen Namens, Einzeiler in `legacy.js`). `SAVEKEY`, `realmKey`, `ERRK`, `MISK` → `persistence/keys.js`, dazu alle übrigen `localStorage`-Schlüssel als Konstanten `K_…`, Werte wörtlich wie heute (Tabelle im README). Die 44 Stellen in `legacy.js` nennen die Konstante statt des Literals; `movecheck.mjs` kennt dafür `literals`.
- **Abweichung: `snapshot`, `saveGame`, `autosave`, `packStart`/`packStep`, `saveHero`, `saveFinds`, `saveFacts` ziehen erst mit PR 14d um.** Sie lesen fast den ganzen Spielzustand (`P`, `parked`, `park`, `tracks`, `zips`, `hero`, `found`, `FS`, `energy`, `realm`, `saving`, `frozen` …), der erst mit PR 14 Module hat. Vorher ginge es nur über einen Port mit zwanzig Feldern.
- Der IDB-Name `lavaland` und die Ablage `save` bleiben Literale in `db.js`: `'lavaland'` ist im Quelltext auch App-Kennung und Schlüsselpräfix, `'save'` auch ein Knopfname. Eine Ersetzung nach Wert träfe beides.
- **Risiken:** `saveGame` ruft Banner, Ton und Sprache (`index.html:3049`). **Absicherung:** Rückmeldung wird als Port übergeben (`target.md` Abschnitt 3), gleiche Reihenfolge; `save.mjs`, `offline.mjs`, Golden-Master Speicherformat.

### PR 12: Umzug, Rettung, Altstände

- **Bewegt:** aus `S56` die Teile ohne Spielzustand: `BAK_DBS`, `BAK_ST`, `BAK_MAX`, `TYPED`, `BADK`, `bakOk`, `b64`, `unb64`, `enc`, `dec`, `dbDump`, `dbLoad` → `persistence/transfer.js`, Text unverändert (nur JSDoc und AST-neutrale Typ-Casts).
- **Abweichung:** `bakMake`, `bakLoad`, `bakIn` ziehen mit PR 14d um (`snapshot`, `saveFinds`, `saveHero`, `frozen`, `ready`, `traveling`), `bakSave`/`bakPick`/`bakDone` mit der Oberfläche (PR 24–27). `loadCells` und `migrateSnow` (aus PR 10) ziehen ebenfalls mit PR 14d um. `rescue`, `tryLoad` und das Laden alter Formate sind Closures in `start` und ziehen mit `start` nach `app/` (PR 28); sie herauszulösen hieße `start` umzubauen, ohne dass der Move-Nachweis greift. `persistence/rescue.js` entfällt bis dahin.
- **Absicherung:** `save.mjs` (Rettung, Datenbankstörung, Sichern/Laden), Upgrade-Test, Golden-Master.

### PR 13: Spielprotokoll

- **Bewegt:** `S61` → `log/log.js`: `const LOG=(function(){…})()` wird `export function logWith(LP){…}`, `legacy.js` ruft `const LOG=logWith(LP)`. Dazu `K_ALIVE` aus `persistence/keys.js` (der Herzschlag gehört dem Protokoll).
- **Abweichung:** Gelesen wird nicht über die Fassade, sondern über einen Port `LP` (Getter für `energy`, `frozen`, `paused`, `pzc`, `ready`, `realm`, `tool`, `P`, `parts`, `MAXE`, `SEG`, die Zähler aus `state/sim.js`, dazu `errAdd`, `uiOpen`, `$`). `log/` darf nach der Importtabelle `state/` nicht importieren, der Port ist also die Endform, kein Übergang. `movecheck.mjs` kennt dafür `iife`.
- **Offen für PR 14d:** `bakMake` (dann in `persistence/`) braucht `K_ALIVE`, um den Herzschlag nicht mitzusichern, darf aber `log/` nicht importieren. Lösung dort: als Parameter übergeben oder die Schlüssel nach `core/` legen.
- **Risiken:** `LOG.tick` läuft jedes Bild und liest jetzt etwa zehn Getter. **Absicherung:** Rauchtest Elternansicht, `save.mjs` (Protokoll im Export), Absturzerkennung in `save.mjs`.

### PR 14a/b/c: Spielzustand

- **14a:** `hero`, `gold`, `gems`, `lootDirty`, `heroDirty` → `state/game.js`. Benannte Mutation `addGold(n)` noch nicht (wäre 15 Sektionen Umbau), nur `ST`. Umgesetzt: `hero` wird nie neu zugewiesen und kommt als Live-Binding direkt aus `game.js` (278 Bezüge bleiben unverändert); die vier anderen über `ST` (91 Bezüge, Codemod). Tests schreiben `ST.gold`; `upgrade.mjs` liest auf der alten Seite `gold` oder `ST.gold`, je nachdem, was es dort gibt. Grundsatz für 14b/c: Was nur verändert, nie neu zugewiesen wird, braucht keine Fassade.
- **14b:** `P`, `cam`, `pan`, `parked`, `keys` → `state/game.js`. Umgesetzt: alle fünf sind `const` und werden nur verändert, also reine Moves ohne Fassade und ohne Teständerung; esbuild legt Module in einen Gültigkeitsbereich, der Zugriff in `step`/`update`/`draw` kostet nichts.
- **14c:** `realm`, `SEED`, `setRealm`, UI-Modus (`paused`, `tool`, `task`, `talkLock`, `OVS`, `uiOpen`) und Speicherschalter (`frozen`, `diskLock`, `saving`, `traveling`, `ready`).
  - **Umgesetzt:** `ready`, `saving`, `frozen`, `diskLock`, `traveling`, `paused`, `tool`, `task`, `talkLock` → `state/game.js` hinter `ST` (156 Bezüge, Codemod). Der Setter für `tool` heißt `setToolV`, weil `setTool` in `legacy.js` das Werkzeug wählt. Tests: Code-Strings in `ev(…)` per AST auf `ST.x` umgeschrieben (57 Stellen), `upgrade.mjs` liest `ready` weiter als bloßen Namen (im Bündel liegen Modulnamen im selben Gültigkeitsbereich, so geht es auf alter und neuer Seite). Die Namensliste `WORLD` im Golden Master bleibt unverändert (Schlüssel der Hashes).
  - **Abweichung:** `realm`, `SEED` und `setRealm` bleiben vorerst: `realm` hängt an `RW`, `RX0`, `RC0`, `RC1`, die `wc` liest (heißer Pfad, Weltports). Sie ziehen zusammen mit diesen nach `state/world.js`, wenn `wc` umzieht. `OVS` und `uiOpen` sind DOM und gehören zur Oberfläche (PR 24–27), nicht nach `state/`.
- **14d (neu, Voraussetzung für das Speichern):** `energy`, `found`, `hidden`, `props`, `tracks`, `zips`, `matGot`, `pzGot` → `state/game.js` hinter `ST` (124 Bezüge). Ohne sie bräuchte das Speichern einen Port mit rund 25 Feldern. Nicht dabei: `genF`, `cutX`, `realm`, `SEED`, `OLD_END` (Welt, heiße Pfade, ziehen mit `wc`), `FS` (Lernkern), `packJob`, `bakIn`, `saveT`, `lootT` (gehören dem Speichern selbst, ziehen mit ihm als Modulvariablen).
- **14e (aus PR 10–12 verschoben):** `loadCells`, `migrateSnow`, `bakMake`, `bakLoad`, `bakIn`, `snapshot`, `saveGame`, `autosave`, `packStart`/`packStep`, `saveHero`, `saveFinds`, `saveFacts` → `persistence/save.js`. Banner, Ton und Sprache in `saveGame` als Port, gleiche Reihenfolge; `save.mjs`, `offline.mjs`, Golden Master Speicherformat.
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
- **Endstand dokumentieren:** `docs/architecture/architecture.md` beschreibt die Architektur, wie sie nach der Migration wirklich ist, nicht wie sie geplant war:
  - Repostruktur als Baum bis auf Dateiebene in `src/`, dazu `tools/`, `tests/`, `docs/`, je Eintrag ein Satz Zweck.
  - Schichten mit tatsächlicher Importtabelle und allen Ausnahmen aus ADR 0001 (z. B. Punkt 17, Zellautomat in `state/`).
  - Module je Schicht: Zweck, öffentliche Exporte, Zustand, den sie besitzen.
  - Ablauf eines Frames (`frame` → `update`/`step` → `draw`) und Start (`start`, Laden, Rettung).
  - Spielstand: IDB-Namen, `localStorage`-Schlüssel, Formatversionen.
  - Build und Auslieferung (esbuild → `index.html`, `sw.js`/`CACHE`), Tests und welche Invariante jeder Test schützt.
  - Baum und Importtabelle erzeugt ein Skript (`tools/arch/doc.mjs`); die CI prüft wie bei „Bundle aktuell“, dass der Abschnitt aktuell ist.
  - `current.md` und `target.md` bekommen oben einen Hinweis „historisch, Stand vor/während der Migration“ und verweisen auf `architecture.md`. `CLAUDE.md` und `README.md` verlinken `architecture.md` statt sie zu wiederholen.

## 5. Größter Aufwand und Unsicherheit

- Die Fassade heißt nicht `G`: `G` ist im Spiel schon die Schwerkraft (`index.html:924`). Festgelegt in PR 7b: `ST` (`state/facade.js`). Wo der Plan ab PR 13 `G` als Fassade nennt, ist `ST` gemeint.
- **PR 7 und 14** fassen die meisten Stellen an (Codemod). Wenn der Codemod nicht sauber trennt, werden sie geteilt, nicht vergrößert.
- **PR 23** (`draw`) hat keinen Golden-Master außer dem Bildvergleich. Fehler sind dort sichtbar, aber nur in den drei Szenen.
- Schätzung: 31 PRs ohne Streichen. Weil vor PR 16 gestrichen wird, fallen PR 20 großteils und Teile von 24 und 26 weg. PR 5 läuft vorher und zieht Echo und Sudoku noch mit um.
