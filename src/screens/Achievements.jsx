import CountUp from '../components/bits/CountUp.jsx';
import SpotlightCard from '../components/bits/SpotlightCard.jsx';
import { BackButton, LinkReminder, PageHead, Progress, Reveal } from '../components/ui.jsx';
import { ACHIEVEMENTS } from '../lib/achievements.js';

// Senarai pencapaian (dibuka & belum) dan ringkasan statistik pengguna.
export default function Achievements({ user, config, stats, unlocked, onBack, onLink }) {
  const ctx = { user, config };
  const opened = ACHIEVEMENTS.filter(a => unlocked[a.id]).length;
  const accuracy = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0;

  // Yang sudah dibuka dahulu (terbaru di atas), kemudian yang paling hampir dibuka.
  const items = ACHIEVEMENTS.map(a => {
    const [v, target] = a.progress(stats, ctx);
    return { ...a, at: unlocked[a.id], value: Math.min(v, target), target };
  }).sort((a, b) => {
    if (a.at && b.at) return b.at.localeCompare(a.at);
    if (a.at || b.at) return a.at ? -1 : 1;
    return b.value / b.target - a.value / a.target;
  });

  return (
    <section className="screen">
      <BackButton onClick={onBack} />
      <PageHead badge={`${opened}/${ACHIEVEMENTS.length} dibuka`} title="Pencapaian" />

      {user.isGuest && <Reveal className="spaced"><LinkReminder onLink={onLink} compact /></Reveal>}

      <Reveal className="stats stats-4">
        <Stat value={stats.answered} label="soalan dijawab" />
        <Stat value={accuracy} suffix="%" label="ketepatan" />
        <Stat value={stats.quizzes} label="latihan tamat" />
        <Stat value={stats.dayStreak} label="hari berturut" />
      </Reveal>

      <div className="badge-grid">
        {items.map((a, i) => (
          <Reveal key={a.id} index={Math.min(i, 8)} distance={24}>
            <SpotlightCard className={'card badge-card' + (a.at ? ' is-unlocked' : '')}
              spotlightColor={a.at ? 'rgba(245, 158, 11, 0.25)' : 'rgba(20, 184, 166, 0.15)'}>
              <span className="badge-emoji" aria-hidden="true">{a.emoji}</span>
              <span className="badge-title">{a.title}</span>
              <span className="badge-desc">{a.desc}</span>
              {a.at ? (
                <span className="badge-date">
                  ✓ {new Date(a.at).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              ) : (
                <span className="badge-progress">
                  <Progress value={(a.value / a.target) * 100} />
                  <span>{a.value}/{a.target}</span>
                </span>
              )}
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Stat({ value, suffix = '', label }) {
  return (
    <div className="stat">
      <span className="stat-num">{value ? <CountUp to={value} duration={1.2} /> : 0}{suffix}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
