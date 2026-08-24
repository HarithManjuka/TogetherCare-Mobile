// src/screens/caregiver/AddDependentScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import client from '../../api/client';
import { COLORS, SIZES } from '../../constants/theme';
import { SRI_LANKA_PROVINCES, SRI_LANKA_DISTRICTS } from '../../constants/locations';
import CalendarDatePickerModal from '../../components/common/CalendarDatePickerModal';

export default function AddDependentScreen({ onBack, onSuccess }) {
  const [activeTab, setActiveTab] = useState('link'); // 'link' | 'create'
  const [unlinkedProfiles, setUnlinkedProfiles] = useState([]);
  const [fetchingUnlinked, setFetchingUnlinked] = useState(true);
  const [linkConfirmVisible, setLinkConfirmVisible] = useState(false);
  const [profileToLink, setProfileToLink] = useState(null);

  // Custom Alert States
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertTitle, setCustomAlertTitle] = useState('');
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [customAlertConfirmText, setCustomAlertConfirmText] = useState('OK');
  const [customAlertOnConfirm, setCustomAlertOnConfirm] = useState(null);

  // Manual Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dobObject, setDobObject] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Address
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [province, setProvince] = useState('Western');
  const [district, setDistrict] = useState('Colombo');

  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const [loading, setLoading] = useState(false);

  const fetchUnlinkedProfiles = async () => {
    try {
      setFetchingUnlinked(true);
      const res = await client.get('/caregiver/dependents/unlinked');
      if (res.data?.success) {
        setUnlinkedProfiles(res.data.data);
      }
    } catch (error) {
      console.error('Fetch Unlinked Profiles Error:', error);
    } finally {
      setFetchingUnlinked(false);
    }
  };

  useEffect(() => {
    fetchUnlinkedProfiles();
  }, []);

  const handleDateSelect = (dateStr, dateObj) => {
    setDateOfBirth(dateStr); // YYYY-MM-DD
    setDobObject(dateObj);
    setShowDatePicker(false);
  };

  const handleProvinceChange = (selectedProvince) => {
    setProvince(selectedProvince);
    const districts = SRI_LANKA_DISTRICTS[selectedProvince] || [];
    setDistrict(districts[0] || '');
  };

  const showCustomAlert = (title, message, onConfirm = null) => {
    setCustomAlertTitle(title);
    setCustomAlertMessage(message);
    setCustomAlertOnConfirm(() => onConfirm);
    setCustomAlertVisible(true);
  };

  const handleLinkExisting = (elderlyId, name) => {
    setProfileToLink({ id: elderlyId, name });
    setLinkConfirmVisible(true);
  };

  const handleSubmit = async () => {
    if (!firstName || !lastName || !phone || !dateOfBirth || !streetAddress || !city || !postalCode) {
      showCustomAlert('Missing Fields', 'Please fill in all mandatory elderly profile fields.');
      return;
    }

    setLoading(false);
    try {
      setLoading(true);
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        dateOfBirth,
        address: {
          streetAddress: streetAddress.trim(),
          city: city.trim(),
          postalCode: postalCode.trim(),
          district,
          province,
        },
        emergencyContact: emergencyName
          ? {
              name: emergencyName.trim(),
              relation: emergencyRelation.trim(),
              phone: emergencyPhone.trim(),
            }
          : undefined,
      };

      const response = await client.post('/caregiver/dependents', payload);
      if (response.data?.success) {
        showCustomAlert('Success', 'Elderly dependent profile linked successfully!', () => onSuccess());
      } else {
        showCustomAlert('Failed', response.data?.message || 'Failed to create dependent profile');
      }
    } catch (error) {
      console.error('Create Dependent Error:', error);
      showCustomAlert(
        'Error',
        error.response?.data?.message || 'Server error while creating dependent profile'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-back-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Dependent</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'link' && styles.tabButtonActive]}
            onPress={() => setActiveTab('link')}
          >
            <Icon
              name="link-outline"
              size={18}
              color={activeTab === 'link' ? '#FFFFFF' : COLORS.textSecondary}
            />
            <Text style={[styles.tabButtonText, activeTab === 'link' && styles.tabButtonTextActive]}>
              Link Registered Account
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'create' && styles.tabButtonActive]}
            onPress={() => setActiveTab('create')}
          >
            <Icon
              name="create-outline"
              size={18}
              color={activeTab === 'create' ? '#FFFFFF' : COLORS.textSecondary}
            />
            <Text style={[styles.tabButtonText, activeTab === 'create' && styles.tabButtonTextActive]}>
              Create New Manually
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          {activeTab === 'link' ? (
            /* Tab 1: Link Existing registered profiles */
            <View>
              <Text style={styles.sectionTitle}>Registered Elderly Profiles</Text>
              <Text style={styles.sectionSubtitle}>
                Select an already registered elderly person to link to your account.
              </Text>

              {fetchingUnlinked ? (
                <View style={{ paddingVertical: 40 }}>
                  <ActivityIndicator size="large" color={COLORS.secondary} />
                  <Text style={{ textAlign: 'center', marginTop: 10, color: COLORS.textSecondary }}>
                    Fetching registered profiles...
                  </Text>
                </View>
              ) : unlinkedProfiles.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon name="people-outline" size={40} color="#94A3B8" />
                  <Text style={styles.emptyStateText}>
                    No registered unlinked elderly accounts found in your community.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyStateBtn}
                    onPress={() => setActiveTab('create')}
                  >
                    <Text style={styles.emptyStateBtnText}>Create Profile Manually</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.unlinkedList}>
                  {unlinkedProfiles.map((profile) => (
                    <View key={profile._id} style={styles.unlinkedCard}>
                      <View style={styles.unlinkedInfo}>
                        <Text style={styles.unlinkedName}>
                          {profile.firstName} {profile.lastName}
                        </Text>
                        <Text style={styles.unlinkedDetails}>
                          ID: {profile.customId} • {profile.age} Yrs • {profile.phone}
                        </Text>
                        <Text style={[styles.unlinkedDetails, { color: COLORS.secondary }]}>
                          City: {profile.address?.city} ({profile.address?.district} District)
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.linkBtn}
                        onPress={() =>
                          handleLinkExisting(
                            profile._id,
                            `${profile.firstName} ${profile.lastName}`
                          )
                        }
                        disabled={loading}
                      >
                        <Text style={styles.linkBtnText}>Link</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            /* Tab 2: Manual Create Form */
            <View>
              <Text style={styles.sectionTitle}>Dependent Information</Text>

              {/* First Name */}
              <Text style={styles.label}>First Name <Text style={styles.req}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Grandmother's First Name"
              />

              {/* Last Name */}
              <Text style={styles.label}>Last Name <Text style={styles.req}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Grandmother's Last Name"
              />

              {/* Date of birth */}
              <Text style={styles.label}>Date of Birth <Text style={styles.req}>*</Text></Text>
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: dateOfBirth ? COLORS.textPrimary : '#9CA3AF' }}>
                  {dateOfBirth || 'Select Date of Birth'}
                </Text>
                <Icon name="calendar-outline" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>

              {/* Phone */}
              <Text style={styles.label}>Phone Number <Text style={styles.req}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. 0771234567"
                keyboardType="phone-pad"
              />

              <Text style={styles.sectionTitle}>Address Details</Text>

              {/* Street address */}
              <Text style={styles.label}>Street Address <Text style={styles.req}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={streetAddress}
                onChangeText={setStreetAddress}
                placeholder="Street address / No."
              />

              {/* City */}
              <Text style={styles.label}>City <Text style={styles.req}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="Malabe / Kandy"
              />

              {/* Postal code */}
              <Text style={styles.label}>Postal Code <Text style={styles.req}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder="e.g. 10115"
                keyboardType="number-pad"
              />

              {/* Province Dropdown Grid */}
              <Text style={styles.label}>Province <Text style={styles.req}>*</Text></Text>
              <View style={styles.pickerGrid}>
                {SRI_LANKA_PROVINCES.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.pickerChip,
                      province === p && styles.pickerChipActive,
                    ]}
                    onPress={() => handleProvinceChange(p)}
                  >
                    <Text style={[styles.pickerChipText, province === p && styles.pickerChipTextActive]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* District Dropdown Grid */}
              <Text style={styles.label}>District <Text style={styles.req}>*</Text></Text>
              <View style={styles.pickerGrid}>
                {(SRI_LANKA_DISTRICTS[province] || []).map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.pickerChip,
                      district === d && styles.pickerChipActive,
                    ]}
                    onPress={() => setDistrict(d)}
                  >
                    <Text style={[styles.pickerChipText, district === d && styles.pickerChipTextActive]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Emergency Contact (Optional)</Text>

              {/* Emergency Name */}
              <Text style={styles.label}>Contact Name</Text>
              <TextInput
                style={styles.input}
                value={emergencyName}
                onChangeText={setEmergencyName}
                placeholder="Full Name"
              />

              {/* Emergency Relation */}
              <Text style={styles.label}>Relationship</Text>
              <TextInput
                style={styles.input}
                value={emergencyRelation}
                onChangeText={setEmergencyRelation}
                placeholder="e.g. Daughter / Son"
              />

              {/* Emergency Phone */}
              <Text style={styles.label}>Contact Phone</Text>
              <TextInput
                style={styles.input}
                value={emergencyPhone}
                onChangeText={setEmergencyPhone}
                placeholder="e.g. 0777123456"
                keyboardType="phone-pad"
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Create & Link Profile</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <CalendarDatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onConfirm={handleDateSelect}
        title="Select Date of Birth"
        maxDate={new Date(Date.now() - 40 * 365.25 * 24 * 60 * 60 * 1000)} // Must be 40+ years old
      />

      {/* In-App Custom Confirm Link Modal */}
      <Modal
        visible={linkConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLinkConfirmVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setLinkConfirmVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalCard}>
                <View style={styles.modalIconWrap}>
                  <Icon name="link-outline" size={32} color={COLORS.secondary} />
                </View>
                <Text style={styles.modalTitle}>Link Dependent Account</Text>
                <Text style={styles.modalBodyText}>
                  Are you sure you want to link <Text style={{ fontWeight: 'bold', color: COLORS.textPrimary }}>{profileToLink?.name}</Text> to your caregiver account?
                </Text>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setLinkConfirmVisible(false)}
                    disabled={loading}
                  >
                    <Text style={styles.modalCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalConfirmBtn}
                    onPress={async () => {
                      try {
                        setLoading(true);
                        const res = await client.post('/caregiver/dependents/link', {
                          elderlyId: profileToLink?.id,
                        });
                        if (res.data?.success) {
                          setLinkConfirmVisible(false);
                          showCustomAlert('Success', `${profileToLink?.name} has been linked to your account!`, () => onSuccess());
                        } else {
                          showCustomAlert('Failed', res.data?.message || 'Failed to link profile');
                        }
                      } catch (error) {
                        console.error('Link Dependent Error:', error);
                        showCustomAlert(
                          'Error',
                          error.response?.data?.message || 'Server error while linking profile'
                        );
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalConfirmBtnText}>Link Account</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Custom In-App Info / Error / Success Modal */}
      <Modal
        visible={customAlertVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setCustomAlertVisible(false);
          if (customAlertOnConfirm) customAlertOnConfirm();
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          setCustomAlertVisible(false);
          if (customAlertOnConfirm) customAlertOnConfirm();
        }}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalCard}>
                <View style={[styles.modalIconWrap, customAlertTitle === 'Success' ? { backgroundColor: '#E8F5E9' } : { backgroundColor: '#FFEBEE' }]}>
                  <Icon
                    name={customAlertTitle === 'Success' ? 'checkmark-circle-outline' : 'warning-outline'}
                    size={32}
                    color={customAlertTitle === 'Success' ? COLORS.success : COLORS.danger}
                  />
                </View>
                <Text style={styles.modalTitle}>{customAlertTitle}</Text>
                <Text style={styles.modalBodyText}>{customAlertMessage}</Text>

                <TouchableOpacity
                  style={[styles.modalConfirmBtn, { width: '100%', marginTop: 10 }, customAlertTitle === 'Success' ? { backgroundColor: COLORS.success } : { backgroundColor: COLORS.secondary }]}
                  onPress={() => {
                    setCustomAlertVisible(false);
                    if (customAlertOnConfirm) customAlertOnConfirm();
                  }}
                >
                  <Text style={styles.modalConfirmBtnText}>{customAlertConfirmText}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 4,
    marginHorizontal: 20,
    marginTop: 15,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: COLORS.secondary,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  scrollContainer: { padding: 20, paddingBottom: 60 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 10,
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 15,
  },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginTop: 12, marginBottom: 5 },
  req: { color: COLORS.danger },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
    backgroundColor: '#F8FAFC',
  },
  datePickerBtn: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  pickerChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  pickerChipActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  pickerChipText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  pickerChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  submitBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    height: SIZES.standardButtonHeight,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  unlinkedList: {
    marginTop: 10,
  },
  unlinkedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unlinkedInfo: {
    flex: 1,
    marginRight: 10,
  },
  unlinkedName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  unlinkedDetails: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  linkBtn: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  linkBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    marginTop: 10,
  },
  emptyStateText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  emptyStateBtn: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 12,
  },
  emptyStateBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalBodyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  modalConfirmBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
