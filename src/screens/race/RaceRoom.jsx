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
  deleteRace, endRace, leaveRace, ranking, setTeam, shuffleTeams, startRace, updatePlayer, watchRace,
} from '../../lib/race.js';
import { aliveCount, modeOf, rewardRank, shouldEnd, teamStandings, teamsFor } from '../../lib/raceModes.js';
import { Leaderboard, Podium, TeamBoard } from './Leaderboard.jsx';
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

  // Hos tamatkan perlumbaan secara automatik bila semua selesai (atau tinggal seorang dalam Kalah Mati).
  useEffect(() => {
    if (!isHost || race?.status !== 'playing') return;
    if (shouldEnd(race)) endRace(pin);
  }, [isHost, race?.status, players, pin]); // eslint-disable-line react-hooks/exhaustive-deps

  // Laporkan keputusan (untuk statistik & pencapaian) sekali sahaja bila tamat.
  useEffect(() => {
    if (race?.status !== 'ended' || !me || reported.current) return;
    reported.current = true;
    const r = rewardRank(race, user.uid);
    onRaceEnd({ pin, rank: r.rank, players: r.players, score: me.score });
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
      <span className="race-title"><Emoji e={modeOf(race).emoji} /> {race.examName} · {race.subjectName}</span>
      <span className="badge badge-secondary">PIN {pin}</span>
    </div>
  );

  const mode = modeOf(race);
  const teams = race.mode === 'pasukan' ? teamsFor(race) : null;

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
        <div className="mode-banner">
          <Emoji e={mode.emoji} size="1.8rem" />
          <span><b>{mode.name}</b> — {race.mode === 'kalah-mati' ? `setiap pemain ada ${race.lives || 3} nyawa. Salah atau lambat hilang satu!` : mode.desc}</span>
        </div>
        <p className="section-title">{count} pemain</p>
        {teams ? (
          <>
            <div className={'lobby-teams teams-' + teams.length}>
              {teams.map(t => {
                const members = Object.entries(players).filter(([, p]) => p.team === t.id);
                return (
                  <div key={t.id} className={'lobby-team' + (me?.team === t.id ? ' is-mine' : '')} style={{ '--team': t.color }}>
                    <span className="lobby-team-name"><Emoji e={t.emoji} /> {t.name} <span className="muted small">({members.length})</span></span>
                    {members.map(([uid, p]) => (
                      <motion.span key={uid} layout className={'lobby-chip' + (uid === user.uid ? ' is-me' : '')}>{p.name}</motion.span>
                    ))}
                    {me && me.team !== t.id && (
                      <button className="btn btn-sm btn-ghost" onClick={() => setTeam(pin, user.uid, t.id)}>Sertai</button>
                    )}
                  </div>
                );
              })}
            </div>
            {isHost && count > 1 && (
              <button className="btn btn-outline btn-lg" onClick={() => shuffleTeams(pin, players, teams)}>
                <Emoji e="🔀" /> Kocok pasukan
              </button>
            )}
          </>
        ) : (
          <div className="lobby-players">
            {Object.entries(players).map(([uid, p]) => (
              <motion.span key={uid} className={'lobby-chip' + (uid === user.uid ? ' is-me' : '')}
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
                {p.name}
              </motion.span>
            ))}
            {!count && <p className="muted">Belum ada pemain…</p>}
          </div>
        )}
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
    const rows = ranking(players, race);
    const myRank = rows.findIndex(r => r.uid === user.uid) + 1;
    const winner = teams ? teamStandings(players, race)[0] : null;
    const myTeamWon = Boolean(winner && me?.team === winner.team.id);
    return (
      <section className="screen race">
        {header}
        {(teams ? myTeamWon : myRank > 0 && myRank <= 3) && (
          <div className="race-balls" aria-hidden="true"><Suspense fallback={null}><Celebration /></Suspense></div>
        )}
        {teams ? (
          <>
            <h2 className="race-end-title" style={{ color: winner?.team.color }}>
              <Emoji e="🏆" /> Pasukan {winner?.team.name} menang!
            </h2>
            {me && <p className="race-end-sub">{myTeamWon ? 'Tahniah, pasukan anda juara!' : 'Hampir! Cuba lagi pusingan seterusnya.'}</p>}
            <TeamBoard players={players} race={race} me={user.uid} />
          </>
        ) : (
          <>
            <h2 className="race-end-title">
              {myRank === 1 ? <><Emoji e="🏆" /> {race.mode === 'kalah-mati' ? 'Anda yang terakhir bertahan!' : 'Anda juara!'}</>
                : myRank ? `Anda tempat ke-${myRank}!` : 'Perlumbaan tamat!'}
            </h2>
            <Podium players={players} race={race} />
          </>
        )}
        <Leaderboard players={players} total={total} me={user.uid} onOpen={setViewing} race={race} />
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
        <PlayRounds pin={pin} user={user} me={me} race={race} questions={questions} players={players} power={power} />
      ) : me && me.finished ? (
        <>
          <div className={'card race-done' + (me.out ? ' is-out' : '')}>
            <span className="pop-emoji"><Emoji e={me.out ? '💀' : '🏁'} size="3rem" /></span>
            <b>{me.out ? 'Anda tersingkir!' : `Selesai! ${me.score.toLocaleString('ms-MY')} mata`}</b>
            <span className="muted small">
              {race.mode === 'kalah-mati' ? `${aliveCount(players)} pemain masih bertahan…` : 'Menunggu pemain lain…'}
            </span>
          </div>
          {teams && <TeamBoard players={players} race={race} me={user.uid} />}
          <Leaderboard players={players} total={total} me={user.uid} onOpen={setViewing} race={race} />
        </>
      ) : me ? (
        <p className="alert">Memuatkan soalan…</p>
      ) : (
        <>
          <p className="section-title">Papan kedudukan langsung</p>
          {teams && <TeamBoard players={players} race={race} me={user.uid} />}
          <Leaderboard players={players} total={total} me={user.uid} onOpen={setViewing} race={race} />
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
function PlayRounds({ pin, user, me, race, questions, players, power }) {
  const survival = race.mode === 'kalah-mati';
  const [current, setCurrent] = useState(me.answered || 0);
  const { fx, setFx, reset: resetFx } = usePowerRound();
  const [phase, setPhase] = useState('question');
  const [last, setLast] = useState(null);
  const total = questions.length;
  const q = questions[current];

  const rank = useMemo(() => ranking(players, race).findIndex(r => r.uid === user.uid) + 1, [players, race, user.uid]);

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
    // Kalah Mati: salah/lambat hilang satu nyawa (Perisai melindungi nyawa).
    let lostLife = false;
    if (survival) {
      lostLife = !r.correct && !shielded;
      next.lives = Math.max(0, (me.lives ?? race.lives ?? 3) - (lostLife ? 1 : 0));
      next.out = next.lives === 0;
      if (next.out) next.finished = true;
    }
    setLast({ ...r, pts, streak, shielded, lostLife, out: next.out, lives: next.lives });
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
    if (current + 1 >= total || last?.out) return; // nod pemain sudah ditanda selesai
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
        {survival && (
          <span className="hud-lives" aria-label={`${me.lives ?? race.lives} nyawa`}>
            {Array.from({ length: race.lives || 3 }, (_, i) => (
              <span key={i} className={i < (me.lives ?? race.lives ?? 3) ? '' : 'is-lost'}><Emoji e="❤️" size="1.2rem" /></span>
            ))}
          </span>
        )}
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
          {last.shielded && <span className="pop-bonus"><Emoji e="🛡️" /> Perisai melindungi {survival ? 'nyawa anda' : 'rekod berturut'}!</span>}
          {last.lostLife && !last.out && <span className="pop-bonus pop-life"><Emoji e="💔" /> Hilang satu nyawa — tinggal {last.lives}</span>}
          {last.out && <span className="pop-bonus pop-life"><Emoji e="💀" /> Nyawa habis — anda tersingkir!</span>}
          <span className="pop-bonus">Kedudukan anda: #{rank}</span>
          {current + 1 < total && !last.out && <button className="btn btn-lg race-next" onClick={next}>Seterusnya →</button>}
        </motion.div>
      )}
    </>
  );
}
