// src/screens/volunteer/VolunteerDashboardHome.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/theme';
import OfferHelpModal from '../../components/volunteer/OfferHelpModal';
import ElderRequestDetailModal from '../../components/volunteer/ElderRequestDetailModal';
import AvatarActionModal from '../../components/common/AvatarActionModal';
import * as volunteerService from '../../services/volunteerService';
import * as messageService from '../../services/messageService';
import { showAppAlert } from '../../utils/alert';

export default function VolunteerDashboardHome({ onNavigateTab }) {
  const { user, uploadProfilePicture, deleteProfilePicture, refreshProfile } = useAuth();

  // State management
  const [isOnline, setIsOnline] = useState(true);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [availabilityModalVisible, setAvailabilityModalVisible] = useState(false);

  // Live Backend Data
  const [myOffers, setMyOffers] = useState([]);
  const [requestsList, setRequestsList] = useState([]);
  const [directRequests, setDirectRequests] = useState([]);
  const [stats, setStats] = useState({
    hoursThisMonth: 0,
    peopleHelped: 0,
    averageRating: 5.0,
    totalCompletedVisits: 0,
  });
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for Availability
  const [availHours, setAvailHours] = useState('Weekdays & Weekends (9 AM - 6 PM)');
  const [maxTravelDistance, setMaxTravelDistance] = useState('5 km');

  // Greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const volunteerName = user?.firstName || 'Volunteer';
  const volunteerLocation = user?.address?.city
    ? `${user.address.city}, ${user.address.district || 'Colombo'}`
    : 'Colombo 03';

  // Profile Picture Status & Handlers
  const hasProfilePic = Boolean(user?.profilePicture || user?.avatar);
  const initials = `${user?.firstName?.[0] || 'V'}${user?.lastName?.[0] || ''}`.toUpperCase();

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access gallery is required to change profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingAvatar(true);
        const imageAsset = result.assets[0];
        if (uploadProfilePicture) {
          await uploadProfilePicture(imageAsset);
        }
        if (refreshProfile) {
          await refreshProfile();
        }
        Alert.alert('Success', 'Profile picture updated successfully!');
      }
    } catch (err) {
      console.error('Avatar gallery pick/upload error:', err);
      Alert.alert('Upload Failed', err.message || err.response?.data?.message || 'Could not upload image');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take a profile picture.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingAvatar(true);
        const imageAsset = result.assets[0];
        if (uploadProfilePicture) {
          await uploadProfilePicture(imageAsset);
        }
        if (refreshProfile) {
          await refreshProfile();
        }
        Alert.alert('Success', 'Profile picture updated successfully!');
      }
    } catch (err) {
      console.error('Avatar camera upload error:', err);
      Alert.alert('Upload Failed', err.message || err.response?.data?.message || 'Could not upload image');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setUploadingAvatar(true);
      if (deleteProfilePicture) {
        await deleteProfilePicture();
      }
      if (refreshProfile) {
        await refreshProfile();
      }
      Alert.alert('Success', 'Profile picture removed successfully');
    } catch (err) {
      console.error('Remove avatar error:', err);
      Alert.alert('Error', err.message || 'Could not remove profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Fetch real data from backend
  const loadDashboardData = useCallback(async () => {
    try {
      const [offersRes, reqsRes, statsRes, directRes, convoRes] = await Promise.allSettled([
        volunteerService.getMyOffers(),
        volunteerService.getAvailableRequests(),
        volunteerService.getMyStats(),
        volunteerService.getDirectRequests(),
        messageService.getConversations(),
      ]);

      if (offersRes.status === 'fulfilled' && offersRes.value?.success) {
        setMyOffers(offersRes.value.data || []);
      }
      if (reqsRes.status === 'fulfilled' && reqsRes.value?.success) {
        setRequestsList(reqsRes.value.data || []);
      }
      if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
        setStats(statsRes.value.data || { hoursThisMonth: 0, peopleHelped: 0, averageRating: 5.0 });
      }
      if (directRes.status === 'fulfilled' && directRes.value?.success) {
        setDirectRequests(directRes.value.data || []);
      }
      if (convoRes.status === 'fulfilled' && convoRes.value?.success) {
        const unreadTotal = (convoRes.value.data || []).reduce(
          (sum, c) => sum + (c.unreadCount || 0),
          0
        );
        setUnreadMsgCount(unreadTotal);
      }
    } catch (err) {
      console.error('Error loading volunteer dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleAcceptDirect = async (dReq) => {
    const reqId = dReq._id || dReq.id;
    try {
      setIsSubmitting(true);
      // Immediately remove from UI state so it disappears right away
      setDirectRequests((prev) => prev.filter((item) => (item._id || item.id) !== reqId));
      const res = await volunteerService.acceptDirectRequest(reqId);
      if (res?.success) {
        showAppAlert(
          '🎉 Request Accepted!',
          `You have confirmed the visit for ${dReq.elderName}.\nIt has been added to your Volunteer Schedule!`,
          [
            { text: 'Stay Here', onPress: () => loadDashboardData() },
            {
              text: 'View Schedule',
              onPress: () => {
                loadDashboardData();
                onNavigateTab('schedule');
              },
            },
          ]
        );
        loadDashboardData();
      }
    } catch (err) {
      loadDashboardData();
      showAppAlert('Error', err.response?.data?.message || err.message || 'Failed to accept visit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeclineDirect = async (dReq) => {
    const reqId = dReq._id || dReq.id;
    try {
      setIsSubmitting(true);
      // Immediately remove from UI state so it disappears right away
      setDirectRequests((prev) => prev.filter((item) => (item._id || item.id) !== reqId));
      const res = await volunteerService.declineDirectRequest(reqId);
      if (res?.success) {
        showAppAlert('Request Declined', 'The visit request has been declined.');
        loadDashboardData();
      }
    } catch (err) {
      loadDashboardData();
      showAppAlert('Error', err.response?.data?.message || err.message || 'Failed to decline request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Real Offer CRUD Handlers
  const handleSaveOffer = async (offerData) => {
    try {
      setIsSubmitting(true);
      if (editingOffer) {
        const id = editingOffer._id || editingOffer.id;
        const res = await volunteerService.updateOffer(id, offerData);
        if (res.success) {
          showAppAlert('✅ Offer Updated', 'Your availability offer has been updated on the community board.');
          loadDashboardData();
        }
      } else {
        const res = await volunteerService.createOffer(offerData);
        if (res.success) {
          showAppAlert(
            '🎉 Offer Posted Successfully!',
            'Your offer is now Pending on the dashboard. When an elder in your area accepts, your slot count will update automatically.'
          );
          loadDashboardData();
        }
      }
      setEditingOffer(null);
      setOfferModalVisible(false);
    } catch (err) {
      showAppAlert('Error', err.response?.data?.message || err.message || 'Failed to save offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditOffer = (offer) => {
    setEditingOffer(offer);
    setOfferModalVisible(true);
  };

  const handleDeleteOffer = (offerId) => {
    showAppAlert(
      'Cancel & Delete Offer',
      'Are you sure you want to remove this availability offer from the community board?',
      [
        { text: 'Keep Offer', style: 'cancel' },
        {
          text: 'Delete Offer',
          style: 'destructive',
          onPress: async () => {
            try {
              await volunteerService.deleteOffer(offerId);
              showAppAlert('Offer Removed', 'Your offer has been removed.');
              loadDashboardData();
            } catch (err) {
              showAppAlert('Error', err.response?.data?.message || err.message || 'Failed to remove offer');
            }
          },
        },
      ]
    );
  };

  const handleAcceptRequest = async (request) => {
    const reqId = request._id || request.id;
    try {
      setIsSubmitting(true);
      // Immediately remove from UI list
      setRequestsList((prev) => prev.filter((item) => (item._id || item.id) !== reqId));
      const res = await volunteerService.acceptRequest(reqId);
      if (res.success) {
        setSelectedRequest(null);
        showAppAlert(
          '🎉 Request Accepted!',
          `You have successfully accepted the task for ${request.elderName}.\nIt has been added to your Volunteer Schedule.`,
          [
            { text: 'Stay Here', onPress: () => loadDashboardData() },
            {
              text: 'View Schedule',
              onPress: () => {
                loadDashboardData();
                onNavigateTab('schedule');
              },
            },
          ]
        );
      }
    } catch (err) {
      loadDashboardData();
      showAppAlert('Error', err.response?.data?.message || err.message || 'Failed to accept request');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <View style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E3A8A']} />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Changeable Profile Picture */}
            <TouchableOpacity
              style={styles.avatarTouchable}
              onPress={() => setAvatarModalVisible(true)}
              activeOpacity={0.8}
              disabled={uploadingAvatar}
              accessibilityLabel="Change profile picture"
              accessibilityRole="button"
            >
              <View style={styles.avatarContainer}>
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color="#1E3A8A" />
                ) : hasProfilePic ? (
                  <Image
                    source={{ uri: user.profilePicture || user.avatar }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarInner}>
                    <Text style={styles.avatarEmoji}>🔥</Text>
                  </View>
                )}
                <View style={styles.cameraBadge}>
                  <Ionicons name={hasProfilePic ? 'pencil' : 'camera'} size={10} color="#FFFFFF" />
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.greetingContainer}>
              <View style={styles.greetingRow}>
                <Text style={styles.greetingText}>
                  {getGreeting()}, {volunteerName} 👋
                </Text>
              </View>

              <TouchableOpacity
                style={styles.locationRow}
                onPress={() => setAvailabilityModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.locationText}>{volunteerLocation}</Text>
                <Text style={styles.locationSeparator}>·</Text>
                <View
                  style={[
                    styles.statusIndicatorDot,
                    { backgroundColor: isOnline ? '#22C55E' : '#94A3B8' },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: isOnline ? '#16A34A' : '#64748B' },
                  ]}
                >
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 3 Metric Cards Row (Matches Wireframe with Live Backend Data) */}
        <View style={styles.metricsRow}>
          {/* Card 1: Hours this month (Lavender) */}
          <View style={[styles.metricCard, styles.metricCardPrimary]}>
            <Text style={[styles.metricValue, styles.metricValuePrimary]}>
              {stats.hoursThisMonth} hrs
            </Text>
            <Text style={[styles.metricLabel, styles.metricLabelPrimary]}>this month</Text>
          </View>

          {/* Card 2: people helped */}
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{stats.peopleHelped}</Text>
            <Text style={styles.metricLabel}>people</Text>
          </View>

          {/* Card 3: your rating */}
          <View style={styles.metricCard}>
            <View style={styles.ratingValueRow}>
              <Text style={styles.metricValue}>{stats.averageRating}</Text>
              <Text style={styles.starIcon}>★</Text>
            </View>
            <Text style={styles.metricLabel}>your rating</Text>
          </View>
        </View>

        {/* Messages & Coordination Quick Access Card */}
        <TouchableOpacity
          style={styles.messagesBannerCard}
          onPress={() => onNavigateTab && onNavigateTab('messages')}
          activeOpacity={0.85}
        >
          <View style={styles.messagesBannerIconWrap}>
            <Ionicons name="chatbubbles" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.messagesBannerContent}>
            <View style={styles.messagesBannerHeader}>
              <Text style={styles.messagesBannerTitle}>Messages & Coordination</Text>
              {unreadMsgCount > 0 ? (
                <View style={styles.messagesBannerBadge}>
                  <Text style={styles.messagesBannerBadgeText}>{unreadMsgCount} NEW</Text>
                </View>
              ) : (
                <View style={styles.messagesLiveBadge}>
                  <View style={styles.messagesLiveDot} />
                  <Text style={styles.messagesLiveText}>REAL-TIME</Text>
                </View>
              )}
            </View>
            <Text style={styles.messagesBannerSub}>
              Chat in real-time with seniors and family caregivers
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* --- SECTION: DIRECT VISIT REQUESTS (Sent directly to this volunteer) --- */}
        {directRequests.length > 0 && (
          <View style={styles.directSectionHome}>
            <View style={styles.directHeaderHome}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.directBadgeHome}>📬 DIRECT VISIT REQUESTS</Text>
                <View style={styles.directCountBadgeHome}>
                  <Text style={styles.directCountTextHome}>{directRequests.length}</Text>
                </View>
              </View>
              <Text style={styles.directSubHome}>A family member sent a visit request to you!</Text>
            </View>

            {directRequests.map((dReq) => {
              const dKey = dReq._id || dReq.id;
              return (
                <View key={dKey} style={styles.directCardHome}>
                  <View style={styles.directCardTopHome}>
                    <View style={styles.directPillHome}>
                      <Text style={styles.directPillTextHome}>{dReq.type || dReq.serviceType}</Text>
                    </View>
                    <Text style={styles.directDateTimeHome}>🕒 {dReq.date} · {dReq.time}</Text>
                  </View>

                  <Text style={styles.directElderHome}>For: {dReq.elderName}</Text>
                  {dReq.caregiverName ? (
                    <Text style={styles.directCaregiverHome}>Requested by: {dReq.caregiverName}</Text>
                  ) : null}
                  <Text style={styles.directLocationHome}>📍 {dReq.location || dReq.address}</Text>

                  <View style={styles.directActionsRowHome}>
                    <TouchableOpacity
                      style={styles.directDeclineBtnHome}
                      onPress={() => handleDeclineDirect(dReq)}
                      disabled={isSubmitting}
                    >
                      <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                      <Text style={styles.directDeclineBtnTextHome}>Decline</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.directAcceptBtnHome}
                      onPress={() => handleAcceptDirect(dReq)}
                      disabled={isSubmitting}
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                      <Text style={styles.directAcceptBtnTextHome}>Accept Visit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* --- SECTION: My Active Offers / Posted Availability (CRUD Display) --- */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.sectionTitle}>My Active Offers</Text>
              <View style={styles.offerCountBadge}>
                <Text style={styles.offerCountText}>{myOffers.length}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                setEditingOffer(null);
                setOfferModalVisible(true);
              }}
              activeOpacity={0.7}
              style={styles.postOfferLinkBtn}
            >
              <Ionicons name="add-circle" size={16} color="#1E40AF" />
              <Text style={styles.postOfferLinkText}>+ Post New Offer</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#1E3A8A" />
              <Text style={{ marginTop: 8, color: '#64748B', fontSize: 13 }}>Loading offers...</Text>
            </View>
          ) : myOffers.length === 0 ? (
            <View style={styles.emptyOffersBox}>
              <Text style={styles.emptyOffersEmoji}>🤝</Text>
              <Text style={styles.emptyOffersTitle}>No Active Offers Posted</Text>
              <Text style={styles.emptyOffersSub}>
                Post your available hours and services to let seniors in your area book help.
              </Text>
              <TouchableOpacity
                style={styles.postFirstOfferBtn}
                onPress={() => {
                  setEditingOffer(null);
                  setOfferModalVisible(true);
                }}
              >
                <Text style={styles.postFirstOfferBtnText}>+ Offer Your Help Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.offersList}>
              {myOffers.map((offer) => {
                const offerKey = offer._id || offer.id;
                return (
                  <View key={offerKey} style={styles.offerCard}>
                    {/* Card Header */}
                    <View style={styles.offerCardHeader}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.offerVolunteerRow}>
                          <Text style={styles.offerVolunteerName}>
                            👤 {offer.volunteerName}
                          </Text>
                          <View style={styles.pendingBadge}>
                            <Text style={styles.pendingBadgeText}>
                              {(offer.status || 'pending').toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.offerDateTime}>
                          📅 Available on {offer.date} · 🕒 {offer.startTime} - {offer.endTime}
                        </Text>
                      </View>

                      {/* Slots Left Badge */}
                      <View style={styles.slotsLeftBadge}>
                        <Text style={styles.slotsLeftNumber}>{offer.slotsLeft}</Text>
                        <Text style={styles.slotsLeftLabel}>Slots Left</Text>
                      </View>
                    </View>

                    {/* Services Badges */}
                    <View style={styles.servicesPillsRow}>
                      {(offer.services || []).map((srv, idx) => (
                        <View key={idx} style={styles.servicePill}>
                          <Text style={styles.servicePillText}>
                            {srv.includes('Grocery')
                              ? '🛒 '
                              : srv.includes('Pharmacy')
                              ? '💊 '
                              : srv.includes('Companionship')
                              ? '🤝 '
                              : srv.includes('Tech')
                              ? '📱 '
                              : '🐕 '}
                            {srv}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Area & Radius */}
                    <View style={styles.offerLocationRow}>
                      <Ionicons name="navigate-outline" size={14} color="#64748B" />
                      <Text style={styles.offerLocationText}>
                        {offer.serviceArea} ({offer.radius})
                      </Text>
                    </View>

                    {/* Special Skills / Extra Details */}
                    {offer.specialSkills ? (
                      <View style={styles.skillsBox}>
                        <Text style={styles.skillsTag}>Special Skills / Notes:</Text>
                        <Text style={styles.skillsContent}>"{offer.specialSkills}"</Text>
                      </View>
                    ) : null}

                    {/* CRUD Action Buttons */}
                    <View style={styles.offerActionsRow}>
                      <TouchableOpacity
                        style={styles.editOfferBtn}
                        onPress={() => handleEditOffer(offer)}
                      >
                        <Ionicons name="create-outline" size={15} color="#1E40AF" />
                        <Text style={styles.editOfferBtnText}>Edit Offer</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteOfferBtn}
                        onPress={() => handleDeleteOffer(offerKey)}
                      >
                        <Ionicons name="trash-outline" size={15} color="#DC2626" />
                        <Text style={styles.deleteOfferBtnText}>Cancel Offer</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Section: Nearby requests (Live Community Feed) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Nearby requests</Text>
            <TouchableOpacity
              onPress={() => onNavigateTab('request')}
              activeOpacity={0.7}
              style={styles.seeAllBtn}
            >
              <Text style={styles.seeAllText}>See all ({requestsList.length})</Text>
            </TouchableOpacity>
          </View>

          {/* Request Cards */}
          <View style={styles.requestList}>
            {requestsList.length === 0 ? (
              <View style={{ paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ color: '#64748B', fontSize: 13 }}>No pending requests in your area right now.</Text>
              </View>
            ) : (
              requestsList.slice(0, 3).map((req) => {
                const reqKey = req._id || req.id;
                const isUrgent = req.badgeType === 'urgent';
                return (
                  <View key={reqKey} style={styles.requestCard}>
                    <TouchableOpacity
                      style={styles.requestCardTop}
                      onPress={() => setSelectedRequest(req)}
                      activeOpacity={0.85}
                    >
                      {/* Category icon avatar */}
                      <View style={styles.reqAvatarContainer}>
                        <View style={styles.reqAvatarInner}>
                          <Text style={styles.reqAvatarEmoji}>
                            {req.category === 'grocery' ? '🛒' : req.category === 'medical' ? '💊' : '🤝'}
                          </Text>
                        </View>
                      </View>

                      {/* Info */}
                      <View style={styles.reqInfoContainer}>
                        <Text style={styles.reqTitle}>{req.type}</Text>
                        <Text style={styles.reqElderName}>For: {req.elderName}</Text>
                        <Text style={styles.reqMeta}>
                          📍 {req.distance || '1.2 km'} · 🕒 {req.duration || '45 min'}
                        </Text>
                      </View>

                      {/* Badge */}
                      <View style={styles.badgeContainer}>
                        <View
                          style={[
                            styles.statusBadge,
                            isUrgent ? styles.urgentBadge : styles.todayBadge,
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              isUrgent ? styles.urgentBadgeText : styles.todayBadgeText,
                            ]}
                          >
                            {req.badge || 'Open'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Card Actions: View Details & Map + Accept */}
                    <View style={styles.requestCardActions}>
                      <TouchableOpacity
                        style={styles.dashboardViewDetailsBtn}
                        onPress={() => setSelectedRequest(req)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="map-outline" size={15} color="#1E40AF" style={{ marginRight: 5 }} />
                        <Text style={styles.dashboardViewDetailsText}>View Details & Map</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.dashboardQuickAcceptBtn}
                        onPress={() => handleAcceptRequest(req)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="hand-left-outline" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.dashboardQuickAcceptText}>Accept Help</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Section: Quick actions (Matches Wireframe) */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Quick actions</Text>

          <View style={styles.quickActionsRow}>
            {/* Quick Action 1: Add Request (Offer Help / Post Availability) */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => {
                setEditingOffer(null);
                setOfferModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIconBox}>
                <Text style={styles.quickActionEmoji}>📅</Text>
              </View>
              <Text style={styles.quickActionLabel}>Add Request</Text>
              <Text style={styles.quickActionSub}>Offer Your Help</Text>
            </TouchableOpacity>

            {/* Quick Action 2: Availability */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => setAvailabilityModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIconBox}>
                <Text style={styles.quickActionEmoji}>🕒</Text>
              </View>
              <Text style={styles.quickActionLabel}>Availability</Text>
              <Text style={styles.quickActionSub}>Set Hours</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Banner: Community Impact */}
        <View style={styles.impactCard}>
          <View style={styles.impactIconCol}>
            <Ionicons name="heart-circle" size={36} color="#0D9488" />
          </View>
          <View style={styles.impactTextCol}>
            <Text style={styles.impactTitle}>You are making a difference!</Text>
            <Text style={styles.impactSubtitle}>
              TogetherCare volunteers have completed 240+ assistance visits in Colombo this week.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* --- OFFER HELP MODAL (CRUD Add & Edit Form) --- */}
      <OfferHelpModal
        visible={offerModalVisible}
        onClose={() => {
          setOfferModalVisible(false);
          setEditingOffer(null);
        }}
        onSubmit={handleSaveOffer}
        initialData={editingOffer}
        currentUser={user}
      />

      {/* --- MODAL: Request Detail & Interactive Map Modal --- */}
      <ElderRequestDetailModal
        visible={!!selectedRequest}
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onAccept={(req) => handleAcceptRequest(req)}
        isAccepting={isSubmitting}
      />

      {/* --- MODAL: Availability Modal --- */}
      <Modal
        visible={availabilityModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAvailabilityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.formModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Volunteer Availability</Text>
              <TouchableOpacity
                onPress={() => setAvailabilityModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Online / Offline Switch Box */}
            <View style={styles.availToggleCard}>
              <View>
                <Text style={styles.availToggleTitle}>Active Status</Text>
                <Text style={styles.availToggleSubtitle}>
                  {isOnline
                    ? 'You are receiving nearby elderly assistance notifications.'
                    : 'You are marked offline. You will not receive emergency alerts.'}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.onlineToggleBtn,
                  { backgroundColor: isOnline ? '#16A34A' : '#94A3B8' },
                ]}
                onPress={() => setIsOnline(!isOnline)}
                activeOpacity={0.8}
              >
                <Text style={styles.onlineToggleBtnText}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Available Time Slots</Text>
            <View style={styles.slotOptions}>
              {[
                'Weekdays & Weekends (9 AM - 6 PM)',
                'Mornings Only (8 AM - 12 PM)',
                'Evenings Only (4 PM - 8 PM)',
                'Weekends Only',
              ].map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.slotItem,
                    availHours === slot && styles.slotItemActive,
                  ]}
                  onPress={() => setAvailHours(slot)}
                >
                  <Text
                    style={[
                      styles.slotItemText,
                      availHours === slot && styles.slotItemTextActive,
                    ]}
                  >
                    {availHours === slot ? '✓ ' : ''}{slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Maximum Travel Radius</Text>
            <View style={styles.typeSelectorRow}>
              {['2 km', '5 km', '10 km', 'Anywhere'].map((dist) => (
                <TouchableOpacity
                  key={dist}
                  style={[
                    styles.typeChip,
                    maxTravelDistance === dist && styles.typeChipActive,
                  ]}
                  onPress={() => setMaxTravelDistance(dist)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      maxTravelDistance === dist && styles.typeChipTextActive,
                    ]}
                  >
                    {dist}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.modalPrimaryBtn, { marginTop: 20 }]}
              onPress={() => {
                setAvailabilityModalVisible(false);
                Alert.alert('Saved', 'Your volunteer availability preferences have been updated!');
              }}
            >
              <Text style={styles.modalPrimaryBtnText}>Save Preferences</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- AVATAR ACTION MODAL (CAMERA / GALLERY / REMOVE) --- */}
      <AvatarActionModal
        visible={avatarModalVisible}
        onClose={() => setAvatarModalVisible(false)}
        onTakePhoto={handleTakePhoto}
        onPickPhoto={handlePickFromGallery}
        onRemovePhoto={handleRemoveAvatar}
        hasExistingPhoto={hasProfilePic}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarTouchable: {
    marginRight: 14,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#1E3A8A',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  locationSeparator: {
    marginHorizontal: 5,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  statusIndicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 5,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // 3 Metric Cards
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 26,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricCardPrimary: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValuePrimary: {
    color: '#1E40AF',
  },
  ratingValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starIcon: {
    fontSize: 15,
    color: '#EAB308',
    marginLeft: 3,
    marginBottom: 3,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  metricLabelPrimary: {
    color: '#3B82F6',
    fontWeight: '700',
  },

  // Sections
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  offerCountBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  offerCountText: {
    color: '#1E40AF',
    fontSize: 12,
    fontWeight: '800',
  },
  postOfferLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  postOfferLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  seeAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
  },

  // My Active Offers Styles
  offersList: {
    gap: 12,
  },
  offerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  offerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  offerVolunteerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  offerVolunteerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  offerDateTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  slotsLeftBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 65,
  },
  slotsLeftNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E40AF',
  },
  slotsLeftLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#3B82F6',
    textTransform: 'uppercase',
  },
  servicesPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  servicePill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  servicePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  offerLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  offerLocationText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  skillsBox: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    marginBottom: 10,
  },
  skillsTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E40AF',
    textTransform: 'uppercase',
  },
  skillsContent: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#334155',
    marginTop: 2,
  },
  offerActionsRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  editOfferBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 36,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  editOfferBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  deleteOfferBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 36,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  deleteOfferBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },

  // Empty Offers
  emptyOffersBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyOffersEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  emptyOffersTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
  },
  emptyOffersSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  postFirstOfferBtn: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  postFirstOfferBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  // Nearby Requests List
  requestList: {
    gap: 12,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  requestCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestCardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dashboardViewDetailsBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    paddingVertical: 8,
  },
  dashboardViewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  dashboardQuickAcceptBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    borderRadius: 10,
    paddingVertical: 8,
  },
  dashboardQuickAcceptText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  requestCardAccepted: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  reqAvatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reqAvatarInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FED7AA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reqAvatarEmoji: {
    fontSize: 18,
  },
  reqInfoContainer: {
    flex: 1,
  },
  reqTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 18,
  },
  reqElderName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  reqMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  badgeContainer: {
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentBadge: {
    backgroundColor: '#FEE2E2',
  },
  urgentBadgeText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  todayBadge: {
    backgroundColor: '#ECFCCB',
  },
  todayBadgeText: {
    color: '#65A30D',
    fontSize: 11,
    fontWeight: '800',
  },
  acceptedBadge: {
    backgroundColor: '#DCFCE7',
  },
  acceptedBadgeText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '800',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },

  // Quick Actions Grid
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionEmoji: {
    fontSize: 22,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  quickActionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // Impact Card
  impactCard: {
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  impactIconCol: {
    marginRight: 12,
  },
  impactTextCol: {
    flex: 1,
  },
  impactTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F766E',
    marginBottom: 2,
  },
  impactSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#115E59',
    lineHeight: 16,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  detailModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  formModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderTitleGroup: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  detailMetaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  detailMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailMetaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  detailSectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    marginTop: 10,
    marginBottom: 4,
  },
  detailAddressText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
  },
  itemsList: {
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  itemBullet: {
    color: '#1E40AF',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 6,
  },
  itemText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  notesText: {
    fontSize: 13,
    color: '#64748B',
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    marginBottom: 16,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  modalSecondaryBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSecondaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  modalPrimaryBtn: {
    flex: 2,
    height: 48,
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAcceptedBtn: {
    backgroundColor: '#16A34A',
  },
  modalPrimaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Form Fields in Modals
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
    marginBottom: 6,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  typeChipActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  typeChipTextActive: {
    color: '#FFFFFF',
  },

  // Availability toggle
  availToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  availToggleTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  availToggleSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    maxWidth: 200,
  },
  onlineToggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  onlineToggleBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  slotOptions: {
    gap: 8,
    marginBottom: 12,
  },
  slotItem: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  slotItemActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  slotItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  slotItemTextActive: {
    color: '#1E40AF',
    fontWeight: '800',
  },

  // Notifications Item
  notifItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  notifIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  notifItemDesc: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  notifTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  // Direct Requests Styles on Home
  directSectionHome: {
    marginBottom: 20,
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  directHeaderHome: {
    marginBottom: 12,
  },
  directBadgeHome: {
    color: '#B45309',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  directCountBadgeHome: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  directCountTextHome: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  directSubHome: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  directCardHome: {
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
  directCardTopHome: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  directPillHome: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  directPillTextHome: {
    color: '#1E40AF',
    fontWeight: '700',
    fontSize: 12,
  },
  directDateTimeHome: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  directElderHome: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  directCaregiverHome: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  directLocationHome: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 12,
  },
  directActionsRowHome: {
    flexDirection: 'row',
    gap: 10,
  },
  directDeclineBtnHome: {
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
  directDeclineBtnTextHome: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
  directAcceptBtnHome: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#16A34A',
  },
  directAcceptBtnTextHome: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  // Messages Banner Card on Dashboard
  messagesBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 6,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  messagesBannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesBannerContent: {
    flex: 1,
  },
  messagesBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messagesBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  messagesBannerBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  messagesBannerBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  messagesLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  messagesLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  messagesLiveText: {
    color: '#15803D',
    fontSize: 9,
    fontWeight: '800',
  },
  messagesBannerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
});
