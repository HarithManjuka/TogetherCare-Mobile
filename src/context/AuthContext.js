// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import client from '../api/client';
import { storage } from '../utils/storage';
import * as userService from '../services/userService';
import { queryClient } from '../api/queryClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore authenticated session from SecureStore & AsyncStorage on app boot
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await storage.getToken();
        const storedUser = await storage.getUser();

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);

          // Background sync to verify token validity and update stale local data
          try {
            const data = await userService.getProfile();
            if (data?.success && data?.user) {
              setUser(data.user);
              await storage.setUser(data.user);
            }
          } catch (verifyError) {
            if (verifyError.response?.status === 401) {
              await storage.clearSession();
              queryClient.clear();
              setToken(null);
              setUser(null);
            }
          }
        }
      } catch (e) {
        console.error('Session Initialization Error:', e);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
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
    queryClient.clear(); // Clears all cached queries from memory
    setToken(null);
    setUser(null);
  };

  // Refresh profile from MongoDB
  const refreshProfile = useCallback(async () => {
    try {
      const data = await userService.getProfile();
      if (data?.success && data?.user) {
        setUser(data.user);
        await storage.setUser(data.user);
        return data.user;
      }
    } catch (error) {
      console.error('Error refreshing profile in AuthContext:', error.message);
    }
    return null;
  }, []);

  // Update user profile details (Name, Phone, Age, Address, Interests)
  const updateProfile = async (profileData) => {
    const data = await userService.updateProfile(profileData);
    if (data?.success && data?.user) {
      setUser(data.user);
      await storage.setUser(data.user);
      return data.user;
    }
    throw new Error(data?.message || 'Failed to update profile');
  };

  // Upload or replace profile picture on Cloudinary
  const uploadProfilePicture = async (imageAsset) => {
    const data = await userService.uploadProfilePicture(imageAsset);
    if (data?.success && data?.profilePicture) {
      setUser((prev) => ({
        ...(prev || {}),
        profilePicture: data.profilePicture,
      }));
      await refreshProfile();
      return data.profilePicture;
    }
    throw new Error(data?.message || 'Failed to upload image');
  };

  // Delete profile picture from Cloudinary & MongoDB
  const deleteProfilePicture = async () => {
    setUser((prev) => ({
      ...(prev || {}),
      profilePicture: '',
      profilePicturePublicId: '',
    }));

    const data = await userService.deleteProfilePicture();
    await refreshProfile();
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        register,
        login,
        logout,
        refreshProfile,
        updateProfile,
        uploadProfilePicture,
        deleteProfilePicture,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);