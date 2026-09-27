// Ular & Tangga dalam talian: pemain bergilir menjawab di telefon masing-masing; semua nampak dadu & token bergerak.
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import AnimalAvatar from '../../../components/AnimalAvatar.jsx';
import Dice from '../../../components/Dice.jsx';
import Emoji, { EmojiText } from '../../../components/Emoji.jsx';
import { GlowButton } from '../../../components/ui.jsx';
import { endRoom, seatInfo, setState } from '../../../lib/gameRoom.js';
import GameQuestion from '../GameQuestion.jsx';
import SnakeBoard, { LAST, SPECIALS, THEMES, generateLayout, moveResult } from '../SnakeBoard.jsx';
import PowerCards, { ActiveEffects, MAX_POWER_CARDS, POWER_CARDS, randomPower, randomPowers } from '../PowerCards.jsx';

export function snakesStart(seats) {
  // Susun atur papan dijana rawak sekali oleh hos & disimpan dalam bilik — semua pemain nampak papan sama.
  return { seats, turn: 0, pos: Object.fromEntries(seats.map(u => [u, 0])), dice: { value: 1, roll: 0 }, q: 0, log: '', layout: generateLayout(),
    cards: Object.fromEntries(seats.map(u => [u, randomPowers('ular', 2)])) };
}

// Giliran seterusnya selepas `from`, langkau pemain beku (petak ais). Pulang { turn, patch, skipped }.
function nextTurnPatch(state, seats, players, from, extraFrozen) {
  const frozen = { ...(state.frozen || {}), ...(extraFrozen || {}) };
  const patch = {};
  const skipped = [];
  let t = (from + 1) % seats.length;
  for (let k = 0; k < seats.length && frozen[seats[t]]; k++) {
    patch[`frozen/${seats[t]}`] = null;
    frozen[seats[t]] = false;
    skipped.push(seatInfo(seats, players, seats[t]).name);
    t = (t + 1) % seats.length;
  }
  patch.turn = t;
  return { patch, skipped };
}

// Paparan kedudukan token dengan animasi petak demi petak bila ada gerakan baharu.
function useShownPositions(pos, move) {
  const [shown, setShown] = useState(pos);
  const lastId = useRef(move?.id);
  useEffect(() => {
    if (!move || move.id === lastId.current) { setShown(pos); return; }
    lastId.current = move.id;
    let at = move.from;
    const timers = [];
    const stepTo = (p, delay) => timers.push(setTimeout(() => setShown(s => ({ ...s, [move.uid]: p })), delay));
    let t = 400; // tunggu dadu berhenti
    while (at < move.land) { at += 1; t += 260; stepTo(at, t); }
    if (move.to !== move.land) stepTo(move.to, t + 700);
    return () => timers.forEach(clearTimeout);
  }, [move?.id, JSON.stringify(pos)]); // eslint-disable-line react-hooks/exhaustive-deps
  return shown;
}

