// Panel terperinci seorang pengguna untuk admin.
// Berbeza daripada panel cikgu: admin melihat keseluruhan dokumen users/{uid}
// — profil, semua statistik, dompet, pencapaian, kelas dan sesi semasa.
import { useMemo, useState } from 'react';
import { BackButton, PageHead, Progress } from '../../components/ui.jsx';
import Emoji from '../../components/Emoji.jsx';
import { ACHIEVEMENTS, emptyStats } from '../../lib/achievements.js';
import { ADMIN_EMAILS, TEACHER_EMAIL_PATTERN } from '../../lib/roles.js';

const TABS = [
  { id: 'profil', label: 'Profil', emoji: '🪪' },
  { id: 'prestasi', label: 'Prestasi', emoji: '📊' },
  { id: 'subjek', label: 'Subjek', emoji: '📚' },
  { id: 'main', label: 'Cabaran & main', emoji: '🎮' },
  { id: 'dompet', label: 'Dompet', emoji: '🪙' },
  { id: 'pencapaian', label: 'Pencapaian', emoji: '🏅' },
  { id: 'data', label: 'Data mentah', emoji: '🧾' },
];

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const tone = v => (v >= 80 ? 'is-good' : v >= 50 ? 'is-warn' : 'is-bad');
const num = n => (n || 0).toLocaleString('ms-MY');

function masa(iso, penuh = true) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ms-MY', penuh
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' });
}

function hariLalu(iso) {
  if (!iso) return null;
  const n = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (n <= 0) return 'hari ini';
  if (n === 1) return 'semalam';
  if (n < 30) return n + ' hari lalu';
  if (n < 365) return Math.floor(n / 30) + ' bulan lalu';
  return Math.floor(n / 365) + ' tahun lalu';
}

function Kpi({ n, label, kelas = '' }) {
  return (
    <div className={'kpi ' + kelas}>
      <span className="kpi-num">{n}</span>
      <span className="kpi-label">{label}</span>
    </div>
  );
}

