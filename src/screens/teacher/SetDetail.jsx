// Satu set soalan cikgu: sunting soalan (QuestionBank), salin dari bank rasmi, tukar nama, padam.
import { useState } from 'react';
import QuestionBank from '../../components/QuestionBank.jsx';
import { BackButton, PageHead } from '../../components/ui.jsx';
import {
  copyIntoSet, deleteSet, listSetAttempts, newSetQuestion, renameSet, saveSetQuestions, setShareOpen,
} from '../../lib/teacherSets.js';
import OfficialPicker from './OfficialPicker.jsx';
import Emoji from '../../components/Emoji.jsx';
import { ask } from '../../components/ConfirmDialog.jsx';
import { copyLink, countOptions, setLink } from '../../lib/share.js';

export default function SetDetail({ config, set, adminView, onBack, onChange, onDeleted }) {
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(set.title);
  const [subjectLabel, setSubjectLabel] = useState(set.subjectLabel || '');
  const [shareCount, setShareCount] = useState(null); // null = semua soalan
  const [copied, setCopied] = useState(false);
  const [results, setResults] = useState(null);       // keputusan murid yang menjawab pautan
  const [loadingRes, setLoadingRes] = useState(false);

  async function loadResults() {
    setLoadingRes(true);
    try { setResults(await listSetAttempts(set.id)); }
    catch { alert('Gagal memuat keputusan.'); }
    finally { setLoadingRes(false); }
  }

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
    if (!await ask(`Padam set "${set.title}" bersama ${set.questions.length} soalan? Kerja rumah yang sudah diberi tidak terjejas.`)) return;
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

      {/* Kongsi set sebagai pautan latihan — murid tekan terus untuk berlatih. */}
      {set.questions.length > 0 && !renaming && (
        <div className="card share-card">
          <span className="sheet-label"><Emoji e="🔗" /> Kongsi latihan ini</span>
          <p className="muted-note">Awam — sesiapa dengan pautan boleh menjawab (Tetamu pun boleh, cuma masukkan nama). Keputusan hanya untuk set anda, tidak bercampur dengan set cikgu lain.</p>
          <p className="muted-note">Nak jejak soalan bank rasmi? Tekan "Salin dari bank rasmi" di atas untuk masukkan soalan rasmi ke set ini, kemudian kongsi.</p>

          {set.shareOpen === false ? (
            <>
              <p className="muted-note">Pautan ditutup — murid tidak boleh menjawab.</p>
              <button className="btn btn-primary" onClick={async () => {
                try { onChange(await setShareOpen(set, true)); } catch { alert('Gagal membuka pautan.'); }
              }}><Emoji e="🔓" /> Buka semula pautan</button>
            </>
          ) : (
            <>
              {countOptions(set.questions.length).length > 0 && (
                <div className="count-chips" role="radiogroup" aria-label="Bilangan soalan">
                  {countOptions(set.questions.length).map(n => (
                    <button key={n} className={'chip' + (shareCount === n ? ' is-active' : '')}
                      onClick={() => setShareCount(n)}>{n}</button>
                  ))}
                  <button className={'chip' + (shareCount === null ? ' is-active' : '')}
                    onClick={() => setShareCount(null)}>Semua ({set.questions.length})</button>
                </div>
              )}
              <button className="btn btn-primary" onClick={async () => {
                const ok = await copyLink(setLink({ setId: set.id, count: shareCount }));
                setCopied(ok); setTimeout(() => setCopied(false), 2000);
              }}>
                <Emoji e="📋" /> {copied ? 'Pautan disalin!' : 'Salin pautan latihan'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={async () => {
                try { onChange(await setShareOpen(set, false)); } catch { alert('Gagal menutup pautan.'); }
              }}><Emoji e="🔒" /> Tutup pautan (bila dah selesai)</button>
            </>
          )}

          <button className="btn btn-ghost" onClick={loadResults} disabled={loadingRes}>
            <Emoji e="📊" /> {loadingRes ? 'Memuat…' : 'Lihat siapa menjawab'}
          </button>

          {results && (
            results.length === 0 ? (
              <p className="muted-note">Belum ada murid menjawab pautan ini.</p>
            ) : (
              <div className="attempts">
                <div className="attempts-head"><span>Nama</span><span>Terbaik</span><span>Terakhir</span><span>Cubaan</span></div>
                {results.map(a => (
                  <div className="attempts-row" key={a.uid}>
                    <span className="at-name">{a.name}</span>
                    <span className="at-best">{a.best}%</span>
                    <span>{a.lastScore}/{a.lastTotal}</span>
                    <span>{a.attempts}×</span>
                  </div>
                ))}
                <p className="muted-note">{results.length} murid · tekan semula untuk kemas kini</p>
              </div>
            )
          )}
        </div>
      )}

      <QuestionBank key={set.id} questions={set.questions} saving={saving} onPersist={persist}
        newTemplate={() => newSetQuestion(set)}
        emptyText="Set ini masih kosong. Tambah soalan sendiri, atau salin dari bank rasmi." />
    </section>
  );
}
