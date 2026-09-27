// Dompet syiling, barang avatar & kuasa — semua fungsi tulen yang memulangkan statistik baharu.
// Nilai hanya bertambah (diperoleh/dibelanja/diguna), jadi salinan di beberapa peranti boleh digabung.
import { REWARD, emptyStats } from './achievements.js';
import { ANIMALS, ITEMS, POWERUPS } from './shop.js';

const withDefaults = stats => ({ ...emptyStats(), ...stats });

export const coins = stats => Math.max(0, (stats.coinsEarned || 0) - (stats.coinsSpent || 0));

export const powerupCount = (stats, id) => Math.max(0, (stats.pGot?.[id] || 0) - (stats.pUsed?.[id] || 0));

// Barang percuma dimiliki semua orang.
export function owns(stats, id) {
  const item = ITEMS.find(i => i.id === id) || ANIMALS.find(a => a.id === id);
  return !item || item.price === 0 || (stats.items || []).includes(id);
}

export function earn(stats, amount) {
  const s = withDefaults(stats);
  s.coinsEarned += amount;
  return s;
}

// Pulangkan statistik baharu, atau null jika syiling tidak cukup / sudah dimiliki.
export function buyItem(stats, id) {
  const item = ITEMS.find(i => i.id === id) || ANIMALS.find(a => a.id === id);
  if (!item || owns(stats, id) || coins(stats) < item.price) return null;
  const s = withDefaults(stats);
  s.coinsSpent += item.price;
  s.items = [...(s.items || []), id];
  s.purchases += 1;
  return s;
}

export function buyPowerup(stats, id) {
  const p = POWERUPS.find(x => x.id === id);
  if (!p || coins(stats) < p.price) return null;
  const s = withDefaults(stats);
  s.coinsSpent += p.price;
  s.pGot = { ...s.pGot, [id]: (s.pGot?.[id] || 0) + 1 };
  s.purchases += 1;
  return s;
}

// Kuasa percuma (cth. hadiah jawapan betul berturut-turut).
export function grantPowerup(stats, id) {
  const s = withDefaults(stats);
  s.pGot = { ...s.pGot, [id]: (s.pGot?.[id] || 0) + 1 };
  return s;
}

export function usePowerup(stats, id) {
  if (powerupCount(stats, id) < 1) return null;
  const s = withDefaults(stats);
  s.pUsed = { ...s.pUsed, [id]: (s.pUsed?.[id] || 0) + 1 };
  s.powerupsUsed += 1;
  return s;
}

export function randomPowerupId() {
  return POWERUPS[Math.floor(Math.random() * POWERUPS.length)].id;
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Hadiah log masuk harian: pulangkan statistik baharu atau null jika sudah dituntut hari ini.
export function claimDaily(stats) {
  const s = withDefaults(stats);
  if (s.lastDaily === today()) return null;
  s.lastDaily = today();
  s.dailyClaims += 1;
  s.coinsEarned += REWARD.daily;
  return s;
}

export function recordHomework(stats) {
  const s = withDefaults(stats);
  s.homeworkDone += 1;
  s.coinsEarned += REWARD.homework;
  return s;
}

export function recordDressup(stats) {
  const s = withDefaults(stats);
  s.dressups += 1;
  return s;
}
