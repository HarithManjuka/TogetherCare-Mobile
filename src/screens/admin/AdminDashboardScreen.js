// src/screens/admin/AdminDashboardScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AdminBottomNav from '../../components/admin/AdminBottomNav';
import ProfileScreen from '../auth/ProfileScreen';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';

export default function AdminDashboardScreen() {
  const { user, logout } = useAuth();
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

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  // Filtered users for User Management tab
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      `${u.firstName} ${u.lastName} ${u.email} ${u.customId}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalUsers = users.length;
  const elderlyCount = users.filter((u) => u.role === 'elderly').length;
  const volunteerCount = users.filter((u) => u.role === 'volunteer').length;
  const caregiverCount = users.filter((u) => u.role === 'caregiver').length;

  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0) + (Platform.OS === 'android' ? 6 : 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.mainContainer, { paddingTop: topPadding }]}>
        {/* 1. Dashboard Overview Tab */}
        {activeTab === 'dashboard' && (
          <ScrollView
            style={styles.tabContent}
            contentContainerStyle={styles.scrollPadding}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.welcomeBanner}>
              <Text style={styles.welcomeTitle}>Admin Command Center</Text>
              <Text style={styles.welcomeSub}>
                Welcome back, {user?.firstName || 'Admin'}! Monitor user registrations, active volunteers, and safety alerts.
              </Text>
            </View>

            {/* Metrics Overview Grid */}
            <Text style={styles.sectionHeader}>System Metrics</Text>
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                <Ionicons name="people" size={24} color="#1E40AF" />
                <Text style={styles.metricValue}>{totalUsers}</Text>
                <Text style={styles.metricLabel}>Total Users</Text>
              </View>

              <View style={[styles.metricCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                <Ionicons name="hand-left" size={24} color="#16A34A" />
                <Text style={styles.metricValue}>{volunteerCount}</Text>
                <Text style={styles.metricLabel}>Volunteers</Text>
              </View>

              <View style={[styles.metricCard, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                <Ionicons name="accessibility" size={24} color="#D97706" />
                <Text style={styles.metricValue}>{elderlyCount}</Text>
                <Text style={styles.metricLabel}>Elderly Profiles</Text>
              </View>

              <View style={[styles.metricCard, { backgroundColor: '#F3E8FF', borderColor: '#E9D5FF' }]}>
                <Ionicons name="medkit" size={24} color="#9333EA" />
                <Text style={styles.metricValue}>{caregiverCount}</Text>
                <Text style={styles.metricLabel}>Caregivers</Text>
              </View>
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionHeader}>Quick Management</Text>
            <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('users')} activeOpacity={0.8}>
              <Ionicons name="person-add-outline" size={22} color="#1E40AF" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.actionCardTitle}>Manage User Accounts</Text>
                <Text style={styles.actionCardSub}>Review, search, and verify registered users</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('alerts')} activeOpacity={0.8}>
              <Ionicons name="alert-circle-outline" size={22} color="#DC2626" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.actionCardTitle}>Safety & SOS Alerts Log</Text>
                <Text style={styles.actionCardSub}>View real-time safety monitoring logs</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </ScrollView>
        )}

        {/* 2. User Management Tab */}
        {activeTab === 'users' && (
          <View style={styles.tabContent}>
            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={18} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, email, or user ID..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Role Filters */}
            <View style={styles.filterChipsRow}>
              {['all', 'elderly', 'volunteer', 'caregiver'].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[styles.filterChip, roleFilter === role && styles.filterChipActive]}
                  onPress={() => setRoleFilter(role)}
                >
                  <Text style={[styles.filterChipText, roleFilter === role && styles.filterChipTextActive]}>
                    {role.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {loading ? (
              <View style={styles.loadingCenter}>
                <ActivityIndicator size="large" color="#1E40AF" />
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>
                {filteredUsers.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Ionicons name="people-outline" size={32} color="#94A3B8" />
                    <Text style={styles.emptyText}>No matching users found.</Text>
                  </View>
                ) : (
                  filteredUsers.map((u) => (
                    <View key={u._id || u.customId} style={styles.userCard}>
                      <View style={styles.userAvatar}>
                        {u.profilePicture || u.avatar ? (
                          <Image
                            source={{ uri: u.profilePicture || u.avatar }}
                            style={styles.userAvatarImage}
                          />
                        ) : (
                          <Text style={styles.userAvatarText}>
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.userNameText}>{u.firstName} {u.lastName}</Text>
                          <View style={styles.roleTag}>
                            <Text style={styles.roleTagText}>{u.role?.toUpperCase()}</Text>
                          </View>
                        </View>
                        <Text style={styles.userEmailText}>{u.email}</Text>
                        <Text style={styles.userIdText}>ID: {u.customId || 'N/A'}</Text>
                      </View>
                    </View>
                  ))
                )}
                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </View>
        )}

        {/* 3. Safety Alert Tab */}
        {activeTab === 'alerts' && (
          <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollPadding}>
            <View style={styles.alertHeaderCard}>
              <Ionicons name="shield-checkmark-outline" size={28} color="#16A34A" />
              <Text style={styles.alertTitle}>System Security & Safety Log</Text>
              <Text style={styles.alertSub}>All system activities and safety channels are operating normally.</Text>
            </View>

            <View style={styles.logCard}>
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.logTitle}>System Health Normal</Text>
                <Text style={styles.logSub}>No emergency SOS alerts logged in the last 24 hours.</Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* 4. Settings / Profile Tab */}
        {activeTab === 'settings' && (
          <View style={styles.tabContent}>
            <ProfileScreen onBack={() => setActiveTab('dashboard')} />
          </View>
        )}
      </View>

      {/* Fixed Mobile Bottom Navigation */}
      <AdminBottomNav activeTab={activeTab} onTabPress={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adminBadgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  tabContent: {
    flex: 1,
  },
  scrollPadding: {
    padding: 16,
  },
  welcomeBanner: {
    backgroundColor: '#1E40AF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 13,
    color: '#DBEAFE',
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    marginTop: 6,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionCardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  filterChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  loadingCenter: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    overflow: 'hidden',
  },
  userAvatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E40AF',
  },
  userNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  roleTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  userEmailText: {
    fontSize: 12,
    color: '#64748B',
  },
  userIdText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E40AF',
    marginTop: 2,
  },
  alertHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  alertSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  logTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  logSub: {
    fontSize: 12,
    color: '#15803D',
    marginTop: 2,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
  },
});