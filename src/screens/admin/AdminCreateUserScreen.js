// src/screens/admin/AdminCreateUserScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import * as adminUserService from '../../services/adminUserService';
import CalendarDatePickerModal from '../../components/common/CalendarDatePickerModal';
import ProvinceDistrictSelectorModal from '../../components/common/ProvinceDistrictSelectorModal';

// Helper to calculate age from Date of Birth string (YYYY-MM-DD)
function calculateAge(dobString) {
  if (!dobString) return 0;
  const parsed = new Date(`${dobString}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return 0;
  const diff = Date.now() - parsed.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export default function AdminCreateUserScreen({ onBack, onUserCreated }) {
  // Primary attributes
  const [role, setRole] = useState('elderly'); // 'elderly' | 'volunteer' | 'caregiver'
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1975-01-01');
  const [gender, setGender] = useState('male'); // 'male' | 'female'

  // Address attributes
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [province, setProvince] = useState('Western');
  const [district, setDistrict] = useState('Colombo');

  // Role Extras: Volunteer
  const [volunteerIdType, setVolunteerIdType] = useState('NIC'); // 'NIC' | 'Student ID' | 'Passport'
  const [volunteerIdNumber, setVolunteerIdNumber] = useState('');
  const [educationalInstitution, setEducationalInstitution] = useState('');

  // Role Extras: Caregiver
  const [caregiverType, setCaregiverType] = useState('family_member'); // 'family_member' | 'formal_caregiver'
  const [relationshipToElderly, setRelationshipToElderly] = useState('');
  const [organizationName, setOrganizationName] = useState('');

  // Role Extras: Elderly (Emergency Contact)
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // UI Modals & Loading State
  const [showCalendar, setShowCalendar] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const computedAge = calculateAge(dateOfBirth);

  const validateInputs = () => {
    const errorList = [];

    // Basic fields validation
    if (!firstName || !firstName.trim()) {
      errorList.push('First name is required.');
    } else if (!/^[A-Za-z\s]+$/.test(firstName.trim())) {
      errorList.push('First name can only contain letters.');
    }

    if (!lastName || !lastName.trim()) {
      errorList.push('Last name is required.');
    } else if (!/^[A-Za-z\s]+$/.test(lastName.trim())) {
      errorList.push('Last name can only contain letters.');
    }

    if (!email || !email.trim()) {
      errorList.push('Email address is required.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase())) {
      errorList.push('Please enter a valid email address.');
    }

    if (!password) {
      errorList.push('Temporary password is required.');
    } else if (password.length < 4) {
      errorList.push('Password must be at least 4 characters long.');
    }

    if (!phone || !phone.trim()) {
      errorList.push('Phone number is required.');
    } else if (!/^(?:0|94|\+94)?(7[0-9]{8})$/.test(phone.trim())) {
      errorList.push('Please provide a valid Sri Lankan mobile number (e.g. 07XXXXXXXX).');
    }

    // DOB & Age validation
    if (!dateOfBirth) {
      errorList.push('Date of birth is required.');
    } else {
      if (computedAge < 10 || computedAge > 150) {
        errorList.push('Date of Birth indicates an invalid age (must be between 10 and 150 years).');
      }
      if (role === 'elderly' && computedAge < 40) {
        errorList.push('Users registering for the Elderly role must be at least 40 years old.');
      }
    }

    // Address validation
    if (!streetAddress || !streetAddress.trim()) {
      errorList.push('Street address is required.');
    }
    if (!city || !city.trim()) {
      errorList.push('City is required.');
    }
    if (!postalCode || !postalCode.trim()) {
      errorList.push('Postal Code is required.');
    } else if (!/^\d+$/.test(postalCode.trim())) {
      errorList.push('Postal Code must contain digits only.');
    }
    if (!province || !district) {
      errorList.push('Province and District selection is required.');
    }

    // Role-specific validations
    if (role === 'volunteer') {
      if (!volunteerIdNumber || !volunteerIdNumber.trim()) {
        errorList.push(`Please provide your ${volunteerIdType} Number.`);
      }
      if (volunteerIdType === 'Student ID' && (!educationalInstitution || !educationalInstitution.trim())) {
        errorList.push('Please specify your University / Educational Institution Name.');
      }
    }

    if (role === 'elderly' && emergencyPhone.trim()) {
      if (!/^(?:0|94|\+94)?(7[0-9]{8})$/.test(emergencyPhone.trim())) {
        errorList.push('Emergency contact phone must be a valid Sri Lankan mobile number.');
      }
    }

    if (errorList.length > 0) {
      const combinedMsg = errorList.join('\n• ');
      setValidationError(combinedMsg);
      Alert.alert(
        'Validation Attention',
        `Please resolve the following requirement(s):\n\n• ${combinedMsg}`
      );
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleCreate = async () => {
    if (!validateInputs()) return;

    try {
      setIsLoading(true);
      const payload = {
        role,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        dateOfBirth,
        gender,
        address: {
          streetAddress: streetAddress.trim(),
          city: city.trim(),
          postalCode: postalCode.trim(),
          district,
          province,
        },
        volunteerIdType: role === 'volunteer' ? volunteerIdType : null,
        volunteerIdNumber: role === 'volunteer' ? volunteerIdNumber.trim() : '',
        educationalInstitution: role === 'volunteer' && volunteerIdType === 'Student ID' ? educationalInstitution.trim() : '',
        caregiverType: role === 'caregiver' ? caregiverType : null,
        relationshipToElderly: role === 'caregiver' && caregiverType === 'family_member' ? relationshipToElderly.trim() : '',
        organizationName: role === 'caregiver' && caregiverType === 'formal_caregiver' ? organizationName.trim() : '',
        emergencyContact: role === 'elderly' ? {
          name: emergencyName.trim(),
          relation: emergencyRelation.trim(),
          phone: emergencyPhone.trim(),
        } : undefined,
      };

      const res = await adminUserService.createAdminUser(payload);
      if (res?.success) {
        Alert.alert('Success', `User ${res.user.firstName} (${res.user.customId}) created successfully!`);
        if (onUserCreated) onUserCreated();
        onBack();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not create user.';
      setValidationError(msg);
      Alert.alert('Creation Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create New User</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Validation Error Banner */}
        {validationError ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{validationError}</Text>
          </View>
        ) : null}

        {/* Role Selector */}
        <Text style={styles.fieldLabel}>Select User Role *</Text>
        <View style={styles.roleToggleRow}>
          {[
            { key: 'elderly', label: 'ELDERLY' },
            { key: 'volunteer', label: 'VOLUNTEER' },
            { key: 'caregiver', label: 'CAREGIVER' },
          ].map((r) => (
            <TouchableOpacity
              key={r.key}
              style={[styles.rolePill, role === r.key && styles.rolePillActive]}
              onPress={() => setRole(r.key)}
            >
              <Text style={[styles.rolePillText, role === r.key && styles.rolePillTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Basic Information */}
        <Text style={styles.sectionHeader}>Personal Information</Text>

        <Text style={styles.fieldLabel}>First Name *</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={(val) => { setFirstName(val); setValidationError(''); }}
          placeholder="e.g. Kasun"
        />

        <Text style={styles.fieldLabel}>Last Name *</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={(val) => { setLastName(val); setValidationError(''); }}
          placeholder="e.g. Perera"
        />

        <Text style={styles.fieldLabel}>Email Address *</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={(val) => { setEmail(val); setValidationError(''); }}
          placeholder="user@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.fieldLabel}>Temporary Password *</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={(val) => { setPassword(val); setValidationError(''); }}
          secureTextEntry
          placeholder="At least 4 characters"
        />

        <Text style={styles.fieldLabel}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={(val) => { setPhone(val); setValidationError(''); }}
          placeholder="07XXXXXXXX"
          keyboardType="phone-pad"
        />

        {/* Date of Birth Picker */}
        <Text style={styles.fieldLabel}>Date of Birth *</Text>
        <TouchableOpacity
          style={styles.selectorBtn}
          onPress={() => setShowCalendar(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.selectorBtnText}>
            {dateOfBirth ? `${dateOfBirth} (${computedAge} years old)` : 'Tap to select date from Calendar'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
        </TouchableOpacity>

        {/* Gender Pills */}
        <Text style={styles.fieldLabel}>Gender *</Text>
        <View style={styles.roleToggleRow}>
          {[
            { label: 'MALE', value: 'male' },
            { label: 'FEMALE', value: 'female' },
          ].map((g) => (
            <TouchableOpacity
              key={g.value}
              style={[styles.rolePill, gender === g.value && styles.rolePillActive]}
              onPress={() => setGender(g.value)}
            >
              <Text style={[styles.rolePillText, gender === g.value && styles.rolePillTextActive]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Address & Location */}
        <Text style={styles.sectionHeader}>Address & Location</Text>

        <Text style={styles.fieldLabel}>Street Address *</Text>
        <TextInput
          style={styles.input}
          value={streetAddress}
          onChangeText={(val) => { setStreetAddress(val); setValidationError(''); }}
          placeholder="e.g. 123 Main Street"
        />

        <Text style={styles.fieldLabel}>City *</Text>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={(val) => { setCity(val); setValidationError(''); }}
          placeholder="e.g. Maharagama"
        />

        <Text style={styles.fieldLabel}>Postal Code *</Text>
        <TextInput
          style={styles.input}
          value={postalCode}
          onChangeText={(val) => { setPostalCode(val); setValidationError(''); }}
          placeholder="e.g. 10280"
          keyboardType="number-pad"
        />

        <Text style={styles.fieldLabel}>Province & District *</Text>
        <TouchableOpacity
          style={styles.selectorBtn}
          onPress={() => setShowLocationPicker(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="map-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.selectorBtnText}>
            {province} Province • {district} District
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
        </TouchableOpacity>

        {/* Role Specific Extra Sections */}
        {role === 'elderly' && (
          <>
            <Text style={styles.sectionHeader}>Emergency Contact (Optional)</Text>

            <Text style={styles.fieldLabel}>Contact Person Name</Text>
            <TextInput
              style={styles.input}
              value={emergencyName}
              onChangeText={setEmergencyName}
              placeholder="e.g. Nimal Perera"
            />

            <Text style={styles.fieldLabel}>Relationship to Elderly</Text>
            <TextInput
              style={styles.input}
              value={emergencyRelation}
              onChangeText={setEmergencyRelation}
              placeholder="e.g. Son, Daughter, Neighbor"
            />

            <Text style={styles.fieldLabel}>Emergency Phone Number</Text>
            <TextInput
              style={styles.input}
              value={emergencyPhone}
              onChangeText={setEmergencyPhone}
              placeholder="e.g. 0771234567"
              keyboardType="phone-pad"
            />
          </>
        )}

        {role === 'volunteer' && (
          <>
            <Text style={styles.sectionHeader}>Volunteer Verification Details</Text>

            <Text style={styles.fieldLabel}>Volunteer ID Type *</Text>
            <View style={styles.roleToggleRow}>
              {['NIC', 'Student ID', 'Passport'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.rolePill, volunteerIdType === t && styles.rolePillActive]}
                  onPress={() => setVolunteerIdType(t)}
                >
                  <Text style={[styles.rolePillText, volunteerIdType === t && styles.rolePillTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>ID Number *</Text>
            <TextInput
              style={styles.input}
              value={volunteerIdNumber}
              onChangeText={(val) => { setVolunteerIdNumber(val); setValidationError(''); }}
              placeholder="e.g. 199512345678 or Student/Passport No"
            />

            {volunteerIdType === 'Student ID' && (
              <>
                <Text style={styles.fieldLabel}>University / School Name *</Text>
                <TextInput
                  style={styles.input}
                  value={educationalInstitution}
                  onChangeText={(val) => { setEducationalInstitution(val); setValidationError(''); }}
                  placeholder="e.g. University of Colombo"
                />
              </>
            )}
          </>
        )}

        {role === 'caregiver' && (
          <>
            <Text style={styles.sectionHeader}>Caregiver Role Details</Text>

            <Text style={styles.fieldLabel}>Caregiver Category *</Text>
            <View style={styles.roleToggleRow}>
              {[
                { label: 'FAMILY MEMBER', value: 'family_member' },
                { label: 'FORMAL CAREGIVER', value: 'formal_caregiver' },
              ].map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.rolePill, caregiverType === c.value && styles.rolePillActive]}
                  onPress={() => setCaregiverType(c.value)}
                >
                  <Text style={[styles.rolePillText, caregiverType === c.value && styles.rolePillTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {caregiverType === 'family_member' && (
              <>
                <Text style={styles.fieldLabel}>Relationship to Elderly</Text>
                <TextInput
                  style={styles.input}
                  value={relationshipToElderly}
                  onChangeText={setRelationshipToElderly}
                  placeholder="e.g. Daughter, Nephew, Primary Family Caregiver"
                />
              </>
            )}

            {caregiverType === 'formal_caregiver' && (
              <>
                <Text style={styles.fieldLabel}>Organization / Agency Name</Text>
                <TextInput
                  style={styles.input}
                  value={organizationName}
                  onChangeText={setOrganizationName}
                  placeholder="e.g. Prime Care Services Pvt Ltd"
                />
              </>
            )}
          </>
        )}

        <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.createBtnText}>Create User Account</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      <CalendarDatePickerModal
        visible={showCalendar}
        initialDate={dateOfBirth || '1975-01-01'}
        onConfirm={(selectedDate) => {
          setDateOfBirth(selectedDate);
          setValidationError('');
          setShowCalendar(false);
        }}
        onClose={() => setShowCalendar(false)}
      />

      {/* Province & District Location Selector Modal */}
      <ProvinceDistrictSelectorModal
        visible={showLocationPicker}
        currentProvince={province}
        currentDistrict={district}
        onConfirm={({ province: p, district: d }) => {
          setProvince(p);
          setDistrict(d);
          setValidationError('');
        }}
        onClose={() => setShowLocationPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  scrollContent: { padding: 16, paddingBottom: 150 },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 18,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginTop: 10, marginBottom: 4 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  selectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginVertical: 4,
  },
  selectorBtnText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  roleToggleRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  rolePill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  rolePillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  rolePillText: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  rolePillTextActive: { color: '#FFFFFF' },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: { flex: 1, fontSize: 12, color: '#B91C1C', fontWeight: '600' },
  createBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  createBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
