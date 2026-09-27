// src/components/admin/AdminEvidenceReviewModal.js
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Linking,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { showAlert } from '../../utils/alert';
import { reviewVolunteerVerification } from '../../services/adminUserService';

export default function AdminEvidenceReviewModal({ visible, onClose, volunteerUser, onReviewCompleted }) {
  const verification = volunteerUser?.volunteerVerification || {};
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [rejectDialogVisible, setRejectDialogVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);

  const volunteerDisplayName =
    volunteerUser?.name ||
    `${volunteerUser?.firstName || ''} ${volunteerUser?.lastName || ''}`.trim() ||
    'Volunteer';

  // PDF Download with explicit naming: volunteer_<name>_<verifyType>.pdf
  const handleDownloadPdf = async (pdfUrl) => {
    try {
      const sanitizedName = volunteerDisplayName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
      const verifyType = (
        verification.credentialType ||
        volunteerUser?.volunteerIdType ||
        'ID'
      ).replace(/\s+/g, '_');
      const targetFileName = `volunteer_${sanitizedName}_${verifyType}.pdf`;

      const localUri = `${FileSystem.documentDirectory}${targetFileName}`;

      showAlert('Downloading', 'Downloading verification document...');
      const downloadResult = await FileSystem.downloadAsync(pdfUrl, localUri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: targetFileName,
        });
      } else {
        Linking.openURL(pdfUrl);
      }
    } catch {
      Linking.openURL(pdfUrl);
    }
  };

  const handleApprove = () => {
    showAlert('Confirm Approval', 'Are you sure you want to verify and approve this volunteer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        style: 'default',
        onPress: async () => {
          try {
            setLoading(true);
            const res = await reviewVolunteerVerification(volunteerUser._id, { action: 'approve' });
            showAlert('Success', 'Volunteer verified successfully.');
            if (onReviewCompleted) onReviewCompleted(res.data.user);
            onClose();
          } catch (err) {
            showAlert('Error', err?.response?.data?.message || 'Approval failed.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      showAlert('Required', 'Please enter a rejection reason.');
      return;
    }

    try {
      setLoading(true);
      const res = await reviewVolunteerVerification(volunteerUser._id, {
        action: 'reject',
        rejectionReason,
      });
      showAlert('Rejected', 'Verification has been rejected.');
      setRejectDialogVisible(false);
      if (onReviewCompleted) onReviewCompleted(res.data.user);
      onClose();
    } catch (err) {
      showAlert('Error', err?.response?.data?.message || 'Rejection failed.');
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
          <Text style={styles.headerTitle}>Review Evidence</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Volunteer Summary */}
          <View style={styles.infoCard}>
            <Text style={styles.volunteerName}>{volunteerDisplayName}</Text>
            <Text style={styles.credentialDetails}>
              {verification.credentialType || volunteerUser?.volunteerIdType || 'ID Document'} | Number:{' '}
              {verification.credentialNumber || volunteerUser?.volunteerIdNumber || 'N/A'}
            </Text>
            <Text style={styles.statusBadge}>
              Status: {(verification.status || volunteerUser?.verificationBadgeStatus || 'UNVERIFIED').toUpperCase()}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Uploaded Evidence Files</Text>

          {(!verification.evidenceFiles || verification.evidenceFiles.length === 0) && (
            <Text style={styles.emptyText}>No files attached.</Text>
          )}

          {verification.evidenceFiles?.map((file, idx) => (
            <View key={idx} style={styles.evidenceCard}>
              <View style={styles.cardHeader}>
                <Ionicons
                  name={file.fileType === 'pdf' ? 'document-text-outline' : 'image-outline'}
                  size={18}
                  color="#1E40AF"
                />
                <Text style={styles.cardTitle}>{file.documentCategory?.toUpperCase()}</Text>
              </View>

              {file.fileType === 'image' ? (
                <TouchableOpacity onPress={() => setFullscreenImage(file.url)} activeOpacity={0.85}>
                  <Image source={{ uri: file.url }} style={styles.evidenceImage} resizeMode="cover" />
                  <Text style={styles.tapToEnlarge}>🔍 Tap to view full screen</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.pdfDownloadBtn} onPress={() => handleDownloadPdf(file.url)}>
                  <Ionicons name="cloud-download-outline" size={20} color="#0369A1" />
                  <Text style={styles.pdfDownloadText}>Download & Review PDF</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => setRejectDialogVisible(true)}
            disabled={loading}
          >
            <Text style={styles.btnText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={handleApprove}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.btnText}>Approve</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Fullscreen Image Modal */}
        {fullscreenImage && (
          <Modal visible={!!fullscreenImage} transparent animationType="fade" onRequestClose={() => setFullscreenImage(null)}>
            <View style={styles.fullscreenBackdrop}>
              <TouchableOpacity
                style={styles.closeFullBtn}
                onPress={() => setFullscreenImage(null)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close-circle" size={36} color="#FFFFFF" />
              </TouchableOpacity>
              <Image source={{ uri: fullscreenImage }} style={styles.fullImage} resizeMode="contain" />
            </View>
          </Modal>
        )}

        {/* Reject Reason Dialog */}
        <Modal
          visible={rejectDialogVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setRejectDialogVisible(false)}
        >
          <View style={styles.dialogBackdrop}>
            <View style={styles.dialogCard}>
              <Text style={styles.dialogTitle}>Reason for Rejection</Text>
              <TextInput
                style={styles.dialogInput}
                placeholder="Explain why the evidence is rejected..."
                placeholderTextColor="#94A3B8"
                value={rejectionReason}
                onChangeText={setRejectionReason}
                multiline
                numberOfLines={3}
              />
              <View style={styles.dialogActions}>
                <TouchableOpacity
                  style={styles.dialogCancel}
                  onPress={() => setRejectDialogVisible(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dialogConfirm}
                  onPress={handleConfirmReject}
                >
                  <Text style={styles.confirmText}>Submit Rejection</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  infoCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 16 },
  volunteerName: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  credentialDetails: { fontSize: 13, color: '#475569', marginTop: 4 },
  statusBadge: { fontSize: 12, fontWeight: '600', color: '#0284C7', marginTop: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 10 },
  emptyText: { color: '#64748B', fontStyle: 'italic' },
  evidenceCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#334155' },
  evidenceImage: { width: '100%', height: 180, borderRadius: 8 },
  tapToEnlarge: { fontSize: 12, color: '#0284C7', textAlign: 'center', marginTop: 6 },
  pdfDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
  },
  pdfDownloadText: { color: '#0369A1', fontWeight: '600', fontSize: 13 },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  approveBtn: { backgroundColor: '#16A34A' },
  rejectBtn: { backgroundColor: '#DC2626' },
  btnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  fullscreenBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
  closeFullBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  fullImage: { width: '100%', height: '80%' },
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  dialogCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20 },
  dialogTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  dialogInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    textAlignVertical: 'top',
    fontSize: 13,
  },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  dialogCancel: { padding: 10 },
  dialogConfirm: { backgroundColor: '#DC2626', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  cancelText: { color: '#64748B', fontWeight: '600' },
  confirmText: { color: '#FFFFFF', fontWeight: '600' },
});
