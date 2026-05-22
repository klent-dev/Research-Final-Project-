import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes.jsx';
import AppShell from './components/AppShell.jsx';
import { ReportDraftProvider } from './context/ReportDraftContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ReportDraftProvider>
          <AppShell>
            <AppRoutes />
          </AppShell>
        </ReportDraftProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
