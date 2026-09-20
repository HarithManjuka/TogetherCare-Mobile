// src/components/common/NotificationsModal.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import * as notificationService from '../../services/notificationService';

export default function NotificationsModal({ visible, onClose, onNotificationAction }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications();
      if (res?.success) {
        setNotifications(res.data || []);
      }
    } catch (err) {
      console.error('Fetch Notifications Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchNotifications();
    }
  }, [visible]);

  const handleMarkAllRead = async () => {
    try {
      setActionLoading(true);
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Mark All Read Error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleItemPress = async (item) => {
    if (!item.isRead) {
      notificationService.markAsRead(item._id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
      );
    }
    if (onNotificationAction) {
      onNotificationAction(item);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'sos_alert':
        return { name: 'warning', color: '#DC2626', bg: '#FEE2E2' };
      case 'volunteer_matched':
      case 'visit_approved':
        return { name: 'checkmark-circle', color: '#16A34A', bg: '#DCFCE7' };
      case 'message':
        return { name: 'chatbubbles', color: '#2563EB', bg: '#DBEAFE' };
      case 'visit_completed':
        return { name: 'ribbon', color: '#D97706', bg: '#FEF3C7' };
      default:
        return { name: 'notifications', color: COLORS.secondary, bg: '#F0FDFA' };
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="notifications" size={22} color={COLORS.primary} />
              <Text style={styles.title}>Notifications</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Subheader with Mark All Read */}
          {notifications.some((n) => !n.isRead) && (
            <View style={styles.markAllRow}>
              <TouchableOpacity onPress={handleMarkAllRead} disabled={actionLoading}>
                <Text style={styles.markAllText}>
                  {actionLoading ? 'Marking...' : 'Mark all as read'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Body */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.secondary} />
              <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="notifications-off-outline" size={44} color="#94A3B8" />
              <Text style={styles.emptyText}>No notifications right now.</Text>
              <Text style={styles.emptySubtext}>You will receive alerts here for visits, SOS, and messages.</Text>
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {notifications.map((item) => {
                const iconInfo = getNotificationIcon(item.type);
                return (
                  <TouchableOpacity
                    key={item._id}
                    style={[styles.notifItem, !item.isRead && styles.unreadItem]}
                    onPress={() => handleItemPress(item)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: iconInfo.bg }]}>
                      <Ionicons name={iconInfo.name} size={20} color={iconInfo.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.notifTopRow}>
                        <Text style={[styles.notifTitle, !item.isRead && styles.unreadTitle]}>
                          {item.title}
                        </Text>
                        <Text style={styles.notifTime}>{formatTime(item.createdAt)}</Text>
                      </View>
                      <Text style={styles.notifMessage} numberOfLines={3}>
                        {item.message}
                      </Text>
                      {item.senior && (
                        <Text style={styles.notifSeniorTag}>
                          Senior: {item.senior.firstName} {item.senior.lastName || ''}
                        </Text>
                      )}
                    </View>
                    {!item.isRead && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: 380,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  closeBtn: {
    padding: 4,
  },
  markAllRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 8,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748B',
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  list: {
    marginTop: 6,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#FFFFFF',
  },
  unreadItem: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  notifTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: 'bold',
    color: '#0F172A',
  },
  notifTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 8,
  },
  notifMessage: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  notifSeniorTag: {
    fontSize: 11,
    color: COLORS.secondary,
    fontWeight: '600',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
    marginTop: 6,
  },
});
