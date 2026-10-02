// src/components/volunteer/VolunteerVerificationModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Linking,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { showAlert } from '../../utils/alert';
import { submitVolunteerVerification } from '../../services/userService';
import { downloadVerificationEvidence } from '../../services/evidenceDownloadService';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB for high quality pictures
const MAX_PDF_BYTES = 2 * 1024 * 1024; // 2MB for PDF document

export default function VolunteerVerificationModal({ visible, onClose, user, onVerificationSuccess }) {
  const currentVerification = user?.volunteerVerification || { status: 'UNVERIFIED' };
  const isPending = currentVerification.status === 'PENDING';
  const isRejected = currentVerification.status === 'REJECTED';

  const getNormalizedType = (type) => {
    if (!type) return null;
    const clean = String(type).trim().toLowerCase();
    if (clean === 'nic') return 'NIC';
    if (clean === 'student id' || clean === 'student_id') return 'Student ID';
    if (clean === 'passport') return 'Passport';
    return type;
  };

  const registeredType =
    getNormalizedType(user?.volunteerIdType) ||
    getNormalizedType(
      currentVerification.credentialType && currentVerification.credentialType !== 'None'
        ? currentVerification.credentialType
        : null
    );

  const availableTypes =
    registeredType && ['NIC', 'Student ID', 'Passport'].includes(registeredType)
      ? [registeredType]
      : ['NIC', 'Student ID', 'Passport'];

  const [credentialType, setCredentialType] = useState(
    registeredType || availableTypes[0]
  );
  const [credentialNumber, setCredentialNumber] = useState(
    currentVerification.credentialNumber || user?.volunteerIdNumber || ''
  );

  useEffect(() => {
    if (registeredType && availableTypes.includes(registeredType)) {
      setCredentialType(registeredType);
    }
  }, [user?.volunteerIdType, currentVerification.credentialType]);

  // Slots according to credential type
  const [nicFront, setNicFront] = useState(null);
  const [nicBack, setNicBack] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [passportBio, setPassportBio] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);

  const [loading, setLoading] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  // Helper to safely launch camera and validate size (< 4MB)
  const captureCameraPhoto = async (label) => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.85,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets || !result.assets[0]) {
        return null;
      }

      const file = result.assets[0];
      const size = file.fileSize || file.size;
      if (size && size > MAX_IMAGE_BYTES) {
        showAlert(
          'Error',
          `${label} picture exceeds 4MB limit. Please retake.`,
          [{ text: 'Close', style: 'cancel' }]
        );
        return 'EXCEEDED';
      }

      return file;
    } catch {
      showAlert('Error', `Failed to open camera for ${label}.`, [
        { text: 'Close', style: 'cancel' },
      ]);
      return null;
    }
  };

  // Retake a single slot picture
  const handleRetakeSingle = async (slotName, label) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission Required', 'Camera permission is needed to capture evidence.', [
        { text: 'Close', style: 'cancel' },
      ]);
      return;
    }

    const photo = await captureCameraPhoto(label);
    if (!photo || photo === 'EXCEEDED') return;

    if (slotName === 'nicFront') setNicFront(photo);
    if (slotName === 'nicBack') setNicBack(photo);
    if (slotName === 'studentId') setStudentId(photo);
    if (slotName === 'passportBio') setPassportBio(photo);
  };

  // Guided Camera Flow: Sequentially captures required pictures while preserving previously taken pictures
  const handleSequentialCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission Required', 'Camera permission is needed to capture evidence.', [
        { text: 'Close', style: 'cancel' },
      ]);
      return;
    }

    if (credentialType === 'NIC') {
      let currentFront = nicFront;
      if (!currentFront) {
        const frontResult = await captureCameraPhoto('NIC Frontside');
        if (frontResult === 'EXCEEDED') return;
        if (!frontResult) return;
        setNicFront(frontResult);
        currentFront = frontResult;
      }

      // Automatically open camera for Step 2 if Backside is not yet taken
      if (!nicBack) {
        await new Promise((r) => setTimeout(r, 450));
        const backResult = await captureCameraPhoto('NIC Backside');
        if (backResult === 'EXCEEDED') return;
        if (!backResult) return;
        setNicBack(backResult);
      }
    } else if (credentialType === 'Student ID') {
      let currentFront = nicFront;
      if (!currentFront) {
        const front = await captureCameraPhoto('NIC Frontside');
        if (front === 'EXCEEDED') return;
        if (!front) return;
        setNicFront(front);
        currentFront = front;
      }

      let currentBack = nicBack;
      if (!currentBack) {
        await new Promise((r) => setTimeout(r, 450));
        const back = await captureCameraPhoto('NIC Backside');
        if (back === 'EXCEEDED') return;
        if (!back) return;
        setNicBack(back);
        currentBack = back;
      }

      if (!studentId) {
        await new Promise((r) => setTimeout(r, 450));
        const student = await captureCameraPhoto('University ID');
        if (student === 'EXCEEDED') return;
        if (!student) return;
        setStudentId(student);
      }
    } else if (credentialType === 'Passport') {
      if (!passportBio) {
        const pass = await captureCameraPhoto('Passport Biometric Data');
        if (pass === 'EXCEEDED') return;
        if (!pass) return;
        setPassportBio(pass);
      }
    }
  };

  // Pick PDF Document
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const doc = result.assets[0];
        const docSize = doc.size || doc.fileSize;
        if (docSize && docSize > MAX_PDF_BYTES) {
          showAlert(
            'Validation Error',
            'The selected PDF exceeds the 2MB limit. Please choose a smaller file.',
            [{ text: 'Close', style: 'cancel' }]
          );
          return;
        }
        setPdfDoc(doc);
      }
    } catch {
      showAlert('Error', 'Failed to pick document.', [{ text: 'Close', style: 'cancel' }]);
    }
  };

  // Append file to FormData cleanly across Web (Blob/File) and Native (React Native file object)
  const appendFileToFormData = async (formData, fieldName, asset, defaultFileName) => {
    if (Platform.OS === 'web') {
      if (asset.file) {
        formData.append(fieldName, asset.file, asset.name || defaultFileName);
      } else if (asset.uri) {
        try {
          const res = await fetch(asset.uri);
          const blob = await res.blob();
          formData.append(fieldName, blob, asset.name || defaultFileName);
        } catch {
          formData.append(fieldName, asset.uri);
        }
      }
    } else {
      formData.append(fieldName, {
        uri: Platform.OS === 'android' ? (asset.fileCopyUri || asset.uri) : asset.uri.replace('file://', ''),
        name: asset.name || defaultFileName,
        type: asset.mimeType || (defaultFileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
      });
    }
  };

  // Validate and Submit
  const handleSubmit = async () => {
    let hasImages = false;
    if (credentialType === 'NIC' && nicFront && nicBack) hasImages = true;
    if (credentialType === 'Student ID' && nicFront && nicBack && studentId) hasImages = true;
    if (credentialType === 'Passport' && passportBio) hasImages = true;

    if (!hasImages && !pdfDoc) {
      showAlert(
        'Incomplete Evidence',
        'Please complete the photo capture requirements or attach a valid PDF document.',
        [{ text: 'Close', style: 'cancel' }]
      );
      return;
    }

    const formData = new FormData();
    formData.append('credentialType', credentialType);
    formData.append('credentialNumber', credentialNumber);

    const categories = [];

    if (nicFront) {
      await appendFileToFormData(formData, 'evidenceFiles', nicFront, 'nic_front.jpg');
      categories.push('nic_front');
    }
    if (nicBack) {
      await appendFileToFormData(formData, 'evidenceFiles', nicBack, 'nic_back.jpg');
      categories.push('nic_back');
    }
    if (studentId) {
      await appendFileToFormData(formData, 'evidenceFiles', studentId, 'student_id_front.jpg');
      categories.push('student_id_front');
    }
    if (passportBio) {
      await appendFileToFormData(formData, 'evidenceFiles', passportBio, 'passport_bio.jpg');
      categories.push('passport_bio');
    }
    if (pdfDoc) {
      await appendFileToFormData(
        formData,
        'evidenceFiles',
        pdfDoc,
        pdfDoc.name || 'verification_document.pdf'
      );
      categories.push('document_pdf');
    }

    formData.append('categories', JSON.stringify(categories));

    try {
      setLoading(true);
      const res = await submitVolunteerVerification(formData);
      showAlert(
        'Submitted',
        'Evidence uploaded successfully. Status is now PENDING review.',
        [{ text: 'OK' }]
      );
      if (onVerificationSuccess) onVerificationSuccess(res.data.volunteerVerification);
      onClose();
    } catch (err) {
      showAlert(
        'Upload Failed',
        err?.response?.data?.message || 'Could not upload evidence.',
        [{ text: 'Close', style: 'cancel' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Volunteer download verification document helper (direct device download)
  const handleDownloadEvidence = async (file, fileIndex) => {
    const ext = file.fileType === 'pdf' ? 'pdf' : 'jpg';
    const targetFileName =
      file.originalName || `${file.documentCategory || 'evidence'}.${ext}`;

    await downloadVerificationEvidence(
      user?._id,
      fileIndex,
      targetFileName,
      file.fileType
    );
  };

  // Compute camera progress
  const getCameraStatus = () => {
    if (credentialType === 'NIC') {
      const count = (nicFront ? 1 : 0) + (nicBack ? 1 : 0);
      return { count, total: 2, complete: count === 2 };
    }
    if (credentialType === 'Student ID') {
      const count = (nicFront ? 1 : 0) + (nicBack ? 1 : 0) + (studentId ? 1 : 0);
      return { count, total: 3, complete: count === 3 };
    }
    if (credentialType === 'Passport') {
      const count = passportBio ? 1 : 0;
      return { count, total: 1, complete: count === 1 };
    }
    return { count: 0, total: 0, complete: false };
  };

  const cameraStatus = getCameraStatus();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Volunteer ID Verification</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Read-Only State for PENDING */}
          {isPending && (
            <View style={styles.pendingCard}>
              <Ionicons name="time-outline" size={48} color="#D97706" />
              <Text style={styles.pendingTitle}>Verification Pending</Text>
              <Text style={styles.pendingDesc}>
                Your verification documents have been submitted and are currently awaiting administrative review.
              </Text>

              <Text style={styles.subHeading}>Uploaded Evidence:</Text>
              {currentVerification.evidenceFiles?.map((file, idx) => (
                <View key={idx} style={styles.evidenceItem}>
                  <Ionicons
                    name={file.fileType === 'pdf' ? 'document-text-outline' : 'image-outline'}
                    size={22}
                    color="#0284C7"
                  />
                  <Text style={styles.evidenceName} numberOfLines={1}>
                    {file.originalName || `${file.documentCategory}.${file.fileType === 'pdf' ? 'pdf' : 'jpg'}`}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity onPress={() => Linking.openURL(file.url)}>
                      <Text style={styles.viewLink}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDownloadEvidence(file, idx)}>
                      <Text style={[styles.viewLink, { color: '#16A34A' }]}>Download</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Form for UNVERIFIED or REJECTED */}
          {!isPending && (
            <>
              {isRejected && (
                <View style={styles.rejectedBanner}>
                  <Ionicons name="alert-circle" size={24} color="#DC2626" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rejectedTitle}>Verification Rejected</Text>
                    <Text style={styles.rejectedReason}>{currentVerification.rejectionReason || 'Document did not meet verification criteria.'}</Text>
                    <Text style={styles.rejectedPrompt}>Please re-upload clear and correct evidence below.</Text>
                  </View>
                </View>
              )}

              <Text style={styles.label}>
                {availableTypes.length === 1 ? 'Volunteer Credential Type' : 'Select Verification Type'}
              </Text>
              <View style={styles.typeSelector}>
                {availableTypes.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeBtn, credentialType === t && styles.typeBtnActive, availableTypes.length === 1 && { flex: 1 }]}
                    onPress={() => {
                      if (availableTypes.length > 1) {
                        setCredentialType(t);
                        setNicFront(null);
                        setNicBack(null);
                        setStudentId(null);
                        setPassportBio(null);
                      }
                    }}
                    activeOpacity={availableTypes.length === 1 ? 1 : 0.7}
                  >
                    <Text style={[styles.typeText, credentialType === t && styles.typeTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {credentialNumber ? (
                <View style={styles.registeredInfoBox}>
                  <Ionicons name="card-outline" size={16} color="#0369A1" />
                  <Text style={styles.registeredInfoText}>
                    Registered ID Number: <Text style={{ fontWeight: '700' }}>{credentialNumber}</Text>
                  </Text>
                </View>
              ) : null}
              {credentialType === 'Student ID' && user?.educationalInstitution ? (
                <View style={[styles.registeredInfoBox, { marginTop: -8 }]}>
                  <Ionicons name="school-outline" size={16} color="#0369A1" />
                  <Text style={styles.registeredInfoText}>
                    Institution: <Text style={{ fontWeight: '700' }}>{user.educationalInstitution}</Text>
                  </Text>
                </View>
              ) : null}

              {/* Option 1: Guided Camera Capture */}
              <View style={styles.captureBox}>
                <View style={styles.captureHeaderRow}>
                  <Text style={styles.captureTitle}>Option 1: Guided Camera Capture</Text>
                  {cameraStatus.total > 0 && cameraStatus.count > 0 && (
                    <Text style={styles.progressBadge}>
                      {cameraStatus.count} of {cameraStatus.total} captured
                    </Text>
                  )}
                </View>
                <Text style={styles.captureHint}>
                  {credentialType === 'NIC' && 'Takes Frontside, then Backside photo of NIC (Max 4MB each).'}
                  {credentialType === 'Student ID' && 'Takes NIC Frontside, Backside, and University ID (Max 4MB each).'}
                  {credentialType === 'Passport' && 'Takes biometric data page photo (Max 4MB).'}
                </Text>

                <TouchableOpacity style={styles.cameraActionBtn} onPress={handleSequentialCamera}>
                  <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.cameraActionText}>
                    {cameraStatus.complete
                      ? 'Retake All Camera Photos'
                      : cameraStatus.count > 0
                      ? `Continue Camera Flow (${cameraStatus.count}/${cameraStatus.total})`
                      : 'Open Camera Flow'}
                  </Text>
                </TouchableOpacity>

                {/* Captured Previews with View, Remove, and Retake options */}
                <View style={styles.previewsRow}>
                  {nicFront && (
                    <View style={styles.previewCard}>
                      <TouchableOpacity onPress={() => setFullscreenImage(nicFront.uri)} activeOpacity={0.85}>
                        <Image source={{ uri: nicFront.uri }} style={styles.thumb} />
                        <View style={styles.enlargeBadge}>
                          <Ionicons name="search" size={12} color="#FFFFFF" />
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeCardBtn}
                        onPress={() => setNicFront(null)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close-circle" size={18} color="#EF4444" />
                      </TouchableOpacity>
                      <Text style={styles.thumbLabel}>NIC Front</Text>
                      <TouchableOpacity onPress={() => handleRetakeSingle('nicFront', 'NIC Frontside')} style={styles.retakeSlotBtn}>
                        <Text style={styles.retakeSlotText}>Retake</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {nicBack && (
                    <View style={styles.previewCard}>
                      <TouchableOpacity onPress={() => setFullscreenImage(nicBack.uri)} activeOpacity={0.85}>
                        <Image source={{ uri: nicBack.uri }} style={styles.thumb} />
                        <View style={styles.enlargeBadge}>
                          <Ionicons name="search" size={12} color="#FFFFFF" />
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeCardBtn}
                        onPress={() => setNicBack(null)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close-circle" size={18} color="#EF4444" />
                      </TouchableOpacity>
                      <Text style={styles.thumbLabel}>NIC Back</Text>
                      <TouchableOpacity onPress={() => handleRetakeSingle('nicBack', 'NIC Backside')} style={styles.retakeSlotBtn}>
                        <Text style={styles.retakeSlotText}>Retake</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {studentId && (
                    <View style={styles.previewCard}>
                      <TouchableOpacity onPress={() => setFullscreenImage(studentId.uri)} activeOpacity={0.85}>
                        <Image source={{ uri: studentId.uri }} style={styles.thumb} />
                        <View style={styles.enlargeBadge}>
                          <Ionicons name="search" size={12} color="#FFFFFF" />
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeCardBtn}
                        onPress={() => setStudentId(null)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close-circle" size={18} color="#EF4444" />
                      </TouchableOpacity>
                      <Text style={styles.thumbLabel}>Uni ID</Text>
                      <TouchableOpacity onPress={() => handleRetakeSingle('studentId', 'University ID')} style={styles.retakeSlotBtn}>
                        <Text style={styles.retakeSlotText}>Retake</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {passportBio && (
                    <View style={styles.previewCard}>
                      <TouchableOpacity onPress={() => setFullscreenImage(passportBio.uri)} activeOpacity={0.85}>
                        <Image source={{ uri: passportBio.uri }} style={styles.thumb} />
                        <View style={styles.enlargeBadge}>
                          <Ionicons name="search" size={12} color="#FFFFFF" />
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeCardBtn}
                        onPress={() => setPassportBio(null)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close-circle" size={18} color="#EF4444" />
                      </TouchableOpacity>
                      <Text style={styles.thumbLabel}>Passport</Text>
                      <TouchableOpacity onPress={() => handleRetakeSingle('passportBio', 'Passport Biometric Data')} style={styles.retakeSlotBtn}>
                        <Text style={styles.retakeSlotText}>Retake</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              {/* Option 2: Device PDF Upload */}
              <View style={styles.captureBox}>
                <Text style={styles.captureTitle}>Option 2: Device PDF Upload</Text>
                <Text style={styles.captureHint}>Upload a single or multi-page PDF proof (Max 2MB).</Text>
                <TouchableOpacity style={styles.uploadDocBtn} onPress={handlePickDocument}>
                  <Ionicons name="cloud-upload-outline" size={22} color="#0284C7" />
                  <Text style={styles.uploadDocText} numberOfLines={1}>
                    {pdfDoc ? pdfDoc.name : 'Select PDF Document from Storage'}
                  </Text>
                  {pdfDoc && (
                    <TouchableOpacity onPress={() => setPdfDoc(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Evidence for Review</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>

        {/* Fullscreen Preview Modal for Volunteers */}
        {fullscreenImage && (
          <Modal visible={!!fullscreenImage} transparent animationType="fade" onRequestClose={() => setFullscreenImage(null)}>
            <View style={styles.fullscreenBackdrop}>
              <TouchableOpacity
                style={styles.closeFullBtn}
                onPress={() => setFullscreenImage(null)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              <Image source={{ uri: fullscreenImage }} style={styles.fullscreenImg} resizeMode="contain" />
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 45 : 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  closeBtn: { padding: 4 },
  content: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  registeredInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  registeredInfoText: {
    fontSize: 12,
    color: '#0369A1',
    flex: 1,
  },
  typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  typeText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  typeTextActive: { color: '#FFFFFF' },
  captureBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  captureHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  captureTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  progressBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  captureHint: { fontSize: 12, color: '#64748B', marginBottom: 12 },
  cameraActionBtn: {
    flexDirection: 'row',
    backgroundColor: '#0284C7',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cameraActionText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  previewsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 },
  previewCard: {
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#F1F5F9',
    padding: 6,
    borderRadius: 8,
  },
  thumb: { width: 85, height: 65, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1' },
  enlargeBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 10,
    padding: 3,
  },
  removeCardBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    zIndex: 10,
  },
  thumbLabel: { fontSize: 11, color: '#334155', fontWeight: '600', marginTop: 4 },
  retakeSlotBtn: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
  retakeSlotText: { fontSize: 10, color: '#0369A1', fontWeight: '600' },
  uploadDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  uploadDocText: { fontSize: 13, color: '#0369A1', fontWeight: '500', flex: 1 },
  submitBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  pendingCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  pendingTitle: { fontSize: 18, fontWeight: '700', color: '#854D0E', marginTop: 10 },
  pendingDesc: { fontSize: 13, color: '#713F12', textAlign: 'center', marginTop: 6, marginBottom: 20 },
  subHeading: { fontSize: 14, fontWeight: '600', color: '#1E293B', alignSelf: 'flex-start', marginBottom: 8 },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 8,
  },
  evidenceName: { flex: 1, marginLeft: 10, fontSize: 13, color: '#334155' },
  viewLink: { color: '#0284C7', fontWeight: '600', fontSize: 13 },
  rejectedBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 16,
  },
  rejectedTitle: { fontSize: 14, fontWeight: '700', color: '#991B1B' },
  rejectedReason: { fontSize: 13, color: '#B91C1C', marginTop: 2 },
  rejectedPrompt: { fontSize: 12, color: '#7F1D1D', marginTop: 6, fontWeight: '500' },
  fullscreenBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImg: { width: '92%', height: '80%' },
  closeFullBtn: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 45 : 35,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
  },
});
