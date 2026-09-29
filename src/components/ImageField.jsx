// Medan gambar soalan: muat naik dari peranti, seret & lepas, tampal (Ctrl+V),
// atau taip laluan gambar rasmi. Gambar dimampatkan dalam pelayar.
import { useRef, useState } from 'react';
import { Icon } from './ui.jsx';
import { assetUrl } from '../lib/quiz.js';
import {
  compressImageFile, dataUrlBytes, formatBytes, isDataUrl,
} from '../lib/imageUpload.js';

export default function ImageField({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [drag, setDrag] = useState(false);
  const [manual, setManual] = useState(false);
  const fileRef = useRef(null);

  async function take(file) {
    if (!file) return;
    setBusy(true);
    setError('');
    setNote('');
    try {
      const r = await compressImageFile(file);
      onChange(r.dataUrl);
      setNote(`${r.width}×${r.height} px · ${formatBytes(r.bytes)}`
        + (r.originalBytes > r.bytes ? ` (dari ${formatBytes(r.originalBytes)})` : ''));
    } catch (e) {
      setError(e.message || 'Gagal memproses gambar.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDrag(false);
    const f = [...(e.dataTransfer?.files || [])].find(x => x.type.startsWith('image/'));
    if (f) take(f);
  }

  function onPaste(e) {
    const item = [...(e.clipboardData?.items || [])].find(x => x.type.startsWith('image/'));
    if (item) {
      e.preventDefault();
      take(item.getAsFile());
    }
  }

  const has = Boolean(value);
  const uploaded = isDataUrl(value);

  return (
    <div className="field image-field">
      <span className="field-label">Gambar soalan <span className="muted small">(pilihan)</span></span>

      {has && (
        <div className="image-preview">
          <img src={assetUrl(value)} alt="Pratonton gambar soalan" />
          <div className="image-preview-meta">
            <span className="muted small">
              {uploaded ? `Dimuat naik · ${formatBytes(dataUrlBytes(value))}` : value}
            </span>
            <button type="button" className="btn btn-ghost btn-sm btn-danger" onClick={() => { onChange(''); setNote(''); }}>
              <Icon name="x" /> Buang gambar
            </button>
          </div>
        </div>
      )}

      {!has && (
        <div
          className={'image-drop' + (drag ? ' is-drag' : '') + (busy ? ' is-busy' : '')}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onPaste={onPaste}
          tabIndex={0}
          role="button"
          onClick={() => fileRef.current?.click()}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click(); } }}
        >
          {busy ? <span>Memproses gambar…</span> : (
            <>
              <strong>Pilih gambar</strong>
              <span className="muted small">Seret ke sini, tampal (Ctrl+V), atau tekan untuk pilih fail</span>
              <span className="muted small">Gambar dikecilkan automatik supaya laman kekal pantas</span>
            </>
          )}
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" hidden
        onChange={e => take(e.target.files?.[0])} />

      <div className="image-field-actions">
        {has && (
          <button type="button" className="btn btn-outline btn-sm" disabled={busy}
            onClick={() => fileRef.current?.click()}>Tukar gambar</button>
        )}
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setManual(m => !m)}>
          {manual ? 'Sembunyi laluan' : 'Guna laluan gambar rasmi'}
        </button>
      </div>

      {manual && (
        <input className="input" value={uploaded ? '' : value} placeholder="images/darjah-1/…"
          onChange={e => onChange(e.target.value)} />
      )}

      {note && <p className="muted small">{note}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}
