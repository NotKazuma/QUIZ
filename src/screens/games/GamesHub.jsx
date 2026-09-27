// Arked permainan: pilih subjek, kemudian pilih permainan — main solo (lawan Belang) atau dalam talian dengan PIN.
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Emoji from '../../components/Emoji.jsx';
import { GlowButton, PageHead } from '../../components/ui.jsx';
import { loadQuestions, objectiveOnly, shuffle } from '../../lib/quiz.js';
import { SEATS, createRoom, joinRoom, loadStoredRoom, roomsReady, storeRoom } from '../../lib/gameRoom.js';
import CardDuel from './CardDuel.jsx';
import MemoryCards from './MemoryCards.jsx';
import SnakesLadders from './SnakesLadders.jsx';
import OnlineRoom from './online/OnlineRoom.jsx';
import { MEMORY_PAIRS } from './online/OnlineMemory.jsx';

const GAMES = [
  { id: 'ular', name: 'Ular & Tangga', emoji: ['🐍', '🎲'], desc: 'Jawab betul, baling dadu, panjat tangga — elak ular!', color: '#58cc02', tag: 'Solo · 2–4 pemain',
    solo: 'Lawan Belang atau kawan di peranti ini' },
  { id: 'padanan', name: 'Kad Padanan', emoji: ['🃏', '🧠'], desc: 'Terbalikkan kad & padankan soalan dengan jawapan.', color: '#ce82ff', tag: 'Solo · 2–4 pemain',
    solo: 'Cabar ingatan sendiri — kurang langkah, lebih bintang' },
  { id: 'duel', name: 'Kad Duel', emoji: ['⚔️', '🐯'], desc: 'Serang lawan dengan kad — jawab betul untuk menyerang!', color: '#ff4b4b', tag: 'Solo · 2 pemain',
    solo: 'Bertarung melawan Belang' },
  { id: 'lumba', name: 'Perlumbaan', emoji: ['🏁', '👫'], desc: 'Lumba dengan kawan guna PIN — Klasik, Kalah Mati, Pasukan.', color: '#1cb0f6', tag: 'Dalam talian' },
];
const MIN_QUESTIONS = 6;

// Susunan soalan bilik dalam talian: [{ id, perm }] — sama untuk semua pemain.
function roomOrder(type, questions) {
  const pool = type === 'padanan'
    ? shuffle(questions.filter(q => q.question.length <= 110 && q.options[q.answer]?.length <= 45)).slice(0, MEMORY_PAIRS)
    : shuffle(questions).slice(0, 80);
  const picked = pool.length >= (type === 'padanan' ? MEMORY_PAIRS : 6) ? pool : shuffle(questions).slice(0, MEMORY_PAIRS);
  return picked.map(q => ({ id: q.id, perm: shuffle(q.options.map((_, i) => i)) }));
}

