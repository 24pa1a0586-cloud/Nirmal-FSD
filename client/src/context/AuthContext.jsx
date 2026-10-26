import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, setStoredToken, removeStoredToken, getStoredToken } from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check current session on app mount
  const checkAuth = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/api/auth/me');
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
        removeStoredToken();
      }
    } catch (err) {
      // If 401 Unauthorized or network error, session is unauthenticated
      setUser(null);
      if (err.status === 401) {
        removeStoredToken();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Login handler
  const login = async (emailOrUsername, password) => {
    setAuthError(null);
    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ emailOrUsername, password }),
      });

      if (!data.success) {
        throw new Error(data.message || 'Login failed.');
      }

      if (data.token) {
        setStoredToken(data.token);
      }
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, message: err.message };
    }
  };

  // Register handler
  const register = async (userData) => {
    setAuthError(null);
    try {
      const data = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (!data.success) {
        throw new Error(data.message || 'Registration failed.');
      }

      if (data.token) {
        setStoredToken(data.token);
      }
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, message: err.message };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout API error:', err.message);
    } finally {
      removeStoredToken();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
