// src/utils/alert.js
import { Alert, Platform } from 'react-native';

/**
 * Universal Alert helper that works across Mobile (Android/iOS) and Web (React Native Web / Browser).
 * Solves the issue where Alert.alert is a no-op stub in react-native-web.
 *
 * @param {string} title - Dialog title
 * @param {string} [message] - Dialog message / description
 * @param {Array<{ text: string, onPress?: () => void, style?: 'default' | 'cancel' | 'destructive' }>} [buttons]
 */
export const showAppAlert = (title, message = '', buttons = []) => {
  if (Platform.OS === 'web') {
    const cleanTitle = title || '';
    const cleanMsg = message || '';
    const fullText = cleanMsg ? `${cleanTitle}\n\n${cleanMsg}` : cleanTitle;

    // Simple alert (0 or 1 button)
    if (!buttons || buttons.length <= 1) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(fullText);
      }
      if (buttons && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
      return;
    }

    // Confirmation / choice dialog (2+ buttons)
    if (typeof window !== 'undefined' && window.confirm) {
      // Find confirm / primary action button (e.g. "View Schedule", "Yes, Accept", "Start Trip")
      const isPrimary = (b) => {
        const t = (b.text || '').toLowerCase();
        return b.style !== 'cancel' && !t.includes('cancel') && !t.includes('stay') && !t.includes('not yet');
      };

      const primaryBtn = buttons.find(isPrimary) || buttons.find((b) => b.style !== 'cancel') || buttons[0];
      const secondaryBtn = buttons.find((b) => b !== primaryBtn) || buttons[1];

      const promptText = `${fullText}\n\n• OK: ${primaryBtn?.text || 'Confirm'}\n• Cancel: ${secondaryBtn?.text || 'Cancel'}`;
      const confirmed = window.confirm(promptText);

      if (confirmed) {
        if (primaryBtn?.onPress) primaryBtn.onPress();
      } else {
        if (secondaryBtn?.onPress) secondaryBtn.onPress();
      }
      return;
    }
  }

  // Native mobile platforms (Android & iOS)
  Alert.alert(title, message, buttons);
};

export default showAppAlert;
