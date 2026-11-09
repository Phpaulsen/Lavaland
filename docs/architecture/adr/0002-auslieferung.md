# ADR 0002: Auslieferung nach der Migration

Status: entschieden (9.11.2026, Maintainer). Ersetzt die Vorläufigkeit von ADR 0001 Punkt 6.

## Kontext

- ADR 0001 Punkt 6 legte für die Migration Variante (a) fest: Die gebaute `index.html` wird committet, GitHub Pages liefert sie direkt aus. Nach der Migration sollte neu bewertet werden (Vergleich in `target.md`, Abschnitt „Entscheidung: gebaute `index.html` wird committet“).
- Die Migration ist mit PR 29g3 abgeschlossen: Der Code steht in Modulen, `legacy.js` ist gelöscht.
- Jeder Merge auf `main` geht sofort live, auf das Handy eines Kindes (installierte Firefox-App) und zu anderen Nutzern über GitHub Pages.
- Die Seite muss weiter als einzelne Datei laufen: direkt geöffnet (`file://`) und als claude.ai-Artefakt.

## Entscheidung

**(a) bleibt: `index.html` bleibt gebaut im Repo**, GitHub Pages liefert sie aus `main` aus. Kein Deploy-Workflow.

## Begründung

- **Ein Ausfallgrund weniger.** Mit (b) hinge jede Auslieferung an einem Actions-Workflow und an der Pages-Quelle „GitHub Actions“. Ein Fehler dort wäre ein zweiter, vom Code unabhängiger Weg, auf dem das Spiel des Kindes kaputtgehen kann.
- **Was live ist, steht im Repo.** `git show main:index.html` ist wörtlich die Seite, die das Kind spielt. `tests/upgrade.mjs` und `tests/pixels.mjs` vergleichen damit, ohne `main` neu zu bauen.
- **Eine Datei zum Mitnehmen.** Für `file://` und das Artefakt reicht die Datei aus dem Repo, kein Release-Download.
- Die Kosten von (a) sind beherrscht: `.gitattributes` klappt das Bundle im Diff zu, die CI prüft „Bundle aktuell“, Konflikte in `index.html` werden durch Neubauen gelöst.

## Verworfene Alternative

- **(b) Pages per Action aus `dist/`:** saubere Diffs, keine Konflikte im Bundle, Quelle und Bundle können nicht auseinanderlaufen. Dafür ein neuer Auslieferungsweg, eine indirekte Upgrade-Prüfung und ein Download für `file://`. Der Gewinn ist Bequemlichkeit beim Review; das Risiko trifft das Spiel. Verworfen.

## Konsequenzen

- Unverändert: `index.html` nie von Hand ändern, sondern `src/` ändern und `node tools/build.mjs`. Die CI scheitert, wenn das Bundle nicht zu `src/` passt.
- Jeder PR enthält das Bundle zusätzlich (zugeklappt). Parallele PRs konfligieren in `index.html`; Lösung ist neu bauen.
- Neu bewerten, wenn einer dieser Fälle eintritt: Konflikte in `index.html` kosten regelmäßig Zeit, das Bundle überschreitet das Größenbudget, oder die Auslieferung braucht ohnehin einen Build-Schritt (z. B. Dateien mit Hash im Namen).
