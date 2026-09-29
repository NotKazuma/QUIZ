import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { applyTheme, storedTheme } from './lib/theme.js';
import './styles.css';
import './theme.css'; // tema "Belang" (jenama laman) — menindih styles.css

applyTheme(storedTheme()); // guna tema pilihan sebelum laman dipapar

// Pratonton skrin tunggal semasa pembangunan: ?preview=student atau ?preview=image
// Seluruh blok dibuang daripada binaan produksi (import.meta.env.DEV jadi false).
async function previewNode() {
  if (!import.meta.env.DEV) return null;
  const name = new URLSearchParams(location.search).get('preview');
  const load = {
    student: () => import('./screens/teacher/StudentDetail.preview.jsx'),
    admin: () => import('./screens/admin/AdminUserDetail.preview.jsx'),
    image: () => import('./components/ImageField.preview.jsx'),
  }[name];
  if (!load) return null;
  const m = await load();
  document.getElementById('boot')?.remove(); // App tidak dipasang dalam pratonton
  return <m.default />;
}

async function mount() {
  const node = (await previewNode()) ?? <App />;
  createRoot(document.getElementById('root')).render(<StrictMode>{node}</StrictMode>);
}
mount();
