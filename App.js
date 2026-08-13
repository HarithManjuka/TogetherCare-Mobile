import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { COLORS } from './src/constants/theme';

import ElderlyHomeScreen from './src/screens/elderly/ElderlyHomeScreen';
import VolunteerHomeScreen from './src/screens/volunteer/VolunteerHomeScreen';
import CaregiverDashboard from './src/screens/caregiver/CaregiverDashboard';
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';

export default function App() {
  const [role, setRole] = useState('elderly');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Dev Role Switcher */}
      <View style={styles.roleBanner}>
        <Text style={styles.bannerTitle}>ROLE PREVIEW: </Text>
        {['elderly', 'volunteer', 'caregiver', 'admin'].map((r) => (
          <TouchableOpacity
            key={r}
            onPress={() => setRole(r)}
            style={[styles.roleBtn, role === r && styles.activeRoleBtn]}
          >
            <Text style={[styles.roleBtnText, role === r && styles.activeRoleBtnText]}>
              {r.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Screen Views */}
      <View style={styles.screenContainer}>
        {role === 'elderly' && <ElderlyHomeScreen />}
        {role === 'volunteer' && <VolunteerHomeScreen />}
        {role === 'caregiver' && <CaregiverDashboard />}
        {role === 'admin' && <AdminDashboardScreen />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  roleBanner: { 
    flexDirection: 'row', 
    padding: 8, 
    backgroundColor: '#E2E8F0', 
    alignItems: 'center', 
    justifyContent: 'space-around' 
  },
  bannerTitle: { fontSize: 10, fontWeight: 'bold', color: COLORS.textPrimary },
  roleBtn: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4, backgroundColor: '#CBD5E1' },
  activeRoleBtn: { backgroundColor: COLORS.primary },
  roleBtnText: { fontSize: 10, color: '#334155', fontWeight: 'bold' },
  activeRoleBtnText: { color: '#FFFFFF' },
  screenContainer: { flex: 1 },
});