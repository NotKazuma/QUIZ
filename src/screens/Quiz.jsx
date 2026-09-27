import { useEffect, useState } from 'react';
import BlurText from '../components/bits/BlurText.jsx';
import Counter from '../components/bits/Counter.jsx';
import Mascot, { SpeechBubble } from '../components/Mascot.jsx';
import { Icon, Progress, Reveal } from '../components/ui.jsx';
import {
  KEYS_ARABIC, KEYS_RUMI, assetUrl, isArabicScript, scriptProps,
} from '../lib/quiz.js';
import Emoji from '../components/Emoji.jsx';

const PRAISE = ['Hebat!', 'Syabas!', 'Tepat sekali!', 'Mantap!', 'Bagus!'];

// Latihan: pilih jawapan → SEMAK → panel maklum balas di bawah → TERUSKAN.
// `session` = soalan yang sudah dikocok + kedudukan terakhir (untuk sambung latihan yang disimpan).
export default function Quiz({ session, onProgress, onAnswer, onQuit, onFinish }) {
  const prepared = session.questions;
  const [current, setCurrent] = useState(session.current || 0);
  const [score, setScore] = useState(session.score || 0);
  const [chosen, setChosen] = useState(session.chosen ?? null); // indeks yang sudah disemak, null = belum
  const [picked, setPicked] = useState(null);                   // pilihan sebelum tekan SEMAK
  const [wrongIds, setWrongIds] = useState(session.wrongIds || []); // untuk laporan kerja rumah

  // Autosave: simpan kedudukan setiap kali pengguna menyemak jawapan atau ke soalan seterusnya.
  useEffect(() => {
    onProgress({ current, score, chosen, wrongIds });
  }, [current, score, chosen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { window.scrollTo(0, 0); }, [current]);

  const q = prepared[current];
  if (!q) return null;
  const total = prepared.length;
  const answered = chosen !== null;
  const correct = answered && chosen === q.answer;

  function check() {
    if (answered || picked === null) return;
    setChosen(picked);
    if (picked === q.answer) setScore(s => s + 1);
    else setWrongIds(w => [...w, q.id]);
    onAnswer(picked === q.answer);
  }

  function next() {
    if (current < total - 1) {
      setCurrent(c => c + 1);
      setChosen(null);
      setPicked(null);
    } else {
      onFinish({ score, total, wrongIds, exam: q.exam, subject: q.subject });
    }
  }

  const script = scriptProps(q.script);
  const keys = isArabicScript(q.script) ? KEYS_ARABIC : KEYS_RUMI;
  const year = q.source ? q.source.replace(/\D+/g, '') : '';
  const progress = ((current + (answered ? 1 : 0)) / total) * 100;
  const explanation = q.explanation?.trim();

  return (
    <section className="screen quiz">
      <div className="quiz-header">
        {/* Kemajuan sudah disimpan, jadi keluar tidak perlu pengesahan. */}
        <button className="btn btn-ghost btn-icon" onClick={onQuit} aria-label="Simpan dan keluar" title="Simpan dan keluar">
          <Icon name="x" />
        </button>
        <Progress value={progress} />
        {/* Markah bergolek seperti odometer (React Bits Counter) */}
        <span className={'score-pill' + (answered && correct ? ' bump' : '')} aria-label={'Markah ' + score}>
          <Emoji e="⭐" /> <Counter value={score} places={score >= 100 ? [100, 10, 1] : score >= 10 ? [10, 1] : [1]} fontSize={17}
            padding={4} gap={0} horizontalPadding={0} fontWeight={900}
            gradientFrom="transparent" gradientTo="transparent" />
        </span>
      </div>

      <div key={current}>
        <Reveal distance={24}>
          <div className="quiz-prompt">
            <Mascot mood={answered ? (correct ? 'cheer' : 'sad') : 'think'} size={76} />
            <SpeechBubble>
              <p className="quiz-kicker">Soalan {current + 1}/{total} · {q.subject}{year && ' · ' + year}</p>
              <div className={'question ' + script.className} dir={script.dir}>{q.question}</div>
            </SpeechBubble>
          </div>
          {q.image && <img className="question-image" src={assetUrl(q.image)} alt="Gambar soalan" />}
        </Reveal>

        <div className={'options ' + script.className} dir={script.dir} role="radiogroup" aria-label="Pilihan jawapan">
          {q.options.map((text, i) => {
            let state = '';
            if (answered && i === q.answer) state = ' correct';
            else if (answered && i === chosen) state = ' wrong';
            else if (!answered && i === picked) state = ' is-picked';
            return (
              <Reveal key={i} index={i + 1} distance={20}>
                <button className={'option' + state} onClick={() => !answered && setPicked(i)} disabled={answered}
                  role="radio" aria-checked={i === picked}>
                  <span className="option-key">
                    {answered && i === q.answer ? <Icon name="check" />
                      : answered && i === chosen ? <Icon name="x" />
                        : keys[i] || i + 1}
                  </span>
                  <span className="option-text">{text}</span>
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>

      <div className="quiz-spacer" />

      {/* Bar bawah: SEMAK, kemudian panel maklum balas hijau/merah */}
      <div className={'check-bar' + (answered ? (correct ? ' is-correct' : ' is-wrong') : '')}>
        <div className="check-bar-inner">
          {answered && (
            <div className="check-verdict">
              <Mascot mood={correct ? 'cheer' : 'sad'} size={64} />
              <div>
                <BlurText key={current} text={correct ? PRAISE[current % PRAISE.length] : 'Jawapan betul:'}
                  className="check-title" delay={50} animateBy="words" direction="top" />
                <p className={'check-text' + (q.script !== 'rumi' ? ' script-mixed' : '')} dir="auto">
                  {correct ? explanation || 'Teruskan usaha!' : q.options[q.answer]}
                </p>
                {!correct && explanation && <p className="check-text script-mixed" dir="auto">{explanation}</p>}
              </div>
            </div>
          )}
          {answered ? (
            <button className="btn btn-primary btn-lg" onClick={next}>
              {current < total - 1 ? 'Teruskan' : 'Lihat markah'}
            </button>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={check} disabled={picked === null}>Semak</button>
          )}
        </div>
      </div>
    </section>
  );
}
