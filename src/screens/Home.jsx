import { useEffect, useState } from 'react';
import Aurora from '../components/bits/Aurora.jsx';
import BlurText from '../components/bits/BlurText.jsx';
import CountUp from '../components/bits/CountUp.jsx';
import RotatingText from '../components/bits/RotatingText.jsx';
import ShinyText from '../components/bits/ShinyText.jsx';
import { ActionCard, REDUCED_MOTION, Reveal } from '../components/ui.jsx';
import { useMediaQuery } from '../lib/useMediaQuery.js';
import { EXAM_DESC, loadQuestions, objectiveOnly } from '../lib/quiz.js';

// Nama subjek yang berputar di bawah tajuk.
const ROTATE_WORDS = ['Ibadah', 'Aqidah', 'Sirah', 'Jawi', 'Bahasa Arab', 'Tajwid', 'Tauhid', 'Akhlak'];

export default function Home({ config, error, onSelectExam }) {
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
        <div className="hero-rotate">
          <RotatingText
            texts={ROTATE_WORDS}
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
        </div>
      </div>

      {error && <p className="alert">{error}</p>}

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
              icon={exam.id}
              title={exam.name}
              desc={(EXAM_DESC[exam.id] || '') + ' · ' + exam.subjects.length + ' subjek'}
              onClick={() => onSelectExam(exam)} />
          </Reveal>
        ))}
        {config && (
          <Reveal index={config.exams.length + 1}>
            <ActionCard icon="chart" title="Kemajuan" desc="Lihat markah dan topik lemah" disabled soon />
          </Reveal>
        )}
      </div>
    </section>
  );
}
