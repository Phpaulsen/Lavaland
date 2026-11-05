# Ist-Architektur von Lavaland

Stand: `main` @ 76ae808 (5.11.2026, nach #91). Die Tabellen zwischen den `arch:`-Marken erzeugt `tools/arch/analyze.mjs`, der Text drumherum ist von Hand. Neu erzeugen:

```
npm i --no-save --no-package-lock acorn@8.19.0
node tools/arch/analyze.mjs --write docs/architecture/current.md
```

## 1. Aufbau der Datei

| Teil | Zeilen in `index.html` | Inhalt |
|---|---|---|
| Kopf | 1–2 | CSP (`script-src 'self' 'unsafe-inline'`, kein `unsafe-eval`), Manifest, Icons |
| CSS | 3–615 | ein `<style>`-Block |
| Markup | 616–784 | HUD, Tasten, alle Fenster (`.ov`), `#quiz`, `#pz`, `#panel` |
| Skript | 785–9215 | **ein** `<script>`, darin **eine IIFE** mit `'use strict'` (786–9214) |

Folgen der IIFE (Zeile 786, Ende 9214): Kein Name ist von außen erreichbar, auch nicht über `window`. Alle 1 198 Top-Level-Namen teilen sich einen Funktions-Scope. Die Tests kommen nur hinein, weil `tests/server.mjs` beim Ausliefern direkt vor einer festen Textstelle (`ANCHOR`, `tests/server.mjs:7`, im Spiel `index.html:9210`) `window.__ev=function(s){return eval(s);};` einsetzt. Direktes `eval` in der IIFE sieht jeden Namen. Das funktioniert nur mit `bypassCSP: true`, denn die CSP verbietet `eval`.

Zahlen insgesamt:

<!-- arch:summary -->
Gemessen an `index.html` (9217 Zeilen, 572 KB). Skript: Zeilen 786–9214, eine IIFE mit `'use strict'`.

| Größe | Wert |
|---|---|
| Sektionen (Kommentarmarken) | 64 |
| Top-Level-Namen im IIFE-Rumpf | 1198 (function 654, const 317, let 227, var 0) |
| Funktionen insgesamt (inkl. innerer und Pfeilfunktionen) | 1341 |
| Funktionen > 150 Zeilen | 1 |
| Bezüge auf Top-Level-Namen | 15754, davon sektionsübergreifend 11830 |
| Kanten zwischen Sektionen | 700 |
| Zustand, der außerhalb der eigenen Sektion geschrieben wird | 182 Namen |
| Größter Zyklus (Sektionen) | 59 von 64 |
| Größter Zyklus (Gruppen) | 17 von 20 |
| `Math.random()` | 288 Aufrufe |
| Von Tests angesprochene interne Namen | 132 |
<!-- /arch:summary -->

Hinweis zur Zählung: Der Auftrag nannte ≈900 Top-Level-Deklarationen. Das AST-Skript zählt jeden Namen einzeln, auch mehrere in einer `const a=…, b=…`-Zeile (z. B. `index.html:924` deklariert 17 Namen). 1 198 ist die belastbare Zahl.

Der Code ist dicht: viele Anweisungen pro Zeile. Nur eine Funktion hat mehr als 150 Zeilen, nach Zeichen gibt es aber mehrere mit 3 000–12 000 Zeichen (Abschnitt 5).

## 2. Sektionen

Grenzen sind die Kommentarmarken `/* ---------- Titel ---------- */`. Die Spalte „Gruppe“ fasst Sektionen nach Zuständigkeit zusammen (Zuordnung per Titel in `GROUPS`, `tools/arch/analyze.mjs`). DOM = `$('…')`, `document.*`, `innerHTML=`, `classList`; Handler = `addEventListener`, `on…=`; Canvas = Aufrufe auf `ctx`/`octx`/`dkx`; Speicher = `localStorage`, `indexedDB`, `idbDo(`.

<!-- arch:sections -->
| Nr | Sektion | Gruppe | Zeilen | Länge | Namen | DOM | Handler | Canvas | Speicher | `Math.random` | `rng`/`hash2` |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S00 | (Vorspann: Fehlerprotokoll, Canvas, Optionen) | Vorspann | 786–807 | 22 | 11 | 2 | 2 | 0 | 4 | 0 | 0 |
| S01 | Bilder für die Tasten | Tastenbilder | 808–921 | 114 | 7 | 0 | 0 | 0 | 0 | 0 | 0 |
| S02 | Welt | Welt | 922–964 | 43 | 62 | 0 | 0 | 0 | 0 | 0 | 0 |
| S03 | Schneeberg | Welt | 965–1080 | 116 | 54 | 0 | 0 | 0 | 0 | 0 | 5 |
| S04 | Große Welt | Welt | 1081–1086 | 6 | 32 | 0 | 0 | 0 | 0 | 0 | 0 |
| S05 | Andere Welten | Welt | 1087–1827 | 741 | 58 | 0 | 0 | 0 | 0 | 13 | 8 |
| S06 | Bäume, Wolken | Welt | 1828–1845 | 18 | 4 | 0 | 0 | 0 | 0 | 0 | 2 |
| S07 | Schienen | Welt | 1846–1896 | 51 | 6 | 0 | 0 | 0 | 0 | 0 | 0 |
| S08 | Teilchen | Welt | 1897–1917 | 21 | 12 | 0 | 0 | 0 | 0 | 22 | 0 |
| S09 | Spielfigur | Held+Steuerung | 1918–2421 | 504 | 54 | 12 | 0 | 0 | 0 | 60 | 0 |
| S10 | Malen mit dem Finger | Malen | 2422–2538 | 117 | 7 | 0 | 4 | 0 | 0 | 0 | 0 |
| S11 | Ton und Sprache | Ton+Sprache | 2539–2684 | 146 | 35 | 3 | 2 | 0 | 5 | 2 | 0 |
| S12 | Aufgaben | Lernen | 2685–2853 | 169 | 14 | 19 | 0 | 0 | 2 | 6 | 0 |
| S13 | Funde | Funde | 2854–2986 | 133 | 17 | 10 | 0 | 19 | 2 | 0 | 1 |
| S14 | Speichern | Speichern | 2987–3082 | 96 | 14 | 2 | 0 | 0 | 4 | 1 | 0 |
| S15 | Reisen zwischen den Welten | Reisen | 3083–3161 | 79 | 10 | 4 | 0 | 0 | 4 | 0 | 0 |
| S16 | Held, Verbesserungen und Markt | Held+Markt | 3162–3319 | 158 | 30 | 19 | 0 | 69 | 2 | 6 | 0 |
| S17 | Aufträge | Aufträge+Missionen | 3320–3443 | 124 | 15 | 15 | 0 | 0 | 0 | 0 | 0 |
| S18 | Missionen | Aufträge+Missionen | 3444–3739 | 296 | 31 | 8 | 0 | 70 | 2 | 3 | 0 |
| S19 | Winter | Winter+Geschichte | 3740–3777 | 38 | 30 | 6 | 0 | 5 | 0 | 11 | 0 |
| S20 | Lift | Winter+Geschichte | 3778–3791 | 14 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| S21 | Ski | Winter+Geschichte | 3792–3855 | 64 | 3 | 0 | 0 | 0 | 0 | 8 | 0 |
| S22 | Drachenflug auf Mama Glut | Winter+Geschichte | 3856–3889 | 34 | 3 | 0 | 0 | 0 | 0 | 5 | 0 |
| S23 | Schneebälle | Winter+Geschichte | 3890–3923 | 34 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| S24 | Feuerwerk | Winter+Geschichte | 3924–3943 | 20 | 3 | 0 | 0 | 0 | 0 | 6 | 0 |
| S25 | Schneemänner zum Hinstellen | Winter+Geschichte | 3944–3967 | 24 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| S26 | Pinguine | Winter+Geschichte | 3968–3989 | 22 | 2 | 0 | 0 | 0 | 0 | 5 | 0 |
| S27 | Die Figuren der Geschichte | Winter+Geschichte | 3990–4075 | 86 | 6 | 0 | 0 | 0 | 0 | 8 | 0 |
| S28 | Die Geschichte | Winter+Geschichte | 4076–4222 | 147 | 14 | 10 | 0 | 20 | 0 | 13 | 0 |
| S29 | Winter malen | Malen | 4223–4391 | 169 | 12 | 0 | 0 | 317 | 0 | 0 | 0 |
| S30 | Leben in der großen Welt | Leben (Tiere, U-Boot …) | 4392–4425 | 34 | 35 | 0 | 0 | 0 | 0 | 0 | 0 |
| S31 | Tiere | Leben (Tiere, U-Boot …) | 4426–4538 | 113 | 5 | 0 | 0 | 6 | 0 | 9 | 0 |
| S32 | Fundsachen | Leben (Tiere, U-Boot …) | 4539–4697 | 159 | 15 | 0 | 0 | 0 | 0 | 7 | 0 |
| S33 | U-Boot | Leben (Tiere, U-Boot …) | 4698–5301 | 604 | 87 | 8 | 1 | 533 | 0 | 66 | 0 |
| S34 | Was jede Sekunde in der großen Welt passiert | Leben (Tiere, U-Boot …) | 5302–5366 | 65 | 2 | 0 | 0 | 0 | 0 | 11 | 0 |
| S35 | Stimmung | Leben (Tiere, U-Boot …) | 5367–5397 | 31 | 2 | 0 | 0 | 12 | 0 | 0 | 0 |
| S36 | Die große Welt malen | Render | 5398–5575 | 178 | 10 | 0 | 0 | 288 | 0 | 0 | 0 |
| S37 | Karte zum Reisen und die Belohnungen für golde… | Karte | 5576–5591 | 16 | 1 | 2 | 0 | 0 | 0 | 0 | 0 |
| S38 | Erkundungskarte | Karte | 5592–5683 | 92 | 19 | 7 | 1 | 0 | 2 | 0 | 0 |
| S39 | Tiefe und Höhe | Tiefe+Werkstatt | 5684–5932 | 249 | 35 | 1 | 0 | 0 | 0 | 2 | 4 |
| S40 | Wissenstüren | Tiefe+Werkstatt | 5933–5997 | 65 | 14 | 3 | 0 | 3 | 0 | 0 | 1 |
| S41 | Jede Sekunde | Tiefe+Werkstatt | 5998–6144 | 147 | 15 | 1 | 0 | 0 | 0 | 4 | 0 |
| S42 | Werkstatt | Tiefe+Werkstatt | 6145–6202 | 58 | 4 | 11 | 1 | 0 | 0 | 0 | 0 |
| S43 | Aufzug | Tiefe+Werkstatt | 6203–6232 | 30 | 3 | 8 | 1 | 0 | 0 | 0 | 0 |
| S44 | Zeichnen | Render | 6233–6313 | 81 | 9 | 0 | 0 | 132 | 0 | 0 | 0 |
| S45 | Leuchtmarken | Karte | 6314–6446 | 133 | 16 | 3 | 1 | 99 | 2 | 0 | 0 |
| S46 | Rätselmaschinen | Rätsel | 6447–6563 | 117 | 19 | 24 | 2 | 0 | 0 | 0 | 0 |
| S47 | 1) Muster | Rätsel | 6564–6629 | 66 | 7 | 10 | 0 | 0 | 0 | 0 | 0 |
| S48 | Sternbild | Rätsel | 6630–6692 | 63 | 8 | 12 | 0 | 0 | 0 | 0 | 0 |
| S49 | 2) Spiegelbild | Rätsel | 6693–6729 | 37 | 9 | 1 | 0 | 0 | 0 | 0 | 0 |
| S50 | 3) Roboter | Rätsel | 6730–6832 | 103 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |
| S51 | 4) Waage | Rätsel | 6833–6908 | 76 | 8 | 5 | 0 | 0 | 0 | 0 | 0 |
| S52 | 5) Kristall-Echo | Rätsel | 6909–6953 | 45 | 9 | 0 | 0 | 0 | 0 | 0 | 0 |
| S53 | 6) Rohre | Rätsel | 6954–7063 | 110 | 13 | 5 | 0 | 0 | 0 | 2 | 0 |
| S54 | 7) Bilder-Sudoku | Rätsel | 7064–7121 | 58 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |
| S55 | Tasten | Held+Steuerung | 7122–7243 | 122 | 13 | 76 | 28 | 0 | 3 | 0 | 0 |
| S56 | Spielstand umziehen | Speichern | 7244–7390 | 147 | 18 | 4 | 0 | 0 | 12 | 0 | 0 |
| S57 | Vollbild im Browser-Tab (Android, Desktop) | Vollbild | 7391–7429 | 39 | 4 | 32 | 11 | 0 | 0 | 0 | 0 |
| S58 | Lernen | Lernen | 7430–7514 | 85 | 26 | 13 | 0 | 0 | 0 | 1 | 0 |
| S59 | Lernkern | Lernen | 7515–7909 | 395 | 49 | 37 | 8 | 0 | 5 | 5 | 0 |
| S60 | Zeichnen (2) | Render | 7910–8532 | 623 | 95 | 2 | 1 | 591 | 3 | 12 | 0 |
| S61 | Spielprotokoll für Eltern | Protokoll+Eltern | 8533–8682 | 150 | 1 | 8 | 3 | 0 | 4 | 0 | 0 |
| S62 | Elternansicht | Protokoll+Eltern | 8683–8938 | 256 | 40 | 25 | 5 | 0 | 4 | 0 | 0 |
| S63 | Rechentafel | Lernen | 8939–9214 | 276 | 31 | 36 | 6 | 3 | 15 | 0 | 0 |
<!-- /arch:sections -->

Zuständigkeit der Gruppen:

| Gruppe | Zuständigkeit | Auffällig |
|---|---|---|
| Vorspann | Fehlerprotokoll `lavaland-err`, `$`, Canvas `cv`/`ctx`, Elternoptionen `OPT` | `ctx` ist `let` und wird umgehängt (`portrait`, `index.html:4196`) |
| Tastenbilder | SVG-Pfade für Knöpfe (`IC`, `PIC`, `QI`) | reine Daten |
| Welt | Gitter `grid`/`life`/`stamp`, Zonengrenzen, Schneeberg, Länder, Planeten (`RLM`), Erzeugung (`shapeWorld`, `gen`, `genCol`), Packen/Laden der Zellen, Zellautomat `step`, Bäume, Schienen, Teilchen | Erzeugung ist frei von DOM und `Math.random`, schreibt aber 39 bzw. 21 globale Felder (Abschnitt 6). `step` nutzt `Math.random` |
| Held+Steuerung | Spielfigur `P`, Kamera, Fahrzeuge, `update`, Eingabe (Tasten, Zeiger) | `update` 6 055 Zeichen; Tasten-Sektion hat 28 Handler |
| Malen | Finger-Malen, Winterfiguren zeichnen | |
| Ton+Sprache | WebAudio, Sprachclips (`audio/index.json`), Browser-TTS | |
| Lernen | Akku, Lernkern (Leitner, `mkQ`, `nextQ`), Rechentafel, alte „Aufgaben“ in der Welt | `nextQ` zieht 84 Funktionen nach, darunter DOM und Speicher |
| Funde | Album, versteckte Dinge je Welt | zeichnet selbst (19 Canvas-Aufrufe) |
| Speichern | IndexedDB `lavaland`, `snapshot`/`restore`, Umzug per Datei | |
| Reisen | Weltwechsel `travel`, `newRealm` | mischt DOM-Überblendung und Speichern in einer Funktion |
| Held+Markt | `hero`, Upgrades, Markt, Begleiter, Hüte | 69 Canvas-Aufrufe (Vorschaubilder) |
| Aufträge+Missionen | `quest`, Missionsbrett `MS` | |
| Winter+Geschichte | Ski, Lift, Drache, Schneebälle, Feuerwerk, Schneemänner, Pinguine, 7 Kapitel | |
| Leben | Tiere, Fundsachen, U-Boot, Monster, Geysire, Wrack, Harfe, `worldTick` | U-Boot-Sektion ist mit 604 Zeilen ein Sammelbecken (87 Namen, 533 Canvas-Aufrufe) |
| Render | `draw`, Hintergrund, Flora, Paletten | `draw` 209 Zeilen, 11 650 Zeichen |
| Karte | Reisekarte, Erkundungskarte (Nebel), Leuchtmarken | |
| Tiefe+Werkstatt | tiefe Zonen, harte Schichten, Wissenstüren, Werkstatt, Aufzug | |
| Rätsel | Rahmen (`PZT`, `pzOpen`, `pzWin`) und 8 Rätsel | Jedes Rätsel hat `mk…/dr…/ac…/hi…/sy…`; nur `mk…` ist rein |
| Vollbild | Vollbild-Knopf, Service-Worker-Registrierung (`index.html:7412`) | |
| Protokoll+Eltern | `LOG` (IndexedDB `lavaland-log`), Elternansicht | |

