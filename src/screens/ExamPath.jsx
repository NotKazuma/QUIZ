// Laluan subjek: bulatan zigzag dengan cincin kemajuan, cip tahun di atas,
// dan panel bawah untuk memilih LATIHAN atau CABARAN.
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Magnet from '../components/bits/Magnet.jsx';
import Mascot from '../components/Mascot.jsx';
import { BackButton } from '../components/ui.jsx';
import { filterByYear, loadExamQuestions, yearOf } from '../lib/quiz.js';

// Emoji subjek ikut kata kunci id.
const SUBJECT_EMOJI = [
  [/ibad/, '🕌'], [/aqidah|tauhid/, '☝️'], [/sirah/, '🐪'], [/adab|akhlak/, '💛'], [/jawi/, '✍️'],
  [/arab/, '🔤'], [/tafsir/, '📖'], [/tajwid/, '🎙️'], [/munakahat/, '💍'], [/faraid/, '⚖️'],
];
const emojiFor = id => SUBJECT_EMOJI.find(([re]) => re.test(id))?.[1] || '📘';

// Anjakan mendatar (px) untuk corak zigzag.
const ZIGZAG = [0, 64, 96, 64, 0, -64, -96, -64];

export default function ExamPath({ exam, stats, onBack, onStart }) {
  const [bySubject, setBySubject] = useState(null);
  const [year, setYear] = useState(null);   // null = semua tahun
  const [open, setOpen] = useState(null);   // subjek yang dibuka dalam panel bawah

  useEffect(() => {
    let alive = true;
    loadExamQuestions(exam).then(r => { if (alive) setBySubject(r); });
    return () => { alive = false; };
  }, [exam]);

  const years = useMemo(() => {
    const all = Object.values(bySubject || {}).filter(Boolean).flat();
    return [...new Set(all.map(yearOf))].sort().reverse();
  }, [bySubject]);

  const nodes = exam.subjects.map(s => {
    const qs = bySubject?.[s.id] || [];
    const questions = filterByYear(qs, year);
    const best = stats?.subjects?.[exam.id + ':' + s.id];
    const status = !bySubject ? 'loading' : !questions.length ? 'empty' : best >= 80 ? 'done' : best !== undefined ? 'started' : 'new';
    return { subject: s, questions, best, status };
  });
  // Subjek seterusnya = yang pertama belum cemerlang dan ada soalan.
  const nextIndex = nodes.findIndex(n => n.status === 'new' || n.status === 'started');

  return (
    <section className="screen exam-path">
      <BackButton onClick={onBack} />
      <div className={'path-head' + (exam.icon === 'graduation' ? ' is-blue' : '')}>
        <span className="kicker">{exam.desc || 'Peperiksaan'}</span>
        <span className="title">{exam.name}</span>
        <span className="kicker">Pilih subjek untuk mula berlatih</span>
      </div>

      {years.length > 0 && (
        <div className="year-chips" role="radiogroup" aria-label="Tahun kertas">
          <button className={'chip' + (year === null ? ' is-active' : '')} onClick={() => setYear(null)}>Semua tahun</button>
          {years.map(y => (
            <button key={y} className={'chip' + (year === y ? ' is-active' : '')} onClick={() => setYear(y)}>{y}</button>
          ))}
        </div>
      )}

      <div className="path">
        {nodes.map((n, i) => {
          const x = ZIGZAG[i % ZIGZAG.length];
          const pct = n.best ?? 0;
          const circ = 2 * Math.PI * 46;
          return (
            <motion.div key={n.subject.id} className="path-node"
              initial={{ opacity: 0, y: 20, x }} animate={{ opacity: 1, y: 0, x }} transition={{ delay: i * 0.06 }}>
              <Magnet padding={40} magnetStrength={5}>
                <button className={'node-btn is-' + n.status + (i === nextIndex ? ' is-next' : '')} disabled={n.status === 'loading'}
                  onClick={() => n.status !== 'empty' && setOpen(n)} aria-label={n.subject.name}>
                  {i === nextIndex && <span className="node-start">MULA</span>}
                  <svg className="node-ring" viewBox="0 0 100 100" aria-hidden="true">
                    <circle className="track" cx="50" cy="50" r="46" />
                    {pct > 0 && <circle className="value" cx="50" cy="50" r="46"
                      strokeDasharray={`${(pct / 100) * circ} ${circ}`} />}
                  </svg>
                  <span aria-hidden="true">{n.status === 'done' ? '👑' : emojiFor(n.subject.id)}</span>
                </button>
              </Magnet>
              <span className="node-label">{n.subject.name}</span>
              <span className="node-sub">
                {n.status === 'loading' ? '…' : n.status === 'empty' ? 'Tiada soalan' : `${n.questions.length} soalan${n.best !== undefined ? ` · ${n.best}%` : ''}`}
              </span>
              {/* Belang menemani di sisi laluan */}
              {i % 4 === 1 && (
                <Mascot mood={i % 8 === 1 ? 'think' : 'happy'} size={78}
                  className={'path-mascot ' + (x > 0 ? 'on-left' : 'on-right')} />
              )}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="sheet-backdrop" onClick={() => setOpen(null)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div className="sheet" role="dialog" aria-label={open.subject.name}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}>
              <span className="sheet-grip" />
              <span className="sheet-title">{emojiFor(open.subject.id)} {open.subject.name}</span>
              <div className="sheet-meta">
                <span>{open.questions.length} soalan</span>
                <span>{year ? 'Tahun ' + year : 'Semua tahun'}</span>
                {open.best !== undefined && <span>Terbaik {open.best}%</span>}
              </div>
              <button className="btn btn-primary btn-lg" onClick={() => onStart(open.subject, open.questions, 'practice', year)}>
                ✏️ Latihan
              </button>
              <button className="btn btn-purple btn-lg" onClick={() => onStart(open.subject, open.questions, 'challenge', year)}>
                ⚡ Cabaran (bermasa)
              </button>
              <button className="btn btn-ghost" onClick={() => setOpen(null)}>Tutup</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