export default function AdminUserDetail({ user: u, me, config, onBack, onToggleTeacher, onDelete }) {
  const [tab, setTab] = useState('profil');
  const s = { ...emptyStats(), ...(u.stats || {}) };
  const p = u.profile || {};
  const unlocked = u.unlocked || {};

  const email = (p.email || '').toLowerCase();
  const isAdminUser = email && ADMIN_EMAILS.includes(email);
  const isDelima = p.email && TEACHER_EMAIL_PATTERN.test(p.email);
  const self = u.uid === me.uid;
  const ketepatan = pct(s.correct, s.answered);
  const baki = (s.coinsEarned || 0) - (s.coinsSpent || 0);

  const subjectName = useMemo(() => {
    const map = {};
    for (const e of config?.exams || []) for (const x of e.subjects) map[e.id + ':' + x.id] = `${e.name} · ${x.name}`;
    return k => map[k] || k;
  }, [config]);

  const subjek = Object.entries(s.subjects || {}).sort((a, b) => a[1] - b[1]);
  // Sebahagian pencapaian memerlukan konteks (config peperiksaan, jenis akaun).
  const ctx = { config, user: { isGuest: Boolean(p.isGuest) } };
  const capai = ACHIEVEMENTS.map(a => {
    let kini = 0;
    let sasar = 1;
    try { [kini, sasar] = a.progress(s, ctx) || [0, 1]; } catch { /* pencapaian tanpa konteks penuh */ }
    return { ...a, kini: Math.min(kini || 0, sasar || 1), sasar: sasar || 1, at: unlocked[a.id] || null };
  });
  const dibuka = capai.filter(a => a.at);
  const belum = capai.filter(a => !a.at).sort((a, b) => (b.kini / b.sasar) - (a.kini / a.sasar));

  const kuasaGot = Object.entries(s.pGot || {}).sort((a, b) => b[1] - a[1]);
  const kuasaUsed = Object.entries(s.pUsed || {}).sort((a, b) => b[1] - a[1]);

  return (
    <section className="screen">
      <BackButton onClick={onBack} />
      <PageHead badge="Admin" title="Butiran pengguna" />

      <div className="card">
        <div className="student-head">
          {p.photo
            ? <img className="avatar" src={p.photo} alt="" width={64} height={64} referrerPolicy="no-referrer" />
            : <span className="avatar" style={{ width: 64, height: 64, fontSize: 26 }}>
                {(p.name || '?').charAt(0).toUpperCase()}
              </span>}
          <div className="student-head-text">
            <h2>
              {p.name || (p.email ? '(tiada nama)' : 'Tetamu (data lama)')}
              {isAdminUser && <span className="role role-admin">Admin</span>}
              {u.role === 'teacher' && <span className="role role-teacher">Cikgu</span>}
              {isDelima && <span className="role role-teacher">Cikgu DELIMa</span>}
              {p.isGuest && <span className="role role-guest">Tetamu</span>}
            </h2>
            <p className="muted small">{p.email || <code>{u.uid}</code>}</p>
            {(u.lastActive || u.updatedAt) && (
              <p className="muted small">Aktif {hariLalu(u.lastActive || u.updatedAt)} · {masa(u.lastActive || u.updatedAt)}</p>
            )}
          </div>
        </div>

        <div className="kpi-grid">
          <Kpi n={s.answered ? ketepatan + '%' : '—'} label="ketepatan" kelas={s.answered ? tone(ketepatan) : ''} />
          <Kpi n={num(s.answered)} label="soalan dijawab" />
          <Kpi n={num(s.quizzes)} label="latihan" />
          <Kpi n={num(s.challenges)} label="cabaran" />
          <Kpi n={num(dibuka.length)} label={`pencapaian / ${ACHIEVEMENTS.length}`} />
          <Kpi n={num(baki)} label="baki syiling" />
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

      {tab === 'profil' && (
        <div className="card">
          <h3>Akaun</h3>
          <dl className="kv">
            <dt>UID</dt><dd><code>{u.uid}</code></dd>
            <dt>Nama</dt><dd>{p.name || '—'}</dd>
            <dt>Emel</dt><dd>{p.email || '—'}</dd>
            <dt>Jenis</dt><dd>{p.isGuest ? 'Tetamu (tanpa nama)' : p.email ? 'Google' : 'Tidak diketahui'}</dd>
            <dt>Peranan</dt><dd>{isAdminUser ? 'Admin' : u.role === 'teacher' ? 'Cikgu (ditetapkan)' : isDelima ? 'Cikgu (emel DELIMa)' : 'Murid'}</dd>
            <dt>Aktif terkini</dt><dd>{masa(u.lastActive || u.updatedAt)}</dd>
            <dt>Kemas kini</dt><dd>{masa(u.updatedAt)}</dd>
            <dt>Hari berlatih</dt><dd>{s.lastDay || '—'} · {num(s.dayStreak)} hari berturut (terbaik {num(s.bestDayStreak)})</dd>
          </dl>

          {u.teacherRequest && (
            <>
              <h3>Permohonan cikgu</h3>
              <dl className="kv">
                <dt>Status</dt><dd>{u.teacherRequest.status || 'menunggu'}</dd>
                <dt>Sekolah</dt><dd>{u.teacherRequest.school || '—'}</dd>
                <dt>Nota</dt><dd>{u.teacherRequest.note || '—'}</dd>
                <dt>Dihantar</dt><dd>{masa(u.teacherRequest.at)}</dd>
              </dl>
            </>
          )}

          <h3>Kelas disertai</h3>
          {!(u.classes || []).length ? <p className="muted small">Tiada kelas.</p> : (
            <div className="pill-row">
              {u.classes.map(c => <span key={c.id} className="pill">{c.name} · {c.code}</span>)}
            </div>
          )}

          <h3>Sesi tersimpan</h3>
          {!u.session ? <p className="muted small">Tiada latihan yang belum tamat.</p> : (
            <p className="muted small">
              {u.session.examId ? `${u.session.examId} · ${u.session.subjectId || '—'}` : 'Sesi aktif'}
              {u.session.index != null && ` · soalan ke-${u.session.index + 1}`}
            </p>
          )}

          {!self && (
            <div className="user-actions" style={{ marginTop: 12 }}>
              {!p.isGuest && !isAdminUser && (
                <button className="btn btn-outline btn-sm" onClick={() => onToggleTeacher(u)}>
                  {u.role === 'teacher' ? 'Buang peranan cikgu' : 'Jadikan cikgu'}
                </button>
              )}
              <button className="btn btn-ghost btn-sm btn-danger" onClick={() => onDelete(u)}>Padam semua data</button>
            </div>
          )}
        </div>
      )}

      {tab === 'prestasi' && (
        <div className="card">
          <h3>Menjawab</h3>
          <div className="kpi-grid">
            <Kpi n={num(s.answered)} label="soalan dijawab" />
            <Kpi n={num(s.correct)} label="jawapan betul" />
            <Kpi n={s.answered ? ketepatan + '%' : '—'} label="ketepatan" kelas={s.answered ? tone(ketepatan) : ''} />
            <Kpi n={num(s.bestStreak)} label="berturut terbaik" />
            <Kpi n={num(s.streak)} label="berturut sekarang" />
            <Kpi n={num(s.earlyBird)} label="berlatih sebelum 8 pagi" />
          </div>
          <h3>Latihan</h3>
          <div className="kpi-grid">
            <Kpi n={num(s.quizzes)} label="latihan tamat" />
            <Kpi n={num(s.excellent)} label="cemerlang (≥80%)" />
            <Kpi n={num(s.perfect)} label="markah penuh" />
            <Kpi n={num(Object.keys(s.subjects || {}).length)} label="subjek dicuba" />
            <Kpi n={num(s.homeworkDone)} label="kerja rumah" />
            <Kpi n={num(s.dailyClaims)} label="hadiah harian" />
          </div>
          <h3>Rantaian harian</h3>
          <div className="kpi-grid">
            <Kpi n={num(s.dayStreak)} label="hari berturut" />
            <Kpi n={num(s.bestDayStreak)} label="terbaik" />
            <Kpi n={s.lastDay || '—'} label="hari terakhir" />
          </div>
        </div>
      )}

      {tab === 'subjek' && (
        <div className="card">
          {!subjek.length ? <p className="muted">Belum menamatkan sebarang latihan.</p> : (
            <>
              <p className="muted small">Peratus terbaik bagi setiap subjek, dari paling lemah.</p>
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

      {tab === 'main' && (
        <div className="card">
          <h3>Cabaran bermasa</h3>
          <div className="kpi-grid">
            <Kpi n={num(s.challenges)} label="cabaran tamat" />
            <Kpi n={num(s.bestPoints)} label="mata tertinggi" />
            <Kpi n={num(s.redeemed)} label="tebusan berjaya" />
            <Kpi n={num(s.redeemedHard)} label="tebusan susah" />
          </div>
          <h3>Perlumbaan</h3>
          <div className="kpi-grid">
            <Kpi n={num(s.races)} label="perlumbaan" />
            <Kpi n={num(s.raceWins)} label="tempat pertama" />
            <Kpi n={num(s.racePodiums)} label="3 teratas" />
          </div>
          <h3>Permainan arked</h3>
          <div className="kpi-grid">
            <Kpi n={num(s.games)} label="permainan tamat" />
            <Kpi n={num(s.snakeWins)} label="menang Ular & Tangga" />
            <Kpi n={num(s.memoryPerfect)} label="Kad Padanan 3★" />
            <Kpi n={num(s.duelWins)} label="menang Kad Duel" />
          </div>
        </div>
      )}

      {tab === 'dompet' && (
        <div className="card">
          <h3>Syiling</h3>
          <div className="kpi-grid">
            <Kpi n={num(baki)} label="baki" kelas={baki > 0 ? 'is-good' : ''} />
            <Kpi n={num(s.coinsEarned)} label="diperoleh" />
            <Kpi n={num(s.coinsSpent)} label="dibelanjakan" />
            <Kpi n={num(s.purchases)} label="pembelian" />
            <Kpi n={num(s.dressups)} label="tukar avatar" />
            <Kpi n={num(s.powerupsUsed)} label="kuasa digunakan" />
          </div>

          <h3>Barang dimiliki ({(s.items || []).length})</h3>
          {!(s.items || []).length ? <p className="muted small">Tiada barang.</p> : (
            <div className="pill-row">{s.items.map(i => <span key={i} className="pill">{i}</span>)}</div>
          )}

          <h3>Kad kuasa</h3>
          {!kuasaGot.length && !kuasaUsed.length ? <p className="muted small">Tiada rekod kad kuasa.</p> : (
            <dl className="kv">
              {kuasaGot.map(([k, v]) => (
                <span key={'g' + k} style={{ display: 'contents' }}>
                  <dt>{k}</dt><dd>{v} diperoleh · {(s.pUsed || {})[k] || 0} digunakan</dd>
                </span>
              ))}
              {kuasaUsed.filter(([k]) => !(s.pGot || {})[k]).map(([k, v]) => (
                <span key={'u' + k} style={{ display: 'contents' }}>
                  <dt>{k}</dt><dd>0 diperoleh · {v} digunakan</dd>
                </span>
              ))}
            </dl>
          )}
        </div>
      )}

      {tab === 'pencapaian' && (
        <div className="card">
          <h3>Dibuka ({dibuka.length}/{ACHIEVEMENTS.length})</h3>
          {!dibuka.length ? <p className="muted small">Belum ada pencapaian.</p> : (
            <ul className="subject-bars">
              {dibuka.sort((a, b) => (b.at || '').localeCompare(a.at || '')).map(a => (
                <li key={a.id}>
                  <span><Emoji e={a.emoji} /> {a.title}</span>
                  <span className="muted small">{masa(a.at, false)}</span>
                  <b />
                </li>
              ))}
            </ul>
          )}

          <h3>Belum dibuka ({belum.length})</h3>
          <ul className="subject-bars">
            {belum.map(a => (
              <li key={a.id}>
                <span><Emoji e={a.emoji} /> {a.title}</span>
                <Progress value={pct(a.kini, a.sasar)} />
                <b>{a.kini}/{a.sasar}</b>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'data' && (
        <div className="card">
          <p className="muted small">Dokumen <code>users/{u.uid}</code> seperti yang disimpan dalam Firestore.</p>
          <pre className="raw-json">{JSON.stringify({
            uid: u.uid, role: u.role ?? null, profile: p, stats: s,
            unlocked, classes: u.classes || [], session: u.session ?? null,
            teacherRequest: u.teacherRequest ?? null,
            lastActive: u.lastActive ?? null, updatedAt: u.updatedAt ?? null,
          }, null, 2)}</pre>
        </div>
      )}
    </section>
  );
}
