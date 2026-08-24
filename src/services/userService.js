// src/services/userService.js
import client from '../api/client';
import { Platform } from 'react-native';

/**
 * Fetch current authenticated user's profile from database
 */
export const getProfile = async () => {
  const response = await client.get('/auth/me');
  return response.data;
};

/**
 * Update user personal details, age, address, and interests
 * @param {Object} profileData { firstName, lastName, phone, age, address, interests }
 */
export const updateProfile = async (profileData) => {
  const response = await client.put('/auth/profile', profileData);
  return response.data;
};

/**
 * Upload or replace user profile picture on Cloudinary & MongoDB
 * @param {Object} imageAsset Image asset from expo-image-picker
 */
export const uploadProfilePicture = async (imageAsset) => {
  // 1. Prefer Base64 if available (fast and reliable on mobile/web)
  if (imageAsset.base64) {
    const mimeType = imageAsset.mimeType || 'image/jpeg';
    const base64Uri = `data:${mimeType};base64,${imageAsset.base64}`;
    const response = await client.put('/auth/profile-picture', {
      imageBase64: base64Uri,
    });
    return response.data;
  }

  // 2. Fallback to multipart FormData
  const uri = imageAsset.uri;
  const uriParts = uri.split('.');
  const fileType = uriParts[uriParts.length - 1] || 'jpg';

  const formData = new FormData();
  formData.append('profilePicture', {
    uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
    name: `profile_${Date.now()}.${fileType}`,
    type: imageAsset.mimeType || `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
  });

  const response = await client.put('/auth/profile-picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Delete user profile picture from Cloudinary & MongoDB
 */
export const deleteProfilePicture = async () => {
  const response = await client.delete('/auth/profile-picture');
  return response.data;
};
