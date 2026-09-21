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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import client from '../../api/client';
import { COLORS, SIZES } from '../../constants/theme';

export default function LiveTrackingScreen({ requestId, onBack, onTripCompleted }) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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

          {/* Map / Directions Block */}
          <View style={styles.mapMock}>
            <View style={styles.mapCard}>
              <View style={styles.mapGridLines} />

              {isPendingAcceptance ? (
                <View style={styles.centerStatusBox}>
                  <Icon name="time-outline" size={40} color="#D97706" />
                  <Text style={styles.centerStatusTitle}>Waiting for Volunteer</Text>
                  <Text style={styles.centerStatusSub}>
                    Visit request sent to {volunteer?.firstName || 'volunteer'}. Live tracking will activate once accepted and trip starts.
                  </Text>
                </View>
              ) : isConfirmed && !request?.trackingConsent ? (
                <View style={styles.centerStatusBox}>
                  <Icon name="calendar-outline" size={40} color="#2563EB" />
                  <Text style={styles.centerStatusTitle}>Visit Confirmed</Text>
                  <Text style={styles.centerStatusSub}>
                    Scheduled for {request?.date} at {request?.time}. Live GPS directions will display once {volunteer?.firstName} begins the trip.
                  </Text>
                </View>
              ) : (
                <>
                  {/* Dependent Home Marker */}
                  <View style={styles.dependentMarker}>
                    <Icon name="home" size={16} color="#FFFFFF" />
                  </View>

                  {/* Volunteer Marker */}
                  <View style={[styles.volunteerMarker, { top: '35%', left: '45%' }]}>
                    <Icon name="walk-outline" size={16} color="#FFFFFF" />
                  </View>

                  {/* Status Indicator text overlay */}
                  <View style={styles.mapInfoOverlay}>
                    <Text style={styles.mapOverlayLabel}>Volunteer GPS Coordinates</Text>
                    <Text style={styles.mapOverlayVal}>
                      Lat: {volunteerLat.toFixed(4)} • Lng: {volunteerLng.toFixed(4)}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Real Google Maps Navigation Action */}
          <TouchableOpacity style={styles.googleMapsBtn} onPress={handleOpenGoogleMapsRoute}>
            <Icon name="map-outline" size={18} color="#FFFFFF" />
            <Text style={styles.googleMapsBtnText}>Open Route in Google Maps</Text>
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
  googleMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0D9488',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 15,
  },
  googleMapsBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  mapMock: { height: 180, width: '100%', marginBottom: 15 },
  mapCard: {
    flex: 1,
    backgroundColor: '#E0F2F1',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#B2DFDB',
  },
  mapGridLines: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: 'rgba(0,150,136,0.06)',
  },
  dependentMarker: {
    position: 'absolute',
    bottom: '25%',
    right: '25%',
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  volunteerMarker: {
    position: 'absolute',
    backgroundColor: COLORS.secondary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  mapInfoOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(15,23,42,0.85)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  mapOverlayLabel: { color: '#94A3B8', fontSize: 8, fontWeight: 'bold' },
  mapOverlayVal: { color: '#FFFFFF', fontSize: 10, fontWeight: '500', marginTop: 1 },
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
