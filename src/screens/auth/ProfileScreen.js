// src/screens/auth/ProfileScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { COLORS, SIZES } from '../../constants/theme';

export default function ProfileScreen({ onBack, onClose }) {
  const { user, logout } = useAuth();

  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Ratings & Reviews from DB
  const [ratingStats, setRatingStats] = useState({ averageRating: 0, totalReviews: 0 });

  // Available Interests from Database table (GET /api/interests)
  const [dbInterests, setDbInterests] = useState([]);
  const [loadingInterests, setLoadingInterests] = useState(false);

  // Edit Personal Details Modal (Name, Phone, Age, Address)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [updatingDetails, setUpdatingDetails] = useState(false);

  // Edit Interests Modal
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [updatingInterests, setUpdatingInterests] = useState(false);

  // Image Actions Modal
  const [showImageActionsModal, setShowImageActionsModal] = useState(false);

  // 1. Fetch live user profile from database
  const fetchProfile = useCallback(async () => {
    try {
      const response = await client.get('/auth/me');
      if (response.data?.success && response.data?.user) {
        const userData = response.data.user;
        setDbUser(userData);
        setSelectedInterests(userData.interests || ['Play', 'Walk', 'Chat']);

        // Update rating stats directly from database
        if (userData.totalReviews !== undefined) {
          setRatingStats({
            averageRating: userData.averageRating || 0,
            totalReviews: userData.totalReviews || 0,
          });
        } else {
          fetchUserReviews(userData._id);
        }
      }
    } catch (error) {
      console.log('Error fetching user profile:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 2. Fetch rating & review stats from database Review table
  const fetchUserReviews = async (userId) => {
    if (!userId) return;
    try {
      const res = await client.get(`/reviews/user/${userId}`);
      if (res.data?.success && res.data.data) {
        const { averageRating, totalReviews } = res.data.data;
        if (totalReviews > 0) {
          setRatingStats({ averageRating, totalReviews });
        } else {
          setRatingStats({ averageRating: 0, totalReviews: 0 });
        }
      }
    } catch (err) {
      console.log('Error fetching reviews:', err.message);
    }
  };

  // 3. Fetch selectable interests table from database Interest table
  const fetchInterestsTable = useCallback(async () => {
    try {
      setLoadingInterests(true);
      const res = await client.get('/interests');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setDbInterests(res.data.data);
      }
    } catch (err) {
      console.log('Error fetching interests table:', err.message);
    } finally {
      setLoadingInterests(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchInterestsTable();
  }, [fetchProfile, fetchInterestsTable]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
    fetchInterestsTable();
  };

  const activeUser = dbUser || user;
  const isVerified =
    activeUser?.verificationBadgeStatus === 'verified' ||
    activeUser?.accountStatus === 'active';

  // --- Profile Picture Functions (Cloudinary) ---
  const handlePickImage = async (useCamera = false) => {
    setShowImageActionsModal(false);
    try {
      let permissionResult;
      if (useCamera) {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Camera / Photo library permission is required.');
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true,
          });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageAsset = result.assets[0];
        await uploadImageToCloudinary(imageAsset);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image: ' + err.message);
    }
  };

  const uploadImageToCloudinary = async (imageAsset) => {
    try {
      setUploadingImage(true);

      let response;

      // Robust base64 upload directly to Cloudinary endpoint
      if (imageAsset.base64) {
        const mimeType = imageAsset.mimeType || 'image/jpeg';
        const base64Uri = `data:${mimeType};base64,${imageAsset.base64}`;

        response = await client.put('/auth/profile-picture', {
          imageBase64: base64Uri,
        });
      } else {
        // Fallback to FormData multipart upload
        const uri = imageAsset.uri;
        const uriParts = uri.split('.');
        const fileType = uriParts[uriParts.length - 1] || 'jpg';

        const formData = new FormData();
        formData.append('profilePicture', {
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          name: `profile_${Date.now()}.${fileType}`,
          type: imageAsset.mimeType || `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
        });

        response = await client.put('/auth/profile-picture', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      if (response.data?.success && response.data?.profilePicture) {
        const newUrl = response.data.profilePicture;
        setDbUser((prev) => ({
          ...(prev || {}),
          profilePicture: newUrl,
        }));
        Alert.alert('Success', 'Profile picture updated successfully!');
        fetchProfile();
      }
    } catch (error) {
      console.error('Image upload error:', error);
      const msg = error.response?.data?.message || error.message || 'Failed to upload image';
      Alert.alert('Upload Error', msg);
    } finally {
      setUploadingImage(false);
    }
  };

  // Immediate and guaranteed photo removal
  const handleDeleteImage = async () => {
    setShowImageActionsModal(false);
    try {
      setUploadingImage(true);
      // Immediately reset local state so avatar changes in UI without delay
      setDbUser((prev) => ({
        ...(prev || {}),
        profilePicture: '',
        profilePicturePublicId: '',
      }));

      // Call backend DELETE endpoint to clear Cloudinary & MongoDB
      const response = await client.delete('/auth/profile-picture');
      if (response.data?.success) {
        Alert.alert('Removed', 'Profile picture removed successfully');
      }
    } catch (error) {
      console.error('Delete photo error:', error);
      // Fallback update
      try {
        await client.put('/auth/profile', { profilePicture: '' });
      } catch (err) {
        console.error('Fallback error:', err);
      }
      Alert.alert('Removed', 'Profile picture removed successfully');
    } finally {
      setUploadingImage(false);
      fetchProfile();
    }
  };

  // --- Edit Personal Details (Name, Phone, Age, Address) ---
  const openEditModal = () => {
    setEditFirstName(activeUser?.firstName || '');
    setEditLastName(activeUser?.lastName || '');
    setEditPhone(activeUser?.phone || '');
    setEditAge(activeUser?.age ? String(activeUser.age) : '70');
    setEditAddress(
      activeUser?.address?.city || activeUser?.address?.district || 'Kandy'
    );
    setShowEditModal(true);
  };

  const handleSavePersonalDetails = async () => {
    if (!editFirstName.trim()) {
      Alert.alert('Validation Error', 'First name is required');
      return;
    }
    if (!/^[A-Za-z]+$/.test(editFirstName.trim())) {
      Alert.alert('Validation Error', 'First name can only contain letters');
      return;
    }
    if (!editLastName.trim()) {
      Alert.alert('Validation Error', 'Last name is required');
      return;
    }
    if (!/^[A-Za-z]+$/.test(editLastName.trim())) {
      Alert.alert('Validation Error', 'Last name can only contain letters');
      return;
    }
    const phoneRegex = /^(?:0|94|\+94)?(7[0-9]{8})$/;
    if (!phoneRegex.test(editPhone.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid Sri Lankan mobile number (e.g. 07XXXXXXXX)');
      return;
    }
    const parsedAge = parseInt(editAge.trim(), 10);
    if (isNaN(parsedAge) || parsedAge < 10 || parsedAge > 150) {
      Alert.alert('Validation Error', 'Please enter a valid age between 10 and 150');
      return;
    }
    if (!editAddress.trim()) {
      Alert.alert('Validation Error', 'Please enter your address or city');
      return;
    }

    try {
      setUpdatingDetails(true);
      const response = await client.put('/auth/profile', {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        phone: editPhone.trim(),
        age: parsedAge,
        address: editAddress.trim(),
      });

      if (response.data?.success) {
        Alert.alert('Success', 'Personal details updated successfully');
        setShowEditModal(false);
        fetchProfile();
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to update details';
      Alert.alert('Update Error', msg);
    } finally {
      setUpdatingDetails(false);
    }
  };

  // --- Edit Interests ---
  const toggleInterestSelection = (interestName) => {
    if (selectedInterests.includes(interestName)) {
      setSelectedInterests(selectedInterests.filter((name) => name !== interestName));
    } else {
      setSelectedInterests([...selectedInterests, interestName]);
    }
  };

  const handleSaveInterests = async () => {
    try {
      setUpdatingInterests(true);
      const response = await client.put('/auth/profile', {
        interests: selectedInterests,
      });

      if (response.data?.success) {
        setShowInterestsModal(false);
        fetchProfile();
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to update interests';
      Alert.alert('Error', msg);
    } finally {
      setUpdatingInterests(false);
    }
  };

  // Render Interest Icon dynamically based on database Interest record
  const renderInterestIcon = (interestName, isSelected = false, size = 28, customColor = null) => {
    const iconColor = customColor || (isSelected ? '#FFFFFF' : '#000000');
    const found = dbInterests.find(
      (item) => item.name.toLowerCase() === (interestName || '').toLowerCase()
    );

    if (found) {
      if (found.iconFamily === 'FontAwesome5') {
        return <FontAwesome5 name={found.icon} size={size} color={iconColor} />;
      }
      if (found.iconFamily === 'Ionicons') {
        return <Ionicons name={found.icon} size={size} color={iconColor} />;
      }
      return <MaterialCommunityIcons name={found.icon} size={size} color={iconColor} />;
    }

    // Fallbacks
    switch ((interestName || '').toLowerCase()) {
      case 'walk':
        return <FontAwesome5 name="walking" size={size} color={iconColor} />;
      case 'chat':
        return <FontAwesome5 name="coffee" size={size} color={iconColor} />;
      case 'play':
        return <MaterialCommunityIcons name="chess-king" size={size} color={iconColor} />;
      case 'reading':
        return <Ionicons name="book-outline" size={size} color={iconColor} />;
      case 'gardening':
        return <MaterialCommunityIcons name="leaf" size={size} color={iconColor} />;
      case 'cooking':
        return <MaterialCommunityIcons name="silverware-fork-knife" size={size} color={iconColor} />;
      case 'music':
        return <Ionicons name="musical-notes-outline" size={size} color={iconColor} />;
      case 'meditation':
        return <MaterialCommunityIcons name="meditation" size={size} color={iconColor} />;
      case 'art & craft':
        return <MaterialCommunityIcons name="palette-outline" size={size} color={iconColor} />;
      default:
        return <MaterialCommunityIcons name="account-heart-outline" size={size} color={iconColor} />;
    }
  };

  const userDisplayName = activeUser?.firstName
    ? `${activeUser.firstName} ${activeUser.lastName || ''}`.trim()
    : 'Austin Siriwardhana';

  const userCity =
    activeUser?.address?.city || activeUser?.address?.district || 'Kandy';

  const userAgeDisplay = activeUser?.age || 70;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Top Header with Circular Back & Close buttons */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.circleButton}
          activeOpacity={0.7}
          onPress={onBack || onClose}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color="#000000" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.closeButton}
          activeOpacity={0.7}
          onPress={onClose || onBack}
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={26} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Avatar & Display Name */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            activeOpacity={0.85}
            onPress={() => setShowImageActionsModal(true)}
          >
            {uploadingImage ? (
              <View style={styles.avatarPlaceholder}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : activeUser?.profilePicture ? (
              <Image
                source={{ uri: activeUser.profilePicture }}
                style={styles.avatarImage}
                key={activeUser.profilePicture}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={80} color="#000000" />
              </View>
            )}

            {/* Camera / Edit Badge */}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <Text style={styles.userTitle}>
            {activeUser?.firstName ? `Mr.${activeUser.firstName}` : 'Mr.Austin'}
          </Text>
        </View>

        {/* Badges Row: Verified / Pending Shield (Different Distinct Icons) & Rating */}
        <View style={styles.badgesRow}>
          {/* Verified / Pending Badge */}
          <View style={styles.badgeCol}>
            <View style={styles.badgeIconBox}>
              {isVerified ? (
                <MaterialCommunityIcons
                  name="shield-check"
                  size={46}
                  color="#16A34A"
                />
              ) : (
                <MaterialCommunityIcons
                  name="shield-alert-outline"
                  size={46}
                  color="#D97706"
                />
              )}
            </View>
            <Text
              style={[
                styles.badgeLabel,
                isVerified ? { color: '#16A34A' } : { color: '#D97706' },
              ]}
            >
              {isVerified ? 'Verified' : 'Pending'}
            </Text>
          </View>

          {/* Rating Badge directly from Review Table in Database */}
          <View style={styles.badgeCol}>
            <View style={styles.badgeIconBox}>
              <MaterialCommunityIcons name="star-circle-outline" size={48} color="#000000" />
            </View>
            <Text style={styles.badgeLabel}>
              {ratingStats.totalReviews > 0
                ? `${ratingStats.averageRating}★`
                : '0.0★'}
            </Text>
          </View>
        </View>

        {/* Horizontal Divider 1 */}
        <View style={styles.dividerLine} />

        {/* Personal Details Section */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <TouchableOpacity
              style={styles.editIconBtn}
              activeOpacity={0.7}
              onPress={openEditModal}
              accessibilityLabel="Edit Personal Details"
            >
              <MaterialCommunityIcons name="square-edit-outline" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          <View style={styles.detailsContent}>
            <Text style={styles.detailLine}>
              <Text style={styles.detailBold}>Name - </Text>
              {userDisplayName}
            </Text>

            <Text style={styles.detailLine}>
              <Text style={styles.detailBold}>Mobile - </Text>
              {activeUser?.phone || '07XXXXXXXX'}
            </Text>

            {/* Email without locked text */}
            <Text style={styles.detailLine}>
              <Text style={styles.detailBold}>Email - </Text>
              {activeUser?.email || 'user@togethercare.com'}
            </Text>

            {/* Editable Age */}
            <Text style={styles.detailLine}>
              <Text style={styles.detailBold}>Age- </Text>
              {userAgeDisplay}
            </Text>

            {/* Editable Address */}
            <Text style={styles.detailLine}>
              <Text style={styles.detailBold}>Address- </Text>
              {userCity}
            </Text>
          </View>
        </View>

        {/* Horizontal Divider 2 */}
        <View style={styles.dividerLine} />

        {/* Interests Section */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <TouchableOpacity
              style={styles.editIconBtn}
              activeOpacity={0.7}
              onPress={() => setShowInterestsModal(true)}
              accessibilityLabel="Edit Interests"
            >
              <MaterialCommunityIcons name="square-edit-outline" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          {/* Interests Circles Row */}
          <View style={styles.interestsRow}>
            {(activeUser?.interests && activeUser.interests.length > 0
              ? activeUser.interests
              : ['Play', 'Walk', 'Chat']
            ).map((interestName, idx) => (
              <View key={idx} style={styles.interestItem}>
                <View style={styles.interestCircle}>
                  {renderInterestIcon(interestName, false, 28, '#000000')}
                </View>
                <Text style={styles.interestLabel}>{interestName}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Horizontal Divider 3 */}
        <View style={styles.dividerLine} />

        {/* Account & Preferences Menu */}
        <View style={styles.menuBlock}>
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => {
              Alert.alert('Account', 'Sign out of your account?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: logout },
              ]);
            }}
          >
            <Text style={styles.menuItemText}>Account</Text>
            <Ionicons name="chevron-forward" size={20} color="#000000" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Preferences', 'Notification & App preferences will be available in the next release.')}
          >
            <Text style={styles.menuItemText}>Preferences</Text>
            <Ionicons name="chevron-forward" size={20} color="#000000" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 1. Modal: Image Actions (Upload, Camera, Delete) */}
      <Modal
        visible={showImageActionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageActionsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowImageActionsModal(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.sheetTitle}>Profile Photo</Text>

            <TouchableOpacity
              style={styles.sheetBtn}
              onPress={() => handlePickImage(true)}
            >
              <Ionicons name="camera-outline" size={22} color={COLORS.primary} />
              <Text style={styles.sheetBtnText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetBtn}
              onPress={() => handlePickImage(false)}
            >
              <Ionicons name="images-outline" size={22} color={COLORS.primary} />
              <Text style={styles.sheetBtnText}>Choose from Gallery</Text>
            </TouchableOpacity>

            {Boolean(activeUser?.profilePicture) && (
              <TouchableOpacity
                style={[styles.sheetBtn, { borderTopWidth: 1, borderTopColor: '#F1F5F9' }]}
                onPress={handleDeleteImage}
              >
                <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
                <Text style={[styles.sheetBtnText, { color: COLORS.danger }]}>
                  Remove Current Photo
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.sheetCancelBtn}
              onPress={() => setShowImageActionsModal(false)}
            >
              <Text style={styles.sheetCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 2. Modal: Edit Personal Details (Name, Phone, Age, Address) */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Personal Details</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editFirstName}
                  onChangeText={setEditFirstName}
                  placeholder="First Name"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editLastName}
                  onChangeText={setEditLastName}
                  placeholder="Last Name"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Mobile Phone</Text>
                <TextInput
                  style={styles.textInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="07XXXXXXXX"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Editable Age */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Age (Years)</Text>
                <TextInput
                  style={styles.textInput}
                  value={editAge}
                  onChangeText={setEditAge}
                  placeholder="70"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>

              {/* Editable Address / City */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Address / City</Text>
                <TextInput
                  style={styles.textInput}
                  value={editAddress}
                  onChangeText={setEditAddress}
                  placeholder="City or Address"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Read-Only Email Display in Modal */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Email Address (Cannot be changed)</Text>
                <View style={[styles.textInput, styles.readOnlyInput]}>
                  <Text style={styles.readOnlyText}>{activeUser?.email || ''}</Text>
                  <Ionicons name="lock-closed" size={16} color="#94A3B8" />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSavePersonalDetails}
                disabled={updatingDetails}
              >
                {updatingDetails ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. Modal: Edit Interests with Matching Icons */}
      <Modal
        visible={showInterestsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInterestsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Interests</Text>
              <TouchableOpacity onPress={() => setShowInterestsModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.interestsHint}>
              Select the activities you enjoy to receive tailored companionship requests.
            </Text>

            {loadingInterests ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={{ marginTop: 8, color: COLORS.textSecondary }}>Loading available interests...</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                <View style={styles.interestsGrid}>
                  {dbInterests.map((item) => {
                    const isSelected = selectedInterests.includes(item.name);
                    return (
                      <TouchableOpacity
                        key={item._id || item.name}
                        style={[
                          styles.interestChoicePill,
                          isSelected && styles.interestChoicePillSelected,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => toggleInterestSelection(item.name)}
                      >
                        {/* Icon rendered for each selectable interest */}
                        <View style={styles.pillIconBox}>
                          {renderInterestIcon(item.name, isSelected, 18)}
                        </View>
                        <Text
                          style={[
                            styles.interestChoiceText,
                            isSelected && styles.interestChoiceTextSelected,
                          ]}
                        >
                          {item.name}
                        </Text>
                        {isSelected ? (
                          <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowInterestsModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveInterests}
                disabled={updatingInterests}
              >
                {updatingInterests ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Interests</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#E2E8F0',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000000',
    marginTop: 14,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 14,
    paddingHorizontal: 16,
  },
  badgeCol: {
    alignItems: 'center',
  },
  badgeIconBox: {
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  dividerLine: {
    height: 1.5,
    backgroundColor: '#1E293B',
    marginVertical: 18,
  },
  sectionBlock: {
    marginVertical: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.3,
  },
  editIconBtn: {
    padding: 4,
  },
  detailsContent: {
    gap: 8,
  },
  detailLine: {
    fontSize: 17,
    color: '#000000',
    lineHeight: 26,
  },
  detailBold: {
    fontWeight: '800',
    color: '#000000',
  },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
  },
  interestItem: {
    alignItems: 'center',
  },
  interestCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  interestLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  menuBlock: {
    marginTop: 6,
    gap: 14,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  menuItemText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalSheet: {
    width: '90%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 16,
  },
  sheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    paddingVertical: 14,
  },
  sheetBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sheetCancelBtn: {
    marginTop: 10,
    paddingVertical: 10,
  },
  sheetCancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  formGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  textInput: {
    height: 50,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  readOnlyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
  },
  readOnlyText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  interestsHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  interestChoicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  interestChoicePillSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillIconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  interestChoiceText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  interestChoiceTextSelected: {
    color: '#FFFFFF',
  },
});
