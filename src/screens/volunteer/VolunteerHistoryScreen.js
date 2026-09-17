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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as volunteerService from '../../services/volunteerService';

export default function VolunteerHistoryScreen() {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    totalCompletedVisits: 0,
    totalHours: '0.0',
    averageRating: 5.0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistoryAndStats = useCallback(async () => {
    try {
      const [histRes, statsRes] = await Promise.allSettled([
        volunteerService.getMyHistory(),
        volunteerService.getMyStats(),
      ]);

      if (histRes.status === 'fulfilled' && histRes.value?.success) {
        setHistory(histRes.value.data || []);
      }
      if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
        setStats(statsRes.value.data || { totalCompletedVisits: 0, totalHours: '0.0', averageRating: 5.0 });
      }
    } catch (error) {
      console.error('Fetch history error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistoryAndStats();
  }, [fetchHistoryAndStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistoryAndStats();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Volunteer Impact & History</Text>
        <Text style={styles.headerSub}>View completed support trips, total hours, and community feedback</Text>
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
            <Text style={styles.metricVal}>{stats.totalCompletedVisits}</Text>
            <Text style={styles.metricLbl}>Completed Visits</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>{stats.totalHours}</Text>
            <Text style={styles.metricLbl}>Total Hours</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>{stats.averageRating} ⭐</Text>
            <Text style={styles.metricLbl}>Rating</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Completed Service Logs ({history.length})</Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#1E40AF" />
            <Text style={styles.loadingText}>Loading your completed service history...</Text>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="ribbon-outline" size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Completed Visits Yet</Text>
            <Text style={styles.emptySub}>
              Once you complete your scheduled volunteer visits, your impact records and feedback reviews will show up here.
            </Text>
          </View>
        ) : (
          history.map((log) => {
            const logKey = log._id || log.id;
            return (
              <View key={logKey} style={styles.historyCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.serviceName}>{log.service}</Text>
                  <Text style={styles.dateText}>{log.date}</Text>
                </View>
                <Text style={styles.elderText}>For: {log.elderName}</Text>

                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= (log.rating || 5) ? 'star' : 'star-outline'}
                      size={14}
                      color="#F59E0B"
                    />
                  ))}
                  <Text style={styles.ratingNumber}>{(log.rating || 5).toFixed(1)}</Text>
                </View>

                {log.feedback ? (
                  <Text style={styles.feedbackText}>"{log.feedback}"</Text>
                ) : null}
              </View>
            );
          })
        )}
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
    paddingBottom: 30,
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
    elevation: 1,
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
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
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
});
