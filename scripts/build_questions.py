"""Himpun soalan daripada data-src/ ke public/data/ dan kemas kini config.json.

Struktur sumber (satu fail = satu kertas peperiksaan):
    data-src/<peperiksaan>/<subjek>/<SET>-<TAHUN>.json
    { "source": "PAT 2024", "pdf": "DARJAH 1/PAT/2024/...pdf",
      "questions": [ { "q": "...", "o": ["..", ".."], "a": 0, "e": "penerangan", "d": "mudah|sederhana|susah" } ] }

Setiap soalan ditukar kepada format kuiz penuh dengan perlu_semak = true (jawapan belum disahkan cikgu).
Jalankan: python scripts/build_questions.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'data-src'
DATA = ROOT / 'public' / 'data'

# Peperiksaan baharu daripada kertas sekolah (ikut turutan paparan).
EXAMS = {
    'darjah-1': {'name': 'Darjah 1', 'desc': 'Ujian & peperiksaan sekolah agama Darjah 1', 'icon': 'num-1'},
    'darjah-2': {'name': 'Darjah 2', 'desc': 'Ujian & peperiksaan sekolah agama Darjah 2', 'icon': 'num-2'},
    'darjah-3': {'name': 'Darjah 3', 'desc': 'Ujian & peperiksaan sekolah agama Darjah 3', 'icon': 'num-3'},
    'darjah-4': {'name': 'Darjah 4', 'desc': 'Ujian & peperiksaan sekolah agama Darjah 4', 'icon': 'num-4'},
    'darjah-5': {'name': 'Darjah 5', 'desc': 'Ujian & peperiksaan sekolah agama Darjah 5', 'icon': 'num-5'},
    'darjah-6': {'name': 'Darjah 6', 'desc': 'Ujian & peperiksaan sekolah agama Darjah 6', 'icon': 'num-6'},
}
SUBJECTS = {
    'jawi': 'Jawi', 'akhlak': 'Akhlak', 'arab': 'Bahasa Arab', 'ibadat': 'Ibadat', 'tauhid': 'Tauhid', 'sirah': 'Sirah',
    'muamalat': 'Muamalat', 'faraid': 'Faraid', 'tafsir': 'Tafsir', 'munakahat': 'Munakahat', 'tajwid': 'Tajwid', 'jenayat': 'Jenayat',
}
SUBJECT_ORDER = list(SUBJECTS)
SET_ORDER = {'UPP1': 0, 'UPP2': 1, 'PPT': 2, 'PAT': 3}


def paper_key(path):
    name = path.stem  # cth. PAT-2024
    kind, _, year = name.partition('-')
    return (year, SET_ORDER.get(kind, 9))


def build_exam(exam_id):
    meta = EXAMS[exam_id]
    subjects = []
    for subj_dir in sorted((SRC / exam_id).iterdir(), key=lambda p: SUBJECT_ORDER.index(p.name) if p.name in SUBJECT_ORDER else 99):
        if not subj_dir.is_dir():
            continue
        subj = subj_dir.name
        out, n = [], 0
        for paper in sorted(subj_dir.glob('*.json'), key=paper_key):
            data = json.loads(paper.read_text(encoding='utf-8'))
            tag = paper.stem.lower().replace('-', '')
            for i, q in enumerate(data['questions'], 1):
                assert 0 <= q['a'] < len(q['o']), f'{paper}: soalan {i} jawapan di luar pilihan'
                out.append({
                    'id': f'{exam_id}-{subj}-{tag}-{i:02d}',
                    'exam': meta['name'],
                    'subject': SUBJECTS.get(subj, subj.title()),
                    'topic': SUBJECTS.get(subj, subj.title()),
                    'type': 'objektif',
                    'difficulty': q.get('d', 'mudah'),
                    'script': q.get('s', 'jawi'),
                    'question': q['q'],
                    **({'image': q['img']} if q.get('img') else {}),
                    'options': q['o'],
                    'answer': q['a'],
                    'explanation': q.get('e', ''),
                    'source': data['source'],
                    'perlu_semak': True,
                })
                n += 1
        if not out:
            continue
        target = DATA / exam_id / f'{subj}.json'
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        subjects.append({'id': subj, 'name': SUBJECTS.get(subj, subj.title()), 'file': f'data/{exam_id}/{subj}.json',
                         'test': {'questions': min(20, n), 'minutes': 20}})
        print(f'  {exam_id}/{subj}: {n} soalan')
    return {'id': exam_id, **meta, 'subjects': subjects} if subjects else None


def main():
    config_path = DATA / 'config.json'
    config = json.loads(config_path.read_text(encoding='utf-8'))
    built = [e for e in (build_exam(x) for x in EXAMS if (SRC / x).is_dir()) if e]
    keep = [e for e in config['exams'] if e['id'] not in EXAMS]
    # UPKK/SDEA sedia ada dahulu, kemudian darjah ikut turutan.
    config['exams'] = keep + built
    config_path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'config.json: {len(config["exams"])} peperiksaan')


if __name__ == '__main__':
    main()
