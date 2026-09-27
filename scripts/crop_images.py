"""Potong gambar soalan daripada PDF kertas peperiksaan ke public/images/.

Setiap fail data-src boleh ada senarai "crops": [{ "page": 1, "box": [x0, y0, x1, y1], "out": "darjah-1/jawi-pat2024-q2.jpg" }]
- page: nombor halaman PDF (bermula 1)
- box: kotak dalam piksel imej 90 dpi (seperti gambar halaman yang disemak), diskala ke 200 dpi semasa memotong
Jalankan: python scripts/crop_images.py
"""
import json
from pathlib import Path
import pymupdf

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'data-src'
IMAGES = ROOT / 'public' / 'images'
SCAN_DPI, OUT_DPI = 90, 200


def main():
    made = 0
    for paper in sorted(SRC.rglob('*.json')):
        data = json.loads(paper.read_text(encoding='utf-8'))
        crops = data.get('crops') or []
        if not crops:
            continue
        doc = pymupdf.open(ROOT / 'soalan' / data['pdf'])
        for c in crops:
            out = IMAGES / c['out']
            if out.exists():
                continue
            out.parent.mkdir(parents=True, exist_ok=True)
            x0, y0, x1, y1 = (v * 72 / SCAN_DPI for v in c['box'])  # piksel 90 dpi -> titik PDF
            page = doc[c['page'] - 1]
            pix = page.get_pixmap(dpi=OUT_DPI, clip=pymupdf.Rect(x0, y0, x1, y1))
            pix.save(out, jpg_quality=85) if out.suffix == '.jpg' else pix.save(out)
            made += 1
            print('  ', c['out'])
    print(f'{made} gambar dipotong')


if __name__ == '__main__':
    main()
