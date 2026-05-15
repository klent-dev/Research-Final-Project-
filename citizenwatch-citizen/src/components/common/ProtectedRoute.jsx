import { Navigate, Outlet } from 'react-router-dom';
import { LoadingScreen } from './LoadingScreen.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}

