// Statistik pengguna dan senarai pencapaian (achievement).
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
  };
}

export function mergeStats(a, b) {
  const x = { ...emptyStats(), ...a };
  const y = { ...emptyStats(), ...b };
  const out = {};
  for (const k of Object.keys(emptyStats())) {
    if (typeof x[k] === 'number') out[k] = Math.max(x[k], y[k] || 0);
  }
  out.subjects = { ...x.subjects };
  for (const [k, v] of Object.entries(y.subjects || {})) out.subjects[k] = Math.max(out.subjects[k] || 0, v);
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

function localDay(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Kemas kini bila satu soalan dijawab.
export function recordAnswer(stats, correct, now = new Date()) {
  const s = { ...stats };
  s.answered += 1;
  if (correct) {
    s.correct += 1;
    s.streak += 1;
    s.bestStreak = Math.max(s.bestStreak, s.streak);
  } else {
    s.streak = 0;
  }
  // Hari berlatih berturut-turut.
  const today = localDay(now);
  if (s.lastDay !== today) {
    const yesterday = localDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
    s.dayStreak = s.lastDay === yesterday ? s.dayStreak + 1 : 1;
    s.bestDayStreak = Math.max(s.bestDayStreak, s.dayStreak);
    s.lastDay = today;
  }
  if (now.getHours() < 8) s.earlyBird += 1;
  return s;
}

// Kemas kini bila satu latihan ditamatkan.
export function recordQuizEnd(stats, { examId, subjectId, score, total }) {
  const s = { ...stats, subjects: { ...stats.subjects } };
  const percent = total ? Math.round((score / total) * 100) : 0;
  s.quizzes += 1;
  if (total >= 10 && percent === 100) s.perfect += 1;
  if (total >= 10 && percent >= 80) s.excellent += 1;
  if (examId && subjectId) {
    const key = examId + ':' + subjectId;
    s.subjects[key] = Math.max(s.subjects[key] || 0, percent);
  }
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
