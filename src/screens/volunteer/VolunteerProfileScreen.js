// src/screens/volunteer/VolunteerProfileScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/theme';

export default function VolunteerProfileScreen() {
  const { user, logout } = useAuth();

  const [isAvailable, setIsAvailable] = useState(true);
  const [receiveEmergencyAlerts, setReceiveEmergencyAlerts] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`
    : 'Sarah Perera';

  const userEmail = user?.email || 'sarah.volunteer@togethercare.lk';
  const userPhone = user?.phone || '077 123 4567';
  const userAddress = user?.address?.streetAddress || 'No. 45, Duplication Road';
  const userCity = user?.address?.city || 'Colombo 03';
  const userDistrict = user?.address?.district || 'Colombo';
  const userProvince = user?.address?.province || 'Western';
  const idType = user?.volunteerIdType || 'National Identity Card (NIC)';
  const idNumber = user?.volunteerIdNumber || '200012345678';
  const institution = user?.educationalInstitution || 'University of Colombo';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of TogetherCare?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <Text style={styles.headerSubtitle}>Volunteer Account & Preferences</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card Header */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarEmoji}>🤝</Text>
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{userEmail}</Text>

          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
            <Text style={styles.verifiedBadgeText}>Verified Community Volunteer</Text>
          </View>
        </View>

        {/* Status Switch */}
        <View style={styles.sectionCard}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Availability Status</Text>
              <Text style={styles.switchSubtitle}>
                {isAvailable
                  ? 'Active · Ready to accept nearby tasks'
                  : 'Inactive · Not taking new tasks right now'}
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
              thumbColor={isAvailable ? '#16A34A' : '#F1F5F9'}
            />
          </View>
        </View>

        {/* Personal Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>Personal Information</Text>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color="#1E40AF" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Mobile Phone</Text>
              <Text style={styles.infoValue}>{userPhone}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="card-outline" size={18} color="#1E40AF" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>{idType}</Text>
              <Text style={styles.infoValue}>{idNumber}</Text>
            </View>
          </View>

          {institution ? (
            <View style={styles.infoRow}>
              <Ionicons name="school-outline" size={18} color="#1E40AF" style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>Educational Institution</Text>
                <Text style={styles.infoValue}>{institution}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color="#1E40AF" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Service Area / Address</Text>
              <Text style={styles.infoValue}>
                {userAddress}, {userCity}, {userDistrict} ({userProvince} Province)
              </Text>
            </View>
          </View>
        </View>

        {/* Notification Preferences */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>Alert & Notification Settings</Text>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Emergency SOS Push Alerts</Text>
              <Text style={styles.switchSubtitle}>
                Get high-priority alerts when seniors in your area press SOS
              </Text>
            </View>
            <Switch
              value={receiveEmergencyAlerts}
              onValueChange={setReceiveEmergencyAlerts}
              trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
              thumbColor={receiveEmergencyAlerts ? '#1E40AF' : '#F1F5F9'}
            />
          </View>

          <View style={[styles.switchRow, { marginTop: 14 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Task Reminder Sounds</Text>
              <Text style={styles.switchSubtitle}>
                Play audio chime 15 minutes before scheduled visits
              </Text>
            </View>
            <Switch
              value={soundAlerts}
              onValueChange={setSoundAlerts}
              trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
              thumbColor={soundAlerts ? '#1E40AF' : '#F1F5F9'}
            />
          </View>
        </View>

        {/* Help & Support */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              Alert.alert('Volunteer Guidelines', 'TogetherCare volunteer handbook and safety guidelines.')
            }
          >
            <Ionicons name="book-outline" size={20} color="#334155" />
            <Text style={styles.menuItemText}>Volunteer Safety Guidelines</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              Alert.alert('Helpline Support', 'Contact TogetherCare Support:\n📞 +94 11 234 5678\n✉️ support@togethercare.lk')
            }
          >
            <Ionicons name="help-buoy-outline" size={20} color="#334155" />
            <Text style={styles.menuItemText}>Community Support Helpline</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutButtonText}>Sign Out from TogetherCare</Text>
        </TouchableOpacity>
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
  profileHeaderCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#C7D2FE',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  profileName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  sectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  switchSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    paddingRight: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    height: 52,
    borderRadius: 14,
    marginTop: 10,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626',
  },
});
