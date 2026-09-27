import { useState } from 'react';
import BlurText from '../components/bits/BlurText.jsx';
import Mascot from '../components/Mascot.jsx';
import { GoogleButton, Reveal } from '../components/ui.jsx';
import { authErrorMessage, firebaseReady, signInGoogle, signInGuest } from '../lib/firebase.js';

// Skrin pertama: log masuk dengan Google, atau terus main sebagai tetamu.
export default function Login() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(action) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="screen">
      <div className="hero login-hero">
        <Mascot mood="wave" size={150} />
        <p className="eyebrow">Assalamualaikum!</p>
        <BlurText text="Jom mula berlatih!" className="hero-title" delay={100} animateBy="words" />
        <p className="muted">Log masuk supaya markah dan latihan anda tersimpan dengan selamat.</p>
      </div>

      <Reveal className="card login-card">
        <GoogleButton onClick={() => run(signInGoogle)} disabled={busy || !firebaseReady}>
          Log masuk dengan Google
        </GoogleButton>

        <div className="divider"><span>atau</span></div>

        <button className="btn btn-outline btn-lg" onClick={() => run(signInGuest)} disabled={busy}>
          Main sebagai tetamu
        </button>
        <p className="login-note">
          Tetamu boleh terus bermain. Anda boleh pautkan akaun Google kemudian supaya kemajuan tidak hilang.
        </p>

        {!firebaseReady && (
          <p className="alert alert-warn">Firebase belum disediakan. Buat masa ini hanya mod tetamu (dalam peranti ini) boleh digunakan.</p>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
      </Reveal>
    </section>
  );
}
