// Kad Duel: pilih kad serangan (Mudah/Sederhana/Susah), jawab soalannya untuk menyerang Belang.
// Selepas setiap giliran Belang menyerang balik — lebih kuat jika anda tersalah jawab.
import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import AnimalAvatar from '../../components/AnimalAvatar.jsx';
import Emoji from '../../components/Emoji.jsx';
import Mascot from '../../components/Mascot.jsx';
import { BackButton, GlowButton } from '../../components/ui.jsx';
import { prepareQuestion, shuffle } from '../../lib/quiz.js';
import GameQuestion from './GameQuestion.jsx';

const MAX_HP = 100;
const CARD = {
  mudah: { name: 'Pukulan', emoji: '👊', power: 20, color: '#58cc02', label: 'Mudah' },
  sederhana: { name: 'Tendangan', emoji: '🦶', power: 30, color: '#1cb0f6', label: 'Sederhana' },
  susah: { name: 'Petir', emoji: '⚡', power: 45, color: '#ce82ff', label: 'Susah' },
};
const COMBO_BONUS = 10;

export default function CardDuel({ questions, avatar, onAnswer, onEnd, onBack }) {
  const deck = useRef([]);
  const draw = () => {
    if (!deck.current.length) deck.current = shuffle(questions);
    const q = deck.current.pop();
    return { key: Math.random().toString(36).slice(2), q, level: CARD[q.difficulty] ? q.difficulty : 'sederhana' };
  };
  const [hand, setHand] = useState(() => [draw(), draw(), draw()]);
  const [hp, setHp] = useState({ me: MAX_HP, belang: MAX_HP });
  const [playing, setPlaying] = useState(null);  // { card, q }
  const [combo, setCombo] = useState(0);
  const [hit, setHit] = useState(null);          // { who, amount, text }
  const [mood, setMood] = useState('happy');
  const [over, setOver] = useState(null);        // 'win' | 'lose'
  const [log, setLog] = useState('Pilih satu kad untuk menyerang!');

  function play(card) {
    if (playing || over) return;
    setPlaying({ card, q: prepareQuestion(card.q) });
  }

  function flash(who, amount, text) {
    setHit({ who, amount, text, id: Math.random() });
    setTimeout(() => setHit(null), 1100);
  }

  function resolved(correct) {
    const card = playing.card;
    setPlaying(null);
    setHand(h => h.map(c => (c.key === card.key ? draw() : c)));
    let belangHp = hp.belang;
    if (correct) {
      const bonus = combo >= 1 ? COMBO_BONUS : 0;
      const dmg = CARD[card.level].power + bonus;
      belangHp = Math.max(0, hp.belang - dmg);
      setCombo(c => c + 1);
      setMood('sad');
      flash('belang', dmg, bonus ? 'Kombo!' : CARD[card.level].name + '!');
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
    // Giliran Belang.
    setTimeout(() => {
      const base = 10 + Math.floor(Math.random() * 9);
      const dmg = correct ? base : Math.round(base * 1.5);
      setMood('cheer');
      flash('me', dmg, correct ? 'Belang menyerang!' : 'Serangan kritikal!');
      setLog(`Belang menyerang balik: −${dmg}${correct ? '' : ' (kritikal)'}`);
      setHp(h => {
        const me = Math.max(0, h.me - dmg);
        if (me === 0) setTimeout(() => { setOver('lose'); onEnd?.({ game: 'duel', won: false }); }, 700);
        return { ...h, me };
      });
      setTimeout(() => setMood('think'), 1200);
    }, 1100);
  }

  function again() {
    deck.current = [];
    setHand([draw(), draw(), draw()]);
    setHp({ me: MAX_HP, belang: MAX_HP });
    setCombo(0); setOver(null); setMood('happy'); setLog('Pilih satu kad untuk menyerang!');
  }

  return (
    <section className="screen duel">
      <div className="game-topbar"><BackButton onClick={onBack} /><span className="duel-title"><Emoji e="⚔️" /> Kad Duel</span></div>

      <div className="duel-arena">
        <Fighter name="Belang" hp={hp.belang} hit={hit?.who === 'belang' ? hit : null} enemy>
          <Mascot mood={over === 'win' ? 'sad' : mood} size={110} />
        </Fighter>
        <span className="duel-vs">VS</span>
        <Fighter name="Anda" hp={hp.me} hit={hit?.who === 'me' ? hit : null}>
          <AnimalAvatar avatar={avatar} size={96} mood={hit?.who === 'me' ? 'sad' : 'happy'} />
        </Fighter>
      </div>

      <p className="duel-log">{log}{combo >= 2 && <span className="duel-combo"> <Emoji e="🔥" /> Kombo ×{combo}</span>}</p>

      {!over && (
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
            <GameQuestion question={playing.q} eyebrow={`${CARD[playing.card.level].name} · ${CARD[playing.card.level].power} serangan`}
              onAnswer={onAnswer} onDone={resolved} winText="Serangan kena!" loseText="Serangan terlepas" />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Fighter({ name, hp, hit, enemy, children }) {
  const pct = (hp / MAX_HP) * 100;
  return (
    <div className={'fighter' + (enemy ? ' is-enemy' : '')}>
      <motion.div className="fighter-art" animate={hit ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }} transition={{ duration: 0.5 }}>
        {children}
        <AnimatePresence>
          {hit && (
            <motion.span key={hit.id} className="dmg-pop" initial={{ y: 0, opacity: 0, scale: 0.6 }} animate={{ y: -40, opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              −{hit.amount}<small>{hit.text}</small>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
      <b className="fighter-name">{name}</b>
      <span className={'hp-bar' + (pct <= 30 ? ' is-low' : '')}><motion.span animate={{ width: pct + '%' }} /></span>
      <span className="hp-text"><Emoji e="❤️" /> {hp}/{MAX_HP}</span>
    </div>
  );
}
