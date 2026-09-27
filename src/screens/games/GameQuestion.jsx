// Soalan dalam permainan arked: pusingan bermasa, kemudian maklum balas ringkas sebelum sambung.
import { useState } from 'react';
import { motion } from 'motion/react';
import QuestionRound from '../../components/QuestionRound.jsx';
import Emoji, { EmojiText } from '../../components/Emoji.jsx';
import { DifficultyBadge } from '../Challenge.jsx';
import { timeFor } from '../../lib/challenge.js';


// onDone(correct) dipanggil selepas pemain tekan "Teruskan".
export default function GameQuestion({ question: q, eyebrow, onAnswer, onDone, winText = 'Betul!', loseText = 'Salah' }) {
  const [result, setResult] = useState(null);

  function answered(r) {
    onAnswer?.(r.correct, q);
    setTimeout(() => setResult(r), 600);
  }

  if (result) {
    return (
      <motion.div className={'points-pop game-pop ' + (result.correct ? 'is-correct' : 'is-wrong')}
        initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 13 }}>
        <span className="pop-emoji"><Emoji e={result.correct ? '🎉' : result.timedOut ? '⏰' : '😅'} size="3rem" /></span>
        <span className="pop-title"><EmojiText>{result.correct ? winText : result.timedOut ? 'Masa tamat!' : loseText}</EmojiText></span>
        {!result.correct && <span className="pop-answer" dir="auto">Jawapan: {q.options[q.answer]}</span>}
        <button className="btn btn-primary btn-lg" onClick={() => onDone(result.correct)} autoFocus>Teruskan</button>
      </motion.div>
    );
  }
  return (
    <>
      <QuestionRound question={q} limitSec={timeFor(q)} onAnswered={answered}
        eyebrow={eyebrow || `${q.exam || ''} · ${q.subject || ''}`} badge={<DifficultyBadge level={q.difficulty} />} />
    </>
  );
}
