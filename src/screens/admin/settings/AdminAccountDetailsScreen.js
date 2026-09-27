// src/screens/admin/settings/AdminAccountDetailsScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';

export default function AdminAccountDetailsScreen({ onBack }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const topPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  );

  const formatDate = (dateVal) => {
    if (!dateVal) return 'Not specified';
    try {
      return new Date(dateVal).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(dateVal);
    }
  };

  const address = user?.address;
  const formattedAddress = address
    ? [address.streetAddress, address.city, address.district, address.province, address.postalCode]
        .filter(Boolean)
        .join(', ')
    : 'Not provided';

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { paddingTop: topPadding + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back to Settings"
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Account Details</Text>
            <Text style={styles.headerSubtitle}>Full Identity & Credentials (Read-Only)</Text>
          </View>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Security & Notice Banner */}
        <View style={styles.noticeBanner}>
          <Ionicons name="shield-checkmark" size={22} color="#1E40AF" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.noticeTitle}>Administrative Credential Record</Text>
            <Text style={styles.noticeText}>
              This screen provides a verified, read-only view of all attributes assigned to this system account.
            </Text>
          </View>
        </View>

        {/* Primary Identification Section */}
        <Text style={styles.sectionHeader}>System Identity</Text>
        <View style={styles.card}>
          <AttributeRow
            icon="finger-print-outline"
            label="User Custom ID"
            value={user?.customId || user?._id?.substring(0, 8)?.toUpperCase() || 'ADM-0001'}
            isHighlight
          />
          <Divider />
          <AttributeRow
            icon="key-outline"
            label="Database ObjectId"
            value={user?._id || 'N/A'}
            subtle
          />
          <Divider />
          <AttributeRow
            icon="person-outline"
            label="Legal Full Name"
            value={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Admin User'}
          />
          <Divider />
          <AttributeRow
            icon="shield-outline"
            label="System Role"
            value={(user?.role || 'admin').toUpperCase()}
            isHighlight
          />
          <Divider />
          <AttributeRow
            icon="lock-closed-outline"
            label="Security Clearance"
            value="Super Administrator (Full System Control)"
          />
        </View>

        {/* Contact & Verification Section */}
        <Text style={styles.sectionHeader}>Contact & Verification</Text>
        <View style={styles.card}>
          <AttributeRow
            icon="mail-outline"
            label="Email Address"
            value={user?.email || 'admin@togethercare.org'}
          />
          <Divider />
          <AttributeRow
            icon="checkmark-circle-outline"
            label="Email Verification"
            value={user?.isEmailVerified ? 'Verified & Active' : 'Active Account'}
            badgeColor={user?.isEmailVerified ? '#16A34A' : '#2563EB'}
          />
          <Divider />
          <AttributeRow
            icon="call-outline"
            label="Phone Number"
            value={user?.phone || 'Not provided'}
          />
          <Divider />
          <AttributeRow
            icon="radio-button-on-outline"
            label="Account Status"
            value={(user?.accountStatus || 'active').toUpperCase()}
            badgeColor="#16A34A"
          />
        </View>

        {/* Personal & Demographic Section */}
        <Text style={styles.sectionHeader}>Personal Information</Text>
        <View style={styles.card}>
          <AttributeRow
            icon="calendar-outline"
            label="Date of Birth"
            value={formatDate(user?.dateOfBirth)}
          />
          <Divider />
          <AttributeRow
            icon="hourglass-outline"
            label="Calculated Age"
            value={user?.age ? `${user.age} years old` : 'Not specified'}
          />
          <Divider />
          <AttributeRow
            icon="male-female-outline"
            label="Gender"
            value={user?.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not specified'}
          />
        </View>

        {/* Physical Address Section */}
        <Text style={styles.sectionHeader}>Registered Address</Text>
        <View style={styles.card}>
          <AttributeRow
            icon="location-outline"
            label="Full Address"
            value={formattedAddress}
          />
          <Divider />
          <AttributeRow
            icon="business-outline"
            label="City"
            value={address?.city || 'Colombo'}
          />
          <Divider />
          <AttributeRow
            icon="map-outline"
            label="District & Province"
            value={`${address?.district || 'Colombo'}, ${address?.province || 'Western'}`}
          />
          <Divider />
          <AttributeRow
            icon="mail-unread-outline"
            label="Postal Code"
            value={address?.postalCode || '00100'}
          />
        </View>

        {/* Timestamps & Audit Section */}
        <Text style={styles.sectionHeader}>Account Audit Logs</Text>
        <View style={styles.card}>
          <AttributeRow
            icon="time-outline"
            label="Account Created"
            value={formatDate(user?.createdAt)}
          />
          <Divider />
          <AttributeRow
            icon="sync-outline"
            label="Last Profile Update"
            value={formatDate(user?.updatedAt)}
          />
        </View>

        {/* Back to Hub Button */}
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={onBack}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Back to Settings Hub"
        >
          <Text style={styles.doneBtnText}>Return to Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function AttributeRow({ icon, label, value, isHighlight, subtle, badgeColor }) {
  return (
    <View style={styles.attributeRow}>
      <View style={styles.attrIconCircle}>
        <Ionicons name={icon} size={18} color="#1E40AF" />
      </View>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={styles.attributeLabel}>{label}</Text>
        <Text
          style={[
            styles.attributeValue,
            isHighlight && styles.valueHighlight,
            subtle && styles.valueSubtle,
          ]}
          selectable
        >
          {value}
        </Text>
      </View>
      {badgeColor && (
        <View style={[styles.inlineBadge, { backgroundColor: `${badgeColor}18` }]}>
          <Text style={[styles.inlineBadgeText, { color: badgeColor }]}>{value}</Text>
        </View>
      )}
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    backgroundColor: '#1E3A8A',
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#DBEAFE',
    marginTop: 1,
  },
  adminBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadgeText: {
    color: '#1E40AF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 14,
    marginBottom: 16,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  noticeText: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 2,
    lineHeight: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 6,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  attributeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  attrIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attributeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  attributeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  valueHighlight: {
    color: '#1E40AF',
    fontWeight: '800',
  },
  valueSubtle: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  inlineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  inlineBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 6,
  },
  doneBtn: {
    backgroundColor: '#1E40AF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
