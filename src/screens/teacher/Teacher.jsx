// Panel cikgu: senarai kelas sendiri, cipta kelas, dan buka butiran kelas.
import { useEffect, useState } from 'react';
import { ActionCard, BackButton, GlowButton, PageHead, Reveal } from '../../components/ui.jsx';
import { createClass, listTeacherClasses } from '../../lib/classes.js';
import ClassDetail from './ClassDetail.jsx';
import MySets from './MySets.jsx';

export default function Teacher({ user, config, onBack, onHostRace }) {
  const [classes, setClasses] = useState(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(null);
  const [tab, setTab] = useState('classes');

  async function load() {
    try {
      setClasses(await listTeacherClasses(user.uid));
    } catch (e) {
      setError('Gagal memuat kelas. Pastikan peraturan Firestore terkini sudah di-Publish. (' + (e.code || e.message) + ')');
    }
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function create(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const cls = await createClass(user, name);
      setClasses(list => [cls, ...(list || [])]);
      setName('');
      setOpen(cls);
    } catch (err) {
      alert('Gagal mencipta kelas: ' + (err.code || err.message));
    } finally {
      setBusy(false);
    }
  }

  if (open) {
    return (
      <ClassDetail user={user} cls={open} config={config} onHostRace={onHostRace}
        onBack={() => setOpen(null)}
        onDeleted={() => { setClasses(list => list.filter(c => c.id !== open.id)); setOpen(null); }} />
    );
  }

  return (
    <section className="screen">
      <BackButton onClick={onBack} />
      <PageHead badge="Cikgu" title="Panel Cikgu" />
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'classes'} className={'tab' + (tab === 'classes' ? ' is-active' : '')}
          onClick={() => setTab('classes')}>🏫 Kelas</button>
        <button role="tab" aria-selected={tab === 'sets'} className={'tab' + (tab === 'sets' ? ' is-active' : '')}
          onClick={() => setTab('sets')}>📝 Soalan saya</button>
      </div>

      {tab === 'sets' ? <MySets user={user} config={config} /> : <>

      <Reveal>
        <form className="card form-card" onSubmit={create}>
          <label className="field">
            <span className="field-label">Cipta kelas baharu</span>
            <input className="input" value={name} maxLength={40} placeholder="cth. 6 Bestari (UPKK)"
              onChange={e => setName(e.target.value)} />
          </label>
          <GlowButton className="glow-lg" type="submit" disabled={busy || !name.trim()}>
            {busy ? 'Mencipta…' : '+ Cipta kelas'}
          </GlowButton>
        </form>
      </Reveal>

      <h3 className="section-title">Kelas saya</h3>
      {error && <p className="alert alert-warn">{error}</p>}
      {!classes && !error && <p className="alert">Memuatkan kelas…</p>}
      {classes && !classes.length && <p className="alert">Belum ada kelas. Cipta kelas pertama anda di atas.</p>}
      <div className="card-list">
        {classes?.map((c, i) => (
          <Reveal key={c.id} index={i}>
            <ActionCard className="class-card" icon="layers" title={c.name}
              desc={`Kod kelas: ${c.code}`} onClick={() => setOpen(c)} />
          </Reveal>
        ))}
      </div>
      </>}
    </section>
  );
}
