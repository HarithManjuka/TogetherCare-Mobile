// src/screens/caregiver/VolunteerSelectionScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import client from '../../api/client';
import { COLORS } from '../../constants/theme';

export default function VolunteerSelectionScreen({ requestId, refreshTrigger, onSelectVolunteer, onCancel }) {
  const [request, setRequest] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequestMatches = async () => {
    try {
      setLoading(true);
      const res = await client.get(`/help-requests/${requestId}`);
      if (res.data?.success) {
        setRequest(res.data.data);
        setVolunteers(res.data.matches || []);
      }
    } catch (error) {
      console.error('Fetch Matches Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestMatches();
  }, [requestId, refreshTrigger]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text style={styles.loadingText}>Searching for available volunteers...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <Icon name="arrow-back-outline" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Volunteer</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Request details info block */}
        <View style={styles.requestSummaryCard}>
          <Text style={styles.requestLabel}>VISIT DESCRIPTION</Text>
          <Text style={styles.requestTitle}>{request?.serviceType} Visit</Text>
          <Text style={styles.requestSub}>
            For: {request?.elderlyId?.firstName} {request?.elderlyId?.lastName}
          </Text>
          <Text style={styles.requestSub}>
            Date: {request?.date} at {request?.time}
          </Text>
          <Text style={styles.requestSub}>
            Location: {request?.location}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Available Volunteers ({volunteers.length})</Text>

        {volunteers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="people-outline" size={40} color="#94A3B8" />
            <Text style={styles.emptyText}>No volunteers matched this location or date.</Text>
            <Text style={styles.emptySubtext}>Try submitting a request for a different date or city.</Text>
          </View>
        ) : (
          volunteers.map((match) => {
            const v = match.volunteer;
            const profile = v.profile;
            return (
              <View key={profile._id} style={styles.volunteerCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {profile.firstName[0]}{profile.lastName[0]}
                    </Text>
                  </View>
                  <View style={styles.infoCol}>
                    <View style={styles.nameRow}>
                      <Text style={styles.volunteerName}>
                        {profile.firstName} {profile.lastName}
                      </Text>
                      {profile.verificationBadgeStatus === 'verified' && (
                        <Icon name="shield-checkmark" size={16} color={COLORS.success} />
                      )}
                    </View>
                    <View style={styles.ratingRow}>
                      <Icon name="star" size={14} color="#F59E0B" />
                      <Text style={styles.ratingVal}>{v.averageRating || '5.0'}</Text>
                      <Text style={styles.ratingCount}>({v.ratingCount} reviews)</Text>
                    </View>
                    <Text style={styles.cityText}>
                      Based in: {profile.address?.city}
                    </Text>
                  </View>
                </View>

                {/* Confirm / View button */}
                <TouchableOpacity
                  style={styles.reviewBtn}
                  onPress={() => onSelectVolunteer(profile._id)}
                >
                  <Text style={styles.reviewBtnText}>Review Profile</Text>
                  <Icon name="chevron-forward-outline" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
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
  requestSummaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  requestLabel: { fontSize: 10, fontWeight: '800', color: '#93C5FD', letterSpacing: 0.5 },
  requestTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginTop: 4, marginBottom: 6 },
  requestSub: { fontSize: 13, color: '#DBEAFE', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    padding: 30,
    alignItems: 'center',
  },
  emptyText: { color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 14, marginTop: 8 },
  emptySubtext: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4, textAlign: 'center' },
  volunteerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  infoCol: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  volunteerName: { fontSize: 15, fontWeight: 'bold', color: COLORS.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingVal: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  ratingCount: { fontSize: 11, color: COLORS.textSecondary },
  cityText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  reviewBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: 6,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 4,
  },
  reviewBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
});
