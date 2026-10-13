// src/components/common/SingleTimePickerModal.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

const HOURS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

const PRESETS = [
  { label: '9:00 AM', hour: '9', minute: '00', period: 'AM' },
  { label: '10:00 AM', hour: '10', minute: '00', period: 'AM' },
  { label: '11:30 AM', hour: '11', minute: '30', period: 'AM' },
  { label: '2:00 PM', hour: '2', minute: '00', period: 'PM' },
  { label: '4:00 PM', hour: '4', minute: '00', period: 'PM' },
];

const ITEM_HEIGHT = 44;

export default function SingleTimePickerModal({
  visible,
  initialTime = '10:00 AM',
  selectedDate = null,
  onConfirm,
  onClose,
  title = 'Select Preferred Time',
  subtitle = 'Choose a suitable time for the visit',
}) {
  const [selectedHour, setSelectedHour] = useState('10');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState('AM');
  const [errorMessage, setErrorMessage] = useState(null);

  const hourScrollRef = useRef(null);
  const minuteScrollRef = useRef(null);

  // Parse initialTime when modal becomes visible
  useEffect(() => {
    if (visible) {
      setErrorMessage(null);
      if (initialTime && typeof initialTime === 'string') {
        const clean = initialTime.replace(/\s+/g, '');
        const match = clean.match(/(\d{1,2}):(\d{2})(AM|PM)/i);
        if (match) {
          const h = String(parseInt(match[1], 10));
          const m = match[2];
          const p = match[3].toUpperCase();
          setSelectedHour(h);
          setSelectedMinute(m);
          setSelectedPeriod(p);

          // Auto-scroll to selected hour and minute
          setTimeout(() => {
            const hIndex = HOURS.indexOf(h);
            if (hIndex >= 0 && hourScrollRef.current) {
              hourScrollRef.current.scrollTo({ y: hIndex * ITEM_HEIGHT, animated: false });
            }
            const mIndex = MINUTES.indexOf(m);
            if (mIndex >= 0 && minuteScrollRef.current) {
              minuteScrollRef.current.scrollTo({ y: mIndex * ITEM_HEIGHT, animated: false });
            }
          }, 100);
          return;
        }
      }
      // Defaults
      setSelectedHour('10');
      setSelectedMinute('00');
      setSelectedPeriod('AM');
    }
  }, [visible, initialTime]);

  const isSelectedDateToday = () => {
    if (!selectedDate) return false;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return selectedDate === todayStr;
  };

  const handleApplyPreset = (preset) => {
    setErrorMessage(null);
    setSelectedHour(preset.hour);
    setSelectedMinute(preset.minute);
    setSelectedPeriod(preset.period);

    const hIndex = HOURS.indexOf(preset.hour);
    if (hIndex >= 0 && hourScrollRef.current) {
      hourScrollRef.current.scrollTo({ y: hIndex * ITEM_HEIGHT, animated: true });
    }
    const mIndex = MINUTES.indexOf(preset.minute);
    if (mIndex >= 0 && minuteScrollRef.current) {
      minuteScrollRef.current.scrollTo({ y: mIndex * ITEM_HEIGHT, animated: true });
    }
  };

  const handleConfirm = () => {
    let hoursNum = parseInt(selectedHour, 10);
    const minsNum = parseInt(selectedMinute, 10);
    if (selectedPeriod === 'AM' && hoursNum === 12) hoursNum = 0;
    if (selectedPeriod === 'PM' && hoursNum !== 12) hoursNum += 12;

    const totalMinutes = hoursNum * 60 + minsNum;

    // Validate if today & past time
    if (isSelectedDateToday()) {
      const now = new Date();
      const currentNowMinutes = now.getHours() * 60 + now.getMinutes();

      if (totalMinutes < currentNowMinutes) {
        setErrorMessage('Cannot select past time for today. Please pick a future time.');
        return;
      }
    }

    setErrorMessage(null);
    const formatted = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
    if (onConfirm) {
      onConfirm(formatted);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalCard}>
              {/* Header Title & Subtitle */}
              <View style={styles.header}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{title}</Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeIconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close" size={22} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </View>

              {/* Big Time Display & AM/PM Pills */}
              <View style={styles.displayCard}>
                <Text style={styles.bigTimeDisplay}>
                  {selectedHour.padStart(2, '0')}:{selectedMinute}
                </Text>

                {/* AM / PM selector pills */}
                <View style={styles.periodPillGroup}>
                  <TouchableOpacity
                    style={[
                      styles.periodPill,
                      selectedPeriod === 'AM' && styles.periodPillActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setErrorMessage(null);
                      setSelectedPeriod('AM');
                    }}
                  >
                    <Text
                      style={[
                        styles.periodPillText,
                        selectedPeriod === 'AM' && styles.periodPillTextActive,
                      ]}
                    >
                      AM
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.periodPill,
                      selectedPeriod === 'PM' && styles.periodPillActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setErrorMessage(null);
                      setSelectedPeriod('PM');
                    }}
                  >
                    <Text
                      style={[
                        styles.periodPillText,
                        selectedPeriod === 'PM' && styles.periodPillTextActive,
                      ]}
                    >
                      PM
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Error Message if in the past */}
              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Quick Presets */}
              <View style={styles.presetsWrapper}>
                <Text style={styles.presetLabel}>Quick Select:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsList}>
                  {PRESETS.map((p) => {
                    const isPresetActive =
                      selectedHour === p.hour &&
                      selectedMinute === p.minute &&
                      selectedPeriod === p.period;
                    return (
                      <TouchableOpacity
                        key={p.label}
                        style={[
                          styles.presetChip,
                          isPresetActive && styles.presetChipActive,
                        ]}
                        activeOpacity={0.75}
                        onPress={() => handleApplyPreset(p)}
                      >
                        <Text
                          style={[
                            styles.presetChipText,
                            isPresetActive && styles.presetChipTextActive,
                          ]}
                        >
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Column Headers */}
              <View style={styles.columnHeaderRow}>
                <Text style={styles.columnHeaderText}>HOUR</Text>
                <Text style={styles.columnHeaderText}>MINUTE</Text>
              </View>

              {/* Wheel Roller Columns Container */}
              <View style={styles.wheelContainer}>
                {/* Center selection line indicator */}
                <View style={styles.selectionHighlight} pointerEvents="none" />

                {/* Left Column: Hours */}
                <View style={styles.wheelColumn}>
                  <ScrollView
                    ref={hourScrollRef}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.wheelScrollContent}
                    nestedScrollEnabled
                  >
                    {HOURS.map((h) => {
                      const isSelected = selectedHour === h;
                      return (
                        <TouchableOpacity
                          key={`hour-${h}`}
                          style={styles.wheelItem}
                          onPress={() => {
                            setErrorMessage(null);
                            setSelectedHour(h);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.wheelItemText,
                              isSelected ? styles.wheelItemTextSelected : styles.wheelItemTextUnselected,
                            ]}
                          >
                            {h}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Right Column: Minutes */}
                <View style={styles.wheelColumn}>
                  <ScrollView
                    ref={minuteScrollRef}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.wheelScrollContent}
                    nestedScrollEnabled
                  >
                    {MINUTES.map((m) => {
                      const isSelected = selectedMinute === m;
                      return (
                        <TouchableOpacity
                          key={`minute-${m}`}
                          style={styles.wheelItem}
                          onPress={() => {
                            setErrorMessage(null);
                            setSelectedMinute(m);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.wheelItemText,
                              isSelected ? styles.wheelItemTextSelected : styles.wheelItemTextUnselected,
                            ]}
                          >
                            {m}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>

              {/* Bottom Actions */}
              <View style={styles.bottomRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  activeOpacity={0.7}
                  onPress={onClose}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmBtn}
                  activeOpacity={0.85}
                  onPress={handleConfirm}
                >
                  <Text style={styles.confirmBtnText}>Set Time</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#1A365D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    width: '100%',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A365D',
    letterSpacing: -0.2,
  },
  closeIconBtn: {
    padding: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
  },
  displayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 12,
  },
  bigTimeDisplay: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 1,
  },
  periodPillGroup: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  periodPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  periodPillActive: {
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  periodPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  periodPillTextActive: {
    color: '#FFFFFF',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    flex: 1,
  },
  presetsWrapper: {
    width: '100%',
    marginBottom: 10,
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetsList: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  presetChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#E6FFFA',
    borderColor: COLORS.secondary,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  presetChipTextActive: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  columnHeaderRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginTop: 4,
    paddingBottom: 4,
  },
  columnHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  wheelContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 160,
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  selectionHighlight: {
    position: 'absolute',
    top: 58,
    left: 10,
    right: 10,
    height: ITEM_HEIGHT,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  wheelColumn: {
    flex: 1,
    height: '100%',
  },
  wheelScrollContent: {
    paddingVertical: 58,
    alignItems: 'center',
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  wheelItemText: {
    fontSize: 20,
    textAlign: 'center',
  },
  wheelItemTextSelected: {
    fontWeight: '800',
    color: '#1A365D',
    fontSize: 22,
  },
  wheelItemTextUnselected: {
    fontWeight: '500',
    color: '#CBD5E1',
    opacity: 0.7,
  },
  bottomRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  confirmBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
