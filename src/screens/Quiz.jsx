import { useEffect, useMemo, useRef, useState } from 'react';
import ClickSpark from '../components/bits/ClickSpark.jsx';
import { Badge, Icon, Progress } from '../components/ui.jsx';
import {
  KEYS_ARABIC, KEYS_RUMI, assetUrl, isArabicScript, prepareQuestion, scriptProps, shuffle,
} from '../lib/quiz.js';

export default function Quiz({ questions, onQuit, onFinish }) {
  // Kocok soalan dan pilihan sekali sahaja bagi setiap sesi.
  const prepared = useMemo(() => shuffle(questions).map(prepareQuestion), [questions]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState(null); // indeks pilihan dijawab, null = belum
  const feedbackRef = useRef(null);

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
  }

  function next() {
    if (current < total - 1) {
      setCurrent(c => c + 1);
      setChosen(null);
    } else {
      onFinish({ score, total, exam: q.exam, subject: q.subject });
    }
  }

  function quit() {
    if (confirm('Berhenti latihan ini?')) onQuit();
  }

  const script = scriptProps(q.script);
  const keys = isArabicScript(q.script) ? KEYS_ARABIC : KEYS_RUMI;
  const year = q.source ? q.source.replace(/\D+/g, '') : '';
  const progress = ((current + (answered ? 1 : 0)) / total) * 100;

  return (
    <section className="screen" key={current}>
      <div className="quiz-header">
        <button className="btn btn-ghost btn-icon" onClick={quit} aria-label="Berhenti">
          <Icon name="x" />
        </button>
        <Progress value={progress} />
        <Badge variant="secondary">{current + 1}/{total}</Badge>
      </div>

      <div className="card question-card">
        <p className="eyebrow">{q.exam} · {q.subject}{year && ' · ' + year}</p>
        <div className={'question ' + script.className} dir={script.dir}>{q.question}</div>
        {q.image && <img className="question-image" src={assetUrl(q.image)} alt="Gambar soalan" />}
      </div>

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
          return i === q.answer ? (
            <div className="spark-wrap" key={i}>
              <ClickSpark sparkColor="#22c55e" sparkSize={12} sparkRadius={40} sparkCount={12} duration={500}>
                {button}
              </ClickSpark>
            </div>
          ) : <div key={i}>{button}</div>;
        })}
      </div>

      {answered && (
        <div ref={feedbackRef} className={'feedback ' + (correct ? 'correct' : 'wrong')}>
          <span className="feedback-icon"><Icon name={correct ? 'check' : 'x'} /></span>
          <div className="feedback-body">
            <p className="feedback-title">{correct ? 'Betul! Syabas.' : 'Salah'}</p>
            <p dir="auto" className={q.script !== 'rumi' ? 'script-mixed' : ''}>
              {q.explanation && q.explanation.trim() ? q.explanation : 'Jawapan betul: ' + q.options[q.answer]}
            </p>
          </div>
        </div>
      )}

      <div className="sticky-action">
        {answered && (
          <button className="btn btn-primary btn-lg" onClick={next}>
            {current < total - 1 ? 'Seterusnya' : 'Lihat markah'}
          </button>
        )}
      </div>
    </section>
  );
}
