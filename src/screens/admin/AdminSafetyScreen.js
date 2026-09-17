// src/screens/admin/AdminSafetyScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as emergencyService from '../../services/emergencyService';

export default function AdminSafetyScreen() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = async () => {
    try {
      const res = await emergencyService.getEmergencyHistory();
      if (res?.data) {
        setAlerts(res.data);
      }
    } catch (err) {
      console.error('Fetch Emergency History Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  const activeAlerts = alerts.filter((a) => a.status === 'active');

  return (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={styles.scrollPadding}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16A34A']} />
      }
    >
      <View style={styles.alertHeaderCard}>
        <Ionicons
          name={activeAlerts.length > 0 ? 'alert-circle' : 'shield-checkmark-outline'}
          size={28}
          color={activeAlerts.length > 0 ? '#DC2626' : '#16A34A'}
        />
        <Text style={styles.alertTitle}>System Security & Safety Log</Text>
        <Text style={styles.alertSub}>
          {activeAlerts.length > 0
            ? `⚠️ ${activeAlerts.length} Active Emergency SOS Alert(s) Detected!`
            : 'All system activities and safety channels are operating normally.'}
        </Text>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="small" color="#16A34A" style={{ marginVertical: 20 }} />
      ) : alerts.length === 0 ? (
        <View style={styles.logCard}>
          <Ionicons name="checkmark-circle" size={20} color="#16A34A" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.logTitle}>System Health Normal</Text>
            <Text style={styles.logSub}>No emergency SOS alerts logged.</Text>
          </View>
        </View>
      ) : (
        <View style={styles.alertList}>
          <Text style={styles.listSectionTitle}>Recent Emergency SOS Incidents</Text>
          {alerts.map((alert) => {
            const isActive = alert.status === 'active';
            const userFullName = alert.user
              ? `${alert.user.firstName} ${alert.user.lastName || ''}`.trim()
              : 'Senior User';
            const timeStr = alert.triggeredAt
              ? new Date(alert.triggeredAt).toLocaleString()
              : 'Recent';

            return (
              <View
                key={alert._id}
                style={[styles.alertItemCard, isActive && styles.alertItemCardActive]}
              >
                <View style={styles.alertItemHeader}>
                  <View style={styles.alertBadgeGroup}>
                    <Ionicons
                      name={isActive ? 'radio' : 'checkmark-done-circle'}
                      size={16}
                      color={isActive ? '#DC2626' : '#16A34A'}
                    />
                    <Text
                      style={[styles.alertStatusText, { color: isActive ? '#DC2626' : '#16A34A' }]}
                    >
                      {isActive ? 'ACTIVE EMERGENCY' : 'RESOLVED'}
                    </Text>
                  </View>
                  <Text style={styles.alertTimeText}>{timeStr}</Text>
                </View>

                <Text style={styles.alertUserName}>{userFullName}</Text>
                {alert.location ? (
                  <Text style={styles.alertLocationText}>📍 {alert.location}</Text>
                ) : null}
                {alert.emergencyContact?.phone ? (
                  <Text style={styles.alertContactText}>
                    📞 Contact: {alert.emergencyContact.name} ({alert.emergencyContact.phone})
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
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
  alertList: {
    gap: 10,
  },
  listSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
  },
  alertItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  alertItemCardActive: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FCA5A5',
    borderWidth: 1.5,
  },
  alertItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  alertBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertStatusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  alertTimeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  alertUserName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  alertLocationText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 3,
  },
  alertContactText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