## 3. Abhängigkeiten

Gemessen: Jeder Bezug auf einen Top-Level-Namen wird aufgelöst (eigene Scopes für `var`/`let`/`const`/`function`/`class`/`catch`/Parameter, Hoisting) und der Sektion zugeordnet, in der er steht. Kante A → B: Code in A liest, schreibt, verändert (Eigenschaft setzen, `push`, `fill`, `set` …) oder ruft einen Namen, der in B deklariert ist.

### Gruppen

<!-- arch:groups -->
Zeile benutzt Spalte. Zahl = Bezüge, `*` = schreibt oder verändert dabei Zustand der Spalte.

| benutzt → | G0 | G1 | G2 | G3 | G4 | G5 | G6 | G7 | G8 | G9 | G10 | G11 | G12 | G13 | G14 | G15 | G16 | G17 | G18 | G19 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| G0 Vorspann |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| G1 Tastenbilder | 23 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| G2 Welt | 1 |  |  | 15* |  | 1 |  | 1 |  |  | 3 |  |  |  | 3 |  | 11 |  |  |  |
| G3 Held+Steuerung | 64 | 24 | 251* |  | 2 | 31* | 12 | 3 | 1 |  | 44* | 21* | 14 | 47* | 7 | 4 | 5 |  |  |  |
| G4 Malen | 446* |  | 97* | 104* |  |  |  |  |  |  | 7* |  | 47 | 5 | 89 |  |  |  |  |  |
| G5 Ton+Sprache | 1 |  |  |  |  |  | 1 |  |  |  |  |  |  |  |  |  |  |  |  | 2 |
| G6 Lernen | 78* | 7 | 194* | 171* | 1 | 36* |  | 6* | 23* |  | 46* | 20 | 7 | 12 | 19* | 2 | 15* | 3 |  | 36* |
| G7 Funde | 38* |  | 78* | 16 |  | 3 |  |  | 1 |  | 3* | 1 |  |  | 1 | 1 |  |  |  |  |
| G8 Speichern | 4 | 1 | 43* | 77* |  | 2 | 8 | 27* |  | 4 | 12* | 1 |  | 10* |  |  | 3 |  |  |  |
| G9 Reisen | 2 |  | 34* | 58* |  | 2 | 2 | 1* | 8 |  | 3* | 6* | 6 | 8* |  | 1 | 4* |  |  |  |
| G10 Held+Markt | 118* | 1 | 45* | 27 |  | 7 | 4 | 1 | 1 |  |  | 3 | 1 |  | 27 |  |  |  |  |  |
| G11 Aufträge+Missionen | 131* | 23 | 114* | 62 |  | 15 | 26 | 4 | 1 | 2 | 18* |  | 27 | 4 | 31 |  | 2 |  |  |  |
| G12 Winter+Geschichte | 52* | 2 | 167* | 359* | 8 | 31* | 5 |  |  |  | 58* | 2 |  |  | 7 |  |  |  |  |  |
| G13 Leben (Tiere, U-Boot …) | 759* | 1 | 388* | 743* | 3 | 56 | 8 | 1 |  | 1 | 57* | 12 | 60 |  | 131 |  | 2 |  |  |  |
| G14 Render | 1455* |  | 223* | 336* | 7 |  | 2 | 5 | 3 |  | 34* | 11* | 20 | 66* |  | 10* | 8* | 1 |  |  |
| G15 Karte | 141* |  | 72 | 72* |  | 9 | 4 |  | 1 |  | 28* |  | 3 | 13* | 59 |  | 59* |  |  |  |
| G16 Tiefe+Werkstatt | 24* | 7* | 206* | 123* |  | 25* | 13 | 2* |  |  | 83* | 15 | 22 |  | 3 | 2 |  | 6 |  |  |
| G17 Rätsel | 31 |  | 6* | 22* |  | 36* | 73* |  |  |  | 24* | 2 | 3 |  | 10 |  | 6* |  |  | 5 |
| G18 Vollbild | 22 | 2 |  | 3 |  | 2 |  |  | 6* |  | 4* | 2 |  |  | 1 |  |  |  |  |  |
| G19 Protokoll+Eltern | 30 |  | 7 | 11 |  | 10 | 40 | 3 | 2 |  | 1 | 1 |  |  |  |  |  | 2 |  |  |
<!-- /arch:groups -->

### Zyklen

<!-- arch:cycles -->
**Gruppen:** {G9 Reisen, G15 Karte, G17 Rätsel, G16 Tiefe+Werkstatt, G14 Render, G4 Malen, G12 Winter+Geschichte, G6 Lernen, G11 Aufträge+Missionen, G10 Held+Markt, G7 Funde, G8 Speichern, G19 Protokoll+Eltern, G5 Ton+Sprache, G13 Leben (Tiere, U-Boot …), G3 Held+Steuerung, G2 Welt}

**Sektionen:** 59 Sektionen: S03 S05 S06 S07 S08 S09 S10 S11 S12 S13 S14 S15 S16 S17 S18 S19 S20 S21 S22 S23 S24 S25 S26 S27 S28 S29 S30 S31 S32 S33 S34 S35 S36 S37 S38 S39 S40 S41 S42 S43 S44 S45 S46 S47 S48 S49 S50 S51 S52 S53 S54 S55 S56 S58 S59 S60 S61 S62 S63

Sektionen außerhalb jedes Zyklus: S00 (Vorspann: Fehlerprotokoll, Canvas, Optionen), S01 Bilder für die Tasten, S02 Welt, S04 Große Welt, S57 Vollbild im Browser-Tab (Android, Desktop).
<!-- /arch:cycles -->

Lesart: Fast alles hängt mit fast allem zusammen. Nur Vorspann, Tastenbilder, die Konstanten der Welt (`S02`, `S04`) und Vollbild sind zyklenfrei. Ein Herauslösen „Sektion für Sektion“ in Dateireihenfolge ist deshalb nicht möglich. Herauslösbar sind einzelne **Funktionen**, deren transitive Hülle nichts aus dem Rest braucht (Abschnitt 7).

### Alle Kanten zwischen Sektionen

<details><summary>700 Kanten</summary>

