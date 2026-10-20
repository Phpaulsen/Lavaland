"""Erzeugt die Sprachaufnahmen für alle Sätze aus texts.json.

Aufruf (aus dem Repo-Wurzelordner):
  pip install piper-tts
  python3 tools/voice/build.py /pfad/zu/de-thorsten-low.onnx

Stimme: Piper (https://github.com/rhasspy/piper), deutsche Thorsten-Stimme (CC0).
Piper spricht über espeak-ng-Lautschrift, die deutsche Wörter (ß, Umlaute, Zusammensetzungen) zuverlässig richtig ausspricht.
Ergebnis: audio/<id>.ogg (Opus) und audio/index.json mit Satz -> id. Vorhandene Aufnahmen werden wiederverwendet,
nicht mehr gebrauchte gelöscht. ffmpeg muss installiert sein.
"""
import hashlib, json, os, re, subprocess, sys, tempfile, unicodedata, wave
from piper import PiperVoice, SynthesisConfig

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
OUT = os.path.join(ROOT, 'audio')
model = sys.argv[1]
voice = PiperVoice.load(model)
# Neuere espeak-ng-Versionen liefern ç als c + Cedille. Die Stimme kennt nur das ganze Zeichen, sonst wird aus „ich“ ein „ick“.
_ph = voice.phonemize
voice.phonemize = lambda text: [list(unicodedata.normalize('NFC', ''.join(s))) for s in _ph(text)]
# Etwas ruhiger als normal, für Erstklässler. Das Tempo regelt sonst die Elternansicht.
cfg = SynthesisConfig(length_scale=1.08)

def spoken(t):
    # Gedankenstrich in Silbenlösungen (Ba – na – ne) als kurze Pause; Bildzeichen fallen weg.
    t = t.replace(' – ', ', ')
    t = re.sub(r'[←-⯿\U0001F000-\U0001FAFF️‍]', '', t)
    return re.sub(r'\s+', ' ', t).strip()

texts = json.load(open(os.path.join(ROOT, 'tools', 'voice', 'texts.json'), encoding='utf8'))
os.makedirs(OUT, exist_ok=True)
idx = {}
tmp = tempfile.mkdtemp()
for i, t in enumerate(texts):
    sid = hashlib.sha1(('v1|' + os.path.basename(model) + '|' + spoken(t)).encode('utf8')).hexdigest()[:10]
    idx[t] = sid
    dst = os.path.join(OUT, sid + '.ogg')
    if os.path.exists(dst):
        continue
    w = os.path.join(tmp, 'a.wav')
    with wave.open(w, 'wb') as f:
        voice.synthesize_wav(spoken(t), f, syn_config=cfg)
    # Stille am Anfang und Ende kürzen, Lautstärke angleichen, als Opus (Sprache, 16 kbit/s) speichern.
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', w, '-af',
                    'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,adelay=40,apad=pad_dur=0.08,loudnorm=I=-18:TP=-2',
                    '-ac', '1', '-ar', '24000', '-c:a', 'libopus', '-b:a', '16k', '-application', 'voip', dst], check=True)
    if i % 100 == 0:
        print(i, '/', len(texts), file=sys.stderr)
keep = set(v + '.ogg' for v in idx.values())
for f in os.listdir(OUT):
    if f.endswith('.ogg') and f not in keep:
        os.remove(os.path.join(OUT, f))
with open(os.path.join(OUT, 'index.json'), 'w', encoding='utf8') as f:
    json.dump({'v': 1, 'voice': os.path.basename(model).replace('.onnx', ''), 'c': idx}, f, ensure_ascii=False, separators=(',', ':'))
print(len(idx), 'Sätze', file=sys.stderr)
