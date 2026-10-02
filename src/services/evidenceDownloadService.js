// src/services/evidenceDownloadService.js
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import client from '../api/client';
import { storage } from '../utils/storage';
import { showAlert } from '../utils/alert';

/**
 * Downloads a volunteer verification document (PDF or image) directly to the device
 * without web redirecting.
 *
 * @param {string} userId - ID of the volunteer
 * @param {number} fileIndex - Index of the evidence in volunteerVerification.evidenceFiles
 * @param {string} preferredFileName - Suggested filename
 * @param {string} fileType - 'pdf' or 'image'
 */
export const downloadVerificationEvidence = async (
  userId,
  fileIndex = 0,
  preferredFileName = 'verification_document.pdf',
  fileType = 'pdf'
) => {
  if (!userId) {
    showAlert('Error', 'Invalid volunteer ID.', [{ text: 'Close', style: 'cancel' }]);
    return;
  }

  showAlert('Downloading', 'Downloading document directly to your device...', [{ text: 'OK' }]);

  try {
    const isPdf = fileType === 'pdf' || preferredFileName.toLowerCase().endsWith('.pdf');
    const safeName = preferredFileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    // 1. Web Environment: Direct download via Blob and anchor click without navigating away
    if (Platform.OS === 'web') {
      const response = await client.get(
        `/auth/volunteer-verification/${userId}/download/${fileIndex}`,
        { responseType: 'blob' }
      );

      const mime = isPdf ? 'application/pdf' : 'image/jpeg';
      const blob = new Blob([response.data], { type: mime });
      const blobUrl = window.URL.createObjectURL(blob);

      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = safeName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(blobUrl);

      showAlert('Downloaded', `${safeName} has been downloaded to your Downloads folder.`, [
        { text: 'OK' },
      ]);
      return;
    }

    // 2. Native Mobile (Android & iOS): Download to file system and share/save directly
    const token = await storage.getToken();
    const downloadEndpoint = `${client.defaults.baseURL}/auth/volunteer-verification/${userId}/download/${fileIndex}`;
    const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
    const localUri = `${baseDir}${safeName}`;

    const downloadResult = await FileSystem.downloadAsync(downloadEndpoint, localUri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (downloadResult.status && downloadResult.status >= 400) {
      throw new Error(`Download failed with status ${downloadResult.status}`);
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(downloadResult.uri, {
        mimeType: isPdf ? 'application/pdf' : 'image/jpeg',
        dialogTitle: safeName,
        UTI: isPdf ? 'com.adobe.pdf' : 'public.jpeg',
      });
    } else {
      showAlert('Downloaded', `Saved to ${safeName}`, [{ text: 'OK' }]);
    }
  } catch (error) {
    console.error('Evidence download error:', error);
    showAlert(
      'Download Failed',
      'Could not download document directly to device. Please ensure network connectivity.',
      [{ text: 'Close', style: 'cancel' }]
    );
  }
};
