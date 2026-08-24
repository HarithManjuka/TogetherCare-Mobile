// src/screens/elderly/ElderlyHomeScreen.js
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
import ProfileScreen from '../auth/ProfileScreen';
import CreateCompanionshipScreen from './CreateCompanionshipScreen';
import MyScheduleScreen from './MyScheduleScreen';
import { getElderlyHomeScreenStyles } from '../../styles/ElderlyHomeScreen.styles';

export default function ElderlyHomeScreen() {
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
    showProfileScreen,
    setShowProfileScreen,
    showCreateScreen,
    setShowCreateScreen,
    showScheduleScreen,
    setShowScheduleScreen,
    handleRequestCreated,
    formatScheduleDate,
    renderActivityIcon,
    handleActionPress,
    refreshProfile,
  } = useElderlyHome();

  const { scale, isLarge } = useTheme();
  const styles = useMemo(() => getElderlyHomeScreenStyles(scale), [scale]);

  // If user opens their profile screen, render ProfileScreen
  if (showProfileScreen) {
    return (
      <ProfileScreen
        onBack={() => {
          setShowProfileScreen(false);
          refreshProfile();
        }}
        onClose={() => {
          setShowProfileScreen(false);
          refreshProfile();
        }}
      />
    );
  }

  // If user opens Create Companionship Request, render CreateCompanionshipScreen as separate full page
  if (showCreateScreen) {
    return (
      <CreateCompanionshipScreen
        onBack={() => setShowCreateScreen(false)}
        onClose={() => setShowCreateScreen(false)}
        onSuccess={() => {
          setShowCreateScreen(false);
          handleRequestCreated();
        }}
      />
    );
  }

  // If user opens My Schedule, render MyScheduleScreen with WhatsApp-style tabbed view
  if (showScheduleScreen) {
    return (
      <MyScheduleScreen
        onBack={() => {
          setShowScheduleScreen(false);
          onRefresh();
        }}
        onRequestNew={() => {
          setShowScheduleScreen(false);
          setShowCreateScreen(true);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Reusable App Header Component with Size Switcher */}
      <AppHeader
        onProfilePress={() => setShowProfileScreen(true)}
        onNotificationPress={() => handleActionPress('Notifications')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.secondary]} />
        }
      >
        {/* Dynamic Greeting with Database User's FIRST NAME ONLY */}
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
            onPress={() => handleActionPress('Request Help')}
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
              onPress={() => handleActionPress('My Schedules')}
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
              <Text style={styles.gridCardText}>My Schedules</Text>
            </TouchableOpacity>

            {/* Care Circle */}
            <TouchableOpacity
              style={styles.gridCard}
              activeOpacity={0.85}
              onPress={() => handleActionPress('Care Circle')}
              accessibilityRole="button"
              accessibilityLabel="Care Circle"
            >
              <View style={[styles.gridIconContainer, { backgroundColor: '#CCFBF1' }]}>
                <Ionicons
                  name="call-outline"
                  size={isLarge ? 36 : 30}
                  color={COLORS.secondary}
                />
              </View>
              <Text style={styles.gridCardText}>Care Circle</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Upcoming visits */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming visits</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowScheduleScreen(true)}
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
              onPress={() => handleActionPress('Request Help')}
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
                >
                  {/* Left Column: Date & Time */}
                  <View style={styles.visitColLeft}>
                    <Text style={styles.visitDateText}>{date}</Text>
                    <Text style={styles.visitTimeText}>{time}</Text>
                  </View>

                  {/* Vertical Divider 1 */}
                  <View style={styles.verticalDivider} />

                  {/* Middle Column: Activity Icon */}
                  <View style={styles.visitColMiddle}>
                    <View style={styles.activityIconCircle}>
                      {renderActivityIcon(visit.activityType)}
                    </View>
                  </View>

                  {/* Vertical Divider 2 */}
                  <View style={styles.verticalDivider} />

                  {/* Right Column: Companion Name & Status */}
                  <View style={styles.visitColRight}>
                    <Text style={styles.visitCompanionText} numberOfLines={1}>
                      {companion || 'Volunteer'}
                    </Text>
                    {visit.status ? (
                      <Text
                        style={[
                          styles.visitStatusText,
                          visit.status === 'pending' && { color: COLORS.accent },
                          visit.status === 'accepted' && { color: COLORS.success },
                        ]}
                      >
                        {visit.status.toUpperCase()}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Visit Detail Modal */}
      <Modal
        visible={!!selectedVisit}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedVisit(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="calendar" size={22} color={COLORS.primary} />
                <Text style={styles.modalTitle}>Visit Details</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedVisit(null)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedVisit && (
              <View style={styles.modalBody}>
                {selectedVisit.companion ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Companion:</Text>
                    <Text style={styles.detailValue}>{selectedVisit.companion}</Text>
                  </View>
                ) : null}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Activity:</Text>
                  <Text style={[styles.detailValue, { textTransform: 'capitalize', color: COLORS.secondary }]}>
                    {selectedVisit.activityType || 'Visit'}
                  </Text>
                </View>

                {(selectedVisit.formattedDate || selectedVisit.formattedTime) ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date & Time:</Text>
                    <Text style={styles.detailValue}>
                      {selectedVisit.formattedDate} {selectedVisit.formattedTime}
                    </Text>
                  </View>
                ) : null}

                {selectedVisit.status ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={[styles.detailValue, { textTransform: 'capitalize' }]}>
                      {selectedVisit.status}
                    </Text>
                  </View>
                ) : null}

                {selectedVisit.location ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Location:</Text>
                    <Text style={styles.detailValue}>{selectedVisit.location}</Text>
                  </View>
                ) : null}

                {selectedVisit.notes ? (
                  <View style={[styles.detailRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                    <Text style={styles.detailLabel}>Notes:</Text>
                    <Text style={[styles.detailValue, { marginTop: 4, fontWeight: '500', color: COLORS.textSecondary }]}>
                      {selectedVisit.notes}
                    </Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedVisit(null)}
                >
                  <Text style={styles.modalCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
