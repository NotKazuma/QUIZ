// Panel terperinci seorang murid untuk cikgu:
// ringkasan prestasi, penguasaan setiap subjek, rekod penuh kerja rumah,
// soalan yang paling kerap salah, garis masa aktiviti dan perbandingan dengan kelas.
import { useEffect, useMemo, useState } from 'react';
import { BackButton, PageHead, Progress } from '../../components/ui.jsx';
import AnimalAvatar from '../../components/AnimalAvatar.jsx';
import Emoji from '../../components/Emoji.jsx';
import { ask } from '../../components/ConfirmDialog.jsx';
import { assetUrl, loadQuestions } from '../../lib/quiz.js';
import { classAverages, listStudentSubmissions, removeMember } from '../../lib/classes.js';

const TABS = [
  { id: 'ringkasan', label: 'Ringkasan', emoji: '📊' },
  { id: 'subjek', label: 'Subjek', emoji: '📚' },
  { id: 'kerja', label: 'Kerja rumah', emoji: '✏️' },
  { id: 'silap', label: 'Soalan salah', emoji: '❗' },
  { id: 'masa', label: 'Garis masa', emoji: '🕑' },
];

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const tone = v => (v >= 80 ? 'is-good' : v >= 50 ? 'is-warn' : 'is-bad');

function tarikh(iso, penuh = false) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('ms-MY', penuh
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short' });
}

function hariLalu(iso) {
  if (!iso) return null;
  const n = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (n <= 0) return 'hari ini';
  if (n === 1) return 'semalam';
  if (n < 30) return n + ' hari lalu';
  return Math.floor(n / 30) + ' bulan lalu';
}

// `api` boleh diganti untuk pratonton/ujian; lalai ialah Firestore sebenar.
const API = { listStudentSubmissions, classAverages, removeMember };

