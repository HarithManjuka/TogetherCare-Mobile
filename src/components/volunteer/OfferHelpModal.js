// src/components/volunteer/OfferHelpModal.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import CalendarDatePickerModal from '../common/CalendarDatePickerModal';

export default function OfferHelpModal({
  visible,
  onClose,
  onSubmit,
  initialData = null,
  currentUser = null,
}) {
  // 1. Volunteer Name (Auto-filled & Read-only)
  const volunteerFullName = currentUser?.firstName
    ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
    : 'Sarah Perera';

  // 2. Services available for selection
  const serviceOptions = [
    { id: 'Grocery Pickup', label: 'Grocery Pickup', icon: 'cart-outline', emoji: '🛒' },
    { id: 'Pharmacy Run', label: 'Pharmacy Run', icon: 'medical-outline', emoji: '💊' },
    { id: 'Companionship (Chat/Call)', label: 'Companionship (Chat/Call)', icon: 'heart-outline', emoji: '🤝' },
    { id: 'Tech Support (phone setup)', label: 'Tech Support (phone setup)', icon: 'phone-portrait-outline', emoji: '📱' },
    { id: 'Pet Walking', label: 'Pet Walking', icon: 'paw-outline', emoji: '🐕' },
  ];

  // 3. Form States
  const [selectedServices, setSelectedServices] = useState([]);
  const [availableDate, setAvailableDate] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [startTime, setStartTime] = useState('02:00 PM');
  const [endTime, setEndTime] = useState('04:00 PM');
  const [serviceArea, setServiceArea] = useState('');
  const [radius, setRadius] = useState('Within 5 km');
  const [capacity, setCapacity] = useState(2);
  const [specialSkills, setSpecialSkills] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const timeOptions = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM',
  ];

  const radiusOptions = ['Within 2 km', 'Within 5 km', 'Within 10 km', 'Within 15 km'];
  const capacityOptions = [1, 2, 3, 4, 5];

  // Reset or initialize on open
  useEffect(() => {
    if (visible) {
      if (initialData) {
        setSelectedServices(initialData.services || []);
        setAvailableDate(initialData.date || '');
        setStartTime(initialData.startTime || '02:00 PM');
        setEndTime(initialData.endTime || '04:00 PM');
        setServiceArea(initialData.serviceArea || currentUser?.address?.city || 'Colombo 03');
        setRadius(initialData.radius || 'Within 5 km');
        setCapacity(initialData.capacity || 2);
        setSpecialSkills(initialData.specialSkills || '');
      } else {
        // Defaults for new offer
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');

        setSelectedServices(['Grocery Pickup']);
        setAvailableDate(`${yyyy}-${mm}-${dd}`);
        setStartTime('02:00 PM');
        setEndTime('04:00 PM');
        setServiceArea(
          currentUser?.address?.city
            ? `${currentUser.address.city}, ${currentUser.address.district || 'Colombo'}`
            : 'Colombo 03'
        );
        setRadius('Within 5 km');
        setCapacity(2);
        setSpecialSkills('');
      }
      setFieldErrors({});
    }
  }, [visible, initialData, currentUser]);

  // Toggle service selection
  const toggleService = (serviceId) => {
    setSelectedServices((prev) => {
      if (prev.includes(serviceId)) {
        return prev.filter((s) => s !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
    if (fieldErrors.services) {
      setFieldErrors((prev) => ({ ...prev, services: false }));
    }
  };

  const handleFormSubmit = () => {
    const errors = {};

    // 1. Service check
    if (!selectedServices || selectedServices.length === 0) {
      errors.services = true;
    }

    // 2. Date check
    if (!availableDate) {
      errors.date = true;
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      if (availableDate < todayStr) {
        Alert.alert('Invalid Date', 'Available date cannot be in the past. Please select today or a future date.');
        return;
      }
    }

    // 3. Location check
    if (!serviceArea.trim()) {
      errors.serviceArea = true;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      Alert.alert(
        'Missing Information',
        'Please select at least one service, a valid available date, and service area.'
      );
      return;
    }

    const payload = {
      id: initialData ? initialData.id : `offer-${Date.now()}`,
      volunteerName: volunteerFullName,
      services: selectedServices,
      date: availableDate,
      startTime,
      endTime,
      serviceArea: serviceArea.trim(),
      radius,
      capacity,
      slotsLeft: initialData ? Math.min(capacity, initialData.slotsLeft || capacity) : capacity,
      specialSkills: specialSkills.trim().slice(0, 200),
      status: initialData?.status || 'pending',
    };

    onSubmit(payload);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.formTitle}>
                {initialData ? 'Edit Your Offer' : 'Offer Your Help / Post Availability'}
              </Text>
              <Text style={styles.formSubtitle}>
                Let elders in your area know when and how you can assist
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.formScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Field 1: Volunteer Name (Auto-filled, Read-only) */}
            <View style={styles.fieldBlock}>
              <View style={styles.labelWithIconRow}>
                <Ionicons name="lock-closed-outline" size={15} color="#64748B" />
                <Text style={styles.fieldLabel}>Volunteer Name (Auto-filled)</Text>
              </View>
              <View style={styles.readOnlyBox}>
                <Text style={styles.readOnlyText}>{volunteerFullName}</Text>
                <View style={styles.readOnlyBadge}>
                  <Text style={styles.readOnlyBadgeText}>Verified Profile</Text>
                </View>
              </View>
              <Text style={styles.fieldHelpText}>
                Automatically pulled from your account to prevent impersonation.
              </Text>
            </View>

            {/* Field 2: Services I Can Provide (Required, Multi-Select Checkboxes) */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                Services I Can Provide <Text style={styles.reqStar}>*</Text>
              </Text>
              <Text style={styles.fieldHelpText}>
                Choose one or more assistance services you're willing to provide.
              </Text>

              <View
                style={[
                  styles.servicesGrid,
                  fieldErrors.services && styles.servicesGridError,
                ]}
              >
                {serviceOptions.map((item) => {
                  const isChecked = selectedServices.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.serviceCheckboxRow,
                        isChecked && styles.serviceCheckboxRowChecked,
                      ]}
                      onPress={() => toggleService(item.id)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.checkboxBox,
                          isChecked && styles.checkboxBoxChecked,
                        ]}
                      >
                        {isChecked && (
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        )}
                      </View>
                      <Text style={styles.serviceEmoji}>{item.emoji}</Text>
                      <Text
                        style={[
                          styles.serviceLabel,
                          isChecked && styles.serviceLabelChecked,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Field 3: Available Date & Time (Required) */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                Available Date & Time <Text style={styles.reqStar}>*</Text>
              </Text>

              {/* Date Button */}
              <TouchableOpacity
                style={[
                  styles.dateBtn,
                  fieldErrors.date && styles.inputError,
                ]}
                onPress={() => setIsCalendarOpen(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar-outline" size={18} color="#1E40AF" />
                <Text style={styles.dateBtnText}>
                  {availableDate ? `📅 ${availableDate}` : 'Select Available Date *'}
                </Text>
                <Text style={styles.changeDateText}>Change</Text>
              </TouchableOpacity>

              {/* Time Range Selector */}
              <View style={styles.timeRangeContainer}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.subFieldLabel}>Start Time</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.timeChipsRow}>
                      {timeOptions.slice(0, 7).map((t) => (
                        <TouchableOpacity
                          key={`start-${t}`}
                          style={[
                            styles.timeChip,
                            startTime === t && styles.timeChipActive,
                          ]}
                          onPress={() => setStartTime(t)}
                        >
                          <Text
                            style={[
                              styles.timeChipText,
                              startTime === t && styles.timeChipTextActive,
                            ]}
                          >
                            {t}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.subFieldLabel}>End Time</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.timeChipsRow}>
                      {timeOptions.slice(4).map((t) => (
                        <TouchableOpacity
                          key={`end-${t}`}
                          style={[
                            styles.timeChip,
                            endTime === t && styles.timeChipActive,
                          ]}
                          onPress={() => setEndTime(t)}
                        >
                          <Text
                            style={[
                              styles.timeChipText,
                              endTime === t && styles.timeChipTextActive,
                            ]}
                          >
                            {t}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>

              <View style={styles.timePreviewBadge}>
                <Ionicons name="time" size={14} color="#1E40AF" />
                <Text style={styles.timePreviewText}>
                  Slot: {availableDate || 'Selected Date'} from {startTime} to {endTime}
                </Text>
              </View>
            </View>

            {/* Field 4: Service Area / Radius (Required) */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                Service Area / Radius <Text style={styles.reqStar}>*</Text>
              </Text>

              <TextInput
                style={[
                  styles.textInput,
                  fieldErrors.serviceArea && styles.inputError,
                ]}
                placeholder="Base Location (e.g. Colombo 03, Wellawatte)"
                placeholderTextColor="#94A3B8"
                value={serviceArea}
                onChangeText={setServiceArea}
              />

              <View style={styles.radiusRow}>
                {radiusOptions.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.radiusChip,
                      radius === r && styles.radiusChipActive,
                    ]}
                    onPress={() => setRadius(r)}
                  >
                    <Text
                      style={[
                        styles.radiusChipText,
                        radius === r && styles.radiusChipTextActive,
                      ]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Field 5: Capacity / Elders I can help (Required) */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                Capacity / Elders I Can Help <Text style={styles.reqStar}>*</Text>
              </Text>
              <Text style={styles.fieldHelpText}>
                Select how many elders you can assist during this single trip.
              </Text>

              <View style={styles.capacityRow}>
                {capacityOptions.map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.capacityBox,
                      capacity === num && styles.capacityBoxActive,
                    ]}
                    onPress={() => setCapacity(num)}
                  >
                    <Text
                      style={[
                        styles.capacityNumber,
                        capacity === num && styles.capacityNumberActive,
                      ]}
                    >
                      {num}
                    </Text>
                    <Text
                      style={[
                        styles.capacitySub,
                        capacity === num && styles.capacitySubActive,
                      ]}
                    >
                      {num === 1 ? 'Elder' : 'Elders'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.slotPreviewText}>
                🏷️ Initial Slots: <Text style={{ fontWeight: '800' }}>Slots Left: {capacity}</Text>
              </Text>
            </View>

            {/* Field 6: Extra Details / Special Skills (Optional) */}
            <View style={styles.fieldBlock}>
              <View style={styles.labelWithCountRow}>
                <Text style={styles.fieldLabel}>
                  Extra Details / Special Skills <Text style={styles.optionalTag}>(Optional)</Text>
                </Text>
                <Text style={styles.charCounter}>{specialSkills.length}/200</Text>
              </View>

              <TextInput
                style={styles.textArea}
                placeholder="e.g. I have a large SUV, can carry heavy loads. OR I speak both Sinhala and Tamil."
                placeholderTextColor="#94A3B8"
                multiline
                maxLength={200}
                value={specialSkills}
                onChangeText={setSpecialSkills}
              />
            </View>
          </ScrollView>

          {/* Action Buttons: Cancel & Post Offer */}
          <View style={styles.footerActionsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleFormSubmit}
              activeOpacity={0.85}
            >
              <Text style={styles.submitBtnText}>
                {initialData ? 'Save Changes' : 'Post Offer / Submit'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Calendar Picker Modal */}
      <CalendarDatePickerModal
        visible={isCalendarOpen}
        initialDate={availableDate || '2026-08-25'}
        isElderlyMode={false}
        onConfirm={(selected) => {
          setAvailableDate(selected);
          setIsCalendarOpen(false);
          if (fieldErrors.date) {
            setFieldErrors((prev) => ({ ...prev, date: false }));
          }
        }}
        onClose={() => setIsCalendarOpen(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '92%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  titleContainer: {
    flex: 1,
    paddingRight: 10,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  formSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  closeBtn: {
    padding: 4,
  },
  formScroll: {
    marginTop: 10,
    maxHeight: 480,
  },
  fieldBlock: {
    marginBottom: 18,
  },
  labelWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  labelWithCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  subFieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  reqStar: {
    color: '#DC2626',
    fontWeight: '900',
  },
  optionalTag: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
  fieldHelpText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  charCounter: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },

  // Read-only Box
  readOnlyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  readOnlyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  readOnlyBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  readOnlyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },

  // Checkbox Services
  servicesGrid: {
    gap: 8,
  },
  servicesGridError: {
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
  },
  serviceCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  serviceCheckboxRowChecked: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxBoxChecked: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  serviceEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  serviceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  serviceLabelChecked: {
    color: '#1E40AF',
    fontWeight: '800',
  },

  // Date & Time
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  dateBtnText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  changeDateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  timeChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  timeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  timeChipActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  timeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  timeChipTextActive: {
    color: '#FFFFFF',
  },
  timePreviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  timePreviewText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
  },

  // Location & Radius
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 8,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  radiusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  radiusChipActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  radiusChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  radiusChipTextActive: {
    color: '#FFFFFF',
  },

  // Capacity
  capacityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  capacityBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 10,
    alignItems: 'center',
  },
  capacityBoxActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1E40AF',
    borderWidth: 2,
  },
  capacityNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
  },
  capacityNumberActive: {
    color: '#1E40AF',
  },
  capacitySub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  capacitySubActive: {
    color: '#1E40AF',
    fontWeight: '700',
  },
  slotPreviewText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
  },

  // Text Area
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    height: 75,
    textAlignVertical: 'top',
  },

  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },

  // Footer Buttons
  footerActionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  submitBtn: {
    flex: 2,
    height: 48,
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
