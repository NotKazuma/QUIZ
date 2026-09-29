// Kelas, ahli, kerja rumah dan hantaran (Firestore).
//
// classes/{cid}                                  { name, teacherUid, teacherName, code, createdAt }
// classCodes/{code}                              { classId }
// classes/{cid}/members/{uid}                    { name, isGuest, code, joinedAt, summary, subjects }
// classes/{cid}/assignments/{aid}                { title, examId, subjectId, subjectName, examName, year,
//                                                  questionIds, mode, dueAt, createdAt }
// classes/{cid}/assignments/{aid}/submissions/{uid}
//                                                { name, firstScore, bestScore, total, points, attempts,
//                                                  wrongIds, firstAt, lastAt, late }
import {
  collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc, updateDoc, where,
} from 'firebase/firestore/lite';
import { getDb } from './firebase.js';

const db = () => getDb();

// Kod kelas 6 aksara tanpa huruf mengelirukan (0/O, 1/I/L).
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function randomCode() {
  let s = '';
  for (let i = 0; i < 6; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}

// ===== Cikgu =====
export async function createClass(user, name) {
  const ref = doc(collection(db(), 'classes'));
  // Cuba beberapa kod sehingga dapat yang belum digunakan.
  for (let tries = 0; tries < 5; tries++) {
    const code = randomCode();
    const taken = await getDoc(doc(db(), 'classCodes', code)).then(s => s.exists()).catch(() => false);
    if (taken) continue;
    const data = {
      name: name.trim(),
      teacherUid: user.uid,
      teacherName: user.name,
      code,
      createdAt: new Date().toISOString(),
    };
    await setDoc(ref, data);
    await setDoc(doc(db(), 'classCodes', code), { classId: ref.id });
    return { id: ref.id, ...data };
  }
  throw new Error('Tidak dapat menjana kod kelas. Cuba lagi.');
}

export async function listTeacherClasses(uid) {
  const snap = await getDocs(query(collection(db(), 'classes'), where('teacherUid', '==', uid)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Padam kelas bersama ahli, kerja rumah dan hantaran (Firestore tidak memadam subkoleksi sendiri).
export async function deleteClass(cls) {
  const members = await getDocs(collection(db(), 'classes', cls.id, 'members'));
  const assignments = await getDocs(collection(db(), 'classes', cls.id, 'assignments'));
  for (const a of assignments.docs) {
    const subs = await getDocs(collection(a.ref, 'submissions'));
    await Promise.all(subs.docs.map(d => deleteDoc(d.ref)));
  }
  await Promise.all([...members.docs, ...assignments.docs].map(d => deleteDoc(d.ref)));
  await deleteDoc(doc(db(), 'classCodes', cls.code)).catch(() => {});
  await deleteDoc(doc(db(), 'classes', cls.id));
}

export async function listMembers(cid) {
  const snap = await getDocs(collection(db(), 'classes', cid, 'members'));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name));
}

export function removeMember(cid, uid) {
  return deleteDoc(doc(db(), 'classes', cid, 'members', uid));
}

export async function createAssignment(cid, data) {
  const ref = doc(collection(db(), 'classes', cid, 'assignments'));
  const full = { ...data, createdAt: new Date().toISOString() };
  await setDoc(ref, full);
  return { id: ref.id, ...full };
}

export async function listAssignments(cid) {
  const snap = await getDocs(query(collection(db(), 'classes', cid, 'assignments'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, classId: cid, ...d.data() }));
}

export function deleteAssignment(cid, aid) {
  return deleteDoc(doc(db(), 'classes', cid, 'assignments', aid));
}

export async function listSubmissions(cid, aid) {
  const snap = await getDocs(collection(db(), 'classes', cid, 'assignments', aid, 'submissions'));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

// Semua hantaran satu murid merentas setiap kerja rumah kelas, untuk panel
// terperinci cikgu. Setiap kerja rumah = satu bacaan dokumen.
export async function listStudentSubmissions(cid, uid, assignments) {
  const out = await Promise.all((assignments || []).map(async a => {
    const snap = await getDoc(doc(db(), 'classes', cid, 'assignments', a.id, 'submissions', uid))
      .catch(() => null);
    return { assignment: a, sub: snap && snap.exists() ? snap.data() : null };
  }));
  return out;
}

// Purata kelas bagi setiap kerja rumah — untuk membandingkan murid dengan kelas.
export async function classAverages(cid, assignments) {
  const out = {};
  await Promise.all((assignments || []).map(async a => {
    const subs = await listSubmissions(cid, a.id).catch(() => []);
    if (!subs.length) { out[a.id] = null; return; }
    const pct = subs.map(s => (s.total ? (s.firstScore / s.total) * 100 : 0));
    out[a.id] = {
      count: subs.length,
      avg: Math.round(pct.reduce((n, x) => n + x, 0) / pct.length),
      best: Math.round(Math.max(...pct)),
      wrongIds: subs.flatMap(s => s.wrongIds || []),
    };
  }));
  return out;
}

// ===== Murid =====
export async function findClassByCode(code) {
  const snap = await getDoc(doc(db(), 'classCodes', code.trim().toUpperCase()));
  return snap.exists() ? snap.data().classId : null;
}

export async function joinClass(code, user, name) {
  const clean = code.trim().toUpperCase();
  const cid = await findClassByCode(clean);
  if (!cid) throw new Error('Kod kelas tidak dijumpai. Semak semula dengan cikgu anda.');
  await setDoc(doc(db(), 'classes', cid, 'members', user.uid), {
    name: name.trim(),
    isGuest: user.isGuest,
    code: clean, // bukti murid tahu kod kelas (disemak oleh peraturan Firestore)
    joinedAt: new Date().toISOString(),
  });
  const snap = await getDoc(doc(db(), 'classes', cid));
  return { id: cid, ...snap.data() };
}

export function leaveClass(cid, uid) {
  return deleteDoc(doc(db(), 'classes', cid, 'members', uid));
}

// Kelas yang disertai (kelas yang sudah dipadam cikgu diabaikan).
export async function getClasses(ids) {
  const out = await Promise.all(ids.map(id => getDoc(doc(db(), 'classes', id))
    .then(s => (s.exists() ? { id, ...s.data() } : null)).catch(() => null)));
  return out.filter(Boolean);
}

// Ringkasan kemajuan murid untuk laporan cikgu (dikemas kini selepas setiap latihan).
export function updateMemberSummary(cid, uid, stats, avatar) {
  return updateDoc(doc(db(), 'classes', cid, 'members', uid), {
    ...(avatar ? { avatar } : {}),
    summary: {
      answered: stats.answered || 0,
      correct: stats.correct || 0,
      quizzes: stats.quizzes || 0,
      challenges: stats.challenges || 0,
      bestPoints: stats.bestPoints || 0,
      bestStreak: stats.bestStreak || 0,
      dayStreak: stats.dayStreak || 0,
    },
    subjects: stats.subjects || {},
    lastActive: new Date().toISOString(),
  });
}

export async function getMySubmission(cid, aid, uid) {
  const snap = await getDoc(doc(db(), 'classes', cid, 'assignments', aid, 'submissions', uid));
  return snap.exists() ? snap.data() : null;
}

// Simpan hantaran kerja rumah: markah pertama kekal, markah terbaik dikemas kini.
export async function submitAssignment(assignment, user, name, result) {
  const ref = doc(db(), 'classes', assignment.classId, 'assignments', assignment.id, 'submissions', user.uid);
  const prev = await getDoc(ref).then(s => (s.exists() ? s.data() : null)).catch(() => null);
  const now = new Date().toISOString();
  const data = {
    name,
    total: result.total,
    firstScore: prev ? prev.firstScore : result.score,
    bestScore: Math.max(prev?.bestScore ?? 0, result.score),
    points: Math.max(prev?.points ?? 0, result.points || 0),
    attempts: (prev?.attempts || 0) + 1,
    wrongIds: prev ? prev.wrongIds : result.wrongIds || [],
    firstAt: prev ? prev.firstAt : now,
    lastAt: now,
    late: prev ? prev.late : Boolean(assignment.dueAt && now > assignment.dueAt),
  };
  await setDoc(ref, data);
  return data;
}
