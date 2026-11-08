# ADR 0001: Modularisierung von `index.html`

Status: vorgeschlagen (5.11.2026). Gilt nach Freigabe durch den Maintainer.

## Kontext

- Das ganze Spiel steht in `index.html`: 9 217 Zeilen, 572 KB, ein Skript mit einer IIFE und 1 198 Top-Level-Namen in einem Scope (`current.md`).
- 59 von 64 Sektionen hängen in einem Abhängigkeitszyklus, 182 Namen werden außerhalb ihrer Sektion geschrieben. Jede Änderung muss den ganzen Scope im Kopf haben; Reviews sind teuer.
- Jeder Merge auf `main` geht sofort live, auf dem Handy eines Kindes. Spielstände dürfen nie brechen, Welten müssen bei gleichem Seed gleich bleiben.
- Die Ein-Datei-Regel kam vom claude.ai-Artefakt. Die Auslieferung als eine Datei hat weiter Nutzen (`file://`, Artefakt, einfacher Offline-Cache), der Quelltext als eine Datei nicht.
- Die Tests greifen per `eval` in den IIFE-Scope und per Regex in den Quelltext (`current.md` Abschnitt 8).

## Entscheidung

Vom Maintainer festgelegt:

1. Auslieferung bleibt **eine selbstständige `index.html`**, Skript und CSS inline. Audio, Fonts, Icons bleiben Dateien.
2. Quelltext wird in **ES-Module** zerlegt, **esbuild** bündelt zurück. Keine Laufzeitabhängigkeiten, kein Framework.
3. **JavaScript mit JSDoc**, geprüft mit `tsc --noEmit --checkJs` in der CI. Kein TypeScript in dieser Migration.
4. **Strangler-Fig in kleinen PRs**, jeder verhaltensneutral mit grüner CI.
5. **Harter Stopp nach Phase 1** (diese Dokumente), Phase 2 erst nach Freigabe.

In `target.md` gewählt (offen für Einwände):

6. **Gebaute `index.html` wird committet** (Variante a), mit `linguist-generated`, CI-Prüfung „Bundle aktuell“ und Konfliktregel „neu bauen statt von Hand lösen“. Neu bewerten nach der Migration.
7. **Schichten** `core`, `state`, `persistence`, `log`, `audio`, `systems`, `render`, `ui`, `app`, `testing`, `main.js`, mit Importtabelle in `target.md` Abschnitt 3. `log` ist eine eigene Schicht neben `persistence`; `app` nimmt die Abläufe auf, die heute alles verbinden (`start`, `frame`, `travel`).
8. **Durchsetzung mit eigenem Skript** `tools/arch/deps.mjs` auf dem esbuild-Metafile statt dependency-cruiser.
9. **Übergangsfassade `G`** für neu zugewiesene globale Namen; Konstanten und Typed Arrays ziehen direkt um; heiße Schleifen ohne Getter.
10. **`core` bekommt Zufall als Parameter.** Im Spiel weiter `Math.random`, im Test ein fester Strom.
11. **esbuild ohne Minify.** Ursprünglich mit `keepNames`; in PR 1 verworfen, weil esbuild nur verdeckende lokale Namen umbenennt und die Top-Level-Namen (auch für das Fehlerprotokoll) gleich bleiben, geprüft durch `tools/arch/samecode.mjs`.
12. **Testzugang** über eine Marke `/*@test-hook*/`, die nur der Testbuild ersetzt, statt Text-Anker; langfristig benannte Test-API statt `eval`.
13. **Systemschnittstelle** `{ name, init, tick, draw(ctx, layer) }`, abgeleitet aus `SIDE`, gleiche Reihenfolge, gleicher Fehlerschutz, `name` = heutiger Funktionsname.

Vom Maintainer am 5.11.2026 entschieden:

14. **Streichen vor PR 16.** Die Streich-PRs aus `plan-vereinfachung.md` laufen nach PR 15 und vor dem Umzug der Systeme, als eigene verhaltensändernde PRs außerhalb der Migration (`migration-plan.md` Abschnitt 3).

Vom Maintainer am 7.11.2026 entschieden:

