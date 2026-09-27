"""Muat turun fail soalan (PDF, Word, gambar) daripada group/channel Telegram yang anda sertai.

Skrip ini log masuk sebagai AKAUN TELEGRAM ANDA SENDIRI (bukan bot), jadi ia boleh membaca
seluruh sejarah group — termasuk fail yang dikongsi sebelum ini.

Sediakan sekali:
  1. Pergi ke https://my.telegram.org -> "API development tools" -> cipta app (nama apa-apa).
     Salin "api_id" dan "api_hash".
  2. pip install telethon

Jalankan (dalam terminal, bukan dalam Claude):
  python scripts/telegram_download.py
  python scripts/telegram_download.py --group "Nama Group" --since 2023-01-01
  python scripts/telegram_download.py --group SOALAN --sort   # muat turun + terus susun ke soalan/DARJAH …

Kali pertama, Telegram akan hantar kod log masuk ke aplikasi Telegram anda. Sesi disimpan di
~/.telegram-soalan/ supaya tidak perlu log masuk lagi. Fail disimpan dalam soalan/telegram/<group>/
(folder soalan/ tidak dimasukkan ke GitHub).
"""
import argparse
import asyncio
import datetime as dt
import getpass
import json
import os
import re
import sys
from pathlib import Path

try:
    from telethon import TelegramClient
    from telethon.tl.types import MessageMediaDocument, MessageMediaPhoto
except ImportError:
    sys.exit('Pasang dahulu: pip install telethon')

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sort_soalan  # noqa: E402  (manifest & penyusunan fail)

ROOT = Path(__file__).resolve().parent.parent
OUT_ROOT = ROOT / 'soalan' / 'telegram'
STATE_DIR = Path.home() / '.telegram-soalan'
CONFIG = STATE_DIR / 'config.json'

# Jenis fail yang dianggap "soalan". Tambah jika perlu.
DOC_EXT = {'.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.webp', '.zip', '.rar'}
MAX_MB = 200


def load_credentials():
    """api_id/api_hash: dari pembolehubah persekitaran, fail konfigurasi, atau ditanya sekali."""
    api_id = os.environ.get('TG_API_ID')
    api_hash = os.environ.get('TG_API_HASH')
    if api_id and api_hash:
        return int(api_id), api_hash
    if CONFIG.exists():
        data = json.loads(CONFIG.read_text(encoding='utf-8'))
        return int(data['api_id']), data['api_hash']
    print('Dapatkan api_id & api_hash di https://my.telegram.org -> API development tools')
    api_id = input('api_id: ').strip()
    api_hash = getpass.getpass('api_hash (tidak dipapar): ').strip()
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    CONFIG.write_text(json.dumps({'api_id': api_id, 'api_hash': api_hash}), encoding='utf-8')
    try:
        os.chmod(CONFIG, 0o600)
    except OSError:
        pass
    return int(api_id), api_hash


def safe_name(name):
    name = re.sub(r'[\\/:*?"<>|\r\n]+', '_', name).strip(' .')
    return name[:120] or 'tanpa-nama'


async def pick_group(client, wanted):
    dialogs = [d for d in await client.get_dialogs() if d.is_group or d.is_channel]
    if wanted:
        matches = [d for d in dialogs if wanted.lower() in (d.name or '').lower()]
        if len(matches) == 1:
            return matches[0]
        if not matches:
            sys.exit(f'Tiada group mengandungi nama "{wanted}".')
        dialogs = matches
    print('\nGroup / channel anda:')
    for i, d in enumerate(dialogs, 1):
        print(f'  {i:3}. {d.name}')
    choice = input('\nPilih nombor group: ').strip()
    return dialogs[int(choice) - 1]


def file_name_for(msg):
    """Nama fail asal (dokumen) atau nama berdasarkan tarikh (gambar)."""
    if isinstance(msg.media, MessageMediaPhoto):
        return f'{msg.date:%Y%m%d_%H%M%S}_{msg.id}.jpg'
    doc = msg.media.document
    for attr in doc.attributes:
        if getattr(attr, 'file_name', None):
            return f'{msg.id}_{safe_name(attr.file_name)}'
    ext = (doc.mime_type or '').split('/')[-1]
    return f'{msg.date:%Y%m%d_%H%M%S}_{msg.id}.{ext or "bin"}'


async def main():
    ap = argparse.ArgumentParser(description='Muat turun fail soalan dari group Telegram.')
    ap.add_argument('--group', help='Sebahagian nama group (jika tidak diberi, senarai akan dipapar)')
    ap.add_argument('--since', help='Hanya mesej selepas tarikh ini (YYYY-MM-DD)')
    ap.add_argument('--no-photos', action='store_true', help='Langkau gambar, ambil dokumen sahaja')
    ap.add_argument('--dry-run', action='store_true', help='Senaraikan fail sahaja, jangan muat turun')
    ap.add_argument('--sort', action='store_true', help='Selepas muat turun, susun fail ke soalan/DARJAH …')
    args = ap.parse_args()

    api_id, api_hash = load_credentials()
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    async with TelegramClient(str(STATE_DIR / 'session'), api_id, api_hash) as client:
        group = await pick_group(client, args.group)
        out_dir = OUT_ROOT / safe_name(group.name)
        out_dir.mkdir(parents=True, exist_ok=True)
        since = dt.datetime.fromisoformat(args.since).replace(tzinfo=dt.timezone.utc) if args.since else None
        print(f'\nMengimbas "{group.name}" -> {out_dir}\n')

        # Manifest id mesej yang sudah dimuat turun — supaya fail yang sudah disusun (dipindah keluar
        # dari folder ini oleh sort_soalan.py) tidak dimuat turun semula.
        manifest = sort_soalan.load_manifest()
        done_ids = set(manifest.get(out_dir.name, []))

        def remember(msg_id):
            done_ids.add(msg_id)
            manifest[out_dir.name] = sorted(done_ids)
            sort_soalan.save_manifest(manifest)

        found = downloaded = skipped = 0
        async for msg in client.iter_messages(group, reverse=True, offset_date=since):
            if not msg.media or not isinstance(msg.media, (MessageMediaDocument, MessageMediaPhoto)):
                continue
            if isinstance(msg.media, MessageMediaPhoto) and args.no_photos:
                continue
            name = file_name_for(msg)
            if Path(name).suffix.lower() not in DOC_EXT:
                continue
            size = getattr(getattr(msg.media, 'document', None), 'size', 0) or 0
            if size > MAX_MB * 1024 * 1024:
                print(f'  langkau (terlalu besar {size // 2**20} MB): {name}')
                continue
            found += 1
            target = out_dir / name
            if msg.id in done_ids or target.exists():
                skipped += 1
                continue
            if args.dry_run:
                print(f'  [{msg.date:%Y-%m-%d}] {name}')
                continue
            print(f'  muat turun [{msg.date:%Y-%m-%d}] {name}')
            await client.download_media(msg, file=str(target))
            remember(msg.id)
            downloaded += 1

        print(f'\nSelesai: {found} fail soalan dijumpai, {downloaded} dimuat turun, {skipped} sudah ada.')
        print(f'Folder: {out_dir}')

    if args.sort and not args.dry_run:
        print('\nMenyusun fail ke folder DARJAH …\n')
        sort_soalan.run(apply=True)


if __name__ == '__main__':
    asyncio.run(main())
