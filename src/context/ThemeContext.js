// src/context/ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { getItem, setItem } from '../utils/storage';

const SCALE_KEY = '@togethercare_ui_scale';
const THEME_KEY = '@togethercare_theme_mode';

const ThemeContext = createContext({});

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Accessibility UI Scale: 1.0 (Regular), 1.15 (Medium / Clear), 1.30 (Large / Senior Friendly)
  const [uiScale, setUiScale] = useState(1.0);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedTheme = await getItem(THEME_KEY);
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        } else {
          setIsDarkMode(systemColorScheme === 'dark');
        }

        const savedScale = await getItem(SCALE_KEY);
        if (savedScale) {
          setUiScale(Number(savedScale));
        }
      } catch (err) {
        console.error('Error loading theme preferences:', err);
      }
    };
    loadPreferences();
  }, [systemColorScheme]);

  const toggleTheme = async () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    await setItem(THEME_KEY, nextMode ? 'dark' : 'light');
  };

  // Cycles through normal (1.0) -> medium (1.15) -> large (1.30)
  const cycleUiScale = async () => {
    let nextScale = 1.0;
    if (uiScale === 1.0) nextScale = 1.15;
    else if (uiScale === 1.15) nextScale = 1.30;
    else nextScale = 1.0;

    setUiScale(nextScale);
    await setItem(SCALE_KEY, nextScale);
  };

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleTheme,
        uiScale,
        scale: uiScale,
        cycleUiScale,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);