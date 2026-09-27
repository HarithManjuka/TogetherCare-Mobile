// src/screens/admin/AdminSafetyScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AdminSafetyScreen() {
  return (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollPadding}>
      <View style={styles.alertHeaderCard}>
        <Ionicons name="shield-checkmark-outline" size={28} color="#16A34A" />
        <Text style={styles.alertTitle}>System Security & Safety Log</Text>
        <Text style={styles.alertSub}>All system activities and safety channels are operating normally.</Text>
      </View>

      <View style={styles.logCard}>
        <Ionicons name="checkmark-circle" size={20} color="#16A34A" style={{ marginRight: 10 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.logTitle}>System Health Normal</Text>
          <Text style={styles.logSub}>No emergency SOS alerts logged in the last 24 hours.</Text>
        </View>
      </View>
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
  alertHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  alertSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  logTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  logSub: {
    fontSize: 12,
    color: '#15803D',
    marginTop: 2,
  },
});
