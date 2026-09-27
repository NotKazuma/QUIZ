// Kad Duel: pilih kad serangan (Mudah/Sederhana/Susah), jawab soalannya untuk menyerang Belang.
// Selepas setiap giliran Belang menyerang balik — lebih kuat jika anda tersalah jawab.
// Kad kuasa (Perisai Besi, Serangan Api, Ramuan Hidup, Tukar Kad) — anda & Belang sama-sama boleh guna.
import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import AnimalAvatar from '../../components/AnimalAvatar.jsx';
import Emoji, { EmojiText } from '../../components/Emoji.jsx';
import Mascot from '../../components/Mascot.jsx';
import { BackButton, GlowButton } from '../../components/ui.jsx';
import { prepareQuestion, shuffle } from '../../lib/quiz.js';
import GameQuestion from './GameQuestion.jsx';
import PowerCards, { ActiveEffects, MAX_POWER_CARDS, POWER_CARDS, randomPower, randomPowers } from './PowerCards.jsx';

export const MAX_HP = 100;
export const CARD = {
  mudah: { name: 'Pukulan', emoji: '👊', power: 20, color: '#58cc02', label: 'Mudah' },
  sederhana: { name: 'Tendangan', emoji: '🦶', power: 30, color: '#1cb0f6', label: 'Sederhana' },
  susah: { name: 'Petir', emoji: '⚡', power: 45, color: '#ce82ff', label: 'Susah' },
};
export const COMBO_BONUS = 10;
export const HEAL = 20;          // Ramuan Hidup
export const EARN_EVERY = 3;     // dapat kad kuasa setiap 3 jawapan betul berturut
const BELANG_CARD_CHANCE = 0.3;
export const levelOf = q => (CARD[q?.difficulty] ? q.difficulty : 'sederhana');

