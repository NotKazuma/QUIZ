// Perlumbaan langsung (Firebase Realtime Database).
//
// races/{pin}: {
//   hostUid, hostName, classId, status: 'lobby' | 'playing' | 'ended', createdAt, startedAt,
//   examId, subjectId, examName, subjectName, year, order: [{ id, perm }],
//   mode: 'klasik' | 'kalah-mati' | 'pasukan', lives (kalah-mati), teamCount (pasukan),
//   players: { uid: { name, score, correct, answered, streak, finished, joinedAt, lives, out, team } }
// }
// Setiap pemain menulis nod sendiri sahaja; hos menulis selebihnya (lihat database.rules.json).
import {
  connectDatabaseEmulator, get, getDatabase, onValue, ref, remove, set, update,
} from 'firebase/database';
import { getFirebaseApp } from './firebase.js';
import { firebaseConfig } from './firebase-config.js';
import { pickTeam, ranking } from './raceModes.js';

export { ranking };

const EMULATOR = import.meta.env.VITE_FIREBASE_EMULATOR;
export const raceReady = Boolean(EMULATOR || firebaseConfig.databaseURL);

let rtdb = null;
// Sambungan Realtime Database (dikongsi dengan bilik permainan arked — lihat gameRoom.js).
export function db() {
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

export async function joinRace(pin, user, name, avatar = null) {
  const snap = await get(raceRef(pin));
  if (!snap.exists()) throw new Error('PIN perlumbaan tidak dijumpai.');
  const race = snap.val();
  if (race.status === 'ended') throw new Error('Perlumbaan ini sudah tamat.');
  const me = race.players?.[user.uid];
  if (me) {
    await update(raceRef(pin, 'players', user.uid), { name: name.trim(), avatar });
  } else {
    if (race.mode === 'kalah-mati' && race.status !== 'lobby') throw new Error('Perlumbaan Kalah Mati sudah bermula — tunggu pusingan seterusnya.');
    const fresh = {
      name: name.trim(), avatar, score: 0, correct: 0, answered: 0, streak: 0, finished: false, joinedAt: Date.now(),
    };
    if (race.mode === 'kalah-mati') Object.assign(fresh, { lives: race.lives || 3, out: false });
    if (race.mode === 'pasukan') fresh.team = pickTeam(race.players, race);
    await set(raceRef(pin, 'players', user.uid), fresh);
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

// Pemain tukar pasukan sendiri (di lobi).
export function setTeam(pin, uid, team) {
  return update(raceRef(pin, 'players', uid), { team });
}

// Hos kocok semua pemain ke pasukan secara sama rata.
export function shuffleTeams(pin, players, teams) {
  const uids = Object.keys(players || {}).sort(() => Math.random() - 0.5);
  const patch = {};
  uids.forEach((uid, i) => { patch[`${uid}/team`] = teams[i % teams.length].id; });
  return update(raceRef(pin, 'players'), patch);
}
