import React from 'react';
import ReactDOM from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './styles/theme.css';
import './styles/index.css';
import App from './App.jsx';
import { clearLocalReportsForFirebaseTest } from './services/adminReportService.js';

clearLocalReportsForFirebaseTest();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
