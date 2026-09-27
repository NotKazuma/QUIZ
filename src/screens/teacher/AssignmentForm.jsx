// Borang cipta kerja rumah: pilih subjek, tahun, bilangan soalan, mod dan tarikh akhir.
// Soalan dipilih secara rawak semasa dicipta supaya semua murid dapat set yang sama.
import { useEffect, useMemo, useState } from 'react';
import { BackButton, GlowButton, PageHead } from '../../components/ui.jsx';
import { createAssignment } from '../../lib/classes.js';
import { filterByYear, loadQuestions, objectiveOnly, shuffle, yearOf } from '../../lib/quiz.js';

// Tarikh akhir lalai: 7 hari dari sekarang, jam 9 malam (format input datetime-local).
function defaultDue() {
  const d = new Date(Date.now() + 7 * 864e5);
  d.setHours(21, 0, 0, 0);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AssignmentForm({ cls, config, onCancel, onCreated }) {
  const exams = config?.exams || [];
  const [examId, setExamId] = useState(exams[0]?.id);
  const exam = exams.find(e => e.id === examId);
  const [subjectId, setSubjectId] = useState(exam?.subjects[0]?.id);
  const subject = exam?.subjects.find(s => s.id === subjectId);
  const [questions, setQuestions] = useState(null);
  const [year, setYear] = useState('');
  const [count, setCount] = useState(10);
  const [mode, setMode] = useState('practice');
  const [due, setDue] = useState(defaultDue);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!subject) return;
    setQuestions(null);
    loadQuestions(subject.file).then(qs => setQuestions(objectiveOnly(qs))).catch(() => setQuestions([]));
  }, [subject]);

  const years = useMemo(() => [...new Set((questions || []).map(yearOf))].sort().reverse(), [questions]);
  const available = questions ? filterByYear(questions, year || null) : [];
  const n = count === 'all' ? available.length : Math.min(count, available.length);

  async function submit(e) {
    e.preventDefault();
    if (!n) return;
    setBusy(true);
    try {
      const picked = shuffle(available).slice(0, n);
      const a = await createAssignment(cls.id, {
        title: title.trim() || `${exam.name} ${subject.name}${year ? ' ' + year : ''}`,
        examId: exam.id,
        examName: exam.name,
        subjectId: subject.id,
        subjectName: subject.name,
        year: year || null,
        questionIds: picked.map(q => q.id),
        mode,
        dueAt: due ? new Date(due).toISOString() : null,
      });
      onCreated({ ...a, classId: cls.id });
    } catch (err) {
      alert('Gagal mencipta kerja rumah: ' + (err.code || err.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="screen">
      <BackButton onClick={onCancel} />
      <PageHead badge={cls.name} title="Kerja rumah baharu" />
      <form className="card form-card" onSubmit={submit}>
        <label className="field">
          <span className="field-label">Tajuk (pilihan)</span>
          <input className="input" value={title} maxLength={60} placeholder={`${exam?.name ?? ''} ${subject?.name ?? ''}`}
            onChange={e => setTitle(e.target.value)} />
        </label>
        <div className="field-row">
          <label className="field">
            <span className="field-label">Peperiksaan</span>
            <select className="input" value={examId} onChange={e => {
              setExamId(e.target.value);
              setSubjectId(exams.find(x => x.id === e.target.value)?.subjects[0]?.id);
              setYear('');
            }}>
              {exams.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Subjek</span>
            <select className="input" value={subjectId} onChange={e => { setSubjectId(e.target.value); setYear(''); }}>
              {exam?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Tahun</span>
            <select className="input" value={year} onChange={e => setYear(e.target.value)}>
              <option value="">Semua tahun</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
        </div>
        <div className="field-row">
          <label className="field">
            <span className="field-label">Bilangan soalan</span>
            <select className="input" value={count} onChange={e => setCount(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
              {[5, 10, 15, 20, 30].map(c => <option key={c} value={c}>{c}</option>)}
              <option value="all">Semua</option>
            </select>
          </label>
          <label className="field">
            <span className="field-label">Mod</span>
            <select className="input" value={mode} onChange={e => setMode(e.target.value)}>
              <option value="practice">✏️ Latihan (tiada masa)</option>
              <option value="challenge">⚡ Cabaran (bermasa, mata)</option>
            </select>
          </label>
        </div>
        <label className="field">
          <span className="field-label">Tarikh akhir</span>
          <input className="input" type="datetime-local" value={due} onChange={e => setDue(e.target.value)} />
        </label>
        <p className="muted small">
          {questions ? `${n} soalan akan dipilih secara rawak daripada ${available.length} soalan yang ada.` : 'Memuatkan soalan…'}
        </p>
        <GlowButton className="glow-lg" type="submit" disabled={busy || !n}>{busy ? 'Menyimpan…' : 'Beri kerja rumah'}</GlowButton>
      </form>
    </section>
  );
}
