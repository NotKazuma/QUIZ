// Kad Padanan berlawan (2–4 pemain): bergilir membuka dua kad. Padan = dapat mata & main lagi; tidak = giliran seterusnya.
import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import AnimalAvatar from '../../../components/AnimalAvatar.jsx';
import Emoji, { EmojiText } from '../../../components/Emoji.jsx';
import { endRoom, seatInfo, setState } from '../../../lib/gameRoom.js';
import { scriptProps, shuffle } from '../../../lib/quiz.js';
import { CARD_BACKS, EARN_STREAK, PEEK_MS } from '../MemoryCards.jsx';
import PowerCards, { MAX_POWER_CARDS, randomPower, randomPowers } from '../PowerCards.jsx';

export const MEMORY_PAIRS = 6;

// Kad dibina daripada soalan pertama dalam susunan bilik (hos memilih soalan pendek semasa mencipta bilik).
export function memoryStart(seats, questions) {
  const n = Math.min(MEMORY_PAIRS, questions.length);
  const cards = shuffle(Array.from({ length: n }, (_, p) => [{ p, k: 'q' }, { p, k: 'a' }]).flat());
  return { seats, turn: 0, cards, scores: Object.fromEntries(seats.map(u => [u, 0])), log: '', back: Math.floor(Math.random() * CARD_BACKS.length),
    powers: Object.fromEntries(seats.map(u => [u, randomPowers('padanan', 1)])) };
}

export default function OnlineMemory({ pin, state, seats, players, user, questions, onAnswer }) {
  const cards = state.cards || [];
  const open = state.open || [];
  const matched = state.matched || {};
  const myTurn = seats[state.turn] === user.uid && !state.winner;
  const busy = useRef(false);
  const turnInfo = seatInfo(seats, players, seats[state.turn]);
  const myPowers = state.powers?.[user.uid] || [];
  const [peek, setPeek] = useState(null); // hanya anda yang nampak kad yang diintip

  // Kad kuasa pada giliran sendiri: Intip / Petunjuk (paparan tempatan sahaja).
  function playPower(index, id) {
    if (!myTurn || peek || open.length) return;
    setState(pin, { [`powers/${user.uid}`]: myPowers.filter((_, j) => j !== index) });
    if (id === 'intip') setPeek('all');
    else {
      const left = cards.map(c => c.p).filter(p => matched[p] === undefined);
      const pair = left[Math.floor(Math.random() * left.length)];
      setPeek(cards.map((c, k) => (c.p === pair ? k : -1)).filter(k => k >= 0));
    }
    setTimeout(() => setPeek(null), PEEK_MS[id]);
  }

  async function flip(i) {
    if (!myTurn || peek || busy.current || open.length >= 2 || open.includes(i) || matched[cards[i].p] !== undefined) return;
    const next = [...open, i];
    if (next.length < 2) return setState(pin, { open: next });
    busy.current = true;
    await setState(pin, { open: next });
    const [a, b] = next.map(k => cards[k]);
    const myName = seatInfo(seats, players, user.uid).name;
    if (a.p === b.p) {
      setTimeout(async () => {
        const scores = { ...state.scores, [user.uid]: (state.scores?.[user.uid] || 0) + 1 };
        const allDone = Object.keys(matched).length + 1 >= cards.length / 2;
        const streak = (state.streak?.[user.uid] || 0) + 1;
        const patch = { [`matched/${a.p}`]: user.uid, [`scores/${user.uid}`]: scores[user.uid], [`streak/${user.uid}`]: streak, open: null, log: `${myName} dapat sepasang! Main lagi.` };
        if (streak % EARN_STREAK === 0 && myPowers.length < MAX_POWER_CARDS) {
          patch[`powers/${user.uid}`] = [...myPowers, randomPower('padanan')];
          patch.log = `${myName} dapat ${streak} pasang berturut — kad kuasa baharu!`;
        }
        if (allDone) {
          const best = Math.max(...seats.map(u => scores[u] || 0));
          const top = seats.filter(u => (scores[u] || 0) === best);
          patch.winner = top.length === 1 ? top[0] : 'seri';
          patch.log = top.length === 1 ? '' : 'Seri!';
        }
        onAnswer?.(true, questions[a.p]);
        await setState(pin, patch);
        if (allDone) await endRoom(pin);
        busy.current = false;
      }, 600);
    } else {
      setTimeout(async () => {
        await setState(pin, { open: null, [`streak/${user.uid}`]: 0, turn: (state.turn + 1) % seats.length, log: `${myName} tidak padan.` });
        busy.current = false;
      }, 1300);
    }
  }

  const winnerText = state.winner === 'seri' ? '🤝 Seri!'
    : state.winner === user.uid ? '🏆 Anda menang!' : state.winner ? `🏆 ${seatInfo(seats, players, state.winner).name} menang!` : null;

  return (
    <>
      <div className="memory-score">
        {seats.map((uid, i) => {
          const p = seatInfo(seats, players, uid);
          return (
            <span key={uid} className={'turn-pill' + (i === state.turn && !state.winner ? ' is-turn' : '')} style={{ '--pc': p.color }}>
              <AnimalAvatar avatar={p.avatar} size={26} /> {uid === user.uid ? 'Anda' : p.name} <b>{state.scores?.[uid] || 0}</b>
            </span>
          );
        })}
      </div>
      <p className="duel-log">
        {winnerText ? <EmojiText>{winnerText}</EmojiText> : myTurn ? 'Giliran anda — buka dua kad!' : `Giliran ${turnInfo.name}…`}
      </p>
      {state.log && !state.winner && <p className="muted small duel-sub">{state.log}</p>}

      <div className={'memory-grid' + (myTurn ? '' : ' is-waiting')}>
        {cards.map((c, i) => {
          const owner = matched[c.p];
          const faceUp = open.includes(i) || owner !== undefined || peek === 'all' || (Array.isArray(peek) && peek.includes(i));
          const q = questions[c.p];
          const text = c.k === 'q' ? q?.question : q?.options[q.answer];
          const script = scriptProps(q?.script);
          return (
            <button key={i} className={'mem-card' + (faceUp ? ' is-up' : '') + (owner ? ' is-matched' : '')}
              onClick={() => flip(i)} aria-label={faceUp ? text : 'Kad tertutup'}
              style={{ '--mc': owner ? seatInfo(seats, players, owner).color : c.k === 'q' ? '#ce82ff' : '#1cb0f6' }}>
              <span className="mem-inner">
                <span className={'mem-back back-' + (state.back || 0)}><Emoji e={CARD_BACKS[state.back || 0]} size="2rem" /></span>
                <span className={'mem-front is-' + c.k}>
                  <span className="mem-kind"><Emoji e={c.k === 'q' ? '❓' : '💡'} /></span>
                  <span className={'mem-text ' + script.className} dir={script.dir}>{text}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {!state.winner && (
        <PowerCards game="padanan" cards={myPowers} onUse={playPower} disabled={!myTurn || Boolean(peek)}
          title={myTurn ? `Kad kuasa · dapat 1 lagi setiap ${EARN_STREAK} padanan berturut` : 'Kad kuasa (guna pada giliran anda)'} />
      )}
      {!myTurn && !state.winner && <motion.p className="muted small memory-help" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}>Perhatikan kad yang dibuka — ingat kedudukannya!</motion.p>}
    </>
  );
}