export default function GamesHub({ config, user, avatar, onAnswer, onGameEnd, onRace, onPlaying }) {
  const exams = config?.exams || [];
  const [examId, setExamId] = useState(exams[0]?.id);
  const exam = exams.find(e => e.id === examId);
  const [subjectId, setSubjectId] = useState(exam?.subjects[0]?.id);
  const subject = exam?.subjects.find(s => s.id === subjectId);
  const [questions, setQuestions] = useState(null);
  const [game, setGame] = useState(null);       // permainan solo yang sedang dimainkan
  const [choice, setChoice] = useState(null);   // permainan dipilih — tunggu pilihan solo/dalam talian
  const [room, setRoomState] = useState(() => loadStoredRoom(user.uid)); // PIN bilik dalam talian
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const name = user.displayName || user.name || 'Pemain';
  const setRoom = p => { storeRoom(user.uid, p); setRoomState(p); };

  useEffect(() => {
    if (!subject) return;
    setQuestions(null);
    loadQuestions(subject.file)
      .then(qs => setQuestions(objectiveOnly(qs).map(q => ({ ...q, exam: exam.name, subject: subject.name }))))
      .catch(() => setQuestions([]));
  }, [subject]); // eslint-disable-line react-hooks/exhaustive-deps

  const ready = questions && questions.length >= MIN_QUESTIONS;
  useEffect(() => { onPlaying?.(Boolean(game || room)); return () => onPlaying?.(false); }, [game, room]); // eslint-disable-line react-hooks/exhaustive-deps

  if (room) {
    return <OnlineRoom pin={room} user={user} config={config} onAnswer={onAnswer} onEnd={onGameEnd} onExit={() => setRoom(null)} />;
  }
  const common = { questions: questions || [], user, avatar, onAnswer, onEnd: onGameEnd, onBack: () => setGame(null) };
  if (game === 'ular' && ready) return <SnakesLadders {...common} />;
  if (game === 'padanan' && ready) return <MemoryCards {...common} />;
  if (game === 'duel' && ready) return <CardDuel {...common} />;

  async function host(type) {
    setBusy(true);
    setError('');
    try {
      const newPin = await createRoom(user, {
        type, examId: exam.id, subjectId: subject.id, examName: exam.name, subjectName: subject.name, order: roomOrder(type, questions),
      });
      await joinRoom(newPin, user, name, avatar);
      setChoice(null);
      setRoom(newPin);
    } catch (e) {
      setError('Gagal mencipta bilik: ' + (e.code || e.message));
    } finally {
      setBusy(false);
    }
  }

  async function join(e) {
    e.preventDefault();
    const clean = pin.replace(/\D/g, '');
    if (clean.length !== 6) return setError('PIN mesti 6 digit.');
    setBusy(true);
    setError('');
    try {
      await joinRoom(clean, user, name, avatar);
      setRoom(clean);
    } catch (err) {
      setError(err.code === 'PERMISSION_DENIED' ? 'Tidak dapat menyertai bilik ini.' : err.message);
    } finally {
      setBusy(false);
    }
  }

  const chosen = GAMES.find(g => g.id === choice);
  const [minSeats, maxSeats] = SEATS[choice] || [2, 4];

  return (
    <section className="screen games-hub">
      <PageHead badge="Arked" title="🎲 Jom main!" />

      {roomsReady && (
        <form className="card form-card join-room" onSubmit={join} noValidate>
          <span className="field-label"><Emoji e="👫" /> Kawan ajak main? Sertai dengan PIN</span>
          <div className="join-row">
            <input className="input input-code" value={pin} inputMode="numeric" maxLength={7} placeholder="123 456"
              aria-label="PIN bilik" onChange={e => { setPin(e.target.value); setError(''); }} />
            <GlowButton type="submit" disabled={busy}>Sertai</GlowButton>
          </div>
          {error && !choice && <p className="form-error" role="alert">{error}</p>}
        </form>
      )}

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
            onClick={() => (g.id === 'lumba' ? onRace() : (setError(''), setChoice(g.id)))}>
            <span className="game-card-art">{g.emoji.map(e => <Emoji key={e} e={e} size="2.4rem" />)}</span>
            <span className="game-card-body">
              <b>{g.name}</b>
              <span>{g.desc}</span>
              <span className="game-tag">{g.tag}</span>
            </span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {chosen && (
          <>
            <motion.div className="sheet-backdrop" onClick={() => setChoice(null)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div className="sheet" role="dialog" aria-label={chosen.name}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26 }}>
              <span className="sheet-grip" />
              <span className="sheet-title">{chosen.emoji.map(e => <Emoji key={e} e={e} size="1.6rem" />)} {chosen.name}</span>
              <button className="play-option" onClick={() => { setChoice(null); setGame(chosen.id); }}>
                <Emoji e="🐯" size="2rem" />
                <span><b>Main solo</b><span>{chosen.solo}</span></span>
              </button>
              {roomsReady && (
                <button className="play-option is-online" disabled={busy} onClick={() => host(chosen.id)}>
                  <Emoji e="🌐" size="2rem" />
                  <span><b>{busy ? 'Mencipta bilik…' : 'Main dalam talian'}</b>
                    <span>Cipta bilik & kongsi PIN · {minSeats === maxSeats ? `${minSeats} pemain` : `${minSeats}–${maxSeats} pemain`}, setiap orang guna telefon sendiri</span>
                  </span>
                </button>
              )}
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="btn btn-ghost" onClick={() => setChoice(null)}>Tutup</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
