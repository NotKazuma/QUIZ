// Pengesahan token Firebase & akses Firestore/RTDB menggunakan akaun servis (Web Crypto, tiada pakej).
const enc = new TextEncoder();
const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlJson = obj => b64url(enc.encode(JSON.stringify(obj)));
const fromB64url = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)), c => c.charCodeAt(0));
const decodePart = s => JSON.parse(new TextDecoder().decode(fromB64url(s)));

// ---------- Token ID Firebase (log masuk pengguna) ----------
const JWK_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
let jwkCache = { keys: null, until: 0 };

async function googleKeys() {
  if (jwkCache.keys && Date.now() < jwkCache.until) return jwkCache.keys;
  const res = await fetch(JWK_URL);
  if (!res.ok) throw new Error('jwk');
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') || '')?.[1] || 3600);
  jwkCache = { keys: (await res.json()).keys, until: Date.now() + maxAge * 1000 };
  return jwkCache.keys;
}

// Pulangkan { uid, email, emailVerified } atau null jika token tidak sah.
export async function verifyIdToken(token, env) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  let header, payload;
  try { header = decodePart(parts[0]); payload = decodePart(parts[1]); } catch { return null; }
  const now = Math.floor(Date.now() / 1000);
  if (payload.aud !== env.PROJECT_ID || payload.iss !== `https://securetoken.google.com/${env.PROJECT_ID}`) return null;
  if (!payload.sub || payload.exp < now || payload.iat > now + 300) return null;

  if (env.EMULATOR === '1') {
    if (header.alg !== 'none') return null; // emulator Auth mengeluarkan token tanpa tandatangan
  } else {
    if (header.alg !== 'RS256') return null;
    const jwk = (await googleKeys()).find(k => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, fromB64url(parts[2]), enc.encode(parts[0] + '.' + parts[1]));
    if (!ok) return null;
  }
  return { uid: payload.sub, email: payload.email || null, emailVerified: payload.email_verified === true };
}

// ---------- Token akses akaun servis ----------
let saCache = { token: null, until: 0 };
const SCOPES = [
  'https://www.googleapis.com/auth/datastore',
  'https://www.googleapis.com/auth/firebase.database',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

async function accessToken(env) {
  if (env.EMULATOR === '1') return 'owner';
  if (saCache.token && Date.now() < saCache.until) return saCache.token;
  const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  const iat = Math.floor(Date.now() / 1000);
  const unsigned = b64urlJson({ alg: 'RS256', typ: 'JWT' }) + '.' + b64urlJson({
    iss: sa.client_email, scope: SCOPES, aud: 'https://oauth2.googleapis.com/token', iat, exp: iat + 3600,
  });
  const der = fromB64url(sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '').replace(/\+/g, '-').replace(/\//g, '_'));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = b64url(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(unsigned)));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + unsigned + '.' + sig,
  });
  if (!res.ok) throw new Error('sa-token ' + res.status);
  const data = await res.json();
  saCache = { token: data.access_token, until: Date.now() + (data.expires_in - 120) * 1000 };
  return saCache.token;
}

// ---------- Firestore REST ----------
function toFs(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFs) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toFs(x)])) } };
}
export function fromFs(v) {
  if (!v) return null;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromFs);
  if ('mapValue' in v) return fromFields(v.mapValue.fields);
  if ('timestampValue' in v) return v.timestampValue;
  return null;
}
const fromFields = (fields = {}) => Object.fromEntries(Object.entries(fields).map(([k, x]) => [k, fromFs(x)]));

const fsBase = env => (env.EMULATOR === '1' ? `http://${env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8085'}` : 'https://firestore.googleapis.com')
  + `/v1/projects/${env.PROJECT_ID}/databases/(default)/documents`;

// Pulangkan { data, updateTime } atau null jika tiada.
export async function getDocument(env, path) {
  const res = await fetch(`${fsBase(env)}/${path}`, { headers: { authorization: 'Bearer ' + await accessToken(env) } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('fs-get ' + res.status);
  const doc = await res.json();
  return { data: fromFields(doc.fields), updateTime: doc.updateTime };
}

// Tulis dokumen penuh dengan syarat (updateTime sama, atau belum wujud). Pulang false jika bercanggah.
export async function putDocument(env, path, data, updateTime) {
  const root = `projects/${env.PROJECT_ID}/databases/(default)/documents`;
  const res = await fetch(`${fsBase(env)}:commit`, {
    method: 'POST',
    headers: { authorization: 'Bearer ' + await accessToken(env), 'content-type': 'application/json' },
    body: JSON.stringify({
      writes: [{
        update: { name: `${root}/${path}`, fields: toFs(data).mapValue.fields },
        currentDocument: updateTime ? { updateTime } : { exists: false },
      }],
    }),
  });
  if (res.ok) return true;
  const text = await res.text();
  if (/FAILED_PRECONDITION|ALREADY_EXISTS|NOT_FOUND|ABORTED/.test(text)) return false;
  throw new Error('fs-commit ' + res.status + ' ' + text.slice(0, 200));
}

// ---------- Realtime Database REST ----------
export async function getRtdb(env, path) {
  const emu = env.EMULATOR === '1';
  const base = emu ? `http://${env.RTDB_EMULATOR_HOST || '127.0.0.1:9000'}` : env.RTDB_URL;
  const url = `${base}/${path}.json${emu ? `?ns=${env.PROJECT_ID}-default-rtdb` : ''}`;
  const res = await fetch(url, { headers: { authorization: 'Bearer ' + await accessToken(env) } });
  if (!res.ok) throw new Error('rtdb ' + res.status);
  return res.json();
}
