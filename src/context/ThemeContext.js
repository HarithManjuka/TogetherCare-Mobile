// src/context/ThemeContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, getScaledSizes } from '../constants/theme';

const SIZE_MODE_KEY = '@togethercare_size_mode';

const ThemeContext = createContext({});

export const ThemeProvider = ({ children }) => {
  const [sizeMode, setSizeModeState] = useState('standard'); // 'standard' | 'large'
  const [isLoadingSize, setIsLoadingSize] = useState(true);

  // Load persisted size preference on app launch
  useEffect(() => {
    const loadStoredSizeMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(SIZE_MODE_KEY);
        if (savedMode === 'large' || savedMode === 'standard') {
          setSizeModeState(savedMode);
        }
      } catch (e) {
        console.log('Error loading size mode from storage:', e.message);
      } finally {
        setIsLoadingSize(false);
      }
    };

    loadStoredSizeMode();
  }, []);

  // Toggle or explicitly set size mode
  const setSizeMode = async (mode) => {
    const targetMode = mode === 'large' ? 'large' : 'standard';
    setSizeModeState(targetMode);
    try {
      await AsyncStorage.setItem(SIZE_MODE_KEY, targetMode);
    } catch (e) {
      console.log('Error saving size mode:', e.message);
    }
  };

  const toggleSizeMode = async () => {
    const nextMode = sizeMode === 'large' ? 'standard' : 'large';
    await setSizeMode(nextMode);
  };

  // Scale multiplier: 1.0 for Standard, 1.25 for Large (Senior-friendly)
  const scale = sizeMode === 'large' ? 1.25 : 1.0;
  const sizes = getScaledSizes(scale);

  return (
    <ThemeContext.Provider
      value={{
        sizeMode,
        isLarge: sizeMode === 'large',
        scale,
        sizes,
        colors: COLORS,
        setSizeMode,
        toggleSizeMode,
        isLoadingSize,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
