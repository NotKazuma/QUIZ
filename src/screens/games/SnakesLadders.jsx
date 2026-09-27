// Ular & Tangga: jawab soalan dengan betul untuk membaling dadu. Tangga naik, ular turun.
// Lawan Belang (komputer) atau 2–4 pemain bergilir pada peranti yang sama.
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import AnimalAvatar from '../../components/AnimalAvatar.jsx';
import Dice from '../../components/Dice.jsx';
import Emoji, { EmojiText } from '../../components/Emoji.jsx';
import Mascot from '../../components/Mascot.jsx';
import { BackButton, GlowButton } from '../../components/ui.jsx';
import { prepareQuestion, shuffle } from '../../lib/quiz.js';
import GameQuestion from './GameQuestion.jsx';

const SIZE = 6;
const LAST = SIZE * SIZE;
const LADDERS = { 3: 14, 8: 20, 17: 27, 22: 33 };
const SNAKES = { 16: 6, 25: 13, 31: 19, 35: 24 };
const SNAKE_COLORS = ['#58cc02', '#ce82ff', '#ff9600', '#1cb0f6'];
const PAWNS = [
  { color: '#1cb0f6' }, { color: '#ff4b4b', animal: 'kucing' }, { color: '#58cc02', animal: 'arnab' }, { color: '#ffc800', animal: 'anjing' },
];
const BELANG_ACCURACY = 0.7;

// Kedudukan tengah petak n (1..36) dalam unit petak; baris bawah = 1..6 (kiri→kanan), berzigzag.
function cellXY(n) {
  const i = Math.max(1, Math.min(LAST, n)) - 1;
  const row = Math.floor(i / SIZE);
  const col = row % 2 === 0 ? i % SIZE : SIZE - 1 - (i % SIZE);
  return { x: col + 0.5, y: SIZE - 1 - row + 0.5 };
}

