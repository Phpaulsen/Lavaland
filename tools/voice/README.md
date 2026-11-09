# Vorlesestimme

Das Spiel liest feste Sätze als Aufnahme aus `audio/` vor. Die Browserstimme spricht nur Sätze ohne Aufnahme.

Neu erzeugen, wenn sich Texte im Spiel ändern:

1. `node tools/voice/collect.mjs > tools/voice/texts.json` (braucht playwright wie die Tests)
2. Stimme laden: https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-de-thorsten-low.tar.gz (CC0) und entpacken
3. `pip install piper-tts` und `python3 tools/voice/build.py pfad/zu/de-thorsten-low.onnx` (braucht ffmpeg)

Vorhandene Aufnahmen werden wiederverwendet, überflüssige gelöscht. Sätze, die im Spiel ohne Aufnahme vorkamen, lassen sich in der Elternansicht unter „Vorlesen“ kopieren.

Nur löschen (ohne Stimme): `node tests/voice.mjs tools/voice/texts.json --prune` entfernt Aufnahmen, die kein Satz mehr braucht. CI scheitert, solange es solche gibt.
