// Muat naik gambar soalan tanpa Firebase Storage.
//
// Gambar dikecilkan dan dimampatkan dalam pelayar menjadi data URL JPEG kecil,
// lalu disimpan terus di dalam dokumen soalan. Ini mengelakkan kos dan tetapan
// Storage, dan gambar terus berfungsi di luar talian.
//
// Had Firestore ialah 1 MB sedokumen, jadi kita sasarkan ~120 KB sebiji supaya
// satu set boleh memuatkan banyak soalan bergambar.

export const MAX_DIMENSION = 900;   // piksel sisi terpanjang
export const TARGET_BYTES = 120 * 1024;
export const HARD_LIMIT_BYTES = 220 * 1024;
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];

export const isDataUrl = s => typeof s === 'string' && s.startsWith('data:');

// Anggaran saiz sebenar data URL base64 dalam bait.
export function dataUrlBytes(url) {
  if (!isDataUrl(url)) return 0;
  const b64 = url.slice(url.indexOf(',') + 1);
  return Math.round(b64.length * 3 / 4);
}

export function formatBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  return (n / 1024 / 1024).toFixed(1) + ' MB';
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(new Error('Gagal membaca fail gambar.'));
    fr.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Fail itu bukan gambar yang sah.'));
    img.src = src;
  });
}

/**
 * Baca fail gambar, kecilkan dan mampatkan menjadi data URL JPEG.
 * @returns {Promise<{dataUrl:string, width:number, height:number, bytes:number, originalBytes:number}>}
 */
export async function compressImageFile(file) {
  if (!file) throw new Error('Tiada fail dipilih.');
  if (file.type && !ACCEPT.includes(file.type)) {
    throw new Error('Format tidak disokong. Guna JPG, PNG, WEBP atau GIF.');
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('Gambar terlalu besar (maksimum 25 MB sebelum dimampatkan).');
  }

  const raw = await readAsDataUrl(file);
  const img = await loadImage(raw);

  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  // Latar putih supaya PNG lutsinar tidak menjadi hitam selepas ditukar ke JPEG.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  // Turunkan kualiti sehingga cukup kecil.
  let out = '';
  for (const q of [0.82, 0.72, 0.62, 0.52, 0.42, 0.34]) {
    out = canvas.toDataURL('image/jpeg', q);
    if (dataUrlBytes(out) <= TARGET_BYTES) break;
  }
  // Masih besar: kecilkan dimensi sekali lagi.
  if (dataUrlBytes(out) > HARD_LIMIT_BYTES && Math.max(w, h) > 600) {
    const s2 = 600 / Math.max(w, h);
    const c2 = document.createElement('canvas');
    c2.width = Math.round(w * s2);
    c2.height = Math.round(h * s2);
    const x2 = c2.getContext('2d');
    x2.fillStyle = '#ffffff';
    x2.fillRect(0, 0, c2.width, c2.height);
    x2.imageSmoothingQuality = 'high';
    x2.drawImage(canvas, 0, 0, c2.width, c2.height);
    out = c2.toDataURL('image/jpeg', 0.62);
  }
  if (dataUrlBytes(out) > HARD_LIMIT_BYTES) {
    throw new Error('Gambar ini terlalu berat walaupun selepas dimampatkan. Cuba gambar yang lebih ringkas.');
  }

  return {
    dataUrl: out,
    width: w,
    height: h,
    bytes: dataUrlBytes(out),
    originalBytes: file.size,
  };
}

// Jumlah saiz semua gambar dalam satu set — amaran sebelum melebihi had Firestore.
export function setImageBytes(questions) {
  return (questions || []).reduce((n, q) => n + (isDataUrl(q.image) ? dataUrlBytes(q.image) : 0), 0);
}
