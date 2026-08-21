// src/api/client.js
import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { storage } from '../utils/storage';

const PORT = 5001;

const getBaseURL = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const debuggerHost = Constants.expoConfig?.hostUri;
  const hostIP = debuggerHost ? debuggerHost.split(':')[0] : null;

  if (hostIP) {
    return `http://${hostIP}:${PORT}/api`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${PORT}/api`;
  }

  return `http://localhost:${PORT}/api`;
};

const client = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
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