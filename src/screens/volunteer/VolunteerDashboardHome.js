// src/screens/volunteer/VolunteerDashboardHome.js
import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/theme';
import OfferHelpModal from '../../components/volunteer/OfferHelpModal';

export default function VolunteerDashboardHome({ onNavigateTab }) {
  const { user } = useAuth();

  // State management
  const [isOnline, setIsOnline] = useState(true);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [availabilityModalVisible, setAvailabilityModalVisible] = useState(false);
  const [acceptedRequests, setAcceptedRequests] = useState([]);

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

  const volunteerName = user?.firstName || 'Sarah';
  const volunteerLocation = user?.address?.city
    ? `${user.address.city}, ${user.address.district || 'Colombo'}`
    : 'Colombo 03';

  // Volunteer's active offers (CRUD state)
  const [myOffers, setMyOffers] = useState([
    {
      id: 'offer-1',
      volunteerName: `${volunteerName} ${user?.lastName || ''}`.trim(),
      services: ['Grocery Pickup', 'Pharmacy Run'],
      date: '2026-08-25',
      startTime: '02:00 PM',
      endTime: '04:00 PM',
      serviceArea: 'Colombo 03',
      radius: 'Within 5 km',
      capacity: 2,
      slotsLeft: 2,
      specialSkills: 'I have a large SUV and can carry heavy grocery loads.',
      status: 'pending',
    },
  ]);

  // Requests matching wireframe + rich data
  const [requestsList, setRequestsList] = useState([
    {
      id: 'req-1',
      type: 'Grocery pickup',
      category: 'grocery',
      elderName: 'Mrs. Perera',
      distance: '1.2 km',
      duration: '45 min',
      badge: 'Urgent',
      badgeType: 'urgent',
      address: 'No. 42, Galle Road, Colombo 03',
      phone: '077 123 4567',
      items: ['Fresh Milk (2L)', 'White Bread (1 Loaf)', 'Eggs (12 Pack)', 'Bananas (1kg)'],
      notes: 'Please check expiry dates and call before arriving. Gate has buzzer.',
    },
    {
      id: 'req-2',
      type: 'Grocery pickup',
      category: 'grocery',
      elderName: 'Mrs. Perera',
      distance: '1.2 km',
      duration: '45 min',
      badge: 'Today',
      badgeType: 'today',
      address: 'No. 18, Flower Road, Colombo 07',
      phone: '071 987 6543',
      items: ['Vegetables (Carrots, Beans, Potatoes)', 'Red Rice 5kg', 'Tea Leaves'],
      notes: 'Assistance needed this afternoon around 3:00 PM.',
    },
    {
      id: 'req-3',
      type: 'Pharmacy & Medicine',
      category: 'medical',
      elderName: 'Mr. Fernando',
      distance: '2.5 km',
      duration: '30 min',
      badge: 'Today',
      badgeType: 'today',
      address: 'No. 88, Duplication Road, Colombo 04',
      phone: '075 555 1234',
      items: ['Prescription Blood Pressure Pills', 'Eye Drops (Refresh Tears)'],
      notes: 'Prescription slip will be given upon arrival.',
    },
  ]);

  // Offer CRUD Handlers
  const handleSaveOffer = (offerData) => {
    if (editingOffer) {
      // Update existing offer (CRUD Update)
      setMyOffers((prev) =>
        prev.map((o) => (o.id === editingOffer.id ? { ...o, ...offerData } : o))
      );
      Alert.alert('✅ Offer Updated', 'Your availability offer has been updated on the community board.');
    } else {
      // Create new offer (CRUD Create)
      setMyOffers((prev) => [offerData, ...prev]);
      Alert.alert(
        '🎉 Offer Posted Successfully!',
        'Your offer is now Pending on the dashboard. When an elder in your area accepts, your slot count will update automatically.'
      );
    }
    setEditingOffer(null);
    setOfferModalVisible(false);
  };

  const handleEditOffer = (offer) => {
    setEditingOffer(offer);
    setOfferModalVisible(true);
  };

  const handleDeleteOffer = (offerId) => {
    Alert.alert(
      'Cancel & Delete Offer',
      'Are you sure you want to remove this availability offer from the community board?',
      [
        { text: 'Keep Offer', style: 'cancel' },
        {
          text: 'Delete Offer',
          style: 'destructive',
          onPress: () => {
            setMyOffers((prev) => prev.filter((o) => o.id !== offerId));
            Alert.alert('Offer Removed', 'Your offer has been removed.');
          },
        },
      ]
    );
  };

  const handleAcceptRequest = (request) => {
    if (acceptedRequests.includes(request.id)) {
      Alert.alert('Already Accepted', 'You have already accepted this request.');
      return;
    }
    setAcceptedRequests((prev) => [...prev, request.id]);
    setSelectedRequest(null);
    Alert.alert(
      '🎉 Request Accepted!',
      `You have successfully accepted the task for ${request.elderName}.\nIt has been added to your Schedule tab.`,
      [
        { text: 'Stay Here', style: 'cancel' },
        { text: 'View in Schedule', onPress: () => onNavigateTab('schedule') },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Avatar matching wireframe flame badge */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatarInner}>
                <Text style={styles.avatarEmoji}>🔥</Text>
              </View>
            </View>

            <View style={styles.greetingContainer}>
              <View style={styles.greetingRow}>
                <Text style={styles.greetingText}>
                  {getGreeting()}, {volunteerName} 👋
                </Text>
                <TouchableOpacity
                  onPress={() => setNotificationsVisible(true)}
                  style={styles.bellButton}
                  activeOpacity={0.7}
                  accessibilityLabel="Notifications"
                >
                  <Text style={styles.bellEmoji}>🔔</Text>
                  <View style={styles.notifDot} />
                </TouchableOpacity>
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

        {/* 3 Metric Cards Row (Matches Wireframe) */}
        <View style={styles.metricsRow}>
          {/* Card 1: 12 hrs this month (Lavender) */}
          <View style={[styles.metricCard, styles.metricCardPrimary]}>
            <Text style={[styles.metricValue, styles.metricValuePrimary]}>12 hrs</Text>
            <Text style={[styles.metricLabel, styles.metricLabelPrimary]}>this month</Text>
          </View>

          {/* Card 2: 34 people */}
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>34</Text>
            <Text style={styles.metricLabel}>people</Text>
          </View>

          {/* Card 3: 4.9 ★ your rating */}
          <View style={styles.metricCard}>
            <View style={styles.ratingValueRow}>
              <Text style={styles.metricValue}>4.9</Text>
              <Text style={styles.starIcon}>★</Text>
            </View>
            <Text style={styles.metricLabel}>your rating</Text>
          </View>
        </View>

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

          {myOffers.length === 0 ? (
            <View style={styles.emptyOffersBox}>
              <Text style={styles.emptyOffersEmoji}>🤝</Text>
              <Text style={styles.emptyOffersTitle}>No Active Offers Posted</Text>
              <Text style={styles.emptyOffersSub}>
                Post your available hours and services to let seniors in Colombo book help.
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
              {myOffers.map((offer) => (
                <View key={offer.id} style={styles.offerCard}>
                  {/* Card Header */}
                  <View style={styles.offerCardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.offerVolunteerRow}>
                        <Text style={styles.offerVolunteerName}>
                          👤 {offer.volunteerName}
                        </Text>
                        <View style={styles.pendingBadge}>
                          <Text style={styles.pendingBadgeText}>
                            {offer.status.toUpperCase()}
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
                    {offer.services.map((srv, idx) => (
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
                      onPress={() => handleDeleteOffer(offer.id)}
                    >
                      <Ionicons name="trash-outline" size={15} color="#DC2626" />
                      <Text style={styles.deleteOfferBtnText}>Cancel Offer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Section: Nearby requests (Matches Wireframe) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Nearby requests</Text>
            <TouchableOpacity
              onPress={() => onNavigateTab('request')}
              activeOpacity={0.7}
              style={styles.seeAllBtn}
            >
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {/* Request Cards */}
          <View style={styles.requestList}>
            {requestsList.slice(0, 2).map((req) => {
              const isAccepted = acceptedRequests.includes(req.id);
              const isUrgent = req.badgeType === 'urgent';
              return (
                <TouchableOpacity
                  key={req.id}
                  style={[
                    styles.requestCard,
                    isAccepted && styles.requestCardAccepted,
                  ]}
                  onPress={() => setSelectedRequest(req)}
                  activeOpacity={0.85}
                >
                  {/* Category icon avatar */}
                  <View style={styles.reqAvatarContainer}>
                    <View style={styles.reqAvatarInner}>
                      <Text style={styles.reqAvatarEmoji}>
                        {req.category === 'grocery' ? '🛒' : '💊'}
                      </Text>
                    </View>
                  </View>

                  {/* Info */}
                  <View style={styles.reqInfoContainer}>
                    <Text style={styles.reqTitle}>{req.type}</Text>
                    <Text style={styles.reqElderName}>{req.elderName}</Text>
                    <Text style={styles.reqMeta}>
                      {req.distance} · {req.duration}
                    </Text>
                  </View>

                  {/* Badge */}
                  <View style={styles.badgeContainer}>
                    <View
                      style={[
                        styles.statusBadge,
                        isUrgent ? styles.urgentBadge : styles.todayBadge,
                        isAccepted && styles.acceptedBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          isUrgent ? styles.urgentBadgeText : styles.todayBadgeText,
                          isAccepted && styles.acceptedBadgeText,
                        ]}
                      >
                        {isAccepted ? '✓ Accepted' : req.badge}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
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

      {/* --- MODAL: Request Detail & Accept Modal --- */}
      <Modal
        visible={selectedRequest !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedRequest(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalCard}>
            {selectedRequest && (
              <>
                <View style={styles.modalHeaderRow}>
                  <View style={styles.modalHeaderTitleGroup}>
                    <Text style={styles.modalTitle}>{selectedRequest.type}</Text>
                    <Text style={styles.modalSubtitle}>
                      For {selectedRequest.elderName}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedRequest(null)}
                    style={styles.modalCloseBtn}
                  >
                    <Ionicons name="close" size={24} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailMetaBox}>
                  <View style={styles.detailMetaItem}>
                    <Ionicons name="location-outline" size={18} color="#1E40AF" />
                    <Text style={styles.detailMetaText}>{selectedRequest.distance}</Text>
                  </View>
                  <View style={styles.detailMetaItem}>
                    <Ionicons name="time-outline" size={18} color="#1E40AF" />
                    <Text style={styles.detailMetaText}>{selectedRequest.duration}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      selectedRequest.badgeType === 'urgent'
                        ? styles.urgentBadge
                        : styles.todayBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        selectedRequest.badgeType === 'urgent'
                          ? styles.urgentBadgeText
                          : styles.todayBadgeText,
                      ]}
                    >
                      {selectedRequest.badge}
                    </Text>
                  </View>
                </View>

                <Text style={styles.detailSectionHeading}>Address</Text>
                <Text style={styles.detailAddressText}>{selectedRequest.address}</Text>

                <Text style={styles.detailSectionHeading}>Requested Items / Task</Text>
                <View style={styles.itemsList}>
                  {selectedRequest.items.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <Text style={styles.itemBullet}>•</Text>
                      <Text style={styles.itemText}>{item}</Text>
                    </View>
                  ))}
                </View>

                {selectedRequest.notes ? (
                  <>
                    <Text style={styles.detailSectionHeading}>Notes & Instructions</Text>
                    <Text style={styles.notesText}>{selectedRequest.notes}</Text>
                  </>
                ) : null}

                <View style={styles.modalActionsRow}>
                  <TouchableOpacity
                    style={styles.modalSecondaryBtn}
                    onPress={() => setSelectedRequest(null)}
                  >
                    <Text style={styles.modalSecondaryBtnText}>Close</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalPrimaryBtn,
                      acceptedRequests.includes(selectedRequest.id) &&
                        styles.modalAcceptedBtn,
                    ]}
                    onPress={() => handleAcceptRequest(selectedRequest)}
                  >
                    <Text style={styles.modalPrimaryBtnText}>
                      {acceptedRequests.includes(selectedRequest.id)
                        ? '✓ Accepted'
                        : '🤝 Accept Request'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

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

      {/* --- MODAL: Notifications Modal --- */}
      <Modal
        visible={notificationsVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setNotificationsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.formModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Notifications 🔔</Text>
              <TouchableOpacity
                onPress={() => setNotificationsVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.notifItem}>
              <View style={styles.notifIconCircle}>
                <Ionicons name="flash" size={18} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifItemTitle}>Urgent Grocery Request</Text>
                <Text style={styles.notifItemDesc}>
                  Mrs. Perera (1.2 km away) requested urgent groceries pickup.
                </Text>
                <Text style={styles.notifTime}>10 mins ago</Text>
              </View>
            </View>

            <View style={styles.notifItem}>
              <View style={[styles.notifIconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="checkmark-circle" size={18} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifItemTitle}>Volunteer Hours Logged</Text>
                <Text style={styles.notifItemDesc}>
                  Your 2 hours for yesterday's companionship visit were confirmed.
                </Text>
                <Text style={styles.notifTime}>Yesterday</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalSecondaryBtn, { marginTop: 14 }]}
              onPress={() => setNotificationsVisible(false)}
            >
              <Text style={styles.modalSecondaryBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
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
  greetingContainer: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  bellButton: {
    padding: 6,
    position: 'relative',
  },
  bellEmoji: {
    fontSize: 20,
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
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
});