<!-- arch:edges -->
| von | nach | lesen | schreiben | ändern | aufrufen | Beispiele |
|---|---|---|---|---|---|---|
| S01 | S00 | 23 | 0 | 0 | 0 | `K` |
| S03 | S02 | 116 | 0 | 11 | 8 | `rawH` `CELL` `TOP` `GX` `grow0` |
| S03 | S04 | 1 | 0 | 0 | 0 | `genF` |
| S03 | S05 | 0 | 0 | 0 | 1 | `colTop` |
| S03 | S06 | 2 | 0 | 0 | 0 | `trees` |
| S03 | S09 | 9 | 0 | 1 | 0 | `parked` `P` |
| S03 | S13 | 1 | 0 | 0 | 0 | `hidden` |
| S03 | S16 | 1 | 0 | 0 | 0 | `props` |
| S04 | S02 | 11 | 0 | 0 | 0 | `CELL` `TOP` `GX` `MOON` |
| S05 | S02 | 474 | 0 | 72 | 30 | `CELL` `MOON` `ICE` `WATER` `LAVA` |
| S05 | S03 | 68 | 32 | 11 | 44 | `hash2` `SEED` `mtop` `msurf` `inGrid` |
| S05 | S04 | 161 | 25 | 76 | 0 | `bix` `BIO` `EXT_X` `B0` `WL` |
| S05 | S06 | 12 | 0 | 7 | 6 | `rng` `trees` `clouds` |
| S05 | S07 | 1 | 0 | 1 | 1 | `makeTrack` `tracks` |
| S05 | S08 | 0 | 0 | 0 | 2 | `spawn` `dust` |
| S05 | S09 | 5 | 0 | 0 | 0 | `cam` |
| S05 | S16 | 2 | 0 | 0 | 0 | `hero` |
| S05 | S39 | 7 | 0 | 0 | 2 | `SPACE` `planetDeep` `deepWorld` `SEA_T` `SEA_L` |
| S05 | S40 | 0 | 0 | 0 | 1 | `vFloor` |
| S05 | S60 | 1 | 0 | 0 | 1 | `setPal` |
| S06 | S02 | 12 | 0 | 0 | 1 | `HOME_W` `VOLC` `SITE` `FLAT` `ground` |
| S06 | S03 | 4 | 0 | 0 | 0 | `mtop` `SNX` |
| S06 | S04 | 0 | 2 | 0 | 0 | `NT0` `NC0` |
| S06 | S05 | 2 | 0 | 2 | 0 | `HOME_T` `HOME_C` |
| S07 | S02 | 5 | 0 | 0 | 4 | `clamp` `WORLD_W` `TOP` `GY` `CELL` |
| S07 | S39 | 0 | 0 | 0 | 1 | `skyLim` |
| S08 | S00 | 1 | 0 | 0 | 0 | `reduced` |
| S08 | S02 | 4 | 0 | 0 | 0 | `CELL` `TOP` `FIRE` |
| S08 | S05 | 0 | 0 | 0 | 2 | `colTop` `putUp` |
| S08 | S11 | 0 | 0 | 0 | 1 | `sfx` |
| S08 | S60 | 1 | 0 | 0 | 0 | `maxDpr` |
| S09 | S00 | 0 | 0 | 0 | 7 | `$` |
| S09 | S01 | 3 | 0 | 0 | 0 | `IC` `QI` |
| S09 | S02 | 89 | 0 | 2 | 12 | `G` `grid` `BED` `CORE` `SHELL` |
| S09 | S03 | 3 | 5 | 0 | 5 | `gold` `gems` `lootDirty` `inGrid` |
| S09 | S04 | 4 | 0 | 1 | 0 | `seen` `BIO` |
| S09 | S05 | 7 | 0 | 0 | 49 | `colTop` `realm` `RX0` `RW` `grow` |
| S09 | S06 | 1 | 0 | 0 | 0 | `trees` |
| S09 | S07 | 3 | 0 | 0 | 2 | `tracks` `trackAt` |
| S09 | S08 | 22 | 12 | 3 | 31 | `smoke` `popG` `popM` `spawn` `dust` |
| S09 | S10 | 1 | 0 | 0 | 1 | `pointers` `toWorld` |
| S09 | S11 | 0 | 0 | 0 | 10 | `sfx` `blip` `jingle` |
| S09 | S16 | 27 | 1 | 4 | 5 | `digN` `addXp` `hero` `nearStall` `openMarket` |
| S09 | S17 | 4 | 0 | 1 | 5 | `quest` `qEvent` `banner` |
| S09 | S18 | 0 | 0 | 0 | 3 | `nearBoard` `misBoard` |
| S09 | S19 | 0 | 0 | 0 | 3 | `shout` `say` |
| S09 | S20 | 0 | 0 | 0 | 3 | `nearLift` `rideLift` `liftRide` |
| S09 | S21 | 0 | 0 | 0 | 2 | `skiAct` `updSki` |
| S09 | S22 | 0 | 0 | 0 | 1 | `updDragon` |
| S09 | S30 | 10 | 4 | 0 | 1 | `FX` `fxSpeed` `eruT` `eruOn` |
| S09 | S33 | 7 | 0 | 1 | 20 | `heliLoad` `heliDrop` `zipRide` `zipNear` `zipGo` |
| S09 | S39 | 0 | 0 | 0 | 2 | `shellOk` `skyLim` |
| S09 | S41 | 0 | 0 | 0 | 2 | `deepAct` `deepIcon` |
| S09 | S55 | 2 | 0 | 0 | 0 | `MODES` `TOOLN` |
| S09 | S60 | 7 | 0 | 0 | 0 | `W` `S` `H` |
| S10 | S00 | 6 | 0 | 0 | 0 | `cv` |
| S10 | S02 | 36 | 0 | 4 | 0 | `grid` `GX` `life` `CELL` `TOP` |
| S10 | S03 | 2 | 0 | 0 | 3 | `inGrid` `lavaCount` `waterCount` `fillBlock` |
| S10 | S05 | 0 | 0 | 0 | 9 | `putUp` |
| S10 | S07 | 9 | 0 | 4 | 2 | `tracks` `makeTrack` |
| S10 | S09 | 51 | 10 | 3 | 5 | `cam` `P` `setMode` `tool` `pulse` |
| S10 | S16 | 1 | 1 | 0 | 1 | `props` `dropBomb` |
| S10 | S23 | 0 | 0 | 0 | 1 | `throwBall` |
| S10 | S24 | 0 | 0 | 0 | 1 | `firework` |
| S10 | S25 | 0 | 0 | 0 | 1 | `addMan` |
| S10 | S32 | 0 | 0 | 0 | 1 | `tapWorld` |
| S10 | S33 | 1 | 0 | 0 | 3 | `shoot` `HANDT` `handDig` `zipAdd` |
| S10 | S55 | 0 | 0 | 0 | 1 | `armGhost` |
| S10 | S60 | 4 | 0 | 0 | 0 | `W` `S` `H` |
| S11 | S00 | 0 | 0 | 0 | 1 | `$` |
| S11 | S58 | 0 | 0 | 0 | 1 | `tone` |
| S11 | S62 | 1 | 0 | 0 | 1 | `parLoad` |
| S12 | S00 | 0 | 0 | 0 | 13 | `$` |
| S12 | S01 | 2 | 0 | 0 | 0 | `IC` `PIC` |
| S12 | S02 | 121 | 0 | 4 | 12 | `clamp` `CELL` `GX` `TOP` `GY` |
| S12 | S03 | 2 | 2 | 0 | 20 | `restoreSite` `houseBlocks` `fillBlock` `inGrid` `setCell` |
| S12 | S05 | 4 | 0 | 0 | 3 | `grow` `RX0` `RW` `surfaceY` `realm` |
| S12 | S07 | 1 | 0 | 0 | 0 | `tracks` |
| S12 | S08 | 0 | 0 | 0 | 4 | `smoke` `confetti` `spawn` |
| S12 | S09 | 56 | 4 | 14 | 10 | `P` `setMode` `cam` `task` `chest` |
| S12 | S11 | 0 | 0 | 0 | 5 | `speak` `jingle` |
| S12 | S16 | 0 | 0 | 0 | 1 | `addXp` |
| S12 | S19 | 0 | 0 | 0 | 1 | `say` |
| S13 | S00 | 20 | 0 | 11 | 7 | `$` `ctx` `reduced` |
| S13 | S02 | 42 | 0 | 0 | 5 | `HOME_W` `VOLC` `FLAT` `SITE` `ground` |
| S13 | S03 | 8 | 4 | 0 | 0 | `gold` `gems` `CHX` `SNX` `SEED` |
| S13 | S04 | 1 | 0 | 0 | 0 | `NT0` |
| S13 | S05 | 0 | 0 | 0 | 9 | `colTop` `surfaceY` `solidW` `cellAt` |
| S13 | S06 | 6 | 0 | 0 | 1 | `trees` `clouds` `rng` |
| S13 | S08 | 0 | 0 | 0 | 2 | `confetti` `spawn` |
| S13 | S09 | 12 | 0 | 0 | 4 | `pulse` `P` `bucket` `scoop` `drillHead` |
| S13 | S11 | 0 | 0 | 0 | 3 | `jingle` `speak` `sfx` |
| S13 | S14 | 1 | 0 | 0 | 0 | `frozen` |
| S13 | S16 | 0 | 2 | 0 | 1 | `addXp` `nearF` `nearD` |
| S13 | S17 | 0 | 0 | 0 | 1 | `qEvent` |
| S13 | S38 | 0 | 0 | 0 | 1 | `renderEggs` |
| S13 | S60 | 0 | 0 | 0 | 1 | `circle` |
| S14 | S00 | 0 | 0 | 0 | 2 | `$` |
| S14 | S01 | 1 | 0 | 0 | 0 | `QI` |
| S14 | S02 | 7 | 0 | 2 | 0 | `GY` `grid` `GX` `life` `stamp` |
| S14 | S03 | 3 | 2 | 0 | 1 | `SEED` `lootDirty` `migrateSnow` |
| S14 | S04 | 7 | 0 | 0 | 0 | `genF` `seen` `eggGot` `lootGot` `orbGot` |
| S14 | S05 | 4 | 0 | 0 | 5 | `packRuns` `realm` `shapeWorld` `loadCells` `grow` |
| S14 | S06 | 2 | 0 | 0 | 0 | `trees` |
| S14 | S07 | 3 | 2 | 1 | 1 | `tracks` `zips` `makeTrack` |
| S14 | S08 | 1 | 0 | 1 | 0 | `parts` |
| S14 | S09 | 38 | 7 | 23 | 3 | `parked` `P` `park` `energy` `flash` |
| S14 | S11 | 0 | 0 | 0 | 1 | `speak` |
| S14 | S13 | 11 | 11 | 0 | 3 | `hidden` `saving` `ready` `saveFinds` `saveT` |
| S14 | S15 | 3 | 0 | 0 | 0 | `traveling` |
| S14 | S16 | 4 | 2 | 1 | 4 | `props` `saveHero` `heroDirty` `hudLoot` `bombs` |
| S14 | S17 | 0 | 0 | 0 | 1 | `banner` |
| S14 | S33 | 4 | 4 | 2 | 0 | `zipOk` `ZIPMAX` `MONS` `METS` `MROCKS` |
| S14 | S39 | 2 | 0 | 0 | 0 | `matGot` `pzGot` |
| S14 | S40 | 0 | 0 | 0 | 1 | `deepRestore` |
| S14 | S55 | 0 | 0 | 0 | 1 | `svg24` |
| S14 | S58 | 0 | 0 | 0 | 2 | `tone` |
| S15 | S00 | 0 | 0 | 0 | 2 | `$` |
| S15 | S03 | 1 | 0 | 0 | 0 | `SEED` |
| S15 | S04 | 2 | 4 | 1 | 0 | `seen` `eggGot` `lootGot` `orbGot` |
| S15 | S05 | 9 | 0 | 0 | 12 | `RLM` `shapeWorld` `planetGen` `LANDX` `surfaceY` |
| S15 | S06 | 1 | 0 | 0 | 0 | `trees` |
| S15 | S07 | 0 | 2 | 0 | 0 | `tracks` `zips` |
| S15 | S08 | 1 | 0 | 1 | 0 | `parts` |
| S15 | S09 | 33 | 7 | 17 | 1 | `ghost` `chest` `stroke` `strokeId` `task` |
| S15 | S11 | 0 | 0 | 0 | 2 | `sfx` `speak` |
| S15 | S13 | 0 | 1 | 0 | 0 | `hidden` |
| S15 | S14 | 0 | 0 | 0 | 8 | `snapshot` `idbDo` `realmKey` `restore` `saveGame` |
| S15 | S16 | 1 | 1 | 1 | 0 | `props` `bombs` |
| S15 | S17 | 3 | 0 | 1 | 1 | `banner` `quest` |
| S15 | S18 | 0 | 0 | 0 | 1 | `uiOpen` |
| S15 | S19 | 0 | 0 | 0 | 6 | `later` `say` |
| S15 | S32 | 0 | 0 | 0 | 1 | `disco` |
| S15 | S33 | 2 | 3 | 2 | 0 | `MONS` `METS` `MROCKS` `FLIES` `ARROWS` |
| S15 | S39 | 0 | 4 | 0 | 0 | `matGot` `pzGot` `guide` `dkA` |
| S15 | S45 | 0 | 0 | 0 | 1 | `darkAt` |
| S15 | S58 | 0 | 0 | 0 | 2 | `tone` |
| S16 | S00 | 73 | 0 | 29 | 16 | `$` `ctx` `reduced` |
| S16 | S01 | 1 | 0 | 0 | 0 | `QI` |
| S16 | S02 | 8 | 0 | 0 | 10 | `clamp` `STALL_X` `ground` `TAU` |
| S16 | S03 | 13 | 4 | 0 | 0 | `gold` `lootDirty` `gems` |
| S16 | S05 | 0 | 0 | 0 | 1 | `surfaceY` |
| S16 | S06 | 1 | 0 | 0 | 0 | `trees` |
| S16 | S08 | 2 | 1 | 0 | 5 | `confetti` `spawn` `smoke` `shake` `CONF` |
| S16 | S09 | 23 | 0 | 0 | 3 | `P` `pulse` `bore` `burn` `time` |
| S16 | S11 | 0 | 0 | 0 | 7 | `jingle` `speak` `sfx` |
| S16 | S13 | 0 | 0 | 0 | 1 | `saveFinds` |
| S16 | S14 | 1 | 0 | 0 | 0 | `frozen` |
| S16 | S17 | 0 | 0 | 0 | 3 | `banner` `qEvent` |
| S16 | S25 | 0 | 0 | 0 | 1 | `drawMan` |
| S16 | S36 | 0 | 0 | 0 | 1 | `drawTramp` |
| S16 | S55 | 0 | 0 | 0 | 1 | `svg24` |
| S16 | S58 | 0 | 0 | 0 | 4 | `tone` |
| S16 | S60 | 13 | 0 | 0 | 13 | `rr` `circle` `INK` `S` `W` |
| S17 | S00 | 0 | 0 | 0 | 9 | `$` |
| S17 | S01 | 20 | 0 | 0 | 0 | `QI` `IC` |
| S17 | S02 | 8 | 0 | 0 | 3 | `WORLD_W` `VOLC` `STALL_X` `ground` `MOON` |
| S17 | S03 | 2 | 3 | 0 | 0 | `gold` `gems` `lootDirty` |
| S17 | S05 | 2 | 0 | 0 | 3 | `surfaceY` `solidW` `realm` |
| S17 | S08 | 0 | 0 | 0 | 1 | `confetti` |
| S17 | S09 | 19 | 0 | 0 | 2 | `P` `pulse` |
| S17 | S11 | 0 | 0 | 0 | 3 | `speak` `jingle` |
| S17 | S13 | 3 | 0 | 0 | 0 | `hidden` |
| S17 | S16 | 12 | 0 | 2 | 3 | `hero` `saveHero` `COIN` `GEMI` `addXp` |
| S17 | S19 | 2 | 0 | 0 | 0 | `LIFT0` |
| S17 | S20 | 0 | 0 | 0 | 1 | `onSnow` |
| S17 | S30 | 0 | 0 | 0 | 4 | `nextLand` `eggLand` |
| S17 | S41 | 0 | 0 | 0 | 1 | `nextMach` |
| S17 | S58 | 0 | 0 | 0 | 4 | `ri` |
| S18 | S00 | 70 | 0 | 46 | 6 | `$` `ctx` |
| S18 | S01 | 3 | 0 | 0 | 0 | `QI` |
| S18 | S02 | 27 | 0 | 1 | 34 | `ground` `VOLC` `STALL_X` `CELL` `TOP` |
| S18 | S03 | 1 | 0 | 0 | 3 | `SNX` `carveCircle` `inGrid` |
| S18 | S05 | 11 | 0 | 0 | 1 | `realm` `steam` `RX0` `RW` `RLM` |
| S18 | S06 | 9 | 0 | 2 | 0 | `clouds` `trees` |
| S18 | S08 | 0 | 0 | 0 | 3 | `confetti` `smoke` |
| S18 | S09 | 39 | 0 | 0 | 1 | `P` `pulse` |
| S18 | S11 | 5 | 0 | 0 | 7 | `sfx` `jingle` `muted` `fxOff` |
| S18 | S13 | 0 | 0 | 0 | 1 | `star4` |
| S18 | S14 | 1 | 0 | 0 | 0 | `frozen` |
| S18 | S15 | 1 | 0 | 0 | 1 | `traveling` `orbsOf` |
| S18 | S16 | 1 | 0 | 0 | 0 | `hero` |
| S18 | S19 | 0 | 0 | 0 | 23 | `say` `reward` `later` `emo` `shout` |
| S18 | S24 | 0 | 0 | 0 | 1 | `burst` |
| S18 | S39 | 1 | 0 | 0 | 0 | `LIFTX` |
| S18 | S55 | 0 | 0 | 0 | 1 | `svg24` |
| S18 | S58 | 0 | 0 | 0 | 16 | `ri` `tone` `shuffle` |
| S18 | S59 | 6 | 0 | 0 | 0 | `SCH` |
| S18 | S60 | 13 | 0 | 0 | 18 | `INK` `rr` `circle` |
| S19 | S00 | 5 | 0 | 4 | 3 | `ctx` `$` |
| S19 | S02 | 3 | 0 | 0 | 2 | `ground` `VOLC` `TAU` |
| S19 | S03 | 4 | 3 | 0 | 3 | `CAVE` `msurf` `gold` `gems` `lootDirty` |
| S19 | S07 | 0 | 0 | 0 | 1 | `makeTrack` |
| S19 | S08 | 0 | 0 | 0 | 3 | `spawn` `confetti` |
| S19 | S09 | 2 | 0 | 0 | 0 | `P` |
| S19 | S11 | 0 | 2 | 0 | 2 | `talkLock` `speak` `jingle` |
| S19 | S16 | 2 | 0 | 0 | 1 | `addXp` `COIN` `GEMI` |
| S19 | S17 | 0 | 0 | 0 | 1 | `banner` |
| S20 | S02 | 4 | 0 | 0 | 0 | `SNOW` `ICE` |
| S20 | S05 | 0 | 0 | 0 | 3 | `surfaceY` `cellAt` |
| S20 | S07 | 0 | 0 | 0 | 1 | `trackAt` |
| S20 | S09 | 36 | 0 | 22 | 2 | `P` `syncUI` |
| S20 | S11 | 0 | 0 | 0 | 1 | `sfx` |
| S20 | S19 | 5 | 0 | 0 | 0 | `LIFT0` `LIFT` |
| S20 | S58 | 0 | 0 | 0 | 1 | `need` |
| S21 | S02 | 5 | 0 | 0 | 1 | `G` `clamp` `TAU` |
| S21 | S03 | 1 | 2 | 0 | 0 | `gold` `lootDirty` |
| S21 | S06 | 1 | 0 | 0 | 0 | `trees` |
| S21 | S08 | 1 | 1 | 0 | 3 | `spawn` `popG` |
| S21 | S09 | 118 | 0 | 42 | 4 | `P` `grav` `mover` `time` |
| S21 | S11 | 0 | 0 | 0 | 6 | `sfx` |
| S21 | S16 | 3 | 0 | 0 | 1 | `hero` `addXp` |
| S21 | S17 | 0 | 0 | 0 | 1 | `qEvent` |
| S21 | S19 | 2 | 2 | 0 | 10 | `swishT` `puff` `shout` |
| S21 | S20 | 0 | 0 | 0 | 4 | `onSnow` `nearLift` `rideLift` |
| S22 | S00 | 1 | 0 | 0 | 0 | `reduced` |
| S22 | S02 | 15 | 0 | 1 | 1 | `clamp` `GX` `grid` `SNOW` `ICE` |
| S22 | S03 | 0 | 0 | 0 | 2 | `inGrid` |
| S22 | S05 | 0 | 0 | 0 | 3 | `steam` `putUp` |
| S22 | S08 | 0 | 0 | 0 | 1 | `spawn` |
| S22 | S09 | 31 | 0 | 11 | 2 | `P` `grav` `time` `mover` `keys` |
| S22 | S11 | 0 | 0 | 0 | 1 | `sfx` |
| S22 | S16 | 1 | 0 | 0 | 0 | `hero` |
| S23 | S02 | 11 | 0 | 0 | 1 | `clamp` `WORLD_W` `LAVA` `FIRE` `CELL` |
| S23 | S05 | 0 | 0 | 0 | 5 | `surfaceY` `cellAt` `steam` |
| S23 | S09 | 11 | 0 | 2 | 0 | `P` |
| S23 | S10 | 0 | 0 | 0 | 1 | `disc` |
| S23 | S11 | 0 | 0 | 0 | 3 | `sfx` |
| S23 | S19 | 9 | 0 | 3 | 5 | `balls` `N` `flX` `shout` `puff` |
| S23 | S26 | 0 | 0 | 0 | 1 | `pinFly` |
| S23 | S27 | 0 | 0 | 0 | 1 | `yetiHit` |
| S24 | S02 | 2 | 0 | 0 | 1 | `clamp` `WORLD_W` `TAU` |
| S24 | S05 | 0 | 0 | 0 | 1 | `surfaceY` |
| S24 | S08 | 2 | 0 | 0 | 3 | `CONF` `spawn` |
| S24 | S11 | 0 | 0 | 0 | 2 | `sfx` |
| S24 | S19 | 5 | 0 | 2 | 0 | `fws` |
| S24 | S58 | 0 | 0 | 0 | 2 | `ri` |
| S25 | S00 | 1 | 0 | 0 | 0 | `reduced` |
| S25 | S02 | 4 | 0 | 0 | 1 | `clamp` `WORLD_W` `CELL` `TOP` |
| S25 | S05 | 0 | 0 | 0 | 7 | `surfaceY` `floorAt` `hotAt` `steam` |
| S25 | S08 | 1 | 0 | 0 | 1 | `CONF` `spawn` |
| S25 | S09 | 3 | 0 | 0 | 0 | `P` `time` |
| S25 | S11 | 0 | 0 | 0 | 2 | `sfx` |
| S25 | S16 | 7 | 0 | 3 | 0 | `props` |
| S25 | S19 | 0 | 0 | 0 | 3 | `puff` `shout` |
| S25 | S29 | 0 | 0 | 0 | 1 | `drawSnowman` |
| S26 | S02 | 5 | 0 | 0 | 1 | `G` `clamp` `WORLD_W` `TOP` `GY` |
| S26 | S03 | 1 | 2 | 0 | 0 | `gold` `lootDirty` |
| S26 | S05 | 0 | 0 | 0 | 4 | `surfaceY` `solidW` |
| S26 | S08 | 1 | 1 | 0 | 1 | `confetti` `popG` |
| S26 | S09 | 9 | 0 | 0 | 0 | `time` `P` |
| S26 | S11 | 0 | 0 | 0 | 2 | `sfx` `jingle` |
| S26 | S19 | 6 | 3 | 0 | 2 | `pinT` `pinN` `shout` `PENX` `N` |
| S27 | S02 | 10 | 0 | 0 | 0 | `TOP` `CELL` `VOLC` |
| S27 | S03 | 2 | 0 | 0 | 1 | `CAVE` `msurf` |
| S27 | S05 | 0 | 0 | 0 | 6 | `surfaceY` `colTop` |
| S27 | S08 | 1 | 1 | 0 | 3 | `confetti` `spawn` `shake` |
| S27 | S09 | 23 | 0 | 0 | 3 | `P` `setTool` `pulse` `cam` `time` |
| S27 | S11 | 0 | 0 | 0 | 5 | `sfx` |
| S27 | S16 | 10 | 0 | 2 | 0 | `hero` |
| S27 | S19 | 35 | 0 | 10 | 17 | `N` `flX` `HAREX` `stv` `say` |
| S27 | S23 | 0 | 0 | 0 | 1 | `throwBall` |
| S27 | S28 | 0 | 0 | 0 | 2 | `stGoto` |
| S28 | S00 | 21 | 2 | 9 | 6 | `$` `ctx` |
| S28 | S01 | 2 | 0 | 0 | 0 | `IC` |
| S28 | S02 | 5 | 0 | 0 | 0 | `FIRE` `LAVA` `VOLC` |
| S28 | S03 | 0 | 0 | 0 | 5 | `msurf` |
| S28 | S05 | 1 | 0 | 0 | 4 | `surfaceY` `realm` |
| S28 | S08 | 1 | 2 | 0 | 4 | `confetti` `spawn` `shake` |
| S28 | S09 | 28 | 0 | 0 | 9 | `P` `pulse` `setTool` `tool` `drillHead` |
| S28 | S11 | 0 | 0 | 0 | 5 | `sfx` `jingle` |
| S28 | S12 | 0 | 0 | 0 | 2 | `teleport` `boxCount` |
| S28 | S16 | 18 | 0 | 7 | 3 | `hero` `saveHero` |
| S28 | S19 | 65 | 11 | 21 | 23 | `stv` `stq` `partyT` `N` `HAREX` |
| S28 | S23 | 0 | 0 | 0 | 1 | `ballsTick` |
| S28 | S24 | 0 | 0 | 0 | 2 | `fwsTick` `firework` |
| S28 | S25 | 0 | 0 | 0 | 1 | `menTick` |
| S28 | S26 | 0 | 0 | 0 | 1 | `pensTick` |
| S28 | S27 | 0 | 0 | 0 | 4 | `hareTick` `yetiTick` `fauTick` `mamaTick` |
| S28 | S29 | 0 | 0 | 0 | 6 | `drawSnowman` `drawYeti` `drawDragon` |
| S28 | S55 | 0 | 0 | 0 | 1 | `svg24` |
| S28 | S60 | 3 | 0 | 0 | 4 | `INK` `circle` |
| S29 | S00 | 332 | 0 | 108 | 0 | `ctx` `reduced` |
| S29 | S02 | 12 | 0 | 0 | 4 | `TAU` `VOLC` `clamp` |
| S29 | S03 | 2 | 0 | 0 | 2 | `msurf` `CAVE` |
| S29 | S05 | 0 | 0 | 0 | 6 | `surfaceY` |
| S29 | S07 | 0 | 0 | 0 | 1 | `trackAt` |
| S29 | S08 | 1 | 0 | 0 | 0 | `CONF` |
| S29 | S09 | 34 | 0 | 0 | 0 | `P` `time` `cam` |
| S29 | S16 | 4 | 0 | 0 | 0 | `hero` |
| S29 | S19 | 39 | 0 | 0 | 5 | `LIFT` `LIFT0` `LIFT1` `N` `RIMY` |
| S29 | S60 | 28 | 0 | 0 | 57 | `circle` `INK` `rr` `mix` `head` |
| S30 | S01 | 1 | 0 | 0 | 0 | `QI` |
| S30 | S02 | 3 | 0 | 0 | 0 | `WATER` `LAVA` |
| S30 | S04 | 6 | 0 | 0 | 0 | `ORBS` `BIO` `seen` `eggGot` |
| S30 | S05 | 8 | 0 | 1 | 0 | `RLM` `BT` |
| S31 | S00 | 7 | 0 | 2 | 0 | `reduced` `ctx` |
| S31 | S02 | 7 | 0 | 0 | 2 | `CELL` `clamp` `WORLD_W` `WATER` `FIRE` |
| S31 | S03 | 3 | 6 | 0 | 0 | `gold` `lootDirty` |
| S31 | S04 | 6 | 0 | 1 | 0 | `genF` `CRE` `DROPS` `WL` |
| S31 | S05 | 0 | 0 | 0 | 14 | `surfaceY` `floorAt` `solidW` `cellAt` `hotAt` |
| S31 | S08 | 5 | 5 | 0 | 4 | `confetti` `popG` `spawn` `shake` |
| S31 | S09 | 38 | 0 | 13 | 0 | `P` `time` `cam` |
| S31 | S11 | 0 | 0 | 0 | 6 | `jingle` `sfx` |
| S31 | S12 | 0 | 0 | 0 | 1 | `boxCount` |
| S31 | S16 | 5 | 0 | 4 | 1 | `hero` `pet` `saveHero` |
| S31 | S17 | 0 | 0 | 0 | 1 | `qEvent` |
| S31 | S19 | 0 | 0 | 0 | 9 | `say` `shout` `emo` |
| S31 | S30 | 5 | 1 | 2 | 0 | `FX` `trexT` `throws` `discoT` |
| S32 | S02 | 14 | 0 | 0 | 0 | `CELL` `G` `TOP` `GY` `FIRE` |
| S32 | S03 | 5 | 10 | 0 | 0 | `gold` `lootDirty` `gems` |
| S32 | S04 | 26 | 0 | 7 | 0 | `PICKS` `genF` `DROPS` `PADS` `eggGot` |
| S32 | S05 | 1 | 0 | 0 | 8 | `surfaceY` `solidW` `BT` `putUp` |
| S32 | S06 | 2 | 0 | 0 | 0 | `clouds` `trees` |
| S32 | S08 | 3 | 3 | 0 | 6 | `popG` `confetti` `spawn` `shake` `popM` |
| S32 | S09 | 86 | 0 | 11 | 4 | `P` `time` `pulse` `bucket` `scoop` |
| S32 | S10 | 0 | 0 | 0 | 1 | `toWorld` |
| S32 | S11 | 0 | 0 | 0 | 20 | `sfx` `jingle` `speak` |
| S32 | S13 | 0 | 0 | 0 | 1 | `renderAlbum` |
| S32 | S16 | 15 | 0 | 7 | 4 | `props` `hero` `pet` `addXp` `saveHero` |
| S32 | S17 | 0 | 0 | 0 | 5 | `qEvent` `banner` |
| S32 | S19 | 2 | 0 | 0 | 28 | `shout` `say` `puff` `N` `flX` |
| S32 | S24 | 0 | 0 | 0 | 1 | `firework` |
| S32 | S26 | 0 | 0 | 0 | 1 | `pinFly` |
| S32 | S27 | 0 | 0 | 0 | 1 | `yetiHit` |
| S32 | S30 | 31 | 12 | 15 | 0 | `FX` `throws` `EGGSVG` `WEAR` `discoT` |
| S32 | S31 | 0 | 0 | 0 | 1 | `creHit` |
| S32 | S41 | 0 | 0 | 0 | 1 | `deepTap` |
| S32 | S60 | 4 | 0 | 0 | 0 | `W` `H` `S` |
| S33 | S00 | 537 | 0 | 187 | 5 | `reduced` `ctx` `OPT` `$` |
| S33 | S02 | 46 | 0 | 0 | 22 | `WATER` `clamp` `G` `CELL` `TOP` |
| S33 | S03 | 10 | 12 | 0 | 1 | `inGrid` `gold` `lootDirty` `gems` `SEED` |
| S33 | S04 | 12 | 0 | 2 | 0 | `BIO` `bio` `orbGot` |
| S33 | S05 | 13 | 0 | 0 | 28 | `cellAt` `solidW` `floorAt` `colTop` `realm` |
| S33 | S06 | 1 | 0 | 0 | 0 | `trees` |
| S33 | S07 | 5 | 0 | 2 | 0 | `zips` |
| S33 | S08 | 2 | 2 | 0 | 21 | `spawn` `dust` `confetti` `popG` `popM` |
| S33 | S09 | 403 | 0 | 100 | 12 | `P` `grav` `mover` `time` `parked` |
| S33 | S10 | 1 | 0 | 0 | 1 | `pointers` `toWorld` |
| S33 | S11 | 0 | 0 | 0 | 26 | `sfx` `blip` `jingle` `speak` |
| S33 | S16 | 11 | 1 | 1 | 0 | `hero` `COIN` `heroDirty` `GEMI` |
| S33 | S17 | 0 | 0 | 0 | 4 | `banner` |
| S33 | S18 | 0 | 0 | 0 | 1 | `postMax` |
| S33 | S19 | 0 | 0 | 0 | 9 | `say` `shout` `reward` |
| S33 | S24 | 0 | 0 | 0 | 2 | `burst` |
| S33 | S30 | 3 | 0 | 1 | 1 | `nightA` `kidScale` `FX` |
| S33 | S58 | 0 | 0 | 0 | 7 | `tone` `ri` `shuffle` |
| S33 | S60 | 63 | 0 | 0 | 46 | `INK` `circle` `W` `S` `rr` |
| S34 | S02 | 8 | 0 | 0 | 1 | `CELL` `clamp` `GX` `TOP` `WATER` |
| S34 | S03 | 1 | 2 | 0 | 0 | `gold` `lootDirty` |
| S34 | S04 | 11 | 0 | 1 | 0 | `genF` `bix` `seen` `BIO` `ORBS` |
| S34 | S05 | 2 | 0 | 0 | 3 | `grow` `realm` `put` |
| S34 | S06 | 1 | 0 | 0 | 0 | `clouds` |
| S34 | S08 | 1 | 0 | 0 | 8 | `confetti` `spawn` `CONF` `dust` `smoke` |
| S34 | S09 | 60 | 0 | 7 | 1 | `P` `cam` `time` `pulse` `keys` |
| S34 | S11 | 0 | 0 | 0 | 4 | `jingle` `sfx` `blip` |
| S34 | S15 | 0 | 0 | 0 | 1 | `portalTick` |
| S34 | S16 | 6 | 0 | 1 | 1 | `hero` `saveHero` `COIN` |
| S34 | S17 | 0 | 0 | 0 | 1 | `banner` |
| S34 | S19 | 0 | 0 | 0 | 7 | `say` `shout` |
| S34 | S30 | 50 | 18 | 9 | 0 | `FX` `nightA` `nightOn` `ORBN` `bolt` |
| S34 | S31 | 0 | 0 | 0 | 1 | `creTick` |
| S34 | S32 | 0 | 0 | 0 | 5 | `discover` `pickTick` `padsTick` `secretsTick` `disco` |
| S34 | S39 | 0 | 0 | 0 | 1 | `skyLim` |
| S35 | S00 | 14 | 0 | 7 | 0 | `ctx` `reduced` |
| S35 | S02 | 4 | 0 | 0 | 3 | `clamp` `CELL` `GX` |
| S35 | S04 | 5 | 0 | 0 | 0 | `bix` `BIO` |
| S35 | S05 | 2 | 0 | 0 | 0 | `BT` |
| S35 | S09 | 8 | 0 | 0 | 0 | `cam` `time` |
| S35 | S30 | 12 | 0 | 7 | 0 | `nightA` `MD` `discoT` |
| S35 | S60 | 13 | 0 | 0 | 5 | `lerpC` `DPR` `W` `H` `S` |
| S36 | S00 | 294 | 0 | 129 | 0 | `ctx` `reduced` |
| S36 | S02 | 3 | 0 | 0 | 1 | `ground` `TAU` |
| S36 | S04 | 9 | 0 | 0 | 0 | `seen` `EGGS` `eggGot` `LOOT` `lootGot` |
| S36 | S05 | 1 | 0 | 0 | 4 | `BT` `solidW` `surfaceY` |
| S36 | S08 | 2 | 0 | 0 | 0 | `CONF` |
| S36 | S09 | 30 | 0 | 0 | 0 | `time` `P` |
| S36 | S13 | 0 | 0 | 0 | 2 | `star4` |
| S36 | S19 | 0 | 0 | 0 | 9 | `emo` |
| S36 | S30 | 21 | 0 | 0 | 1 | `throws` `bolt` `ufo` `FX` `kidScale` |
| S36 | S31 | 0 | 0 | 0 | 1 | `drawCres` |
| S36 | S60 | 13 | 0 | 0 | 56 | `rr` `circle` `INK` |
| S37 | S00 | 0 | 0 | 0 | 1 | `$` |
| S37 | S02 | 2 | 0 | 0 | 1 | `clamp` `CELL` `GX` |
| S37 | S04 | 3 | 0 | 0 | 0 | `BIO` `seen` `bix` |
| S37 | S05 | 3 | 0 | 0 | 1 | `rlm` `LANDX` `BT` |
| S37 | S09 | 2 | 0 | 0 | 0 | `P` |
| S37 | S30 | 3 | 1 | 0 | 1 | `mapPg` `nextLand` |
| S37 | S45 | 0 | 0 | 0 | 1 | `marks` |
| S38 | S00 | 0 | 0 | 0 | 4 | `$` |
| S38 | S02 | 20 | 0 | 0 | 9 | `GX` `GY` `clamp` `TOP` `CELL` |
| S38 | S03 | 1 | 0 | 0 | 0 | `BEND` |
| S38 | S04 | 4 | 0 | 0 | 0 | `genF` `bix` `seen` |
| S38 | S05 | 13 | 0 | 0 | 1 | `realm` `RC0` `RC1` `LANDX` `grow` |
| S38 | S08 | 0 | 0 | 0 | 1 | `smoke` |
| S38 | S09 | 20 | 0 | 6 | 1 | `P` `setMode` `cam` |
| S38 | S11 | 0 | 0 | 0 | 4 | `speak` |
| S38 | S12 | 0 | 0 | 0 | 1 | `teleport` |
| S38 | S14 | 1 | 0 | 0 | 0 | `frozen` |
| S38 | S16 | 19 | 0 | 5 | 1 | `hero` `pet` `saveHero` |
| S38 | S30 | 6 | 1 | 0 | 0 | `mapPg` `EGGSVG` `WEAR` `PETS` `EHAT` |
| S38 | S37 | 0 | 0 | 0 | 1 | `renderMap` |
| S38 | S39 | 7 | 0 | 0 | 0 | `LIFTX` `ZN` `MACH` `pzGot` `WSX` |
| S38 | S40 | 1 | 0 | 0 | 1 | `VAULTS` `doorShut` |
| S38 | S45 | 0 | 0 | 0 | 1 | `marks` |
| S38 | S58 | 0 | 0 | 0 | 2 | `tone` |
| S39 | S00 | 1 | 0 | 0 | 0 | `K` |
| S39 | S01 | 4 | 0 | 3 | 0 | `QI` `S1` `AI` |
| S39 | S02 | 48 | 0 | 0 | 4 | `SKYL` `TOP` `CELL` `ground` `clamp` |
| S39 | S03 | 4 | 0 | 0 | 0 | `SEED` |
| S39 | S04 | 14 | 0 | 13 | 0 | `STR` `BIO` `PADS` `ORBS` |
| S39 | S05 | 10 | 0 | 0 | 17 | `colOf` `OLD_N` `addCre` `PX0` `RW` |
| S39 | S06 | 0 | 0 | 0 | 4 | `rng` |
| S39 | S08 | 1 | 1 | 0 | 1 | `spawn` `shake` |
| S39 | S09 | 4 | 0 | 0 | 1 | `time` `pulse` |
| S39 | S11 | 0 | 0 | 0 | 1 | `sfx` |
| S39 | S16 | 2 | 0 | 0 | 0 | `hero` |
| S39 | S19 | 0 | 0 | 0 | 2 | `shout` `say` |
| S39 | S40 | 0 | 0 | 0 | 2 | `vaultPlan` |
| S40 | S00 | 4 | 0 | 3 | 3 | `$` `reduced` `ctx` |
| S40 | S02 | 20 | 0 | 2 | 0 | `TOP` `CELL` `grid` `GX` `BED` |
| S40 | S03 | 1 | 0 | 0 | 0 | `SEED` |
| S40 | S04 | 5 | 0 | 2 | 0 | `STR` `LOOT` `genF` `NT0` |
| S40 | S05 | 2 | 0 | 0 | 4 | `colOf` `scanMobile` `cutX` `surfaceY` |
| S40 | S06 | 2 | 0 | 0 | 1 | `rng` `trees` |
| S40 | S07 | 1 | 1 | 0 | 0 | `tracks` |
| S40 | S08 | 0 | 0 | 0 | 1 | `confetti` |
| S40 | S09 | 12 | 0 | 3 | 0 | `P` `time` `parked` |
| S40 | S11 | 0 | 0 | 0 | 2 | `sfx` `jingle` |
| S40 | S13 | 1 | 1 | 0 | 0 | `hidden` |
| S40 | S16 | 1 | 1 | 0 | 1 | `addXp` `props` |
| S40 | S17 | 0 | 0 | 0 | 1 | `banner` |
| S40 | S19 | 0 | 0 | 0 | 2 | `say` `emo` |
| S40 | S39 | 2 | 4 | 0 | 0 | `WSX` `LIFTX` `matGot` `pzGot` `guide` |
| S40 | S46 | 1 | 0 | 0 | 1 | `pzOpen` `PZI` |
| S40 | S58 | 0 | 0 | 0 | 1 | `openQuiz` |
| S40 | S60 | 0 | 0 | 0 | 3 | `rr` |
| S40 | S63 | 0 | 0 | 0 | 2 | `dayAdd` `campSoon` |
| S41 | S00 | 0 | 0 | 0 | 1 | `$` |
| S41 | S02 | 6 | 0 | 0 | 7 | `CELL` `CORE` `ground` `MOON` |
| S41 | S03 | 5 | 8 | 0 | 0 | `gold` `lootDirty` `gems` |
| S41 | S04 | 6 | 0 | 2 | 0 | `genF` `seen` `orbGot` |
| S41 | S05 | 2 | 0 | 0 | 3 | `surfaceY` `rlm` `realm` `cellAt` |
| S41 | S08 | 0 | 0 | 0 | 6 | `spawn` `confetti` |
| S41 | S09 | 70 | 0 | 0 | 6 | `pulse` `P` `bucket` `scoop` `drillHead` |
| S41 | S11 | 1 | 0 | 0 | 6 | `sfx` `jingle` `talkLock` |
| S41 | S16 | 30 | 1 | 15 | 7 | `hero` `heroDirty` `addXp` `pet` `COIN` |
| S41 | S17 | 3 | 0 | 0 | 10 | `qEvent` `banner` `quest` `showQuest` |
| S41 | S19 | 0 | 0 | 0 | 16 | `say` `later` `tell` |
| S41 | S24 | 0 | 0 | 0 | 1 | `firework` |
| S41 | S38 | 0 | 0 | 0 | 1 | `renderEggs` |
| S41 | S39 | 57 | 4 | 1 | 4 | `matGot` `MAT` `GEAR` `GEARK` `labHi` |
| S41 | S40 | 1 | 0 | 0 | 5 | `nearDoor` `doorAsk` `VAULTS` `doorShut` |
| S41 | S42 | 0 | 0 | 0 | 2 | `openLab` |
| S41 | S43 | 0 | 0 | 0 | 2 | `openMine` |
| S41 | S46 | 0 | 0 | 0 | 2 | `pzOpen` |
| S41 | S63 | 0 | 0 | 0 | 7 | `dayAdd` `campSoon` |
| S42 | S00 | 0 | 0 | 0 | 7 | `$` |
| S42 | S08 | 0 | 0 | 0 | 1 | `confetti` |
| S42 | S09 | 4 | 0 | 0 | 0 | `time` `P` |
| S42 | S11 | 0 | 1 | 0 | 9 | `talkLock` `speak` `jingle` |
| S42 | S16 | 17 | 0 | 3 | 3 | `hero` `saveHero` `addXp` |
| S42 | S17 | 0 | 0 | 0 | 1 | `banner` |
| S42 | S19 | 0 | 0 | 0 | 1 | `say` |
| S42 | S39 | 15 | 3 | 0 | 0 | `GEAR` `MAT` `MATK` `GEARK` `guide` |
| S42 | S41 | 0 | 0 | 0 | 5 | `canBuild` `atLab` `labBadge` |
| S42 | S46 | 2 | 0 | 0 | 0 | `PZT` `PZI` |
| S42 | S58 | 0 | 0 | 0 | 2 | `tone` |
| S43 | S00 | 0 | 0 | 0 | 5 | `$` |
| S43 | S05 | 0 | 0 | 0 | 1 | `scanMobile` |
| S43 | S09 | 13 | 0 | 9 | 1 | `P` `setMode` `cam` |
| S43 | S11 | 0 | 1 | 0 | 4 | `talkLock` `speak` `sfx` |
| S43 | S16 | 2 | 0 | 0 | 0 | `hero` |
| S43 | S39 | 10 | 3 | 0 | 1 | `ZN` `liftBusy` `LIFTX` `stationY` `dkA` |
| S43 | S41 | 0 | 0 | 0 | 1 | `nearCab` |
| S43 | S45 | 0 | 0 | 0 | 1 | `darkAt` |
| S43 | S58 | 0 | 0 | 0 | 1 | `tone` |
| S44 | S00 | 139 | 0 | 49 | 0 | `ctx` `reduced` |
| S44 | S02 | 4 | 0 | 0 | 1 | `TAU` `ground` |
| S44 | S05 | 0 | 0 | 0 | 2 | `cellAt` |
| S44 | S09 | 7 | 0 | 0 | 0 | `time` |
| S44 | S19 | 0 | 0 | 0 | 4 | `emo` |
| S44 | S39 | 3 | 0 | 0 | 0 | `WSX` `pzGot` `MAT` |
| S44 | S46 | 1 | 0 | 0 | 0 | `PZI` |
| S44 | S60 | 15 | 0 | 0 | 32 | `INK` `circle` `rr` |
| S45 | S00 | 93 | 0 | 41 | 2 | `$` `ctx` `reduced` |
| S45 | S02 | 5 | 0 | 0 | 3 | `ground` `TAU` `clamp` |
| S45 | S04 | 2 | 0 | 0 | 0 | `PADS` `ORBS` |
| S45 | S05 | 2 | 0 | 0 | 0 | `realm` |
| S45 | S08 | 0 | 0 | 0 | 1 | `spawn` |
| S45 | S09 | 43 | 0 | 0 | 0 | `P` `cam` `time` |
| S45 | S11 | 0 | 0 | 0 | 5 | `sfx` `speak` |
| S45 | S16 | 3 | 0 | 0 | 0 | `hero` |
| S45 | S19 | 0 | 0 | 0 | 3 | `emo` |
| S45 | S33 | 1 | 0 | 0 | 0 | `JAR` |
| S45 | S39 | 37 | 1 | 6 | 2 | `WSX` `LIFTX` `ZN` `stationY` `ZDEC` |
| S45 | S40 | 2 | 0 | 0 | 2 | `VAULTS` `doorShut` `drawDoor` |
| S45 | S44 | 0 | 0 | 0 | 6 | `drawLab` `drawCab` `drawBone` `drawCry` `drawMach` |
| S45 | S58 | 0 | 0 | 0 | 1 | `tone` |
| S45 | S60 | 34 | 0 | 0 | 19 | `circle` `INK` `W` `H` `S` |
| S46 | S00 | 0 | 0 | 0 | 17 | `$` |
| S46 | S02 | 0 | 0 | 0 | 1 | `clamp` |
| S46 | S03 | 1 | 2 | 0 | 0 | `gold` `lootDirty` |
| S46 | S08 | 0 | 0 | 0 | 1 | `confetti` |
| S46 | S09 | 11 | 2 | 5 | 4 | `keys` `energy` `setTool` `P` `setMode` |
| S46 | S11 | 0 | 1 | 0 | 8 | `talkLock` `speak` `speakStop` `jingle` |
| S46 | S16 | 15 | 0 | 6 | 3 | `hero` `saveHero` `addXp` `COIN` |
| S46 | S17 | 0 | 0 | 0 | 2 | `qEvent` `banner` |
| S46 | S19 | 0 | 0 | 0 | 3 | `say` |
| S46 | S39 | 2 | 0 | 1 | 0 | `pzGot` |
| S46 | S40 | 0 | 0 | 0 | 1 | `doorOpen` |
| S46 | S41 | 0 | 0 | 0 | 2 | `labBadge` |
| S46 | S47 | 5 | 0 | 0 | 0 | `mkMuster` `drMuster` `acMuster` `hiMuster` `syMuster` |
| S46 | S48 | 5 | 0 | 0 | 0 | `mkStern` `drStern` `acStern` `hiStern` `syStern` |
| S46 | S49 | 5 | 0 | 0 | 0 | `mkSpiegel` `drSpiegel` `acSpiegel` `hiSpiegel` `sySpiegel` |
| S46 | S50 | 5 | 0 | 0 | 0 | `mkRobo` `drRobo` `acRobo` `hiRobo` `syRobo` |
| S46 | S51 | 6 | 0 | 0 | 0 | `mkWaage` `drWaage` `acWaage` `hiWaage` `syWaage` |
| S46 | S52 | 6 | 0 | 0 | 0 | `mkEcho` `drEcho` `acEcho` `hiEcho` `syEcho` |
| S46 | S53 | 5 | 0 | 0 | 0 | `mkRohre` `drRohre` `acRohre` `hiRohre` `syRohre` |
| S46 | S54 | 5 | 0 | 0 | 0 | `mkSudoku` `drSudoku` `acSudoku` `hiSudoku` `sySudoku` |
| S46 | S58 | 4 | 3 | 0 | 3 | `pending` `tone` `MAXE` `SEG` `battShown` |
| S46 | S60 | 6 | 0 | 0 | 0 | `H` `W` |
| S46 | S61 | 5 | 0 | 0 | 0 | `LOG` |
| S46 | S63 | 0 | 0 | 0 | 1 | `dayAdd` |
| S47 | S00 | 0 | 0 | 0 | 4 | `$` |
| S47 | S11 | 0 | 0 | 0 | 1 | `speak` |
| S47 | S46 | 0 | 0 | 0 | 4 | `tok` `pzWin` `pzFail` `pzReveal` |
| S47 | S58 | 0 | 0 | 0 | 15 | `shuffle` `ri` |
| S48 | S00 | 0 | 0 | 0 | 4 | `$` |
| S48 | S11 | 0 | 0 | 0 | 4 | `blip` `speak` |
| S48 | S46 | 0 | 0 | 0 | 2 | `pzWin` `pzFail` |
| S48 | S58 | 0 | 0 | 0 | 4 | `ri` `shuffle` |
| S48 | S59 | 1 | 0 | 0 | 0 | `FS` |
| S48 | S60 | 4 | 0 | 0 | 0 | `H` `W` |
| S49 | S00 | 0 | 0 | 0 | 1 | `$` |
| S49 | S11 | 0 | 0 | 0 | 2 | `sfx` `speak` |
| S49 | S46 | 0 | 0 | 0 | 7 | `idxs` `pzCell` `pzFail` `pzWin` |
| S49 | S58 | 0 | 0 | 0 | 3 | `shuffle` `ri` |
| S50 | S11 | 0 | 0 | 0 | 8 | `speak` `sfx` |
| S50 | S46 | 2 | 0 | 0 | 14 | `idxs` `pzCell` `pzDraw` `pzc` `pzFail` |
| S50 | S58 | 0 | 0 | 0 | 2 | `shuffle` `tone` |
| S51 | S00 | 0 | 0 | 0 | 2 | `$` |
| S51 | S02 | 0 | 0 | 0 | 1 | `clamp` |
| S51 | S11 | 0 | 0 | 0 | 5 | `sfx` `speak` |
| S51 | S46 | 2 | 0 | 2 | 7 | `pzWin` `pzFail` `pzReveal` `pzDraw` `pzc` |
| S51 | S58 | 0 | 0 | 0 | 18 | `shuffle` `ri` |
| S51 | S59 | 2 | 0 | 0 | 0 | `SCH` |
| S52 | S11 | 1 | 0 | 0 | 2 | `blip` `muted` |
| S52 | S46 | 6 | 0 | 4 | 16 | `PCOL` `pzc` `pzDraw` `pzLater` `pzWin` |
| S52 | S58 | 0 | 0 | 0 | 1 | `ri` |
| S53 | S00 | 0 | 0 | 0 | 3 | `$` |
| S53 | S11 | 0 | 0 | 0 | 2 | `sfx` `speak` |
| S53 | S46 | 2 | 0 | 1 | 3 | `pzCell` `pzWin` `pzc` `idxs` |
| S53 | S58 | 0 | 0 | 0 | 6 | `ri` `shuffle` |
| S54 | S11 | 0 | 0 | 0 | 2 | `sfx` `speak` |
| S54 | S46 | 0 | 0 | 0 | 8 | `idxs` `tok` `pzCell` `pzWin` `pzFail` |
| S54 | S58 | 0 | 0 | 0 | 10 | `shuffle` `ri` |
| S55 | S00 | 3 | 0 | 0 | 54 | `$` `K` `OPT` |
| S55 | S01 | 21 | 0 | 0 | 0 | `QI` `IC` `PIC` |
| S55 | S09 | 11 | 0 | 4 | 8 | `keys` `doAction` `setMode` `P` `setTool` |
| S55 | S11 | 6 | 5 | 0 | 10 | `speak` `sfx` `muted` `fxOff` `speakStop` |
| S55 | S12 | 2 | 0 | 0 | 1 | `TASKS` `startTask` |
| S55 | S13 | 2 | 0 | 0 | 1 | `renderAlbum` `found` `FINDS` |
| S55 | S14 | 0 | 0 | 0 | 1 | `saveGame` |
| S55 | S16 | 4 | 0 | 1 | 2 | `hero` `openMarket` `buy` |
| S55 | S17 | 6 | 0 | 0 | 0 | `quest` `QDEF` |
| S55 | S18 | 0 | 0 | 0 | 2 | `misTalk` `syncSound` |
| S55 | S19 | 0 | 0 | 0 | 1 | `say` |
| S55 | S28 | 1 | 0 | 0 | 3 | `renderStory` `stBegin` `RECAP` |
| S55 | S30 | 0 | 1 | 0 | 0 | `mapPg` |
| S55 | S32 | 0 | 0 | 0 | 1 | `keyTap` |
| S55 | S33 | 2 | 0 | 0 | 0 | `HANDT` |
| S55 | S37 | 0 | 0 | 0 | 1 | `renderMap` |
| S55 | S38 | 2 | 0 | 0 | 1 | `renderFog` `mapClick` `eggClick` |
| S55 | S42 | 1 | 0 | 0 | 0 | `openLab` |
| S55 | S58 | 4 | 0 | 0 | 5 | `need` `openQuiz` `closeQuiz` `qcur` `tone` |
| S56 | S00 | 0 | 0 | 0 | 2 | `$` |
| S56 | S05 | 1 | 0 | 0 | 0 | `realm` |
| S56 | S09 | 0 | 0 | 0 | 5 | `flash` |
| S56 | S11 | 0 | 0 | 0 | 1 | `speak` |
| S56 | S13 | 1 | 0 | 0 | 1 | `ready` `saveFinds` |
| S56 | S14 | 0 | 2 | 0 | 3 | `idbDo` `snapshot` `realmKey` `frozen` |
| S56 | S15 | 1 | 0 | 0 | 0 | `traveling` |
| S56 | S16 | 0 | 0 | 0 | 1 | `saveHero` |
| S56 | S58 | 0 | 0 | 0 | 6 | `tone` |
| S57 | S00 | 0 | 0 | 0 | 22 | `$` |
| S57 | S01 | 2 | 0 | 0 | 0 | `QI` |
| S57 | S09 | 0 | 0 | 0 | 2 | `flash` |
| S57 | S11 | 0 | 0 | 0 | 2 | `speak` `sfx` |
| S57 | S14 | 0 | 0 | 0 | 2 | `newSeed` `saveGame` |
| S57 | S16 | 3 | 0 | 1 | 0 | `hero` |
| S57 | S17 | 0 | 0 | 0 | 2 | `newQuest` `showQuest` |
| S57 | S55 | 0 | 0 | 0 | 1 | `svg24` |
| S57 | S56 | 1 | 1 | 0 | 2 | `bakSave` `bakPick` `bakIn` `bakLoad` |
| S57 | S60 | 0 | 0 | 0 | 1 | `resetWorld` |
| S58 | S00 | 0 | 0 | 0 | 9 | `$` |
| S58 | S01 | 2 | 0 | 0 | 0 | `IC` `QI` |
| S58 | S02 | 0 | 0 | 0 | 1 | `clamp` |
| S58 | S09 | 27 | 4 | 7 | 3 | `energy` `paused` `keys` `tool` `setTool` |
| S58 | S11 | 7 | 1 | 0 | 2 | `talkLock` `speakStop` `blip` `AC` `muted` |
| S58 | S16 | 2 | 0 | 0 | 0 | `hero` |
| S58 | S33 | 2 | 0 | 0 | 0 | `HANDT` |
| S58 | S40 | 0 | 1 | 0 | 0 | `doorQ` |
| S58 | S46 | 2 | 0 | 0 | 0 | `PZT` |
| S58 | S59 | 0 | 0 | 0 | 1 | `nextQ` |
| S58 | S61 | 2 | 0 | 0 | 0 | `LOG` |
| S59 | S00 | 0 | 0 | 0 | 16 | `$` |
| S59 | S01 | 2 | 0 | 0 | 0 | `IC` `QI` |
| S59 | S02 | 0 | 0 | 0 | 3 | `clamp` |
| S59 | S09 | 14 | 1 | 9 | 3 | `energy` `paused` `keys` `doAction` `P` |
| S59 | S11 | 0 | 0 | 0 | 5 | `speak` `jingle` |
| S59 | S14 | 1 | 0 | 0 | 0 | `frozen` |
| S59 | S16 | 7 | 1 | 4 | 3 | `hero` `saveHero` `heroDirty` `addXp` |
| S59 | S17 | 0 | 0 | 0 | 4 | `banner` `qEvent` |
| S59 | S18 | 0 | 0 | 0 | 1 | `uiOpen` |
| S59 | S32 | 0 | 0 | 0 | 1 | `keyTap` |
| S59 | S40 | 7 | 0 | 1 | 1 | `doorQ` `doorOpen` |
| S59 | S41 | 0 | 0 | 0 | 2 | `labBadge` |
| S59 | S46 | 0 | 0 | 0 | 1 | `pzClose` |
| S59 | S58 | 30 | 3 | 0 | 36 | `SYL` `RHYW` `WORDS` `CASES` `ri` |
| S59 | S61 | 5 | 0 | 0 | 0 | `LOG` |
| S59 | S63 | 0 | 0 | 0 | 2 | `dayAdd` |
| S60 | S00 | 598 | 0 | 245 | 1 | `cv` `ctx` `K` `reduced` `$` |
| S60 | S02 | 130 | 0 | 0 | 10 | `TAU` `clamp` `CELL` `GX` `TOP` |
| S60 | S03 | 9 | 1 | 0 | 1 | `mtop` `blockFilled` `bx1` `bx0` `by0` |
| S60 | S04 | 6 | 4 | 0 | 0 | `bmx` `bio2` `bio` `ORBS` `seen` |
| S60 | S05 | 6 | 0 | 0 | 10 | `BT` `rlm` `realm` `colTop` `setRealm` |
| S60 | S06 | 3 | 0 | 0 | 0 | `clouds` `trees` |
| S60 | S07 | 3 | 2 | 1 | 2 | `tracks` `trackAt` `zips` `demoTrack` |
| S60 | S08 | 6 | 0 | 1 | 1 | `shake` `spawn` `parts` |
| S60 | S09 | 265 | 6 | 27 | 1 | `time` `P` `chest` `task` `cam` |
| S60 | S12 | 1 | 0 | 0 | 1 | `stars` `mark` |
| S60 | S13 | 0 | 0 | 0 | 3 | `drawFinds` `hideFinds` |
| S60 | S14 | 0 | 0 | 0 | 3 | `newSeed` `idbDo` `realmKey` |
| S60 | S16 | 22 | 1 | 1 | 10 | `hero` `drawStall` `props` `drawProp` `pet` |
| S60 | S17 | 0 | 0 | 0 | 1 | `questPoint` |
| S60 | S18 | 4 | 0 | 2 | 4 | `drawMis` `misPoint` `nearBoard` `MS` `misSave` |
| S60 | S19 | 0 | 0 | 0 | 3 | `emo` |
| S60 | S20 | 0 | 0 | 0 | 2 | `nearLift` |
| S60 | S28 | 0 | 0 | 0 | 2 | `storyPoint` `stEnter` |
| S60 | S29 | 0 | 0 | 0 | 7 | `drawWinter` `drawRoll` `drawSkier` `drawDragon` `drawGondola` |
| S60 | S30 | 11 | 0 | 0 | 1 | `EHAT` `FX` `kidScale` `NIGHT_T` `NIGHT_B` |
| S60 | S32 | 0 | 0 | 0 | 1 | `sonarTarget` |
| S60 | S33 | 2 | 1 | 0 | 25 | `drawZips` `drawWrecks` `drawHarps` `drawScope` `drawGeys` |
| S60 | S35 | 0 | 0 | 0 | 2 | `mood` `drawMood` |
| S60 | S36 | 0 | 0 | 0 | 4 | `drawFlora` `drawOrb` `drawWorldBack` `drawWorldFront` |
| S60 | S38 | 2 | 0 | 1 | 0 | `FOG` |
| S60 | S39 | 0 | 2 | 0 | 0 | `matGot` `pzGot` |
| S60 | S40 | 0 | 0 | 0 | 1 | `deepHome` |
| S60 | S41 | 0 | 0 | 0 | 2 | `guidePoint` `deepIcon` |
| S60 | S45 | 2 | 0 | 1 | 4 | `drawFar` `drawNebula` `drawDeep` `drawDark` `MKS` |
| S61 | S00 | 0 | 0 | 0 | 5 | `errAdd` `$` |
| S61 | S02 | 2 | 0 | 0 | 0 | `TOP` `CELL` |
| S61 | S03 | 3 | 0 | 0 | 0 | `waterCount` `lavaCount` `fireCount` |
| S61 | S05 | 1 | 0 | 0 | 0 | `realm` |
| S61 | S08 | 1 | 0 | 0 | 0 | `parts` |
| S61 | S09 | 9 | 0 | 0 | 0 | `paused` `energy` `P` `tool` |
| S61 | S13 | 3 | 0 | 0 | 0 | `ready` |
| S61 | S14 | 2 | 0 | 0 | 0 | `frozen` |
| S61 | S18 | 0 | 0 | 0 | 1 | `uiOpen` |
| S61 | S46 | 1 | 0 | 0 | 0 | `pzc` |
| S61 | S58 | 2 | 0 | 0 | 0 | `MAXE` `SEG` |
| S62 | S00 | 5 | 0 | 0 | 20 | `$` `OPT` `reducedSys` `reduced` `errLoad` |
| S62 | S11 | 8 | 0 | 0 | 2 | `speakStop` `voicesDe` `VCLIP` `VRATES` `VOICE` |
| S62 | S16 | 1 | 0 | 0 | 0 | `hero` |
| S62 | S46 | 1 | 0 | 0 | 0 | `PZT` |
| S62 | S55 | 2 | 0 | 0 | 0 | `VEH` `TOOLS` |
| S62 | S58 | 2 | 0 | 0 | 6 | `ri` `CASES` |
| S62 | S59 | 23 | 0 | 0 | 1 | `SCH` `ZRN` `ABC` `FS` `STAGES` |
| S62 | S61 | 3 | 0 | 0 | 0 | `LOG` |
| S62 | S63 | 3 | 0 | 0 | 3 | `parBars` `parFacts` `dayLoad` `DAY` `LIMS` |
| S63 | S00 | 9 | 1 | 2 | 28 | `$` `errLoad` `ERRK` `OPT` `reduced` |
| S63 | S01 | 1 | 0 | 0 | 0 | `AI` |
| S63 | S02 | 5 | 0 | 0 | 0 | `GY` `GY0` `HOME_GX` |
| S63 | S03 | 1 | 1 | 0 | 0 | `gold` |
| S63 | S05 | 2 | 0 | 0 | 8 | `step` `runsOk` `RLM` `setRealm` |
| S63 | S09 | 8 | 0 | 0 | 9 | `paused` `flash` `update` `syncUI` `pulse` |
| S63 | S10 | 0 | 0 | 0 | 1 | `paintStep` |
| S63 | S11 | 2 | 0 | 2 | 12 | `speak` `sfx` `VOICE` `voiceSave` `speakStop` |
| S63 | S12 | 1 | 0 | 0 | 1 | `taskTick` `updateStars` |
| S63 | S13 | 3 | 1 | 0 | 2 | `ready` `findsTick` `renderAlbum` `saveFinds` |
| S63 | S14 | 4 | 2 | 0 | 15 | `saveGame` `autosave` `idbDo` `restore` `realmKey` |
| S63 | S16 | 19 | 1 | 5 | 3 | `hero` `saveHero` `COIN` `hudG` `hudLoot` |
| S63 | S17 | 2 | 0 | 0 | 4 | `questTick` `showQuest` `QDEF` `newQuest` `banner` |
| S63 | S18 | 1 | 0 | 0 | 8 | `uiOpen` `misTick` `syncSound` |
| S63 | S19 | 0 | 0 | 0 | 2 | `say` |
| S63 | S28 | 1 | 0 | 0 | 3 | `winterTick` `stEnter` `syncOwn` `renderStory` |
| S63 | S30 | 0 | 0 | 0 | 1 | `nextLand` |
| S63 | S33 | 7 | 0 | 0 | 0 | `arrowsTick` `monTick` `geyTick` `metTick` `wreckTick` |
| S63 | S34 | 1 | 0 | 0 | 0 | `worldTick` |
| S63 | S38 | 1 | 0 | 0 | 0 | `fogTick` |
| S63 | S41 | 1 | 0 | 0 | 2 | `deepTick` `deepIntro` `labBadge` |
| S63 | S45 | 1 | 0 | 0 | 0 | `mkTick` |
| S63 | S55 | 1 | 0 | 1 | 0 | `actEl` |
| S63 | S56 | 0 | 0 | 0 | 1 | `bakSave` |
| S63 | S58 | 5 | 1 | 0 | 1 | `WORDS` `SYL` `RHYW` `CASES` `drain` |
| S63 | S59 | 19 | 0 | 5 | 3 | `FS` `MBOX` `STAGES` `fDom` `SCH` |
| S63 | S60 | 7 | 5 | 0 | 7 | `perfT` `perfN` `maxDpr` `resize` `draw` |
| S63 | S61 | 8 | 0 | 0 | 0 | `LOG` |
| S63 | S62 | 6 | 3 | 0 | 12 | `SNAME` `SCOL` `mins` `parRange` `parLoad` |
<!-- /arch:edges -->

