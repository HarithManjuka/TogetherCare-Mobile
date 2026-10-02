// src/components/volunteer/AddHistoryLogModal.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AddHistoryLogModal({
  visible,
  onClose,
  onSubmit,
  isSaving = false,
  currentUser = null,
}) {
  const serviceOptions = [
    { id: 'Companionship', label: '🤝 Companionship' },
    { id: 'Grocery Pickup', label: '🛒 Grocery Pickup' },
    { id: 'Pharmacy Run', label: '💊 Pharmacy Run' },
    { id: 'Walk & Exercise', label: '🚶 Walk & Exercise' },
    { id: 'Reading', label: '📖 Reading' },
    { id: 'Chat & Social Call', label: '💬 Friendly Chat' },
    { id: 'Tech Support', label: '📱 Tech Support' },
    { id: 'Gardening', label: '🌿 Gardening' },
  ];

  const durationOptions = ['1.0 hr', '1.5 hrs', '2.0 hrs', '3.0 hrs', '4.0 hrs'];

  const [serviceType, setServiceType] = useState('Companionship');
  const [elderName, setElderName] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState('2.0 hrs');
  const [location, setLocation] = useState('Colombo 03');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (visible) {
      const todayStr = new Date().toISOString().split('T')[0];
      setDate(todayStr);
      setServiceType('Companionship');
      setElderName('');
      setDuration('2.0 hrs');
      setLocation(currentUser?.address?.city || 'Colombo 03');
      setNotes('');
      setRating(null);
      setFeedback('');
      setErrorMessage('');
    }
  }, [visible, currentUser]);

  const handleSubmit = () => {
    if (!serviceType) {
      setErrorMessage('Please select a service or activity type');
      return;
    }

    const payload = {
      serviceType: serviceType.trim(),
      elderName: elderName.trim() || 'Senior Member',
      date: date || new Date().toISOString().split('T')[0],
      durationHours: duration.replace(/[^\d.]/g, '') || '2.0',
      time: duration,
      location: location.trim() || 'Colombo',
      notes: notes.trim() || `Completed ${serviceType} visit`,
      rating: rating ? Number(rating) : null,
      feedback: feedback.trim() ? feedback.trim() : '',
    };

    if (onSubmit) {
      onSubmit(payload);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Log Volunteer Service</Text>
              <Text style={styles.headerSub}>Record past community visits and log your hours</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* 1. Activity / Service Type Chips */}
            <Text style={styles.fieldLabel}>Service or Activity Type *</Text>
            <View style={styles.chipGrid}>
              {serviceOptions.map((opt) => {
                const isSelected = serviceType === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => {
                      setServiceType(opt.id);
                      setErrorMessage('');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. Senior / Resident Name */}
            <Text style={styles.fieldLabel}>Senior Resident Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={17} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Wasantha Perera"
                placeholderTextColor="#94A3B8"
                value={elderName}
                onChangeText={setElderName}
              />
            </View>

            {/* 3. Date & Duration Row */}
            <View style={styles.twoColRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.fieldLabel}>Date of Visit</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="calendar-outline" size={17} color="#64748B" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94A3B8"
                    value={date}
                    onChangeText={setDate}
                  />
                </View>
              </View>

              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.fieldLabel}>Duration / Hours</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="time-outline" size={17} color="#64748B" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 2.0 hrs"
                    placeholderTextColor="#94A3B8"
                    value={duration}
                    onChangeText={setDuration}
                  />
                </View>
              </View>
            </View>

            {/* Duration Quick Chips */}
            <View style={styles.durationChipRow}>
              {durationOptions.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.smallChip, duration === d && styles.smallChipActive]}
                  onPress={() => setDuration(d)}
                >
                  <Text style={[styles.smallChipText, duration === d && styles.smallChipTextActive]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 4. Location */}
            <Text style={styles.fieldLabel}>Location / Community Area</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={17} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Colombo 03, Wellawatte"
                placeholderTextColor="#94A3B8"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            {/* 5. Notes / Summary */}
            <Text style={styles.fieldLabel}>Visit Summary / Activities Done</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe what you assisted the senior with..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* 6. Rating & Feedback (Optional) */}
            <Text style={styles.fieldLabel}>Senior Rating (Optional)</Text>
            <View style={styles.starPickerRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setRating(rating === s ? null : s)}
                  activeOpacity={0.7}
                  style={{ padding: 4 }}
                >
                  <Ionicons
                    name={rating && s <= rating ? 'star' : 'star-outline'}
                    size={28}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
              <Text style={styles.starRatingText}>
                {rating ? `${rating}.0 / 5.0` : 'Not rated yet'}
              </Text>
            </View>

            <Text style={styles.fieldLabel}>Senior Comment / Feedback (Optional)</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Optional comments received from the elder..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={2}
                value={feedback}
                onChangeText={setFeedback}
              />
            </View>
          </ScrollView>

          {/* Bottom Action Buttons */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Save & Log Hours</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  formScroll: {
    paddingHorizontal: 20,
  },
  formScrollContent: {
    paddingTop: 14,
    paddingBottom: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  twoColRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  durationChipRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    marginBottom: 4,
  },
  smallChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  smallChipActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  smallChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  smallChipTextActive: {
    color: '#1E40AF',
    fontWeight: '700',
  },
  textAreaContainer: {
    height: 70,
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  textArea: {
    textAlignVertical: 'top',
  },
  starPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    marginBottom: 4,
  },
  starRatingText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },
  footerRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  saveBtn: {
    flex: 2,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1E40AF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
