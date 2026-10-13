// src/screens/admin/AdminRequestsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import * as adminUserService from '../../services/adminUserService';
import AdminUserDetailsScreen from './AdminUserDetailsScreen';

export default function AdminRequestsScreen({ users: propUsers, onUserUpdated }) {
  const [selectedVolunteerId, setSelectedVolunteerId] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch fresh volunteer list from admin API
  const fetchPendingVolunteers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminUserService.getAdminUsers({ role: 'volunteer' });
      if (res?.success && Array.isArray(res.users)) {
        setVolunteers(res.users);
      }
    } catch (err) {
      console.error('Fetch Pending Volunteers Error:', err.message);
      // Fallback to propUsers if API fails
      if (Array.isArray(propUsers) && propUsers.length > 0) {
        setVolunteers(propUsers.filter((u) => u.role === 'volunteer'));
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [propUsers]);

  useEffect(() => {
    fetchPendingVolunteers();
  }, [fetchPendingVolunteers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingVolunteers();
    if (onUserUpdated) onUserUpdated();
  };

  // Determine which volunteers are in "Pending Approval" status
  // Covers both verificationBadgeStatus === 'pending' and volunteerVerification.status === 'PENDING'
  const sourceList = volunteers.length > 0
    ? volunteers
    : Array.isArray(propUsers)
    ? propUsers.filter((u) => u.role === 'volunteer')
    : [];

  const pendingVolunteers = sourceList.filter((u) => {
    const isVolunteer = u.role === 'volunteer';
    const isBadgePending =
      u.verificationBadgeStatus === 'pending' ||
      u.verificationBadgeStatus === 'pending_approval' ||
      u.verificationBadgeStatus === 'Pending Approval';
    const isVerificationPending =
      u.volunteerVerification?.status === 'PENDING' ||
      u.volunteerVerification?.status === 'pending';
    return isVolunteer && (isBadgePending || isVerificationPending);
  });

  // Search filter
  const filteredRequests = pendingVolunteers.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const customId = (u.customId || '').toLowerCase();
    const phone = (u.phone || '').toLowerCase();
    return (
      fullName.includes(q) ||
      email.includes(q) ||
      customId.includes(q) ||
      phone.includes(q)
    );
  });

  // If a volunteer is selected for review, display full user details screen
  // containing credentials, uploaded evidence list, and AdminEvidenceReviewModal
  if (selectedVolunteerId) {
    return (
      <AdminUserDetailsScreen
        userId={selectedVolunteerId}
        onBack={() => {
          setSelectedVolunteerId(null);
          fetchPendingVolunteers();
        }}
        onUserUpdated={() => {
          fetchPendingVolunteers();
          if (onUserUpdated) onUserUpdated();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerIconCircle}>
          <Ionicons name="clipboard" size={24} color="#1E40AF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Verification Requests</Text>
          <Text style={styles.headerSubtitle}>
            Review evidence uploaded by volunteers requesting ID Verification Badges
          </Text>
        </View>
        {pendingVolunteers.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{pendingVolunteers.length}</Text>
          </View>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={18} color="#64748B" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search pending volunteers by name or ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94A3B8"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Request List */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary || '#1E40AF'} />
          <Text style={styles.loadingText}>Loading verification requests...</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollPadding}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="shield-checkmark" size={36} color="#16A34A" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No Matching Requests' : 'No Pending Requests'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'No pending volunteer requests match your search query.'
                  : 'All volunteer ID verification submissions have been reviewed and approved.'}
              </Text>
              <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.8}>
                <Ionicons name="refresh" size={15} color="#1E40AF" style={{ marginRight: 6 }} />
                <Text style={styles.refreshBtnText}>Check for Updates</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredRequests.map((volunteer) => {
              const idType =
                volunteer.volunteerVerification?.credentialType ||
                volunteer.volunteerIdType ||
                'ID Document';
              const idNumber =
                volunteer.volunteerVerification?.credentialNumber ||
                volunteer.volunteerIdNumber;
              const evidenceCount =
                volunteer.volunteerVerification?.evidenceFiles?.length || 1;

              return (
                <TouchableOpacity
                  key={volunteer._id || volunteer.customId}
                  style={styles.volunteerCard}
                  onPress={() => setSelectedVolunteerId(volunteer._id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardTopRow}>
                    {/* Avatar */}
                    <View style={styles.avatarCircle}>
                      {volunteer.profilePicture || volunteer.avatar ? (
                        <Image
                          source={{ uri: volunteer.profilePicture || volunteer.avatar }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <Text style={styles.avatarInitial}>
                          {volunteer.firstName?.[0] || 'V'}
                          {volunteer.lastName?.[0] || ''}
                        </Text>
                      )}
                    </View>

                    {/* Name & Basic Info */}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={styles.nameRoleRow}>
                        <Text style={styles.volunteerName} numberOfLines={1}>
                          {volunteer.firstName} {volunteer.lastName}
                        </Text>
                        <View style={styles.volunteerRoleTag}>
                          <Text style={styles.volunteerRoleText}>VOLUNTEER</Text>
                        </View>
                      </View>
                      <Text style={styles.volunteerEmail} numberOfLines={1}>
                        {volunteer.email}
                      </Text>
                      <Text style={styles.volunteerIdText}>
                        ID: {volunteer.customId || 'N/A'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  {/* Submission Details */}
                  <View style={styles.submissionDetailsRow}>
                    <View style={styles.credentialPill}>
                      <Ionicons name="card-outline" size={14} color="#475569" style={{ marginRight: 4 }} />
                      <Text style={styles.credentialPillText}>
                        {idType} {idNumber ? `• ${idNumber}` : ''}
                      </Text>
                    </View>

                    <View style={styles.evidencePill}>
                      <Ionicons name="document-attach" size={14} color="#0284C7" style={{ marginRight: 4 }} />
                      <Text style={styles.evidencePillText}>
                        {evidenceCount} Evidence {evidenceCount === 1 ? 'File' : 'Files'}
                      </Text>
                    </View>
                  </View>

                  {/* Action Footer */}
                  <View style={styles.cardActionFooter}>
                    <View style={styles.pendingBadge}>
                      <Ionicons name="hourglass-outline" size={13} color="#D97706" style={{ marginRight: 4 }} />
                      <Text style={styles.pendingBadgeText}>Pending Approval</Text>
                    </View>

                    <View style={styles.reviewButton}>
                      <Text style={styles.reviewButtonText}>Review Evidence</Text>
                      <Ionicons name="chevron-forward" size={16} color="#1E40AF" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  countBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  scrollPadding: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 20,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  refreshBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  volunteerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E40AF',
  },
  nameRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  volunteerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  volunteerRoleTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  volunteerRoleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
  },
  volunteerEmail: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  volunteerIdText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  submissionDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  credentialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  credentialPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
  },
  evidencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  evidencePillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0284C7',
  },
  cardActionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reviewButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E40AF',
    marginRight: 2,
  },
});
