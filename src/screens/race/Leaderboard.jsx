// Papan kedudukan langsung dan podium perlumbaan.
import { motion } from 'motion/react';
import { ranking } from '../../lib/race.js';
import { teamById, teamStandings } from '../../lib/raceModes.js';
import Emoji from '../../components/Emoji.jsx';
import AnimalAvatar from '../../components/AnimalAvatar.jsx';

const MEDALS = ['🥇', '🥈', '🥉'];

export function Leaderboard({ players, total, me, compact = false, onOpen, race = null }) {
  const rows = ranking(players, race);
  const survival = race?.mode === 'kalah-mati';
  if (!rows.length) return <p className="alert">Belum ada pemain.</p>;
  return (
    <ol className={'leaderboard' + (compact ? ' is-compact' : '')}>
      {rows.map((p, i) => (
        <motion.li key={p.uid} layout transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={'lb-row' + (p.uid === me ? ' is-me' : '') + (p.finished ? ' is-finished' : '') + (p.out ? ' is-out' : '')}
          style={p.team ? { '--team': teamById(p.team)?.color } : undefined}>
          <span className="lb-rank">{MEDALS[i] ? <Emoji e={MEDALS[i]} size="1.6rem" /> : i + 1}</span>
          <button className="lb-avatar" onClick={() => onOpen?.(p)} aria-label={'Profil ' + p.name}>
            <AnimalAvatar avatar={p.avatar} size={40} />
          </button>
          <span className="lb-main">
            <span className="lb-name">
              {p.team && <span className="lb-team-dot" aria-label={'Pasukan ' + teamById(p.team)?.name} />}
              {p.name}{p.uid === me && ' (anda)'}
              {survival && (
                <span className="lb-lives" aria-label={p.out ? 'Tersingkir' : `${p.lives} nyawa`}>
                  {p.out ? <Emoji e="💀" size="1.1rem" /> : Array.from({ length: p.lives || 0 }, (_, k) => <Emoji key={k} e="❤️" size="0.95rem" />)}
                </span>
              )}
            </span>
            <span className="lb-track" aria-label={`${p.answered}/${total} dijawab`}>
              <span className="lb-track-bar" style={{ width: (total ? (p.answered / total) * 100 : 0) + '%' }} />
              <span className="lb-runner" style={{ left: `calc(${total ? (p.answered / total) * 100 : 0}% - 12px)` }}>
                <Emoji e={p.out ? '💀' : p.finished ? '🏁' : '🏃'} size="1.3rem" />
              </span>
            </span>
          </span>
          <span className="lb-score">{p.score.toLocaleString('ms-MY')}</span>
        </motion.li>
      ))}
    </ol>
  );
}

// Kedudukan pasukan: bar purata mata setiap pasukan.
export function TeamBoard({ players, race, me }) {
  const standings = teamStandings(players, race);
  const best = Math.max(1, ...standings.map(s => s.avg));
  const mine = players?.[me]?.team;
  return (
    <ol className="team-board">
      {standings.map((s, i) => (
        <motion.li key={s.team.id} layout className={'team-row' + (s.team.id === mine ? ' is-mine' : '')} style={{ '--team': s.team.color }}>
          <span className="team-place">{MEDALS[i] ? <Emoji e={MEDALS[i]} size="1.5rem" /> : i + 1}</span>
          <span className="team-main">
            <span className="team-name"><Emoji e={s.team.emoji} /> Pasukan {s.team.name} <span className="muted small">· {s.members.length} ahli</span></span>
            <span className="team-bar"><motion.span animate={{ width: (s.avg / best) * 100 + '%' }} /></span>
          </span>
          <span className="team-score" title={`Jumlah ${s.total.toLocaleString('ms-MY')}`}>{s.avg.toLocaleString('ms-MY')}<small>purata</small></span>
        </motion.li>
      ))}
    </ol>
  );
}

export function Podium({ players, race = null }) {
  const top = ranking(players, race).slice(0, 3);
  // Susunan paparan: kedua, pertama, ketiga.
  const order = [top[1], top[0], top[2]];
  const heights = [110, 150, 80];
  return (
    <div className="podium">
      {order.map((p, i) => p ? (
        <motion.div key={p.uid} className={'podium-col place-' + (i === 1 ? 1 : i === 0 ? 2 : 3)}
          initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: [0.4, 0.8, 0.1][i], type: 'spring', damping: 14 }}>
          <AnimalAvatar avatar={p.avatar} size={56} />
          <span className="podium-name">{p.name}</span>
          <span className="podium-score">{p.score.toLocaleString('ms-MY')}</span>
          <span className="podium-block" style={{ height: heights[i] }}><Emoji e={MEDALS[i === 1 ? 0 : i === 0 ? 1 : 2]} size="2.4rem" /></span>
        </motion.div>
      ) : <div key={i} className="podium-col" />)}
    </div>
  );
}
