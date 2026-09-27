// Navigasi antara skrin: Log masuk → Utama → Mod → Tahun → Subjek → Kuiz → Keputusan (+ Pencapaian).
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import {
  loadConfig, loadQuestions, objectiveOnly, prepareQuestion, rebuildQuestions, shuffle,
} from './lib/quiz.js';
import {
  authErrorMessage, clearSession, firebaseReady, linkGoogle, loadUserData, saveLook, saveMyClasses, saveProfile, saveProgress,
  saveSession,
  signOutUser, watchUser,
} from './lib/firebase.js';
import {
  REWARD, emptyStats, newlyUnlocked, recordAnswer, recordGameEnd, recordQuizEnd, recordRaceEnd, setKeepStreak,
} from './lib/achievements.js';
import { Avatar, GoogleButton, Icon, REDUCED_MOTION } from './components/ui.jsx';
import ClickSpark from './components/bits/ClickSpark.jsx';
import GradientText from './components/bits/GradientText.jsx';
import Particles from './components/bits/Particles.jsx';
import Dock from './components/bits/Dock.jsx';
import Mascot from './components/Mascot.jsx';
import Toasts from './components/Toasts.jsx';
import Achievements from './screens/Achievements.jsx';
import Profile from './screens/Profile.jsx';
import UsernameSetup from './screens/UsernameSetup.jsx';
import AvatarPage from './screens/AvatarPage.jsx';
import Shop from './screens/Shop.jsx';
import AnimalAvatar from './components/AnimalAvatar.jsx';
import {
  buyItem, buyPowerup, claimDaily, coins, formatCoins, grantPowerup, isUnlimited, setUnlimited, randomPowerupId, recordDressup,
  recordHomework, usePowerup,
} from './lib/wallet.js';
import { api, apiEnabled, questionKey, withWallet } from './lib/api.js';
import { POWERUPS } from './lib/shop.js';
import { savePublicProfile } from './lib/publicProfile.js';
import { applyTheme } from './lib/theme.js';
import { NEEDS_STATE, parsePath, pathFor } from './lib/routes.js';
import LoadingScreen, { hideBootSplash } from './components/LoadingScreen.jsx';
import { isAdmin, isTeacher, teacherBasis } from './lib/roles.js';
import TeacherApply from './screens/teacher/TeacherApply.jsx';
import { submitAssignment, updateMemberSummary } from './lib/classes.js';
import MyClasses from './screens/classes/MyClasses.jsx';
// Panel admin & cikgu hanya dimuat turun bila dibuka (kebanyakan pengguna ialah murid).
const Admin = lazy(() => import('./screens/admin/Admin.jsx'));
const Teacher = lazy(() => import('./screens/teacher/Teacher.jsx'));
// Perlumbaan memerlukan SDK Realtime Database; dimuat turun hanya bila dibuka.
const RaceHub = lazy(() => import('./screens/race/RaceHub.jsx'));
const GamesHub = lazy(() => import('./screens/games/GamesHub.jsx'));
import Home from './screens/Home.jsx';
import Login from './screens/Login.jsx';
import ExamPath from './screens/ExamPath.jsx';
import Quiz from './screens/Quiz.jsx';
import Challenge from './screens/Challenge.jsx';
import Result from './screens/Result.jsx';
import Emoji from './components/Emoji.jsx';
import { ConfirmHost, ask } from './components/ConfirmDialog.jsx';

// Skrin yang memaparkan bar navigasi bawah.
const NAV_SCREENS = ['home', 'path', 'achievements', 'classes', 'teacher', 'admin', 'apply-teacher', 'result', 'profile', 'shop', 'avatar', 'games'];

// Tetamu diingatkan untuk pautkan Google setiap N soalan dijawab.
const REMIND_EVERY = 10;

