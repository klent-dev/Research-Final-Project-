import { Navigate, Route, Routes } from 'react-router-dom';
import Home from '../pages/Home.jsx';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import SubmitReport from '../pages/SubmitReport.jsx';
import PlaceholderPage from '../pages/PlaceholderPage.jsx';
import ProfilePage from '../pages/profile/ProfilePage.jsx';
import CreateReportPage from '../pages/reports/CreateReportPage.jsx';
import CreateReportLocationPage from '../pages/reports/CreateReportLocationPage.jsx';
import CreateReportDetailsPage from '../pages/reports/CreateReportDetailsPage.jsx';
import CreateReportSuccessPage from '../pages/reports/CreateReportSuccessPage.jsx';
import ReportsPage from '../pages/reports/ReportsPage.jsx';
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
        <Route path="/dashboard" element={<Home />} />
        <Route path="/submit-report" element={<SubmitReport />} />
        <Route path="/reports/create" element={<CreateReportPage />} />
        <Route path="/reports/create/location" element={<CreateReportLocationPage />} />
        <Route path="/reports/create/details" element={<CreateReportDetailsPage />} />
        <Route path="/reports/create/success" element={<CreateReportSuccessPage />} />
        <Route path="/reports/create/review" element={<PlaceholderPage title="Review Report" description="Step 4 review placeholder for the guided report flow." />} />
        <Route path="/my-reports" element={<ReportsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<PlaceholderPage title="Edit Profile" description="Profile editing form placeholder." />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
