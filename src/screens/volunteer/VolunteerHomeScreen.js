import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

export default function VolunteerHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, Amasha!</Text>
      <Text style={styles.subtitle}>Nearby Assistance Requests</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: COLORS.background },
  title: { fontSize: SIZES.standardTitle, fontWeight: 'bold', color: COLORS.textPrimary },
  subtitle: { fontSize: SIZES.standardBody, color: COLORS.textSecondary, marginTop: 5 },
});