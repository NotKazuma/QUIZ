// Pengurus soalan: senarai, tapis, sunting, tambah, padam dan tandakan "sudah disemak".
// Simpanan pertama bagi satu subjek menyalin semua soalan ke Firestore (subjects/{exam}__{subjek});
// selepas itu laman membaca soalan subjek tersebut dari Firestore, bukan dari fail JSON.
import { useEffect, useMemo, useState } from 'react';
import { DifficultyBadge } from '../Challenge.jsx';
import { loadSubjectDoc, saveSubjectDoc } from '../../lib/firebase.js';
import { DIFFICULTY, DIFFICULTY_ORDER } from '../../lib/challenge.js';
import { loadStaticQuestions, setCachedQuestions, subjectDocId } from '../../lib/quiz.js';
import QuestionEditor from './QuestionEditor.jsx';

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
  const [editing, setEditing] = useState(null); // soalan yang disunting (atau baharu)

  const [search, setSearch] = useState('');
  const [onlyReview, setOnlyReview] = useState(false);
  const [level, setLevel] = useState('');

  useEffect(() => {
    if (!subject) return;
    let alive = true;
    setQuestions(null);
    setEditing(null);
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

  async function saveQuestion(q) {
    const exists = questions.some(x => x.id === q.id);
    const next = exists ? questions.map(x => (x.id === q.id ? q : x)) : [...questions, q];
    if (await persist(next)) setEditing(null);
  }

  async function deleteQuestion(q) {
    if (!confirm('Padam soalan ini? Tindakan ini tidak boleh dibatalkan.')) return;
    if (await persist(questions.filter(x => x.id !== q.id))) setEditing(null);
  }

  function markReviewed(q) {
    persist(questions.map(x => (x.id === q.id ? { ...x, perlu_semak: false } : x)));
  }

  function newQuestion() {
    setEditing({
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
    });
  }

  const counts = useMemo(() => ({
    total: questions?.length || 0,
    review: (questions || []).filter(q => q.perlu_semak).length,
  }), [questions]);

  const shown = (questions || []).filter(q => {
    if (onlyReview && !q.perlu_semak) return false;
    if (level && (q.difficulty || 'sederhana') !== level) return false;
    const s = search.trim().toLowerCase();
    return !s || q.question.toLowerCase().includes(s) || q.id.toLowerCase().includes(s);
  });

  if (editing) {
    return (
      <QuestionEditor question={editing} saving={saving}
        isNew={!questions?.some(x => x.id === editing.id)}
        onCancel={() => setEditing(null)} onSave={saveQuestion} onDelete={deleteQuestion} />
    );
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
        <>
          <p className="muted small">
            {counts.total} soalan · <b>{counts.review}</b> perlu disemak ·{' '}
            {fromCloud ? '☁️ disunting dalam web (Firestore)' : '📄 dari fail JSON asal'}
          </p>

          <div className="admin-toolbar">
            <input className="input" type="search" placeholder="Cari soalan atau ID…" value={search}
              onChange={e => setSearch(e.target.value)} />
            <select className="input input-auto" value={level} onChange={e => setLevel(e.target.value)} aria-label="Tahap">
              <option value="">Semua tahap</option>
              {DIFFICULTY_ORDER.map(l => <option key={l} value={l}>{DIFFICULTY[l].label}</option>)}
            </select>
            <label className="check">
              <input type="checkbox" checked={onlyReview} onChange={e => setOnlyReview(e.target.checked)} />
              Perlu semak sahaja
            </label>
          </div>

          <button className="btn btn-primary btn-lg" onClick={newQuestion}>+ Tambah soalan</button>

          <div className="q-list">
            {shown.map(q => {
              const rtl = q.script === 'jawi' || q.script === 'arab';
              return (
                <div key={q.id} className={'card q-row' + (q.perlu_semak ? ' needs-review' : '')}>
                  <button className="q-row-main" onClick={() => setEditing(q)}>
                    <span className="q-row-meta">
                      <code>{q.id}</code>
                      <DifficultyBadge level={q.difficulty} />
                      {q.type !== 'objektif' && <span className="role role-guest">{q.type}</span>}
                      {q.source && <span className="muted small">{q.source}</span>}
                    </span>
                    <span className={'q-row-text' + (rtl ? ' script-arabic' : '')} dir={rtl ? 'rtl' : 'auto'}>
                      {q.question}
                    </span>
                    {q.type === 'objektif' && (
                      <span className={'q-row-answer' + (rtl ? ' script-arabic' : '')} dir={rtl ? 'rtl' : 'auto'}>
                        ✓ {q.options[q.answer]}
                      </span>
                    )}
                    {q.perlu_semak && q.nota_semak && <span className="q-row-note">⚠️ {q.nota_semak}</span>}
                  </button>
                  {q.perlu_semak && (
                    <button className="btn btn-outline btn-sm" disabled={saving} onClick={() => markReviewed(q)}>
                      ✓ Sudah disemak
                    </button>
                  )}
                </div>
              );
            })}
            {!shown.length && <p className="alert">Tiada soalan sepadan.</p>}
          </div>
        </>
      )}
    </div>
  );
}
