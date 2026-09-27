// Navigasi antara skrin: Log masuk → Utama → Mod → Tahun → Subjek → Kuiz → Keputusan (+ Pencapaian).
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  loadConfig, loadQuestions, objectiveOnly, prepareQuestion, rebuildQuestions, shuffle,
} from './lib/quiz.js';
import {
  authErrorMessage, clearSession, firebaseReady, linkGoogle, loadUserData, saveProfile, saveProgress, saveSession,
  signOutUser, watchUser,
} from './lib/firebase.js';
import { emptyStats, newlyUnlocked, recordAnswer, recordQuizEnd } from './lib/achievements.js';
import { Avatar, GoogleButton, Icon, REDUCED_MOTION } from './components/ui.jsx';
import ClickSpark from './components/bits/ClickSpark.jsx';
import GradientText from './components/bits/GradientText.jsx';
import Particles from './components/bits/Particles.jsx';
import Toasts from './components/Toasts.jsx';
import Achievements from './screens/Achievements.jsx';
import Admin from './screens/admin/Admin.jsx';
import { isAdmin, isTeacher } from './lib/roles.js';
import Home from './screens/Home.jsx';
import Login from './screens/Login.jsx';
import ModeSelect from './screens/ModeSelect.jsx';
import SubjectSelect from './screens/SubjectSelect.jsx';
import YearSelect from './screens/YearSelect.jsx';
import Quiz from './screens/Quiz.jsx';
import Challenge from './screens/Challenge.jsx';
import Result from './screens/Result.jsx';

// Tetamu diingatkan untuk pautkan Google setiap N soalan dijawab.
const REMIND_EVERY = 10;