</details>

## 4. Geteilter veränderlicher Zustand

<!-- arch:state -->
Sortiert nach Anzahl fremder Sektionen, die schreiben oder verändern (Zuweisung, Eigenschaft setzen, `push`/`fill`/`set` …).

| Name | Art | deklariert | schreibende Sektionen | lesende Sektionen |
|---|---|---|---|---|
| `P` | const | 1919 (S09) | 19: S03 S09 S10 S12 S14 S15 S20 S21 S22 S23 S31 S32 S33 S34 S38 S40 S43 S58 S60 | 38 |
| `hero` | let | 3163 (S16) | 16: S16 S17 S27 S28 S31 S32 S33 S34 S38 S41 S42 S46 S55 S57 S59 S63 | 28 |
| `gold` | let | 1010 (S03) | 15: S09 S12 S13 S16 S17 S19 S21 S26 S31 S32 S33 S34 S41 S46 S63 | 15 |
| `lootDirty` | let | 1010 (S03) | 15: S09 S12 S13 S14 S16 S17 S19 S21 S26 S31 S32 S33 S34 S41 S46 | 1 |
| `ctx` | let | 800 (S00) | 14: S13 S16 S18 S19 S28 S29 S31 S33 S35 S36 S40 S44 S45 S60 | 15 |
| `grid` | const | 950 (S02) | 8: S03 S05 S09 S10 S12 S18 S22 S40 | 13 |
| `gems` | let | 1010 (S03) | 8: S09 S13 S16 S17 S19 S32 S33 S41 | 8 |
| `cam` | const | 1923 (S09) | 8: S09 S12 S14 S15 S34 S38 S43 S60 | 20 |
| `shake` | let | 1909 (S08) | 8: S08 S09 S16 S27 S28 S31 S32 S39 | 7 |
| `seen` | let | 1086 (S04) | 6: S05 S09 S15 S32 S41 S60 | 10 |
| `tracks` | let | 1847 (S07) | 6: S05 S10 S14 S15 S40 S60 | 7 |
| `props` | let | 3168 (S16) | 7: S10 S14 S15 S16 S25 S40 S60 | 8 |
| `popG` | let | 1909 (S08) | 6: S09 S21 S26 S31 S32 S33 | 6 |
| `orbGot` | let | 1086 (S04) | 6: S05 S15 S33 S34 S41 S60 | 4 |
| `energy` | let | 1925 (S09) | 5: S14 S15 S46 S58 S59 | 7 |
| `life` | const | 950 (S02) | 5: S03 S05 S10 S14 S40 | 6 |
| `pet` | const | 3169 (S16) | 6: S09 S16 S31 S32 S38 S41 | 7 |
| `chest` | let | 1922 (S09) | 6: S09 S12 S14 S15 S33 S60 | 4 |
| `talkLock` | let | 2540 (S11) | 5: S19 S42 S43 S46 S58 | 2 |
| `keys` | const | 1924 (S09) | 5: S09 S46 S55 S58 S59 | 9 |
| `FX` | const | 4393 (S30) | 4: S31 S32 S33 S34 | 8 |
| `parked` | const | 1921 (S09) | 5: S09 S14 S15 S33 S60 | 7 |
| `parts` | const | 1898 (S08) | 5: S08 S09 S14 S15 S60 | 6 |
| `pzGot` | let | 5729 (S39) | 4: S15 S40 S46 S60 | 5 |
| `eggGot` | let | 1086 (S04) | 4: S05 S15 S32 S60 | 4 |
| `bombs` | const | 3169 (S16) | 5: S09 S14 S15 S16 S60 | 5 |
| `lootGot` | let | 1086 (S04) | 4: S05 S15 S32 S60 | 3 |
| `task` | let | 1925 (S09) | 5: S09 S12 S14 S15 S60 | 4 |
| `matGot` | let | 5729 (S39) | 4: S15 S40 S41 S60 | 3 |
| `zips` | let | 1847 (S07) | 4: S14 S15 S33 S60 | 2 |
| `stroke` | let | 1925 (S09) | 5: S09 S10 S14 S15 S60 | 3 |
| `strokeId` | let | 1925 (S09) | 5: S09 S10 S14 S15 S60 | 2 |
| `heroDirty` | let | 3168 (S16) | 5: S14 S16 S33 S41 S59 | 1 |
| `guide` | let | 5729 (S39) | 4: S15 S40 S41 S42 | 1 |
| `dkA` | let | 5729 (S39) | 4: S15 S40 S43 S45 | 1 |
| `pzc` | let | 6464 (S46) | 4: S46 S51 S52 S53 | 6 |
| `hidden` | let | 2867 (S13) | 4: S13 S14 S15 S40 | 5 |
| `STR` | let | 1085 (S04) | 3: S05 S39 S40 | 3 |
| `DROPS` | let | 1085 (S04) | 3: S05 S31 S32 | 3 |
| `popM` | let | 1909 (S08) | 3: S09 S32 S33 | 3 |
| `mapPg` | let | 4415 (S30) | 3: S37 S38 S55 | 2 |
| `ghost` | let | 1922 (S09) | 4: S09 S14 S15 S60 | 2 |
| `METS` | let | 5048 (S33) | 4: S09 S14 S15 S33 | 2 |
| `battShown` | let | 7432 (S58) | 4: S46 S58 S59 S63 | 1 |
| `trees` | const | 1831 (S06) | 3: S05 S06 S18 | 14 |
| `SEED` | let | 1010 (S03) | 2: S14 S60 | 8 |
| `tool` | let | 1925 (S09) | 3: S09 S14 S60 | 8 |
| `ORBS` | const | 1084 (S04) | 2: S05 S39 | 6 |
| `paused` | let | 1925 (S09) | 2: S46 S58 | 7 |
| `N` | const | 3745 (S19) | 3: S19 S27 S28 | 7 |
| `PADS` | let | 1085 (S04) | 2: S05 S39 | 5 |
| `LOOT` | let | 1085 (S04) | 2: S05 S40 | 4 |
| `quest` | let | 3345 (S17) | 3: S09 S15 S17 | 5 |
| `stv` | let | 3744 (S19) | 2: S27 S28 | 3 |
| `discoT` | let | 4415 (S30) | 2: S32 S34 | 3 |
| `throws` | let | 4415 (S30) | 2: S31 S32 | 3 |
| `stamp` | const | 950 (S02) | 2: S05 S14 | 2 |
| `pan` | const | 1923 (S09) | 3: S09 S14 S60 | 3 |
| `bolt` | let | 4415 (S30) | 2: S32 S34 | 2 |
| `heliLoad` | let | 4731 (S33) | 3: S14 S33 S60 | 3 |

