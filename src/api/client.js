// src/api/client.js
import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { storage } from '../utils/storage';

const DEFAULT_PORT = process.env.EXPO_PUBLIC_API_PORT || 5001;

/**
 * Dynamically resolves the API base URL for physical devices, emulators, Expo Go, CI/CD, and production builds.
 */
const getBaseURL = () => {
  // 1. Explicit production / CI/CD environment variable override
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Dynamic Expo Host IP detection (Expo Go / Physical device over Wi-Fi)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.developer?.tool;
  const hostIP = hostUri ? hostUri.split(':')[0] : null;

  if (hostIP && hostIP !== 'localhost' && hostIP !== '127.0.0.1') {
    return `http://${hostIP}:${DEFAULT_PORT}/api`;
  }

  // 3. Android Emulator loopback IP
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_PORT}/api`;
  }

  // 4. iOS Simulator / Web localhost fallback
  return `http://localhost:${DEFAULT_PORT}/api`;
};

const client = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token if present in AsyncStorage
client.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default client;