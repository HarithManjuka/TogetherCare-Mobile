// src/screens/caregiver/CaregiverDashboardHome.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { COLORS } from '../../constants/theme';
import * as emergencyService from '../../services/emergencyService';
import * as notificationService from '../../services/notificationService';
import * as caregiverService from '../../services/caregiverService';
import NotificationsModal from '../../components/common/NotificationsModal';

export default function CaregiverDashboardHome({
  onAddDependent,
  onRequestHelp,
  onViewRequest,
  onViewProfile,
  onManageDependents,
  onViewUpcomingVisits,
  onViewAssignments,
  onViewActivities,
  refreshTrigger,
}) {
  const { user } = useAuth();
  const [dependents, setDependents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeSOS, setActiveSOS] = useState(null);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Formal Caregiver stats
  const [availableAssignmentsCount, setAvailableAssignmentsCount] = useState(0);
  const [completedStats, setCompletedStats] = useState({ totalVisits: 0, totalHours: 0, averageRating: 5.0 });

  // Selected senior filter for family member
  const [selectedSeniorId, setSelectedSeniorId] = useState('ALL');

  const isFamilyMember = user?.caregiverType === 'family_member';
  const isFormalCaregiver = user?.caregiverType === 'formal_caregiver';

  const fetchData = async () => {
    try {
      const promises = [
        client.get('/caregiver/dependents'),
        client.get('/help-requests'),
        emergencyService.getActiveSOS(),
        notificationService.getUnreadCount(),
      ];

      if (isFormalCaregiver) {
        promises.push(caregiverService.getAvailableAssignments());
        promises.push(caregiverService.getCompletedVisits());
      }

      const [depRes, reqRes, sosRes, notifRes, assignRes, compRes] = await Promise.all(promises);

      if (depRes.data?.success) setDependents(depRes.data.data);
      if (reqRes.data?.success) setRequests(reqRes.data.data);
      if (sosRes?.data) setActiveSOS(sosRes.data);
      else setActiveSOS(null);
      if (notifRes?.unreadCount !== undefined) setUnreadNotifCount(notifRes.unreadCount);

      if (assignRes?.success) setAvailableAssignmentsCount(assignRes.count || 0);
      if (compRes?.success && compRes.stats) setCompletedStats(compRes.stats);
    } catch (error) {
      console.error('Fetch Caregiver Data Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll for active SOS alerts and notifications every 8 seconds
    const interval = setInterval(() => {
      emergencyService.getActiveSOS().then((res) => {
        if (res?.data) setActiveSOS(res.data);
        else setActiveSOS(null);
      }).catch(() => {});

      notificationService.getUnreadCount().then((res) => {
        if (res?.unreadCount !== undefined) setUnreadNotifCount(res.unreadCount);
      }).catch(() => {});
    }, 8000);

    return () => clearInterval(interval);
  }, [refreshTrigger, isFormalCaregiver]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCallSeniorOrContact = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {
        Alert.alert('Calling', `Dialing ${phone}...`);
      });
    }
  };

  const handleResolveSOS = async (alertId) => {
    Alert.alert(
      'Resolve Emergency Alert',
      'Are you sure you want to mark this emergency alert as resolved? Confirm only if the senior is safe.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Resolved',
          style: 'default',
          onPress: async () => {
            try {
              await emergencyService.resolveSOS(alertId, 'Resolved by caregiver/family member');
              setActiveSOS(null);
              Alert.alert('Alert Resolved', 'The senior has been marked safe.');
            } catch (err) {
              console.error('Resolve SOS Error:', err);
              Alert.alert('Error', 'Could not resolve SOS alert.');
            }
          },
        },
      ]
    );
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'searching': return '#F59E0B';
      case 'matched': return '#D97706';
      case 'confirmed': return '#2563EB';
      case 'ongoing': return '#0D9488';
      case 'arrived': return '#16A34A';
      case 'completed': return '#64748B';
      case 'cancelled': return COLORS.danger;
      default: return '#94A3B8';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'searching': return 'Searching Volunteer';
      case 'matched': return '⏳ Awaiting Volunteer Acceptance';
      case 'confirmed': return '✅ Visit Confirmed';
      case 'ongoing': return '🚗 Volunteer On The Way';
      case 'arrived': return '📍 Volunteer Arrived';
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

  // Filter requests by selected senior if family member
  const filteredRequests = requests.filter((r) => {
    if (selectedSeniorId === 'ALL') return true;
    return r.elderlyId?._id?.toString() === selectedSeniorId;
  });

  const activeRequests = filteredRequests.filter(
    (r) => r.status !== 'cancelled' && (r.status !== 'completed' || r.rating === null)
  );
  const completedRequests = filteredRequests.filter(
    (r) => r.status === 'cancelled' || (r.status === 'completed' && r.rating !== null)
  );

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileHeaderTouch} activeOpacity={0.8} onPress={onViewProfile}>
          <Icon name="person-circle-outline" size={38} color={COLORS.primary} style={{ marginRight: 8 }} />
          <View>
            <Text style={styles.welcomeText}>
              {isFamilyMember ? 'Family Member Profile' : isFormalCaregiver ? 'Formal Caregiver' : 'Welcome back,'}
            </Text>
            <Text style={styles.userName}>
              {user?.firstName} {user?.lastName || ''}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          {/* Notifications Bell */}
          <TouchableOpacity
            style={styles.notifBellBtn}
            onPress={() => setNotificationsVisible(true)}
          >
            <Icon name="notifications-outline" size={22} color={COLORS.primary} />
            {unreadNotifCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileBadgeBtn} onPress={onViewProfile} activeOpacity={0.8}>
            <Icon name="person-outline" size={15} color={COLORS.primary} />
            <Text style={styles.profileBadgeBtnText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.secondary]} />}
      >
        {/* Real-Time SOS Emergency Alert Banner (Sprint 2) */}
        {activeSOS && (
          <View style={styles.sosAlertBanner}>
            <View style={styles.sosBannerHeader}>
              <View style={styles.sosPulseDot} />
              <Text style={styles.sosBannerTitle}>🚨 EMERGENCY SOS ACTIVE!</Text>
            </View>
            <Text style={styles.sosBannerMessage}>
              Senior: <Text style={{ fontWeight: 'bold' }}>{activeSOS.user?.firstName} {activeSOS.user?.lastName}</Text> triggered an emergency alert.
            </Text>
            <Text style={styles.sosBannerLocation}>
              📍 {activeSOS.location || activeSOS.user?.address?.streetAddress || 'Location reported'}
            </Text>
            <View style={styles.sosActionRow}>
              <TouchableOpacity
                style={styles.sosCallBtn}
                onPress={() => handleCallSeniorOrContact(activeSOS.user?.phone || activeSOS.emergencyContact?.phone)}
              >
                <Icon name="call" size={16} color="#FFFFFF" />
                <Text style={styles.sosCallBtnText}>Call Senior ({activeSOS.user?.phone})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sosResolveBtn}
                onPress={() => handleResolveSOS(activeSOS._id)}
              >
                <Text style={styles.sosResolveBtnText}>Mark Resolved</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* FORMAL CAREGIVER SECTION (Sprint 1, 3 & US-402)               */}
        {/* ------------------------------------------------------------- */}
        {isFormalCaregiver && (
          <View style={styles.caregiverSection}>
            {/* Quick stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{availableAssignmentsCount}</Text>
                <Text style={styles.statLabel}>Available Tasks</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{completedStats.totalVisits}</Text>
                <Text style={styles.statLabel}>Visits Done</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{completedStats.totalHours} hrs</Text>
                <Text style={styles.statLabel}>Care Hours</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>⭐ {completedStats.averageRating || '5.0'}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>

            {/* Available Care Assignments Banner (Sprint 3 & US-402) */}
            <TouchableOpacity
              style={styles.assignmentHeroCard}
              activeOpacity={0.85}
              onPress={onViewAssignments}
            >
              <View style={styles.assignmentHeroContent}>
                <View style={styles.assignmentIconCircle}>
                  <Icon name="briefcase" size={24} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.assignmentHeroTitle}>Browse Care Assignments</Text>
                  <Text style={styles.assignmentHeroSub}>
                    {availableAssignmentsCount} seniors needing care assistance • Conflict prevention active
                  </Text>
                </View>
                <Icon name="chevron-forward" size={20} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* FAMILY MEMBER SECTION (Sprint 1, 2, 3, 4)                     */}
        {/* ------------------------------------------------------------- */}
        {isFamilyMember && (
          <View style={styles.familySection}>
            {/* Senior Dependents List & Management */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Elderly Dependents ({dependents.length})</Text>
              <TouchableOpacity onPress={onManageDependents} style={styles.textLink}>
                <Icon name="settings-outline" size={15} color={COLORS.secondary} />
                <Text style={styles.textLinkVal}>Manage</Text>
              </TouchableOpacity>
            </View>

            {dependents.length === 0 ? (
              <View style={styles.emptyCard}>
                <Icon name="people-outline" size={36} color="#94A3B8" />
                <Text style={styles.emptyText}>No elderly dependents linked yet.</Text>
                <TouchableOpacity style={styles.emptyAddBtn} onPress={onAddDependent}>
                  <Text style={styles.emptyAddBtnText}>Add Senior Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dependentsSlider}>
                  {dependents.map((dep) => (
                    <TouchableOpacity
                      key={dep._id}
                      style={[
                        styles.dependentCard,
                        selectedSeniorId === dep._id && styles.dependentCardActive,
                      ]}
                      onPress={() =>
                        setSelectedSeniorId((prev) => (prev === dep._id ? 'ALL' : dep._id))
                      }
                      activeOpacity={0.8}
                    >
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {dep.firstName[0]}{dep.lastName ? dep.lastName[0] : ''}
                        </Text>
                      </View>
                      <Text style={styles.depName}>{dep.firstName} {dep.lastName || ''}</Text>
                      <Text style={styles.depAge}>{dep.age || 'N/A'} Yrs • {dep.address?.city}</Text>
                      {selectedSeniorId === dep._id && (
                        <View style={styles.selectedSeniorBadge}>
                          <Text style={styles.selectedSeniorBadgeText}>Selected</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Quick Action Navigation Grid for Family Member */}
                <View style={styles.familyActionGrid}>
                  <TouchableOpacity
                    style={styles.familyActionCard}
                    onPress={onViewUpcomingVisits}
                  >
                    <Icon name="calendar-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.familyActionTitle}>Upcoming Visits</Text>
                    <Text style={styles.familyActionSub}>US-404 Schedule</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.familyActionCard}
                    onPress={() => {
                      const senior = dependents.find((d) => d._id === selectedSeniorId) || dependents[0];
                      if (onViewActivities) onViewActivities(senior);
                    }}
                  >
                    <Icon name="walk-outline" size={20} color={COLORS.secondary} />
                    <Text style={styles.familyActionTitle}>Tasks & Activities</Text>
                    <Text style={styles.familyActionSub}>Sprint 3 Monitor</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.familyActionCard}
                    onPress={onAddDependent}
                  >
                    <Icon name="person-add-outline" size={20} color="#0D9488" />
                    <Text style={styles.familyActionTitle}>Add Senior</Text>
                    <Text style={styles.familyActionSub}>Multiple Seniors</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}

        {/* Active Help Requests & Visits */}
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

              {/* Status Explanation Callouts */}
              {req.status === 'matched' && (
                <View style={styles.statusCalloutMatched}>
                  <Icon name="time-outline" size={16} color="#B45309" />
                  <Text style={styles.statusCalloutTextMatched}>
                    Visit request sent to {req.volunteerId?.firstName || 'volunteer'}. Awaiting their acceptance.
                  </Text>
                </View>
              )}

              {req.status === 'confirmed' && (
                <View style={styles.statusCalloutConfirmed}>
                  <Icon name="checkmark-circle-outline" size={16} color="#15803D" />
                  <Text style={styles.statusCalloutTextConfirmed}>
                    Accepted by {req.volunteerId?.firstName || 'volunteer'}! Scheduled for {req.date} at {req.time}.
                  </Text>
                </View>
              )}

              {req.status === 'ongoing' && (
                <View style={styles.statusCalloutOngoing}>
                  <Icon name="navigate-outline" size={16} color="#0F766E" />
                  <Text style={styles.statusCalloutTextOngoing}>
                    {req.volunteerId?.firstName || 'Volunteer'} is on the way! Tap below to track live arrival.
                  </Text>
                </View>
              )}

              {req.status === 'arrived' && (
                <View style={styles.statusCalloutArrived}>
                  <Icon name="location-outline" size={16} color="#7E22CE" />
                  <Text style={styles.statusCalloutTextArrived}>
                    {req.volunteerId?.firstName || 'Volunteer'} has arrived at the destination.
                  </Text>
                </View>
              )}

              {req.status === 'searching' && (
                <View style={styles.statusCalloutSearching}>
                  <Icon name="search-outline" size={16} color="#2563EB" />
                  <Text style={styles.statusCalloutTextSearching}>
                    Request created. Tap below to select an available volunteer.
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
                  {req.status === 'searching'
                    ? 'Select a Volunteer'
                    : req.status === 'matched'
                    ? 'View Request & Status'
                    : req.status === 'confirmed'
                    ? 'View Confirmed Visit'
                    : req.status === 'ongoing'
                    ? 'Track Live Directions 📍'
                    : req.status === 'arrived'
                    ? 'Volunteer Arrived · View Details'
                    : req.status === 'completed'
                    ? 'Rate Visit'
                    : 'View Details'}
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

      {/* Floating Action Button for Family Member */}
      {isFamilyMember && (
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
      )}

      {/* Real-time Notifications Modal */}
      <NotificationsModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        onNotificationAction={(notif) => {
          setNotificationsVisible(false);
          if (notif.type === 'sos_alert') {
            fetchData();
          }
        }}
      />
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
    backgroundColor: '#FFFFFF',
  },
  profileHeaderTouch: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notifBellBtn: {
    padding: 8,
    position: 'relative',
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
  },
  notifBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#DC2626',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  profileBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  profileBadgeBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  welcomeText: { fontSize: 12, color: COLORS.textSecondary },
  userName: { fontSize: 17, fontWeight: 'bold', color: COLORS.primary },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  // SOS Alert Banner
  sosAlertBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  sosBannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sosPulseDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#DC2626' },
  sosBannerTitle: { fontSize: 15, fontWeight: 'bold', color: '#DC2626' },
  sosBannerMessage: { fontSize: 13, color: '#334155', marginTop: 2 },
  sosBannerLocation: { fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 10 },
  sosActionRow: { flexDirection: 'row', gap: 8 },
  sosCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  sosCallBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  sosResolveBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DC2626',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  sosResolveBtnText: { color: '#DC2626', fontWeight: 'bold', fontSize: 12 },
  // Caregiver Section
  caregiverSection: { marginTop: 14 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statNum: { fontSize: 15, fontWeight: 'bold', color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  assignmentHeroCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 16,
    marginBottom: 14,
  },
  assignmentHeroContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  assignmentIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignmentHeroTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.primary },
  assignmentHeroSub: { fontSize: 12, color: '#475569', marginTop: 2 },
  // Family Section
  familySection: { marginTop: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.primary, marginTop: 16, marginBottom: 12 },
  textLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  textLinkVal: { color: COLORS.secondary, fontWeight: '700', fontSize: 13 },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
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
  dependentsSlider: { flexDirection: 'row', marginVertical: 4 },
  dependentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginRight: 10,
    width: 140,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dependentCardActive: { borderColor: COLORS.primary, borderWidth: 2, backgroundColor: '#EFF6FF' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  depName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  depAge: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  selectedSeniorBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 6,
  },
  selectedSeniorBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  familyActionGrid: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 14 },
  familyActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  familyActionTitle: { fontSize: 12, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: 4 },
  familyActionSub: { fontSize: 10, color: COLORS.textSecondary, marginTop: 1 },
  // Requests
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
  // Status callout banners
  statusCalloutMatched: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  statusCalloutTextMatched: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
  },
  statusCalloutConfirmed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  statusCalloutTextConfirmed: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
    flex: 1,
  },
  statusCalloutOngoing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#CCFBF1',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  statusCalloutTextOngoing: {
    fontSize: 12,
    color: '#115E59',
    fontWeight: '600',
    flex: 1,
  },
  statusCalloutArrived: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  statusCalloutTextArrived: {
    fontSize: 12,
    color: '#6B21A8',
    fontWeight: '600',
    flex: 1,
  },
  statusCalloutSearching: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  statusCalloutTextSearching: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600',
    flex: 1,
  },
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
