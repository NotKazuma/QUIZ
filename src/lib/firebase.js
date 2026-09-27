// Log masuk (Firebase Auth: tetamu + Google) dan data pengguna (Firestore + salinan localStorage).
import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider, connectAuthEmulator, getAuth, linkWithPopup, onAuthStateChanged,
  signInAnonymously, signInWithCredential, signInWithPopup, signOut,
} from 'firebase/auth';
import {
  collection, connectFirestoreEmulator, deleteDoc, doc, getDoc, getDocs, getFirestore, limit, orderBy, query,
  setDoc, updateDoc,
} from 'firebase/firestore/lite';
import { mergeStats, mergeUnlocked } from './achievements.js';
import { firebaseConfig } from './firebase-config.js';

// Ujian tempatan dengan Firebase Emulator: VITE_FIREBASE_EMULATOR=127.0.0.1 npm run dev
const EMULATOR = import.meta.env.VITE_FIREBASE_EMULATOR;
const config = EMULATOR
  ? { apiKey: 'demo', authDomain: 'demo-kuiz.firebaseapp.com', projectId: 'demo-kuiz', appId: 'demo' }
  : firebaseConfig;

// Jika config belum diisi, laman masih boleh digunakan sebagai tetamu dalam peranti ini sahaja.
export const firebaseReady = Boolean(config.apiKey && config.projectId);

