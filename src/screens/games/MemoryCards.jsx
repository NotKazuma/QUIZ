// Kad Padanan: terbalikkan dua kad — padankan kad soalan dengan kad jawapannya. Kurang langkah, lebih bintang.
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import Emoji from '../../components/Emoji.jsx';
import { BackButton, GlowButton } from '../../components/ui.jsx';
import { scriptProps, shuffle } from '../../lib/quiz.js';
import PowerCards, { MAX_POWER_CARDS, randomPower, randomPowers } from './PowerCards.jsx';

export const PEEK_MS = { intip: 1500, petunjuk: 1200 };
export const EARN_STREAK = 2; // dapat kad kuasa setiap 2 padanan berturut

const PAIRS = 6;

// Pilih soalan yang pendek supaya muat di atas kad.
function pickPairs(questions) {
  const short = questions.filter(q => q.question.length <= 110 && q.options[q.answer]?.length <= 45);
  const pool = shuffle(short.length >= PAIRS ? short : questions).slice(0, PAIRS);
  const cards = pool.flatMap((q, i) => [
    { id: i + 'q', pair: i, kind: 'q', text: q.question, script: q.script, q },
    { id: i + 'a', pair: i, kind: 'a', text: q.options[q.answer], script: q.script, q },
  ]);
  return shuffle(cards);
}

// Corak belakang kad (dipilih rawak setiap pusingan).
export const CARD_BACKS = ['🐯', '⭐', '🌙', '🍭'];

const starsFor = moves => (moves <= PAIRS + 3 ? 3 : moves <= PAIRS + 7 ? 2 : 1);

export default function MemoryCards({ questions, onAnswer, onEnd, onBack }) {
  const [round, setRound] = useState(0);
  const cards = useMemo(() => pickPairs(questions), [questions, round]);
  const back = useMemo(() => Math.floor(Math.random() * CARD_BACKS.length), [round]);
  const [open, setOpen] = useState([]);     // indeks kad terbuka (maks 2)
  const [matched, setMatched] = useState([]); // pasangan yang sudah padan
  const [moves, setMoves] = useState(0);
  const [missed, setMissed] = useState({}); // pasangan yang pernah tersilap (tiada syiling)
  const [started, setStarted] = useState(null);
  const [powers, setPowers] = useState(() => randomPowers('padanan', 2));
  const [peek, setPeek] = useState(null);   // 'all' | [i, j] — kad dibuka sekejap oleh kad kuasa
  const [streak, setStreak] = useState(0);
  const [now, setNow] = useState(Date.now());
  const done = matched.length === PAIRS;

  useEffect(() => {
    if (!started || done) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [started, done]);

  useEffect(() => {
    if (done) onEnd?.({ game: 'padanan', won: true, stars: starsFor(moves) });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  // Kad kuasa: Intip (semua kad) atau Petunjuk (satu pasangan) dibuka sekejap.
  function playPower(index, id) {
    if (peek || open.length === 2 || done) return;
    setPowers(p => p.filter((_, j) => j !== index));
    if (id === 'intip') setPeek('all');
    else {
      const pair = shuffle(cards.map(c => c.pair).filter(p => !matched.includes(p)))[0];
      setPeek(cards.map((c, k) => (c.pair === pair ? k : -1)).filter(k => k >= 0));
    }
    setTimeout(() => setPeek(null), PEEK_MS[id]);
  }

  function flip(i) {
    if (peek || open.length === 2 || open.includes(i) || matched.includes(cards[i].pair)) return;
    if (!started) setStarted(Date.now());
    const next = [...open, i];
    setOpen(next);
    if (next.length < 2) return;
    setMoves(m => m + 1);
    const [a, b] = next.map(k => cards[k]);
    if (a.pair === b.pair) {
      setTimeout(() => {
        setMatched(m => [...m, a.pair]);
        setOpen([]);
        onAnswer?.(!missed[a.pair], a.q); // padanan pertama kali = jawapan betul
        const n = streak + 1;
        setStreak(n);
        if (n % EARN_STREAK === 0 && powers.length < MAX_POWER_CARDS) setPowers(p => [...p, randomPower('padanan')]);
      }, 450);
    } else {
      setStreak(0);
      setMissed(m => ({ ...m, [a.pair]: true, [b.pair]: true }));
      setTimeout(() => setOpen([]), 1100);
    }
  }

  function again() {
    setRound(r => r + 1);
    setOpen([]); setMatched([]); setMoves(0); setMissed({}); setStarted(null); setPeek(null); setStreak(0);
    setPowers(randomPowers('padanan', 2));
  }

  const secs = started ? Math.round(((done ? now : Date.now()) - started) / 1000) : 0;
  const stars = starsFor(moves);

  return (
    <section className="screen memory">
      <div className="game-topbar">
        <BackButton onClick={onBack} />
        <div className="memory-stats">
          <span><Emoji e="👆" /> {moves} langkah</span>
          <span><Emoji e="⏱️" /> {secs}s</span>
          <span><Emoji e="✅" /> {matched.length}/{PAIRS}</span>
        </div>
      </div>
      <p className="muted small memory-help">Padankan setiap kad <b>soalan</b> <Emoji e="❓" /> dengan kad <b>jawapan</b> <Emoji e="💡" /> yang betul.</p>

      <div className="memory-grid">
        {cards.map((c, i) => {
          const faceUp = open.includes(i) || matched.includes(c.pair) || peek === 'all' || (Array.isArray(peek) && peek.includes(i));
          const script = scriptProps(c.script);
          return (
            <button key={c.id + round} className={'mem-card' + (faceUp ? ' is-up' : '') + (matched.includes(c.pair) ? ' is-matched' : '')}
              onClick={() => flip(i)} aria-label={faceUp ? c.text : 'Kad tertutup'}
              style={{ '--mc': c.kind === 'q' ? '#ce82ff' : '#1cb0f6' }}>
              <span className="mem-inner">
                <span className={'mem-back back-' + back}><Emoji e={CARD_BACKS[back]} size="2rem" /></span>
                <span className={'mem-front is-' + c.kind}>
                  <span className="mem-kind"><Emoji e={c.kind === 'q' ? '❓' : '💡'} /></span>
                  <span className={'mem-text ' + script.className} dir={script.dir}>{c.text}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {!done && <PowerCards game="padanan" cards={powers} onUse={playPower} disabled={Boolean(peek)} title={`Kad kuasa · dapat 1 lagi setiap ${EARN_STREAK} padanan berturut`} />}

      {done && (
        <motion.div className="card game-result" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="stars">
            {[1, 2, 3].map(n => (
              <motion.span key={n} initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2 * n, type: 'spring' }}
                className={n <= stars ? '' : 'is-dim'}><Emoji e="⭐" size="2.6rem" /></motion.span>
            ))}
          </div>
          <b>Semua padan! {moves} langkah, {secs} saat</b>
          <GlowButton className="glow-lg" onClick={again}><Emoji e="🔁" /> Main lagi</GlowButton>
        </motion.div>
      )}
    </section>
  );
}
