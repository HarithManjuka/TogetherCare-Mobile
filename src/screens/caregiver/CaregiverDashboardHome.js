// src/screens/caregiver/CaregiverDashboardHome.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { COLORS, SIZES } from '../../constants/theme';

export default function CaregiverDashboardHome({
  onAddDependent,
  onRequestHelp,
  onViewRequest,
  refreshTrigger,
}) {
  const { user, logout } = useAuth();
  const [dependents, setDependents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [depRes, reqRes] = await Promise.all([
        client.get('/caregiver/dependents'),
        client.get('/help-requests'),
      ]);

      if (depRes.data?.success) setDependents(depRes.data.data);
      if (reqRes.data?.success) setRequests(reqRes.data.data);
    } catch (error) {
      console.error('Fetch Caregiver Data Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'searching':
        return COLORS.accent;
      case 'matched':
        return COLORS.secondary;
      case 'confirmed':
        return COLORS.primary;
      case 'arrived':
        return COLORS.success;
      case 'completed':
        return '#64748B';
      case 'cancelled':
        return COLORS.danger;
      default:
        return '#94A3B8';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'searching': return 'Searching Volunteer';
      case 'matched': return 'Volunteer Found';
      case 'confirmed': return 'Match Confirmed';
      case 'arrived': return 'Volunteer Arrived';
      case 'completed': return 'Visit Completed';
      case 'cancelled': return 'Request Cancelled';
      default: return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  const activeRequests = requests.filter(r => r.status !== 'cancelled' && (r.status !== 'completed' || r.rating === null));
  const completedRequests = requests.filter(r => r.status === 'cancelled' || (r.status === 'completed' && r.rating !== null));

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.firstName || 'Caregiver'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Icon name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {/* Dependents list */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Elderly Dependents</Text>
          <TouchableOpacity onPress={onAddDependent} style={styles.textLink}>
            <Icon name="add-circle-outline" size={16} color={COLORS.secondary} />
            <Text style={styles.textLinkVal}>Add Profile</Text>
          </TouchableOpacity>
        </View>

        {dependents.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="people-outline" size={32} color="#94A3B8" />
            <Text style={styles.emptyText}>You haven't linked any elderly dependents yet.</Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={onAddDependent}>
              <Text style={styles.emptyAddBtnText}>Add Dependent Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dependentsSlider}>
            {dependents.map((dep) => (
              <View key={dep._id} style={styles.dependentCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {dep.firstName[0]}{dep.lastName[0]}
                  </Text>
                </View>
                <Text style={styles.depName}>{dep.firstName} {dep.lastName}</Text>
                <Text style={styles.depAge}>{dep.age} Yrs • {dep.address?.city}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Active Help Requests */}
        <Text style={styles.sectionTitle}>Active Visits & Requests</Text>
        {activeRequests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="time-outline" size={32} color="#94A3B8" />
            <Text style={styles.emptyText}>No active requests at the moment.</Text>
          </View>
        ) : (
          activeRequests.map((req) => (
            <TouchableOpacity
              key={req._id}
              style={styles.requestCard}
              onPress={() => onViewRequest(req._id)}
            >
              <View style={styles.requestHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBadgeColor(req.status) }]}>
                  <Text style={styles.statusText}>{getStatusLabel(req.status)}</Text>
                </View>
                <Text style={styles.requestDate}>{req.date} at {req.time}</Text>
              </View>

              <Text style={styles.requestDetailTitle}>{req.serviceType} visit</Text>
              <Text style={styles.requestDetailSub}>
                For: {req.elderlyId?.firstName} {req.elderlyId?.lastName}
              </Text>
              <Text style={styles.requestDetailSub}>
                Location: {req.location}
              </Text>

              {req.volunteerId && (
                <View style={styles.volunteerMiniRow}>
                  <Icon name="person-circle-outline" size={18} color={COLORS.secondary} />
                  <Text style={styles.volunteerMiniText}>
                    Volunteer: {req.volunteerId.firstName} {req.volunteerId.lastName}
                  </Text>
                </View>
              )}

              {req.sosTriggered && (
                <View style={styles.sosAlertRow}>
                  <Icon name="warning" size={16} color="#FFFFFF" />
                  <Text style={styles.sosAlertText}>🚨 EMERGENCY SOS ACTIVE</Text>
                </View>
              )}

              <View style={styles.actionRow}>
                <Text style={styles.actionBtnText}>
                  {req.status === 'matched'
                    ? 'Review Profile & Approve'
                    : req.status === 'completed'
                    ? 'Rate Visit'
                    : 'Track Visit / Details'}
                </Text>
                <Icon name="chevron-forward-outline" size={16} color={COLORS.secondary} />
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* History / Completed requests */}
        {completedRequests.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Completed History</Text>
            {completedRequests.map((req) => (
              <View key={req._id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyService}>{req.serviceType} visit</Text>
                  <Text style={styles.historyDate}>{req.date}</Text>
                </View>
                <Text style={styles.historySub}>
                  For: {req.elderlyId?.firstName} {req.elderlyId?.lastName} • Volunteer: {req.volunteerId?.firstName || 'N/A'}
                </Text>
                {req.rating && (
                  <View style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Icon
                        key={s}
                        name={s <= req.rating ? 'star' : 'star-outline'}
                        size={14}
                        color="#F59E0B"
                      />
                    ))}
                    {req.feedback ? (
                      <Text style={styles.feedbackQuote}>"{req.feedback}"</Text>
                    ) : null}
                  </View>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={[styles.fab, dependents.length === 0 && styles.fabDisabled]}
        onPress={() => {
          if (dependents.length === 0) {
            Alert.alert(
              'No Dependents Linked',
              'Please add at least one elderly dependent profile before requesting volunteer help.'
            );
          } else {
            onRequestHelp();
          }
        }}
      >
        <Icon name="hand-left-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={styles.fabText}>Request Help for Dependent</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: COLORS.textSecondary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  welcomeText: { fontSize: 14, color: COLORS.textSecondary },
  userName: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 },
  logoutText: { color: COLORS.danger, fontWeight: '600', fontSize: 12 },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginTop: 20, marginBottom: 12 },
  textLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  textLinkVal: { color: COLORS.secondary, fontWeight: '600', fontSize: 14 },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8 },
  emptyAddBtn: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 12,
  },
  emptyAddBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  dependentsSlider: { flexDirection: 'row', marginVertical: 5 },
  dependentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginRight: 12,
    width: 140,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  depName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  depAge: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  statusText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  requestDate: { fontSize: 12, color: COLORS.textSecondary },
  requestDetailTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 4 },
  requestDetailSub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 2 },
  volunteerMiniRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 5 },
  volunteerMiniText: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '500' },
  sosAlertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger,
    borderRadius: 6,
    padding: 6,
    marginTop: 8,
    gap: 6,
  },
  sosAlertText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  actionBtnText: { color: COLORS.secondary, fontSize: 13, fontWeight: '700' },
  historyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  historyService: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  historyDate: { fontSize: 12, color: COLORS.textSecondary },
  historySub: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  feedbackQuote: { fontSize: 12, fontStyle: 'italic', color: COLORS.textSecondary, marginLeft: 6, flex: 1 },
  fab: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: COLORS.secondary,
    borderRadius: 25,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabDisabled: { backgroundColor: '#94A3B8' },
  fabText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
});