export default function App() {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState('');
  const [screen, setScreen] = useState('home');
  const [exam, setExam] = useState(null);
  const [year, setYear] = useState(null);        // null = semua tahun
  const [subjectId, setSubjectId] = useState(null);
  const [mode, setMode] = useState('practice');  // 'practice' | 'challenge'
  const [challenge, setChallenge] = useState(null); // { questions, pool }

  const [user, setUser] = useState(undefined);   // undefined = sedang semak, null = belum log masuk
  const [dataReady, setDataReady] = useState(false);
  const [saved, setSaved] = useState(null);      // latihan belum selesai (disimpan)
  const [stats, setStats] = useState(emptyStats);
  const [unlocked, setUnlocked] = useState({});
  const [role, setRole] = useState(null);         // 'teacher' atau null (ditetapkan admin)
  const [toasts, setToasts] = useState([]);

  const [session, setSession] = useState(null);  // sesi kuiz semasa (dengan soalan penuh)
  const [quizSource, setQuizSource] = useState([]); // soalan asal sesi (untuk "Ulang latihan")
  const [quizRun, setQuizRun] = useState(0);
  const [result, setResult] = useState(null);

  // Rujukan terkini untuk fungsi yang dipanggil dari dalam kuiz.
  const statsRef = useRef(stats);
  const unlockedRef = useRef(unlocked);
  const savedRef = useRef(saved);
  statsRef.current = stats;
  unlockedRef.current = unlocked;
  savedRef.current = saved;

  useEffect(() => {
    loadConfig()
      .then(setConfig)
      .catch(() => setError('Tidak dapat memuat config.json. Pastikan laman dijalankan melalui pelayan (contoh: npm run dev).'));
  }, []);

  useEffect(() => watchUser(setUser), []);

  // Muat data pengguna (autosave, statistik, pencapaian) bila akaun bertukar.
  useEffect(() => {
    setDataReady(false);
    setSaved(null);
    setStats(emptyStats());
    setUnlocked({});
    setRole(null);
    setScreen('home');
    if (!user) return;
    let alive = true;
    loadUserData(user.uid).then(d => {
      if (!alive) return;
      setSaved(d.session);
      setStats(d.stats);
      setUnlocked(d.unlocked);
      setRole(d.role);
      setDataReady(true);
    });
    return () => { alive = false; };
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { window.scrollTo(0, 0); }, [screen]);

  function go(next) { setScreen(next); }

  const pushToast = useCallback(t => {
    setToasts(list => [...list, { key: Date.now() + Math.random(), ...t }]);
  }, []);
  const dismissToast = useCallback(key => setToasts(list => list.filter(t => t.key !== key)), []);

  // Simpan statistik baharu dan buka pencapaian yang layak.
  const updateStats = useCallback((next, currentUser = user) => {
    if (!currentUser) return;
    const fresh = newlyUnlocked(next, unlockedRef.current, { config, user: currentUser });
    const now = new Date().toISOString();
    const nextUnlocked = { ...unlockedRef.current };
    fresh.forEach(a => { nextUnlocked[a.id] = now; });
    statsRef.current = next;
    unlockedRef.current = nextUnlocked;
    setStats(next);
    setUnlocked(nextUnlocked);
    saveProgress(currentUser.uid, next, nextUnlocked, fresh.length > 0);
    fresh.forEach(a => pushToast({ type: 'achievement', achievement: a }));
  }, [config, user, pushToast]);

  // Simpan profil (nama/emel) untuk senarai admin & laporan cikgu; dikemas kini bila akaun dipautkan.
  useEffect(() => {
    if (user && dataReady) saveProfile(user);
  }, [user?.uid, user?.isGuest, user?.name, dataReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Semak semula pencapaian bila data dimuat atau akaun dipautkan (cth. "Akaun Selamat").
  useEffect(() => {
    if (user && dataReady && config) updateStats(statsRef.current);
  }, [user?.isGuest, dataReady, config]); // eslint-disable-line react-hooks/exhaustive-deps

  async function link() {
    if (!firebaseReady) return alert('Log masuk Google belum disediakan (Firebase belum dikonfigurasi).');
    try {
      await linkGoogle();
    } catch (e) {
      const msg = authErrorMessage(e);
      if (msg) alert(msg);
    }
  }

  async function logout() {
    if (user?.isGuest && !confirm(
      'Anda belum pautkan akaun Google.\n\nJika log keluar sekarang, SEMUA markah, latihan tersimpan dan pencapaian akan HILANG.\n\nTeruskan log keluar?')) return;
    await signOutUser();
  }

  // ===== Kuiz =====
  function selectSubject(subject, questions) {
    if (mode === 'challenge') startChallenge(subject, questions);
    else startQuiz(subject, questions);
  }

  // Cabaran: soalan dikocok (maks mengikut config), kolam tebusan = semua soalan subjek.
  async function startChallenge(subject, questions) {
    const count = subject.test?.questions || 20;
    const chosen = shuffle(questions).slice(0, count).map(q => prepareQuestion(q));
    const pool = objectiveOnly(await loadQuestions(subject.file));
    setSubjectId(subject.id);
    setQuizSource(questions);
    setChallenge({ questions: chosen, pool });
    setQuizRun(n => n + 1);
    go('challenge');
  }

  function startQuiz(subject, questions) {
    if (savedRef.current && !confirm('Anda ada latihan yang belum selesai. Mula latihan baharu dan buang simpanan itu?')) return;
    const prepared = shuffle(questions).map(q => prepareQuestion(q));
    const raw = {
      examId: exam?.id ?? null,
      subjectId: subject.id,
      year,
      order: prepared.map(q => ({ id: q.id, perm: q.perm })),
      current: 0,
      score: 0,
      chosen: null,
      savedAt: new Date().toISOString(),
    };
    saveSession(user.uid, raw);
    setSaved(raw);
    setSubjectId(subject.id);
    setQuizSource(questions);
    setSession({ ...raw, questions: prepared });
    setQuizRun(n => n + 1);
    go('quiz');
  }

  // Sambung latihan yang disimpan (selepas laman ditutup/terkeluar, atau dari peranti lain).
  async function resumeQuiz() {
    const raw = savedRef.current;
    const e = config?.exams.find(x => x.id === raw?.examId);
    const subject = e?.subjects.find(x => x.id === raw.subjectId);
    if (!subject) return;
    try {
      const all = objectiveOnly(await loadQuestions(subject.file));
      const questions = rebuildQuestions(all, raw.order);
      if (!questions.length) throw new Error('kosong');
      const byId = new Map(all.map(q => [q.id, q]));
      setExam(e);
      setYear(raw.year ?? null);
      setSubjectId(subject.id);
      setQuizSource(raw.order.map(o => byId.get(o.id)).filter(Boolean));
      setSession({ ...raw, current: Math.min(raw.current, questions.length - 1), questions });
      setQuizRun(n => n + 1);
      go('quiz');
    } catch {
      alert('Latihan ini tidak dapat disambung (soalan telah dikemas kini). Sila mula latihan baharu.');
      discardSaved(true);
    }
  }

  function discardSaved(force = false) {
    if (!force && !confirm('Buang latihan yang belum selesai?')) return;
    clearSession(user.uid);
    setSaved(null);
  }

  function progress(state) {
    const raw = { ...savedRef.current, ...state, savedAt: new Date().toISOString() };
    savedRef.current = raw;
    setSaved(raw);
    saveSession(user.uid, raw);
  }

  function answered(correct) {
    const next = recordAnswer(statsRef.current, correct);
    updateStats(next);
    if (user.isGuest && next.answered % REMIND_EVERY === 0) pushToast({ type: 'remind' });
  }

  function finish(r) {
    clearSession(user.uid);
    setSaved(null);
    updateStats(recordQuizEnd(statsRef.current, { examId: exam?.id, subjectId, score: r.score, total: r.total }));
    setResult(r);
    go('result');
  }

  function finishChallenge(r) {
    updateStats(recordQuizEnd(statsRef.current, { ...r, examId: exam?.id, subjectId }));
    setResult(r);
    go('result');
  }

  const loggedIn = user && dataReady;

  return (
    <>
      {/* Zarah terapung di belakang semua skrin (React Bits Particles) */}
      {!REDUCED_MOTION && (
        <div className="page-bg" aria-hidden="true">
          <Particles particleColors={['#14b8a6', '#2dd4bf', '#f59e0b', '#fcd34d']}
            particleCount={160} particleSpread={10} speed={0.08} particleBaseSize={260}
            alphaParticles disableRotation={false} />
        </div>
      )}

      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand">
            <span className="brand-mark" aria-hidden="true"><Icon name="book" /></span>
            <GradientText colors={['#14b8a6', '#2dd4bf', '#f59e0b', '#14b8a6']} animationSpeed={6}>
              Kuiz Ulang Kaji
            </GradientText>
          </span>
          {user && (
            <div className="topbar-profile">
              {user.isGuest && !user.local && (
                <GoogleButton className="btn-google-sm topbar-link" onClick={link} aria-label="Pautkan akaun Google">
                  Simpan
                </GoogleButton>
              )}
              <span className="profile-chip" title={user.email || user.name}>
                <Avatar user={user} size={28} />
                <span className="profile-name">{user.name}</span>
              </span>
              <button className="btn btn-ghost btn-icon" onClick={logout} aria-label="Log keluar" title="Log keluar">
                <Icon name="logout" />
              </button>
            </div>
          )}
        </div>
      </header>

      <Toasts toasts={toasts} onDismiss={dismissToast} onLink={link} />

      {/* Percikan kecil pada setiap sentuhan (React Bits ClickSpark) */}
      <ClickSpark sparkColor="#14b8a6" sparkSize={8} sparkRadius={22} sparkCount={8} duration={400}>
      <main className="container">
        {(user === undefined || (user && !dataReady)) && <p className="alert">Memuatkan…</p>}
        {user === null && <Login />}
        {loggedIn && screen === 'home' && (
          <Home config={config} error={error} user={user} saved={saved}
            admin={isAdmin(user)} teacher={isTeacher(user, role)}
            onAdmin={() => go('admin')}
            unlockedCount={Object.keys(unlocked).length}
            onResume={resumeQuiz} onDiscard={() => discardSaved()} onLink={link}
            onAchievements={() => go('achievements')}
            onSelectExam={e => { setExam(e); go('mode'); }} />
        )}
        {loggedIn && screen === 'admin' && isAdmin(user) && (
          <Admin user={user} config={config} onBack={() => go('home')} />
        )}
        {loggedIn && screen === 'achievements' && (
          <Achievements user={user} config={config} stats={stats} unlocked={unlocked}
            onBack={() => go('home')} onLink={link} />
        )}
        {loggedIn && screen === 'mode' && (
          <ModeSelect exam={exam} onBack={() => go('home')}
            onPractice={() => { setMode('practice'); go('years'); }}
            onChallenge={() => { setMode('challenge'); go('years'); }} />
        )}
        {loggedIn && screen === 'years' && (
          <YearSelect exam={exam} onBack={() => go('mode')}
            onSelect={y => { setYear(y); go('subjects'); }} />
        )}
        {loggedIn && screen === 'subjects' && (
          <SubjectSelect exam={exam} year={year} mode={mode} onBack={() => go('years')} onSelect={selectSubject} />
        )}
        {loggedIn && screen === 'quiz' && session && (
          <Quiz key={quizRun} session={session}
            onProgress={progress}
            onAnswer={answered}
            onQuit={() => go('home')}
            onFinish={finish} />
        )}
        {loggedIn && screen === 'challenge' && challenge && (
          <Challenge key={quizRun} questions={challenge.questions} pool={challenge.pool}
            onAnswer={correct => updateStats(recordAnswer(statsRef.current, correct))}
            onQuit={() => go('subjects')}
            onFinish={finishChallenge} />
        )}
        {loggedIn && screen === 'result' && result && (
          <Result result={result} user={user} onLink={link}
            onRetry={() => (result.mode === 'challenge'
              ? startChallenge(exam.subjects.find(x => x.id === subjectId), quizSource)
              : startQuiz({ id: subjectId }, quizSource))}
            onSubjects={() => go(exam ? 'subjects' : 'home')}
            onHome={() => go('home')} />
        )}
      </main>
      </ClickSpark>

      <footer className="site-footer">
        © {new Date().getFullYear()}{' '}
        <a href="https://portfolio-3ud.pages.dev" target="_blank" rel="noopener noreferrer">Afif Aiman</a>
        . Hak cipta terpelihara.
      </footer>
    </>
  );
}
