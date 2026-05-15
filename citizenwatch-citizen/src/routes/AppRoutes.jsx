import { Navigate, Route, Routes } from 'react-router-dom';
import Home from '../pages/Home.jsx';
import Login from '../pages/Login.jsx';
import MyReports from '../pages/MyReports.jsx';
import Register from '../pages/Register.jsx';
import SubmitReport from '../pages/SubmitReport.jsx';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/home" element={<Home />} />
      <Route path="/submit-report" element={<SubmitReport />} />
      <Route path="/my-reports" element={<MyReports />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
