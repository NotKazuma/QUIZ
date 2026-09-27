// Logik dompet di pelayan (tulen, tiada rangkaian) — satu-satunya tempat syiling, barang & kuasa diubah.
// Pelanggan hanya menghantar "apa yang berlaku"; pelayan memutuskan ganjaran dengan had harian.
import { ACHIEVEMENTS, REWARD } from '../../src/lib/achievements.js';
import { ANIMALS, ITEMS, POWERUPS } from '../../src/lib/shop.js';

// Had harian (ikut hari waktu Malaysia).
export const LIMITS = {
  answerCoins: 200,  // syiling daripada jawapan betul sehari
  finishes: 20,      // bonus tamat latihan sehari
  races: 10,         // ganjaran perlumbaan sehari
  grants: 8,         // kuasa percuma sehari
  achievements: 10,  // ganjaran lencana sehari (selebihnya dituntut esok)
  keys: 600,         // bilangan soalan diingat sehari (elak ganjaran berulang)
};
// Had semasa memindahkan baki lama (disimpan pada peranti) ke dompet pelayan.
export const MIGRATE_CAP = { coins: 3000, powerups: 20 };

export class ApiError extends Error {
  constructor(status, code, message) { super(message || code); this.status = status; this.code = code; }
}

const ACH_IDS = new Set(ACHIEVEMENTS.map(a => a.id));
export const findItem = id => ITEMS.find(i => i.id === id) || ANIMALS.find(a => a.id === id);
export const balance = w => Math.max(0, w.earned - w.spent);
export const powerLeft = (w, id) => Math.max(0, (w.pGot[id] || 0) - (w.pUsed[id] || 0));

export function myDay(now = Date.now()) {
  return new Date(now + 8 * 3600e3).toISOString().slice(0, 10);
}

export function emptyWallet() {
  return {
    earned: 0, spent: 0, items: [], pGot: {}, pUsed: {},
    ach: [], hw: [], races: [], lastDaily: '',
    day: '', keys: [], ansCoins: 0, finishes: 0, raceCount: 0, grants: 0, achToday: 0,
    sinceGrant: 0, runN: 0, runCorrect: 0,
  };
}

// Dompet baharu daripada statistik lama users/{uid} (dengan had, supaya baki palsu tidak dibawa sepenuhnya).
export function migrate(stats = {}, unlocked = {}) {
  const w = emptyWallet();
  w.earned = Math.min(MIGRATE_CAP.coins, Math.max(0, (stats.coinsEarned || 0) - (stats.coinsSpent || 0)));
  w.items = [...new Set((stats.items || []).filter(id => typeof id === 'string' && findItem(id)))];
  for (const p of POWERUPS) {
    const n = Math.min(MIGRATE_CAP.powerups, Math.max(0, (stats.pGot?.[p.id] || 0) - (stats.pUsed?.[p.id] || 0)));
    if (n) w.pGot[p.id] = n;
  }
  // Lencana yang sudah dibuka dahulu sudah pun diberi syiling.
  w.ach = Object.keys(unlocked || {}).filter(id => ACH_IDS.has(id));
  return w;
}

// Maklumat dompet yang dihantar ke pelanggan.
export function publicWallet(w) {
  const { earned, spent, items, pGot, pUsed, ach, lastDaily } = w;
  return { earned, spent, items, pGot, pUsed, ach, lastDaily };
}

const cleanId = (v, max = 64) => (typeof v === 'string' && /^[A-Za-z0-9_-]+$/.test(v) && v.length <= max ? v : null);
const keepLast = (list, n) => (list.length > n ? list.slice(list.length - n) : list);

/**
 * Laksanakan satu tindakan pada dompet `w` (diubah terus).
 * ctx = { now, admin, facts, random } — facts disediakan oleh index.js selepas semakan Firestore/RTDB.
 * Pulangkan { gained, ... } untuk dipapar kepada pengguna.
 */
