// Senarai semua pengguna: statistik ringkas, tetapkan/buang peranan cikgu, padam data.
import { useEffect, useMemo, useState } from 'react';
import {
  decideTeacherRequest, deleteUserData, fetchTeacherRequests, fetchUsers, setUserRole,
} from '../../lib/firebase.js';
import { ADMIN_EMAILS, TEACHER_EMAIL_PATTERN } from '../../lib/roles.js';

export default function AdminUsers({ me }) {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showGuests, setShowGuests] = useState(false);
  const [busy, setBusy] = useState('');
  const [requests, setRequests] = useState([]);

  async function load() {
    setError('');
    try {
      setUsers(await fetchUsers());
      setRequests(await fetchTeacherRequests().catch(() => []));
    } catch (e) {
      setError('Gagal memuat pengguna. Pastikan peraturan Firestore terkini sudah di-Publish. (' + (e.code || e.message) + ')');
    }
  }
  useEffect(() => { load(); }, []);

  const summary = useMemo(() => {
    const list = users || [];
    return {
      total: list.length,
      google: list.filter(u => !u.profile?.isGuest).length,
      guests: list.filter(u => u.profile?.isGuest).length,
      teachers: list.filter(u => u.role === 'teacher').length,
      answered: list.reduce((n, u) => n + (u.stats?.answered || 0), 0),
    };
  }, [users]);

  const shown = (users || []).filter(u => {
    // Tetamu (atau dokumen lama tanpa profil) disembunyikan kecuali ditanda.
    if (!showGuests && (u.profile?.isGuest || !u.profile)) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [u.profile?.name, u.profile?.email, u.uid].some(x => x && x.toLowerCase().includes(q));
  });

  async function toggleTeacher(u) {
    const makeTeacher = u.role !== 'teacher';
    if (!confirm(makeTeacher ? `Jadikan ${u.profile?.name} sebagai cikgu?` : `Buang peranan cikgu daripada ${u.profile?.name}?`)) return;
    setBusy(u.uid);
    try {
      await setUserRole(u.uid, makeTeacher ? 'teacher' : null);
      setUsers(list => list.map(x => (x.uid === u.uid ? { ...x, role: makeTeacher ? 'teacher' : null } : x)));
    } catch (e) {
      alert('Gagal: ' + (e.code || e.message));
    } finally {
      setBusy('');
    }
  }

  async function decide(r, approve) {
    if (!confirm(approve ? `Luluskan ${r.name} (${r.school}) sebagai cikgu?` : `Tolak permohonan ${r.name}?`)) return;
    setBusy(r.uid);
    try {
      await decideTeacherRequest(r.uid, approve);
      setRequests(list => list.filter(x => x.uid !== r.uid));
      if (approve) setUsers(list => list.map(x => (x.uid === r.uid ? { ...x, role: 'teacher' } : x)));
    } catch (e) {
      alert('Gagal: ' + (e.code || e.message));
    } finally {
      setBusy('');
    }
  }

  async function remove(u) {
    if (!confirm(`Padam SEMUA data ${u.profile?.name || u.uid} (latihan, statistik, pencapaian)? Tindakan ini tidak boleh dibatalkan.`)) return;
    setBusy(u.uid);
    try {
      await deleteUserData(u.uid);
      setUsers(list => list.filter(x => x.uid !== u.uid));
    } catch (e) {
      alert('Gagal: ' + (e.code || e.message));
    } finally {
      setBusy('');
    }
  }

  if (error) return <p className="alert alert-warn">{error}</p>;
  if (!users) return <p className="alert">Memuatkan pengguna…</p>;

  return (
    <div className="admin-users">
      <div className="stats stats-4">
        <Stat n={summary.google} label="akaun Google" />
        <Stat n={summary.guests} label="tetamu" />
        <Stat n={summary.teachers} label="cikgu" />
        <Stat n={summary.answered} label="soalan dijawab" />
      </div>

      {requests.length > 0 && (
        <div className="requests">
          <p className="section-title">🧑‍🏫 Permohonan cikgu ({requests.length})</p>
          {requests.map(r => (
            <div key={r.uid} className="card user-row request-row">
              <span className="user-name">{r.name}</span>
              <span className="user-email">{r.email}</span>
              <span className="user-stats">🏫 {r.school}{r.note && ' · ' + r.note}</span>
              <span className="user-stats">Dihantar {new Date(r.at).toLocaleString('ms-MY', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              <div className="user-actions">
                <button className="btn btn-primary btn-sm" disabled={busy === r.uid} onClick={() => decide(r, true)}>✓ Luluskan</button>
                <button className="btn btn-ghost btn-sm btn-danger" disabled={busy === r.uid} onClick={() => decide(r, false)}>Tolak</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="admin-toolbar">
        <input className="input" type="search" placeholder="Cari nama atau emel…" value={search}
          onChange={e => setSearch(e.target.value)} />
        <label className="check">
          <input type="checkbox" checked={showGuests} onChange={e => setShowGuests(e.target.checked)} />
          Tunjuk tetamu
        </label>
        <button className="btn btn-outline" onClick={load}>Muat semula</button>
      </div>

      <p className="muted small">{shown.length} daripada {summary.total} pengguna</p>

      <div className="user-list">
        {shown.map(u => {
          const s = u.stats || {};
          const acc = s.answered ? Math.round((s.correct / s.answered) * 100) : 0;
          const admin = u.profile?.email && ADMIN_EMAILS.includes(u.profile.email.toLowerCase());
          const self = u.uid === me.uid;
          return (
            <div key={u.uid} className="card user-row">
              <div className="user-main">
                {u.profile?.photo
                  ? <img className="avatar" src={u.profile.photo} alt="" width={40} height={40} referrerPolicy="no-referrer" />
                  : <span className="avatar" style={{ width: 40, height: 40, fontSize: 18 }}>{(u.profile?.name || '?').charAt(0).toUpperCase()}</span>}
                <div className="user-info">
                  <span className="user-name">
                    {u.profile?.name || '(tiada nama)'}
                    {admin && <span className="role role-admin">Admin</span>}
                    {u.role === 'teacher' && <span className="role role-teacher">Cikgu</span>}
                    {u.profile?.email && TEACHER_EMAIL_PATTERN.test(u.profile.email) && <span className="role role-teacher">Cikgu DELIMa</span>}
                    {u.profile?.isGuest && <span className="role role-guest">Tetamu</span>}
                  </span>
                  <span className="user-email">{u.profile?.email || u.uid}</span>
                  <span className="user-stats">
                    {s.answered || 0} soalan · {acc}% betul · {s.quizzes || 0} latihan · {s.challenges || 0} cabaran
                    {u.lastActive && ' · aktif ' + new Date(u.lastActive).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
              {!self && (
                <div className="user-actions">
                  {!u.profile?.isGuest && !admin && (
                    <button className="btn btn-outline btn-sm" disabled={busy === u.uid} onClick={() => toggleTeacher(u)}>
                      {u.role === 'teacher' ? 'Buang cikgu' : 'Jadikan cikgu'}
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm btn-danger" disabled={busy === u.uid} onClick={() => remove(u)}>
                    Padam data
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ n, label }) {
  return (
    <div className="stat">
      <span className="stat-num">{n.toLocaleString('ms-MY')}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
