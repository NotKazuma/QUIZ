// Ujian peraturan Firestore terhadap Firebase Emulator (auth:9099, firestore:FIRESTORE_PORT).
// Jalankan: firebase emulators:start --only auth,firestore --project demo-kuiz
//           FIRESTORE_PORT=8085 node scripts/test-rules.mjs
import { deleteApp, initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider, connectAuthEmulator, getAuth, signInAnonymously, signInWithCredential,
} from 'firebase/auth';
import {
  collection, connectFirestoreEmulator, deleteDoc, doc, getDoc, getDocs, getFirestore, setDoc, updateDoc,
} from 'firebase/firestore/lite';

const PORT = Number(process.env.FIRESTORE_PORT || 8080);
let n = 0;

// Setiap "pengguna" guna app Firebase berasingan.
async function client(kind, email) {
  const app = initializeApp({ apiKey: 'demo', projectId: 'demo-kuiz', authDomain: 'demo-kuiz.firebaseapp.com' }, 'c' + n++);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', PORT);
  if (kind === 'anon') await signInAnonymously(auth);
  if (kind === 'google') {
    const token = JSON.stringify({ sub: email, email, email_verified: true });
    await signInWithCredential(auth, GoogleAuthProvider.credential(token));
  }
  return { app, db, uid: auth.currentUser?.uid };
}

let failed = 0;
async function expect(label, shouldPass, fn) {
  let ok;
  try { await fn(); ok = true; } catch (e) { ok = false; if (shouldPass) console.log('   ', e.code || e.message); }
  const good = ok === shouldPass;
  if (!good) failed++;
  console.log(`${good ? 'LULUS' : 'GAGAL'}  ${shouldPass ? 'dibenarkan' : 'disekat  '}  ${label}`);
}

const alice = await client('anon');
const bob = await client('google', `bob${Date.now()}@example.com`);
const admin = await client('google', 'aimanskspp@gmail.com');
const outsider = await client('none');

console.log('--- users/{uid}');
await expect('pengguna cipta dokumen sendiri', true, () => setDoc(doc(alice.db, 'users', alice.uid), { stats: { answered: 1 }, updatedAt: 'x' }));
await expect('pengguna cipta dokumen sendiri dengan role', false, () => setDoc(doc(bob.db, 'users', bob.uid), { role: 'teacher' }));
await expect('pengguna cipta dokumen sendiri (tanpa role)', true, () => setDoc(doc(bob.db, 'users', bob.uid), { profile: { name: 'Bob' }, lastActive: '2026' }));
await expect('pengguna kemas kini dokumen sendiri (merge)', true, () => setDoc(doc(alice.db, 'users', alice.uid), { session: null }, { merge: true }));
await expect('pengguna jadikan diri sendiri cikgu', false, () => updateDoc(doc(bob.db, 'users', bob.uid), { role: 'teacher' }));
await expect('pengguna tulis dokumen orang lain', false, () => setDoc(doc(alice.db, 'users', bob.uid), { stats: {} }, { merge: true }));
await expect('pengguna baca dokumen orang lain', false, () => getDoc(doc(alice.db, 'users', bob.uid)));
await expect('pengguna senaraikan semua pengguna', false, () => getDocs(collection(bob.db, 'users')));
await expect('tanpa log masuk baca dokumen pengguna', false, () => getDoc(doc(outsider.db, 'users', alice.uid)));
await expect('admin senaraikan semua pengguna', true, () => getDocs(collection(admin.db, 'users')));
await expect('admin jadikan Bob cikgu', true, () => updateDoc(doc(admin.db, 'users', bob.uid), { role: 'teacher' }));
await expect('Bob (cikgu) buang peranan sendiri', false, () => updateDoc(doc(bob.db, 'users', bob.uid), { role: null }));
await expect('Bob masih boleh simpan kemajuan sendiri', true, () => setDoc(doc(bob.db, 'users', bob.uid), { stats: { answered: 5 } }, { merge: true }));
await expect('pengguna padam dokumen sendiri', false, () => deleteDoc(doc(alice.db, 'users', alice.uid)));
await expect('admin padam data pengguna', true, () => deleteDoc(doc(admin.db, 'users', alice.uid)));

console.log('--- subjects/{id}');
await expect('admin simpan soalan', true, () => setDoc(doc(admin.db, 'subjects', 'upkk__aqidah'), { questions: [] }));
await expect('tanpa log masuk baca soalan', true, () => getDoc(doc(outsider.db, 'subjects', 'upkk__aqidah')));
await expect('pengguna biasa ubah soalan', false, () => setDoc(doc(bob.db, 'subjects', 'upkk__aqidah'), { questions: [1] }));

console.log('--- lain-lain');
await expect('tulis koleksi tidak dikenali', false, () => setDoc(doc(admin.db, 'random', 'x'), { a: 1 }));

for (const c of [alice, bob, admin, outsider]) await deleteApp(c.app);
console.log(failed ? `\n${failed} ujian GAGAL` : '\nSemua ujian lulus');
process.exit(failed ? 1 : 0);
