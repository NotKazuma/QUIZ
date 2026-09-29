// Pratonton ImageField — hanya mod pembangunan.
// Buka: http://localhost:5173/?preview=image
import { useState } from 'react';
import ImageField from './ImageField.jsx';

// Gambar kecil 2×2 piksel untuk menguji keadaan "sudah ada gambar".
const SAMPLE = 'data:image/gif;base64,R0lGODlhAgACAIAAAP8AAAAAACH5BAAAAAAALAAAAAACAAIAAAIDhI9WADs=';

export default function ImageFieldPreview() {
  const [kosong, setKosong] = useState('');
  const [adaMuatNaik, setAdaMuatNaik] = useState(SAMPLE);
  const [adaLaluan, setAdaLaluan] = useState('images/darjah-2/jawi-pat2025-bulan.jpg');
  return (
    <section className="screen">
      <h2>ImageField — pratonton</h2>
      <div className="card"><h3>Kosong</h3><ImageField value={kosong} onChange={setKosong} /></div>
      <div className="card"><h3>Gambar dimuat naik</h3><ImageField value={adaMuatNaik} onChange={setAdaMuatNaik} /></div>
      <div className="card"><h3>Laluan gambar rasmi</h3><ImageField value={adaLaluan} onChange={setAdaLaluan} /></div>
    </section>
  );
}
