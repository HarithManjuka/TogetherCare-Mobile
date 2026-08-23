// src/screens/elderly/ElderlyHomeScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { COLORS, SIZES } from '../../constants/theme';
import ProfileScreen from '../auth/ProfileScreen';

export default function ElderlyHomeScreen() {
  const { user } = useAuth();

  // User profile loaded directly from MongoDB
  const [profile, setProfile] = useState(null);
  // Schedules / Upcoming visits loaded directly from MongoDB
  const [upcomingVisits, setUpcomingVisits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Visit details modal & Profile screen state
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showProfileScreen, setShowProfileScreen] = useState(false);

  // Dynamic time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Only the first name in greeting message from database
  const currentUser = profile || user;
  const firstName = currentUser?.firstName || '';

  // Format database date & time dynamically
  const formatScheduleDate = (dateString, timeSlot) => {
    if (!dateString) return { date: '', time: timeSlot || '' };
    const d = new Date(dateString);
    if (isNaN(d.getTime())) {
      return { date: '', time: timeSlot || '' };
    }
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const day = d.getDate();
    return {
      date: `${month} ${day}`,
      time: timeSlot || d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
  };

  // 1. Fetch user profile from database
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await client.get('/auth/me');
      if (response.data?.success && response.data?.user) {
        setProfile(response.data.user);
      }
    } catch (error) {
      console.log('Error fetching user profile from database:', error.message);
    }
  }, []);

  // 2. Fetch upcoming visits from database
  const fetchUpcomingVisits = useCallback(async () => {
    setFetchError(null);
    try {
      const response = await client.get('/companionship/upcoming');
      if (response.data?.success && Array.isArray(response.data.data)) {
        setUpcomingVisits(response.data.data);
      } else {
        setUpcomingVisits([]);
      }
    } catch (error) {
      console.log('Error fetching upcoming visits from database:', error.message);
      setFetchError('Unable to load visits from database. Pull down to refresh.');
      setUpcomingVisits([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
    fetchUpcomingVisits();
  }, [fetchUserProfile, fetchUpcomingVisits]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserProfile();
    fetchUpcomingVisits();
  };

  // Activity Icon mapping based on database activityType field
  const renderActivityIcon = (activityType) => {
    switch (activityType?.toLowerCase()) {
      case 'walk':
      case 'walking':
      case 'stroll':
        return <FontAwesome5 name="walking" size={26} color={COLORS.primary} />;
      case 'coffee':
      case 'tea':
      case 'chat':
        return <FontAwesome5 name="coffee" size={22} color={COLORS.primary} />;
      case 'groceries':
      case 'shopping':
        return <MaterialCommunityIcons name="cart-outline" size={26} color={COLORS.secondary} />;
      case 'medical':
      case 'doctor':
        return <MaterialCommunityIcons name="medical-bag" size={26} color={COLORS.danger} />;
      case 'reading':
      case 'book':
        return <Ionicons name="book-outline" size={24} color={COLORS.secondary} />;
      default:
        return <MaterialCommunityIcons name="account-heart-outline" size={26} color={COLORS.secondary} />;
    }
  };

  // Generic handler for future form pages (Request Help, My Schedules, Care Circle)
  const handleActionPress = (featureName) => {
    Alert.alert(
      featureName,
      `You selected ${featureName}. This feature form will open in the next phase.`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  // If user opens their profile screen, render ProfileScreen
  if (showProfileScreen) {
    return (
      <ProfileScreen
        onBack={() => {
          setShowProfileScreen(false);
          fetchUserProfile();
        }}
        onClose={() => {
          setShowProfileScreen(false);
          fetchUserProfile();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Top App Header */}
      <View style={styles.topHeader}>
        <View style={styles.brandContainer}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <Text style={styles.brandTitle}>TogetherCare</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Notifications', 'No new notifications at this time.')}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileButton}
            activeOpacity={0.7}
            onPress={() => setShowProfileScreen(true)}
            accessibilityLabel="User Profile Menu"
          >
            {currentUser?.profilePicture ? (
              <Image
                source={{ uri: currentUser.profilePicture }}
                style={styles.headerAvatarImg}
              />
            ) : (
              <Ionicons name="person-circle" size={38} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

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
            {getGreeting()}{firstName ? ` , ` : ''}
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
              <MaterialCommunityIcons name="account-search-outline" size={48} color={COLORS.primary} />
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
                <Ionicons name="calendar-outline" size={32} color={COLORS.primary} />
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
                <MaterialCommunityIcons name="phone-in-talk-outline" size={32} color={COLORS.secondary} />
              </View>
              <Text style={styles.gridCardText}>Care Circle</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Upcoming visits */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming visits</Text>
          {upcomingVisits.length > 0 && (
            <Text style={styles.sectionBadge}>{upcomingVisits.length} Scheduled</Text>
          )}
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
            <MaterialCommunityIcons name="calendar-blank-outline" size={48} color="#94A3B8" />
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    width: 34,
    height: 34,
    marginRight: 8,
  },
  brandTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileButton: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  greetingContainer: {
    marginBottom: 20,
  },
  greetingText: {
    fontSize: SIZES.elderlyTitle ? SIZES.elderlyTitle - 4 : 24,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  greetingName: {
    fontWeight: '800',
    color: COLORS.primary,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  actionsWrapper: {
    marginBottom: 24,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  heroIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  heroCardText: {
    fontSize: SIZES.elderlyBody || 20,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
  },
  heroSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  gridCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minHeight: 130,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  gridIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gridCardText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  errorNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errorNoticeText: {
    fontSize: 13,
    color: COLORS.danger,
    flex: 1,
    fontWeight: '500',
  },
  visitsList: {
    gap: 12,
  },
  visitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    minHeight: 88,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  visitColLeft: {
    flex: 1.1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  visitDateText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
  },
  visitTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  verticalDivider: {
    width: 1.5,
    height: '65%',
    backgroundColor: '#CBD5E1',
  },
  visitColMiddle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  activityIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  visitColRight: {
    flex: 1.3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  visitCompanionText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  visitStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
    marginTop: 2,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  emptyActionBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  modalBody: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalCloseBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
    minHeight: 48,
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