let auth = null;
let db = null;
export const getDb = () => db;
if (firebaseReady) {
  const app = initializeApp(config);
  auth = getAuth(app);
  auth.languageCode = 'ms';
  db = getFirestore(app);
  if (EMULATOR) {
    connectAuthEmulator(auth, `http://${EMULATOR}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, EMULATOR, Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || 8080));
  }
}

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

// ===== localStorage (selamat walaupun storan disekat) =====
function readLocal(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function writeLocal(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch { /* abaikan */ }
}

// ===== Pengguna =====
const LOCAL_GUEST_KEY = 'kuiz.localGuest';
const LOCAL_GUEST = { uid: 'local', isGuest: true, name: 'Tetamu', photo: null, email: null, local: true };

function toUser(u) {
  if (!u) return null;
  return {
    uid: u.uid,
    isGuest: u.isAnonymous,
    name: u.displayName || (u.isAnonymous ? 'Tetamu' : u.email) || 'Pengguna',
    photo: u.photoURL,
    email: u.email,
  };
}

const listeners = new Set();
function emit(user) { listeners.forEach(cb => cb(user)); }

// Panggil `cb(user|null)` setiap kali status log masuk berubah. Pulangkan fungsi untuk berhenti.
export function watchUser(cb) {
  listeners.add(cb);
  let unsub = () => {};
  if (firebaseReady) unsub = onAuthStateChanged(auth, u => cb(toUser(u)));
  else cb(readLocal(LOCAL_GUEST_KEY) ? LOCAL_GUEST : null);
  return () => { listeners.delete(cb); unsub(); };
}

export async function signInGuest() {
  if (!firebaseReady) {
    writeLocal(LOCAL_GUEST_KEY, true);
    emit(LOCAL_GUEST);
    return;
  }
  await signInAnonymously(auth);
}

export async function signInGoogle() {
  await signInWithPopup(auth, provider);
}

// Pautkan akaun tetamu kepada Google. UID kekal sama, jadi semua kemajuan ikut sekali.
// Jika akaun Google itu sudah pernah digunakan, tukar ke akaun tersebut dan bawa kemajuan tetamu bersama.
export async function linkGoogle() {
  const guest = auth.currentUser;
  try {
    await linkWithPopup(guest, provider);
    await guest.reload();
    emit(toUser(auth.currentUser));
    return 'linked';
  } catch (e) {
    if (e.code !== 'auth/credential-already-in-use') throw e;
    const credential = GoogleAuthProvider.credentialFromError(e);
    const guestData = await loadUserData(guest.uid);
    const { user } = await signInWithCredential(auth, credential);
    const target = await loadUserData(user.uid);
    // Bawa latihan tetamu (jika akaun Google tiada latihan) dan gabungkan statistik/pencapaian.
    if (guestData.session && !target.session) await saveSession(user.uid, guestData.session);
    await saveProgress(user.uid, mergeStats(target.stats, guestData.stats),
      mergeUnlocked(target.unlocked, guestData.unlocked), true);
    return 'switched';
  }
}

export async function signOutUser() {
  if (!firebaseReady) {
    writeLocal(LOCAL_GUEST_KEY, null);
    emit(null);
    return;
  }
  await signOut(auth);
}

// Mesej ralat log masuk yang mudah difahami.
export function authErrorMessage(e) {
  switch (e?.code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return '';
    case 'auth/popup-blocked':
      return 'Tetingkap log masuk disekat. Benarkan pop-up untuk laman ini, kemudian cuba lagi.';
    case 'auth/network-request-failed':
      return 'Tiada sambungan internet. Cuba lagi sebentar.';
    case 'auth/unauthorized-domain':
      return 'Domain laman ini belum dibenarkan dalam Firebase (Authorized domains).';
    case 'auth/configuration-not-found':
    case 'auth/operation-not-allowed':
    case 'auth/admin-restricted-operation':
      return 'Cara log masuk ini belum dihidupkan dalam Firebase Console.';
    default:
      return 'Log masuk gagal. Cuba lagi. (' + (e?.code || e?.message || 'ralat') + ')';
  }
}

// ===== Data pengguna: autosave latihan + statistik + pencapaian =====
// Dokumen Firestore users/{uid}: { session, updatedAt, stats, unlocked }
// Sesi: { examId, subjectId, year, order: [{ id, perm }], current, score, chosen, savedAt }
// Setiap perubahan disimpan serta-merta ke localStorage, dan ke Firestore selepas 1 saat.
const sessionKey = uid => 'kuiz.session.' + uid;
const progressKey = uid => 'kuiz.progress.' + uid;
const useRemote = uid => firebaseReady && uid !== 'local';

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
}

export async function loadUserData(uid) {
  const localSession = readLocal(sessionKey(uid));
  const localProgress = readLocal(progressKey(uid)) || {};
  let remote = null;
  if (useRemote(uid)) {
    try {
      const snap = await withTimeout(getDoc(doc(db, 'users', uid)), 5000);
      remote = snap.exists() ? snap.data() : null;
    } catch {
      remote = null; // luar talian: guna salinan dalam peranti
    }
  }
  // Sesi: ambil yang paling baharu (mungkin disambung di peranti lain, atau sudah dibuang).
  let session = localSession;
  if (remote?.updatedAt && !(localSession && localSession.savedAt > remote.updatedAt)) {
    session = remote.session ?? null;
    writeLocal(sessionKey(uid), session);
  }
  // Statistik & pencapaian: gabung kedua-dua salinan.
  const stats = mergeStats(localProgress.stats, remote?.stats);
  const unlocked = mergeUnlocked(localProgress.unlocked, remote?.unlocked);
  writeLocal(progressKey(uid), { stats, unlocked });
  const classes = remote?.classes ?? readLocal('kuiz.classes.' + uid) ?? [];
  writeLocal('kuiz.classes.' + uid, classes);
  return { session, stats, unlocked, role: remote?.role ?? null, classes };
}

const pending = new Map(); // uid -> { timer, data }

function flush(uid) {
  const p = pending.get(uid);
  if (!p) return Promise.resolve();
  clearTimeout(p.timer);
  pending.delete(uid);
  return setDoc(doc(db, 'users', uid), p.data, { merge: true }).catch(() => { /* cuba lagi pada simpanan seterusnya */ });
}
function flushAll() { [...pending.keys()].forEach(flush); }
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushAll);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushAll(); });
}

function queue(uid, fields, immediate) {
  if (!useRemote(uid)) return Promise.resolve();
  const prev = pending.get(uid);
  if (prev) clearTimeout(prev.timer);
  const entry = { data: { ...prev?.data, ...fields } };
  entry.timer = setTimeout(() => flush(uid), 1000);
  pending.set(uid, entry);
  return immediate ? flush(uid) : Promise.resolve();
}

export function saveSession(uid, session, immediate = false) {
  const data = { ...session, savedAt: new Date().toISOString() };
  writeLocal(sessionKey(uid), data);
  return queue(uid, { session: data, updatedAt: data.savedAt }, immediate);
}

export function clearSession(uid) {
  writeLocal(sessionKey(uid), null);
  return queue(uid, { session: null, updatedAt: new Date().toISOString() }, true);
}

export function saveProgress(uid, stats, unlocked, immediate = false) {
  writeLocal(progressKey(uid), { stats, unlocked });
  return queue(uid, { stats, unlocked }, immediate);
}

// Maklumat asas pengguna (untuk senarai admin & laporan cikgu). Medan `role` hanya boleh diubah admin.
export function saveProfile(user) {
  if (!useRemote(user.uid)) return Promise.resolve();
  return queue(user.uid, {
    profile: {
      name: user.isGuest ? 'Tetamu' : user.name,
      email: user.email || null,
      photo: user.photo || null,
      isGuest: user.isGuest,
    },
    lastActive: new Date().toISOString(),
  }, true);
}

// ===== Admin =====
export async function fetchUsers(max = 300) {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('lastActive', 'desc'), limit(max)));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

export function setUserRole(uid, role) {
  return updateDoc(doc(db, 'users', uid), { role: role || null });
}

export function deleteUserData(uid) {
  return deleteDoc(doc(db, 'users', uid));
}

// ===== Soalan dalam Firestore (disunting admin) =====
// subjects/{exam}__{subjek}: { questions: [...], updatedAt, updatedBy }
export async function loadSubjectDoc(id) {
  if (!firebaseReady) return null;
  try {
    const snap = await withTimeout(getDoc(doc(db, 'subjects', id)), 5000);
    const data = snap.exists() ? snap.data() : null;
    return Array.isArray(data?.questions) ? data.questions : null;
  } catch {
    return null; // luar talian / tiada: guna fail JSON
  }
}

export function saveSubjectDoc(id, questions, by) {
  return setDoc(doc(db, 'subjects', id), {
    questions,
    updatedAt: new Date().toISOString(),
    updatedBy: by || null,
  });
}

// Senarai id kelas yang disertai pengguna (disimpan dalam dokumen pengguna sendiri).
export function saveMyClasses(uid, classes) {
  writeLocal('kuiz.classes.' + uid, classes);
  return queue(uid, { classes }, true);
}
