// Peraturan mod Cabaran: masa setiap soalan, mata ikut kelajuan, bonus berturut-turut
// dan soalan tebusan. Digunakan juga oleh perlumbaan langsung.

export const DIFFICULTY = {
  mudah: { label: 'Mudah', emoji: '🙂', redeem: 400 },
  sederhana: { label: 'Sederhana', emoji: '😤', redeem: 700 },
  susah: { label: 'Susah', emoji: '🔥', redeem: 1000 },
};
export const DIFFICULTY_ORDER = ['mudah', 'sederhana', 'susah'];

// Warna jubin jawapan (mengikut giliran).
export const TILE_COLORS = ['#2563eb', '#0d9488', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#65a30d', '#0891b2', '#ea580c', '#4f46e5'];

// Masa (saat) untuk satu soalan: lebih panjang teks, lebih banyak masa. Gandaan 5, antara 20–60 s.
export function timeFor(q) {
  const optionChars = q.options.reduce((n, o) => n + o.length, 0);
  const secs = 15 + q.question.length / 10 + optionChars / 20;
  return Math.min(60, Math.max(20, Math.round(secs / 5) * 5));
}

// Mata satu soalan: 500–1000 ikut kelajuan, tambah bonus berturut-turut (maks +500).
export function pointsFor({ correct, timeMs, limitMs, streak }) {
  if (!correct) return { base: 0, bonus: 0, total: 0 };
  const speed = Math.max(0, 1 - timeMs / limitMs);
  const base = Math.round((500 + 500 * speed) / 10) * 10;
  const bonus = streak >= 2 ? Math.min(streak - 1, 5) * 100 : 0;
  return { base, bonus, total: base + bonus };
}

// Pilih soalan tebusan dari `pool` mengikut tahap, elak soalan yang sudah digunakan.
export function pickRedeem(pool, level, usedIds) {
  const candidates = pool.filter(q => (q.difficulty || 'sederhana') === level && !usedIds.has(q.id));
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function redeemAvailability(pool, usedIds) {
  const out = {};
  for (const level of DIFFICULTY_ORDER) {
    out[level] = pool.filter(q => (q.difficulty || 'sederhana') === level && !usedIds.has(q.id)).length;
  }
  return out;
}
