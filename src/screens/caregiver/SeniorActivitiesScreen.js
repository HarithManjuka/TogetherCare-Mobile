// src/screens/caregiver/SeniorActivitiesScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../constants/theme';
import * as dependentService from '../../services/dependentService';

export default function SeniorActivitiesScreen({ senior, onBack, onRequestHelp }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivities = async () => {
    try {
      if (!senior?._id) return;
      const res = await dependentService.getDependentActivities(senior._id);
      if (res?.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Fetch Senior Activities Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [senior?._id]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  const companionshipRequests = data?.companionshipRequests || [];
  const helpRequests = data?.helpRequests || [];
  const interests = data?.interests || [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {senior?.firstName}'s Activities
        </Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
          <Icon name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.secondary]} />}
      >
        {/* Senior Profile Banner */}
        <View style={styles.profileBanner}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {senior?.firstName?.[0]}
              {senior?.lastName?.[0] || ''}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.seniorName}>
              {senior?.firstName} {senior?.lastName || ''}
            </Text>
            <Text style={styles.seniorSub}>
              ID: {senior?.customId} • {senior?.age || 'N/A'} yrs • {senior?.address?.city}
            </Text>
            <Text style={styles.seniorPhone}>📞 {senior?.phone}</Text>
          </View>
        </View>

        {/* Interests & Hobbies Section */}
        {interests.length > 0 && (
          <View style={styles.interestsCard}>
            <Text style={styles.cardTitle}>Interests & Hobbies</Text>
            <View style={styles.interestsRow}>
              {interests.map((interest, idx) => (
                <View key={idx} style={styles.interestChip}>
                  <Icon name="heart" size={13} color="#EF4444" style={{ marginRight: 4 }} />
                  <Text style={styles.interestChipText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.secondary} />
            <Text style={styles.loadingText}>Loading activities & visits...</Text>
          </View>
        ) : (
          <>
            {/* Scheduled Companionship Visits */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Companionship & Social Visits</Text>
              <Text style={styles.sectionCount}>({companionshipRequests.length})</Text>
            </View>

            {companionshipRequests.length === 0 ? (
              <View style={styles.emptyCard}>
                <Icon name="chatbubbles-outline" size={36} color="#94A3B8" />
                <Text style={styles.emptyText}>No companionship visits scheduled</Text>
              </View>
            ) : (
              companionshipRequests.map((req) => (
                <View key={req._id} style={styles.activityCard}>
                  <View style={styles.activityHeader}>
                    <View style={styles.activityTypeBadge}>
                      <Icon name="walk-outline" size={14} color={COLORS.primary} />
                      <Text style={styles.activityTypeText}>{req.activityType}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        req.status === 'accepted'
                          ? { backgroundColor: '#DCFCE7' }
                          : req.status === 'completed'
                          ? { backgroundColor: '#F1F5F9' }
                          : { backgroundColor: '#FEF3C7' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          req.status === 'accepted'
                            ? { color: '#16A34A' }
                            : req.status === 'completed'
                            ? { color: '#64748B' }
                            : { color: '#D97706' },
                        ]}
                      >
                        {req.status === 'accepted' ? 'Accepted' : req.status === 'completed' ? 'Completed' : 'Pending'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.activityDate}>
                    📅 {new Date(req.scheduledDate).toLocaleDateString()} at {req.startTime || req.timeSlot}
                  </Text>
                  <Text style={styles.activityLocation}>
                    📍 {req.location || 'Home Address'}
                  </Text>

                  {req.volunteer && (
                    <View style={styles.volunteerMiniRow}>
                      <Icon name="person-circle-outline" size={16} color={COLORS.secondary} />
                      <Text style={styles.volunteerMiniText}>
                        Companion: {req.volunteer.firstName} {req.volunteer.lastName || ''} ({req.volunteer.phone})
                      </Text>
                    </View>
                  )}

                  {req.notes ? (
                    <Text style={styles.activityNotes}>"{req.notes}"</Text>
                  ) : null}
                </View>
              ))
            )}

            {/* Help Requests (Groceries, Medicine, Errands) */}
            <View style={[styles.sectionHeader, { marginTop: 20 }]}>
              <Text style={styles.sectionTitle}>Help & Assistance Requests</Text>
              <Text style={styles.sectionCount}>({helpRequests.length})</Text>
            </View>

            {helpRequests.length === 0 ? (
              <View style={styles.emptyCard}>
                <Icon name="basket-outline" size={36} color="#94A3B8" />
                <Text style={styles.emptyText}>No help requests recorded</Text>
              </View>
            ) : (
              helpRequests.map((hr) => (
                <View key={hr._id} style={styles.activityCard}>
                  <View style={styles.activityHeader}>
                    <View style={[styles.activityTypeBadge, { backgroundColor: '#EFF6FF' }]}>
                      <Icon name="bag-handle-outline" size={14} color="#2563EB" />
                      <Text style={[styles.activityTypeText, { color: '#2563EB' }]}>{hr.serviceType}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: '#EFF6FF' }]}>
                      <Text style={[styles.statusBadgeText, { color: '#2563EB' }]}>{hr.status}</Text>
                    </View>
                  </View>

                  <Text style={styles.activityDate}>📅 {hr.date} at {hr.time}</Text>
                  <Text style={styles.activityLocation}>📍 {hr.location}</Text>

                  {hr.volunteerId && (
                    <View style={styles.volunteerMiniRow}>
                      <Icon name="person-circle-outline" size={16} color={COLORS.secondary} />
                      <Text style={styles.volunteerMiniText}>
                        Volunteer: {hr.volunteerId.firstName} {hr.volunteerId.lastName || ''}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  refreshBtn: { padding: 6 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  profileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 },
  seniorName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  seniorSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  seniorPhone: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  interestsCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  cardTitle: { fontSize: 13, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 8 },
  interestsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  interestChipText: { fontSize: 12, fontWeight: '600', color: '#BE123C' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.primary },
  sectionCount: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 14, color: COLORS.textSecondary },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: { color: COLORS.textSecondary, fontSize: 13, marginTop: 8 },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activityTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activityTypeText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  activityDate: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginTop: 4 },
  activityLocation: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  volunteerMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  volunteerMiniText: { fontSize: 12, color: COLORS.textPrimary, fontWeight: '500' },
  activityNotes: { fontSize: 12, fontStyle: 'italic', color: COLORS.textSecondary, marginTop: 4 },
});
