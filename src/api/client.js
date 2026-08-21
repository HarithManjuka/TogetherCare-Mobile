// src/api/client.js
import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const PORT = 5001;

const getBaseURL = () => {
  // Extract the local host machine IP dynamically from Expo runtime
  const debuggerHost = Constants.expoConfig?.hostUri;
  const hostIP = debuggerHost ? debuggerHost.split(':')[0] : null;

  if (hostIP) {
    // Works dynamically for any team member's phone via Expo Go
    return `http://${hostIP}:${PORT}/api`;
  }

  // Fallback for Android Emulators
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${PORT}/api`;
  }

  // Fallback for iOS Simulator and Web Preview
  return `http://localhost:${PORT}/api`;
};

const client = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;