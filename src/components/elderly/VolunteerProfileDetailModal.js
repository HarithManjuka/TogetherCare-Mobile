import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getUserReviews } from '../../services/reviewService';

const getInterestIcon = (interest) => {
  const lower = (interest || '').toLowerCase();
  if (lower.includes('walk')) return 'walk-outline';
  if (lower.includes('chat') || lower.includes('talk') || lower.includes('convers')) return 'chatbubbles-outline';
  if (lower.includes('book') || lower.includes('read') || lower.includes('story')) return 'book-outline';
  if (lower.includes('game') || lower.includes('play') || lower.includes('chess') || lower.includes('board')) return 'game-controller-outline';
  if (lower.includes('garden') || lower.includes('plant')) return 'leaf-outline';
  if (lower.includes('music') || lower.includes('sing') || lower.includes('song')) return 'musical-notes-outline';
  if (lower.includes('cook') || lower.includes('bake') || lower.includes('food')) return 'restaurant-outline';
  if (lower.includes('tech') || lower.includes('phone') || lower.includes('comput')) return 'phone-portrait-outline';
  if (lower.includes('art') || lower.includes('draw') || lower.includes('craft') || lower.includes('paint')) return 'color-palette-outline';
  if (lower.includes('med') || lower.includes('health') || lower.includes('doctor')) return 'medkit-outline';
  if (lower.includes('pet') || lower.includes('dog') || lower.includes('cat')) return 'paw-outline';
  return 'heart-outline';
};

