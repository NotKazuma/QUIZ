// Logik kuiz tanpa React: muat soalan, kocok, sediakan soalan dan bantu paparan skrip.
import { loadSubjectDoc } from './firebase.js';

// Laluan relatif kepada index.html (fail dalam folder public/).
export function assetUrl(path) {
  const s = String(path);
  // Gambar yang dimuat naik cikgu disimpan sebagai data URL; URL penuh juga dibiar.
  if (/^(data:|blob:|https?:)/.test(s)) return s;
  return import.meta.env.BASE_URL + s.replace(/^\//, '');
}

export async function loadConfig() {
  const res = await fetch(assetUrl('data/config.json'));
  if (!res.ok) throw new Error('Tidak dapat memuat config.json');
  return res.json();
}

// Muat soalan satu subjek. Soalan yang pernah disunting admin disimpan dalam Firestore
// (subjects/{exam}__{subjek}); jika tiada, guna fail JSON asal dalam public/data.
// Pulangkan array kosong jika fail tiada; baling ralat jika JSON rosak.
const cache = new Map(); // fail -> Promise<soalan[]>

export function subjectDocId(file) {
  const m = String(file).match(/data\/([^/]+)\/([^/]+)\.json$/);
  return m ? m[1] + '__' + m[2] : null;
}

export function loadQuestions(file) {
  if (!cache.has(file)) {
    const p = fetchQuestions(file);
    cache.set(file, p);
    p.catch(() => cache.delete(file));
  }
  return cache.get(file);
}

// Selepas admin menyimpan, kemas kini cache supaya perubahan terus kelihatan.
export function setCachedQuestions(file, questions) {
  cache.set(file, Promise.resolve(questions));
}

export async function loadStaticQuestions(file) {
  const res = await fetch(assetUrl(file));
  if (res.status === 404) return [];
  if (!res.ok) throw new Error('Gagal memuat ' + file + ' (' + res.status + ')');
  try {
    return await res.json();
  } catch {
    throw new Error('Format JSON tidak sah dalam ' + file);
  }
}

async function fetchQuestions(file) {
  const id = subjectDocId(file);
  if (id) {
    const remote = await loadSubjectDoc(id);
    if (remote) return remote;
  }
  return loadStaticQuestions(file);
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
// `perm` = susunan indeks pilihan asal, disimpan supaya latihan boleh disambung dengan susunan sama.
export function prepareQuestion(q, perm = shuffle(q.options.map((_, i) => i))) {
  return {
    ...q,
    options: perm.map(i => q.options[i]),
    answer: perm.indexOf(q.answer),
    perm,
  };
}

// Bina semula soalan sesi yang disimpan: order = [{ id, perm }, ...].
// Soalan yang sudah tiada dalam fail JSON (data dikemas kini) dilangkau.
export function rebuildQuestions(allQuestions, order) {
  const byId = new Map(allQuestions.map(q => [q.id, q]));
  return order
    .map(({ id, perm }) => byId.get(id) && prepareQuestion(byId.get(id), perm))
    .filter(Boolean);
}

// Soalan objektif semua subjek bagi satu peperiksaan: { idSubjek: [...] }, null jika gagal dimuat.
export async function loadExamQuestions(exam) {
  const entries = await Promise.all(exam.subjects.map(s =>
    loadQuestions(s.file).then(qs => [s.id, objectiveOnly(qs)]).catch(() => [s.id, null])));
  return Object.fromEntries(entries);
}

// Tapis soalan mengikut tahun (null = semua tahun).
export function filterByYear(questions, year) {
  return year ? questions.filter(q => yearOf(q) === year) : questions;
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
