// Ujian hujung-ke-hujung API dompet: Worker tempatan (wrangler dev) + Firebase Emulator.
// Jalankan: firebase emulators:start --only auth,firestore,database --project demo-kuiz
//           cd worker && npx wrangler dev --port 8787 --var EMULATOR:1 --var PROJECT_ID:demo-kuiz
//           node scripts/test-worker-api.mjs
import assert from 'node:assert/strict';

const API = process.env.API || 'http://127.0.0.1:8787';
const FS = 'http://127.0.0.1:8085/v1/projects/demo-kuiz/databases/(default)/documents';

async function signUp(email) {
  const url = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:' + (email ? 'signInWithIdp' : 'signUp') + '?key=demo';
  const body = email
    ? { postBody: `id_token=${encodeURIComponent(JSON.stringify({ sub: email, email, email_verified: true }))}&providerId=google.com`, requestUri: 'http://localhost', returnSecureToken: true }
    : { returnSecureToken: true };
  const r = await (await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })).json();
  return { token: r.idToken, uid: r.localId };
}
const call = async (u, action, body = {}) => {
  const res = await fetch(`${API}/api/${action}`, { method: 'POST', headers: { authorization: 'Bearer ' + u.token, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return { status: res.status, ...(await res.json()) };
};
const bal = r => r.wallet.earned - r.wallet.spent;
let pass = 0;
const t = async (name, fn) => { await fn(); pass++; console.log('  ✓', name); };

const ali = await signUp();
const hacker = await signUp();

await t('tanpa token ditolak', async () => {
  assert.equal((await call({ token: 'x.y.z' }, 'sync')).status, 401);
});
await t('token palsu (tandatangan/aud salah) ditolak', async () => {
  const fake = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url') + '.' +
    Buffer.from(JSON.stringify({ sub: 'x', aud: 'lain', iss: 'https://securetoken.google.com/lain', exp: 9e9, iat: 1 })).toString('base64url') + '.';
  assert.equal((await call({ token: fake }, 'sync')).status, 401);
});
await t('dompet baharu dicipta', async () => {
  const r = await call(ali, 'sync');
  assert.equal(r.ok, true); assert.equal(bal(r), 0);
});
await t('hadiah harian sekali', async () => {
  assert.equal((await call(ali, 'daily')).gained, 5);
  assert.equal((await call(ali, 'daily')).gained, 0);
});
await t('jawapan: syiling sekali bagi soalan sama, had harian', async () => {
  assert.equal((await call(ali, 'answer', { key: 'a', correct: true })).gained, 2);
  assert.equal((await call(ali, 'answer', { key: 'a', correct: true })).gained, 0);
  const all = await Promise.all(Array.from({ length: 150 }, (_, i) => call(hacker, 'answer', { key: 'h' + i, correct: true })));
  assert.ok(all.every(r => r.ok || r.status === 503), 'serentak: berjaya atau "sibuk", tiada ralat lain');
  for (let i = 0; i < 150; i++) await call(hacker, 'answer', { key: 'h' + i, correct: true }); // ulang satu demi satu
  const r = await call(hacker, 'sync');
  assert.equal(bal(r), 200, 'had 200 syiling jawapan sehari walaupun 150 jawapan serentak');
});
await t('tamat latihan tanpa jawapan tiada bonus', async () => {
  assert.equal((await call(hacker, 'finish', { mode: 'challenge', points: 1e9 })).gained > 0, true); // selepas 150 jawapan: bonus sah sekali
  assert.equal((await call(hacker, 'finish', { mode: 'challenge', points: 1e9 })).gained, 0);
});
await t('beli barang terlalu mahal ditolak; beli sah menolak baki', async () => {
  const no = await call(ali, 'buy', { id: 'mahkota' });
  assert.equal(no.status, 402);
  const ok = await call(ali, 'buyPower', { id: 'time' }).catch(() => null); // 30 syiling, baki 7 → ditolak
  assert.equal(ok.status, 402);
  const r = await call(hacker, 'buy', { id: 'kopiah' });
  assert.ok(r.wallet.items.includes('kopiah'));
});
await t('pengguna tidak boleh tulis dompet sendiri terus', async () => {
  const res = await fetch(`${FS}/wallets/${hacker.uid}`, { method: 'PATCH', headers: { authorization: 'Bearer ' + hacker.token, 'content-type': 'application/json' }, body: JSON.stringify({ fields: { earned: { integerValue: '999999' } } }) });
  assert.equal(res.status, 403);
});
await t('kerja rumah & perlumbaan palsu ditolak', async () => {
  assert.equal((await call(ali, 'homework', { classId: 'tiada', assignmentId: 'tiada' })).status, 403);
  assert.equal((await call(ali, 'race', { pin: '999999' })).status, 403);
});
await t('perlumbaan sebenar yang tamat diberi ganjaran sekali', async () => {
  const pin = String(100000 + Math.floor(Math.random() * 800000));
  const race = { hostUid: ali.uid, status: 'ended', players: { [ali.uid]: { name: 'Ali', score: 900 }, [hacker.uid]: { name: 'H', score: 100 }, x: { name: 'X', score: 50 } } };
  const put = await fetch(`http://127.0.0.1:9000/races/${pin}.json?ns=demo-kuiz`, { method: 'PUT', headers: { authorization: 'Bearer owner' }, body: JSON.stringify(race) });
  assert.ok(put.ok);
  assert.equal((await call(ali, 'race', { pin })).gained, 40);
  assert.equal((await call(ali, 'race', { pin })).gained, 0);
  assert.equal((await call(hacker, 'race', { pin })).gained, 25);
});
await t('pindah baki lama dari users/{uid} (dengan had)', async () => {
  const old = await signUp();
  await fetch(`${FS}/users/${old.uid}`, { method: 'PATCH', headers: { authorization: 'Bearer owner', 'content-type': 'application/json' }, body: JSON.stringify({ fields: {
    stats: { mapValue: { fields: { coinsEarned: { integerValue: '50000' }, coinsSpent: { integerValue: '0' }, items: { arrayValue: { values: [{ stringValue: 'singa' }] } } } } },
  } }) });
  const r = await call(old, 'sync');
  assert.equal(bal(r), 3000);
  assert.ok(r.wallet.items.includes('singa'));
});
await t('admin: beli tanpa bayar', async () => {
  const adm = await signUp('aimanskspp@gmail.com');
  const r = await call(adm, 'buy', { id: 'tema-emas' });
  assert.equal(r.admin, true);
  assert.ok(r.wallet.items.includes('tema-emas'));
  assert.equal(r.wallet.spent, 0);
});

console.log(`\n${pass} ujian API lulus`);
