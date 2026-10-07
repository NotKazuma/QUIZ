// Set soalan cikgu — berasingan daripada bank rasmi.
// teacherSets/{sid}: { ownerUid, ownerName, title, subjectLabel, questions: [...], createdAt, updatedAt }
import {
  collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where,
} from 'firebase/firestore/lite';
import { getDb } from './firebase.js';

const db = () => getDb();

// ===== Penjejakan keputusan pautan kongsi =====
// teacherSets/{sid}/attempts/{uid}: { name, best, lastScore, lastTotal, attempts, lastAt }
// Satu rekod per murid — simpan markah terbaik dan cubaan terakhir.
export async function submitSetAttempt(setId, user, result) {
  const ref = doc(db(), 'teacherSets', setId, 'attempts', user.uid);
  const now = new Date().toISOString();
  const pct = result.total ? Math.round((result.score / result.total) * 100) : 0;
  let prev = null;
  try { const s = await getDoc(ref); if (s.exists()) prev = s.data(); } catch { /* cubaan pertama */ }
  await setDoc(ref, {
    uid: user.uid,
    name: user.name || 'Murid',
    best: Math.max(pct, prev?.best || 0),
    lastScore: result.score,
    lastTotal: result.total,
    lastPct: pct,
    attempts: (prev?.attempts || 0) + 1,
    lastAt: now,
    firstAt: prev?.firstAt || now,
  });
}

export async function listSetAttempts(setId) {
  const snap = await getDocs(collection(db(), 'teacherSets', setId, 'attempts'));
  return snap.docs.map(d => d.data()).sort((a, b) => (b.lastAt || '').localeCompare(a.lastAt || ''));
}

// Buka/tutup pautan kongsi. Pautan yang ditutup tidak boleh dijawab (elak orang luar).
export async function setShareOpen(set, open) {
  const updatedAt = new Date().toISOString();
  await updateDoc(doc(db(), 'teacherSets', set.id), { shareOpen: open, updatedAt });
  return { ...set, shareOpen: open, updatedAt };
}

export const SET_EXAM_LABEL = 'Soalan Cikgu';

export async function listMySets(uid) {
  const snap = await getDocs(query(collection(db(), 'teacherSets'), where('ownerUid', '==', uid)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

// Admin: semua set daripada semua cikgu.
export async function listAllSets() {
  const snap = await getDocs(collection(db(), 'teacherSets'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getSet(id) {
  const snap = await getDoc(doc(db(), 'teacherSets', id));
  return snap.exists() ? { id, ...snap.data() } : null;
}

export async function createSet(user, { title, subjectLabel }) {
  const ref = doc(collection(db(), 'teacherSets'));
  const now = new Date().toISOString();
  const data = {
    ownerUid: user.uid,
    ownerName: user.name,
    title: title.trim(),
    subjectLabel: (subjectLabel || '').trim(),
    questions: [],
    shareOpen: true,    // pautan kongsi aktif secara lalai; cikgu boleh tutup bila selesai
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(ref, data);
  return { id: ref.id, ...data };
}

// Simpan soalan; setiap soalan dilabel dengan tajuk set supaya paparan kuiz betul.
export async function saveSetQuestions(set, questions) {
  const labelled = questions.map(q => ({ ...q, exam: SET_EXAM_LABEL, subject: set.title, topic: set.title }));
  const updatedAt = new Date().toISOString();
  await updateDoc(doc(db(), 'teacherSets', set.id), { questions: labelled, updatedAt });
  return { ...set, questions: labelled, updatedAt };
}

export async function renameSet(set, { title, subjectLabel }) {
  const updatedAt = new Date().toISOString();
  await updateDoc(doc(db(), 'teacherSets', set.id), { title: title.trim(), subjectLabel: subjectLabel.trim(), updatedAt });
  return { ...set, title: title.trim(), subjectLabel: subjectLabel.trim(), updatedAt };
}

export function deleteSet(id) {
  return deleteDoc(doc(db(), 'teacherSets', id));
}

// Salin soalan (cth. daripada bank rasmi) ke dalam set: id baharu, rujukan asal disimpan.
export function copyIntoSet(set, questions) {
  const have = new Set(set.questions.map(q => q.copiedFrom).filter(Boolean));
  const stamp = Date.now().toString(36);
  const now = new Date().toISOString();
  const fresh = questions
    .filter(q => !have.has(q.id))
    .map((q, i) => ({ ...q, id: `${set.id}-${stamp}${i}`, copiedFrom: q.id, perlu_semak: false, nota_semak: undefined, updatedAt: now }))
    .map(q => JSON.parse(JSON.stringify(q))); // buang medan undefined (Firestore tidak terima)
  return { next: [...set.questions, ...fresh], added: fresh.length, skipped: questions.length - fresh.length };
}

export function newSetQuestion(set) {
  return {
    id: `${set.id}-${Date.now().toString(36)}`,
    exam: SET_EXAM_LABEL,
    subject: set.title,
    topic: set.title,
    type: 'objektif',
    difficulty: 'sederhana',
    script: set.questions[set.questions.length - 1]?.script || 'rumi',
    question: '',
    image: null,
    options: ['', '', '', ''],
    answer: 0,
    explanation: '',
    source: '',
    perlu_semak: false,
  };
}
