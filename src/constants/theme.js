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
  // Elderly High-Contrast UI Defaults
  elderlyTitle: 28,
  elderlyBody: 20,
  elderlyButtonHeight: 58, // Touch target >= 48dp
  
  // Standard UI Defaults
  standardTitle: 22,
  standardBody: 16,
  standardButtonHeight: 48,
};

/**
 * Dynamic scale calculator for fonts, icon sizes, touch targets, and paddings
 * @param {number} scale Multiplier (1.0 for Standard, 1.25 for Large)
 */
export const getScaledSizes = (scale = 1.0) => ({
  scale,
  // Font sizes
  title: Math.round(24 * scale),
  subtitle: Math.round(18 * scale),
  body: Math.round(16 * scale),
  caption: Math.round(13 * scale),
  greeting: Math.round(24 * scale),

  // Elderly specific scaled tokens
  elderlyTitle: Math.round(28 * scale),
  elderlyBody: Math.round(20 * scale),
  elderlyButtonHeight: Math.round(58 * scale),

  // Icon sizes
  iconSmall: Math.round(18 * scale),
  iconMedium: Math.round(24 * scale),
  iconLarge: Math.round(32 * scale),
  heroIconSize: Math.round(44 * scale),

  // Element sizes
  avatarSize: Math.round(150 * scale),
  headerAvatarSize: Math.round(36 * scale),
  touchTargetMin: Math.round(48 * scale),
});