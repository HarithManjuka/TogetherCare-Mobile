// src/screens/volunteer/VolunteerScheduleScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as volunteerService from '../../services/volunteerService';

export default function VolunteerScheduleScreen({ onNavigateTab }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await volunteerService.getMySchedule();
      if (res?.success) {
        setSchedule(res.data || []);
      }
    } catch (error) {
      console.error('Fetch schedule error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedule();
  };

  const handleAcceptDirectRequest = async (visit) => {
    const id = visit._id || visit.id;
    try {
      setActionLoadingId(id);
      setSchedule((prev) =>
        prev.map((s) => ((s._id || s.id) === id ? { ...s, status: 'confirmed', isDirectRequest: false } : s))
      );
      const res = await volunteerService.acceptDirectRequest(id);
      if (res?.success) {
        Alert.alert('🎉 Request Accepted!', `You have confirmed this visit for ${visit.elderName}. It is now scheduled.`);
        fetchSchedule();
      }
    } catch (err) {
      fetchSchedule();
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to accept request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineDirectRequest = async (visit) => {
    const id = visit._id || visit.id;
    try {
      setActionLoadingId(id);
      setSchedule((prev) => prev.filter((s) => (s._id || s.id) !== id));
      const res = await volunteerService.declineDirectRequest(id);
      if (res?.success) {
        Alert.alert('Request Declined', 'The visit request has been declined.');
        fetchSchedule();
      }
    } catch (err) {
      fetchSchedule();
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to decline request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStartTrip = (visit) => {
    const id = visit._id || visit.id;
    Alert.alert(
      '📍 Share Live Location?',
      `Would you like to start your trip now? This will share your live arrival directions with ${visit.elderName}'s family member until you arrive.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Start Trip & Share Location',
          onPress: async () => {
            try {
              setActionLoadingId(id);
              const res = await volunteerService.startTrip(id);
              if (res?.success) {
                Alert.alert('🚗 Trip Started!', 'Live location sharing is now active. The family member can track your arrival.');
                fetchSchedule();
              }
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to start trip');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const handleMarkArrived = async (visit) => {
    const id = visit._id || visit.id;
    try {
      setActionLoadingId(id);
      const res = await volunteerService.updateTaskStatus(id, 'arrived');
      if (res?.success) {
        Alert.alert('📍 Marked as Arrived', 'The elder and caregiver have been notified that you have reached the location.');
        fetchSchedule();
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to update status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCompleteVisit = (visit) => {
    const id = visit._id || visit.id;
    Alert.alert(
      '✅ Complete Visit',
      `Are you sure you have completed the ${visit.serviceType} visit for ${visit.elderName}? This will log your volunteer hours.`,
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Yes, Complete',
          onPress: async () => {
            try {
              setActionLoadingId(id);
              const res = await volunteerService.updateTaskStatus(id, 'completed');
              if (res?.success) {
                Alert.alert('🎉 Great Job!', 'Visit completed and your volunteer hours have been logged successfully!');
                fetchSchedule();
              }
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to complete visit');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const handleCallElder = (phone) => {
    if (!phone) {
      Alert.alert('No Phone', 'No phone number is registered for this resident.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Unable to open telephone dialer.');
    });
  };

  const handleOpenMaps = (address) => {
    const query = encodeURIComponent(address || 'Colombo, Sri Lanka');
    const url =
      Platform.OS === 'ios'
        ? `maps:0,0?q=${query}`
        : `https://www.google.com/maps/search/?api=1&query=${query}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) return Linking.openURL(url);
        return Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
      })
      .catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
      });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>My Volunteer Schedule</Text>
        <Text style={styles.headerSub}>Manage your upcoming confirmed support visits and time slots</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollPadding}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E3A8A']} />
        }
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#1E40AF" />
            <Text style={styles.loadingText}>Loading your schedule...</Text>
          </View>
        ) : schedule.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Scheduled Visits</Text>
            <Text style={styles.emptySub}>
              You do not have any upcoming visits booked. Accept requests from the community to fill your schedule!
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => onNavigateTab && onNavigateTab('request')}
            >
              <Text style={styles.browseBtnText}>Browse Available Requests</Text>
            </TouchableOpacity>
          </View>
        ) : (
          schedule.map((visit) => {
            const visitKey = visit._id || visit.id;
            const isMatched = visit.status === 'matched';
            const isConfirmed = visit.status === 'confirmed';
            const isOngoing = visit.status === 'ongoing';
            const isArrived = visit.status === 'arrived';
            const isActionLoading = actionLoadingId === visitKey;

            return (
              <View
                key={visitKey}
                style={[
                  styles.visitCard,
                  isMatched && styles.matchedCard,
                  isOngoing && styles.ongoingCard,
                ]}
              >
                <View style={styles.visitHeader}>
                  <Ionicons name="calendar-outline" size={18} color="#1E40AF" style={{ marginRight: 6 }} />
                  <Text style={styles.visitDate}>
                    {visit.date} · {visit.time}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      isMatched
                        ? styles.matchedBadge
                        : isOngoing
                        ? styles.ongoingBadge
                        : isArrived
                        ? styles.arrivedBadge
                        : styles.confirmedBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isMatched
                          ? styles.matchedBadgeText
                          : isOngoing
                          ? styles.ongoingBadgeText
                          : isArrived
                          ? styles.arrivedBadgeText
                          : styles.confirmedBadgeText,
                      ]}
                    >
                      {isMatched
                        ? 'REQUESTED'
                        : isOngoing
                        ? 'ON THE WAY'
                        : isArrived
                        ? 'ARRIVED'
                        : 'CONFIRMED'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.serviceTitle}>{visit.serviceType}</Text>
                <Text style={styles.elderName}>Elderly Dependent: {visit.elderName}</Text>
                {visit.caregiverName ? (
                  <Text style={styles.caregiverText}>Family Member: {visit.caregiverName}</Text>
                ) : null}
                <Text style={styles.locationText}>📍 {visit.location}</Text>

                {visit.notes ? (
                  <Text style={styles.notesText}>Note: {visit.notes}</Text>
                ) : null}

                {/* Interactive Workflow Actions */}
                <View style={styles.actionsRow}>
                  {visit.elderPhone ? (
                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() => handleCallElder(visit.elderPhone)}
                    >
                      <Ionicons name="call" size={15} color="#1E40AF" />
                      <Text style={styles.callBtnText}>Call</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={styles.mapBtn}
                    onPress={() => handleOpenMaps(visit.location)}
                  >
                    <Ionicons name="map-outline" size={15} color="#1E40AF" />
                    <Text style={styles.mapBtnText}>Map</Text>
                  </TouchableOpacity>

                  {isMatched ? (
                    <>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.declineBtn, isActionLoading && { opacity: 0.7 }]}
                        onPress={() => handleDeclineDirectRequest(visit)}
                        disabled={isActionLoading}
                      >
                        <Ionicons name="close-circle-outline" size={15} color="#EF4444" style={{ marginRight: 4 }} />
                        <Text style={styles.declineBtnText}>Decline</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, styles.acceptBtn, isActionLoading && { opacity: 0.7 }]}
                        onPress={() => handleAcceptDirectRequest(visit)}
                        disabled={isActionLoading}
                      >
                        {isActionLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle-outline" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
                            <Text style={styles.acceptBtnText}>Accept</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </>
                  ) : isConfirmed ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.startTripBtn, isActionLoading && { opacity: 0.7 }]}
                      onPress={() => handleStartTrip(visit)}
                      disabled={isActionLoading}
                    >
                      {isActionLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="navigate-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.startTripBtnText}>Start Trip & Share</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : isOngoing ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.arrivedBtn, isActionLoading && { opacity: 0.7 }]}
                      onPress={() => handleMarkArrived(visit)}
                      disabled={isActionLoading}
                    >
                      {isActionLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-done-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.arrivedBtnText}>Mark Arrived</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.completeBtn, isActionLoading && { opacity: 0.7 }]}
                      onPress={() => handleCompleteVisit(visit)}
                      disabled={isActionLoading}
                    >
                      {isActionLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.completeBtnText}>Complete Visit</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  container: {
    flex: 1,
  },
  scrollPadding: {
    padding: 16,
    paddingBottom: 30,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  browseBtn: {
    marginTop: 18,
    backgroundColor: '#1E40AF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  browseBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  visitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  visitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  visitDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  confirmedBadge: {
    backgroundColor: '#EFF6FF',
  },
  arrivedBadge: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  confirmedBadgeText: {
    color: '#1D4ED8',
  },
  arrivedBadgeText: {
    color: '#D97706',
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  elderName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
  },
  notesText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#64748B',
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    gap: 4,
  },
  callBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 4,
  },
  mapBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
  },
  arrivedBtn: {
    backgroundColor: '#D97706',
  },
  arrivedBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  completeBtn: {
    backgroundColor: '#16A34A',
  },
  completeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  matchedCard: {
    borderColor: '#FCD34D',
    borderWidth: 1.5,
    backgroundColor: '#FFFBEB',
  },
  ongoingCard: {
    borderColor: '#86EFAC',
    borderWidth: 1.5,
    backgroundColor: '#F0FDF4',
  },
  matchedBadge: {
    backgroundColor: '#FEF3C7',
  },
  matchedBadgeText: {
    color: '#D97706',
  },
  ongoingBadge: {
    backgroundColor: '#DCFCE7',
  },
  ongoingBadgeText: {
    color: '#16A34A',
  },
  caregiverText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '600',
    marginBottom: 2,
  },
  acceptBtn: {
    backgroundColor: '#16A34A',
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  declineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  declineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  startTripBtn: {
    backgroundColor: '#2563EB',
  },
  startTripBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
