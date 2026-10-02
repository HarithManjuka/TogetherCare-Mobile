// src/utils/storage.js
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = 'togethercare_jwt_token';
const USER_KEY = '@togethercare_user_data';

const isWeb = Platform.OS === 'web';

// Store authentication token in hardware-encrypted storage
export const setToken = async (token) => {
  try {
    if (!token) {
      await clearSession();
      return;
    }
    if (isWeb) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    }
  } catch (e) {
    console.error('Storage Error - setToken:', e);
  }
};

// Retrieve authentication token from secure storage
export const getToken = async () => {
  try {
    if (isWeb) {
      return await AsyncStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (e) {
    console.error('Storage Error - getToken:', e);
    return null;
  }
};

// Store user profile object in AsyncStorage
export const setUser = async (user) => {
  try {
    if (!user) {
      await AsyncStorage.removeItem(USER_KEY);
      return;
    }
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Storage Error - setUser:', e);
  }
};

// Retrieve user profile object
export const getUser = async () => {
  try {
    const data = await AsyncStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Storage Error - getUser:', e);
    return null;
  }
};

// Clear session on logout or unauthorized responses
export const clearSession = async () => {
  try {
    if (isWeb) {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    } else {
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {}),
        AsyncStorage.removeItem(USER_KEY).catch(() => {}),
      ]);
    }
  } catch (e) {
    console.error('Storage Error - clearSession:', e);
  }
};

// Generic AsyncStorage helpers for non-sensitive data (e.g., theme preferences, UI scale)
export const getItem = async (key) => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    console.error('Storage Error - getItem:', e);
    return null;
  }
};

export const setItem = async (key, value) => {
  try {
    if (value === null || value === undefined) {
      await AsyncStorage.removeItem(key);
      return;
    }
    const stringValue = typeof value === 'string' ? value : String(value);
    await AsyncStorage.setItem(key, stringValue);
  } catch (e) {
    console.error('Storage Error - setItem:', e);
  }
};

export const removeItem = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error('Storage Error - removeItem:', e);
  }
};

// Backwards-compatibility aliases for authentication token helpers
export const setAuthToken = setToken;
export const getAuthToken = getToken;

export const storage = {
  setToken,
  getToken,
  setUser,
  getUser,
  clearSession,
  getItem,
  setItem,
  removeItem,
  setAuthToken,
  getAuthToken,
};

export default storage;