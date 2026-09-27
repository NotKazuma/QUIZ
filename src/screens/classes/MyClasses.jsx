// Murid: senarai kelas yang disertai, sertai kelas dengan kod, dan kerja rumah.
import { useEffect, useState } from 'react';
import { ActionCard, BackButton, GlowButton, PageHead, Reveal } from '../../components/ui.jsx';
import { getClasses, joinClass, leaveClass, listMembers } from '../../lib/classes.js';
import PublicProfileSheet from '../../components/PublicProfileSheet.jsx';
import Emoji from '../../components/Emoji.jsx';
import HomeworkList from './HomeworkList.jsx';
import { ask } from '../../components/ConfirmDialog.jsx';

export default function MyClasses({ user, myClasses, config, onChange, onStartHomework, onBack }) {
  const [classes, setClasses] = useState(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState(user.isGuest ? '' : user.name);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [mates, setMates] = useState({});      // id kelas -> senarai ahli (bila dibuka)
  const [viewing, setViewing] = useState(null);

  async function toggleMates(cid) {
    if (mates[cid]) return setMates(m => ({ ...m, [cid]: null }));
    const list = await listMembers(cid).catch(() => []);
    setMates(m => ({ ...m, [cid]: list }));
  }

  useEffect(() => {
    let alive = true;
    getClasses(myClasses.map(c => c.id)).then(list => { if (alive) setClasses(list); });
    return () => { alive = false; };
  }, [myClasses]);

  async function join(e) {
    e.preventDefault();
    if (!/^[A-Za-z0-9]{6}$/.test(code.trim())) return setError('Kod kelas mesti 6 aksara.');
    if (!name.trim()) return setError('Masukkan nama anda supaya cikgu kenal.');
    if (myClasses.some(c => c.code === code.trim().toUpperCase())) return setError('Anda sudah menyertai kelas ini.');
    setBusy(true);
    setError('');
    try {
      const cls = await joinClass(code, user, name);
      onChange([...myClasses.filter(c => c.id !== cls.id), { id: cls.id, name: name.trim(), code: cls.code }]);
      setCode('');
    } catch (err) {
      setError(err.code === 'permission-denied' ? 'Kod kelas tidak sah.' : err.message);
    } finally {
      setBusy(false);
    }
  }

  async function leave(cls) {
    if (!await ask(`Keluar dari kelas "${cls.name}"?`)) return;
    await leaveClass(cls.id, user.uid).catch(() => {});
    onChange(myClasses.filter(c => c.id !== cls.id));
  }

  return (
    <section className="screen">
      <BackButton onClick={onBack} />
      <PageHead badge="Kelas" title="Kelas saya" />

      <Reveal>
        <form className="card form-card" onSubmit={join} noValidate>
          <p className="field-label">Sertai kelas baharu</p>
          <label className="field">
            <span className="field-hint">Kod kelas daripada cikgu</span>
            <input className="input input-code" value={code} maxLength={6} autoComplete="off" placeholder="ABC123"
              onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }} />
          </label>
          <label className="field">
            <span className="field-hint">Nama anda (dilihat oleh cikgu)</span>
            <input className="input" value={name} maxLength={30} placeholder="Nama penuh"
              onChange={e => { setName(e.target.value); setError(''); }} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <GlowButton className="glow-lg" type="submit" disabled={busy}>{busy ? 'Menyertai…' : 'Sertai kelas'}</GlowButton>
        </form>
      </Reveal>

      <h3 className="section-title">Kerja rumah</h3>
      <HomeworkList user={user} myClasses={myClasses} config={config} onStart={onStartHomework} />

      <h3 className="section-title">Kelas yang disertai</h3>
      {!classes ? <p className="alert">Memuatkan…</p> : !classes.length ? (
        <p className="alert">Belum menyertai mana-mana kelas.</p>
      ) : (
        <div className="card-list">
          {classes.map((c, i) => (
            <Reveal key={c.id} index={i}>
              <div className="card class-row">
                <div>
                  <p className="card-title">{c.name}</p>
                  <p className="card-desc">Cikgu {c.teacherName} · kod {c.code}</p>
                </div>
                <div className="class-row-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => toggleMates(c.id)}><Emoji e="👥" /> Kawan</button>
                  <button className="btn btn-ghost btn-sm btn-danger" onClick={() => leave(c)}>Keluar</button>
                </div>
              </div>
              {mates[c.id] && (
                <div className="mates">
                  {mates[c.id].map(m => (
                    <button key={m.uid} className="mate" onClick={() => setViewing(m)}>
                      <Emoji e="👤" /> {m.name}{m.uid === user.uid && ' (anda)'}
                    </button>
                  ))}
                </div>
              )}
            </Reveal>
          ))}
        </div>
      )}
      <PublicProfileSheet uid={viewing?.uid} fallbackName={viewing?.name} onClose={() => setViewing(null)} />
    </section>
  );
}
