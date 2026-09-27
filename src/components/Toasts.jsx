// Notifikasi timbul di atas skrin: pencapaian baharu, atau peringatan pautkan Google untuk tetamu.
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import ShinyText from './bits/ShinyText.jsx';
import { GoogleButton } from './ui.jsx';

function Toast({ toast, onClose, onLink }) {
  // Tutup sendiri selepas beberapa saat (pemasa tidak diset semula bila skrin dilukis semula).
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const t = setTimeout(() => closeRef.current(), toast.type === 'remind' ? 8000 : 4500);
    return () => clearTimeout(t);
  }, [toast.key, toast.type]);

  return (
    <motion.div
      layout
      className={'toast toast-' + toast.type}
      initial={{ opacity: 0, y: -40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      role="status"
      onClick={toast.type === 'achievement' ? onClose : undefined}
    >
      {toast.type === 'achievement' ? (
        <>
          <motion.span className="toast-emoji" aria-hidden="true"
            initial={{ rotate: -30, scale: 0.4 }} animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 8, stiffness: 200, delay: 0.1 }}>
            {toast.achievement.emoji}
          </motion.span>
          <div className="toast-body">
            <p className="toast-kicker">
              <ShinyText text="Pencapaian baharu!" speed={2} color="#b45309" shineColor="#fde68a" />
            </p>
            <p className="toast-title">{toast.achievement.title}</p>
            <p className="toast-desc">{toast.achievement.desc}</p>
          </div>
        </>
      ) : (
        <>
          <span className="toast-emoji" aria-hidden="true">⚠️</span>
          <div className="toast-body">
            <p className="toast-title">Jangan lupa simpan kemajuan!</p>
            <p className="toast-desc">Anda masih tetamu. Pautkan akaun Google supaya markah tidak hilang.</p>
            <div className="toast-actions">
              <GoogleButton className="btn-google-sm" onClick={() => { onClose(); onLink(); }}>Pautkan</GoogleButton>
              <button className="btn btn-ghost btn-sm" onClick={onClose}>Nanti</button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

export default function Toasts({ toasts, onDismiss, onLink }) {
  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence>
        {toasts.map(t => (
          <Toast key={t.key} toast={t} onClose={() => onDismiss(t.key)} onLink={onLink} />
        ))}
      </AnimatePresence>
    </div>
  );
}
