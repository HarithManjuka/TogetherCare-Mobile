// src/screens/admin/AdminUserDetailsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import * as adminUserService from '../../services/adminUserService';
import CalendarDatePickerModal from '../../components/common/CalendarDatePickerModal';
import ProvinceDistrictSelectorModal from '../../components/common/ProvinceDistrictSelectorModal';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const formatGender = (g) => {
  if (!g) return 'Not Specified';
  if (g === 'male') return 'Male';
  if (g === 'female') return 'Female';
  return g.charAt(0).toUpperCase() + g.slice(1).toLowerCase();
};

export default function AdminUserDetailsScreen({ userId, onBack, onUserUpdated }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Modals for Location & Date
  const [showCalendar, setShowCalendar] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Ban Modal states
  const [showBanModal, setShowBanModal] = useState(false);
  const [banType, setBanType] = useState('temporary'); // 'temporary' | 'permanent'
  const [banDuration, setBanDuration] = useState('1_day'); // '1_day' | '7_days' | '1_month'
  const [banReason, setBanReason] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      const res = await adminUserService.getAdminUserDetails(userId);
      if (res?.success) {
        setUser(res.user);
        setEditForm({
          firstName: res.user.firstName || '',
          lastName: res.user.lastName || '',
          phone: res.user.phone || '',
          gender: res.user.gender === 'female' ? 'female' : 'male',
          dateOfBirth: res.user.dateOfBirth ? new Date(res.user.dateOfBirth).toISOString().split('T')[0] : '',
          streetAddress: res.user.address?.streetAddress || '',
          city: res.user.address?.city || '',
          district: res.user.address?.district || 'Colombo',
          province: res.user.address?.province || 'Western',
          postalCode: res.user.address?.postalCode || '',
        });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load user details.');
      onBack();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, [userId]);

  const handleRemoveProfilePicture = () => {
    if (user?.role === 'admin') {
      Alert.alert('Action Blocked', 'Admin accounts cannot be edited by another admin.');
      return;
    }
    Alert.alert(
      'Remove Profile Picture',
      'Are you sure you want to remove this user\'s profile picture? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsActionLoading(true);
              const res = await adminUserService.updateAdminUserDetails(userId, { profilePicture: '' });
              if (res?.success) {
                Alert.alert('Success', 'Profile picture removed successfully.');
                loadUser();
                if (onUserUpdated) onUserUpdated();
              }
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to remove profile picture.');
            } finally {
              setIsActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveEdit = async () => {
    if (user?.role === 'admin') {
      Alert.alert('Action Blocked', 'Admin accounts cannot be edited by another admin.');
      setIsEditing(false);
      return;
    }

    const errorList = [];

    // Registration and Profile Edit Validations
    if (!editForm.firstName || !editForm.firstName.trim()) {
      errorList.push('First name is required.');
    } else if (!/^[A-Za-z\s]+$/.test(editForm.firstName.trim())) {
      errorList.push('First name can only contain letters.');
    }

    if (!editForm.lastName || !editForm.lastName.trim()) {
      errorList.push('Last name is required.');
    } else if (!/^[A-Za-z\s]+$/.test(editForm.lastName.trim())) {
      errorList.push('Last name can only contain letters.');
    }

    if (editForm.phone && editForm.phone.trim() && !/^(?:0|94|\+94)?(7[0-9]{8})$/.test(editForm.phone.trim())) {
      errorList.push('Please provide a valid Sri Lankan mobile number (e.g. 07XXXXXXXX).');
    }

    if (editForm.postalCode && editForm.postalCode.trim() && !/^\d+$/.test(editForm.postalCode.trim())) {
      errorList.push('Postal Code must contain only numbers.');
    }

    if (errorList.length > 0) {
      const combinedMsg = errorList.join('\n• ');
      setValidationError(combinedMsg);
      Alert.alert(
        'Validation Attention',
        `Please resolve the following before saving:\n\n• ${combinedMsg}`
      );
      return;
    }

    setValidationError('');

    try {
      setIsSaving(true);
      const payload = {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        phone: editForm.phone.trim(),
        gender: editForm.gender,
        address: {
          streetAddress: editForm.streetAddress.trim(),
          city: editForm.city.trim(),
          district: editForm.district.trim(),
          province: editForm.province.trim(),
          postalCode: editForm.postalCode.trim(),
        },
      };

      if (editForm.dateOfBirth) {
        const parsedDob = new Date(`${editForm.dateOfBirth}T00:00:00`);
        if (!isNaN(parsedDob.getTime())) {
          payload.dateOfBirth = parsedDob.toISOString();
        }
      }

      const res = await adminUserService.updateAdminUserDetails(userId, payload);
      if (res?.success) {
        Alert.alert('Success', 'User details updated successfully.');
        setIsEditing(false);
        loadUser();
        if (onUserUpdated) onUserUpdated();
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message || 'Failed to save changes.';
      setValidationError(serverMsg);
      Alert.alert('Save Failed', serverMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmBan = async () => {
    if (user?.role === 'admin') {
      Alert.alert('Action Blocked', 'Admin accounts cannot be banned.');
      setShowBanModal(false);
      return;
    }

    if (!banReason || !banReason.trim()) {
      Alert.alert('Reason Required', 'Please enter a reason for banning this user account.');
      return;
    }

    try {
      setIsActionLoading(true);
      const res = await adminUserService.banUser(userId, {
        banType,
        duration: banType === 'temporary' ? banDuration : undefined,
        reason: banReason.trim(),
      });

      if (res?.success) {
        Alert.alert('Account Banned', res.message);
        setShowBanModal(false);
        loadUser();
        if (onUserUpdated) onUserUpdated();
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to ban user.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUnban = () => {
    Alert.alert(
      'Lift Account Ban',
      `Are you sure you want to unban ${user.firstName} ${user.lastName}? They will be able to log in immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Unban',
          style: 'default',
          onPress: async () => {
            try {
              setIsActionLoading(true);
              const res = await adminUserService.unbanUser(userId);
              if (res?.success) {
                Alert.alert('Success', 'Account ban lifted successfully.');
                loadUser();
                if (onUserUpdated) onUserUpdated();
              }
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to unban user.');
            } finally {
              setIsActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdateVerificationStatus = async (status) => {
    try {
      setIsActionLoading(true);
      const res = await adminUserService.updateVerificationStatus(userId, status, `Updated by admin to ${status}`);
      if (res?.success) {
        Alert.alert('Success', `Verification badge status updated to ${status}.`);
        loadUser();
        if (onUserUpdated) onUserUpdated();
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update verification status.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const renderStatusBadge = (type, value) => {
    if (type === 'accountStatus') {
      const configs = {
        active: { bg: '#DCFCE7', text: '#15803D', label: 'Active Account', icon: 'checkmark-circle' },
        pending_verification: { bg: '#FEF3C7', text: '#B45309', label: 'Pending Verification', icon: 'time' },
        suspended: { bg: '#FEE2E2', text: '#B91C1C', label: 'Suspended', icon: 'alert-circle' },
        deactivated: { bg: '#F1F5F9', text: '#475569', label: 'Deactivated', icon: 'remove-circle' },
      };
      const cfg = configs[value] || { bg: '#F1F5F9', text: '#64748B', label: value || 'Unknown', icon: 'help-circle' };
      return (
        <View style={[styles.statusBadgePill, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={14} color={cfg.text} style={{ marginRight: 4 }} />
          <Text style={[styles.statusBadgeText, { color: cfg.text }]}>{cfg.label}</Text>
        </View>
      );
    }

    if (type === 'emailVerified') {
      const isVerified = Boolean(value);
      const bg = isVerified ? '#DCFCE7' : '#FFEDD5';
      const text = isVerified ? '#15803D' : '#C2410C';
      const label = isVerified ? 'Verified Email' : 'Unverified (Pending)';
      const icon = isVerified ? 'checkmark-done-circle' : 'mail-unread';
      return (
        <View style={[styles.statusBadgePill, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={14} color={text} style={{ marginRight: 4 }} />
          <Text style={[styles.statusBadgeText, { color: text }]}>{label}</Text>
        </View>
      );
    }

    if (type === 'idBadge') {
      const configs = {
        verified: { bg: '#D1FAE5', text: '#047857', label: 'Verified Badge', icon: 'ribbon' },
        pending: { bg: '#FEF3C7', text: '#D97706', label: 'Pending Approval', icon: 'hourglass-outline' },
        rejected: { bg: '#FFE4E6', text: '#E11D48', label: 'Rejected', icon: 'close-circle' },
        unverified: { bg: '#F1F5F9', text: '#64748B', label: 'Unverified', icon: 'shield-outline' },
      };
      const cfg = configs[value] || { bg: '#F1F5F9', text: '#64748B', label: value || 'Unverified', icon: 'shield-outline' };
      return (
        <View style={[styles.statusBadgePill, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={14} color={cfg.text} style={{ marginRight: 4 }} />
          <Text style={[styles.statusBadgeText, { color: cfg.text }]}>{cfg.label}</Text>
        </View>
      );
    }

    return null;
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary || '#1E40AF'} />
      </View>
    );
  }

  if (!user) return null;

  const profilePicUri = user.profilePicture || user.avatar;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        {/* Top Bar Header */}
        <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Profile & Audit</Text>
        {user.role === 'admin' ? (
          <View style={{ width: 45 }} />
        ) : (
          <TouchableOpacity
            style={styles.editToggleBtn}
            onPress={() => (isEditing ? handleSaveEdit() : setIsEditing(true))}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.editToggleText}>{isEditing ? 'Save' : 'Edit'}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Ban Warning Card if Active */}
        {user.isBanned && (
          <View style={styles.bannedCard}>
            <MaterialCommunityIcons name="alert-octagon" size={28} color="#DC2626" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannedTitle}>
                {user.banType === 'permanent' ? 'Permanently Banned' : 'Temporarily Banned'}
              </Text>
              {user.banExpiresAt && (
                <Text style={styles.bannedSub}>
                  Expires on: {new Date(user.banExpiresAt).toLocaleString()}
                </Text>
              )}
              {user.bannedBy && (
                <Text style={styles.bannedSub}>
                  Banned by: {user.bannedBy.firstName} {user.bannedBy.lastName} ({user.bannedBy.customId})
                </Text>
              )}
              {user.banReason ? (
                <Text style={styles.bannedSub}>Reason: {user.banReason}</Text>
              ) : null}
            </View>
            <TouchableOpacity style={styles.unbanBtn} onPress={handleUnban} disabled={isActionLoading}>
              <Text style={styles.unbanBtnText}>Unban</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Identity & Status Overview Header */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            {profilePicUri ? (
              <Image source={{ uri: profilePicUri }} style={styles.avatarLargeImage} />
            ) : (
              <Text style={styles.avatarLargeText}>
                {user.firstName ? user.firstName[0] : ''}
                {user.lastName ? user.lastName[0] : ''}
              </Text>
            )}
          </View>

          {/* Admin Profile Picture Removal Option (Can ONLY remove, cannot add; Admin accounts protected) */}
          {profilePicUri && user.role !== 'admin' ? (
            <TouchableOpacity
              style={styles.removePicBtn}
              onPress={handleRemoveProfilePicture}
              disabled={isActionLoading}
            >
              <Ionicons name="trash-outline" size={14} color="#B91C1C" style={{ marginRight: 4 }} />
              <Text style={styles.removePicBtnText}>Remove Profile Picture</Text>
            </TouchableOpacity>
          ) : null}

          <Text style={styles.userName}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.userCustomId}>{user.customId || 'No ID'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{user.role ? user.role.toUpperCase() : ''}</Text>
          </View>
        </View>

        {/* System & Verification Badges with Color Stages */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>System Status Attributes</Text>
          <View style={styles.badgeInfoRow}>
            <Text style={styles.infoLabel}>Account Status:</Text>
            {renderStatusBadge('accountStatus', user.accountStatus)}
          </View>
          <View style={styles.badgeInfoRow}>
            <Text style={styles.infoLabel}>Email Verification:</Text>
            {renderStatusBadge('emailVerified', user.isEmailVerified)}
          </View>
          <View style={styles.badgeInfoRow}>
            <Text style={styles.infoLabel}>ID Verification Badge:</Text>
            {renderStatusBadge('idBadge', user.verificationBadgeStatus)}
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Registered On:</Text>
            <Text style={styles.infoValue}>
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
            </Text>
          </View>
          {user.updatedAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Profile Update:</Text>
              <Text style={styles.infoValue}>
                {new Date(user.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </Text>
            </View>
          )}
        </View>

        {/* Personal Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Personal Information</Text>

          {validationError ? (
            <View style={styles.bannerErrorBox}>
              <Text style={styles.bannerErrorText}>• {validationError}</Text>
            </View>
          ) : null}

          <Text style={styles.fieldLabel}>First Name *</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={editForm.firstName}
              onChangeText={(t) => { setEditForm({ ...editForm, firstName: t }); setValidationError(''); }}
            />
          ) : (
            <Text style={styles.fieldValue}>{user.firstName}</Text>
          )}

          <Text style={styles.fieldLabel}>Last Name *</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={editForm.lastName}
              onChangeText={(t) => { setEditForm({ ...editForm, lastName: t }); setValidationError(''); }}
            />
          ) : (
            <Text style={styles.fieldValue}>{user.lastName}</Text>
          )}

          <Text style={styles.fieldLabel}>Email Address</Text>
          <Text style={styles.fieldValueReadOnly}>{user.email} (Non-editable)</Text>

          <Text style={styles.fieldLabel}>Phone Number</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={editForm.phone}
              onChangeText={(t) => { setEditForm({ ...editForm, phone: t }); setValidationError(''); }}
              keyboardType="phone-pad"
              placeholder="07XXXXXXXX"
            />
          ) : (
            <Text style={styles.fieldValue}>{user.phone}</Text>
          )}

          <Text style={styles.fieldLabel}>Date of Birth (Calendar Picker)</Text>
          {isEditing ? (
            <TouchableOpacity
              style={styles.selectorBtn}
              onPress={() => setShowCalendar(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.selectorBtnText}>
                {editForm.dateOfBirth ? editForm.dateOfBirth : 'Tap to select date from Calendar'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </TouchableOpacity>
          ) : (
            <Text style={styles.fieldValue}>
              {user.age || user.currentAge ? `${user.age || user.currentAge} years old ` : ''}
              {user.dateOfBirth ? `(${new Date(user.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })})` : ''}
            </Text>
          )}

          <Text style={styles.fieldLabel}>Gender</Text>
          {isEditing ? (
            <View style={styles.genderRow}>
              {GENDER_OPTIONS.map((g) => (
                <TouchableOpacity
                  key={g.value}
                  style={[
                    styles.genderPill,
                    editForm.gender === g.value && styles.genderPillActive,
                  ]}
                  onPress={() => setEditForm({ ...editForm, gender: g.value })}
                >
                  <Text
                    style={[
                      styles.genderPillText,
                      editForm.gender === g.value && styles.genderPillTextActive,
                    ]}
                  >
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.fieldValue}>{formatGender(user.gender)}</Text>
          )}

          <Text style={styles.fieldLabel}>Address & Location</Text>
          {isEditing ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Street Address"
                value={editForm.streetAddress}
                onChangeText={(t) => setEditForm({ ...editForm, streetAddress: t })}
              />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.input}
                    placeholder="City"
                    value={editForm.city}
                    onChangeText={(t) => setEditForm({ ...editForm, city: t })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.input}
                    placeholder="Postal Code"
                    value={editForm.postalCode}
                    onChangeText={(t) => setEditForm({ ...editForm, postalCode: t })}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Province & District Picker</Text>
              <TouchableOpacity
                style={styles.selectorBtn}
                onPress={() => setShowLocationPicker(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="map-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.selectorBtnText}>
                  {editForm.province} Province • {editForm.district} District
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#64748B" />
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.fieldValue}>
              {[
                user.address?.streetAddress,
                user.address?.city,
                user.address?.district,
                user.address?.province,
                user.address?.postalCode,
              ]
                .filter(Boolean)
                .join(', ') || 'No address registered'}
            </Text>
          )}
        </View>

        {/* Role Specific Attributes */}
        {user.role === 'volunteer' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Volunteer Credentials & Verification</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID Type:</Text>
              <Text style={styles.infoValue}>{user.volunteerIdType || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID Number:</Text>
              <Text style={styles.infoValue}>{user.volunteerIdNumber || 'N/A'}</Text>
            </View>
            {user.educationalInstitution ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Institution:</Text>
                <Text style={styles.infoValue}>{user.educationalInstitution}</Text>
              </View>
            ) : null}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Current Badge:</Text>
              <Text style={styles.infoValue}>{(user.verificationBadgeStatus || 'unverified').toUpperCase()}</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              {user.verificationBadgeStatus !== 'verified' ? (
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#16A34A', paddingVertical: 10, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                  onPress={() => handleUpdateVerificationStatus('verified')}
                  disabled={isActionLoading}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>Approve Badge</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#DC2626', paddingVertical: 10, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                  onPress={() => handleUpdateVerificationStatus('rejected')}
                  disabled={isActionLoading}
                >
                  <Ionicons name="close-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>Revoke Badge</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {user.role === 'elderly' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Elderly Profile & Care Links</Text>

            {user.emergencyContact ? (
              <>
                <Text style={styles.fieldLabel}>Emergency Contact</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name:</Text>
                  <Text style={styles.infoValue}>{user.emergencyContact.name || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Relationship:</Text>
                  <Text style={styles.infoValue}>
                    {user.emergencyContact.relationship || user.emergencyContact.relation || 'N/A'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone:</Text>
                  <Text style={styles.infoValue}>{user.emergencyContact.phone || 'N/A'}</Text>
                </View>
              </>
            ) : null}

            {user.linkedCaregiverId && typeof user.linkedCaregiverId === 'object' ? (
              <>
                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Linked Caregiver</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Caregiver Name:</Text>
                  <Text style={styles.infoValue}>
                    {user.linkedCaregiverId.firstName} {user.linkedCaregiverId.lastName}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Custom ID / Email:</Text>
                  <Text style={styles.infoValue}>
                    {user.linkedCaregiverId.customId || 'N/A'} ({user.linkedCaregiverId.email})
                  </Text>
                </View>
              </>
            ) : null}
          </View>
        )}

        {user.role === 'caregiver' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Caregiver Profile</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Caregiver Type:</Text>
              <Text style={styles.infoValue}>{user.caregiverType || 'N/A'}</Text>
            </View>
            {user.relationshipToElderly ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Relationship to Elderly:</Text>
                <Text style={styles.infoValue}>{user.relationshipToElderly}</Text>
              </View>
            ) : null}
            {user.organizationName ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Organization:</Text>
                <Text style={styles.infoValue}>{user.organizationName}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Administration Enforcement Panel */}
        <View style={styles.actionPanelCard}>
          <Text style={styles.sectionHeader}>Administrative Actions</Text>
          <Text style={styles.actionWarning}>
            TogetherCare uses system-wide account suspension instead of account deletion to preserve audit and task histories.
          </Text>

          {user.isBanned ? (
            <TouchableOpacity style={styles.unbanFullBtn} onPress={handleUnban} disabled={isActionLoading}>
              <Ionicons name="lock-open" size={18} color="#FFFFFF" />
              <Text style={styles.unbanFullBtnText}>Lift Ban & Restore Account</Text>
            </TouchableOpacity>
          ) : user.role === 'admin' ? (
            <View style={[styles.actionWarning, { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1', borderLeftWidth: 4, borderLeftColor: '#475569', marginTop: 10, padding: 12, borderRadius: 8 }]}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155' }}>
                🛡️ Protected Account: Admin accounts cannot be banned.
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.banTriggerBtn}
              onPress={() => setShowBanModal(true)}
              disabled={isActionLoading}
            >
              <Ionicons name="ban" size={18} color="#FFFFFF" />
              <Text style={styles.banTriggerBtnText}>Ban User from System</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      <CalendarDatePickerModal
        visible={showCalendar}
        initialDate={editForm.dateOfBirth || '1975-01-01'}
        onConfirm={(selectedDate) => {
          setEditForm({ ...editForm, dateOfBirth: selectedDate });
          setValidationError('');
          setShowCalendar(false);
        }}
        onClose={() => setShowCalendar(false)}
      />

      {/* Location Picker Modal */}
      <ProvinceDistrictSelectorModal
        visible={showLocationPicker}
        currentProvince={editForm.province}
        currentDistrict={editForm.district}
        onConfirm={({ province: prov, district: dist }) => {
          setEditForm({ ...editForm, province: prov, district: dist });
          setValidationError('');
          setShowLocationPicker(false);
        }}
        onClose={() => setShowLocationPicker(false)}
      />

      {/* Ban Enforcement Modal */}
      <Modal visible={showBanModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={24} color="#DC2626" />
              <Text style={styles.modalTitle}>Enforce Account Ban</Text>
            </View>

            <Text style={styles.modalSub}>
              Select suspension conditions for {user.firstName} {user.lastName}.
            </Text>

            {/* Type selector */}
            <View style={styles.banTypeToggleRow}>
              <TouchableOpacity
                style={[
                  styles.banTypeBtn,
                  banType === 'temporary' && styles.banTypeBtnActive,
                ]}
                onPress={() => setBanType('temporary')}
              >
                <Text
                  style={[
                    styles.banTypeBtnText,
                    banType === 'temporary' && styles.banTypeBtnTextActive,
                  ]}
                >
                  Temporary
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.banTypeBtn,
                  banType === 'permanent' && styles.banTypeBtnActiveDanger,
                ]}
                onPress={() => setBanType('permanent')}
              >
                <Text
                  style={[
                    styles.banTypeBtnText,
                    banType === 'permanent' && styles.banTypeBtnTextActive,
                  ]}
                >
                  Permanent
                </Text>
              </TouchableOpacity>
            </View>

            {/* Duration selector for temporary */}
            {banType === 'temporary' && (
              <View style={styles.durationRow}>
                {[
                  { key: '1_day', label: '1 Day' },
                  { key: '7_days', label: '7 Days' },
                  { key: '1_month', label: '1 Month' },
                ].map((d) => (
                  <TouchableOpacity
                    key={d.key}
                    style={[
                      styles.durationPill,
                      banDuration === d.key && styles.durationPillActive,
                    ]}
                    onPress={() => setBanDuration(d.key)}
                  >
                    <Text
                      style={[
                        styles.durationPillText,
                        banDuration === d.key && styles.durationPillTextActive,
                      ]}
                    >
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Reason */}
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 4 }}>
              Reason for Ban *
            </Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Enter reason for banning user (Required)"
              multiline
              value={banReason}
              onChangeText={setBanReason}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowBanModal(false)}
                disabled={isActionLoading}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmBan}
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm Ban</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  editToggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.primary || '#1E40AF',
  },
  editToggleText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  scrollContent: { padding: 16, paddingBottom: 150 },
  bannedCard: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bannedTitle: { fontSize: 15, fontWeight: '800', color: '#B91C1C' },
  bannedSub: { fontSize: 12, color: '#991B1B', marginTop: 2 },
  unbanBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unbanBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: '#BAE6FD',
    overflow: 'hidden',
  },
  avatarLargeImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarLargeText: { fontSize: 24, fontWeight: '800', color: COLORS.primary || '#1E40AF' },
  removePicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  removePicBtnText: { fontSize: 11, fontWeight: '700', color: '#B91C1C' },
  userName: { fontSize: 19, fontWeight: '800', color: '#0F172A' },
  userCustomId: { fontSize: 13, color: '#64748B', marginTop: 2 },
  roleBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  roleBadgeText: { fontSize: 11, fontWeight: '800', color: '#475569', letterSpacing: 0.5 },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  badgeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  infoLabel: { fontSize: 13, color: '#64748B' },
  infoValue: { fontSize: 13, color: '#1E293B', fontWeight: '500' },
  statusBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bannerErrorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  bannerErrorText: { fontSize: 12, color: '#B91C1C', fontWeight: '600' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginTop: 8 },
  fieldValue: { fontSize: 14, color: '#1E293B', paddingVertical: 4, fontWeight: '500' },
  fieldValueReadOnly: { fontSize: 13, color: '#94A3B8', paddingVertical: 4, fontStyle: 'italic' },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    marginTop: 4,
  },
  selectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  selectorBtnText: { fontSize: 13.5, fontWeight: '700', color: '#0F172A', flex: 1 },
  genderRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  genderPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  genderPillActive: { backgroundColor: COLORS.primary || '#1E40AF', borderColor: COLORS.primary || '#1E40AF' },
  genderPillText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  genderPillTextActive: { color: '#FFFFFF' },
  actionPanelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionWarning: { fontSize: 12, color: '#64748B', marginBottom: 14, lineHeight: 18 },
  banTriggerBtn: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  banTriggerBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  unbanFullBtn: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  unbanFullBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 380,
    padding: 20,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 13, color: '#64748B', marginBottom: 14 },
  banTypeToggleRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  banTypeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  banTypeBtnActive: { backgroundColor: COLORS.primary || '#1E40AF', borderColor: COLORS.primary || '#1E40AF' },
  banTypeBtnActiveDanger: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  banTypeBtnText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  banTypeBtnTextActive: { color: '#FFFFFF' },
  durationRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  durationPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  durationPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  durationPillText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  durationPillTextActive: { color: '#FFFFFF' },
  reasonInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    height: 70,
    textAlignVertical: 'top',
    fontSize: 13,
    marginBottom: 16,
  },
  modalBtnRow: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: { color: '#475569', fontWeight: '700' },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  modalConfirmText: { color: '#FFFFFF', fontWeight: '700' },
});
