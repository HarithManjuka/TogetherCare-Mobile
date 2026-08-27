// src/screens/auth/RegisterScreen.js
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
  ScrollView,
  Animated,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { SRI_LANKA_PROVINCES, SRI_LANKA_DISTRICTS } from '../../constants/locations';
import CalendarDatePickerModal from '../../components/common/CalendarDatePickerModal';

// If this is an Expo project, replace the import above with:
//   import Icon from '@expo/vector-icons/Ionicons';

const PRIMARY = '#1E40AF';
const PRIMARY_SOFT = '#DBEAFE';
const TEAL = '#0D9488';

/* ---------------------------------------------------------------------- */
/*  Reusable presentational pieces (styling only — no business logic)     */
/* ---------------------------------------------------------------------- */

function FieldLabel({ label, required, optional, elderly }) {
  return (
    <Text style={[styles.fieldLabel, elderly && styles.fieldLabelElderly]}>
      {label}{' '}
      {required && <Text style={styles.reqStar}>*</Text>}
      {optional && (
        <Text style={elderly ? styles.optionalTagElderly : styles.optionalTag}>(Optional)</Text>
      )}
    </Text>
  );
}

function FormInput({
  label,
  required,
  optional,
  elderly,
  error,
  icon,
  secureToggle,
  value,
  onChangeText,
  containerStyle,
  ...rest
}) {
  const [hidden, setHidden] = useState(!!secureToggle);
  const focusAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);

  const handleFocus = () => {
    Animated.timing(focusAnim, { toValue: 1, duration: 160, useNativeDriver: false }).start();
  };
  const handleBlur = () => {
    Animated.timing(focusAnim, { toValue: 0, duration: 160, useNativeDriver: false }).start();
  };

  const borderColor = error
    ? '#DC2626'
    : focusAnim.interpolate({ outputRange: ['#E2E8F0', PRIMARY], inputRange: [0, 1] });

  return (
    <View style={containerStyle}>
      {label ? (
        <FieldLabel label={label} required={required} optional={optional} elderly={elderly} />
      ) : null}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
      >
        <Animated.View
          style={[
            styles.inputWrapper,
            elderly && styles.inputWrapperElderly,
            error && styles.inputWrapperError,
            { borderColor },
          ]}
        >
          {icon && (
            <Icon
              name={icon}
              size={elderly ? 20 : 17}
              color={error ? '#DC2626' : '#94A3B8'}
              style={styles.inputIcon}
            />
          )}
          <TextInput
            ref={inputRef}
            style={[styles.input, elderly && styles.inputTextElderly]}
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            selectionColor={PRIMARY}
            secureTextEntry={secureToggle ? hidden : undefined}
            {...rest}
          />
          {secureToggle && (
            <TouchableOpacity
              onPress={() => setHidden((v) => !v)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name={hidden ? 'eye-outline' : 'eye-off-outline'} size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

function ChipGroup({ options, selectedValue, onSelect, elderly, getLabel, getValue }) {
  return (
    <View style={styles.gridSelectorContainer}>
      {options.map((opt) => {
        const value = getValue ? getValue(opt) : opt;
        const label = getLabel ? getLabel(opt) : opt;
        const isSelected = selectedValue === value;
        return (
          <TouchableOpacity
            key={value}
            style={[
              styles.gridChip,
              elderly && styles.gridChipElderly,
              isSelected && styles.gridChipActive,
            ]}
            onPress={() => onSelect(value)}
            activeOpacity={0.8}
          >
            {isSelected && (
              <Icon
                name="checkmark-circle"
                size={elderly ? 18 : 15}
                color="#FFFFFF"
                style={{ marginRight: 5 }}
              />
            )}
            <Text
              style={[
                styles.gridChipText,
                elderly && styles.gridChipTextElderly,
                isSelected && styles.gridChipTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const ROLE_OPTIONS = [
  { value: 'elderly', label: 'Elderly', desc: 'I need care and support', icon: 'body-outline' },
  { value: 'volunteer', label: 'Volunteer', desc: 'I want to help elderly people', icon: 'hand-left-outline' },
  { value: 'caregiver', label: 'Caregiver', desc: 'I provide professional or family care', icon: 'medkit-outline' },
];

function RoleSelector({ role, onSelect, elderly }) {
  return (
    <View style={styles.roleSelector}>
      {ROLE_OPTIONS.map((item) => {
        const isSelected = role === item.value;
        return (
          <TouchableOpacity
            key={item.value}
            style={[styles.roleCard, elderly && styles.roleCardElderly, isSelected && styles.roleCardActive]}
            onPress={() => onSelect(item.value)}
            activeOpacity={0.85}
          >
            {isSelected && <View style={styles.roleCardAccent} />}
            <View style={[styles.roleCardIconWrap, isSelected && styles.roleCardIconWrapActive]}>
              <Icon name={item.icon} size={elderly ? 24 : 20} color={isSelected ? PRIMARY : '#64748B'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.roleCardTitle, elderly && styles.roleCardTitleElderly, isSelected && styles.roleCardTitleActive]}>
                {item.label}
              </Text>
              <Text style={[styles.roleCardDesc, elderly && styles.roleCardDescElderly]}>{item.desc}</Text>
            </View>
            {isSelected ? (
              <View style={styles.roleCheckBadge}>
                <Icon name="checkmark" size={14} color="#FFFFFF" />
              </View>
            ) : (
              <View style={styles.roleCheckBadgeEmpty} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function formatDobDisplay(dob) {
  if (!dob) return null;
  const parsed = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dob;
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Calculate user age from Date of Birth string (YYYY-MM-DD)
function calculateAge(dobString) {
  if (!dobString) return 0;
  const parsed = new Date(`${dobString}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return 0;
  const diff = Date.now() - parsed.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

// Wizard step definitions — purely presentational grouping of the same fields
const STEPS = [
  { key: 'role', title: 'Choose Your Role', subtitle: 'This personalizes the app for you', icon: 'people-outline' },
  { key: 'personal', title: 'Personal Information', subtitle: 'Tell us a little about yourself', icon: 'person-circle-outline' },
  { key: 'address', title: 'Your Address', subtitle: 'Where are you located in Sri Lanka?', icon: 'location-outline' },
  { key: 'details', title: 'Almost Done', subtitle: 'A few final details', icon: 'checkmark-done-outline' },
];

/* ---------------------------------------------------------------------- */
/*  Main screen                                                            */
/* ---------------------------------------------------------------------- */

export default function RegisterScreen({ onNavigate }) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const hPad = isTablet ? width * 0.1 : 20;

  // Base fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState(''); // Format: YYYY-MM-DD
  const [role, setRole] = useState('elderly'); // elderly | volunteer | caregiver

  // Address fields
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [province, setProvince] = useState('Western');
  const [district, setDistrict] = useState('Colombo');

  // Role: Caregiver
  const [caregiverType, setCaregiverType] = useState('family_member');
  const [relationshipToElderly, setRelationshipToElderly] = useState('');
  const [organizationName, setOrganizationName] = useState('');

  // Role: Volunteer
  const [volunteerIdType, setVolunteerIdType] = useState('NIC');
  const [volunteerIdNumber, setVolunteerIdNumber] = useState('');
  const [educationalInstitution, setEducationalInstitution] = useState('');

  // Role: Elderly
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // UI & Validation state
  const [loading, setLoading] = useState(false);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [bannerError, setBannerError] = useState('');

  // Wizard state
  const [stepIndex, setStepIndex] = useState(0);
  const stepAnim = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  const { register } = useAuth();
  const isElderly = role === 'elderly';

  // Helper to clear error for a specific field when user edits
  const clearFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => ({ ...prev, [fieldName]: false }));
    }
    if (bannerError) {
      setBannerError('');
    }
  };

  const animateToStep = (nextIndex) => {
    Animated.timing(stepAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
      setStepIndex(nextIndex);
      stepAnim.setValue(0);
      Animated.timing(stepAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  };

  // Registration Step Validation Engine: validates presence, format, and domain logic per sub-step
  const validateStep = (index) => {
    const errors = {};
    const errorMessages = [];

    if (index === 0) {
      if (!role) {
        errors.role = true;
        errorMessages.push('Please select a role to continue.');
      }
    }

    if (index === 1) {
      const missing = [];
      if (!firstName.trim()) { errors.firstName = true; missing.push('First Name'); }
      if (!lastName.trim()) { errors.lastName = true; missing.push('Last Name'); }
      if (!email.trim()) { errors.email = true; missing.push('Email Address'); }
      if (!password) { errors.password = true; missing.push('Password'); }
      if (!phone.trim()) { errors.phone = true; missing.push('Phone Number'); }
      if (!dob.trim()) { errors.dob = true; missing.push('Date of Birth'); }

      if (missing.length > 0) {
        errorMessages.push(`Required field(s) missing: ${missing.join(', ')}`);
      }

      // Format and domain validation for filled fields
      if (firstName.trim() && !/^[A-Za-z\s]+$/.test(firstName.trim())) {
        errors.firstName = true;
        errorMessages.push('First name must contain only letters.');
      }
      if (lastName.trim() && !/^[A-Za-z\s]+$/.test(lastName.trim())) {
        errors.lastName = true;
        errorMessages.push('Last name must contain only letters.');
      }
      if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase())) {
        errors.email = true;
        errorMessages.push('Please enter a valid email address (e.g. user@domain.com).');
      }
      if (password && password.length < 4) {
        errors.password = true;
        errorMessages.push('Password must be at least 4 characters long.');
      }
      if (phone.trim() && !/^(?:0|94|\+94)?(7[0-9]{8})$/.test(phone.trim())) {
        errors.phone = true;
        errorMessages.push('Please enter a valid Sri Lankan mobile number (e.g. 0771234567).');
      }
      if (dob.trim()) {
        const userAge = calculateAge(dob.trim());
        if (userAge < 10 || userAge > 150) {
          errors.dob = true;
          errorMessages.push('Date of Birth indicates an invalid age (must be between 10 and 150 years).');
        } else if (role === 'elderly' && userAge < 40) {
          errors.dob = true;
          errorMessages.push('Users registering for the Elderly role must be at least 40 years old.');
        }
      }
    }

    if (index === 2) {
      const missing = [];
      if (!streetAddress.trim()) { errors.streetAddress = true; missing.push('Street Address'); }
      if (!city.trim()) { errors.city = true; missing.push('City'); }
      if (!postalCode.trim()) { errors.postalCode = true; missing.push('Postal Code'); }
      if (!province) { errors.province = true; missing.push('Province'); }
      if (!district) { errors.district = true; missing.push('District'); }

      if (missing.length > 0) {
        errorMessages.push(`Required field(s) missing: ${missing.join(', ')}`);
      }

      if (postalCode.trim() && !/^\d+$/.test(postalCode.trim())) {
        errors.postalCode = true;
        errorMessages.push('Postal Code must contain only numbers.');
      }
    }

    if (index === 3) {
      if (role === 'volunteer') {
        if (!volunteerIdNumber.trim()) {
          errors.volunteerIdNumber = true;
          errorMessages.push(`Please provide your ${volunteerIdType} Number.`);
        }
        if (volunteerIdType === 'Student ID' && !educationalInstitution.trim()) {
          errors.educationalInstitution = true;
          errorMessages.push('Please provide your University / School Name.');
        }
      }
      if (role === 'elderly' && emergencyPhone.trim()) {
        if (!/^(?:0|94|\+94)?(7[0-9]{8})$/.test(emergencyPhone.trim())) {
          errors.emergencyPhone = true;
          errorMessages.push('Emergency contact phone must be a valid Sri Lankan mobile number.');
        }
      }
    }

    const isValid = Object.keys(errors).length === 0;

    if (!isValid) {
      setFieldErrors(errors);
      const combinedMsg = errorMessages.join('\n• ');
      setBannerError(combinedMsg);
      Alert.alert(
        'Step Incomplete',
        `Please resolve the following requirement(s) to proceed:\n\n• ${combinedMsg}`
      );
    } else {
      setBannerError('');
    }

    return isValid;
  };

  const goNext = () => {
    if (!validateStep(stepIndex)) return;
    if (stepIndex < STEPS.length - 1) {
      animateToStep(stepIndex + 1);
    }
  };

  const goBack = () => {
    if (stepIndex === 0) {
      onNavigate('Login');
      return;
    }
    setBannerError('');
    animateToStep(stepIndex - 1);
  };

  const pressIn = () => Animated.spring(btnScale, { toValue: 0.97, friction: 6, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();

  const handleRegister = async () => {
    // Validate each step sequentially before final submission
    for (let s = 0; s < STEPS.length; s++) {
      if (!validateStep(s)) {
        if (s !== stepIndex) {
          animateToStep(s);
        }
        return;
      }
    }

    // Prepare Registration Payload
    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone.trim(),
      role,
      dateOfBirth: dob.trim(),
      address: {
        streetAddress: streetAddress.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        district,
        province,
      },
      caregiverType: role === 'caregiver' ? caregiverType : null,
      relationshipToElderly: role === 'caregiver' ? relationshipToElderly.trim() : undefined,
      organizationName: role === 'caregiver' ? organizationName.trim() : undefined,
      volunteerIdType: role === 'volunteer' ? volunteerIdType : null,
      volunteerIdNumber: role === 'volunteer' ? volunteerIdNumber.trim() : undefined,
      educationalInstitution: role === 'volunteer' && volunteerIdType === 'Student ID' ? educationalInstitution.trim() : undefined,
      emergencyContact: role === 'elderly' ? {
        name: emergencyName.trim(),
        relation: emergencyRelation.trim(),
        phone: emergencyPhone.trim(),
      } : undefined,
    };

    try {
      setLoading(true);
      setBannerError('');
      await register(payload);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Registration failed';
      setBannerError(errorMsg);

      // Highlight missing fields returned by backend if any
      if (err.response?.data?.missingFields) {
        const backendMissing = err.response.data.missingFields;
        const newErrState = {};
        if (backendMissing.includes('First Name')) newErrState.firstName = true;
        if (backendMissing.includes('Last Name')) newErrState.lastName = true;
        if (backendMissing.includes('Email')) newErrState.email = true;
        if (backendMissing.includes('Password')) newErrState.password = true;
        if (backendMissing.includes('Phone')) newErrState.phone = true;
        if (backendMissing.includes('Date of Birth')) newErrState.dob = true;
        if (backendMissing.includes('Street Address')) newErrState.streetAddress = true;
        if (backendMissing.includes('City')) newErrState.city = true;
        if (backendMissing.includes('Postal Code')) newErrState.postalCode = true;
        setFieldErrors(newErrState);
      }

      Alert.alert('Registration Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const currentStep = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  const stepOpacity = stepAnim;
  const stepTranslate = stepAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0);
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 12);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Top bar: back + progress */}
        <View style={[styles.topBar, { paddingHorizontal: hPad, paddingTop: topPadding + 6 }]}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Icon name={stepIndex === 0 ? 'close-outline' : 'chevron-back'} size={22} color="#334155" />
          </TouchableOpacity>

          <View style={styles.progressTrack}>
            {STEPS.map((s, i) => (
              <View
                key={s.key}
                style={[
                  styles.progressSegment,
                  i <= stepIndex && styles.progressSegmentActive,
                  isElderly && styles.progressSegmentElderly,
                ]}
              />
            ))}
          </View>

          <Text style={styles.stepCounter}>{stepIndex + 1}/{STEPS.length}</Text>
        </View>

        {isElderly && (
          <View style={[styles.elderlyPill, { marginHorizontal: hPad }]}>
            <Icon name="accessibility-outline" size={15} color="#1E3A8A" style={{ marginRight: 6 }} />
            <Text style={styles.elderlyPillText}>Easy-Read Mode Active</Text>
          </View>
        )}

        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingHorizontal: hPad, paddingBottom: insets.bottom + 130, flexGrow: 1 },
            isElderly && styles.containerElderly,
          ]}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always"
        >
          <Animated.View style={{ opacity: stepOpacity, transform: [{ translateY: stepTranslate }] }}>
            {/* Step header */}
            <View style={styles.stepHeader}>
              <View style={styles.stepHeaderIconWrap}>
                <Icon name={currentStep.icon} size={isElderly ? 24 : 20} color={PRIMARY} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, isElderly && styles.stepTitleElderly]}>{currentStep.title}</Text>
                <Text style={[styles.stepSubtitle, isElderly && styles.stepSubtitleElderly]}>{currentStep.subtitle}</Text>
              </View>
            </View>

            {/* Banner Error Notification */}
            {bannerError !== '' && (
              <View style={styles.bannerErrorBox}>
                <View style={styles.bannerErrorTitleRow}>
                  <Icon name="alert-circle" size={19} color="#B91C1C" style={{ marginRight: 6 }} />
                  <Text style={styles.bannerErrorTitle}>Attention Required</Text>
                </View>
                <Text style={styles.bannerErrorText}>{bannerError}</Text>
              </View>
            )}

            {/* ---------------- Step 0: Role ---------------- */}
            {stepIndex === 0 && (
              <View style={styles.card}>
                <RoleSelector
                  role={role}
                  elderly={isElderly}
                  onSelect={(val) => {
                    setRole(val);
                    setBannerError('');
                  }}
                />
              </View>
            )}

            {/* ---------------- Step 1: Personal Information ---------------- */}
            {stepIndex === 1 && (
              <View style={styles.card}>
                <View style={styles.row}>
                  <FormInput
                    containerStyle={{ flex: 1, marginRight: 8 }}
                    label="First Name"
                    required
                    elderly={isElderly}
                    error={fieldErrors.firstName}
                    icon="person-outline"
                    placeholder="First Name"
                    value={firstName}
                    onChangeText={(val) => { setFirstName(val); clearFieldError('firstName'); }}
                  />
                  <FormInput
                    containerStyle={{ flex: 1 }}
                    label="Last Name"
                    required
                    elderly={isElderly}
                    error={fieldErrors.lastName}
                    icon="person-outline"
                    placeholder="Last Name"
                    value={lastName}
                    onChangeText={(val) => { setLastName(val); clearFieldError('lastName'); }}
                  />
                </View>

                <FormInput
                  label="Email Address"
                  required
                  elderly={isElderly}
                  error={fieldErrors.email}
                  icon="mail-outline"
                  placeholder="example@domain.com"
                  value={email}
                  onChangeText={(val) => { setEmail(val); clearFieldError('email'); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <FormInput
                  label="Password"
                  required
                  elderly={isElderly}
                  error={fieldErrors.password}
                  icon="lock-closed-outline"
                  secureToggle
                  placeholder="Minimum 4 characters"
                  value={password}
                  onChangeText={(val) => { setPassword(val); clearFieldError('password'); }}
                />

                <FormInput
                  label="Mobile Phone Number"
                  required
                  elderly={isElderly}
                  error={fieldErrors.phone}
                  icon="call-outline"
                  placeholder="07XXXXXXXX"
                  value={phone}
                  onChangeText={(val) => { setPhone(val); clearFieldError('phone'); }}
                  keyboardType="phone-pad"
                />

                <FieldLabel label="Date of Birth" required elderly={isElderly} />
                <TouchableOpacity
                  style={[styles.datePickerBtn, isElderly && styles.datePickerBtnElderly, fieldErrors.dob && styles.inputWrapperError]}
                  onPress={() => setIsCalendarVisible(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.datePickerLeft}>
                    <Icon name="calendar-outline" size={isElderly ? 22 : 19} color={PRIMARY} style={{ marginRight: 10 }} />
                    <Text style={[styles.datePickerBtnText, isElderly && styles.datePickerBtnTextElderly]}>
                      {dob ? formatDobDisplay(dob) : 'Select date of birth'}
                    </Text>
                  </View>
                  <Icon name="chevron-forward" size={isElderly ? 22 : 18} color="#94A3B8" />
                </TouchableOpacity>

                <CalendarDatePickerModal
                  visible={isCalendarVisible}
                  initialDate={dob || '1980-01-01'}
                  isElderlyMode={isElderly}
                  onConfirm={(selectedDate) => {
                    setDob(selectedDate);
                    clearFieldError('dob');
                    setIsCalendarVisible(false);
                  }}
                  onClose={() => setIsCalendarVisible(false)}
                />
              </View>
            )}

            {/* ---------------- Step 2: Address ---------------- */}
            {stepIndex === 2 && (
              <View style={styles.card}>
                <FormInput
                  label="Street Address"
                  required
                  elderly={isElderly}
                  error={fieldErrors.streetAddress}
                  icon="home-outline"
                  placeholder="House / Street Address"
                  value={streetAddress}
                  onChangeText={(val) => { setStreetAddress(val); clearFieldError('streetAddress'); }}
                />

                <View style={styles.row}>
                  <FormInput
                    containerStyle={{ flex: 1, marginRight: 8 }}
                    label="City"
                    required
                    elderly={isElderly}
                    error={fieldErrors.city}
                    icon="business-outline"
                    placeholder="City"
                    value={city}
                    onChangeText={(val) => { setCity(val); clearFieldError('city'); }}
                  />
                  <FormInput
                    containerStyle={{ flex: 1 }}
                    label="Postal Code"
                    required
                    elderly={isElderly}
                    error={fieldErrors.postalCode}
                    icon="mail-open-outline"
                    placeholder="Postal Code"
                    value={postalCode}
                    onChangeText={(val) => { setPostalCode(val); clearFieldError('postalCode'); }}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={[styles.pickerCard, fieldErrors.province && styles.inputWrapperError]}>
                  <View style={styles.pickerCardHeader}>
                    <Icon name="map-outline" size={isElderly ? 20 : 17} color={PRIMARY} />
                    <FieldLabel label="Province" required elderly={isElderly} />
                  </View>
                  <ChipGroup
                    options={SRI_LANKA_PROVINCES}
                    selectedValue={province}
                    elderly={isElderly}
                    onSelect={(prov) => {
                      setProvince(prov);
                      setDistrict(SRI_LANKA_DISTRICTS[prov][0]);
                      clearFieldError('province');
                    }}
                  />
                </View>

                <View style={[styles.pickerCard, fieldErrors.district && styles.inputWrapperError]}>
                  <View style={styles.pickerCardHeader}>
                    <Icon name="navigate-outline" size={isElderly ? 20 : 17} color={PRIMARY} />
                    <FieldLabel label="District" required elderly={isElderly} />
                  </View>
                  <ChipGroup
                    options={SRI_LANKA_DISTRICTS[province] || []}
                    selectedValue={district}
                    elderly={isElderly}
                    onSelect={(dist) => { setDistrict(dist); clearFieldError('district'); }}
                  />
                </View>
              </View>
            )}

            {/* ---------------- Step 3: Role-specific + Submit ---------------- */}
            {stepIndex === 3 && (
              <View style={styles.card}>
                {role === 'volunteer' && (
                  <>
                    <FieldLabel label="Select ID Type" required />
                    <View style={styles.row}>
                      {['NIC', 'Student ID', 'Passport'].map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={[styles.gridChip, { flex: 1, marginRight: 6 }, volunteerIdType === t && styles.gridChipActive]}
                          onPress={() => setVolunteerIdType(t)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.gridChipText, volunteerIdType === t && styles.gridChipTextActive]}>{t}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <FormInput
                      label={`${volunteerIdType} Number`}
                      required
                      error={fieldErrors.volunteerIdNumber}
                      icon="card-outline"
                      placeholder={`Enter ${volunteerIdType} Number`}
                      value={volunteerIdNumber}
                      onChangeText={(val) => { setVolunteerIdNumber(val); clearFieldError('volunteerIdNumber'); }}
                    />

                    {volunteerIdType === 'Student ID' && (
                      <FormInput
                        label="University / School Name"
                        required
                        error={fieldErrors.educationalInstitution}
                        icon="school-outline"
                        placeholder="Enter Institution Name"
                        value={educationalInstitution}
                        onChangeText={(val) => { setEducationalInstitution(val); clearFieldError('educationalInstitution'); }}
                      />
                    )}
                  </>
                )}

                {role === 'caregiver' && (
                  <>
                    <FieldLabel label="Caregiver Category" required />
                    <View style={styles.row}>
                      {[
                        { label: 'Family Member', value: 'family_member' },
                        { label: 'Formal Caregiver', value: 'formal_caregiver' },
                      ].map((c) => (
                        <TouchableOpacity
                          key={c.value}
                          style={[styles.gridChip, { flex: 1, marginRight: 6 }, caregiverType === c.value && styles.gridChipActive]}
                          onPress={() => setCaregiverType(c.value)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.gridChipText, caregiverType === c.value && styles.gridChipTextActive]}>{c.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <FormInput
                      label="Relationship to Elderly"
                      optional
                      icon="people-outline"
                      placeholder="e.g. Son, Daughter, Private Nurse"
                      value={relationshipToElderly}
                      onChangeText={setRelationshipToElderly}
                    />

                    <FormInput
                      label="Clinic / Organization Name"
                      optional
                      icon="business-outline"
                      placeholder="e.g. Grace Care Agency"
                      value={organizationName}
                      onChangeText={setOrganizationName}
                    />
                  </>
                )}

                {role === 'elderly' && (
                  <>
                    <View style={styles.roleSectionTitleRow}>
                      <Icon name="call-outline" size={20} color={PRIMARY} />
                      <Text style={[styles.roleSectionTitle, isElderly && styles.roleSectionTitleElderly]}>
                        Emergency Contact <Text style={styles.optionalTagElderly}>(Optional)</Text>
                      </Text>
                    </View>

                    <FormInput
                      label="Contact Name"
                      optional
                      elderly
                      icon="person-outline"
                      placeholder="Emergency Contact Name"
                      value={emergencyName}
                      onChangeText={setEmergencyName}
                    />

                    <FormInput
                      label="Relationship"
                      optional
                      elderly
                      icon="people-outline"
                      placeholder="Relation (e.g. Son, Daughter)"
                      value={emergencyRelation}
                      onChangeText={setEmergencyRelation}
                    />

                    <FormInput
                      label="Emergency Phone"
                      optional
                      elderly
                      error={fieldErrors.emergencyPhone}
                      icon="call-outline"
                      placeholder="Phone (07XXXXXXXX)"
                      value={emergencyPhone}
                      onChangeText={(val) => { setEmergencyPhone(val); clearFieldError('emergencyPhone'); }}
                      keyboardType="phone-pad"
                    />
                  </>
                )}
              </View>
            )}
          </Animated.View>

          {/* Navigation to Login (shown once, on the first step, low-friction exit) */}
          {stepIndex === 0 && (
            <TouchableOpacity style={styles.linkBtn} onPress={() => onNavigate('Login')} activeOpacity={0.7}>
              <Text style={[styles.linkText, isElderly && styles.linkTextElderly]}>
                Already have an account? <Text style={{ color: PRIMARY, fontWeight: '600' }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Fixed elevated bottom action bar */}
        <View
          style={[
            styles.bottomBar,
            {
              paddingHorizontal: hPad,
              paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 10) + 12,
            },
          ]}
        >
          <Animated.View style={{ flex: 1, transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={[styles.primaryBtn, isElderly && styles.primaryBtnElderly]}
              onPress={isLastStep ? handleRegister : goNext}
              onPressIn={pressIn}
              onPressOut={pressOut}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size={isElderly ? 'large' : 'small'} />
              ) : (
                <View style={styles.row}>
                  <Text style={[styles.primaryBtnText, isElderly && styles.primaryBtnTextElderly]}>
                    {isLastStep ? 'Complete Registration' : 'Continue'}
                  </Text>
                  <Icon
                    name={isLastStep ? 'checkmark-circle-outline' : 'arrow-forward'}
                    size={isElderly ? 22 : 18}
                    color="#FFFFFF"
                    style={{ marginLeft: 8 }}
                  />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTrack: { flex: 1, flexDirection: 'row', gap: 6 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' },
  progressSegmentActive: { backgroundColor: PRIMARY },
  progressSegmentElderly: { height: 6, borderRadius: 3 },
  stepCounter: { fontSize: 12.5, fontWeight: '600', color: '#94A3B8', minWidth: 28, textAlign: 'right' },

  elderlyPill: {
    marginTop: 4,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  elderlyPillText: { fontSize: 12.5, fontWeight: '600', color: '#1E3A8A' },

  container: { paddingTop: 12, paddingBottom: 12 },
  containerElderly: { paddingTop: 16 },

  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 12 },
  stepHeaderIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: PRIMARY_SOFT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  stepTitleElderly: { fontSize: 24 },
  stepSubtitle: { fontSize: 13, fontWeight: '400', color: '#94A3B8', marginTop: 2 },
  stepSubtitleElderly: { fontSize: 15.5 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },

  bannerErrorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  bannerErrorTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  bannerErrorTitle: { color: '#991B1B', fontSize: 15, fontWeight: '700' },
  bannerErrorText: { color: '#B91C1C', fontSize: 13.5, fontWeight: '500', lineHeight: 19 },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginTop: 10, marginBottom: 6 },
  fieldLabelElderly: { fontSize: 17, fontWeight: '700', color: '#0F172A', marginTop: 14, marginBottom: 8 },

  reqStar: { color: '#DC2626', fontWeight: '700', fontSize: 14 },
  optionalTag: { color: '#94A3B8', fontWeight: '400', fontSize: 12 },
  optionalTagElderly: { color: '#64748B', fontWeight: '500', fontSize: 14.5 },

  row: { flexDirection: 'row', alignItems: 'center' },

  /* Role cards */
  roleSelector: { gap: 10 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    overflow: 'hidden',
  },
  roleCardElderly: { padding: 18, borderRadius: 16 },
  roleCardActive: { borderColor: '#BFDBFE', backgroundColor: '#F8FAFF' },
  roleCardAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: PRIMARY },
  roleCardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  roleCardIconWrapActive: { backgroundColor: PRIMARY_SOFT },
  roleCardTitle: { fontSize: 14.5, fontWeight: '600', color: '#1E293B', marginBottom: 2 },
  roleCardTitleElderly: { fontSize: 18 },
  roleCardTitleActive: { color: PRIMARY, fontWeight: '700' },
  roleCardDesc: { fontSize: 12.5, fontWeight: '400', color: '#94A3B8' },
  roleCardDescElderly: { fontSize: 15 },
  roleCheckBadge: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: PRIMARY,
    justifyContent: 'center', alignItems: 'center', marginLeft: 10,
  },
  roleCheckBadgeEmpty: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#E2E8F0', marginLeft: 10 },

  /* Text inputs */
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 6,
    borderWidth: 1.3,
    borderColor: '#E2E8F0',
  },
  inputWrapperElderly: { height: 60, borderRadius: 14 },
  inputWrapperError: { backgroundColor: '#FFFBFB' },
  inputIcon: { marginRight: 9 },
  input: { flex: 1, height: '100%', fontSize: 15, fontWeight: '400', color: '#1E293B' },
  inputTextElderly: { fontSize: 17.5 },

  /* Date picker */
  datePickerBtn: {
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.3,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  datePickerBtnElderly: { height: 62, borderRadius: 14 },
  datePickerLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  datePickerBtnText: { fontSize: 14.5, fontWeight: '500', color: '#1E293B' },
  datePickerBtnTextElderly: { fontSize: 17.5, fontWeight: '600', color: '#0F172A' },

  /* Province / District cards */
  pickerCard: {
    backgroundColor: '#FAFBFC',
    borderWidth: 1,
    borderColor: '#EDF0F3',
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },
  pickerCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  gridSelectorContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  gridChip: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridChipElderly: { paddingHorizontal: 18, paddingVertical: 12, minHeight: 50, borderRadius: 26 },
  gridChipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  gridChipText: { fontSize: 13, fontWeight: '500', color: '#475569' },
  gridChipTextElderly: { fontSize: 16.5, fontWeight: '600' },
  gridChipTextActive: { color: '#FFFFFF', fontWeight: '600' },

  roleSectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  roleSectionTitle: { fontSize: 15.5, fontWeight: '600', color: '#1E3A8A' },
  roleSectionTitleElderly: { fontSize: 19, fontWeight: '700', color: PRIMARY },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 20,
    zIndex: 1000,
  },
  primaryBtn: {
    height: 56,
    backgroundColor: PRIMARY,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnElderly: { height: 64, borderRadius: 16 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16.5, fontWeight: '600' },
  primaryBtnTextElderly: { fontSize: 20, fontWeight: '700' },

  linkBtn: { marginTop: 18, alignItems: 'center' },
  linkText: { fontSize: 14, color: '#64748B', fontWeight: '400' },
  linkTextElderly: { fontSize: 17, color: '#475569', fontWeight: '500' },
});