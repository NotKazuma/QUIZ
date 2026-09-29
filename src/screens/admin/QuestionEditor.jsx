// Borang sunting satu soalan (objektif atau subjektif).
import { useState } from 'react';
import { BackButton, Icon } from '../../components/ui.jsx';
import ImageField from '../../components/ImageField.jsx';
import { DIFFICULTY, DIFFICULTY_ORDER } from '../../lib/challenge.js';

const SCRIPTS = [
  { id: 'rumi', label: 'Rumi' },
  { id: 'jawi', label: 'Jawi' },
  { id: 'arab', label: 'Arab' },
  { id: 'campur', label: 'Campur' },
];

export default function QuestionEditor({ question, isNew, saving, onCancel, onSave, onDelete }) {
  const [q, setQ] = useState(() => ({ ...question, options: [...(question.options || [])] }));
  const [error, setError] = useState('');
  const set = (key, value) => setQ(x => ({ ...x, [key]: value }));
  const rtl = q.script === 'jawi' || q.script === 'arab';
  const textProps = { dir: rtl ? 'rtl' : 'auto', className: 'input textarea' + (rtl ? ' script-arabic' : '') };

  function setOption(i, value) {
    setQ(x => ({ ...x, options: x.options.map((o, j) => (j === i ? value : o)) }));
  }
  function addOption() {
    setQ(x => ({ ...x, options: [...x.options, ''] }));
  }
  function removeOption(i) {
    setQ(x => {
      const options = x.options.filter((_, j) => j !== i);
      let answer = x.answer;
      if (i === answer) answer = 0;
      else if (i < answer) answer -= 1;
      return { ...x, options, answer };
    });
  }

  function submit(e) {
    e.preventDefault();
    const clean = { ...q, question: q.question.trim(), explanation: (q.explanation || '').trim() };
    if (!clean.question) return setError('Teks soalan tidak boleh kosong.');
    if (clean.type === 'objektif') {
      clean.options = clean.options.map(o => o.trim());
      if (clean.options.length < 2) return setError('Soalan objektif perlukan sekurang-kurangnya 2 pilihan.');
      if (clean.options.some(o => !o)) return setError('Ada pilihan jawapan yang kosong.');
      if (clean.answer == null || clean.answer >= clean.options.length) return setError('Pilih jawapan yang betul.');
    } else {
      clean.options = [];
      clean.answer = null;
    }
    if (!clean.perlu_semak) delete clean.nota_semak;
    setError('');
    onSave(clean);
  }

  return (
    <form className="q-editor" onSubmit={submit}>
      <BackButton onClick={onCancel} />
      <h3>{isNew ? 'Soalan baharu' : 'Sunting soalan'}</h3>
      <p className="muted small"><code>{q.id}</code> · {q.exam} · {q.subject}</p>

      <div className="field-row">
        <label className="field">
          <span className="field-label">Jenis</span>
          <select className="input" value={q.type} onChange={e => set('type', e.target.value)}>
            <option value="objektif">Objektif</option>
            <option value="subjektif">Subjektif</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">Tulisan</span>
          <select className="input" value={q.script} onChange={e => set('script', e.target.value)}>
            {SCRIPTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Tahap</span>
          <select className="input" value={q.difficulty || 'sederhana'} onChange={e => set('difficulty', e.target.value)}>
            {DIFFICULTY_ORDER.map(l => <option key={l} value={l}>{DIFFICULTY[l].label}</option>)}
          </select>
        </label>
      </div>

      <label className="field">
        <span className="field-label">Soalan</span>
        <textarea {...textProps} rows={4} value={q.question} onChange={e => set('question', e.target.value)} />
      </label>

      {q.type === 'objektif' ? (
        <fieldset className="field options-edit">
          <legend className="field-label">Pilihan jawapan (tandakan yang betul)</legend>
          {q.options.map((o, i) => (
            <div key={i} className={'option-edit' + (q.answer === i ? ' is-answer' : '')}>
              <input type="radio" name="answer" checked={q.answer === i} onChange={() => set('answer', i)}
                aria-label={'Jawapan betul: pilihan ' + (i + 1)} />
              <input {...textProps} className={'input' + (rtl ? ' script-arabic' : '')} value={o}
                onChange={e => setOption(i, e.target.value)} placeholder={'Pilihan ' + (i + 1)} />
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => removeOption(i)}
                disabled={q.options.length <= 2} aria-label="Buang pilihan"><Icon name="x" /></button>
            </div>
          ))}
          <button type="button" className="btn btn-outline" onClick={addOption}>+ Tambah pilihan</button>
        </fieldset>
      ) : (
        <label className="field">
          <span className="field-label">Skema jawapan</span>
          <textarea {...textProps} rows={3} value={q.answer_text || ''} onChange={e => set('answer_text', e.target.value)} />
        </label>
      )}

      <label className="field">
        <span className="field-label">Penerangan (dipapar selepas menjawab)</span>
        <textarea {...textProps} rows={3} value={q.explanation || ''} onChange={e => set('explanation', e.target.value)} />
      </label>

      <label className="field">
        <span className="field-label">Sumber</span>
        <input className="input" value={q.source || ''} placeholder="cth. UPKK 2024" onChange={e => set('source', e.target.value)} />
      </label>

      <ImageField value={q.image || ''} onChange={v => set('image', v || null)} />

      <label className="check check-lg">
        <input type="checkbox" checked={Boolean(q.perlu_semak)} onChange={e => set('perlu_semak', e.target.checked)} />
        Perlu disemak
      </label>
      {q.perlu_semak && (
        <label className="field">
          <span className="field-label">Nota semakan</span>
          <input className="input" value={q.nota_semak || ''} onChange={e => set('nota_semak', e.target.value)} />
        </label>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="editor-actions">
        <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</button>
        <button type="button" className="btn btn-outline btn-lg" onClick={onCancel}>Batal</button>
        {!isNew && (
          <button type="button" className="btn btn-ghost btn-lg btn-danger" disabled={saving} onClick={() => onDelete(q)}>
            Padam soalan
          </button>
        )}
      </div>
    </form>
  );
}
