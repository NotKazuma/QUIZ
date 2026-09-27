// Perlumbaan langsung (Firebase Realtime Database).
//
// races/{pin}: {
//   hostUid, hostName, classId, status: 'lobby' | 'playing' | 'ended', createdAt, startedAt,
//   examId, subjectId, examName, subjectName, year, order: [{ id, perm }],
//   players: { uid: { name, score, correct, answered, streak, finished, joinedAt } }
// }
// Setiap pemain menulis nod sendiri sahaja; hos menulis selebihnya (lihat database.rules.json).
import {
  connectDatabaseEmulator, get, getDatabase, onValue, ref, remove, set, update,
} from 'firebase/database';
import { getFirebaseApp } from './firebase.js';
import { firebaseConfig } from './firebase-config.js';

const EMULATOR = import.meta.env.VITE_FIREBASE_EMULATOR;
export const raceReady = Boolean(EMULATOR || firebaseConfig.databaseURL);

let rtdb = null;
function db() {
  if (!rtdb) {
    const app = getFirebaseApp();
    if (EMULATOR) {
      rtdb = getDatabase(app, 'https://demo-kuiz-default-rtdb.firebaseio.com');
      connectDatabaseEmulator(rtdb, EMULATOR, 9000);
    } else {
      rtdb = getDatabase(app, firebaseConfig.databaseURL);
    }
  }
  return rtdb;
}

const raceRef = (pin, ...path) => ref(db(), ['races', pin, ...path].join('/'));

export async function createRace(host, details) {
  for (let tries = 0; tries < 8; tries++) {
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    const exists = (await get(raceRef(pin))).exists();
    if (exists) continue;
    await set(raceRef(pin), {
      ...details,
      hostUid: host.uid,
      hostName: host.name,
      status: 'lobby',
      createdAt: Date.now(),
    });
    return pin;
  }
  throw new Error('Tidak dapat menjana PIN. Cuba lagi.');
}

export function watchRace(pin, cb) {
  return onValue(raceRef(pin), snap => cb(snap.exists() ? snap.val() : null), () => cb(null));
}

export async function joinRace(pin, user, name) {
  const snap = await get(raceRef(pin));
  if (!snap.exists()) throw new Error('PIN perlumbaan tidak dijumpai.');
  const race = snap.val();
  if (race.status === 'ended') throw new Error('Perlumbaan ini sudah tamat.');
  const me = race.players?.[user.uid];
  if (me) {
    await update(raceRef(pin, 'players', user.uid), { name: name.trim() });
  } else {
    await set(raceRef(pin, 'players', user.uid), {
      name: name.trim(), score: 0, correct: 0, answered: 0, streak: 0, finished: false, joinedAt: Date.now(),
    });
  }
  return race;
}

export function updatePlayer(pin, uid, fields) {
  return update(raceRef(pin, 'players', uid), fields);
}

export function leaveRace(pin, uid) {
  return remove(raceRef(pin, 'players', uid));
}

export function startRace(pin) {
  return update(raceRef(pin), { status: 'playing', startedAt: Date.now() });
}

export function endRace(pin) {
  return update(raceRef(pin), { status: 'ended', endedAt: Date.now() });
}

export function deleteRace(pin) {
  return remove(raceRef(pin));
}

// Susunan kedudukan: mata, kemudian jawapan betul, kemudian siapa sertai dahulu.
export function ranking(players = {}) {
  return Object.entries(players)
    .map(([uid, p]) => ({ uid, ...p }))
    .sort((a, b) => b.score - a.score || b.correct - a.correct || a.joinedAt - b.joinedAt);
}
