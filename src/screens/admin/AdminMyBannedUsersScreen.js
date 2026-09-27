// src/screens/admin/AdminMyBannedUsersScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import * as adminUserService from '../../services/adminUserService';

export default function AdminMyBannedUsersScreen({ onBack, onSelectUser }) {
  const [bannedUsers, setBannedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyBannedUsers = async () => {
    try {
      setIsLoading(true);
      const res = await adminUserService.getAdminUsers({ myBannedOnly: 'true' });
      if (res?.success) {
        setBannedUsers(res.users || []);
      }
    } catch (err) {
      console.error('Fetch My Banned Users Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBannedUsers();
  }, []);

  const handleQuickUnban = (item) => {
    Alert.alert(
      'Unban User',
      `Restore account access for ${item.firstName} ${item.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unban',
          onPress: async () => {
            try {
              const res = await adminUserService.unbanUser(item._id);
              if (res?.success) {
                Alert.alert('Success', 'User unbanned successfully.');
                fetchMyBannedUsers();
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to unban user.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Users Banned By You</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : bannedUsers.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="account-check-outline" size={56} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Banned Users</Text>
          <Text style={styles.emptySub}>You haven't banned any user accounts yet.</Text>
        </View>
      ) : (
        <FlatList
          data={bannedUsers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => onSelectUser(item._id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>
                    {item.firstName} {item.lastName}
                  </Text>
                  <Text style={styles.cardSub}>
                    {item.customId} • {item.role ? item.role.toUpperCase() : ''}
                  </Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    item.banType === 'permanent' ? styles.badgePerm : styles.badgeTemp,
                  ]}
                >
                  <Text style={styles.badgeText}>{item.banType ? item.banType.toUpperCase() : ''}</Text>
                </View>
              </View>

              {item.banExpiresAt && (
                <Text style={styles.cardExpiry}>
                  Expires: {new Date(item.banExpiresAt).toLocaleDateString()}
                </Text>
              )}

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.unbanBtn} onPress={() => handleQuickUnban(item)}>
                  <Text style={styles.unbanText}>Lift Ban</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  headerRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#475569', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#94A3B8', marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  cardSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgePerm: { backgroundColor: '#FEE2E2' },
  badgeTemp: { backgroundColor: '#FEF3C7' },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#991B1B' },
  cardExpiry: { fontSize: 12, color: '#D97706', marginTop: 6, fontWeight: '600' },
  actionRow: { marginTop: 10, flexDirection: 'row', justifyContent: 'flex-end' },
  unbanBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  unbanText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
});