… und 122 weitere (`--json` liefert alle).
<!-- /arch:state -->

Die wichtigsten Brocken:

- **`P`** (Spielfigur, Fahrzeugzustand, Position): 19 Sektionen schreiben hinein. Faktisch der Spielzustand „Held in der Welt“.
- **`hero`** (Fortschritt, Upgrades, Auftrag, Material, Rätselstufen): 16 schreibende Sektionen. Wird als Ganzes nach `lavaland-hero` gespeichert.
- **`gold`/`gems`/`lootDirty`**: 15 Sektionen ändern Gold, jede setzt danach `lootDirty=true` von Hand. Vergessen heißt: nicht gespeichert.
- **`ctx`**: Der Zeichenkontext ist `let` (`index.html:800`) und wird für Porträts kurz auf einen anderen Canvas umgehängt (`index.html:4196`). 14 Sektionen setzen Canvas-Zustand (`fillStyle`, `globalAlpha` …) direkt.
- **Welt-Felder** `grid`, `life`, `stamp` (`index.html:950`), Zonenränder `zS1…zS3` (`952`), Biome `BIO`, `STR`, `LOOT`, `PADS`, `DROPS` (`1085`): `const`-Typed-Arrays werden in Erzeugung, Spiel und Laden verändert; die `let`-Listen werden bei jedem Weltwechsel neu zugewiesen.
- **Aktuelle Welt** `realm` (`setRealm`, `index.html:1116`) und `SEED`: von `restore` und `resetWorld` gesetzt, von 8 Sektionen gelesen. Viele Caches hängen an `realm+SEED+BIO.length` (z. B. `index.html:5027`, `5087`, `5175`).
- **UI-Modus**: `paused`, `tool`, `task`, `talkLock`, `OVS` (alle Fenster) und `uiOpen()`; geschrieben aus Rätsel, Lernen, Tasten.
- **Speicherschalter** `frozen`, `diskLock`, `saving`, `traveling`, `ready`: werden aus Speichern, Reisen, Umzug und Start gesetzt und überall gelesen.

