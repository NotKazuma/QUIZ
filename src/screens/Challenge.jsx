// Mod Cabaran: soalan bermasa, mata ikut kelajuan, bonus berturut-turut,
// dan soalan tebusan (Mudah / Sederhana / Susah) bila jawapan salah.
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import ClickSpark from '../components/bits/ClickSpark.jsx';
import Counter from '../components/bits/Counter.jsx';
import QuestionRound from '../components/QuestionRound.jsx';
import { GlowButton, Icon, Progress } from '../components/ui.jsx';
import {
  DIFFICULTY, DIFFICULTY_ORDER, pickRedeem, pointsFor, redeemAvailability, timeFor,
} from '../lib/challenge.js';
import { prepareQuestion } from '../lib/quiz.js';

export default function Challenge({ questions, pool, onAnswer, onQuit, onFinish }) {
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState('question'); // question | feedback | redeem | redeem-feedback
  const [points, setPoints] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongIds, setWrongIds] = useState([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [last, setLast] = useState(null);           // keputusan soalan utama terakhir
  const [redeem, setRedeem] = useState(null);       // { level, question, result }
  const [redeemStats, setRedeemStats] = useState({ tried: 0, success: 0, hard: 0 });
  const [usedIds] = useState(() => new Set(questions.map(q => q.id)));

  const q = questions[current];
  const total = questions.length;
  const available = useMemo(() => redeemAvailability(pool, usedIds), [pool, usedIds, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { window.scrollTo(0, 0); }, [current, phase]);

  function answered(r) {
    const nextStreak = r.correct ? streak + 1 : 0;
    const pts = pointsFor({ ...r, streak: nextStreak });
    setStreak(nextStreak);
    setBestStreak(b => Math.max(b, nextStreak));
    if (r.correct) setCorrectCount(c => c + 1);
    else setWrongIds(w => [...w, q.id]);
    setPoints(p => p + pts.total);
    setLast({ ...r, pts, streak: nextStreak });
    onAnswer(r.correct);
    setTimeout(() => setPhase('feedback'), 900);
  }

  function startRedeem(level) {
    const picked = pickRedeem(pool, level, usedIds);
    if (!picked) return;
    usedIds.add(picked.id);
    setRedeem({ level, question: prepareQuestion(picked), result: null });
    setRedeemStats(s => ({ ...s, tried: s.tried + 1 }));
    setPhase('redeem');
  }

  function redeemAnswered(r) {
    const gain = r.correct ? DIFFICULTY[redeem.level].redeem : 0;
    if (r.correct) {
      setPoints(p => p + gain);
      setRedeemStats(s => ({ ...s, success: s.success + 1, hard: s.hard + (redeem.level === 'susah' ? 1 : 0) }));
    }
    setRedeem(x => ({ ...x, result: { ...r, gain } }));
    onAnswer(r.correct);
    setTimeout(() => setPhase('redeem-feedback'), 900);
  }

  function next() {
    setRedeem(null);
    if (current < total - 1) {
      setCurrent(c => c + 1);
      setPhase('question');
    } else {
      onFinish({
        mode: 'challenge', score: correctCount, total, points, wrongIds, bestStreak, redeem: redeemStats,
        exam: q.exam, subject: q.subject,
      });
    }
  }

  function quit() {
    if (confirm('Keluar dari cabaran? Mata cabaran ini tidak akan disimpan.')) onQuit();
  }

  const progress = ((current + (phase === 'question' ? 0 : 1)) / total) * 100;

  return (
    <section className="screen challenge">
      <div className="quiz-header">
        <button className="btn btn-ghost btn-icon" onClick={quit} aria-label="Keluar"><Icon name="x" /></button>
        <Progress value={progress} />
        <span className="badge badge-secondary">{current + 1}/{total}</span>
      </div>

      <div className="challenge-hud">
        <span className="hud-points" aria-label={points + ' mata'}>
          <Counter value={points} places={placesFor(points)} fontSize={20} padding={4} gap={0}
            horizontalPadding={0} fontWeight={800} gradientFrom="transparent" gradientTo="transparent" />
          <span className="hud-unit">mata</span>
        </span>
        {streak >= 2 && (
          <motion.span key={streak} className="hud-streak" initial={{ scale: 0.4 }} animate={{ scale: 1 }}>
            🔥 {streak} berturut
          </motion.span>
        )}
      </div>

      {phase === 'question' && (
        <QuestionRound key={'q' + current} question={q} limitSec={timeFor(q)} onAnswered={answered}
          eyebrow={`${q.exam} · ${q.subject}`} badge={<DifficultyBadge level={q.difficulty} />} />
      )}

      {phase === 'feedback' && last && (
        <Feedback result={last} question={q}>
          {last.correct ? (
            <GlowButton className="glow-lg" onClick={next}>{current < total - 1 ? 'Seterusnya' : 'Lihat keputusan'}</GlowButton>
          ) : (
            <div className="redeem-choose">
              <p className="redeem-title">🎯 Tebus markah! Pilih soalan tebusan:</p>
              <div className="redeem-options">
                {DIFFICULTY_ORDER.map(level => (
                  <button key={level} className={'redeem-card level-' + level}
                    disabled={!available[level]} onClick={() => startRedeem(level)}>
                    <span className="redeem-emoji" aria-hidden="true">{DIFFICULTY[level].emoji}</span>
                    <span className="redeem-level">{DIFFICULTY[level].label}</span>
                    <span className="redeem-points">+{DIFFICULTY[level].redeem}</span>
                    {!available[level] && <span className="redeem-none">Habis</span>}
                  </button>
                ))}
              </div>
              <button className="btn btn-ghost btn-lg" onClick={next}>Langkau</button>
            </div>
          )}
        </Feedback>
      )}

      {phase === 'redeem' && redeem && (
        <>
          <div className={'redeem-banner level-' + redeem.level}>
            🎯 Soalan tebusan · {DIFFICULTY[redeem.level].label} · +{DIFFICULTY[redeem.level].redeem} mata
          </div>
          <QuestionRound key={'r' + current} question={redeem.question} limitSec={timeFor(redeem.question)}
            onAnswered={redeemAnswered} eyebrow="Soalan tebusan"
            badge={<DifficultyBadge level={redeem.level} />} />
        </>
      )}

      {phase === 'redeem-feedback' && redeem?.result && (
        <Feedback result={{ ...redeem.result, pts: { total: redeem.result.gain, base: redeem.result.gain, bonus: 0 } }}
          question={redeem.question} redeemed>
          <GlowButton className="glow-lg" onClick={next}>{current < total - 1 ? 'Seterusnya' : 'Lihat keputusan'}</GlowButton>
        </Feedback>
      )}
    </section>
  );
}

function placesFor(n) {
  const digits = Math.max(1, String(n).length);
  return Array.from({ length: digits }, (_, i) => 10 ** (digits - i - 1));
}

export function DifficultyBadge({ level = 'sederhana' }) {
  const d = DIFFICULTY[level] || DIFFICULTY.sederhana;
  return <span className={'difficulty level-' + level}>{d.emoji} {d.label}</span>;
}

// Paparan selepas menjawab: mata diperoleh (atau salah) + penerangan.
function Feedback({ result, question, redeemed, children }) {
  const { correct, timedOut, pts } = result;
  return (
    <div className="challenge-feedback">
      <motion.div className={'points-pop ' + (correct ? 'is-correct' : 'is-wrong')}
        initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 260 }}>
        {correct ? (
          <ClickSpark sparkColor="#fcd34d" sparkSize={14} sparkRadius={60} sparkCount={14} duration={700}>
            <span className="pop-emoji" aria-hidden="true">{redeemed ? '🎯' : '🎉'}</span>
            <span className="pop-title">{redeemed ? 'Berjaya ditebus!' : 'Betul!'}</span>
            <span className="pop-points">+{pts.total}</span>
            {pts.bonus > 0 && <span className="pop-bonus">termasuk bonus berturut +{pts.bonus} 🔥</span>}
          </ClickSpark>
        ) : (
          <>
            <span className="pop-emoji" aria-hidden="true">{timedOut ? '⏰' : '😅'}</span>
            <span className="pop-title">{timedOut ? 'Masa tamat!' : redeemed ? 'Belum berjaya' : 'Salah'}</span>
            <span className="pop-answer" dir="auto">Jawapan betul: {question.options[question.answer]}</span>
          </>
        )}
      </motion.div>
      {question.explanation?.trim() && (
        <p className="challenge-explain" dir="auto">{question.explanation}</p>
      )}
      <div className="challenge-actions">{children}</div>
    </div>
  );
}
