// Halaman avatar badan penuh: avatar besar, tukar ekspresi, ringkasan koleksi ikut kelas kelangkaan.
import { useState } from 'react';
import { motion } from 'motion/react';
import AnimalAvatar from '../components/AnimalAvatar.jsx';
import Emoji from '../components/Emoji.jsx';
import { BackButton, GlowButton } from '../components/ui.jsx';
import { ACHIEVEMENTS } from '../lib/achievements.js';
import { ANIMALS, ITEMS, RARITY, RARITY_ORDER, THEME_COLORS } from '../lib/shop.js';
import { owns } from '../lib/wallet.js';

const MOODS = ['happy', 'cheer', 'wave'];

export default function AvatarPage({ user, stats, avatar, prefs, unlocked, onWardrobe, onBack }) {
  const [mood, setMood] = useState(0);
  const color = THEME_COLORS.find(t => t.id === (prefs.theme || 'oren'))?.color || '#ff9600';
  const title = ACHIEVEMENTS.find(a => a.id === prefs.title && unlocked[a.id]);
  const all = [...ANIMALS, ...ITEMS];
  const collection = RARITY_ORDER.map(r => {
    const inRarity = all.filter(x => x.rarity === r);
    return { r, have: inRarity.filter(x => owns(stats, x.id)).length, total: inRarity.length };
  });

  return (
    <section className="screen avatar-page">
      <BackButton onClick={onBack} />
      <div className="avatar-stage" style={{ '--pc': color }}>
        <motion.button className="avatar-stage-btn" onClick={() => setMood(m => (m + 1) % MOODS.length)}
          whileTap={{ scale: 0.95 }} aria-label="Tukar ekspresi">
          <AnimalAvatar avatar={avatar} size={220} full mood={MOODS[mood] === 'wave' ? 'cheer' : MOODS[mood]} />
        </motion.button>
        <h2 className="profile-name">{prefs.displayName || user.name}</h2>
        {title && <span className="profile-title"><Emoji e={title.emoji} /> {title.title}</span>}
        <span className="muted small stage-hint">Tekan avatar untuk tukar ekspresi</span>
      </div>

      <h3 className="section-title">Koleksi saya</h3>
      <div className="collection">
        {collection.map(c => (
          <div key={c.r} className="collection-row" style={{ '--r': RARITY[c.r].color }}>
            <span className="rarity-tag">{RARITY[c.r].label}</span>
            <span className="collection-bar"><span style={{ width: (c.have / c.total) * 100 + '%' }} /></span>
            <b>{c.have}/{c.total}</b>
          </div>
        ))}
      </div>

      <GlowButton className="glow-lg" onClick={onWardrobe}><Emoji e="🎨" /> Ubah di almari</GlowButton>
    </section>
  );
}
