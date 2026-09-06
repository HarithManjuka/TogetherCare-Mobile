// src/screens/elderly/ElderlyHomeScreen.js
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import ElderlyBottomNav from '../../components/elderly/ElderlyBottomNav';
import ElderlyDashboardHome from './ElderlyDashboardHome';
import MyScheduleScreen from './MyScheduleScreen';
import CreateCompanionshipScreen from './CreateCompanionshipScreen';
import ProfileScreen from '../auth/ProfileScreen';
import { useElderlyHome } from '../../hooks/useElderlyHome';

export default function ElderlyHomeScreen() {
  const [currentTab, setCurrentTab] = useState('home'); // 'home' | 'requests' | 'schedule' | 'messages' | 'settings'
  const [showCreateScreen, setShowCreateScreen] = useState(false);
  const [showProfileScreen, setShowProfileScreen] = useState(false);

  const { refreshProfile, onRefresh } = useElderlyHome();

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
        onBack={() => {
          setShowProfileScreen(false);
          refreshProfile();
        }}
        onClose={() => {
          setShowProfileScreen(false);
          refreshProfile();
        }}
      />
    );
  }

  const renderActiveScreen = () => {
    switch (currentTab) {
      case 'schedule':
        return (
          <MyScheduleScreen
            onBack={() => setCurrentTab('home')}
            onRequestNew={() => setShowCreateScreen(true)}
          />
        );
      case 'settings':
        return (
          <ProfileScreen
            onBack={() => setCurrentTab('home')}
            onClose={() => setCurrentTab('home')}
          />
        );
      case 'home':
      default:
        return (
          <ElderlyDashboardHome
            onNavigateTab={setCurrentTab}
            onRequestHelp={() => setShowCreateScreen(true)}
            onOpenProfile={() => setShowProfileScreen(true)}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.screenArea}>
        {renderActiveScreen()}
      </View>

      <ElderlyBottomNav
        activeTab={currentTab}
        onSelectTab={setCurrentTab}
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
