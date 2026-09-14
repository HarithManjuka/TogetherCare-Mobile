// src/screens/volunteer/VolunteerScheduleScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function VolunteerScheduleScreen() {
  const scheduledVisits = [
    {
      id: 'sch-1',
      date: 'Today, 2:00 PM',
      elderName: 'Mrs. Perera',
      serviceType: 'Grocery Pickup & Delivery',
      location: 'No. 42, Galle Road, Colombo 03',
      status: 'Confirmed',
    },
    {
      id: 'sch-2',
      date: 'Tomorrow, 10:30 AM',
      elderName: 'Mr. Silva',
      serviceType: 'Pharmacy Pickup',
      location: 'No. 18, Flower Road, Colombo 07',
      status: 'Scheduled',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>My Volunteer Schedule</Text>
        <Text style={styles.headerSub}>Manage your upcoming confirmed support visits and time slots</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>
        {scheduledVisits.map((visit) => (
          <View key={visit.id} style={styles.visitCard}>
            <View style={styles.visitHeader}>
              <Ionicons name="calendar-outline" size={18} color="#1E40AF" style={{ marginRight: 6 }} />
              <Text style={styles.visitDate}>{visit.date}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{visit.status}</Text>
              </View>
            </View>

            <Text style={styles.serviceTitle}>{visit.serviceType}</Text>
            <Text style={styles.elderName}>Elderly Dependent: {visit.elderName}</Text>
            <Text style={styles.locationText}>📍 {visit.location}</Text>
          </View>
        ))}
      </ScrollView>
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
  visitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  visitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  visitDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  elderName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
  },
});
