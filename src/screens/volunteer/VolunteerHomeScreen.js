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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUnreadMessageCount } from '../../hooks/useUnreadMessageCount';

const LAST_SEEN_VOLUNTEER_REQUESTS_KEY = '@last_seen_volunteer_requests_time';
const LAST_SEEN_VOLUNTEER_NOTIFICATIONS_KEY = '@last_seen_volunteer_notifications_time';

export default function VolunteerHomeScreen() {
  const [currentTab, setCurrentTab] = useState('home'); // 'home' | 'request' | 'schedule' | 'messages' | 'history' | 'profile'
  const [requestCount, setRequestCount] = useState(0);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
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

  // Immediately clear badge count to 0 whenever volunteer visits the request page
  useEffect(() => {
    if (currentTab === 'request') {
      const now = new Date().toISOString();
      AsyncStorage.setItem(LAST_SEEN_VOLUNTEER_REQUESTS_KEY, now).catch(() => {});
      setRequestCount(0);
    }
  }, [currentTab]);

  const handleOpenNotifications = () => {
    const now = new Date().toISOString();
    AsyncStorage.setItem(LAST_SEEN_VOLUNTEER_NOTIFICATIONS_KEY, now).catch(() => {});
    setUnreadNotificationCount(0);
    setHasUnreadNotifications(false);
    setNotificationsVisible(true);
  };

  // Dynamically update available & direct request badge count + notification & message status
  useEffect(() => {
    const isRequestTab = currentTab === 'request';
    if (isRequestTab) {
      setRequestCount(0);
    }

    Promise.allSettled([
      isRequestTab ? Promise.resolve({ success: true, data: [] }) : volunteerService.getAvailableRequests(),
      isRequestTab ? Promise.resolve({ success: true, data: [] }) : volunteerService.getDirectRequests(),
      notificationService.getNotifications ? notificationService.getNotifications() : notificationService.getUnreadCount(),
      AsyncStorage.getItem(LAST_SEEN_VOLUNTEER_REQUESTS_KEY),
      AsyncStorage.getItem(LAST_SEEN_VOLUNTEER_NOTIFICATIONS_KEY),
    ])
      .then(([availRes, directRes, notifRes, lastSeenRes, lastSeenNotifRes]) => {
        if (!isRequestTab) {
          let allReqs = [];
          if (availRes.status === 'fulfilled' && availRes.value?.success) {
            allReqs = allReqs.concat(availRes.value.data || []);
          }
          if (directRes.status === 'fulfilled' && directRes.value?.success) {
            allReqs = allReqs.concat(directRes.value.data || []);
          }

          const lastSeenTime = lastSeenRes.status === 'fulfilled' ? lastSeenRes.value : null;
          if (!lastSeenTime) {
            setRequestCount(allReqs.length);
          } else {
            const lastSeenDate = new Date(lastSeenTime);
            const unseenReqs = allReqs.filter((r) => {
              if (!r.createdAt) return false;
              return new Date(r.createdAt) > lastSeenDate;
            });
            setRequestCount(unseenReqs.length);
          }
        }

        if (notifRes.status === 'fulfilled') {
          const notifs = notifRes.value?.data || [];
          const lastSeenNotifTime = lastSeenNotifRes.status === 'fulfilled' ? lastSeenNotifRes.value : null;
          let count = 0;

          if (Array.isArray(notifs) && notifs.length > 0) {
            if (!lastSeenNotifTime) {
              count = notifs.filter((n) => !n.isRead).length;
            } else {
              const lastSeenDate = new Date(lastSeenNotifTime);
              count = notifs.filter((n) => !n.isRead && n.createdAt && new Date(n.createdAt) > lastSeenDate).length;
            }
          } else {
            count = notifRes.value?.unreadCount ?? notifRes.value?.count ?? 0;
          }

          setUnreadNotificationCount(count);
          setHasUnreadNotifications(count > 0);
        } else {
          setUnreadNotificationCount(0);
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
          onNotificationPress={handleOpenNotifications}
          hasUnreadNotifications={hasUnreadNotifications}
          unreadNotificationsCount={unreadNotificationCount}
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
        onClose={() => {
          setNotificationsVisible(false);
          setUnreadNotificationCount(0);
          setHasUnreadNotifications(false);
        }}
        onNotificationAction={() => {
          setNotificationsVisible(false);
          setUnreadNotificationCount(0);
          setHasUnreadNotifications(false);
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