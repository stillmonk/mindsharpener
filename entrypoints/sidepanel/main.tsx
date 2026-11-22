import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../popup/App';
import '@/assets/style.css';

// El panel lateral es el mismo popup, a lo ancho y siempre abierto.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App panel />
  </React.StrictMode>,
);
