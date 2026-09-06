// src/screens/caregiver/RequestHelpScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import client from '../../api/client';
import { COLORS, SIZES } from '../../constants/theme';
import CalendarDatePickerModal from '../../components/common/CalendarDatePickerModal';

export default function RequestHelpScreen({ onBack, onSubmitSuccess }) {
  const [dependents, setDependents] = useState([]);
  const [selectedDependent, setSelectedDependent] = useState(null);
  const [serviceType, setServiceType] = useState('Companionship'); // Companionship | Grocery | Medicine
  const [date, setDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState('10:00 AM');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDependents = async () => {
      try {
        const res = await client.get('/caregiver/dependents');
        if (res.data?.success && res.data.data.length > 0) {
          setDependents(res.data.data);
          // Auto-select first dependent
          setSelectedDependent(res.data.data[0]);
          const depAddress = res.data.data[0].address;
          setLocation(depAddress ? `${depAddress.streetAddress}, ${depAddress.city}` : '');
        }
      } catch (error) {
        console.error('Fetch Dependents Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDependents();
  }, []);

  const handleSelectDependent = (dep) => {
    setSelectedDependent(dep);
    const depAddress = dep.address;
    setLocation(depAddress ? `${depAddress.streetAddress}, ${depAddress.city}` : '');
  };

  const handleDateSelect = (dateStr) => {
    setDate(dateStr); // YYYY-MM-DD
    setShowDatePicker(false);
  };

  const handleSubmit = async () => {
    if (!selectedDependent) {
      Alert.alert('Selection Required', 'Please add or select a dependent.');
      return;
    }
    if (!serviceType) {
      Alert.alert('Selection Required', 'Please choose a service type.');
      return;
    }
    if (!date) {
      Alert.alert('Date Required', 'Please select a date for the visit.');
      return;
    }
    if (!time) {
      Alert.alert('Time Required', 'Please enter a visit start time.');
      return;
    }
    if (!location) {
      Alert.alert('Location Required', 'Please enter a visit location.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        elderlyId: selectedDependent._id,
        serviceType,
        date,
        time,
        location: location.trim(),
      };

      const response = await client.post('/help-requests', payload);

      if (response.data?.success) {
        const request = response.data.data;
        if (request.status === 'confirmed') {
          Alert.alert(
            'Match Auto-Approved! 🎉',
            `Volunteer ${response.data.volunteer?.profile?.firstName} has been auto-assigned since you've rated them highly before!`
          );
        } else {
          Alert.alert(
            'Volunteer Matched! 🔍',
            'We found a matching volunteer. Please review their profile to confirm the visit.'
          );
        }
        onSubmitSuccess(request);
      } else {
        Alert.alert('Submission Failed', response.data?.message || 'Failed to submit help request');
      }
    } catch (error) {
      console.error('Submit Request Error:', error);
      Alert.alert(
        'Submission Error',
        error.response?.data?.message || 'Server error while submitting request'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text style={styles.loadingText}>Fetching dependents...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-back-outline" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Help</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Step 1: Select Dependent */}
        <Text style={styles.sectionTitle}>1. Select Elderly Dependent</Text>
        {dependents.length === 0 ? (
          <View style={styles.noDepContainer}>
            <Text style={styles.noDepText}>No linked dependents found.</Text>
            <Text style={styles.noDepTextSub}>Go back and add a dependent profile first.</Text>
          </View>
        ) : (
          <View style={styles.depSelectorList}>
            {dependents.map((dep) => {
              const isSelected = selectedDependent?._id === dep._id;
              return (
                <TouchableOpacity
                  key={dep._id}
                  style={[styles.depSelectorChip, isSelected && styles.depSelectorChipActive]}
                  onPress={() => handleSelectDependent(dep)}
                >
                  <Icon
                    name={isSelected ? 'checkmark-circle' : 'person-circle-outline'}
                    size={20}
                    color={isSelected ? '#FFFFFF' : COLORS.textSecondary}
                  />
                  <Text style={[styles.depSelectorText, isSelected && styles.depSelectorTextActive]}>
                    {dep.firstName} {dep.lastName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Step 2: Choose Service */}
        <Text style={styles.sectionTitle}>2. Choose Service Type</Text>
        <View style={styles.serviceSelectionGrid}>
          {[
            { type: 'Companionship', icon: 'chatbubbles-outline', desc: 'Social visit & chat' },
            { type: 'Grocery', icon: 'basket-outline', desc: 'Buying food & groceries' },
            { type: 'Medicine', icon: 'medkit-outline', desc: 'Fetching prescriptions' },
          ].map((item) => {
            const isSelected = serviceType === item.type;
            return (
              <TouchableOpacity
                key={item.type}
                style={[styles.serviceCard, isSelected && styles.serviceCardActive]}
                onPress={() => setServiceType(item.type)}
              >
                <Icon
                  name={item.icon}
                  size={24}
                  color={isSelected ? '#FFFFFF' : COLORS.secondary}
                />
                <Text style={[styles.serviceTitle, isSelected && styles.serviceTitleActive]}>
                  {item.type}
                </Text>
                <Text style={[styles.serviceDesc, isSelected && styles.serviceDescActive]}>
                  {item.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Step 3: Date, Time & Location */}
        <Text style={styles.sectionTitle}>3. Date, Time & Location</Text>

        {/* Date picker */}
        <Text style={styles.fieldLabel}>Available Date</Text>
        <TouchableOpacity style={styles.dateInputBtn} onPress={() => setShowDatePicker(true)}>
          <Text style={{ color: date ? COLORS.textPrimary : '#9CA3AF', fontSize: 16 }}>
            {date || 'Select date (e.g. YYYY-MM-DD)'}
          </Text>
          <Icon name="calendar-outline" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {/* Time input */}
        <Text style={styles.fieldLabel}>Preferred Time</Text>
        <View style={styles.timeInputRow}>
          <TextInput
            style={styles.timeInput}
            value={time}
            onChangeText={setTime}
            placeholder="e.g. 10:00 AM"
          />
          <Icon name="time-outline" size={20} color={COLORS.textSecondary} style={styles.timeIcon} />
        </View>

        {/* Location input */}
        <Text style={styles.fieldLabel}>Visit Location Address</Text>
        <TextInput
          style={styles.locationInput}
          value={location}
          onChangeText={setLocation}
          placeholder="Enter address for the volunteer to visit"
          multiline
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Icon name="paper-plane-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Submit Request & Search</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <CalendarDatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onConfirm={handleDateSelect}
        title="Select Date for Visit"
        minDate={new Date()} // Visit cannot be in the past
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: COLORS.textSecondary },
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
  scrollContainer: { padding: 20, paddingBottom: 60 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 15,
    marginBottom: 12,
  },
  noDepContainer: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  noDepText: { color: COLORS.danger, fontWeight: '600', fontSize: 14 },
  noDepTextSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  depSelectorList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  depSelectorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
  },
  depSelectorChipActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  depSelectorText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  depSelectorTextActive: { color: '#FFFFFF', fontWeight: '700' },
  serviceSelectionGrid: { flexDirection: 'row', gap: 10, marginVertical: 5 },
  serviceCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  serviceCardActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  serviceTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: 6 },
  serviceTitleActive: { color: '#FFFFFF' },
  serviceDesc: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4 },
  serviceDescActive: { color: '#E0F2F1' },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginTop: 14, marginBottom: 6 },
  dateInputBtn: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  timeInput: { flex: 1, padding: 12, fontSize: 16, color: COLORS.textPrimary },
  timeIcon: { marginRight: 12 },
  locationInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
    backgroundColor: '#F8FAFC',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 35,
    height: SIZES.standardButtonHeight,
  },
  submitBtnDisabled: { backgroundColor: '#94A3B8' },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
