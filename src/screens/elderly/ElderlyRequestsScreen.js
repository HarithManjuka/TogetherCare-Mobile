// src/screens/elderly/ElderlyRequestsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllOffers, acceptOffer } from '../../services/volunteerOfferService';
import AppHeader from '../../components/common/AppHeader';
import VolunteerProfileDetailModal from '../../components/elderly/VolunteerProfileDetailModal';
import VolunteerOfferDetailModal from '../../components/elderly/VolunteerOfferDetailModal';

const CATEGORIES = [
  'All',
  'Walking Companion',
  'Reading & Storytelling',
  'Friendly Chat',
  'Grocery & Errands',
  'Tech Help & Phone',
  'Doctor Appointment',
  'Board Games',
  'Gardening & Outdoors',
];

export default function ElderlyRequestsScreen({
  onNavigateToSchedule,
  onRequestNew,
  onBack,
  onNavigateTab,
  onOpenProfile,
  onOpenNotifications,
  hasUnreadNotifications = false,
  unreadNotificationCount = 0,
}) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Selected offer for detailed profile inspection modal
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  // Selected offer for full details & interactive map modal
  const [selectedDetailOffer, setSelectedDetailOffer] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // In-app Confirmation Modal State
  const [confirmingOffer, setConfirmingOffer] = useState(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Success Modal State
  const [successOffer, setSuccessOffer] = useState(null);

  const fetchOffers = useCallback(async () => {
    try {
      const params = {};
      if (selectedCategory !== 'All') {
        params.service = selectedCategory;
      }
      if (searchLocation.trim()) {
        params.location = searchLocation.trim();
      }
      const res = await getAllOffers(params);
      if (res && res.success) {
        setOffers(res.data || []);
      } else {
        setOffers([]);
      }
    } catch (error) {
      console.warn('Error loading volunteer offers:', error.message || error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, searchLocation]);

  useEffect(() => {
    setLoading(true);
    fetchOffers();
  }, [fetchOffers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOffers();
  };

  const handleOpenProfile = (offer) => {
    setSelectedOffer(offer);
    setProfileModalVisible(true);
  };

  const handleOpenDetails = (offer) => {
    setSelectedDetailOffer(offer);
    setDetailModalVisible(true);
  };

  // Open the confirmation modal sheet
  const handlePromptAccept = (offer) => {
    setErrorMessage('');
    setConfirmingOffer(offer);
  };

  // Execute the acceptance action
  const handleConfirmAccept = async () => {
    if (!confirmingOffer) return;
    try {
      setIsAccepting(true);
      setErrorMessage('');
      const result = await acceptOffer(confirmingOffer._id);
      if (result && result.success) {
        const bookedOffer = confirmingOffer;
        setConfirmingOffer(null);
        setProfileModalVisible(false);
        setDetailModalVisible(false);
        setSuccessOffer(bookedOffer);
        fetchOffers();
      } else {
        setErrorMessage(result?.message || 'Could not accept this offer at this time.');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Error accepting offer. Please verify your connection.';
      setErrorMessage(msg);
    } finally {
      setIsAccepting(false);
    }
  };

  const renderOfferCard = ({ item }) => {
    // Real ID verification status strictly requires official ID verification approval
    const volunteer = item.volunteerId || {};
    const vvStatus = (volunteer.volunteerVerification?.status || '').toUpperCase();
    const isIdVerified = volunteer.isVolunteerVerified === true || vvStatus === 'APPROVED';

    return (
      <View style={styles.card}>
        {/* Card Header: Clickable Profile Avatar & Name */}
        <View style={styles.cardHeader}>
          <TouchableOpacity
            style={styles.volunteerInfo}
            activeOpacity={0.75}
            onPress={() => handleOpenProfile(item)}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {(item.volunteerName || 'V').charAt(0).toUpperCase()}
              </Text>
              {isIdVerified && (
                <View style={styles.avatarVerifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                </View>
              )}
            </View>

            <View style={styles.volunteerDetails}>
              <View style={styles.nameBadgeRow}>
                <Text style={styles.volunteerName}>
                  {item.volunteerName}
                </Text>
                {isIdVerified && (
                  <View style={styles.verifiedMiniBadge}>
                    <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                  </View>
                )}
              </View>

              <Text style={styles.volunteerSubtext}>
                {item.volunteerId?.educationalInstitution || 'Community Volunteer'} · Tap for profile
              </Text>
            </View>
          </TouchableOpacity>

          {/* Slots badge */}
          <View style={styles.slotsPill}>
            <Ionicons name="people" size={13} color="#059669" />
            <Text style={styles.slotsPillText}>
              {item.slotsLeft || 1} open
            </Text>
          </View>
        </View>

        {/* Date, Time & Location Bar */}
        <TouchableOpacity
          style={styles.dateTimeBar}
          activeOpacity={0.8}
          onPress={() => handleOpenDetails(item)}
        >
          <View style={styles.metaCol}>
            <Ionicons name="calendar" size={15} color="#2563EB" />
            <Text style={styles.metaText}>
              {item.date || 'Available Date'}
            </Text>
          </View>

          <View style={styles.metaDivider} />

          <View style={styles.metaCol}>
            <Ionicons name="time" size={15} color="#7C3AED" />
            <Text style={styles.metaText}>
              {item.startTime} - {item.endTime}
            </Text>
          </View>

          <View style={styles.metaDivider} />

          <View style={styles.metaCol}>
            <Ionicons name="location" size={15} color="#DC2626" />
            <Text numberOfLines={1} style={[styles.metaText, { fontWeight: '700' }]}>
              {item.serviceArea}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Services Badges */}
        <View style={styles.servicesRow}>
          {(item.services || ['Companionship']).map((svc, idx) => (
            <View key={idx} style={styles.serviceChip}>
              <Text style={styles.serviceChipText}>
                {svc}
              </Text>
            </View>
          ))}
        </View>

        {/* Notes if available */}
        {Boolean(item.specialSkills) && (
          <Text numberOfLines={2} style={styles.notesText}>
            "{item.specialSkills}"
          </Text>
        )}

        {/* Actions Button Group: View Details & Map | View Profile | Accept Visit */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={styles.viewDetailsCardBtn}
            onPress={() => handleOpenDetails(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="map-outline" size={16} color="#1D4ED8" />
            <Text style={styles.viewDetailsCardBtnText}>
              View Details
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewProfileBtn}
            onPress={() => handleOpenProfile(item)}
            activeOpacity={0.75}
          >
            <Ionicons name="person-circle-outline" size={16} color="#475569" />
            <Text style={styles.viewProfileBtnText}>
              Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acceptCardBtn}
            onPress={() => handlePromptAccept(item)}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle-outline" size={17} color="#FFFFFF" />
            <Text style={styles.acceptCardBtnText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.safeArea}>
      {/* Top App Bar Header Preserving Responsiveness and Global Navigation */}
      <AppHeader
        onProfilePress={onOpenProfile || (() => onNavigateTab && onNavigateTab('profile'))}
        onNotificationPress={onOpenNotifications || (() => {})}
        onNavigateTab={onNavigateTab}
        hasUnreadNotifications={hasUnreadNotifications}
        unreadNotificationsCount={unreadNotificationCount}
      />

      <View style={styles.mainContainer}>
        {/* Screen Header in Signature TogetherCare Light Style */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>
                Volunteer Offers
              </Text>
              <Text style={styles.headerSubtitle}>
                Find friendly companions ready to visit you
              </Text>
            </View>

            {onRequestNew && (
              <TouchableOpacity
                style={styles.requestNewBtn}
                onPress={onRequestNew}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.requestNewBtnText}>Post Request</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Search Input */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by city, town or area..."
              placeholderTextColor="#94A3B8"
              value={searchLocation}
              onChangeText={setSearchLocation}
              returnKeyType="search"
            />
            {Boolean(searchLocation) && (
              <TouchableOpacity
                onPress={() => setSearchLocation('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Horizontal Scroll */}
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORIES}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.categoriesList}
            renderItem={({ item }) => {
              const isSelected = selectedCategory === item;
              return (
                <TouchableOpacity
                  onPress={() => setSelectedCategory(item)}
                  style={[
                    styles.categoryPill,
                    isSelected ? styles.categoryPillActive : styles.categoryPillInactive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      isSelected ? styles.categoryPillTextActive : styles.categoryPillTextInactive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Main Content Area */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E3A8A" />
            <Text style={styles.loadingText}>
              Finding available volunteers...
            </Text>
          </View>
        ) : (
          <FlatList
            data={offers}
            keyExtractor={(item) => item._id}
            renderItem={renderOfferCard}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#1E3A8A"
                colors={['#1E3A8A']}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons
                  name="heart-dislike-outline"
                  size={56}
                  color="#94A3B8"
                />
                <Text style={styles.emptyStateTitle}>
                  No Volunteer Offers Found
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  {selectedCategory !== 'All' || searchLocation
                    ? 'Try changing your category filter or search area.'
                    : 'Check back soon as volunteers frequently post new companionship availability!'}
                </Text>
                {onRequestNew && (
                  <TouchableOpacity
                    style={styles.emptyRequestBtn}
                    onPress={onRequestNew}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.emptyRequestBtnText}>
                      Request a Companion Now
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
      </View>

      {/* 1. Full Volunteer Offer Details & Location Interactive Map Modal */}
      <VolunteerOfferDetailModal
        visible={detailModalVisible}
        offer={selectedDetailOffer}
        onClose={() => setDetailModalVisible(false)}
        onViewProfile={(offer) => {
          setDetailModalVisible(false);
          handleOpenProfile(offer);
        }}
        onAccept={(offer) => {
          setDetailModalVisible(false);
          handlePromptAccept(offer);
        }}
        isAccepting={isAccepting}
      />

      {/* 2. Volunteer Profile Inspection Modal */}
      <VolunteerProfileDetailModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        offer={selectedOffer}
        onAccept={(offer) => {
          setProfileModalVisible(false);
          handlePromptAccept(offer);
        }}
        isAccepting={isAccepting}
      />

      {/* 3. In-App Confirmation Modal Sheet */}
      <Modal
        visible={!!confirmingOffer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !isAccepting && setConfirmingOffer(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmHeaderRow}>
              <View style={styles.confirmIconWrap}>
                <Ionicons name="calendar" size={26} color="#1E3A8A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.confirmTitle}>
                  Confirm Companion Visit
                </Text>
                <Text style={styles.confirmSub}>
                  Accept and add to your personal schedule
                </Text>
              </View>
            </View>

            {confirmingOffer && (
              <View style={styles.offerSummaryBox}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Volunteer:</Text>
                  <Text style={styles.summaryValueName}>
                    {confirmingOffer.volunteerName}
                  </Text>
                </View>

                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Scheduled Date:</Text>
                  <Text style={styles.summaryValue}>
                    {confirmingOffer.date}
                  </Text>
                </View>

                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Time Window:</Text>
                  <Text style={styles.summaryValue}>
                    {confirmingOffer.startTime} - {confirmingOffer.endTime}
                  </Text>
                </View>

                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Location:</Text>
                  <Text style={styles.summaryValue}>
                    {confirmingOffer.serviceArea}
                  </Text>
                </View>

                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Services:</Text>
                  <Text style={styles.summaryValue}>
                    {(confirmingOffer.services || []).join(', ')}
                  </Text>
                </View>
              </View>
            )}

            {/* Error banner if any */}
            {Boolean(errorMessage) && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            )}

            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.cancelConfirmBtn}
                onPress={() => setConfirmingOffer(null)}
                disabled={isAccepting}
              >
                <Text style={styles.cancelConfirmBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.primaryConfirmBtn,
                  { opacity: isAccepting ? 0.7 : 1 },
                ]}
                onPress={handleConfirmAccept}
                disabled={isAccepting}
              >
                {isAccepting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryConfirmBtnText}>
                      Accept & Schedule
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 4. Visit Confirmation Success Modal Sheet */}
      <Modal
        visible={!!successOffer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSuccessOffer(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={60} color="#10B981" />
            </View>

            <Text style={styles.successTitle}>
              Companionship Scheduled! 🎉
            </Text>

            <Text style={styles.successBody}>
              Your session with{' '}
              <Text style={{ fontWeight: '700', color: '#1E3A8A' }}>
                {successOffer?.volunteerName}
              </Text>{' '}
              has been successfully booked for{' '}
              <Text style={{ fontWeight: '700' }}>
                {successOffer?.date} ({successOffer?.startTime} - {successOffer?.endTime})
              </Text>
              .
            </Text>

            <View style={styles.successActionsCol}>
              <TouchableOpacity
                style={styles.goToScheduleBtn}
                onPress={() => {
                  setSuccessOffer(null);
                  if (onNavigateToSchedule) {
                    onNavigateToSchedule();
                  }
                }}
              >
                <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
                <Text style={styles.goToScheduleBtnText}>
                  Go to My Schedule
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.stayBtn}
                onPress={() => setSuccessOffer(null)}
              >
                <Text style={styles.stayBtnText}>
                  Browse More Volunteers
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E3A8A', // Seamlessly matches AppHeader status bar
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Signature accessible light canvas
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  requestNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  requestNewBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  categoriesList: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryPillActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  categoryPillInactive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  categoryPillTextInactive: {
    color: '#475569',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  volunteerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  volunteerDetails: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  volunteerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  verifiedMiniBadge: {
    marginLeft: 2,
  },
  volunteerSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  slotsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  slotsPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  dateTimeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  metaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  servicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  serviceChip: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  serviceChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  notesText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 18,
  },
  avatarVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  viewDetailsCardBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    gap: 5,
  },
  viewDetailsCardBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  viewProfileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    gap: 5,
  },
  viewProfileBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  acceptCardBtn: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3A8A',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 5,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptCardBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyRequestBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  confirmHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  confirmIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  confirmSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  offerSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryValueName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginBottom: 14,
  },
  errorBannerText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelConfirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelConfirmBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  primaryConfirmBtn: {
    flex: 1.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3A8A',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  successCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  successIconCircle: {
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  successBody: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  successActionsCol: {
    width: '100%',
    gap: 10,
  },
  goToScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3A8A',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  goToScheduleBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  stayBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  stayBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});
