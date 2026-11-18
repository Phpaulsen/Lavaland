"""Erzeugt die Sprachaufnahmen für alle Sätze aus texts.json mit einer Azure-Neuralstimme.

Aufruf (aus dem Repo-Wurzelordner):
  AZURE_SPEECH_KEY=... python3 tools/voice/build_azure.py [Stimme]            # alle Sätze nach audio/
  AZURE_SPEECH_KEY=... python3 tools/voice/build_azure.py [Stimme] --probe DIR Satz...   # nur Hörprobe nach DIR

Ohne AZURE_SPEECH_KEY wird kein Schlüssel mitgeschickt (für Umgebungen, deren Proxy ihn einsetzt).
Region über AZURE_SPEECH_REGION (Standard westeurope). Stimme Standard de-DE-KatjaNeural.
Ergebnis wie build.py: audio/<id>.ogg (Opus) und audio/index.json. Vorhandene Aufnahmen werden wiederverwendet,
nicht mehr gebrauchte gelöscht. ffmpeg muss installiert sein.
"""
import hashlib, json, os, re, subprocess, sys, tempfile, time
from xml.sax.saxutils import escape
import requests

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
OUT = os.path.join(ROOT, 'audio')
REGION = os.environ.get('AZURE_SPEECH_REGION', 'westeurope')
KEY = os.environ.get('AZURE_SPEECH_KEY')
URL = 'https://%s.tts.speech.microsoft.com/cognitiveservices/v1' % REGION
# Etwas ruhiger als normal, für Erstklässler. Das Tempo regelt sonst die Elternansicht.
RATE = '-8%'

args = sys.argv[1:]
probe = None
if '--probe' in args:
    i = args.index('--probe')
    probe = (args[i + 1], args[i + 2:])
    args = args[:i]
VOICE = args[0] if args else 'de-DE-KatjaNeural'

def spoken(t):
    # Gedankenstrich in Silbenlösungen (Ba – na – ne) als kurze Pause; Bildzeichen fallen weg.
    t = re.sub(r'[←-⯿\U0001F000-\U0001FAFF️‍]', '', t)
    return re.sub(r'\s+', ' ', t).strip()

def ssml(t):
    # Silben (Ba – na – ne) mit deutlicher Pause statt Komma-Melodie.
    parts = [escape(p) for p in spoken(t).split(' – ')]
    body = '<break time="350ms"/>'.join(parts)
    return ('<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="de-DE">'
            '<voice name="%s"><prosody rate="%s">%s</prosody></voice></speak>') % (VOICE, RATE, body)

def synth(t, wav):
    h = {'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
         'User-Agent': 'lavaland-voice'}
    if KEY:
        h['Ocp-Apim-Subscription-Key'] = KEY
    for n in range(6):
        r = requests.post(URL, data=ssml(t).encode('utf8'), headers=h, timeout=60)
        if r.status_code == 200:
            open(wav, 'wb').write(r.content)
            return
        if r.status_code in (429, 500, 502, 503):
            time.sleep(2 ** n)
            continue
        raise SystemExit('Azure %d: %s' % (r.status_code, r.text[:300]))
    raise SystemExit('Azure: zu viele Fehlversuche')

def encode(wav, dst):
    # Stille am Anfang und Ende kürzen, Lautstärke angleichen, als Opus (Sprache, 24 kbit/s) speichern.
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-af',
                    'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,adelay=40,apad=pad_dur=0.08,loudnorm=I=-18:TP=-2',
                    '-ac', '1', '-ar', '24000', '-c:a', 'libopus', '-b:a', '24k', '-application', 'audio', dst], check=True)

tmp = tempfile.mkdtemp()
w = os.path.join(tmp, 'a.wav')

if probe:
    d, sentences = probe
    os.makedirs(d, exist_ok=True)
    for i, t in enumerate(sentences):
        synth(t, w)
        encode(w, os.path.join(d, '%s-%02d.ogg' % (VOICE, i)))
    sys.exit(0)

texts = json.load(open(os.path.join(ROOT, 'tools', 'voice', 'texts.json'), encoding='utf8'))
os.makedirs(OUT, exist_ok=True)
idx = {}
for i, t in enumerate(texts):
    sid = hashlib.sha1(('v2|' + VOICE + '|' + RATE + '|' + spoken(t)).encode('utf8')).hexdigest()[:10]
    idx[t] = sid
    dst = os.path.join(OUT, sid + '.ogg')
    if os.path.exists(dst):
        continue
    synth(t, w)
    encode(w, dst)
    if i % 100 == 0:
        print(i, '/', len(texts), file=sys.stderr)
keep = set(v + '.ogg' for v in idx.values())
for f in os.listdir(OUT):
    if f.endswith('.ogg') and f not in keep:
        os.remove(os.path.join(OUT, f))
with open(os.path.join(OUT, 'index.json'), 'w', encoding='utf8') as f:
    json.dump({'v': 1, 'voice': VOICE, 'c': idx}, f, ensure_ascii=False, separators=(',', ':'))
print(len(idx), 'Sätze', file=sys.stderr)
