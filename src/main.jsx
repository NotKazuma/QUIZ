import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { applyTheme, storedTheme } from './lib/theme.js';
import './styles.css';
import './theme.css'; // tema "Belang" (jenama laman) — menindih styles.css

applyTheme(storedTheme()); // guna tema pilihan sebelum laman dipapar

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
