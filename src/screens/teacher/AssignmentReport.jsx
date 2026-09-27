// Keputusan satu kerja rumah: status setiap murid dan soalan yang paling banyak disalah jawab.
import { useEffect, useState } from 'react';
import { BackButton, PageHead, Progress } from '../../components/ui.jsx';
import { listSubmissions } from '../../lib/classes.js';
import { loadQuestions } from '../../lib/quiz.js';
import { dueLabel } from '../classes/HomeworkList.jsx';

export default function AssignmentReport({ cls, assignment: a, members, config, onBack }) {
  const [subs, setSubs] = useState(null);
  const [questions, setQuestions] = useState({});

  useEffect(() => {
    listSubmissions(cls.id, a.id).then(setSubs).catch(() => setSubs([]));
    const subject = config?.exams.find(e => e.id === a.examId)?.subjects.find(s => s.id === a.subjectId);
    if (subject) loadQuestions(subject.file).then(qs => setQuestions(Object.fromEntries(qs.map(q => [q.id, q])))).catch(() => {});
  }, [cls.id, a.id, a.examId, a.subjectId, config]);

  if (!subs) return <section className="screen"><p className="alert">Memuatkan…</p></section>;

  const byUid = Object.fromEntries(subs.map(s => [s.uid, s]));
  const rows = [
    ...members.map(m => ({ uid: m.uid, name: m.name, sub: byUid[m.uid] })),
    // Hantaran daripada murid yang sudah keluar kelas.
    ...subs.filter(s => !members.some(m => m.uid === s.uid)).map(s => ({ uid: s.uid, name: s.name, sub: s })),
  ].sort((x, y) => (y.sub?.firstScore ?? -1) - (x.sub?.firstScore ?? -1));

  const done = subs.length;
  const avg = done ? Math.round(subs.reduce((n, s) => n + s.firstScore / s.total, 0) / done * 100) : 0;

  // Soalan paling banyak salah (berdasarkan percubaan pertama).
  const wrongCount = {};
  subs.forEach(s => (s.wrongIds || []).forEach(id => { wrongCount[id] = (wrongCount[id] || 0) + 1; }));
  const hardest = Object.entries(wrongCount).sort((x, y) => y[1] - x[1]).slice(0, 5);

  return (
    <section className="screen">
      <BackButton onClick={onBack} />
      <PageHead badge={cls.name} title={a.title} />
      <p className="muted small">
        {a.examName} · {a.subjectName}{a.year ? ' · ' + a.year : ''} · {a.questionIds.length} soalan ·{' '}
        {a.mode === 'challenge' ? '⚡ Cabaran' : '✏️ Latihan'} · {dueLabel(a.dueAt)}
      </p>

      <div className="stats">
        <div className="stat"><span className="stat-num">{done}/{members.length}</span><span className="stat-label">sudah hantar</span></div>
        <div className="stat"><span className="stat-num">{avg}%</span><span className="stat-label">purata markah</span></div>
        <div className="stat"><span className="stat-num">{subs.filter(s => s.late).length}</span><span className="stat-label">lewat</span></div>
      </div>

      <h3 className="section-title">Murid</h3>
      <div className="user-list">
        {rows.map(r => (
          <div key={r.uid} className="card user-row report-row">
            <span className="user-name">{r.name}</span>
            {r.sub ? (
              <>
                <Progress value={(r.sub.firstScore / r.sub.total) * 100} />
                <span className="user-stats">
                  Percubaan pertama <b>{r.sub.firstScore}/{r.sub.total}</b>
                  {r.sub.attempts > 1 && ` · terbaik ${r.sub.bestScore}/${r.sub.total} (${r.sub.attempts} kali)`}
                  {a.mode === 'challenge' && ` · ${r.sub.points} mata`}
                  {r.sub.late && ' · ⏰ lewat'}
                </span>
              </>
            ) : <span className="user-stats">📌 Belum hantar</span>}
          </div>
        ))}
        {!rows.length && <p className="alert">Tiada murid dalam kelas ini.</p>}
      </div>

      {hardest.length > 0 && (
        <>
          <h3 className="section-title">Soalan paling banyak salah</h3>
          <div className="user-list">
            {hardest.map(([id, n]) => {
              const q = questions[id];
              const rtl = q && (q.script === 'jawi' || q.script === 'arab');
              return (
                <div key={id} className="card user-row">
                  <span className="user-stats"><b>{n}</b> murid salah · <code>{id}</code></span>
                  {q && <span className={'q-row-text' + (rtl ? ' script-arabic' : '')} dir={rtl ? 'rtl' : 'auto'}>{q.question}</span>}
                  {q && <span className={'q-row-answer' + (rtl ? ' script-arabic' : '')} dir={rtl ? 'rtl' : 'auto'}>✓ {q.options[q.answer]}</span>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
