// "Saya cikgu": akaun DELIMa guru terus disahkan; selain itu hantar permohonan untuk kelulusan admin.
import { useState } from 'react';
import { BackButton, GlowButton, GoogleButton, PageHead, Reveal } from '../../components/ui.jsx';
import { submitTeacherRequest } from '../../lib/firebase.js';
import Emoji from '../../components/Emoji.jsx';

export default function TeacherApply({ user, request, onSubmitted, onLink, onBack }) {
  const [school, setSchool] = useState(request?.school || '');
  const [note, setNote] = useState(request?.note || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (school.trim().length < 3) return setError('Masukkan nama sekolah anda.');
    setBusy(true);
    setError('');
    try {
      onSubmitted(await submitTeacherRequest(user, { school, note }));
    } catch (err) {
      setError('Gagal menghantar permohonan: ' + (err.code || err.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="screen">
      <BackButton onClick={onBack} />
      <PageHead badge="Cikgu" title="Saya seorang cikgu" />

      <Reveal className="card verify-card">
        <p className="verify-title"><Emoji e="⚡" /> Pengesahan automatik (disyorkan)</p>
        <p className="muted small">
          Log masuk dengan <b>akaun DELIMa guru</b> anda (bermula dengan <code>g-</code>, contohnya
          <code> g-12345678@moe-dl.edu.my</code>). Akaun ini disahkan terus oleh sistem dan Panel Cikgu akan dibuka serta-merta.
        </p>
        {user.isGuest ? (
          <GoogleButton className="btn-google-sm" onClick={onLink}>Log masuk dengan Google</GoogleButton>
        ) : (
          <p className="muted small">Anda sedang log masuk sebagai <b>{user.email}</b>. Untuk guna akaun DELIMa, log keluar dan log masuk semula dengan akaun tersebut.</p>
        )}
      </Reveal>

      <Reveal index={1} className="card verify-card">
        <p className="verify-title"><Emoji e="📝" /> Mohon kelulusan admin</p>
        {user.isGuest ? (
          <p className="muted small">Tiada akaun DELIMa? Pautkan akaun Google dahulu, kemudian hantar permohonan di sini.</p>
        ) : request?.status === 'pending' ? (
          <p className="alert"><Emoji e="⏳" /> Permohonan anda ({request.school}) sedang disemak oleh admin. Panel Cikgu akan muncul di halaman utama sebaik sahaja diluluskan.</p>
        ) : (
          <form className="form-card flat" onSubmit={submit} noValidate>
            {request?.status === 'rejected' && (
              <p className="alert alert-warn">Permohonan sebelum ini tidak diluluskan. Anda boleh hantar semula dengan maklumat tambahan.</p>
            )}
            <label className="field">
              <span className="field-label">Nama sekolah</span>
              <input className="input" value={school} maxLength={80} placeholder="cth. SRA Taman Melati"
                onChange={e => { setSchool(e.target.value); setError(''); }} />
            </label>
            <label className="field">
              <span className="field-label">Maklumat tambahan (pilihan)</span>
              <textarea className="input textarea" rows={3} value={note} maxLength={300}
                placeholder="cth. Mengajar Pendidikan Islam Tahun 6"
                onChange={e => setNote(e.target.value)} />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <GlowButton className="glow-lg" type="submit" disabled={busy}>{busy ? 'Menghantar…' : 'Hantar permohonan'}</GlowButton>
          </form>
        )}
      </Reveal>
    </section>
  );
}