export default function SnakesLadders({ questions, user, avatar, onAnswer, onEnd, onBack }) {
  const [setup, setSetup] = useState(true);
  const [mode, setMode] = useState('belang'); // 'belang' | 'kawan'
  const [names, setNames] = useState([user.displayName || user.name || 'Saya', 'Kawan 1', 'Kawan 2', 'Kawan 3']);
  const [count, setCount] = useState(2);

  const [players, setPlayers] = useState([]);   // { name, pos, bot, avatar, color }
  const [turn, setTurn] = useState(0);
  const [phase, setPhase] = useState('ready');  // ready | question | roll | moving | bot | over
  const [dice, setDice] = useState({ value: 1, roll: 0 });
  const [note, setNote] = useState('');
  const [winner, setWinner] = useState(null);
  const deck = useRef([]);
  const [q, setQ] = useState(null);

  function drawQuestion() {
    if (!deck.current.length) deck.current = shuffle(questions);
    return prepareQuestion(deck.current.pop());
  }

  function start() {
    const list = mode === 'belang'
      ? [{ name: names[0], avatar, color: PAWNS[0].color }, { name: 'Belang', bot: true, color: '#ff9600' }]
      : names.slice(0, count).map((name, i) => ({
        name: name.trim() || `Pemain ${i + 1}`, color: PAWNS[i].color,
        avatar: i === 0 ? avatar : { animal: PAWNS[i].animal, color: 'oren', hat: null, background: 'latar-langit' },
      }));
    setPlayers(list.map(p => ({ ...p, pos: 0 })));
    setTurn(0);
    setPhase('ready');
    setNote('');
    setWinner(null);
    setSetup(false);
  }

  const current = players[turn];

  // Giliran Belang: "fikir" sebentar, kemudian betul/salah secara rawak.
  // Pemasa disimpan dalam ref — bukan dibatalkan bila fasa bertukar ke 'bot'.
  const botTimer = useRef(null);
  useEffect(() => () => clearTimeout(botTimer.current), []);
  useEffect(() => {
    if (setup || phase !== 'ready' || !current?.bot) return;
    setPhase('bot');
    botTimer.current = setTimeout(() => {
      if (Math.random() < BELANG_ACCURACY) {
        setNote('Belang jawab betul!');
        rollDice();
      } else {
        setNote('Belang tersilap jawab — giliran terlepas!');
        setTimeout(nextTurn, 1400);
      }
    }, 1300);
  }, [setup, phase, turn]); // eslint-disable-line react-hooks/exhaustive-deps

  function ask() {
    setNote('');
    setQ(drawQuestion());
    setPhase('question');
  }

  function answered(correct) {
    setQ(null);
    if (correct) rollDice();
    else {
      setNote(`${current.name} — giliran terlepas.`);
      setPhase('ready');
      setTimeout(nextTurn, 900);
    }
  }

  function rollDice() {
    setPhase('roll');
    const value = 1 + Math.floor(Math.random() * 6);
    setDice(d => ({ value, roll: d.roll + 1 }));
    setTimeout(() => move(value), 1150);
  }

  // Gerak petak demi petak, kemudian semak tangga/ular.
  function move(steps) {
    setPhase('moving');
    const who = turn;
    let pos = players[who].pos;
    const target = Math.min(LAST, pos + steps);
    const step = () => {
      pos += 1;
      setPlayers(ps => ps.map((p, i) => (i === who ? { ...p, pos } : p)));
      if (pos < target) return setTimeout(step, 260);
      setTimeout(() => land(who, pos), 350);
    };
    setTimeout(step, 150);
  }

  function land(who, pos) {
    let end = pos;
    if (LADDERS[pos]) { end = LADDERS[pos]; setNote(`🪜 Tangga! Naik ke petak ${end}.`); }
    else if (SNAKES[pos]) { end = SNAKES[pos]; setNote(`🐍 Alamak, ular! Turun ke petak ${end}.`); }
    if (end !== pos) setPlayers(ps => ps.map((p, i) => (i === who ? { ...p, pos: end } : p)));
    setTimeout(() => {
      if (end >= LAST) {
        setWinner(who);
        setPhase('over');
        onEnd?.({ game: 'ular', won: who === 0 });
        return;
      }
      nextTurn();
    }, end !== pos ? 1100 : 300);
  }

  function nextTurn() {
    setTurn(t => (t + 1) % players.length);
    setPhase('ready');
  }

  const board = useMemo(() => Array.from({ length: LAST }, (_, k) => {
    // Susun petak dari atas ke bawah untuk grid CSS.
    const row = SIZE - 1 - Math.floor(k / SIZE);
    const colInRow = k % SIZE;
    const n = row * SIZE + (row % 2 === 0 ? colInRow + 1 : SIZE - colInRow);
    return n;
  }), []);

  // ---------- Tetapan ----------
  if (setup) {
    return (
      <section className="screen game-setup">
        <BackButton onClick={onBack} />
        <div className="game-hero">
          <Emoji e="🐍" size="3rem" /><Emoji e="🎲" size="3rem" /><Emoji e="🪜" size="3rem" />
          <h2>Ular & Tangga</h2>
          <p className="muted">Jawab soalan dengan betul untuk membaling dadu. Tangga bawa anda naik, ular bawa anda turun. Pertama sampai petak {LAST} menang!</p>
        </div>
        <div className="mode-picker mode-2">
          <button className={'mode-card' + (mode === 'belang' ? ' is-active' : '')} onClick={() => setMode('belang')}>
            <Emoji e="🐯" size="2rem" /><b>Lawan Belang</b><span>Main seorang melawan Belang</span>
          </button>
          <button className={'mode-card' + (mode === 'kawan' ? ' is-active' : '')} onClick={() => setMode('kawan')}>
            <Emoji e="👫" size="2rem" /><b>Dengan kawan</b><span>2–4 pemain bergilir di peranti ini</span>
          </button>
        </div>
        {mode === 'kawan' && (
          <div className="card form-card">
            <div className="chips">
              {[2, 3, 4].map(n => (
                <button key={n} type="button" className={'chip' + (count === n ? ' is-active' : '')} onClick={() => setCount(n)}>{n} pemain</button>
              ))}
            </div>
            {names.slice(0, count).map((nm, i) => (
              <label key={i} className="player-name-row">
                <span className="pawn-dot" style={{ background: PAWNS[i].color }} />
                <input className="input" value={nm} maxLength={16} onChange={e => setNames(ns => ns.map((x, k) => (k === i ? e.target.value : x)))} />
              </label>
            ))}
          </div>
        )}
        <GlowButton className="glow-lg" onClick={start}><Emoji e="🎲" /> Mula main</GlowButton>
      </section>
    );
  }

  const fx = (n, dx = 0, dy = 0) => { const { x, y } = cellXY(n); return { x: x + dx, y: y + dy }; };

  return (
    <section className="screen snakes">
      <div className="game-topbar">
        <BackButton onClick={onBack} />
        <div className="turn-pills">
          {players.map((p, i) => (
            <span key={i} className={'turn-pill' + (i === turn && phase !== 'over' ? ' is-turn' : '')} style={{ '--pc': p.color }}>
              {p.bot ? <Mascot size={26} /> : <AnimalAvatar avatar={p.avatar} size={26} />}
              <b>{p.pos || 0}</b>
            </span>
          ))}
        </div>
      </div>

      <div className="snake-board">
        <div className="snake-grid">
          {board.map(n => (
            <div key={n} className={'snake-cell' + (n % 2 ? ' is-odd' : '') + (n === LAST ? ' is-goal' : '') + (LADDERS[n] ? ' is-ladder' : '') + (SNAKES[n] ? ' is-snake' : '')}>
              <span>{n === LAST ? '🏁' : n}</span>
            </div>
          ))}
        </div>
        <svg className="snake-art" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
          {Object.entries(LADDERS).map(([a, b]) => {
            const p = fx(+a), r = fx(+b);
            const ang = Math.atan2(r.y - p.y, r.x - p.x);
            const ox = Math.sin(ang) * 0.14, oy = -Math.cos(ang) * 0.14;
            const len = Math.hypot(r.x - p.x, r.y - p.y);
            const rungs = Math.max(2, Math.round(len * 2.4));
            return (
              <g key={'l' + a} className="ladder">
                <line x1={p.x + ox} y1={p.y + oy} x2={r.x + ox} y2={r.y + oy} />
                <line x1={p.x - ox} y1={p.y - oy} x2={r.x - ox} y2={r.y - oy} />
                {Array.from({ length: rungs }, (_, k) => {
                  const t = (k + 0.5) / rungs;
                  const cx = p.x + (r.x - p.x) * t, cy = p.y + (r.y - p.y) * t;
                  return <line key={k} className="rung" x1={cx + ox} y1={cy + oy} x2={cx - ox} y2={cy - oy} />;
                })}
              </g>
            );
          })}
          {Object.entries(SNAKES).map(([a, b], k) => {
            const h = fx(+a), t = fx(+b);
            const mx = (h.x + t.x) / 2, my = (h.y + t.y) / 2;
            const nx = -(t.y - h.y) * 0.35, ny = (t.x - h.x) * 0.35;
            const d = `M${h.x} ${h.y} Q${mx + nx} ${my + ny} ${mx} ${my} T${t.x} ${t.y}`;
            const c = SNAKE_COLORS[k % SNAKE_COLORS.length];
            return (
              <g key={'s' + a} className="snake">
                <path d={d} stroke="rgb(0 0 0 / 0.25)" strokeWidth="0.26" fill="none" strokeLinecap="round" transform="translate(0.03 0.04)" />
                <path d={d} stroke={c} strokeWidth="0.22" fill="none" strokeLinecap="round" />
                <path d={d} stroke="rgb(255 255 255 / 0.55)" strokeWidth="0.05" strokeDasharray="0.08 0.12" fill="none" strokeLinecap="round" />
                <circle cx={h.x} cy={h.y} r="0.2" fill={c} />
                <circle cx={h.x - 0.07} cy={h.y - 0.05} r="0.05" fill="#fff" /><circle cx={h.x + 0.07} cy={h.y - 0.05} r="0.05" fill="#fff" />
                <circle cx={h.x - 0.07} cy={h.y - 0.05} r="0.025" fill="#222" /><circle cx={h.x + 0.07} cy={h.y - 0.05} r="0.025" fill="#222" />
                <path d={`M${h.x} ${h.y + 0.14} l0 0.12 m0 0 l-0.05 0.06 m0.05 -0.06 l0.05 0.06`} stroke="#ff4b4b" strokeWidth="0.025" fill="none" />
              </g>
            );
          })}
        </svg>
        {players.map((p, i) => {
          const { x, y } = cellXY(p.pos || 1);
          const off = [[-0.18, -0.16], [0.18, -0.16], [-0.18, 0.16], [0.18, 0.16]][i];
          return (
            <motion.div key={i} className={'pawn' + (i === turn ? ' is-turn' : '') + (p.pos ? '' : ' is-start')} style={{ '--pc': p.color }}
              animate={{ left: `${((x + off[0]) / SIZE) * 100}%`, top: `${((y + off[1]) / SIZE) * 100}%` }}
              transition={{ type: 'spring', damping: 18, stiffness: 260 }}>
              {p.bot ? <Mascot size={30} /> : <AnimalAvatar avatar={p.avatar} size={30} />}
            </motion.div>
          );
        })}
      </div>

      <div className="snake-panel">
        <Dice value={dice.value} roll={dice.roll} size={64} />
        <div className="snake-status">
          {phase === 'over' ? (
            <b><EmojiText>{players[winner].bot ? 'Belang menang! Cuba lagi 💪' : `🏆 ${players[winner].name} menang!`}</EmojiText></b>
          ) : (
            <>
              <b style={{ color: current?.color }}>Giliran {current?.bot ? 'Belang' : current?.name}</b>
              <span className="muted small"><EmojiText>{note || (current?.bot ? 'Belang sedang berfikir…' : 'Jawab soalan untuk baling dadu')}</EmojiText></span>
            </>
          )}
        </div>
      </div>

      {phase === 'ready' && !current?.bot && (
        <GlowButton className="glow-lg" onClick={ask}><Emoji e="❓" /> Jawab soalan & baling dadu</GlowButton>
      )}
      {phase === 'over' && (
        <div className="game-over-actions">
          <GlowButton className="glow-lg" onClick={start}><Emoji e="🔁" /> Main lagi</GlowButton>
          <button className="btn btn-ghost btn-lg" onClick={() => setSetup(true)}>Tukar tetapan</button>
        </div>
      )}

      <AnimatePresence>
        {phase === 'question' && q && (
          <motion.div className="game-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26 }}>
            <GameQuestion question={q} eyebrow={`Giliran ${current.name}`}
              onAnswer={(c, qq) => { if (turn === 0) onAnswer?.(c, qq); }}
              onDone={answered} winText="Betul! Baling dadu 🎲" loseText="Salah — giliran terlepas" />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
