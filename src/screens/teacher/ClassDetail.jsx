// Butiran satu kelas: kod kelas, laporan murid, kerja rumah.
import { useEffect, useMemo, useState } from 'react';
import { BackButton, PageHead, Progress } from '../../components/ui.jsx';
import {
  deleteAssignment, deleteClass, listAssignments, listMembers, removeMember,
} from '../../lib/classes.js';
import { dueLabel } from '../classes/HomeworkList.jsx';
import AssignmentForm from './AssignmentForm.jsx';
import AssignmentReport from './AssignmentReport.jsx';

export default function ClassDetail({ user, cls, config, onBack, onDeleted, onHostRace }) {
  const [tab, setTab] = useState('students');
  const [members, setMembers] = useState(null);
  const [assignments, setAssignments] = useState(null);
  const [view, setView] = useState(null); // 'new' | assignment (laporan)
  const [openStudent, setOpenStudent] = useState(null);

  async function load() {
    const [m, a] = await Promise.all([listMembers(cls.id).catch(() => []), listAssignments(cls.id).catch(() => [])]);
    setMembers(m);
    setAssignments(a);
  }
  useEffect(() => { load(); }, [cls.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Nama subjek daripada kunci "exam:subjek".
  const subjectName = useMemo(() => {
    const map = {};
    for (const e of config?.exams || []) for (const s of e.subjects) map[e.id + ':' + s.id] = `${e.name} ${s.name}`;
    return key => map[key] || key;
  }, [config]);

  async function kick(m) {
    if (!confirm(`Keluarkan ${m.name} dari kelas?`)) return;
    await removeMember(cls.id, m.uid);
    setMembers(list => list.filter(x => x.uid !== m.uid));
  }

  async function removeClass() {
    if (!confirm(`Padam kelas "${cls.name}" bersama semua kerja rumah dan hantaran? Tindakan ini tidak boleh dibatalkan.`)) return;
    await deleteClass(cls);
    onDeleted();
  }

  async function removeAssignment(a) {
    if (!confirm(`Padam kerja rumah "${a.title}"?`)) return;
    await deleteAssignment(cls.id, a.id);
    setAssignments(list => list.filter(x => x.id !== a.id));
  }

  function copyCode() {
    navigator.clipboard?.writeText(cls.code).then(() => alert('Kod kelas disalin: ' + cls.code)).catch(() => {});
  }

  if (view === 'new') {
    return (
      <AssignmentForm cls={cls} config={config} onCancel={() => setView(null)}
        onCreated={a => { setAssignments(list => [a, ...(list || [])]); setView(null); setTab('homework'); }} />
    );
  }
  if (view) {
    return <AssignmentReport cls={cls} assignment={view} members={members || []} config={config} onBack={() => setView(null)} />;
  }

  return (
    <section className="screen">
      <BackButton onClick={onBack} />
      <PageHead badge="Kelas" title={cls.name} />

      <button className="card class-code" onClick={copyCode} title="Tekan untuk salin">
        <span className="muted small">Kod kelas — beri kepada murid</span>
        <span className="class-code-value">{cls.code}</span>
        <span className="muted small">Murid: Kelas saya → Sertai kelas</span>
      </button>

      {onHostRace && (
        <button className="btn btn-outline btn-lg host-race-btn" onClick={() => onHostRace(cls)}>🏁 Hos perlumbaan untuk kelas ini</button>
      )}

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'students'} className={'tab' + (tab === 'students' ? ' is-active' : '')}
          onClick={() => setTab('students')}>👩‍🎓 Murid ({members?.length ?? '…'})</button>
        <button role="tab" aria-selected={tab === 'homework'} className={'tab' + (tab === 'homework' ? ' is-active' : '')}
          onClick={() => setTab('homework')}>📚 Kerja rumah ({assignments?.length ?? '…'})</button>
      </div>

      {tab === 'students' && (
        !members ? <p className="alert">Memuatkan murid…</p> : !members.length ? (
          <p className="alert">Belum ada murid. Beri kod <b>{cls.code}</b> kepada murid anda.</p>
        ) : (
          <div className="user-list">
            {members.map(m => {
              const s = m.summary || {};
              const acc = s.answered ? Math.round((s.correct / s.answered) * 100) : 0;
              const subjects = Object.entries(m.subjects || {}).sort((a, b) => a[1] - b[1]);
              const expanded = openStudent === m.uid;
              return (
                <div key={m.uid} className="card user-row">
                  <button className="student-main" onClick={() => setOpenStudent(expanded ? null : m.uid)}>
                    <span className="user-name">{m.name}{m.isGuest && <span className="role role-guest">Tetamu</span>}</span>
                    <span className="user-stats">
                      {s.answered || 0} soalan · {acc}% betul · {s.quizzes || 0} latihan · {s.challenges || 0} cabaran
                      {m.lastActive && ' · aktif ' + new Date(m.lastActive).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}
                    </span>
                    <Progress value={acc} />
                    {subjects.length > 0 && (
                      <span className="weak">Paling lemah: {subjects.slice(0, 2).map(([k, v]) => `${subjectName(k)} (${v}%)`).join(', ')}</span>
                    )}
                  </button>
                  {expanded && (
                    <div className="student-detail">
                      {subjects.length ? (
                        <ul className="subject-bars">
                          {subjects.map(([k, v]) => (
                            <li key={k}><span>{subjectName(k)}</span><Progress value={v} /><b>{v}%</b></li>
                          ))}
                        </ul>
                      ) : <p className="muted small">Belum menamatkan mana-mana latihan.</p>}
                      <p className="muted small">🔥 Berturut terbaik {s.bestStreak || 0} · 💎 Mata tertinggi {s.bestPoints || 0} · 📅 {s.dayStreak || 0} hari berturut</p>
                      <button className="btn btn-ghost btn-sm btn-danger" onClick={() => kick(m)}>Keluarkan dari kelas</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === 'homework' && (
        <>
          <button className="btn btn-primary btn-lg" onClick={() => setView('new')}>+ Kerja rumah baharu</button>
          {!assignments ? <p className="alert">Memuatkan…</p> : !assignments.length ? (
            <p className="alert">Belum ada kerja rumah.</p>
          ) : (
            <div className="user-list">
              {assignments.map(a => (
                <div key={a.id} className="card user-row">
                  <button className="student-main" onClick={() => setView(a)}>
                    <span className="user-name">{a.mode === 'challenge' ? '⚡' : '✏️'} {a.title}</span>
                    <span className="user-stats">{a.examName} · {a.subjectName}{a.year ? ' · ' + a.year : ''} · {a.questionIds.length} soalan</span>
                    <span className="user-stats">{dueLabel(a.dueAt)} · tekan untuk lihat keputusan</span>
                  </button>
                  <button className="btn btn-ghost btn-sm btn-danger" onClick={() => removeAssignment(a)}>Padam</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <button className="btn btn-ghost btn-danger delete-class" onClick={removeClass}>Padam kelas ini</button>
    </section>
  );
}
