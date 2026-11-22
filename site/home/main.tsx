import React from 'react';
import ReactDOM from 'react-dom/client';
import '../demo/install';
import '../styles/site.css';
import { Home } from './Home';
import './home.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>,
);
