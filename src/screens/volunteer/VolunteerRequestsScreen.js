// src/screens/volunteer/VolunteerRequestsScreen.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as volunteerService from '../../services/volunteerService';
import ElderRequestDetailModal from '../../components/volunteer/ElderRequestDetailModal';
import OfferHelpModal from '../../components/volunteer/OfferHelpModal';
import { showAppAlert } from '../../utils/alert';

const CACHE_REQUESTS_SCREEN_KEY = '@volunteer_cache_available_requests';
const CACHE_DIRECT_REQUESTS_KEY = '@volunteer_cache_direct_requests';

export default function VolunteerRequestsScreen({ isActive = true, onNavigateTab }) {
  const [requests, setRequests] = useState([]);
  const [directRequests, setDirectRequests] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [volunteerDistrict, setVolunteerDistrict] = useState('Colombo');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingId, setSubmittingId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [offerSubmitting, setOfferSubmitting] = useState(false);

  // Restore cached requests immediately on mount
  useEffect(() => {
    const restoreCached = async () => {
      try {
        const [savedReqs, savedDirect] = await Promise.all([
          AsyncStorage.getItem(CACHE_REQUESTS_SCREEN_KEY),
          AsyncStorage.getItem(CACHE_DIRECT_REQUESTS_KEY),
        ]);
        if (savedReqs) {
          const parsed = JSON.parse(savedReqs);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRequests(parsed);
            setLoading(false);
          }
        }
        if (savedDirect) {
          const parsed = JSON.parse(savedDirect);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDirectRequests(parsed);
          }
        }
      } catch (e) {
        // Ignore cache restore errors
      }
    };
    restoreCached();
  }, []);

  const categories = [
    { id: 'all', label: 'All Requests' },
    { id: 'Companionship', label: '🤝 Companionship' },
    { id: 'Grocery', label: '🛒 Grocery' },
    { id: 'Medicine', label: '💊 Pharmacy' },
    { id: 'Walk', label: '🚶 Walk' },
    { id: 'Reading', label: '📖 Reading' },
    { id: 'Chat', label: '💬 Chat' },
  ];

  const districtList = [
    { id: 'nearby', label: volunteerDistrict ? `📍 Nearby (${volunteerDistrict})` : '📍 Nearby Area' },
    { id: 'all', label: '🌐 All Districts' },
    { id: 'Colombo', label: 'Colombo' },
    { id: 'Kalutara', label: 'Kalutara' },
    { id: 'Kandy', label: 'Kandy' },
    { id: 'Gampaha', label: 'Gampaha' },
    { id: 'Galle', label: 'Galle' },
  ];

  const displayedRequests = useMemo(() => {
    let list = requests;

    // Filter by district / location
    if (selectedDistrict === 'nearby') {
      list = list.filter(
        (r) =>
          r.isSameDistrict ||
          (r.district && volunteerDistrict && r.district.toLowerCase() === volunteerDistrict.toLowerCase())
      );
    } else if (selectedDistrict !== 'all') {
      list = list.filter(
        (r) => r.district && r.district.toLowerCase() === selectedDistrict.toLowerCase()
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      const catLower = selectedCategory.toLowerCase();
      list = list.filter((r) => {
        const type = (r.type || r.serviceType || '').toLowerCase();
        const cat = (r.category || '').toLowerCase();
        const items = Array.isArray(r.items) ? r.items.join(' ').toLowerCase() : '';
        return type.includes(catLower) || cat.includes(catLower) || items.includes(catLower);
      });
    }

    // Filter by search query
    if (!searchQuery.trim()) return list;
    const q = searchQuery.trim().toLowerCase();
    return list.filter((r) => {
      return (
        (r.elderName && r.elderName.toLowerCase().includes(q)) ||
        (r.address && r.address.toLowerCase().includes(q)) ||
        (r.district && r.district.toLowerCase().includes(q)) ||
        (r.type && r.type.toLowerCase().includes(q)) ||
        (r.serviceType && r.serviceType.toLowerCase().includes(q)) ||
        (r.notes && r.notes.toLowerCase().includes(q)) ||
        (Array.isArray(r.items) && r.items.some((it) => it.toLowerCase().includes(q)))
      );
    });
  }, [requests, searchQuery, selectedDistrict, selectedCategory, volunteerDistrict]);

  const fetchRequests = useCallback(async () => {
    try {
      const [availRes, directRes] = await Promise.allSettled([
        volunteerService.getAvailableRequests(selectedCategory),
        volunteerService.getDirectRequests(),
      ]);

      if (availRes.status === 'fulfilled' && availRes.value?.success) {
        const freshList = availRes.value.data || [];
        setRequests(freshList);
        AsyncStorage.setItem(CACHE_REQUESTS_SCREEN_KEY, JSON.stringify(freshList)).catch(() => {});
        if (availRes.value?.volunteerDistrict) {
          setVolunteerDistrict(availRes.value.volunteerDistrict);
        }
      }
      if (directRes.status === 'fulfilled' && directRes.value?.success) {
        const freshDirect = directRes.value.data || [];
        setDirectRequests(freshDirect);
        AsyncStorage.setItem(CACHE_DIRECT_REQUESTS_KEY, JSON.stringify(freshDirect)).catch(() => {});
      }
    } catch (error) {
      console.error('Fetch requests error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (isActive) {
      fetchRequests();
    }
  }, [isActive, fetchRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleAccept = async (req, customArrivalTime = null) => {
    const reqId = req._id || req.id;
    try {
      setSubmittingId(reqId);
      // Optimistically remove from list immediately
      setRequests((prev) => prev.filter((r) => (r._id || r.id) !== reqId));
      const res = await volunteerService.acceptRequest(
        reqId,
        customArrivalTime ? { arrivalTime: customArrivalTime } : {}
      );
      if (res?.success) {
        showAppAlert(
          '🎉 Request Accepted!',
          `You have accepted the visit for ${req.elderName}${customArrivalTime ? ` at ${customArrivalTime}` : ''}.\nIt has been added to your Volunteer Schedule.`,
          [
            { text: 'Stay Here', onPress: () => fetchRequests() },
            {
              text: 'View Schedule',
              onPress: () => {
                fetchRequests();
                if (onNavigateTab) onNavigateTab('schedule');
              },
            },
          ]
        );
      }
    } catch (err) {
      fetchRequests();
      showAppAlert('Error', err.response?.data?.message || err.message || 'Failed to accept task');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleSaveOffer = async (offerData) => {
    try {
      setOfferSubmitting(true);
      const res = await volunteerService.createOffer(offerData);
      if (res?.success) {
        showAppAlert(
          '🎉 Offer Posted Successfully!',
          'Your availability offer has been posted with your custom time. When an elder requests your help, it will appear in your direct requests.'
        );
        setOfferModalVisible(false);
      }
    } catch (err) {
      showAppAlert('Error', err.response?.data?.message || err.message || 'Failed to post offer');
    } finally {
      setOfferSubmitting(false);
    }
  };

  const handleAcceptDirect = async (req) => {
    const reqId = req._id || req.id;
    try {
      setSubmittingId(reqId);
      // Immediately remove from UI state
      setDirectRequests((prev) => prev.filter((item) => (item._id || item.id) !== reqId));
      const res = await volunteerService.acceptDirectRequest(reqId);
      if (res?.success) {
        showAppAlert(
          '🎉 Request Accepted!',
          `You have confirmed the visit for ${req.elderName}.\nIt has been added to your Volunteer Schedule!`,
          [
            { text: 'Stay Here', onPress: () => fetchRequests() },
            {
              text: 'View Schedule',
              onPress: () => {
                fetchRequests();
                if (onNavigateTab) onNavigateTab('schedule');
              },
            },
          ]
        );
        fetchRequests();
      }
    } catch (err) {
      fetchRequests();
      showAppAlert('Error', err.response?.data?.message || err.message || 'Failed to accept visit request');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDeclineDirect = async (req) => {
    const reqId = req._id || req.id;
    try {
      setSubmittingId(reqId);
      // Immediately remove from UI state
      setDirectRequests((prev) => prev.filter((item) => (item._id || item.id) !== reqId));
      const res = await volunteerService.declineDirectRequest(reqId);
      if (res?.success) {
        showAppAlert('Request Declined', 'The visit request has been declined.');
        fetchRequests();
      }
    } catch (err) {
      fetchRequests();
      showAppAlert('Error', err.response?.data?.message || err.message || 'Failed to decline request');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <View style={styles.headerTitleRow}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.headerTitle}>Available Help Requests</Text>
              {displayedRequests.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{displayedRequests.length}</Text>
                </View>
              )}
            </View>
            <Text style={styles.headerSub}>Browse nearby requests from elderly residents</Text>
          </View>

          <TouchableOpacity
            style={styles.postOfferHeaderBtn}
            onPress={() => setOfferModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="time" size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
            <Text style={styles.postOfferHeaderBtnText}>+ Offer Help</Text>
          </TouchableOpacity>
        </View>

        {/* Live Search Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={17} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by elder name, task, or area..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* District / Area Filter Chips */}
      <View style={styles.districtFilterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {districtList.map((d) => {
            const isActiveDistrict = selectedDistrict === d.id;
            return (
              <TouchableOpacity
                key={d.id}
                style={[
                  styles.districtFilterChip,
                  isActiveDistrict && styles.districtFilterChipActive,
                ]}
                onPress={() => setSelectedDistrict(d.id)}
              >
                {d.id === 'nearby' && (
                  <Ionicons
                    name="location"
                    size={12}
                    color={isActiveDistrict ? '#FFFFFF' : '#1D4ED8'}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text
                  style={[
                    styles.districtFilterChipText,
                    isActiveDistrict && styles.districtFilterChipTextActive,
                  ]}
                >
                  {d.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Category Filter Chips */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.filterChip, selectedCategory === cat.id && styles.filterChipActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.filterChipText, selectedCategory === cat.id && styles.filterChipTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollPadding}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E3A8A']} />
        }
      >
        {/* --- SECTION: DIRECT REQUESTS SENT SPECIFICALLY TO THIS VOLUNTEER --- */}
        {directRequests.length > 0 && (
          <View style={styles.directSection}>
            <View style={styles.directHeaderRow}>
              <View style={styles.directBadge}>
                <Ionicons name="mail-unread" size={14} color="#D97706" />
                <Text style={styles.directBadgeText}>DIRECT REQUESTS ({directRequests.length})</Text>
              </View>
              <Text style={styles.directHeaderHint}>Sent directly to you!</Text>
            </View>

            {directRequests.map((dReq) => {
              const dKey = dReq._id || dReq.id;
              const isProcessing = submittingId === dKey;
              return (
                <View key={dKey} style={styles.directCard}>
                  <View style={styles.directCardTop}>
                    <View style={styles.directServicePill}>
                      <Text style={styles.directServicePillText}>{dReq.type || dReq.serviceType}</Text>
                    </View>
                    <Text style={styles.directDateTime}>🕒 {dReq.date} at {dReq.time}</Text>
                  </View>

                  <Text style={styles.directElderName}>Elder: {dReq.elderName}</Text>
                  {dReq.caregiverName ? (
                    <Text style={styles.directCaregiverName}>Requested by Family: {dReq.caregiverName}</Text>
                  ) : null}
                  <Text style={styles.directAddress} numberOfLines={1}>
                    📍 {dReq.address || dReq.location}
                  </Text>

                  {/* Actions: Accept or Decline */}
                  <View style={styles.directActionsRow}>
                    <TouchableOpacity
                      style={styles.directDeclineBtn}
                      onPress={() => handleDeclineDirect(dReq)}
                      disabled={isProcessing}
                    >
                      <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                      <Text style={styles.directDeclineBtnText}>Decline</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.directAcceptBtn, isProcessing && { opacity: 0.7 }]}
                      onPress={() => handleAcceptDirect(dReq)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.directAcceptBtnText}>Accept Visit</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#1E40AF" />
            <Text style={styles.loadingText}>Loading available requests...</Text>
          </View>
        ) : requests.length === 0 && directRequests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="sparkles-outline" size={42} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Open Requests Found</Text>
            <Text style={styles.emptySub}>
              There are currently no open requests matching this category. Please check back soon or switch categories!
            </Text>
            <TouchableOpacity style={styles.resetFilterBtn} onPress={() => { setSelectedCategory('all'); setSelectedDistrict('all'); setSearchQuery(''); }}>
              <Text style={styles.resetFilterBtnText}>Show All Requests</Text>
            </TouchableOpacity>
          </View>
        ) : displayedRequests.length === 0 && directRequests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="search-outline" size={42} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Matching Requests</Text>
            <Text style={styles.emptySub}>No open requests found for this area or category.</Text>
            <TouchableOpacity style={styles.resetFilterBtn} onPress={() => { setSelectedCategory('all'); setSelectedDistrict('all'); setSearchQuery(''); }}>
              <Text style={styles.resetFilterBtnText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          displayedRequests.map((req) => {
            const reqKey = req._id || req.id;
            const isUrgent = req.badgeType === 'urgent' || req.badge === 'Urgent';
            const isProcessing = submittingId === reqKey;

            return (
              <TouchableOpacity
                key={reqKey}
                style={styles.requestCard}
                activeOpacity={0.92}
                onPress={() => setSelectedRequest(req)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderBadges}>
                    <View style={[styles.badgeTag, isUrgent ? styles.urgentTag : styles.todayTag]}>
                      <Text style={[styles.badgeText, isUrgent ? styles.urgentBadgeText : styles.todayBadgeText]}>
                        {req.badge || 'Open'}
                      </Text>
                    </View>
                    <View style={[
                      styles.sameDistrictBadge,
                      (req.isSameDistrict || (req.district && volunteerDistrict && req.district.toLowerCase() === volunteerDistrict.toLowerCase())) && styles.sameDistrictBadgeHighlight
                    ]}>
                      <Ionicons name="location" size={11} color="#047857" style={{ marginRight: 2 }} />
                      <Text style={styles.sameDistrictBadgeText}>
                        {req.district || volunteerDistrict} Area
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.distanceText}>📍 {req.distance || '1.2 km'} away</Text>
                </View>

                <Text style={styles.serviceTitle}>{req.type || req.serviceType}</Text>
                <Text style={styles.elderName}>For: {req.elderName}</Text>
                <TouchableOpacity
                  style={styles.addressRow}
                  activeOpacity={0.7}
                  onPress={() => setSelectedRequest(req)}
                >
                  <Ionicons name="location" size={14} color="#DC2626" style={{ marginRight: 4 }} />
                  <Text style={styles.addressText} numberOfLines={1}>
                    Location: {req.address}
                  </Text>
                  <Text style={styles.viewMapHint}>🗺️ Map</Text>
                </TouchableOpacity>
                <Text style={styles.dateTimeText}>
                  🕒 {req.date} at {req.time}
                </Text>

                {req.notes ? (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>📝 Note from Elder:</Text>
                    <Text style={styles.notesText}>{req.notes}</Text>
                  </View>
                ) : null}

                {req.items && req.items.length > 0 ? (
                  <View style={styles.itemsBox}>
                    <Text style={styles.itemsHeader}>Requested items / activities:</Text>
                    {req.items.map((item, idx) => (
                      <Text key={idx} style={styles.itemBullet}>
                        • {item}
                      </Text>
                    ))}
                  </View>
                ) : null}

                {/* Two Action Buttons: View Details & Accept */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.viewDetailsBtn}
                    activeOpacity={0.8}
                    onPress={() => setSelectedRequest(req)}
                  >
                    <Ionicons name="map-outline" size={16} color="#1E40AF" style={{ marginRight: 4 }} />
                    <Text style={styles.viewDetailsBtnText}>View Details & Map</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.offerBtn, isProcessing && { opacity: 0.7 }]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedRequest(req)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="time-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.offerBtnText}>Accept / Set Time</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Elder Request Details & Interactive Map Modal */}
      <ElderRequestDetailModal
        visible={!!selectedRequest}
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onAccept={(req, customArrivalTime) => {
          setSelectedRequest(null);
          handleAccept(req, customArrivalTime);
        }}
        isAccepting={submittingId === (selectedRequest?._id || selectedRequest?.id)}
      />

      {/* Offer Help Modal with Manual Time Picker */}
      <OfferHelpModal
        visible={offerModalVisible}
        onClose={() => setOfferModalVisible(false)}
        onSave={handleSaveOffer}
        isSubmitting={offerSubmitting}
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
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  postOfferHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  postOfferHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  countBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3730A3',
  },
  headerSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    paddingVertical: 0,
  },
  districtFilterRow: {
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    paddingBottom: 6,
  },
  filterRow: {
    backgroundColor: '#FFFFFF',
    paddingTop: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  districtFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
  },
  districtFilterChipActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  districtFilterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  districtFilterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  container: {
    flex: 1,
  },
  scrollPadding: {
    padding: 16,
    paddingBottom: 30,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
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
  resetFilterBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
  },
  resetFilterBtnText: {
    color: '#1E40AF',
    fontWeight: '700',
    fontSize: 13,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  sameDistrictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  sameDistrictBadgeText: {
    color: '#047857',
    fontSize: 10.5,
    fontWeight: '700',
  },
  sameDistrictBadgeHighlight: {
    backgroundColor: '#D1FAE5',
    borderColor: '#34D399',
  },
  badgeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  todayTag: {
    backgroundColor: '#EFF6FF',
  },
  urgentTag: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  todayBadgeText: {
    color: '#1D4ED8',
  },
  urgentBadgeText: {
    color: '#DC2626',
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  serviceTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  elderName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    color: '#64748B',
    flexShrink: 1,
  },
  viewMapHint: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
    marginLeft: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dateTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 10,
  },
  notesBox: {
    backgroundColor: '#FEF9C3',
    borderColor: '#FEF08A',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#854D0E',
    marginBottom: 3,
  },
  notesText: {
    fontSize: 12,
    color: '#713F12',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  itemsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  itemsHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  itemBullet: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  viewDetailsBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingVertical: 12,
  },
  viewDetailsBtnText: {
    color: '#1E40AF',
    fontWeight: '700',
    fontSize: 13,
  },
  offerBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingVertical: 12,
  },
  offerBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  // Direct Requests Styles
  directSection: {
    marginBottom: 20,
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  directHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  directBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  directBadgeText: {
    color: '#B45309',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  directHeaderHint: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
  },
  directCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FCD34D',
    elevation: 2,
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  directCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  directServicePill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  directServicePillText: {
    color: '#1E40AF',
    fontWeight: '700',
    fontSize: 12,
  },
  directDateTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  directElderName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  directCaregiverName: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  directAddress: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 12,
  },
  directActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  directDeclineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  directDeclineBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
  directAcceptBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#16A34A',
  },
  directAcceptBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
