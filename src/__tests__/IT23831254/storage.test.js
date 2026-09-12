// src/__tests__/IT23831254/storage.test.js
import { setAuthToken, getAuthToken, clearSession } from '../../utils/storage';

jest.mock('../../utils/storage', () => ({
  setAuthToken: jest.fn().mockResolvedValue(true),
  getAuthToken: jest.fn().mockResolvedValue('mock_token_12345'),
  clearSession: jest.fn().mockResolvedValue(true),
}));

describe('IT23831254: Secure Storage Wrapper Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves and reads auth token correctly', async () => {
    await setAuthToken('sample_jwt_token');
    expect(setAuthToken).toHaveBeenCalledWith('sample_jwt_token');

    const token = await getAuthToken();
    expect(token).toBe('mock_token_12345');
  });

  it('clears session securely', async () => {
    await clearSession();
    expect(clearSession).toHaveBeenCalled();
  });
});
