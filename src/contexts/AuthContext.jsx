import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  login as apiLogin,
  register as apiRegister,
  getCurrentUser
} from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ===============================
  // INIT AUTH ON APP START
  // ===============================
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        setToken(storedToken);

        const userData = await getCurrentUser(storedToken);

        console.log('✅ User loaded:', userData);

        setUser(userData);
      } catch (error) {
        console.error('❌ Auth init failed:', error);

        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // ===============================
  // LOGIN
  // ===============================
  const login = async (email, password) => {
    setIsLoading(true);

    try {
      const response = await apiLogin(email, password);

      localStorage.setItem('token', response.access_token);
      setToken(response.access_token);

      const userData = await getCurrentUser(response.access_token);

      console.log('✅ Login user:', userData);

      setUser(userData);

      return response;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ===============================
  // REGISTER
  // ===============================
  const register = async (data) => {
    try {
      const response = await apiRegister(data);

      console.log('✅ Registration successful:', response);

      return response;
    } catch (error) {
      console.error('❌ Register failed:', error);
      throw error;
    }
  };

  // ===============================
  // LOGOUT
  // ===============================
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // ===============================
  // UPDATE USER
  // ===============================
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};