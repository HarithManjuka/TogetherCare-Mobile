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

const MAX_BYTES = 2 * 1024 * 1024; // 2MB

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

  // Take camera pictures sequentially
  const handleSequentialCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission Required', 'Camera permission is needed to capture evidence.');
      return;
    }

    if (credentialType === 'NIC') {
      showAlert('Step 1 of 2', 'Please take a clear picture of the NIC Frontside.', [
        {
          text: 'Open Camera',
          onPress: async () => {
            const frontResult = await ImagePicker.launchCameraAsync({ quality: 0.8 });
            if (!frontResult.canceled && frontResult.assets && frontResult.assets[0]) {
              const file = frontResult.assets[0];
              const size = file.fileSize || file.size;
              if (size && size > MAX_BYTES) {
                showAlert('Error', 'Frontside picture exceeds 2MB limit. Please retake.');
                return;
              }
              setNicFront(file);

              // Step 2
              setTimeout(() => {
                showAlert('Step 2 of 2', 'Now take a clear picture of the NIC Backside.', [
                  {
                    text: 'Open Camera',
                    onPress: async () => {
                      const backResult = await ImagePicker.launchCameraAsync({ quality: 0.8 });
                      if (!backResult.canceled && backResult.assets && backResult.assets[0]) {
                        const backFile = backResult.assets[0];
                        const backSize = backFile.fileSize || backFile.size;
                        if (backSize && backSize > MAX_BYTES) {
                          showAlert('Error', 'Backside picture exceeds 2MB limit. Please retake.');
                          return;
                        }
                        setNicBack(backFile);
                      }
                    },
                  },
                ]);
              }, 400);
            }
          },
        },
      ]);
    } else if (credentialType === 'Student ID') {
      showAlert('Step 1 of 3', 'Please take a picture of your NIC Frontside.', [
        {
          text: 'Open Camera',
          onPress: async () => {
            const front = await ImagePicker.launchCameraAsync({ quality: 0.8 });
            if (!front.canceled && front.assets && front.assets[0]) {
              const frontFile = front.assets[0];
              const size = frontFile.fileSize || frontFile.size;
              if (size && size > MAX_BYTES) {
                showAlert('Error', 'Frontside picture exceeds 2MB limit. Please retake.');
                return;
              }
              setNicFront(frontFile);

              setTimeout(() => {
                showAlert('Step 2 of 3', 'Take a picture of your NIC Backside.', [
                  {
                    text: 'Open Camera',
                    onPress: async () => {
                      const back = await ImagePicker.launchCameraAsync({ quality: 0.8 });
                      if (!back.canceled && back.assets && back.assets[0]) {
                        const backFile = back.assets[0];
                        const backSize = backFile.fileSize || backFile.size;
                        if (backSize && backSize > MAX_BYTES) {
                          showAlert('Error', 'Backside picture exceeds 2MB limit. Please retake.');
                          return;
                        }
                        setNicBack(backFile);

                        setTimeout(() => {
                          showAlert('Step 3 of 3', 'Take a picture of your University ID Frontside.', [
                            {
                              text: 'Open Camera',
                              onPress: async () => {
                                const student = await ImagePicker.launchCameraAsync({ quality: 0.8 });
                                if (!student.canceled && student.assets && student.assets[0]) {
                                  const studentFile = student.assets[0];
                                  const studentSize = studentFile.fileSize || studentFile.size;
                                  if (studentSize && studentSize > MAX_BYTES) {
                                    showAlert('Error', 'University ID picture exceeds 2MB limit. Please retake.');
                                    return;
                                  }
                                  setStudentId(studentFile);
                                }
                              },
                            },
                          ]);
                        }, 400);
                      }
                    },
                  },
                ]);
              }, 400);
            }
          },
        },
      ]);
    } else if (credentialType === 'Passport') {
      showAlert('Step 1 of 1', 'Please capture the Passport Biometric Data page.', [
        {
          text: 'Open Camera',
          onPress: async () => {
            const pass = await ImagePicker.launchCameraAsync({ quality: 0.8 });
            if (!pass.canceled && pass.assets && pass.assets[0]) {
              const passFile = pass.assets[0];
              const size = passFile.fileSize || passFile.size;
              if (size && size > MAX_BYTES) {
                showAlert('Error', 'Picture exceeds 2MB limit. Please retake.');
                return;
              }
              setPassportBio(passFile);
            }
          },
        },
      ]);
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
        if (docSize && docSize > MAX_BYTES) {
          showAlert('Validation Error', 'The selected PDF exceeds the 2MB limit. Please choose a smaller file.');
          return;
        }
        setPdfDoc(doc);
      }
    } catch {
      showAlert('Error', 'Failed to pick document.');
    }
  };

  // Validate and Submit
  const handleSubmit = async () => {
    let hasImages = false;
    if (credentialType === 'NIC' && nicFront && nicBack) hasImages = true;
    if (credentialType === 'Student ID' && nicFront && nicBack && studentId) hasImages = true;
    if (credentialType === 'Passport' && passportBio) hasImages = true;

    if (!hasImages && !pdfDoc) {
      showAlert('Incomplete Evidence', 'Please complete the photo capture requirements or attach a valid PDF document.');
      return;
    }

    const formData = new FormData();
    formData.append('credentialType', credentialType);
    formData.append('credentialNumber', credentialNumber);

    const categories = [];

    if (nicFront) {
      formData.append('evidenceFiles', {
        uri: Platform.OS === 'android' ? nicFront.uri : nicFront.uri.replace('file://', ''),
        name: 'nic_front.jpg',
        type: 'image/jpeg',
      });
      categories.push('nic_front');
    }
    if (nicBack) {
      formData.append('evidenceFiles', {
        uri: Platform.OS === 'android' ? nicBack.uri : nicBack.uri.replace('file://', ''),
        name: 'nic_back.jpg',
        type: 'image/jpeg',
      });
      categories.push('nic_back');
    }
    if (studentId) {
      formData.append('evidenceFiles', {
        uri: Platform.OS === 'android' ? studentId.uri : studentId.uri.replace('file://', ''),
        name: 'student_id_front.jpg',
        type: 'image/jpeg',
      });
      categories.push('student_id_front');
    }
    if (passportBio) {
      formData.append('evidenceFiles', {
        uri: Platform.OS === 'android' ? passportBio.uri : passportBio.uri.replace('file://', ''),
        name: 'passport_bio.jpg',
        type: 'image/jpeg',
      });
      categories.push('passport_bio');
    }
    if (pdfDoc) {
      formData.append('evidenceFiles', {
        uri: Platform.OS === 'android' ? pdfDoc.uri : pdfDoc.uri.replace('file://', ''),
        name: pdfDoc.name || 'verification_document.pdf',
        type: 'application/pdf',
      });
      categories.push('document_pdf');
    }

    formData.append('categories', JSON.stringify(categories));

    try {
      setLoading(true);
      const res = await submitVolunteerVerification(formData);
      showAlert('Submitted', 'Evidence uploaded successfully. Status is now PENDING review.');
      if (onVerificationSuccess) onVerificationSuccess(res.data.volunteerVerification);
      onClose();
    } catch (err) {
      showAlert('Upload Failed', err?.response?.data?.message || 'Could not upload evidence.');
    } finally {
      setLoading(false);
    }
  };

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
                  <TouchableOpacity onPress={() => Linking.openURL(file.url)}>
                    <Text style={styles.viewLink}>View</Text>
                  </TouchableOpacity>
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

              <View style={styles.captureBox}>
                <Text style={styles.captureTitle}>Option 1: Guided Camera Capture</Text>
                <Text style={styles.captureHint}>
                  {credentialType === 'NIC' && 'Takes Frontside, then Backside photo of NIC.'}
                  {credentialType === 'Student ID' && 'Takes NIC Frontside, Backside, and University ID.'}
                  {credentialType === 'Passport' && 'Takes biometric data page photo.'}
                </Text>
                <TouchableOpacity style={styles.cameraActionBtn} onPress={handleSequentialCamera}>
                  <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.cameraActionText}>Open Camera Flow</Text>
                </TouchableOpacity>

                {/* Previews */}
                <View style={styles.previewsRow}>
                  {nicFront && (
                    <View style={styles.previewCard}>
                      <Image source={{ uri: nicFront.uri }} style={styles.thumb} />
                      <Text style={styles.thumbLabel}>NIC Front</Text>
                    </View>
                  )}
                  {nicBack && (
                    <View style={styles.previewCard}>
                      <Image source={{ uri: nicBack.uri }} style={styles.thumb} />
                      <Text style={styles.thumbLabel}>NIC Back</Text>
                    </View>
                  )}
                  {studentId && (
                    <View style={styles.previewCard}>
                      <Image source={{ uri: studentId.uri }} style={styles.thumb} />
                      <Text style={styles.thumbLabel}>Uni ID</Text>
                    </View>
                  )}
                  {passportBio && (
                    <View style={styles.previewCard}>
                      <Image source={{ uri: passportBio.uri }} style={styles.thumb} />
                      <Text style={styles.thumbLabel}>Passport</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.captureBox}>
                <Text style={styles.captureTitle}>Option 2: Device PDF Upload</Text>
                <Text style={styles.captureHint}>Upload a single or multi-page PDF proof (Max 2MB).</Text>
                <TouchableOpacity style={styles.uploadDocBtn} onPress={handlePickDocument}>
                  <Ionicons name="cloud-upload-outline" size={22} color="#0284C7" />
                  <Text style={styles.uploadDocText} numberOfLines={1}>
                    {pdfDoc ? pdfDoc.name : 'Select PDF Document from Storage'}
                  </Text>
                  {pdfDoc && (
                    <TouchableOpacity onPress={() => setPdfDoc(null)}>
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
  captureTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
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
  previewsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  previewCard: { alignItems: 'center' },
  thumb: { width: 80, height: 60, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1' },
  thumbLabel: { fontSize: 11, color: '#475569', marginTop: 4 },
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
});
