import { useEffect, useRef, useState } from 'react';
import BlurText from '../components/bits/BlurText.jsx';
import ClickSpark from '../components/bits/ClickSpark.jsx';
import Counter from '../components/bits/Counter.jsx';
import { Badge, GlowButton, Icon, Progress, Reveal } from '../components/ui.jsx';
import {
  KEYS_ARABIC, KEYS_RUMI, assetUrl, isArabicScript, scriptProps,
} from '../lib/quiz.js';

// `session` = soalan yang sudah dikocok + kedudukan terakhir (untuk sambung latihan yang disimpan).
export default function Quiz({ session, onProgress, onAnswer, onQuit, onFinish }) {
  const prepared = session.questions;
  const [current, setCurrent] = useState(session.current || 0);
  const [score, setScore] = useState(session.score || 0);
  const [chosen, setChosen] = useState(session.chosen ?? null); // indeks pilihan dijawab, null = belum
  const feedbackRef = useRef(null);

  // Autosave: simpan kedudukan setiap kali pengguna menjawab atau ke soalan seterusnya.
  useEffect(() => {
    onProgress({ current, score, chosen });
  }, [current, score, chosen]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = prepared[current];
  const total = prepared.length;
  const answered = chosen !== null;
  const correct = answered && chosen === q.answer;

  useEffect(() => {
    if (answered) feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [answered]);

  useEffect(() => { window.scrollTo(0, 0); }, [current]);

  if (!q) return null;

  function select(i) {
    if (answered) return;
    setChosen(i);
    if (i === q.answer) setScore(s => s + 1);
    onAnswer(i === q.answer);
  }

  function next() {
    if (current < total - 1) {
      setCurrent(c => c + 1);
      setChosen(null);
    } else {
      onFinish({ score, total, exam: q.exam, subject: q.subject });
    }
  }

  // Kemajuan sudah disimpan, jadi keluar tidak perlu pengesahan.
  function quit() {
    onQuit();
  }

  const script = scriptProps(q.script);
  const keys = isArabicScript(q.script) ? KEYS_ARABIC : KEYS_RUMI;
  const year = q.source ? q.source.replace(/\D+/g, '') : '';
  const progress = ((current + (answered ? 1 : 0)) / total) * 100;

  return (
    <section className="screen">
      <div className="quiz-header">
        <button className="btn btn-ghost btn-icon" onClick={quit} aria-label="Simpan dan keluar" title="Simpan dan keluar">
          <Icon name="x" />
        </button>
        <Progress value={progress} />
        <Badge variant="secondary">{current + 1}/{total}</Badge>
      </div>

      {/* Markah semasa bergolek seperti odometer (React Bits Counter) */}
      <div className="score-row" aria-label={'Markah ' + score}>
        <span className="muted">Markah</span>
        <span className={'score-pill' + (answered && correct ? ' bump' : '')}>
          <Counter value={score} places={score >= 100 ? [100, 10, 1] : score >= 10 ? [10, 1] : [1]} fontSize={18}
            padding={4} gap={0} horizontalPadding={0} fontWeight={800}
            gradientFrom="transparent" gradientTo="transparent" />
        </span>
      </div>

      <div key={current}>
      <Reveal distance={30}>
        <div className="card question-card">
          <p className="eyebrow">{q.exam} · {q.subject}{year && ' · ' + year}</p>
          <div className={'question ' + script.className} dir={script.dir}>{q.question}</div>
          {q.image && <img className="question-image" src={assetUrl(q.image)} alt="Gambar soalan" />}
        </div>
      </Reveal>

      <div className={'options ' + script.className} dir={script.dir}>
        {q.options.map((text, i) => {
          let state = '';
          if (answered && i === q.answer) state = ' correct';
          else if (answered && i === chosen) state = ' wrong';
          const button = (
            <button className={'option' + state} onClick={() => select(i)} disabled={answered}>
              <span className="option-key">
                {answered && i === q.answer ? <Icon name="check" />
                  : answered && i === chosen ? <Icon name="x" />
                  : keys[i] || i + 1}
              </span>
              <span className="option-text">{text}</span>
            </button>
          );
          // Percikan (React Bits ClickSpark) hanya bila jawapan betul ditekan.
          return (
            <Reveal key={i} index={i + 1} distance={24}>
              {i === q.answer ? (
                <div className="spark-wrap">
                  <ClickSpark sparkColor="#22c55e" sparkSize={14} sparkRadius={55} sparkCount={16} duration={600}>
                    {button}
                  </ClickSpark>
                </div>
              ) : button}
            </Reveal>
          );
        })}
      </div>

      {answered && (
        <div ref={feedbackRef} className={'feedback ' + (correct ? 'correct' : 'wrong')}>
          <span className="feedback-icon"><Icon name={correct ? 'check' : 'x'} /></span>
          <div className="feedback-body">
            <BlurText text={correct ? 'Betul! Syabas.' : 'Salah, cuba lagi nanti.'}
              className="feedback-title" delay={60} animateBy="words" direction="top" />
            <p dir="auto" className={q.script !== 'rumi' ? 'script-mixed' : ''}>
              {q.explanation && q.explanation.trim() ? q.explanation : 'Jawapan betul: ' + q.options[q.answer]}
            </p>
          </div>
        </div>
      )}

      </div>

      <div className="sticky-action">
        {answered && (
          <GlowButton className="glow-lg" onClick={next}>
            {current < total - 1 ? 'Seterusnya' : 'Lihat markah'}
          </GlowButton>
        )}
      </div>
    </section>
  );
}
