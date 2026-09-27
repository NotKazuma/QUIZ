// Bilik permainan dalam talian: lobi (PIN + pemain), kemudian permainan mengikut jenis bilik.
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import AnimalAvatar from '../../../components/AnimalAvatar.jsx';
import Emoji from '../../../components/Emoji.jsx';
import { ask } from '../../../components/ConfirmDialog.jsx';
import { GlowButton, Icon } from '../../../components/ui.jsx';
import { loadQuestions, objectiveOnly, rebuildQuestions } from '../../../lib/quiz.js';
import { SEATS, SEAT_COLORS, deleteRoom, leaveRoom, seatsOf, setState, startRoom, watchRoom } from '../../../lib/gameRoom.js';
import OnlineDuel, { duelStart } from './OnlineDuel.jsx';
import OnlineMemory, { memoryStart } from './OnlineMemory.jsx';
import OnlineSnakes, { snakesStart } from './OnlineSnakes.jsx';

const TITLES = { ular: ['🐍', 'Ular & Tangga'], duel: ['⚔️', 'Kad Duel'], padanan: ['🃏', 'Kad Padanan'] };
const STARTERS = { ular: snakesStart, duel: duelStart, padanan: memoryStart };

export default function OnlineRoom({ pin, user, config, onAnswer, onEnd, onExit }) {
  const [room, setRoom] = useState(undefined); // undefined = memuat, null = ditutup
  const [questions, setQuestions] = useState(null);
  const ended = useRef(false);

  useEffect(() => watchRoom(pin, setRoom), [pin]);

  // Soalan yang sama untuk semua pemain (susunan & kocokan disimpan dalam bilik).
  const orderKey = room ? JSON.stringify(room.order) : '';
  useEffect(() => {
    if (!room || questions) return;
    const exam = config?.exams.find(e => e.id === room.examId);
    const subject = exam?.subjects.find(s => s.id === room.subjectId);
    if (!subject) return;
    loadQuestions(subject.file).then(qs => setQuestions(
      rebuildQuestions(objectiveOnly(qs), room.order || []).map(q => ({ ...q, exam: exam.name, subject: subject.name })),
    ));
  }, [orderKey, config]); // eslint-disable-line react-hooks/exhaustive-deps

  // Laporkan keputusan sekali (statistik & lencana).
  useEffect(() => {
    const winner = room?.state?.winner;
    if (!winner || ended.current || !room.players?.[user.uid]) return;
    ended.current = true;
    onEnd?.({ game: room.type, won: winner === user.uid, stars: winner === user.uid ? 3 : 0 });
  }, [room?.state?.winner]); // eslint-disable-line react-hooks/exhaustive-deps

  if (room === undefined) return <p className="alert">Menyambung ke bilik…</p>;
  if (room === null) {
    return (
      <section className="screen">
        <p className="alert">Bilik permainan ini telah ditutup.</p>
        <button className="btn btn-primary btn-lg" onClick={onExit}>Kembali</button>
      </section>
    );
  }

  const isHost = room.hostUid === user.uid;
  const seats = room.state?.seats || seatsOf(room);
  const players = room.players || {};
  const [emoji, title] = TITLES[room.type] || ['🎲', 'Permainan'];
  const [min, max] = SEATS[room.type] || [2, 4];

  async function exit() {
    if (isHost) {
      if (room.status !== 'ended' && !(await ask('Tutup bilik ini untuk semua pemain?', { ok: 'Tutup', danger: true }))) return;
      await deleteRoom(pin).catch(() => {});
    } else {
      if (room.status === 'playing' && !(await ask('Keluar dari permainan?', { ok: 'Keluar', danger: true }))) return;
      if (room.status === 'lobby') await leaveRoom(pin, user.uid).catch(() => {});
    }
    onExit();
  }

  function start() {
    const order = seatsOf(room);
    startRoom(pin, STARTERS[room.type](order, questions));
  }

  // Hos boleh langkau giliran pemain yang terputus sambungan.
  const skip = () => setState(pin, { turn: ((room.state?.turn || 0) + 1) % seats.length, log: 'Hos melangkau giliran.' });

  const header = (
    <div className="race-header">
      <button className="btn btn-ghost btn-icon" onClick={exit} aria-label="Keluar"><Icon name="x" /></button>
      <span className="race-title"><Emoji e={emoji} /> {title} · {room.subjectName}</span>
      <span className="badge badge-secondary">PIN {pin}</span>
    </div>
  );

  if (room.status === 'lobby') {
    const count = Object.keys(players).length;
    return (
      <section className="screen race">
        {header}
        <div className="card race-pin">
          <span className="muted small">{isHost ? 'Minta kawan masuk dengan PIN ini' : 'Anda sudah masuk! Menunggu hos mula…'}</span>
          <span className="race-pin-value">{pin.slice(0, 3)} {pin.slice(3)}</span>
          <span className="muted small">Main → Sertai dengan PIN · {min === max ? `${min} pemain` : `${min}–${max} pemain`}</span>
        </div>
        <p className="section-title">{count} pemain</p>
        <div className="lobby-players">
          {seatsOf(room).map((uid, i) => (
            <motion.span key={uid} className={'lobby-chip lobby-chip-avatar' + (uid === user.uid ? ' is-me' : '')} style={{ borderColor: SEAT_COLORS[i] }}
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
              <AnimalAvatar avatar={players[uid].avatar} size={28} /> {players[uid].name}
            </motion.span>
          ))}
        </div>
        {isHost ? (
          <GlowButton className="glow-lg" disabled={count < min || count > max || !questions} onClick={start}>
            {count < min ? `Tunggu ${min - count} lagi pemain…` : `Mula main (${count} pemain)`}
          </GlowButton>
        ) : (
          <p className="alert waiting"><Emoji e="⏳" /> Tunggu sebentar, hos akan mulakan permainan.</p>
        )}
      </section>
    );
  }

  if (!room.state || !questions) return <section className="screen race">{header}<p className="alert">Memuatkan permainan…</p></section>;

  const common = { pin, room, state: room.state, seats, players, user, questions, isHost, onAnswer };
  const skipBtn = isHost && room.status === 'playing' && seats[room.state.turn] !== user.uid && !room.state.winner && (
    <button className="btn btn-ghost btn-sm skip-turn" onClick={skip}>Langkau giliran (pemain terputus?)</button>
  );
  return (
    <section className={'screen race online-' + room.type}>
      {header}
      {room.type === 'ular' && <OnlineSnakes {...common} />}
      {room.type === 'duel' && <OnlineDuel {...common} />}
      {room.type === 'padanan' && <OnlineMemory {...common} />}
      {skipBtn}
      {room.status === 'ended' && (
        <button className="btn btn-primary btn-lg" onClick={exit}>{isHost ? 'Tutup bilik' : 'Kembali'}</button>
      )}
    </section>
  );
}

