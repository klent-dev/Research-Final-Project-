import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ReportDraftProvider } from './context/ReportDraftContext.jsx';
import { AppRoutes } from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ReportDraftProvider>
          <AppRoutes />
        </ReportDraftProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

