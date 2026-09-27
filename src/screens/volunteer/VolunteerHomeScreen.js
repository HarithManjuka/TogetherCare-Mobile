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
import MessagesListScreen from '../common/MessagesListScreen';
import CaregiverChatScreen from '../caregiver/CaregiverChatScreen';
import * as volunteerService from '../../services/volunteerService';
import * as notificationService from '../../services/notificationService';
import * as messageService from '../../services/messageService';
import { useUnreadMessageCount } from '../../hooks/useUnreadMessageCount';

export default function VolunteerHomeScreen() {
  const [currentTab, setCurrentTab] = useState('home'); // 'home' | 'request' | 'schedule' | 'messages' | 'history' | 'profile'
  const [requestCount, setRequestCount] = useState(0);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState(null);

  // Real-time unread message count for bottom navigation bar
  const { unreadCount: msgCount, refreshUnread: refreshUnreadMsgs } =
    useUnreadMessageCount(activeChatUser?._id || null);

  useEffect(() => {
    if (!activeChatUser) {
      refreshUnreadMsgs();
    }
  }, [activeChatUser, currentTab]);

  // Dynamically update available & direct request badge count + notification & message status
  useEffect(() => {
    Promise.allSettled([
      volunteerService.getAvailableRequests(),
      volunteerService.getDirectRequests(),
      notificationService.getUnreadCount ? notificationService.getUnreadCount() : Promise.resolve({ count: 0 }),
    ])
      .then(([availRes, directRes, notifRes]) => {
        let totalReqs = 0;
        if (availRes.status === 'fulfilled' && availRes.value?.success) {
          totalReqs += (availRes.value.count || availRes.value.data?.length || 0);
        }
        if (directRes.status === 'fulfilled' && directRes.value?.success) {
          totalReqs += (directRes.value.count || directRes.value.data?.length || 0);
        }
        setRequestCount(totalReqs);

        if (notifRes.status === 'fulfilled' && notifRes.value?.count > 0) {
          setHasUnreadNotifications(true);
        } else {
          setHasUnreadNotifications(false);
        }
      })
      .catch(() => {});
  }, [currentTab, notificationsVisible, activeChatUser]);

  // Handle mobile hardware/system Back button navigation
  useEffect(() => {
    const onBackPress = () => {
      if (activeChatUser) {
        setActiveChatUser(null);
        return true;
      }
      if (currentTab !== 'home') {
        setCurrentTab('home');
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [activeChatUser, currentTab]);

  const renderActiveScreen = () => {
    switch (currentTab) {
      case 'request':
        return <VolunteerRequestsScreen onNavigateTab={setCurrentTab} />;
      case 'schedule':
        return <VolunteerScheduleScreen onNavigateTab={setCurrentTab} />;
      case 'messages':
        if (activeChatUser) {
          return (
            <CaregiverChatScreen
              otherUser={activeChatUser}
              onBack={() => setActiveChatUser(null)}
            />
          );
        }
        return (
          <MessagesListScreen
            onSelectConversation={(otherUser) => setActiveChatUser(otherUser)}
            onBack={() => setCurrentTab('home')}
          />
        );
      case 'history':
        return <VolunteerHistoryScreen onBack={() => setCurrentTab('home')} />;
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
        msgBadgeCount={msgCount}
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