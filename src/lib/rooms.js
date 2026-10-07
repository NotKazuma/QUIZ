// Bilik latihan — kongsi soalan BANK RASMI secara awam (gaya Quizizz) dengan penjejakan,
// tanpa menyalin soalan. Satu bilik merujuk kepada subjek rasmi + bilangan soalan.
// rooms/{rid}: { ownerUid, ownerName, title, examId, subjectId, count, open, createdAt }
// rooms/{rid}/attempts/{uid}: { name, best, lastScore, lastTotal, lastPct, attempts, lastAt }
import {
  collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where,
} from 'firebase/firestore/lite';
import { getDb } from './firebase.js';

const db = () => getDb();

export async function createRoom(user, { title, examId, subjectId, count }) {
  const ref = doc(collection(db(), 'rooms'));
  const now = new Date().toISOString();
  const data = {
    ownerUid: user.uid,
    ownerName: user.name || 'Cikgu',
    title: title || 'Latihan',
    examId, subjectId,
    count: count || null,
    open: true,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(ref, data);
  return { id: ref.id, ...data };
}

export async function getRoom(id) {
  const s = await getDoc(doc(db(), 'rooms', id));
  return s.exists() ? { id, ...s.data() } : null;
}

export async function listMyRooms(uid) {
  const s = await getDocs(query(collection(db(), 'rooms'), where('ownerUid', '==', uid)));
  return s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function setRoomOpen(room, open) {
  await updateDoc(doc(db(), 'rooms', room.id), { open, updatedAt: new Date().toISOString() });
  return { ...room, open };
}

export function deleteRoom(id) {
  return deleteDoc(doc(db(), 'rooms', id));
}

export async function submitRoomAttempt(roomId, user, result) {
  const ref = doc(db(), 'rooms', roomId, 'attempts', user.uid);
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

export async function listRoomAttempts(roomId) {
  const s = await getDocs(collection(db(), 'rooms', roomId, 'attempts'));
  return s.docs.map(d => d.data()).sort((a, b) => (b.lastAt || '').localeCompare(a.lastAt || ''));
}
