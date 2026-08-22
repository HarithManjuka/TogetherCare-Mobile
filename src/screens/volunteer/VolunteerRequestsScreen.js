// src/screens/volunteer/VolunteerRequestsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

export default function VolunteerRequestsScreen({ onNavigateTab }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [acceptedList, setAcceptedList] = useState([]);

  const filters = ['All', '🚨 Urgent', '📅 Today', '🛒 Grocery', '💊 Medical', '🤝 Companion'];

  const allRequests = [
    {
      id: 'req-101',
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
      notes: 'Urgent grocery needed before noon. Call gate buzzer 4B.',
    },
    {
      id: 'req-102',
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
      notes: 'Delivery requested around 3:00 PM today.',
    },
    {
      id: 'req-103',
      type: 'Pharmacy & Prescriptions',
      category: 'medical',
      elderName: 'Mr. Fernando',
      distance: '2.4 km',
      duration: '30 min',
      badge: 'Today',
      badgeType: 'today',
      address: 'No. 88, Duplication Road, Colombo 04',
      phone: '075 555 1234',
      items: ['Blood pressure medicine (Losartan 50mg)', 'Eye Drops'],
      notes: 'Prescription at Union Chemists, paid in advance.',
    },
    {
      id: 'req-104',
      type: 'Afternoon Companionship & Walk',
      category: 'companion',
      elderName: 'Mrs. Jayasinghe',
      distance: '3.1 km',
      duration: '1 hr',
      badge: 'Scheduled',
      badgeType: 'scheduled',
      address: 'No. 105, Havelock Road, Colombo 05',
      phone: '076 333 4444',
      items: ['Accompanied garden walk', 'Newspaper reading assistance'],
      notes: 'Senior is cheerful and loves chess or conversation.',
    },
    {
      id: 'req-105',
      type: 'Hospital Appointment Escort',
      category: 'medical',
      elderName: 'Mr. De Silva',
      distance: '4.0 km',
      duration: '2 hrs',
      badge: 'Urgent',
      badgeType: 'urgent',
      address: 'No. 7, Ward Place, Colombo 07',
      phone: '078 888 9999',
      items: ['Escort to Asiri Central Hospital Clinic (Room 302)'],
      notes: 'Wheelchair assistance required from taxi to doctor room.',
    },
  ];

  const filteredRequests = allRequests.filter((req) => {
    // Search matching
    const matchesSearch =
      req.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.elderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.address.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Filter matching
    if (selectedFilter === 'All') return true;
    if (selectedFilter === '🚨 Urgent') return req.badgeType === 'urgent';
    if (selectedFilter === '📅 Today') return req.badgeType === 'today' || req.badgeType === 'urgent';
    if (selectedFilter === '🛒 Grocery') return req.category === 'grocery';
    if (selectedFilter === '💊 Medical') return req.category === 'medical';
    if (selectedFilter === '🤝 Companion') return req.category === 'companion';
    return true;
  });

  const handleAccept = (req) => {
    if (acceptedList.includes(req.id)) {
      Alert.alert('Already Accepted', 'You have already accepted this request.');
      return;
    }
    setAcceptedList((prev) => [...prev, req.id]);
    setSelectedRequest(null);
    Alert.alert(
      '🎉 Request Accepted!',
      `You accepted the request for ${req.elderName}.\nIt has been added to your schedule.`,
      [
        { text: 'Keep Browsing', style: 'cancel' },
        { text: 'Go to Schedule', onPress: () => onNavigateTab('schedule') },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Requests</Text>
        <Text style={styles.headerSubtitle}>
          Elderly community assistance needs near Colombo
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by task, elder name, or area..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter Chips */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                selectedFilter === filter && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === filter && styles.filterChipTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Requests List */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.countText}>
          Showing {filteredRequests.length} active requests
        </Text>

        {filteredRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No matching requests</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search query or filter category.
            </Text>
          </View>
        ) : (
          filteredRequests.map((req) => {
            const isAccepted = acceptedList.includes(req.id);
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
                <View style={styles.cardHeaderRow}>
                  {/* Category icon avatar */}
                  <View style={styles.reqAvatarContainer}>
                    <Text style={styles.reqAvatarEmoji}>
                      {req.category === 'grocery'
                        ? '🛒'
                        : req.category === 'medical'
                        ? '💊'
                        : '🤝'}
                    </Text>
                  </View>

                  <View style={styles.reqInfo}>
                    <Text style={styles.reqTitle}>{req.type}</Text>
                    <Text style={styles.reqElderName}>{req.elderName}</Text>
                  </View>

                  {/* Status Badge */}
                  <View
                    style={[
                      styles.statusBadge,
                      isUrgent
                        ? styles.urgentBadge
                        : req.badgeType === 'today'
                        ? styles.todayBadge
                        : styles.scheduledBadge,
                      isAccepted && styles.acceptedBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        isUrgent
                          ? styles.urgentBadgeText
                          : req.badgeType === 'today'
                          ? styles.todayBadgeText
                          : styles.scheduledBadgeText,
                        isAccepted && styles.acceptedBadgeText,
                      ]}
                    >
                      {isAccepted ? '✓ Accepted' : req.badge}
                    </Text>
                  </View>
                </View>

                {/* Details snippet */}
                <View style={styles.metaRow}>
                  <View style={styles.metaCol}>
                    <Ionicons name="location-outline" size={15} color="#64748B" />
                    <Text style={styles.metaText}>{req.distance}</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Ionicons name="time-outline" size={15} color="#64748B" />
                    <Text style={styles.metaText}>{req.duration}</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Ionicons name="home-outline" size={15} color="#64748B" />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {req.address.split(',')[0]}
                    </Text>
                  </View>
                </View>

                {/* Button inside card */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.detailBtn}
                    onPress={() => setSelectedRequest(req)}
                  >
                    <Text style={styles.detailBtnText}>View Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.acceptBtn,
                      isAccepted && styles.acceptBtnDisabled,
                    ]}
                    onPress={() => handleAccept(req)}
                  >
                    <Text style={styles.acceptBtnText}>
                      {isAccepted ? 'Accepted' : 'Accept Request'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={selectedRequest !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedRequest(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedRequest && (
              <>
                <View style={styles.modalHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>{selectedRequest.type}</Text>
                    <Text style={styles.modalSubtitle}>
                      Requester: {selectedRequest.elderName}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedRequest(null)}
                    style={styles.closeBtn}
                  >
                    <Ionicons name="close" size={24} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalMetaRow}>
                  <Text style={styles.modalMetaTag}>📍 {selectedRequest.distance}</Text>
                  <Text style={styles.modalMetaTag}>⏱️ {selectedRequest.duration}</Text>
                  <Text style={styles.modalMetaTag}>🏷️ {selectedRequest.badge}</Text>
                </View>

                <Text style={styles.modalSectionTitle}>Address & Contact</Text>
                <Text style={styles.modalSectionBody}>{selectedRequest.address}</Text>
                <Text style={styles.modalSectionBody}>📞 {selectedRequest.phone}</Text>

                <Text style={styles.modalSectionTitle}>Items / Task Checklist</Text>
                {selectedRequest.items.map((it, idx) => (
                  <Text key={idx} style={styles.checkItem}>
                    • {it}
                  </Text>
                ))}

                {selectedRequest.notes && (
                  <>
                    <Text style={styles.modalSectionTitle}>Notes</Text>
                    <Text style={styles.notesBox}>{selectedRequest.notes}</Text>
                  </>
                )}

                <View style={styles.modalFooterActions}>
                  <TouchableOpacity
                    style={styles.cancelActionBtn}
                    onPress={() => setSelectedRequest(null)}
                  >
                    <Text style={styles.cancelActionBtnText}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmAcceptBtn,
                      acceptedList.includes(selectedRequest.id) &&
                        styles.confirmAcceptBtnDisabled,
                    ]}
                    onPress={() => handleAccept(selectedRequest)}
                  >
                    <Text style={styles.confirmAcceptBtnText}>
                      {acceptedList.includes(selectedRequest.id)
                        ? '✓ Already Accepted'
                        : '🤝 Accept This Task'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  filterWrapper: {
    marginVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterChipActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
  },
  requestCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  requestCardAccepted: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  reqAvatarEmoji: {
    fontSize: 20,
  },
  reqInfo: {
    flex: 1,
  },
  reqTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  reqElderName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
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
  scheduledBadge: {
    backgroundColor: '#E0E7FF',
  },
  scheduledBadgeText: {
    color: '#4F46E5',
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
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  metaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  detailBtn: {
    flex: 1,
    height: 40,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  acceptBtn: {
    flex: 1.3,
    height: 40,
    backgroundColor: '#1E40AF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtnDisabled: {
    backgroundColor: '#16A34A',
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  closeBtn: {
    padding: 6,
  },
  modalMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modalMetaTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    marginTop: 12,
    marginBottom: 4,
  },
  modalSectionBody: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
  },
  checkItem: {
    fontSize: 13,
    color: '#334155',
    marginVertical: 2,
  },
  notesBox: {
    fontSize: 12,
    color: '#854D0E',
    backgroundColor: '#FEF9C3',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 14,
  },
  modalFooterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelActionBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelActionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  confirmAcceptBtn: {
    flex: 2,
    height: 48,
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmAcceptBtnDisabled: {
    backgroundColor: '#16A34A',
  },
  confirmAcceptBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
