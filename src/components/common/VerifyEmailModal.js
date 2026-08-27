// src/components/common/VerifyEmailModal.js
import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';

export default function VerifyEmailModal({ visible, onClose, email, onVerifiedSuccess }) {
  const [step, setStep] = useState(1); // 1: Send Request, 2: Enter OTP, 3: Success
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputs = useRef([]);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (visible) {
      setStep(1);
      setOtp(['', '', '', '']);
    }
  }, [visible]);

  // Request Code
  const handleSendOtp = async () => {
    try {
      setLoading(true);
      await client.post('/auth/send-email-verification-otp');
      setStep(2);
      setResendCooldown(60);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to dispatch verification code');
    } finally {
      setLoading(false);
    }
  };

  // Handle Digit Input
  const handleOtpChange = (text, index) => {
    const cleanChar = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleanChar;
    setOtp(newOtp);

    if (cleanChar && index < 3) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  // Handle Backspace
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  // Submit Code
  const handleVerifyOtp = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < 4) {
      Alert.alert('Incomplete Code', 'Please enter all 4 digits of the code');
      return;
    }

    try {
      setLoading(true);
      const res = await client.post('/auth/verify-profile-email', { otp: fullOtp });
      setStep(3);
      if (onVerifiedSuccess) {
        onVerifiedSuccess(res.data.user);
      }
    } catch (error) {
      Alert.alert('Invalid Code', error.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={styles.modalContainer}>
          
          {/* Close Button */}
          {step !== 3 && (
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          )}

          {/* STEP 1: Prompt to Send Verification Code */}
          {step === 1 && (
            <View style={styles.contentBox}>
              <View style={styles.iconCircle}>
                <Ionicons name="mail-unread-outline" size={36} color="#1E40AF" />
              </View>
              <Text style={styles.title}>Verify Your Email</Text>
              <Text style={styles.description}>
                We will send a secure 4-digit code to:{'\n'}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleSendOtp} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Send Verification Code</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Enter 4-Digit Code */}
          {step === 2 && (
            <View style={styles.contentBox}>
              <View style={styles.iconCircle}>
                <Ionicons name="key-outline" size={32} color="#1E40AF" />
              </View>
              <Text style={styles.title}>Enter 4-Digit Code</Text>
              <Text style={styles.description}>
                Code sent to <Text style={{ fontWeight: '700', color: '#111827' }}>{email}</Text>
              </Text>

              <View style={styles.otpRow}>
                {[0, 1, 2, 3].map((i) => (
                  <TextInput
                    key={i}
                    ref={(el) => (otpInputs.current[i] = el)}
                    style={styles.otpBox}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={otp[i]}
                    onChangeText={(txt) => handleOtpChange(txt, i)}
                    onKeyPress={(e) => handleKeyPress(e, i)}
                  />
                ))}
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Verify Code</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendBtn}
                onPress={handleSendOtp}
                disabled={resendCooldown > 0 || loading}
              >
                <Text style={styles.resendText}>
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Didn't get the code? Resend email"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: Verification Success */}
          {step === 3 && (
            <View style={styles.contentBox}>
              <View style={styles.successCircle}>
                <Ionicons name="checkmark" size={44} color="#16A34A" />
              </View>
              <Text style={styles.title}>Email Verified!</Text>
              <Text style={styles.description}>
                Your TogetherCare account email has been successfully verified.
              </Text>

              <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={onClose}>
                <Text style={styles.primaryBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </KeyboardAvoidingView>
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
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentBox: {
    alignItems: 'center',
    paddingTop: 8,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emailHighlight: {
    fontWeight: '700',
    color: '#1E40AF',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  otpBox: {
    width: 56,
    height: 58,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    backgroundColor: '#F8FAFC',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  primaryBtn: {
    width: '100%',
    height: 50,
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  resendBtn: {
    marginTop: 18,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '600',
  },
});