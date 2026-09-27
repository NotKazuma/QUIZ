// Ujian logik dompet pelayan (worker/src/logic.js). Jalankan: npm run test:worker
import assert from 'node:assert/strict';
import { LIMITS, MIGRATE_CAP, apply, balance, emptyWallet, migrate, raceRank } from '../worker/src/logic.js';

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('  ✓', name); };
const DAY = Date.UTC(2026, 8, 28, 4);
const run = (w, action, body = {}, ctx = {}) => apply(action, body, w, { now: DAY, ...ctx });

t('jawapan betul beri syiling sekali sahaja bagi soalan yang sama', () => {
  const w = emptyWallet();
  assert.equal(run(w, 'answer', { key: 'q1', correct: true }).gained, 2);
  assert.equal(run(w, 'answer', { key: 'q1', correct: true }).gained, 0);
  assert.equal(run(w, 'answer', { key: 'q2', correct: false }).gained, 0);
  assert.equal(balance(w), 2);
});

t('had syiling jawapan sehari', () => {
  const w = emptyWallet();
  for (let i = 0; i < 500; i++) run(w, 'answer', { key: 'k' + i, correct: true });
  assert.equal(balance(w), LIMITS.answerCoins);
  // hari baharu: had diset semula
  run(w, 'answer', { key: 'baru', correct: true }, { now: DAY + 864e5 });
  assert.equal(balance(w), LIMITS.answerCoins + 2);
});

t('perlumbaan tidak beri syiling jawapan', () => {
  const w = emptyWallet();
  assert.equal(run(w, 'answer', { key: 'r1', correct: true, src: 'race' }).gained, 0);
});

t('bonus tamat perlukan sekurang-kurangnya 3 jawapan; sempurna perlukan 5 betul', () => {
  const w = emptyWallet();
  assert.equal(run(w, 'finish').gained, 0);
  for (let i = 0; i < 5; i++) run(w, 'answer', { key: 'f' + i, correct: true });
  assert.equal(run(w, 'finish').gained, 30);
  assert.equal(run(w, 'finish').gained, 0, 'tamat berulang tanpa jawapan');
  for (let i = 0; i < 3; i++) run(w, 'answer', { key: 'g' + i, correct: i > 0 });
  assert.equal(run(w, 'finish').gained, 10);
});

t('mata cabaran dihadkan oleh bilangan jawapan betul', () => {
  const w = emptyWallet();
  for (let i = 0; i < 3; i++) run(w, 'answer', { key: 'c' + i, correct: i === 0 });
  assert.equal(run(w, 'finish', { mode: 'challenge', points: 999999 }).gained, 10 + 1);
});

t('hadiah harian sekali sehari', () => {
  const w = emptyWallet();
  assert.equal(run(w, 'daily').gained, 5);
  assert.equal(run(w, 'daily').gained, 0);
  assert.equal(run(w, 'daily', {}, { now: DAY + 864e5 }).gained, 5);
});

t('kuasa percuma perlukan 3 jawapan betul', () => {
  const w = emptyWallet();
  assert.equal(run(w, 'grant').granted, null);
  for (let i = 0; i < 3; i++) run(w, 'answer', { key: 'p' + i, correct: true });
  const id = run(w, 'grant', {}, { random: () => 0 }).granted;
  assert.equal(id, 'fifty');
  assert.equal(w.pGot.fifty, 1);
  assert.equal(run(w, 'grant').granted, null);
});

t('lencana: sekali setiap satu, id palsu diabaikan, had sehari', () => {
  const w = emptyWallet();
  assert.equal(run(w, 'achievements', { ids: ['first-step', 'palsu', 'first-step'] }).gained, 25);
  assert.equal(run(w, 'achievements', { ids: ['first-step'] }).gained, 0);
});

t('beli barang: harga pelayan, tiada beli berganda, syiling tidak cukup ditolak', () => {
  const w = emptyWallet(); w.earned = 100;
  assert.throws(() => run(w, 'buy', { id: 'mahkota' }), /Syiling tidak cukup/);
  run(w, 'buy', { id: 'kopiah' });
  assert.equal(balance(w), 50);
  run(w, 'buy', { id: 'kopiah' });
  assert.equal(balance(w), 50);
  assert.throws(() => run(w, 'buy', { id: 'tiada' }), /no-item/);
});

t('admin: beli tanpa bayar', () => {
  const w = emptyWallet();
  run(w, 'buy', { id: 'mahkota' }, { admin: true });
  assert.ok(w.items.includes('mahkota'));
  assert.equal(w.spent, 0);
});

t('kuasa: beli, guna, tidak boleh guna bila habis', () => {
  const w = emptyWallet(); w.earned = 40;
  run(w, 'buyPower', { id: 'fifty' });
  run(w, 'use', { id: 'fifty' });
  assert.throws(() => run(w, 'use', { id: 'fifty' }), /habis/);
});

t('kerja rumah & perlumbaan perlu disahkan, ganjaran sekali', () => {
  const w = emptyWallet();
  assert.throws(() => run(w, 'homework', { classId: 'a', assignmentId: 'b' }), /belum dihantar/);
  assert.equal(run(w, 'homework', { classId: 'a', assignmentId: 'b' }, { facts: { submitted: true } }).gained, 15);
  assert.equal(run(w, 'homework', { classId: 'a', assignmentId: 'b' }, { facts: { submitted: true } }).gained, 0);
  assert.throws(() => run(w, 'race', { pin: '123456' }), /tidak dapat disahkan/);
  assert.equal(run(w, 'race', { pin: '123456' }, { facts: { race: { rank: 1, players: 3 } } }).gained, 40);
  assert.equal(run(w, 'race', { pin: '123456' }, { facts: { race: { rank: 1, players: 3 } } }).gained, 0);
});

t('kedudukan perlumbaan hanya bila tamat', () => {
  const race = { status: 'ended', players: { a: { score: 5 }, b: { score: 9 }, c: { score: 1 } } };
  assert.deepEqual(raceRank(race, 'a'), { rank: 2, players: 3 });
  assert.equal(raceRank({ ...race, status: 'playing' }, 'a'), null);
  assert.equal(raceRank(race, 'x'), null);
});

t('pindah baki lama dengan had', () => {
  const w = migrate({ coinsEarned: 99999, coinsSpent: 10, items: ['mahkota', 'palsu'], pGot: { fifty: 500 }, pUsed: { fifty: 1 } }, { 'first-step': 'x' });
  assert.equal(balance(w), MIGRATE_CAP.coins);
  assert.deepEqual(w.items, ['mahkota']);
  assert.equal(w.pGot.fifty, MIGRATE_CAP.powerups);
  assert.deepEqual(w.ach, ['first-step']);
});

console.log(`\n${pass} ujian lulus`);
