import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const container = document.getElementById('app') || document.getElementById('root') || document.body.appendChild(document.createElement('div'));
createRoot(container).render(<App />);
