// Pengurus senarai soalan yang dikongsi oleh admin (bank rasmi) dan cikgu (set soalan sendiri):
// cari, tapis, susun, pilih (select) beberapa soalan dan tindakan pukal, serta sunting satu-satu.
import { useMemo, useState } from 'react';
import { DifficultyBadge } from '../screens/Challenge.jsx';
import QuestionEditor from '../screens/admin/QuestionEditor.jsx';
import { DIFFICULTY, DIFFICULTY_ORDER } from '../lib/challenge.js';
import { yearOf } from '../lib/quiz.js';
import Emoji, { EmojiText } from './Emoji.jsx';

const SORTS = [
  { id: 'asal', label: 'Susunan asal' },
  { id: 'baharu', label: 'Terbaru disunting' },
  { id: 'tahap-asc', label: 'Tahap: Mudah → Susah' },
  { id: 'tahap-desc', label: 'Tahap: Susah → Mudah' },
  { id: 'semak', label: 'Perlu semak dahulu' },
  { id: 'tahun', label: 'Tahun terbaru dahulu' },
  { id: 'abjad', label: 'Teks soalan (A–Z)' },
];
const LEVEL_RANK = { mudah: 0, sederhana: 1, susah: 2 };

export default function QuestionBank({
  questions, editable = true, saving = false, onPersist, newTemplate, extraBulk = [], header, emptyText,
}) {
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [review, setReview] = useState('');   // '' | 'perlu' | 'siap'
  const [type, setType] = useState('');
  const [year, setYear] = useState('');
  const [sort, setSort] = useState('asal');
  const [selected, setSelected] = useState(() => new Set());
  const [bulkLevel, setBulkLevel] = useState('');

  const years = useMemo(() => [...new Set((questions || []).map(yearOf))].sort().reverse(), [questions]);
  const counts = useMemo(() => ({
    total: questions?.length || 0,
    review: (questions || []).filter(q => q.perlu_semak).length,
  }), [questions]);

  const shown = useMemo(() => {
    const s = search.trim().toLowerCase();
    const list = (questions || []).map((q, i) => ({ q, i })).filter(({ q }) => {
      if (level && (q.difficulty || 'sederhana') !== level) return false;
      if (review === 'perlu' && !q.perlu_semak) return false;
      if (review === 'siap' && q.perlu_semak) return false;
      if (type && q.type !== type) return false;
      if (year && yearOf(q) !== year) return false;
      return !s || q.question.toLowerCase().includes(s) || q.id.toLowerCase().includes(s)
        || (q.options || []).some(o => o.toLowerCase().includes(s));
    });
    const by = {
      baharu: (a, b) => (b.q.updatedAt || '').localeCompare(a.q.updatedAt || '') || a.i - b.i,
      'tahap-asc': (a, b) => LEVEL_RANK[a.q.difficulty || 'sederhana'] - LEVEL_RANK[b.q.difficulty || 'sederhana'] || a.i - b.i,
      'tahap-desc': (a, b) => LEVEL_RANK[b.q.difficulty || 'sederhana'] - LEVEL_RANK[a.q.difficulty || 'sederhana'] || a.i - b.i,
      semak: (a, b) => Number(Boolean(b.q.perlu_semak)) - Number(Boolean(a.q.perlu_semak)) || a.i - b.i,
      tahun: (a, b) => yearOf(b.q).localeCompare(yearOf(a.q)) || a.i - b.i,
      abjad: (a, b) => a.q.question.localeCompare(b.q.question, 'ms'),
    }[sort];
    if (by) list.sort(by);
    return list.map(x => x.q);
  }, [questions, search, level, review, type, year, sort]);

  const selectedList = (questions || []).filter(q => selected.has(q.id));
  const allShownSelected = shown.length > 0 && shown.every(q => selected.has(q.id));
  const filtered = level || review || type || year || search;

  function toggle(id) {
    setSelected(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected(s => {
      const next = new Set(s);
      if (allShownSelected) shown.forEach(q => next.delete(q.id));
      else shown.forEach(q => next.add(q.id));
      return next;
    });
  }
  function clearFilters() {
    setSearch(''); setLevel(''); setReview(''); setType(''); setYear('');
  }

  // ===== Simpanan =====
  async function saveQuestion(q) {
    const stamped = { ...q, updatedAt: new Date().toISOString() };
    const exists = questions.some(x => x.id === q.id);
    const next = exists ? questions.map(x => (x.id === q.id ? stamped : x)) : [...questions, stamped];
    if (await onPersist(next)) setEditing(null);
  }
  async function deleteQuestion(q) {
    if (!confirm('Padam soalan ini? Tindakan ini tidak boleh dibatalkan.')) return;
    if (await onPersist(questions.filter(x => x.id !== q.id))) setEditing(null);
  }
  function markReviewed(q) {
    onPersist(questions.map(x => (x.id === q.id ? { ...x, perlu_semak: false, updatedAt: new Date().toISOString() } : x)));
  }

  // ===== Tindakan pukal =====
  async function bulkUpdate(patch, label) {
    if (!confirm(`${label} untuk ${selected.size} soalan?`)) return;
    const now = new Date().toISOString();
    if (await onPersist(questions.map(q => (selected.has(q.id) ? { ...q, ...patch, updatedAt: now } : q)))) {
      setSelected(new Set());
    }
  }
  async function bulkDelete() {
    if (!confirm(`Padam ${selected.size} soalan? Tindakan ini tidak boleh dibatalkan.`)) return;
    if (await onPersist(questions.filter(q => !selected.has(q.id)))) setSelected(new Set());
  }

  if (editing) {
    return (
      <QuestionEditor question={editing} saving={saving}
        isNew={!questions?.some(x => x.id === editing.id)}
        onCancel={() => setEditing(null)} onSave={saveQuestion} onDelete={deleteQuestion} />
    );
  }

  return (
    <div className="qbank">
      {header}
      <p className="muted small">
        {counts.total} soalan{counts.review > 0 && <> · <b>{counts.review}</b> perlu disemak</>}
        {filtered && <> · {shown.length} sepadan · <button className="link-btn" onClick={clearFilters}>kosongkan tapisan</button></>}
      </p>

      <div className="qbank-filters">
        <input className="input qbank-search" type="search" placeholder="Cari soalan, jawapan atau ID…" value={search}
          onChange={e => setSearch(e.target.value)} />
        <select className="input" value={level} onChange={e => setLevel(e.target.value)} aria-label="Tapis tahap">
          <option value="">Semua tahap</option>
          {DIFFICULTY_ORDER.map(l => <option key={l} value={l}>{DIFFICULTY[l].label}</option>)}
        </select>
        <select className="input" value={review} onChange={e => setReview(e.target.value)} aria-label="Tapis semakan">
          <option value="">Semua status</option>
          <option value="perlu">Perlu semak</option>
          <option value="siap">✓ Sudah disemak</option>
        </select>
        <select className="input" value={type} onChange={e => setType(e.target.value)} aria-label="Tapis jenis">
          <option value="">Semua jenis</option>
          <option value="objektif">Objektif</option>
          <option value="subjektif">Subjektif</option>
        </select>
        {years.length > 1 && (
          <select className="input" value={year} onChange={e => setYear(e.target.value)} aria-label="Tapis tahun">
            <option value="">Semua tahun</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
        <select className="input" value={sort} onChange={e => setSort(e.target.value)} aria-label="Susun">
          {SORTS.map(s => <option key={s.id} value={s.id}>↕ {s.label}</option>)}
        </select>
      </div>

      {editable && newTemplate && (
        <button className="btn btn-primary btn-lg" onClick={() => setEditing(newTemplate())}>+ Tambah soalan</button>
      )}

      <div className="qbank-selectbar">
        <label className="check">
          <input type="checkbox" checked={allShownSelected} onChange={toggleAll} disabled={!shown.length} />
          Pilih semua{filtered ? ' yang dipapar' : ''} ({shown.length})
        </label>
        {selected.size > 0 && <button className="link-btn" onClick={() => setSelected(new Set())}>Nyahpilih {selected.size}</button>}
      </div>

      {selected.size > 0 && (
        <div className="bulk-bar" role="toolbar" aria-label="Tindakan pukal">
          <span className="bulk-count">{selected.size} dipilih</span>
          {extraBulk.map(a => (
            <button key={a.label} className="btn btn-primary btn-sm" disabled={saving}
              onClick={async () => { if (await a.onRun(selectedList)) setSelected(new Set()); }}>
              <EmojiText>{a.label}</EmojiText>
            </button>
          ))}
          {editable && (
            <>
              <button className="btn btn-outline btn-sm" disabled={saving}
                onClick={() => bulkUpdate({ perlu_semak: false }, 'Tandakan sudah disemak')}>✓ Disemak</button>
              <select className="input input-sm" value={bulkLevel} disabled={saving} aria-label="Tukar tahap"
                onChange={e => { const v = e.target.value; setBulkLevel(''); if (v) bulkUpdate({ difficulty: v }, `Tukar tahap ke ${DIFFICULTY[v].label}`); }}>
                <option value="">Tukar tahap…</option>
                {DIFFICULTY_ORDER.map(l => <option key={l} value={l}>{DIFFICULTY[l].label}</option>)}
              </select>
              <button className="btn btn-ghost btn-sm btn-danger" disabled={saving} onClick={bulkDelete}>Padam</button>
            </>
          )}
        </div>
      )}

      <div className="q-list">
        {shown.map(q => {
          const rtl = q.script === 'jawi' || q.script === 'arab';
          const isSel = selected.has(q.id);
          return (
            <div key={q.id} className={'card q-row' + (q.perlu_semak ? ' needs-review' : '') + (isSel ? ' is-selected' : '')}>
              <div className="q-row-top">
                <input type="checkbox" className="q-check" checked={isSel} onChange={() => toggle(q.id)}
                  aria-label={'Pilih soalan ' + q.id} />
                <button className="q-row-main" onClick={() => (editable ? setEditing(q) : toggle(q.id))}>
                  <span className="q-row-meta">
                    <code>{q.id}</code>
                    <DifficultyBadge level={q.difficulty} />
                    {q.type !== 'objektif' && <span className="role role-guest">{q.type}</span>}
                    {q.source && <span className="muted small">{q.source}</span>}
                  </span>
                  <span className={'q-row-text' + (rtl ? ' script-arabic' : '')} dir={rtl ? 'rtl' : 'auto'}>{q.question}</span>
                  {q.type === 'objektif' && (
                    <span className={'q-row-answer' + (rtl ? ' script-arabic' : '')} dir={rtl ? 'rtl' : 'auto'}>✓ {q.options[q.answer]}</span>
                  )}
                  {q.perlu_semak && q.nota_semak && <span className="q-row-note"><Emoji e="⚠️" /> {q.nota_semak}</span>}
                </button>
              </div>
              {editable && q.perlu_semak && (
                <button className="btn btn-outline btn-sm" disabled={saving} onClick={() => markReviewed(q)}>✓ Sudah disemak</button>
              )}
            </div>
          );
        })}
        {!shown.length && <p className="alert">{questions?.length ? 'Tiada soalan sepadan dengan tapisan.' : emptyText || 'Belum ada soalan.'}</p>}
      </div>
    </div>
  );
}
