// src/screens/admin/AdminUsersScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import * as adminUserService from '../../services/adminUserService';
import AdminUserDetailsScreen from './AdminUserDetailsScreen';
import AdminCreateUserScreen from './AdminCreateUserScreen';
import AdminMyBannedUsersScreen from './AdminMyBannedUsersScreen';

export default function AdminUsersScreen(props) {
  // Parent props fallback
  const {
    users: propUsers,
    loading: propLoading,
    searchQuery: propSearchQuery,
    setSearchQuery: propSetSearchQuery,
    roleFilter: propRoleFilter,
    setRoleFilter: propSetRoleFilter,
  } = props;

  // Local state for search & role if props are not controlled externally
  const [localSearch, setLocalSearch] = useState('');
  const [localRole, setLocalRole] = useState('all');
  const [fetchedUsers, setFetchedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Sub-navigation state
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'details' | 'create' | 'my_banned'

  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : localSearch;
  const setSearchQuery = propSetSearchQuery || setLocalSearch;

  const roleFilter = propRoleFilter !== undefined ? propRoleFilter : localRole;
  const setRoleFilter = propSetRoleFilter || setLocalRole;

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await adminUserService.getAdminUsers({
        search: searchQuery,
        role: roleFilter,
      });
      if (res?.success) {
        setFetchedUsers(res.users || []);
      }
    } catch (err) {
      console.error('Fetch Admin Users Error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, roleFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  // Determine user data to render
  const sourceUsers = propUsers && propUsers.length > 0 && !searchQuery && roleFilter === 'all' && fetchedUsers.length === 0
    ? propUsers
    : fetchedUsers;

  const filteredUsers = sourceUsers.filter((u) => {
    const searchLower = (searchQuery || '').toLowerCase();
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const emailStr = (u.email || '').toLowerCase();
    const idStr = (u.customId || '').toLowerCase();
    const phoneStr = (u.phone || '').toLowerCase();

    const matchesSearch =
      !searchLower ||
      fullName.includes(searchLower) ||
      emailStr.includes(searchLower) ||
      idStr.includes(searchLower) ||
      phoneStr.includes(searchLower);

    const matchesRole = !roleFilter || roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const loadingState = propLoading || isLoading;

  // Sub-Screen 1: User Details
  if (viewMode === 'details' && selectedUserId) {
    return (
      <AdminUserDetailsScreen
        userId={selectedUserId}
        onBack={() => {
          setSelectedUserId(null);
          setViewMode('list');
          fetchUsers();
        }}
        onUserUpdated={fetchUsers}
      />
    );
  }

  // Sub-Screen 2: Create User
  if (viewMode === 'create') {
    return (
      <AdminCreateUserScreen
        onBack={() => setViewMode('list')}
        onUserCreated={fetchUsers}
      />
    );
  }

  // Sub-Screen 3: Banned Users by Admin
  if (viewMode === 'my_banned') {
    return (
      <AdminMyBannedUsersScreen
        onBack={() => {
          setViewMode('list');
          fetchUsers();
        }}
        onSelectUser={(id) => {
          setSelectedUserId(id);
          setViewMode('details');
        }}
      />
    );
  }

  return (
    <View style={styles.tabContent}>
      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={18} color="#64748B" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or user ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94A3B8"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Action Buttons: Create User & Banned By Me (Mini & Right Aligned) */}
      <View style={styles.topRightActionsContainer}>
        <TouchableOpacity
          style={styles.miniCreateBtn}
          onPress={() => setViewMode('create')}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add" size={13} color="#FFFFFF" />
          <Text style={styles.miniCreateBtnText}>Create User</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.miniBannedBtn}
          onPress={() => setViewMode('my_banned')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="account-cancel" size={14} color="#B91C1C" />
          <Text style={styles.miniBannedBtnText}>Banned By Me</Text>
        </TouchableOpacity>
      </View>

      {/* Role Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsRow}
        style={styles.filterChipsScrollView}
      >
        {['all', 'elderly', 'volunteer', 'caregiver', 'admin'].map((role) => (
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
      </ScrollView>

      {/* User List or Loading Spinner */}
      {loadingState && filteredUsers.length === 0 ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollPadding}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredUsers.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="people-outline" size={32} color="#94A3B8" />
              <Text style={styles.emptyText}>No matching users found.</Text>
            </View>
          ) : (
            filteredUsers.map((u) => (
              <TouchableOpacity
                key={u._id || u.customId}
                style={[styles.userCard, u.isBanned && styles.userCardBanned]}
                onPress={() => {
                  setSelectedUserId(u._id);
                  setViewMode('details');
                }}
                activeOpacity={0.7}
              >
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
                    <Text style={styles.userNameText}>
                      {u.firstName} {u.lastName}
                    </Text>
                    <View style={styles.roleTag}>
                      <Text style={styles.roleTagText}>{u.role?.toUpperCase()}</Text>
                    </View>
                    {u.isBanned && (
                      <View style={styles.bannedTag}>
                        <Text style={styles.bannedTagText}>BANNED</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.userEmailText}>{u.email}</Text>
                  <Text style={styles.userIdText}>ID: {u.customId || 'N/A'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchBarContainer: {
    flexShrink: 0,
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
  topRightActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  miniCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  miniCreateBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  miniBannedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  miniBannedBtnText: { color: '#B91C1C', fontSize: 11, fontWeight: '700' },
  filterChipsScrollView: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 12,
  },
  filterChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
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
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
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
  scrollPadding: {
    paddingHorizontal: 16,
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
  userCardBanned: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
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
    color: COLORS.primary,
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
  bannedTag: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bannedTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  userEmailText: {
    fontSize: 12,
    color: '#64748B',
  },
  userIdText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
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
