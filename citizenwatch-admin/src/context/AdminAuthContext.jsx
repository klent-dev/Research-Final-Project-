import { createContext, useEffect, useMemo, useState } from 'react';
import { listenToAdminAuthChanges } from '../services/adminAuthService.js';

export const AdminAuthContext = createContext({
  admin: null,
  isLoading: true,
  isAuthenticated: false
});

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    return listenToAdminAuthChanges((nextAdmin) => {
      setAdmin(nextAdmin);
      setIsLoading(false);
    });
  }, []);

  const value = useMemo(
    () => ({
      admin,
      isLoading,
      isAuthenticated: Boolean(admin)
    }),
    [admin, isLoading]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