export function apply(action, body, w, ctx) {
  const { now = Date.now(), admin = false, facts = {}, random = Math.random } = ctx;
  const out = { gained: 0 };
  const gain = n => { w.earned += n; out.gained += n; };

  const today = myDay(now);
  if (w.day !== today) {
    Object.assign(w, { day: today, keys: [], ansCoins: 0, finishes: 0, raceCount: 0, grants: 0, achToday: 0 });
  }

  switch (action) {
    case 'sync':
      break;

    case 'answer': {
      const key = typeof body.key === 'string' ? body.key.slice(0, 40) : '';
      if (!key) throw new ApiError(400, 'bad-key');
      const correct = body.correct === true;
      const race = body.src === 'race';
      if (!race) { w.runN += 1; if (correct) w.runCorrect += 1; }
      if (correct) w.sinceGrant += 1;
      if (correct && !w.keys.includes(key)) {
        w.keys = keepLast([...w.keys, key], LIMITS.keys);
        if (!race && w.ansCoins + REWARD.correct <= LIMITS.answerCoins) {
          w.ansCoins += REWARD.correct;
          gain(REWARD.correct);
        }
      }
      break;
    }

    // Kuasa percuma selepas 3 jawapan betul (sejak kuasa percuma terakhir).
    case 'grant': {
      out.granted = null;
      if (w.sinceGrant < 3 || w.grants >= LIMITS.grants) break;
      const id = POWERUPS[Math.floor(random() * POWERUPS.length)].id;
      w.sinceGrant = 0;
      w.grants += 1;
      w.pGot = { ...w.pGot, [id]: (w.pGot[id] || 0) + 1 };
      out.granted = id;
      break;
    }

    // Tamat latihan/cabaran: bonus hanya jika sekurang-kurangnya 3 soalan dijawab sejak tamat terakhir.
    case 'finish': {
      const n = w.runN, right = w.runCorrect;
      w.runN = 0; w.runCorrect = 0;
      if (n < 3 || w.finishes >= LIMITS.finishes) break;
      let g = REWARD.finish;
      if (n >= 5 && right === n) g += REWARD.perfect;
      if (body.mode === 'challenge') g += Math.min(Math.floor((Number(body.points) || 0) / 500), right);
      w.finishes += 1;
      gain(g);
      break;
    }

    case 'daily':
      out.daily = false;
      if (w.lastDaily === today) break;
      w.lastDaily = today;
      out.daily = true;
      gain(REWARD.daily);
      break;

    case 'achievements': {
      const ids = (Array.isArray(body.ids) ? body.ids : []).filter(id => ACH_IDS.has(id) && !w.ach.includes(id));
      out.paid = [];
      for (const id of [...new Set(ids)]) {
        if (w.achToday >= LIMITS.achievements) break;
        w.ach = [...w.ach, id];
        w.achToday += 1;
        out.paid.push(id);
        gain(REWARD.achievement);
      }
      break;
    }

    case 'homework': {
      const cid = cleanId(body.classId), aid = cleanId(body.assignmentId);
      if (!cid || !aid) throw new ApiError(400, 'bad-id');
      if (!facts.submitted) throw new ApiError(403, 'not-submitted', 'Kerja rumah belum dihantar.');
      const key = cid + '/' + aid;
      if (w.hw.includes(key)) break;
      w.hw = keepLast([...w.hw, key], 500);
      gain(REWARD.homework);
      break;
    }

    case 'race': {
      const pin = cleanId(body.pin, 12);
      if (!pin) throw new ApiError(400, 'bad-pin');
      const r = facts.race;
      if (!r) throw new ApiError(403, 'race-not-verified', 'Keputusan perlumbaan tidak dapat disahkan.');
      if (w.races.includes(pin) || w.raceCount >= LIMITS.races) break;
      w.races = keepLast([...w.races, pin], 100);
      w.raceCount += 1;
      const podium = r.players >= 3;
      gain(REWARD.race + (podium && r.rank === 1 ? REWARD.raceWin : podium && r.rank <= 3 ? REWARD.racePodium : 0));
      out.rank = r.rank;
      break;
    }

    case 'buy': {
      const item = findItem(body.id);
      if (!item) throw new ApiError(404, 'no-item');
      if (item.price === 0 || w.items.includes(item.id)) break;
      if (!admin) {
        if (balance(w) < item.price) throw new ApiError(402, 'not-enough', 'Syiling tidak cukup.');
        w.spent += item.price;
      }
      w.items = [...w.items, item.id];
      break;
    }

    case 'buyPower': {
      const p = POWERUPS.find(x => x.id === body.id);
      if (!p) throw new ApiError(404, 'no-powerup');
      if (!admin) {
        if (balance(w) < p.price) throw new ApiError(402, 'not-enough', 'Syiling tidak cukup.');
        w.spent += p.price;
      }
      w.pGot = { ...w.pGot, [p.id]: (w.pGot[p.id] || 0) + 1 };
      break;
    }

    case 'use': {
      const p = POWERUPS.find(x => x.id === body.id);
      if (!p) throw new ApiError(404, 'no-powerup');
      if (admin) break;
      if (powerLeft(w, p.id) < 1) throw new ApiError(409, 'no-powerup-left', 'Kuasa sudah habis.');
      w.pUsed = { ...w.pUsed, [p.id]: (w.pUsed[p.id] || 0) + 1 };
      break;
    }

    default:
      throw new ApiError(404, 'no-action');
  }
  return out;
}

// Kedudukan pemain perlumbaan (sama seperti src/lib/race.js).
export function raceRank(race, uid) {
  if (!race || race.status !== 'ended' || !race.players?.[uid]) return null;
  const rows = Object.entries(race.players)
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => (b.score || 0) - (a.score || 0) || (b.correct || 0) - (a.correct || 0) || (a.joinedAt || 0) - (b.joinedAt || 0));
  return { rank: rows.findIndex(r => r.id === uid) + 1, players: rows.length };
}
