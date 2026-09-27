// Bilik perlumbaan: lobi (PIN + pemain), permainan (soalan bermasa + papan kedudukan langsung), podium.
// Hos boleh sama ada bermain sekali (lumba dengan kawan) atau hanya memantau (cikgu di projektor).
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import QuestionRound from '../../components/QuestionRound.jsx';
import { DifficultyBadge } from '../Challenge.jsx';
import { GlowButton, Icon } from '../../components/ui.jsx';
import { pointsFor, timeFor } from '../../lib/challenge.js';
import { loadQuestions, objectiveOnly, rebuildQuestions } from '../../lib/quiz.js';
import {
  deleteRace, endRace, leaveRace, ranking, startRace, updatePlayer, watchRace,
} from '../../lib/race.js';
import { Leaderboard, Podium } from './Leaderboard.jsx';
import PublicProfileSheet from '../../components/PublicProfileSheet.jsx';
import Emoji from '../../components/Emoji.jsx';
import PowerBar, { PowerStatus, applyPower, usePowerRound } from '../../components/PowerBar.jsx';
import { ask } from '../../components/ConfirmDialog.jsx';

const Celebration = lazy(() => import('../../components/Celebration.jsx'));

// `power` = { stats, onUse(id) → bool, onGrant() } untuk kuasa semasa berlumba.
export default function RaceRoom({ pin, user, config, isHost: hostProp, onExit, onRaceEnd, power }) {
  const [race, setRace] = useState(undefined); // undefined = memuat, null = ditutup
  const [questions, setQuestions] = useState(null);
  const [viewing, setViewing] = useState(null); // pemain yang profilnya dibuka
  const reported = useRef(false);

  useEffect(() => watchRace(pin, setRace), [pin]);

  // Muat soalan sekali, mengikut susunan & kocokan yang sama untuk semua pemain.
  const orderKey = race ? JSON.stringify(race.order) : '';
  useEffect(() => {
    if (!race || questions) return;
    // Perlumbaan daripada set cikgu membawa salinan soalannya sendiri.
    if (race.questions) return setQuestions(rebuildQuestions(objectiveOnly(race.questions), race.order));
    const subject = config?.exams.find(e => e.id === race.examId)?.subjects.find(s => s.id === race.subjectId);
    if (!subject) return;
    loadQuestions(subject.file).then(qs => setQuestions(rebuildQuestions(objectiveOnly(qs), race.order)));
  }, [orderKey, config]); // eslint-disable-line react-hooks/exhaustive-deps

  const players = race?.players || {};
  const me = players[user.uid];
  const isHost = race ? race.hostUid === user.uid : hostProp;
  const total = race?.order?.length || 0;

  // Hos tamatkan perlumbaan secara automatik bila semua pemain sudah selesai.
  useEffect(() => {
    if (!isHost || race?.status !== 'playing') return;
    const list = Object.values(players);
    if (list.length && list.every(p => p.finished)) endRace(pin);
  }, [isHost, race?.status, players, pin]);

  // Laporkan keputusan (untuk statistik & pencapaian) sekali sahaja bila tamat.
  useEffect(() => {
    if (race?.status !== 'ended' || !me || reported.current) return;
    reported.current = true;
    const rows = ranking(players);
    onRaceEnd({ pin, rank: rows.findIndex(r => r.uid === user.uid) + 1, players: rows.length, score: me.score });
  }, [race?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function exit() {
    if (isHost) {
      if (race && race.status !== 'ended' && !await ask('Tutup perlumbaan ini untuk semua pemain?', { ok: 'Tutup', danger: true })) return;
      await deleteRace(pin).catch(() => {});
    } else if (race && race.status === 'lobby') {
      await leaveRace(pin, user.uid).catch(() => {});
    }
    onExit();
  }

  if (race === undefined) return <p className="alert">Menyambung ke perlumbaan…</p>;
  if (race === null) {
    return (
      <section className="screen race">
        <p className="alert">Perlumbaan ini telah ditutup oleh hos.</p>
        <button className="btn btn-primary btn-lg" onClick={onExit}>Kembali</button>
      </section>
    );
  }

  const header = (
    <div className="race-header">
      <button className="btn btn-ghost btn-icon" onClick={exit} aria-label="Keluar"><Icon name="x" /></button>
      <span className="race-title"><Emoji e="🏁" /> {race.examName} · {race.subjectName}</span>
      <span className="badge badge-secondary">PIN {pin}</span>
    </div>
  );

  // ===== Lobi =====
  if (race.status === 'lobby') {
    const count = Object.keys(players).length;
    return (
      <section className="screen race">
        {header}
        <div className="card race-pin">
          <span className="muted small">{isHost ? 'Minta pemain masuk dengan PIN ini' : 'Anda sudah masuk! Menunggu hos mula…'}</span>
          <span className="race-pin-value">{pin.slice(0, 3)} {pin.slice(3)}</span>
          <span className="muted small">Perlumbaan → Sertai → masukkan PIN</span>
        </div>
        <p className="section-title">{count} pemain</p>
        <div className="lobby-players">
          {Object.entries(players).map(([uid, p]) => (
            <motion.span key={uid} className={'lobby-chip' + (uid === user.uid ? ' is-me' : '')}
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
              {p.name}
            </motion.span>
          ))}
          {!count && <p className="muted">Belum ada pemain…</p>}
        </div>
        {isHost ? (
          <GlowButton className="glow-lg" disabled={!count} onClick={() => startRace(pin)}>
            Mula perlumbaan ({total} soalan)
          </GlowButton>
        ) : (
          <p className="alert waiting"><Emoji e="⏳" /> Tunggu sebentar, hos akan mulakan perlumbaan.</p>
        )}
      </section>
    );
  }

  // ===== Tamat =====
  if (race.status === 'ended') {
    const rows = ranking(players);
    const myRank = rows.findIndex(r => r.uid === user.uid) + 1;
    return (
      <section className="screen race">
        {header}
        {myRank > 0 && myRank <= 3 && (
          <div className="race-balls" aria-hidden="true"><Suspense fallback={null}><Celebration /></Suspense></div>
        )}
        <h2 className="race-end-title">{myRank === 1 ? <><Emoji e="🏆" /> Anda juara!</> : myRank ? `Anda tempat ke-${myRank}!` : 'Perlumbaan tamat!'}</h2>
        <Podium players={players} />
        <Leaderboard players={players} total={total} me={user.uid} onOpen={setViewing} />
        <button className="btn btn-primary btn-lg" onClick={exit}>{isHost ? 'Tutup perlumbaan' : 'Kembali'}</button>
        <PublicProfileSheet uid={viewing?.uid} fallbackName={viewing?.name} onClose={() => setViewing(null)} />
      </section>
    );
  }

  // ===== Sedang berlumba =====
  const playing = me && !me.finished;
  return (
    <section className="screen race">
      {header}
      {playing && questions ? (
        <PlayRounds pin={pin} user={user} me={me} questions={questions} players={players} power={power} />
      ) : me && me.finished ? (
        <>
          <div className="card race-done">
            <span className="pop-emoji"><Emoji e="🏁" size="3rem" /></span>
            <b>Selesai! {me.score.toLocaleString('ms-MY')} mata</b>
            <span className="muted small">Menunggu pemain lain…</span>
          </div>
          <Leaderboard players={players} total={total} me={user.uid} onOpen={setViewing} />
        </>
      ) : me ? (
        <p className="alert">Memuatkan soalan…</p>
      ) : (
        <>
          <p className="section-title">Papan kedudukan langsung</p>
          <Leaderboard players={players} total={total} me={user.uid} onOpen={setViewing} />
        </>
      )}
      {isHost && (
        <button className="btn btn-outline btn-lg race-end-btn" onClick={async () => (await ask('Tamatkan perlumbaan sekarang untuk semua?', { ok: 'Tamatkan', danger: true })) && endRace(pin)}>
          Tamatkan perlumbaan
        </button>
      )}
      <PublicProfileSheet uid={viewing?.uid} fallbackName={viewing?.name} onClose={() => setViewing(null)} />
    </section>
  );
}

// Soalan demi soalan untuk seorang pemain. Kemajuan disimpan dalam nod pemain (boleh sambung jika muat semula).
function PlayRounds({ pin, user, me, questions, players, power }) {
  const [current, setCurrent] = useState(me.answered || 0);
  const { fx, setFx, reset: resetFx } = usePowerRound();
  const [phase, setPhase] = useState('question');
  const [last, setLast] = useState(null);
  const total = questions.length;
  const q = questions[current];

  const rank = useMemo(() => ranking(players).findIndex(r => r.uid === user.uid) + 1, [players, user.uid]);

  function answered(r) {
    const shielded = !r.correct && fx.shield;
    const streak = r.correct ? (me.streak || 0) + 1 : shielded ? me.streak || 0 : 0;
    const base = pointsFor({ ...r, streak });
    const pts = fx.double && r.correct ? { ...base, total: base.total * 2, doubled: true } : base;
    power?.onAnswer?.(r.correct, q);
    if (r.correct && streak > 0 && streak % 3 === 0) power?.onGrant();
    const next = {
      score: (me.score || 0) + pts.total,
      correct: (me.correct || 0) + (r.correct ? 1 : 0),
      answered: current + 1,
      streak,
      finished: current + 1 >= total,
    };
    setLast({ ...r, pts, streak, shielded });
    updatePlayer(pin, user.uid, next);
    setTimeout(() => setPhase('feedback'), 700);
  }

  // Pergi ke soalan seterusnya secara automatik selepas 2.5 saat.
  useEffect(() => {
    if (phase !== 'feedback') return;
    const t = setTimeout(next, 2500);
    return () => clearTimeout(t);
  }, [phase, current]); // eslint-disable-line react-hooks/exhaustive-deps

  function next() {
    resetFx();
    if (current + 1 >= total) return; // nod pemain sudah ditanda selesai
    setCurrent(c => c + 1);
    setPhase('question');
  }

  function activatePower(id) {
    if (!power?.onUse(id)) return;
    if (id === 'skip') {
      // Langkau: kemajuan bertambah tanpa mata; rekod berturut dikekalkan.
      updatePlayer(pin, user.uid, { answered: current + 1, finished: current + 1 >= total });
      return next();
    }
    setFx(f => applyPower(f, id, q));
  }

  if (!q) return null;
  return (
    <>
      <div className="challenge-hud">
        <span className="hud-points">{(me.score || 0).toLocaleString('ms-MY')} <span className="hud-unit">mata</span></span>
        <span className="race-rank">#{rank} · {current + 1}/{total}</span>
      </div>
      {phase === 'question' ? (
        <>
          {power && <PowerBar stats={power.stats} fx={fx} onUse={activatePower} />}
          <PowerStatus fx={fx} />
          <QuestionRound key={current} question={q} limitSec={timeFor(q)} onAnswered={answered}
            hidden={fx.hidden} bonusMs={fx.bonusMs}
            eyebrow={`${q.exam} · ${q.subject}`} badge={<DifficultyBadge level={q.difficulty} />} />
        </>
      ) : (
        <motion.div className={'points-pop ' + (last.correct ? 'is-correct' : 'is-wrong')}
          initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <span className="pop-emoji"><Emoji e={last.correct ? '🎉' : last.timedOut ? '⏰' : '😅'} size="3.2rem" /></span>
          <span className="pop-title">{last.correct ? 'Betul!' : last.timedOut ? 'Masa tamat!' : 'Salah'}</span>
          {last.correct ? <span className="pop-points">+{last.pts.total}</span>
            : <span className="pop-answer" dir="auto">Jawapan: {q.options[q.answer]}</span>}
          {last.streak >= 2 && <span className="pop-bonus"><Emoji e="🔥" /> {last.streak} berturut</span>}
          {last.pts.doubled && <span className="pop-bonus"><Emoji e="✖️" /> Mata digandakan!</span>}
          {last.shielded && <span className="pop-bonus"><Emoji e="🛡️" /> Perisai melindungi rekod berturut!</span>}
          <span className="pop-bonus">Kedudukan anda: #{rank}</span>
          {current + 1 < total && <button className="btn btn-lg race-next" onClick={next}>Seterusnya →</button>}
        </motion.div>
      )}
    </>
  );
}
