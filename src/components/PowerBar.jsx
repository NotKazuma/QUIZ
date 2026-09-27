// Bar kuasa semasa Cabaran & Perlumbaan: 50:50, Masa +15s, Mata Ganda, Perisai, Langkau.
// Setiap kuasa boleh digunakan sekali bagi setiap soalan.
import { useState } from 'react';
import { motion } from 'motion/react';
import Emoji from './Emoji.jsx';
import { POWERUPS } from '../lib/shop.js';
import { powerupCount } from '../lib/wallet.js';

const FRESH = { hidden: [], bonusMs: 0, double: false, shield: false, used: {} };

// Keadaan kesan kuasa untuk soalan semasa.
export function usePowerRound() {
  const [fx, setFx] = useState(FRESH);
  return { fx, setFx, reset: () => setFx(FRESH) };
}

// Kira kesan satu kuasa pada soalan `q`; pulangkan fx baharu (Langkau ditangani oleh pemanggil).
export function applyPower(fx, id, q) {
  const next = { ...fx, used: { ...fx.used, [id]: true } };
  if (id === 'fifty') {
    const wrong = q.options.map((_, i) => i).filter(i => i !== q.answer && !fx.hidden.includes(i));
    const remove = Math.max(0, Math.min(2, q.options.length - 2));
    next.hidden = [...fx.hidden, ...wrong.sort(() => Math.random() - 0.5).slice(0, remove)];
  }
  if (id === 'time') next.bonusMs = fx.bonusMs + 15000;
  if (id === 'double') next.double = true;
  if (id === 'shield') next.shield = true;
  return next;
}

export default function PowerBar({ stats, fx, disabled, onUse, allow = POWERUPS.map(p => p.id) }) {
  return (
    <div className="power-bar" role="toolbar" aria-label="Kuasa">
      {POWERUPS.filter(p => allow.includes(p.id)).map(p => {
        const n = powerupCount(stats, p.id);
        const used = fx.used[p.id];
        return (
          <motion.button key={p.id} className={'power-btn' + (used ? ' is-used' : '')}
            whileTap={{ scale: 0.9 }} disabled={disabled || !n || used}
            onClick={() => onUse(p.id)} title={`${p.name}: ${p.desc}`} aria-label={`${p.name} (${n})`}>
            <Emoji e={p.emoji} size="1.7rem" />
            <span className="power-count">{n}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// Lencana kesan aktif (cth. "Mata Ganda aktif").
export function PowerStatus({ fx }) {
  const tags = [];
  if (fx.double) tags.push(['✖️', 'Mata ganda']);
  if (fx.shield) tags.push(['🛡️', 'Perisai']);
  if (fx.bonusMs) tags.push(['⏱️', `+${fx.bonusMs / 1000}s`]);
  if (!tags.length) return null;
  return (
    <div className="power-status">
      {tags.map(([e, t]) => <span key={t}><Emoji e={e} /> {t}</span>)}
    </div>
  );
}
