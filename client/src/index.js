/**
 * client/src/index.js
 * 
 * This is the typical entry point for a Create React App or similar React setup.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';  // Tailwind or your global CSS
import App from './App'; 

// Create React root (typical in CRA v5+)
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
