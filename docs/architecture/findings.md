# Befunde aus der Ist-Analyse

Nur notiert, nicht behoben. Jeder Eintrag mit Beleg. „geprüft“ heißt: im Browser nachgestellt; „gelesen“ heißt: aus dem Code abgeleitet, nicht nachgestellt.

## Fehler

**F1. Spielstart bricht ab, wenn Fakten in Fach 4/5 liegen, aber `FS.mg` fehlt.** (geprüft)
`index.html:7559` läuft beim Laden sofort und liest `MBOX`, das erst in `index.html:7660` als `const` deklariert ist. Ergebnis: `ReferenceError: Cannot access 'MBOX' before initialization`, das Skript endet, `start()` läuft nie, der Bildschirm bleibt leer. Nachgestellt mit `localStorage['lavaland-facts'] = {"v":1,"f":{"a:3+4":[4,0]}}` in Chromium: `ready` wird nie wahr, einziger Seitenfehler ist dieser. Betroffen: ein Stand aus der Zeit vor 908755b („Bohrer ab Stufe 2 braucht Meistersteine“), der seitdem nicht gestartet wurde, **oder** der Import einer älteren Sicherungsdatei über „Spielstand umziehen“. Danach scheitert jeder Start, bis `lavaland-facts` gelöscht wird. Die Rettungslogik in `start()` greift nicht, weil der Abbruch vorher passiert. Mechanisch gefunden mit `tools/arch/analyze.mjs` (Abschnitt `tdz` in `current.md`).

**F2. Speichern und Akku-Verbrauch können für die Sitzung still abgeschaltet werden.** (gelesen)
`autosave` und `drain` stehen in `SIDE` (`index.html:9127`) und laufen über `safe()` (`9129`): Nach drei Fehlern wird die Funktion für die Sitzung nicht mehr aufgerufen. Bei `autosave` bleibt nur noch das Speichern beim Verlassen (`visibilitychange`, `9210`), Funde und Held werden nicht mehr laufend gesichert. Bei `drain` leert sich der Akku nicht mehr, Fahrzeuge und Werkzeuge sind dann ohne Denken nutzbar. Beides steht nur im Fehlerprotokoll.

**F3. Ein Fehler beim Zeichnen eines Porträts lässt `ctx` auf dem falschen Canvas.** (gelesen)
`portrait` (`index.html:4196`) hängt den globalen `ctx` auf einen anderen Canvas um und setzt ihn erst am Ende zurück (`ctx=old`), ohne `try/finally`. Wirft eine der Zeichenfunktionen dazwischen, zeichnet das ganze Spiel bis zum Neuladen in das Porträt. `frame()` fängt den Fehler (`9122`), setzt aber nur die Transformation zurück, nicht den Kontext.

## Ungereimtheiten zwischen Entscheidungen, README und Code

**U1. Eingefrorene Rätsel erscheinen weiter in der Welt.** `echo` und `sudoku` stehen in beiden Spawn-Listen (`index.html:5766`, `5872`) und in `PZT` (`6458`, `6460`). Laut Entscheidung vom 19.10. eingefroren, laut `plan-vereinfachung.md` Schritt 1 „aus dem Spawn nehmen“.

**U2. README nennt fünf Rätsel, im Spiel sind acht.** README „Was das Kind tut“: Muster, Spiegel, Waage, Roboter, Sternbild. Im Code zusätzlich Kristall-Echo, Rohre, Bilder-Sudoku (`PZT`, `index.html:6453`). Rohre ist laut Plan das meistgespielte Rätsel und bleibt.

**U3. Glücks-Upgrade ist noch drin.** `hero.up.luck` (`index.html:3163`), Marktposten (`3195`), Wirkung „öfter doppelt Gold“ (`1989`). Laut Plan Schritt 1 „ersatzlos raus“, weil Zufallsbonus.

**U4. Tägliches Geschenk.** `start()` gibt einmal am Tag 20 Gold (`index.html:9147`–`9149`, Kommentar „Kein Zähler“). Es ist keine Serie, aber eine Belohnung fürs Öffnen. Gegen die Leitlinie „keine manipulativen Muster“ prüfen.

