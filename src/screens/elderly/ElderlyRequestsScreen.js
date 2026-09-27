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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getAllOffers, acceptOffer } from '../../services/volunteerOfferService';
import VolunteerProfileDetailModal from '../../components/elderly/VolunteerProfileDetailModal';

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
}) {
  const { colors, isDark, scale } = useTheme();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Selected offer for detailed profile inspection modal
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  // In-app Confirmation Modal State (Reliable across Web, iOS, Android)
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
    const isVerified =
      item.volunteerId?.verificationBadgeStatus === 'approved' ||
      item.volunteerId?.verificationBadgeStatus === 'verified';

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            borderColor: isDark ? '#334155' : '#E2E8F0',
          },
        ]}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.volunteerInfo}>
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: isDark ? '#3B82F6' : '#2563EB' },
              ]}
            >
              <Text style={styles.avatarInitial}>
                {(item.volunteerName || 'V').charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.volunteerDetails}>
              <View style={styles.nameBadgeRow}>
                <Text
                  style={[
                    styles.volunteerName,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  {item.volunteerName}
                </Text>
                {isVerified && (
                  <View style={styles.verifiedMiniBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  </View>
                )}
              </View>

              <Text style={styles.volunteerSubtext}>
                {item.volunteerId?.educationalInstitution || 'Community Volunteer'}
              </Text>
            </View>
          </View>

          {/* Slots badge */}
          <View style={styles.slotsPill}>
            <Ionicons name="people" size={13} color="#059669" />
            <Text style={styles.slotsPillText}>
              {item.slotsLeft || 1} open
            </Text>
          </View>
        </View>

        {/* Date & Time Bar */}
        <View
          style={[
            styles.dateTimeBar,
            { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' },
          ]}
        >
          <View style={styles.metaCol}>
            <Ionicons name="calendar" size={15} color="#3B82F6" />
            <Text
              style={[
                styles.metaText,
                { color: isDark ? '#CBD5E1' : '#334155' },
              ]}
            >
              {item.date || 'Available Date'}
            </Text>
          </View>

          <View style={styles.metaDivider} />

          <View style={styles.metaCol}>
            <Ionicons name="time" size={15} color="#8B5CF6" />
            <Text
              style={[
                styles.metaText,
                { color: isDark ? '#CBD5E1' : '#334155' },
              ]}
            >
              {item.startTime} - {item.endTime}
            </Text>
          </View>

          <View style={styles.metaDivider} />

          <View style={styles.metaCol}>
            <Ionicons name="location" size={15} color="#10B981" />
            <Text
              numberOfLines={1}
              style={[
                styles.metaText,
                { color: isDark ? '#CBD5E1' : '#334155' },
              ]}
            >
              {item.serviceArea}
            </Text>
          </View>
        </View>

        {/* Services Badges */}
        <View style={styles.servicesRow}>
          {(item.services || ['Companionship']).map((svc, idx) => (
            <View
              key={idx}
              style={[
                styles.serviceChip,
                { backgroundColor: isDark ? '#1E3A8A' : '#EFF6FF' },
              ]}
            >
              <Text
                style={[
                  styles.serviceChipText,
                  { color: isDark ? '#93C5FD' : '#1D4ED8' },
                ]}
              >
                {svc}
              </Text>
            </View>
          ))}
        </View>

        {/* Notes if available */}
        {Boolean(item.specialSkills) && (
          <Text
            numberOfLines={2}
            style={[
              styles.notesText,
              { color: isDark ? '#94A3B8' : '#64748B' },
            ]}
          >
            "{item.specialSkills}"
          </Text>
        )}

        {/* Actions Button Group */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={[
              styles.viewProfileBtn,
              {
                borderColor: isDark ? '#475569' : '#CBD5E1',
                backgroundColor: isDark ? '#334155' : '#F8FAFC',
              },
            ]}
            onPress={() => handleOpenProfile(item)}
            activeOpacity={0.75}
          >
            <Ionicons
              name="person-circle-outline"
              size={18}
              color={isDark ? '#CBD5E1' : '#475569'}
            />
            <Text
              style={[
                styles.viewProfileBtnText,
                { color: isDark ? '#CBD5E1' : '#475569' },
              ]}
            >
              View Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acceptCardBtn}
            onPress={() => handlePromptAccept(item)}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
            <Text style={styles.acceptCardBtnText}>Accept Visit</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' },
      ]}
    >
      {/* Screen Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            borderBottomColor: isDark ? '#334155' : '#E2E8F0',
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text
              style={[
                styles.headerTitle,
                { color: isDark ? '#F8FAFC' : '#0F172A' },
              ]}
            >
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
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.requestNewBtnText}>Post Request</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Input */}
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
              borderColor: isDark ? '#334155' : '#CBD5E1',
            },
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={isDark ? '#94A3B8' : '#64748B'}
          />
          <TextInput
            style={[
              styles.searchInput,
              { color: isDark ? '#F8FAFC' : '#0F172A' },
            ]}
            placeholder="Search by city, town or area..."
            placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            value={searchLocation}
            onChangeText={setSearchLocation}
            returnKeyType="search"
          />
          {Boolean(searchLocation) && (
            <TouchableOpacity onPress={() => setSearchLocation('')}>
              <Ionicons
                name="close-circle"
                size={18}
                color={isDark ? '#94A3B8' : '#64748B'}
              />
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
                  isSelected
                    ? styles.categoryPillActive
                    : {
                        backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
                        borderColor: isDark ? '#334155' : '#E2E8F0',
                      },
                ]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected
                      ? styles.categoryPillTextActive
                      : { color: isDark ? '#CBD5E1' : '#64748B' },
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
          <ActivityIndicator size="large" color="#2563EB" />
          <Text
            style={[
              styles.loadingText,
              { color: isDark ? '#94A3B8' : '#64748B' },
            ]}
          >
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
              tintColor="#2563EB"
              colors={['#2563EB']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name="heart-dislike-outline"
                size={56}
                color={isDark ? '#475569' : '#94A3B8'}
              />
              <Text
                style={[
                  styles.emptyStateTitle,
                  { color: isDark ? '#F8FAFC' : '#1E293B' },
                ]}
              >
                No Volunteer Offers Found
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtext,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                {selectedCategory !== 'All' || searchLocation
                  ? 'Try changing your category filter or search area.'
                  : 'Check back soon as volunteers frequently post new companionship availability!'}
              </Text>
              {onRequestNew && (
                <TouchableOpacity
                  style={styles.emptyRequestBtn}
                  onPress={onRequestNew}
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

      {/* 1. Volunteer Profile Inspection Modal */}
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

      {/* 2. In-App Confirmation Modal Sheet (Zero dependency on native alerts) */}
      <Modal
        visible={!!confirmingOffer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !isAccepting && setConfirmingOffer(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.confirmCard,
              { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
            ]}
          >
            <View style={styles.confirmHeaderRow}>
              <View style={styles.confirmIconWrap}>
                <Ionicons name="calendar" size={26} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.confirmTitle,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  Confirm Companion Visit
                </Text>
                <Text style={styles.confirmSub}>
                  Accept and add to your personal schedule
                </Text>
              </View>
            </View>

            {confirmingOffer && (
              <View
                style={[
                  styles.offerSummaryBox,
                  { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' },
                ]}
              >
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Volunteer:</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: isDark ? '#93C5FD' : '#1D4ED8' },
                    ]}
                  >
                    {confirmingOffer.volunteerName}
                  </Text>
                </View>

                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Scheduled Date:</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: isDark ? '#F8FAFC' : '#0F172A' },
                    ]}
                  >
                    {confirmingOffer.date}
                  </Text>
                </View>

                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Time Window:</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: isDark ? '#F8FAFC' : '#0F172A' },
                    ]}
                  >
                    {confirmingOffer.startTime} - {confirmingOffer.endTime}
                  </Text>
                </View>

                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Location:</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: isDark ? '#F8FAFC' : '#0F172A' },
                    ]}
                  >
                    {confirmingOffer.serviceArea}
                  </Text>
                </View>

                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Services:</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: isDark ? '#F8FAFC' : '#0F172A' },
                    ]}
                  >
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
                style={[
                  styles.cancelConfirmBtn,
                  { borderColor: isDark ? '#475569' : '#CBD5E1' },
                ]}
                onPress={() => setConfirmingOffer(null)}
                disabled={isAccepting}
              >
                <Text
                  style={[
                    styles.cancelConfirmBtnText,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  Cancel
                </Text>
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

      {/* 3. Visit Confirmation Success Modal Sheet */}
      <Modal
        visible={!!successOffer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSuccessOffer(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.successCard,
              { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
            ]}
          >
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={60} color="#10B981" />
            </View>

            <Text
              style={[
                styles.successTitle,
                { color: isDark ? '#F8FAFC' : '#0F172A' },
              ]}
            >
              Companionship Scheduled! 🎉
            </Text>

            <Text
              style={[
                styles.successBody,
                { color: isDark ? '#94A3B8' : '#475569' },
              ]}
            >
              Your session with{' '}
              <Text style={{ fontWeight: '700', color: '#2563EB' }}>
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
                style={[
                  styles.stayBtn,
                  { borderColor: isDark ? '#475569' : '#E2E8F0' },
                ]}
                onPress={() => setSuccessOffer(null)}
              >
                <Text
                  style={[
                    styles.stayBtnText,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
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
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : 32,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
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
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  requestNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  requestNewBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
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
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
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
  },
  servicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  serviceChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  serviceChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 18,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  viewProfileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  viewProfileBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  acceptCardBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  emptyRequestBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 420,
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
  },
  confirmSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  offerSummaryBox: {
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelConfirmBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryConfirmBtn: {
    flex: 1.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#2563EB',
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
    textAlign: 'center',
    marginBottom: 8,
  },
  successBody: {
    fontSize: 14,
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
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#2563EB',
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
  },
  stayBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
