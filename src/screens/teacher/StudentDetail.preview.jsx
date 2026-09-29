// Pratonton StudentDetail dengan data palsu — hanya dalam mod pembangunan.
// Buka: http://localhost:5173/?preview=student
// Memintas Firestore supaya reka bentuk panel boleh disemak tanpa kelas sebenar.
import StudentDetail from './StudentDetail.jsx';

const CLS = { id: 'demo', name: 'Darjah 4 Amanah', code: 'ABC123' };

const MEMBER = {
  uid: 'u1',
  name: 'Nur Aisyah binti Rahman',
  isGuest: false,
  joinedAt: '2026-01-12T08:00:00.000Z',
  lastActive: new Date(Date.now() - 2 * 86400000).toISOString(),
  avatar: { color: 'oren', hat: null },
  summary: {
    answered: 412, correct: 331, quizzes: 23, challenges: 7,
    bestPoints: 980, bestStreak: 19, dayStreak: 5,
  },
  subjects: {
    'darjah-4:tajwid': 41,
    'darjah-4:faraid': 52,
    'darjah-4:jenayat': 63,
    'darjah-4:ibadat': 78,
    'darjah-4:sirah': 86,
    'darjah-4:akhlak': 91,
  },
};

const ASSIGNMENTS = [
  { id: 'a1', title: 'Ulang kaji Ibadat: Taharah', examId: 'darjah-4', subjectId: 'ibadat', examName: 'Darjah 4', subjectName: 'Ibadat', year: '2025', questionIds: Array(10).fill(0), mode: 'latihan', dueAt: '2026-02-01T16:00:00.000Z' },
  { id: 'a2', title: 'Cabaran Tajwid', examId: 'darjah-4', subjectId: 'tajwid', examName: 'Darjah 4', subjectName: 'Tajwid', year: '2025', questionIds: Array(15).fill(0), mode: 'challenge', dueAt: '2026-02-08T16:00:00.000Z' },
  { id: 'a3', title: 'Faraid: waris lelaki', examId: 'darjah-4', subjectId: 'faraid', examName: 'Darjah 4', subjectName: 'Faraid', year: '2024', questionIds: Array(12).fill(0), mode: 'latihan', dueAt: '2026-02-15T16:00:00.000Z' },
  { id: 'a4', title: 'Sirah: Hijrah ke Madinah', examId: 'darjah-4', subjectId: 'sirah', examName: 'Darjah 4', subjectName: 'Sirah', year: '2024', questionIds: Array(10).fill(0), mode: 'latihan', dueAt: null },
];

const SUBS = {
  a1: { name: MEMBER.name, total: 10, firstScore: 8, bestScore: 9, points: 120, attempts: 2, wrongIds: ['q-ibadat-3', 'q-ibadat-7'], firstAt: '2026-01-30T10:12:00.000Z', lastAt: '2026-01-31T09:02:00.000Z', late: false },
  a2: { name: MEMBER.name, total: 15, firstScore: 6, bestScore: 6, points: 60, attempts: 1, wrongIds: ['q-tajwid-1', 'q-tajwid-4', 'q-tajwid-5', 'q-ibadat-3'], firstAt: '2026-02-09T21:40:00.000Z', lastAt: '2026-02-09T21:40:00.000Z', late: true },
  a3: { name: MEMBER.name, total: 12, firstScore: 12, bestScore: 12, points: 240, attempts: 1, wrongIds: [], firstAt: '2026-02-14T15:20:00.000Z', lastAt: '2026-02-14T15:20:00.000Z', late: false },
};

const AVGS = {
  a1: { count: 18, avg: 72, best: 100, wrongIds: [] },
  a2: { count: 15, avg: 55, best: 93, wrongIds: [] },
  a3: { count: 17, avg: 81, best: 100, wrongIds: [] },
  a4: null,
};

// Data palsu menggantikan Firestore.
const API = {
  listStudentSubmissions: async (_cid, _uid, list) =>
    list.map(a => ({ assignment: a, sub: SUBS[a.id] || null })),
  classAverages: async () => AVGS,
  removeMember: async () => {},
};

export default function StudentDetailPreview() {
  return (
    <StudentDetail cls={CLS} member={MEMBER} assignments={ASSIGNMENTS} config={null} api={API}
      onBack={() => { window.location.search = ''; }} onRemoved={() => {}} />
  );
}
