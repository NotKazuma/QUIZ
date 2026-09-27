// Arked permainan: pilih subjek soalan, kemudian pilih permainan (Ular & Tangga, Kad Padanan, Kad Duel, Perlumbaan).
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Emoji from '../../components/Emoji.jsx';
import { PageHead } from '../../components/ui.jsx';
import { loadQuestions, objectiveOnly } from '../../lib/quiz.js';
import CardDuel from './CardDuel.jsx';
import MemoryCards from './MemoryCards.jsx';
import SnakesLadders from './SnakesLadders.jsx';

const GAMES = [
  { id: 'ular', name: 'Ular & Tangga', emoji: ['🐍', '🎲'], desc: 'Jawab betul, baling dadu, panjat tangga — elak ular!', color: '#58cc02', tag: 'Lawan Belang / kawan' },
  { id: 'padanan', name: 'Kad Padanan', emoji: ['🃏', '🧠'], desc: 'Terbalikkan kad & padankan soalan dengan jawapan.', color: '#ce82ff', tag: 'Ingatan' },
  { id: 'duel', name: 'Kad Duel', emoji: ['⚔️', '🐯'], desc: 'Serang Belang dengan kad — jawab betul untuk menyerang!', color: '#ff4b4b', tag: 'Pertarungan' },
  { id: 'lumba', name: 'Perlumbaan', emoji: ['🏁', '👫'], desc: 'Lumba dengan kawan guna PIN — Klasik, Kalah Mati, Pasukan.', color: '#1cb0f6', tag: 'Dalam talian' },
];
const MIN_QUESTIONS = 6;

export default function GamesHub({ config, user, avatar, onAnswer, onGameEnd, onRace, onPlaying }) {
  const exams = config?.exams || [];
  const [examId, setExamId] = useState(exams[0]?.id);
  const exam = exams.find(e => e.id === examId);
  const [subjectId, setSubjectId] = useState(exam?.subjects[0]?.id);
  const subject = exam?.subjects.find(s => s.id === subjectId);
  const [questions, setQuestions] = useState(null);
  const [game, setGame] = useState(null);

  useEffect(() => {
    if (!subject) return;
    setQuestions(null);
    loadQuestions(subject.file)
      .then(qs => setQuestions(objectiveOnly(qs).map(q => ({ ...q, exam: exam.name, subject: subject.name }))))
      .catch(() => setQuestions([]));
  }, [subject]); // eslint-disable-line react-hooks/exhaustive-deps

  const ready = questions && questions.length >= MIN_QUESTIONS;
  useEffect(() => { onPlaying?.(Boolean(game)); return () => onPlaying?.(false); }, [game]); // eslint-disable-line react-hooks/exhaustive-deps
  const common = { questions: questions || [], user, avatar, onAnswer, onEnd: onGameEnd, onBack: () => setGame(null) };
  if (game === 'ular' && ready) return <SnakesLadders {...common} />;
  if (game === 'padanan' && ready) return <MemoryCards {...common} />;
  if (game === 'duel' && ready) return <CardDuel {...common} />;

  return (
    <section className="screen games-hub">
      <PageHead badge="Arked" title="🎲 Jom main!" />

      <div className="card form-card game-subject">
        <span className="field-label">Soalan daripada</span>
        <div className="field-row">
          <select className="input" value={examId} aria-label="Peperiksaan" onChange={e => {
            setExamId(e.target.value);
            setSubjectId(exams.find(x => x.id === e.target.value)?.subjects[0]?.id);
          }}>
            {exams.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
          <select className="input" value={subjectId} aria-label="Subjek" onChange={e => setSubjectId(e.target.value)}>
            {exam?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <span className="field-hint">
          {questions === null ? 'Memuatkan soalan…' : ready ? `${questions.length} soalan sedia untuk dimainkan` : 'Subjek ini belum cukup soalan — pilih subjek lain.'}
        </span>
      </div>

      <div className="game-grid">
        {GAMES.map((g, i) => (
          <motion.button key={g.id} className="game-card" style={{ '--gc': g.color }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            whileTap={{ scale: 0.97 }} disabled={g.id !== 'lumba' && !ready}
            onClick={() => (g.id === 'lumba' ? onRace() : setGame(g.id))}>
            <span className="game-card-art">{g.emoji.map(e => <Emoji key={e} e={e} size="2.4rem" />)}</span>
            <span className="game-card-body">
              <b>{g.name}</b>
              <span>{g.desc}</span>
              <span className="game-tag">{g.tag}</span>
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
