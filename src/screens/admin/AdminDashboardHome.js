// src/screens/admin/AdminDashboardHome.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AdminDashboardHome({
  user,
  totalUsers = 0,
  elderlyCount = 0,
  volunteerCount = 0,
  caregiverCount = 0,
  refreshing = false,
  onRefresh,
  onNavigateTab,
}) {
  return (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={styles.scrollPadding}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome Banner */}
      <View style={styles.welcomeBanner}>
        <Text style={styles.welcomeTitle}>Admin Command Center</Text>
        <Text style={styles.welcomeSub}>
          Welcome back, {user?.firstName || 'Admin'}! Monitor user registrations, active volunteers, and safety alerts.
        </Text>
      </View>

      {/* Metrics Overview Grid */}
      <Text style={styles.sectionHeader}>System Metrics</Text>
      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
          <Ionicons name="people" size={24} color="#1E40AF" />
          <Text style={styles.metricValue}>{totalUsers}</Text>
          <Text style={styles.metricLabel}>Total Users</Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
          <Ionicons name="hand-left" size={24} color="#16A34A" />
          <Text style={styles.metricValue}>{volunteerCount}</Text>
          <Text style={styles.metricLabel}>Volunteers</Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
          <Ionicons name="accessibility" size={24} color="#D97706" />
          <Text style={styles.metricValue}>{elderlyCount}</Text>
          <Text style={styles.metricLabel}>Elderly Profiles</Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: '#F3E8FF', borderColor: '#E9D5FF' }]}>
          <Ionicons name="medkit" size={24} color="#9333EA" />
          <Text style={styles.metricValue}>{caregiverCount}</Text>
          <Text style={styles.metricLabel}>Caregivers</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionHeader}>Quick Management</Text>
      <TouchableOpacity style={styles.actionCard} onPress={() => onNavigateTab('users')} activeOpacity={0.8}>
        <Ionicons name="person-add-outline" size={22} color="#1E40AF" style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.actionCardTitle}>Manage User Accounts</Text>
          <Text style={styles.actionCardSub}>Review, search, and verify registered users</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionCard} onPress={() => onNavigateTab('alerts')} activeOpacity={0.8}>
        <Ionicons name="alert-circle-outline" size={22} color="#DC2626" style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.actionCardTitle}>Safety & SOS Alerts Log</Text>
          <Text style={styles.actionCardSub}>View real-time safety monitoring logs</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </TouchableOpacity>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
  },
  scrollPadding: {
    padding: 16,
  },
  welcomeBanner: {
    backgroundColor: '#1E40AF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 13,
    color: '#DBEAFE',
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    marginTop: 6,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionCardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
