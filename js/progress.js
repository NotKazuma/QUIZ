// Simpan & kira kemajuan (akan dilengkapkan pada Fasa 3).
// Semua akses localStorage dibalut try/catch kerana ia boleh gagal
// (mod peribadi, storan penuh, dsb.).

function safeGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}
