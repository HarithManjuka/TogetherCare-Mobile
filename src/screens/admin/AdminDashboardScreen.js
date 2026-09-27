// src/screens/admin/AdminDashboardScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import AppBottomNav from '../../components/common/AppBottomNav';
import AppHeader from '../../components/common/AppHeader';
import AdminDashboardHome from './AdminDashboardHome';
import AdminUsersScreen from './AdminUsersScreen';
import AdminSafetyScreen from './AdminSafetyScreen';
import AdminSettingsScreen from './settings/AdminSettingsScreen';
import AdminProfileScreen from './settings/AdminProfileScreen';
import AdminSystemHealthScreen from './settings/AdminSystemHealthScreen';
import AdminAnalyticsScreen from './settings/AdminAnalyticsScreen';
import AdminAccountDetailsScreen from './settings/AdminAccountDetailsScreen';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [settingsScreen, setSettingsScreen] = useState('menu'); // 'menu' | 'profile' | 'health' | 'analytics' | 'account'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await client.get('/auth/users');
      if (res.data?.success && Array.isArray(res.data.users)) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error('Fetch users error in admin:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleNavigateTab = (tab, subScreen = null) => {
    setActiveTab(tab);
    if (tab === 'settings') {
      setSettingsScreen(subScreen || 'menu');
    }
  };

  // Handle mobile hardware/system Back button navigation safely
  useEffect(() => {
    const onBackPress = () => {
      if (activeTab === 'settings' && settingsScreen !== 'menu') {
        setSettingsScreen('menu');
        return true;
      }
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [activeTab, settingsScreen]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const totalUsers = users.length;
  const elderlyCount = users.filter((u) => u.role === 'elderly').length;
  const volunteerCount = users.filter((u) => u.role === 'volunteer').length;
  const caregiverCount = users.filter((u) => u.role === 'caregiver').length;

  const renderSettingsContent = () => {
    switch (settingsScreen) {
      case 'profile':
        return <AdminProfileScreen onBack={() => setSettingsScreen('menu')} />;
      case 'health':
        return <AdminSystemHealthScreen onBack={() => setSettingsScreen('menu')} />;
      case 'analytics':
        return <AdminAnalyticsScreen onBack={() => setSettingsScreen('menu')} />;
      case 'account':
        return <AdminAccountDetailsScreen onBack={() => setSettingsScreen('menu')} />;
      case 'menu':
      default:
        return (
          <AdminSettingsScreen
            onNavigateScreen={setSettingsScreen}
            onNavigateTab={handleNavigateTab}
          />
        );
    }
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'users':
        return (
          <AdminUsersScreen
            users={users}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
          />
        );
      case 'alerts':
        return <AdminSafetyScreen />;
      case 'settings':
        return (
          <View style={styles.tabContent}>
            {renderSettingsContent()}
          </View>
        );
      case 'dashboard':
      default:
        return (
          <AdminDashboardHome
            user={user}
            totalUsers={totalUsers}
            elderlyCount={elderlyCount}
            volunteerCount={volunteerCount}
            caregiverCount={caregiverCount}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onNavigateTab={handleNavigateTab}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {activeTab !== 'settings' && (
        <AppHeader
          onProfilePress={() => handleNavigateTab('settings', 'profile')}
          onNotificationPress={() => setActiveTab('alerts')}
          onNavigateTab={handleNavigateTab}
        />
      )}

      <View style={styles.mainContainer}>
        {renderActiveScreen()}
      </View>

      {/* Fixed Mobile Bottom Navigation */}
      <AppBottomNav
        role="admin"
        activeTab={activeTab}
        onTabPress={(tabKey) => handleNavigateTab(tabKey, 'menu')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3A8A',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  tabContent: {
    flex: 1,
  },
});