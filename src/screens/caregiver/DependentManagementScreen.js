// src/screens/caregiver/DependentManagementScreen.js
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
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../constants/theme';
import * as dependentService from '../../services/dependentService';

export default function DependentManagementScreen({
  onBack,
  onAddDependent,
  onRequestHelpForSenior,
  onMonitorSenior,
}) {
  const [dependents, setDependents] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [depRes, pendRes] = await Promise.all([
        dependentService.getDependents(),
        dependentService.getPendingRequests(),
      ]);
      if (depRes?.success) {
        setDependents(depRes.data || []);
      }
      if (pendRes?.success) {
        setPendingRequests(pendRes.data || []);
      }
    } catch (err) {
      console.error('Fetch Dependents Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleUnlink = (senior) => {
    Alert.alert(
      'Unlink Senior Dependent',
      `Are you sure you want to unlink ${senior.firstName} ${senior.lastName}? You will no longer receive their alerts or manage visits.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              const res = await dependentService.unlinkDependent(senior._id);
              if (res?.success) {
                Alert.alert('Success', `${senior.firstName} has been unlinked.`);
                fetchDependents();
              } else {
                Alert.alert('Error', res?.message || 'Failed to unlink senior');
              }
            } catch (err) {
              console.error('Unlink Error:', err);
              Alert.alert('Error', 'Server error while unlinking senior');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dependent Management</Text>
        <TouchableOpacity onPress={onAddDependent} style={styles.addIconBtn}>
          <Icon name="person-add" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.secondary]} />}
      >
        <View style={styles.introCard}>
          <Icon name="shield-checkmark-outline" size={26} color={COLORS.secondary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.introTitle}>Family Dependent Oversight</Text>
            <Text style={styles.introDesc}>
              Manage multiple seniors under your care. Link new accounts, monitor their activities, and respond to SOS alerts.
            </Text>
          </View>
        </View>

        {/* Pending Approvals Section */}
        {pendingRequests.length > 0 ? (
          <View style={{ marginBottom: 20 }}>
            <View style={styles.listHeader}>
              <Text style={[styles.sectionTitle, { color: '#B45309' }]}>
                Pending Senior Approvals ({pendingRequests.length})
              </Text>
            </View>
            {pendingRequests.map((req) => (
              <View
                key={req.seniorId || req._id}
                style={[
                  styles.seniorCard,
                  { borderColor: '#F59E0B', borderWidth: 1.5, backgroundColor: '#FFFBEB' },
                ]}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.avatar, { backgroundColor: '#FDE68A' }]}>
                    <Text style={[styles.avatarText, { color: '#92400E' }]}>
                      {req.firstName ? req.firstName[0] : 'S'}
                      {req.lastName ? req.lastName[0] : ''}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.seniorName}>
                        {req.firstName} {req.lastName || ''}
                      </Text>
                      <View style={[styles.idPill, { backgroundColor: '#FEF3C7' }]}>
                        <Text style={[styles.idPillText, { color: '#B45309' }]}>AWAITING APPROVAL</Text>
                      </View>
                    </View>
                    <Text style={styles.seniorDetails}>
                      ID: {req.customId || 'SENIOR'} • Relationship: {req.relationship || 'Family Member'}
                    </Text>
                    <Text style={[styles.seniorPhone, { color: '#92400E', marginTop: 4 }]}>
                      ⏳ Link request sent. Waiting for senior to accept from their account.
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>
            Linked Seniors ({dependents.length})
          </Text>
          <TouchableOpacity onPress={onAddDependent} style={styles.addTextLink}>
            <Icon name="add-circle" size={16} color={COLORS.secondary} />
            <Text style={styles.addTextLinkVal}>Add Senior</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.secondary} />
            <Text style={styles.loadingText}>Loading linked seniors...</Text>
          </View>
        ) : dependents.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="people-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Seniors Linked Yet</Text>
            <Text style={styles.emptyDesc}>
              Link an existing registered senior or create their profile manually to begin remote care oversight.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={onAddDependent}>
              <Icon name="person-add-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.emptyBtnText}>Link Senior Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          dependents.map((senior) => (
            <View key={senior._id} style={styles.seniorCard}>
              {/* Senior Card Top */}
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {senior.firstName[0]}
                    {senior.lastName ? senior.lastName[0] : ''}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.seniorName}>
                      {senior.firstName} {senior.lastName || ''}
                    </Text>
                    <View style={styles.idPill}>
                      <Text style={styles.idPillText}>{senior.customId || 'SENIOR'}</Text>
                    </View>
                  </View>
                  <Text style={styles.seniorDetails}>
                    Age: {senior.age || 'N/A'} yrs • {senior.address?.city || 'Sri Lanka'}
                  </Text>
                  <Text style={styles.seniorPhone}>
                    📞 {senior.phone || 'No phone provided'}
                  </Text>
                </View>
              </View>

              {/* Emergency contact info */}
              {senior.emergencyContact?.name ? (
                <View style={styles.emergencyContactRow}>
                  <Icon name="medkit-outline" size={14} color="#DC2626" />
                  <Text style={styles.emergencyContactText}>
                    Emergency Contact: {senior.emergencyContact.name} ({senior.emergencyContact.relation || 'Contact'}) • {senior.emergencyContact.phone}
                  </Text>
                </View>
              ) : null}

              {/* Action Buttons */}
              <View style={styles.actionGrid}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.activityBtn]}
                  onPress={() => onMonitorSenior && onMonitorSenior(senior)}
                >
                  <Icon name="calendar-outline" size={15} color={COLORS.primary} />
                  <Text style={styles.activityBtnText}>Tasks & Activities</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.helpBtn]}
                  onPress={() => onRequestHelpForSenior && onRequestHelpForSenior(senior)}
                >
                  <Icon name="hand-left-outline" size={15} color="#FFFFFF" />
                  <Text style={styles.helpBtnText}>Request Help</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.unlinkBtn]}
                  onPress={() => handleUnlink(senior)}
                  disabled={actionLoading}
                >
                  <Icon name="close-circle-outline" size={15} color="#DC2626" />
                  <Text style={styles.unlinkBtnText}>Unlink</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
  addIconBtn: {
    padding: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  scrollContent: { padding: 16, paddingBottom: 40 },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0FDFA',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginBottom: 16,
  },
  introTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.secondary },
  introDesc: { fontSize: 12, color: '#475569', marginTop: 2, lineHeight: 16 },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  addTextLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addTextLinkVal: { fontSize: 13, fontWeight: '700', color: COLORS.secondary },
  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 14, color: COLORS.textSecondary },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    padding: 30,
    alignItems: 'center',
    marginVertical: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  seniorCard: {
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
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seniorName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  idPill: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  idPillText: { fontSize: 11, fontWeight: '700', color: '#1E40AF' },
  seniorDetails: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  seniorPhone: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  emergencyContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
  },
  emergencyContactText: { fontSize: 11, color: '#991B1B', fontWeight: '500', flex: 1 },
  actionGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    flex: 1,
  },
  activityBtn: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  activityBtnText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  helpBtn: { backgroundColor: COLORS.secondary },
  helpBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  unlinkBtn: { backgroundColor: '#FEE2E2', maxWidth: 80 },
  unlinkBtnText: { color: '#DC2626', fontSize: 12, fontWeight: '700' },
});
