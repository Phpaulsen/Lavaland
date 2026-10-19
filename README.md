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

## Lizenz

MIT, siehe [LICENSE](LICENSE).
