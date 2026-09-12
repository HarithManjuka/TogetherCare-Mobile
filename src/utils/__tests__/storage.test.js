// src/utils/__tests__/storage.test.js
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

const mockStore = {};
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn((key, value) => {
    mockStore[key] = value;
    return Promise.resolve();
  }),
  getItemAsync: jest.fn((key) => {
    return Promise.resolve(mockStore[key] || null);
  }),
  deleteItemAsync: jest.fn((key) => {
    delete mockStore[key];
    return Promise.resolve();
  }),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
}));

import { storage } from '../storage';

describe('Secure Storage Wrapper Unit Tests', () => {
  beforeEach(async () => {
    await storage.clearSession();
  });

  it('saves and reads auth token correctly', async () => {
    const testToken = 'mock-jwt-token-xyz';
    await storage.setToken(testToken);
    const token = await storage.getToken();
    expect(token).toBe(testToken);
  });

  it('clears session securely', async () => {
    await storage.setToken('token-to-delete');
    await storage.clearSession();
    const token = await storage.getToken();
    expect(token).toBeNull();
  });
});

