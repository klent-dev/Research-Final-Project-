import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../components/common/ProtectedRoute.jsx';
import { AppShell } from '../components/layout/AppShell.jsx';
import LoginPage from '../pages/auth/LoginPage.jsx';
import RegisterPage from '../pages/auth/RegisterPage.jsx';
import HomePage from '../pages/HomePage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import CreateReportPage from '../pages/reports/CreateReportPage.jsx';
import MyReportsPage from '../pages/reports/MyReportsPage.jsx';
import ReportDetailsPage from '../pages/reports/ReportDetailsPage.jsx';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/reports" element={<MyReportsPage />} />
          <Route path="/reports/new" element={<CreateReportPage />} />
          <Route path="/reports/:reportId" element={<ReportDetailsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

