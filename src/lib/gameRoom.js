// Bilik permainan arked dalam talian (Firebase Realtime Database), sertai dengan PIN.
//
// games/{pin}: {
//   type: 'ular' | 'duel' | 'padanan', hostUid, status: 'lobby' | 'playing' | 'ended', createdAt,
//   examId, subjectId, examName, subjectName, order: [{ id, perm }],   // soalan sama untuk semua pemain
//   players: { uid: { name, avatar, joinedAt } },
//   state: { ... }                                                       // keadaan permainan (lihat skrin online)
// }
// Hos menulis bilik; pemain menulis nod sendiri; pemain dalam bilik menulis `state` semasa bermain.
import { get, onValue, ref, remove, set, update } from 'firebase/database';
import { db, raceReady } from './race.js';

export const roomsReady = raceReady;
const roomRef = (pin, ...path) => ref(db(), ['games', pin, ...path].join('/'));

// Bilangan pemain dibenarkan bagi setiap permainan.
export const SEATS = { ular: [2, 4], duel: [2, 2], padanan: [2, 4] };

export async function createRoom(host, details) {
  for (let tries = 0; tries < 8; tries++) {
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    if ((await get(roomRef(pin))).exists()) continue;
    await set(roomRef(pin), { ...details, hostUid: host.uid, status: 'lobby', createdAt: Date.now() });
    return pin;
  }
  throw new Error('Tidak dapat menjana PIN. Cuba lagi.');
}

export function watchRoom(pin, cb) {
  return onValue(roomRef(pin), snap => cb(snap.exists() ? snap.val() : null), () => cb(null));
}

export async function joinRoom(pin, user, name, avatar = null) {
  const snap = await get(roomRef(pin));
  if (!snap.exists()) throw new Error('PIN permainan tidak dijumpai.');
  const room = snap.val();
  const me = room.players?.[user.uid];
  if (!me) {
    if (room.status !== 'lobby') throw new Error('Permainan ini sudah bermula.');
    const [, max] = SEATS[room.type] || [2, 4];
    if (Object.keys(room.players || {}).length >= max) throw new Error('Bilik ini sudah penuh.');
  }
  await update(roomRef(pin, 'players', user.uid), { name: name.trim().slice(0, 30), avatar, joinedAt: me?.joinedAt || Date.now() });
  return room;
}

export const leaveRoom = (pin, uid) => remove(roomRef(pin, 'players', uid));
export const deleteRoom = pin => remove(roomRef(pin));
export const startRoom = (pin, state) => update(roomRef(pin), { status: 'playing', state, startedAt: Date.now() });
export const setState = (pin, patch) => update(roomRef(pin, 'state'), patch);
export const endRoom = pin => update(roomRef(pin), { status: 'ended' });

export const SEAT_COLORS = ['#1cb0f6', '#ff4b4b', '#58cc02', '#ffc800'];

// Nama & warna pemain mengikut tempat duduk.
export function seatInfo(seats, players, uid) {
  const i = seats.indexOf(uid);
  return { name: players?.[uid]?.name || 'Pemain', color: SEAT_COLORS[Math.max(0, i) % SEAT_COLORS.length], avatar: players?.[uid]?.avatar, index: i };
}

// Susunan tempat duduk: ikut masa sertai.
export function seatsOf(room) {
  return Object.entries(room?.players || {}).sort((a, b) => (a[1].joinedAt || 0) - (b[1].joinedAt || 0)).map(([uid]) => uid);
}

// Bilik semasa disimpan dalam peranti supaya refresh tidak mengeluarkan pemain (sah 6 jam).
const ROOM_KEY = 'kuiz.gameRoom';
export function loadStoredRoom(uid) {
  try {
    const r = JSON.parse(localStorage.getItem(ROOM_KEY) || 'null');
    return r && r.uid === uid && Date.now() - r.at < 6 * 3600e3 ? r.pin : null;
  } catch { return null; }
}
export function storeRoom(uid, pin) {
  try {
    if (pin) localStorage.setItem(ROOM_KEY, JSON.stringify({ uid, pin, at: Date.now() }));
    else localStorage.removeItem(ROOM_KEY);
  } catch { /* abaikan */ }
}
