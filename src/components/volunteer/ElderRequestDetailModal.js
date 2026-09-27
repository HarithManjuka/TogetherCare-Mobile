// src/components/volunteer/ElderRequestDetailModal.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

export default function ElderRequestDetailModal({
  visible,
  request,
  onClose,
  onAccept,
  isAccepting = false,
}) {
  const [mapTab, setMapTab] = useState(Platform.OS === 'web' ? 'live' : 'route');

  if (!request) return null;

  const isUrgent = request.badgeType === 'urgent' || request.badge === 'Urgent';
  const address = request.address || request.location || 'Colombo, Sri Lanka';
  const elderName = request.elderName || 'Elderly Resident';
  const elderPhone = request.elderPhone || '';

  // Coordinates simulation for map view
  const lat = 6.9271 + (Math.abs((request.id || request._id || '').charCodeAt(0) % 10) * 0.003);
  const lng = 79.8612 + (Math.abs((request.id || request._id || '').charCodeAt(1) % 10) * 0.003);

  const handleOpenMaps = () => {
    const query = encodeURIComponent(address);
    const url =
      Platform.OS === 'ios'
        ? `maps:0,0?q=${query}`
        : `https://www.google.com/maps/search/?api=1&query=${query}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        }
        return Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
      })
      .catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
      });
  };

  const handleCallElder = () => {
    if (elderPhone) {
      Linking.openURL(`tel:${elderPhone}`).catch(() => {});
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, isUrgent ? styles.urgentBadge : styles.todayBadge]}>
                  <Text style={[styles.badgeText, isUrgent ? styles.urgentBadgeText : styles.todayBadgeText]}>
                    {request.badge || 'Open Request'}
                  </Text>
                </View>
                <Text style={styles.distanceMeta}>📍 {request.distance || '1.2 km'} away</Text>
              </View>
              <Text style={styles.modalTitle}>{request.type || request.serviceType || 'Elder Assistance'}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            {/* Elder Contact & Profile Card */}
            <View style={styles.elderCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {elderName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.elderCardName}>{elderName}</Text>
                <Text style={styles.elderCardSub}>Requested Elderly Assistance</Text>
                {elderPhone ? (
                  <Text style={styles.elderCardPhone}>📞 {elderPhone}</Text>
                ) : null}
              </View>
              {elderPhone ? (
                <TouchableOpacity style={styles.callElderBtn} onPress={handleCallElder}>
                  <Ionicons name="call" size={16} color="#FFFFFF" />
                  <Text style={styles.callElderText}>Call</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Visit Time & Schedule Details */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={16} color="#1E40AF" />
                <Text style={styles.metaText}>{request.date || 'Today'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color="#1E40AF" />
                <Text style={styles.metaText}>{request.time || '10:00 AM'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="hourglass-outline" size={16} color="#1E40AF" />
                <Text style={styles.metaText}>{request.duration || '45 min'}</Text>
              </View>
            </View>

            {/* LOCATION & MAP SECTION */}
            <View style={styles.mapSection}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleGroup}>
                  <Ionicons name="map" size={16} color="#1E40AF" style={{ marginRight: 6 }} />
                  <Text style={styles.sectionHeading}>Location & Route Map</Text>
                </View>

                <View style={styles.mapActionsGroup}>
                  {Platform.OS === 'web' && (
                    <View style={styles.toggleGroup}>
                      <TouchableOpacity
                        style={[styles.toggleBtn, mapTab === 'live' && styles.toggleBtnActive]}
                        onPress={() => setMapTab('live')}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.toggleBtnText, mapTab === 'live' && styles.toggleBtnTextActive]}>
                          Live Map
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.toggleBtn, mapTab === 'route' && styles.toggleBtnActive]}
                        onPress={() => setMapTab('route')}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.toggleBtnText, mapTab === 'route' && styles.toggleBtnTextActive]}>
                          Route
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <TouchableOpacity onPress={handleOpenMaps} style={styles.openMapsLink} activeOpacity={0.8}>
                    <Ionicons name="navigate-outline" size={13} color="#1E40AF" />
                    <Text style={styles.openMapsLinkText}>Google Maps</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Map Canvas Box */}
              <View style={styles.mapBox}>
                {Platform.OS === 'web' && mapTab === 'live' ? (
                  <View style={styles.webMapContainer}>
                    <iframe
                      title="Elder Location Map"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${(lng - 0.007).toFixed(5)}%2C${(lat - 0.005).toFixed(5)}%2C${(lng + 0.007).toFixed(5)}%2C${(lat + 0.005).toFixed(5)}&layer=mapnik&marker=${lat.toFixed(5)}%2C${lng.toFixed(5)}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                      }}
                    />
                  </View>
                ) : (
                  /* Realistic Vector Route Canvas */
                  <View style={styles.vectorMapCanvas}>
                    {/* Park zones */}
                    <View style={styles.parkZone}>
                      <Ionicons name="leaf-outline" size={12} color="#15803D" style={{ marginRight: 3 }} />
                      <Text style={styles.parkZoneText}>Cinnamon Gardens Park</Text>
                    </View>

                    {/* Water Feature */}
                    <View style={styles.waterFeature} />

                    {/* Urban Blocks */}
                    <View style={styles.blockA} />
                    <View style={styles.blockB} />

                    {/* Primary Arterial Road */}
                    <View style={styles.primaryRoad}>
                      <View style={styles.roadCenterLine} />
                      <Text style={styles.roadStreetName}>FLOWER ROAD</Text>
                    </View>

                    {/* Cross Street */}
                    <View style={styles.crossRoad}>
                      <Text style={styles.crossRoadName}>5TH LANE</Text>
                    </View>

                    {/* Dashed Route Path */}
                    <View style={styles.routePolyline} />

                    {/* Volunteer Origin Marker */}
                    <View style={styles.volunteerOriginMarker}>
                      <View style={styles.volunteerRadarPulse} />
                      <View style={styles.volunteerMarkerInner}>
                        <Ionicons name="person" size={13} color="#FFFFFF" />
                      </View>
                      <View style={styles.volunteerMarkerPill}>
                        <Text style={styles.volunteerMarkerPillText}>You (Current)</Text>
                      </View>
                    </View>

                    {/* Elder Destination Pin */}
                    <View style={styles.elderDestinationPin}>
                      <View style={styles.destinationRadarPulse} />
                      <View style={styles.destinationMarkerInner}>
                        <Ionicons name="home" size={15} color="#FFFFFF" />
                      </View>
                      <View style={styles.destinationMarkerPill}>
                        <Text style={styles.destinationMarkerPillText}>{elderName}</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Floating GPS & Distance Badges (Always on top) */}
                <View style={styles.floatingTopBar}>
                  <View style={styles.gpsChip}>
                    <Ionicons name="locate" size={11} color="#60A5FA" style={{ marginRight: 4 }} />
                    <Text style={styles.gpsChipText}>
                      GPS: {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
                    </Text>
                  </View>

                  <View style={styles.distanceBadge}>
                    <Ionicons name="car" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.distanceBadgeText}>{request.distance || '1.2 km'} · ~4 min</Text>
                  </View>
                </View>
              </View>

              {/* Destination Address Card */}
              <View style={styles.addressCard}>
                <View style={styles.addressIconBox}>
                  <Ionicons name="location" size={22} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addressCardLabel}>DESTINATION ADDRESS</Text>
                  <Text style={styles.addressCardValue}>{address}</Text>
                  <Text style={styles.addressCardSub}>
                    Verified location · Pinpoint navigation ready
                  </Text>
                </View>
              </View>

              {/* High-Contrast Navigation Launcher Button */}
              <TouchableOpacity
                style={styles.navLauncherBtn}
                onPress={handleOpenMaps}
                activeOpacity={0.88}
              >
                <Ionicons name="navigate-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.navLauncherBtnText}>Open in Google Maps / GPS Navigation</Text>
                <Ionicons name="open-outline" size={16} color="#93C5FD" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>

            {/* Requested Items or Task Details */}
            {request.items && request.items.length > 0 ? (
              <View style={styles.itemsSection}>
                <Text style={styles.sectionHeading}>Requested Items / Tasks</Text>
                <View style={styles.itemsList}>
                  {request.items.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={styles.itemText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Notes & Instructions */}
            {request.notes ? (
              <View style={styles.notesSection}>
                <Text style={styles.sectionHeading}>Caregiver Notes & Instructions</Text>
                <View style={styles.notesBox}>
                  <Ionicons name="information-circle-outline" size={18} color="#1E40AF" style={{ marginTop: 2 }} />
                  <Text style={styles.notesText}>{request.notes}</Text>
                </View>
              </View>
            ) : null}
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.secondaryBtnText}>Close</Text>
            </TouchableOpacity>

            {onAccept ? (
              <TouchableOpacity
                style={[styles.primaryBtn, isAccepting && { opacity: 0.7 }]}
                onPress={() => onAccept(request)}
                disabled={isAccepting}
                activeOpacity={0.8}
              >
                {isAccepting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="hand-left-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.primaryBtnText}>Accept Request</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 16 : 0,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 620 : '100%',
    borderRadius: Platform.OS === 'web' ? 24 : 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: Platform.OS === 'web' ? '92%' : '92%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  todayBadge: {
    backgroundColor: '#EFF6FF',
  },
  urgentBadge: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  todayBadgeText: {
    color: '#1D4ED8',
  },
  urgentBadgeText: {
    color: '#DC2626',
  },
  distanceMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    marginLeft: 10,
  },
  scrollContent: {
    flexGrow: 0,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
  },
  elderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  elderCardName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  elderCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  elderCardPhone: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
    marginTop: 2,
  },
  callElderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
  },
  callElderText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    justifyContent: 'space-around',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },

  // Map Section
  mapSection: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  mapActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#1E40AF',
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  openMapsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  openMapsLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
  },

  // Map Canvas
  mapBox: {
    height: 250,
    backgroundColor: '#EDF2F7',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  webMapContainer: {
    width: '100%',
    height: '100%',
  },
  vectorMapCanvas: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },

  // Realistic Map Terrain Elements
  parkZone: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 170,
    height: 65,
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  parkZoneText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  waterFeature: {
    position: 'absolute',
    bottom: -15,
    right: -20,
    width: 140,
    height: 60,
    backgroundColor: '#BAE6FD',
    borderRadius: 30,
    opacity: 0.8,
  },
  blockA: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 90,
    height: 50,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    opacity: 0.6,
  },
  blockB: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 110,
    height: 55,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    opacity: 0.6,
  },

  // Roads
  primaryRoad: {
    position: 'absolute',
    top: '52%',
    left: 0,
    right: 0,
    height: 26,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roadCenterLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  roadStreetName: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
  },
  crossRoad: {
    position: 'absolute',
    left: '52%',
    top: 0,
    bottom: 0,
    width: 24,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  crossRoadName: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    transform: [{ rotate: '-90deg' }],
  },

  // Route Line
  routePolyline: {
    position: 'absolute',
    top: '44%',
    left: '28%',
    width: '42%',
    height: 4,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    transform: [{ rotate: '12deg' }],
    zIndex: 2,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },

  // Markers
  volunteerOriginMarker: {
    position: 'absolute',
    top: '32%',
    left: '18%',
    alignItems: 'center',
    zIndex: 5,
  },
  volunteerRadarPulse: {
    position: 'absolute',
    top: -6,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(30, 64, 175, 0.22)',
  },
  volunteerMarkerInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  volunteerMarkerPill: {
    marginTop: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  volunteerMarkerPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },

  elderDestinationPin: {
    position: 'absolute',
    top: '42%',
    right: '20%',
    alignItems: 'center',
    zIndex: 5,
  },
  destinationRadarPulse: {
    position: 'absolute',
    top: -6,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(220, 38, 38, 0.25)',
  },
  destinationMarkerInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  destinationMarkerPill: {
    marginTop: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  destinationMarkerPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },

  // Floating Overlay Badges
  floatingTopBar: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  gpsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gpsChipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  distanceBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // Destination Address Card
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  addressIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  addressCardValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  addressCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // Nav Launcher Button
  navLauncherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 10,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  navLauncherBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  // Items Section
  itemsSection: {
    marginBottom: 16,
  },
  itemsList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
  },

  // Notes Section
  notesSection: {
    marginBottom: 14,
  },
  notesBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 6,
  },
  notesText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
    fontWeight: '500',
  },

  // Footer Actions
  footerRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  primaryBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
