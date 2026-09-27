// src/screens/caregiver/LiveTrackingScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Platform,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import client from '../../api/client';
import { COLORS, SIZES } from '../../constants/theme';

export default function LiveTrackingScreen({ requestId, onBack, onTripCompleted }) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);

  // Real volunteer location & distance
  const volunteerLoc = request?.volunteerLocation;
  const volunteerLat = volunteerLoc?.lat || 6.9271;
  const volunteerLng = volunteerLoc?.lng || 79.8612;

  // Flashing animation for SOS
  const flashAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  const fetchRequestDetails = async () => {
    try {
      const res = await client.get(`/help-requests/${requestId}`);
      if (res.data?.success) {
        setRequest(res.data.data);
        if (res.data.data?.status === 'completed') {
          clearInterval(timerRef.current);
          onTripCompleted(res.data.data);
        }
      }
    } catch (error) {
      console.error('Fetch Tracking Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch updates regularly
  useEffect(() => {
    fetchRequestDetails();
    timerRef.current = setInterval(fetchRequestDetails, 4000);
    return () => clearInterval(timerRef.current);
  }, [requestId]);

  const getEmbedMapUrl = () => {
    const destination = encodeURIComponent(request?.location || 'Colombo, Sri Lanka');
    if (
      volunteerLoc?.lat &&
      volunteerLoc?.lng &&
      (request?.status === 'confirmed' || request?.status === 'ongoing' || request?.status === 'arrived')
    ) {
      return `https://maps.google.com/maps?saddr=${volunteerLoc.lat},${volunteerLoc.lng}&daddr=${destination}&output=embed`;
    }
    return `https://maps.google.com/maps?q=${destination}&output=embed`;
  };

  const handleOpenGoogleMapsRoute = () => {
    const destination = encodeURIComponent(request?.location || 'Colombo, Sri Lanka');
    let url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    if (volunteerLoc?.lat && volunteerLoc?.lng) {
      url += `&origin=${volunteerLoc.lat},${volunteerLoc.lng}`;
    } else if (volunteerLoc?.address) {
      url += `&origin=${encodeURIComponent(volunteerLoc.address)}`;
    }
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open Google Maps route directions.');
    });
  };

  // Flashing SOS effect
  useEffect(() => {
    if (request?.sosTriggered) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
          Animated.timing(flashAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
        ])
      ).start();
    } else {
      flashAnim.setValue(0);
    }
  }, [request?.sosTriggered]);

  const handleSOS = () => {
    Alert.alert(
      '🚨 TRIGGER EMERGENCY SOS?',
      'This will immediately alert local medical services, the police, and community volunteers near your dependent.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'TRIGGER SOS',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              const res = await client.post(`/help-requests/${requestId}/sos`);
              if (res.data?.success) {
                setRequest(res.data.data);
                Alert.alert('Emergency Broadcasted 🚨', 'SOS Alert broadcasted successfully. Help is on the way!');
              }
            } catch (error) {
              console.error('SOS Trigger Error:', error);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Simulated status updates for verification
  const handleSimulateStatus = async (status) => {
    try {
      setActionLoading(true);
      const res = await client.post(`/help-requests/${requestId}/simulate-status`, { status });
      if (res.data?.success) {
        setRequest(res.data.data);
        if (status === 'completed') {
          clearInterval(timerRef.current);
          onTripCompleted(res.data.data);
        } else {
          Alert.alert('Simulation Success', `Status updated to: ${status}`);
        }
      }
    } catch (error) {
      console.error('Simulate Status Error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text style={styles.loadingText}>Connecting to tracking system...</Text>
      </View>
    );
  }

  const volunteer = request?.volunteerId;
  const dependent = request?.elderlyId;
  const isPendingAcceptance = request?.status === 'matched';
  const isConfirmed = request?.status === 'confirmed';
  const isOngoing = request?.status === 'ongoing';
  const isArrived = request?.status === 'arrived';

  const getStatusMessage = () => {
    if (request?.sosTriggered) return '🚨 EMERGENCY ALERTS IN PROGRESS';
    switch (request?.status) {
      case 'matched':
        return 'Awaiting volunteer acceptance. Notification sent.';
      case 'confirmed':
        return request?.trackingConsent
          ? 'Visit confirmed. Volunteer preparing for departure.'
          : 'Visit confirmed. Waiting for volunteer to start trip.';
      case 'ongoing':
        return 'Volunteer is on the way! Live arrival directions active.';
      case 'arrived':
        return 'Volunteer has arrived at the destination.';
      case 'completed':
        return 'Visit completed successfully.';
      default:
        return 'Connecting to volunteer tracking system...';
    }
  };

  const containerBgColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.background, '#FEE2E2'],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-back-outline" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Tracking</Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.View style={[styles.mainContainer, { backgroundColor: containerBgColor }]}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Status Header */}
          <View
            style={[
              styles.statusBanner,
              request?.sosTriggered
                ? styles.sosBanner
                : isPendingAcceptance
                ? styles.pendingBanner
                : isOngoing
                ? styles.ongoingBanner
                : isArrived
                ? styles.arrivedBanner
                : styles.confirmedBanner,
            ]}
          >
            <Icon
              name={
                request?.sosTriggered
                  ? 'warning'
                  : isPendingAcceptance
                  ? 'time-outline'
                  : isOngoing
                  ? 'navigate-circle'
                  : isArrived
                  ? 'checkmark-circle'
                  : 'calendar-outline'
              }
              size={22}
              color="#FFFFFF"
            />
            <Text style={styles.statusBannerText}>{getStatusMessage()}</Text>
          </View>

          {/* In-App Live Map Container */}
          <View style={styles.mapContainer}>
            <View style={styles.mapHeaderRow}>
              <View style={styles.mapHeaderLeft}>
                <Icon name="map-outline" size={18} color={COLORS.primary} />
                <Text style={styles.mapHeaderTitle}>Live Route Map</Text>
              </View>
              <TouchableOpacity
                style={styles.expandMapTouch}
                onPress={() => setMapModalVisible(true)}
              >
                <Icon name="scan-outline" size={15} color={COLORS.secondary} />
                <Text style={styles.expandMapTouchText}>Fullscreen</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.mapFrameWrapper}>
              {Platform.OS === 'web' ? (
                React.createElement('iframe', {
                  title: 'In-App Live Map',
                  src: getEmbedMapUrl(),
                  style: {
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    borderRadius: 8,
                  },
                  loading: 'lazy',
                  allowFullScreen: true,
                })
              ) : (
                <View style={styles.nativeMapCard}>
                  <Icon name="navigate-circle-outline" size={44} color={COLORS.secondary} />
                  <Text style={styles.nativeMapTitle}>In-App Navigation Active</Text>
                  <Text style={styles.nativeMapSub}>
                    To: {request?.location || 'Dependent Address'}
                  </Text>
                </View>
              )}

              {/* Status pill overlay */}
              <View style={styles.mapStatusPill}>
                <View
                  style={[
                    styles.mapStatusDot,
                    {
                      backgroundColor: isOngoing
                        ? '#0D9488'
                        : isConfirmed
                        ? '#2563EB'
                        : isArrived
                        ? '#16A34A'
                        : '#D97706',
                    },
                  ]}
                />
                <Text style={styles.mapStatusPillText}>
                  {isOngoing
                    ? '🚗 Live Trip Active'
                    : isConfirmed
                    ? '✅ Confirmed Destination'
                    : isArrived
                    ? '📍 Volunteer Arrived'
                    : '⏳ Scheduled Route'}
                </Text>
              </View>
            </View>
          </View>

          {/* Primary In-App Map Navigation Action */}
          <TouchableOpacity
            style={styles.inAppMapBtn}
            onPress={() => setMapModalVisible(true)}
          >
            <Icon name="navigate-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.inAppMapBtnText}>Open In-App Navigation Map</Text>
            <Icon name="expand-outline" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          {/* Details Row */}
          <View style={styles.trackingDetailsSection}>
            {/* Volunteer Profile */}
            <Text style={styles.subTitle}>Volunteer Details</Text>
            <View style={styles.personRow}>
              <View style={styles.avatarMini}>
                <Text style={styles.avatarMiniText}>
                  {volunteer?.firstName[0]}{volunteer?.lastName[0]}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.personName}>{volunteer?.firstName} {volunteer?.lastName}</Text>
                <Text style={styles.personSub}>{volunteer?.phone} • Verified Helper</Text>
              </View>
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => Alert.alert('Simulating Call', `Dialing volunteer at ${volunteer?.phone}...`)}
              >
                <Icon name="call" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Dependent details */}
            <Text style={styles.subTitle}>Dependent Details</Text>
            <View style={styles.personRow}>
              <View style={[styles.avatarMini, { backgroundColor: COLORS.primary }]}>
                <Text style={styles.avatarMiniText}>
                  {dependent?.firstName[0]}{dependent?.lastName[0]}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.personName}>{dependent?.firstName} {dependent?.lastName}</Text>
                <Text style={styles.personSub}>Address: {request?.location}</Text>
              </View>
            </View>
          </View>

          {/* Emergency SOS Section */}
          <View style={styles.sosContainer}>
            <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
              <Icon name="warning" size={32} color="#FFFFFF" />
              <Text style={styles.sosButtonText}>SOS EMERGENCY</Text>
              <Text style={styles.sosSubtext}>Trigger emergency broadcast for grandmother</Text>
            </TouchableOpacity>

            {request?.sosTriggered && (
              <View style={styles.emergencyActionsBox}>
                <Text style={styles.emergBoxTitle}>Quick Emergency Hotlines</Text>
                <View style={styles.emergGrid}>
                  <TouchableOpacity
                    style={styles.emergCallBtn}
                    onPress={() => Alert.alert('Dialing Police', 'Dialing 119...')}
                  >
                    <Text style={styles.emergCallText}>Call Police (119)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.emergCallBtn}
                    onPress={() => Alert.alert('Dialing Ambulance', 'Dialing 1990 Suwa Seriya...')}
                  >
                    <Text style={styles.emergCallText}>Call Suwa Seriya (1990)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* SIMULATION DEBUG PANEL */}
          <View style={styles.debugPanel}>
            <Text style={styles.debugTitle}>🔧 Developer Simulation Controls</Text>
            <Text style={styles.debugDesc}>Simulate volunteer actions without opening a second app.</Text>
            <View style={styles.debugButtonsRow}>
              <TouchableOpacity
                style={[styles.debugBtn, request?.status !== 'confirmed' && styles.debugBtnDisabled]}
                onPress={() => handleSimulateStatus('arrived')}
                disabled={request?.status !== 'confirmed' || actionLoading}
              >
                <Text style={styles.debugBtnText}>Simulate Arrived</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.debugBtn, (request?.status !== 'confirmed' && request?.status !== 'arrived') && styles.debugBtnDisabled]}
                onPress={() => handleSimulateStatus('completed')}
                disabled={(request?.status !== 'confirmed' && request?.status !== 'arrived') || actionLoading}
              >
                <Text style={styles.debugBtnText}>Simulate Completed</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* IN-APP FULLSCREEN MAP MODAL */}
      <Modal
        visible={mapModalVisible}
        animationType="slide"
        onRequestClose={() => setMapModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          {/* In-App Map Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setMapModalVisible(false)}
              style={styles.modalBackBtn}
            >
              <Icon name="arrow-back-outline" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.modalHeaderTitle}>In-App Navigation & Route</Text>
              <Text style={styles.modalHeaderSub} numberOfLines={1}>
                To: {request?.location || 'Dependent Location'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setMapModalVisible(false)}
              style={styles.modalCloseBtn}
            >
              <Icon name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Embedded Fullscreen Map */}
          <View style={styles.modalMapArea}>
            {Platform.OS === 'web' ? (
              React.createElement('iframe', {
                title: 'In-App Fullscreen Live Map',
                src: getEmbedMapUrl(),
                style: {
                  width: '100%',
                  height: '100%',
                  border: 'none',
                },
                loading: 'lazy',
                allowFullScreen: true,
              })
            ) : (
              <View style={styles.modalNativeMapFallback}>
                <Icon name="map-outline" size={54} color={COLORS.secondary} />
                <Text style={styles.modalNativeTitle}>Interactive Route View</Text>
                <Text style={styles.modalNativeSub}>
                  Destination: {request?.location}
                </Text>
              </View>
            )}
          </View>

          {/* Bottom Route Details & Control Card */}
          <View style={styles.modalBottomCard}>
            <View style={styles.modalRouteSummary}>
              <View style={styles.modalStopRow}>
                <View style={[styles.stopDot, { backgroundColor: COLORS.secondary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.stopLabel}>Origin (Volunteer)</Text>
                  <Text style={styles.stopValue}>
                    {volunteer?.firstName} {volunteer?.lastName || ''} ({volunteerLoc?.address || 'Current GPS Location'})
                  </Text>
                </View>
              </View>

              <View style={styles.stopLine} />

              <View style={styles.modalStopRow}>
                <View style={[styles.stopDot, { backgroundColor: COLORS.primary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.stopLabel}>Destination (Senior)</Text>
                  <Text style={styles.stopValue}>
                    {dependent?.firstName} {dependent?.lastName || ''} • {request?.location}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.modalBtnRow}>
              {volunteer?.phone && (
                <TouchableOpacity
                  style={styles.modalCallBtn}
                  onPress={() =>
                    Alert.alert('Simulating Call', `Dialing volunteer at ${volunteer.phone}...`)
                  }
                >
                  <Icon name="call" size={16} color="#FFFFFF" />
                  <Text style={styles.modalCallBtnText}>Call Volunteer</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.modalDismissBtn}
                onPress={() => setMapModalVisible(false)}
              >
                <Text style={styles.modalDismissBtnText}>Close Map</Text>
              </TouchableOpacity>
            </View>

            {/* Optional external fallback link */}
            <TouchableOpacity
              style={styles.externalLinkBtn}
              onPress={handleOpenGoogleMapsRoute}
            >
              <Text style={styles.externalLinkText}>Open in external Google Maps app ↗</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: COLORS.textSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
  mainContainer: { flex: 1 },
  scrollContainer: { padding: 20, paddingBottom: 60 },
  statusBanner: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 15,
  },
  sosBanner: { backgroundColor: COLORS.danger },
  pendingBanner: { backgroundColor: '#D97706' },
  confirmedBanner: { backgroundColor: '#2563EB' },
  ongoingBanner: { backgroundColor: '#0D9488' },
  arrivedBanner: { backgroundColor: '#16A34A' },
  statusBannerText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  centerStatusBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  centerStatusTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  centerStatusSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  // In-App Map Styles
  mapContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  mapHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mapHeaderTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  expandMapTouch: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  expandMapTouchText: { fontSize: 12, color: COLORS.secondary, fontWeight: '600' },
  mapFrameWrapper: {
    height: 240,
    width: '100%',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  mapStatusPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  mapStatusDot: { width: 8, height: 8, borderRadius: 4 },
  mapStatusPillText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  nativeMapCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F0FDFA',
  },
  nativeMapTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginTop: 8 },
  nativeMapSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  inAppMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0D9488',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  inAppMapBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  // In-App Modal Styles
  modalSafeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  modalBackBtn: { padding: 4 },
  modalCloseBtn: { padding: 4 },
  modalHeaderTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  modalHeaderSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  modalMapArea: { flex: 1, width: '100%', backgroundColor: '#E2E8F0' },
  modalNativeMapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalNativeTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: 12 },
  modalNativeSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  modalBottomCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 8,
  },
  modalRouteSummary: { marginBottom: 14 },
  modalStopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stopDot: { width: 12, height: 12, borderRadius: 6 },
  stopLine: {
    width: 2,
    height: 16,
    backgroundColor: '#CBD5E1',
    marginLeft: 5,
    marginVertical: 2,
  },
  stopLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase' },
  stopValue: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginTop: 1 },
  modalBtnRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  modalCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalCallBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  modalDismissBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalDismissBtnText: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 13 },
  externalLinkBtn: { alignItems: 'center', marginTop: 10 },
  externalLinkText: { fontSize: 11, color: '#64748B', textDecorationLine: 'underline' },
  trackingDetailsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 15,
  },
  subTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8 },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatarMini: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  personName: { fontSize: 15, fontWeight: 'bold', color: COLORS.textPrimary },
  personSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, marginRight: 20 },
  callBtn: {
    backgroundColor: COLORS.secondary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosContainer: { marginBottom: 15 },
  sosButton: {
    backgroundColor: COLORS.danger,
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  sosButtonText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginTop: 6, letterSpacing: 0.5 },
  sosSubtext: { color: '#FEE2E2', fontSize: 11, marginTop: 4, opacity: 0.9 },
  emergencyActionsBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 14,
    marginTop: 10,
  },
  emergBoxTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.danger, marginBottom: 10, textAlign: 'center' },
  emergGrid: { flexDirection: 'row', gap: 10 },
  emergCallBtn: {
    flex: 1,
    backgroundColor: COLORS.danger,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  emergCallText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  debugPanel: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginTop: 10,
  },
  debugTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
  debugDesc: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, marginBottom: 12 },
  debugButtonsRow: { flexDirection: 'row', gap: 10 },
  debugBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  debugBtnDisabled: { backgroundColor: '#94A3B8', opacity: 0.5 },
  debugBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
});
