// src/screens/volunteer/VolunteerHistoryScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function VolunteerHistoryScreen() {
  const [activeRange, setActiveRange] = useState('This Month');

  const historyItems = [
    {
      id: 'hist-1',
      date: 'Aug 21, 2026',
      taskType: 'Grocery pickup & Delivery',
      elderName: 'Mrs. Perera',
      location: 'Colombo 03',
      hoursLogged: '1.5 hrs',
      rating: 5,
      feedback: 'Amasha was very kind, polite and bought all items carefully!',
    },
    {
      id: 'hist-2',
      date: 'Aug 19, 2026',
      taskType: 'Pharmacy Prescription Pickup',
      elderName: 'Mr. Fernando',
      location: 'Colombo 04',
      hoursLogged: '1.0 hr',
      rating: 5,
      feedback: 'Very quick and punctual. Helped me with medicine instructions.',
    },
    {
      id: 'hist-3',
      date: 'Aug 16, 2026',
      taskType: 'Afternoon Companionship & Walk',
      elderName: 'Mrs. Jayasinghe',
      location: 'Colombo 05',
      hoursLogged: '2.0 hrs',
      rating: 5,
      feedback: 'Wonderful conversation! We enjoyed walking around the garden.',
    },
    {
      id: 'hist-4',
      date: 'Aug 12, 2026',
      taskType: 'Doctor Appointment Escort',
      elderName: 'Mr. De Silva',
      location: 'Colombo 07',
      hoursLogged: '3.0 hrs',
      rating: 4.8,
      feedback: 'Patient and attentive throughout the entire clinic queue.',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Volunteer History</Text>
        <Text style={styles.headerSubtitle}>
          Past contributions, hours logged & community feedback
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Summary Card */}
        <View style={styles.statsSummaryCard}>
          <Text style={styles.statsCardTitle}>Your Total Impact</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>12.0</Text>
              <Text style={styles.statBoxLabel}>Hours Logged</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>34</Text>
              <Text style={styles.statBoxLabel}>Elders Helped</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>4.9 ★</Text>
              <Text style={styles.statBoxLabel}>Avg Rating</Text>
            </View>
          </View>
        </View>

        {/* Badges Earned Section */}
        <View style={styles.badgesSection}>
          <Text style={styles.sectionHeading}>Badges & Certifications</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgesScroll}
          >
            <View style={styles.badgeItem}>
              <Text style={styles.badgeIcon}>🎖️</Text>
              <Text style={styles.badgeName}>Top Volunteer</Text>
              <Text style={styles.badgeSub}>Colombo 03</Text>
            </View>
            <View style={styles.badgeItem}>
              <Text style={styles.badgeIcon}>⚡</Text>
              <Text style={styles.badgeName}>Fast Responder</Text>
              <Text style={styles.badgeSub}>&lt; 15 min avg</Text>
            </View>
            <View style={styles.badgeItem}>
              <Text style={styles.badgeIcon}>🌟</Text>
              <Text style={styles.badgeName}>5-Star Care</Text>
              <Text style={styles.badgeSub}>10+ Reviews</Text>
            </View>
            <View style={styles.badgeItem}>
              <Text style={styles.badgeIcon}>🤝</Text>
              <Text style={styles.badgeName}>Verified Aid</Text>
              <Text style={styles.badgeSub}>NIC Verified</Text>
            </View>
          </ScrollView>
        </View>

        {/* Activity Log Section */}
        <View style={styles.logSection}>
          <View style={styles.logHeaderRow}>
            <Text style={styles.sectionHeading}>Activity Log</Text>
            <View style={styles.rangeRow}>
              {['This Month', 'All Time'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.rangeChip,
                    activeRange === r && styles.rangeChipActive,
                  ]}
                  onPress={() => setActiveRange(r)}
                >
                  <Text
                    style={[
                      styles.rangeChipText,
                      activeRange === r && styles.rangeChipTextActive,
                    ]}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* List of past activities */}
          {historyItems.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.historyCardHeader}>
                <View>
                  <Text style={styles.historyTaskTitle}>{item.taskType}</Text>
                  <Text style={styles.historyElder}>
                    For {item.elderName} · {item.location}
                  </Text>
                </View>
                <View style={styles.hoursBadge}>
                  <Text style={styles.hoursBadgeText}>{item.hoursLogged}</Text>
                </View>
              </View>

              <View style={styles.historyDateRatingRow}>
                <Text style={styles.historyDate}>🗓️ {item.date}</Text>
                <View style={styles.starRow}>
                  <Text style={styles.ratingText}>⭐ {item.rating}.0</Text>
                </View>
              </View>

              {item.feedback ? (
                <View style={styles.feedbackBox}>
                  <Text style={styles.feedbackQuote}>"{item.feedback}"</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>
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
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 8,
  },
  statsSummaryCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  statsCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statBoxValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  statBoxLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  badgesSection: {
    marginBottom: 22,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  badgesScroll: {
    gap: 12,
  },
  badgeItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 110,
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  badgeSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  logSection: {
    marginBottom: 10,
  },
  logHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  rangeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  rangeChipActive: {
    backgroundColor: '#1E40AF',
  },
  rangeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  rangeChipTextActive: {
    color: '#FFFFFF',
  },
  historyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  historyTaskTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  historyElder: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginTop: 2,
  },
  hoursBadge: {
    backgroundColor: '#ECFCCB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  hoursBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4D7C0F',
  },
  historyDateRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  feedbackBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0D9488',
  },
  feedbackQuote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#334155',
    lineHeight: 18,
  },
});
