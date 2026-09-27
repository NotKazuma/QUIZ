// Kad Duel dalam talian (2 pemain): bergilir memilih kad & menjawab; betul = serang nyawa lawan.
// Kad kuasa: Perisai Besi, Serangan Api, Ramuan Hidup, Tukar Kad — guna pada giliran sendiri.
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import AnimalAvatar from '../../../components/AnimalAvatar.jsx';
import Emoji, { EmojiText } from '../../../components/Emoji.jsx';
import { endRoom, seatInfo, setState } from '../../../lib/gameRoom.js';
import GameQuestion from '../GameQuestion.jsx';
import { CARD, COMBO_BONUS, EARN_EVERY, Fighter, HEAL, MAX_HP, levelOf } from '../CardDuel.jsx';
import PowerCards, { ActiveEffects, MAX_POWER_CARDS, POWER_CARDS, randomPower, randomPowers } from '../PowerCards.jsx';

const HAND = 3;

export function duelStart(seats) {
  const [a, b] = seats;
  return {
    seats: [a, b], turn: 0, next: HAND * 2, log: '',
    hp: { [a]: MAX_HP, [b]: MAX_HP },
    hands: { [a]: [0, 1, 2], [b]: [3, 4, 5] },
    powers: { [a]: randomPowers('duel', 2), [b]: randomPowers('duel', 2) },
  };
}

