# Lavaland

2D-Sandbox-Lernspiel für Kinder ab 6, als eine einzige HTML-Datei. `index.html` läuft in jedem Browser, auch direkt geöffnet. Mit GitHub Pages wird daraus zusätzlich eine installierbare App (PWA) mit Vollbild und Offline-Betrieb.

## Was das Kind tut

Graben, bauen, entdecken. Laufen ist immer frei. Was mächtig ist (Bohrer, Rakete, Fahrzeuge, die tiefen Schichten), braucht Energie aus dem Akku oder Zahnräder aus Rätseln. Den Akku lädt man mit kurzen Lernaufgaben.

- **Lernaufgaben** nach Leitner: Jede Aufgabe (z. B. 3 + 4, Anlaut von „Maus“) hat ihr eigenes Fach. Richtig gewusst wandert sie nach oben und kommt seltener, falsch wandert sie nach Fach 1. Neue Aufgaben kommen in Schulbuch-Reihenfolge. Rechnen mit Ziffernblock (zwei Versuche), Buchstaben und Wörter mit Bildauswahl (Lösung sofort sichtbar).
- **Meistersteine**: Sitzt eine Aufgabe an mehreren Tagen, gibt es einen Meisterstein. Der Bohrer ab Stufe 2 braucht sie. Die Rechentafel im Labor zeigt den Stand.
- **Rätsel**: Muster, Spiegel, Waage (bis 20), Roboter, Sternbild. Sie geben Zahnräder.
- **Planeten**: Mond, Eisplanet, Blubberplanet und kleine Planeten sind eigene Welten mit Unterwelt. Ganz unten liegt ein Planetenkern.
- **Karte und Leuchtmarken**: Die Karte zeigt nur, was schon erkundet ist. Leuchtmarken markieren Orte unter der Erde, auf der Karte kann man zu ihnen springen.
- **Lagerfeuer**: Nach einem geschafften Abschnitt kommt ein Haltepunkt mit Tagesbilanz. Weiterspielen geht immer.
- **Fahrzeuge und Werkzeuge**: Heißluftballon, Hubschrauber mit Lastenhaken, Segelboot, Kletterkäfer, Seilrutsche. Schaufel und Spitzhacke graben zu Fuß, Pfeil und Bogen treffen Zielscheiben und Glibbermonster in Höhlen.
- **Missionen** am Missionsbrett: Küken retten, Pakete nach Zahlen ausliefern, Schatzkarte mit Plusaufgabe, Obstkorb abzählen, Feuerwehr, Flaggen auf Planetengipfeln.
- **Entdecken**: Geysire, Sternschnuppen, Schiffswrack, Sternwarte (Sterne zählen), Glühwürmchen, Kristallharfe, Vulkanausbruch.

Bewusst nicht drin: Serienbelohnungen, Lootboxen, Wartezeiten, Sperren.

## Auf dem Handy installieren

- **iPhone/iPad (Safari):** Teilen → „Zum Home-Bildschirm“. Das Spiel startet dann ohne Browser-Leisten.
- **Android (Chrome):** Menü → „App installieren“ bzw. „Zum Startbildschirm hinzufügen“. Das Spiel startet dann im Vollbild. Im normalen Browser-Tab gibt es im Menü (Zahnrad) einen Vollbild-Knopf.

Wichtig für iOS: Die Homescreen-App hat einen eigenen Speicher, getrennt vom Safari-Tab. Erst installieren, dann spielen, oder den Spielstand umziehen.

## Spielstand umziehen

Der Spielstand liegt im Browser und gehört zur jeweiligen Adresse (claude.ai-Artefakt, GitHub Pages, Homescreen-App). Zum Umziehen:

1. Am alten Ort: Zahnrad → Pfeil aus der Kiste. Es entsteht eine Datei `lavaland-JJJJ-MM-TT.json`.
2. Am neuen Ort: Zahnrad → Pfeil in die Kiste, Datei wählen, mit dem grünen Haken bestätigen.

Die Datei enthält Welt, Held, Funde, Einstellungen und das Spielprotokoll (`lavaland-log`, falls vorhanden).

## Elternansicht

Das Spiel führt ein Protokoll nur auf diesem Gerät (IndexedDB `lavaland-log`): Zeit je Bereich (Lernaufgaben, Rätsel, Sandbox, Sandbox mit leerem Akku, Menüs), jede Lernaufgabe mit Fakt, allen angetippten Antworten und Antwortzeiten, jedes Rätsel mit Stufe, Fehlern, Tipps und Ausgang. Das Protokoll beeinflusst das Spiel nicht.

Öffnen: Zahnrad → im Menüfenster 3 Sekunden auf eine freie Stelle zwischen den Knöpfen drücken → Malaufgabe lösen. Dort gibt es auch Export und Löschen. Rohdaten werden nach 90 Tagen gelöscht, die Tageszeiten bleiben.

In der Elternansicht lässt sich außerdem einstellen:

