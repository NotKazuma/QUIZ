import { useEffect, useState } from 'react';
import CountUp from '../components/bits/CountUp.jsx';
import { ActionCard, BackButton, PageHead, Reveal } from '../components/ui.jsx';
import { filterByYear, loadExamQuestions } from '../lib/quiz.js';

// Pilih subjek; bilangan soalan mengikut tahun yang dipilih (null = semua tahun).
export default function SubjectSelect({ exam, year, mode, onBack, onSelect }) {
  const [bySubject, setBySubject] = useState(null);

  useEffect(() => {
    let alive = true;
    loadExamQuestions(exam).then(r => { if (alive) setBySubject(r); });
    return () => { alive = false; };
  }, [exam]);

  return (
    <section className="screen">
      <BackButton onClick={onBack} />
      <PageHead badge={[exam.name, year ? 'Tahun ' + year : 'Semua tahun', mode === 'challenge' && '⚡ Cabaran'].filter(Boolean).join(' · ')}
        title="Pilih subjek" />
      <div className="card-list">
        {exam.subjects.map((s, i) => {
          const qs = bySubject?.[s.id];
          const selected = qs ? filterByYear(qs, year) : null;
          return (
            <Reveal key={s.id} index={i}>
              <ActionCard icon={String(i + 1)} title={s.name}
                desc={describe(bySubject, qs, selected)}
                disabled={!!bySubject && !selected?.length}
                onClick={() => onSelect(s, selected)} />
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

// Bilangan soalan dikira naik (React Bits CountUp).
function describe(loaded, qs, selected) {
  if (!loaded) return 'Memuatkan…';
  if (qs === null) return 'Ralat memuat soalan';
  if (!selected.length) return qs.length ? 'Tiada soalan tahun ini' : 'Tiada soalan lagi';
  return <><CountUp to={selected.length} duration={1} /> soalan</>;
}
