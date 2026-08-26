// src/screens/admin/AdminDashboardScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Platform } from 'react-native';
import AdminBottomNav from '../../components/admin/AdminBottomNav';
import ProfileScreen from '../auth/ProfileScreen';

export default function AdminDashboardScreen() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Render Tab Views */}
        {activeTab === 'dashboard' && <View style={styles.contentView}>{/* Dashboard Screen Content */}</View>}
        {activeTab === 'users' && <View style={styles.contentView}>{/* Users Screen Content */}</View>}
        {activeTab === 'alerts' && <View style={styles.contentView}>{/* Safety Alert Screen Content */}</View>}
        {activeTab === 'settings' && <ProfileScreen />}
      </View>

      {/* Fixed Bottom Navigation */}
      <AdminBottomNav activeTab={activeTab} onTabPress={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 84 : 70, // Prevent content overlap
  },
  contentView: {
    flex: 1,
  },
});