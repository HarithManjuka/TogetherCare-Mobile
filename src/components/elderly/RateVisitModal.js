// src/components/elderly/RateVisitModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import * as companionshipService from '../../services/companionshipService';

export default function RateVisitModal({
  visible,
  onClose,
  schedule,
  onSuccess,
}) {
  const { scale, isDark } = useTheme();

  const [visitRating, setVisitRating] = useState(0);
  const [visitReview, setVisitReview] = useState('');
  const [volunteerRating, setVolunteerRating] = useState(0);
  const [volunteerReview, setVolunteerReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (schedule && visible) {
      setVisitRating(schedule.visitRating || (schedule.rating && !schedule.volunteerRating ? schedule.rating : 0) || 0);
      setVisitReview(schedule.visitReview || schedule.feedback || '');
      setVolunteerRating(schedule.volunteerRating || 0);
      setVolunteerReview(schedule.volunteerReview || '');
      setValidationError('');
    } else {
      setVisitRating(0);
      setVisitReview('');
      setVolunteerRating(0);
      setVolunteerReview('');
      setValidationError('');
    }
  }, [schedule, visible]);

  if (!schedule) return null;

  const volunteer = schedule.volunteer || schedule.volunteerId;
  const volunteerName = volunteer
    ? `${volunteer.firstName || ''} ${volunteer.lastName || ''}`.trim()
    : schedule.companionName || 'Volunteer';
  const volunteerPic = volunteer?.profilePicture || null;
  const hasVolunteer = Boolean(volunteer || (schedule.companionName && schedule.companionName !== 'Awaiting Volunteer'));

  const handleStarPress = (type, starIndex) => {
    setValidationError('');
    if (type === 'visit') {
      setVisitRating(starIndex === visitRating ? 0 : starIndex);
    } else {
      setVolunteerRating(starIndex === volunteerRating ? 0 : starIndex);
    }
  };

  const handleSubmit = async () => {
    setValidationError('');

    const hasAnyVisitInput = visitRating > 0 || visitReview.trim().length > 0;
    const hasAnyVolInput = volunteerRating > 0 || volunteerReview.trim().length > 0;

    if (!hasAnyVisitInput && !hasAnyVolInput) {
      setValidationError('Please select a star rating or enter a review, or tap Skip.');
      return;
    }

    try {
      setSubmitting(true);
      const scheduleId = schedule._id || schedule.id;

      const payload = {
        visitRating: visitRating > 0 ? visitRating : null,
        visitReview: visitReview.trim(),
        volunteerRating: volunteerRating > 0 ? volunteerRating : null,
        volunteerReview: volunteerReview.trim(),
      };

      const res = await companionshipService.rateVisit(scheduleId, payload);

      if (res && res.success) {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
          window.alert('Thank You! ⭐\n\nYour rating and feedback have been submitted successfully.');
        } else {
          Alert.alert('Thank You! ⭐', 'Your rating and feedback have been submitted successfully.');
        }
        if (onSuccess) onSuccess(res.data);
        if (onClose) onClose();
      } else {
        setValidationError(res?.message || 'Could not submit rating. Please try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error submitting rating. Please try again.';
      setValidationError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarRow = (type, currentVal, starSize = 34) => {
    return (
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFilled = starIndex <= currentVal;
          return (
            <TouchableOpacity
              key={starIndex}
              activeOpacity={0.7}
              onPress={() => handleStarPress(type, starIndex)}
              style={styles.starButton}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Ionicons
                name={isFilled ? 'star' : 'star-outline'}
                size={Math.round(starSize * scale)}
                color={isFilled ? '#F59E0B' : '#64748B'}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.modalCard,
            { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
          ]}
        >
          {/* Header Row */}
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: isDark ? '#334155' : '#F1F5F9' },
            ]}
          >
            <View style={styles.headerLeft}>
              <View style={styles.headerIconCircle}>
                <Ionicons name="star" size={18} color="#2563EB" />
              </View>
              <View>
                <Text
                  style={[
                    styles.headerTitle,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  Rate Your Experience
                </Text>
                <Text style={[styles.headerSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  {schedule.activityType || 'Companionship Visit'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: isDark ? '#334155' : '#F1F5F9' },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
            contentContainerStyle={styles.scrollContent}
          >
            {/* SECTION 1: Rate the visit (as per sketch) */}
            <View
              style={[
                styles.sectionContainer,
                {
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <View
                style={[
                  styles.sectionHeaderBanner,
                  { backgroundColor: isDark ? '#1E293B' : '#EFF6FF' },
                ]}
              >
                <Ionicons name="calendar-outline" size={16} color="#2563EB" />
                <Text
                  style={[
                    styles.sectionHeadingText,
                    { color: isDark ? '#93C5FD' : '#1E40AF' },
                  ]}
                >
                  Rate the visit
                </Text>
              </View>

              <View style={styles.sectionBody}>
                {/* 5 Visit Stars */}
                <View style={styles.starsWrapper}>
                  {renderStarRow('visit', visitRating, 34)}
                </View>

                {/* Visit Review Input Box */}
                <View style={styles.reviewInputWrap}>
                  <Text
                    style={[
                      styles.reviewLabel,
                      { color: isDark ? '#E2E8F0' : '#1E293B' },
                    ]}
                  >
                    Review:
                  </Text>
                  <TextInput
                    style={[
                      styles.textAreaInput,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        borderColor: visitReview ? '#3B82F6' : (isDark ? '#334155' : '#CBD5E1'),
                      },
                    ]}
                    placeholder="How was your companionship visit? (Optional)"
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    multiline
                    numberOfLines={3}
                    value={visitReview}
                    onChangeText={(text) => {
                      setValidationError('');
                      setVisitReview(text);
                    }}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </View>

            {/* SECTION 2: Rate the volunteer (as per sketch) */}
            {hasVolunteer && (
              <View
                style={[
                  styles.sectionContainer,
                  styles.volunteerSectionBox,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    borderColor: isDark ? '#3B82F6' : '#93C5FD',
                  },
                ]}
              >
                <View
                  style={[
                    styles.sectionHeaderBanner,
                    { backgroundColor: isDark ? '#1E293B' : '#EEF2FF' },
                  ]}
                >
                  <Ionicons name="person-outline" size={16} color="#4F46E5" />
                  <Text
                    style={[
                      styles.sectionHeadingText,
                      { color: isDark ? '#A5B4FC' : '#3730A3' },
                    ]}
                  >
                    Rate the volunteer
                  </Text>
                </View>

                <View style={styles.sectionBody}>
                  {/* Top row: Avatar + Name (left) & Stars (right) */}
                  <View style={styles.volunteerRowTop}>
                    {/* Left: Avatar + Name */}
                    <View style={styles.volunteerIdentityBox}>
                      <View style={styles.volunteerAvatarCircle}>
                        {volunteerPic ? (
                          <Image
                            source={{ uri: volunteerPic }}
                            style={styles.avatarImg}
                          />
                        ) : (
                          <View style={styles.avatarFallback}>
                            <Ionicons name="person" size={26} color="#2563EB" />
                          </View>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.volunteerNameLabel,
                          { color: isDark ? '#F8FAFC' : '#0F172A' },
                        ]}
                        numberOfLines={1}
                      >
                        {volunteerName}
                      </Text>
                    </View>

                    {/* Right: Volunteer Stars */}
                    <View style={styles.volunteerStarsBox}>
                      {renderStarRow('volunteer', volunteerRating, 28)}
                    </View>
                  </View>

                  {/* Volunteer Review Input Box (with focused blue border as in sketch) */}
                  <View style={styles.reviewInputWrap}>
                    <Text
                      style={[
                        styles.reviewLabel,
                        { color: isDark ? '#E2E8F0' : '#1E293B' },
                      ]}
                    >
                      Review:
                    </Text>
                    <TextInput
                      style={[
                        styles.textAreaInput,
                        styles.volunteerTextArea,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                          color: isDark ? '#F8FAFC' : '#0F172A',
                          borderColor: '#2563EB',
                        },
                      ]}
                      placeholder="Share feedback about the volunteer... (Optional)"
                      placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                      multiline
                      numberOfLines={3}
                      value={volunteerReview}
                      onChangeText={(text) => {
                        setValidationError('');
                        setVolunteerReview(text);
                      }}
                      textAlignVertical="top"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Validation / Error Message */}
            {Boolean(validationError) && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.errorText}>{validationError}</Text>
              </View>
            )}

            {/* Submit Rate Button (as per sketch) */}
            <TouchableOpacity
              style={[styles.ratePrimaryBtn, submitting && { opacity: 0.7 }]}
              activeOpacity={0.85}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="star" size={18} color="#FFFFFF" />
                  <Text style={styles.ratePrimaryBtnText}>Rate</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Skip Button (optional rating) */}
            <TouchableOpacity
              style={styles.skipBtn}
              activeOpacity={0.7}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.skipBtnText}>Skip for Now</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '90%',
    elevation: 10,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 1,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 18,
    gap: 16,
  },
  sectionContainer: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  volunteerSectionBox: {
    borderWidth: 1.5,
  },
  sectionHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  sectionHeadingText: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionBody: {
    padding: 14,
  },
  starsWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  starButton: {
    padding: 2,
  },
  reviewInputWrap: {
    marginTop: 6,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  textAreaInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 70,
    borderWidth: 1.5,
  },
  volunteerTextArea: {
    borderWidth: 2,
  },
  volunteerRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  volunteerIdentityBox: {
    alignItems: 'center',
    width: 80,
  },
  volunteerAvatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  volunteerNameLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  volunteerStarsBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  ratePrimaryBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
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
    marginTop: 4,
  },
  ratePrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  skipBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
});
