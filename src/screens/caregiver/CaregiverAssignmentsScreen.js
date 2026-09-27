// src/screens/caregiver/CaregiverAssignmentsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../constants/theme';
import * as caregiverService from '../../services/caregiverService';

export default function CaregiverAssignmentsScreen({ onBack, onViewCompletedVisits }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Conflict modal state (US-402)
  const [conflictModalVisible, setConflictModalVisible] = useState(false);
  const [conflictDetails, setConflictDetails] = useState(null);

  const fetchAssignments = async () => {
    try {
      const res = await caregiverService.getAvailableAssignments();
      if (res?.success) {
        setAssignments(res.data || []);
      }
    } catch (err) {
      console.error('Fetch Assignments Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAssignments();
  };

  const handleAcceptAssignment = async (assignment) => {
    try {
      setActionLoading(true);
      const res = await caregiverService.acceptAssignment(assignment.id, assignment.type);

      if (res?.success) {
        Alert.alert(
          'Assignment Accepted! 🎉',
          `You have been assigned to ${assignment.senior?.firstName}'s care visit on ${assignment.date} at ${assignment.time}.`
        );
        fetchAssignments();
      }
    } catch (err) {
      // Check for US-402 Schedule Conflict
      if (err.response?.status === 409 && err.response?.data?.conflict) {
        setConflictDetails(err.response.data);
        setConflictModalVisible(true);
      } else {
        Alert.alert(
          'Could Not Accept Assignment',
          err.response?.data?.message || 'Server error while accepting assignment'
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = assignments.filter((a) => {
    if (activeFilter === 'HELP') return a.type === 'help_request';
    if (activeFilter === 'COMPANION') return a.type === 'companionship';
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Available Care Assignments</Text>
        <TouchableOpacity onPress={onViewCompletedVisits} style={styles.statsBtn}>
          <Icon name="time-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterBar}>
        {['ALL', 'HELP', 'COMPANION'].map((filterKey) => (
          <TouchableOpacity
            key={filterKey}
            style={[styles.filterChip, activeFilter === filterKey && styles.filterChipActive]}
            onPress={() => setActiveFilter(filterKey)}
          >
            <Text style={[styles.filterChipText, activeFilter === filterKey && styles.filterChipTextActive]}>
              {filterKey === 'ALL'
                ? `All (${assignments.length})`
                : filterKey === 'HELP'
                ? 'Help Requests'
                : 'Companionship'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.secondary]} />}
      >
        <View style={styles.infoBanner}>
          <Icon name="information-circle-outline" size={22} color={COLORS.secondary} />
          <Text style={styles.infoBannerText}>
            Select an assignment to provide care. The system automatically verifies your schedule to prevent time conflicts (US-402).
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.secondary} />
            <Text style={styles.loadingText}>Fetching available assignments...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="checkbox-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Open Assignments</Text>
            <Text style={styles.emptyDesc}>
              There are no available care requests in need of a caregiver right now. Check back soon!
            </Text>
          </View>
        ) : (
          filtered.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>
                    {item.type === 'help_request' ? `${item.serviceType} Assistance` : `${item.serviceType} Visit`}
                  </Text>
                </View>
                <Text style={styles.dateText}>
                  {item.date} • {item.time}
                </Text>
              </View>

              <Text style={styles.seniorName}>
                Senior: {item.senior?.firstName} {item.senior?.lastName || ''} ({item.senior?.age || 'N/A'} yrs)
              </Text>
              <Text style={styles.locationText}>
                📍 Location: {item.location || 'Home Address'} ({item.senior?.address?.city || 'Sri Lanka'})
              </Text>

              {item.familyContact && (
                <Text style={styles.familyText}>
                  Family Contact: {item.familyContact.firstName} {item.familyContact.lastName || ''} (📞 {item.familyContact.phone})
                </Text>
              )}

              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => handleAcceptAssignment(item)}
                disabled={actionLoading}
              >
                <Icon name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.acceptBtnText}>Accept Care Assignment</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Schedule Conflict Modal (US-402) */}
      <Modal visible={conflictModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.conflictCard}>
            <View style={styles.conflictIconCircle}>
              <Icon name="alert-circle" size={36} color="#DC2626" />
            </View>
            <Text style={styles.conflictTitle}>Schedule Conflict Detected!</Text>
            <Text style={styles.conflictSub}>US-402 Conflict Prevention</Text>
            <Text style={styles.conflictMessage}>
              {conflictDetails?.message || 'You already have another care visit scheduled at an overlapping time.'}
            </Text>

            {conflictDetails?.conflictingVisit && (
              <View style={styles.conflictDetailsBox}>
                <Text style={styles.conflictDetailsTitle}>Conflicting Scheduled Visit:</Text>
                <Text style={styles.conflictDetailsText}>
                  • Date: {conflictDetails.conflictingVisit.date}
                </Text>
                <Text style={styles.conflictDetailsText}>
                  • Time: {conflictDetails.conflictingVisit.time}
                </Text>
                <Text style={styles.conflictDetailsText}>
                  • Service: {conflictDetails.conflictingVisit.serviceType}
                </Text>
                {conflictDetails.conflictingVisit.senior && (
                  <Text style={styles.conflictDetailsText}>
                    • Senior: {conflictDetails.conflictingVisit.senior.firstName} {conflictDetails.conflictingVisit.senior.lastName || ''}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.conflictCloseBtn}
              onPress={() => setConflictModalVisible(false)}
            >
              <Text style={styles.conflictCloseBtnText}>Acknowledge & Choose Another</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  statsBtn: { padding: 6 },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#3B82F6' },
  filterChipText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  filterChipTextActive: { color: '#1E40AF', fontWeight: 'bold' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDFA',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginBottom: 14,
  },
  infoBannerText: { fontSize: 12, color: '#0F766E', flex: 1, lineHeight: 16 },
  loadingBox: { paddingVertical: 50, alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 14, color: COLORS.textSecondary },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    padding: 36,
    alignItems: 'center',
    marginVertical: 30,
  },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  typeBadgeText: { fontSize: 12, fontWeight: 'bold', color: COLORS.primary },
  dateText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  seniorName: { fontSize: 15, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 4 },
  locationText: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  familyText: { fontSize: 12, color: '#475569', marginBottom: 12 },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 10,
    borderRadius: 8,
  },
  acceptBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  // Conflict Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  conflictCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  conflictIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  conflictTitle: { fontSize: 18, fontWeight: 'bold', color: '#DC2626', textAlign: 'center' },
  conflictSub: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginTop: 2, marginBottom: 10 },
  conflictMessage: { fontSize: 13, color: '#334155', textAlign: 'center', lineHeight: 18, marginBottom: 14 },
  conflictDetailsBox: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  conflictDetailsTitle: { fontSize: 12, fontWeight: 'bold', color: '#991B1B', marginBottom: 4 },
  conflictDetailsText: { fontSize: 12, color: '#7F1D1D', marginTop: 2 },
  conflictCloseBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  conflictCloseBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
});