## 5. Große Funktionen und vermischte Zuständigkeiten

### Funktionen über 150 Zeilen

<!-- arch:god -->
| Funktion | Zeile | Länge | Sektion | Canvas | DOM | Speicher | `Math.random` |
|---|---|---|---|---|---|---|---|
| `draw` | 8278 | 209 | S60 Zeichnen (2) | ja |  |  | 5 |
<!-- /arch:god -->

### Größte Funktionen nach Zeichen

<!-- arch:bigchars -->
Der Code ist dicht (viele Anweisungen je Zeile). Zeilen allein unterschätzen die Größe, deshalb hier die 25 größten Top-Level-Funktionen nach Zeichen.

| Funktion | Zeile | Zeilen | Zeichen | Sektion | Canvas | DOM | Speicher |
|---|---|---|---|---|---|---|---|
| `draw` | 8278 | 209 | 11650 | S60 | ja |  |  |
| `update` | 2311 | 110 | 6055 | S09 |  |  |  |
| `deepWorld` | 5759 | 106 | 5986 | S39 |  |  |  |
| `parRender` | 8744 | 54 | 5380 | S62 |  | ja |  |
| `start` | 9134 | 76 | 5167 | S63 |  |  | ja |
| `mkQ` | 7697 | 63 | 4829 | S59 |  |  |  |
| `drawFlora` | 5399 | 58 | 4528 | S36 | ja |  |  |
| `shapeWorld` | 1413 | 55 | 3718 | S05 |  |  |  |
| `creTick` | 4456 | 62 | 3710 | S31 |  |  |  |
| `step` | 1746 | 81 | 3678 | S05 |  |  |  |
| `build` | 1473 | 60 | 3655 | S05 |  |  |  |
| `storyTick` | 4114 | 52 | 3642 | S28 |  |  | ja |
| `drawFar` | 6395 | 41 | 2926 | S45 | ja |  |  |
| `genCol` | 1541 | 51 | 2843 | S05 |  |  |  |
| `worldTick` | 5303 | 44 | 2621 | S34 |  |  | ja |
| `startTask` | 2720 | 50 | 2546 | S12 |  | ja |  |
| `updSki` | 3793 | 45 | 2288 | S21 |  |  |  |
| `placeFind` | 2870 | 42 | 2263 | S13 |  |  |  |
| `planetDeep` | 5898 | 35 | 2259 | S39 |  |  |  |
| `deepFar` | 5866 | 31 | 2226 | S39 |  |  |  |
| `drawWinter` | 4335 | 34 | 2064 | S29 | ja |  |  |
| `progress` | 2770 | 42 | 1978 | S12 |  |  |  |
| `drawDeco` | 5457 | 26 | 1934 | S36 | ja |  |  |
| `parSchool` | 8809 | 17 | 1918 | S62 |  |  |  |
| `nextQ` | 7774 | 34 | 1915 | S59 |  | ja |  |
<!-- /arch:bigchars -->

