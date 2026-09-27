import { useEffect, useState } from 'react';
import { ActionCard, BackButton, PageHead, Reveal } from '../components/ui.jsx';
import { loadExamQuestions, yearOf } from '../lib/quiz.js';

// Pilih tahun kertas soalan (dikumpul daripada semua subjek peperiksaan).
export default function YearSelect({ exam, onBack, onSelect }) {
  const [bySubject, setBySubject] = useState(null); // null = sedang dimuat

  useEffect(() => {
    let alive = true;
    loadExamQuestions(exam).then(r => { if (alive) setBySubject(r); });
    return () => { alive = false; };
  }, [exam]);

  let body;
  if (bySubject === null) {
    body = <p className="alert">Memuatkan soalan…</p>;
  } else {
    const all = Object.values(bySubject).filter(Boolean).flat();
    if (all.length === 0) {
      body = <p className="alert">Tiada soalan lagi untuk peperiksaan ini.</p>;
    } else {
      // Senarai tahun unik, terbaru dahulu.
      const years = [...new Set(all.map(yearOf))].sort().reverse();
      body = (
        <div className="card-list">
          <Reveal index={0}>
            <ActionCard icon="layers" title="Semua tahun"
              desc={all.length + ' soalan'} onClick={() => onSelect(null)} />
          </Reveal>
          {years.map((year, i) => {
            const n = all.filter(q => yearOf(q) === year).length;
            const subjects = Object.values(bySubject)
              .filter(qs => qs && qs.some(q => yearOf(q) === year)).length;
            return (
              <Reveal key={year} index={i + 1}>
                <ActionCard className="year-card" icon={year} title={'Tahun ' + year}
                  desc={`${exam.name} ${year} · ${n} soalan · ${subjects} subjek`}
                  onClick={() => onSelect(year)} />
              </Reveal>
            );
          })}
        </div>
      );
    }
  }

  return (
    <section className="screen">
      <BackButton onClick={onBack} />
      <PageHead badge={exam?.name} title="Pilih tahun" />
      {body}
    </section>
  );
}
