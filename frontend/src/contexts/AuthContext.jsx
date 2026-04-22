import { useState } from 'react';
import { AuthContext } from './auth-context';

function getInitialState() {
  const storedToken = localStorage.getItem('access_token');
  const storedUser = localStorage.getItem('user');

  if (storedToken && storedUser) {
    try {
      return { user: JSON.parse(storedUser), isAuthenticated: true };
    } catch {
      return { user: null, isAuthenticated: false };
    }
  }
  return { user: null, isAuthenticated: false };
}

const initialState = getInitialState();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(initialState.user);
  const [isAuthenticated, setIsAuthenticated] = useState(initialState.isAuthenticated);

  const login = (token, userData) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
