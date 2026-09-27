// Kedai & almari: ubah avatar (haiwan, warna, topi, cermin mata, baju, latar, bingkai) dan beli kuasa.
import { useState } from 'react';
import { motion } from 'motion/react';
import AnimalAvatar from '../components/AnimalAvatar.jsx';
import Emoji from '../components/Emoji.jsx';
import { BackButton, PageHead } from '../components/ui.jsx';
import { ANIMALS, DEFAULT_AVATAR, ITEMS, POWERUPS, RARITY, RARITY_ORDER, SLOTS, byRarity, cardProps } from '../lib/shop.js';
import { coins, formatCoins, isUnlimited, owns, powerupCount } from '../lib/wallet.js';
import { ask } from '../components/ConfirmDialog.jsx';

export default function Shop({ stats, avatar, onBuy, onChangeAvatar, onBack, initialTab = 'avatar' }) {
  const [tab, setTab] = useState(initialTab);       // 'avatar' | 'kuasa'
  const [slot, setSlot] = useState('animal');
  const [draft, setDraft] = useState({ ...DEFAULT_AVATAR, ...avatar });
  const [flash, setFlash] = useState('');
  const [rarity, setRarity] = useState(''); // tapis kelas kelangkaan
  const balance = coins(stats);
  const dirty = JSON.stringify(draft) !== JSON.stringify({ ...DEFAULT_AVATAR, ...avatar });

  function say(msg) {
    setFlash(msg);
    setTimeout(() => setFlash(''), 2200);
  }

  const [busy, setBusy] = useState(false);

  async function buy(id, name, price) {
    if (balance < price) return say(`Syiling tidak cukup — perlu ${price - balance} lagi.`);
    if (!isUnlimited() && !await ask(`Beli ${name} dengan ${price} syiling?`)) return false;
    setBusy(true);
    const ok = await onBuy('item', id);
    setBusy(false);
    if (ok !== true) { if (ok) say(ok); return false; }
    say(`${name} dibeli!`);
    return true;
  }

  // Pilih barang dalam slot semasa (beli dahulu jika belum dimiliki).
  async function choose(id, name, price) {
    if (busy) return;
    if (!owns(stats, id) && !(await buy(id, name, price))) return;
    if (slot === 'animal') {
      const animal = ANIMALS.find(a => a.id === id);
      setDraft(d => ({ ...d, animal: id, color: animal.colors.includes(d.color) ? d.color : animal.colors[0] }));
    } else {
      setDraft(d => ({ ...d, [slot]: d[slot] === id && slot !== 'background' && slot !== 'card' ? null : id }));
    }
  }

  async function buyPower(p) {
    if (busy) return;
    if (balance < p.price) return say(`Syiling tidak cukup — perlu ${p.price - balance} lagi.`);
    setBusy(true);
    const ok = await onBuy('powerup', p.id);
    setBusy(false);
    if (ok === true) say(`${p.name} ditambah!`);
    else if (ok) say(ok);
  }

  const animal = ANIMALS.find(a => a.id === draft.animal) || ANIMALS[0];
  const options = (slot === 'animal' ? [...ANIMALS]
    : slot === 'color' ? animal.colors.map(c => ({ id: c, name: c[0].toUpperCase() + c.slice(1), price: 0, rarity: 'biasa', color: true }))
      : ITEMS.filter(i => i.slot === slot))
    .filter(o => !rarity || o.rarity === rarity)
    .sort(byRarity);
  // Kasut & barang dipegang hanya nampak pada avatar badan penuh.
  const fullPreview = slot === 'shoes' || slot === 'hand';

  return (
    <section className="screen shop">
      <BackButton onClick={onBack} />
      <PageHead badge="Kedai" title="Kedai & Almari" />

      <div className="wallet-bar">
        <span className="wallet-coins"><Emoji e="🪙" size="1.6rem" /> {formatCoins(balance)}</span>
        <span className="muted small">Dapatkan syiling dengan menjawab soalan, tamat latihan, lencana & perlumbaan.</span>
      </div>

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'avatar'} className={'tab' + (tab === 'avatar' ? ' is-active' : '')}
          onClick={() => setTab('avatar')}><Emoji e="🐯" /> Avatar</button>
        <button role="tab" aria-selected={tab === 'kuasa'} className={'tab' + (tab === 'kuasa' ? ' is-active' : '')}
          onClick={() => setTab('kuasa')}><Emoji e="⚡" /> Kuasa</button>
      </div>

      {flash && <motion.p className="alert shop-flash" initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>{flash}</motion.p>}

      {tab === 'avatar' ? (
        <>
          <div className="wardrobe-preview">
            <motion.div key={JSON.stringify(draft)} initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 260 }}>
              <AnimalAvatar avatar={draft} size={150} mood="cheer" full />
            </motion.div>
            <button className="btn btn-primary" disabled={!dirty} onClick={() => onChangeAvatar(draft)}>
              {dirty ? 'Pakai avatar ini' : 'Sedang dipakai'}
            </button>
          </div>

          <div className="slot-tabs" role="tablist" aria-label="Bahagian avatar">
            {SLOTS.map(s => (
              <button key={s.id} role="tab" aria-selected={slot === s.id} className={'slot-tab' + (slot === s.id ? ' is-active' : '')}
                onClick={() => setSlot(s.id)}>
                <Emoji e={s.emoji} size="1.5rem" /><span>{s.label}</span>
              </button>
            ))}
          </div>

          {slot !== 'color' && (
            <div className="rarity-chips" role="radiogroup" aria-label="Kelas">
              <button className={'chip' + (!rarity ? ' is-active' : '')} onClick={() => setRarity('')}>Semua</button>
              {RARITY_ORDER.map(r => (
                <button key={r} className={'chip rarity-chip' + (rarity === r ? ' is-active' : '')} style={{ '--r': RARITY[r].color }}
                  onClick={() => setRarity(r)}>{RARITY[r].label}</button>
              ))}
            </div>
          )}
          <div className="item-grid">
            {options.map(o => {
              const mine = slot === 'color' || owns(stats, o.id);
              const on = slot === 'animal' ? draft.animal === o.id : slot === 'color' ? draft.color === o.id : draft[slot] === o.id;
              const preview = slot === 'animal' ? { ...draft, animal: o.id, color: o.colors[0] }
                : slot === 'color' ? { ...draft, color: o.id }
                  : { ...draft, [slot]: o.id };
              return (
                <button key={o.id} className={'item-card rarity-' + o.rarity + (on ? ' is-on' : '') + (mine ? '' : ' is-locked')}
                  style={{ '--r': RARITY[o.rarity].color }}
                  onClick={() => (slot === 'color' ? setDraft(d => ({ ...d, color: o.id })) : choose(o.id, o.name, o.price))}>
                  {slot === 'card'
                    ? <span {...cardProps(o, 'card-swatch')}><AnimalAvatar avatar={draft} size={44} /></span>
                    : <AnimalAvatar avatar={preview} size={fullPreview ? 60 : 78} full={fullPreview} />}
                  <span className="item-name">{o.name}</span>
                  {slot !== 'color' && <span className="rarity-tag">{RARITY[o.rarity].label}</span>}
                  {mine
                    ? <span className="item-tag">{on ? 'Dipakai' : 'Milik anda'}</span>
                    : <span className="item-price"><Emoji e="🪙" /> {o.price}</span>}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="power-list">
          {POWERUPS.map(p => (
            <div key={p.id} className="card power-card">
              <span className="power-icon"><Emoji e={p.emoji} size="2.2rem" /></span>
              <span className="power-info">
                <span className="power-name">{p.name}</span>
                <span className="muted small">{p.desc}</span>
                <span className="power-have">Dimiliki: {isUnlimited() ? '∞' : powerupCount(stats, p.id)}</span>
              </span>
              <button className="btn btn-orange btn-sm" onClick={() => buyPower(p)}>
                <Emoji e="🪙" /> {p.price}
              </button>
            </div>
          ))}
          <p className="muted small">Kuasa digunakan dalam Cabaran & Perlumbaan. Anda juga boleh dapat kuasa percuma bila menjawab betul berturut-turut!</p>
        </div>
      )}
    </section>
  );
}
