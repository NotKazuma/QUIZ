"""Muat turun imej emoji 3D (Fluent Emoji, lesen MIT) untuk setiap emoji yang digunakan dalam src/.

Imej disimpan dalam public/emoji/<kod>.webp dan pemetaan dalam src/lib/emoji-map.json.
Hanya emoji baharu dimuat turun. Jalankan selepas menambah emoji dalam kod:
  python scripts/fetch_emoji.py
"""
import glob
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'emoji'
MAP = ROOT / 'src' / 'lib' / 'emoji-map.json'
BASE = 'https://cdn.jsdelivr.net/npm/@lobehub/fluent-emoji-3d@1.1.0/assets/'
PATTERN = re.compile(r'(?:[\U0001F000-\U0001FAFF☀-➿⬀-⯿⌀-⏿])'
                     r'(?:️|‍[\U0001F000-\U0001FAFF☀-➿]️?|[\U0001F3FB-\U0001F3FF])*'
                     r'|[0-9#*]️?⃣')  # keycap: 1️⃣ 2️⃣ …


def code(e):
    return '-'.join(f'{ord(c):x}' for c in e)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    mapping = json.loads(MAP.read_text(encoding='utf-8')) if MAP.exists() else {}
    used = set()
    for f in glob.glob(str(ROOT / 'src' / '**' / '*.js*'), recursive=True):
        if f.endswith('emoji-map.json'):
            continue
        used.update(PATTERN.findall(Path(f).read_text(encoding='utf-8')))
    added, missing = [], []
    for e in sorted(used - set(mapping)):
        for c in [code(e), code(e.replace('️', '')), code(e) + '-fe0f']:
            try:
                data = urllib.request.urlopen(BASE + c + '.webp', timeout=20).read()
            except Exception:
                continue
            (OUT / f'{c}.webp').write_bytes(data)
            mapping[e] = c
            added.append(e)
            break
        else:
            missing.append(e)
    MAP.write_text(json.dumps(mapping, ensure_ascii=False, indent=0), encoding='utf-8')
    print(f'{len(added)} emoji baharu dimuat turun: {" ".join(added)}')
    if missing:
        print('Tiada imej 3D (dipapar sebagai teks):', ' '.join(missing))


if __name__ == '__main__':
    main()
