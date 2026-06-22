import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ArtinosStudio from './ArtinosStudio';
import './studio.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ArtinosStudio />
  </StrictMode>,
);
