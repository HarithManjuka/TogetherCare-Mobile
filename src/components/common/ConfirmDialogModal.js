// src/components/common/ConfirmDialogModal.js
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

/**
 * Universal In-App Confirmation / Alert Modal
 * Replaces browser's default window.alert / window.confirm with a beautiful in-app popup.
 */
export default function ConfirmDialogModal({
  visible,
  onClose,
  onConfirm,
  title = 'Confirmation',
  message = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // 'warning' | 'success' | 'danger' | 'info'
  loading = false,
  singleButton = false,
}) {
  if (!visible) return null;

  const getTheme = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          iconColor: '#16A34A',
          bgColor: '#DCFCE7',
          btnColor: '#16A34A',
        };
      case 'danger':
        return {
          icon: 'alert-circle',
          iconColor: '#DC2626',
          bgColor: '#FEE2E2',
          btnColor: '#DC2626',
        };
      case 'info':
        return {
          icon: 'information-circle',
          iconColor: '#2563EB',
          bgColor: '#DBEAFE',
          btnColor: '#2563EB',
        };
      case 'warning':
      default:
        return {
          icon: 'warning',
          iconColor: '#D97706',
          bgColor: '#FEF3C7',
          btnColor: COLORS.secondary || '#0D9488',
        };
    }
  };

  const theme = getTheme();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={loading ? undefined : onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              {/* Icon Circle */}
              <View style={[styles.iconCircle, { backgroundColor: theme.bgColor }]}>
                <Ionicons name={theme.icon} size={32} color={theme.iconColor} />
              </View>

              {/* Title & Message */}
              <Text style={styles.title}>{title}</Text>
              {message ? <Text style={styles.message}>{message}</Text> : null}

              {/* Action Buttons */}
              <View style={styles.buttonRow}>
                {!singleButton && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    activeOpacity={0.7}
                    onPress={onClose}
                    disabled={loading}
                  >
                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    { backgroundColor: theme.btnColor },
                    singleButton && styles.singleConfirmButton,
                  ]}
                  activeOpacity={0.8}
                  onPress={onConfirm || onClose}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmButtonText}>{confirmText}</Text>
                  )}
                </TouchableOpacity>
              </View>
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
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  confirmButton: {
    flex: 1.3,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  singleConfirmButton: {
    flex: 1,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
