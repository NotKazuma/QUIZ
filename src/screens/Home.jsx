import { useEffect, useState } from 'react';
import Aurora from '../components/bits/Aurora.jsx';
import BlurText from '../components/bits/BlurText.jsx';
import CountUp from '../components/bits/CountUp.jsx';
import RotatingText from '../components/bits/RotatingText.jsx';
import ShinyText from '../components/bits/ShinyText.jsx';
import { ActionCard, LinkReminder, REDUCED_MOTION, Reveal } from '../components/ui.jsx';
import { ACHIEVEMENTS } from '../lib/achievements.js';
import HomeworkList from './classes/HomeworkList.jsx';
import { useMediaQuery } from '../lib/useMediaQuery.js';
import { loadQuestions, objectiveOnly } from '../lib/quiz.js';

export default function Home({
  config, error, user, saved, unlockedCount, admin, teacher, myClasses, onAdmin, onTeacher, onClasses, onStartHomework,
  onResume, onDiscard, onLink, onAchievements, onSelectExam,
}) {
  const dark = useMediaQuery('(prefers-color-scheme: dark)');
  const [total, setTotal] = useState(0);

  // Jumlah soalan semua subjek (fail disimpan dalam cache untuk skrin lain).
  useEffect(() => {
    if (!config) return;
    let alive = true;
    const files = config.exams.flatMap(e => e.subjects.map(s => s.file));
    Promise.all(files.map(f => loadQuestions(f).then(qs => objectiveOnly(qs).length).catch(() => 0)))
      .then(ns => { if (alive) setTotal(ns.reduce((a, b) => a + b, 0)); });
    return () => { alive = false; };
  }, [config]);

  const subjectCount = config ? config.exams.reduce((n, e) => n + e.subjects.length, 0) : 0;
  // Nama subjek (unik) daripada config.json, berputar di bawah tajuk.
  const rotateWords = config ? [...new Set(config.exams.flatMap(e => e.subjects.map(s => s.name)))] : [];

  return (
    <section className="screen">
      {/* Latar aurora lembut di belakang tajuk */}
      {!REDUCED_MOTION && (
        <div className="hero-bg" aria-hidden="true">
          <Aurora
            colorStops={dark ? ['#0f766e', '#2dd4bf', '#f59e0b'] : ['#5eead4', '#99f6e4', '#fcd34d']}
            amplitude={0.9}
            blend={0.6}
            speed={0.6}
            lightMode={!dark}
          />
        </div>
      )}

      <div className="hero">
        <p className="eyebrow">
          <ShinyText text="Assalamualaikum!" speed={3}
            color={dark ? '#2dd4bf' : '#0f766e'} shineColor={dark ? '#ccfbf1' : '#5eead4'} />
        </p>
        <BlurText text="Jom ulang kaji" className="hero-title" delay={120} animateBy="words" />
        {rotateWords.length > 0 && <div className="hero-rotate">
          <RotatingText
            texts={rotateWords}
            mainClassName="rotate-pill"
            splitLevelClassName="rotate-split"
            staggerFrom="last"
            staggerDuration={0.025}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-120%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            rotationInterval={2200}
          />
          <span className="muted">bersama-sama!</span>
        </div>}
      </div>

      {error && <p className="alert">{error}</p>}

      {/* Peringatan tetamu: sentiasa dipaparkan sehingga akaun Google dipautkan */}
      {user.isGuest && <Reveal className="spaced"><LinkReminder onLink={onLink} /></Reveal>}

      {teacher && (
        <Reveal className="spaced">
          <ActionCard className="teacher-card" icon="users" title="Panel Cikgu"
            desc="Kelas, laporan murid, kerja rumah & perlumbaan" onClick={onTeacher} />
        </Reveal>
      )}

      {/* Kerja rumah yang belum dibuat (daripada kelas yang disertai) */}
      {myClasses.length > 0 && (
        <div className="spaced">
          <HomeworkList user={user} myClasses={myClasses} onStart={onStartHomework} limit={3} />
        </div>
      )}

      {admin && (
        <Reveal className="spaced">
          <ActionCard className="admin-card" icon="shield" title="Panel Admin"
            desc="Urus pengguna, tetapkan cikgu dan sunting soalan" onClick={onAdmin} />
        </Reveal>
      )}

      {/* Latihan yang belum selesai (autosave) */}
      {saved && config && <ResumeCard saved={saved} config={config} onResume={onResume} onDiscard={onDiscard} />}

      {config && (
        <Reveal className="stats">
          <div className="stat">
            <span className="stat-num">{total ? <CountUp to={total} duration={1.5} separator="," /> : '…'}</span>
            <span className="stat-label">soalan</span>
          </div>
          <div className="stat">
            <span className="stat-num"><CountUp to={subjectCount} duration={1.2} /></span>
            <span className="stat-label">subjek</span>
          </div>
          <div className="stat">
            <span className="stat-num"><CountUp to={config.exams.length} duration={1} /></span>
            <span className="stat-label">peperiksaan</span>
          </div>
        </Reveal>
      )}

      <div className="card-list">
        {config?.exams.map((exam, i) => (
          <Reveal key={exam.id} index={i + 1}>
            <ActionCard
              className="exam-card"
              icon={exam.icon || 'book'}
              title={exam.name}
              desc={(exam.desc ? exam.desc + ' · ' : '') + exam.subjects.length + ' subjek'}
              onClick={() => onSelectExam(exam)} />
          </Reveal>
        ))}
        {config && (
          <Reveal index={config.exams.length + 1}>
            <ActionCard className="achievement-card" icon="trophy" title="Pencapaian"
              desc={`${unlockedCount}/${ACHIEVEMENTS.length} dibuka · lihat statistik anda`}
              onClick={onAchievements} />
          </Reveal>
        )}
        {config && (
          <Reveal index={config.exams.length + 2}>
            <ActionCard className="classes-card" icon="users" title="Kelas saya"
              desc={myClasses.length ? `${myClasses.length} kelas · kerja rumah & sertai kelas` : 'Sertai kelas cikgu dengan kod kelas'}
              onClick={onClasses} />
          </Reveal>
        )}
      </div>
    </section>
  );
}

function ResumeCard({ saved, config, onResume, onDiscard }) {
  const exam = config.exams.find(e => e.id === saved.examId);
  const subject = exam?.subjects.find(x => x.id === saved.subjectId);
  const total = saved.order?.length || 0;
  const done = saved.current + (saved.chosen !== null && saved.chosen !== undefined ? 1 : 0);
  const when = new Date(saved.savedAt).toLocaleString('ms-MY', { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <Reveal className="resume">
      <ActionCard className="resume-card" icon="play"
        title="Sambung latihan"
        desc={`${exam?.name ?? '?'} · ${subject?.name ?? '?'}${saved.year ? ' · ' + saved.year : ''} · ${done}/${total} dijawab · markah ${saved.score}`}
        onClick={onResume} />
      <div className="resume-meta">
        <span className="muted">Disimpan {when}</span>
        <button className="btn btn-ghost btn-sm" onClick={onDiscard}>Buang</button>
      </div>
    </Reveal>
  );
}
