import { useEffect, useState } from 'react';
import CountUp from '../components/bits/CountUp.jsx';
import { Progress } from '../components/ui.jsx';

// Skrin keputusan ringkas (senarai soalan salah pada fasa kemudian).
export default function Result({ result, onRetry, onSubjects, onHome }) {
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

  return (
    <section className="screen">
      <div className="card result-card">
        <div className="result-emoji" aria-hidden="true">{emoji}</div>
        <h2>{title}</h2>
        <p className="muted">{exam} · {subject}</p>
        <div className="result-score">
          <span className="result-percent">
            <CountUp to={percent} duration={1.2} />%
          </span>
          <span className="muted">{score} daripada {total} betul</span>
        </div>
        <Progress value={bar} large />
      </div>
      <div className="card-list">
        <button className="btn btn-primary btn-lg" onClick={onRetry}>Ulang latihan</button>
        <button className="btn btn-outline btn-lg" onClick={onSubjects}>Pilih subjek lain</button>
        <button className="btn btn-ghost btn-lg" onClick={onHome}>Halaman utama</button>
      </div>
    </section>
  );
}
