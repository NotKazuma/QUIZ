// API dompet Kuiz Ulang Kaji (Cloudflare Worker).
// POST /api/<tindakan> dengan "Authorization: Bearer <token ID Firebase>".
// Dompet disimpan di wallets/{uid} — hanya Worker ini boleh menulisnya (lihat firestore.rules).
import { getDocument, getRtdb, putDocument, verifyIdToken } from './google.js';
import { ApiError, apply, emptyWallet, migrate, publicWallet, raceRank } from './logic.js';

const ACTIONS = new Set(['sync', 'answer', 'grant', 'finish', 'daily', 'achievements', 'homework', 'race', 'buy', 'buyPower', 'use']);

function cors(req, env) {
  const origin = req.headers.get('origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim());
  return {
    'access-control-allow-origin': allowed.includes(origin) ? origin : allowed[0] || '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-max-age': '86400',
    vary: 'origin',
  };
}

const json = (data, status, headers) => new Response(JSON.stringify(data), {
  status, headers: { ...headers, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

// Semakan luar yang diperlukan oleh sesetengah tindakan.
async function gatherFacts(action, body, uid, env) {
  if (action === 'homework') {
    const ok = [body.classId, body.assignmentId].every(v => typeof v === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(v));
    if (!ok) return {};
    const sub = await getDocument(env, `classes/${body.classId}/assignments/${body.assignmentId}/submissions/${uid}`);
    return { submitted: Boolean(sub) };
  }
  if (action === 'race') {
    if (typeof body.pin !== 'string' || !/^[0-9]{4,12}$/.test(body.pin)) return {};
    return { race: raceRank(await getRtdb(env, `races/${body.pin}`), uid) };
  }
  return {};
}

async function handle(action, body, user, env) {
  const admins = (env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase());
  const admin = user.emailVerified && admins.includes((user.email || '').toLowerCase());
  const facts = await gatherFacts(action, body, user.uid, env);
  const path = `wallets/${user.uid}`;

  // Baca → ubah → tulis bersyarat; ulang jika ada permintaan lain menulis serentak.
  for (let attempt = 0; attempt < 8; attempt++) {
    if (attempt) await new Promise(r => setTimeout(r, Math.random() * 40 * attempt));
    const doc = await getDocument(env, path);
    let wallet;
    if (doc) {
      wallet = { ...emptyWallet(), ...doc.data };
    } else {
      const old = await getDocument(env, `users/${user.uid}`);
      wallet = old ? migrate(old.data.stats || {}, old.data.unlocked || {}) : emptyWallet();
    }
    const out = apply(action, body, wallet, { admin, facts });
    const written = await putDocument(env, path, { ...wallet, updatedAt: new Date().toISOString() }, doc?.updateTime);
    if (written) return { ok: true, ...out, wallet: publicWallet(wallet), admin };
  }
  throw new ApiError(503, 'busy', 'Cuba sebentar lagi.');
}

export default {
  async fetch(req, env) {
    const headers = cors(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    const url = new URL(req.url);
    if (req.method === 'GET' && url.pathname === '/') return json({ ok: true, service: 'kuiz-api' }, 200, headers);

    const action = url.pathname.replace(/^\/api\//, '');
    if (req.method !== 'POST' || !ACTIONS.has(action)) return json({ ok: false, error: 'not-found' }, 404, headers);

    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const user = await verifyIdToken(token, env).catch(() => null);
    if (!user) return json({ ok: false, error: 'unauthenticated' }, 401, headers);

    let body = {};
    try { body = (await req.json()) || {}; } catch { /* badan kosong */ }
    try {
      return json(await handle(action, body, user, env), 200, headers);
    } catch (e) {
      if (e instanceof ApiError) return json({ ok: false, error: e.code, message: e.message }, e.status, headers);
      console.error(action, e.stack || e);
      return json({ ok: false, error: 'server' }, 500, headers);
    }
  },
};
