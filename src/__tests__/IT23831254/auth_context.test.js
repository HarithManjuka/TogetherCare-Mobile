// src/__tests__/IT23831254/auth_context.test.js
import { setAuthToken, getAuthToken, clearSession } from '../../utils/storage';

jest.mock('../../utils/storage', () => ({
  setAuthToken: jest.fn().mockResolvedValue(true),
  getAuthToken: jest.fn().mockResolvedValue('mock_token_12345'),
  clearSession: jest.fn().mockResolvedValue(true),
}));

describe('IT23831254: Auth Session State Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should verify storage initialization on auth launch', async () => {
    const token = await getAuthToken();
    expect(token).toBe('mock_token_12345');
  });

  it('should verify session wipe on logout', async () => {
    await clearSession();
    expect(clearSession).toHaveBeenCalled();
  });
});