export default function CardDuel({ questions, avatar, onAnswer, onEnd, onBack }) {
  const deck = useRef([]);
  const draw = () => {
    if (!deck.current.length) deck.current = shuffle(questions);
    const q = deck.current.pop();
    return { key: Math.random().toString(36).slice(2), q, level: levelOf(q) };
  };
  const [hand, setHand] = useState(() => [draw(), draw(), draw()]);
  const [hp, setHp] = useState({ me: MAX_HP, belang: MAX_HP });
  const [playing, setPlaying] = useState(null);  // { card, q }
  const [combo, setCombo] = useState(0);
  const [hit, setHit] = useState(null);          // { who, amount, text }
  const [mood, setMood] = useState('happy');
  const [over, setOver] = useState(null);        // 'win' | 'lose'
  const [log, setLog] = useState('Pilih satu kad untuk menyerang!');
  const [powers, setPowers] = useState(() => randomPowers('duel', 2));
  const [fx, setFx] = useState({});              // kesan kad kuasa anda: { perisai, api }
  const [belang, setBelang] = useState(() => ({ cards: randomPowers('duel', 2), fx: {} }));

  function play(card) {
    if (playing || over) return;
    setPlaying({ card, q: prepareQuestion(card.q) });
  }

  function flash(who, amount, text) {
    setHit({ who, amount, text, id: Math.random() });
    setTimeout(() => setHit(null), 1100);
  }

  // Kad kuasa anda (tindakan percuma pada giliran anda).
  function playPower(index, id) {
    if (playing || over) return;
    setPowers(p => p.filter((_, j) => j !== index));
    const def = POWER_CARDS.duel[id];
    if (id === 'ramuan') {
      setHp(h => ({ ...h, me: Math.min(MAX_HP, h.me + HEAL) }));
      flash('me', -HEAL, 'Ramuan!');
    } else if (id === 'tukar') {
      setHand([draw(), draw(), draw()]);
    } else {
      setFx(f => ({ ...f, [id]: true }));
    }
    setLog(`${def.emoji} ${def.name}${id === 'ramuan' ? ` — +${HEAL} nyawa!` : id === 'tukar' ? ' — kad baharu!' : ' aktif!'}`);
  }

  function resolved(correct) {
    const card = playing.card;
    setPlaying(null);
    setHand(h => h.map(c => (c.key === card.key ? draw() : c)));
    let belangHp = hp.belang;
    if (correct && belang.fx.perisai) {
      setBelang(b => ({ ...b, fx: { ...b.fx, perisai: false } }));
      setCombo(c => c + 1);
      flash('belang', 0, 'Dihalang!');
      setLog('Perisai Belang menghalang serangan anda!');
    } else if (correct) {
      const bonus = combo >= 1 ? COMBO_BONUS : 0;
      const dmg = (CARD[card.level].power + bonus) * (fx.api ? 2 : 1);
      belangHp = Math.max(0, hp.belang - dmg);
      if (fx.api) setFx(f => ({ ...f, api: false }));
      setCombo(c => c + 1);
      setMood('sad');
      flash('belang', dmg, fx.api ? 'Serangan Api ×2!' : bonus ? 'Kombo!' : CARD[card.level].name + '!');
      setLog(`${CARD[card.level].name} kena! Belang −${dmg}${bonus ? ' (kombo)' : ''}`);
      setHp(h => ({ ...h, belang: belangHp }));
      if (belangHp === 0) {
        setTimeout(() => { setOver('win'); onEnd?.({ game: 'duel', won: true }); }, 900);
        return;
      }
    } else {
      setCombo(0);
      setLog('Serangan anda terlepas!');
    }
    // Dapat kad kuasa setiap 3 jawapan betul berturut.
    if (correct && (combo + 1) % EARN_EVERY === 0 && powers.length < MAX_POWER_CARDS) {
      const got = randomPower('duel');
      setPowers(p => [...p, got]);
      setTimeout(() => setLog(`✨ ${combo + 1} betul berturut — dapat kad ${POWER_CARDS.duel[got].emoji} ${POWER_CARDS.duel[got].name}!`), 600);
    }
    setTimeout(() => belangTurn(correct), 1100);
  }

  // Giliran Belang: kadang-kadang guna kad kuasa, kemudian menyerang.
  function belangTurn(youWereRight) {
    let attackX = 1;
    if (belang.cards.length && Math.random() < BELANG_CARD_CHANCE) {
      const i = Math.floor(Math.random() * belang.cards.length);
      const id = belang.cards[i];
      const cards = belang.cards.filter((_, j) => j !== i);
      if (id === 'ramuan') setHp(h => ({ ...h, belang: Math.min(MAX_HP, h.belang + HEAL) }));
      if (id === 'api') attackX = 2;
      setBelang(b => ({ cards, fx: id === 'perisai' ? { ...b.fx, perisai: true } : b.fx }));
      if (id !== 'tukar') setLog(`Belang guna ${POWER_CARDS.duel[id].emoji} ${POWER_CARDS.duel[id].name}!`);
    }
    setTimeout(() => {
      if (fx.perisai) {
        setFx(f => ({ ...f, perisai: false }));
        setMood('sad');
        flash('me', 0, 'Dihalang!');
        setLog('Perisai Besi anda menghalang serangan Belang!');
        setTimeout(() => setMood('think'), 1200);
        return;
      }
      const base = 10 + Math.floor(Math.random() * 9);
      const dmg = Math.round((youWereRight ? base : base * 1.5) * attackX);
      setMood('cheer');
      flash('me', dmg, attackX > 1 ? 'Serangan Api Belang!' : youWereRight ? 'Belang menyerang!' : 'Serangan kritikal!');
      setLog(`Belang menyerang balik: −${dmg}${youWereRight ? '' : ' (kritikal)'}`);
      setHp(h => {
        const me = Math.max(0, h.me - dmg);
        if (me === 0) setTimeout(() => { setOver('lose'); onEnd?.({ game: 'duel', won: false }); }, 700);
        return { ...h, me };
      });
      setTimeout(() => setMood('think'), 1200);
    }, 700);
  }

  function again() {
    deck.current = [];
    setHand([draw(), draw(), draw()]);
    setHp({ me: MAX_HP, belang: MAX_HP });
    setPowers(randomPowers('duel', 2));
    setBelang({ cards: randomPowers('duel', 2), fx: {} });
    setFx({});
    setCombo(0); setOver(null); setMood('happy'); setLog('Pilih satu kad untuk menyerang!');
  }

  return (
    <section className="screen duel">
      <div className="game-topbar"><BackButton onClick={onBack} /><span className="duel-title"><Emoji e="⚔️" /> Kad Duel</span></div>

      <div className="duel-arena">
        <Fighter name={belang.fx.perisai ? 'Belang 🛡️' : 'Belang'} hp={hp.belang} hit={hit?.who === 'belang' ? hit : null} cards={belang.cards.length} enemy>
          <Mascot mood={over === 'win' ? 'sad' : mood} size={110} />
        </Fighter>
        <span className="duel-vs">VS</span>
        <Fighter name={fx.perisai ? 'Anda 🛡️' : 'Anda'} hp={hp.me} hit={hit?.who === 'me' ? hit : null}>
          <AnimalAvatar avatar={avatar} size={96} mood={hit?.who === 'me' ? 'sad' : 'happy'} />
        </Fighter>
      </div>

      <p className="duel-log"><EmojiText>{log}</EmojiText>{combo >= 2 && <span className="duel-combo"> <Emoji e="🔥" /> Kombo ×{combo}</span>}</p>
      <ActiveEffects game="duel" effects={fx} />

      {!over && (
        <>
          <div className="duel-hand">
            {hand.map((c, i) => {
              const d = CARD[c.level];
              return (
                <motion.button key={c.key} className="duel-card" style={{ '--cc': d.color }} onClick={() => play(c)}
                  initial={{ y: 60, opacity: 0, rotate: (i - 1) * 6 }} animate={{ y: 0, opacity: 1, rotate: (i - 1) * 6 }}
                  whileHover={{ y: -8 }} whileTap={{ scale: 0.95 }} disabled={Boolean(playing)}>
                  <span className="duel-card-level">{d.label}</span>
                  <Emoji e={d.emoji} size="2.4rem" />
                  <b>{d.name}</b>
                  <span className="duel-card-power"><Emoji e="💥" /> {d.power}</span>
                </motion.button>
              );
            })}
          </div>
          <PowerCards game="duel" cards={powers} onUse={playPower} disabled={Boolean(playing)} title={`Kad kuasa · dapat 1 lagi setiap ${EARN_EVERY} betul berturut`} />
        </>
      )}

      {over && (
        <motion.div className="card game-result" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Emoji e={over === 'win' ? '🏆' : '💪'} size="3rem" />
          <b>{over === 'win' ? 'Anda kalahkan Belang!' : 'Belang menang kali ini. Cuba lagi!'}</b>
          <GlowButton className="glow-lg" onClick={again}><Emoji e="🔁" /> Lawan lagi</GlowButton>
        </motion.div>
      )}

      <AnimatePresence>
        {playing && (
          <motion.div className="game-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26 }}>
            <GameQuestion question={playing.q} eyebrow={`${CARD[playing.card.level].name} · ${CARD[playing.card.level].power} serangan${fx.api ? ' ×2' : ''}`}
              onAnswer={onAnswer} onDone={resolved} winText="Serangan kena!" loseText="Serangan terlepas" />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export function Fighter({ name, hp, hit, enemy, cards, active, color, children }) {
  const pct = (hp / MAX_HP) * 100;
  return (
    <div className={'fighter' + (enemy ? ' is-enemy' : '') + (active ? ' is-active' : '')} style={color ? { '--pc': color } : undefined}>
      <motion.div className="fighter-art" animate={hit?.amount > 0 ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }} transition={{ duration: 0.5 }}>
        {children}
        <AnimatePresence>
          {hit && (
            <motion.span key={hit.id} className="dmg-pop" initial={{ y: 0, opacity: 0, scale: 0.6 }} animate={{ y: -40, opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              {hit.amount > 0 ? `−${hit.amount}` : hit.amount < 0 ? `+${-hit.amount}` : ''}<small>{hit.text}</small>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
      <b className="fighter-name"><EmojiText>{name}</EmojiText></b>
      <span className={'hp-bar' + (pct <= 30 ? ' is-low' : '')}><motion.span animate={{ width: pct + '%' }} /></span>
      <span className="hp-text"><Emoji e="❤️" /> {hp}/{MAX_HP}{cards > 0 && <> · <Emoji e="✨" /> {cards}</>}</span>
    </div>
  );
}