- **Schulstand**: Zahlenraum und Buchstaben, die in der Schule schon dran waren. Neue Aufgaben kommen nur daraus.
- **Spielzeit am Tag**: Ist sie erreicht, kommt das Lagerfeuer mit Gute-Nacht-Ansage, danach alle 10 Minuten wieder. Das Spiel sperrt nicht.
- **Spielstand sichern**: Erinnerung, wenn lange nicht gesichert wurde.
- **Stolperaufgaben**: Welche Aufgaben oft falsch sind.
- **Spielwelt**: Höhlenmonster aus, ruhige Darstellung (kein Wackeln, Blinken, weniger Funken). Die ruhige Darstellung gilt auch, wenn das Gerät „Bewegung reduzieren“ eingestellt hat.

Am Rechner gibt es Tastenkürzel: Pfeile/WASD laufen, F Fahrzeuge, T Werkzeug, K Karte, E Aufgabe, B Buch, M Menü, X Aussteigen, ? zeigt die Liste.

## Datenschutz

- Das Spiel sendet nichts: kein Konto, keine Werbung, keine Statistik, keine Schriften oder Skripte von fremden Servern (per Content-Security-Policy erzwungen: `connect-src 'self'`). Alles bleibt im Browser des Geräts.
- Daten verlassen das Gerät nur, wenn man selbst „Sichern“ oder „Protokoll exportieren“ antippt.
- GitHub Pages sieht beim Laden wie jeder Webserver die IP-Adresse. Die installierte App startet danach aus dem eigenen Speicher.
- Vorlesen nutzt die Sprachausgabe des Browsers. Online-Stimmen (in der Elternansicht mit ☁ markiert) schicken den vorgelesenen Text an den Hersteller (z. B. Google). Der Text enthält nur Aufgaben und Ansagen, keine Namen. Wer das nicht will, wählt eine lokale Stimme.

## Entwicklung

Alles steckt in `index.html` (Spiel, Grafik, Töne), dazu `sw.js` für den Offline-Betrieb. Kein Build-Schritt: Datei öffnen genügt.

- **Tests**: `tests/smoke.mjs` startet das Spiel in einem Handy-Browser und prüft Start, Laufen, eine Lernaufgabe, Elternansicht, Planetenreise und Neuladen. Lokal: `npm i --no-save playwright && npx playwright install chromium && node tests/smoke.mjs`. `tests/offline.mjs` prüft, dass die App nach dem ersten Besuch ohne Netz startet, `tests/upgrade.mjs`, dass ein Spielstand der Live-Version (main) nach dem Update weiterläuft. `tests/static.mjs` prüft ohne Browser Syntax, Größenbudget, Element-IDs und dass keine fremden Skripte geladen werden. `tests/fuzz.mjs` spielt zufällig (Startwert `FUZZ_SEED`, Dauer `FUZZ_SEC`) und schlägt bei jedem Seitenfehler an. Alles läuft automatisch bei jedem PR.
- **Absturzschutz**: Ein Fehler in einem Nebensystem (Monster, Geysire, Missionen …) hält das Spiel nicht an. Nach drei Fehlern wird nur dieses System abgeschaltet und in `lavaland-err` vermerkt.
- **Jeder Merge auf `main` geht sofort live** (GitHub Pages). Deshalb nur über PRs mit grünem Test.
- **Spielstand nie brechen**: Speicherformate nur rückwärtskompatibel ändern. Neue Daten bekommen neue Schlüssel, alte Schlüssel bleiben lesbar. Weltgenerierung neuer Dinge mit eigenem Zufallsstrom, damit bestehende Welten gleich bleiben.
- **Service Worker**: Bei Änderungen an der Dateiliste in `sw.js` die Versionsnummer `CACHE` hochzählen. Die Seite selbst lädt immer zuerst aus dem Netz.

Gespeicherte Daten (alles nur auf dem Gerät):

| Ort | Inhalt |
|---|---|
| IndexedDB `lavaland` | Welt (Erde und je Planet) |
| IndexedDB `lavaland-log` | Spielprotokoll für die Elternansicht |
| localStorage `lavaland-hero`, `-finds`, `-stars`, `-skill` | Held, Funde, Gold, Sterne |
| localStorage `lavaland-facts` | Leitner-Fächer je Aufgabe |
| localStorage `lavaland-school`, `-limit` | Schulstand, Tageslimit |
| localStorage `lavaland-day` | Tagesbilanz fürs Lagerfeuer |
| localStorage `lavaland-realm`, `-fog*`, `-marks*` | aktuelle Welt, Karte, Leuchtmarken |
| localStorage `lavaland-mute`, `-lefty`, `-psst`, `-news`, `-bak-at` | Einstellungen und Hinweise |
| localStorage `lavaland-voice` | Vorlesestimme und Tempo |
| localStorage `lavaland-opt` | Höhlenmonster an/aus, ruhige Darstellung |
| localStorage `lavaland-err` | die letzten 20 technischen Fehler (Elternansicht) |

## Lizenz

MIT, siehe [LICENSE](LICENSE).