15. **Regeln für Pakete.** Keine Laufzeitabhängigkeiten. Neue Werkzeugpakete nur mit Begründung in einem ADR, ohne eigenen Abhängigkeitsbaum, in einer mindestens zwei Wochen alten Version. Feste Versionen, Prüfsummen im Lockfile, nur `registry.npmjs.org`, Install-Skripte aus. Die CI führt `npm audit` und `npm audit signatures` aus, auch im Nachtlauf. `tests/static.mjs` prüft die Regeln mechanisch.

Vom Maintainer am 8.11.2026 entschieden:

16. **Weltgenerierung in `core/` mit Weltobjekt.** `core/world/gen.js` bekommt Felder, Zustand und Ports der Welt als Parameter `WD` (PR 8b). Gemessen ohne Leistungsverlust.
17. **Zellautomat in `state/sim.js`, nicht in `core/`.** Über ein Weltobjekt verdoppelte sich die Rechenzeit von `step` (Median 0,27 → 0,56 ms, `perf.mjs`). Der Fensterzustand (`rx0`…`qx1`, `bx0`…, `px0`…, `winC`, `winR`, `sx0`, `tick`, Zähler) wird nur vom Automaten geschrieben; deshalb besitzt ihn das Modul, das ihn schreibt, und importiert `grid`, `stamp`, `LIFE` direkt. `Math.random` bleibt dort (Punkt 10 gilt für `core/`). Ausnahme von `target.md` Abschnitt 1 („Logik in `core/`“), bewusst für den heißesten Pfad.

## Verworfene Alternativen

- **Klassische `<script src>`-Dateien ohne Build** (so stand es in `plan-vereinfachung.md` 4b): kein Build-Schritt, aber weiter ein gemeinsamer globaler Scope (nur auf Dateien verteilt), keine Importgrenzen, keine Prüfung von Abhängigkeiten. Bricht außerdem `file://`/Artefakt als eine Datei. Verworfen durch Entscheidung 1 und 2.
- **Vite oder Rollup:** mehr Abhängigkeiten, Dev-Server und HTML-Pipeline, die hier niemand braucht. esbuild ist ein Binärpaket ohne weiteren Baum.
- **TypeScript sofort:** würde jeden Move mit Typannotationen vermischen und die Prüfung „gleicher Code nach Normalisierung“ unmöglich machen. Später als eigene Phase möglich.
- **Pages per Action aus `dist/` (Variante b):** sauberer, aber ändert den Auslieferungsweg genau während des riskantesten Umbaus und macht `upgrade.mjs` indirekt. Nach der Migration neu prüfen.
- **dependency-cruiser:** deckt mehr ab als nötig, zieht viele Pakete. Die Regeln passen in eine Tabelle.
- **Big Bang (alles in einem PR zerlegen):** nicht reviewbar, nicht bisektierbar, und jeder Merge geht live.
- **Zustand sofort als ein `state`-Objekt mit Parametern überall:** fasst in einem PR Hunderte Stellen an. Die Fassade `G` verteilt das auf die PRs, die das jeweilige System ohnehin bewegen.

## Konsequenzen

- Neu im Repo: `package.json`, `package-lock.json`, `src/`, `tools/build.mjs`, `tools/arch/*`, `tsconfig.json`, `.gitattributes`, `dist/` in `.gitignore`.
- Jede Änderung am Spiel läuft danach über `src/` und `node tools/build.mjs`. Wer `index.html` direkt ändert, bekommt Rot in der CI.
- PR-Diffs enthalten das Bundle zusätzlich (zugeklappt). Parallele PRs konfligieren in `index.html`; Lösung ist neu bauen.
- Während der Migration keine Feature-PRs auf `legacy.js`-Teilen, die gerade umziehen. Offene PRs gegen `index.html` (derzeit #92) werden vor PR 1 gemergt oder danach auf `src/legacy.js` übertragen.
- Golden-Master-Fixtures für Welt und Speicherformat sind ab PR 2 eingefroren. Ein Move, der sie ändert, ist falsch.
- Die Fassade `G` kostet in kalten Pfaden Getter-Aufrufe. Heiße Schleifen sind davon ausgenommen; ein Leistungsvergleich gehört in jeden PR, der `step`, `draw` oder `update` berührt.
- Der Speicherverbrauch der Welt (78,6 MB) und die geplante Vereinfachung sind nicht Teil dieses ADR. Die Struktur (`state/world.js`) ist so gewählt, dass beides danach lokal möglich ist.
