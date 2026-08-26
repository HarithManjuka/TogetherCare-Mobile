// src/components/common/EditProfileModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CalendarDatePickerModal from './CalendarDatePickerModal';
import ProvinceDistrictSelectorModal from './ProvinceDistrictSelectorModal';

/**
 * Role-Adaptive Edit Profile Modal
 * Allows updating editable personal, address, and role-specific fields
 * while keeping system credentials (email, customId, statuses) safely locked.
 */
export default function EditProfileModal({ visible, onClose, user, onSaveSuccess }) {
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Common fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [district, setDistrict] = useState('Colombo');
  const [province, setProvince] = useState('Western');

  // Elderly fields
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Caregiver fields
  const [relationshipToElderly, setRelationshipToElderly] = useState('');
  const [organizationName, setOrganizationName] = useState('');

  // Volunteer fields
  const [volunteerIdType, setVolunteerIdType] = useState('');
  const [volunteerIdNumber, setVolunteerIdNumber] = useState('');
  const [educationalInstitution, setEducationalInstitution] = useState('');

  useEffect(() => {
    if (user && visible) {
      setValidationError('');
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
      setDateOfBirth(user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '');
      setStreetAddress(user.address?.streetAddress || '');
      setCity(user.address?.city || '');
      setPostalCode(user.address?.postalCode || '');
      setDistrict(user.address?.district || 'Colombo');
      setProvince(user.address?.province || 'Western');

      setEmergencyName(user.emergencyContact?.name || '');
      setEmergencyRelation(user.emergencyContact?.relation || '');
      setEmergencyPhone(user.emergencyContact?.phone || '');

      setRelationshipToElderly(user.relationshipToElderly || '');
      setOrganizationName(user.organizationName || '');

      setVolunteerIdType(user.volunteerIdType || '');
      setVolunteerIdNumber(user.volunteerIdNumber || '');
      setEducationalInstitution(user.educationalInstitution || '');
    }
  }, [user, visible]);

  if (!visible) return null;

  const handleSubmit = async () => {
    const errorList = [];

    // Registration-Style Field Validations
    if (!firstName.trim()) {
      errorList.push('First name is required.');
    } else if (!/^[A-Za-z\s]+$/.test(firstName.trim())) {
      errorList.push('First name can only contain letters.');
    }

    if (!lastName.trim()) {
      errorList.push('Last name is required.');
    } else if (!/^[A-Za-z\s]+$/.test(lastName.trim())) {
      errorList.push('Last name can only contain letters.');
    }

    if (phone.trim() && !/^(?:0|94|\+94)?(7[0-9]{8})$/.test(phone.trim())) {
      errorList.push('Please enter a valid Sri Lankan mobile number (e.g. 07XXXXXXXX).');
    }

    if (postalCode.trim() && !/^\d+$/.test(postalCode.trim())) {
      errorList.push('Postal Code must contain only numbers.');
    }

    if (user?.role === 'elderly' && emergencyPhone.trim()) {
      if (!/^(?:0|94|\+94)?(7[0-9]{8})$/.test(emergencyPhone.trim())) {
        errorList.push('Emergency contact phone must be a valid Sri Lankan mobile number.');
      }
    }

    if (errorList.length > 0) {
      const combinedMsg = errorList.join('\n• ');
      setValidationError(combinedMsg);
      Alert.alert(
        'Validation Attention',
        `Please resolve the following requirement(s) before saving:\n\n• ${combinedMsg}`
      );
      return;
    }

    setValidationError('');

    try {
      setLoading(true);
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        address: {
          streetAddress: streetAddress.trim() || user.address?.streetAddress || '',
          city: city.trim() || user.address?.city || '',
          postalCode: postalCode.trim() || user.address?.postalCode || '',
          district: district.trim() || user.address?.district || 'Colombo',
          province: province.trim() || user.address?.province || 'Western',
        },
      };

      if (dateOfBirth) {
        const parsedDob = new Date(`${dateOfBirth}T00:00:00`);
        if (!isNaN(parsedDob.getTime())) {
          payload.dateOfBirth = parsedDob.toISOString();
        }
      }

      if (user.role === 'elderly') {
        payload.emergencyContact = {
          name: emergencyName.trim(),
          relation: emergencyRelation.trim(),
          phone: emergencyPhone.trim(),
        };
      }

      if (user.role === 'caregiver') {
        payload.relationshipToElderly = relationshipToElderly.trim();
        payload.organizationName = organizationName.trim();
      }

      if (user.role === 'volunteer') {
        payload.volunteerIdType = volunteerIdType.trim() || user.volunteerIdType;
        payload.volunteerIdNumber = volunteerIdNumber.trim();
        payload.educationalInstitution = educationalInstitution.trim();
      }

      await onSaveSuccess(payload);
      Alert.alert('Success', 'Profile details updated successfully!');
      onClose();
    } catch (err) {
      console.error('Update profile error:', err);
      const serverMsg = err.response?.data?.message || err.message || 'Could not update profile details.';
      setValidationError(serverMsg);
      Alert.alert('Update Failed', serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const isVolunteer = user?.role === 'volunteer';
  const isElderly = user?.role === 'elderly';
  const isCaregiver = user?.role === 'caregiver';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="create-outline" size={22} color="#1E40AF" />
              <Text style={styles.modalTitle}>Edit Profile Details</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Registration-Style Banner Error Display */}
            {validationError !== '' && (
              <View style={styles.bannerErrorBox}>
                <View style={styles.bannerErrorTitleRow}>
                  <Ionicons name="alert-circle" size={18} color="#B91C1C" style={{ marginRight: 6 }} />
                  <Text style={styles.bannerErrorTitle}>Validation Error(s)</Text>
                </View>
                <Text style={styles.bannerErrorText}>• {validationError}</Text>
              </View>
            )}

            {/* Locked Non-Editable Credentials Pill Banner */}
            <View style={styles.lockedSectionCard}>
              <View style={styles.lockedHeaderRow}>
                <Ionicons name="lock-closed" size={14} color="#475569" style={{ marginRight: 6 }} />
                <Text style={styles.lockedHeaderTitle}>Secured System Identifiers (Read-Only)</Text>
              </View>

              <View style={styles.lockedGrid}>
                <View style={styles.lockedPill}>
                  <Text style={styles.lockedLabel}>Email:</Text>
                  <Text style={styles.lockedValue}>{user?.email}</Text>
                </View>
                <View style={styles.lockedPill}>
                  <Text style={styles.lockedLabel}>User ID:</Text>
                  <Text style={styles.lockedValue}>{user?.customId || 'USER-ID'}</Text>
                </View>
                <View style={styles.lockedPill}>
                  <Text style={styles.lockedLabel}>Role:</Text>
                  <Text style={styles.lockedValue}>{user?.role?.toUpperCase()}</Text>
                </View>
                <View style={styles.lockedPill}>
                  <Text style={styles.lockedLabel}>Status:</Text>
                  <Text style={styles.lockedValue}>{user?.accountStatus || 'active'}</Text>
                </View>
              </View>
            </View>

            {/* Personal Information */}
            <Text style={styles.fieldSectionTitle}>Personal Information</Text>

            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={(val) => { setFirstName(val); setValidationError(''); }}
              placeholder="First Name"
            />

            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={(val) => { setLastName(val); setValidationError(''); }}
              placeholder="Last Name"
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(val) => { setPhone(val); setValidationError(''); }}
              keyboardType="phone-pad"
              placeholder="07XXXXXXXX"
            />

            <Text style={styles.label}>Date of Birth (Calendar Selection)</Text>
            <TouchableOpacity
              style={styles.selectorBtn}
              onPress={() => setShowCalendar(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={18} color="#1E40AF" style={{ marginRight: 8 }} />
              <Text style={styles.selectorBtnText}>
                {dateOfBirth ? dateOfBirth : 'Tap to open Calendar Picker'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </TouchableOpacity>

            {/* Residential Location */}
            <Text style={styles.fieldSectionTitle}>Residential Location</Text>

            <Text style={styles.label}>Street Address</Text>
            <TextInput style={styles.input} value={streetAddress} onChangeText={setStreetAddress} placeholder="Street Address" />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>City</Text>
                <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="City" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Postal Code</Text>
                <TextInput style={styles.input} value={postalCode} onChangeText={setPostalCode} keyboardType="number-pad" placeholder="Postal Code" />
              </View>
            </View>

            <Text style={styles.label}>Province & District (Selection)</Text>
            <TouchableOpacity
              style={styles.selectorBtn}
              onPress={() => setShowLocationPicker(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="map-outline" size={18} color="#1E40AF" style={{ marginRight: 8 }} />
              <Text style={styles.selectorBtnText}>
                {province} Province • {district} District
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </TouchableOpacity>

            {/* Role Specific Section */}
            {isElderly && (
              <>
                <Text style={styles.fieldSectionTitle}>Emergency Contact Information</Text>
                <Text style={styles.label}>Contact Name</Text>
                <TextInput style={styles.input} value={emergencyName} onChangeText={setEmergencyName} placeholder="Emergency Contact Name" />

                <Text style={styles.label}>Relationship</Text>
                <TextInput style={styles.input} value={emergencyRelation} onChangeText={setEmergencyRelation} placeholder="e.g. Daughter / Son" />

                <Text style={styles.label}>Emergency Phone</Text>
                <TextInput style={styles.input} value={emergencyPhone} onChangeText={setEmergencyPhone} keyboardType="phone-pad" placeholder="07XXXXXXXX" />
              </>
            )}

            {isCaregiver && (
              <>
                <Text style={styles.fieldSectionTitle}>Caregiver Details</Text>
                <Text style={styles.label}>Relationship to Elderly</Text>
                <TextInput style={styles.input} value={relationshipToElderly} onChangeText={setRelationshipToElderly} placeholder="e.g. Primary Caretaker / Relative" />

                <Text style={styles.label}>Organization / Agency Name</Text>
                <TextInput style={styles.input} value={organizationName} onChangeText={setOrganizationName} placeholder="Independent or Agency Name" />
              </>
            )}

            {isVolunteer && (
              <>
                <Text style={styles.fieldSectionTitle}>Volunteer Credentials</Text>
                <Text style={styles.label}>ID Document Type</Text>
                <TextInput style={styles.input} value={volunteerIdType} onChangeText={setVolunteerIdType} placeholder="NIC / Passport / Student ID" />

                <Text style={styles.label}>ID Document Number</Text>
                <TextInput style={styles.input} value={volunteerIdNumber} onChangeText={setVolunteerIdNumber} placeholder="ID Number" />

                <Text style={styles.label}>Educational Institution</Text>
                <TextInput style={styles.input} value={educationalInstitution} onChangeText={setEducationalInstitution} placeholder="School / University Name" />
              </>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Modal Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Sub-Modals for Date of Birth Calendar & Province/District Picker */}
        <CalendarDatePickerModal
          visible={showCalendar}
          initialDate={dateOfBirth || '1985-01-01'}
          onConfirm={(selectedDate) => {
            setDateOfBirth(selectedDate);
            setValidationError('');
            setShowCalendar(false);
          }}
          onClose={() => setShowCalendar(false)}
        />

        <ProvinceDistrictSelectorModal
          visible={showLocationPicker}
          currentProvince={province}
          currentDistrict={district}
          onConfirm={({ province: prov, district: dist }) => {
            setProvince(prov);
            setDistrict(dist);
            setValidationError('');
            setShowLocationPicker(false);
          }}
          onClose={() => setShowLocationPicker(false)}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 40 : 20,
  },
  modalCard: {
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  formScroll: {
    marginTop: 12,
  },
  bannerErrorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  bannerErrorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bannerErrorTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
  },
  bannerErrorText: {
    fontSize: 12.5,
    color: '#B91C1C',
    lineHeight: 18,
    fontWeight: '600',
  },
  lockedSectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  lockedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  lockedHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  lockedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  lockedLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  lockedValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
  },
  fieldSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E40AF',
    marginTop: 12,
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  selectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 2,
    marginBottom: 6,
  },
  selectorBtnText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  saveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#1E40AF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
