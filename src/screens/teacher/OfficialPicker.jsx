// Pilih soalan daripada bank rasmi (baca sahaja) untuk disalin ke set cikgu.
import { useEffect, useState } from 'react';
import QuestionBank from '../../components/QuestionBank.jsx';
import { BackButton, PageHead } from '../../components/ui.jsx';
import { loadQuestions } from '../../lib/quiz.js';

export default function OfficialPicker({ config, targetTitle, onBack, onAdd }) {
  const exams = config?.exams || [];
  const [examId, setExamId] = useState(exams[0]?.id);
  const exam = exams.find(e => e.id === examId);
  const [subjectId, setSubjectId] = useState(exam?.subjects[0]?.id);
  const subject = exam?.subjects.find(s => s.id === subjectId);
  const [questions, setQuestions] = useState(null);

  useEffect(() => {
    if (!subject) return;
    setQuestions(null);
    loadQuestions(subject.file).then(setQuestions).catch(() => setQuestions([]));
  }, [subject]);

  return (
    <section>
      <BackButton onClick={onBack} />
      <PageHead badge={'Tambah ke: ' + targetTitle} title="Bank soalan rasmi" />
      <p className="muted small">Tandakan soalan yang anda mahu, kemudian tekan <b>Tambah ke set</b>. Soalan asal tidak berubah.</p>
      <div className="chips">
        {exams.map(e => (
          <button key={e.id} className={'chip' + (e.id === examId ? ' is-active' : '')}
            onClick={() => { setExamId(e.id); setSubjectId(e.subjects[0]?.id); }}>{e.name}</button>
        ))}
      </div>
      <select className="input" value={subjectId} onChange={e => setSubjectId(e.target.value)} aria-label="Subjek">
        {exam?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      {!questions ? <p className="alert">Memuatkan soalan…</p> : (
        <QuestionBank key={subject.id} questions={questions} editable={false}
          extraBulk={[{ label: '📥 Tambah ke set', onRun: onAdd }]} />
      )}
    </section>
  );
}
