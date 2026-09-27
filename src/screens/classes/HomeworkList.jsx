// Senarai kerja rumah murid daripada semua kelas yang disertai, dengan status hantaran.
import { useEffect, useState } from 'react';
import { ActionCard, Reveal } from '../../components/ui.jsx';
import { getMySubmission, listAssignments } from '../../lib/classes.js';

export async function loadHomework(uid, myClasses) {
  const perClass = await Promise.all(myClasses.map(c => listAssignments(c.id).catch(() => [])));
  const all = perClass.flat();
  const subs = await Promise.all(all.map(a => getMySubmission(a.classId, a.id, uid).catch(() => null)));
  return all
    .map((a, i) => ({ ...a, submission: subs[i] }))
    .sort((a, b) => {
      if (!a.submission !== !b.submission) return a.submission ? 1 : -1; // belum siap dahulu
      return (a.dueAt || '9999').localeCompare(b.dueAt || '9999');
    });
}

export function dueLabel(dueAt) {
  if (!dueAt) return 'Tiada tarikh akhir';
  const d = new Date(dueAt);
  const txt = d.toLocaleString('ms-MY', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return (Date.now() > d.getTime() ? 'Tamat ' : 'Hantar sebelum ') + txt;
}

export default function HomeworkList({ user, myClasses, onStart, limit, emptyText = 'Tiada kerja rumah buat masa ini. 🎉' }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    let alive = true;
    loadHomework(user.uid, myClasses).then(list => { if (alive) setItems(list); });
    return () => { alive = false; };
  }, [user.uid, myClasses]);

  if (!items) return <p className="alert">Memuatkan kerja rumah…</p>;
  const shown = limit ? items.filter(a => !a.submission).slice(0, limit) : items;
  if (!shown.length) return limit ? null : <p className="alert">{emptyText}</p>;

  return (
    <div className="card-list">
      {shown.map((a, i) => {
        const s = a.submission;
        const late = !s && a.dueAt && Date.now() > new Date(a.dueAt).getTime();
        const status = s ? `✅ Siap · markah terbaik ${s.bestScore}/${s.total}` : late ? '⏰ Lewat — masih boleh dihantar' : '📌 Belum dibuat';
        return (
          <Reveal key={a.classId + a.id} index={i}>
            <ActionCard className={'homework-card' + (s ? ' is-done' : late ? ' is-late' : '')}
              icon={a.mode === 'challenge' ? 'bolt' : 'pencil'}
              title={a.title}
              desc={`${a.examName} · ${a.subjectName} · ${a.questionIds.length} soalan · ${dueLabel(a.dueAt)} · ${status}`}
              onClick={() => onStart(a)} />
          </Reveal>
        );
      })}
    </div>
  );
}