### Rendering, DOM und Speichern in einer Funktion

<!-- arch:mixed -->
Top-Level-Funktionen, die mindestens zwei von Canvas-Zeichnen, DOM und Speichern selbst enthalten (Text der Funktion, inkl. innerer Funktionen), längste zuerst.

| Funktion | Zeile | Länge | Canvas | DOM | Speicher |
|---|---|---|---|---|---|
| `travel` | 3096 | 28 |  | ja | ja |
| `frame` | 9099 | 27 | ja | ja |  |
| `renderFog` | 5631 | 26 | ja | ja |  |
| `pzWin` | 6517 | 26 |  | ja | ja |
| `resetWorld` | 8506 | 26 |  | ja | ja |
| `questTick` | 3407 | 22 |  | ja | ja |
| `buy` | 3236 | 19 |  | ja | ja |
| `labBuild` | 6178 | 13 |  | ja | ja |
| `pzClose` | 6492 | 11 |  | ja | ja |
| `saveGame` | 3049 | 10 |  | ja | ja |
| `campRest` | 9018 | 5 |  | ja | ja |
| `openLab` | 6174 | 4 |  | ja | ja |
<!-- /arch:mixed -->

Weitere Mischstellen, von Hand belegt:

- `frame` (`index.html:9099`): Schleife, Protokoll, Simulation, Leistungsanpassung, Zeichnen und das HUD-Icon per `innerHTML` in einer Funktion.
- `saveGame` (`index.html:3049`): Speichern plus Rückmeldung (Banner, Ton, Sprache) im selben Zweig.
- `SIDE` (`index.html:9127`) ist die einzige einheitliche Systemschnittstelle: 18 Tick-Funktionen, jede über `safe()` (`9129`) mit Fehlerschutz. Darunter sind auch `autosave` und `drain` (Akku leeren), also Kernlogik, keine Nebensysteme (siehe `findings.md`).
- Zeichnen der Rätsel (`dr…`) schreibt Markup per `innerHTML`; Eingabe läuft über `data-a`-Attribute und einen zentralen Handler (`S46`).

### DOM-Kopplung

- Keine Inline-Handler im Markup (`onclick="…"` kommt nicht vor). Verdrahtet wird mit 74 `addEventListener` und Delegation über `data-*`-Attribute (`data-a`, `data-go`, `data-shop`, `data-pzt` …).
- 48 Stellen setzen `innerHTML`, meist mit zusammengesetzten SVG-Strings.
- IDs werden als String-Literal `$('id')` angesprochen; `tests/static.mjs` gleicht sie roh gegen das Markup ab.

## 6. Weltgenerierung und Zufall

<!-- arch:gen -->
Wurzeln: `shapeWorld`, `gen`, `newRealm`. Erreichbar: 53 Top-Level-Funktionen.

Keine erreichbare Funktion ruft `Math.random()`.

<!-- /arch:gen -->

Zufallsströme sind `rng(seed)` (mulberry32, `index.html:1829`) mit Seeds der Form `SEED*k+c`, z. B. Biome `rng(SEED*13+7)` (`1257`), Funde `rng(SEED*7+13)` (`2913`), dazu der zustandslose `hash2` (`1012`). Planeten mischen `RLM[id].salt` hinein (`1259`, `1545`). Die Erzeugung ist damit deterministisch; `Math.random` (288 Aufrufe) steckt in Simulation, Teilchen, Rätseln und Lernaufgaben, nicht in der Erzeugung.

Für den Golden-Master heißt das: Erzeugung (`shapeWorld`, `gen`, `newRealm`) ist mit festem `SEED` reproduzierbar, sobald man vor dem ersten `step()` misst. Rätsel- und Aufgabengeneratoren (`mk…`, `mkQ`) brauchen im Test ein ersetztes `Math.random`.

Speicher: `grid` und `life` sind je `GX*GY` = 19 200 × 2 048 = 39,3 Mio. Bytes (`index.html:924`, `950`), zusammen 78,6 MB dauerhaft. Offener PR #92 macht `life` zu einer `Map` (−39 MB). Die Architektur ändert daran nichts, sie muss es aber später ermöglichen (Welt in Abschnitte teilen), siehe `target.md`.

## 7. Kandidaten für `core/`

<!-- arch:leaves -->
Transitive Hülle über Top-Level-Bezüge (jede Erwähnung zählt, auch als Wert). „schreibt“ = Top-Level-Zustand, den die Hülle zuweist oder verändert.

| Wurzel | Zeile | Funktionen | Zustand gelesen | DOM in | Canvas in | Speicher in | `Math.random` in | schreibt |
|---|---|---|---|---|---|---|---|---|
| `rng` | 1829 | 1 | 0 | – | – | – | – | 0: – |
| `hash2` | 1012 | 1 | 0 | – | – | – | – | 0: – |
| `shapeWorld` | 1413 | 28 | 83 | – | – | – | – | 39: `bix` `bio` `bmx` `noCave` +35 |
| `gen` | 1593 | 27 | 84 | – | – | – | – | 21: `grid` `life` `stamp` `genF` +17 |
| `newRealm` | 3086 | 45 | 150 | `newRealm` `$` | – | – | – | 84: `seen` `eggGot` `lootGot` `orbGot` +80 |
| `mkQ` | 7697 | 11 | 9 | – | – | – | `ri` | 0: – |
| `nextQ` | 7774 | 84 | 106 | `nextQ` `$` `answer` `renderBatt` +11 | – | `vcMiss` `factDone` `masterGive` `saveFacts` +3 | `genQ` `ri` `sfx` `confetti` +4 | 57: `qcur` `battShown` `lastF` `lastDom` +53 |
| `mkMuster` | 6567 | 4 | 0 | – | – | – | `ri` | 0: – |
| `mkStern` | 6640 | 3 | 2 | – | – | – | `ri` | 0: – |
| `mkSpiegel` | 6695 | 4 | 1 | – | – | – | `ri` | 0: – |
| `mkRobo` | 6758 | 5 | 2 | – | – | – | `ri` | 0: – |
| `mkWaage` | 6834 | 3 | 1 | – | – | – | `ri` | 0: – |
| `mkEcho` | 6911 | 2 | 1 | – | – | – | `ri` | 0: – |
| `mkRohre` | 6977 | 7 | 2 | – | – | – | `mkRohre` `ri` | 0: – |
| `mkSudoku` | 7078 | 6 | 1 | – | – | – | `ri` | 0: – |
| `snapshot` | 3012 | 3 | 20 | – | – | – | – | 0: – |
| `restore` | 3065 | 51 | 162 | `restore` `$` | – | – | – | 92: `SEED` `life` `stamp` `parts` +88 |
| `packRuns` | 1631 | 1 | 3 | – | – | – | – | 0: – |
| `loadCells` | 1663 | 18 | 79 | – | – | – | – | 23: `cutX` `grid` `genF` `stI` +19 |
| `step` | 1746 | 11 | 43 | – | – | – | `step` `steam` `react` `dust` | 23: `tick` `lavaCount` `waterCount` `fireCount` +19 |
| `idbDo` | 3000 | 2 | 1 | – | – | `idbDo` `idbOpen` | – | 0: – |
<!-- /arch:leaves -->

