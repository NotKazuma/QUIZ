// Satu set soalan cikgu: sunting soalan (QuestionBank), salin dari bank rasmi, tukar nama, padam.
import { useState } from 'react';
import QuestionBank from '../../components/QuestionBank.jsx';
import { BackButton, PageHead } from '../../components/ui.jsx';
import {
  copyIntoSet, deleteSet, newSetQuestion, renameSet, saveSetQuestions,
} from '../../lib/teacherSets.js';
import OfficialPicker from './OfficialPicker.jsx';
import Emoji from '../../components/Emoji.jsx';

export default function SetDetail({ config, set, adminView, onBack, onChange, onDeleted }) {
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(set.title);
  const [subjectLabel, setSubjectLabel] = useState(set.subjectLabel || '');

  async function persist(next) {
    setSaving(true);
    try {
      onChange(await saveSetQuestions(set, next));
      return true;
    } catch (e) {
      alert('Gagal menyimpan: ' + (e.code || e.message));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function addFromOfficial(questions) {
    const { next, added, skipped } = copyIntoSet(set, questions);
    if (!added) {
      alert('Semua soalan yang dipilih sudah ada dalam set ini.');
      return false;
    }
    const ok = await persist(next);
    if (ok) {
      alert(`${added} soalan ditambah ke "${set.title}".` + (skipped ? ` ${skipped} sudah ada dan dilangkau.` : ''));
      setPicking(false);
    }
    return ok;
  }

  async function saveName(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      onChange(await renameSet(set, { title, subjectLabel }));
      setRenaming(false);
    } catch (err) {
      alert('Gagal: ' + (err.code || err.message));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Padam set "${set.title}" bersama ${set.questions.length} soalan? Kerja rumah yang sudah diberi tidak terjejas.`)) return;
    await deleteSet(set.id);
    onDeleted(set.id);
  }

  if (picking) {
    return <OfficialPicker config={config} targetTitle={set.title} onBack={() => setPicking(false)} onAdd={addFromOfficial} />;
  }

  return (
    <section className="set-detail">
      <BackButton onClick={onBack} />
      <PageHead badge={adminView ? `Set oleh ${set.ownerName}` : 'Set soalan saya'} title={set.title} />

      {renaming ? (
        <form className="card form-card" onSubmit={saveName}>
          <input className="input" value={title} maxLength={60} onChange={e => setTitle(e.target.value)} aria-label="Tajuk" />
          <input className="input" value={subjectLabel} maxLength={40} placeholder="Subjek (pilihan)"
            onChange={e => setSubjectLabel(e.target.value)} aria-label="Subjek" />
          <div className="editor-actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>Simpan</button>
            <button className="btn btn-ghost" type="button" onClick={() => setRenaming(false)}>Batal</button>
          </div>
        </form>
      ) : (
        <div className="set-actions">
          <button className="btn btn-outline" onClick={() => setPicking(true)}><Emoji e="📥" /> Salin dari bank rasmi</button>
          <button className="btn btn-ghost" onClick={() => setRenaming(true)}><Emoji e="✏️" /> Tukar nama</button>
          <button className="btn btn-ghost btn-danger" onClick={remove}>Padam set</button>
        </div>
      )}

      <QuestionBank key={set.id} questions={set.questions} saving={saving} onPersist={persist}
        newTemplate={() => newSetQuestion(set)}
        emptyText="Set ini masih kosong. Tambah soalan sendiri, atau salin dari bank rasmi." />
    </section>
  );
}
