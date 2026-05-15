import { Route, Routes } from 'react-router-dom';
import { ProtectedAdminRoute } from '../components/common/ProtectedAdminRoute.jsx';
import { AdminLayout } from '../components/layout/AdminLayout.jsx';
import AnalyticsPage from '../pages/analytics/AnalyticsPage.jsx';
import AdminLoginPage from '../pages/auth/AdminLoginPage.jsx';
import DashboardPage from '../pages/dashboard/DashboardPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import ReportMapPage from '../pages/reports/ReportMapPage.jsx';
import ReportQueuePage from '../pages/reports/ReportQueuePage.jsx';
import ReportReviewPage from '../pages/reports/ReportReviewPage.jsx';
import UserManagementPage from '../pages/users/UserManagementPage.jsx';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLoginPage />} />
      <Route element={<ProtectedAdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/reports" element={<ReportQueuePage />} />
          <Route path="/reports/map" element={<ReportMapPage />} />
          <Route path="/reports/:reportId" element={<ReportReviewPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/users" element={<UserManagementPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

