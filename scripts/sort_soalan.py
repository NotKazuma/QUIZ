"""Susun fail soalan yang dimuat turun dari Telegram ke dalam struktur folder soalan/.

Struktur (ikut susunan sedia ada):
  soalan/DARJAH <n>/<PEPERIKSAAN>/<TAHUN>/D<n> <SUBJEK> <PEPERIKSAAN> <TAHUN>.pdf
    cth. soalan/DARJAH 1/UPP1/2023/D1 JAWI UPP1 2023.pdf
  soalan/DARJAH 5/UPKK/UPKK <TAHUN>/...   dan   soalan/DARJAH 6/SDEA/SDEA <TAHUN>/...

Peperiksaan: UPP1/UPP2/... (Ujian Penilaian Penggal), PPT (Pertengahan Tahun), PAT (Akhir Tahun).

Jalankan:
  python scripts/sort_soalan.py           # dry-run: papar pelan sahaja
  python scripts/sort_soalan.py --apply   # pindahkan fail
"""
import argparse
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOALAN = ROOT / 'soalan'
INBOX = SOALAN / 'telegram'
MANIFEST = INBOX / '.downloaded.json'

# Nama fail dalam group tidak konsisten ("D1 JAWI UPP1 2023", "D1 UPP2 JAWI 2023", "D1 PAT 2025 AKHLAK"),
# jadi darjah, peperiksaan & tahun dicari di mana-mana; baki perkataan = subjek.
LEVEL = re.compile(r'^D\s*(\d)\b\s*', re.IGNORECASE)
EXAM = re.compile(r'\b(UPP\s*\d|PPT|PAT)\b', re.IGNORECASE)
YEAR = re.compile(r'\b(20\d\d)\b')


def load_manifest():
    try:
        return json.loads(MANIFEST.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        return {}


def save_manifest(data):
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding='utf-8')


def plan_for(path):
    """Pulangkan (laluan sasaran, id mesej) atau (None, id mesej) jika nama tidak dapat dihurai."""
    stem, ext = path.stem, path.suffix.lower()
    msg_id = None
    m = re.match(r'^(\d+)_(.*)$', stem)
    if m:
        msg_id, stem = int(m.group(1)), m.group(2)
    stem = ' '.join(stem.split())

    lv, ex, yr = LEVEL.match(stem), EXAM.search(stem), YEAR.search(stem)
    if lv and ex and yr:
        level, exam, year = lv.group(1), ex.group(1), yr.group(1)
        subject = stem[lv.end():]
        subject = EXAM.sub(' ', subject, count=1)
        subject = YEAR.sub(' ', subject, count=1)
        subject = ' '.join(subject.upper().replace('.', ' ').split())   # B.ARAB -> B ARAB
        if not subject:
            return None, msg_id
        if subject == 'ARAB':
            subject = 'B ARAB'                                           # seragam dengan fail DARJAH 4
        exam = re.sub(r'\s+', '', exam.upper())                          # UPP 1 -> UPP1
        name = f'D{level} {subject} {exam} {year}{ext}'
        return SOALAN / f'DARJAH {level}' / exam / year / name, msg_id

    year = re.search(r'20\d\d', stem)
    if year and re.search(r'\bUPKK\b', stem, re.IGNORECASE):
        return SOALAN / 'DARJAH 5' / 'UPKK' / f'UPKK {year.group()}' / f'{stem}{ext}', msg_id
    if year and re.search(r'SDEA', stem, re.IGNORECASE):
        return SOALAN / 'DARJAH 6' / 'SDEA' / f'SDEA {year.group()}' / f'{stem}{ext}', msg_id
    return None, msg_id


def run(apply=False):
    if not INBOX.exists():
        print('Tiada folder soalan/telegram — tiada apa untuk disusun.')
        return
    manifest = load_manifest()
    moved = dupes = skipped = unknown = 0
    for group_dir in sorted(p for p in INBOX.iterdir() if p.is_dir()):
        seen = set(manifest.get(group_dir.name, []))
        for f in sorted(group_dir.iterdir()):
            if not f.is_file():
                continue
            target, msg_id = plan_for(f)
            rel = lambda p: p.relative_to(SOALAN).as_posix()
            if target is None:
                unknown += 1
                print(f'  ?  {rel(f)}  (perlu susun manual)')
                continue
            if target.exists():
                if target.stat().st_size == f.stat().st_size:
                    dupes += 1
                    print(f'  =  {rel(f)}  (pendua {rel(target)})')
                    if apply:
                        f.unlink()
                else:
                    skipped += 1
                    print(f'  !  {rel(f)}  (sasaran sudah wujud dengan saiz berbeza: {rel(target)})')
                    continue
            else:
                moved += 1
                print(f'  -> {rel(f)}\n       {rel(target)}')
                if apply:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(f), str(target))
            if msg_id is not None:
                seen.add(msg_id)
        manifest[group_dir.name] = sorted(seen)
        if apply and not any(group_dir.iterdir()):
            group_dir.rmdir()

    if apply:
        save_manifest(manifest)
    verb = 'dipindah' if apply else 'akan dipindah'
    print(f'\n{moved} {verb}, {dupes} pendua, {skipped} dilangkau, {unknown} perlu susun manual.')
    if not apply and moved + dupes:
        print('Ini dry-run. Jalankan semula dengan --apply untuk memindahkan fail.')


def main():
    ap = argparse.ArgumentParser(description='Susun fail soalan dari soalan/telegram ke struktur DARJAH/.')
    ap.add_argument('--apply', action='store_true', help='Pindahkan fail (tanpa ini hanya papar pelan)')
    args = ap.parse_args()
    run(apply=args.apply)


if __name__ == '__main__':
    sys.exit(main())
