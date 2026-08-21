// src/constants/theme.js
export const COLORS = {
  primary: '#1A365D',      // Deep Blue (High Contrast)
  secondary: '#0D9488',    // Teal (Action Buttons)
  accent: '#D97706',       // Amber Warnings
  danger: '#DC2626',       // Emergency SOS Button
  background: '#FFFFFF',   // Pure White
  surface: '#F8FAFC',      // Off-White Cards
  textPrimary: '#0F172A',  // Near Black
  textSecondary: '#475569',
  success: '#16A34A',      // Verification Badges
};

export const SIZES = {
  // Elderly High-Contrast UI Defaults[cite: 8, 9]
  elderlyTitle: 28,
  elderlyBody: 20,
  elderlyButtonHeight: 58, // Touch target >= 48dp[cite: 8, 9]
  
  // Standard UI Defaults (Volunteer, Caregiver, Admin)[cite: 9]
  standardTitle: 22,
  standardBody: 16,
  standardButtonHeight: 48,
};