// src/__tests__/IT23831254/theme_context.test.js
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
}));

describe('IT23831254: ThemeContext Functional & Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes ThemeContext and loads stored theme and scale preferences without throwing', async () => {
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === '@togethercare_theme_mode') return Promise.resolve('dark');
      if (key === '@togethercare_ui_scale') return Promise.resolve('1.15');
      return Promise.resolve(null);
    });

    const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
    const { result } = renderHook(() => useTheme(), { wrapper });

    // Allow loadPreferences effect to resolve
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isDarkMode).toBe(true);
    expect(result.current.isDark).toBe(true);
    expect(result.current.uiScale).toBe(1.15);
    expect(result.current.scale).toBe(1.15);
    expect(result.current.isLarge).toBe(true);
    expect(result.current.colors).toBeDefined();
  });

  it('cycles UI scale and persists preference to storage', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);

    const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
    const { result } = renderHook(() => useTheme(), { wrapper });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.uiScale).toBe(1.0);

    // Cycle from 1.0 to 1.15
    await act(async () => {
      await result.current.cycleUiScale();
    });

    expect(result.current.uiScale).toBe(1.15);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@togethercare_ui_scale', '1.15');

    // Cycle from 1.15 to 1.30
    await act(async () => {
      await result.current.cycleUiScale();
    });

    expect(result.current.uiScale).toBe(1.30);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@togethercare_ui_scale', '1.3');

    // Cycle from 1.30 back to 1.0
    await act(async () => {
      await result.current.cycleUiScale();
    });

    expect(result.current.uiScale).toBe(1.0);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@togethercare_ui_scale', '1');
  });

  it('toggles dark mode and persists preference to storage', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);

    const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
    const { result } = renderHook(() => useTheme(), { wrapper });

    await act(async () => {
      await Promise.resolve();
    });

    const initialMode = result.current.isDarkMode;

    await act(async () => {
      await result.current.toggleTheme();
    });

    expect(result.current.isDarkMode).toBe(!initialMode);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@togethercare_theme_mode',
      !initialMode ? 'dark' : 'light'
    );
  });
});
