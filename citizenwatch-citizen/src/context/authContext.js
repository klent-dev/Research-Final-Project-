import { createContext } from 'react';

export const AuthContext = createContext({
  user: null,
  isLoading: true,
  isAuthenticated: false
});
