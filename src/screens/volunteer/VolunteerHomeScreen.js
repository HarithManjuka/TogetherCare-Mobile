// src/screens/volunteer/VolunteerHomeScreen.js
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import VolunteerBottomNav from '../../components/volunteer/VolunteerBottomNav';
import VolunteerDashboardHome from './VolunteerDashboardHome';
import VolunteerRequestsScreen from './VolunteerRequestsScreen';
import VolunteerScheduleScreen from './VolunteerScheduleScreen';
import VolunteerHistoryScreen from './VolunteerHistoryScreen';
import VolunteerProfileScreen from './VolunteerProfileScreen';

export default function VolunteerHomeScreen() {
  const [currentTab, setCurrentTab] = useState('home'); // 'home' | 'request' | 'schedule' | 'history' | 'profile'

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
      <View style={styles.screenArea}>
        {renderActiveScreen()}
      </View>
      <VolunteerBottomNav
        activeTab={currentTab}
        onSelectTab={setCurrentTab}
        requestBadgeCount={2}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screenArea: {
    flex: 1,
  },
});