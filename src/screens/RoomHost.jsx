// Papan pemilik bilik latihan: pautan untuk dikongsi + keputusan murid yang menjawab.
// Dibuka apabila pemilik menekan pautan bilik sendiri (/?bilik=<id>).
import { useEffect, useState } from 'react';
import { BackButton, PageHead } from '../components/ui.jsx';
import Emoji from '../components/Emoji.jsx';
import { copyLink, roomLink } from '../lib/share.js';
import { listRoomAttempts, setRoomOpen } from '../lib/rooms.js';

export default function RoomHost({ room, onBack, onChange, onPractise }) {
  const [attempts, setAttempts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    try { setAttempts(await listRoomAttempts(room.id)); }
    catch { setAttempts([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [room.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="screen room-host">
      <BackButton onClick={onBack} />
      <PageHead badge="Bilik latihan" title={room.title} />

      <div className="card share-card">
        <p className="muted-note">
          {room.count ? `${room.count} soalan` : 'Semua soalan'} · soalan bank rasmi · awam
        </p>
        {room.open === false ? (
          <>
            <p className="muted-note">Pautan ditutup — murid tidak boleh menjawab.</p>
            <button className="btn btn-primary" onClick={async () => {
              try { onChange(await setRoomOpen(room, true)); } catch { alert('Gagal membuka pautan.'); }
            }}><Emoji e="🔓" /> Buka semula pautan</button>
          </>
        ) : (
          <>
            <button className="btn btn-primary" onClick={async () => {
              const ok = await copyLink(roomLink({ roomId: room.id }));
              setCopied(ok); setTimeout(() => setCopied(false), 2000);
            }}>
              <Emoji e="📋" /> {copied ? 'Pautan disalin!' : 'Salin pautan untuk dikongsi'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={async () => {
              try { onChange(await setRoomOpen(room, false)); } catch { alert('Gagal menutup pautan.'); }
            }}><Emoji e="🔒" /> Tutup pautan (bila dah selesai)</button>
          </>
        )}
        <button className="btn btn-outline" onClick={() => onPractise(room)}><Emoji e="✏️" /> Cuba latihan sendiri</button>
        <button className="btn btn-ghost" onClick={load} disabled={loading}>
          <Emoji e="🔄" /> {loading ? 'Memuat…' : 'Muat semula keputusan'}
        </button>
      </div>

      {attempts && (attempts.length === 0 ? (
        <p className="muted-note" style={{ textAlign: 'center', marginTop: 14 }}>Belum ada murid menjawab bilik ini.</p>
      ) : (
        <div className="attempts" style={{ marginTop: 14 }}>
          <div className="attempts-head"><span>Nama</span><span>Terbaik</span><span>Terakhir</span><span>Cubaan</span></div>
          {attempts.map(a => (
            <div className="attempts-row" key={a.uid}>
              <span className="at-name">{a.name}</span>
              <span className="at-best">{a.best}%</span>
              <span>{a.lastScore}/{a.lastTotal}</span>
              <span>{a.attempts}×</span>
            </div>
          ))}
          <p className="muted-note">{attempts.length} murid menjawab</p>
        </div>
      ))}
    </section>
  );
}
