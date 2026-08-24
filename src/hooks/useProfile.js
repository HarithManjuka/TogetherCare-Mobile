// src/hooks/useProfile.js
import React, { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import * as interestService from '../services/interestService';

export function useProfile() {
  const {
    user,
    logout,
    refreshProfile,
    updateProfile: updateUserProfile,
    uploadProfilePicture,
    deleteProfilePicture,
  } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Available Interests from Database table
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

  // 1. Initial Load & Refresh
  const loadData = useCallback(async () => {
    try {
      await refreshProfile();
    } catch (e) {
      console.log('Error loading user profile:', e.message);
    }
  }, [refreshProfile]);

  // 2. Fetch selectable interests from interestService
  const loadInterests = useCallback(async () => {
    try {
      setLoadingInterests(true);
      const res = await interestService.getInterests();
      if (res?.success && Array.isArray(res.data)) {
        setDbInterests(res.data);
      }
    } catch (err) {
      console.log('Error loading interests:', err.message);
    } finally {
      setLoadingInterests(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadInterests();
  }, [loadData, loadInterests]);

  useEffect(() => {
    if (user?.interests) {
      setSelectedInterests(user.interests);
    }
  }, [user?.interests]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), loadInterests()]);
    setRefreshing(false);
  };

  const isVerified =
    user?.verificationBadgeStatus === 'verified' || user?.accountStatus === 'active';

  // --- Profile Picture Actions ---
  const handlePickImage = async (useCamera = false) => {
    setShowImageActionsModal(false);
    try {
      const permissionResult = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

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
        try {
          setUploadingImage(true);
          await uploadProfilePicture(imageAsset);
          Alert.alert('Success', 'Profile picture updated successfully!');
        } catch (uploadErr) {
          Alert.alert('Upload Error', uploadErr.message);
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image: ' + err.message);
    }
  };

  const handleDeleteImage = async () => {
    setShowImageActionsModal(false);
    try {
      setUploadingImage(true);
      await deleteProfilePicture();
      Alert.alert('Removed', 'Profile picture removed successfully');
    } catch (error) {
      console.error('Delete photo error:', error);
      Alert.alert('Delete Error', error.message || 'Failed to remove picture');
    } finally {
      setUploadingImage(false);
    }
  };

  // --- Edit Personal Details Actions ---
  const openEditModal = () => {
    setEditFirstName(user?.firstName || '');
    setEditLastName(user?.lastName || '');
    setEditPhone(user?.phone || '');
    setEditAge(user?.age ? String(user.age) : '70');
    setEditAddress(user?.address?.city || user?.address?.district || 'Kandy');
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
      await updateUserProfile({
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        phone: editPhone.trim(),
        age: parsedAge,
        address: editAddress.trim(),
      });

      Alert.alert('Success', 'Personal details updated successfully');
      setShowEditModal(false);
    } catch (error) {
      Alert.alert('Update Error', error.message || 'Failed to update details');
    } finally {
      setUpdatingDetails(false);
    }
  };

  // --- Edit Interests Actions ---
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
      await updateUserProfile({
        interests: selectedInterests,
      });
      setShowInterestsModal(false);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update interests');
    } finally {
      setUpdatingInterests(false);
    }
  };

  // Render Interest Icon helper
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
      default:
        return <MaterialCommunityIcons name="account-heart-outline" size={size} color={iconColor} />;
    }
  };

  const userDisplayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Austin Siriwardhana';

  const userCity = user?.address?.city || user?.address?.district || 'Kandy';
  const userAgeDisplay = user?.age || 70;

  return {
    user,
    userDisplayName,
    userCity,
    userAgeDisplay,
    isVerified,
    refreshing,
    uploadingImage,
    onRefresh,
    // Profile photo modal & actions
    showImageActionsModal,
    setShowImageActionsModal,
    handlePickImage,
    handleDeleteImage,
    // Personal Details modal & actions
    showEditModal,
    setShowEditModal,
    editFirstName,
    setEditFirstName,
    editLastName,
    setEditLastName,
    editPhone,
    setEditPhone,
    editAge,
    setEditAge,
    editAddress,
    setEditAddress,
    updatingDetails,
    openEditModal,
    handleSavePersonalDetails,
    // Interests modal & actions
    showInterestsModal,
    setShowInterestsModal,
    selectedInterests,
    dbInterests,
    loadingInterests,
    updatingInterests,
    toggleInterestSelection,
    handleSaveInterests,
    renderInterestIcon,
    // Auth actions
    logout,
  };
}
