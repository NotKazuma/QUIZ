// Kad kuasa khas permainan arked (berasingan daripada kuasa kedai): diperoleh & digunakan dalam permainan sahaja.
import { AnimatePresence, motion } from 'motion/react';
import Emoji from '../../components/Emoji.jsx';

export const POWER_CARDS = {
  ular: {
    dadu2: { emoji: '🎲', name: 'Dadu Berganda', desc: 'Baling dua dadu giliran ini', color: '#1cb0f6' },
    penangkis: { emoji: '🛡️', name: 'Penangkis Ular', desc: 'Kebal gigitan ular giliran ini', color: '#58cc02' },
    roket: { emoji: '🚀', name: 'Roket', desc: '+3 petak selepas baling dadu', color: '#ff9600' },
    beku: { emoji: '🧊', name: 'Bekukan Lawan', desc: 'Lawan paling depan terlepas satu giliran', color: '#2ec4e6' },
  },
  duel: {
    perisai: { emoji: '🛡️', name: 'Perisai Besi', desc: 'Halang serangan seterusnya', color: '#f59e0b' },
    api: { emoji: '🔥', name: 'Serangan Api', desc: 'Serangan betul seterusnya ×2', color: '#ff4b4b' },
    ramuan: { emoji: '🧪', name: 'Ramuan Hidup', desc: '+20 nyawa serta-merta', color: '#14b8a6' },
    tukar: { emoji: '🔄', name: 'Tukar Kad', desc: 'Tukar semua kad serangan', color: '#ce82ff' },
  },
  padanan: {
    intip: { emoji: '👁️', name: 'Intip', desc: 'Lihat semua kad 1.5 saat', color: '#ce82ff' },
    petunjuk: { emoji: '🔍', name: 'Petunjuk', desc: 'Tunjuk satu pasangan sekejap', color: '#1cb0f6' },
  },
};
export const MAX_POWER_CARDS = 4;

export function randomPower(game) {
  const ids = Object.keys(POWER_CARDS[game]);
  return ids[Math.floor(Math.random() * ids.length)];
}
export const randomPowers = (game, n) => Array.from({ length: n }, () => randomPower(game));

// Baris kad kuasa pemain. `cards` = senarai id; onUse(index, id).
export default function PowerCards({ game, cards = [], onUse, disabled, title = 'Kad kuasa' }) {
  const defs = POWER_CARDS[game];
  return (
    <div className="pcards">
      <span className="pcards-title"><Emoji e="✨" /> {title}</span>
      <div className="pcards-row">
        <AnimatePresence initial={false}>
          {cards.map((id, i) => {
            const c = defs[id];
            if (!c) return null;
            return (
              <motion.button key={id + i} layout className="pcard" style={{ '--pc': c.color }} disabled={disabled}
                initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, y: -30, opacity: 0 }}
                whileTap={{ scale: 0.92 }} onClick={() => onUse(i, id)} title={c.desc} aria-label={`${c.name}: ${c.desc}`}>
                <Emoji e={c.emoji} size="1.7rem" />
                <b>{c.name}</b>
                <span>{c.desc}</span>
              </motion.button>
            );
          })}
        </AnimatePresence>
        {!cards.length && <span className="muted small pcards-empty">Tiada kad — dapatkan dalam permainan!</span>}
      </div>
    </div>
  );
}

// Lencana kesan aktif (cth. "Dadu Berganda aktif").
export function ActiveEffects({ game, effects }) {
  const on = Object.keys(effects || {}).filter(k => effects[k] && POWER_CARDS[game][k]);
  if (!on.length) return null;
  return (
    <div className="power-status">
      {on.map(k => <span key={k}><Emoji e={POWER_CARDS[game][k].emoji} /> {POWER_CARDS[game][k].name} aktif</span>)}
    </div>
  );
}
