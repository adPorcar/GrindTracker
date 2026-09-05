import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

const STORAGE_KEY = 'molienda_session_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = async (username, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await api.login(username, password);
      if (res.success && res.user) {
        setUser({
          username: res.user.username,
          user_sheet_id: res.user.user_sheet_id,
          isDemo: Boolean(res.isDemo)
        });
        return { success: true };
      } else {
        const msg = res.message || 'Error al iniciar sesión';
        setAuthError(msg);
        return { success: false, message: msg };
      }
    } catch (err) {
      const msg = err.message || 'Error de conexión con el servidor';
      setAuthError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await api.register(username, password);
      if (res.success && res.user) {
        setUser({
          username: res.user.username,
          user_sheet_id: res.user.user_sheet_id,
          isDemo: Boolean(res.isDemo)
        });
        return { success: true };
      } else {
        const msg = res.message || 'Error al registrar el usuario';
        setAuthError(msg);
        return { success: false, message: msg };
      }
    } catch (err) {
      const msg = err.message || 'Error de conexión con el servidor';
      setAuthError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (newUsername, newPassword) => {
    if (!user) return { success: false, message: 'No hay usuario autenticado' };
    setLoading(true);
    try {
      const res = await api.updateUser(user.username, newUsername, newPassword);
      if (res.success) {
        setUser(prev => ({
          ...prev,
          username: newUsername || prev.username
        }));
        return { success: true };
      } else {
        return { success: false, message: res.message || 'Error al actualizar usuario' };
      }
    } catch (err) {
      return { success: false, message: err.message || 'Error de conexión' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        authError,
        setAuthError,
        login,
        register,
        updateProfile,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
