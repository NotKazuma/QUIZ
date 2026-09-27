// Skrin muatan: Belang melompat, bar kemajuan & tip ulang kaji bertukar-tukar.
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Mascot from './Mascot.jsx';

const TIPS = [
  'Ulang kaji sedikit setiap hari lebih berkesan daripada banyak sekali gus.',
  'Jawab soalan salah semula dalam Cabaran untuk dapat syiling tambahan.',
  'Kumpul syiling dan hias avatar anda di kedai!',
  'Kekalkan rekod hari berturut dengan berlatih setiap hari.',
  'Ajak kawan berlumba — siapa paling pantas dan tepat?',
];

export default function LoadingScreen({ label = 'Memuatkan…', overlay = false }) {
  const [tip, setTip] = useState(() => Math.floor(Math.random() * TIPS.length));
  useEffect(() => {
    const t = setInterval(() => setTip(i => (i + 1) % TIPS.length), 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={'loading-screen' + (overlay ? ' is-overlay' : '')} role="status" aria-live="polite">
      <motion.div animate={{ y: [0, -16, 0] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}>
        <Mascot mood="wave" size={120} />
      </motion.div>
      <b className="loading-label">{label}</b>
      <div className="loading-bar"><i /></div>
      <AnimatePresence mode="wait">
        <motion.p key={tip} className="loading-tip" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
          {TIPS[tip]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// Buang skrin muatan awal (index.html) dengan pudar.
export function hideBootSplash() {
  const el = document.getElementById('boot');
  if (!el) return;
  el.classList.add('is-gone');
  setTimeout(() => el.remove(), 400);
}
