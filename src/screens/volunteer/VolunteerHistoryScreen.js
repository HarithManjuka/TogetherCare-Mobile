// src/screens/volunteer/VolunteerHistoryScreen.js
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

export default function VolunteerHistoryScreen() {
  const historyLog = [
    {
      id: 'hist-1',
      date: '2026-08-20',
      elderName: 'Mrs. Jayasinghe',
      service: 'Pharmacy Delivery',
      rating: 5,
      feedback: 'Very punctual and polite! Thank you for the quick help.',
    },
    {
      id: 'hist-2',
      date: '2026-08-14',
      elderName: 'Mr. De Silva',
      service: 'Grocery Run',
      rating: 5,
      feedback: 'Carefully checked all expiry dates. Highly recommended!',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Volunteer Impact & History</Text>
        <Text style={styles.headerSub}>View completed support trips, total hours, and community feedback</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>
        {/* Metrics Banner */}
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>14</Text>
            <Text style={styles.metricLbl}>Completed Visits</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>18.5</Text>
            <Text style={styles.metricLbl}>Total Hours</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>5.0 ⭐</Text>
            <Text style={styles.metricLbl}>Rating</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Completed Service Logs</Text>
        {historyLog.map((log) => (
          <View key={log.id} style={styles.historyCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.serviceName}>{log.service}</Text>
              <Text style={styles.dateText}>{log.date}</Text>
            </View>
            <Text style={styles.elderText}>For: {log.elderName}</Text>

            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= log.rating ? 'star' : 'star-outline'}
                  size={14}
                  color="#F59E0B"
                />
              ))}
            </View>

            {log.feedback ? (
              <Text style={styles.feedbackText}>"{log.feedback}"</Text>
            ) : null}
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
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  ratingRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 6,
  },
  feedbackText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#475569',
  },
});
