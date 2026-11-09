# Architektur von Lavaland

Stand nach der Migration (PR 29g3, November 2026). Beschreibt den Code, wie er ist. Wie es dazu kam: `migration-plan.md`; Entscheidungen: `adr/`. Die Abschnitte zwischen `<!-- doc.mjs:… -->` erzeugt `node tools/arch/doc.mjs`; die CI prüft, dass sie aktuell sind. Alles andere ist Handtext und wird mit dem Code geändert.

## 1. Überblick

- Ein Spiel für ein Handy, ausgeliefert als **eine selbstständige `index.html`** (Skript und CSS inline), dazu `sw.js`, `manifest.json`, Icons, `fonts/`, `audio/`. Läuft über GitHub Pages, als installierte PWA und direkt als Datei (ADR 0001 Punkt 1, ADR 0002).
- Quelltext in `src/` als ES-Module, JavaScript mit JSDoc. **esbuild** bündelt zu einer IIFE ohne Minify (`tools/build.mjs`). Keine Laufzeitabhängigkeiten, kein Framework.
- `index.html` im Wurzelverzeichnis ist gebaut und committet. Nie von Hand ändern; bei Konflikt neu bauen.
- `src/main.js` ruft `wire()` aus `src/app/wire.js`. `wire()` ist die Verdrahtung (Composition Root): Zustand, der noch keinem Modul gehört, Ports, Einzeiler, Handler beim Laden und der Start.

## 2. Repostruktur

Wurzel: `index.html` (gebaut), `sw.js` (Offline-Cache, Version `CACHE`), `manifest.json`, `icon-*.png`, `apple-touch-icon.png`, `fonts/`, `audio/` (Sprachaufnahmen), `package.json` und `package-lock.json` (nur Werkzeuge), `tsconfig.json`, `docs/` (Architektur, ADRs, Funde), `.github/workflows/` (`test.yml` Chromium, `firefox.yml` Firefox).

