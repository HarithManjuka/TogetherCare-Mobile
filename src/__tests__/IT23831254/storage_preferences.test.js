// src/__tests__/IT23831254/storage_preferences.test.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getItem, setItem, removeItem, storage } from '../../utils/storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
}));

describe('IT23831254: Storage Preferences & Theme Persistence Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retrieves item using getItem', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('dark');
    const result = await getItem('@togethercare_theme_mode');

    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@togethercare_theme_mode');
    expect(result).toBe('dark');
  });

  it('handles errors gracefully in getItem', async () => {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage failure'));
    const result = await getItem('@togethercare_theme_mode');

    expect(result).toBeNull();
  });

  it('stores string value using setItem', async () => {
    await setItem('@togethercare_theme_mode', 'light');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@togethercare_theme_mode', 'light');
  });

  it('converts non-string values to string in setItem', async () => {
    await setItem('@togethercare_ui_scale', 1.15);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@togethercare_ui_scale', '1.15');
  });

  it('removes item if setItem receives null or undefined', async () => {
    await setItem('@togethercare_ui_scale', null);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@togethercare_ui_scale');

    await setItem('@togethercare_ui_scale', undefined);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@togethercare_ui_scale');
  });

  it('removes item using removeItem', async () => {
    await removeItem('@togethercare_ui_scale');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@togethercare_ui_scale');
  });

  it('provides getItem and setItem on storage object', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('1.30');
    const result = await storage.getItem('@togethercare_ui_scale');
    expect(result).toBe('1.30');

    await storage.setItem('@togethercare_theme_mode', 'dark');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@togethercare_theme_mode', 'dark');
  });
});
