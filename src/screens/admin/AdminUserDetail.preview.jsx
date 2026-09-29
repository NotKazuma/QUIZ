// Pratonton AdminUserDetail — hanya mod pembangunan.
// Buka: http://localhost:5173/?preview=admin
import AdminUserDetail from './AdminUserDetail.jsx';

const USER = {
  uid: 'k3Jd8vQpLmR2sT7uV1wX',
  role: 'teacher',
  lastActive: new Date(Date.now() - 36e5).toISOString(),
  updatedAt: new Date(Date.now() - 36e5).toISOString(),
  profile: {
    name: 'Ahmad Faiz bin Osman',
    email: 'faiz@moe-dl.edu.my',
    photo: null,
    isGuest: false,
  },
  classes: [
    { id: 'c1', name: 'Darjah 4 Amanah', code: 'K7P2QR' },
    { id: 'c2', name: 'Darjah 5 Bestari', code: 'M4XW9T' },
  ],
  session: { examId: 'darjah-4', subjectId: 'tajwid', index: 6 },
  teacherRequest: { status: 'diluluskan', school: 'SRA Taman Universiti', note: 'Guru Tajwid', at: '2026-01-05T02:11:00.000Z' },
  stats: {
    answered: 1842, correct: 1553, streak: 7, bestStreak: 31,
    quizzes: 96, perfect: 18, excellent: 44,
    subjects: {
      'darjah-4:tajwid': 47, 'darjah-4:faraid': 58, 'darjah-4:jenayat': 66,
      'darjah-4:ibadat': 81, 'darjah-4:sirah': 88, 'darjah-4:akhlak': 94,
      'darjah-5:tafsir': 72,
    },
    dayStreak: 12, bestDayStreak: 28, lastDay: '2026-09-29', earlyBird: 9,
    challenges: 34, bestPoints: 1420, redeemed: 12, redeemedHard: 4,
    races: 19, raceWins: 6, racePodiums: 13,
    games: 27, snakeWins: 8, memoryPerfect: 5, duelWins: 11,
    coinsEarned: 4820, coinsSpent: 3150, purchases: 23, powerupsUsed: 41,
    dressups: 17, homeworkDone: 31, dailyClaims: 26, lastDaily: '2026-09-29',
    items: ['topi-songkok', 'baju-melayu', 'tema-galaksi', 'tema-neon', 'cermin-mata'],
    pGot: { 'beku-masa': 12, 'tambah-nyawa': 8, 'jawapan-terbuka': 5 },
    pUsed: { 'beku-masa': 9, 'tambah-nyawa': 8, 'perisai': 2 },
  },
  unlocked: {
    'first-step': '2026-01-06T03:00:00.000Z',
    'first-quiz': '2026-01-06T03:20:00.000Z',
    'quiz-5': '2026-01-11T09:00:00.000Z',
    'quiz-20': '2026-03-02T14:00:00.000Z',
    'answer-100': '2026-01-20T11:00:00.000Z',
    'answer-500': '2026-04-18T08:30:00.000Z',
    'correct-50': '2026-01-15T10:00:00.000Z',
    'streak-5': '2026-01-09T07:00:00.000Z',
    'streak-10': '2026-02-14T16:00:00.000Z',
    excellent: '2026-01-25T13:00:00.000Z',
    perfect: '2026-02-01T12:00:00.000Z',
    explorer: '2026-05-09T10:00:00.000Z',
  },
};

const CONFIG = {
  exams: [
    { id: 'darjah-4', name: 'Darjah 4', subjects: [
      { id: 'tajwid', name: 'Tajwid' }, { id: 'faraid', name: 'Faraid' },
      { id: 'jenayat', name: 'Jenayat' }, { id: 'ibadat', name: 'Ibadat' },
      { id: 'sirah', name: 'Sirah' }, { id: 'akhlak', name: 'Akhlak' },
    ] },
    { id: 'darjah-5', name: 'Darjah 5', subjects: [{ id: 'tafsir', name: 'Tafsir' }] },
  ],
};

export default function AdminUserDetailPreview() {
  return (
    <AdminUserDetail
      user={USER} me={{ uid: 'admin-lain' }} config={CONFIG}
      onBack={() => { window.location.search = ''; }}
      onToggleTeacher={() => alert('tukar peranan cikgu')}
      onDelete={() => alert('padam data')}
    />
  );
}
