// Profil pengguna: kad avatar bertema, nama paparan, gelaran dari lencana, statistik & lencana,
// serta tetapan (nama, gelaran, warna tema, profil awam).
import { useState } from 'react';
import AnimalAvatar from '../components/AnimalAvatar.jsx';
import Emoji from '../components/Emoji.jsx';
import CountUp from '../components/bits/CountUp.jsx';
import { BackButton, GlowButton, LinkReminder, Reveal } from '../components/ui.jsx';
import { ACHIEVEMENTS } from '../lib/achievements.js';
import { THEME_COLORS } from '../lib/shop.js';
import { coins } from '../lib/wallet.js';

export default function Profile({ user, stats, unlocked, avatar, prefs, onSavePrefs, onWardrobe, onShop, onAchievements, onAvatar, onLink, onBack }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(prefs.displayName || '');
  const [title, setTitle] = useState(prefs.title || '');
  const [theme, setTheme] = useState(prefs.theme || 'oren');
  const [isPublic, setIsPublic] = useState(prefs.public !== false);
  const [themeMode, setThemeMode] = useState(prefs.themeMode || 'auto');

  const color = THEME_COLORS.find(t => t.id === (prefs.theme || 'oren'))?.color || '#ff9600';
  const shownName = prefs.displayName || (user.isGuest ? 'Tetamu' : user.name);
  const titleBadge = ACHIEVEMENTS.find(a => a.id === prefs.title && unlocked[a.id]);
  const mine = ACHIEVEMENTS.filter(a => unlocked[a.id]).sort((a, b) => unlocked[b.id].localeCompare(unlocked[a.id]));
  const accuracy = stats.answered ? Math.round(((stats.correct || 0) / stats.answered) * 100) : 0;

  function save(e) {
    e.preventDefault();
    onSavePrefs({ ...prefs, displayName: name.trim().slice(0, 24) || prefs.displayName, title, theme, public: isPublic, themeMode });
    setEditing(false);
  }

  return (
    <section className="screen profile">
      <BackButton onClick={onBack} />

      <div className="profile-card" style={{ '--pc': color }}>
        <button className="avatar-open" onClick={onAvatar} aria-label="Lihat avatar badan penuh">
          <AnimalAvatar avatar={avatar} size={132} mood="happy" />
        </button>
        <h2 className="profile-name">{shownName}</h2>
        {titleBadge && <span className="profile-title"><Emoji e={titleBadge.emoji} /> {titleBadge.title}</span>}
        <div className="profile-actions">
          <button className="btn btn-sm profile-btn" onClick={onAvatar}><Emoji e="🧍" /> Badan penuh</button>
          <button className="btn btn-sm profile-btn" onClick={onWardrobe}><Emoji e="🎨" /> Ubah avatar</button>
          <button className="btn btn-sm profile-btn" onClick={() => setEditing(v => !v)}><Emoji e="✏️" /> Tetapan</button>
        </div>
      </div>

      {user.isGuest && <Reveal className="spaced"><LinkReminder onLink={onLink} compact /></Reveal>}

      {editing && (
        <form className="card form-card" onSubmit={save}>
          <label className="field">
            <span className="field-label">Nama paparan</span>
            <input className="input" value={name} maxLength={24} placeholder={user.isGuest ? 'Tetamu' : user.name}
              onChange={e => setName(e.target.value)} />
            <span className="field-hint">Dipapar dalam perlumbaan, kelas & profil awam.</span>
          </label>
          <label className="field">
            <span className="field-label">Gelaran (dari lencana anda)</span>
            <select className="input" value={title} onChange={e => setTitle(e.target.value)}>
              <option value="">Tiada gelaran</option>
              {mine.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </label>
          <div className="field">
            <span className="field-label">Warna tema</span>
            <div className="theme-swatches">
              {THEME_COLORS.map(t => (
                <button key={t.id} type="button" aria-label={t.id} className={'swatch' + (theme === t.id ? ' is-on' : '')}
                  style={{ background: t.color }} onClick={() => setTheme(t.id)} />
              ))}
            </div>
          </div>
          <div className="field">
            <span className="field-label">Paparan</span>
            <div className="chips" role="radiogroup" aria-label="Tema">
              {[['auto', '🌓', 'Ikut peranti'], ['light', '☀️', 'Cerah'], ['dark', '🌙', 'Gelap']].map(([id, e, label]) => (
                <button key={id} type="button" className={'chip' + (themeMode === id ? ' is-active' : '')}
                  onClick={() => setThemeMode(id)}><Emoji e={e} /> {label}</button>
              ))}
            </div>
          </div>
          <label className="check check-lg">
            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
            Profil awam (kawan sekelas & pemain perlumbaan boleh lihat)
          </label>
          <GlowButton className="glow-lg" type="submit">Simpan</GlowButton>
        </form>
      )}

      <div className="stats stats-4">
        <Stat emoji="🪙" value={coins(stats)} label="syiling" />
        <Stat emoji="🔥" value={stats.dayStreak || 0} label="hari berturut" />
        <Stat emoji="🎯" value={accuracy} suffix="%" label="ketepatan" />
        <Stat emoji="✅" value={stats.answered || 0} label="soalan dijawab" />
      </div>

      <div className="profile-section-head">
        <h3 className="section-title">Lencana ({mine.length}/{ACHIEVEMENTS.length})</h3>
        <button className="btn btn-ghost btn-sm" onClick={onAchievements}>Lihat semua</button>
      </div>
      {mine.length ? (
        <div className="badge-strip">
          {mine.slice(0, 12).map(a => (
            <span key={a.id} className="badge-chip" title={a.title}><Emoji e={a.emoji} size="2rem" /></span>
          ))}
        </div>
      ) : <p className="alert">Belum ada lencana. Jom mula berlatih!</p>}

      <button className="btn btn-orange btn-lg shop-cta" onClick={onShop}><Emoji e="🛍️" /> Pergi ke kedai</button>
    </section>
  );
}

function Stat({ emoji, value, suffix = '', label }) {
  return (
    <div className="stat">
      <span className="stat-num"><Emoji e={emoji} /> {!Number.isFinite(value) ? '∞' : value ? <CountUp to={value} duration={1.2} separator="," /> : 0}{suffix}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
