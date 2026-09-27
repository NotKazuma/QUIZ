// Katalog kedai: haiwan, warna bulu, hiasan avatar dan kuasa. Harga dalam syiling 🪙.
// Barang dengan price 0 ialah percuma (sudah dimiliki semua orang).

export const COIN = '🪙';

// Haiwan asas avatar & warna bulu yang dibenarkan.
export const ANIMALS = [
  { id: 'harimau', name: 'Harimau', price: 0, colors: ['oren', 'putih', 'emas'] },
  { id: 'kucing', name: 'Kucing', price: 0, colors: ['kelabu', 'oren', 'hitam', 'putih'] },
  { id: 'arnab', name: 'Arnab', price: 150, colors: ['putih', 'coklat', 'merah jambu'] },
  { id: 'panda', name: 'Panda', price: 250, colors: ['klasik'] },
  { id: 'burung-hantu', name: 'Burung Hantu', price: 300, colors: ['coklat', 'biru', 'ungu'] },
  { id: 'rubah', name: 'Musang', price: 400, colors: ['oren', 'salji'] },
];

// Warna bulu: [bulu, garis/bayang, perut/muncung]
export const FUR = {
  oren: ['#ff9600', '#e07a00', '#fff7ea'],
  putih: ['#f4f4f4', '#cfcfcf', '#ffffff'],
  emas: ['#ffc800', '#d9a400', '#fff8d6'],
  kelabu: ['#9aa5b1', '#6b7785', '#eef1f4'],
  hitam: ['#3b3b44', '#1f1f24', '#e9e9ee'],
  coklat: ['#a86b3c', '#7a4a25', '#f3e3d3'],
  'merah jambu': ['#ffb3c7', '#e889a3', '#fff0f4'],
  klasik: ['#f7f7f7', '#1f1f24', '#ffffff'],
  biru: ['#5aa9e6', '#3b7fb8', '#e6f3fd'],
  ungu: ['#b48ae6', '#8b62c0', '#f4ecfd'],
  salji: ['#f2f5f8', '#b9c3cc', '#ffffff'],
};

// Hiasan avatar mengikut slot.
export const ITEMS = [
  // topi
  { id: 'songkok', slot: 'hat', name: 'Songkok', price: 0 },
  { id: 'kopiah', slot: 'hat', name: 'Kopiah Putih', price: 60 },
  { id: 'tudung', slot: 'hat', name: 'Tudung', price: 60 },
  { id: 'topi-graduasi', slot: 'hat', name: 'Topi Graduasi', price: 200 },
  { id: 'mahkota', slot: 'hat', name: 'Mahkota', price: 500 },
  { id: 'topi-keledar', slot: 'hat', name: 'Topi Angkasawan', price: 350 },
  // cermin mata
  { id: 'cermin-bulat', slot: 'glasses', name: 'Cermin Bulat', price: 80 },
  { id: 'cermin-hitam', slot: 'glasses', name: 'Cermin Hitam', price: 120 },
  { id: 'cermin-bintang', slot: 'glasses', name: 'Cermin Bintang', price: 180 },
  // baju
  { id: 'baju-melayu', slot: 'outfit', name: 'Baju Melayu', price: 150 },
  { id: 'jersi', slot: 'outfit', name: 'Jersi Sukan', price: 120 },
  { id: 'jubah', slot: 'outfit', name: 'Jubah', price: 180 },
  { id: 'jaket-wira', slot: 'outfit', name: 'Jubah Wira', price: 400 },
  // latar
  { id: 'latar-langit', slot: 'background', name: 'Langit Cerah', price: 0 },
  { id: 'latar-masjid', slot: 'background', name: 'Masjid', price: 150 },
  { id: 'latar-malam', slot: 'background', name: 'Malam Berbintang', price: 200 },
  { id: 'latar-taman', slot: 'background', name: 'Taman', price: 100 },
  { id: 'latar-pelangi', slot: 'background', name: 'Pelangi', price: 300 },
  // bingkai
  { id: 'bingkai-perak', slot: 'frame', name: 'Bingkai Perak', price: 100 },
  { id: 'bingkai-emas', slot: 'frame', name: 'Bingkai Emas', price: 300 },
  { id: 'bingkai-pelangi', slot: 'frame', name: 'Bingkai Pelangi', price: 600 },
];

export const SLOTS = [
  { id: 'animal', label: 'Haiwan', emoji: '🐾' },
  { id: 'color', label: 'Warna', emoji: '🎨' },
  { id: 'hat', label: 'Topi', emoji: '🎩' },
  { id: 'glasses', label: 'Cermin mata', emoji: '🕶️' },
  { id: 'outfit', label: 'Baju', emoji: '👕' },
  { id: 'background', label: 'Latar', emoji: '🖼️' },
  { id: 'frame', label: 'Bingkai', emoji: '⭕' },
];

// Kuasa semasa Cabaran & Perlumbaan.
export const POWERUPS = [
  { id: 'fifty', name: '50:50', emoji: '✂️', price: 40, desc: 'Buang dua jawapan salah' },
  { id: 'time', name: 'Masa +15s', emoji: '⏱️', price: 30, desc: 'Tambah 15 saat untuk soalan ini' },
  { id: 'double', name: 'Mata Ganda', emoji: '✖️', price: 50, desc: 'Mata soalan ini digandakan' },
  { id: 'shield', name: 'Perisai', emoji: '🛡️', price: 60, desc: 'Jika salah, rekod berturut tidak putus' },
  { id: 'skip', name: 'Langkau', emoji: '⏭️', price: 35, desc: 'Langkau soalan tanpa dikira salah' },
];

export const DEFAULT_AVATAR = {
  animal: 'harimau', color: 'oren', hat: 'songkok', glasses: null, outfit: null,
  background: 'latar-langit', frame: null,
};

// Warna tema kad profil.
export const THEME_COLORS = [
  { id: 'hijau', color: '#58cc02' }, { id: 'biru', color: '#1cb0f6' }, { id: 'oren', color: '#ff9600' },
  { id: 'ungu', color: '#ce82ff' }, { id: 'merah', color: '#ff4b4b' }, { id: 'kuning', color: '#ffc800' },
];

export const isFree = id => (ITEMS.find(i => i.id === id)?.price === 0) || (ANIMALS.find(a => a.id === id)?.price === 0);
export const itemById = id => ITEMS.find(i => i.id === id) || ANIMALS.find(a => a.id === id);
