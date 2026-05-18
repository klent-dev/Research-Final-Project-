import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes.jsx';
import AppShell from './components/AppShell.jsx';
import { ReportDraftProvider } from './context/ReportDraftContext.jsx';

export default function App() {
  return (
    <BrowserRouter>
      {/* TODO: Re-enable Firebase authentication after UI is completed */}
      <ReportDraftProvider>
        <AppShell>
          <AppRoutes />
        </AppShell>
      </ReportDraftProvider>
    </BrowserRouter>
  );
}
