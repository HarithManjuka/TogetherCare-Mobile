// src/screens/volunteer/VolunteerHomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import AppBottomNav from '../../components/common/AppBottomNav';
import AppHeader from '../../components/common/AppHeader';
import VolunteerDashboardHome from './VolunteerDashboardHome';
import VolunteerRequestsScreen from './VolunteerRequestsScreen';
import VolunteerScheduleScreen from './VolunteerScheduleScreen';
import VolunteerHistoryScreen from './VolunteerHistoryScreen';
import VolunteerProfileScreen from './VolunteerProfileScreen';
import * as volunteerService from '../../services/volunteerService';

export default function VolunteerHomeScreen() {
  const [currentTab, setCurrentTab] = useState('home'); // 'home' | 'request' | 'schedule' | 'history' | 'profile'
  const [requestCount, setRequestCount] = useState(0);

  // Dynamically update available request badge count
  useEffect(() => {
    volunteerService.getAvailableRequests()
      .then((res) => {
        if (res?.success) {
          setRequestCount(res.count || res.data?.length || 0);
        }
      })
      .catch(() => {});
  }, [currentTab]);

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
      {currentTab !== 'profile' && (
        <AppHeader
          onProfilePress={() => setCurrentTab('profile')}
          onNavigateTab={setCurrentTab}
        />
      )}
      <View style={styles.screenArea}>
        {renderActiveScreen()}
      </View>
      <AppBottomNav
        role="volunteer"
        activeTab={currentTab}
        onTabPress={setCurrentTab}
        requestBadgeCount={requestCount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3A8A',
  },
  screenArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});