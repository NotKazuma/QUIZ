import { useEffect, useState } from 'react';
import { ActionCard, BackButton, PageHead } from '../components/ui.jsx';
import { loadQuestions, objectiveOnly } from '../lib/quiz.js';

export default function SubjectSelect({ exam, onBack, onSelect }) {
  // Bilangan soalan bagi setiap subjek, dimuat di belakang tabir.
  const [counts, setCounts] = useState({});

  useEffect(() => {
    let alive = true;
    exam.subjects.forEach(s => {
      loadQuestions(s.file)
        .then(qs => {
          const n = objectiveOnly(qs).length;
          if (alive) setCounts(c => ({ ...c, [s.id]: n ? n + ' soalan' : 'Tiada soalan lagi' }));
        })
        .catch(() => { if (alive) setCounts(c => ({ ...c, [s.id]: 'Ralat memuat soalan' })); });
    });
    return () => { alive = false; };
  }, [exam]);

  return (
    <section className="screen">
      <BackButton onClick={onBack} />
      <PageHead badge={exam.name} title="Pilih subjek" />
      <div className="card-list">
        {exam.subjects.map((s, i) => (
          <ActionCard key={s.id} icon={String(i + 1)} title={s.name}
            desc={counts[s.id] || 'Memuatkan…'} onClick={() => onSelect(s)} />
        ))}
      </div>
    </section>
  );
}
