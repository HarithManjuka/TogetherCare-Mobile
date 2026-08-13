import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

export default function CaregiverDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Caregiver Dashboard</Text>
      <Text style={styles.subtitle}>Dependent: Grandmother (Kandy)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: COLORS.background },
  title: { fontSize: SIZES.standardTitle, fontWeight: 'bold', color: COLORS.textPrimary },
  subtitle: { fontSize: SIZES.standardBody, color: COLORS.textSecondary, marginTop: 5 },
});