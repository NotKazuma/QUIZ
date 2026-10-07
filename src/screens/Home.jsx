// Halaman utama gaya permainan: Belang menyapa, jubin peperiksaan besar, dan jubin kecil untuk ciri lain.
import { useEffect, useState } from 'react';
import CircularText from '../components/bits/CircularText.jsx';
import CountUp from '../components/bits/CountUp.jsx';
import GlareHover from '../components/bits/GlareHover.jsx';
import RotatingText from '../components/bits/RotatingText.jsx';
import Mascot, { SpeechBubble } from '../components/Mascot.jsx';
import { ActionCard, LinkReminder, Reveal } from '../components/ui.jsx';
import { ACHIEVEMENTS } from '../lib/achievements.js';
import HomeworkList from './classes/HomeworkList.jsx';
import { loadQuestions, objectiveOnly } from '../lib/quiz.js';
import Emoji, { EmojiText } from '../components/Emoji.jsx';

// Ikon emoji peperiksaan mengikut medan `icon` dalam config.json.
const EXAM_EMOJI = {
  'book-check': '📖', graduation: '🎓', book: '📚',
  'num-1': '1️⃣', 'num-2': '2️⃣', 'num-3': '3️⃣', 'num-4': '4️⃣', 'num-5': '5️⃣', 'num-6': '6️⃣',
};

export default function Home({
  config, error, user, saved, stats, displayName, unlockedCount, admin, teacher, teacherBasis, teacherRequest, onApplyTeacher,
  myClasses, onAdmin, onTeacher, onClasses, onRace, onGames, onStartHomework, onRooms,
  onResume, onDiscard, onLink, onAchievements, onSelectExam,
}) {
  const [total, setTotal] = useState(0);

  // Jumlah soalan semua subjek (fail disimpan dalam cache untuk skrin lain).
  useEffect(() => {
    if (!config) return;
    let alive = true;
    const files = config.exams.flatMap(e => e.subjects.map(s => s.file));
    Promise.all(files.map(f => loadQuestions(f).then(qs => objectiveOnly(qs).length).catch(() => 0)))
      .then(ns => { if (alive) setTotal(ns.reduce((a, b) => a + b, 0)); });
    return () => { alive = false; };
  }, [config]);

  const rotateWords = config ? [...new Set(config.exams.flatMap(e => e.subjects.map(s => s.name)))] : [];
  const firstName = displayName || (user.isGuest ? 'kawan' : user.name.split(' ')[0]);

  // Kemajuan peperiksaan = subjek yang pernah ditamatkan / jumlah subjek.
  function examProgress(exam) {
    const done = exam.subjects.filter(s => (exam.id + ':' + s.id) in (stats?.subjects || {})).length;
    return { done, total: exam.subjects.length };
  }

  return (
    <section className="screen home">
      {/* Belang menyapa, dikelilingi teks berputar (React Bits CircularText) */}
      <div className="home-hero">
        <div className="hero-mascot">
          <CircularText text="KUIZ ULANG KAJI • JOM BELAJAR • " spinDuration={24} onHover="speedUp" />
          <Mascot mood="wave" size={104} />
        </div>
        <SpeechBubble>
          <span className="hero-hello">Assalamualaikum, {firstName}!</span>
          <span className="hero-line">
            Jom ulang kaji
            {rotateWords.length > 0 && (
              <RotatingText texts={rotateWords} mainClassName="rotate-pill" splitLevelClassName="rotate-split"
                staggerFrom="last" staggerDuration={0.025} initial={{ y: '100%' }} animate={{ y: 0 }}
                exit={{ y: '-120%' }} transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                rotationInterval={2200} />
            )}
          </span>
        </SpeechBubble>
      </div>

      {error && <p className="alert">{error}</p>}

      {user.isGuest && <Reveal className="spaced"><LinkReminder onLink={onLink} /></Reveal>}

      {saved && config && <ResumeCard saved={saved} config={config} onResume={onResume} onDiscard={onDiscard} />}

      {myClasses.length > 0 && (
        <div className="spaced">
          <HomeworkList user={user} myClasses={myClasses} onStart={onStartHomework} limit={3} />
        </div>
      )}

      {/* Jubin peperiksaan besar (GlareHover memberi kilauan bila disentuh) */}
      <div className="exam-grid">
        {config?.exams.map((exam, i) => {
          const p = examProgress(exam);
          return (
            <Reveal key={exam.id} index={i}>
              <GlareHover className="exam-glare" width="100%" height="auto" background="transparent"
                borderColor="transparent" borderRadius="20px" glareColor="#ffffff" glareOpacity={0.4}
                glareSize={250} transitionDuration={700}>
                <button className={'exam-tile tone-' + (i % 3)} onClick={() => onSelectExam(exam)}>
                  <span>
                    <span className="exam-tile-kicker">{exam.subjects.length} subjek</span>
                    <span className="exam-tile-name">{exam.name}</span>
                    {exam.desc && <span className="exam-tile-desc">{exam.desc}</span>}
                    <span className="exam-tile-progress">
                      <span className="bar"><span style={{ width: (p.done / p.total) * 100 + '%' }} /></span>
                      {p.done}/{p.total}
                    </span>
                  </span>
                  <span className="exam-tile-icon" aria-hidden="true"><Emoji e={EXAM_EMOJI[exam.icon] || '📚'} size="2.6rem" /></span>
                  <span className="exam-tile-deco" aria-hidden="true"><Emoji e={EXAM_EMOJI[exam.icon] || '📚'} size="7rem" /></span>
                </button>
              </GlareHover>
            </Reveal>
          );
        })}
      </div>

      {/* Jubin kecil: ciri lain */}
      {config && (
        <Reveal className="tile-grid" index={2}>
          <MiniTile color="c-red" emoji="🎲" title="Arked Permainan" desc="Ular & Tangga, kad & perlumbaan" onClick={onGames} />
          <MiniTile color="c-yellow" emoji="🏆" title="Pencapaian"
            desc={`${unlockedCount}/${ACHIEVEMENTS.length} lencana dibuka`} onClick={onAchievements} />
          <MiniTile color="" emoji="🏫" title="Kelas saya"
            desc={myClasses.length ? `${myClasses.length} kelas · kerja rumah` : 'Sertai kelas cikgu'} onClick={onClasses} />
          <MiniTile color="c-blue" emoji="📊" title="Bilik Latihan"
            desc="Kongsi & jejak siapa menjawab" onClick={onRooms} />
          {teacher ? (
            <MiniTile color="c-purple" emoji="🧑‍🏫" title="Panel Cikgu"
              desc={teacherBasis === 'delima' ? '✅ DELIMa · kelas & soalan' : 'Kelas, soalan & laporan'} onClick={onTeacher} />
          ) : (
            <MiniTile color="c-purple" emoji="✏️" title="Saya cikgu"
              desc={teacherRequest?.status === 'pending' ? '⏳ Sedang disemak' : 'Sahkan akaun cikgu'} onClick={onApplyTeacher} />
          )}
          {admin && <MiniTile color="c-ink" emoji="🛡️" title="Panel Admin" desc="Pengguna & soalan" onClick={onAdmin} />}
        </Reveal>
      )}

      {total > 0 && (
        <p className="home-footnote">
          <CountUp to={total} duration={1.5} separator="," /> soalan · {config.exams.reduce((n, e) => n + e.subjects.length, 0)} subjek
        </p>
      )}
    </section>
  );
}

