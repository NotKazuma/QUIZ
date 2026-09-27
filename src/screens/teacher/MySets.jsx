// Set soalan cikgu: senarai set, cipta set baharu, buka set untuk sunting.
// `allSets` = mod admin (lihat set semua cikgu).
import { useEffect, useMemo, useState } from 'react';
import { ActionCard, GlowButton, Reveal } from '../../components/ui.jsx';
import { createSet, listAllSets, listMySets } from '../../lib/teacherSets.js';
import SetDetail from './SetDetail.jsx';

const SORTS = {
  baharu: { label: 'Terbaru disunting', fn: (a, b) => b.updatedAt.localeCompare(a.updatedAt) },
  tajuk: { label: 'Tajuk (A–Z)', fn: (a, b) => a.title.localeCompare(b.title, 'ms') },
  banyak: { label: 'Paling banyak soalan', fn: (a, b) => b.questions.length - a.questions.length },
  cikgu: { label: 'Nama cikgu', fn: (a, b) => (a.ownerName || '').localeCompare(b.ownerName || '', 'ms') },
};

export default function MySets({ user, config, allSets = false }) {
  const [sets, setSets] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);
  const [title, setTitle] = useState('');
  const [subjectLabel, setSubjectLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('baharu');

  useEffect(() => {
    (allSets ? listAllSets() : listMySets(user.uid))
      .then(setSets)
      .catch(e => setError('Gagal memuat set soalan. Pastikan peraturan Firestore terkini sudah di-Publish. (' + (e.code || e.message) + ')'));
  }, [user.uid, allSets]);

  const shown = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (sets || [])
      .filter(x => !s || [x.title, x.subjectLabel, x.ownerName].some(v => v && v.toLowerCase().includes(s)))
      .sort(SORTS[sort].fn);
  }, [sets, search, sort]);

  async function create(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const set = await createSet(user, { title, subjectLabel });
      setSets(list => [set, ...(list || [])]);
      setTitle('');
      setSubjectLabel('');
      setOpen(set);
    } catch (err) {
      alert('Gagal mencipta set: ' + (err.code || err.message));
    } finally {
      setBusy(false);
    }
  }

  if (open) {
    return (
      <SetDetail user={user} config={config} set={open} adminView={allSets}
        onBack={() => setOpen(null)}
        onChange={s => { setSets(list => list.map(x => (x.id === s.id ? s : x))); setOpen(s); }}
        onDeleted={id => { setSets(list => list.filter(x => x.id !== id)); setOpen(null); }} />
    );
  }

  return (
    <div className="my-sets">
      {!allSets && (
        <Reveal>
          <form className="card form-card" onSubmit={create}>
            <p className="field-label">Cipta set soalan baharu</p>
            <p className="muted small">Soalan anda disimpan berasingan daripada bank rasmi UPKK/SDEA, dan boleh digunakan untuk kerja rumah & perlumbaan kelas.</p>
            <input className="input" value={title} maxLength={60} placeholder="Tajuk set, cth. Kuiz Solat Tahun 4"
              onChange={e => setTitle(e.target.value)} aria-label="Tajuk set" />
            <input className="input" value={subjectLabel} maxLength={40} placeholder="Subjek (pilihan), cth. Ibadah"
              onChange={e => setSubjectLabel(e.target.value)} aria-label="Subjek" />
            <GlowButton className="glow-lg" type="submit" disabled={busy || !title.trim()}>{busy ? 'Mencipta…' : '+ Cipta set'}</GlowButton>
          </form>
        </Reveal>
      )}

      {error && <p className="alert alert-warn">{error}</p>}
      {!sets && !error && <p className="alert">Memuatkan set soalan…</p>}
      {sets && (
        <>
          <div className="qbank-filters">
            <input className="input qbank-search" type="search" placeholder={allSets ? 'Cari tajuk, subjek atau cikgu…' : 'Cari set…'}
              value={search} onChange={e => setSearch(e.target.value)} />
            <select className="input" value={sort} onChange={e => setSort(e.target.value)} aria-label="Susun set">
              {Object.entries(SORTS).filter(([k]) => allSets || k !== 'cikgu')
                .map(([k, v]) => <option key={k} value={k}>↕ {v.label}</option>)}
            </select>
          </div>
          {!shown.length && <p className="alert">{sets.length ? 'Tiada set sepadan.' : allSets ? 'Belum ada cikgu yang mencipta set soalan.' : 'Belum ada set. Cipta set pertama anda di atas.'}</p>}
          <div className="card-list">
            {shown.map((s, i) => (
              <Reveal key={s.id} index={Math.min(i, 6)}>
                <ActionCard className="set-card" icon="book" title={s.title}
                  desc={[s.subjectLabel, `${s.questions.length} soalan`, allSets && `oleh ${s.ownerName}`,
                    'dikemas kini ' + new Date(s.updatedAt).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })]
                    .filter(Boolean).join(' · ')}
                  onClick={() => setOpen(s)} />
              </Reveal>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