export default function OnlineDuel({ pin, state, seats, players, user, questions, onAnswer }) {
  const me = user.uid;
  const inGame = seats.includes(me);
  const opp = seats.find(u => u !== me) || seats[1];
  const top = inGame ? opp : seats[1];
  const bottom = inGame ? me : seats[0];
  const myTurn = inGame && seats[state.turn] === me && !state.winner;
  const hand = state.hands?.[me] || [];
  const myPowers = state.powers?.[me] || [];
  const myFx = state.fx?.[me] || {};
  const qAt = i => questions[i % questions.length];
  const [playing, setPlaying] = useState(null); // { slot, idx, q }
  const [hit, setHit] = useState(null);
  const lastHit = useRef(state.hit?.id);

  // Animasi serangan bila ada serangan baharu dalam keadaan bersama.
  useEffect(() => {
    if (!state.hit || state.hit.id === lastHit.current) return;
    lastHit.current = state.hit.id;
    setHit(state.hit);
    const t = setTimeout(() => setHit(null), 1200);
    return () => clearTimeout(t);
  }, [state.hit?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const myName = seatInfo(seats, players, me).name;

  function play(slot) {
    if (!myTurn || playing) return;
    setPlaying({ slot, idx: hand[slot], q: qAt(hand[slot]) });
  }

  // Kad kuasa: tindakan percuma (giliran tidak bertukar).
  function playPower(index, id) {
    if (!myTurn || playing) return;
    const def = POWER_CARDS.duel[id];
    const patch = { [`powers/${me}`]: myPowers.filter((_, j) => j !== index), log: `${myName}: ${def.emoji} ${def.name}!` };
    if (id === 'ramuan') {
      patch[`hp/${me}`] = Math.min(MAX_HP, (state.hp?.[me] ?? MAX_HP) + HEAL);
      patch.hit = { id: `${Date.now()}`, target: me, amount: -HEAL, text: 'Ramuan!' };
    } else if (id === 'tukar') {
      const next = state.next || 0;
      patch[`hands/${me}`] = [next, next + 1, next + 2];
      patch.next = next + HAND;
    } else {
      patch[`fx/${me}/${id}`] = true;
    }
    setState(pin, patch);
  }

  function resolved(correct) {
    const { slot, q } = playing;
    setPlaying(null);
    const lvl = levelOf(q);
    const combo = state.combo?.[me] || 0;
    const patch = {
      [`hands/${me}`]: hand.map((v, i) => (i === slot ? state.next : v)),
      next: (state.next || 0) + 1,
      turn: (state.turn + 1) % 2,
    };
    if (correct && state.fx?.[opp]?.perisai) {
      Object.assign(patch, {
        [`fx/${opp}/perisai`]: null, [`combo/${me}`]: combo + 1,
        hit: { id: `${Date.now()}`, target: opp, amount: 0, text: 'Dihalang!' },
        log: `${myName}: serangan dihalang oleh Perisai Besi!`,
      });
    } else if (correct) {
      const dmg = (CARD[lvl].power + (combo >= 1 ? COMBO_BONUS : 0)) * (myFx.api ? 2 : 1);
      const hpOpp = Math.max(0, (state.hp?.[opp] ?? MAX_HP) - dmg);
      Object.assign(patch, {
        [`hp/${opp}`]: hpOpp,
        [`combo/${me}`]: combo + 1,
        hit: { id: `${Date.now()}`, target: opp, amount: dmg, text: myFx.api ? 'Serangan Api ×2!' : combo >= 1 ? 'Kombo!' : CARD[lvl].name + '!' },
        log: `${myName}: ${CARD[lvl].name} kena! −${dmg}`,
      });
      if (myFx.api) patch[`fx/${me}/api`] = null;
      if (hpOpp === 0) {
        patch.winner = me;
        patch.turn = state.turn;
        setState(pin, patch).then(() => endRoom(pin));
        return;
      }
    } else {
      Object.assign(patch, { [`combo/${me}`]: 0, hit: { id: `${Date.now()}`, target: me, amount: 0, text: 'Terlepas!' }, log: `${myName}: serangan terlepas!` });
    }
    // Dapat kad kuasa setiap 3 jawapan betul berturut.
    if (correct && (combo + 1) % EARN_EVERY === 0 && myPowers.length < MAX_POWER_CARDS) {
      const got = randomPower('duel');
      patch[`powers/${me}`] = [...myPowers, got];
      patch.log += ` ✨ Dapat kad ${POWER_CARDS.duel[got].name}!`;
    }
    setState(pin, patch);
  }

  const topInfo = seatInfo(seats, players, top);
  const bottomInfo = seatInfo(seats, players, bottom);
  const turnInfo = seatInfo(seats, players, seats[state.turn]);
  const shieldMark = uid => (state.fx?.[uid]?.perisai ? ' 🛡️' : '');

  return (
    <>
      <div className="duel-arena">
        <Fighter name={topInfo.name + shieldMark(top)} color={topInfo.color} hp={state.hp?.[top] ?? MAX_HP} hit={hit?.target === top ? hit : null}
          cards={(state.powers?.[top] || []).length} active={seats[state.turn] === top && !state.winner}>
          <AnimalAvatar avatar={topInfo.avatar} size={92} mood={hit?.target === top && hit.amount > 0 ? 'sad' : 'happy'} />
        </Fighter>
        <span className="duel-vs">VS</span>
        <Fighter name={(inGame ? 'Anda' : bottomInfo.name) + shieldMark(bottom)} color={bottomInfo.color} hp={state.hp?.[bottom] ?? MAX_HP}
          hit={hit?.target === bottom ? hit : null} active={seats[state.turn] === bottom && !state.winner}>
          <AnimalAvatar avatar={bottomInfo.avatar} size={92} mood={hit?.target === bottom && hit.amount > 0 ? 'sad' : 'happy'} />
        </Fighter>
      </div>

      <p className="duel-log">
        {state.winner
          ? <EmojiText>{state.winner === me ? '🏆 Anda menang duel ini!' : `🏆 ${seatInfo(seats, players, state.winner).name} menang!`}</EmojiText>
          : myTurn ? 'Giliran anda — pilih kad untuk menyerang!' : `Menunggu ${turnInfo.name} menyerang…`}
      </p>
      {state.log && !state.winner && <p className="muted small duel-sub"><EmojiText>{state.log}</EmojiText></p>}
      {inGame && <ActiveEffects game="duel" effects={myFx} />}

      {inGame && !state.winner && (
        <>
          <div className={'duel-hand' + (myTurn ? '' : ' is-waiting')}>
            {hand.map((idx, i) => {
              const d = CARD[levelOf(qAt(idx))];
              return (
                <motion.button key={idx} className="duel-card" style={{ '--cc': d.color }} onClick={() => play(i)}
                  initial={{ y: 60, opacity: 0, rotate: (i - 1) * 6 }} animate={{ y: 0, opacity: 1, rotate: (i - 1) * 6 }}
                  whileTap={{ scale: 0.95 }} disabled={!myTurn || Boolean(playing)}>
                  <span className="duel-card-level">{d.label}</span>
                  <Emoji e={d.emoji} size="2.4rem" />
                  <b>{d.name}</b>
                  <span className="duel-card-power"><Emoji e="💥" /> {d.power}</span>
                </motion.button>
              );
            })}
          </div>
          <PowerCards game="duel" cards={myPowers} onUse={playPower} disabled={!myTurn || Boolean(playing)}
            title={myTurn ? `Kad kuasa · dapat 1 lagi setiap ${EARN_EVERY} betul berturut` : 'Kad kuasa (guna pada giliran anda)'} />
        </>
      )}

      <AnimatePresence>
        {playing && (
          <motion.div className="game-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26 }}>
            <GameQuestion question={playing.q} eyebrow={`${CARD[levelOf(playing.q)].name} · ${CARD[levelOf(playing.q)].power} serangan${myFx.api ? ' ×2' : ''}`}
              onAnswer={onAnswer} onDone={resolved} winText="Serangan kena!" loseText="Serangan terlepas" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
