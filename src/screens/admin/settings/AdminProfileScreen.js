// src/screens/admin/settings/AdminProfileScreen.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import ProfileScreen from '../../auth/ProfileScreen';

/**
 * Full-screen Admin Profile
 * Provides full profile management and editing (avatar, personal details, contact, preferences)
 * and safely navigates back to the Admin Settings Hub.
 */
export default function AdminProfileScreen({ onBack }) {
  return (
    <View style={styles.container}>
      <ProfileScreen onBack={onBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
