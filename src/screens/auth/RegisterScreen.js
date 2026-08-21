// src/screens/auth/RegisterScreen.js
import React, { useState } from 'react';
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
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { SRI_LANKA_PROVINCES, SRI_LANKA_DISTRICTS } from '../../constants/locations';
import CalendarDatePickerModal from '../../components/common/CalendarDatePickerModal';

export default function RegisterScreen({ onNavigate }) {
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

  const handleRegister = async () => {
    const errors = {};
    const missingFieldLabels = [];

    // 1. Mandatory Common Fields check
    if (!firstName.trim()) {
      errors.firstName = true;
      missingFieldLabels.push('First Name');
    }
    if (!lastName.trim()) {
      errors.lastName = true;
      missingFieldLabels.push('Last Name');
    }
    if (!email.trim()) {
      errors.email = true;
      missingFieldLabels.push('Email Address');
    }
    if (!password) {
      errors.password = true;
      missingFieldLabels.push('Password');
    }
    if (!phone.trim()) {
      errors.phone = true;
      missingFieldLabels.push('Phone Number');
    }
    if (!dob.trim()) {
      errors.dob = true;
      missingFieldLabels.push('Date of Birth');
    }
    if (!streetAddress.trim()) {
      errors.streetAddress = true;
      missingFieldLabels.push('Street Address');
    }
    if (!city.trim()) {
      errors.city = true;
      missingFieldLabels.push('City');
    }
    if (!postalCode.trim()) {
      errors.postalCode = true;
      missingFieldLabels.push('Postal Code');
    }
    if (!province) {
      errors.province = true;
      missingFieldLabels.push('Province');
    }
    if (!district) {
      errors.district = true;
      missingFieldLabels.push('District');
    }

    // Role specific required check
    if (role === 'volunteer') {
      if (!volunteerIdNumber.trim()) {
        errors.volunteerIdNumber = true;
        missingFieldLabels.push(`${volunteerIdType} Number`);
      }
      if (volunteerIdType === 'Student ID' && !educationalInstitution.trim()) {
        errors.educationalInstitution = true;
        missingFieldLabels.push('University / School Name');
      }
    }

    // If missing mandatory fields, alert and highlight
    if (missingFieldLabels.length > 0) {
      setFieldErrors(errors);
      const errMsg = `Please fill in all mandatory registration fields:\n• ${missingFieldLabels.join('\n• ')}`;
      setBannerError(errMsg);
      Alert.alert('Missing Mandatory Fields', errMsg);
      return;
    }

    // Format & Length validations
    if (!/^[A-Za-z]+$/.test(firstName.trim()) || !/^[A-Za-z]+$/.test(lastName.trim())) {
      setFieldErrors({ firstName: true, lastName: true });
      Alert.alert('Validation Error', 'First and Last name must contain only letters');
      return;
    }

    if (!/^(?:0|94|\+94)?(7[0-9]{8})$/.test(phone.trim())) {
      setFieldErrors({ phone: true });
      Alert.alert('Invalid Phone', 'Please enter a valid Sri Lankan mobile number (e.g. 0771234567)');
      return;
    }

    if (password.length < 4) {
      setFieldErrors({ password: true });
      Alert.alert('Password Length', 'Password must be at least 4 characters');
      return;
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.container, isElderly && styles.containerElderly]} keyboardShouldPersistTaps="handled">
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, isElderly && styles.titleElderly]}>Create Account</Text>
            <Text style={[styles.brandSubtitle, isElderly && styles.brandSubtitleElderly]}>
              TogetherCare App
            </Text>

            {/* Elderly Accessibility Indicator */}
            {isElderly && (
              <View style={styles.elderlyBadgeBanner}>
                <Text style={styles.elderlyBadgeBannerText}>
                  👵 Elderly High-Accessibility Mode Active (Large Text & Easy Touch)
                </Text>
              </View>
            )}
          </View>

          {/* Banner Error Notification */}
          {bannerError !== '' && (
            <View style={styles.bannerErrorBox}>
              <Text style={styles.bannerErrorTitle}>⚠️ Attention Required</Text>
              <Text style={styles.bannerErrorText}>{bannerError}</Text>
            </View>
          )}

          {/* Role Picker */}
          <Text style={[styles.sectionHeader, isElderly && styles.sectionHeaderElderly]}>Select Role</Text>
          <View style={styles.roleSelector}>
            {[
              { label: 'Elderly 👴', value: 'elderly' },
              { label: 'Volunteer 🤝', value: 'volunteer' },
              { label: 'Caregiver 🩺', value: 'caregiver' },
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.roleChip,
                  isElderly && styles.roleChipElderly,
                  role === item.value && styles.roleChipActive,
                ]}
                onPress={() => {
                  setRole(item.value);
                  setBannerError('');
                }}
              >
                <Text style={[
                  styles.roleChipText,
                  isElderly && styles.roleChipTextElderly,
                  role === item.value && styles.roleChipTextActive,
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Common Personal Information */}
          <Text style={[styles.sectionHeader, isElderly && styles.sectionHeaderElderly]}>
            Personal Information
          </Text>
          
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.fieldLabel, isElderly && styles.fieldLabelElderly]}>
                First Name <Text style={styles.reqStar}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  isElderly && styles.inputElderly,
                  fieldErrors.firstName && styles.inputError,
                ]}
                placeholder="First Name"
                placeholderTextColor="#94A3B8"
                value={firstName}
                onChangeText={(val) => {
                  setFirstName(val);
                  clearFieldError('firstName');
                }}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, isElderly && styles.fieldLabelElderly]}>
                Last Name <Text style={styles.reqStar}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  isElderly && styles.inputElderly,
                  fieldErrors.lastName && styles.inputError,
                ]}
                placeholder="Last Name"
                placeholderTextColor="#94A3B8"
                value={lastName}
                onChangeText={(val) => {
                  setLastName(val);
                  clearFieldError('lastName');
                }}
              />
            </View>
          </View>

          <Text style={[styles.fieldLabel, isElderly && styles.fieldLabelElderly]}>
            Email Address <Text style={styles.reqStar}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              isElderly && styles.inputElderly,
              fieldErrors.email && styles.inputError,
            ]}
            placeholder="example@domain.com"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={(val) => {
              setEmail(val);
              clearFieldError('email');
            }}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={[styles.fieldLabel, isElderly && styles.fieldLabelElderly]}>
            Password <Text style={styles.reqStar}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              isElderly && styles.inputElderly,
              fieldErrors.password && styles.inputError,
            ]}
            placeholder="Minimum 4 characters"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={(val) => {
              setPassword(val);
              clearFieldError('password');
            }}
            secureTextEntry
          />

          <Text style={[styles.fieldLabel, isElderly && styles.fieldLabelElderly]}>
            Mobile Phone Number <Text style={styles.reqStar}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              isElderly && styles.inputElderly,
              fieldErrors.phone && styles.inputError,
            ]}
            placeholder="07XXXXXXXX"
            placeholderTextColor="#94A3B8"
            value={phone}
            onChangeText={(val) => {
              setPhone(val);
              clearFieldError('phone');
            }}
            keyboardType="phone-pad"
          />

          {/* Calendar Picker for Date of Birth */}
          <Text style={[styles.fieldLabel, isElderly && styles.fieldLabelElderly]}>
            Date of Birth <Text style={styles.reqStar}>*</Text>
          </Text>
          <TouchableOpacity
            style={[
              styles.datePickerBtn,
              isElderly && styles.datePickerBtnElderly,
              fieldErrors.dob && styles.inputError,
            ]}
            onPress={() => setIsCalendarVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.datePickerBtnText, isElderly && styles.datePickerBtnTextElderly]}>
              📅 {dob ? `${dob}` : 'Select Date from Calendar *'}
            </Text>
            <Text style={styles.datePickerIconText}>📆</Text>
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

          {/* Address Details */}
          <Text style={[styles.sectionHeader, isElderly && styles.sectionHeaderElderly]}>
            Address & Location (Sri Lanka)
          </Text>
          
          <Text style={[styles.fieldLabel, isElderly && styles.fieldLabelElderly]}>
            Street Address <Text style={styles.reqStar}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              isElderly && styles.inputElderly,
              fieldErrors.streetAddress && styles.inputError,
            ]}
            placeholder="House / Street Address"
            placeholderTextColor="#94A3B8"
            value={streetAddress}
            onChangeText={(val) => {
              setStreetAddress(val);
              clearFieldError('streetAddress');
            }}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.fieldLabel, isElderly && styles.fieldLabelElderly]}>
                City <Text style={styles.reqStar}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  isElderly && styles.inputElderly,
                  fieldErrors.city && styles.inputError,
                ]}
                placeholder="City"
                placeholderTextColor="#94A3B8"
                value={city}
                onChangeText={(val) => {
                  setCity(val);
                  clearFieldError('city');
                }}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, isElderly && styles.fieldLabelElderly]}>
                Postal Code <Text style={styles.reqStar}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  isElderly && styles.inputElderly,
                  fieldErrors.postalCode && styles.inputError,
                ]}
                placeholder="Postal Code"
                placeholderTextColor="#94A3B8"
                value={postalCode}
                onChangeText={(val) => {
                  setPostalCode(val);
                  clearFieldError('postalCode');
                }}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Province Responsive Selector */}
          <Text style={[styles.fieldLabel, isElderly && styles.fieldLabelElderly]}>
            Province <Text style={styles.reqStar}>*</Text>
          </Text>
          <View style={styles.gridSelectorContainer}>
            {SRI_LANKA_PROVINCES.map((prov) => {
              const isSelected = province === prov;
              return (
                <TouchableOpacity
                  key={prov}
                  style={[
                    styles.gridChip,
                    isElderly && styles.gridChipElderly,
                    isSelected && styles.gridChipActive,
                  ]}
                  onPress={() => {
                    setProvince(prov);
                    setDistrict(SRI_LANKA_DISTRICTS[prov][0]);
                    clearFieldError('province');
                  }}
                >
                  <Text style={[
                    styles.gridChipText,
                    isElderly && styles.gridChipTextElderly,
                    isSelected && styles.gridChipTextActive,
                  ]}>
                    {isSelected ? '✓ ' : ''}{prov}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* District Responsive Selector */}
          <Text style={[styles.fieldLabel, isElderly && styles.fieldLabelElderly]}>
            District <Text style={styles.reqStar}>*</Text>
          </Text>
          <View style={styles.gridSelectorContainer}>
            {(SRI_LANKA_DISTRICTS[province] || []).map((dist) => {
              const isSelected = district === dist;
              return (
                <TouchableOpacity
                  key={dist}
                  style={[
                    styles.gridChip,
                    isElderly && styles.gridChipElderly,
                    isSelected && styles.gridChipActive,
                  ]}
                  onPress={() => {
                    setDistrict(dist);
                    clearFieldError('district');
                  }}
                >
                  <Text style={[
                    styles.gridChipText,
                    isElderly && styles.gridChipTextElderly,
                    isSelected && styles.gridChipTextActive,
                  ]}>
                    {isSelected ? '✓ ' : ''}{dist}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Role-Specific: Volunteer */}
          {role === 'volunteer' && (
            <View style={styles.roleSectionCard}>
              <Text style={styles.roleSectionTitle}>Volunteer Identification</Text>
              
              <Text style={styles.fieldLabel}>Select ID Type <Text style={styles.reqStar}>*</Text></Text>
              <View style={styles.row}>
                {['NIC', 'Student ID', 'Passport'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.gridChip, { flex: 1, marginRight: 6 }, volunteerIdType === t && styles.gridChipActive]}
                    onPress={() => setVolunteerIdType(t)}
                  >
                    <Text style={[styles.gridChipText, volunteerIdType === t && styles.gridChipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>
                {volunteerIdType} Number <Text style={styles.reqStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, fieldErrors.volunteerIdNumber && styles.inputError]}
                placeholder={`Enter ${volunteerIdType} Number`}
                placeholderTextColor="#94A3B8"
                value={volunteerIdNumber}
                onChangeText={(val) => {
                  setVolunteerIdNumber(val);
                  clearFieldError('volunteerIdNumber');
                }}
              />

              {volunteerIdType === 'Student ID' && (
                <>
                  <Text style={styles.fieldLabel}>
                    University / School Name <Text style={styles.reqStar}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, fieldErrors.educationalInstitution && styles.inputError]}
                    placeholder="Enter Institution Name"
                    placeholderTextColor="#94A3B8"
                    value={educationalInstitution}
                    onChangeText={(val) => {
                      setEducationalInstitution(val);
                      clearFieldError('educationalInstitution');
                    }}
                  />
                </>
              )}
            </View>
          )}

          {/* Role-Specific: Caregiver */}
          {role === 'caregiver' && (
            <View style={styles.roleSectionCard}>
              <Text style={styles.roleSectionTitle}>Caregiver Details</Text>
              
              <Text style={styles.fieldLabel}>Caregiver Category <Text style={styles.reqStar}>*</Text></Text>
              <View style={styles.row}>
                {[
                  { label: 'Family Member', value: 'family_member' },
                  { label: 'Formal Caregiver', value: 'formal_caregiver' },
                ].map((c) => (
                  <TouchableOpacity
                    key={c.value}
                    style={[styles.gridChip, { flex: 1, marginRight: 6 }, caregiverType === c.value && styles.gridChipActive]}
                    onPress={() => setCaregiverType(c.value)}
                  >
                    <Text style={[styles.gridChipText, caregiverType === c.value && styles.gridChipTextActive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>
                Relationship to Elderly <Text style={styles.optionalTag}>(Optional)</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Son, Daughter, Private Nurse"
                placeholderTextColor="#94A3B8"
                value={relationshipToElderly}
                onChangeText={setRelationshipToElderly}
              />

              <Text style={styles.fieldLabel}>
                Clinic / Organization Name <Text style={styles.optionalTag}>(Optional)</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Grace Care Agency"
                placeholderTextColor="#94A3B8"
                value={organizationName}
                onChangeText={setOrganizationName}
              />
            </View>
          )}

          {/* Role-Specific: Elderly */}
          {role === 'elderly' && (
            <View style={[styles.roleSectionCard, styles.roleSectionCardElderly]}>
              <Text style={[styles.roleSectionTitle, styles.roleSectionTitleElderly]}>
                Emergency Contact <Text style={styles.optionalTagElderly}>(Optional)</Text>
              </Text>
              
              <Text style={styles.fieldLabelElderly}>Contact Name <Text style={styles.optionalTagElderly}>(Optional)</Text></Text>
              <TextInput
                style={[styles.input, styles.inputElderly]}
                placeholder="Emergency Contact Name"
                placeholderTextColor="#94A3B8"
                value={emergencyName}
                onChangeText={setEmergencyName}
              />

              <Text style={styles.fieldLabelElderly}>Relationship <Text style={styles.optionalTagElderly}>(Optional)</Text></Text>
              <TextInput
                style={[styles.input, styles.inputElderly]}
                placeholder="Relation (e.g. Son, Daughter)"
                placeholderTextColor="#94A3B8"
                value={emergencyRelation}
                onChangeText={setEmergencyRelation}
              />

              <Text style={styles.fieldLabelElderly}>Emergency Phone <Text style={styles.optionalTagElderly}>(Optional)</Text></Text>
              <TextInput
                style={[styles.input, styles.inputElderly]}
                placeholder="Phone (07XXXXXXXX)"
                placeholderTextColor="#94A3B8"
                value={emergencyPhone}
                onChangeText={setEmergencyPhone}
                keyboardType="phone-pad"
              />
            </View>
          )}

          {/* Register Action Button */}
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              isElderly && styles.primaryBtnElderly,
            ]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size={isElderly ? 'large' : 'small'} />
            ) : (
              <Text style={[styles.primaryBtnText, isElderly && styles.primaryBtnTextElderly]}>
                {isElderly ? '✓ Complete Registration' : 'Complete Registration'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Navigation to Login */}
          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => onNavigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={[styles.linkText, isElderly && styles.linkTextElderly]}>
              Already have an account? <Text style={{ color: '#1E40AF', fontWeight: '800' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { paddingHorizontal: 20, paddingVertical: 20 },
  containerElderly: { paddingHorizontal: 24, paddingVertical: 24 },
  
  header: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#1E40AF', marginBottom: 4 },
  titleElderly: { fontSize: 32, fontWeight: '900', color: '#1A365D', marginBottom: 6 },
  brandSubtitle: { fontSize: 15, fontWeight: '600', color: '#0D9488' },
  brandSubtitleElderly: { fontSize: 18, fontWeight: '700', color: '#0F766E' },
  
  elderlyBadgeBanner: {
    marginTop: 12,
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  elderlyBadgeBannerText: {
    color: '#1E3A8A',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },

  bannerErrorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  bannerErrorTitle: {
    color: '#991B1B',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerErrorText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },

  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#1E3A8A', marginTop: 16, marginBottom: 10 },
  sectionHeaderElderly: { fontSize: 22, fontWeight: '800', color: '#1A365D', marginTop: 22, marginBottom: 14 },
  
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#334155', marginTop: 10, marginBottom: 6 },
  fieldLabelElderly: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 14, marginBottom: 8 },
  
  reqStar: { color: '#DC2626', fontWeight: '900', fontSize: 16 },
  optionalTag: { color: '#64748B', fontWeight: '500', fontSize: 12 },
  optionalTagElderly: { color: '#475569', fontWeight: '600', fontSize: 15 },

  row: { flexDirection: 'row', alignItems: 'center' },

  roleSelector: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  roleChip: {
    flex: 1,
    minWidth: 100,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleChipElderly: {
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
  },
  roleChipActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  roleChipText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  roleChipTextElderly: { fontSize: 17, fontWeight: '800' },
  roleChipTextActive: { color: '#FFFFFF' },

  input: {
    height: 52,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  inputElderly: {
    height: 62,
    borderRadius: 12,
    fontSize: 19,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
  },

  datePickerBtn: {
    height: 52,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  datePickerBtnElderly: {
    height: 62,
    borderRadius: 12,
    borderWidth: 2.5,
    backgroundColor: '#DBEAFE',
  },
  datePickerBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E40AF',
  },
  datePickerBtnTextElderly: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  datePickerIconText: {
    fontSize: 18,
  },

  gridSelectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6,
  },
  gridChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridChipElderly: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    minHeight: 52,
    borderRadius: 26,
    borderWidth: 2,
  },
  gridChipActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  gridChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  gridChipTextElderly: {
    fontSize: 17,
    fontWeight: '800',
  },
  gridChipTextActive: {
    color: '#FFFFFF',
  },

  roleSectionCard: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 14,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleSectionCardElderly: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#BFDBFE',
    backgroundColor: '#F0F9FF',
  },
  roleSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 10,
  },
  roleSectionTitleElderly: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E40AF',
    marginBottom: 14,
  },

  primaryBtn: {
    height: 56,
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnElderly: {
    height: 66,
    borderRadius: 16,
    backgroundColor: '#1D4ED8',
    marginTop: 24,
    borderWidth: 2,
    borderColor: '#1E40AF',
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  primaryBtnTextElderly: { fontSize: 22, fontWeight: '900' },

  linkBtn: { marginVertical: 20, alignItems: 'center' },
  linkText: { fontSize: 14, color: '#334155', fontWeight: '600' },
  linkTextElderly: { fontSize: 18, color: '#1E293B', fontWeight: '700' },
});