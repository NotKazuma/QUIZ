import { Suspense, lazy } from 'react';
import CountUp from '../components/bits/CountUp.jsx';
import SplitText from '../components/bits/SplitText.jsx';
import Mascot from '../components/Mascot.jsx';
import { GlowButton, LinkReminder, REDUCED_MOTION, Reveal } from '../components/ui.jsx';

const Celebration = lazy(() => import('../components/Celebration.jsx'));

// Skrin tamat latihan/cabaran: Belang bersorak, tiga kotak statistik berwarna.
export default function Result({ result, user, onLink, onRetry, onSubjects, onHome }) {
  const { score, total, exam, subject } = result;
  const percent = Math.round((score / total) * 100);
  const challenge = result.mode === 'challenge';

  let title = 'Teruskan usaha!';
  let mood = 'happy';
  if (percent >= 80) { title = challenge ? 'Cabaran selesai!' : 'Cemerlang!'; mood = 'cheer'; }
  else if (percent >= 60) { title = 'Bagus!'; mood = 'cheer'; }
  const celebrate = percent >= 60 && !REDUCED_MOTION;

  return (
    <section className="screen result">
      <div className="card result-card">
        {celebrate && (
          <div className="result-balls" aria-hidden="true">
            <Suspense fallback={null}><Celebration /></Suspense>
          </div>
        )}
        <Mascot mood={mood} size={140} />
        <SplitText text={title} tag="h2" className="result-title" delay={45} duration={0.8}
          from={{ opacity: 0, y: 30, scale: 0.6 }} to={{ opacity: 1, y: 0, scale: 1 }}
          ease="back.out(2)" rootMargin="0px" />
        <p className="muted">{exam} · {subject}</p>

        <div className="result-boxes">
          <div className="result-box c-yellow">
            <span>{challenge ? 'Mata' : 'XP'}</span>
            <span>⚡ <CountUp to={challenge ? result.points : score * 10} duration={1.4} separator="," /></span>
          </div>
          <div className="result-box c-green">
            <span>Ketepatan</span>
            <span>🎯 <CountUp to={percent} duration={1.2} />%</span>
          </div>
          <div className="result-box c-blue">
            <span>{challenge ? 'Berturut' : 'Betul'}</span>
            <span>{challenge ? <>🔥 {result.bestStreak}</> : <>✅ {score}/{total}</>}</span>
          </div>
        </div>
        {challenge && result.redeem.tried > 0 && (
          <p className="muted small">🎯 Soalan tebusan berjaya: {result.redeem.success}/{result.redeem.tried}</p>
        )}
      </div>

      {user.isGuest && <Reveal className="spaced"><LinkReminder onLink={onLink} compact /></Reveal>}
      <div className="card-list">
        <Reveal index={1}><GlowButton className="glow-lg" onClick={onRetry}>{challenge ? 'Cabar lagi' : 'Ulang latihan'}</GlowButton></Reveal>
        <Reveal index={2}><button className="btn btn-outline btn-lg" onClick={onSubjects}>Pilih subjek lain</button></Reveal>
        <Reveal index={3}><button className="btn btn-ghost btn-lg" onClick={onHome}>Halaman utama</button></Reveal>
      </div>
    </section>
  );
}
