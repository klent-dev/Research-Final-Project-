import { Navigate, Route, Routes } from 'react-router-dom';
import Home from '../pages/Home.jsx';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import ProfilePage from '../pages/profile/ProfilePage.jsx';
import CreateReportPage from '../pages/reports/CreateReportPage.jsx';
import CreateReportLocationPage from '../pages/reports/CreateReportLocationPage.jsx';
import CreateReportDetailsPage from '../pages/reports/CreateReportDetailsPage.jsx';
import CreateReportSuccessPage from '../pages/reports/CreateReportSuccessPage.jsx';
import ReportsPage from '../pages/reports/ReportsPage.jsx';
import ReportDetailsPage from '../pages/reports/ReportDetailsPage.jsx';
import AlertsPage from '../pages/alerts/AlertsPage.jsx';
import MapPage from '../pages/map/MapPage.jsx';
import { ProtectedRoute } from '../components/common/ProtectedRoute.jsx';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<Home />} />
        <Route path="/dashboard" element={<Navigate to="/home" replace />} />
        <Route path="/submit-report" element={<Navigate to="/reports/create" replace />} />
        <Route path="/reports/create" element={<CreateReportPage />} />
        <Route path="/reports/create/location" element={<CreateReportLocationPage />} />
        <Route path="/reports/create/details" element={<CreateReportDetailsPage />} />
        <Route path="/reports/create/success" element={<CreateReportSuccessPage />} />
        <Route path="/reports/create/review" element={<Navigate to="/reports/create/details" replace />} />
        <Route path="/my-reports" element={<Navigate to="/reports" replace />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/:id" element={<ReportDetailsPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
