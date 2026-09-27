// Statistik pengguna dan senarai pencapaian (achievement).

// Ganjaran syiling 🪙 bagi setiap aktiviti.
export const REWARD = {
  correct: 2,        // setiap jawapan betul
  finish: 10,        // tamat latihan/cabaran
  perfect: 20,       // 100% (sekurang-kurangnya 5 soalan)
  race: 10, racePodium: 15, raceWin: 30,
  homework: 15,      // hantar kerja rumah
  daily: 5,          // log masuk harian
  achievement: 25,   // setiap lencana dibuka (lalai)
};
// Statistik hanya bertambah, jadi dua salinan (peranti & awan) boleh digabung dengan mengambil nilai maksimum.

export function emptyStats() {
  return {
    answered: 0,       // jumlah soalan dijawab
    correct: 0,        // jumlah jawapan betul
    streak: 0,         // betul berturut-turut sekarang
    bestStreak: 0,
    quizzes: 0,        // latihan yang ditamatkan
    perfect: 0,        // latihan 100% (sekurang-kurangnya 10 soalan)
    excellent: 0,      // latihan >= 80% (sekurang-kurangnya 10 soalan)
    subjects: {},      // "exam:subjek" -> peratus terbaik
    dayStreak: 0,      // hari berturut-turut berlatih
    bestDayStreak: 0,
    lastDay: '',       // YYYY-MM-DD (waktu tempatan)
    earlyBird: 0,      // berlatih sebelum 8 pagi
    challenges: 0,     // cabaran bermasa yang ditamatkan
    bestPoints: 0,     // mata tertinggi dalam satu cabaran
    redeemed: 0,       // soalan tebusan yang berjaya
    redeemedHard: 0,   // soalan tebusan Susah yang berjaya
    races: 0,          // perlumbaan langsung yang ditamatkan
    raceWins: 0,       // tempat pertama (sekurang-kurangnya 3 pemain)
    racePodiums: 0,    // 3 teratas (sekurang-kurangnya 3 pemain)
    games: 0,          // permainan arked ditamatkan (Ular & Tangga, Kad Padanan, Kad Duel)
    snakeWins: 0,      // menang Ular & Tangga
    memoryPerfect: 0,  // Kad Padanan dengan 3 bintang
    duelWins: 0,       // kalahkan Belang dalam Kad Duel
    // Dompet & kedai (lihat wallet.js). Semua nilai hanya bertambah supaya boleh digabung ikut maksimum:
    coinsEarned: 0,    // syiling diperoleh (baki = coinsEarned - coinsSpent)
    coinsSpent: 0,
    purchases: 0,      // bilangan pembelian
    powerupsUsed: 0,
    dressups: 0,       // kali menukar avatar
    homeworkDone: 0,
    dailyClaims: 0,    // hadiah log masuk harian
    lastDaily: '',
    items: [],         // id barang avatar yang dimiliki
    pGot: {},          // kuasa diperoleh/dibeli: id -> bilangan
    pUsed: {},         // kuasa digunakan: id -> bilangan
  };
}

function mergeMax(a = {}, b = {}) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = Math.max(out[k] || 0, v || 0);
  return out;
}

export function mergeStats(a, b) {
  const x = { ...emptyStats(), ...a };
  const y = { ...emptyStats(), ...b };
  const out = {};
  for (const k of Object.keys(emptyStats())) {
    if (typeof x[k] === 'number') out[k] = Math.max(x[k], y[k] || 0);
  }
  out.subjects = mergeMax(x.subjects, y.subjects);
  out.pGot = mergeMax(x.pGot, y.pGot);
  out.pUsed = mergeMax(x.pUsed, y.pUsed);
  out.items = [...new Set([...(x.items || []), ...(y.items || [])])];
  out.lastDaily = (x.lastDaily || '') >= (y.lastDaily || '') ? x.lastDaily : y.lastDaily;
  // Rantaian harian ikut salinan yang paling baru berlatih.
  const later = (x.lastDay || '') >= (y.lastDay || '') ? x : y;
  out.lastDay = later.lastDay;
  out.dayStreak = later.dayStreak;
  return out;
}

