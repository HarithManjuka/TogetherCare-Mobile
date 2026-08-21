import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

export default function AdminDashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Verification Portal</Text>
      <Text style={styles.subtitle}>Pending Volunteer Approvals: 0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: COLORS.background },
  title: { fontSize: SIZES.standardTitle, fontWeight: 'bold', color: COLORS.textPrimary },
  subtitle: { fontSize: SIZES.standardBody, color: COLORS.textSecondary, marginTop: 5 },
});