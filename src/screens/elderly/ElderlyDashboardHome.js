// src/screens/elderly/ElderlyDashboardHome.js
import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useElderlyHome } from '../../hooks/useElderlyHome';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/theme';
import AppHeader from '../../components/common/AppHeader';
import { getElderlyHomeScreenStyles } from '../../styles/ElderlyHomeScreen.styles';

export default function ElderlyDashboardHome({
  onNavigateTab,
  onRequestHelp,
  onOpenProfile,
}) {
  const {
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

  const { scale, isLarge } = useTheme();
  const styles = useMemo(() => getElderlyHomeScreenStyles(scale), [scale]);

  const handleQuickAction = (featureName) => {
    if (featureName === 'Request Help' || featureName === 'Companionship') {
      if (onRequestHelp) {
        onRequestHelp();
      } else if (onNavigateTab) {
        onNavigateTab('requests');
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

    if (featureName === 'Care Circle') {
      if (onNavigateTab) {
        onNavigateTab('messages');
      }
      return;
    }

    handleActionPress(featureName);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* App Header Component with Profile & Size Switcher */}
      <AppHeader
        onProfilePress={onOpenProfile || (() => onNavigateTab && onNavigateTab('settings'))}
        onNotificationPress={() => handleActionPress('Notifications')}
      />

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

        {/* Action Cards */}
        <View style={styles.actionsWrapper}>
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

            {/* Care Circle / Messages */}
            <TouchableOpacity
              style={styles.gridCard}
              activeOpacity={0.85}
              onPress={() => handleQuickAction('Care Circle')}
              accessibilityRole="button"
              accessibilityLabel="Care Circle"
            >
              <View style={[styles.gridIconContainer, { backgroundColor: '#CCFBF1' }]}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={isLarge ? 36 : 30}
                  color={COLORS.secondary}
                />
              </View>
              <Text style={styles.gridCardText}>Messages</Text>
            </TouchableOpacity>
          </View>
        </View>

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
              You currently have no visits scheduled in the database. Tap "Request Help" to create a new companionship request.
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={() => handleQuickAction('Request Help')}
            >
              <Text style={styles.emptyActionBtnText}>+ Request Companionship</Text>
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
    </SafeAreaView>
  );
}
