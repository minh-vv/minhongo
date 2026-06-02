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

  // Authentication Modal States
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register' | 'forgot-password'

  const login = (token, userData) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    setAuthModalOpen(false); // Auto close modal on successful login
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  /** Cập nhật user data trong state và localStorage (dùng sau khi update profile) */
  const updateUser = (userData) => {
    const merged = { ...user, ...userData };
    localStorage.setItem('user', JSON.stringify(merged));
    setUser(merged);
  };

  const openLogin = () => {
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const openRegister = () => {
    setAuthModalMode('register');
    setAuthModalOpen(true);
  };

  const openForgotPassword = () => {
    setAuthModalMode('forgot-password');
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        updateUser,
        authModalOpen,
        authModalMode,
        setAuthModalMode,
        openLogin,
        openRegister,
        openForgotPassword,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

