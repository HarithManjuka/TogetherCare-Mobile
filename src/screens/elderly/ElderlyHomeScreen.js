import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function ElderlyHomeScreen() {
  const { user, logout } = useAuth();
  const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'User';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello, {displayName}!</Text>
      <Text style={styles.subtitle}>How can we help you today?</Text>
      
      <TouchableOpacity style={styles.actionBtn}>
        <Text style={styles.btnText}>Request Companionship</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.secondary }]}>
        <Text style={styles.btnText}>Grocery Assistance</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.danger }]}>
        <Text style={styles.btnText}>EMERGENCY SOS</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutBtnText}>🚪 Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: COLORS.background, justifyContent: 'center' },
  title: { fontSize: SIZES.elderlyTitle, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 5 },
  subtitle: { fontSize: SIZES.elderlyBody, color: COLORS.textSecondary, marginBottom: 30 },
  actionBtn: { 
    height: SIZES.elderlyButtonHeight, 
    backgroundColor: COLORS.primary, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  btnText: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  logoutBtn: {
    height: 54,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  logoutBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#475569',
  },
});