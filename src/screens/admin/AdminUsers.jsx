// Senarai semua pengguna: statistik ringkas, tetapkan/buang peranan cikgu, padam data.
import { useEffect, useMemo, useState } from 'react';
import {
  decideTeacherRequest, deleteUserData, fetchTeacherRequests, fetchUsers, setUserRole,
} from '../../lib/firebase.js';
import { ADMIN_EMAILS, TEACHER_EMAIL_PATTERN } from '../../lib/roles.js';
import Emoji from '../../components/Emoji.jsx';
import { ask } from '../../components/ConfirmDialog.jsx';
import AdminUserDetail from './AdminUserDetail.jsx';

const activity = u => u.lastActive || u.updatedAt || '';
const accuracy = u => (u.stats?.answered ? (u.stats.correct || 0) / u.stats.answered : -1);
const SORTS = {
  aktif: { label: 'Aktif terkini', fn: (a, b) => activity(b).localeCompare(activity(a)) },
  nama: { label: 'Nama (A–Z)', fn: (a, b) => (a.profile?.name || '~').localeCompare(b.profile?.name || '~', 'ms') },
  jawab: { label: 'Paling banyak menjawab', fn: (a, b) => (b.stats?.answered || 0) - (a.stats?.answered || 0) },
  tepat: { label: 'Ketepatan tertinggi', fn: (a, b) => accuracy(b) - accuracy(a) },
  lemah: { label: 'Ketepatan terendah', fn: (a, b) => (accuracy(a) < 0 ? 2 : accuracy(a)) - (accuracy(b) < 0 ? 2 : accuracy(b)) },
  mata: { label: 'Mata cabaran tertinggi', fn: (a, b) => (b.stats?.bestPoints || 0) - (a.stats?.bestPoints || 0) },
};

// Kategori peranan untuk tapisan.
function roleOf(u) {
  const email = u.profile?.email?.toLowerCase();
  if (email && ADMIN_EMAILS.includes(email)) return 'admin';
  if (u.role === 'teacher' || (email && TEACHER_EMAIL_PATTERN.test(email))) return 'cikgu';
  if (!u.profile || u.profile.isGuest) return 'tetamu';
  return 'murid';
}

