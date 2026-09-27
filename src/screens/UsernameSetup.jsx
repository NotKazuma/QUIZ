// Langkah pertama selepas log masuk: pilih nama (username) dan haiwan avatar.
import { useState } from 'react';
import AnimalAvatar from '../components/AnimalAvatar.jsx';
import BlurText from '../components/bits/BlurText.jsx';
import Mascot, { SpeechBubble } from '../components/Mascot.jsx';
import { GlowButton } from '../components/ui.jsx';
import { ANIMALS, DEFAULT_AVATAR } from '../lib/shop.js';

const FREE_ANIMALS = ANIMALS.filter(a => a.price === 0);

export function validName(name) {
  const n = name.trim().replace(/\s+/g, ' ');
  if (n.length < 2) return 'Nama terlalu pendek (sekurang-kurangnya 2 huruf).';
  if (n.length > 20) return 'Nama terlalu panjang (maksimum 20 aksara).';
  if (!/^[\p{L}\p{N} ._'-]+$/u.test(n)) return 'Guna huruf, nombor dan jarak sahaja.';
  return '';
}

export default function UsernameSetup({ user, avatar, onDone }) {
  const [name, setName] = useState(user.isGuest ? '' : user.name.split(' ').slice(0, 2).join(' ').slice(0, 20));
  const [animal, setAnimal] = useState(avatar?.animal || 'harimau');
  const [error, setError] = useState('');

  function submit(e) {
    e.preventDefault();
    const problem = validName(name);
    if (problem) return setError(problem);
    const a = ANIMALS.find(x => x.id === animal);
    onDone(name.trim().replace(/\s+/g, ' '), { ...DEFAULT_AVATAR, ...avatar, animal, color: a.colors[0] });
  }

  return (
    <section className="screen onboarding">
      <div className="onboard-hero">
        <Mascot mood="wave" size={120} />
        <SpeechBubble>
          <span className="hero-hello">Selamat datang!</span>
          <BlurText text="Siapa nama anda?" className="onboard-title" delay={80} animateBy="words" />
        </SpeechBubble>
      </div>

      <form className="card form-card" onSubmit={submit} noValidate>
        <label className="field">
          <span className="field-label">Nama anda</span>
          <input className="input input-big" value={name} maxLength={20} autoFocus autoComplete="off"
            placeholder="cth. Aisyah" onChange={e => { setName(e.target.value); setError(''); }} />
          <span className="field-hint">Nama ini dipapar di halaman utama, dalam kelas & perlumbaan. Boleh ditukar kemudian.</span>
        </label>

        <div className="field">
          <span className="field-label">Pilih haiwan anda</span>
          <div className="onboard-animals">
            {FREE_ANIMALS.map(a => (
              <button key={a.id} type="button" className={'item-card' + (animal === a.id ? ' is-on' : '')}
                onClick={() => setAnimal(a.id)}>
                <AnimalAvatar avatar={{ ...DEFAULT_AVATAR, animal: a.id, color: a.colors[0] }} size={84} />
                <span className="item-name">{a.name}</span>
              </button>
            ))}
          </div>
          <span className="field-hint">Haiwan & barang lain boleh dibeli di kedai dengan syiling.</span>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}
        <GlowButton className="glow-lg" type="submit">Jom mula!</GlowButton>
      </form>
    </section>
  );
}
