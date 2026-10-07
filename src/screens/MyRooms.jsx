// Senarai bilik latihan yang saya buat. Tekan untuk lihat pautan & keputusan (RoomHost).
import { useEffect, useState } from 'react';
import { BackButton, PageHead } from '../components/ui.jsx';
import Emoji from '../components/Emoji.jsx';
import { ask } from '../components/ConfirmDialog.jsx';
import { deleteRoom, listMyRooms } from '../lib/rooms.js';

export default function MyRooms({ user, onBack, onOpen }) {
  const [rooms, setRooms] = useState(null);

  async function load() {
    try { setRooms(await listMyRooms(user.uid)); }
    catch { setRooms([]); }
  }
  useEffect(() => { load(); }, [user.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  async function remove(e, room) {
    e.stopPropagation();
    if (!await ask(`Padam bilik "${room.title}" bersama keputusannya?`)) return;
    try { await deleteRoom(room.id); setRooms(rs => rs.filter(r => r.id !== room.id)); }
    catch { alert('Gagal memadam bilik.'); }
  }

  return (
    <section className="screen my-rooms">
      <BackButton onClick={onBack} />
      <PageHead badge="Bilik latihan" title="Bilik saya" />
      <p className="muted-note" style={{ textAlign: 'center' }}>
        Buat bilik baharu dari mana-mana subjek: Latihan → pilih subjek → "Buat pautan boleh jejak (bilik)".
      </p>

      {rooms === null ? (
        <p className="muted-note" style={{ textAlign: 'center' }}>Memuat…</p>
      ) : rooms.length === 0 ? (
        <p className="muted-note" style={{ textAlign: 'center' }}>Belum ada bilik. Buat satu dari halaman subjek.</p>
      ) : (
        <div className="room-list">
          {rooms.map(r => (
            <button className="room-card" key={r.id} onClick={() => onOpen(r)}>
              <span className="room-info">
                <span className="room-title">{r.title}</span>
                <span className="room-sub">{r.count ? `${r.count} soalan` : 'Semua soalan'} · {r.open === false ? '🔒 ditutup' : '🔓 dibuka'}</span>
              </span>
              <span className="room-actions">
                <span className="room-go"><Emoji e="📊" /> Keputusan</span>
                <span className="room-del" role="button" tabIndex={0} onClick={e => remove(e, r)} aria-label="Padam bilik">🗑️</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
