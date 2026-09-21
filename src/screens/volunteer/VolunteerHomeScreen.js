// src/screens/volunteer/VolunteerHomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import AppBottomNav from '../../components/common/AppBottomNav';
import AppHeader from '../../components/common/AppHeader';
import NotificationsModal from '../../components/common/NotificationsModal';
import VolunteerDashboardHome from './VolunteerDashboardHome';
import VolunteerRequestsScreen from './VolunteerRequestsScreen';
import VolunteerScheduleScreen from './VolunteerScheduleScreen';
import VolunteerHistoryScreen from './VolunteerHistoryScreen';
import VolunteerProfileScreen from './VolunteerProfileScreen';
import * as volunteerService from '../../services/volunteerService';
import * as notificationService from '../../services/notificationService';

export default function VolunteerHomeScreen() {
  const [currentTab, setCurrentTab] = useState('home'); // 'home' | 'request' | 'schedule' | 'history' | 'profile'
  const [requestCount, setRequestCount] = useState(0);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  // Dynamically update available & direct request badge count + notification status
  useEffect(() => {
    Promise.allSettled([
      volunteerService.getAvailableRequests(),
      volunteerService.getDirectRequests(),
      notificationService.getUnreadCount ? notificationService.getUnreadCount() : Promise.resolve({ count: 0 }),
    ])
      .then(([availRes, directRes, notifRes]) => {
        let total = 0;
        if (availRes.status === 'fulfilled' && availRes.value?.success) {
          total += (availRes.value.count || availRes.value.data?.length || 0);
        }
        if (directRes.status === 'fulfilled' && directRes.value?.success) {
          total += (directRes.value.count || directRes.value.data?.length || 0);
        }
        setRequestCount(total);

        if (notifRes.status === 'fulfilled' && notifRes.value?.count > 0) {
          setHasUnreadNotifications(true);
        } else {
          setHasUnreadNotifications(false);
        }
      })
      .catch(() => {});
  }, [currentTab, notificationsVisible]);

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
          onNotificationPress={() => setNotificationsVisible(true)}
          hasUnreadNotifications={hasUnreadNotifications}
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
      <NotificationsModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        onNotificationAction={() => {
          setNotificationsVisible(false);
          setCurrentTab('request');
        }}
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