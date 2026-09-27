// Perlumbaan: sertai dengan PIN, atau cipta perlumbaan baharu (hos).
import { useEffect, useMemo, useState } from 'react';
import { BackButton, GlowButton, PageHead, Reveal } from '../../components/ui.jsx';
import { filterByYear, loadQuestions, objectiveOnly, prepareQuestion, shuffle, yearOf } from '../../lib/quiz.js';
import { createRace, joinRace, raceReady } from '../../lib/race.js';
import { SET_EXAM_LABEL, listMySets } from '../../lib/teacherSets.js';
import RaceRoom from './RaceRoom.jsx';

export default function RaceHub({ user, config, presetClass, teacher, onBack, onRaceEnd }) {
  const [room, setRoom] = useState(null); // { pin, isHost }
  const [pin, setPin] = useState('');
  const [name, setName] = useState(user.isGuest ? '' : user.name);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Borang hos
  const exams = config?.exams || [];
  const [examId, setExamId] = useState(exams[0]?.id);
  const exam = exams.find(e => e.id === examId);
  const [subjectId, setSubjectId] = useState(exam?.subjects[0]?.id);
  const subject = exam?.subjects.find(s => s.id === subjectId);
  const [questions, setQuestions] = useState(null);
  const [year, setYear] = useState('');
  const [count, setCount] = useState(10);
  const [hostPlays, setHostPlays] = useState(!teacher && !presetClass);
  const [source, setSource] = useState('official'); // 'official' | 'set' (cikgu sahaja)
  const [sets, setSets] = useState(null);
  const [setId, setSetId] = useState('');
  const chosenSet = sets?.find(s => s.id === setId);

  useEffect(() => {
    if (source !== 'set' || sets) return;
    listMySets(user.uid).then(list => { setSets(list); setSetId(list[0]?.id || ''); }).catch(() => setSets([]));
  }, [source, sets, user.uid]);

  useEffect(() => {
    if (!subject) return;
    setQuestions(null);
    loadQuestions(subject.file).then(qs => setQuestions(objectiveOnly(qs))).catch(() => setQuestions([]));
  }, [subject]);
  const years = useMemo(() => [...new Set((questions || []).map(yearOf))].sort().reverse(), [questions]);
  const available = source === 'set'
    ? objectiveOnly(chosenSet?.questions || [])
    : questions ? filterByYear(questions, year || null) : [];
  const n = Math.min(count, available.length);

  if (!raceReady) {
    return (
      <section className="screen">
        <BackButton onClick={onBack} />
        <p className="alert alert-warn">Perlumbaan belum disediakan (Realtime Database Firebase belum dikonfigurasi).</p>
      </section>
    );
  }

  if (room) {
    return (
      <RaceRoom pin={room.pin} user={user} config={config} isHost={room.isHost}
        onExit={() => setRoom(null)} onRaceEnd={onRaceEnd} />
    );
  }

  async function join(e) {
    e.preventDefault();
    const clean = pin.replace(/\D/g, '');
    if (clean.length !== 6) return setError('PIN mesti 6 digit.');
    if (!name.trim()) return setError('Masukkan nama anda.');
    setBusy(true);
    setError('');
    try {
      await joinRace(clean, user, name);
      setRoom({ pin: clean, isHost: false });
    } catch (err) {
      setError(err.code === 'PERMISSION_DENIED' ? 'Tidak dapat menyertai perlumbaan ini.' : err.message);
    } finally {
      setBusy(false);
    }
  }

  async function host(e) {
    e.preventDefault();
    if (!n) return;
    if (hostPlays && !name.trim()) return setError('Masukkan nama anda untuk bermain.');
    setBusy(true);
    setError('');
    try {
      const originals = shuffle(available).slice(0, n);
      const picked = originals.map(q => prepareQuestion(q));
      const base = source === 'set'
        ? {
          examId: null, examName: SET_EXAM_LABEL, subjectId: null, subjectName: chosenSet.title, year: null,
          // Salinan soalan set cikgu (tanpa medan undefined — Realtime Database tidak menerimanya).
          questions: JSON.parse(JSON.stringify(originals)),
        }
        : { examId: exam.id, examName: exam.name, subjectId: subject.id, subjectName: subject.name, year: year || null };
      const newPin = await createRace(user, {
        ...base,
        classId: presetClass?.id || null,
        order: picked.map(q => ({ id: q.id, perm: q.perm })),
      });
      if (hostPlays) await joinRace(newPin, user, name);
      setRoom({ pin: newPin, isHost: true });
    } catch (err) {
      setError('Gagal mencipta perlumbaan: ' + (err.code || err.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="screen">
      <BackButton onClick={onBack} />
      <PageHead badge={presetClass ? presetClass.name : 'Langsung'} title="🏁 Perlumbaan" />

      {!presetClass && (
        <Reveal>
          <form className="card form-card" onSubmit={join} noValidate>
            <p className="field-label">Sertai perlumbaan</p>
            <input className="input input-code" value={pin} inputMode="numeric" maxLength={7} placeholder="123 456"
              aria-label="PIN perlumbaan" onChange={e => { setPin(e.target.value); setError(''); }} />
            <input className="input" value={name} maxLength={30} placeholder="Nama anda" aria-label="Nama"
              onChange={e => { setName(e.target.value); setError(''); }} />
            <GlowButton className="glow-lg" type="submit" disabled={busy}>Sertai</GlowButton>
          </form>
        </Reveal>
      )}

      <Reveal index={1}>
        <form className="card form-card" onSubmit={host}>
          <p className="field-label">{presetClass ? 'Hos perlumbaan untuk kelas' : 'Cipta perlumbaan & cabar kawan'}</p>
          {teacher && (
            <div className="chips" role="radiogroup" aria-label="Sumber soalan">
              <button type="button" className={'chip' + (source === 'official' ? ' is-active' : '')} onClick={() => setSource('official')}>📚 Bank rasmi</button>
              <button type="button" className={'chip' + (source === 'set' ? ' is-active' : '')} onClick={() => setSource('set')}>📝 Set soalan saya</button>
            </div>
          )}
          {source === 'set' ? (
            sets === null ? <p className="muted small">Memuatkan set…</p> : !sets.length ? (
              <p className="alert">Belum ada set soalan. Cipta di Panel Cikgu → Soalan saya.</p>
            ) : (
              <label className="field">
                <span className="field-hint">Set soalan</span>
                <select className="input" value={setId} onChange={e => setSetId(e.target.value)}>
                  {sets.map(s => <option key={s.id} value={s.id}>{s.title} ({objectiveOnly(s.questions).length} soalan)</option>)}
                </select>
              </label>
            )
          ) : (
          <div className="field-row">
            <label className="field">
              <span className="field-hint">Peperiksaan</span>
              <select className="input" value={examId} onChange={e => {
                setExamId(e.target.value);
                setSubjectId(exams.find(x => x.id === e.target.value)?.subjects[0]?.id);
                setYear('');
              }}>
                {exams.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span className="field-hint">Subjek</span>
              <select className="input" value={subjectId} onChange={e => { setSubjectId(e.target.value); setYear(''); }}>
                {exam?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
          </div>
          )}
          <div className="field-row">
            {source !== 'set' && <label className="field">
              <span className="field-hint">Tahun</span>
              <select className="input" value={year} onChange={e => setYear(e.target.value)}>
                <option value="">Semua tahun</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>}
            <label className="field">
              <span className="field-hint">Bilangan soalan</span>
              <select className="input" value={count} onChange={e => setCount(Number(e.target.value))}>
                {[5, 10, 15, 20].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>
          <label className="check">
            <input type="checkbox" checked={hostPlays} onChange={e => setHostPlays(e.target.checked)} />
            Saya pun nak main (jika tidak, anda hanya memantau papan kedudukan)
          </label>
          {hostPlays && presetClass && (
            <input className="input" value={name} maxLength={30} placeholder="Nama anda" onChange={e => setName(e.target.value)} />
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          <GlowButton className="glow-lg" type="submit" disabled={busy || !n}>
            {busy ? 'Mencipta…' : `Cipta perlumbaan (${n} soalan)`}
          </GlowButton>
        </form>
      </Reveal>
    </section>
  );
}