export function mergeUnlocked(a = {}, b = {}) {
  const out = { ...a };
  for (const [id, at] of Object.entries(b)) if (!out[id] || at < out[id]) out[id] = at;
  return out;
}

// Mod admin: rekod hari berturut tidak pernah putus (hari yang tidak dibuka tetap dikira).
let keepStreak = false;
export function setKeepStreak(value) { keepStreak = Boolean(value); }

function localDay(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Kemas kini bila satu soalan dijawab.
export function recordAnswer(stats, correct, now = new Date()) {
  const s = { ...emptyStats(), ...stats };
  s.answered += 1;
  if (correct) {
    s.correct += 1;
    s.coinsEarned += REWARD.correct;
    s.streak += 1;
    s.bestStreak = Math.max(s.bestStreak, s.streak);
  } else {
    s.streak = 0;
  }
  // Hari berlatih berturut-turut.
  const today = localDay(now);
  if (s.lastDay !== today) {
    const yesterday = localDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
    if (keepStreak && s.lastDay) {
      const gap = Math.max(1, Math.round((new Date(today) - new Date(s.lastDay)) / 864e5));
      s.dayStreak = (s.dayStreak || 0) + gap;
    } else {
      s.dayStreak = s.lastDay === yesterday ? s.dayStreak + 1 : 1;
    }
    s.bestDayStreak = Math.max(s.bestDayStreak, s.dayStreak);
    s.lastDay = today;
  }
  if (now.getHours() < 8) s.earlyBird += 1;
  return s;
}

// Kemas kini bila satu latihan/cabaran ditamatkan.
export function recordQuizEnd(stats, { examId, subjectId, score, total, mode, points, redeem }) {
  const s = { ...emptyStats(), ...stats, subjects: { ...stats.subjects } };
  if (mode === 'challenge') {
    s.challenges += 1;
    s.bestPoints = Math.max(s.bestPoints, points || 0);
    s.redeemed += redeem?.success || 0;
    s.redeemedHard += redeem?.hard || 0;
  }
  const percent = total ? Math.round((score / total) * 100) : 0;
  s.quizzes += 1;
  s.coinsEarned += REWARD.finish + (total >= 5 && percent === 100 ? REWARD.perfect : 0)
    + (mode === 'challenge' ? Math.floor((points || 0) / 500) : 0);
  if (total >= 10 && percent === 100) s.perfect += 1;
  if (total >= 10 && percent >= 80) s.excellent += 1;
  if (examId && subjectId) {
    const key = examId + ':' + subjectId;
    s.subjects[key] = Math.max(s.subjects[key] || 0, percent);
  }
  return s;
}

// Kemas kini bila permainan arked tamat. game: 'ular' | 'padanan' | 'duel'.
export function recordGameEnd(stats, { game, won, stars = 0 }) {
  const s = { ...emptyStats(), ...stats };
  s.games += 1;
  if (won) s.coinsEarned += REWARD.finish;
  if (game === 'ular' && won) s.snakeWins += 1;
  if (game === 'padanan' && stars >= 3) s.memoryPerfect += 1;
  if (game === 'duel' && won) s.duelWins += 1;
  return s;
}

// Kemas kini bila perlumbaan langsung tamat.
export function recordRaceEnd(stats, { rank, players }) {
  const s = { ...emptyStats(), ...stats };
  s.races += 1;
  s.coinsEarned += REWARD.race + (players >= 3 && rank === 1 ? REWARD.raceWin : players >= 3 && rank <= 3 ? REWARD.racePodium : 0);
  if (players >= 3 && rank === 1) s.raceWins += 1;
  if (players >= 3 && rank >= 1 && rank <= 3) s.racePodiums += 1;
  return s;
}

// Subjek paling banyak ditamatkan dalam satu peperiksaan: [siap, jumlah].
function bestExamCoverage(stats, config) {
  let best = [0, 1];
  for (const exam of config?.exams || []) {
    const done = exam.subjects.filter(sub => (exam.id + ':' + sub.id) in stats.subjects).length;
    if (done / exam.subjects.length > best[0] / best[1]) best = [done, exam.subjects.length];
  }
  return best;
}

// Setiap pencapaian: progress(stats, ctx) -> [nilai, sasaran]. Dibuka bila nilai >= sasaran.
export const ACHIEVEMENTS = [
  { id: 'first-step', emoji: '🚀', title: 'Langkah Pertama', desc: 'Jawab soalan pertama anda', progress: s => [s.answered, 1] },
  { id: 'first-quiz', emoji: '🏁', title: 'Tamat!', desc: 'Tamatkan satu latihan', progress: s => [s.quizzes, 1] },
  { id: 'quiz-5', emoji: '📚', title: 'Rajin Berlatih', desc: 'Tamatkan 5 latihan', progress: s => [s.quizzes, 5] },
  { id: 'quiz-20', emoji: '🏆', title: 'Pejuang Ilmu', desc: 'Tamatkan 20 latihan', progress: s => [s.quizzes, 20] },
  { id: 'answer-100', emoji: '💯', title: '100 Soalan', desc: 'Jawab 100 soalan', progress: s => [s.answered, 100] },
  { id: 'answer-500', emoji: '🧠', title: 'Otak Geliga', desc: 'Jawab 500 soalan', progress: s => [s.answered, 500] },
  { id: 'correct-50', emoji: '✅', title: '50 Jawapan Betul', desc: 'Dapatkan 50 jawapan betul', progress: s => [s.correct, 50] },
  { id: 'streak-5', emoji: '🔥', title: 'Panas!', desc: '5 jawapan betul berturut-turut', progress: s => [s.bestStreak, 5] },
  { id: 'streak-10', emoji: '⚡', title: 'Tak Dapat Dihalang', desc: '10 jawapan betul berturut-turut', progress: s => [s.bestStreak, 10] },
  { id: 'excellent', emoji: '🎖️', title: 'Cemerlang', desc: 'Dapat 80% atau lebih (min. 10 soalan)', progress: s => [s.excellent, 1] },
  { id: 'perfect', emoji: '🌟', title: 'Markah Penuh', desc: 'Dapat 100% (min. 10 soalan)', progress: s => [s.perfect, 1] },
  { id: 'explorer', emoji: '🧭', title: 'Penjelajah', desc: 'Tamatkan latihan 5 subjek berbeza', progress: s => [Object.keys(s.subjects).length, 5] },
  { id: 'all-subjects', emoji: '🗺️', title: 'Tuntas', desc: 'Tamatkan semua subjek dalam satu peperiksaan', progress: (s, ctx) => bestExamCoverage(s, ctx.config) },
  { id: 'days-3', emoji: '📅', title: 'Tiga Hari Berturut', desc: 'Berlatih 3 hari berturut-turut', progress: s => [s.bestDayStreak, 3] },
  { id: 'days-7', emoji: '🗓️', title: 'Seminggu Istiqamah', desc: 'Berlatih 7 hari berturut-turut', progress: s => [s.bestDayStreak, 7] },
  { id: 'early-bird', emoji: '🌅', title: 'Si Awal Pagi', desc: 'Berlatih sebelum pukul 8 pagi', progress: s => [s.earlyBird, 1] },
  { id: 'first-challenge', emoji: '🎮', title: 'Pencabar', desc: 'Tamatkan satu Cabaran', progress: s => [s.challenges || 0, 1] },
  { id: 'redeem', emoji: '🎯', title: 'Bangkit Semula', desc: 'Berjaya menjawab soalan tebusan', progress: s => [s.redeemed || 0, 1] },
  { id: 'redeem-hard', emoji: '💪', title: 'Berani Susah', desc: 'Berjaya menjawab soalan tebusan Susah', progress: s => [s.redeemedHard || 0, 1] },
  { id: 'points-10k', emoji: '💎', title: '10,000 Mata', desc: 'Kumpul 10,000 mata dalam satu Cabaran', progress: s => [s.bestPoints || 0, 10000] },
  { id: 'race-first', emoji: '🏎️', title: 'Pelumba', desc: 'Tamatkan satu perlumbaan langsung', progress: s => [s.races || 0, 1] },
  { id: 'race-podium', emoji: '🥉', title: 'Naik Podium', desc: 'Tiga teratas dalam perlumbaan (min. 3 pemain)', progress: s => [s.racePodiums || 0, 1] },
  { id: 'race-win', emoji: '🥇', title: 'Juara Perlumbaan', desc: 'Tempat pertama dalam perlumbaan (min. 3 pemain)', progress: s => [s.raceWins || 0, 1] },
  // --- Lebih banyak lencana ---
  { id: 'answer-1000', emoji: '🏅', title: 'Seribu Soalan', desc: 'Jawab 1,000 soalan', progress: s => [s.answered, 1000] },
  { id: 'answer-2000', emoji: '🎓', title: 'Ulama Cilik', desc: 'Jawab 2,000 soalan', progress: s => [s.answered, 2000] },
  { id: 'correct-200', emoji: '🎊', title: '200 Jawapan Betul', desc: 'Dapatkan 200 jawapan betul', progress: s => [s.correct, 200] },
  { id: 'correct-500', emoji: '🏵️', title: '500 Jawapan Betul', desc: 'Dapatkan 500 jawapan betul', progress: s => [s.correct, 500] },
  { id: 'correct-1000', emoji: '👑', title: 'Raja Jawapan', desc: 'Dapatkan 1,000 jawapan betul', progress: s => [s.correct, 1000] },
  { id: 'quiz-50', emoji: '📘', title: 'Ulat Buku', desc: 'Tamatkan 50 latihan', progress: s => [s.quizzes, 50] },
  { id: 'quiz-100', emoji: '🎒', title: 'Pelajar Tekun', desc: 'Tamatkan 100 latihan', progress: s => [s.quizzes, 100] },
  { id: 'streak-20', emoji: '🌋', title: 'Gunung Berapi', desc: '20 jawapan betul berturut-turut', progress: s => [s.bestStreak, 20] },
  { id: 'streak-30', emoji: '☄️', title: 'Meteor', desc: '30 jawapan betul berturut-turut', progress: s => [s.bestStreak, 30] },
  { id: 'perfect-5', emoji: '💫', title: 'Lima Kali Sempurna', desc: 'Dapat 100% sebanyak 5 kali', progress: s => [s.perfect, 5] },
  { id: 'perfect-10', emoji: '🌠', title: 'Bintang Kelas', desc: 'Dapat 100% sebanyak 10 kali', progress: s => [s.perfect, 10] },
  { id: 'days-14', emoji: '📆', title: 'Dua Minggu Istiqamah', desc: 'Berlatih 14 hari berturut-turut', progress: s => [s.bestDayStreak, 14] },
  { id: 'days-30', emoji: '🌙', title: 'Sebulan Istiqamah', desc: 'Berlatih 30 hari berturut-turut', progress: s => [s.bestDayStreak, 30] },
  { id: 'challenge-10', emoji: '🕹️', title: 'Kaki Cabaran', desc: 'Tamatkan 10 Cabaran', progress: s => [s.challenges || 0, 10] },
  { id: 'points-20k', emoji: '💰', title: '20,000 Mata', desc: 'Kumpul 20,000 mata dalam satu Cabaran', progress: s => [s.bestPoints || 0, 20000] },
  { id: 'redeem-10', emoji: '🔁', title: 'Tak Kenal Putus Asa', desc: 'Berjaya menjawab 10 soalan tebusan', progress: s => [s.redeemed || 0, 10] },
  { id: 'race-5', emoji: '🚦', title: 'Pelumba Tegar', desc: 'Tamatkan 5 perlumbaan', progress: s => [s.races || 0, 5] },
  { id: 'race-win-3', emoji: '🏆', title: 'Juara Bertahan', desc: 'Menang 3 perlumbaan (min. 3 pemain)', progress: s => [s.raceWins || 0, 3] },
  { id: 'games-5', emoji: '🎲', title: 'Kaki Main', desc: 'Tamatkan 5 permainan arked', progress: s => [s.games || 0, 5] },
  { id: 'snake-win', emoji: '🐍', title: 'Raja Tangga', desc: 'Menang Ular & Tangga', progress: s => [s.snakeWins || 0, 1] },
  { id: 'memory-3', emoji: '🧠', title: 'Ingatan Gajah', desc: 'Tamatkan Kad Padanan dengan 3 bintang', progress: s => [s.memoryPerfect || 0, 1] },
  { id: 'duel-win', emoji: '⚔️', title: 'Pahlawan Kad', desc: 'Kalahkan Belang dalam Kad Duel', progress: s => [s.duelWins || 0, 1] },
  { id: 'coins-500', emoji: '🪙', title: 'Kaya Raya', desc: 'Kumpul 500 syiling', progress: s => [s.coinsEarned || 0, 500] },
  { id: 'coins-2000', emoji: '🏦', title: 'Jutawan Cilik', desc: 'Kumpul 2,000 syiling', progress: s => [s.coinsEarned || 0, 2000] },
  { id: 'first-buy', emoji: '🛍️', title: 'Pembeli Pertama', desc: 'Beli barang pertama di kedai', progress: s => [s.purchases || 0, 1] },
  { id: 'buy-10', emoji: '🎁', title: 'Kaki Kedai', desc: 'Buat 10 pembelian', progress: s => [s.purchases || 0, 10] },
  { id: 'dressup', emoji: '👗', title: 'Bergaya', desc: 'Tukar rupa avatar anda', progress: s => [s.dressups || 0, 1] },
  { id: 'collector', emoji: '🧸', title: 'Pengumpul', desc: 'Miliki 10 barang avatar', progress: s => [(s.items || []).length, 10] },
  { id: 'powerup-1', emoji: '🪄', title: 'Kuasa Pertama', desc: 'Guna kuasa buat kali pertama', progress: s => [s.powerupsUsed || 0, 1] },
  { id: 'powerup-20', emoji: '🔮', title: 'Ahli Sihir Ilmu', desc: 'Guna 20 kuasa', progress: s => [s.powerupsUsed || 0, 20] },
  { id: 'homework-1', emoji: '📬', title: 'Murid Rajin', desc: 'Hantar kerja rumah pertama', progress: s => [s.homeworkDone || 0, 1] },
  { id: 'homework-10', emoji: '📮', title: 'Tak Pernah Ponteng', desc: 'Hantar 10 kerja rumah', progress: s => [s.homeworkDone || 0, 10] },
  { id: 'daily-7', emoji: '🗝️', title: 'Setia Datang', desc: 'Tuntut hadiah harian 7 kali', progress: s => [s.dailyClaims || 0, 7] },
  { id: 'master-3', emoji: '🧩', title: 'Pakar Subjek', desc: 'Dapat 90% atau lebih dalam 3 subjek', progress: s => [Object.values(s.subjects || {}).filter(v => v >= 90).length, 3] },
  { id: 'linked', emoji: '🔐', title: 'Akaun Selamat', desc: 'Pautkan akaun Google', progress: (s, ctx) => [ctx.user && !ctx.user.isGuest ? 1 : 0, 1] },
];

// Pulangkan senarai pencapaian yang baru dibuka (belum ada dalam `unlocked`).
export function newlyUnlocked(stats, unlocked, ctx) {
  return ACHIEVEMENTS.filter(a => {
    if (unlocked[a.id]) return false;
    const [v, target] = a.progress(stats, ctx);
    return v >= target;
  });
}
