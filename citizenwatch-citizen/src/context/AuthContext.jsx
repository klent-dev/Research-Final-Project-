import { useEffect, useMemo, useState } from 'react';
import { listenToAuthChanges } from '../services/authService.js';
import { AuthContext } from './authContext.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      return listenToAuthChanges((nextUser) => {
        setUser(nextUser);
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Auth listener failed:', error);
      setIsLoading(false);
      return undefined;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user)
    }),
    [isLoading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