Ergebnis: Sofort herauslösbar sind `rng`, `hash2`, `packRuns` und die acht Rätselgeneratoren `mk…` (brauchen nur `ri`/`shuffle` und Konstanten) sowie `mkQ` ohne `nextQ`. `shapeWorld`/`gen` sind frei von DOM, schreiben aber 39 bzw. 21 globale Felder: Sie gehen erst nach `core/`, wenn die Welt-Felder ein eigenes Modul haben. `nextQ`, `restore` und `newRealm` sind keine Blätter.

## 8. Wo die Tests Interna ansprechen

Alle Browser-Tests laufen über `window.__ev(string)`, also direktes `eval` im IIFE-Scope (`tests/server.mjs:7`, `:28`). Sie lesen und **schreiben** interne Variablen (`gold=500`, `paused=false`, `hero.pz[...]=…`, `grid[...]=0`). Sobald ein Name in ein Modul wandert, sieht `eval` in `legacy.js` ihn nur noch, wenn er importiert ist, und kann ihn nicht mehr zuweisen. Dazu kommen Textabhängigkeiten auf den Quelltext:

- `tests/server.mjs:7`: `ANCHOR` ist eine wörtliche Codezeile. esbuild druckt Code neu (Leerzeichen, Anführungszeichen), der Anker trifft danach nicht mehr.
- `tests/static.mjs`: alle Prüfungen per Regex auf `index.html`, darunter `$('id')` mit einfachen Anführungszeichen und `localStorage.setItem('…'`. esbuild gibt Strings standardmäßig mit doppelten Anführungszeichen aus.
- `tools/voice/collect.mjs:20`: sammelt Vorlesesätze aus String-Literalen in `'…'` direkt aus `index.html`.
- `.github/workflows/test.yml` (Update-Test) und `tests/upgrade.mjs`: lesen `index.html` von `main` als Altstand.

Angesprochene Namen (aus allen String-Literalen der Testdateien, geschnitten mit den Top-Level-Namen, daher eher zu viele als zu wenige):

<!-- arch:tests -->
| Name | deklariert | Art | benutzt in |
|---|---|---|---|
| `$` | 788 | const | smoke.mjs, crawl.mjs |
| `actIcon` | 8488 | function | smoke.mjs |
| `bakIn` | 7259 | let | save.mjs |
| `bakLoad` | 7377 | function | save.mjs |
| `bakMake` | 7332 | function | save.mjs |
| `BOXX` | 3552 | const | fuzz.mjs |
| `cam` | 1923 | const | smoke.mjs |
| `CELL` | 924 | const | smoke.mjs |
| `clipGet` | 2575 | function | smoke.mjs |
| `closeQuiz` | 7451 | function | smoke.mjs |
| `dayNo` | 7519 | function | smoke.mjs, save.mjs |
| `diskLock` | 2990 | let | save.mjs |
| `doAction` | 2073 | function | smoke.mjs, fuzz.mjs |
| `energy` | 1925 | let | smoke.mjs, fuzz.mjs, crawl.mjs |
| `ERRK` | 790 | const | smoke.mjs, save.mjs, crawl.mjs |
| `errLoad` | 791 | function | smoke.mjs, save.mjs, crawl.mjs |
| `eruT` | 4414 | let | smoke.mjs |
| `factDone` | 7633 | function | smoke.mjs |
| `FLIES` | 5151 | let | smoke.mjs |
| `fName` | 7668 | function | collect.mjs |
| `fogArr` | 5597 | function | save.mjs |
| `fogDirty` | 5595 | let | save.mjs |
| `fogKey` | 5596 | function | save.mjs |
| `fogSave` | 5624 | function | save.mjs |
| `fogSet` | 5604 | function | save.mjs |
| `FS` | 7539 | let | smoke.mjs, save.mjs |
| `FX` | 4393 | const | smoke.mjs |
| `gems` | 1010 | let | crawl.mjs, upgrade.mjs |
| `GEYS` | 5024 | let | fuzz.mjs |
| `gold` | 1010 | let | smoke.mjs, save.mjs, offline.mjs, fuzz.mjs, crawl.mjs, upgrade.mjs |
| `grid` | 950 | const | smoke.mjs, upgrade.mjs |
| `ground` | 948 | function | smoke.mjs, fuzz.mjs |
| `GX` | 924 | const | smoke.mjs, upgrade.mjs |
| `GY` | 924 | const | upgrade.mjs |
| `H` | 7911 | let | smoke.mjs |
| `HARPS` | 5173 | let | smoke.mjs, fuzz.mjs |
| `hero` | 3163 | let | smoke.mjs, save.mjs, crawl.mjs, upgrade.mjs |
| `hidden` | 2867 | let | smoke.mjs, save.mjs, fuzz.mjs, crawl.mjs |
| `JAR` | 5151 | let | smoke.mjs |
| `K` | 806 | const | smoke.mjs |
| `keys` | 1924 | const | smoke.mjs, collect.mjs |
| `last` | 9098 | let | smoke.mjs |
| `lastF` | 7585 | let | smoke.mjs |
| `LOG` | 8534 | const | smoke.mjs, save.mjs |
| `MACH` | 5729 | let | smoke.mjs |
| `MAT` | 5702 | const | crawl.mjs |
| `MAXE` | 7431 | const | smoke.mjs, fuzz.mjs, crawl.mjs |
| `metNext` | 5048 | let | smoke.mjs |
| `METS` | 5048 | let | smoke.mjs |
| `MISX` | 3445 | const | smoke.mjs, fuzz.mjs |
| `mkQ` | 7697 | function | collect.mjs |
| `mkWaage` | 6834 | function | smoke.mjs |
| `MODES` | 7125 | const | fuzz.mjs |
| `MONS` | 4946 | const | smoke.mjs |
| `MROCKS` | 5048 | let | smoke.mjs |
| `MS` | 3446 | let | smoke.mjs |
| `newSeed` | 3081 | function | save.mjs |
| `nextQ` | 7774 | function | smoke.mjs |
| `nightA` | 4415 | let | smoke.mjs |
| `nightOn` | 4415 | let | smoke.mjs, fuzz.mjs |
| `openMarket` | 3235 | function | smoke.mjs |
| `openQuiz` | 7445 | function | smoke.mjs |
| `OPT` | 802 | let | smoke.mjs |
| `optSave` | 803 | function | smoke.mjs |
| `orbGot` | 1086 | let | smoke.mjs |
| `OVS` | 3736 | const | smoke.mjs, save.mjs, fuzz.mjs, crawl.mjs |
| `P` | 1919 | const | smoke.mjs, fuzz.mjs, upgrade.mjs |
| `packJob` | 3022 | let | save.mjs |
| `packStart` | 3023 | function | save.mjs |
| `packStep` | 3024 | function | save.mjs |
| `padKey` | 7809 | function | smoke.mjs |
| `padSubmit` | 7817 | function | smoke.mjs |
| `pan` | 1923 | const | smoke.mjs |
| `parGet` | 8720 | function | save.mjs |
| `parOpen` | 8715 | function | smoke.mjs, crawl.mjs |
| `parts` | 1898 | const | smoke.mjs |
| `paused` | 1925 | let | smoke.mjs, save.mjs, fuzz.mjs, crawl.mjs |
| `pending` | 7432 | let | smoke.mjs |
| `pickFact` | 7594 | function | smoke.mjs |
| `pmax` | 1900 | function | smoke.mjs |
| `px` | 7959 | const | smoke.mjs, offline.mjs |
| `pzClose` | 6492 | function | smoke.mjs, crawl.mjs |
| `pzOpen` | 6472 | function | smoke.mjs, crawl.mjs |
| `PZT` | 6453 | const | crawl.mjs, collect.mjs |
| `QDEF` | 3323 | const | collect.mjs |
| `ready` | 2867 | let | smoke.mjs, save.mjs, offline.mjs, fuzz.mjs, crawl.mjs, upgrade.mjs, collect.mjs |
| `realm` | 1114 | let | smoke.mjs, fuzz.mjs |
| `reduced` | 805 | let | smoke.mjs |
| `reducedSys` | 804 | const | smoke.mjs |
| `resetWorld` | 8506 | function | save.mjs |
| `retry` | 7584 | const | smoke.mjs |
| `RLM` | 1091 | const | fuzz.mjs |
| `ROCK` | 926 | const | smoke.mjs |
| `rr` | 7920 | function | smoke.mjs |
| `S` | 7911 | let | smoke.mjs |
| `saveFacts` | 7556 | function | smoke.mjs, save.mjs |
| `saveFinds` | 2869 | function | smoke.mjs, save.mjs, offline.mjs, upgrade.mjs |
| `saveGame` | 3049 | function | smoke.mjs, save.mjs, offline.mjs, fuzz.mjs, upgrade.mjs |
| `saveHero` | 3170 | function | save.mjs, upgrade.mjs |
| `say` | 3760 | function | collect.mjs |
| `SCH` | 7563 | let | smoke.mjs |
| `scopeOpen` | 5116 | function | fuzz.mjs |
| `SCOPEX` | 5113 | const | smoke.mjs, fuzz.mjs |
| `SCQ` | 5114 | let | smoke.mjs |
| `SEED` | 1010 | let | save.mjs, upgrade.mjs |
| `seen` | 1086 | let | smoke.mjs |
| `SEG` | 7431 | const | smoke.mjs |
| `setMode` | 1936 | function | smoke.mjs, save.mjs, fuzz.mjs |
| `setTool` | 1961 | function | smoke.mjs, fuzz.mjs |
| `SHELL` | 926 | const | smoke.mjs |
| `shout` | 3755 | function | smoke.mjs |
| `SIDE` | 9127 | const | smoke.mjs |
| `spawn` | 1901 | function | smoke.mjs |
| `speak` | 2621 | function | smoke.mjs |
| `speakSplit` | 2568 | function | smoke.mjs |
| `STAGES` | 7520 | const | collect.mjs |
| `surfaceY` | 1734 | function | smoke.mjs |
| `syncUI` | 1962 | function | smoke.mjs |
| `synthText` | 2593 | function | smoke.mjs |
| `talkLock` | 2540 | let | smoke.mjs |
| `teleport` | 2712 | function | smoke.mjs, fuzz.mjs |
| `tick` | 1007 | let | smoke.mjs |
| `time` | 1925 | let | smoke.mjs |
| `tool` | 1925 | let | smoke.mjs |
| `TOP` | 924 | const | smoke.mjs, upgrade.mjs |
| `travel` | 3096 | function | smoke.mjs, fuzz.mjs |
| `VCLIP` | 2566 | let | smoke.mjs |
| `VNAME` | 3322 | const | collect.mjs |
| `VOLC` | 924 | const | fuzz.mjs |
| `W` | 7911 | let | smoke.mjs |
| `WRECKS` | 5085 | let | smoke.mjs, fuzz.mjs |
| `zipAdd` | 4806 | function | fuzz.mjs |
<!-- /arch:tests -->

## 9. Sonstiges aus der Analyse

Nicht deklarierte Namen außer Browser-Globalen:

<!-- arch:undecl -->
keine
<!-- /arch:undecl -->

Top-Level-Namen ohne Bezug außerhalb der eigenen Deklaration und ohne Testbezug:

<!-- arch:unused -->
`SKY_TOP` (928), `SKY_END` (928), `PM` (1090), `numOpts` (7485), `SKY_T` (7923), `SKY_B` (7923)
<!-- /arch:unused -->

Beim Laden ausgeführter Code, der später deklarierte `let`/`const` liest (zeitliche Totzone). Von Hand geprüft: Alle Treffer außer `7559` stehen in Rückrufen oder Objekt-Methoden und laufen erst später; `7559` ist ein echter Startabbruch (`findings.md` F1).

<!-- arch:tdz -->
Kandidaten (Anweisung beim Laden, Bezug, später deklarierter Name). Ein Treffer in einem Rückruf (`addEventListener`, `setTimeout`) ist harmlos, ein Treffer in sofort ausgeführtem Code wirft beim Start.

| Anweisung ab Zeile | Bezug in Zeile | Name | deklariert in Zeile |
|---|---|---|---|
| 1100 | 1100 | `SPACE` | 5729 |
| 1107 | 1107 | `SPACE` | 5729 |
| 1306 | 1310 | `trees` | 1831 |
| 1312 | 1313 | `trees` | 1831 |
| 1338 | 1343 | `trees` | 1831 |
| 2486 | 2490 | `ghostEl` | 7153 |
| 2486 | 2491 | `W` | 7911 |
| 2486 | 2491 | `H` | 7911 |
| 2486 | 2491 | `S` | 7911 |
| 2486 | 2491 | `nightOn` | 4415 |
| 2486 | 2491 | `tkN` | 4415 |
| 2486 | 2491 | `tkT` | 4415 |
| 2486 | 2491 | `N` | 3745 |
| 2503 | 2507 | `W` | 7911 |
| 2503 | 2507 | `S` | 7911 |
| 2503 | 2507 | `H` | 7911 |
| 3532 | 3535 | `LIFTX` | 5690 |
| 3567 | 3580 | `INK` | 7926 |
| 3567 | 3570 | `SCH` | 7563 |
| 3602 | 3606 | `SCH` | 7563 |
| 3602 | 3631 | `INK` | 7926 |
| 3602 | 3624 | `sayT` | 3744 |
| 3636 | 3639 | `SCH` | 7563 |
| 3636 | 3641 | `LIFTX` | 5690 |
| 3636 | 3656 | `sayT` | 3744 |
| 6191 | 6200 | `PZI` | 6463 |
| 6543 | 6551 | `LOG` | 8534 |
| 6543 | 6544 | `pending` | 7432 |
| 6558 | 6559 | `LOG` | 8534 |
| 7207 | 7207 | `pending` | 7432 |
| 7207 | 7207 | `LOG` | 8534 |
| 7210 | 7210 | `qcur` | 7432 |
| 7559 | 7559 | `MBOX` | 7660 |
| 7870 | 7877 | `LOG` | 8534 |
| 7870 | 7883 | `SHORT` | 7886 |
<!-- /arch:tdz -->

Grenzen des Verfahrens: Bezüge über Strings (`$('id')`, `data-*`, `eval` in Tests) und über Eigenschaften (`PZT[i].make`) sieht der Graph nicht als Namensbezug. Eine Erwähnung als Wert zählt wie ein Aufruf. Beides macht die Hüllen eher größer als kleiner.
