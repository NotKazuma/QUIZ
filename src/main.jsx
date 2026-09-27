import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './theme.css'; // tema "Belang" (jenama laman) — menindih styles.css

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
