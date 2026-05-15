import { Navigate, Outlet } from 'react-router-dom';
import { LoadingScreen } from './LoadingScreen.jsx';
import { useAdminAuth } from '../../hooks/useAdminAuth.js';

export function ProtectedAdminRoute() {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}

