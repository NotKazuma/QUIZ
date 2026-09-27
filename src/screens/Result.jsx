import { Suspense, lazy, useEffect, useState } from 'react';
import CountUp from '../components/bits/CountUp.jsx';
import GradientText from '../components/bits/GradientText.jsx';
import SplitText from '../components/bits/SplitText.jsx';
import { GlowButton, LinkReminder, Progress, REDUCED_MOTION, Reveal } from '../components/ui.jsx';

const Celebration = lazy(() => import('../components/Celebration.jsx'));

// Skrin keputusan ringkas (senarai soalan salah pada fasa kemudian).
export default function Result({ result, user, onLink, onRetry, onSubjects, onHome }) {
  const { score, total, exam, subject } = result;
  const percent = Math.round((score / total) * 100);
  const [bar, setBar] = useState(0);

  // Bar markah bergerak serentak dengan kiraan nombor.
  useEffect(() => {
    const id = requestAnimationFrame(() => setBar(percent));
    return () => cancelAnimationFrame(id);
  }, [percent]);

  let emoji = '💪', title = 'Teruskan usaha!';
  if (percent >= 80) { emoji = '🌟'; title = 'Cemerlang!'; }
  else if (percent >= 60) { emoji = '👍'; title = 'Bagus!'; }
  const celebrate = percent >= 60 && !REDUCED_MOTION;

  return (
    <section className="screen">
      <div className="card result-card">
        {celebrate && (
          <div className="result-balls" aria-hidden="true">
            <Suspense fallback={null}><Celebration /></Suspense>
          </div>
        )}
        <div className="result-emoji" aria-hidden="true">{emoji}</div>
        <SplitText text={title} tag="h2" className="result-title" delay={45} duration={0.8}
          from={{ opacity: 0, y: 30, scale: 0.6 }} to={{ opacity: 1, y: 0, scale: 1 }}
          ease="back.out(2)" rootMargin="0px" />
        <p className="muted">{exam} · {subject}</p>
        <div className="result-score">
          <GradientText className="result-percent" colors={['#14b8a6', '#f59e0b', '#22c55e', '#14b8a6']}
            animationSpeed={4}>
            <CountUp to={percent} duration={1.2} />%
          </GradientText>
          <span className="muted">{score} daripada {total} betul</span>
        </div>
        <Progress value={bar} large />
      </div>
      {user.isGuest && <Reveal className="spaced"><LinkReminder onLink={onLink} compact /></Reveal>}
      <div className="card-list">
        <Reveal index={1}><GlowButton className="glow-lg" onClick={onRetry}>Ulang latihan</GlowButton></Reveal>
        <Reveal index={2}><button className="btn btn-outline btn-lg" onClick={onSubjects}>Pilih subjek lain</button></Reveal>
        <Reveal index={3}><button className="btn btn-ghost btn-lg" onClick={onHome}>Halaman utama</button></Reveal>
      </div>
    </section>
  );
}
