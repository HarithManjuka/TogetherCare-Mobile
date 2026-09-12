// src/utils/storage.js
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = 'togethercare_jwt_token';
const USER_KEY = '@togethercare_user_data';

const isWeb = Platform.OS === 'web';

export const storage = {
  // Store authentication token in hardware-encrypted storage
  async setToken(token) {
    try {
      if (!token) {
        await this.clearSession();
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
  },

  // Retrieve authentication token from secure storage
  async getToken() {
    try {
      if (isWeb) {
        return await AsyncStorage.getItem(TOKEN_KEY);
      }
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      console.error('Storage Error - getToken:', e);
      return null;
    }
  },

  // Store user profile object in AsyncStorage
  async setUser(user) {
    try {
      if (!user) {
        await AsyncStorage.removeItem(USER_KEY);
        return;
      }
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Storage Error - setUser:', e);
    }
  },

  // Retrieve user profile object
  async getUser() {
    try {
      const data = await AsyncStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Storage Error - getUser:', e);
      return null;
    }
  },

  // Clear session on logout or unauthorized responses
  async clearSession() {
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
  },
};