<!-- doc.mjs:tree -->
| Datei | Zweck |
|---|---|
| `src/app/app.js` | Abläufe: Start mit Laden und Rettung, Bildschleife, Reisen zwischen den Welten, neue Welt. |
| `src/app/wire.js` | Verdrahtung (Composition Root): Zustand, Ports und Einzeiler, die die Module verbinden, Handler beim Laden und der Start. |
| `src/audio/sound.js` | Ton und Sprache (PR 15): Klänge über Web Audio, Vorlesen mit Aufnahmen aus audio/ oder der Browserstimme. |
| `src/core/learn/facts.js` | Lernfakten: Wort-, Silben- und Reimlisten, die Stufen (Schulbuch-Reihenfolge) und reine Hilfen über Faktschlüssel. |
| `src/core/learn/leitner.js` | Leitner-Regeln ohne Speicher und Uhr: Konstanten, Stufenaufstieg, Schulstand-Filter, Abwechslung, Ruhen nach Fehlern. |
| `src/core/learn/tasks.js` | Lernaufgaben: aus einem Faktschlüssel die Aufgabe bauen (mkQWith), dazu Zahlenfolgen (mkSeqWith) und die Text- und Bildbausteine. |
| `src/core/puzzles/muster.js` | Rätsel „Muster“: Welches Bild fehlt in der Reihe? |
| `src/core/puzzles/robo.js` | Rätsel „Roboter“: Weg mit den wenigsten Richtungswechseln. |
| `src/core/puzzles/rohre.js` | Rätsel „Rohre“. |
| `src/core/puzzles/spiegel.js` | Rätsel „Spiegelbild“. |
| `src/core/puzzles/stern.js` | Rätsel „Sternbild“. |
| `src/core/puzzles/util.js` | Hilfen für die Rätselgeneratoren. |
| `src/core/puzzles/waage.js` | Rätsel „Waage“ (Zahlen bis 20, richtet sich nach dem Schulstand). |
| `src/core/rng.js` | Zufall und Rauschen ohne Seiteneffekte. |
| `src/core/world/const.js` | Feste Größen der Welt und reine Höhenfunktionen. |
| `src/core/world/gen.js` | Weltgenerierung: Form der Welt, Länder, Höhlen, Tiefe, Planeten und das spaltenweise Erzeugen. |
| `src/core/world/grow.js` | Schneeberg nachrüsten, Länder wachsen lassen, Planeten erzeugen, Zellen aus dem Spielstand laden. |
| `src/core/world/pack.js` | Packen und Entpacken der Zellen für den Spielstand: Spalte für Spalte als Läufe. |
| `src/core/world/shape.js` | Reine Formen der Welt: Schneeberg, Rauschen, Ellipse, Land-Arten und ihre Höhen. |
| `src/core/world/track.js` | Schienen: Punkt und Richtung auf einer Bahn. |
| `src/index.html` | Vorlage der ausgelieferten Seite: HTML, CSP und Marken für CSS und Skript. |
| `src/log/log.js` | Spielprotokoll für Eltern. |
| `src/main.js` | Einstieg für den Build: verdrahtet und startet das Spiel (app/wire.js). |
| `src/persistence/db.js` | Zugriff auf die Datenbank lavaland (Ablage save). |
| `src/persistence/errlog.js` | Fehlerprotokoll und fehlende Sprachaufnahmen: Technische Fehler bleiben nur auf diesem Gerät (höchstens 20, gleiche zusammengefasst); Sätze ohne Aufnahme werden gemerkt. |
| `src/persistence/keys.js` | Namen der Speicherplätze an einer Stelle. |
| `src/persistence/prefs.js` | Einstellungen und Leuchtmarken: Elternoptionen und Stimme speichern, Leuchtmarken der Welt laden. |
| `src/persistence/save.js` | Speichern: Spielstand packen (snapshot), sofort oder in Häppchen speichern (saveGame, autosave), Held, Funde und Lernstand in localStorage. |
| `src/persistence/transfer.js` | Spielstand umziehen: Sicherungsdatei prüfen, kodieren, Datenbanken auslesen und einspielen. |
| `src/render/cells.js` | Zellen malen: Farbpaletten der Welt und der Länder, Farben der Tiefe, Paletten fremder Welten und das Zellbild. |
| `src/render/draw.js` | Zeichnen: Ein Bild der Welt, von hinten nach vorn: Himmel, Hügel, Welt, Systeme, Fahrzeuge, Held, Flüssigkeiten, Teilchen, Stimmung, Zeiger. |
| `src/render/hints.js` | Hinweise malen: Funkelstern und Pfeil zu einem Ziel (im Bild darüber, sonst am Bildrand) |
| `src/render/scenery.js` | Kulisse und Zeichenhelfer: Rundrechteck, Kreis, Farbmischung, Emoji, Pfeil, Knopf, Bäume, Wolken, Weltraum, Hügel, Dunkelheit, ferner Weltraum, Nebel, Funde, Requisiten … |
| `src/render/vehicles.js` | Fahrzeuge und Held malen: Kopf, Kind, Fallschirm, Auto, Bagger, Radlader, Kipper, Tunnelbohrer, Rakete, Flugzeug, Lore, U-Boot, Ballon, Hubschrauber, Boot, Käfer, Seilrutschen … |
| `src/render/winter.js` | Winter malen: Schneemänner, Yeti, Drachen, Iglu, Lift mit Gondeln, Skifahrer, Schneeball-Rolle, Figuren am Berg, Schneebälle, Feuerwerk und Schneefall. |
| `src/render/world.js` | Die große Welt malen: Stimmung, Pflanzen, Deko, Sprungpilze, Geheimnisse, Planeten, Werkstatt, Aufzug, Maschinen und Leuchtmarken in der Tiefe. |
| `src/state/facade.js` | Übergangsfassade ST (ADR 0001 Punkt 9): ein Objekt mit get/set je neu zugewiesenem Namen, der aus legacy.js umgezogen ist (Welt: world.js, Spielzustand: game.js). |
| `src/state/fx.js` | Wirkungen auf die Spielfigur: laufende Effekte (Rutschen, Scharf, Zucker, Riesig, Winzig …), Tempo und Größe daraus. |
| `src/state/game.js` | Spielzustand (PR 14a/b): Held, Gold, Edelsteine, Merker fürs Speichern; Spielfigur P, geparkte Fahrzeuge, Kamera, Verschieben, Tasten. |
| `src/state/home.js` | Heimat beim Laden: Bäume und Wolken der Heimatwelt (fester Zufallsstrom rng(20261004)) und ihre Kopien für die Rückkehr. |
| `src/state/progress.js` | Fortschritt: Höhengrenze der Rakete, nächstes unentdecktes Land, Land mit noch verstecktem Ei. |
| `src/state/queries.js` | Weltabfragen: Boden, fest, Mond, brennt, Säulenoberkante, Boden unter einem Punkt, Oberfläche, Zelle setzen. |
| `src/state/realm.js` | Aktuelle Welt: Erde oder Mond/Planet (realm), ihre Breite und Lage im Gitter, Randspalten. |
| `src/state/sim.js` | Zellautomat: Lava, Wasser, Feuer und Dampf, das Rechenfenster um die Kamera und das Setzen einzelner Zellen. |
| `src/state/terrain.js` | Welt beim Laden: Boden der Heimat (g0), harte Schichten und Zonen je Spalte, Oberkante des Schneebergs. |
| `src/state/world.js` | Welt-Felder: die Zellen und die Spaltenwerte der Welt als Typed Arrays mit fester Größe. |
| `src/styles.css` | Alle Stile, inline in die Seite gebaut. |
| `src/systems/creatures.js` | Tiere (PR 19a): Laufen, Fliegen, Schwimmen, Anstoßen, Schlüpfen und Zeichnen. |
| `src/systems/day.js` | Tagesbilanz und Lagerfeuer: Spielzeit des Tages, Elternlimit, Lagerfeuer zur Pause; dazu der einmalige Umtausch von altem Gold in Zahnräder. |
| `src/systems/deep.js` | Tiefe und Erkunden: Jede Sekunde (Zonen, Planetenkerne, Maschinen, Ziele), Funde, Erkundungsnebel, Leuchtmarken. |
| `src/systems/finds.js` | Fundsachen, Sprungpilze, goldene Eier und Schätze (PR 19b): Aufheben, Wirkung, Fallen der Fundsachen, geworfene Bananen. |
| `src/systems/index.js` | Systemschnittstelle (PR 16): Nebensysteme laufen nach update() einmal je Bild, in fester Reihenfolge. |
| `src/systems/learn.js` | Lernkern-Rest: Akku leeren, Antwortauswahl, Tageszahl, Fakten laden, Fakt wählen, Fakt verbuchen, Meisterstein, Aufgabe erzeugen, Schulstand speichern. |
| `src/systems/mobs.js` | Pfeile und Höhlenmonster (PR 18), je mit tick und draw. |
| `src/systems/particles.js` | Teilchen erzeugen: Obergrenze, Funken, Rauch, Staub, Konfetti und Explosion. |
| `src/systems/play.js` | Spielen in der Welt: Zellen zählen, Springen, Funde verstecken, Album, Sternentor, Bomben, Sonar, Entdecken, Disco, Tippen in die Welt (Regenwolke, Baum schütteln) und Fernrohr. |
| `src/systems/player/player.js` | Spielfigur: Modus wechseln, Laufen, Aktionstaste, Lift, Seilrutsche, Graben zu Fuß und das Update je Bild. |
| `src/systems/player/vehicles.js` | Fahrzeuge: Graben und Schaufeln, Fahren, Fliegen, Ski, Drache, U-Boot, Ballon, Hubschrauber, Boot, Kletterkäfer. |
| `src/systems/quests.js` | Aufträge (PR 20): Einführungskette, Kette aus Tiefe und Höhe, Zufallsaufträge, Fortschritt, Anzeige und Zeiger. |
| `src/systems/sights.js` | Sehenswürdigkeiten (PR 17): Geysire, Sternschnuppen, Schiffswracks, Glühwürmchen und Kristallharfen, je mit tick und draw. |
| `src/systems/tracks.js` | Schienen: die Vorführbahn neben dem Start. |
| `src/systems/winter.js` | Winter-Leben: Schneebälle, Feuerwerk, Schneemänner, Pinguine und die Figuren am Schneeberg und am Vulkan. |
| `src/systems/worldtick.js` | Was jede Sekunde in der großen Welt passiert. |
| `src/systems/zones.js` | Unter Tage: Erkundungsnebel, Werkstatt-Stufen, Zonen und harte Schichten, Wissenstüren, Heimweg aus der Tiefe, Maschinen und Werkstatt-Nähe, Leuchtmarken speichern und Dunkelheit. |
| `src/ui/backup.js` | Spielstand umziehen (Bedienung): Datei speichern oder teilen, Datei wählen und prüfen. |
| `src/ui/bind.js` | Bedienung verdrahten: Tastenbilder in die Knöpfe, Fahrzeug- und Werkzeugkarten, Klicks auf Leiste, Menü, Fenster, Hand, Ton, Vollbild, Umzug, Neue Welt. |
| `src/ui/controls.js` | Bedienung: Tastenbilder einsetzen, Tippen und Halten, linke oder rechte Hand, Vollbild, Bombenzahl im HUD. |
| `src/ui/hud.js` | Oberfläche: Werkzeug wählen, Leiste abgleichen, Knopf-Puls, Blitz, Banner, Sprechblasen und Ansagen, Belohnung, Besitz, Aktionsknopf. |
| `src/ui/icons.js` | Bilder für die Tasten: SVG-Pfade für Fahrzeuge, Werkzeuge, Aktionen und Aufgaben (Tinte K, Strichstile S1, S2) |
| `src/ui/keys.js` | Tastenkürzel und Wischen: Kürzel für dieselben Knöpfe wie in der Leiste; Wischen nur, wo ein Fenster mehr Inhalt als Platz hat. |
| `src/ui/learn.js` | Lernen auf dem Bildschirm: Akku-Anzeige, Lernaufgabe mit Ziffernblock, Rechentafel. |
| `src/ui/map.js` | Karten, Werkstatt und Aufzug: Reisekarte, Erkundungskarte, goldene Eier, Werkstatt von Professor Zahnrad, Aufzugskarten. |
| `src/ui/paint.js` | Malen mit dem Finger: Bildschirm zu Welt, Pinsel, Radierer, Zauberkasten-Kosten, Werkzeuge je Finger, Loslassen. |
| `src/ui/parent.js` | Elternansicht: Schranke, Auswertung des Spielprotokolls, Schulstand, Neuigkeiten, Speicher, Fehler, Stimme, Übungsblatt, Rechentafel-Balken. |
| `src/ui/puzzles.js` | Rätselrahmen und Rätsel auf dem Bildschirm: Öffnen, Zeichnen, Antippen, Tipps, Ansagen, Gewinnen. |
| `tools/arch/analyze.mjs` | Ist-Analyse von index.html: Sektionen, Top-Level-Namen, wer welchen Namen liest/schreibt/aufruft, Zyklen, große Funktionen, DOM/Canvas/Speicher-Mischung, Zugriffe der Tests auf … |
| `tools/arch/codemod.mjs` | Umschreiben über den AST: Bezüge auf Top-Level-Namen x werden zu F.x (Übergangsfassade, ADR 0001 Punkt 9). |
| `tools/arch/deps.mjs` | Prüft die Schichtregeln aus docs/architecture/target.md Abschnitt 3 auf dem esbuild-Metafile (dieselbe Sicht wie der Bundler). |
| `tools/arch/doc.mjs` | Erzeugt die maschinell gepflegten Abschnitte von docs/architecture/architecture.md: Dateibaum mit Zweck, Importtabelle der Schichten, Module mit Exporten und eigenem Zustand. |
| `tools/arch/movecheck.mjs` | Move-Nachweis: Jeder Top-Level-Name aus src/ des Basisstands ist im neuen Stand entweder AST-gleich (gleiche oder andere Datei), mit genau den erlaubten mechanischen … |
| `tools/arch/samecode.mjs` | Nachweis für PR 1 (und jeden reinen Umbau des Builds): Das Skript im gebauten index.html ist derselbe Code wie das Skript der alten index.html. |
| `tools/arch/split.mjs` | Einmalig für PR 1: zerlegt eine alte index.html (ein <style>, ein <script>) in src/index.html, src/styles.css und src/legacy.js. |
| `tools/build.mjs` | Baut aus src/ die eine ausgelieferte Datei index.html (Skript und CSS inline) und den Testbuild dist/index.test.html. |
| `tools/voice/build.py` | Erzeugt die Sprachaufnahmen für alle Sätze aus texts.json. |
| `tools/voice/collect.mjs` | Sammelt alle Sätze, die das Spiel vorlesen kann, als Liste für die Sprachaufnahmen. |
| `tools/voice/README.md` | Vorlesestimme. |
| `tests/browser.mjs` | Browserwahl für die Browser-Tests. |
| `tests/crawl.mjs` | Knopftest: tippt zufällig auf alles, was gerade sichtbar und tippbar ist (Fenster, Rätsel, Elternansicht), und spielt jedes Rätsel auf jeder Stufe einmal durch. |
| `tests/fuzz.mjs` | Zufallstest: drückt Tasten, tippt auf die Spielwelt, wechselt Fahrzeuge, Werkzeuge und Welten. |
| `tests/golden.mjs` | Golden Master: hält fest, was das Spiel heute erzeugt und speichert, damit jeder Umzug in src/ beweisbar nichts ändert. |
| `tests/offline.mjs` | Offline-Test: Nach dem ersten Besuch muss das Spiel ohne Netz, bei sehr langsamem Netz und bei Serverfehlern starten (installierte App im Funkloch). |
| `tests/perf.mjs` | Leistungsmessung für PRs, die step, update, draw oder frame berühren: Median und 90. |
| `tests/pixels.mjs` | Bildvergleich (Migrationsplan PR 17, Pfeile und Monster seit PR 18, Tiere seit PR 19a, Winter seit PR 20b, Werkstatt, Tiefe und Planeten seit PR 22, Lift seit PR 23, Malen seit … |
| `tests/prod.mjs` | Rauchtest gegen das Produktionsbundle: Alle anderen Browser-Tests laufen gegen den Testbuild (mit Testzugang). |
| `tests/save.mjs` | Spielstand-Test: Der Spielstand des Kindes darf nie verloren gehen. |
| `tests/server.mjs` | Kleiner Testserver für das Repo. |
| `tests/smoke.mjs` | Rauchtest: startet das Spiel in einem Handy-Browser und prüft die wichtigsten Abläufe. |
| `tests/static.mjs` | Statischer Test ohne Browser: Syntax aller Skripte, Größenbudget, jede $('id') hat ein Element, IDs einmalig, Speicherschlüssel, Offline-Dateien. |
| `tests/upgrade.mjs` | Update-Test: Ein Spielstand der Live-Version (main) muss nach dem Update unverändert weiterlaufen. |
| `tests/voice.mjs` | Vorlesetexte: Gibt es zu jedem Satz, den das Spiel vorlesen kann, eine Aufnahme? |
<!-- /doc.mjs -->

## 3. Schichten

Eine Datei gehört zu der Schicht ihres obersten Ordners in `src/`. `tools/arch/deps.mjs` prüft auf dem esbuild-Metafile die Importtabelle, Zyklenfreiheit zwischen Dateien, dass niemand `main.js` importiert, und dass `core/` kein `document`, `window`, `localStorage`, `indexedDB`, `ctx.` und `Math.random` enthält. Ausnahmen in `deps.mjs` gibt es keine.

| Schicht | Aufgabe |
|---|---|
| `core` | Reine Rechnung: Zufall und Rauschen, Weltgenerierung, Lernregeln, Rätselgeneratoren. Zufall kommt als Parameter. |
| `state` | Zustand der Welt und des Spiels (Typed Arrays, Held, Kamera), der Zellautomat, Weltabfragen, Fassade `ST`. |
| `persistence` | IndexedDB `lavaland`, `localStorage`, Speicherformat, Sichern und Einspielen. |
| `log` | Spielprotokoll für die Elternansicht (IndexedDB `lavaland-log`). |
| `audio` | Klänge und Vorlesen. |
| `systems` | Was je Bild oder je Sekunde passiert: Spielfigur, Fahrzeuge, Nebensysteme, Aufträge, Lernkern. |
| `render` | Zeichnen auf die Leinwand. |
| `ui` | DOM: Leiste, Fenster, Rätselrahmen, Elternansicht, Tasten, Malen. |
| `app` | Abläufe (Start, Bildschleife, Reisen) und die Verdrahtung `wire()`. Darf alles außer `testing`. |
| `testing` | Reserviert für Testhilfen; heute leer. |

Was eine Schicht nicht importieren darf, bekommt sie als **Port**: ein Objekt mit Gettern, Settern und Funktionen, das `app/wire.js` baut und als ersten Parameter übergibt (`fooWith(PORT, …)`). Die Einzeiler `function foo(…){ return fooWith(PORT, …); }` in `wire()` halten die alten Namen für Aufrufer und Tests.

<!-- doc.mjs:imports -->
Zeile importiert Spalte: Zahl = Importe heute, · = erlaubt und ungenutzt, leer = verboten (`tools/arch/deps.mjs`).

| von \ nach | core | state | persistence | log | audio | systems | render | ui | app | testing |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **core** | 20 |  |  |  |  |  |  |  |  |  |
| **state** | 13 | 13 |  |  |  |  |  |  |  |  |
| **persistence** | 1 | 4 | 4 |  |  |  |  |  |  |  |
| **log** | 1 |  |  | · |  |  |  |  |  |  |
| **audio** | · |  |  |  | · |  |  |  |  |  |
| **systems** | 25 | 47 |  |  | 15 | 2 |  |  |  |  |
| **render** | 12 | 17 |  |  |  |  | · |  |  |  |
| **ui** | 13 | 20 |  |  | 7 |  | · | 1 |  |  |
| **app** | 20 | 12 | 7 | 1 | 2 | 20 | 7 | 16 | 1 |  |
| **testing** | · | · | · | · | · | · | · | · | · | · |
| **main** | · | · | · | · | · | · | · | · | 1 | · |
<!-- /doc.mjs -->

Bewusste Abweichungen vom Zielbild (`target.md`), alle mit Entscheidung:

- **Zellautomat in `state/sim.js`, nicht in `core/`** (ADR 0001 Punkt 17): Über ein Weltobjekt verdoppelte sich `step`. Das Modul besitzt den Fensterzustand und nutzt `Math.random`.
- **Weltgenerierung in `core/world/gen.js` mit Weltobjekt `WD`** (ADR 0001 Punkt 16), gemessen ohne Verlust.
- **Fassade `ST`** (`state/facade.js`, ADR 0001 Punkt 9, Name `ST` statt `G`, weil `G` die Schwerkraft ist): get/set für Namen, die mehrere Module neu zuweisen. Heiße Schleifen lesen nie über `ST` oder Getter, ohne vorher zu messen.
- **Zustand in `wire()`** (Entscheidung 9.11.2026, Endzustand A): Was noch in `app/wire.js` steht, zieht in Aufräum-PRs je Bereich nach `state/` (`migration-plan.md`, „Später (B)“). Bis dahin hat `app/wire.js` `@ts-nocheck`; alle anderen Module prüft `tsc --checkJs`.

## 4. Module

Erzeugt aus den Exporten. `export let` ist Zustand, den das Modul besitzt und nur selbst schreibt (andere Schreiber gehen über Setter in `ST` oder Ports).

<!-- doc.mjs:modules -->
#### core

- `src/core/learn/facts.js`: Lernfakten: Wort-, Silben- und Reimlisten, die Stufen (Schulbuch-Reihenfolge) und reine Hilfen über Faktschlüssel.
  Funktionen: `fDom`, `fStage`, `fKind`, `fName`. Werte: `WORDS`, `SYL`, `CLAP`, `RHY`, `RHYW`, `LETTERS`, `CASES`, `STAGES`.
- `src/core/learn/leitner.js`: Leitner-Regeln ohne Speicher und Uhr: Konstanten, Stufenaufstieg, Schulstand-Filter, Abwechslung, Ruhen nach Fehlern.
  Funktionen: `schoolOkWith`, `fUnlockWith`, `mixPreferWith`, `fParkedWith`. Werte: `BOXD`, `NEWDAY`, `FASTMS`, `DAYMISS`.
- `src/core/learn/tasks.js`: Lernaufgaben: aus einem Faktschlüssel die Aufgabe bauen (mkQWith), dazu Zahlenfolgen (mkSeqWith) und die Text- und Bildbausteine.
  Funktionen: `dots`, `zw`, `qpicWith`, `lettersForWith`, `solAdd`, `solSub`, `mkQWith`, `mkSeqWith`. Werte: `HOLE`.
- `src/core/puzzles/muster.js`: Rätsel „Muster“: Welches Bild fehlt in der Reihe?
  Funktionen: `tkKey`, `mkMusterWith`.
- `src/core/puzzles/robo.js`: Rätsel „Roboter“: Weg mit den wenigsten Richtungswechseln.
  Funktionen: `rbSolve`, `mkRoboWith`. Werte: `RBL`, `RBD`.
- `src/core/puzzles/rohre.js`: Rätsel „Rohre“.
  Funktionen: `rhRot`, `rhMask`, `rhFlow`, `rhDone`, `mkRohreWith`. Werte: `RHL`, `RMASK`.
- `src/core/puzzles/spiegel.js`: Rätsel „Spiegelbild“.
  Funktionen: `mkSpiegelWith`. Werte: `SPL`.
- `src/core/puzzles/stern.js`: Rätsel „Sternbild“.
  Funktionen: `mkSternWith`. Werte: `SHAPES`.
- `src/core/puzzles/util.js`: Hilfen für die Rätselgeneratoren.
  Funktionen: `idxs`.
- `src/core/puzzles/waage.js`: Rätsel „Waage“ (Zahlen bis 20, richtet sich nach dem Schulstand).
  Funktionen: `mkWaageWith`.
- `src/core/rng.js`: Zufall und Rauschen ohne Seiteneffekte.
  Funktionen: `rng`, `hash2`, `riWith`, `shuffleWith`.
- `src/core/world/const.js`: Feste Größen der Welt und reine Höhenfunktionen.
  Funktionen: `clamp`, `baseG`, `bump`, `rawH`. Werte: `HOME_W`, `HOME_GX`, `WORLD_W0`, `WORLD_W`, `CELL`, `GX`, `GY`, `GY0`, `KEEPR`, `WINW`, `SW`, `ROWW`, `SH`, `TOP`, `VOLC`, `G`, `TAU`, `LAVA`, `FIRE`, `WATER`, `EARTH`, `ROCK`, `ICE`, `WOOD`, `BED`, `DEEP`, `HOT`, `CORE`, `GOLD`, `GEM`, `SNOW`, `SHELL`, `MAX_LAVA`, `MAX_WATER`, `MAX_FIRE`, `SKY_TOP`, `SKYL`, `SKY_END`, `MOON`, `STALL_X`, `SITE`, `FLAT`, `siteY`, `B0`, `EXT_X`, `EXC`, `HOME_END`, `WL`, `WLR`.
- `src/core/world/gen.js`: Weltgenerierung: Form der Welt, Länder, Höhlen, Tiefe, Planeten und das spaltenweise Erzeugen.
  Funktionen: `winterColWith`, `carveCaveWith`, `carveCircleWith`, `carvePathWith`, `fillCraterWith`, `fillPondWith`, `houseBlocksWith`, `fillBlockWith`, `rawXWith`, `rawGWith`, `layoutWith`, `addTreeWith`, `addCreWith`, `populateWith`, `zoneColsWith`, `shapeWorldWith`, `blkWith`, `buildWith`, `genColWith`, `genWith`, `makeTrackWith`, `deepWorldWith`, `deepFarWith`, `planetDeepWith`, `vaultPlanWith`.
- `src/core/world/grow.js`: Schneeberg nachrüsten, Länder wachsen lassen, Planeten erzeugen, Zellen aus dem Spielstand laden.
  Funktionen: `migrateSnowWith`, `planetGenWith`, `growWith`, `loadCellsWith`.
- `src/core/world/pack.js`: Packen und Entpacken der Zellen für den Spielstand: Spalte für Spalte als Läufe.
  Funktionen: `packRunsWith`, `unpackRunsWith`, `runsOk`.
- `src/core/world/shape.js`: Reine Formen der Welt: Schneeberg, Rauschen, Ellipse, Land-Arten und ihre Höhen.
  Funktionen: `msurf`, `vnoise`, `inGrid`, `ellipse`, `sm`, `colOf`, `hBio`, `craters`, `roomY`, `vFloor`. Werte: `SNX`, `SL0`, `PEAK`, `BACK`, `BEND`, `MH`, `SNB`, `CHX`, `CAVE`, `SNC0`, `SNC1`, `PX0`, `PM`, `PMC`, `LANDX`, `PADH`, `BT`, `WSX`, `LIFTX`, `SEA_T`, `SEA_L`, `SEA_B`, `HOUSE`, `FH`.
- `src/core/world/track.js`: Schienen: Punkt und Richtung auf einer Bahn.
  Funktionen: `trackAt`. Werte: `Q`.

#### state

- `src/state/facade.js`: Übergangsfassade ST (ADR 0001 Punkt 9): ein Objekt mit get/set je neu zugewiesenem Namen, der aus legacy.js umgezogen ist (Welt: world.js, Spielzustand: game.js).
  Werte: `ST`.
- `src/state/fx.js`: Wirkungen auf die Spielfigur: laufende Effekte (Rutschen, Scharf, Zucker, Riesig, Winzig …), Tempo und Größe daraus.
  Funktionen: `fxSpeed`, `kidScale`. Werte: `FX`.
- `src/state/game.js`: Spielzustand (PR 14a/b): Held, Gold, Edelsteine, Merker fürs Speichern; Spielfigur P, geparkte Fahrzeuge, Kamera, Verschieben, Tasten.
  Funktionen: `setGold`, `setGems`, `setLootDirty`, `setHeroDirty`, `setReady`, `setSaving`, `setFrozen`, `setDiskLock`, `setTraveling`, `setPaused`, `setToolV`, `setTask`, `setTalkLock`, `setEnergy`, `setFound`, `setHidden`, `setProps`, `setTracks`, `setZips`, `setMatGot`, `setPzGot`. Werte: `P`, `parked`, `cam`, `pan`, `keys`. Zustand (`export let`): `hero`, `gold`, `gems`, `lootDirty`, `heroDirty`, `ready`, `saving`, `frozen`, `diskLock`, `traveling`, `paused`, `tool`, `task`, `talkLock`, `energy`, `found`, `hidden`, `props`, `tracks`, `zips`, `matGot`, `pzGot`.
- `src/state/home.js`: Heimat beim Laden: Bäume und Wolken der Heimatwelt (fester Zufallsstrom rng(20261004)) und ihre Kopien für die Rückkehr.
  Werte: `HOME_T`, `HOME_C`, `trees`, `clouds`.
- `src/state/progress.js`: Fortschritt: Höhengrenze der Rakete, nächstes unentdecktes Land, Land mit noch verstecktem Ei.
  Funktionen: `skyLim`, `nextLand`, `eggLand`.
- `src/state/queries.js`: Weltabfragen: Boden, fest, Mond, brennt, Säulenoberkante, Boden unter einem Punkt, Oberfläche, Zelle setzen.
  Funktionen: `ground`, `inMoon`, `solidW`, `burns`, `colTop`, `floorAt`, `surfaceY`, `putUp`, `setCell`. Werte: `ORBS`.
- `src/state/realm.js`: Aktuelle Welt: Erde oder Mond/Planet (realm), ihre Breite und Lage im Gitter, Randspalten.
  Funktionen: `rlmWith`, `setRealmWith`, `wcWith`, `newSeed`. Zustand (`export let`): `realm`, `RW`, `RX0`, `RC0`, `RC1`.
- `src/state/sim.js`: Zellautomat: Lava, Wasser, Feuer und Dampf, das Rechenfenster um die Kamera und das Setzen einzelner Zellen.
  Funktionen: `lifeS`, `ext`, `extI`, `scanMobileWith`, `put`, `cellAt`, `hotAt`, `react`, `steamWith`, `stepWith`. Zustand (`export let`): `bx0`, `bx1`, `by0`, `by1`, `lavaCount`, `waterCount`, `fireCount`, `tick`, `sx0`, `winR`, `rx0`, `rx1`, `qx0`, `qx1`, `px0`, `px1`, `py0`, `py1`, `winC`.
- `src/state/terrain.js`: Welt beim Laden: Boden der Heimat (g0), harte Schichten und Zonen je Spalte, Oberkante des Schneebergs.
- `src/state/world.js`: Welt-Felder: die Zellen und die Spaltenwerte der Welt als Typed Arrays mit fester Größe.
  Funktionen: `setBIO`, `setSTR`, `setCRE`, `setPICKS`, `setPADS`, `setDECO`, `setEGGS`, `setLOOT`, `setDROPS`, `setStI`, `setNT0`, `setNC0`, `setSeen`, `setEggGot`, `setLootGot`, `setOrbGot`. Werte: `g0`, `grid`, `stamp`, `LIFE`, `zS1`, `z4`, `zS2`, `zS3`, `grow0`, `rA`, `rB`, `rD`, `rH`, `rC`, `mtop`, `bio`, `bio2`, `bmx`, `bix`, `noCave`, `liqM`, `liqY`. Zustand (`export let`): `BIO`, `STR`, `CRE`, `PICKS`, `PADS`, `DECO`, `EGGS`, `LOOT`, `DROPS`, `stI`, `NT0`, `NC0`, `seen`, `eggGot`, `lootGot`, `orbGot`.

#### persistence

- `src/persistence/db.js`: Zugriff auf die Datenbank lavaland (Ablage save).
  Funktionen: `idbOpen`, `idbDoWith`.
- `src/persistence/errlog.js`: Fehlerprotokoll und fehlende Sprachaufnahmen: Technische Fehler bleiben nur auf diesem Gerät (höchstens 20, gleiche zusammengefasst); Sätze ohne Aufnahme werden gemerkt.
  Funktionen: `errLoad`, `errAdd`, `vcMiss`.
- `src/persistence/keys.js`: Namen der Speicherplätze an einer Stelle.
  Funktionen: `realmKey`. Werte: `K_HERO`, `K_FINDS`, `K_STARS`, `K_SKILL`, `K_FACTS`, `K_SCHOOL`, `K_LIMIT`, `K_DAY`, `K_REALM`, `K_FOG`, `K_MARKS`, `K_MUTE`, `K_LEFTY`, `K_PSST`, `K_NEWS`, `K_BAK_AT`, `K_VOICE`, `K_VMISS`, `K_OPT`, `ERRK`, `MISK`, `SAVEKEY`.
- `src/persistence/prefs.js`: Einstellungen und Leuchtmarken: Elternoptionen und Stimme speichern, Leuchtmarken der Welt laden.
  Funktionen: `optSaveWith`, `voiceSaveWith`, `marksLoadWith`.
- `src/persistence/save.js`: Speichern: Spielstand packen (snapshot), sofort oder in Häppchen speichern (saveGame, autosave), Held, Funde und Lernstand in localStorage.
  Funktionen: `saveFindsWith`, `snapshotWith`, `packStartWith`, `packStepWith`, `saveGameWith`, `autosaveWith`, `saveHeroWith`, `saveFactsWith`. Zustand (`export let`): `saveT`, `lootT`, `packJob`.
- `src/persistence/transfer.js`: Spielstand umziehen: Sicherungsdatei prüfen, kodieren, Datenbanken auslesen und einspielen.
  Funktionen: `bakOk`, `b64`, `unb64`, `enc`, `dec`, `dbDump`, `dbLoad`, `bakMakeWith`, `bakLoadWith`. Werte: `BAK_DBS`, `BAK_ST`, `BAK_MAX`, `TYPED`, `BADK`.

#### log

- `src/log/log.js`: Spielprotokoll für Eltern.
  Funktionen: `logWith`. Werte: `K_ALIVE`.

#### audio

- `src/audio/sound.js`: Ton und Sprache (PR 15): Klänge über Web Audio, Vorlesen mit Aufnahmen aus audio/ oder der Browserstimme.
  Funktionen: `audio`, `jingle`, `voicesDe`, `voiceGet`, `speakSplit`, `clipGet`, `speakStop`, `numWord`, `synthText`, `synth`, `clipPlay`, `speakWith`, `blip`, `noise`, `sfx`, `tone`. Werte: `VRATES`, `vcUrl`, `NUMW`, `NUMT`, `AU`. Zustand (`export let`): `AC`, `tapT`, `VOICE`, `VCLIP`, `vcSeq`, `vcAud`, `muted`, `fxOff`, `noiseBuf`, `coinT`, `coinN`, `digSfxT`, `flameSfx`.

#### systems

- `src/systems/creatures.js`: Tiere (PR 19a): Laufen, Fliegen, Schwimmen, Anstoßen, Schlüpfen und Zeichnen.
  Funktionen: `creInitWith`, `hatchWith`, `creHitWith`, `creTickWith`, `drawCresWith`. Zustand (`export let`): `throws`, `trexT`.
- `src/systems/day.js`: Tagesbilanz und Lagerfeuer: Spielzeit des Tages, Elternlimit, Lagerfeuer zur Pause; dazu der einmalige Umtausch von altem Gold in Zahnräder.
  Funktionen: `dayLoadWith`, `daySaveWith`, `dayAddWith`, `dayTickWith`, `limCheckWith`, `campSoonWith`, `pluralWith`, `openCampWith`, `campRestWith`, `goldSwapWith`.
- `src/systems/deep.js`: Tiefe und Erkunden: Jede Sekunde (Zonen, Planetenkerne, Maschinen, Ziele), Funde, Erkundungsnebel, Leuchtmarken.
  Funktionen: `findOpenWith`, `collectWith`, `findsTickWith`, `fogTickWith`, `mkCanWith`, `mkNearWith`, `mkTickWith`, `mkTapWith`, `matFoundWith`, `zoneGiftsWith`, `finaleWith`, `deepIntroWith`, `deepTickWith`, `deepWith`, `findsWith`, `marksWith`.
- `src/systems/finds.js`: Fundsachen, Sprungpilze, goldene Eier und Schätze (PR 19b): Aufheben, Wirkung, Fallen der Fundsachen, geworfene Bananen.
  Funktionen: `grabWith`, `pickTickWith`, `padsTickWith`, `grantWith`, `eggFoundWith`, `lootFoundWith`, `secretsTickWith`.
- `src/systems/index.js`: Systemschnittstelle (PR 16): Nebensysteme laufen nach update() einmal je Bild, in fester Reihenfolge.
  Funktionen: `register`, `drawLayer`, `safeWith`. Werte: `SIDE`, `SAFE`.
- `src/systems/learn.js`: Lernkern-Rest: Akku leeren, Antwortauswahl, Tageszahl, Fakten laden, Fakt wählen, Fakt verbuchen, Meisterstein, Aufgabe erzeugen, Schulstand speichern.
  Funktionen: `drainWith`, `numOptsWith`, `dayNoWith`, `loadFactsWith`, `pickFactWith`, `pickFact0With`, `factDoneWith`, `masterGiveWith`, `genQWith`, `saveSchoolWith`.
- `src/systems/mobs.js`: Pfeile und Höhlenmonster (PR 18), je mit tick und draw.
  Funktionen: `shootWith`, `tgtYWith`, `arrowsTickWith`, `arrowHitWith`, `drawArrowsWith`, `monDepthWith`, `monSpawnWith`, `monTickWith`, `monHurtWith`, `monHitWith`, `monStrikeWith`, `drawMonsWith`, `mobsWith`. Werte: `ARROWS`, `MONS`. Zustand (`export let`): `tgtT`, `bowT`, `monT`.
- `src/systems/particles.js`: Teilchen erzeugen: Obergrenze, Funken, Rauch, Staub, Konfetti und Explosion.
  Funktionen: `pmaxWith`, `spawnWith`, `smokeWith`, `dustWith`, `confettiWith`, `explodeWith`.
- `src/systems/play.js`: Spielen in der Welt: Zellen zählen, Springen, Funde verstecken, Album, Sternentor, Bomben, Sonar, Entdecken, Disco, Tippen in die Welt (Regenwolke, Baum schütteln) und Fernrohr.
  Funktionen: `boxCountWith`, `teleportWith`, `placeFindWith`, `hideFindsWith`, `renderAlbumWith`, `orbsOfWith`, `portalTickWith`, `dropBombWith`, `blastWith`, `sonarTargetWith`, `discoverWith`, `discoWith`, `pupsWith`, `keyTapWith`, `rainCloudWith`, `shakeTreeWith`, `tapWorldWith`, `nearScopeWith`, `scopeOpenWith`, `scopeRenderWith`, `scopePickWith`, `sonarWith`.
- `src/systems/player/player.js`: Spielfigur: Modus wechseln, Laufen, Aktionstaste, Lift, Seilrutsche, Graben zu Fuß und das Update je Bild.
  Funktionen: `gravWith`, `parkWith`, `leaveVehicleWith`, `setModeWith`, `rotWith`, `bucketWith`, `scoopWith`, `drillHeadWith`, `doActionWith`, `burnWith`, `boundsXWith`, `wrapXWith`, `moverWith`, `updWalkWith`, `settleWith`, `updateWith`, `nearLiftWith`, `rideLiftWith`, `liftRideWith`, `zipOkWith`, `zipAddWith`, `zipNearWith`, `zipGoWith`, `zipRideWith`, `handDigWith`, `pushDigWith`.
- `src/systems/player/vehicles.js`: Fahrzeuge: Graben und Schaufeln, Fahren, Fliegen, Ski, Drache, U-Boot, Ballon, Hubschrauber, Boot, Kletterkäfer.
  Funktionen: `takeWith`, `pileWith`, `dumpAtWith`, `digWith`, `baggerActWith`, `loaderActWith`, `dumperActWith`, `boreWith`, `bulldozeWith`, `updCarWith`, `driveWith`, `updBaggerWith`, `updLoaderWith`, `updDumperWith`, `updTbmWith`, `updRocketWith`, `updPlaneWith`, `updCoasterWith`, `onSnowWith`, `updSkiWith`, `updRollWith`, `skiActWith`, `updDragonWith`, `meltWith`, `breatheWith`, `updSubWith`, `updBalloonWith`, `updHeliWith`, `heliHookWith`, `heliDropWith`, `boatWetWith`, `updBoatWith`, `bugWallWith`, `updBugWith`.
- `src/systems/quests.js`: Aufträge (PR 20): Einführungskette, Kette aus Tiefe und Höhe, Zufallsaufträge, Fortschritt, Anzeige und Zeiger.
  Funktionen: `skyMarkWith`, `skyDoneWith`, `gearStepWith`, `chainQuestWith`, `qEventWith`, `newQuestWith`, `prepFindWith`, `showQuestWith`, `renderQuestWith`, `questTickWith`, `questPointWith`, `questsWith`.
- `src/systems/sights.js`: Sehenswürdigkeiten (PR 17): Geysire, Sternschnuppen, Schiffswracks, Glühwürmchen und Kristallharfen, je mit tick und draw.
  Funktionen: `geysersWith`, `geyPhaseWith`, `geyTickWith`, `drawGeysWith`, `metSkyWith`, `metTickWith`, `drawMetsWith`, `wrecksWith`, `wreckTickWith`, `drawWrecksWith`, `flyTickWith`, `jarPosWith`, `drawFliesWith`, `harpTickWith`, `drawHarpsWith`, `sightsWith`. Zustand (`export let`): `GEYS`, `geyKey`, `METS`, `MROCKS`, `metNext`, `WRECKS`, `wrKey`, `FLIES`, `JAR`, `HARPS`, `harpKey`.
- `src/systems/tracks.js`: Schienen: die Vorführbahn neben dem Start.
  Funktionen: `demoTrackWith`.
- `src/systems/winter.js`: Winter-Leben: Schneebälle, Feuerwerk, Schneemänner, Pinguine und die Figuren am Schneeberg und am Vulkan.
  Funktionen: `throwBallWith`, `npcHitWith`, `ballsTickWith`, `fireworkWith`, `burstWith`, `fwsTickWith`, `addManWith`, `drawManWith`, `menTickWith`, `pinFlyWith`, `pensTickWith`, `hareTickWith`, `yetiPupsWith`, `yetiHitWith`, `yetiTickWith`, `fauTickWith`, `mamaTickWith`, `stEnterWith`, `winterTickWith`, `winterWith`.
- `src/systems/worldtick.js`: Was jede Sekunde in der großen Welt passiert.
  Funktionen: `worldTickWith`, `ufoTickWith`, `worldWith`.
- `src/systems/zones.js`: Unter Tage: Erkundungsnebel, Werkstatt-Stufen, Zonen und harte Schichten, Wissenstüren, Heimweg aus der Tiefe, Maschinen und Werkstatt-Nähe, Leuchtmarken speichern und Dunkelheit.
  Funktionen: `fRowWith`, `fogKeyWith`, `fogArrWith`, `fogSetWith`, `fogHasWith`, `fogSeedWith`, `fogSaveWith`, `gearLvWith`, `gearSetWith`, `stationYWith`, `zoneAtWith`, `shellOkWith`, `doorColsWith`, `doorShutWith`, `nearDoorWith`, `doorPzWith`, `doorAskWith`, `doorOpenWith`, `deepHomeWith`, `deepRestoreWith`, `canBuildWith`, `labBadgeWith`, `nextMachWith`, `nearMachWith`, `nearCabWith`, `atLabWith`, `deepIconWith`, `deepActWith`, `deepTapWith`, `matWhereWith`, `guidePointWith`, `mkKeyWith`, `mkSaveWith`, `darkAtWith`.

#### render

- `src/render/cells.js`: Zellen malen: Farbpaletten der Welt und der Länder, Farben der Tiefe, Paletten fremder Welten und das Zellbild.
  Funktionen: `pal`, `setPal`, `drawCellsWith`.
- `src/render/draw.js`: Zeichnen: Ein Bild der Welt, von hinten nach vorn: Himmel, Hügel, Welt, Systeme, Fahrzeuge, Held, Flüssigkeiten, Teilchen, Stimmung, Zeiger.
  Funktionen: `drawWith`, `fillCellsWith`.
- `src/render/hints.js`: Hinweise malen: Funkelstern und Pfeil zu einem Ziel (im Bild darüber, sonst am Bildrand)
  Funktionen: `star4With`, `pointToWith`.
- `src/render/scenery.js`: Kulisse und Zeichenhelfer: Rundrechteck, Kreis, Farbmischung, Emoji, Pfeil, Knopf, Bäume, Wolken, Weltraum, Hügel, Dunkelheit, ferner Weltraum, Nebel, Funde, Requisiten …
  Funktionen: `rrWith`, `circleWith`, `mixWith`, `lerpCWith`, `emoWith`, `arrowWith`, `knobWith`, `drawTreeWith`, `drawCloudWith`, `drawSpaceWith`, `hillsWith`, `drawDarkWith`, `drawFarWith`, `drawNebulaWith`, `drawFindsWith`, `drawPropWith`, `drawDoorWith`, `drawScopeWith`.
- `src/render/vehicles.js`: Fahrzeuge und Held malen: Kopf, Kind, Fallschirm, Auto, Bagger, Radlader, Kipper, Tunnelbohrer, Rakete, Flugzeug, Lore, U-Boot, Ballon, Hubschrauber, Boot, Käfer, Seilrutschen …
  Funktionen: `headWith`, `drawKidWith`, `drawChuteWith`, `drawCarWith`, `drawBaggerWith`, `drawLoaderWith`, `drawDumperWith`, `drawTbmWith`, `drawRocketWith`, `drawPlaneWith`, `drawCartWith`, `drawSubWith`, `drawBalloonWith`, `drawHeliWith`, `drawBoatWith`, `drawBugWith`, `drawZipsWith`, `drawHandToolWith`.
- `src/render/winter.js`: Winter malen: Schneemänner, Yeti, Drachen, Iglu, Lift mit Gondeln, Skifahrer, Schneeball-Rolle, Figuren am Berg, Schneebälle, Feuerwerk und Schneefall.
  Funktionen: `drawSnowmanWith`, `drawYetiWith`, `drawDragonWith`, `drawIglooWith`, `drawGondolaWith`, `drawStationWith`, `drawLiftWith`, `drawSkierWith`, `drawRollWith`, `drawWinterWith`, `drawFrontWith`, `drawSnowfallWith`.
- `src/render/world.js`: Die große Welt malen: Stimmung, Pflanzen, Deko, Sprungpilze, Geheimnisse, Planeten, Werkstatt, Aufzug, Maschinen und Leuchtmarken in der Tiefe.
  Funktionen: `moodWith`, `drawMoodWith`, `drawFloraWith`, `drawDecoWith`, `drawPadWith`, `drawEggWith`, `drawSecretsWith`, `drawOrbWith`, `drawWorldBackWith`, `drawWorldFrontWith`, `gearShapeWith`, `drawLabWith`, `drawCabWith`, `drawMachWith`, `drawMatWith`, `drawBoneWith`, `drawCryWith`, `drawMarkWith`, `drawDeepWith`.

#### ui

- `src/ui/backup.js`: Spielstand umziehen (Bedienung): Datei speichern oder teilen, Datei wählen und prüfen.
  Funktionen: `bakDoneWith`, `bakSaveWith`, `bakPickWith`.
- `src/ui/bind.js`: Bedienung verdrahten: Tastenbilder in die Knöpfe, Fahrzeug- und Werkzeugkarten, Klicks auf Leiste, Menü, Fenster, Hand, Ton, Vollbild, Umzug, Neue Welt.
  Funktionen: `uiBindWith`.
- `src/ui/controls.js`: Bedienung: Tastenbilder einsetzen, Tippen und Halten, linke oder rechte Hand, Vollbild, Bombenzahl im HUD.
  Funktionen: `hudLootWith`, `svg24With`, `armGhostWith`, `tapWith`, `holdWith`, `syncHandWith`, `fsOnWith`, `fsSyncWith`, `fsToggleWith`.
- `src/ui/hud.js`: Oberfläche: Werkzeug wählen, Leiste abgleichen, Knopf-Puls, Blitz, Banner, Sprechblasen und Ansagen, Belohnung, Besitz, Aktionsknopf.
  Funktionen: `setToolWith`, `syncUIWith`, `pulseWith`, `flashWith`, `bannerWith`, `postMaxWith`, `uiOpenWith`, `syncSoundWith`, `puffWith`, `shoutWith`, `flXWith`, `sayWith`, `laterWith`, `tellWith`, `rewardWith`, `syncOwnWith`, `qEmoWith`, `actIconWith`.
- `src/ui/icons.js`: Bilder für die Tasten: SVG-Pfade für Fahrzeuge, Werkzeuge, Aktionen und Aufgaben (Tinte K, Strichstile S1, S2)
  Werte: `K`, `S1`, `IC`, `AI`, `S2`, `QI`.
- `src/ui/keys.js`: Tastenkürzel und Wischen: Kürzel für dieselben Knöpfe wie in der Leiste; Wischen nur, wo ein Fenster mehr Inhalt als Platz hat.
  Funktionen: `keyShortWith`, `canScrollWith`, `keysBindWith`.
- `src/ui/learn.js`: Lernen auf dem Bildschirm: Akku-Anzeige, Lernaufgabe mit Ziffernblock, Rechentafel.
  Funktionen: `renderBattWith`, `needWith`, `openQuizWith`, `closeQuizWith`, `nextQWith`, `holeShowWith`, `padKeyWith`, `padSubmitWith`, `answerWith`, `winWith`, `loseWith`, `tafCellWith`, `renderTafelWith`, `openTafelWith`.
- `src/ui/map.js`: Karten, Werkstatt und Aufzug: Reisekarte, Erkundungskarte, goldene Eier, Werkstatt von Professor Zahnrad, Aufzugskarten.
  Funktionen: `renderMapWith`, `renderFogWith`, `mapClickWith`, `renderEggsWith`, `eggClickWith`, `missingWith`, `renderLabWith`, `openLabWith`, `labBuildWith`, `renderMineWith`, `openMineWith`, `liftGoWith`, `labBindWith`.
- `src/ui/paint.js`: Malen mit dem Finger: Bildschirm zu Welt, Pinsel, Radierer, Zauberkasten-Kosten, Werkzeuge je Finger, Loslassen.
  Funktionen: `toWorldWith`, `discWith`, `eraseWith`, `paintCountWith`, `paintAtWith`, `paintPayWith`, `paintDoWith`, `paintStepWith`, `endPointerWith`, `ptrBindWith`.
- `src/ui/parent.js`: Elternansicht: Schranke, Auswertung des Spielprotokolls, Schulstand, Neuigkeiten, Speicher, Fehler, Stimme, Übungsblatt, Rechentafel-Balken.
  Funktionen: `pgOpenWith`, `pgDrawWith`, `parOpenWith`, `parGetWith`, `medWith`, `pctWith`, `minsWith`, `guessedWith`, `parLoadWith`, `parRenderWith`, `parSandWith`, `parSchoolWith`, `parNewsWith`, `parSafeWith`, `parStoreInfoWith`, `parErrWith`, `parVoiceWith`, `sheetOkWith`, `sheetPickWith`, `sheetLineWith`, `sheetPrintWith`, `escWith`, `fLabelWith`, `parStumbleWith`, `parFactsWith`, `parBarsWith`, `parBindWith`.
- `src/ui/puzzles.js`: Rätselrahmen und Rätsel auf dem Bildschirm: Öffnen, Zeichnen, Antippen, Tipps, Ansagen, Gewinnen.
  Funktionen: `tokWith`, `pzLaterWith`, `pzClearWith`, `pzCellWith`, `pzOpenWith`, `pzDrawWith`, `pzCloseWith`, `pzHintMaxWith`, `pzHintUiWith`, `pzFailWith`, `pzRevealWith`, `pzWinWith`, `tkHtmlWith`, `drMusterWith`, `acMusterWith`, `hiMusterWith`, `syMusterWith`, `stSideWith`, `drSternWith`, `stLineWith`, `acSternWith`, `hiSternWith`, `sySternWith`, `spWantWith`, `spGridWith`, `drSpiegelWith`, `spDoneWith`, `acSpiegelWith`, `hiSpiegelWith`, `sySpiegelWith`, `drRoboWith`, `acRoboWith`, `rbRunWith`, `hiRoboWith`, `syRoboWith`, `wgDiffWith`, `wgWWith`, `drWaageWith`, `poWaageWith`, `acWaageWith`, `hiWaageWith`, `syWaageWith`, `drRohreWith`, `rhPaintWith`, `acRohreWith`, `hiRohreWith`, `syRohreWith`, `pzBindWith`.

#### app

- `src/app/app.js`: Abläufe: Start mit Laden und Rettung, Bildschleife, Reisen zwischen den Welten, neue Welt.
  Funktionen: `restoreWith`, `newRealmWith`, `travelWith`, `arriveWith`, `resetWorldWith`, `frameWith`, `startWith`.
- `src/app/wire.js`: Verdrahtung (Composition Root): Zustand, Ports und Einzeiler, die die Module verbinden, Handler beim Laden und der Start.
  Funktionen: `wire`.

#### main

- `src/main.js`: Einstieg für den Build: verdrahtet und startet das Spiel (app/wire.js).
<!-- /doc.mjs -->

## 5. Ablauf

**Laden.** Beim Ausführen des Bundles laufen die Module in Importreihenfolge (Konstanten, Typed Arrays der Welt, Heimat aus festem Zufallsstrom `rng(20261004)`), dann `wire()`: Zustand und Ports, Lernkern laden (Fakten, Meistersteine), Handler an DOM und Leinwand binden (`uiBindWith`, `keysBindWith`, `parBindWith`, `pzBindWith`, `labBindWith`, `ptrBindWith`), zuletzt `start()`. Läuft die Seite als claude.ai-Artefakt mit `window.claude.hot`, startet sie über `hot.ready`.

**Start** (`app/app.js`, `startWith`): Größe setzen, Spielstand aus IndexedDB lesen. Ein Stand, der sich nicht laden lässt, wird als `rescue-…` gerettet statt überschrieben; eine Datenbankstörung beim Start überschreibt nichts. Danach `ST.ready=true`, Protokoll starten, Oberfläche abgleichen, Auftrag, Hinweise, erstes Bild bestellen.

**Bild** (`frameWith`): Zuerst das nächste Bild bestellen (ein Fehler friert nichts ein). Protokoll und Tageszeit zählen. Solange kein Fenster offen ist: höchstens zwei feste Schritte zu 1/30 s mit `paintStep()` und `step()` (Zellautomat), dann `update(dt)` (Spielfigur, Fahrzeuge, Kamera) und jedes Nebensystem aus `SIDE` über `safe()`. Gezeichnet wird mit `draw()` jedes Bild, ohne Berührung jedes zweite, hinter einem Fenster jedes zehnte. Ist das Gerät zu langsam, sinkt die Auflösung stufenweise.

**Fehlerschutz.** `safe(f, dt)` fängt Fehler je Nebensystem; nach drei Fehlern schaltet sich nur dieses System ab und steht in `lavaland-err`. Ein Fehler im Bild selbst landet ebenfalls dort, die Schleife läuft weiter.

**Speichern.** Automatisch in Häppchen (`autosave`), sofort beim Verlassen der Seite (`visibilitychange`), bei Reisen und an Haltepunkten. Held, Funde und Lernstand liegen in `localStorage`, die Welt in IndexedDB.

## 6. Spielstand

Namen stehen alle in `src/persistence/keys.js`. Ein anderer Name hieße, dass ein Kind seinen Stand verliert; `tests/static.mjs` und `tests/golden.mjs` halten sie fest.

| Ort | Name | Inhalt, Format |
|---|---|---|
| IndexedDB `lavaland` (Version 1), Ablage `save` | `world2` | Erde: `{v:5, w:2, vt:1, rl, gy, f, seed, runs, …}`, Zellen spaltenweise als Läufe (`core/world/pack.js`). |
| | `planet-<id>` | je Planet dasselbe Format. |
| | `world`, `world-alt`, `world-v3` | ältere Formate (v2–v4), bleiben liegen und bleiben lesbar. |
| | `rescue-…` | nicht ladbarer Stand, gerettet; steht in der Elternansicht. |
| IndexedDB `lavaland-log` | Ablagen `ev`, `day` | Spielprotokoll und Tagesbilanz; Version steigt, wenn eine Ablage fehlt. |
| `localStorage` | `lavaland-hero`, `-finds`, `-stars`, `-skill`, `-facts`, `-school`, `-limit`, `-day`, `-realm`, `-fog*`, `-marks*`, `-mute`, `-lefty`, `-psst`, `-news`, `-bak-at`, `-voice`, `-vmiss`, `-opt`, `-err`, `-mis` | Held, Funde, Lernstand (Leitner), Schulstand, Einstellungen, Karte, Fehlerprotokoll. |
| Sicherungsdatei | `{app:'lavaland', bak:1, at, ls, db}` | alle Schlüssel mit `lavaland` und beide Datenbanken (`persistence/transfer.js`). |

Regeln: Formate nur rückwärtskompatibel ändern; neue Daten bekommen neue Schlüssel. Neue Dinge in der Welt bekommen einen eigenen Zufallsstrom, damit bestehende Welten mit gleichem Seed gleich bleiben.

## 7. Build und Auslieferung

- `node tools/build.mjs` baut `index.html` (Produktion) und `dist/index.test.html` (Testbuild), `--check` vergleicht nur, `--watch` baut laufend. Grundlage: `src/index.html` mit den Marken `<!-- @css -->` und `<!-- @js -->`.
- **Testbuild:** An der Marke `/*@test-hook*/` in `wire()` steht `window.__lv`, ein Objekt mit Gettern für jeden dort sichtbaren Namen und Settern für `let`, `var` und `function`, erzeugt aus dem AST des fertigen Bundles. Ein eigenes Skript davor stellt `window.__ev(s)` bereit: Tests schreiben Ausdrücke, die über `with(window.__lv)` ausgewertet werden. Im Produktionsbuild gibt es beides nicht (`tests/prod.mjs`).
- **CSP** in `src/index.html`: nur eigene Quellen, Skript und Stil inline, kein `eval`. Keine fremden Skripte (`tests/static.mjs`).
- **Größenbudget:** 800 KB roh, 240 KB gzip (`tests/static.mjs`).
- **Auslieferung:** Jeder Merge auf `main` geht über GitHub Pages sofort live. Die gebaute `index.html` liegt im Repo (ADR 0002).
- **Service Worker** `sw.js`: lädt die Seite zuerst aus dem Netz, Dateien aus dem Cache. Ändert sich die Dateiliste, steigt `CACHE`.

## 8. Tests und was sie schützen

Alle laufen bei jedem PR (`test.yml` in Chromium, `firefox.yml` in Firefox, weil das Kind die Firefox-App nutzt) und jede Nacht länger mit neuen Zufallswerten.

| Prüfung | Schützt |
|---|---|
| `tools/build.mjs --check` | `index.html` ist aus `src/` gebaut. |
| `tests/static.mjs` | Syntax, Größenbudget, Element-IDs, Speicherschlüssel, keine fremden Skripte, Paketregeln. |
| `tsc -p .` | Typen (JSDoc) in allen Modulen außer `app/wire.js`. |
| `tools/arch/deps.mjs` | Schichtregeln, keine Zyklen. |
| `tools/arch/doc.mjs --check` | Diese Doku passt zum Code. |
| `tools/arch/movecheck.mjs` | Bewegter Code ist AST-gleich (Angaben in `tools/arch/moves.json`). |
| `tests/golden.mjs` | Welt-Determinismus, Zufallsreihenfolge, Speicherformat, Rätsel- und Aufgabengeneratoren gegen eingefrorene Hashes. **Fixtures werden nie aktualisiert.** |
| `tests/smoke.mjs` | Die wichtigsten Abläufe im Handy-Browser. |
| `tests/save.mjs` | Spielstand geht nie verloren: Rettung, Datenbankstörung, Sichern und Einspielen. |
| `tests/upgrade.mjs` | Ein Stand der Live-Version läuft nach dem Update weiter. |
| `tests/offline.mjs` | Start ohne Netz, bei langsamem Netz und Serverfehler. |
| `tests/prod.mjs` | Produktionsbundle startet mit echter CSP und ohne Testzugang. |
| `tests/pixels.mjs` | Bildvergleich mit `main` in festen Szenen. |
| `tests/fuzz.mjs`, `tests/crawl.mjs` | Keine Seitenfehler bei Zufallsspiel und beim Antippen von allem. |
| `tests/voice.mjs` | Warnt bei Vorlesesätzen ohne Aufnahme. |
| `tests/perf.mjs` | Misst `step`, `update`, `draw` für PRs, die sie berühren. |
