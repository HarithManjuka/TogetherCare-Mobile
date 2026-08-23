// src/screens/auth/ForgotPasswordFlow.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import client from '../../api/client';

export default function ForgotPasswordFlow({ onBackToLogin }) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Pre-set confirm, 4: Set Password, 5: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [sessionToken, setSessionToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const otpInputs = useRef([]);

  // Step 1: Submit Email
  const handleRequestOtp = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your account email');
      return;
    }
    try {
      setLoading(true);
      await client.post('/auth/forgot-password', { email: email.trim() });
      setStep(2);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Code
  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < 4) {
      Alert.alert('Incomplete Code', 'Please enter all 4 digits');
      return;
    }
    try {
      setLoading(true);
      const res = await client.post('/auth/verify-reset-otp', {
        email: email.trim(),
        otp: fullOtp,
      });
      setSessionToken(res.data.sessionToken);
      setStep(3); // Navigate to Wireframe 3
    } catch (err) {
      Alert.alert('Invalid Code', err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Update Password
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Required Fields', 'Please enter and confirm your new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match');
      return;
    }
    if (newPassword.length < 4) {
      Alert.alert('Weak Password', 'Password must be at least 4 characters');
      return;
    }
    try {
      setLoading(true);
      await client.post('/auth/reset-password', {
        email: email.trim(),
        sessionToken,
        newPassword,
      });
      setStep(5); // Navigate to Wireframe 6 (Success)
    } catch (err) {
      Alert.alert('Reset Failed', err.response?.data?.message || 'Could not update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.container}>
          
          {/* Back Chevron */}
          {step !== 5 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => (step === 1 ? onBackToLogin() : setStep(step - 1))}
            >
              <Text style={styles.backChevron}>‹</Text>
            </TouchableOpacity>
          )}

          {/* Wireframe 1: Forgot Password Request */}
          {step === 1 && (
            <View style={styles.content}>
              <Text style={styles.title}>Forgot password</Text>
              <Text style={styles.subtitle}>Please enter your email to reset the password</Text>

              <Text style={styles.label}>Your Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <TouchableOpacity style={styles.primaryBtn} onPress={handleRequestOtp} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Reset Password</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Wireframe 2: Check Your Email / OTP Code */}
          {step === 2 && (
            <View style={styles.content}>
              <Text style={styles.title}>Check your email</Text>
              <Text style={styles.subtitle}>
                We sent a reset code to <Text style={{ fontWeight: '700', color: '#111827' }}>{email}</Text>{'\n'}
                Enter 4 digit code mentioned in the email
              </Text>

              <View style={styles.otpContainer}>
                {[0, 1, 2, 3].map((i) => (
                  <TextInput
                    key={i}
                    ref={(el) => (otpInputs.current[i] = el)}
                    style={styles.otpBox}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={otp[i]}
                    onChangeText={(txt) => handleOtpChange(txt, i)}
                  />
                ))}
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Verify Code</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.resendBtn} onPress={handleRequestOtp}>
                <Text style={styles.resendText}>
                  Haven’t got the email yet? <Text style={styles.resendLink}>Resend email</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Wireframe 3: Code Verified Confirmation */}
          {step === 3 && (
            <View style={styles.content}>
              <Text style={styles.title}>Password reset</Text>
              <Text style={styles.subtitle}>
                Your code has been successfully verified. Click confirm to set a new password.
              </Text>

              <TouchableOpacity style={[styles.primaryBtn, { marginTop: 32 }]} onPress={() => setStep(4)}>
                <Text style={styles.primaryBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Wireframe 4: Set New Password */}
          {step === 4 && (
            <View style={styles.content}>
              <Text style={styles.title}>Set a new password</Text>
              <Text style={styles.subtitle}>Create a new password. Ensure it differs from previous ones for security</Text>

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter your Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <TouchableOpacity style={styles.primaryBtn} onPress={handleResetPassword} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Update Password</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Wireframe 6: Successful Confirmation */}
          {step === 5 && (
            <View style={[styles.content, { alignItems: 'center', justifyContent: 'center', flex: 1 }]}>
              <Text style={styles.successTitle}>Successful</Text>
              <Text style={styles.successSubtitle}>Congratulations!{'\n'}Your Password has been Changed.</Text>

              <View style={styles.checkCircle}>
                <Text style={styles.checkmark}>✓</Text>
              </View>

              <TouchableOpacity style={[styles.primaryBtn, { width: '100%', marginTop: 48 }]} onPress={onBackToLogin}>
                <Text style={styles.primaryBtnText}>Back to Sign in</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, paddingHorizontal: 28, paddingTop: 16 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  backChevron: { fontSize: 24, fontWeight: '700', color: '#111827', marginTop: -2 },
  content: { marginTop: 8 },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 28 },
  label: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 8 },
  input: {
    height: 54,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111827',
    marginBottom: 24,
  },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  otpBox: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  primaryBtn: {
    height: 54,
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  resendBtn: { marginTop: 24, alignItems: 'center' },
  resendText: { fontSize: 13, color: '#6B7280' },
  resendLink: { color: '#1E40AF', fontWeight: '600', textDecorationLine: 'underline' },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8 },
  successSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 36 },
  checkCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: '#4ADE80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: { fontSize: 40, color: '#16A34A', fontWeight: '800' },
});