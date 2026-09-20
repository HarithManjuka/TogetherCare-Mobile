// src/screens/caregiver/UpcomingVisitsScreen.js
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

export default function UpcomingVisitsScreen({
  onBack,
  onOpenChat,
  onTrackVisit,
}) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSeniorFilter, setSelectedSeniorFilter] = useState('ALL');

  const fetchVisits = async () => {
    try {
      const res = await dependentService.getUpcomingCareVisits();
      if (res?.success) {
        setVisits(res.data || []);
      }
    } catch (err) {
      console.error('Fetch Upcoming Visits Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVisits();
  };

  // Get unique seniors for filtering
  const seniors = Array.from(
    new Map(
      visits
        .filter((v) => v.senior && v.senior._id)
        .map((v) => [v.senior._id.toString(), v.senior])
    ).values()
  );

  const filteredVisits = visits.filter((v) => {
    if (selectedSeniorFilter === 'ALL') return true;
    return v.senior?._id?.toString() === selectedSeniorFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
      case 'accepted':
        return { label: 'Confirmed', bg: '#DCFCE7', color: '#16A34A' };
      case 'matched':
        return { label: 'Volunteer Found', bg: '#DBEAFE', color: '#2563EB' };
      case 'searching':
      case 'pending':
        return { label: 'Searching Volunteer', bg: '#FEF3C7', color: '#D97706' };
      case 'arrived':
        return { label: 'Volunteer Arrived', bg: '#F3E8FF', color: '#7E22CE' };
      default:
        return { label: status, bg: '#F1F5F9', color: '#64748B' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upcoming Care Visits</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
          <Icon name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Senior Filter Bar */}
      {seniors.length > 1 && (
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterChip, selectedSeniorFilter === 'ALL' && styles.filterChipActive]}
              onPress={() => setSelectedSeniorFilter('ALL')}
            >
              <Text style={[styles.filterChipText, selectedSeniorFilter === 'ALL' && styles.filterChipTextActive]}>
                All Seniors ({visits.length})
              </Text>
            </TouchableOpacity>
            {seniors.map((s) => (
              <TouchableOpacity
                key={s._id}
                style={[styles.filterChip, selectedSeniorFilter === s._id.toString() && styles.filterChipActive]}
                onPress={() => setSelectedSeniorFilter(s._id.toString())}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedSeniorFilter === s._id.toString() && styles.filterChipTextActive,
                  ]}
                >
                  {s.firstName} {s.lastName || ''}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.secondary]} />}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.secondary} />
            <Text style={styles.loadingText}>Loading care visits...</Text>
          </View>
        ) : filteredVisits.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="calendar-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Upcoming Care Visits</Text>
            <Text style={styles.emptyDesc}>
              There are no active or scheduled care visits for your seniors right now.
            </Text>
          </View>
        ) : (
          filteredVisits.map((visit) => {
            const statusInfo = getStatusBadge(visit.status);
            const volunteer = visit.volunteer;
            const senior = visit.senior;

            return (
              <View key={visit.id} style={styles.visitCard}>
                {/* Card Top */}
                <View style={styles.cardHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                      {statusInfo.label}
                    </Text>
                  </View>
                  <Text style={styles.visitDate}>
                    {visit.date} • {visit.time}
                  </Text>
                </View>

                {/* Visit Details */}
                <Text style={styles.serviceTitle}>{visit.serviceType} Visit</Text>
                <Text style={styles.seniorText}>
                  For: <Text style={{ fontWeight: 'bold' }}>{senior?.firstName} {senior?.lastName}</Text> ({senior?.address?.city})
                </Text>
                <Text style={styles.locationText}>
                  📍 Location: {visit.location || 'Home Address'}
                </Text>

                {/* Volunteer / Caregiver info if assigned */}
                {volunteer && (
                  <View style={styles.volunteerRow}>
                    <View style={styles.volunteerAvatar}>
                      <Text style={styles.volunteerAvatarText}>
                        {volunteer.firstName?.[0]}
                        {volunteer.lastName?.[0] || ''}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={styles.volunteerName}>
                          {volunteer.firstName} {volunteer.lastName || ''}
                        </Text>
                        {volunteer.verificationBadgeStatus === 'verified' && (
                          <Icon name="shield-checkmark" size={14} color={COLORS.success} />
                        )}
                      </View>
                      <Text style={styles.volunteerPhone}>{volunteer.phone}</Text>
                    </View>

                    {/* Chat shortcut button */}
                    <TouchableOpacity
                      style={styles.chatBtn}
                      onPress={() => onOpenChat && onOpenChat(volunteer, senior)}
                    >
                      <Icon name="chatbubble-ellipses-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.chatBtnText}>Chat</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* SOS Alert Banner if active */}
                {visit.sosTriggered && (
                  <View style={styles.sosWarningRow}>
                    <Icon name="warning" size={16} color="#FFFFFF" />
                    <Text style={styles.sosWarningText}>🚨 EMERGENCY SOS ACTIVE FOR THIS VISIT</Text>
                  </View>
                )}

                {/* Card Actions */}
                {(visit.status === 'confirmed' || visit.status === 'arrived') && (
                  <TouchableOpacity
                    style={styles.trackBtn}
                    onPress={() => onTrackVisit && onTrackVisit(visit.id)}
                  >
                    <Text style={styles.trackBtnText}>Track Live Status</Text>
                    <Icon name="chevron-forward" size={16} color={COLORS.secondary} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })
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
  filterBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterScroll: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  filterChipText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  filterChipTextActive: { color: '#1E40AF', fontWeight: 'bold' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  loadingBox: { paddingVertical: 50, alignItems: 'center' },
  loadingText: { marginTop: 10, color: COLORS.textSecondary, fontSize: 14 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    padding: 36,
    alignItems: 'center',
    marginVertical: 30,
  },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  visitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  visitDate: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  serviceTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 4 },
  seniorText: { fontSize: 13, color: '#334155', marginBottom: 3 },
  locationText: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 10 },
  volunteerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  volunteerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volunteerAvatarText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  volunteerName: { fontSize: 13, fontWeight: 'bold', color: COLORS.textPrimary },
  volunteerPhone: { fontSize: 11, color: COLORS.textSecondary },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.secondary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  chatBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  sosWarningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    borderRadius: 6,
    padding: 8,
    marginTop: 10,
  },
  sosWarningText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 11 },
  trackBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  trackBtnText: { color: COLORS.secondary, fontSize: 13, fontWeight: '700' },
});
