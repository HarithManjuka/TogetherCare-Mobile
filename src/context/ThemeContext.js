// src/context/ThemeContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, getScaledSizes } from '../constants/theme';

const SIZE_MODE_KEY = '@togethercare_size_mode';
const LANGUAGE_KEY = '@togethercare_language';

export const AVAILABLE_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', icon: 'globe-outline' },
  { code: 'si', label: 'Sinhala', native: 'සිංහල', icon: 'language-outline' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', icon: 'language-outline' },
];

export const AVAILABLE_DISPLAY_SIZES = [
  { code: 'standard', label: 'Standard', sublabel: '100% Regular scale' },
  { code: 'large', label: 'Large', sublabel: '125% Senior-friendly' },
  { code: 'xlarge', label: 'Extra Large', sublabel: '140% High visibility' },
];

const ThemeContext = createContext({});

export const ThemeProvider = ({ children }) => {
  const [sizeMode, setSizeModeState] = useState('standard'); // 'standard' | 'large' | 'xlarge'
  const [language, setLanguageState] = useState('English');
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);

  // Load persisted preferences on app launch
  useEffect(() => {
    const loadStoredPreferences = async () => {
      try {
        const [savedMode, savedLanguage] = await Promise.all([
          AsyncStorage.getItem(SIZE_MODE_KEY),
          AsyncStorage.getItem(LANGUAGE_KEY),
        ]);
        if (savedMode === 'large' || savedMode === 'standard' || savedMode === 'xlarge') {
          setSizeModeState(savedMode);
        }
        if (savedLanguage) {
          setLanguageState(savedLanguage);
        }
      } catch (e) {
        console.log('Error loading preferences from storage:', e.message);
      } finally {
        setIsLoadingPreferences(false);
      }
    };

    loadStoredPreferences();
  }, []);

  // Toggle or explicitly set size mode
  const setSizeMode = async (mode) => {
    const targetMode = mode === 'xlarge' ? 'xlarge' : mode === 'large' ? 'large' : 'standard';
    setSizeModeState(targetMode);
    try {
      await AsyncStorage.setItem(SIZE_MODE_KEY, targetMode);
    } catch (e) {
      console.log('Error saving size mode:', e.message);
    }
  };

  const toggleSizeMode = async () => {
    const nextMode = sizeMode === 'large' || sizeMode === 'xlarge' ? 'standard' : 'large';
    await setSizeMode(nextMode);
  };

  // Set Language
  const setLanguage = async (newLang) => {
    setLanguageState(newLang);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, newLang);
    } catch (e) {
      console.log('Error saving language:', e.message);
    }
  };

  // Scale multiplier: 1.0 for Standard, 1.25 for Large, 1.4 for Extra Large
  const scale = sizeMode === 'xlarge' ? 1.4 : sizeMode === 'large' ? 1.25 : 1.0;
  const sizes = getScaledSizes(scale);

  return (
    <ThemeContext.Provider
      value={{
        sizeMode,
        isLarge: sizeMode !== 'standard',
        scale,
        sizes,
        language,
        setLanguage,
        availableLanguages: AVAILABLE_LANGUAGES,
        availableDisplaySizes: AVAILABLE_DISPLAY_SIZES,
        colors: COLORS,
        setSizeMode,
        toggleSizeMode,
        isLoadingPreferences,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

