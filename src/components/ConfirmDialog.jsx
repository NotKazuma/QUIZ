// Dialog pengesahan dalam laman (ganti confirm() pelayar yang disekat oleh sesetengah pelayar telefon).
// Guna: if (!(await ask('Padam?'))) return;   — <ConfirmHost /> dipasang sekali dalam App.
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

let open = null; // fungsi yang didaftarkan oleh ConfirmHost

export function ask(message, { ok = 'Ya', cancel = 'Batal', danger = false } = {}) {
  if (!open) return Promise.resolve(window.confirm(message));
  return new Promise(resolve => open({ message, ok, cancel, danger, resolve }));
}

export function ConfirmHost() {
  const [req, setReq] = useState(null);
  useEffect(() => {
    open = setReq;
    return () => { open = null; };
  }, []);

  function answer(value) {
    req?.resolve(value);
    setReq(null);
  }

  useEffect(() => {
    if (!req) return;
    const onKey = e => { if (e.key === 'Escape') answer(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {req && (
        <motion.div key="confirm" className="confirm-backdrop" onClick={() => answer(false)}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="confirm-box" role="alertdialog" aria-modal="true" aria-label={req.message}
            onClick={e => e.stopPropagation()}
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
            <p className="confirm-msg">{req.message}</p>
            <div className="confirm-actions">
              <button className="btn btn-ghost btn-lg" onClick={() => answer(false)}>{req.cancel}</button>
              <button className={'btn btn-lg ' + (req.danger ? 'btn-red' : 'btn-primary')} autoFocus onClick={() => answer(true)}>{req.ok}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
