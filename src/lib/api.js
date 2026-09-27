// Panggilan ke API dompet (Cloudflare Worker). Semua panggilan dijalankan satu demi satu mengikut
// urutan (cth. jawapan sebelum tuntutan kuasa percuma) supaya pelayan menilai dalam susunan betul.
import { apiUrl } from './firebase-config.js';
import { currentIdToken } from './firebase.js';

export const apiEnabled = Boolean(apiUrl);

let chain = Promise.resolve();

async function send(action, body) {
  const token = await currentIdToken();
  if (!token) throw new Error('Belum log masuk.');
  const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/${action}`, {
    method: 'POST',
    headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const err = new Error(data.message || 'Pelayan tidak dapat dihubungi. Cuba lagi.');
    err.code = data.error;
    throw err;
  }
  return data;
}

// Pulangkan { ok, wallet, gained, ... } daripada pelayan.
export function api(action, body) {
  const p = chain.then(() => send(action, body));
  chain = p.catch(() => {});
  return p;
}

// Kunci ringkas bagi satu soalan (elak ganjaran berulang bagi soalan yang sama dalam sehari).
export function questionKey(q) {
  const text = [q?.id, q?.question].join('|');
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h.toString(36) + text.length.toString(36);
}

// Gabungkan dompet pelayan ke dalam statistik (supaya coins()/owns()/powerupCount() kekal sama).
export function withWallet(stats, wallet) {
  if (!wallet) return stats;
  return { ...stats, coinsEarned: wallet.earned, coinsSpent: wallet.spent, items: wallet.items, pGot: wallet.pGot, pUsed: wallet.pUsed };
}
