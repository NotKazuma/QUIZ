// Ular & Tangga: jawab soalan dengan betul untuk membaling dadu. Tangga naik, ular turun.
// Lawan Belang (komputer) atau 2–4 pemain bergilir pada peranti yang sama.
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import AnimalAvatar from '../../components/AnimalAvatar.jsx';
import Dice from '../../components/Dice.jsx';
import Emoji, { EmojiText } from '../../components/Emoji.jsx';
import Mascot from '../../components/Mascot.jsx';
import { BackButton, GlowButton } from '../../components/ui.jsx';
import { prepareQuestion, shuffle } from '../../lib/quiz.js';
import GameQuestion from './GameQuestion.jsx';
import SnakeBoard, { LAST, SPECIALS, THEMES, generateLayout } from './SnakeBoard.jsx';
import PowerCards, { ActiveEffects, MAX_POWER_CARDS, POWER_CARDS, randomPower, randomPowers } from './PowerCards.jsx';

const PAWNS = [
  { color: '#1cb0f6' }, { color: '#ff4b4b', animal: 'kucing' }, { color: '#58cc02', animal: 'arnab' }, { color: '#ffc800', animal: 'anjing' },
];
const BELANG_ACCURACY = 0.7;
const BELANG_CARD_CHANCE = 0.4; // peluang Belang guna kad kuasa pada gilirannya

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
  const [layout, setLayout] = useState(null); // susun atur rawak setiap permainan
  const deck = useRef([]);
  const turnFx = useRef(null); // kesan kad kuasa giliran semasa: { dadu2, penangkis, roket }
  const [effects, setEffects] = useState({});
  const playersRef = useRef(players);
  const turnRef = useRef(turn);
  playersRef.current = players;
  turnRef.current = turn;
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
    setLayout(generateLayout());
    setPlayers(list.map(p => ({ ...p, pos: 0, frozen: false, cards: randomPowers('ular', 2) })));
    turnFx.current = null;
    setEffects({});
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
    const cards = current.cards || [];
    if (cards.length && Math.random() < BELANG_CARD_CHANCE) {
      const i = Math.floor(Math.random() * cards.length);
      playCard(turn, i, cards[i]);
    }
    botTimer.current = setTimeout(() => {
      if (Math.random() < BELANG_ACCURACY) {
        setNote('Belang jawab betul!');
        rollDice(turnFx.current?.dadu2);
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

  // Guna kad kuasa: kesan untuk giliran ini, atau bekukan lawan paling depan.
  function playCard(who, index, id) {
    const ps = playersRef.current;
    setPlayers(list => list.map((p, k) => (k === who ? { ...p, cards: p.cards.filter((_, j) => j !== index) } : p)));
    const def = POWER_CARDS.ular[id];
    if (id === 'beku') {
      const target = ps.map((p, k) => ({ p, k })).filter(x => x.k !== who && !x.p.frozen).sort((a, b) => b.p.pos - a.p.pos)[0];
      if (!target) return setNote('Tiada lawan untuk dibekukan.');
      setPlayers(list => list.map((p, k) => (k === target.k ? { ...p, frozen: true } : p)));
      setNote(`🧊 ${ps[who].name} membekukan ${target.p.name}!`);
      return;
    }
    turnFx.current = { ...(turnFx.current || {}), [id]: true };
    setEffects(turnFx.current);
    setNote(`${def.emoji} ${ps[who].name}: ${def.name} aktif!`);
  }

  function answered(correct) {
    setQ(null);
    if (correct) rollDice(turnFx.current?.dadu2);
    else {
      setNote(`${current.name} — giliran terlepas.`);
      setPhase('ready');
      setTimeout(nextTurn, 900);
    }
  }

  function rollDice(double = false) {
    setPhase('roll');
    const value = 1 + Math.floor(Math.random() * 6);
    const second = double ? 1 + Math.floor(Math.random() * 6) : null;
    setDice(d => ({ value, second, roll: d.roll + 1 }));
    const rocket = turnFx.current?.roket ? 3 : 0;
    if (second || rocket) setNote(`${second ? `🎲 Dua dadu: ${value} + ${second}` : `Dadu: ${value}`}${rocket ? ' 🚀 +3 roket' : ''} = ${value + (second || 0) + rocket} petak`);
    setTimeout(() => move(value + (second || 0) + rocket), 1150);
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
    const up = layout.ladders?.[pos], down = layout.snakes?.[pos];
    if (up) { end = up; setNote(`🪜 Tangga! Naik ke petak ${end}.`); }
    else if (down && turnFx.current?.penangkis) setNote('🛡️ Penangkis Ular! Ular tidak dapat menggigit.');
    else if (down) { end = down; setNote(`🐍 Alamak, ular! Turun ke petak ${end}.`); }
    if (end !== pos) setPlayers(ps => ps.map((p, i) => (i === who ? { ...p, pos: end } : p)));
    const special = layout.specials?.[end];
    setTimeout(() => {
      if (end >= LAST) {
        setWinner(who);
        setPhase('over');
        onEnd?.({ game: 'ular', won: who === 0 });
        return;
      }
      if (special) setNote(SPECIALS[special].emoji + ' ' + SPECIALS[special].text);
      if (special === 'kotak') {
        const card = randomPower('ular');
        const full = (playersRef.current[who].cards || []).length >= MAX_POWER_CARDS;
        if (!full) setPlayers(ps => ps.map((p, i) => (i === who ? { ...p, cards: [...(p.cards || []), card] } : p)));
        setNote(full ? '🎁 Kotak kuasa — tetapi tangan sudah penuh!' : `🎁 ${playersRef.current[who].name} dapat kad ${POWER_CARDS.ular[card].emoji} ${POWER_CARDS.ular[card].name}!`);
      }
      if (special === 'bintang') { turnFx.current = null; setEffects({}); return setPhase('ready'); } // pemain sama main lagi
      if (special === 'ais') setPlayers(ps => ps.map((p, i) => (i === who ? { ...p, frozen: true } : p)));
      setTimeout(nextTurn, special ? 1200 : 0);
    }, end !== pos ? 1100 : 300);
  }

  // Giliran seterusnya; pemain yang beku (petak ais) dilangkau sekali.
  function nextTurn() {
    turnFx.current = null;
    setEffects({});
    const ps = playersRef.current;
    let t = (turnRef.current + 1) % ps.length;
    const skipped = [];
    for (let k = 0; k < ps.length && ps[t].frozen; k++) {
      skipped.push(t);
      t = (t + 1) % ps.length;
    }
    if (skipped.length) {
      setPlayers(list => list.map((p, i) => (skipped.includes(i) ? { ...p, frozen: false } : p)));
      setNote(`🧊 ${skipped.map(i => ps[i].name).join(', ')} beku — giliran dilangkau.`);
    }
    setTurn(t);
    setPhase('ready');
  }

  // ---------- Tetapan ----------
  if (setup) {
    return (
      <section className="screen game-setup">
        <BackButton onClick={onBack} />
        <div className="game-hero">
          <Emoji e="🐍" size="3rem" /><Emoji e="🎲" size="3rem" /><Emoji e="🪜" size="3rem" />
          <h2>Ular & Tangga</h2>
          <p className="muted">Jawab soalan dengan betul untuk membaling dadu. Tangga bawa anda naik, ular bawa anda turun. Papan berubah setiap permainan! Pertama sampai petak {LAST} menang!</p>
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


  return (
    <section className="screen snakes">
      <div className="game-topbar">
        <BackButton onClick={onBack} />
        <div className="turn-pills">
          {players.map((p, i) => (
            <span key={i} className={'turn-pill' + (i === turn && phase !== 'over' ? ' is-turn' : '')} style={{ '--pc': p.color }}>
              {p.bot ? <Mascot size={26} /> : <AnimalAvatar avatar={p.avatar} size={26} />}
              <b>{p.pos || 0}</b>{p.frozen && <Emoji e="🧊" />}
              {(p.cards || []).length > 0 && <span className="pill-cards"><Emoji e="✨" />{p.cards.length}</span>}
            </span>
          ))}
        </div>
      </div>

      <SnakeBoard players={players} layout={layout} turn={phase === 'over' ? -1 : turn} />
      <p className="board-theme muted small"><Emoji e="🎨" /> Papan {THEMES[layout?.theme]?.name} · {Object.keys(layout?.ladders || {}).length} tangga · {Object.keys(layout?.snakes || {}).length} ular · <Emoji e="⭐" /> main lagi · <Emoji e="🧊" /> beku · <Emoji e="🎁" /> kad kuasa</p>

      <div className="snake-panel">
        <Dice value={dice.value} roll={dice.roll} size={64} />
        {dice.second && <Dice value={dice.second} roll={dice.roll} size={64} />}
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

      <ActiveEffects game="ular" effects={effects} />
      {phase === 'ready' && !current?.bot && (
        <>
          <PowerCards game="ular" cards={current?.cards} onUse={(i, id) => playCard(turn, i, id)}
            title={players.filter(p => !p.bot).length > 1 ? `Kad kuasa ${current?.name}` : 'Kad kuasa anda'} />
          <GlowButton className="glow-lg" onClick={ask}><Emoji e="❓" /> Jawab soalan & baling dadu</GlowButton>
        </>
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
