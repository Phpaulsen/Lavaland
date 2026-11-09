# Lavaland: Regeln für die Arbeit im Repo

Lernspiel für ein Kind der 1. Klasse, auf dem Handy (installierte Firefox-App). Jeder Merge auf `main` geht sofort live. Sprache im Repo: Deutsch.

Aufbau, Schichten mit Importtabelle, Module, Ablauf, Spielstand, Build und Tests: **[`docs/architecture/architecture.md`](docs/architecture/architecture.md)**. Hier stehen nur die Regeln.

## Verzeichnisse

- `src/`: Quelltext (ES-Module, JSDoc). `src/main.js` → `src/app/wire.js` (`wire()`, Verdrahtung).
- `index.html`: **gebaut, nie von Hand ändern.** Bei Konflikt neu bauen (ADR 0002).
- `tools/`: Build (`build.mjs`) und Prüfwerkzeuge (`tools/arch/`). `tests/`: Tests und eingefrorene Fixtures. `docs/architecture/`: Architektur, ADRs, Funde.

## Befehle

```
npm ci --ignore-scripts
node tools/build.mjs                 # index.html und dist/index.test.html
node tools/build.mjs --check         # Bundle aktuell
node tests/static.mjs && npx tsc -p .
node tools/arch/deps.mjs             # Schichtregeln
node tools/arch/doc.mjs              # Tabellen in architecture.md neu (CI prüft mit --check)
node tools/arch/movecheck.mjs        # bei Umzügen: AST-gleich gegen origin/main (tools/arch/moves.json)
node tests/smoke.mjs; node tests/golden.mjs; node tests/save.mjs; node tests/offline.mjs; node tests/prod.mjs
OLD=alt.html node tests/upgrade.mjs; OLD=alt.html node tests/pixels.mjs   # alt.html = git show origin/main:index.html
FUZZ_SEC=45 node tests/fuzz.mjs; CRAWL_N=300 node tests/crawl.mjs; node tests/perf.mjs
BROWSER=firefox node tests/smoke.mjs  # Firefox zählt: Darin spielt das Kind
```

## Schichten

`core` → `state` → `persistence`/`log`/`audio` → `systems`/`render`/`ui` → `app` → `main.js`. Erlaubt ist nur, was die Tabelle in `tools/arch/deps.mjs` (`ALLOW`) sagt; was eine Schicht nicht importieren darf, bekommt sie als Port vom `app`. `core/` rechnet nur: kein DOM, kein Speicher, kein `ctx.`, kein `Math.random` (Zufall als Parameter). Ausnahmen nur per ADR (z. B. Zellautomat in `state/sim.js`, ADR 0001 Punkt 17).

## Invarianten

- **Spielstand nie brechen.** Namen in `src/persistence/keys.js` nie ändern. Formate nur rückwärtskompatibel; neue Daten bekommen neue Schlüssel.
- **Welt-Determinismus und Zufallsreihenfolge.** Gleicher Seed, gleiche Welt. Neue Dinge bekommen einen eigenen Zufallsstrom; die Reihenfolge der Zufallsaufrufe bleibt.
- **Golden-Master-Fixtures (`tests/fixtures/`) werden nie aktualisiert.** Wird `golden.mjs` rot, ist die Änderung falsch. Einzige Ausnahme: ausdrücklich verhaltensändernde Streich-PRs, die jeden geänderten Hash im PR-Text nennen (ADR 0001).
- **Fehlerschutz.** Das nächste Bild wird zuerst bestellt; Nebensysteme laufen über `safe()`, nach drei Fehlern schaltet sich nur das eine ab.
- **CSP** in `src/index.html` bleibt: keine fremden Quellen, kein `eval` im Produktionsbuild.
- **Größenbudget** 800 KB roh, 240 KB gzip.
- **`CACHE` in `sw.js`** hochzählen, wenn sich die Dateiliste ändert.
- **Heiße Pfade** (`step`, `update`, `draw`, Zellautomat) nie über Getter, `ST` oder ein Weltobjekt, ohne vorher mit `tests/perf.mjs` zu messen.
- Die Fassade heißt `ST`, nie `G` (`G` ist die Schwerkraft).

## Arbeitsweise

- Jede Änderung über einen PR mit grüner CI (Chromium und Firefox). Ein Schritt pro PR.
- Umbau-PRs sind verhaltensneutral und belegen das mit `movecheck.mjs`, Golden Master und Bildvergleich.
- Gefundene Fehler beim Umbau nicht nebenbei beheben, sondern in `docs/architecture/findings.md` eintragen.
- Neue Pakete nur mit ADR, ohne eigenen Abhängigkeitsbaum, Version mindestens zwei Wochen alt.
- Spielgestaltung: ohne Lesen spielbar; keine manipulativen Muster (Streaks, Lootboxen, Wartezeiten).
