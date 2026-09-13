// src/screens/admin/AdminDashboardScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Platform, StatusBar, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBottomNav from '../../components/common/AppBottomNav';
import ProfileScreen from '../auth/ProfileScreen';
import AdminDashboardHome from './AdminDashboardHome';
import AdminUsersScreen from './AdminUsersScreen';
import AdminSafetyScreen from './AdminSafetyScreen';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
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

  // Handle mobile hardware/system Back button navigation
  useEffect(() => {
    const onBackPress = () => {
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [activeTab]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const totalUsers = users.length;
  const elderlyCount = users.filter((u) => u.role === 'elderly').length;
  const volunteerCount = users.filter((u) => u.role === 'volunteer').length;
  const caregiverCount = users.filter((u) => u.role === 'caregiver').length;

  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0) + (Platform.OS === 'android' ? 6 : 0);

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
            <ProfileScreen onBack={() => setActiveTab('dashboard')} />
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
            onNavigateTab={setActiveTab}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.mainContainer, { paddingTop: topPadding }]}>
        {renderActiveScreen()}
      </View>

      {/* Fixed Mobile Bottom Navigation */}
      <AppBottomNav role="admin" activeTab={activeTab} onTabPress={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  tabContent: {
    flex: 1,
  },
});