function MiniTile({ color, emoji, title, desc, onClick }) {
  return (
    <button className={'mini-tile ' + color} onClick={onClick}>
      <span className="mini-icon" aria-hidden="true"><Emoji e={emoji} size="1.7rem" /></span>
      <span className="mini-title">{title}</span>
      <span className="mini-desc"><EmojiText>{desc}</EmojiText></span>
    </button>
  );
}

function ResumeCard({ saved, config, onResume, onDiscard }) {
  const exam = config.exams.find(e => e.id === saved.examId);
  const subject = exam?.subjects.find(x => x.id === saved.subjectId);
  const total = saved.order?.length || 0;
  const done = saved.current + (saved.chosen !== null && saved.chosen !== undefined ? 1 : 0);
  const when = new Date(saved.savedAt).toLocaleString('ms-MY', { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <Reveal className="resume">
      <ActionCard className="resume-card" icon="play"
        title="Sambung latihan"
        desc={`${exam && subject ? `${exam.name} · ${subject.name}` : saved.assignment?.title || 'Soalan Cikgu'}${saved.year ? ' · ' + saved.year : ''} · ${done}/${total} dijawab · markah ${saved.score}`}
        onClick={onResume} />
      <div className="resume-meta">
        <span className="muted">Disimpan {when}</span>
        <button className="btn btn-ghost btn-sm" onClick={onDiscard}>Buang</button>
      </div>
    </Reveal>
  );
}
