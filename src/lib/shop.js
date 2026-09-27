// Katalog kedai: haiwan, warna bulu, hiasan avatar dan kuasa. Harga dalam syiling 🪙.
// Setiap barang ada kelas kelangkaan: biasa → jarang → epik → legenda.
// `kind` = bentuk yang dilukis (lihat AnimalAvatar.jsx); `color` = warna varian.

export const COIN = '🪙';

export const RARITY = {
  biasa: { label: 'Biasa', color: '#8e9aa6', order: 0 },
  jarang: { label: 'Jarang', color: '#1cb0f6', order: 1 },
  epik: { label: 'Epik', color: '#ce82ff', order: 2 },
  legenda: { label: 'Legenda', color: '#ffb000', order: 3 },
};
export const RARITY_ORDER = ['biasa', 'jarang', 'epik', 'legenda'];

// Haiwan asas avatar & warna bulu yang dibenarkan.
export const ANIMALS = [
  { id: 'harimau', name: 'Harimau', price: 0, rarity: 'biasa', colors: ['oren', 'putih', 'emas'] },
  { id: 'kucing', name: 'Kucing', price: 0, rarity: 'biasa', colors: ['kelabu', 'oren', 'hitam', 'putih'] },
  { id: 'anjing', name: 'Anjing', price: 120, rarity: 'biasa', colors: ['coklat', 'putih', 'hitam'] },
  { id: 'arnab', name: 'Arnab', price: 180, rarity: 'jarang', colors: ['putih', 'coklat', 'merah jambu'] },
  { id: 'beruang', name: 'Beruang', price: 220, rarity: 'jarang', colors: ['coklat', 'putih', 'hitam'] },
  { id: 'rubah', name: 'Musang', price: 350, rarity: 'jarang', colors: ['oren', 'salji'] },
  { id: 'panda', name: 'Panda', price: 500, rarity: 'epik', colors: ['klasik'] },
  { id: 'burung-hantu', name: 'Burung Hantu', price: 550, rarity: 'epik', colors: ['coklat', 'biru', 'ungu'] },
  { id: 'singa', name: 'Singa', price: 1500, rarity: 'legenda', colors: ['emas', 'oren', 'putih'] },
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

const I = (id, slot, name, rarity, price, kind, color) => ({ id, slot, name, rarity, price, kind: kind || id, color });

export const ITEMS = [
  // ---- topi
  I('songkok', 'hat', 'Songkok', 'biasa', 0),
  I('kopiah', 'hat', 'Kopiah Putih', 'biasa', 50),
  I('tudung', 'hat', 'Tudung Ungu', 'biasa', 50, 'tudung', '#ce82ff'),
  I('tudung-biru', 'hat', 'Tudung Biru', 'biasa', 50, 'tudung', '#1cb0f6'),
  I('tudung-pink', 'hat', 'Tudung Merah Jambu', 'jarang', 150, 'tudung', '#ff7eb6'),
  I('cap-merah', 'hat', 'Topi Sukan Merah', 'biasa', 60, 'cap', '#ff4b4b'),
  I('cap-hijau', 'hat', 'Topi Sukan Hijau', 'biasa', 60, 'cap', '#58cc02'),
  I('topi-graduasi', 'hat', 'Topi Graduasi', 'jarang', 200),
  I('topi-chef', 'hat', 'Topi Chef', 'jarang', 220),
  I('fon-kepala', 'hat', 'Fon Kepala', 'epik', 450),
  I('topi-keledar', 'hat', 'Topi Angkasawan', 'epik', 600),
  I('songkok-emas', 'hat', 'Songkok Emas', 'epik', 650, 'songkok', '#ffc800'),
  I('mahkota', 'hat', 'Mahkota', 'legenda', 1500),
  I('mahkota-permata', 'hat', 'Mahkota Permata', 'legenda', 2500, 'mahkota', '#ce82ff'),

  // ---- cermin mata
  I('cermin-bulat', 'glasses', 'Cermin Bulat', 'biasa', 60),
  I('cermin-hitam', 'glasses', 'Cermin Hitam', 'jarang', 150),
  I('cermin-bintang', 'glasses', 'Cermin Bintang', 'jarang', 180),
  I('cermin-hati', 'glasses', 'Cermin Hati', 'epik', 420),
  I('cermin-emas', 'glasses', 'Cermin Emas', 'epik', 500, 'cermin-bulat', '#ffc800'),
  I('topeng-wira', 'glasses', 'Topeng Wira', 'legenda', 1200),

  // ---- baju
  I('baju-melayu', 'outfit', 'Baju Melayu Biru', 'biasa', 80, 'baju-melayu', '#1cb0f6'),
  I('baju-melayu-hijau', 'outfit', 'Baju Melayu Hijau', 'biasa', 80, 'baju-melayu', '#58cc02'),
  I('baju-melayu-ungu', 'outfit', 'Baju Melayu Ungu', 'jarang', 200, 'baju-melayu', '#a568cc'),
  I('jersi', 'outfit', 'Jersi Hijau', 'biasa', 70, 'jersi', '#58cc02'),
  I('jersi-merah', 'outfit', 'Jersi Merah', 'biasa', 70, 'jersi', '#ff4b4b'),
  I('hoodie', 'outfit', 'Hoodie Kuning', 'jarang', 220, 'hoodie', '#ffc800'),
  I('jubah', 'outfit', 'Jubah Putih', 'jarang', 240),
  I('baju-angkasawan', 'outfit', 'Baju Angkasawan', 'epik', 650),
  I('jaket-wira', 'outfit', 'Jubah Wira', 'epik', 700),
  I('jubah-diraja', 'outfit', 'Jubah Diraja', 'legenda', 2000),

  // ---- kasut (dilihat pada avatar badan penuh)
  I('selipar', 'shoes', 'Selipar', 'biasa', 40),
  I('kasut-sekolah', 'shoes', 'Kasut Sekolah', 'biasa', 60, 'kasut', '#ffffff'),
  I('kasut-sukan', 'shoes', 'Kasut Sukan Merah', 'biasa', 80, 'kasut', '#ff4b4b'),
  I('but-biru', 'shoes', 'But Biru', 'jarang', 200, 'but', '#1cb0f6'),
  I('kasut-roket', 'shoes', 'Kasut Roket', 'epik', 650),
  I('kasut-emas', 'shoes', 'Kasut Emas', 'legenda', 1400, 'kasut', '#ffc800'),

  // ---- barang dipegang
  I('buku', 'hand', 'Buku', 'biasa', 40),
  I('pensel', 'hand', 'Pensel', 'biasa', 40),
  I('belon', 'hand', 'Belon', 'biasa', 60),
  I('tasbih', 'hand', 'Tasbih', 'jarang', 180),
  I('bendera', 'hand', 'Bendera', 'jarang', 200),
  I('piala', 'hand', 'Piala', 'epik', 550),
  I('tongkat-sakti', 'hand', 'Tongkat Sakti', 'epik', 650),
  I('obor', 'hand', 'Obor Juara', 'legenda', 1600),

  // ---- latar
  I('latar-langit', 'background', 'Langit Cerah', 'biasa', 0),
  I('latar-taman', 'background', 'Taman', 'biasa', 60),
  I('latar-pantai', 'background', 'Pantai', 'jarang', 150),
  I('latar-gunung', 'background', 'Gunung', 'jarang', 170),
  I('latar-masjid', 'background', 'Masjid Senja', 'jarang', 200),
  I('latar-malam', 'background', 'Malam Berbintang', 'epik', 400),
  I('latar-laut', 'background', 'Bawah Laut', 'epik', 450),
  I('latar-pelangi', 'background', 'Pelangi', 'epik', 500),
  I('latar-angkasa', 'background', 'Angkasa Lepas', 'legenda', 1300),
  I('latar-istana', 'background', 'Istana Emas', 'legenda', 1800),

  // ---- bingkai
  I('bingkai-perak', 'frame', 'Bingkai Perak', 'jarang', 150),
  I('bingkai-bunga', 'frame', 'Bingkai Bunga', 'jarang', 200),
  I('bingkai-emas', 'frame', 'Bingkai Emas', 'epik', 450),
  I('bingkai-bintang', 'frame', 'Bingkai Bintang', 'epik', 550),
  I('bingkai-pelangi', 'frame', 'Bingkai Pelangi', 'legenda', 1200),
  I('bingkai-api', 'frame', 'Bingkai Api', 'legenda', 1500),

  // ---- tema kad profil (kind = kelas CSS ct-<kind>, color = warna asas & bayang)
  I('tema-oren', 'card', 'Oren', 'biasa', 0, 'solid', '#ff9600'),
  I('tema-hijau', 'card', 'Hijau', 'biasa', 0, 'solid', '#58cc02'),
  I('tema-biru', 'card', 'Biru', 'biasa', 0, 'solid', '#1cb0f6'),
  I('tema-ungu', 'card', 'Ungu', 'biasa', 0, 'solid', '#ce82ff'),
  I('tema-merah', 'card', 'Merah', 'biasa', 0, 'solid', '#ff4b4b'),
  I('tema-kuning', 'card', 'Kuning', 'biasa', 0, 'solid', '#ffc800'),
  I('tema-merah-jambu', 'card', 'Merah Jambu', 'biasa', 60, 'solid', '#ff7eb6'),
  I('tema-malam', 'card', 'Biru Malam', 'biasa', 60, 'solid', '#2f5d9e'),
  I('tema-senja', 'card', 'Senja', 'jarang', 180, 'senja', '#ff6f61'),
  I('tema-lautan', 'card', 'Lautan', 'jarang', 180, 'lautan', '#119fc4'),
  I('tema-hutan', 'card', 'Hutan', 'jarang', 200, 'hutan', '#3f9b2f'),
  I('tema-gula', 'card', 'Gula-gula', 'jarang', 220, 'gula', '#d77be8'),
  I('tema-aurora', 'card', 'Aurora', 'epik', 550, 'aurora', '#2f8fc9'),
  I('tema-neon', 'card', 'Neon', 'epik', 600, 'neon', '#2a1454'),
  I('tema-pelangi', 'card', 'Pelangi', 'epik', 700, 'pelangi', '#ff7a45'),
  I('tema-galaksi', 'card', 'Galaksi', 'legenda', 1500, 'galaksi', '#231552'),
  I('tema-api', 'card', 'Api Juara', 'legenda', 1800, 'api', '#e64a19'),
  I('tema-emas', 'card', 'Emas Diraja', 'legenda', 2200, 'emas', '#c99400'),
];

export const SLOTS = [
  { id: 'animal', label: 'Haiwan', emoji: '🐾' },
  { id: 'color', label: 'Warna', emoji: '🎨' },
  { id: 'hat', label: 'Topi', emoji: '🎩' },
  { id: 'glasses', label: 'Cermin mata', emoji: '🕶️' },
  { id: 'outfit', label: 'Baju', emoji: '👕' },
  { id: 'shoes', label: 'Kasut', emoji: '👟' },
  { id: 'hand', label: 'Pegang', emoji: '🎈' },
  { id: 'background', label: 'Latar', emoji: '🖼️' },
  { id: 'frame', label: 'Bingkai', emoji: '⭕' },
  { id: 'card', label: 'Tema kad', emoji: '🪪' },
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
  shoes: null, hand: null, background: 'latar-langit', frame: null, card: 'tema-oren',
};

// Warna tema kad profil.
export const THEME_COLORS = [
  { id: 'hijau', color: '#58cc02' }, { id: 'biru', color: '#1cb0f6' }, { id: 'oren', color: '#ff9600' },
  { id: 'ungu', color: '#ce82ff' }, { id: 'merah', color: '#ff4b4b' }, { id: 'kuning', color: '#ffc800' },
];

export const itemById = id => ITEMS.find(i => i.id === id) || ANIMALS.find(a => a.id === id);

// Tema kad profil yang dipakai (warna lama dalam prefs.theme dipetakan ke tema percuma).
export function cardTheme(avatar, legacyTheme) {
  return itemById(avatar?.card) || itemById('tema-' + (legacyTheme || 'oren')) || itemById('tema-oren');
}
export const cardProps = (item, base = '') => ({
  className: `${base} ct ct-${item.kind} ct-${item.rarity}`,
  style: { '--pc': item.color },
});

// Susun ikut kelangkaan (biasa dahulu), kemudian harga.
export const byRarity = (a, b) => RARITY[a.rarity].order - RARITY[b.rarity].order || a.price - b.price;
