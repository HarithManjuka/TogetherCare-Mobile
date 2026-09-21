// src/screens/elderly/ElderlyHomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import AppBottomNav from '../../components/common/AppBottomNav';
import ElderlyDashboardHome from './ElderlyDashboardHome';
import ElderlyRequestsScreen from './ElderlyRequestsScreen';
import MyScheduleScreen from './MyScheduleScreen';
import CreateCompanionshipScreen from './CreateCompanionshipScreen';
import ProfileScreen from '../auth/ProfileScreen';
import MessagesListScreen from '../common/MessagesListScreen';
import CaregiverChatScreen from '../caregiver/CaregiverChatScreen';
import { useElderlyHome } from '../../hooks/useElderlyHome';
import { useUnreadMessageCount } from '../../hooks/useUnreadMessageCount';

export default function ElderlyHomeScreen() {
  const [currentTab, setCurrentTab] = useState('home'); // 'home' | 'requests' | 'schedule' | 'messages' | 'settings'
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
        msgBadgeCount={msgBadgeCount}
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
