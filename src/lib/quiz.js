// Logik kuiz tanpa React: muat soalan, kocok, sediakan soalan dan bantu paparan skrip.

// Laluan relatif kepada index.html (fail dalam folder public/).
export function assetUrl(path) {
  return import.meta.env.BASE_URL + String(path).replace(/^\//, '');
}

export async function loadConfig() {
  const res = await fetch(assetUrl('data/config.json'));
  if (!res.ok) throw new Error('Tidak dapat memuat config.json');
  return res.json();
}

// Muat fail soalan. Pulangkan array kosong jika fail tiada.
// Baling ralat jika fail wujud tetapi JSON rosak.
const cache = new Map();
export async function loadQuestions(file) {
  if (cache.has(file)) return cache.get(file);
  const res = await fetch(assetUrl(file));
  if (res.status === 404) return [];
  if (!res.ok) throw new Error('Gagal memuat ' + file + ' (' + res.status + ')');
  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error('Format JSON tidak sah dalam ' + file);
  }
  cache.set(file, data);
  return data;
}

// Buat masa ini hanya soalan objektif dipaparkan (subjektif pada fasa kemudian).
export function objectiveOnly(questions) {
  return questions.filter(q => q.type === 'objektif');
}

// Kocok array (Fisher–Yates). Pulangkan salinan baharu.
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Buat salinan soalan dengan pilihan dikocok dan indeks `answer` dikemas kini.
export function prepareQuestion(q) {
  const opts = shuffle(q.options.map((text, i) => ({ text, isCorrect: i === q.answer })));
  return {
    ...q,
    options: opts.map(o => o.text),
    answer: opts.findIndex(o => o.isCorrect),
  };
}

// Ambil tahun daripada medan `source` (cth. "UPKK 2024" -> "2024").
export function yearOf(q) {
  const m = String(q.source || '').match(/\d{4}/);
  return m ? m[0] : 'Lain-lain';
}

// Arah teks dan kelas fon mengikut medan `script`.
export function scriptProps(script) {
  if (script === 'jawi' || script === 'arab') return { dir: 'rtl', className: 'script-arabic' };
  if (script === 'campur') return { dir: 'auto', className: 'script-mixed' };
  return { dir: 'ltr', className: '' };
}

export function isArabicScript(script) {
  return script === 'jawi' || script === 'arab';
}

// Label pilihan jawapan (A, B, C… atau ا، ب، ج… bagi soalan Jawi/Arab).
export const KEYS_RUMI = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
export const KEYS_ARABIC = ['ا', 'ب', 'ج', 'د', 'ه', 'و', 'ز', 'ح', 'ط', 'ي'];

export const EXAM_DESC = {
  upkk: 'Ujian Penilaian Kelas al-Quran dan Fardu Ain',
  sdea: 'Sijil Darjah Enam Agama',
};
