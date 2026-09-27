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
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import client from '../../api/client';
import * as caregiverService from '../../services/caregiverService';
import LogoutModal from '../../components/common/LogoutModal';
import AvatarActionModal from '../../components/common/AvatarActionModal';
import EditProfileModal from '../../components/common/EditProfileModal';
import VerifyEmailModal from '../../components/common/VerifyEmailModal';
import AppHeader from '../../components/common/AppHeader';

export default function ProfileScreen({ onNavigateVerifyEmail, onBack, onClose }) {
  const { user, logout, uploadProfilePicture, deleteProfilePicture, refreshProfile, updateProfile } = useAuth();
  const { scale } = useTheme();
  const styles = React.useMemo(() => getProfileScreenStyles(scale), [scale]);
  const [uploading, setUploading] = useState(false);

  // Refresh latest database profile on mount
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVerifyEmailModal, setShowVerifyEmailModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Caregiver certifications state (Sprint 1)
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [certTitle, setCertTitle] = useState('');
  const [certOrg, setCertOrg] = useState('');
  const [certNum, setCertNum] = useState('');
  const [certLoading, setCertLoading] = useState(false);

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

  // Certification Handlers (Sprint 1)
  const handleAddCertification = async () => {
    if (!certTitle.trim() || !certOrg.trim()) {
      Alert.alert('Required Fields', 'Please enter certification title and issuing organization.');
      return;
    }

    try {
      setCertLoading(true);
      const res = await caregiverService.addCertification({
        title: certTitle.trim(),
        issuingOrganization: certOrg.trim(),
        certificateNumber: certNum.trim(),
      });

      if (res?.success) {
        Alert.alert('Success', 'Certification added to your professional profile!');
        setCertTitle('');
        setCertOrg('');
        setCertNum('');
        setShowAddCertModal(false);
        refreshProfile();
      } else {
        Alert.alert('Error', res?.message || 'Failed to add certification');
      }
    } catch (err) {
      console.error('Add Cert Error:', err);
      Alert.alert('Error', 'Server error while adding certification');
    } finally {
      setCertLoading(false);
    }
  };

  const handleDeleteCertification = (certId, title) => {
    Alert.alert(
      'Remove Certification',
      `Are you sure you want to remove "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await caregiverService.deleteCertification(certId);
              refreshProfile();
            } catch (err) {
              console.error('Delete Cert Error:', err);
              Alert.alert('Error', 'Could not remove certification.');
            }
          },
        },
      ]
    );
  };

  const isVolunteer = user?.role === 'volunteer';
  const isEmailVerified = Boolean(user?.isEmailVerified);
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
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <AppHeader
        showLeftAction={!!onBack}
        onLeftActionPress={onBack}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>



      {/* 0.1. Impressive & Professional Birthday Celebration Banner */}
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

        {/* Role-adaptive Edit Profile Details Action Button */}
        <TouchableOpacity
          style={styles.editProfileBtn}
          activeOpacity={0.8}
          onPress={() => setShowEditModal(true)}
        >
          <Ionicons name="create-outline" size={16} color="#1E40AF" style={{ marginRight: 6 }} />
          <Text style={styles.editProfileBtnText}>Edit Profile Details</Text>
        </TouchableOpacity>
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
              onPress={() => {
                setShowVerifyEmailModal(true);
                if (onNavigateVerifyEmail) onNavigateVerifyEmail();
              }}
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

        <InfoRow icon="call-outline" label="Phone Number" value={user?.phone || 'Not provided'} styles={styles} scale={scale} />
        <InfoRow
          icon="calendar-outline"
          label="Date of Birth"
          value={user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('en-GB') : 'Not provided'}
          styles={styles}
          scale={scale}
        />
        <InfoRow icon="time-outline" label="Age" value={user?.age ? `${user.age} years old` : 'Not provided'} styles={styles} scale={scale} />
        <InfoRow icon="briefcase-outline" label="Account Role" value={user?.role ? user.role.toUpperCase() : 'USER'} isLast styles={styles} scale={scale} />
      </View>

      {/* 4. Location & Address Details */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>Residential Location</Text>

        <InfoRow icon="location-outline" label="District" value={user?.address?.district || 'Not provided'} styles={styles} scale={scale} />
        <InfoRow icon="map-outline" label="Province" value={user?.address?.province || 'Not provided'} styles={styles} scale={scale} />
        <InfoRow icon="home-outline" label="Street Address" value={user?.address?.streetAddress || 'Not provided'} styles={styles} scale={scale} />
        <InfoRow
          icon="navigate-outline"
          label="City & Postal Code"
          value={
            user?.address?.city
              ? `${user.address.city} ${user.address.postalCode ? `(${user.address.postalCode})` : ''}`
              : 'Not provided'
          }
          isLast
          styles={styles}
          scale={scale}
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
          <InfoRow icon="card-outline" label="ID Document Type" value={user?.volunteerIdType || 'NIC / Passport'} styles={styles} scale={scale} />
          <InfoRow icon="document-text-outline" label="ID Document Number" value={user?.volunteerIdNumber || 'Not submitted'} styles={styles} scale={scale} />
          <InfoRow icon="school-outline" label="Educational Institution" value={user?.educationalInstitution || 'Not provided'} isLast styles={styles} scale={scale} />
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
          <InfoRow icon="person-outline" label="Contact Name" value={user?.emergencyContact?.name || 'Not provided'} styles={styles} scale={scale} />
          <InfoRow icon="git-network-outline" label="Relationship" value={user?.emergencyContact?.relation || 'Not provided'} styles={styles} scale={scale} />
          <InfoRow icon="call-outline" label="Emergency Phone" value={user?.emergencyContact?.phone || 'Not provided'} isLast styles={styles} scale={scale} />
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

      {/* Professional Certifications & Credentials (Sprint 1) */}
      {user?.role === 'caregiver' && (
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.cardSectionTitle}>Certifications & Credentials</Text>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              onPress={() => setShowAddCertModal(true)}
            >
              <Ionicons name="add-circle" size={18} color="#1E40AF" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E40AF' }}>Add New</Text>
            </TouchableOpacity>
          </View>

          {(!user?.certifications || user.certifications.length === 0) ? (
            <View style={{ paddingVertical: 14, alignItems: 'center' }}>
              <Ionicons name="ribbon-outline" size={32} color="#94A3B8" />
              <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 6 }}>
                No professional certifications added yet.
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#EFF6FF',
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 6,
                  marginTop: 10,
                  borderWidth: 1,
                  borderColor: '#BFDBFE',
                }}
                onPress={() => setShowAddCertModal(true)}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#1E40AF' }}>
                  + Add Professional Certificate
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            user.certifications.map((cert) => (
              <View
                key={cert._id}
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0F172A' }}>{cert.title}</Text>
                    <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{cert.issuingOrganization}</Text>
                    {cert.certificateNumber ? (
                      <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>ID: {cert.certificateNumber}</Text>
                    ) : null}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <View
                      style={{
                        backgroundColor: cert.verificationStatus === 'verified' ? '#DCFCE7' : '#FEF3C7',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: 'bold',
                          color: cert.verificationStatus === 'verified' ? '#16A34A' : '#D97706',
                        }}
                      >
                        {cert.verificationStatus ? cert.verificationStatus.toUpperCase() : 'PENDING'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteCertification(cert._id, cert.title)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Logout Action Button */}
      <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={() => setShowLogoutModal(true)}>
        <Ionicons name="log-out-outline" size={20} color="#DC2626" style={{ marginRight: 8 }} />
        <Text style={styles.logoutButtonText}>Log Out Account</Text>
      </TouchableOpacity>

      <Text style={styles.versionFooter}>TogetherCare v1.0.0 • Sri Lanka</Text>

      {/* Modals */}
      <LogoutModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        isLoggingOut={isLoggingOut}
      />

      <AvatarActionModal
        visible={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onPickPhoto={handlePickAvatar}
        onRemovePhoto={handleRemoveAvatar}
        onSelectPick={handlePickAvatar}
        onSelectRemove={handleRemoveAvatar}
        hasExistingPhoto={hasProfilePic}
      />

      <EditProfileModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        user={user}
        onSaveSuccess={updateProfile}
      />

      <VerifyEmailModal
        visible={showVerifyEmailModal}
        onClose={() => setShowVerifyEmailModal(false)}
        email={user?.email}
        onVerifiedSuccess={async () => {
          await refreshProfile();
          setShowVerifyEmailModal(false);
        }}
      />

      {/* Add Certification Modal (Sprint 1) */}
      <Modal
        visible={showAddCertModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowAddCertModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.certModalCard}>
            <View style={styles.certModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="ribbon" size={22} color="#1E40AF" />
                <Text style={styles.certModalTitle}>Add Certification</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddCertModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.certFieldLabel}>Certification Title *</Text>
            <TextInput
              style={styles.certTextInput}
              placeholder="e.g. Certified Nursing Assistant (CNA), First Aid"
              placeholderTextColor="#94A3B8"
              value={certTitle}
              onChangeText={setCertTitle}
            />

            <Text style={styles.certFieldLabel}>Issuing Organization *</Text>
            <TextInput
              style={styles.certTextInput}
              placeholder="e.g. Red Cross, Ministry of Health"
              placeholderTextColor="#94A3B8"
              value={certOrg}
              onChangeText={setCertOrg}
            />

            <Text style={styles.certFieldLabel}>Certificate ID / Number</Text>
            <TextInput
              style={styles.certTextInput}
              placeholder="e.g. SL-CNA-2024-8891 (Optional)"
              placeholderTextColor="#94A3B8"
              value={certNum}
              onChangeText={setCertNum}
            />

            <View style={styles.certModalActions}>
              <TouchableOpacity
                style={styles.certCancelBtn}
                onPress={() => setShowAddCertModal(false)}
                disabled={certLoading}
              >
                <Text style={styles.certCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.certSaveBtn, certLoading && { opacity: 0.7 }]}
                onPress={handleAddCertification}
                disabled={certLoading}
              >
                {certLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.certSaveBtnText}>Save Certificate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  </View>
);
}

// Reusable Sub-Row Component
function InfoRow({ icon, label, value, isLast, styles, scale = 1.0 }) {
  return (
    <View style={[styles?.infoRow, !isLast && styles?.infoRowBorder]}>
      <View style={styles?.infoIconBox}>
        <Ionicons name={icon} size={Math.round(18 * scale)} color="#4B5563" />
      </View>
      <View style={styles?.infoTextBox}>
        <Text style={styles?.infoLabel}>{label}</Text>
        <Text style={styles?.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export const getProfileScreenStyles = (scale = 1.0) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F8FAFC',
    },
    scrollContent: {
      paddingHorizontal: Math.round(20 * scale),
      paddingTop: 16,
      paddingBottom: 40,
    },
    profileHeaderCard: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      paddingVertical: Math.round(24 * scale),
      paddingHorizontal: Math.round(16 * scale),
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
      marginBottom: Math.round(14 * scale),
    },
    avatarImage: {
      width: Math.round(96 * scale),
      height: Math.round(96 * scale),
      borderRadius: Math.round(48 * scale),
      borderWidth: 3,
      borderColor: '#1E40AF',
    },
    avatarPlaceholder: {
      width: Math.round(96 * scale),
      height: Math.round(96 * scale),
      borderRadius: Math.round(48 * scale),
      backgroundColor: '#EFF6FF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#DBEAFE',
    },
    avatarInitials: {
      fontSize: Math.round(32 * scale),
      fontWeight: '800',
      color: '#1E40AF',
    },
    cameraBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: '#1E40AF',
      width: Math.round(36 * scale),
      height: Math.round(36 * scale),
      borderRadius: Math.round(18 * scale),
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
      fontSize: Math.round(20 * scale),
      fontWeight: '800',
      color: '#0F172A',
      marginBottom: 2,
    },
    userEmail: {
      fontSize: Math.round(13 * scale),
      color: '#64748B',
      marginBottom: 10,
    },
    customIdPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#EFF6FF',
      paddingHorizontal: Math.round(12 * scale),
      paddingVertical: Math.round(5 * scale),
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#BFDBFE',
    },
    customIdText: {
      fontSize: Math.round(12 * scale),
      fontWeight: '700',
      color: '#1E40AF',
      letterSpacing: 0.5,
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: Math.round(18 * scale),
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
      fontSize: Math.round(15 * scale),
      fontWeight: '700',
      color: '#0F172A',
      marginBottom: 14,
    },
    verificationRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    verificationIconWrap: {
      width: Math.round(38 * scale),
      height: Math.round(38 * scale),
      borderRadius: Math.round(19 * scale),
      backgroundColor: '#F8FAFC',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    verificationDetails: {
      flex: 1,
    },
    verificationLabel: {
      fontSize: Math.round(13 * scale),
      fontWeight: '700',
      color: '#1E293B',
    },
    verificationSub: {
      fontSize: Math.round(11 * scale),
      color: '#64748B',
      marginTop: 1,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Math.round(9 * scale),
      paddingVertical: Math.round(5 * scale),
      borderRadius: 8,
      gap: 4,
    },
    statusBadgeText: {
      fontSize: Math.round(11 * scale),
      fontWeight: '700',
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Math.round(10 * scale),
    },
    infoRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
    },
    infoIconBox: {
      width: Math.round(32 * scale),
      height: Math.round(32 * scale),
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
      fontSize: Math.round(11 * scale),
      color: '#64748B',
      fontWeight: '500',
    },
    infoValue: {
      fontSize: Math.round(13 * scale),
      fontWeight: '600',
      color: '#0F172A',
      marginTop: 2,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FEE2E2',
      paddingVertical: Math.round(14 * scale),
      borderRadius: 12,
      marginTop: 4,
      marginBottom: 16,
    },
    logoutButtonText: {
      color: '#DC2626',
      fontSize: Math.round(14 * scale),
      fontWeight: '700',
    },
    versionFooter: {
      textAlign: 'center',
      fontSize: Math.round(11 * scale),
      color: '#94A3B8',
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    switchTitle: {
      fontSize: Math.round(14 * scale),
      fontWeight: '700',
      color: '#0F172A',
    },
    switchSubtitle: {
      fontSize: Math.round(12 * scale),
      color: '#64748B',
      marginTop: 2,
      paddingRight: 10,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Math.round(12 * scale),
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
    },
    menuItemText: {
      flex: 1,
      fontSize: Math.round(14 * scale),
      fontWeight: '700',
      color: '#334155',
      marginLeft: 12,
    },
    birthdayBannerContainer: {
      backgroundColor: '#FEF3C7',
      borderRadius: 20,
      padding: Math.round(16 * scale),
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
      width: Math.round(52 * scale),
      height: Math.round(52 * scale),
      borderRadius: Math.round(26 * scale),
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
      fontSize: Math.round(17 * scale),
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
      fontSize: Math.round(10 * scale),
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    birthdayBannerSubtitle: {
      fontSize: Math.round(12.5 * scale),
      color: '#92400E',
      marginTop: 4,
      lineHeight: Math.round(18 * scale),
      fontWeight: '600',
    },
    editProfileBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#EFF6FF',
      borderWidth: 1,
      borderColor: '#BFDBFE',
      paddingHorizontal: Math.round(16 * scale),
      paddingVertical: Math.round(9 * scale),
      borderRadius: 20,
      marginTop: 12,
      shadowColor: '#1E40AF',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    editProfileBtnText: {
      fontSize: Math.round(13 * scale),
      fontWeight: '700',
      color: '#1E40AF',
    },
    elderlyTopBarCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      marginBottom: 16,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    elderlyBackNavRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Math.round(16 * scale),
      paddingVertical: Math.round(10 * scale),
      backgroundColor: '#F8FAFC',
      borderTopWidth: 1,
      borderTopColor: '#F1F5F9',
    },
    elderlyBackBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#EFF6FF',
      paddingHorizontal: Math.round(12 * scale),
      paddingVertical: Math.round(6 * scale),
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#BFDBFE',
    },
    elderlyBackBtnText: {
      fontSize: Math.round(13 * scale),
      fontWeight: '800',
      color: '#1E40AF',
    },
    elderlyPillTag: {
      backgroundColor: '#DBEAFE',
      paddingHorizontal: Math.round(10 * scale),
      paddingVertical: Math.round(4 * scale),
      borderRadius: 12,
    },
    elderlyPillTagText: {
      fontSize: Math.round(10 * scale),
      fontWeight: '800',
      color: '#1E40AF',
      letterSpacing: 0.5,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Math.round(20 * scale),
    },
    certModalCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: Math.round(20 * scale),
      width: '100%',
      maxWidth: 420,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 5,
    },
    certModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    certModalTitle: {
      fontSize: Math.round(17 * scale),
      fontWeight: '800',
      color: '#0F172A',
    },
    certFieldLabel: {
      fontSize: Math.round(12 * scale),
      fontWeight: '700',
      color: '#475569',
      marginBottom: 6,
      marginTop: 8,
    },
    certTextInput: {
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: Math.round(13 * scale),
      color: '#0F172A',
    },
    certModalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    certCancelBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#CBD5E1',
      alignItems: 'center',
      backgroundColor: '#F8FAFC',
    },
    certCancelBtnText: {
      fontSize: Math.round(13 * scale),
      fontWeight: '700',
      color: '#64748B',
    },
    certSaveBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      backgroundColor: '#1E40AF',
    },
    certSaveBtnText: {
      fontSize: Math.round(13 * scale),
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });