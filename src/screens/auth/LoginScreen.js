// src/screens/auth/LoginScreen.js
import React, { useState, useRef, useEffect } from 'react';
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
  ScrollView,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';

// If this is an Expo project, replace the import above with:
//   import Icon from '@expo/vector-icons/Ionicons';
// (same API, no extra native linking required)

const PRIMARY = '#1E40AF';
const PRIMARY_SOFT = '#DBEAFE';

export default function LoginScreen({ onNavigate }) {
  const { width, height } = useWindowDimensions();
  const isSmall = width < 360;
  const isTablet = width >= 600;
  const hPad = isTablet ? width * 0.14 : 28;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const { login } = useAuth();

  // --- Entrance animation ---
  const fadeHeader = useRef(new Animated.Value(0)).current;
  const slideHeader = useRef(new Animated.Value(-14)).current;
  const fadeForm = useRef(new Animated.Value(0)).current;
  const slideForm = useRef(new Animated.Value(18)).current;
  const fadeFooter = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(fadeHeader, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideHeader, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeForm, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideForm, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(fadeFooter, { toValue: 1, duration: 450, useNativeDriver: true }),
    ]).start();
  }, []);

  const pressIn = () =>
    Animated.spring(btnScale, { toValue: 0.97, friction: 6, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(btnScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password');
      return;
    }

    try {
      setLoading(true);
      await login({ email: email.trim(), password });
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Login failed';
      Alert.alert('Sign In Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Soft decorative blobs — keeps the white background but adds depth */}
      <View
        pointerEvents="none"
        style={[styles.blobTop, { width: width * 0.9, height: width * 0.9, borderRadius: width * 0.45 }]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.blobBottom,
          { width: width * 0.7, height: width * 0.7, borderRadius: width * 0.35 },
        ]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingHorizontal: hPad, paddingBottom: 40 },
          ]}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.header,
              { opacity: fadeHeader, transform: [{ translateY: slideHeader }] },
            ]}
          >
            <View style={styles.badge}>
              <Icon name="shield-checkmark-outline" size={26} color={PRIMARY} />
            </View>
            <Text style={[styles.title, isSmall && { fontSize: 24 }]}>Login here</Text>
            <Text style={styles.subtitle}>Welcome back you've{'\n'}been missed!</Text>
          </Animated.View>

          <Animated.View
            style={[styles.form, { opacity: fadeForm, transform: [{ translateY: slideForm }] }]}
          >
            <TouchableOpacity
              style={[
                styles.inputWrapper,
                emailFocused && styles.inputWrapperFocused,
              ]}
              activeOpacity={1}
              onPress={() => emailInputRef.current?.focus()}
            >
              <Icon
                name="mail-outline"
                size={19}
                color={emailFocused ? PRIMARY : '#9CA3AF'}
                style={styles.inputIcon}
              />
              <TextInput
                ref={emailInputRef}
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.inputWrapper,
                passwordFocused && styles.inputWrapperFocused,
              ]}
              activeOpacity={1}
              onPress={() => passwordInputRef.current?.focus()}
            >
              <Icon
                name="lock-closed-outline"
                size={19}
                color={passwordFocused ? PRIMARY : '#9CA3AF'}
                style={styles.inputIcon}
              />
              <TextInput
                ref={passwordInputRef}
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={19}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7} onPress={() => onNavigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot your password?</Text>
            </TouchableOpacity>

            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.9}
                onPress={handleLogin}
                onPressIn={pressIn}
                onPressOut={pressOut}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Sign in</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={styles.linkBtn}
              activeOpacity={0.7}
              onPress={() => onNavigate('Register')}
            >
              <Text style={styles.linkText}>
                Don't have an account? <Text style={styles.linkTextAccent}>Create one</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.footer, { opacity: fadeFooter }]}>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.socialPrompt}>Or continue with</Text>
              <View style={styles.dividerLine} />
            </View>
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBox} activeOpacity={0.75}>
                <Icon name="logo-google" size={20} color="#EA4335" />
                <Text style={styles.socialLabel}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBox} activeOpacity={0.75}>
                <Icon name="logo-apple" size={22} color="#111827" />
                <Text style={styles.socialLabel}>Apple</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  blobTop: {
    position: 'absolute',
    top: '-16%',
    right: '-24%',
    backgroundColor: PRIMARY_SOFT,
    opacity: 0.45,
  },
  blobBottom: {
    position: 'absolute',
    bottom: '-14%',
    left: '-22%',
    backgroundColor: PRIMARY_SOFT,
    opacity: 0.3,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 24,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: PRIMARY_SOFT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: PRIMARY,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 25,
  },
  form: {
    marginVertical: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    zIndex: 10,
    elevation: 3,
  },
  inputWrapperFocused: {
    borderColor: PRIMARY,
    backgroundColor: '#FFFFFF',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#111827',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: '600',
  },
  primaryBtn: {
    height: 56,
    backgroundColor: PRIMARY,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  linkBtn: {
    marginTop: 22,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  linkTextAccent: {
    color: PRIMARY,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  socialPrompt: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginHorizontal: 12,
  },
  socialRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 14,
  },
  socialBox: {
    flex: 1,
    flexDirection: 'row',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  socialLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});