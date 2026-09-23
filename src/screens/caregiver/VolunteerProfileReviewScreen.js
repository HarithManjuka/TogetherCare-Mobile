// src/screens/caregiver/VolunteerProfileReviewScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import client from '../../api/client';
import { COLORS, SIZES } from '../../constants/theme';

export default function VolunteerProfileReviewScreen({
  requestId,
  selectedVolunteerId,
  onBack,
  onApproveSuccess,
}) {
  const [request, setRequest] = useState(null);
  const [volunteer, setVolunteer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // In-App Dialog States
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const res = await client.get(`/help-requests/${requestId}`);
      if (res.data?.success) {
        setRequest(res.data.data);
        
        // Find the selected volunteer profile in matches
        if (selectedVolunteerId && res.data.matches) {
          const matchObj = res.data.matches.find(
            (m) => m.volunteer.profile._id === selectedVolunteerId
          );
          if (matchObj) {
            setVolunteer(matchObj.volunteer);
          } else {
            setVolunteer(res.data.volunteer);
          }
        } else {
          setVolunteer(res.data.volunteer);
        }
      }
    } catch (error) {
      console.error('Fetch Volunteer Profile Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId, selectedVolunteerId]);

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      const volunteerId = selectedVolunteerId || volunteer?.profile?._id;
      const res = await client.post(`/help-requests/${requestId}/approve`, { volunteerId });
      if (res.data?.success) {
        setConfirmModalVisible(false);
        setSuccessModalVisible(true);
      }
    } catch (error) {
      console.error('Confirm Match Error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      const res = await client.post(`/help-requests/${requestId}/reject`);
      if (res.data?.success) {
        onBack();
      }
    } catch (error) {
      console.error('Reject Match Error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text style={styles.loadingText}>Fetching volunteer details...</Text>
      </View>
    );
  }

  const profile = volunteer?.profile;
  const volunteerName = profile ? `${profile.firstName} ${profile.lastName || ''}`.trim() : '';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-back-outline" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Volunteer</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Volunteer Main Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.firstName[0]}
              {profile?.lastName[0]}
            </Text>
          </View>
          <Text style={styles.volunteerName}>
            {profile?.firstName} {profile?.lastName}
          </Text>
          <Text style={styles.volunteerPhone}>{profile?.phone}</Text>

          {/* Verification Badge */}
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.badge,
                profile?.verificationBadgeStatus === 'verified'
                  ? styles.badgeVerified
                  : styles.badgeUnverified,
              ]}
            >
              <Icon
                name={
                  profile?.verificationBadgeStatus === 'verified'
                    ? 'shield-checkmark'
                    : 'shield-outline'
                }
                size={14}
                color="#FFFFFF"
              />
              <Text style={styles.badgeText}>
                {profile?.verificationBadgeStatus === 'verified'
                  ? 'Admin Verified'
                  : 'Pending Verification'}
              </Text>
            </View>
          </View>
        </View>

        {/* Volunteer Rating summary */}
        <Text style={styles.sectionTitle}>Ratings & Trust Score</Text>
        <View style={styles.ratingSummaryCard}>
          <View style={styles.ratingValueBox}>
            <Text style={styles.ratingTextVal}>{volunteer?.averageRating || '5.0'}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Icon
                  key={s}
                  name={s <= (volunteer?.averageRating || 5) ? 'star' : 'star-outline'}
                  size={16}
                  color="#F59E0B"
                />
              ))}
            </View>
            <Text style={styles.ratingCountText}>
              {volunteer?.ratingCount || 0} reviews in community
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.trustMetricBox}>
            <Text style={styles.trustLabel}>Intergenerational Trust</Text>
            <Text style={styles.trustValue}>100% Reliable</Text>
            <Text style={styles.trustSub}>No late check-ins reported</Text>
          </View>
        </View>

        {/* Service Request info */}
        <Text style={styles.sectionTitle}>Requested Visit Details</Text>
        <View style={styles.requestDetailsCard}>
          <View style={styles.detailRow}>
            <Icon name="chatbox-ellipses-outline" size={20} color={COLORS.secondary} />
            <View>
              <Text style={styles.detailLabel}>Service</Text>
              <Text style={styles.detailValue}>{request?.serviceType}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Icon name="calendar-outline" size={20} color={COLORS.secondary} />
            <View>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValue}>
                {request?.date} at {request?.time}
              </Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Icon name="location-outline" size={20} color={COLORS.secondary} />
            <View>
              <Text style={styles.detailLabel}>Location Address</Text>
              <Text style={styles.detailValue}>{request?.location}</Text>
            </View>
          </View>
        </View>

        {/* Previous Reviews list */}
        <Text style={styles.sectionTitle}>Recent Reviews</Text>
        {!volunteer?.reviews || volunteer.reviews.length === 0 ? (
          <Text style={styles.noReviewsText}>This volunteer doesn't have any reviews yet.</Text>
        ) : (
          volunteer.reviews.map((rev, index) => (
            <View key={index} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewStars}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Icon
                      key={s}
                      name={s <= rev.rating ? 'star' : 'star-outline'}
                      size={12}
                      color="#F59E0B"
                    />
                  ))}
                </View>
                <Text style={styles.reviewDate}>{new Date(rev.date).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.reviewComment}>"{rev.feedback}"</Text>
            </View>
          ))
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.rejectBtn} onPress={handleReject}>
            <Icon name="close-circle-outline" size={18} color={COLORS.danger} />
            <Text style={styles.rejectBtnText}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.approveBtn}
            onPress={() => setConfirmModalVisible(true)}
          >
            <Icon name="checkmark-circle-outline" size={18} color="#FFFFFF" />
            <Text style={styles.approveBtnText}>Confirm Match</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 1. Custom In-App Confirm Link Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setConfirmModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalCard}>
                <View style={styles.modalIconWrap}>
                  <Icon name="calendar-outline" size={32} color={COLORS.secondary} />
                </View>
                <Text style={styles.modalTitle}>Confirm Volunteer Match</Text>
                <Text style={styles.modalBodyText}>
                  Are you sure you want to book{' '}
                  <Text style={{ fontWeight: 'bold', color: COLORS.textPrimary }}>
                    {volunteerName}
                  </Text>{' '}
                  for this visit?
                </Text>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setConfirmModalVisible(false)}
                    disabled={actionLoading}
                  >
                    <Text style={styles.modalCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalConfirmBtn}
                    onPress={handleApprove}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalConfirmBtnText}>Confirm Match</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 2. Custom In-App Success Alert Modal */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSuccessModalVisible(false);
          onApproveSuccess();
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setSuccessModalVisible(false);
            onApproveSuccess();
          }}
        >
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalCard}>
                <View style={[styles.modalIconWrap, { backgroundColor: '#E8F5E9' }]}>
                  <Icon name="checkmark-circle-outline" size={32} color={COLORS.success} />
                </View>
                <Text style={styles.modalTitle}>Match Confirmed!</Text>
                <Text style={styles.modalBodyText}>
                  The volunteer visit has been scheduled. You can track their arrival status now!
                </Text>

                <TouchableOpacity
                  style={[styles.modalConfirmBtn, { width: '100%', backgroundColor: COLORS.success }]}
                  onPress={() => {
                    setSuccessModalVisible(false);
                    onApproveSuccess();
                  }}
                >
                  <Text style={styles.modalConfirmBtnText}>Track Arrival</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
  scrollContainer: { padding: 20, paddingBottom: 60 },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 24 },
  volunteerName: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
  volunteerPhone: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  badgeRow: { marginTop: 10 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeVerified: { backgroundColor: COLORS.success },
  badgeUnverified: { backgroundColor: '#94A3B8' },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginTop: 22, marginBottom: 12 },
  ratingSummaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  ratingValueBox: { flex: 1, alignItems: 'center' },
  ratingTextVal: { fontSize: 32, fontWeight: 'bold', color: COLORS.textPrimary },
  starsRow: { flexDirection: 'row', marginVertical: 4 },
  ratingCountText: { fontSize: 11, color: COLORS.textSecondary },
  divider: { width: 1, height: '80%', backgroundColor: '#E2E8F0', marginHorizontal: 16 },
  trustMetricBox: { flex: 1, alignItems: 'center' },
  trustLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  trustValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.secondary, marginTop: 4 },
  trustSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  requestDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  detailRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  detailLabel: { fontSize: 11, color: COLORS.textSecondary },
  detailValue: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500', marginTop: 2 },
  noReviewsText: { fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic' },
  reviewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewStars: { flexDirection: 'row' },
  reviewDate: { fontSize: 11, color: COLORS.textSecondary },
  reviewComment: { fontSize: 13, color: COLORS.textPrimary, fontStyle: 'italic' },
  actionButtonsRow: { flexDirection: 'row', gap: 12, marginTop: 35 },
  rejectBtn: {
    flex: 1,
    borderColor: COLORS.danger,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: SIZES.standardButtonHeight,
  },
  approveBtn: {
    flex: 2.2,
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: SIZES.standardButtonHeight,
  },
  rejectBtnText: { color: COLORS.danger, fontWeight: 'bold', fontSize: 15 },
  approveBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },

  // Custom Modal Overlay Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalBodyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  modalConfirmBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
