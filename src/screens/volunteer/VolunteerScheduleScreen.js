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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as volunteerService from '../../services/volunteerService';
import { showAppAlert } from '../../utils/alert';
import {
  getVisitLiveStatus,
  getVisitTimeWindow,
  validateStartVisit,
} from '../../utils/scheduleTimeHelper';

export default function VolunteerScheduleScreen({ onNavigateTab, onStartChat }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Peer-to-Peer Communication State
  const [commModalVisit, setCommModalVisit] = useState(null);
  const [videoCallTarget, setVideoCallTarget] = useState(null);
  const [videoMuted, setVideoMuted] = useState(false);
  const [videoCamOff, setVideoCamOff] = useState(false);
  const [videoCallSeconds, setVideoCallSeconds] = useState(0);

  // Active Trip & Live Tracking State
  const [activeTripVisit, setActiveTripVisit] = useState(null);

  // Video call duration timer
  useEffect(() => {
    let interval = null;
    if (videoCallTarget) {
      setVideoCallSeconds(0);
      interval = setInterval(() => {
        setVideoCallSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setVideoCallSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [videoCallTarget]);

  const formatCallTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await volunteerService.getMySchedule();
      if (res?.success) {
        const list = res.data || [];
        setSchedule(list);
        setActiveTripVisit((current) => {
          if (!current) return null;
          const currentId = current._id || current.id;
          const updated = list.find((item) => (item._id || item.id) === currentId);
          if (updated) {
            if (updated.status === 'completed' || updated.status === 'cancelled') {
              return null;
            }
            return { ...current, ...updated };
          }
          return current;
        });
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
        showAppAlert('🎉 Request Accepted!', `You have confirmed this visit for ${visit.elderName}. It is now scheduled.`);
        fetchSchedule();
      }
    } catch (err) {
      fetchSchedule();
      showAppAlert('Error', err.response?.data?.message || err.message || 'Failed to accept request');
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
        showAppAlert('Request Declined', 'The visit request has been declined.');
        fetchSchedule();
      }
    } catch (err) {
      fetchSchedule();
      showAppAlert('Error', err.response?.data?.message || err.message || 'Failed to decline request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmAndStartTrip = (visit) => {
    const id = visit._id || visit.id;
    showAppAlert(
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
                showAppAlert('🚗 Trip Started!', 'Live location sharing is now active. The family member can track your arrival.');
                setActiveTripVisit(visit);
                fetchSchedule();
              }
            } catch (err) {
              showAppAlert('Error', err.response?.data?.message || err.message || 'Failed to start trip');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const handleStartTrip = (visit) => {
    const validation = validateStartVisit(visit);

    if (!validation.allowed) {
      showAppAlert(
        '⏰ Scheduled Time Window',
        `${validation.reason}\n\nWould you like to start the trip now for early dispatch / demonstration?`,
        [
          { text: 'Wait for Schedule', style: 'cancel' },
          {
            text: 'Yes, Start Early',
            onPress: () => confirmAndStartTrip(visit),
          },
        ]
      );
      return;
    }

    confirmAndStartTrip(visit);
  };

  const handleMarkArrived = async (visit) => {
    const id = visit._id || visit.id;
    try {
      setActionLoadingId(id);
      const res = await volunteerService.updateTaskStatus(id, 'arrived');
      if (res?.success) {
        showAppAlert('📍 Marked as Arrived', 'The elder and caregiver have been notified that you have reached the location.');
        if (activeTripVisit && ((activeTripVisit._id || activeTripVisit.id) === id)) {
          setActiveTripVisit((prev) => (prev ? { ...prev, status: 'arrived' } : null));
        }
        fetchSchedule();
      }
    } catch (err) {
      showAppAlert('Error', err.response?.data?.message || err.message || 'Failed to update status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCompleteVisit = (visit) => {
    const id = visit._id || visit.id;
    showAppAlert(
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
                showAppAlert(
                  '🎉 Great Job!',
                  'Visit completed and your volunteer hours have been logged successfully!',
                  [
                    { text: 'Stay Here', onPress: () => fetchSchedule() },
                    {
                      text: 'View in History',
                      onPress: () => {
                        fetchSchedule();
                        if (onNavigateTab) onNavigateTab('history');
                      },
                    },
                  ]
                );
                setActiveTripVisit(null);
                fetchSchedule();
              }
            } catch (err) {
              showAppAlert('Error', err.response?.data?.message || err.message || 'Failed to complete visit');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const handleOpenPeerConnect = (visit) => {
    setCommModalVisit(visit);
  };

  const handleCallElder = (phone) => {
    if (!phone) {
      showAppAlert('No Phone', 'No phone number is registered for this resident.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      showAppAlert('Error', 'Unable to open telephone dialer.');
    });
  };

  const handleChatElder = (visit) => {
    setCommModalVisit(null);
    if (!visit) return;
    const elderUserId = visit.elderlyId || visit.elderId || visit._id || visit.id;
    if (onStartChat) {
      onStartChat({
        _id: elderUserId,
        id: elderUserId,
        firstName: visit.elderName || 'Resident',
        lastName: '',
        name: visit.elderName || 'Resident',
        phone: visit.elderPhone || '',
        role: 'elderly',
      });
    } else if (onNavigateTab) {
      onNavigateTab('messages');
    } else if (visit.elderPhone) {
      const cleanPhone = visit.elderPhone.replace(/[^0-9+]/g, '');
      Linking.openURL(`sms:${cleanPhone}`).catch(() => {
        showAppAlert('Notice', 'Unable to launch messaging.');
      });
    }
  };

  const handleStartVideoCall = (visit) => {
    setCommModalVisit(null);
    if (!visit) return;
    setVideoCallTarget({
      name: visit.elderName || 'Elderly Resident',
      phone: visit.elderPhone || '',
      activity: visit.serviceType || 'Companionship Session',
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
        <View style={styles.headerTitleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>My Volunteer Schedule</Text>
            <Text style={styles.headerSub}>Manage your upcoming confirmed support visits and time slots</Text>
          </View>
          <TouchableOpacity
            style={styles.historyShortcutBtn}
            onPress={() => onNavigateTab && onNavigateTab('history')}
            activeOpacity={0.8}
          >
            <Ionicons name="time-outline" size={15} color="#1E40AF" />
            <Text style={styles.historyShortcutBtnText}>History</Text>
          </TouchableOpacity>
        </View>
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
            const rawStatus = (visit.status || 'confirmed').toLowerCase();
            const liveStatus = getVisitLiveStatus(visit);
            const isMatched = rawStatus === 'matched';
            const isArrived = rawStatus === 'arrived';
            const isCompleted = rawStatus === 'completed' || (liveStatus === 'completed' && ['ongoing', 'arrived', 'in_progress'].includes(rawStatus));
            const isOngoing = (rawStatus === 'ongoing' || liveStatus === 'ongoing') && !isCompleted;
            const isConfirmed = !isMatched && !isOngoing && !isArrived && !isCompleted;
            const isActionLoading = actionLoadingId === visitKey;

            const timeWindow = getVisitTimeWindow(visit);
            const canStart = timeWindow.isEarlyStartAllowed;

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
                        : isCompleted
                        ? styles.completedBadge
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
                          : isCompleted
                          ? styles.completedBadgeText
                          : isOngoing
                          ? styles.ongoingBadgeText
                          : isArrived
                          ? styles.arrivedBadgeText
                          : styles.confirmedBadgeText,
                      ]}
                    >
                      {isMatched
                        ? 'REQUESTED'
                        : isCompleted
                        ? 'COMPLETED'
                        : isOngoing
                        ? 'ON THE WAY'
                        : isArrived
                        ? 'ARRIVED'
                        : 'UPCOMING'}
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

                {/* Ongoing Live Trip Indicator on Card */}
                {isOngoing && (
                  <TouchableOpacity
                    style={styles.liveTripBanner}
                    activeOpacity={0.8}
                    onPress={() => setActiveTripVisit(visit)}
                  >
                    <View style={styles.pulseLiveDot} />
                    <Text style={styles.liveTripBannerText}>
                      Live Trip Active — Location Shared with Family
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color="#16A34A" />
                  </TouchableOpacity>
                )}

                {/* Interactive Workflow Actions */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => handleOpenPeerConnect(visit)}
                  >
                    <Ionicons name="chatbubbles-outline" size={15} color="#1E40AF" />
                    <Text style={styles.callBtnText}>Call / Chat</Text>
                  </TouchableOpacity>

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
                      style={[
                        styles.actionBtn,
                        styles.startTripBtn,
                        !canStart && styles.startTripBtnEarlyNotice,
                        isActionLoading && { opacity: 0.7 },
                      ]}
                      onPress={!isActionLoading ? () => handleStartTrip(visit) : undefined}
                      disabled={isActionLoading}
                    >
                      {isActionLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="navigate-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.startTripBtnText}>
                            {canStart ? 'Start Trip & Share' : 'Start Trip & Share (Early)'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : isOngoing ? (
                    <>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.viewTripBtn]}
                        onPress={() => setActiveTripVisit(visit)}
                      >
                        <Ionicons name="navigate-outline" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.viewTripBtnText}>Active Trip</Text>
                      </TouchableOpacity>

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
                            <Text style={styles.arrivedBtnText}>Arrived</Text>
                          </>
                        )}
                      </TouchableOpacity>

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
                            <Text style={styles.completeBtnText}>Complete</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </>
                  ) : isArrived ? (
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
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* 1. Peer-to-Peer Communication Switcher Modal */}
      <Modal
        visible={!!commModalVisit}
        transparent
        animationType="fade"
        onRequestClose={() => setCommModalVisit(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.peerModalContent}>
            <View style={styles.peerModalHeader}>
              <View style={styles.peerAvatar}>
                <Ionicons name="person" size={24} color="#1E40AF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.peerModalTitle}>
                  {commModalVisit?.elderName || 'Elderly Resident'}
                </Text>
                <Text style={styles.peerModalSub}>
                  {commModalVisit?.serviceType || 'Companionship'} · Peer Communication
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setCommModalVisit(null)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.peerOptionsList}>
              {/* Option A: Phone Call */}
              <TouchableOpacity
                style={styles.peerOptionItem}
                activeOpacity={0.8}
                onPress={() => {
                  const phone = commModalVisit?.elderPhone;
                  setCommModalVisit(null);
                  handleCallElder(phone);
                }}
              >
                <View style={[styles.peerOptionIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="call" size={22} color="#0284C7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.peerOptionLabel}>Direct Phone Call</Text>
                  <Text style={styles.peerOptionDesc}>
                    {commModalVisit?.elderPhone ? `Dial ${commModalVisit.elderPhone}` : 'Cellular voice call to resident'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>

              {/* Option B: In-App Direct Chat */}
              <TouchableOpacity
                style={styles.peerOptionItem}
                activeOpacity={0.8}
                onPress={() => handleChatElder(commModalVisit)}
              >
                <View style={[styles.peerOptionIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="chatbubbles" size={22} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.peerOptionLabel}>In-App Direct Chat</Text>
                  <Text style={styles.peerOptionDesc}>
                    Real-time text & voice messaging in TogetherCare
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>

              {/* Option C: Live Video / Audio Session */}
              <TouchableOpacity
                style={styles.peerOptionItem}
                activeOpacity={0.8}
                onPress={() => handleStartVideoCall(commModalVisit)}
              >
                <View style={[styles.peerOptionIconBox, { backgroundColor: '#F5F3FF' }]}>
                  <Ionicons name="videocam" size={22} color="#8B5CF6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.peerOptionLabel}>Live Video / Audio Session</Text>
                  <Text style={styles.peerOptionDesc}>
                    Face-to-face peer video interaction
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. Active Trip & Live Tracking Modal */}
      <Modal
        visible={!!activeTripVisit}
        animationType="slide"
        onRequestClose={() => setActiveTripVisit(null)}
      >
        <SafeAreaView style={styles.activeTripSafeArea}>
          <StatusBar barStyle="light-content" backgroundColor="#1E293B" />
          <View style={styles.activeTripHeader}>
            <View style={styles.activeTripTitleCol}>
              <View style={styles.activeTripLivePill}>
                <View style={styles.pulseLiveDotGreen} />
                <Text style={styles.activeTripLivePillText}>LIVE GPS SHARING ACTIVE</Text>
              </View>
              <Text style={styles.activeTripMainTitle}>Active Volunteer Trip</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setActiveTripVisit(null)}
                style={styles.activeTripMinimizeBtn}
              >
                <Ionicons name="chevron-down" size={18} color="#FFFFFF" />
                <Text style={styles.activeTripMinimizeText}>Minimize</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setActiveTripVisit(null);
                  fetchSchedule();
                }}
                style={[styles.activeTripMinimizeBtn, { backgroundColor: '#334155', paddingHorizontal: 10 }]}
              >
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.activeTripScroll} contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
            {/* Live GPS Broadcast Indicator Card */}
            <View style={styles.gpsBroadcastCard}>
              <Ionicons name="radio" size={26} color="#10B981" />
              <View style={{ flex: 1 }}>
                <Text style={styles.gpsBroadcastTitle}>Broadcasting Arrival Directions</Text>
                <Text style={styles.gpsBroadcastSub}>
                  Live location stream is active with {activeTripVisit?.elderName}'s family member until you arrive.
                </Text>
              </View>
            </View>

            {/* Destination Info Card */}
            <View style={styles.tripDestCard}>
              <Text style={styles.tripSectionHeading}>VISIT DESTINATION</Text>
              <Text style={styles.tripElderName}>{activeTripVisit?.elderName}</Text>
              <Text style={styles.tripServiceType}>{activeTripVisit?.serviceType}</Text>

              <View style={styles.tripDestAddressRow}>
                <Ionicons name="location" size={18} color="#DC2626" style={{ marginTop: 2 }} />
                <Text style={styles.tripDestAddressText}>{activeTripVisit?.location}</Text>
              </View>

              {activeTripVisit?.notes ? (
                <View style={styles.tripNotesBox}>
                  <Text style={styles.tripNotesLabel}>Care Notes:</Text>
                  <Text style={styles.tripNotesText}>{activeTripVisit?.notes}</Text>
                </View>
              ) : null}
            </View>

            {/* Navigation & Peer Contact Buttons */}
            <View style={styles.tripActionGrid}>
              <TouchableOpacity
                style={styles.navGoogleBtn}
                activeOpacity={0.8}
                onPress={() => handleOpenMaps(activeTripVisit?.location)}
              >
                <Ionicons name="map" size={18} color="#FFFFFF" />
                <Text style={styles.navGoogleBtnText}>Turn-by-Turn GPS Map</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navCallBtn}
                activeOpacity={0.8}
                onPress={() => handleOpenPeerConnect(activeTripVisit)}
              >
                <Ionicons name="chatbubbles" size={18} color="#1E40AF" />
                <Text style={styles.navCallBtnText}>Peer Connect / Call</Text>
              </TouchableOpacity>
            </View>

            {/* Workflow Progress Actions */}
            <View style={styles.tripProgressionCard}>
              <Text style={styles.tripSectionHeading}>TRIP PROGRESSION</Text>
              <Text style={styles.tripProgressionSub}>
                Update your status as you arrive at the resident's home and when the session is complete.
              </Text>

              <TouchableOpacity
                style={[
                  styles.tripProgressActionBtn,
                  styles.tripArrivedActionBtn,
                  actionLoadingId && { opacity: 0.7 },
                ]}
                disabled={!!actionLoadingId}
                onPress={() => handleMarkArrived(activeTripVisit)}
              >
                <Ionicons name="checkmark-done-circle" size={20} color="#FFFFFF" />
                <Text style={styles.tripProgressActionText}>I Have Arrived at Location</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tripProgressActionBtn,
                  styles.tripCompleteActionBtn,
                  actionLoadingId && { opacity: 0.7 },
                ]}
                disabled={!!actionLoadingId}
                onPress={() => handleCompleteVisit(activeTripVisit)}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.tripProgressActionText}>Complete Visit & Log Hours</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 3. Live Video / Audio Session Screen Modal */}
      <Modal
        visible={!!videoCallTarget}
        animationType="slide"
        onRequestClose={() => setVideoCallTarget(null)}
      >
        <SafeAreaView style={styles.videoBackdrop}>
          <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

          {/* Top Info Header */}
          <View style={styles.videoTopHeader}>
            <View style={styles.videoHeaderBadge}>
              <Text style={styles.videoHeaderBadgeText}>
                {videoCallTarget?.activity || 'TogetherCare Live Session'}
              </Text>
            </View>
            <Text style={styles.videoCallStatus}>
              {videoCallSeconds > 0 ? `In call   ${formatCallTimer(videoCallSeconds)}` : 'Connecting...'}
            </Text>
          </View>

          {/* Center Avatar & Name */}
          <View style={styles.videoCenterContent}>
            <View style={styles.videoAvatarOuter}>
              <Ionicons name="person" size={54} color="#60A5FA" />
            </View>
            <Text style={styles.videoCallerName}>{videoCallTarget?.name || 'Elderly Resident'}</Text>
            <View style={styles.videoRoleBadge}>
              <Text style={styles.videoRoleBadgeText}>Elderly Dependent</Text>
            </View>
            {videoCallTarget?.phone ? (
              <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600', marginTop: 4 }}>
                {videoCallTarget.phone}
              </Text>
            ) : null}
          </View>

          {/* Bottom Call Controls */}
          <View style={styles.videoControlsContainer}>
            {/* Audio Mute Button */}
            <TouchableOpacity
              style={[
                styles.videoControlBtn,
                videoMuted && { backgroundColor: '#EF4444' },
              ]}
              activeOpacity={0.8}
              onPress={() => setVideoMuted((prev) => !prev)}
            >
              <Ionicons
                name={videoMuted ? 'mic-off' : 'mic'}
                size={24}
                color="#FFFFFF"
              />
              <Text style={styles.videoControlLabel}>{videoMuted ? 'Muted' : 'Mute'}</Text>
            </TouchableOpacity>

            {/* End Call Button */}
            <TouchableOpacity
              style={styles.videoEndBtn}
              activeOpacity={0.8}
              onPress={() => setVideoCallTarget(null)}
            >
              <Ionicons name="call" size={30} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>

            {/* Video Camera Toggle */}
            <TouchableOpacity
              style={[
                styles.videoControlBtn,
                videoCamOff && { backgroundColor: '#EF4444' },
              ]}
              activeOpacity={0.8}
              onPress={() => setVideoCamOff((prev) => !prev)}
            >
              <Ionicons
                name={videoCamOff ? 'videocam-off' : 'videocam'}
                size={24}
                color="#FFFFFF"
              />
              <Text style={styles.videoControlLabel}>{videoCamOff ? 'Cam Off' : 'Camera'}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  historyShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 4,
  },
  historyShortcutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
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
  completedBadge: {
    backgroundColor: '#DCFCE7',
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
  completedBadgeText: {
    color: '#16A34A',
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
  startTripBtnEarlyNotice: {
    backgroundColor: '#3B82F6',
  },
  startTripBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewTripBtn: {
    backgroundColor: '#0284C7',
    marginRight: 4,
  },
  viewTripBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  liveTripBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 8,
  },
  liveTripBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  pulseLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  pulseLiveDotGreen: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
    marginRight: 5,
  },

  // Peer-to-Peer Communication Switcher Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  peerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  peerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  peerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  peerModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  peerModalSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  peerOptionsList: {
    marginTop: 14,
    gap: 10,
  },
  peerOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  peerOptionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peerOptionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  peerOptionDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  // Active Trip & Live Tracking Modal
  activeTripSafeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  activeTripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 12,
    paddingBottom: 14,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  activeTripTitleCol: {
    gap: 4,
  },
  activeTripLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  activeTripLivePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  activeTripMainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  activeTripMinimizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  activeTripMinimizeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  activeTripScroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  gpsBroadcastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 12,
    marginBottom: 16,
  },
  gpsBroadcastTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  gpsBroadcastSub: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
    lineHeight: 16,
  },
  tripDestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  tripSectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tripElderName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  tripServiceType: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
    marginTop: 2,
  },
  tripDestAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  tripDestAddressText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 18,
  },
  tripNotesBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  tripNotesLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 2,
  },
  tripNotesText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 16,
  },
  tripActionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  navGoogleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    elevation: 2,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  navGoogleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  navCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  navCallBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  tripProgressionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  tripProgressionSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 4,
  },
  tripProgressActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  tripArrivedActionBtn: {
    backgroundColor: '#D97706',
  },
  tripCompleteActionBtn: {
    backgroundColor: '#16A34A',
  },
  tripProgressActionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Live Video / Audio Session Screen
  videoBackdrop: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'space-between',
    paddingVertical: 24,
  },
  videoTopHeader: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    gap: 8,
  },
  videoHeaderBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  videoHeaderBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  videoCallStatus: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },
  videoCenterContent: {
    alignItems: 'center',
    gap: 12,
  },
  videoAvatarOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 3,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoCallerName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  videoRoleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  videoRoleBadgeText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  videoControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  videoControlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  videoControlLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  videoEndBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
