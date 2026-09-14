// src/screens/volunteer/VolunteerRequestsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import OfferHelpModal from '../../components/volunteer/OfferHelpModal';

export default function VolunteerRequestsScreen({ onNavigateTab }) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [offerModalVisible, setOfferModalVisible] = useState(false);

  const availableRequests = [
    {
      id: 'req-101',
      type: 'Grocery Pickup & Delivery',
      elderName: 'Mrs. Perera',
      distance: '1.2 km',
      duration: '45 min',
      badge: 'Urgent',
      address: 'No. 42, Galle Road, Colombo 03',
      items: ['Fresh Milk (2L)', 'Bread', 'Eggs (12 Pack)', 'Bananas (1kg)'],
    },
    {
      id: 'req-102',
      type: 'Pharmacy & Medicine',
      elderName: 'Mr. Silva',
      distance: '2.5 km',
      duration: '30 min',
      badge: 'Today',
      address: 'No. 18, Flower Road, Colombo 07',
      items: ['Blood Pressure Medication', 'Vitamin C'],
    },
    {
      id: 'req-103',
      type: 'Companionship & Walk',
      elderName: 'Mrs. Fernando',
      distance: '3.1 km',
      duration: '60 min',
      badge: 'Scheduled',
      address: 'No. 5, Havelock Road, Colombo 05',
      items: ['Afternoon park walk', 'Friendly chat'],
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Available Help Requests</Text>
        <Text style={styles.headerSub}>Browse nearby requests from elderly residents needing assistance</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>
        {availableRequests.map((req) => (
          <View key={req.id} style={styles.requestCard}>
            <View style={styles.cardHeader}>
              <View style={styles.badgeTag}>
                <Text style={styles.badgeText}>{req.badge}</Text>
              </View>
              <Text style={styles.distanceText}>📍 {req.distance} away</Text>
            </View>

            <Text style={styles.serviceTitle}>{req.type}</Text>
            <Text style={styles.elderName}>For: {req.elderName}</Text>
            <Text style={styles.addressText}>Location: {req.address}</Text>

            <View style={styles.itemsBox}>
              <Text style={styles.itemsHeader}>Requested items / activities:</Text>
              {req.items.map((item, idx) => (
                <Text key={idx} style={styles.itemBullet}>• {item}</Text>
              ))}
            </View>

            <TouchableOpacity
              style={styles.offerBtn}
              activeOpacity={0.8}
              onPress={() => {
                setSelectedRequest(req);
                setOfferModalVisible(true);
              }}
            >
              <Ionicons name="hand-left-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.offerBtnText}>Offer Assistance</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {offerModalVisible && selectedRequest && (
        <OfferHelpModal
          visible={offerModalVisible}
          request={selectedRequest}
          onClose={() => setOfferModalVisible(false)}
          onSuccess={() => {
            setOfferModalVisible(false);
            if (onNavigateTab) onNavigateTab('schedule');
          }}
        />
      )}
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
  container: {
    flex: 1,
  },
  scrollPadding: {
    padding: 16,
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
  badgeTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
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
  addressText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
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
  offerBtn: {
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
    fontSize: 14,
  },
});
