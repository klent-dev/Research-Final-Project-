import React from 'react';
import ReactDOM from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './styles/global.css';
import App from './App.jsx';
import { isFirebaseConfigured } from './firebase/config.js';
import { clearReports } from './services/localReportService.js';

if (isFirebaseConfigured) {
  clearReports();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
