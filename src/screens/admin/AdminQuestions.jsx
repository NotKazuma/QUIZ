// Bank soalan rasmi (admin). Simpanan pertama bagi satu subjek menyalin semua soalan ke Firestore
// (subjects/{exam}__{subjek}); selepas itu laman membaca soalan subjek tersebut dari Firestore, bukan fail JSON.
import { useEffect, useState } from 'react';
import QuestionBank from '../../components/QuestionBank.jsx';
import { loadSubjectDoc, saveSubjectDoc } from '../../lib/firebase.js';
import { loadStaticQuestions, setCachedQuestions, subjectDocId } from '../../lib/quiz.js';

export default function AdminQuestions({ me, config }) {
  const exams = config?.exams || [];
  const [examId, setExamId] = useState(exams[0]?.id);
  const exam = exams.find(e => e.id === examId);
  const [subjectId, setSubjectId] = useState(exam?.subjects[0]?.id);
  const subject = exam?.subjects.find(s => s.id === subjectId);

  const [questions, setQuestions] = useState(null);
  const [fromCloud, setFromCloud] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!subject) return;
    let alive = true;
    setQuestions(null);
    setError('');
    (async () => {
      const cloud = await loadSubjectDoc(subjectDocId(subject.file));
      const list = cloud || await loadStaticQuestions(subject.file).catch(e => { setError(e.message); return []; });
      if (!alive) return;
      setFromCloud(Boolean(cloud));
      setQuestions(list);
    })();
    return () => { alive = false; };
  }, [subject]);

  function changeExam(id) {
    setExamId(id);
    setSubjectId(exams.find(e => e.id === id)?.subjects[0]?.id);
  }

  // Simpan seluruh senarai soalan subjek ke Firestore.
  async function persist(next) {
    setSaving(true);
    try {
      await saveSubjectDoc(subjectDocId(subject.file), next, me.email);
      setCachedQuestions(subject.file, next);
      setQuestions(next);
      setFromCloud(true);
      return true;
    } catch (e) {
      alert('Gagal menyimpan: ' + (e.code || e.message) + '\nPastikan peraturan Firestore terkini sudah di-Publish.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  function newTemplate() {
    return {
      id: `${exam.id}-${subject.id}-${Date.now().toString(36)}`,
      exam: exam.name,
      subject: subject.name,
      topic: subject.name,
      type: 'objektif',
      difficulty: 'sederhana',
      script: questions?.[0]?.script || 'rumi',
      question: '',
      image: null,
      options: ['', '', '', ''],
      answer: 0,
      explanation: '',
      source: '',
      perlu_semak: false,
    };
  }

  return (
    <div className="admin-questions">
      <div className="chips">
        {exams.map(e => (
          <button key={e.id} className={'chip' + (e.id === examId ? ' is-active' : '')} onClick={() => changeExam(e.id)}>
            {e.name}
          </button>
        ))}
      </div>
      <select className="input" value={subjectId} onChange={e => setSubjectId(e.target.value)} aria-label="Subjek">
        {exam?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      {error && <p className="alert alert-warn">{error}</p>}
      {!questions ? <p className="alert">Memuatkan soalan…</p> : (
        <QuestionBank key={subject.id} questions={questions} saving={saving} onPersist={persist} newTemplate={newTemplate}
          header={<p className="muted small">{fromCloud ? '☁️ Disunting dalam web (Firestore)' : '📄 Dari fail JSON asal'}</p>} />
      )}
    </div>
  );
}
