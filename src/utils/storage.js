// src/utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@togethercare_jwt_token';
const USER_KEY = '@togethercare_user_data';

export const storage = {
  // Store authentication token
  async setToken(token) {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error('Storage Error - setToken:', e);
    }
  },

  // Retrieve authentication token
  async getToken() {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (e) {
      console.error('Storage Error - getToken:', e);
      return null;
    }
  },

  // Store user profile object
  async setUser(user) {
    try {
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

  // Clear session on logout
  async clearSession() {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    } catch (e) {
      console.error('Storage Error - clearSession:', e);
    }
  },
};