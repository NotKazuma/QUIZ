// Profil awam: publicProfiles/{uid} — avatar, nama paparan, gelaran, warna tema, statistik ringkas & lencana.
// Boleh dibaca oleh pengguna yang log masuk (kawan sekelas, pemain perlumbaan). Pemilik sahaja boleh menulis.
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore/lite';
import { firebaseReady, getDb } from './firebase.js';

export async function savePublicProfile(user, { avatar, prefs, stats, unlocked }) {
  if (!firebaseReady || user.uid === 'local') return;
  const ref = doc(getDb(), 'publicProfiles', user.uid);
  if (prefs?.public === false) {
    await deleteDoc(ref).catch(() => {});
    return;
  }
  const badges = Object.entries(unlocked || {}).sort((a, b) => b[1].localeCompare(a[1])).map(([id]) => id);
  await setDoc(ref, {
    name: (prefs?.displayName || (user.isGuest ? 'Tetamu' : user.name) || 'Pengguna').slice(0, 30),
    avatar: avatar || null,
    title: prefs?.title || null,
    theme: prefs?.theme || 'oren',
    stats: {
      answered: stats.answered || 0,
      correct: stats.correct || 0,
      quizzes: stats.quizzes || 0,
      bestStreak: stats.bestStreak || 0,
      dayStreak: stats.dayStreak || 0,
      races: stats.races || 0,
      raceWins: stats.raceWins || 0,
    },
    badges: badges.slice(0, 24),
    badgeCount: badges.length,
    updatedAt: new Date().toISOString(),
  }).catch(() => {});
}

export async function getPublicProfile(uid) {
  if (!firebaseReady) return null;
  const snap = await getDoc(doc(getDb(), 'publicProfiles', uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}
