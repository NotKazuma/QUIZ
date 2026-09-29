#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Semak ejaan Jawi dalam data-src/.

Guna:
    python scripts/semak_jawi.py            # lapor sahaja
    python scripts/semak_jawi.py --baiki    # baiki huruf varian secara automatik

Yang disemak:
  1. Huruf varian Parsi/Urdu yang salah  (ک گ ڬ ی پ)  -> (ك ݢ ݢ ي ڤ)
  2. ݢ (ga) di tempat ڠ (nga)            contoh: اورݢ -> اورڠ
  3. غ (ghain) di tempat ڠ (nga)          contoh: اورغ -> اورڠ
  4. ف (fa)  di tempat ڤ (pa)             contoh: تمفت -> تمڤت
  5. Aksara Latin yang tertinggal dalam teks soalan
  6. Indeks jawapan `a` di luar julat `o`

Perkataan Arab tulen dikecualikan melalui senarai putih di bawah.
"""
import argparse
import collections
import glob
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data-src")

# --- huruf ---
KAF_P, KAF = "ک", "ك"      # ک -> ك
GAF_P, GAF_U, GA = "گ", "ڬ", "ݢ"   # گ ڬ -> ݢ
YEH_P, YEH = "ی", "ي"      # ی -> ي
PEH_P, PA = "پ", "ڤ"       # پ -> ڤ
NGA, GHAIN, FA = "ڠ", "غ", "ف"

VARIAN = {KAF_P: KAF, GAF_P: GA, GAF_U: GA, YEH_P: YEH, PEH_P: PA,
          "‌": "", "‍": ""}

# Perkataan Arab yang memang guna غ
GHAIN_OK = {
    "بالغ", "بالغ؟", "بالغ،", "مغلظة", "مغلظة،", "مُغَلَّظَة", "إدغام", "ادغام",
    "مغرب", "الصيغة", "صيغة", "الغزالي", "تبليغ", "تبليغ،", "تَبْلِيغ", "غير",
    "الغابة", "غزال", "غنم", "بلوغ", "اغتسال", "لغة", "اللغة", "مبلغ", "غسل",
    "الغسل", "غافل", "غيبة", "مغفرة", "استغفار", "الغيب", "غضب", "الغضب",
    "غالب", "شغل", "الغفور", "غفور", "صغير", "صغيرة", "لغو", "غرة", "غُرَّة",
}

# Perkataan Arab yang memang guna ف
FA_OK = {
    "حروف", "حروف٢", "صيفت", "برصيفت", "فرض", "نفاس", "طواف", "لفظ", "مكلف",
    "كافر", "كافير", "وفاة", "مخففة", "خف", "صفا", "تفصيلي", "شفوي", "كفور",
    "فجار", "فصيح", "الفناء", "طائف", "كطائف", "دطائف", "إخفاء", "تكليف", "ف",
    "فاسق", "فتنه", "فهم", "فرائض", "نفس", "فقير", "عفو", "فضيلة", "فائدة",
    "مفتي", "فقه", "فسق", "فلسطين", "فرعون", "فطانة", "فطرة", "الفاتحة",
    "كفارة", "منافق", "فجر", "افضل", "فتح", "مؤلف", "فاطمة", "مصحف", "افتتاح",
    "اصناف", "برمنفعة", "الفرقان", "مسافير", "الفلق", "ملفظكن", "برفيكير",
    "برتفكور", "دتفسيركن", "تفسير", "التفسير", "فقهاء", "خليفة", "نفقة",
    "إسرافيل", "منفعة", "فهيرة", "عرفة", "كفاية", "فرقان", "صفة", "وقف",
}

LATIN_OK = re.compile(r"^(?:[A-Z]{2,}|[a-z]{1,3}|i{1,3}v?|iv)$")


def kata(teks):
    return re.findall(r"[؀-ۿݐ-ݿ]+", teks)


def semak(baiki=False):
    varian = collections.Counter()
    nga_ga = collections.Counter()
    nga_gh = collections.Counter()
    pa_fa = collections.Counter()
    latin = collections.Counter()
    ralat = []
    tukar_fail = 0

    for f in sorted(glob.glob(os.path.join(SRC, "*", "*", "*.json"))):
        rel = os.path.relpath(f, ROOT)
        raw = io.open(f, encoding="utf-8").read()

        for ch in VARIAN:
            if ch in raw:
                varian[ch] += raw.count(ch)

        if baiki:
            baru = raw
            for a, b in VARIAN.items():
                baru = baru.replace(a, b)
            if baru != raw:
                json.loads(baru)
                io.open(f, "w", encoding="utf-8").write(baru)
                raw = baru
                tukar_fail += 1

        try:
            d = json.loads(raw)
        except ValueError as e:
            ralat.append("%s: JSON rosak - %s" % (rel, e))
            continue

        for i, q in enumerate(d.get("questions", []), 1):
            o = q.get("o", [])
            if not isinstance(o, list) or len(o) < 2:
                ralat.append("%s soalan %d: pilihan tidak cukup" % (rel, i))
            a = q.get("a")
            if not isinstance(a, int) or not 0 <= a < len(o):
                ralat.append("%s soalan %d: indeks jawapan %r di luar julat" % (rel, i, a))
            if q.get("s") == "arab":
                continue
            for t in [q.get("q", ""), q.get("e", "")] + o:
                for w in kata(t):
                    if GA in w and NGA not in w and len(w) > 2:
                        nga_ga[w] += 1
                    if GHAIN in w and w not in GHAIN_OK:
                        nga_gh[w] += 1
                    if FA in w and w not in FA_OK:
                        pa_fa[w] += 1
                for w in re.findall(r"[A-Za-z]+", t):
                    if not LATIN_OK.match(w):
                        latin[w] += 1

    print("=== Huruf varian salah ===")
    if varian:
        for ch, n in varian.most_common():
            print("  %r (U+%04X) -> %r : %d" % (ch, ord(ch), VARIAN[ch], n))
    else:
        print("  tiada")
    if baiki and tukar_fail:
        print("  (dibaiki dalam %d fail)" % tukar_fail)

    def lapor(tajuk, kaunter, had=25):
        print("\n=== %s: %d perkataan ===" % (tajuk, len(kaunter)))
        for w, n in kaunter.most_common(had):
            print("  %4d  %s" % (n, w))

    lapor("Semak ݢ (mungkin patut ڠ)", nga_ga)
    lapor("Semak غ (mungkin patut ڠ)", nga_gh)
    lapor("Semak ف (mungkin patut ڤ)", pa_fa)
    lapor("Latin dalam teks", latin)

    print("\n=== Ralat struktur: %d ===" % len(ralat))
    for r in ralat[:30]:
        print("  " + r)
    return 1 if ralat else 0


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--baiki", action="store_true", help="baiki huruf varian")
    sys.exit(semak(p.parse_args().baiki))
