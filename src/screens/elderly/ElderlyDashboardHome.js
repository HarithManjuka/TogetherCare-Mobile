// src/screens/elderly/ElderlyDashboardHome.js
import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useElderlyHome } from '../../hooks/useElderlyHome';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/theme';
import AppHeader from '../../components/common/AppHeader';
import { getElderlyHomeScreenStyles } from '../../styles/ElderlyHomeScreen.styles';
import EmergencySOSModal from '../../components/elderly/EmergencySOSModal';
import CareCircleModal from '../../components/elderly/CareCircleModal';
import * as emergencyService from '../../services/emergencyService';
import * as dependentService from '../../services/dependentService';

export default function ElderlyDashboardHome({
  onNavigateTab,
  onRequestHelp,
  onOpenProfile,
}) {
  const {
    user,
    firstName,
    greeting,
    upcomingVisits,
    isLoading,
    refreshing,
    fetchError,
    onRefresh,
    selectedVisit,
    setSelectedVisit,
    formatScheduleDate,
    renderActivityIcon,
    handleActionPress,
  } = useElderlyHome();

  const [showSOSModal, setShowSOSModal] = useState(false);
  const [activeSOS, setActiveSOS] = useState(null);
  const [showCareCircleModal, setShowCareCircleModal] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [respondingId, setRespondingId] = useState(null);

  const { scale, isLarge } = useTheme();
  const styles = useMemo(() => getElderlyHomeScreenStyles(scale), [scale]);

  // Fetch pending caregiver link requests
  const fetchPendingRequests = async () => {
    try {
      const res = await dependentService.getPendingRequests();
      if (res?.success) {
        setPendingRequests(res.data || []);
      }
    } catch (err) {
      if (user?.pendingCaregiverRequests) {
        setPendingRequests(user.pendingCaregiverRequests);
      }
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, [refreshing, user]);

  const handleRespondLink = async (caregiverId, action, caregiverName) => {
    try {
      setRespondingId(caregiverId);
      const res = await dependentService.respondLinkDependent(caregiverId, action);
      if (res?.success) {
        if (action === 'accept' || action === 'approve') {
          Alert.alert('Linked! 🎉', `You are now linked with ${caregiverName || 'your family caretaker'}.`);
        } else {
          Alert.alert('Declined', 'Link request has been declined.');
        }
        await onRefresh();
        fetchPendingRequests();
      } else {
        Alert.alert('Notice', res?.message || 'Unable to process link response');
      }
    } catch (err) {
      console.error('Respond Link Error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Server error responding to link request');
    } finally {
      setRespondingId(null);
    }
  };

  const linkedCaretaker = user?.linkedCaregiverId && typeof user.linkedCaregiverId === 'object' ? user.linkedCaregiverId : null;

  // Check if there is an active emergency SOS alert
  useEffect(() => {
    let isMounted = true;
    const checkActiveSOS = async () => {
      try {
        const res = await emergencyService.getActiveSOS();
        if (isMounted) {
          if (res?.data) {
            setActiveSOS(res.data);
          } else {
            setActiveSOS(null);
          }
        }
      } catch (err) {
        // Quiet fallback
      }
    };
    checkActiveSOS();
    return () => {
      isMounted = false;
    };
  }, [refreshing]);

  const handleQuickAction = (featureName) => {
    if (featureName === 'Request Help' || featureName === 'Companionship') {
      if (onNavigateTab) {
        onNavigateTab('requests');
      } else if (onRequestHelp) {
        onRequestHelp();
      }
      return;
    }

    if (
      featureName === 'Schedule' ||
      featureName === 'My Schedule' ||
      featureName === 'My Schedules' ||
      featureName === 'View Schedule'
    ) {
      if (onNavigateTab) {
        onNavigateTab('schedule');
      }
      return;
    }

    if (
      featureName === 'Care Circle' ||
      featureName === 'My Care Circle' ||
      featureName === 'Messages'
    ) {
      setShowCareCircleModal(true);
      return;
    }

    handleActionPress(featureName);
  };

  return (
    <View style={styles.safeArea}>
      {/* App Header Component with Profile & Size Switcher */}
      <AppHeader
        onProfilePress={onOpenProfile || (() => onNavigateTab && onNavigateTab('profile'))}
        onNotificationPress={() => handleActionPress('Notifications')}
        onNavigateTab={onNavigateTab}
      />

      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.secondary]}
            />
          }
        >
          {/* Dynamic Greeting */}
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>
              {greeting}{firstName ? ` , ` : ''}
              {firstName ? <Text style={styles.greetingName}>{firstName}</Text> : null}
            </Text>
            <Text style={styles.greetingSubtitle}>Here is your care schedule & quick actions</Text>
          </View>

          {/* Pending Link Requests Section (Elderly Permission Workflow) */}
          {pendingRequests.map((req, idx) => {
            const cg = req.caregiver || req;
            const cgId = cg?._id || req.caregiverId;
            const cgName = `${cg?.firstName || 'Family'} ${cg?.lastName || 'Member'}`.trim();
            const relationship = req.relationship || cg?.relationshipToElderly || 'Family Member';

            return (
              <View key={cgId || idx} style={styles.pendingCard}>
                <View style={styles.pendingHeader}>
                  <View style={styles.pendingIconCircle}>
                    <Ionicons name="people" size={isLarge ? 26 : 22} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pendingBadge}>LINK REQUEST</Text>
                    <Text style={styles.pendingTitle}>
                      {cgName} wants to link
                    </Text>
                    <Text style={styles.pendingDesc}>
                      Requested to connect as your <Text style={{ fontWeight: '700' }}>{relationship}</Text>. Linking allows them to oversee your care schedule and receive your SOS alerts.
                    </Text>
                  </View>
                </View>

                <View style={styles.pendingActions}>
                  <TouchableOpacity
                    style={[styles.pendingBtn, styles.declineBtn]}
                    onPress={() => handleRespondLink(cgId, 'reject', cgName)}
                    disabled={respondingId === cgId}
                    accessibilityRole="button"
                    accessibilityLabel="Decline Link Request"
                  >
                    <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.pendingBtn, styles.acceptBtn]}
                    onPress={() => handleRespondLink(cgId, 'accept', cgName)}
                    disabled={respondingId === cgId}
                    accessibilityRole="button"
                    accessibilityLabel="Accept Link Request"
                  >
                    {respondingId === cgId ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                        <Text style={styles.acceptBtnText}>Accept & Link</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {/* Action Cards */}
          <View style={styles.actionsWrapper}>
            {/* Dedicated Emergency SOS Button Card */}
            <TouchableOpacity
              style={[styles.sosButton, activeSOS && styles.sosButtonActive]}
              activeOpacity={0.85}
              onPress={() => setShowSOSModal(true)}
              accessibilityRole="button"
              accessibilityLabel="SOS Emergency Button"
            >
              <View style={styles.sosButtonContent}>
                <View style={styles.sosIconCircle}>
                  <Ionicons
                    name={activeSOS ? 'radio' : 'warning'}
                    size={isLarge ? 30 : 24}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.sosTextGroup}>
                  <Text style={styles.sosButtonText}>
                    {activeSOS ? '🚨 EMERGENCY SOS ACTIVE' : 'SOS Emergency Help'}
                  </Text>
                  <Text style={styles.sosSubtext}>
                    {activeSOS
                      ? 'Tap to view hotlines or resolve active alert'
                      : '1-tap urgent hotlines (1990 / 119) & Care Circle'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* Main Hero Card: Request Help */}
            <TouchableOpacity
              style={styles.heroCard}
              activeOpacity={0.85}
              onPress={() => handleQuickAction('Request Help')}
              accessibilityRole="button"
              accessibilityLabel="Request Help"
            >
              <View style={styles.heroIconContainer}>
                <Ionicons
                  name="search-outline"
                  size={isLarge ? 50 : 42}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.heroCardText}>Request Help</Text>
              <Text style={styles.heroSubtext}>Find a verified volunteer or caregiver</Text>
            </TouchableOpacity>

            {/* Sub Action Grid (2 Columns) */}
            <View style={styles.gridRow}>
              {/* My Schedules */}
              <TouchableOpacity
                style={styles.gridCard}
                activeOpacity={0.85}
                onPress={() => handleQuickAction('My Schedules')}
                accessibilityRole="button"
                accessibilityLabel="My Schedules"
              >
                <View style={[styles.gridIconContainer, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons
                    name="calendar-outline"
                    size={isLarge ? 38 : 32}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.gridCardText}>My Schedule</Text>
              </TouchableOpacity>

              {/* My Care Circle */}
              <TouchableOpacity
                style={styles.gridCard}
                activeOpacity={0.85}
                onPress={() => setShowCareCircleModal(true)}
                accessibilityRole="button"
                accessibilityLabel="My Care Circle"
              >
                <View style={[styles.gridIconContainer, { backgroundColor: '#CCFBF1' }]}>
                  <Ionicons
                    name="people-outline"
                    size={isLarge ? 36 : 30}
                    color={COLORS.secondary}
                  />
                </View>
                <Text style={styles.gridCardText}>My Care Circle</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Linked Family Caretaker Card (Display Linked Family Member) */}
          {linkedCaretaker ? (
            <View style={styles.caretakerCard}>
              <View style={styles.caretakerTop}>
                <View style={styles.caretakerAvatar}>
                  <Text style={styles.caretakerAvatarText}>
                    {linkedCaretaker.firstName ? linkedCaretaker.firstName[0] : 'C'}
                    {linkedCaretaker.lastName ? linkedCaretaker.lastName[0] : ''}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.caretakerName}>
                      {linkedCaretaker.firstName} {linkedCaretaker.lastName}
                    </Text>
                    <View style={styles.caretakerBadge}>
                      <Text style={styles.caretakerBadgeText}>
                        {linkedCaretaker.relationshipToElderly || 'Family Member'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.caretakerRole}>
                    {linkedCaretaker.caregiverType === 'formal_caregiver' ? 'Professional Caregiver' : 'Family Caretaker'}
                  </Text>
                  {linkedCaretaker.phone ? (
                    <Text style={styles.caretakerPhone}>
                      📞 {linkedCaretaker.phone}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.caretakerActions}>
                {linkedCaretaker.phone ? (
                  <TouchableOpacity
                    style={[styles.caretakerBtn, styles.callBtn]}
                    onPress={() => Linking.openURL(`tel:${linkedCaretaker.phone}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`Call ${linkedCaretaker.firstName}`}
                  >
                    <Ionicons name="call" size={16} color="#FFFFFF" />
                    <Text style={styles.callBtnText}>Call Caretaker</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={[styles.caretakerBtn, styles.circleBtn]}
                  onPress={() => setShowCareCircleModal(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Open Care Circle"
                >
                  <Ionicons name="people-outline" size={16} color={COLORS.secondary} />
                  <Text style={styles.circleBtnText}>Care Circle</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.noCaretakerCard}>
              <Ionicons name="shield-outline" size={24} color={COLORS.secondary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.noCaretakerTitle}>No Family Caretaker Linked</Text>
                <Text style={styles.noCaretakerDesc}>
                  Share your Senior ID <Text style={{ fontWeight: '700', color: COLORS.primary }}>{user?.customId || 'ELD-0001'}</Text> with your family so they can send a link request.
                </Text>
              </View>
            </View>
          )}

          {/* Section: Upcoming visits */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming visits</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onNavigateTab && onNavigateTab('schedule')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              {upcomingVisits.length > 0 ? (
                <Text style={styles.sectionBadge}>{upcomingVisits.length} Scheduled</Text>
              ) : (
                <Text style={[styles.sectionBadge, { backgroundColor: '#EEF2FF', color: COLORS.primary }]}>
                  View all ›
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Error Notice */}
          {fetchError && (
            <View style={styles.errorNoticeBox}>
              <Ionicons name="alert-circle-outline" size={20} color={COLORS.danger} />
              <Text style={styles.errorNoticeText}>{fetchError}</Text>
            </View>
          )}

          {/* Visits List */}
          {isLoading && !refreshing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.secondary} />
              <Text style={styles.loadingText}>Fetching visits from database...</Text>
            </View>
          ) : upcomingVisits.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="calendar-clear-outline"
                size={isLarge ? 56 : 48}
                color="#94A3B8"
              />
              <Text style={styles.emptyTitle}>No Upcoming Visits</Text>
              <Text style={styles.emptySubtitle}>
                You currently have no visits scheduled. Tap "Volunteer Requests" to browse available helpers or post your request.
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => handleQuickAction('Request Help')}
              >
                <Text style={styles.emptyActionBtnText}>Browse Volunteer Offers</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.visitsList}>
              {upcomingVisits.map((visit, index) => {
                const { date, time } = formatScheduleDate(visit.scheduledDate, visit.timeSlot);
                const companion =
                  visit.companionName ||
                  (visit.volunteer
                    ? `${visit.volunteer.firstName}${visit.volunteer.lastName ? ' ' + visit.volunteer.lastName[0] + '.' : ''}`
                    : '');

                return (
                  <TouchableOpacity
                    key={visit._id || `visit-${index}`}
                    style={styles.visitCard}
                    activeOpacity={0.85}
                    onPress={() => setSelectedVisit({ ...visit, formattedDate: date, formattedTime: time, companion })}
                    accessibilityRole="button"
                  >
                    <View style={styles.iconContainer}>
                      {renderActivityIcon(visit.activityType)}
                    </View>

                    <View style={styles.visitContent}>
                      <Text style={styles.visitActivity}>{visit.activityType}</Text>
                      {companion ? (
                        <Text style={styles.visitCompanion}>with {companion}</Text>
                      ) : (
                        <Text style={styles.visitCompanion}>Awaiting volunteer</Text>
                      )}
                    </View>

                    <View style={styles.visitTimeBlock}>
                      <Text style={styles.visitDate}>{date}</Text>
                      <Text style={styles.visitTime}>{time}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Visit Details Modal Sheet */}
        <Modal
          visible={!!selectedVisit}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedVisit(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {selectedVisit && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Visit Details</Text>
                    <TouchableOpacity onPress={() => setSelectedVisit(null)}>
                      <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalBody}>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Activity</Text>
                      <Text style={styles.modalValue}>{selectedVisit.activityType}</Text>
                    </View>

                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Date & Time</Text>
                      <Text style={styles.modalValue}>
                        {selectedVisit.formattedDate} at {selectedVisit.formattedTime}
                      </Text>
                    </View>

                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Status</Text>
                      <Text style={[styles.modalValue, { color: COLORS.primary, textTransform: 'capitalize' }]}>
                        {selectedVisit.status || 'Accepted'}
                      </Text>
                    </View>

                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Companion / Volunteer</Text>
                      <Text style={styles.modalValue}>
                        {selectedVisit.companion || 'Awaiting volunteer'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setSelectedVisit(null)}
                  >
                    <Text style={styles.modalCloseButtonText}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Emergency SOS Modal Sheet */}
        <EmergencySOSModal
          visible={showSOSModal}
          onClose={() => setShowSOSModal(false)}
          user={user}
          activeAlert={activeSOS}
          onAlertStatusChange={(updatedAlert) => setActiveSOS(updatedAlert)}
          scale={scale}
        />

        {/* My Care Circle Modal Sheet */}
        <CareCircleModal
          visible={showCareCircleModal}
          onClose={() => setShowCareCircleModal(false)}
          scale={scale}
        />
      </View>
    </View>
  );
}