export default function App() {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState('');
  const [screen, setScreen] = useState('home');
  const startRoute = useRef(parsePath()); // halaman dari URL semasa laman dibuka
  const startExam = useRef(null);          // id peperiksaan dari /latihan/<id>, dipulih bila config sedia
  const [exam, setExam] = useState(null);
  const [year, setYear] = useState(null);        // null = semua tahun
  const [subjectId, setSubjectId] = useState(null);
  const [challenge, setChallenge] = useState(null); // { questions, pool }

  const [user, setUser] = useState(undefined);   // undefined = sedang semak, null = belum log masuk
  const [dataReady, setDataReady] = useState(false);
  useEffect(() => { hideBootSplash(); }, []); // skrin React mengambil alih
  const [saved, setSaved] = useState(null);      // latihan belum selesai (disimpan)
  const [rawStats, setStats] = useState(emptyStats);
  // Dompet di pelayan (Cloudflare Worker) — sumber sebenar syiling, barang & kuasa bila apiEnabled.
  const [wallet, setWallet] = useState(null);
  const stats = apiEnabled ? withWallet(rawStats, wallet) : rawStats;
  const syncWallet = useCallback(r => { if (r?.wallet) setWallet(r.wallet); return r; }, []);
  const [unlocked, setUnlocked] = useState({});
  const [role, setRole] = useState(null);         // 'teacher' atau null (ditetapkan admin)
  const [myClasses, setMyClasses] = useState([]); // kelas yang disertai: [{ id, name, code }]
  const [teacherRequest, setTeacherRequest] = useState(null); // permohonan jadi cikgu (bukan DELIMa)
  const [avatar, setAvatar] = useState(null);     // avatar haiwan pengguna
  const [prefs, setPrefs] = useState({});        // nama paparan, gelaran, warna tema, profil awam
  const [shopTab, setShopTab] = useState('avatar');
  const [inGame, setInGame] = useState(false);     // sedang bermain permainan arked (sembunyikan bar bawah)
  const [assignment, setAssignment] = useState(null); // kerja rumah yang sedang dibuat
  const [raceClass, setRaceClass] = useState(null);   // kelas yang dipilih cikgu untuk perlumbaan
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

  // Admin: semua tanpa had (syiling, barang, kuasa) & hari berturut tidak putus.
  useEffect(() => {
    const admin = isAdmin(user);
    setUnlimited(admin);
    setKeepStreak(admin);
  }, [user]);

  // Muat data pengguna (autosave, statistik, pencapaian) bila akaun bertukar.
  useEffect(() => {
    setDataReady(false);
    setSaved(null);
    setStats(emptyStats());
    setUnlocked({});
    setRole(null);
    setMyClasses([]);
    setTeacherRequest(null);
    setWallet(null);
    if (!user) { setScreen('home'); return; }
    // Log masuk pertama: buka halaman dari URL (cth. /kedai); tukar akaun: kembali ke Utama.
    const start = startRoute.current;
    startRoute.current = null;
    setScreen(start && !NEEDS_STATE.includes(start.screen) ? start.screen : 'home');
    startExam.current = start?.examId || null;
    let alive = true;
    loadUserData(user.uid).then(d => {
      if (!alive) return;
      setSaved(d.session);
      setStats(d.stats);
      setUnlocked(d.unlocked);
      setRole(d.role);
      setTeacherRequest(d.teacherRequest);
      setAvatar(d.avatar && !d.avatar.card ? { ...d.avatar, card: 'tema-' + (d.prefs?.theme || 'oren') } : d.avatar); // warna tema lama → tema kad
      setPrefs(d.prefs || {});
      if (d.prefs?.themeMode) applyTheme(d.prefs.themeMode);
      setMyClasses((d.classes || []).map(c => (typeof c === 'string' ? { id: c, name: user.name } : c)));
      setDataReady(true);
      if (apiEnabled) {
        // Muat dompet pelayan; tuntut syiling lencana yang belum dibayar (cth. dibuka semasa luar talian).
        api('sync').then(r => {
          if (!alive) return;
          syncWallet(r);
          const unpaid = Object.keys(d.unlocked || {}).filter(id => !r.wallet.ach.includes(id));
          if (unpaid.length) api('achievements', { ids: unpaid }).then(syncWallet).catch(() => {});
        }).catch(() => {});
      }
    });
    return () => { alive = false; };
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { window.scrollTo(0, 0); }, [screen]);

  function go(next) { setScreen(next); }

  // Butang Back/Forward pelayar.
  useEffect(() => {
    function onPop() {
      const { screen: s, examId } = parsePath();
      if (examId && config) setExam(config.exams.find(x => x.id === examId) || null);
      setScreen(s);
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [config]);

  const pushToast = useCallback(t => {
    setToasts(list => [...list, { key: Date.now() + Math.random(), ...t }]);
  }, []);
  const dismissToast = useCallback(key => setToasts(list => list.filter(t => t.key !== key)), []);

  // Simpan statistik baharu dan buka pencapaian yang layak.
  const updateStats = useCallback((nextStats, currentUser = user) => {
    let next = nextStats;
    if (!currentUser) return;
    const fresh = newlyUnlocked(next, unlockedRef.current, { config, user: currentUser });
    if (fresh.length && !apiEnabled) next = { ...next, coinsEarned: (next.coinsEarned || 0) + fresh.length * REWARD.achievement };
    if (fresh.length && apiEnabled) api('achievements', { ids: fresh.map(a => a.id) }).then(syncWallet).catch(() => {});
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

  // Hadiah log masuk harian (sekali sehari).
  useEffect(() => {
    if (!user || !dataReady) return;
    if (apiEnabled) {
      api('daily').then(r => {
        syncWallet(r);
        const next = r.daily && claimDaily(statsRef.current);
        if (next) updateStats(next);
        if (r.daily) pushToast({ type: 'info', emoji: '🎁', title: `Hadiah harian: +${REWARD.daily} syiling!`, desc: 'Datang lagi esok untuk hadiah seterusnya.' });
      }).catch(() => {});
      return;
    }
    const next = claimDaily(statsRef.current);
    if (next) {
      updateStats(next);
      pushToast({ type: 'info', emoji: '🎁', title: `Hadiah harian: +${REWARD.daily} syiling!`, desc: 'Datang lagi esok untuk hadiah seterusnya.' });
    }
  }, [user?.uid, dataReady]); // eslint-disable-line react-hooks/exhaustive-deps

  function changeAvatar(next) {
    setAvatar(next);
    saveLook(user.uid, next, prefs);
    updateStats(recordDressup(statsRef.current));
    pushToast({ type: 'info', emoji: '✨', title: 'Avatar baharu dipakai!' });
  }

  // Profil awam dikemas kini (3 saat selepas perubahan) bila avatar, tetapan atau kemajuan berubah.
  const unlockedCount = Object.keys(unlocked).length;
  useEffect(() => {
    if (!user || !dataReady) return;
    const t = setTimeout(() => savePublicProfile(user, { avatar, prefs, stats: statsRef.current, unlocked: unlockedRef.current }), 3000);
    return () => clearTimeout(t);
  }, [user?.uid, dataReady, avatar, prefs, stats.quizzes, stats.races, stats.answered, unlockedCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Guna satu kuasa (pulang true jika berjaya).
  function spendPowerup(id) {
    const next = usePowerup(statsRef.current, id);
    if (!next) return false;
    updateStats(next);
    if (apiEnabled && !isUnlimited()) {
      setWallet(w => (w ? { ...w, pUsed: { ...w.pUsed, [id]: (w.pUsed[id] || 0) + 1 } } : w));
      api('use', { id }).then(syncWallet).catch(() => {});
    }
    return true;
  }

  // Beli barang/kuasa di kedai. Pulang true jika berjaya, atau mesej ralat.
  async function buyFromShop(kind, id) {
    if (!apiEnabled || isUnlimited()) {
      const next = kind === 'item' ? buyItem(statsRef.current, id) : buyPowerup(statsRef.current, id);
      if (!next) return false;
      updateStats(next);
      return true;
    }
    try {
      syncWallet(await api(kind === 'item' ? 'buy' : 'buyPower', { id }));
      updateStats({ ...statsRef.current, purchases: (statsRef.current.purchases || 0) + 1 });
      return true;
    } catch (e) {
      return e.message;
    }
  }

  // Laporkan jawapan kepada pelayan (syiling jawapan betul & kiraan kuasa percuma).
  function serverAnswer(correct, q, src) {
    if (apiEnabled && q) api('answer', { key: questionKey(q), correct, src }).then(syncWallet).catch(() => {});
  }

  // Kuasa percuma (cth. 3 betul berturut-turut).
  function giftPowerup() {
    if (apiEnabled) {
      api('grant').then(r => {
        syncWallet(r);
        const p = POWERUPS.find(x => x.id === r.granted);
        if (p) pushToast({ type: 'info', emoji: '🎁', title: `Kuasa percuma: ${p.name}!`, desc: p.desc });
      }).catch(() => {});
      return;
    }
    const id = randomPowerupId();
    updateStats(grantPowerup(statsRef.current, id));
    const p = POWERUPS.find(x => x.id === id);
    pushToast({ type: 'info', emoji: '🎁', title: `Kuasa percuma: ${p.name}!`, desc: p.desc });
  }

  function savePrefs(next) {
    applyTheme(next.themeMode || 'auto');
    setPrefs(next);
    saveLook(user.uid, avatar, next);
  }

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
    if (user?.isGuest && !await ask(
      'Anda belum pautkan akaun Google.\n\nJika log keluar sekarang, SEMUA markah, latihan tersimpan dan pencapaian akan HILANG.\n\nTeruskan log keluar?')) return;
    await signOutUser();
  }

  // ===== Kuiz =====
  // Cabaran: soalan dikocok (maks mengikut config), kolam tebusan = semua soalan subjek.
  async function startChallenge(subject, questions, all = false, fixedPool = null) {
    const count = all ? questions.length : subject.test?.questions || 20;
    const chosen = shuffle(questions).slice(0, count).map(q => prepareQuestion(q));
    const pool = fixedPool || objectiveOnly(await loadQuestions(subject.file));
    setSubjectId(subject.id);
    setQuizSource(questions);
    setChallenge({ questions: chosen, pool });
    setQuizRun(n => n + 1);
    go('challenge');
  }

  async function startQuiz(subject, questions, hw = null, yr) {
    if (savedRef.current && !await ask('Anda ada latihan yang belum selesai. Mula latihan baharu dan buang simpanan itu?')) return;
    const prepared = shuffle(questions).map(q => prepareQuestion(q));
    const raw = {
      examId: hw?.examId ?? exam?.id ?? null,
      subjectId: subject.id,
      year: hw ? hw.year || null : yr !== undefined ? yr : year,
      order: prepared.map(q => ({ id: q.id, perm: q.perm })),
      current: 0,
      score: 0,
      chosen: null,
      wrongIds: [],
      assignment: hw ? { id: hw.id, classId: hw.classId, title: hw.title, dueAt: hw.dueAt ?? null } : null,
      // Soalan set cikgu tiada dalam fail subjek, jadi salinannya disimpan untuk disambung kemudian.
      snapshot: hw?.questions ? questions : null,
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
    if (!subject && !raw?.snapshot) return;
    try {
      const all = raw.snapshot ? objectiveOnly(raw.snapshot) : objectiveOnly(await loadQuestions(subject.file));
      const questions = rebuildQuestions(all, raw.order);
      if (!questions.length) throw new Error('kosong');
      const byId = new Map(all.map(q => [q.id, q]));
      setExam(e ?? null);
      setYear(raw.year ?? null);
      setSubjectId(raw.subjectId);
      setQuizSource(raw.order.map(o => byId.get(o.id)).filter(Boolean));
      setAssignment(raw.assignment || null);
      setSession({ ...raw, current: Math.min(raw.current, questions.length - 1), questions });
      setQuizRun(n => n + 1);
      go('quiz');
    } catch {
      alert('Latihan ini tidak dapat disambung (soalan telah dikemas kini). Sila mula latihan baharu.');
      discardSaved(true);
    }
  }

  async function discardSaved(force = false) {
    if (!force && !await ask('Buang latihan yang belum selesai?')) return;
    clearSession(user.uid);
    setSaved(null);
  }

  function progress(state) {
    const raw = { ...savedRef.current, ...state, savedAt: new Date().toISOString() };
    savedRef.current = raw;
    setSaved(raw);
    saveSession(user.uid, raw);
  }

  function answered(correct, q) {
    serverAnswer(correct, q, 'quiz');
    const next = recordAnswer(statsRef.current, correct);
    updateStats(next);
    if (user.isGuest && next.answered % REMIND_EVERY === 0) pushToast({ type: 'remind' });
  }

  function finish(r) {
    clearSession(user.uid);
    setSaved(null);
    updateStats(recordQuizEnd(statsRef.current, { examId: exam?.id, subjectId, score: r.score, total: r.total }));
    if (apiEnabled) api('finish', { mode: 'practice' }).then(syncWallet).catch(() => {});
    afterQuiz(r);
    setResult(r);
    go('result');
  }

  function finishChallenge(r) {
    updateStats(recordQuizEnd(statsRef.current, { ...r, examId: exam?.id, subjectId }));
    if (apiEnabled) api('finish', { mode: 'challenge', points: r.points }).then(syncWallet).catch(() => {});
    afterQuiz(r);
    setResult(r);
    go('result');
  }

  // Selepas latihan: hantar kerja rumah (jika ada) dan kemas kini ringkasan murid untuk cikgu.
  function afterQuiz(r) {
    if (assignment) {
      const cls = myClasses.find(c => c.id === assignment.classId);
      const hw = assignment;
      submitAssignment(assignment, user, cls?.name || user.name, r)
        .then(() => {
          updateStats(recordHomework(statsRef.current));
          if (apiEnabled) api('homework', { classId: hw.classId, assignmentId: hw.id }).then(syncWallet).catch(() => {});
          pushToast({ type: 'info', emoji: '📬', title: `Kerja rumah dihantar! +${REWARD.homework} syiling`, desc: assignment.title });
        })
        .catch(() => alert('Kerja rumah gagal dihantar. Semak sambungan internet dan cuba lagi.'));
      setAssignment(null);
    }
    // statsRef dikemas kini serta-merta oleh updateStats di atas.
    myClasses.forEach(c => updateMemberSummary(c.id, user.uid, statsRef.current).catch(() => {}));
  }

  // Mula kerja rumah: soalan tetap yang dipilih cikgu, dalam mod Latihan atau Cabaran.
  async function startHomework(a) {
    // Kerja rumah daripada set cikgu membawa salinan soalannya sendiri.
    if (a.questions?.length) {
      const questions = objectiveOnly(a.questions);
      const pseudo = { id: a.setId || 'set', test: { questions: questions.length } };
      setExam(null);
      setYear(null);
      setAssignment(a);
      if (a.mode === 'challenge') startChallenge(pseudo, questions, true, questions);
      else startQuiz(pseudo, questions, a);
      return;
    }
    const e = config?.exams.find(x => x.id === a.examId);
    const subject = e?.subjects.find(x => x.id === a.subjectId);
    if (!subject) return alert('Subjek kerja rumah ini tidak dijumpai.');
    const all = objectiveOnly(await loadQuestions(subject.file));
    const ids = new Set(a.questionIds);
    const questions = all.filter(q => ids.has(q.id));
    if (!questions.length) return alert('Soalan kerja rumah ini sudah tiada. Beritahu cikgu anda.');
    setExam(e);
    setYear(a.year || null);
    setAssignment(a);
    if (a.mode === 'challenge') startChallenge(subject, questions, true);
    else startQuiz(subject, questions, a);
  }

  function changeClasses(list) {
    setMyClasses(list);
    saveMyClasses(user.uid, list);
  }

  // Wajib pilih nama dahulu selepas log masuk pertama.
  const needsName = Boolean(user && dataReady && !prefs.displayName);
  const loggedIn = user && dataReady && !needsName;

  // Kemas kini URL mengikut halaman; halaman tanpa data (cth. /kuiz selepas refresh) → Utama.
  useEffect(() => {
    if (!loggedIn) return;
    if (screen === 'path' && !exam) {
      if (!config) return;
      const e = startExam.current && config.exams.find(x => x.id === startExam.current);
      startExam.current = null;
      if (e) setExam(e); else setScreen('home');
      return;
    }
    const missing = (screen === 'quiz' && !session) || (screen === 'challenge' && !challenge) || (screen === 'result' && !result);
    if (missing) { setScreen('home'); return; }
    const p = pathFor(screen, exam?.id);
    if (p !== location.pathname) history.pushState(null, '', p + location.search);
  }, [loggedIn, screen, exam?.id, session, challenge, result, config]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Zarah terapung di belakang semua skrin (React Bits Particles) */}
      {!REDUCED_MOTION && (
        <div className="page-bg" aria-hidden="true">
          <Particles particleColors={['#58cc02', '#1cb0f6', '#ff9600', '#ffc800', '#ce82ff', '#ff4b4b']}
            particleCount={120} particleSpread={10} speed={0.06} particleBaseSize={220}
            alphaParticles disableRotation={false} />
        </div>
      )}

      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand">
            <span className="brand-mark" aria-hidden="true"><Mascot size={38} /></span>
            <GradientText className="brand-name" colors={['#ff9600', '#ffc800', '#58cc02', '#ff9600']} animationSpeed={6}>
              Kuiz Ulang Kaji
            </GradientText>
          </span>
          {loggedIn && (
            <div className="hud" aria-label="Statistik anda">
              <span className="hud-item hud-fire" title="Hari berturut-turut"><Emoji e="🔥" size="1.35rem" />{stats.dayStreak || 0}</span>
              <span className="hud-item hud-xp" title="XP (10 setiap jawapan betul)"><Emoji e="⚡" size="1.35rem" />{(stats.correct || 0) * 10}</span>
              <button className="hud-item hud-coins" title="Syiling — tekan untuk ke kedai" onClick={() => { setShopTab('avatar'); go('shop'); }}>
                <Emoji e="🪙" size="1.35rem" />{formatCoins(coins(stats))}
              </button>
            </div>
          )}
          {user && (
            <div className="topbar-profile">
              {user.isGuest && !user.local && (
                <GoogleButton className="btn-google-sm topbar-link" onClick={link} aria-label="Pautkan akaun Google">
                  Simpan
                </GoogleButton>
              )}
              <button className="profile-chip" title="Profil saya" onClick={() => go('profile')}>
                {dataReady ? <AnimalAvatar avatar={avatar} size={34} /> : <Avatar user={user} size={28} />}
                <span className="profile-name">{prefs.displayName || user.name}</span>
              </button>
              <button className="btn btn-ghost btn-icon" onClick={logout} aria-label="Log keluar" title="Log keluar">
                <Icon name="logout" />
              </button>
            </div>
          )}
        </div>
      </header>

      <Toasts toasts={toasts} onDismiss={dismissToast} onLink={link} />
      <ConfirmHost />

      {/* Percikan kecil pada setiap sentuhan (React Bits ClickSpark) */}
      <ClickSpark sparkColor="#ff9600" sparkSize={9} sparkRadius={24} sparkCount={10} duration={420}>
      <main className="container">
        <Suspense fallback={<LoadingScreen />}>
        {(user === undefined || (user && !dataReady)) && <LoadingScreen overlay label={user ? 'Menyediakan data anda…' : 'Memuatkan…'} />}
        {user === null && <Login />}
        {needsName && (
          <UsernameSetup user={user} avatar={avatar} onDone={(name, look) => {
            const nextPrefs = { ...prefs, displayName: name };
            setPrefs(nextPrefs);
            setAvatar(look);
            saveLook(user.uid, look, nextPrefs);
          }} />
        )}
        {loggedIn && screen === 'home' && (
          <Home config={config} error={error} user={user} saved={saved} stats={stats} displayName={prefs.displayName}
            admin={isAdmin(user)} teacher={isTeacher(user, role)} myClasses={myClasses}
            teacherBasis={teacherBasis(user, role)} teacherRequest={teacherRequest}
            onApplyTeacher={() => go('apply-teacher')}
            onAdmin={() => go('admin')} onTeacher={() => go('teacher')} onClasses={() => go('classes')}
            onRace={() => { setRaceClass(null); go('race'); }} onGames={() => go('games')}
            onStartHomework={startHomework}
            unlockedCount={Object.keys(unlocked).length}
            onResume={resumeQuiz} onDiscard={() => discardSaved()} onLink={link}
            onAchievements={() => go('achievements')}
            onSelectExam={e => { setExam(e); go('path'); }} />
        )}
        {loggedIn && screen === 'classes' && (
          <MyClasses user={user} myClasses={myClasses} config={config} onChange={changeClasses}
            onStartHomework={startHomework} onBack={() => go('home')} />
        )}
        {loggedIn && screen === 'apply-teacher' && (
          <TeacherApply user={user} request={teacherRequest} onLink={link} onBack={() => go('home')}
            onSubmitted={r => setTeacherRequest(r)} />
        )}
        {loggedIn && screen === 'teacher' && isTeacher(user, role) && (
          <Teacher user={user} config={config} onBack={() => go('home')}
            onHostRace={cls => { setRaceClass(cls); go('race'); }} />
        )}
        {loggedIn && screen === 'games' && (
          <GamesHub config={config} user={{ ...user, displayName: prefs.displayName }} avatar={avatar}
            onPlaying={setInGame}
            onAnswer={(correct, q) => { serverAnswer(correct, q, 'game'); updateStats(recordAnswer(statsRef.current, correct)); }}
            onGameEnd={r => {
              updateStats(recordGameEnd(statsRef.current, r));
              if (apiEnabled) api('finish', { mode: 'game' }).then(syncWallet).catch(() => {});
            }}
            onRace={() => { setRaceClass(null); go('race'); }} />
        )}
        {loggedIn && screen === 'race' && (
          <RaceHub user={user} config={config} presetClass={raceClass} teacher={isTeacher(user, role)}
            onBack={() => go(raceClass ? 'teacher' : 'home')}
            onRaceEnd={r => {
              updateStats(recordRaceEnd(statsRef.current, r));
              if (apiEnabled) api('race', { pin: r.pin }).then(syncWallet).catch(() => {});
            }}
            power={{ stats, onUse: spendPowerup, onGrant: giftPowerup, onAnswer: (c, q) => serverAnswer(c, q, 'race') }}
            avatar={avatar} displayName={prefs.displayName} />
        )}
        {loggedIn && screen === 'admin' && isAdmin(user) && (
          <Admin user={user} config={config} onBack={() => go('home')} />
        )}
        {loggedIn && screen === 'profile' && (
          <Profile user={user} stats={stats} unlocked={unlocked} avatar={avatar} prefs={prefs}
            onSavePrefs={savePrefs} onLink={link} onBack={() => go('home')}
            onWardrobe={() => { setShopTab('avatar'); go('shop'); }}
            onShop={() => { setShopTab('kuasa'); go('shop'); }}
            onAchievements={() => go('achievements')} onAvatar={() => go('avatar')} />
        )}
        {loggedIn && screen === 'avatar' && (
          <AvatarPage user={user} stats={stats} avatar={avatar} prefs={prefs} unlocked={unlocked}
            onBack={() => go('profile')} onWardrobe={() => { setShopTab('avatar'); go('shop'); }} />
        )}
        {loggedIn && screen === 'shop' && (
          <Shop key={shopTab} stats={stats} avatar={avatar} initialTab={shopTab}
            onUpdateStats={next => updateStats(next)} onBuy={buyFromShop} onChangeAvatar={changeAvatar} onBack={() => go('profile')} />
        )}
        {loggedIn && screen === 'achievements' && (
          <Achievements user={user} config={config} stats={stats} unlocked={unlocked}
            onBack={() => go('home')} onLink={link} />
        )}
        {loggedIn && screen === 'path' && exam && (
          <ExamPath exam={exam} stats={stats} onBack={() => go('home')}
            onStart={(subject, questions, m, y) => {
              setYear(y);
              if (m === 'challenge') startChallenge(subject, questions);
              else startQuiz(subject, questions, null, y);
            }} />
        )}
        {loggedIn && screen === 'quiz' && session && (
          <Quiz key={quizRun} session={session}
            onProgress={progress}
            onAnswer={answered}
            onQuit={() => go('home')}
            onFinish={finish} />
        )}
        {loggedIn && screen === 'challenge' && challenge && (
          <Challenge key={quizRun} questions={challenge.questions} pool={challenge.pool} stats={stats}
            onUsePowerup={spendPowerup} onGrantPowerup={giftPowerup}
            onAnswer={(correct, q) => { serverAnswer(correct, q, 'challenge'); updateStats(recordAnswer(statsRef.current, correct)); }}
            onQuit={() => { setAssignment(null); go(exam && !assignment ? 'path' : 'home'); }}
            onFinish={finishChallenge} />
        )}
        {loggedIn && screen === 'result' && result && (
          <Result result={result} user={user} onLink={link}
            onRetry={() => (result.mode === 'challenge'
              ? startChallenge(exam.subjects.find(x => x.id === subjectId), quizSource)
              : startQuiz({ id: subjectId }, quizSource))}
            onSubjects={() => go(exam ? 'path' : 'home')}
            onHome={() => go('home')} />
        )}
        </Suspense>
      </main>
      </ClickSpark>

      {/* Bar navigasi bawah (React Bits Dock) — disembunyikan semasa menjawab soalan */}
      {loggedIn && NAV_SCREENS.includes(screen) && !(screen === 'games' && inGame) && (
        <nav className="bottom-nav" aria-label="Navigasi utama">
          <Dock panelHeight={64} baseItemSize={48} magnification={62} distance={140}
            items={[
              { icon: <Emoji e="🏠" size="30px" />, label: 'Utama', onClick: () => go('home'), className: screen === 'home' || screen === 'path' ? 'is-active' : '' },
              { icon: <Emoji e="🎲" size="30px" />, label: 'Main', onClick: () => go('games'), className: screen === 'games' || screen === 'race' ? 'is-active' : '' },
              { icon: <Emoji e="🏫" size="30px" />, label: 'Kelas', onClick: () => go('classes'), className: screen === 'classes' ? 'is-active' : '' },
              { icon: <Emoji e="🛍️" size="30px" />, label: 'Kedai', onClick: () => { setShopTab('avatar'); go('shop'); }, className: screen === 'shop' ? 'is-active' : '' },
              { icon: <AnimalAvatar avatar={avatar} size={40} />, label: 'Profil', onClick: () => go('profile'), className: screen === 'profile' || screen === 'achievements' ? 'is-active' : '' },
              ...(isTeacher(user, role) ? [{ icon: <Emoji e="🧑‍🏫" size="30px" />, label: 'Cikgu', onClick: () => go('teacher'), className: screen === 'teacher' ? 'is-active' : '' }] : []),
            ]} />
        </nav>
      )}

      <footer className="site-footer">
        © {new Date().getFullYear()}{' '}
        <a href="https://portfolio-3ud.pages.dev" target="_blank" rel="noopener noreferrer">Afif Aiman</a>
        . Hak cipta terpelihara.
      </footer>
    </>
  );
}
