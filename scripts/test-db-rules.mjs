// Ujian peraturan Realtime Database (database.rules.json) terhadap Firebase Emulator (auth:9099, database:9000).
// Jalankan: firebase emulators:start --only auth,database --project demo-kuiz
//           node scripts/test-db-rules.mjs
import { deleteApp, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth';
import { connectDatabaseEmulator, get, getDatabase, ref, remove, set, update } from 'firebase/database';

let n = 0;
async function client(signIn = true) {
  const app = initializeApp({ apiKey: 'demo', projectId: 'demo-kuiz', databaseURL: 'https://demo-kuiz-default-rtdb.firebaseio.com' }, 'd' + n++);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getDatabase(app);
  connectDatabaseEmulator(db, '127.0.0.1', 9000);
  if (signIn) await signInAnonymously(auth);
  return { app, db, uid: auth.currentUser?.uid };
}

let failed = 0;
async function expect(label, shouldPass, fn) {
  let ok;
  try { await fn(); ok = true; } catch { ok = false; }
  const good = ok === shouldPass;
  if (!good) failed++;
  console.log(`${good ? 'LULUS' : 'GAGAL'}  ${shouldPass ? 'dibenarkan' : 'disekat  '}  ${label}`);
}

const host = await client();
const p1 = await client();
const p2 = await client();
const anon = await client(false);
const pin = String(100000 + Math.floor(Math.random() * 899999));
const r = (c, path = '') => ref(c.db, `races/${pin}${path}`);
const player = name => ({ name, score: 0, correct: 0, answered: 0, streak: 0, finished: false, joinedAt: Date.now() });

await expect('cipta perlumbaan atas nama orang lain', false, () => set(r(p1), { hostUid: host.uid, status: 'lobby' }));
await expect('hos cipta perlumbaan', true, () => set(r(host), { hostUid: host.uid, status: 'lobby', order: [{ id: 'a', perm: [0, 1] }] }));
await expect('orang lain tulis ganti perlumbaan', false, () => set(r(p1), { hostUid: p1.uid, status: 'lobby' }));
await expect('tanpa log masuk baca perlumbaan', false, () => get(r(anon)));
await expect('pemain baca perlumbaan dengan PIN', true, () => get(r(p1)));
await expect('pemain senaraikan semua perlumbaan', false, () => get(ref(p1.db, 'races')));
await expect('pemain sertai (nod sendiri)', true, () => set(r(p1, `/players/${p1.uid}`), player('Ali')));
await expect('pemain sertai dengan nama terlalu panjang', false, () => set(r(p2, `/players/${p2.uid}`), player('x'.repeat(40))));
await expect('pemain kedua sertai', true, () => set(r(p2, `/players/${p2.uid}`), player('Siti')));
await expect('pemain ubah markah orang lain', false, () => update(r(p1, `/players/${p2.uid}`), { score: 0 }));
await expect('pemain mulakan perlumbaan', false, () => update(r(p1), { status: 'playing' }));
await expect('hos mulakan perlumbaan', true, () => update(r(host), { status: 'playing' }));
await expect('pemain kemas kini markah sendiri', true, () => update(r(p1, `/players/${p1.uid}`), { score: 850, answered: 1 }));
await expect('hos keluarkan pemain', true, () => remove(r(host, `/players/${p2.uid}`)));
await expect('hos tamatkan perlumbaan', true, () => update(r(host), { status: 'ended' }));
await expect('pemain baharu sertai selepas tamat', false, () => set(r(p2, `/players/${p2.uid}`), player('Siti')));
await expect('pemain padam perlumbaan', false, () => remove(r(p1)));
await expect('hos padam perlumbaan', true, () => remove(r(host)));

for (const c of [host, p1, p2, anon]) await deleteApp(c.app);
console.log(failed ? `\n${failed} ujian GAGAL` : '\nSemua ujian lulus');
process.exit(failed ? 1 : 0);