**U5. Speicherschlüssel im README unvollständig.** Im Code, nicht in der README-Tabelle: `lavaland-mis` (Missionen, `index.html:3445`), `lavaland-vmiss` (fehlende Sprachclips, `2574`), `lavaland-alive` (`8621`, beim Sichern ausgenommen, `7337`), `lavaland-skill` (alter Zähler, nur gelesen, `7544`). Für die Invariante „Schlüssel byte-identisch“ ist die README-Tabelle damit keine vollständige Liste; maßgeblich ist der Code.

## Toter Code

**T1. Deklariert, nie benutzt** (AST, ohne Testbezug): `SKY_TOP`, `SKY_END` (`index.html:928`), `PM` (`1090`, nur für `PMC` in derselben Zeile), `numOpts` (`7485`), `SKY_T`, `SKY_B` (`7923`).

## Struktur und Risiken für die Migration

**R1. Speicher.** `grid` und `life` belegen zusammen 78,6 MB (`index.html:924`, `950`), unabhängig davon, wie viel der Welt sichtbar ist. Offener PR #92 halbiert das. Wahrscheinliche Ursache der Abstürze in Firefox auf Android.

**R2. Testzugang hängt an einer Textzeile und an `eval`.** `tests/server.mjs:7` sucht die Zeile `index.html:9210` wörtlich. Jede Umformatierung (esbuild) bricht alle Browser-Tests. Behandlung: `target.md` Abschnitt 8.

**R3. Quellprüfungen hängen an einfachen Anführungszeichen.** `tests/static.mjs` (IDs, `localStorage`-Präfix) und `tools/voice/collect.mjs:20` (Vorlesesätze) suchen `'…'`. esbuild gibt `"…"` aus. Behandlung: `target.md` Abschnitt 6.

**R4. Fehlerprotokoll nutzt Funktionsnamen.** `safe()` schreibt `f.name` (`index.html:9131`). Umbenennung durch den Bundler würde Einträge in `lavaland-err` ändern. Behandlung: `keepNames`.

**R5. Gold ohne Speichern.** 15 Sektionen ändern `gold`, jede muss danach von Hand `lootDirty=true` setzen (`current.md` Abschnitt 4). Kein Fehler nachgewiesen, aber eine Falle für jeden, der Code bewegt.

**R6. U-Boot-Sektion als Sammelbecken.** `S33` (`index.html:4698`–`5301`, 604 Zeilen, 87 Namen) enthält neben dem U-Boot auch Geysire, Meteore, Wrack, Glühwürmchen, Harfe und Monster. Der Titel sagt das nicht.

**R7. App und Browser-Tab überschreiben sich gegenseitig** (bekannt seit #84, kein Fix). Beide schreiben in dieselbe IndexedDB, wenn sie gleichzeitig offen sind. Die Migration ändert daran nichts.

**R8. Vorlesesätze-Sammler und eigene Skripte ohne `bypassCSP` scheitern gelegentlich an der CSP.** (geprüft, 8.11.2026)
`tools/voice/collect.mjs` öffnet den Testbuild ohne `bypassCSP` (die Browser-Tests setzen es, z. B. `tests/smoke.mjs:348`). Der Testzugang `window.__ev` ruft `eval`, die CSP im Testbuild erlaubt kein `unsafe-eval`. Meist geht es trotzdem durch, gelegentlich bricht `waitForFunction` mit `EvalError … 'unsafe-eval' is not an allowed source` ab: 1 von 10 Starts auf dem Stand nach PR 8a, 0 von 10 nach PR 8b, zweimal an einem Tag beim Sammler. Unabhängig von den Umzügen. Folge: In der CI kann der Schritt „Vorlesetexte haben Aufnahmen“ rot werden, ohne dass sich etwas geändert hat. Behebung (eigener PR): `bypassCSP: true` im Kontext von `collect.mjs`.

**R9. Knopftest hing in Firefox (CI) am Druckfenster.** „Übungsblatt drucken“ (`#par-sheet`) ruft `window.print()`; Firefox hält die Seite dafür an. Beide roten Firefox-Läufe vom 8.11. (#109, #111) endeten direkt nach dem Tipp auf `par-sheet`, die Ursache der Hänger „3 von 10“ seit #103. Behoben im Test: `tests/crawl.mjs` ersetzt `window.print` vor dem Laden (wie Teilen und Herunterladen nicht ausgelöst werden). Das Spiel selbst ist unverändert. (geprüft, 8.11.2026)
