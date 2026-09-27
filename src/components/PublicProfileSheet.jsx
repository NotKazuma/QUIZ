// Panel bawah yang memaparkan profil awam seseorang (dari perlumbaan atau senarai kelas).
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import AnimalAvatar from './AnimalAvatar.jsx';
import Emoji from './Emoji.jsx';
import { ACHIEVEMENTS } from '../lib/achievements.js';
import { getPublicProfile } from '../lib/publicProfile.js';
import { THEME_COLORS } from '../lib/shop.js';

export default function PublicProfileSheet({ uid, fallbackName, onClose }) {
  const [profile, setProfile] = useState(undefined); // undefined = memuat, null = peribadi/tiada

  useEffect(() => {
    if (!uid) return;
    setProfile(undefined);
    getPublicProfile(uid).then(setProfile).catch(() => setProfile(null));
  }, [uid]);

  const color = THEME_COLORS.find(t => t.id === profile?.theme)?.color || '#ff9600';
  const title = ACHIEVEMENTS.find(a => a.id === profile?.title);
  const s = profile?.stats || {};
  const accuracy = s.answered ? Math.round((s.correct / s.answered) * 100) : 0;

  return (
    <AnimatePresence>
      {uid && (
        <>
          <motion.div className="sheet-backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div className="sheet public-sheet" role="dialog" aria-label="Profil"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 320 }}>
            <span className="sheet-grip" />
            {profile === undefined ? <p className="alert">Memuatkan profil…</p> : profile === null ? (
              <div className="public-private">
                <Emoji e="🔒" size="2.6rem" />
                <b>{fallbackName || 'Pengguna ini'}</b>
                <span className="muted">Profil ini peribadi.</span>
              </div>
            ) : (
              <>
                <div className="profile-card small" style={{ '--pc': color }}>
                  <AnimalAvatar avatar={profile.avatar} size={104} />
                  <h2 className="profile-name">{profile.name}</h2>
                  {title && <span className="profile-title"><Emoji e={title.emoji} /> {title.title}</span>}
                </div>
                <div className="stats stats-4">
                  <div className="stat"><span className="stat-num"><Emoji e="✅" /> {s.answered}</span><span className="stat-label">soalan</span></div>
                  <div className="stat"><span className="stat-num"><Emoji e="🎯" /> {accuracy}%</span><span className="stat-label">ketepatan</span></div>
                  <div className="stat"><span className="stat-num"><Emoji e="🔥" /> {s.bestStreak}</span><span className="stat-label">berturut terbaik</span></div>
                  <div className="stat"><span className="stat-num"><Emoji e="🏁" /> {s.raceWins}</span><span className="stat-label">menang lumba</span></div>
                </div>
                <p className="section-title">Lencana ({profile.badgeCount})</p>
                <div className="badge-strip">
                  {profile.badges.slice(0, 12).map(id => {
                    const a = ACHIEVEMENTS.find(x => x.id === id);
                    return a ? <span key={id} className="badge-chip" title={a.title}><Emoji e={a.emoji} size="1.8rem" /></span> : null;
                  })}
                </div>
              </>
            )}
            <button className="btn btn-ghost" onClick={onClose}>Tutup</button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
