import Aurora from '../components/bits/Aurora.jsx';
import BlurText from '../components/bits/BlurText.jsx';
import ShinyText from '../components/bits/ShinyText.jsx';
import { ActionCard } from '../components/ui.jsx';
import { useMediaQuery } from '../lib/useMediaQuery.js';
import { EXAM_DESC } from '../lib/quiz.js';

export default function Home({ config, error, onSelectExam }) {
  const dark = useMediaQuery('(prefers-color-scheme: dark)');
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  return (
    <section className="screen">
      {/* Latar aurora lembut di belakang tajuk (dimatikan jika pengguna minta kurang animasi) */}
      {!reduceMotion && (
        <div className="hero-bg" aria-hidden="true">
          <Aurora
            colorStops={dark ? ['#0f766e', '#2dd4bf', '#f59e0b'] : ['#5eead4', '#99f6e4', '#fcd34d']}
            amplitude={0.9}
            blend={0.6}
            speed={0.6}
            lightMode={!dark}
          />
        </div>
      )}

      <div className="hero">
        <p className="eyebrow">
          <ShinyText text="Assalamualaikum!" speed={3}
            color={dark ? '#2dd4bf' : '#0f766e'} shineColor={dark ? '#ccfbf1' : '#5eead4'} />
        </p>
        <BlurText text="Jom ulang kaji" className="hero-title" delay={120} animateBy="words" />
        <p className="muted">Pilih peperiksaan untuk mula berlatih.</p>
      </div>

      {error && <p className="alert">{error}</p>}

      <div className="card-list">
        {config?.exams.map(exam => (
          <ActionCard key={exam.id}
            className="exam-card"
            icon={exam.id}
            title={exam.name}
            desc={(EXAM_DESC[exam.id] || '') + ' · ' + exam.subjects.length + ' subjek'}
            onClick={() => onSelectExam(exam)} />
        ))}
        <ActionCard icon="chart" title="Kemajuan" desc="Lihat markah dan topik lemah" disabled soon />
      </div>
    </section>
  );
}
