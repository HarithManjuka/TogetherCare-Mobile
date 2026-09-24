// src/screens/volunteer/VolunteerHomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import VolunteerBottomNav from '../../components/volunteer/VolunteerBottomNav';
import VolunteerDashboardHome from './VolunteerDashboardHome';
import VolunteerRequestsScreen from './VolunteerRequestsScreen';
import VolunteerScheduleScreen from './VolunteerScheduleScreen';
import VolunteerHistoryScreen from './VolunteerHistoryScreen';
import VolunteerProfileScreen from './VolunteerProfileScreen';

export default function VolunteerHomeScreen() {
  const [currentTab, setCurrentTab] = useState('home'); // 'home' | 'request' | 'schedule' | 'history' | 'profile'

  // Handle mobile hardware/system Back button navigation
  useEffect(() => {
    const onBackPress = () => {
      if (currentTab !== 'home') {
        setCurrentTab('home');
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [currentTab]);

  const renderActiveScreen = () => {
    switch (currentTab) {
      case 'request':
        return <VolunteerRequestsScreen onNavigateTab={setCurrentTab} />;
      case 'schedule':
        return <VolunteerScheduleScreen onNavigateTab={setCurrentTab} />;
      case 'history':
        return <VolunteerHistoryScreen />;
      case 'profile':
        return <VolunteerProfileScreen />;
      case 'home':
      default:
        return <VolunteerDashboardHome onNavigateTab={setCurrentTab} />;
    }
  };

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