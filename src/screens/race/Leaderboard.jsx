// Papan kedudukan langsung dan podium perlumbaan.
import { motion } from 'motion/react';
import { ranking } from '../../lib/race.js';

const MEDALS = ['🥇', '🥈', '🥉'];

export function Leaderboard({ players, total, me, compact = false }) {
  const rows = ranking(players);
  if (!rows.length) return <p className="alert">Belum ada pemain.</p>;
  return (
    <ol className={'leaderboard' + (compact ? ' is-compact' : '')}>
      {rows.map((p, i) => (
        <motion.li key={p.uid} layout transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={'lb-row' + (p.uid === me ? ' is-me' : '') + (p.finished ? ' is-finished' : '')}>
          <span className="lb-rank">{MEDALS[i] || i + 1}</span>
          <span className="lb-main">
            <span className="lb-name">{p.name}{p.uid === me && ' (anda)'}</span>
            <span className="lb-track" aria-label={`${p.answered}/${total} dijawab`}>
              <span className="lb-track-bar" style={{ width: (total ? (p.answered / total) * 100 : 0) + '%' }} />
              <span className="lb-runner" style={{ left: `calc(${total ? (p.answered / total) * 100 : 0}% - 12px)` }}>
                {p.finished ? '🏁' : '🏃'}
              </span>
            </span>
          </span>
          <span className="lb-score">{p.score.toLocaleString('ms-MY')}</span>
        </motion.li>
      ))}
    </ol>
  );
}

export function Podium({ players }) {
  const top = ranking(players).slice(0, 3);
  // Susunan paparan: kedua, pertama, ketiga.
  const order = [top[1], top[0], top[2]];
  const heights = [110, 150, 80];
  return (
    <div className="podium">
      {order.map((p, i) => p ? (
        <motion.div key={p.uid} className={'podium-col place-' + (i === 1 ? 1 : i === 0 ? 2 : 3)}
          initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: [0.4, 0.8, 0.1][i], type: 'spring', damping: 14 }}>
          <span className="podium-name">{p.name}</span>
          <span className="podium-score">{p.score.toLocaleString('ms-MY')}</span>
          <span className="podium-block" style={{ height: heights[i] }}>{MEDALS[i === 1 ? 0 : i === 0 ? 1 : 2]}</span>
        </motion.div>
      ) : <div key={i} className="podium-col" />)}
    </div>
  );
}
