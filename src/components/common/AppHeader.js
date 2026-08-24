// src/components/common/AppHeader.js
import React from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/theme';
import styles from '../../styles/AppHeader.styles';

/**
 * Reusable Top Application Header
 * @param {Function} onProfilePress Callback when user taps their avatar
 * @param {Function} onNotificationPress Callback when user taps notifications bell
 */
export default function AppHeader({ onProfilePress, onNotificationPress }) {
  const { user } = useAuth();

  const handleNotifications = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      Alert.alert('Notifications', 'No new notifications at this time.');
    }
  };

  return (
    <View style={styles.topHeader}>
      {/* Brand: Logo & Title */}
      <View style={styles.brandContainer}>
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.brandLogo}
          resizeMode="contain"
        />
        <Text style={styles.brandTitle}>TogetherCare</Text>
      </View>

      {/* Header Actions: Notifications & Profile Avatar */}
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
          onPress={handleNotifications}
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.profileButton}
          activeOpacity={0.7}
          onPress={onProfilePress}
          accessibilityLabel="User Profile Menu"
        >
          {user?.profilePicture ? (
            <Image
              source={{ uri: user.profilePicture }}
              style={styles.headerAvatarImg}
              key={user.profilePicture}
            />
          ) : (
            <Ionicons name="person-circle" size={38} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
