// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import client from '../api/client';
import { storage } from '../utils/storage';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Phase 1 Development: Always start on Welcome page when app runs
  useEffect(() => {
    const initSession = async () => {
      try {
        // Clear stored tokens on launch for Phase 1 dev requirement
        await storage.clearSession();
        setToken(null);
        setUser(null);
      } catch (e) {
        console.error('Session Initialization Error:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, []);

  // Register action
  const register = async (registerData) => {
    const response = await client.post('/auth/register', registerData);

    if (response.data?.success) {
      const { token: receivedToken, user: receivedUser } = response.data;
      await storage.setToken(receivedToken);
      await storage.setUser(receivedUser);
      setToken(receivedToken);
      setUser(receivedUser);
      return response.data;
    }
    throw new Error(response.data?.message || 'Registration failed');
  };

  // Login action
  const login = async ({ email, password }) => {
    const response = await client.post('/auth/login', {
      email,
      password,
    });

    if (response.data?.success) {
      const { token: receivedToken, user: receivedUser } = response.data;
      await storage.setToken(receivedToken);
      await storage.setUser(receivedUser);
      setToken(receivedToken);
      setUser(receivedUser);
      return response.data;
    }
    throw new Error(response.data?.message || 'Login failed');
  };

  // Logout action
  const logout = async () => {
    await storage.clearSession();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);