// Satu pusingan soalan bermasa gaya Quizizz: bar masa, soalan, jubin jawapan berwarna.
// Dipanggil semula dengan `key` baharu untuk setiap soalan.
import { useEffect, useRef, useState } from 'react';
import { Icon } from './ui.jsx';
import { KEYS_ARABIC, KEYS_RUMI, assetUrl, isArabicScript, scriptProps } from '../lib/quiz.js';
import { TILE_COLORS } from '../lib/challenge.js';

export default function QuestionRound({ question: q, limitSec, eyebrow, badge, onAnswered }) {
  const limitMs = limitSec * 1000;
  const [chosen, setChosen] = useState(null);   // indeks dipilih; -1 = masa tamat
  const [left, setLeft] = useState(limitMs);
  const startRef = useRef(performance.now());
  const doneRef = useRef(false);

  function finish(i) {
    if (doneRef.current) return;
    doneRef.current = true;
    const timeMs = Math.min(limitMs, performance.now() - startRef.current);
    setChosen(i);
    onAnswered({ chosen: i, correct: i === q.answer, timeMs, limitMs, timedOut: i === -1 });
  }

  // Kira detik; bila masa tamat, kira sebagai salah.
  useEffect(() => {
    const id = setInterval(() => {
      if (doneRef.current) return clearInterval(id);
      const remaining = limitMs - (performance.now() - startRef.current);
      setLeft(Math.max(0, remaining));
      if (remaining <= 0) finish(-1);
    }, 100);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const answered = chosen !== null;
  const script = scriptProps(q.script);
  const keys = isArabicScript(q.script) ? KEYS_ARABIC : KEYS_RUMI;
  const pct = (left / limitMs) * 100;
  const wide = q.options.length <= 4 && q.options.every(o => o.length <= 28);

  return (
    <div className="round">
      <div className={'timer' + (pct < 25 && !answered ? ' is-low' : '')} aria-label={`Masa tinggal ${Math.ceil(left / 1000)} saat`}>
        <div className="timer-bar" style={{ width: pct + '%' }} />
        <span className="timer-text"><Icon name="clock" /> {Math.ceil(left / 1000)}s</span>
      </div>

      <div className="card question-card">
        <div className="round-eyebrow">
          <p className="eyebrow">{eyebrow}</p>
          {badge}
        </div>
        <div className={'question ' + script.className} dir={script.dir}>{q.question}</div>
        {q.image && <img className="question-image" src={assetUrl(q.image)} alt="Gambar soalan" />}
      </div>

      <div className={'tiles ' + (wide ? 'tiles-2 ' : '') + script.className} dir={script.dir}>
        {q.options.map((text, i) => {
          let state = '';
          if (answered) {
            if (i === q.answer) state = ' is-correct';
            else if (i === chosen) state = ' is-wrong';
            else state = ' is-dim';
          }
          return (
            <button key={i} className={'tile' + state} style={{ '--tile': TILE_COLORS[i % TILE_COLORS.length] }}
              onClick={() => finish(i)} disabled={answered}>
              <span className="tile-key">
                {answered && i === q.answer ? <Icon name="check" />
                  : answered && i === chosen ? <Icon name="x" /> : keys[i] || i + 1}
              </span>
              <span className="tile-text">{text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