export default function AdminUsers({ me, config }) {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sort, setSort] = useState('aktif');
  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState('');
  const [requests, setRequests] = useState([]);
  const [open, setOpen] = useState(null);   // pengguna yang dibuka panelnya

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

  const shown = useMemo(() => (users || []).filter(u => {
    if (roleFilter && roleOf(u) !== roleFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [u.profile?.name, u.profile?.email, u.uid].some(x => x && x.toLowerCase().includes(q));
  }).sort(SORTS[sort].fn), [users, roleFilter, search, sort]);

  // Pengguna yang boleh dipilih (bukan diri sendiri).
  const selectable = shown.filter(u => u.uid !== me.uid);
  const allSelected = selectable.length > 0 && selectable.every(u => selected.has(u.uid));
  const selectedUsers = (users || []).filter(u => selected.has(u.uid));
  function toggleSel(uid) {
    setSelected(s => { const n = new Set(s); if (n.has(uid)) n.delete(uid); else n.add(uid); return n; });
  }
  function toggleAll() {
    setSelected(s => { const n = new Set(s); selectable.forEach(u => (allSelected ? n.delete(u.uid) : n.add(u.uid))); return n; });
  }

  // Tindakan pukal: jadikan/buang cikgu (akaun Google sahaja) atau padam data.
  async function bulk(action) {
    const targets = action === 'delete' ? selectedUsers
      : selectedUsers.filter(u => u.profile && !u.profile.isGuest && roleOf(u) !== 'admin');
    if (!targets.length) return alert('Tiada pengguna yang sesuai untuk tindakan ini (tetamu tidak boleh jadi cikgu).');
    const label = { teacher: 'Jadikan cikgu', unteacher: 'Buang peranan cikgu', delete: 'PADAM SEMUA DATA' }[action];
    if (!await ask(`${label} untuk ${targets.length} pengguna?`)) return;
    setBusy('bulk');
    const done = [];
    for (const u of targets) {
      try {
        if (action === 'delete') await deleteUserData(u.uid);
        else await setUserRole(u.uid, action === 'teacher' ? 'teacher' : null);
        done.push(u.uid);
      } catch { /* teruskan yang lain */ }
    }
    setUsers(list => (action === 'delete'
      ? list.filter(x => !done.includes(x.uid))
      : list.map(x => (done.includes(x.uid) ? { ...x, role: action === 'teacher' ? 'teacher' : null } : x))));
    setSelected(new Set());
    setBusy('');
    if (done.length < targets.length) alert(`${targets.length - done.length} gagal. Cuba lagi.`);
  }

  async function toggleTeacher(u) {
    const makeTeacher = u.role !== 'teacher';
    if (!await ask(makeTeacher ? `Jadikan ${u.profile?.name} sebagai cikgu?` : `Buang peranan cikgu daripada ${u.profile?.name}?`)) return;
    setBusy(u.uid);
    try {
      await setUserRole(u.uid, makeTeacher ? 'teacher' : null);
      setUsers(list => list.map(x => (x.uid === u.uid ? { ...x, role: makeTeacher ? 'teacher' : null } : x)));
      setOpen(o => (o && o.uid === u.uid ? { ...o, role: makeTeacher ? 'teacher' : null } : o));
    } catch (e) {
      alert('Gagal: ' + (e.code || e.message));
    } finally {
      setBusy('');
    }
  }

  async function decide(r, approve) {
    if (!await ask(approve ? `Luluskan ${r.name} (${r.school}) sebagai cikgu?` : `Tolak permohonan ${r.name}?`)) return;
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
    if (!await ask(`Padam SEMUA data ${u.profile?.name || u.uid} (latihan, statistik, pencapaian)? Tindakan ini tidak boleh dibatalkan.`)) return;
    setBusy(u.uid);
    try {
      await deleteUserData(u.uid);
      setUsers(list => list.filter(x => x.uid !== u.uid));
      setOpen(null);
    } catch (e) {
      alert('Gagal: ' + (e.code || e.message));
    } finally {
      setBusy('');
    }
  }

  if (error) return <p className="alert alert-warn">{error}</p>;
  if (!users) return <p className="alert">Memuatkan pengguna…</p>;

  if (open) {
    return (
      <AdminUserDetail
        user={open} me={me} config={config}
        onBack={() => setOpen(null)}
        onToggleTeacher={toggleTeacher}
        onDelete={remove}
      />
    );
  }

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
          <p className="section-title"><Emoji e="🧑‍🏫" /> Permohonan cikgu ({requests.length})</p>
          {requests.map(r => (
            <div key={r.uid} className="card user-row request-row">
              <span className="user-name">{r.name}</span>
              <span className="user-email">{r.email}</span>
              <span className="user-stats"><Emoji e="🏫" /> {r.school}{r.note && ' · ' + r.note}</span>
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
        <select className="input input-auto" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} aria-label="Tapis peranan">
          <option value="">Semua peranan</option>
          <option value="murid">Murid (Google)</option>
          <option value="tetamu">Tetamu</option>
          <option value="cikgu">Cikgu</option>
          <option value="admin">Admin</option>
        </select>
        <select className="input input-auto" value={sort} onChange={e => setSort(e.target.value)} aria-label="Susun">
          {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>↕ {v.label}</option>)}
        </select>
        <button className="btn btn-outline" onClick={load}>Muat semula</button>
      </div>

      <div className="qbank-selectbar">
        <label className="check">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={!selectable.length} />
          Pilih semua yang dipapar ({selectable.length})
        </label>
        <span className="muted small">{shown.length} daripada {summary.total} pengguna</span>
      </div>

      {selected.size > 0 && (
        <div className="bulk-bar" role="toolbar" aria-label="Tindakan pukal">
          <span className="bulk-count">{selected.size} dipilih</span>
          <button className="btn btn-primary btn-sm" disabled={busy === 'bulk'} onClick={() => bulk('teacher')}>Jadikan cikgu</button>
          <button className="btn btn-outline btn-sm" disabled={busy === 'bulk'} onClick={() => bulk('unteacher')}>Buang cikgu</button>
          <button className="btn btn-ghost btn-sm btn-danger" disabled={busy === 'bulk'} onClick={() => bulk('delete')}>Padam data</button>
          <button className="link-btn" onClick={() => setSelected(new Set())}>Nyahpilih</button>
        </div>
      )}

      <div className="user-list">
        {shown.map(u => {
          const s = u.stats || {};
          const acc = s.answered ? Math.round(((s.correct || 0) / s.answered) * 100) : 0;
          const admin = u.profile?.email && ADMIN_EMAILS.includes(u.profile.email.toLowerCase());
          const self = u.uid === me.uid;
          return (
            <div key={u.uid} className={'card user-row' + (selected.has(u.uid) ? ' is-selected' : '')}>
              <div className="user-main">
                {!self && <input type="checkbox" className="q-check" checked={selected.has(u.uid)}
                  onChange={() => toggleSel(u.uid)} aria-label={'Pilih ' + (u.profile?.name || u.uid)} />}
                {u.profile?.photo
                  ? <img className="avatar" src={u.profile.photo} alt="" width={40} height={40} referrerPolicy="no-referrer" />
                  : <span className="avatar" style={{ width: 40, height: 40, fontSize: 18 }}>{(u.profile?.name || '?').charAt(0).toUpperCase()}</span>}
                <button type="button" className="user-info user-open" onClick={() => setOpen(u)}
                  title="Lihat butiran penuh">
                  <span className="user-name">
                    {u.profile?.name || (u.profile ? '(tiada nama)' : 'Tetamu (data lama)')}
                    {admin && <span className="role role-admin">Admin</span>}
                    {u.role === 'teacher' && <span className="role role-teacher">Cikgu</span>}
                    {u.profile?.email && TEACHER_EMAIL_PATTERN.test(u.profile.email) && <span className="role role-teacher">Cikgu DELIMa</span>}
                    {u.profile?.isGuest && <span className="role role-guest">Tetamu</span>}
                  </span>
                  <span className="user-email">{u.profile?.email || u.uid}</span>
                  <span className="user-stats">
                    {s.answered || 0} soalan · {acc}% betul · {s.quizzes || 0} latihan · {s.challenges || 0} cabaran
                    {(u.lastActive || u.updatedAt) && ' · aktif ' + new Date(u.lastActive || u.updatedAt).toLocaleString('ms-MY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="muted small">Tekan untuk butiran penuh →</span>
                </button>
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