export default function OnlineSnakes({ pin, state, seats, players, user, questions, onAnswer }) {
  const pos = state.pos || {};
  const shown = useShownPositions(pos, state.move);
  const turnUid = seats[state.turn];
  const myTurn = turnUid === user.uid && !state.winner;
  const [asking, setAsking] = useState(null);
  const [busy, setBusy] = useState(false);
  const cur = seatInfo(seats, players, turnUid);

  function askQuestion() {
    setAsking(questions[(state.q || 0) % questions.length]);
  }

  const myCards = state.cards?.[user.uid] || [];
  const fx = state.fx?.[user.uid] || {};

  // Guna kad kuasa pada giliran sendiri (sebelum menjawab).
  function playCard(index, id) {
    if (!myTurn || busy || asking) return;
    const me = seatInfo(seats, players, user.uid);
    const cards = myCards.filter((_, j) => j !== index);
    const def = POWER_CARDS.ular[id];
    if (id === 'beku') {
      const target = seats.filter(u => u !== user.uid && !state.frozen?.[u]).sort((a, b) => (pos[b] || 0) - (pos[a] || 0))[0];
      if (!target) return;
      setState(pin, { [`cards/${user.uid}`]: cards, [`frozen/${target}`]: true, log: `🧊 ${me.name} membekukan ${seatInfo(seats, players, target).name}!` });
      return;
    }
    setState(pin, { [`cards/${user.uid}`]: cards, [`fx/${user.uid}/${id}`]: true, log: `${def.emoji} ${me.name}: ${def.name} aktif!` });
  }

  function answered(correct) {
    setAsking(null);
    setBusy(true);
    const me = seatInfo(seats, players, user.uid);
    if (!correct) {
      const { patch, skipped } = nextTurnPatch(state, seats, players, state.turn);
      patch[`fx/${user.uid}`] = null;
      setState(pin, { ...patch, q: (state.q || 0) + 1, log: `${me.name} tersalah jawab — giliran terlepas.` + (skipped.length ? ` 🧊 ${skipped.join(', ')} beku.` : '') })
        .finally(() => setBusy(false));
      return;
    }
    const value = 1 + Math.floor(Math.random() * 6);
    const second = fx.dadu2 ? 1 + Math.floor(Math.random() * 6) : null;
    const rocket = fx.roket ? 3 : 0;
    const from = pos[user.uid] || 0;
    const res = moveResult(from, value + (second || 0) + rocket, state.layout);
    // Penangkis Ular: kebal gigitan ular pada giliran ini.
    const blocked = res.via === 'ular' && fx.penangkis;
    const { land } = res;
    const to = blocked ? land : res.to;
    const via = blocked ? 'perisai' : res.via;
    const special = blocked ? state.layout?.specials?.[land] || null : res.special;
    const won = to >= LAST;
    const log = `${me.name} dapat ${second ? `${value} + ${second} (🎲 dua dadu)` : value}${rocket ? ' 🚀 +3' : ''}` + (via === 'perisai' ? ` 🛡️ penangkis menghalang ular!` : '') + (via === 'tangga' ? ` 🪜 naik tangga ke ${to}!` : via === 'ular' ? ` 🐍 digigit ular, turun ke ${to}.` : ` → petak ${to}.`);
    setState(pin, {
      dice: { value, second, roll: (state.dice?.roll || 0) + 1 },
      [`pos/${user.uid}`]: to,
      move: { id: `${Date.now()}-${user.uid}`, uid: user.uid, from, land, to },
      q: (state.q || 0) + 1,
      log,
    });
    // Tukar giliran selepas animasi token selesai.
    const wait = 700 + (land - from) * 260 + (to !== land ? 900 : 0);
    setTimeout(() => {
      let done;
      if (won) done = setState(pin, { winner: user.uid, log: `🏆 ${me.name} sampai ke petak ${LAST}!` }).then(() => endRoom(pin));
      else if (special === 'bintang') done = setState(pin, { [`fx/${user.uid}`]: null, log: `${me.name}: ⭐ ${SPECIALS.bintang.text}` }); // main lagi
      else {
        const { patch, skipped } = nextTurnPatch(state, seats, players, state.turn, special === 'ais' ? { [user.uid]: true } : null);
        if (special === 'ais') patch[`frozen/${user.uid}`] = true;
        patch[`fx/${user.uid}`] = null;
        let note = special === 'ais' ? `${me.name}: 🧊 ${SPECIALS.ais.text}` : skipped.length ? `🧊 ${skipped.join(', ')} beku — giliran dilangkau.` : undefined;
        if (special === 'kotak') {
          const card = randomPower('ular');
          if (myCards.length < MAX_POWER_CARDS) {
            patch[`cards/${user.uid}`] = [...myCards, card];
            note = `🎁 ${me.name} dapat kad ${POWER_CARDS.ular[card].emoji} ${POWER_CARDS.ular[card].name}!`;
          } else note = '🎁 Kotak kuasa — tetapi tangan sudah penuh!';
        }
        done = setState(pin, note ? { ...patch, log: note } : patch);
      }
      done.finally(() => setBusy(false));
    }, wait);
  }

  const boardPlayers = seats.map(uid => ({ ...seatInfo(seats, players, uid), pos: shown[uid] || 0 }));
  const winner = state.winner && seatInfo(seats, players, state.winner);

  return (
    <>
      <div className="turn-pills online-pills">
        {seats.map((uid, i) => {
          const p = seatInfo(seats, players, uid);
          return (
            <span key={uid} className={'turn-pill' + (i === state.turn && !state.winner ? ' is-turn' : '')} style={{ '--pc': p.color }}>
              <AnimalAvatar avatar={p.avatar} size={26} /> {uid === user.uid ? 'Anda' : p.name} <b>{pos[uid] || 0}</b>
              {state.frozen?.[uid] && <Emoji e="🧊" />}
              {(state.cards?.[uid] || []).length > 0 && <span className="pill-cards"><Emoji e="✨" />{state.cards[uid].length}</span>}
            </span>
          );
        })}
      </div>

      <SnakeBoard players={boardPlayers} layout={state.layout} turn={state.winner ? -1 : state.turn} />
      <p className="board-theme muted small"><Emoji e="🎨" /> Papan {THEMES[state.layout?.theme]?.name} · <Emoji e="⭐" /> main lagi · <Emoji e="🧊" /> beku · <Emoji e="🎁" /> kad kuasa</p>

      <div className="snake-panel">
        <Dice value={state.dice?.value || 1} roll={state.dice?.roll || 0} size={64} />
        {state.dice?.second && <Dice value={state.dice.second} roll={state.dice.roll} size={64} />}
        <div className="snake-status">
          {winner ? (
            <b><EmojiText>{state.winner === user.uid ? '🏆 Anda menang!' : `🏆 ${winner.name} menang!`}</EmojiText></b>
          ) : (
            <b style={{ color: cur.color }}>{myTurn ? 'Giliran anda!' : `Giliran ${cur.name}`}</b>
          )}
          <span className="muted small"><EmojiText>{state.log || (myTurn ? 'Jawab soalan untuk baling dadu' : `${cur.name} sedang menjawab…`)}</EmojiText></span>
        </div>
      </div>

      <ActiveEffects game="ular" effects={state.fx?.[turnUid]} />
      {myTurn && !asking && !busy && (
        <>
          <PowerCards game="ular" cards={myCards} onUse={playCard} title="Kad kuasa anda" />
          <GlowButton className="glow-lg" onClick={askQuestion}><Emoji e="❓" /> Jawab soalan & baling dadu</GlowButton>
        </>
      )}
      {!myTurn && !state.winner && myCards.length > 0 && <PowerCards game="ular" cards={myCards} onUse={() => {}} disabled title="Kad kuasa anda (guna pada giliran anda)" />}

      <AnimatePresence>
        {asking && (
          <motion.div className="game-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26 }}>
            <GameQuestion question={asking} eyebrow="Giliran anda" onAnswer={onAnswer} onDone={answered}
              winText="Betul! Baling dadu 🎲" loseText="Salah — giliran terlepas" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