export default function VolunteerProfileDetailModal({
  visible,
  onClose,
  offer,
  onAccept,
  isAccepting = false,
}) {
  const { colors, isDark } = useTheme();
  const [reviewsData, setReviewsData] = useState({ totalReviews: 0, averageRating: 0, reviews: [] });
  const [loadingReviews, setLoadingReviews] = useState(false);

  const volunteer = offer?.volunteerId || offer?.volunteer || (offer?.firstName ? offer : {});
  const volunteerId = volunteer._id || volunteer.id;

  useEffect(() => {
    if (visible && volunteerId) {
      setLoadingReviews(true);
      getUserReviews(volunteerId)
        .then((res) => {
          if (res && res.success && res.data) {
            setReviewsData(res.data);
          }
        })
        .catch((err) => console.log('Error loading volunteer reviews:', err.message))
        .finally(() => setLoadingReviews(false));
    }
  }, [visible, volunteerId]);

  if (!offer) return null;

  const fullName = offer.volunteerName || (volunteer.firstName ? `${volunteer.firstName} ${volunteer.lastName || ''}`.trim() : 'Community Volunteer');
  const isVerified = volunteer.verificationBadgeStatus === 'approved' || volunteer.verificationBadgeStatus === 'verified' || volunteer.isEmailVerified;
  const age = volunteer.age || offer.volunteerAge || (volunteer.dateOfBirth ? Math.floor((new Date() - new Date(volunteer.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : null);
  const institution = volunteer.educationalInstitution || volunteer.institution || 'University Community Volunteer';
  
  // Dynamic database rating metrics (No hardcoding)
  const hasLiveReviews = Boolean(reviewsData && typeof reviewsData.totalReviews === 'number' && reviewsData.totalReviews > 0);
  const dbRating = hasLiveReviews
    ? reviewsData.averageRating
    : (volunteer.rating !== undefined && volunteer.rating !== null && Number(volunteer.rating) > 0 ? Number(volunteer.rating) : null);
  const rating = dbRating !== null ? Number(dbRating).toFixed(1) : null;
  const reviewCount = hasLiveReviews ? reviewsData.totalReviews : (volunteer.totalReviews ?? volunteer.ratingCount ?? volunteer.reviewCount ?? 0);
  
  const profilePic = volunteer.profilePicture;
  const bio = volunteer.bio || 'Compassionate and dedicated youth volunteer looking to spend meaningful time with seniors in the community.';

  // Live interests fetched directly from database user document
  const volunteerInterests = Array.isArray(volunteer.interests) && volunteer.interests.length > 0
    ? volunteer.interests
    : (Array.isArray(offer.services) ? offer.services : []);

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
            styles.modalContent,
            { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleContainer}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                ]}
              >
                Volunteer Profile
              </Text>
              <Text style={styles.modalSubtitle}>
                Verified Community Companion
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: isDark ? '#334155' : '#F1F5F9' },
              ]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons
                name="close"
                size={22}
                color={isDark ? '#94A3B8' : '#64748B'}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* Volunteer Avatar & Badges */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrapper}>
                {profilePic ? (
                  <Image source={{ uri: profilePic }} style={styles.avatarImage} />
                ) : (
                  <View
                    style={[
                      styles.avatarPlaceholder,
                      { backgroundColor: '#3B82F6' },
                    ]}
                  >
                    <Ionicons name="person" size={44} color="#FFFFFF" />
                  </View>
                )}
                {isVerified && (
                  <View style={styles.verifiedCheckBadge}>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.volunteerNameText,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                ]}
              >
                {fullName}
              </Text>

              <View style={styles.badgeRow}>
                {isVerified ? (
                  <View style={styles.verifiedPill}>
                    <Ionicons name="shield-checkmark" size={14} color="#059669" />
                    <Text style={styles.verifiedPillText}>Identity Verified</Text>
                  </View>
                ) : (
                  <View style={[styles.verifiedPill, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="sparkles" size={14} color="#2563EB" />
                    <Text style={[styles.verifiedPillText, { color: '#2563EB' }]}>
                      Community Member
                    </Text>
                  </View>
                )}

                {rating ? (
                  <View style={styles.ratingPill}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingPillText}>{rating} ⭐ ({reviewCount})</Text>
                  </View>
                ) : (
                  <View style={[styles.verifiedPill, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="sparkles" size={13} color="#D97706" />
                    <Text style={[styles.verifiedPillText, { color: '#B45309' }]}>New Volunteer</Text>
                  </View>
                )}

                {age ? (
                  <View style={[styles.verifiedPill, { backgroundColor: '#F3E8FF' }]}>
                    <Ionicons name="person-outline" size={13} color="#7E22CE" />
                    <Text style={[styles.verifiedPillText, { color: '#7E22CE' }]}>{age} yrs</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Quick Stats Grid */}
            <View
              style={[
                styles.statsGrid,
                {
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.statItem}>
                <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
                <Text style={styles.statLabel}>Available Date</Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: isDark ? '#F8FAFC' : '#1E293B' },
                  ]}
                >
                  {offer.date || 'Anytime'}
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={20} color="#8B5CF6" />
                <Text style={styles.statLabel}>Time Window</Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: isDark ? '#F8FAFC' : '#1E293B' },
                  ]}
                >
                  {offer.startTime || '02:00 PM'} - {offer.endTime || '04:00 PM'}
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Ionicons name="location-outline" size={20} color="#10B981" />
                <Text style={styles.statLabel}>Service Area</Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.statValue,
                    { color: isDark ? '#F8FAFC' : '#1E293B' },
                  ]}
                >
                  {offer.serviceArea || 'Local'}
                </Text>
              </View>
            </View>

            {/* About / Bio */}
            <View style={styles.detailSection}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDark ? '#E2E8F0' : '#1E293B' },
                ]}
              >
                About the Volunteer
              </Text>
              <Text
                style={[
                  styles.bodyText,
                  { color: isDark ? '#94A3B8' : '#475569' },
                ]}
              >
                {bio}
              </Text>
            </View>

            {/* Background & Affiliation */}
            <View style={styles.detailSection}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDark ? '#E2E8F0' : '#1E293B' },
                ]}
              >
                Background & Affiliation
              </Text>
              <View style={styles.infoRow}>
                <Ionicons name="school-outline" size={18} color="#6366F1" />
                <Text
                  style={[
                    styles.infoRowText,
                    { color: isDark ? '#CBD5E1' : '#334155' },
                  ]}
                >
                  {institution}
                </Text>
              </View>
            </View>

            {/* Volunteer Interests & Hobbies (Fetched Dynamically from Database) */}
            {volunteerInterests.length > 0 && (
              <View style={styles.detailSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: isDark ? '#E2E8F0' : '#1E293B' },
                    ]}
                  >
                    Interests & Hobbies
                  </Text>
                  <View style={styles.databaseBadge}>
                    <Ionicons name="sparkles" size={11} color="#059669" />
                    <Text style={styles.databaseBadgeText}>Database Profile</Text>
                  </View>
                </View>

                <View style={styles.tagsContainer}>
                  {volunteerInterests.map((interest, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.interestChip,
                        {
                          backgroundColor: isDark ? '#0F2942' : '#F0F9FF',
                          borderColor: isDark ? '#0369A1' : '#BAE6FD',
                        },
                      ]}
                    >
                      <Ionicons
                        name={getInterestIcon(interest)}
                        size={15}
                        color={isDark ? '#38BDF8' : '#0284C7'}
                      />
                      <Text
                        style={[
                          styles.interestChipText,
                          { color: isDark ? '#E0F2FE' : '#0369A1' },
                        ]}
                      >
                        {interest}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Services Offered */}
            <View style={styles.detailSection}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDark ? '#E2E8F0' : '#1E293B' },
                ]}
              >
                Companionship Services Offered
              </Text>
              <View style={styles.tagsContainer}>
                {(offer.services || ['Companionship', 'Friendly Chat']).map(
                  (svc, idx) => (
                    <View key={idx} style={styles.serviceTag}>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={14}
                        color="#2563EB"
                      />
                      <Text style={styles.serviceTagText}>{svc}</Text>
                    </View>
                  )
                )}
              </View>
            </View>

            {/* Special Skills or Notes */}
            {Boolean(offer.specialSkills) && (
              <View style={styles.detailSection}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDark ? '#E2E8F0' : '#1E293B' },
                  ]}
                >
                  Volunteer Notes & Skills
                </Text>
                <View
                  style={[
                    styles.noteBox,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#FEF3C7',
                      borderColor: isDark ? '#B45309' : '#FDE68A',
                    },
                  ]}
                >
                  <Ionicons name="information-circle" size={18} color="#D97706" />
                  <Text
                    style={[
                      styles.noteBoxText,
                      { color: isDark ? '#FDE68A' : '#92400E' },
                    ]}
                  >
                    {offer.specialSkills}
                  </Text>
                </View>
              </View>
            )}

            {/* Slots available */}
            <View style={styles.slotsCard}>
              <Ionicons name="people" size={18} color="#059669" />
              <Text style={styles.slotsText}>
                {offer.slotsLeft || 1} out of {offer.capacity || 1} slots open for this session
              </Text>
            </View>

            {/* Ratings & Reviews Section */}
            <View style={styles.detailSection}>
              <View style={styles.sectionHeaderRow}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDark ? '#E2E8F0' : '#1E293B' },
                  ]}
                >
                  Ratings & Reviews
                </Text>
                <View style={styles.reviewScoreBadge}>
                  <Ionicons name="star" size={13} color="#F59E0B" />
                  <Text style={styles.reviewScoreBadgeText}>
                    {rating ? `${rating} (${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'})` : 'No reviews yet'}
                  </Text>
                </View>
              </View>

              {loadingReviews ? (
                <View style={styles.reviewLoadingContainer}>
                  <ActivityIndicator size="small" color="#2563EB" />
                  <Text style={[styles.loadingText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Loading community reviews...
                  </Text>
                </View>
              ) : reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
                <View style={styles.reviewsListContainer}>
                  {reviewsData.reviews.map((rev, idx) => {
                    const reviewer = rev.reviewer || rev.reviewerId || rev.elder || rev.user || {};
                    const elderName =
                      (reviewer.firstName ? `${reviewer.firstName} ${reviewer.lastName || ''}`.trim() : '') ||
                      reviewer.name ||
                      rev.reviewerName ||
                      rev.elderName ||
                      'Senior Companion';
                    const elderPic = reviewer.profilePicture;
                    const initial = elderName.charAt(0).toUpperCase() || 'S';

                    return (
                      <View
                        key={rev._id || idx}
                        style={[
                          styles.reviewCard,
                          {
                            backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                            borderColor: isDark ? '#334155' : '#E2E8F0',
                          },
                        ]}
                      >
                        <View style={styles.reviewCardHeader}>
                          <View style={styles.reviewerInfo}>
                            <View style={styles.reviewerAvatarSmall}>
                              {elderPic ? (
                                <Image source={{ uri: elderPic }} style={styles.reviewerAvatarImg} />
                              ) : (
                                <Text style={styles.reviewerInitialText}>{initial}</Text>
                              )}
                            </View>
                            <Text
                              style={[
                                styles.reviewerName,
                                { color: isDark ? '#F1F5F9' : '#1E293B' },
                              ]}
                            >
                              {elderName}
                            </Text>
                          </View>
                          <View style={styles.reviewStarRow}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Ionicons
                                key={s}
                                name={s <= Math.round(rev.rating || 5) ? 'star' : 'star-outline'}
                                size={13}
                                color="#F59E0B"
                              />
                            ))}
                          </View>
                        </View>
                        {Boolean(rev.comment || rev.feedback) && (
                          <Text
                            style={[
                              styles.reviewCommentText,
                              { color: isDark ? '#CBD5E1' : '#475569' },
                            ]}
                          >
                            "{rev.comment || rev.feedback}"
                          </Text>
                        )}
                        <Text style={[styles.reviewDateText, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                          {new Date(rev.createdAt || Date.now()).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View
                  style={[
                    styles.emptyReviewsBox,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                      borderColor: isDark ? '#334155' : '#E2E8F0',
                    },
                  ]}
                >
                  <Ionicons name="chatbox-ellipses-outline" size={24} color={isDark ? '#64748B' : '#94A3B8'} />
                  <Text style={[styles.emptyReviewsText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    No reviews yet. Be the first to rate after a completed visit!
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View
            style={[
              styles.footerContainer,
              {
                borderTopColor: isDark ? '#334155' : '#F1F5F9',
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.closeFooterBtn,
                !onAccept && { flex: 1, backgroundColor: '#2563EB', borderColor: '#2563EB' },
                { borderColor: isDark ? '#475569' : '#CBD5E1' },
              ]}
              onPress={onClose}
              disabled={isAccepting}
            >
              <Text
                style={[
                  styles.closeFooterBtnText,
                  !onAccept ? { color: '#FFFFFF', fontWeight: '700' } : { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                {onAccept ? 'Back' : 'Close Profile'}
              </Text>
            </TouchableOpacity>

            {Boolean(onAccept) && (
              <TouchableOpacity
                style={[
                  styles.acceptBtn,
                  { opacity: isAccepting ? 0.7 : 1 },
                ]}
                onPress={() => onAccept(offer)}
                disabled={isAccepting}
              >
                <Ionicons name="calendar" size={18} color="#FFFFFF" />
                <Text style={styles.acceptBtnText}>
                  {isAccepting ? 'Confirming...' : 'Accept & Schedule'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: '#3B82F6',
  },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  volunteerNameText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  verifiedPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  ratingPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  statsGrid: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  detailSection: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  databaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  databaseBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoRowText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  interestChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  serviceTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  noteBoxText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  slotsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 10,
  },
  slotsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
  },
  footerContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  closeFooterBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeFooterBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  acceptBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  reviewScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  reviewScoreBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  reviewLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  reviewsListContainer: {
    gap: 10,
    marginTop: 4,
  },
  reviewCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewerAvatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  reviewerAvatarImg: {
    width: '100%',
    height: '100%',
  },
  reviewerInitialText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E40AF',
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '700',
  },
  reviewStarRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewCommentText: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  reviewDateText: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyReviewsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 6,
  },
  emptyReviewsText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
