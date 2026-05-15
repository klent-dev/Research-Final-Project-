import { useContext } from 'react';
import { AdminAuthContext } from '../context/AdminAuthContext.jsx';

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

