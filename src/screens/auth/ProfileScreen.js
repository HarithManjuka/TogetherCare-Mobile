// src/screens/auth/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import LogoutModal from '../../components/common/LogoutModal';
import AvatarActionModal from '../../components/common/AvatarActionModal';

export default function ProfileScreen({ onNavigateVerifyEmail }) {
  const { user, logout, uploadProfilePicture, deleteProfilePicture, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState(false);

  // Refresh latest database profile on mount
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Volunteer specific preferences state
  const [isAvailable, setIsAvailable] = useState(true);
  const [receiveEmergencyAlerts, setReceiveEmergencyAlerts] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);

  const hasProfilePic = !!(user?.profilePicture || user?.avatar);

  // Avatar Press Handler
  const handleAvatarPress = () => {
    if (hasProfilePic) {
      setShowAvatarModal(true);
    } else {
      handlePickAvatar();
    }
  };

  // Remove Photo Handler
  const handleRemoveAvatar = async () => {
    try {
      setUploading(true);
      await deleteProfilePicture();
      Alert.alert('Success', 'Profile picture removed successfully');
    } catch (err) {
      console.error('Remove avatar error:', err);
      Alert.alert('Error', err.message || 'Could not remove profile picture');
    } finally {
      setUploading(false);
    }
  };
  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access gallery is required to change profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploading(true);
        const imageAsset = result.assets[0];
        await uploadProfilePicture(imageAsset);
        Alert.alert('Success', 'Profile picture updated successfully');
      }
    } catch (err) {
      console.error('Avatar pick/upload error:', err);
      Alert.alert('Upload Failed', err.message || err.response?.data?.message || 'Could not upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const isVolunteer = user?.role === 'volunteer';
  const isEmailVerified = user?.isEmailVerified || user?.accountStatus === 'active';
  const volunteerBadgeStatus = user?.verificationBadgeStatus || 'unverified';

  const initials = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`.toUpperCase() || 'TC';

  // Check if today matches user's birth date (Month & Day)
  const isBirthdayToday = (dob) => {
    if (!dob) return false;
    const today = new Date();
    const birthDate = new Date(dob);
    return (
      today.getMonth() === birthDate.getMonth() &&
      today.getDate() === birthDate.getDate()
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* 0. Impressive & Professional Birthday Celebration Banner */}
      {isBirthdayToday(user?.dateOfBirth) && (
        <View style={styles.birthdayBannerContainer}>
          <View style={styles.birthdayHeaderRow}>
            <View style={styles.birthdayIconBox}>
              <Text style={{ fontSize: 26 }}>🎂</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.birthdayTitleBadgeRow}>
                <Text style={styles.birthdayBannerTitle}>
                  Happy Birthday, {user?.firstName}! 🎉
                </Text>
                <View style={styles.birthdayPill}>
                  <Text style={styles.birthdayPillText}>SPECIAL DAY ✨</Text>
                </View>
              </View>
              <Text style={styles.birthdayBannerSubtitle}>
                TogetherCare wishes you a wonderful birthday filled with warmth, happiness, and good health! Turning {user?.age || ''} years young today.
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 1. Profile Header Card */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity activeOpacity={0.85} onPress={handleAvatarPress} disabled={uploading}>
            {(user?.profilePicture || user?.avatar) ? (
              <Image source={{ uri: user.profilePicture || user.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cameraBadge, hasProfilePic && styles.editBadge]}
            activeOpacity={0.7}
            onPress={handleAvatarPress}
            disabled={uploading}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name={hasProfilePic ? "pencil" : "camera"} size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>

        {/* Custom 8-char Unique ID */}
        <View style={styles.customIdPill}>
          <Ionicons name="finger-print-outline" size={14} color="#1E40AF" style={{ marginRight: 4 }} />
          <Text style={styles.customIdText}>{user?.customId || 'USER-ID'}</Text>
        </View>
      </View>

      {/* 2. Verification Status Card */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>Account Verification</Text>

        {/* Email Verification Status Row */}
        <View style={styles.verificationRow}>
          <View style={styles.verificationIconWrap}>
            <Ionicons
              name={isEmailVerified ? 'mail-open' : 'mail-unread-outline'}
              size={20}
              color={isEmailVerified ? '#16A34A' : '#DC2626'}
            />
          </View>
          <View style={styles.verificationDetails}>
            <Text style={styles.verificationLabel}>Email Verification</Text>
            <Text style={styles.verificationSub}>
              {isEmailVerified ? 'Email address verified and secured' : 'Email address not verified yet'}
            </Text>
          </View>
          {isEmailVerified ? (
            <View style={[styles.statusBadge, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="checkmark-circle" size={13} color="#16A34A" />
              <Text style={[styles.statusBadgeText, { color: '#16A34A' }]}>Verified</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.statusBadge, { backgroundColor: '#FEE2E2' }]}
              onPress={() => onNavigateVerifyEmail && onNavigateVerifyEmail()}
            >
              <Text style={[styles.statusBadgeText, { color: '#DC2626' }]}>Verify Now</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Volunteer Identity Verification (Only for Volunteers) */}
        {isVolunteer && (
          <View style={[styles.verificationRow, { marginTop: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 14 }]}>
            <View style={styles.verificationIconWrap}>
              <Ionicons
                name="shield-checkmark"
                size={20}
                color={
                  volunteerBadgeStatus === 'verified'
                    ? '#16A34A'
                    : volunteerBadgeStatus === 'pending'
                    ? '#D97706'
                    : '#6B7280'
                }
              />
            </View>
            <View style={styles.verificationDetails}>
              <Text style={styles.verificationLabel}>Volunteer ID Verification</Text>
              <Text style={styles.verificationSub}>
                {volunteerBadgeStatus === 'verified'
                  ? 'Government / Student ID verified'
                  : volunteerBadgeStatus === 'pending'
                  ? 'Documents currently under Admin review'
                  : 'NIC / Passport / Student ID not verified'}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    volunteerBadgeStatus === 'verified'
                      ? '#DCFCE7'
                      : volunteerBadgeStatus === 'pending'
                      ? '#FEF3C7'
                      : '#F3F4F6',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  {
                    color:
                      volunteerBadgeStatus === 'verified'
                        ? '#16A34A'
                        : volunteerBadgeStatus === 'pending'
                        ? '#D97706'
                        : '#4B5563',
                  },
                ]}
              >
                {volunteerBadgeStatus.toUpperCase()}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* 3. Personal & Contact Information */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>Personal Information</Text>

        <InfoRow icon="call-outline" label="Phone Number" value={user?.phone || 'Not provided'} />
        <InfoRow
          icon="calendar-outline"
          label="Date of Birth"
          value={user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('en-GB') : 'Not provided'}
        />
        <InfoRow icon="time-outline" label="Age" value={user?.age ? `${user.age} years old` : 'Not provided'} />
        <InfoRow icon="briefcase-outline" label="Account Role" value={user?.role ? user.role.toUpperCase() : 'USER'} isLast />
      </View>

      {/* 4. Location & Address Details */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>Residential Location</Text>

        <InfoRow icon="location-outline" label="District" value={user?.address?.district || 'Not provided'} />
        <InfoRow icon="map-outline" label="Province" value={user?.address?.province || 'Not provided'} />
        <InfoRow icon="home-outline" label="Street Address" value={user?.address?.streetAddress || 'Not provided'} />
        <InfoRow
          icon="navigate-outline"
          label="City & Postal Code"
          value={
            user?.address?.city
              ? `${user.address.city} ${user.address.postalCode ? `(${user.address.postalCode})` : ''}`
              : 'Not provided'
          }
          isLast
        />
      </View>

      {/* 5. Role-Specific Information */}
      {/* Volunteer Availability Status Switch */}
      {isVolunteer && (
        <View style={styles.card}>
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
      )}

      {/* Volunteer Credentials */}
      {isVolunteer && (
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Volunteer Credentials</Text>
          <InfoRow icon="card-outline" label="ID Document Type" value={user?.volunteerIdType || 'NIC / Passport'} />
          <InfoRow icon="document-text-outline" label="ID Document Number" value={user?.volunteerIdNumber || 'Not submitted'} />
          <InfoRow icon="school-outline" label="Educational Institution" value={user?.educationalInstitution || 'Not provided'} isLast />
        </View>
      )}

      {/* Volunteer Alert & Notification Settings */}
      {isVolunteer && (
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Alert & Notification Settings</Text>

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

          <View style={[styles.switchRow, { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' }]}>
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
      )}

      {/* Volunteer Safety Guidelines & Community Support Helpline */}
      {isVolunteer && (
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Help & Support</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              Alert.alert('Volunteer Guidelines', 'TogetherCare volunteer handbook and safety guidelines.')
            }
          >
            <Ionicons name="book-outline" size={20} color="#1E40AF" />
            <Text style={styles.menuItemText}>Volunteer Safety Guidelines</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={() =>
              Alert.alert('Helpline Support', 'Contact TogetherCare Support:\n📞 +94 11 234 5678\n✉️ support@togethercare.lk')
            }
          >
            <Ionicons name="help-buoy-outline" size={20} color="#1E40AF" />
            <Text style={styles.menuItemText}>Community Support Helpline</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      )}

      {/* Elderly Details */}
      {user?.role === 'elderly' && (
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Emergency Contact Information</Text>
          <InfoRow icon="person-outline" label="Contact Name" value={user?.emergencyContact?.name || 'Not provided'} />
          <InfoRow icon="git-network-outline" label="Relationship" value={user?.emergencyContact?.relation || 'Not provided'} />
          <InfoRow icon="call-outline" label="Emergency Phone" value={user?.emergencyContact?.phone || 'Not provided'} isLast />
        </View>
      )}

      {/* Caregiver & Family Member Details */}
      {user?.role === 'caregiver' && (
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>
            {user?.caregiverType === 'family_member' ? 'Family Member Details' : 'Caregiver Details'}
          </Text>
          <InfoRow
            icon="people-outline"
            label="Account Category"
            value={user?.caregiverType === 'family_member' ? 'Family Relative / Caretaker' : 'Formal Caregiver'}
          />
          <InfoRow
            icon="heart-outline"
            label="Relationship to Elderly"
            value={
              user?.relationshipToElderly ||
              (user?.caregiverType === 'family_member' ? 'Family Caretaker' : 'Care Provider')
            }
            isLast={user?.caregiverType !== 'formal_caregiver'}
          />
          {user?.caregiverType === 'formal_caregiver' && (
            <InfoRow
              icon="business-outline"
              label="Organization / Agency"
              value={user?.organizationName || 'Independent'}
              isLast
            />
          )}
        </View>
      )}

      {/* Logout Action Button */}
      <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={() => setShowLogoutModal(true)}>
        <Ionicons name="log-out-outline" size={20} color="#DC2626" style={{ marginRight: 8 }} />
        <Text style={styles.logoutButtonText}>Log Out Account</Text>
      </TouchableOpacity>

      <Text style={styles.versionFooter}>TogetherCare v1.0.0 • Sri Lanka</Text>

      {/* Reusable Designable Logout Modal */}
      <LogoutModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        isLoggingOut={isLoggingOut}
      />

      {/* Cross-Platform Avatar Options Modal */}
      <AvatarActionModal
        visible={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onPickPhoto={handlePickAvatar}
        onRemovePhoto={handleRemoveAvatar}
      />
    </ScrollView>
  );
}

// Reusable Sub-Row Component
function InfoRow({ icon, label, value, isLast }) {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon} size={18} color="#4B5563" />
      </View>
      <View style={styles.infoTextBox}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  profileHeaderCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#1E40AF',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DBEAFE',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E40AF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1E40AF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 6,
    zIndex: 10,
  },
  editBadge: {
    backgroundColor: '#0284C7',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 10,
  },
  customIdPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  customIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  verificationDetails: {
    flex: 1,
  },
  verificationLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  verificationSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextBox: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  logoutButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
  versionFooter: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
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
  birthdayBannerContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    marginBottom: 16,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  birthdayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  birthdayIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  birthdayTitleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  birthdayBannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#78350F',
  },
  birthdayPill: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  birthdayPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  birthdayBannerSubtitle: {
    fontSize: 12.5,
    color: '#92400E',
    marginTop: 4,
    lineHeight: 18,
    fontWeight: '600',
  },
});