export default function StudentDetail({ cls, member, assignments, config, onBack, onRemoved, api = API }) {
  const [tab, setTab] = useState('ringkasan');
  const [rows, setRows] = useState(null);      // [{ assignment, sub }]
  const [avgs, setAvgs] = useState({});        // purata kelas per kerja rumah
  const [qtext, setQtext] = useState({});      // id soalan -> soalan penuh

  // Kunci stabil supaya kesan ini tidak berulang setiap kali komponen dilukis semula.
  const aKey = assignments.map(a => a.id).join(',');

  useEffect(() => {
    let alive = true;
    setRows(null);
    api.listStudentSubmissions(cls.id, member.uid, assignments)
      .then(r => alive && setRows(r))
      .catch(() => alive && setRows([]));
    api.classAverages(cls.id, assignments)
      .then(a => alive && setAvgs(a))
      .catch(() => {});
    return () => { alive = false; };
  }, [cls.id, member.uid, aKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Muat teks soalan yang disalah jawab supaya cikgu nampak isi sebenar.
  useEffect(() => {
    if (!rows || !config) return;
    const perlu = rows.filter(r => r.sub?.wrongIds?.length);
    if (!perlu.length) return;
    let alive = true;
    const fail = new Map();
    for (const { assignment: a } of perlu) {
      const s = config.exams?.find(e => e.id === a.examId)?.subjects?.find(x => x.id === a.subjectId);
      if (s) fail.set(s.file, true);
    }
    Promise.all([...fail.keys()].map(f => loadQuestions(f).catch(() => [])))
      .then(lists => {
        if (!alive) return;
        const map = {};
        lists.flat().forEach(q => { map[q.id] = q; });
        // Soalan yang disimpan terus dalam kerja rumah (set cikgu).
        perlu.forEach(({ assignment: a }) => (a.questions || []).forEach(q => { map[q.id] = q; }));
        setQtext(map);
      });
    return () => { alive = false; };
  }, [rows, config]);

  const subjectName = useMemo(() => {
    const map = {};
    for (const e of config?.exams || []) for (const s of e.subjects) map[e.id + ':' + s.id] = `${e.name} · ${s.name}`;
    return k => map[k] || k;
  }, [config]);

  const s = member.summary || {};
  const ketepatan = pct(s.correct || 0, s.answered || 0);

  const hantar = (rows || []).filter(r => r.sub);
  const belum = (rows || []).filter(r => !r.sub);
  const lewat = hantar.filter(r => r.sub.late);
  const purataMurid = hantar.length
    ? Math.round(hantar.reduce((n, r) => n + pct(r.sub.firstScore, r.sub.total), 0) / hantar.length)
    : 0;
  const purataKelas = (() => {
    const v = hantar.map(r => avgs[r.assignment.id]?.avg).filter(x => typeof x === 'number');
    return v.length ? Math.round(v.reduce((n, x) => n + x, 0) / v.length) : null;
  })();

  const subjek = Object.entries(member.subjects || {}).sort((a, b) => a[1] - b[1]);

  // Soalan salah, dikira merentas semua kerja rumah.
  const salah = useMemo(() => {
    const kira = {};
    hantar.forEach(r => (r.sub.wrongIds || []).forEach(id => {
      kira[id] = kira[id] || { id, n: 0, kerja: [] };
      kira[id].n += 1;
      kira[id].kerja.push(r.assignment.title);
    }));
    return Object.values(kira).sort((a, b) => b.n - a.n);
  }, [hantar]);

  const masa = useMemo(() => hantar
    .map(r => ({ ...r, at: r.sub.lastAt || r.sub.firstAt }))
    .filter(r => r.at)
    .sort((a, b) => b.at.localeCompare(a.at)), [hantar]);

  async function keluarkan() {
    if (!await ask(`Keluarkan ${member.name} dari kelas ${cls.name}? Rekod kerja rumahnya kekal.`)) return;
    await api.removeMember(cls.id, member.uid);
    onRemoved?.(member.uid);
  }

  return (
    <section className="screen">
      <BackButton onClick={onBack} />
      <PageHead badge={cls.name} title="Butiran murid" />

      <div className="card">
        <div className="student-head">
          <AnimalAvatar avatar={member.avatar} size={72} />
          <div className="student-head-text">
            <h2>{member.name}</h2>
            <p className="muted small">
              {member.isGuest ? 'Akaun tetamu' : 'Akaun Google'}
              {' · '}Sertai {tarikh(member.joinedAt)}
              {member.lastActive && ` · Aktif ${hariLalu(member.lastActive)}`}
            </p>
          </div>
        </div>

        <div className="kpi-grid">
          <div className={'kpi ' + tone(ketepatan)}>
            <span className="kpi-num">{s.answered ? ketepatan + '%' : '—'}</span>
            <span className="kpi-label">ketepatan</span>
          </div>
          <div className="kpi"><span className="kpi-num">{s.answered || 0}</span><span className="kpi-label">soalan dijawab</span></div>
          <div className="kpi"><span className="kpi-num">{s.quizzes || 0}</span><span className="kpi-label">latihan</span></div>
          <div className="kpi"><span className="kpi-num">{s.challenges || 0}</span><span className="kpi-label">cabaran</span></div>
          <div className="kpi"><span className="kpi-num">{s.bestStreak || 0}</span><span className="kpi-label">berturut terbaik</span></div>
          <div className="kpi"><span className="kpi-num">{s.dayStreak || 0}</span><span className="kpi-label">hari berturut</span></div>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map(t => (
          <button key={t.id} role="tab" aria-selected={tab === t.id}
            className={'tab' + (tab === t.id ? ' is-active' : '')} onClick={() => setTab(t.id)}>
            <Emoji e={t.emoji} /> {t.label}
          </button>
        ))}
      </div>

      {rows === null && <p className="alert">Memuatkan rekod murid…</p>}

      {rows !== null && tab === 'ringkasan' && (
        <div className="card">
          <h3>Kerja rumah</h3>
          <div className="kpi-grid">
            <div className="kpi"><span className="kpi-num">{hantar.length}/{assignments.length}</span><span className="kpi-label">sudah hantar</span></div>
            <div className={'kpi ' + tone(purataMurid)}><span className="kpi-num">{hantar.length ? purataMurid + '%' : '—'}</span><span className="kpi-label">purata markah</span></div>
            <div className={'kpi' + (lewat.length ? ' is-warn' : '')}><span className="kpi-num">{lewat.length}</span><span className="kpi-label">hantar lewat</span></div>
            <div className={'kpi' + (belum.length ? ' is-bad' : '')}><span className="kpi-num">{belum.length}</span><span className="kpi-label">belum hantar</span></div>
          </div>

          {purataKelas !== null && hantar.length > 0 && (
            <>
              <h3>Berbanding kelas</h3>
              <div className="compare-bar">
                <span className="muted small">Murid</span><Progress value={purataMurid} /><b>{purataMurid}%</b>
              </div>
              <div className="compare-bar">
                <span className="muted small">Kelas</span><Progress value={purataKelas} /><b>{purataKelas}%</b>
              </div>
              <p className="muted small">
                {purataMurid > purataKelas
                  ? `${member.name} mendahului purata kelas sebanyak ${purataMurid - purataKelas} mata peratus.`
                  : purataMurid < purataKelas
                    ? `${member.name} ketinggalan ${purataKelas - purataMurid} mata peratus daripada purata kelas.`
                    : `${member.name} sama dengan purata kelas.`}
              </p>
            </>
          )}

          {subjek.length > 0 && (
            <>
              <h3>Perlu perhatian</h3>
              <ul className="subject-bars">
                {subjek.slice(0, 3).map(([k, v]) => (
                  <li key={k} className={v < 50 ? 'is-weak' : ''}>
                    <span>{subjectName(k)}</span><Progress value={v} /><b>{v}%</b>
                  </li>
                ))}
              </ul>
            </>
          )}

          {belum.length > 0 && (
            <>
              <h3>Belum dihantar</h3>
              <div className="pill-row">
                {belum.map(r => <span key={r.assignment.id} className="pill">{r.assignment.title}</span>)}
              </div>
            </>
          )}

          <button className="btn btn-ghost btn-sm btn-danger" onClick={keluarkan}>Keluarkan dari kelas</button>
        </div>
      )}

      {rows !== null && tab === 'subjek' && (
        <div className="card">
          {!subjek.length ? <p className="muted">Murid ini belum menamatkan sebarang latihan.</p> : (
            <>
              <p className="muted small">Peratus ketepatan bagi setiap subjek yang pernah dicuba, dari paling lemah.</p>
              <ul className="subject-bars">
                {subjek.map(([k, v]) => (
                  <li key={k} className={v < 50 ? 'is-weak' : v >= 80 ? 'is-strong' : ''}>
                    <span>{subjectName(k)}</span><Progress value={v} /><b>{v}%</b>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {rows !== null && tab === 'kerja' && (
        !assignments.length ? <p className="alert">Kelas ini belum ada kerja rumah.</p> : (
          <div className="hw-table">
            {rows.map(({ assignment: a, sub }) => {
              const p = sub ? pct(sub.firstScore, sub.total) : null;
              const kelas = avgs[a.id];
              return (
                <div key={a.id} className={'hw-row' + (sub ? '' : ' is-missing')}>
                  <span className="hw-row-title">
                    <Emoji e={a.mode === 'challenge' ? '⚡' : '✏️'} /> {a.title}
                  </span>
                  <span className={'hw-score ' + (sub ? (p >= 50 ? 'is-good' : 'is-bad') : '')}>
                    {sub ? `${sub.firstScore}/${sub.total} (${p}%)` : 'Belum hantar'}
                  </span>
                  <span className="hw-row-meta">
                    {a.examName} · {a.subjectName}{a.year ? ' · ' + a.year : ''}
                    {sub && (
                      <>
                        {' · '}Cubaan {sub.attempts}
                        {sub.bestScore > sub.firstScore && ` · Terbaik ${sub.bestScore}/${sub.total}`}
                        {' · '}Hantar {tarikh(sub.firstAt, true)}
                        {kelas && ` · Purata kelas ${kelas.avg}%`}
                      </>
                    )}
                  </span>
                  {sub && (
                    <div className="pill-row" style={{ gridColumn: '1 / -1' }}>
                      <span className={'pill ' + (sub.late ? 'is-late' : 'is-ok')}>
                        {sub.late ? 'Lewat' : 'Ikut masa'}
                      </span>
                      {(sub.wrongIds || []).length > 0
                        ? <span className="pill">{sub.wrongIds.length} soalan salah</span>
                        : <span className="pill is-ok">Semua betul</span>}
                      {sub.points > 0 && <span className="pill">{sub.points} mata</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {rows !== null && tab === 'silap' && (
        !salah.length ? (
          <p className="alert">Tiada soalan salah direkodkan{hantar.length ? '' : ' (murid belum menghantar kerja rumah)'}.</p>
        ) : (
          <div>
            <p className="muted small">Disusun mengikut kekerapan salah pada percubaan pertama.</p>
            {salah.map(w => {
              const q = qtext[w.id];
              return (
                <div key={w.id} className="wrong-q">
                  <b className="q-text">{q ? q.question : <code>{w.id}</code>}</b>
                  {q?.image && <img className="question-image" src={assetUrl(q.image)} alt="" />}
                  {q?.type === 'objektif' && q.options?.[q.answer] != null && (
                    <p className="muted small">Jawapan betul: {q.options[q.answer]}</p>
                  )}
                  {q?.explanation && <p className="muted small">{q.explanation}</p>}
                  <div className="pill-row">
                    <span className="pill">Salah {w.n}×</span>
                    {[...new Set(w.kerja)].map(t => <span key={t} className="pill">{t}</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {rows !== null && tab === 'masa' && (
        !masa.length ? <p className="alert">Belum ada aktiviti kerja rumah direkodkan.</p> : (
          <div className="card">
            <ul className="timeline">
              {masa.map(r => (
                <li key={r.assignment.id}>
                  <b>{r.assignment.title}</b>
                  <p className="muted small">
                    {tarikh(r.at, true)} · {r.sub.firstScore}/{r.sub.total}
                    {r.sub.attempts > 1 && ` · ${r.sub.attempts} cubaan`}
                    {r.sub.late && ' · lewat'}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )
      )}
    </section>
  );
}
