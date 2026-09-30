// src/components/elderly/VolunteerOfferDetailModal.js
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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function VolunteerOfferDetailModal({
  visible,
  offer,
  onClose,
  onAccept,
  onViewProfile,
  isAccepting = false,
}) {
  const { colors, isDark } = useTheme();
  const [mapTab, setMapTab] = useState(Platform.OS === 'web' ? 'live' : 'route');

  if (!offer) return null;

  const volunteer = offer.volunteerId || {};
  const volunteerName =
    offer.volunteerName ||
    `${volunteer.firstName || 'Volunteer'} ${volunteer.lastName || ''}`.trim();
  const isVerified =
    volunteer.verificationBadgeStatus === 'approved' ||
    volunteer.verificationBadgeStatus === 'verified';
  const serviceArea = offer.serviceArea || 'Local Community Area';
  const volunteerPhone = volunteer.phone || '';
  const hasRating = volunteer.rating !== undefined && volunteer.rating !== null && Number(volunteer.rating) > 0;
  const rating = hasRating ? Number(volunteer.rating).toFixed(1) : null;
  const profilePic = volunteer.profilePicture;

  // Approximate lat/lng hash based on location or ID
  const lat = 6.9271 + (Math.abs((offer._id || offer.id || '').charCodeAt(0) % 10) * 0.003);
  const lng = 79.8612 + (Math.abs((offer._id || offer.id || '').charCodeAt(1) % 10) * 0.003);

  const handleOpenMaps = () => {
    const query = encodeURIComponent(serviceArea);
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

  const handleCallVolunteer = () => {
    if (volunteerPhone) {
      Linking.openURL(`tel:${volunteerPhone}`).catch(() => {});
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
        <View
          style={[
            styles.modalCard,
            { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.headerRow,
              { borderBottomColor: isDark ? '#334155' : '#F1F5F9' },
            ]}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={styles.openBadge}>
                  <Ionicons name="sparkles" size={12} color="#2563EB" />
                  <Text style={styles.openBadgeText}>Available Companion</Text>
                </View>
                <View style={styles.slotsPill}>
                  <Ionicons name="people" size={12} color="#059669" />
                  <Text style={styles.slotsPillText}>
                    {offer.slotsLeft || 1} open slot{offer.slotsLeft > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.modalTitle,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                ]}
              >
                Volunteer Visit Details
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? '#334155' : '#F1F5F9' },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={22}
                color={isDark ? '#94A3B8' : '#64748B'}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            {/* Volunteer Header Info & Profile Quick-Access Card */}
            <TouchableOpacity
              style={[
                styles.volunteerCard,
                {
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
              activeOpacity={0.85}
              onPress={() => onViewProfile && onViewProfile(offer)}
            >
              <View style={styles.avatarWrapper}>
                {profilePic ? (
                  <Image source={{ uri: profilePic }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {volunteerName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                {isVerified && (
                  <View style={styles.verifiedCheckBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  </View>
                )}
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text
                    style={[
                      styles.volunteerCardName,
                      { color: isDark ? '#F8FAFC' : '#0F172A' },
                    ]}
                  >
                    {volunteerName}
                  </Text>
                  {isVerified && (
                    <View style={styles.verifiedTextBadge}>
                      <Text style={styles.verifiedTextBadgeText}>VERIFIED</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.volunteerCardSub}>
                  {volunteer.educationalInstitution || 'Community Volunteer'}{rating ? ` · ⭐ ${rating}` : ' · New Volunteer'}
                </Text>

                <View style={styles.profileHintRow}>
                  <Ionicons name="star" size={13} color="#F59E0B" />
                  <Text style={styles.profileHintText}>View Volunteer Profile & Reviews</Text>
                </View>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDark ? '#64748B' : '#94A3B8'}
              />
            </TouchableOpacity>

            {/* Visit Time & Schedule Meta Grid */}
            <View
              style={[
                styles.metaGrid,
                {
                  backgroundColor: isDark ? '#0F172A' : '#EFF6FF',
                  borderColor: isDark ? '#1E3A8A' : '#DBEAFE',
                },
              ]}
            >
              <View style={styles.metaCol}>
                <Ionicons name="calendar" size={18} color="#2563EB" />
                <Text style={styles.metaColLabel}>Date</Text>
                <Text
                  style={[
                    styles.metaColValue,
                    { color: isDark ? '#F8FAFC' : '#1E3A8A' },
                  ]}
                >
                  {offer.date || 'Available Date'}
                </Text>
              </View>

              <View style={styles.metaGridDivider} />

              <View style={styles.metaCol}>
                <Ionicons name="time" size={18} color="#7C3AED" />
                <Text style={styles.metaColLabel}>Time Window</Text>
                <Text
                  style={[
                    styles.metaColValue,
                    { color: isDark ? '#F8FAFC' : '#1E3A8A' },
                  ]}
                >
                  {offer.startTime} - {offer.endTime}
                </Text>
              </View>

              <View style={styles.metaGridDivider} />

              <View style={styles.metaCol}>
                <Ionicons name="navigate-circle" size={18} color="#059669" />
                <Text style={styles.metaColLabel}>Coverage</Text>
                <Text
                  style={[
                    styles.metaColValue,
                    { color: isDark ? '#F8FAFC' : '#1E3A8A' },
                  ]}
                >
                  {offer.radius || 'Within 5 km'}
                </Text>
              </View>
            </View>

            {/* LOCATION & ROUTE MAP SECTION */}
            <View style={styles.mapSection}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleGroup}>
                  <Ionicons name="location" size={18} color="#DC2626" style={{ marginRight: 6 }} />
                  <Text
                    style={[
                      styles.sectionHeading,
                      { color: isDark ? '#F8FAFC' : '#0F172A' },
                    ]}
                  >
                    Location & Service Area
                  </Text>
                </View>

                <View style={styles.mapActionsGroup}>
                  {Platform.OS === 'web' && (
                    <View
                      style={[
                        styles.toggleGroup,
                        { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' },
                      ]}
                    >
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
                          Area
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={handleOpenMaps}
                    style={[
                      styles.openMapsLink,
                      {
                        backgroundColor: isDark ? '#0F2942' : '#EFF6FF',
                        borderColor: isDark ? '#0369A1' : '#BFDBFE',
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="navigate-outline" size={13} color="#2563EB" />
                    <Text style={styles.openMapsLinkText}>Maps</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Map Canvas Box */}
              <View
                style={[
                  styles.mapBox,
                  { borderColor: isDark ? '#334155' : '#CBD5E1' },
                ]}
              >
                {Platform.OS === 'web' && mapTab === 'live' ? (
                  <View style={styles.webMapContainer}>
                    <iframe
                      title="Volunteer Location Map"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${(lng - 0.007).toFixed(5)}%2C${(lat - 0.005).toFixed(5)}%2C${(lng + 0.007).toFixed(5)}%2C${(lat + 0.005).toFixed(5)}&layer=mapnik&marker=${lat.toFixed(5)}%2C${lng.toFixed(5)}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                      }}
                    />
                  </View>
                ) : (
                  /* Vector Map Representation */
                  <View
                    style={[
                      styles.vectorMapCanvas,
                      { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' },
                    ]}
                  >
                    {/* Park zones */}
                    <View style={styles.parkZone}>
                      <Ionicons name="leaf-outline" size={12} color="#15803D" style={{ marginRight: 3 }} />
                      <Text style={styles.parkZoneText}>Community Service Radius</Text>
                    </View>

                    {/* Urban Road Representation */}
                    <View style={styles.primaryRoad}>
                      <View style={styles.roadCenterLine} />
                      <Text style={styles.roadStreetName}>{serviceArea.toUpperCase()}</Text>
                    </View>

                    {/* Cross Street */}
                    <View style={styles.crossRoad}>
                      <Text style={styles.crossRoadName}>MAIN ACCESS</Text>
                    </View>

                    {/* Volunteer Base Marker */}
                    <View style={styles.volunteerOriginMarker}>
                      <View style={styles.volunteerRadarPulse} />
                      <View style={styles.volunteerMarkerInner}>
                        <Ionicons name="person" size={14} color="#FFFFFF" />
                      </View>
                      <View style={styles.volunteerMarkerPill}>
                        <Text style={styles.volunteerMarkerPillText}>{volunteerName}</Text>
                      </View>
                    </View>

                    {/* Service Area Pin */}
                    <View style={styles.elderDestinationPin}>
                      <View style={styles.destinationRadarPulse} />
                      <View style={styles.destinationMarkerInner}>
                        <Ionicons name="location" size={16} color="#FFFFFF" />
                      </View>
                      <View style={styles.destinationMarkerPill}>
                        <Text style={styles.destinationMarkerPillText}>{serviceArea}</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Floating GPS Badges */}
                <View style={styles.floatingTopBar}>
                  <View style={styles.gpsChip}>
                    <Ionicons name="locate" size={11} color="#60A5FA" style={{ marginRight: 4 }} />
                    <Text style={styles.gpsChipText}>
                      GPS: {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
                    </Text>
                  </View>

                  <View style={styles.distanceBadge}>
                    <Ionicons name="walk" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.distanceBadgeText}>{offer.radius || 'Within 5 km'}</Text>
                  </View>
                </View>
              </View>

              {/* Destination Address Card */}
              <View
                style={[
                  styles.addressCard,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
              >
                <View style={styles.addressIconBox}>
                  <Ionicons name="location" size={22} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addressCardLabel}>SERVICE BASE AREA</Text>
                  <Text
                    style={[
                      styles.addressCardValue,
                      { color: isDark ? '#F8FAFC' : '#0F172A' },
                    ]}
                  >
                    {serviceArea}
                  </Text>
                  <Text style={styles.addressCardSub}>
                    Volunteer is available to travel to your home within {offer.radius || '5 km'}
                  </Text>
                </View>
              </View>

              {/* Google Maps Launcher Button */}
              <TouchableOpacity
                style={styles.navLauncherBtn}
                onPress={handleOpenMaps}
                activeOpacity={0.88}
              >
                <Ionicons name="navigate-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.navLauncherBtnText}>Open in Google Maps / Directions</Text>
                <Ionicons name="open-outline" size={16} color="#93C5FD" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>

            {/* Services Offered Badges */}
            <View style={styles.sectionBlock}>
              <Text
                style={[
                  styles.sectionHeading,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                ]}
              >
                Services Included in this Offer
              </Text>
              <View style={styles.servicesGrid}>
                {(offer.services || ['Companionship']).map((svc, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.serviceTag,
                      {
                        backgroundColor: isDark ? '#1E3A8A' : '#EFF6FF',
                        borderColor: isDark ? '#2563EB' : '#BFDBFE',
                      },
                    ]}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#2563EB" />
                    <Text
                      style={[
                        styles.serviceTagText,
                        { color: isDark ? '#93C5FD' : '#1E40AF' },
                      ]}
                    >
                      {svc}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Special Skills / Volunteer Notes */}
            {Boolean(offer.specialSkills) && (
              <View style={styles.sectionBlock}>
                <Text
                  style={[
                    styles.sectionHeading,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  Volunteer Message & Skills
                </Text>
                <View
                  style={[
                    styles.notesBox,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#FEF3C7',
                      borderColor: isDark ? '#B45309' : '#FDE68A',
                    },
                  ]}
                >
                  <Ionicons name="information-circle" size={18} color="#D97706" style={{ marginTop: 2 }} />
                  <Text
                    style={[
                      styles.notesText,
                      { color: isDark ? '#FDE68A' : '#92400E' },
                    ]}
                  >
                    "{offer.specialSkills}"
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Footer */}
          <View
            style={[
              styles.footerRow,
              {
                borderTopColor: isDark ? '#334155' : '#F1F5F9',
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                {
                  borderColor: isDark ? '#475569' : '#CBD5E1',
                  backgroundColor: isDark ? '#334155' : '#F8FAFC',
                },
              ]}
              onPress={() => onViewProfile && onViewProfile(offer)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="person-circle-outline"
                size={18}
                color={isDark ? '#CBD5E1' : '#475569'}
              />
              <Text
                style={[
                  styles.secondaryBtnText,
                  { color: isDark ? '#CBD5E1' : '#475569' },
                ]}
              >
                Profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                isAccepting && { opacity: 0.7 },
              ]}
              onPress={() => onAccept && onAccept(offer)}
              disabled={isAccepting}
              activeOpacity={0.85}
            >
              {isAccepting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>Accept & Schedule Visit</Text>
                </>
              )}
            </TouchableOpacity>
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
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  openBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  slotsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  slotsPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
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
  volunteerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  verifiedCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  volunteerCardName: {
    fontSize: 15,
    fontWeight: '800',
  },
  verifiedTextBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  verifiedTextBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  volunteerCardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  profileHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  profileHintText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  metaGrid: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaCol: {
    flex: 1,
    alignItems: 'center',
  },
  metaColLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  metaColValue: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
    textAlign: 'center',
  },
  metaGridDivider: {
    width: 1,
    height: '65%',
    backgroundColor: '#BFDBFE',
  },
  mapSection: {
    marginBottom: 18,
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
    marginBottom: 8,
  },
  mapActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleGroup: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#2563EB',
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
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  openMapsLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  mapBox: {
    height: 220,
    backgroundColor: '#EDF2F7',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    marginBottom: 10,
  },
  webMapContainer: {
    width: '100%',
    height: '100%',
  },
  vectorMapCanvas: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  parkZone: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 190,
    height: 55,
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
    left: '50%',
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
  volunteerOriginMarker: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    alignItems: 'center',
    zIndex: 5,
  },
  volunteerRadarPulse: {
    position: 'absolute',
    top: -5,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
  },
  volunteerMarkerInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
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
    top: '40%',
    right: '20%',
    alignItems: 'center',
    zIndex: 5,
  },
  destinationRadarPulse: {
    position: 'absolute',
    top: -5,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(220, 38, 38, 0.22)',
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
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
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
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distanceBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    gap: 10,
  },
  addressIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  addressCardValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  addressCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  navLauncherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 11,
    borderRadius: 12,
  },
  navLauncherBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionBlock: {
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  serviceTagText: {
    fontSize: 13,
    fontWeight: '700',
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
