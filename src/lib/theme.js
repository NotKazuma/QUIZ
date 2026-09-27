// Tema laman: 'auto' (ikut peranti), 'light' atau 'dark'. Disimpan dalam peranti & tetapan profil.
const KEY = 'kuiz.theme';

export function storedTheme() {
  try { return localStorage.getItem(KEY) || 'auto'; } catch { return 'auto'; }
}

export function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === 'light' || mode === 'dark') root.dataset.theme = mode;
  else delete root.dataset.theme;
  try { localStorage.setItem(KEY, mode || 'auto'); } catch { /* abaikan */ }
}
