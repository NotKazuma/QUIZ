// Ujian peraturan Firestore terhadap Firebase Emulator (auth:9099, firestore:FIRESTORE_PORT).
// Jalankan: firebase emulators:start --only auth,firestore --project demo-kuiz
//           FIRESTORE_PORT=8085 node scripts/test-rules.mjs
import { deleteApp, initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider, connectAuthEmulator, getAuth, signInAnonymously, signInWithCredential,
} from 'firebase/auth';
import {
  collection, connectFirestoreEmulator, deleteDoc, doc, getDoc, getDocs, getFirestore, query, setDoc, updateDoc, where,
} from 'firebase/firestore/lite';

const PORT = Number(process.env.FIRESTORE_PORT || 8080);
let n = 0;

// Setiap "pengguna" guna app Firebase berasingan.
async function client(kind, email, verified = true) {
  const app = initializeApp({ apiKey: 'demo', projectId: 'demo-kuiz', authDomain: 'demo-kuiz.firebaseapp.com' }, 'c' + n++);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', PORT);
  if (kind === 'anon') await signInAnonymously(auth);
  if (kind === 'google') {
    const token = JSON.stringify({ sub: email, email, email_verified: verified });
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
await expect('admin simpan soalan', true, () => setDoc(doc(admin.db, 'subjects', 'ujian__rules'), { questions: [] }));
await expect('tanpa log masuk baca soalan', true, () => getDoc(doc(outsider.db, 'subjects', 'ujian__rules')));
await expect('pengguna biasa ubah soalan', false, () => setDoc(doc(bob.db, 'subjects', 'ujian__rules'), { questions: [1] }));

console.log('--- kelas');
const carol = await client('anon');   // murid
const dave = await client('anon');    // bukan ahli
const cls = doc(collection(bob.db, 'classes'));
await expect('pengguna biasa cipta kelas', false, () => setDoc(doc(collection(carol.db, 'classes')), { name: 'X', teacherUid: carol.uid, code: 'AAAAAA' }));
await expect('cikgu cipta kelas', true, () => setDoc(cls, { name: '6 Bestari', teacherUid: bob.uid, code: 'TEST42', createdAt: '2026' }));
await expect('cikgu cipta kelas atas nama orang lain', false, () => setDoc(doc(collection(bob.db, 'classes')), { name: 'X', teacherUid: carol.uid, code: 'B' }));
await expect('cikgu daftar kod kelas', true, () => setDoc(doc(bob.db, 'classCodes', 'TEST42'), { classId: cls.id }));
await expect('pengguna daftar kod untuk kelas orang', false, () => setDoc(doc(carol.db, 'classCodes', 'HACK99'), { classId: cls.id }));
await expect('murid baca kod kelas', true, () => getDoc(doc(carol.db, 'classCodes', 'TEST42')));
await expect('murid senaraikan semua kod kelas', false, () => getDocs(collection(carol.db, 'classCodes')));
await expect('murid baca kelas sebelum sertai', false, () => getDoc(doc(carol.db, 'classes', cls.id)));
await expect('murid sertai dengan kod salah', false, () => setDoc(doc(carol.db, 'classes', cls.id, 'members', carol.uid), { name: 'Carol', code: 'SALAH1' }));
await expect('murid sertai dengan kod betul', true, () => setDoc(doc(carol.db, 'classes', cls.id, 'members', carol.uid), { name: 'Carol', code: 'TEST42' }));
await expect('murid daftarkan orang lain', false, () => setDoc(doc(carol.db, 'classes', cls.id, 'members', dave.uid), { name: 'Dave', code: 'TEST42' }));
await expect('murid baca kelas selepas sertai', true, () => getDoc(doc(carol.db, 'classes', cls.id)));
await expect('murid kemas kini ringkasan sendiri', true, () => updateDoc(doc(carol.db, 'classes', cls.id, 'members', carol.uid), { summary: { answered: 3 } }));
await expect('murid senaraikan kawan sekelas', true, () => getDocs(collection(carol.db, 'classes', cls.id, 'members')));
await expect('bukan ahli senaraikan ahli kelas', false, () => getDocs(collection(dave.db, 'classes', cls.id, 'members')));
await expect('cikgu senaraikan ahli kelas', true, () => getDocs(collection(bob.db, 'classes', cls.id, 'members')));
await expect('murid ubah nama kelas', false, () => updateDoc(doc(carol.db, 'classes', cls.id), { name: 'Hack' }));
const asg = doc(collection(bob.db, 'classes', cls.id, 'assignments'));
await expect('cikgu cipta kerja rumah', true, () => setDoc(asg, { title: 'KR1', questionIds: ['a'], createdAt: '2026' }));
await expect('murid cipta kerja rumah', false, () => setDoc(doc(collection(carol.db, 'classes', cls.id, 'assignments')), { title: 'X' }));
await expect('murid baca kerja rumah', true, () => getDocs(collection(carol.db, 'classes', cls.id, 'assignments')));
await expect('bukan ahli baca kerja rumah', false, () => getDocs(collection(dave.db, 'classes', cls.id, 'assignments')));
await expect('murid hantar kerja rumah sendiri', true, () => setDoc(doc(carol.db, 'classes', cls.id, 'assignments', asg.id, 'submissions', carol.uid), { bestScore: 5 }));
await expect('bukan ahli hantar kerja rumah', false, () => setDoc(doc(dave.db, 'classes', cls.id, 'assignments', asg.id, 'submissions', dave.uid), { bestScore: 9 }));
await expect('murid hantar bagi pihak orang lain', false, () => setDoc(doc(carol.db, 'classes', cls.id, 'assignments', asg.id, 'submissions', dave.uid), { bestScore: 9 }));
await expect('murid lihat hantaran orang lain', false, () => getDocs(collection(carol.db, 'classes', cls.id, 'assignments', asg.id, 'submissions')));
await expect('cikgu lihat semua hantaran', true, () => getDocs(collection(bob.db, 'classes', cls.id, 'assignments', asg.id, 'submissions')));
await expect('cikgu keluarkan murid', true, () => deleteDoc(doc(bob.db, 'classes', cls.id, 'members', carol.uid)));
await expect('murid dikeluarkan baca kelas', false, () => getDoc(doc(carol.db, 'classes', cls.id)));
await expect('admin baca kelas cikgu', true, () => getDoc(doc(admin.db, 'classes', cls.id)));
await expect('cikgu padam kod & kelas', true, async () => { await deleteDoc(doc(bob.db, 'classCodes', 'TEST42')); await deleteDoc(cls); });

console.log('--- pengesahan cikgu');
const stamp = Date.now();
const delimaG = await client('google', `g-${stamp}@moe-dl.edu.my`);
const delimaM = await client('google', `m-${stamp}@moe-dl.edu.my`);
const fakeG = await client('google', `g-${stamp}@moe-dl.edu.my.evil.com`);
await expect('guru DELIMa (g-) cipta kelas terus', true, () => setDoc(doc(collection(delimaG.db, 'classes')), { name: 'K', teacherUid: delimaG.uid, code: 'DLM001' }));
await expect('murid DELIMa (m-) cipta kelas', false, () => setDoc(doc(collection(delimaM.db, 'classes')), { name: 'K', teacherUid: delimaM.uid, code: 'DLM002' }));
await expect('domain palsu g-…moe-dl.edu.my.evil.com cipta kelas', false, () => setDoc(doc(collection(fakeG.db, 'classes')), { name: 'K', teacherUid: fakeG.uid, code: 'DLM003' }));
await expect('tetamu cipta kelas', false, () => setDoc(doc(collection(carol.db, 'classes')), { name: 'K', teacherUid: carol.uid, code: 'DLM004' }));
await expect('pengguna hantar permohonan cikgu', true, () => setDoc(doc(delimaM.db, 'users', delimaM.uid), { teacherRequest: { status: 'pending', school: 'SRA' } }, { merge: true }));
await expect('pemohon luluskan diri sendiri (role)', false, () => updateDoc(doc(delimaM.db, 'users', delimaM.uid), { role: 'teacher' }));
await expect('admin senaraikan permohonan', true, () => getDocs(query(collection(admin.db, 'users'), where('teacherRequest.status', '==', 'pending'))));
await expect('bukan admin senaraikan permohonan', false, () => getDocs(query(collection(delimaG.db, 'users'), where('teacherRequest.status', '==', 'pending'))));
await expect('admin luluskan permohonan', true, () => updateDoc(doc(admin.db, 'users', delimaM.uid), { role: 'teacher', 'teacherRequest.status': 'approved' }));
await expect('pemohon diluluskan cipta kelas', true, () => setDoc(doc(collection(delimaM.db, 'classes')), { name: 'K', teacherUid: delimaM.uid, code: 'DLM005' }));

console.log('--- set soalan cikgu');
const setRef = doc(collection(delimaG.db, 'teacherSets'));
await expect('cikgu cipta set soalan', true, () => setDoc(setRef, { ownerUid: delimaG.uid, title: 'Set A', questions: [], updatedAt: '2026' }));
await expect('murid cipta set soalan', false, () => setDoc(doc(collection(carol.db, 'teacherSets')), { ownerUid: carol.uid, title: 'X', questions: [] }));
await expect('cikgu cipta set atas nama orang lain', false, () => setDoc(doc(collection(delimaG.db, 'teacherSets')), { ownerUid: delimaM.uid, title: 'X', questions: [] }));
await expect('cikgu kemas kini set sendiri', true, () => updateDoc(setRef, { questions: [{ id: 'q1' }], updatedAt: '2027' }));
await expect('cikgu pindah milik set', false, () => updateDoc(setRef, { ownerUid: delimaM.uid }));
await expect('cikgu lain baca set orang', false, () => getDoc(doc(delimaM.db, 'teacherSets', setRef.id)));
await expect('cikgu lain ubah set orang', false, () => updateDoc(doc(delimaM.db, 'teacherSets', setRef.id), { title: 'Hack' }));
await expect('murid baca set cikgu', false, () => getDoc(doc(carol.db, 'teacherSets', setRef.id)));
await expect('cikgu senaraikan set sendiri', true, () => getDocs(query(collection(delimaG.db, 'teacherSets'), where('ownerUid', '==', delimaG.uid))));
await expect('cikgu senaraikan semua set', false, () => getDocs(collection(delimaG.db, 'teacherSets')));
await expect('admin senaraikan semua set', true, () => getDocs(collection(admin.db, 'teacherSets')));
await expect('admin sunting set cikgu', true, () => updateDoc(doc(admin.db, 'teacherSets', setRef.id), { title: 'Disemak admin' }));
await expect('cikgu padam set sendiri', true, () => deleteDoc(setRef));

console.log('--- profil awam');
await expect('pengguna tulis profil awam sendiri', true, () => setDoc(doc(carol.db, 'publicProfiles', carol.uid), { name: 'Carol', avatar: { animal: 'kucing' } }));
await expect('pengguna tulis profil awam orang lain', false, () => setDoc(doc(carol.db, 'publicProfiles', dave.uid), { name: 'Hack' }));
await expect('nama profil terlalu panjang', false, () => setDoc(doc(carol.db, 'publicProfiles', carol.uid), { name: 'x'.repeat(40) }));
await expect('pengguna lain baca profil awam', true, () => getDoc(doc(dave.db, 'publicProfiles', carol.uid)));
await expect('tanpa log masuk baca profil awam', false, () => getDoc(doc(outsider.db, 'publicProfiles', carol.uid)));
await expect('pengguna padam profil awam sendiri', true, () => deleteDoc(doc(carol.db, 'publicProfiles', carol.uid)));

console.log('--- dompet & avatar');
// Cipta dompet seperti Worker (akaun servis) — REST emulator dengan "Bearer owner" melepasi peraturan.
async function adminWrite(path, fields) {
  const res = await fetch(`http://127.0.0.1:${PORT}/v1/projects/demo-kuiz/databases/(default)/documents/${path}`, {
    method: 'PATCH', headers: { authorization: 'Bearer owner', 'content-type': 'application/json' }, body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error('adminWrite ' + res.status);
}
await adminWrite(`wallets/${carol.uid}`, { earned: { integerValue: '100' }, items: { arrayValue: { values: [{ stringValue: 'mahkota' }] } } });
await expect('pemilik baca dompet sendiri', true, () => getDoc(doc(carol.db, 'wallets', carol.uid)));
await expect('pengguna lain baca dompet', false, () => getDoc(doc(dave.db, 'wallets', carol.uid)));
await expect('pemilik tambah syiling sendiri', false, () => setDoc(doc(carol.db, 'wallets', carol.uid), { earned: 999999 }, { merge: true }));
await expect('pengguna cipta dompet sendiri', false, () => setDoc(doc(dave.db, 'wallets', dave.uid), { earned: 999999 }));
await expect('admin baca dompet pengguna', true, () => getDoc(doc(admin.db, 'wallets', carol.uid)));
await expect('pakai barang dimiliki (dalam dompet)', true, () => setDoc(doc(carol.db, 'users', carol.uid), { avatar: { animal: 'harimau', hat: 'mahkota' } }, { merge: true }));
await expect('pakai barang belum dibeli', false, () => setDoc(doc(carol.db, 'users', carol.uid), { avatar: { animal: 'harimau', hat: 'mahkota', card: 'tema-galaksi' } }, { merge: true }));
await expect('simpan kemajuan tanpa ubah avatar', true, () => setDoc(doc(carol.db, 'users', carol.uid), { stats: { answered: 9 } }, { merge: true }));
await expect('tanpa dompet: barang percuma sahaja', true, () => setDoc(doc(dave.db, 'users', dave.uid), { avatar: { animal: 'kucing', hat: 'songkok', card: 'tema-biru' } }, { merge: true }));
await expect('tanpa dompet: barang berbayar ditolak', false, () => setDoc(doc(dave.db, 'users', dave.uid), { avatar: { animal: 'singa' } }, { merge: true }));
await expect('profil awam dengan barang belum dibeli', false, () => setDoc(doc(dave.db, 'publicProfiles', dave.uid), { name: 'Dave', avatar: { animal: 'singa' } }));
await expect('profil awam dengan barang dimiliki', true, () => setDoc(doc(carol.db, 'publicProfiles', carol.uid), { name: 'Carol', avatar: { animal: 'harimau', hat: 'mahkota' } }));
await expect('admin pakai apa sahaja', true, () => setDoc(doc(admin.db, 'users', admin.uid), { avatar: { animal: 'singa', card: 'tema-emas' } }, { merge: true }));

console.log('--- lain-lain');
await expect('tulis koleksi tidak dikenali', false, () => setDoc(doc(admin.db, 'random', 'x'), { a: 1 }));

for (const c of [alice, bob, admin, outsider, carol, dave, delimaG, delimaM, fakeG]) await deleteApp(c.app);
console.log(failed ? `\n${failed} ujian GAGAL` : '\nSemua ujian lulus');
process.exit(failed ? 1 : 0);
