// src/components/common/AvatarActionModal.js
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Custom Avatar Options Modal (Upload / Remove / Cancel)
 * Works cross-platform on Mobile (iOS/Android) and React Native Web
 */
export default function AvatarActionModal({
  visible,
  onClose,
  onPickPhoto,
  onRemovePhoto,
  onSelectPick,
  onSelectRemove,
}) {
  if (!visible) return null;

  const handlePick = () => {
    onClose();
    const fn = onPickPhoto || onSelectPick;
    if (typeof fn === 'function') fn();
  };

  const handleRemove = () => {
    onClose();
    const fn = onRemovePhoto || onSelectRemove;
    if (typeof fn === 'function') fn();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              <View style={styles.iconHeader}>
                <Ionicons name="camera-outline" size={28} color="#1E40AF" />
              </View>
              <Text style={styles.title}>Update Profile Picture</Text>
              <Text style={styles.subtitle}>Select an option to manage your photo</Text>

              {/* Option 1: Choose New Photo */}
              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={0.75}
                onPress={handlePick}
              >
                <Ionicons name="image-outline" size={20} color="#1E40AF" style={{ marginRight: 10 }} />
                <Text style={styles.actionButtonText}>Choose New Photo</Text>
              </TouchableOpacity>

              {/* Option 2: Remove Photo */}
              <TouchableOpacity
                style={styles.removeButton}
                activeOpacity={0.75}
                onPress={handleRemove}
              >
                <Ionicons name="trash-outline" size={20} color="#DC2626" style={{ marginRight: 10 }} />
                <Text style={styles.removeButtonText}>Remove Current Photo</Text>
              </TouchableOpacity>

              {/* Option 3: Cancel */}
              <TouchableOpacity
                style={styles.cancelButton}
                activeOpacity={0.7}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconHeader: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#DBEAFE',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 10,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E40AF',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 10,
  },
  removeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});
