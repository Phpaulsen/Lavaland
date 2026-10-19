# Lavaland

2D-Sandbox-Lernspiel für Kinder ab 6, als eine einzige HTML-Datei. `index.html` läuft in jedem Browser, auch direkt geöffnet. Mit GitHub Pages wird daraus zusätzlich eine installierbare App (PWA) mit Vollbild und Offline-Betrieb.

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

## Lizenz

MIT, siehe [LICENSE](LICENSE).
