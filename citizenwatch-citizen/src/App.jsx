import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes.jsx';
import AppShell from './components/AppShell.jsx';

export default function App() {
  return (
    <BrowserRouter>
      {/* TODO: Re-enable Firebase authentication after UI is completed */}
      <AppShell>
        <AppRoutes />
      </AppShell>
    </BrowserRouter>
  );
}
