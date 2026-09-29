// src/screens/elderly/ElderlyHomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import AppBottomNav from '../../components/common/AppBottomNav';
import NotificationsModal from '../../components/common/NotificationsModal';
import ElderlyDashboardHome from './ElderlyDashboardHome';
import ElderlyRequestsScreen from './ElderlyRequestsScreen';
import MyScheduleScreen from './MyScheduleScreen';
import CreateCompanionshipScreen from './CreateCompanionshipScreen';
import ProfileScreen from '../auth/ProfileScreen';
import MessagesListScreen from '../common/MessagesListScreen';
import CaregiverChatScreen from '../caregiver/CaregiverChatScreen';
import * as volunteerOfferService from '../../services/volunteerOfferService';
import * as notificationService from '../../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useElderlyHome } from '../../hooks/useElderlyHome';
import { useUnreadMessageCount } from '../../hooks/useUnreadMessageCount';

const LAST_SEEN_OFFERS_KEY = '@last_seen_offers_time';
const LAST_SEEN_NOTIFICATIONS_KEY = '@last_seen_elderly_notifications_time';

export default function ElderlyHomeScreen() {
  const [currentTab, setCurrentTab] = useState('home'); // 'home' | 'requests' | 'schedule' | 'messages' | 'settings'
  const [requestCount, setRequestCount] = useState(0);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [showCreateScreen, setShowCreateScreen] = useState(false);
  const [showProfileScreen, setShowProfileScreen] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState(null);

  const { refreshProfile, onRefresh } = useElderlyHome();

  // Real-time unread message count for bottom navigation bar
  const { unreadCount: msgBadgeCount, refreshUnread: refreshUnreadMsgs } =
    useUnreadMessageCount(activeChatUser?._id || null);

  useEffect(() => {
    if (!activeChatUser) {
      refreshUnreadMsgs();
    }
  }, [activeChatUser, currentTab]);

  // Immediately clear badge count to 0 whenever user visits the requests page
  useEffect(() => {
    if (currentTab === 'requests') {
      const now = new Date().toISOString();
      AsyncStorage.setItem(LAST_SEEN_OFFERS_KEY, now).catch(() => {});
      setRequestCount(0);
    }
  }, [currentTab]);

  // Dynamically update available volunteer offer count + notification status
  useEffect(() => {
    if (currentTab === 'requests') {
      setRequestCount(0);
    }

    Promise.allSettled([
      volunteerOfferService.getAllOffers(),
      notificationService.getNotifications ? notificationService.getNotifications() : notificationService.getUnreadCount(),
      AsyncStorage.getItem(LAST_SEEN_OFFERS_KEY),
      AsyncStorage.getItem(LAST_SEEN_NOTIFICATIONS_KEY),
    ])
      .then(([offersRes, notifRes, lastSeenRes, lastSeenNotifRes]) => {
        if (currentTab !== 'requests' && offersRes.status === 'fulfilled' && offersRes.value?.success) {
          const offers = offersRes.value.data || [];
          const lastSeenTime = lastSeenRes.status === 'fulfilled' ? lastSeenRes.value : null;

          if (!lastSeenTime) {
            setRequestCount(offers.length);
          } else {
            const lastSeenDate = new Date(lastSeenTime);
            const unseenOffers = offers.filter((o) => {
              if (!o.createdAt) return false;
              return new Date(o.createdAt) > lastSeenDate;
            });
            setRequestCount(unseenOffers.length);
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
      if (showCreateScreen) {
        setShowCreateScreen(false);
        return true;
      }
      if (showProfileScreen) {
        setShowProfileScreen(false);
        refreshProfile();
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
  }, [showCreateScreen, showProfileScreen, activeChatUser, currentTab]);

  // Full-page Modal / Screen: Create Companionship Request
  if (showCreateScreen) {
    return (
      <CreateCompanionshipScreen
        onBack={() => setShowCreateScreen(false)}
        onClose={() => setShowCreateScreen(false)}
        onSuccess={() => {
          setShowCreateScreen(false);
          onRefresh();
        }}
      />
    );
  }

  // Full-page Modal / Screen: Profile Screen
  if (showProfileScreen) {
    return (
      <ProfileScreen
        onClose={() => {
          setShowProfileScreen(false);
          refreshProfile();
        }}
      />
    );
  }

  const handleOpenNotifications = () => {
    const now = new Date().toISOString();
    AsyncStorage.setItem(LAST_SEEN_NOTIFICATIONS_KEY, now).catch(() => {});
    setUnreadNotificationCount(0);
    setHasUnreadNotifications(false);
    setNotificationsVisible(true);
  };

  const renderActiveScreen = () => {
    switch (currentTab) {
      case 'requests':
        return (
          <ElderlyRequestsScreen
            onNavigateToSchedule={() => setCurrentTab('schedule')}
            onRequestNew={() => setShowCreateScreen(true)}
            onBack={() => setCurrentTab('home')}
          />
        );
      case 'schedule':
        return (
          <MyScheduleScreen
            onBack={() => setCurrentTab('home')}
            onRequestNew={() => setShowCreateScreen(true)}
            onStartChat={(volunteerUser) => {
              setActiveChatUser(volunteerUser);
              setCurrentTab('messages');
            }}
          />
        );
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
      case 'profile':
      case 'settings':
        return (
          <ProfileScreen
            onClose={() => setCurrentTab('home')}
          />
        );
      case 'home':
      default:
        return (
          <ElderlyDashboardHome
            onNavigateTab={setCurrentTab}
            onRequestHelp={() => setShowCreateScreen(true)}
            onOpenProfile={() => setCurrentTab('profile')}
            onOpenNotifications={handleOpenNotifications}
            hasUnreadNotifications={hasUnreadNotifications}
            unreadNotificationCount={unreadNotificationCount}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.screenArea}>
        {renderActiveScreen()}
      </View>

      <AppBottomNav
        role="elderly"
        activeTab={currentTab}
        onTabPress={setCurrentTab}
        requestBadgeCount={requestCount}
        msgBadgeCount={msgBadgeCount}
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
          setCurrentTab('requests');
        }}
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
