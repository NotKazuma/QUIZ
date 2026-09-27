import { ActionCard, BackButton, PageHead } from '../components/ui.jsx';
import { yearOf } from '../lib/quiz.js';

export default function YearSelect({ subject, questions, onBack, onStart }) {
  let body;
  if (questions === null) {
    body = <p className="alert">Memuatkan soalan…</p>;
  } else if (questions.error) {
    body = <p className="alert">Ralat: {questions.error}</p>;
  } else if (questions.length === 0) {
    body = <p className="alert">Tiada soalan lagi untuk subjek ini.</p>;
  } else {
    // Senarai tahun unik, terbaru dahulu.
    const years = [...new Set(questions.map(yearOf))].sort().reverse();
    body = (
      <div className="card-list">
        <ActionCard icon="layers" title="Semua tahun"
          desc={questions.length + ' soalan'} onClick={() => onStart(questions)} />
        {years.map(year => {
          const qs = questions.filter(q => yearOf(q) === year);
          return (
            <ActionCard key={year} className="year-card" icon={year} title={'Tahun ' + year}
              desc={qs[0].source + ' · ' + qs.length + ' soalan'} onClick={() => onStart(qs)} />
          );
        })}
      </div>
    );
  }

  return (
    <section className="screen">
      <BackButton onClick={onBack} />
      <PageHead badge={subject?.name} title="Pilih tahun" />
      {body}
    </section>
  );
}
