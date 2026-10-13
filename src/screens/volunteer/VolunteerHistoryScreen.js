// src/screens/volunteer/VolunteerHistoryScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as volunteerService from '../../services/volunteerService';
import * as reviewService from '../../services/reviewService';
import AddHistoryLogModal from '../../components/volunteer/AddHistoryLogModal';
import { showAppAlert } from '../../utils/alert';

const CACHE_HISTORY_KEY = '@volunteer_cache_history';
const CACHE_STATS_HIST_KEY = '@volunteer_cache_stats_history';
const CACHE_REVIEWS_KEY = '@volunteer_cache_reviews';

export default function VolunteerHistoryScreen({ isActive = true, onBack, onStartChat }) {
  const [activeSegment, setActiveSegment] = useState('reviews'); // 'reviews' | 'logs'
  const [history, setHistory] = useState([]);
  const [reviewsData, setReviewsData] = useState({ totalReviews: 0, averageRating: 0, reviews: [] });
  const [stats, setStats] = useState({
    totalCompletedVisits: 0,
    totalHours: '0.0',
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Restore cached history and stats immediately on mount
  useEffect(() => {
    const restoreCachedHistory = async () => {
      try {
        const [savedHist, savedStats, savedReviews] = await Promise.all([
          AsyncStorage.getItem(CACHE_HISTORY_KEY),
          AsyncStorage.getItem(CACHE_STATS_HIST_KEY),
          AsyncStorage.getItem(CACHE_REVIEWS_KEY),
        ]);
        if (savedHist) {
          const parsed = JSON.parse(savedHist);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setHistory(parsed);
            setLoading(false);
          }
        }
        if (savedStats) {
          const parsed = JSON.parse(savedStats);
          if (parsed && typeof parsed === 'object') {
            setStats(parsed);
          }
        }
        if (savedReviews) {
          const parsed = JSON.parse(savedReviews);
          if (parsed && typeof parsed === 'object') {
            setReviewsData(parsed);
          }
        }
      } catch (e) {
        // Ignore cache restore errors
      }
    };
    restoreCachedHistory();
  }, []);

  // Modals for inspecting elder, visit details, and adding history log
  const [selectedElder, setSelectedElder] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [savingLog, setSavingLog] = useState(false);

  const handleSaveLog = async (logData) => {
    try {
      setSavingLog(true);
      const res = await volunteerService.addHistoryLog(logData);
      if (res?.success) {
        setAddModalVisible(false);
        showAppAlert(
          '🎉 Service Logged!',
          `Great work! Your ${logData.serviceType} visit has been recorded in your volunteer history.`
        );
        fetchHistoryAndStats();
      }
    } catch (err) {
      showAppAlert('Error', err.response?.data?.message || err.message || 'Failed to save volunteer history log');
    } finally {
      setSavingLog(false);
    }
  };

  const fetchHistoryAndStats = useCallback(async () => {
    try {
      const [histRes, statsRes, reviewsRes] = await Promise.allSettled([
        volunteerService.getMyHistory(),
        volunteerService.getMyStats(),
        reviewService.getMyReviews(),
      ]);

      if (histRes.status === 'fulfilled' && histRes.value?.success) {
        const freshHist = histRes.value.data || [];
        setHistory(freshHist);
        AsyncStorage.setItem(CACHE_HISTORY_KEY, JSON.stringify(freshHist)).catch(() => {});
      }
      if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
        const freshStats = statsRes.value.data || { totalCompletedVisits: 0, totalHours: '0.0', averageRating: 0 };
        setStats(freshStats);
        AsyncStorage.setItem(CACHE_STATS_HIST_KEY, JSON.stringify(freshStats)).catch(() => {});
      }
      if (reviewsRes.status === 'fulfilled' && reviewsRes.value?.success) {
        const freshReviews = reviewsRes.value.data || { totalReviews: 0, averageRating: 0, reviews: [] };
        setReviewsData(freshReviews);
        AsyncStorage.setItem(CACHE_REVIEWS_KEY, JSON.stringify(freshReviews)).catch(() => {});
      }
    } catch (error) {
      console.error('Fetch history & reviews error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      fetchHistoryAndStats();
    }
  }, [isActive, fetchHistoryAndStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistoryAndStats();
  };

  const handleCallElder = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {});
    }
  };

  const handleEmailElder = (email) => {
    if (email) {
      Linking.openURL(`mailto:${email}`).catch(() => {});
    }
  };

  const reviewsList = reviewsData?.reviews || [];
  const hasOverallRating = (reviewsData?.averageRating || stats.averageRating) > 0;
  const displayRating = hasOverallRating
    ? (reviewsData?.averageRating || stats.averageRating).toFixed(1)
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Volunteer Impact & Ratings</Text>
            <Text style={styles.headerSub}>Community feedback, elder reviews, and completed trips</Text>
          </View>
          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={() => setAddModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.headerAddBtnText}>Log Visit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollPadding}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E3A8A']} />
        }
      >
        {/* Live Metrics Banner */}
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>{stats.totalCompletedVisits || history.length}</Text>
            <Text style={styles.metricLbl}>Completed Visits</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>{stats.totalHours || '0.0'}</Text>
            <Text style={styles.metricLbl}>Total Hours</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>{displayRating ? `${displayRating} ⭐` : 'No ratings'}</Text>
            <Text style={styles.metricLbl}>Overall Rating</Text>
          </View>
        </View>

        {/* Banner: Quick Log Past Volunteer Service */}
        <TouchableOpacity
          style={styles.logActivityBanner}
          activeOpacity={0.85}
          onPress={() => setAddModalVisible(true)}
        >
          <View style={styles.logActivityIconBox}>
            <Ionicons name="add-circle" size={24} color="#1E40AF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.logActivityTitle}>Log Volunteer Service</Text>
            <Text style={styles.logActivitySub}>
              Record an offline assistance visit, companionship hours, or community task
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* Sub-tabs Segmented Control */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeSegment === 'reviews' && styles.segmentBtnActive]}
            activeOpacity={0.8}
            onPress={() => setActiveSegment('reviews')}
          >
            <Ionicons
              name="star"
              size={15}
              color={activeSegment === 'reviews' ? '#1E40AF' : '#64748B'}
            />
            <Text style={[styles.segmentBtnText, activeSegment === 'reviews' && styles.segmentBtnTextActive]}>
              Ratings & Reviews ({reviewsList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeSegment === 'logs' && styles.segmentBtnActive]}
            activeOpacity={0.8}
            onPress={() => setActiveSegment('logs')}
          >
            <Ionicons
              name="document-text-outline"
              size={15}
              color={activeSegment === 'logs' ? '#1E40AF' : '#64748B'}
            />
            <Text style={[styles.segmentBtnText, activeSegment === 'logs' && styles.segmentBtnTextActive]}>
              Service Logs ({history.length})
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#1E40AF" />
            <Text style={styles.loadingText}>Loading your volunteer profile feedback...</Text>
          </View>
        ) : activeSegment === 'reviews' ? (
          /* SECTION 1: Ratings & Reviews with Elder Contact & Visit Details */
          reviewsList.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="chatbox-ellipses-outline" size={44} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Community Reviews Yet</Text>
              <Text style={styles.emptySub}>
                When seniors complete a companionship visit with you, their ratings, reviews, and appreciative comments will appear here.
              </Text>
            </View>
          ) : (
            reviewsList.map((rev, idx) => {
              const reviewer = rev.reviewer || {};
              const elderName = reviewer.name || `${reviewer.firstName || 'Elder'} ${reviewer.lastName || ''}`.trim();
              const elderPic = reviewer.profilePicture;
              const isVerified = reviewer.verificationBadgeStatus === 'approved' || reviewer.verificationBadgeStatus === 'verified' || reviewer.isEmailVerified;
              const visit = rev.visitDetails || {};

              return (
                <View key={rev._id || `rev-${idx}`} style={styles.reviewItemCard}>
                  {/* Card Header: Clickable Elder Profile Header */}
                  <TouchableOpacity
                    style={styles.elderHeaderRow}
                    activeOpacity={0.8}
                    onPress={() => setSelectedElder(reviewer)}
                  >
                    <View style={styles.elderAvatarWrap}>
                      {elderPic ? (
                        <Image source={{ uri: elderPic }} style={styles.elderAvatarImg} />
                      ) : (
                        <View style={styles.elderAvatarFallback}>
                          <Text style={styles.elderInitialText}>
                            {elderName.charAt(0).toUpperCase() || 'E'}
                          </Text>
                        </View>
                      )}
                      {isVerified && (
                        <View style={styles.verifiedMiniBadge}>
                          <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                        </View>
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.elderNameText}>{elderName}</Text>
                        {isVerified && (
                          <View style={styles.verifiedTag}>
                            <Text style={styles.verifiedTagText}>VERIFIED</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.elderSubText}>
                        Rated on {new Date(rev.createdAt || Date.now()).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>

                    <View style={styles.viewProfilePill}>
                      <Text style={styles.viewProfilePillText}>Elder Profile</Text>
                      <Ionicons name="chevron-forward" size={13} color="#2563EB" />
                    </View>
                  </TouchableOpacity>

                  {/* Rating Stars & Comment */}
                  <View style={styles.ratingStarsBox}>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons
                          key={s}
                          name={s <= Math.round(rev.rating || 5) ? 'star' : 'star-outline'}
                          size={16}
                          color="#F59E0B"
                        />
                      ))}
                      <Text style={styles.scoreNumber}>{(rev.rating || 5).toFixed(1)}</Text>
                    </View>

                    {Boolean(rev.comment) && (
                      <Text style={styles.reviewComment}>"{rev.comment}"</Text>
                    )}

                    {Boolean(rev.visitReview) && rev.visitReview !== rev.comment && (
                      <View style={styles.visitReviewTagBox}>
                        <Text style={styles.visitReviewTagLabel}>Visit Feedback:</Text>
                        <Text style={styles.visitReviewTagText}>"{rev.visitReview}"</Text>
                      </View>
                    )}
                  </View>

                  {/* Card Action Buttons (Direct Chat & Visit Details) */}
                  <View style={styles.cardActionsRow}>
                    {onStartChat && (
                      <TouchableOpacity
                        style={styles.chatElderBtn}
                        activeOpacity={0.8}
                        onPress={() => onStartChat(reviewer)}
                      >
                        <Ionicons name="chatbubble-ellipses" size={15} color="#FFFFFF" />
                        <Text style={styles.chatElderBtnText}>Message Senior</Text>
                      </TouchableOpacity>
                    )}

                    {Boolean(visit.activityType || rev.activityType) && (
                      <TouchableOpacity
                        style={styles.visitDetailsBtn}
                        activeOpacity={0.8}
                        onPress={() => setSelectedVisit({ ...visit, activityType: visit.activityType || rev.activityType, elderName })}
                      >
                        <Ionicons name="information-circle-outline" size={15} color="#1E40AF" />
                        <Text style={styles.visitDetailsBtnText}>Visit Details</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )
        ) : (
          /* SECTION 2: Standard Completed Service History Logs */
          history.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="ribbon-outline" size={44} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Service Logs Yet</Text>
              <Text style={styles.emptySub}>
                Your completed support trips and logs will appear here once you finish visits.
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                activeOpacity={0.85}
                onPress={() => setAddModalVisible(true)}
              >
                <Ionicons name="add-circle" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyAddBtnText}>Log Past Volunteer Service</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.logsSectionHeader}>
                <Text style={styles.logsSectionTitle}>Completed Visits & Hours ({history.length})</Text>
                <TouchableOpacity
                  style={styles.logsAddBtn}
                  onPress={() => setAddModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={14} color="#1E40AF" />
                  <Text style={styles.logsAddBtnText}>Add Log</Text>
                </TouchableOpacity>
              </View>
              {history.map((log) => {
                const logKey = log._id || log.id;
                // Only consider rated if elder explicitly rated the volunteer
                const hasRealRating = Boolean(
                  log.hasRated === true ||
                  (log.hasRated !== false &&
                    log.rating !== null &&
                    log.rating !== undefined &&
                    Number(log.rating) > 0 &&
                    log.feedback !== 'Wonderful conversation and company!' &&
                    log.feedback !== 'Very punctual and polite! Thank you for the quick help.')
                );
                const ratingNum = hasRealRating ? Number(log.rating) : null;
                const feedbackText = hasRealRating && log.feedback && log.feedback.trim() &&
                  log.feedback !== 'Wonderful conversation and company!' &&
                  log.feedback !== 'Very punctual and polite! Thank you for the quick help.'
                    ? log.feedback.trim()
                    : null;

                return (
                  <View key={logKey} style={styles.historyCard}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.serviceName}>{log.service || 'Companionship'}</Text>
                      <Text style={styles.dateText}>{log.date || 'Completed'}</Text>
                    </View>
                    <Text style={styles.elderText}>Senior: {log.elderName || 'Senior Member'}</Text>

                    {/* Rating part is removed for unrated tasks. It ONLY shows after elder really rates the volunteer */}
                    {hasRealRating && ratingNum ? (
                      <View style={styles.ratingSectionWrap}>
                        <View style={[styles.ratingRow, !feedbackText && { marginBottom: 0 }]}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons
                              key={star}
                              name={star <= Math.round(ratingNum) ? 'star' : 'star-outline'}
                              size={14}
                              color="#F59E0B"
                            />
                          ))}
                          <Text style={styles.ratingNumber}>{ratingNum.toFixed(1)}</Text>
                        </View>

                        {feedbackText ? (
                          <Text style={styles.feedbackText}>"{feedbackText}"</Text>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </>
          )
        )}
      </ScrollView>

      {/* MODAL 1: Elder Profile Modal (Only visible to the volunteer for their reviews) */}
      <Modal
        visible={!!selectedElder}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedElder(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContentSheet}>
            {selectedElder && (
              <>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalSheetTitle}>Elder Profile</Text>
                  <TouchableOpacity onPress={() => setSelectedElder(null)} style={styles.modalCloseBtn}>
                    <Ionicons name="close" size={22} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.elderModalAvatarSection}>
                  <View style={styles.elderAvatarLargeWrap}>
                    {selectedElder.profilePicture ? (
                      <Image source={{ uri: selectedElder.profilePicture }} style={styles.elderAvatarLarge} />
                    ) : (
                      <View style={styles.elderAvatarLargeFallback}>
                        <Ionicons name="person" size={40} color="#2563EB" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.elderModalName}>
                    {selectedElder.name || `${selectedElder.firstName || ''} ${selectedElder.lastName || ''}`.trim()}
                  </Text>
                  <View style={styles.verifiedTagLarge}>
                    <Ionicons name="shield-checkmark" size={14} color="#059669" />
                    <Text style={styles.verifiedTagLargeText}>Verified Senior Companion</Text>
                  </View>
                </View>

                {/* Elder Details List */}
                <View style={styles.elderDetailsList}>
                  {selectedElder.phone ? (
                    <View style={styles.elderInfoRow}>
                      <Ionicons name="call-outline" size={18} color="#2563EB" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.infoRowLabel}>Phone Number</Text>
                        <Text style={styles.infoRowValue}>{selectedElder.phone}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.actionIconBtn}
                        onPress={() => handleCallElder(selectedElder.phone)}
                      >
                        <Ionicons name="call" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {selectedElder.email ? (
                    <View style={styles.elderInfoRow}>
                      <Ionicons name="mail-outline" size={18} color="#6366F1" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.infoRowLabel}>Email</Text>
                        <Text style={styles.infoRowValue}>{selectedElder.email}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.actionIconBtn, { backgroundColor: '#6366F1' }]}
                        onPress={() => handleEmailElder(selectedElder.email)}
                      >
                        <Ionicons name="mail" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {selectedElder.address ? (
                    <View style={styles.elderInfoRow}>
                      <Ionicons name="location-outline" size={18} color="#10B981" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.infoRowLabel}>Residential Location</Text>
                        <Text style={styles.infoRowValue}>{selectedElder.address}</Text>
                      </View>
                    </View>
                  ) : null}

                  {selectedElder.age ? (
                    <View style={styles.elderInfoRow}>
                      <Ionicons name="calendar-outline" size={18} color="#F59E0B" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.infoRowLabel}>Age</Text>
                        <Text style={styles.infoRowValue}>{selectedElder.age} years old</Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                {/* Bottom Action: Message in chat */}
                {onStartChat && (
                  <TouchableOpacity
                    style={styles.modalPrimaryActionBtn}
                    activeOpacity={0.85}
                    onPress={() => {
                      const target = selectedElder;
                      setSelectedElder(null);
                      onStartChat(target);
                    }}
                  >
                    <Ionicons name="chatbubbles" size={18} color="#FFFFFF" />
                    <Text style={styles.modalPrimaryActionBtnText}>Start In-App Chat</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Related Visit Details Modal */}
      <Modal
        visible={!!selectedVisit}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedVisit(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContentSheet}>
            {selectedVisit && (
              <>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalSheetTitle}>Related Visit Details</Text>
                  <TouchableOpacity onPress={() => setSelectedVisit(null)} style={styles.modalCloseBtn}>
                    <Ionicons name="close" size={22} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.visitDetailsCard}>
                  <View style={styles.visitDetailRow}>
                    <Text style={styles.visitDetailLabel}>Activity / Service:</Text>
                    <Text style={styles.visitDetailValue}>{selectedVisit.activityType || selectedVisit.serviceType || 'Companionship Visit'}</Text>
                  </View>

                  <View style={styles.visitDetailRow}>
                    <Text style={styles.visitDetailLabel}>Senior Companion:</Text>
                    <Text style={styles.visitDetailValue}>{selectedVisit.elderName || 'Senior Member'}</Text>
                  </View>

                  <View style={styles.visitDetailRow}>
                    <Text style={styles.visitDetailLabel}>Scheduled Date:</Text>
                    <Text style={styles.visitDetailValue}>
                      {selectedVisit.scheduledDate
                        ? new Date(selectedVisit.scheduledDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                        : (selectedVisit.date || 'Completed')}
                    </Text>
                  </View>

                  <View style={styles.visitDetailRow}>
                    <Text style={styles.visitDetailLabel}>Time Window:</Text>
                    <Text style={styles.visitDetailValue}>{selectedVisit.timeSlot || selectedVisit.time || '10:00 AM - 12:00 PM'}</Text>
                  </View>

                  {selectedVisit.location ? (
                    <View style={styles.visitDetailRow}>
                      <Text style={styles.visitDetailLabel}>Location:</Text>
                      <Text style={styles.visitDetailValue}>{selectedVisit.location}</Text>
                    </View>
                  ) : null}

                  {selectedVisit.notes ? (
                    <View style={styles.visitDetailRow}>
                      <Text style={styles.visitDetailLabel}>Senior Notes:</Text>
                      <Text style={styles.visitDetailValue}>{selectedVisit.notes}</Text>
                    </View>
                  ) : null}

                  <View style={styles.visitDetailRow}>
                    <Text style={styles.visitDetailLabel}>Visit Status:</Text>
                    <Text style={[styles.visitDetailValue, { color: '#059669', fontWeight: '800', textTransform: 'capitalize' }]}>
                      {selectedVisit.status || 'Completed'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.modalPrimaryActionBtn, { backgroundColor: '#1E293B', marginTop: 16 }]}
                  onPress={() => setSelectedVisit(null)}
                >
                  <Text style={styles.modalPrimaryActionBtnText}>Close Visit Info</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Add Volunteer History Log Modal */}
      <AddHistoryLogModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSubmit={handleSaveLog}
        isSaving={savingLog}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
  },
  headerAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logActivityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 16,
    gap: 12,
  },
  logActivityIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logActivityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  logActivitySub: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 2,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 14,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  logsSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  logsAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 4,
  },
  logsAddBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  container: {
    flex: 1,
  },
  scrollPadding: {
    padding: 16,
    paddingBottom: 30,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E40AF',
  },
  metricLbl: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentBtnTextActive: {
    color: '#1E40AF',
    fontWeight: '800',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  reviewItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    gap: 12,
  },
  elderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  elderAvatarWrap: {
    position: 'relative',
  },
  elderAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  elderAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  elderInitialText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E40AF',
  },
  verifiedMiniBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  elderNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  verifiedTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  verifiedTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  elderSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  viewProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 2,
  },
  viewProfilePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  ratingStarsBox: {
    gap: 6,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D97706',
    marginLeft: 6,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1E293B',
    fontStyle: 'italic',
  },
  visitReviewTagBox: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
    gap: 2,
  },
  visitReviewTagLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  visitReviewTagText: {
    fontSize: 12,
    color: '#78350F',
    fontStyle: 'italic',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  chatElderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  chatElderBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  visitDetailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  visitDetailsBtnText: {
    color: '#1E40AF',
    fontSize: 13,
    fontWeight: '700',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
  },
  elderText: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 6,
  },
  ratingSectionWrap: {
    marginTop: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 6,
  },
  ratingNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
    marginLeft: 4,
  },
  feedbackText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#475569',
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContentSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 4,
  },
  elderModalAvatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  elderAvatarLargeWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: '#3B82F6',
    marginBottom: 10,
  },
  elderAvatarLarge: {
    width: '100%',
    height: '100%',
  },
  elderAvatarLargeFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  elderModalName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  verifiedTagLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  verifiedTagLargeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  elderDetailsList: {
    gap: 12,
    marginBottom: 18,
  },
  elderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  infoRowLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  infoRowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  actionIconBtn: {
    backgroundColor: '#2563EB',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryActionBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    elevation: 3,
  },
  modalPrimaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  visitDetailsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  visitDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visitDetailLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  visitDetailValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    maxWidth: '60%',
    textAlign: 'right',
  },
});
