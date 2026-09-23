// src/components/common/CalendarDatePickerModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  Alert,
  Platform,
} from 'react-native';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CalendarDatePickerModal({
  visible,
  initialDate,
  onConfirm,
  onClose,
  isElderlyMode = false,
  title,
  minDate,
  maxDate,
}) {
  const currentYear = new Date().getFullYear();
  
  // Default date state
  const [selectedYear, setSelectedYear] = useState(1975);
  const [selectedMonth, setSelectedMonth] = useState(0); // 0-indexed
  const [selectedDay, setSelectedDay] = useState(15);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'year'

  useEffect(() => {
    if (visible) {
      if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
        const [y, m, d] = initialDate.split('-').map(Number);
        if (y) setSelectedYear(y);
        if (m) setSelectedMonth(m - 1);
        if (d) setSelectedDay(d);
      } else {
        const today = new Date();
        const isBirth = isElderlyMode || (title && title.toLowerCase().includes('birth'));
        setSelectedYear(isBirth ? 1975 : today.getFullYear());
        setSelectedMonth(isBirth ? 0 : today.getMonth());
        setSelectedDay(isBirth ? 15 : today.getDate());
      }
    }
  }, [initialDate, visible, isElderlyMode, title]);

  // Compute total days in month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay();

  // Helper for age
  const calculateAge = (y, m, d) => {
    const dob = new Date(y, m, d);
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const currentAge = calculateAge(selectedYear, selectedMonth, selectedDay);

  const handleConfirm = () => {
    const mStr = String(selectedMonth + 1).padStart(2, '0');
    const dStr = String(selectedDay).padStart(2, '0');
    const dateString = `${selectedYear}-${mStr}-${dStr}`;
    const selectedDateObj = new Date(selectedYear, selectedMonth, selectedDay);

    if (minDate) {
      const minDateObj = new Date(minDate);
      minDateObj.setHours(0, 0, 0, 0);
      selectedDateObj.setHours(0, 0, 0, 0);
      if (selectedDateObj < minDateObj) {
        const msg = `Selected date cannot be before ${minDate.toISOString().split('T')[0]}`;
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert('Invalid Date', msg);
        }
        return;
      }
    }

    if (maxDate) {
      const maxDateObj = new Date(maxDate);
      maxDateObj.setHours(23, 59, 59, 999);
      selectedDateObj.setHours(0, 0, 0, 0);
      if (selectedDateObj > maxDateObj) {
        const msg = `Selected date cannot be after ${maxDate.toISOString().split('T')[0]}`;
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert('Invalid Date', msg);
        }
        return;
      }
    }

    onConfirm(dateString);
  };

  // Generate years list (e.g. 1910 to currentYear)
  const yearsList = [];
  for (let y = currentYear; y >= 1910; y--) {
    yearsList.push(y);
  }

  // Dynamic styling based on Elderly mode
  const titleSize = isElderlyMode ? 22 : 18;
  const dayTextSize = isElderlyMode ? 18 : 14;
  const btnHeight = isElderlyMode ? 56 : 46;

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
            <View style={[styles.modalCard, isElderlyMode && styles.modalCardElderly]}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { fontSize: titleSize }]}>
                  {title || '📅 Select Birth Date'}
                </Text>
                {(!title || title.toLowerCase().includes('birth')) ? (
                  <Text style={styles.subtext}>
                    {selectedYear}-{String(selectedMonth + 1).padStart(2, '0')}-{String(selectedDay).padStart(2, '0')} (Age: {currentAge} yrs)
                  </Text>
                ) : (
                  <Text style={styles.subtext}>
                    Selected: {selectedYear}-{String(selectedMonth + 1).padStart(2, '0')}-{String(selectedDay).padStart(2, '0')}
                  </Text>
                )}
              </View>

              {/* View Switcher Bar */}
              <View style={styles.switcherRow}>
                <TouchableOpacity
                  style={[styles.yearChip, isElderlyMode && { paddingVertical: 10 }]}
                  onPress={() => setViewMode(viewMode === 'year' ? 'calendar' : 'year')}
                >
                  <Text style={[styles.yearChipText, isElderlyMode && { fontSize: 18 }]}>
                    Year: <Text style={{ fontWeight: '800', color: '#1E40AF' }}>{selectedYear}</Text> ▾
                  </Text>
                </TouchableOpacity>

                {viewMode === 'calendar' && (
                  <View style={styles.monthNav}>
                    <TouchableOpacity
                      style={styles.navArrow}
                      onPress={() => {
                        if (selectedMonth === 0) {
                          setSelectedMonth(11);
                          setSelectedYear(selectedYear - 1);
                        } else {
                          setSelectedMonth(selectedMonth - 1);
                        }
                      }}
                    >
                      <Text style={[styles.navArrowText, isElderlyMode && { fontSize: 22 }]}>◀</Text>
                    </TouchableOpacity>
                    <Text style={[styles.monthLabel, isElderlyMode && { fontSize: 18 }]}>
                      {MONTH_NAMES[selectedMonth]}
                    </Text>
                    <TouchableOpacity
                      style={styles.navArrow}
                      onPress={() => {
                        if (selectedMonth === 11) {
                          setSelectedMonth(0);
                          setSelectedYear(selectedYear + 1);
                        } else {
                          setSelectedMonth(selectedMonth + 1);
                        }
                      }}
                    >
                      <Text style={[styles.navArrowText, isElderlyMode && { fontSize: 22 }]}>▶</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Body: Year Grid vs Month Calendar */}
              {viewMode === 'year' ? (
                <View style={{ height: 260 }}>
                  <Text style={styles.selectPrompt}>Tap to select your birth year:</Text>
                  <ScrollView style={styles.yearScroll} contentContainerStyle={styles.yearGrid}>
                    {yearsList.map((y) => (
                      <TouchableOpacity
                        key={y}
                        style={[
                          styles.yearItem,
                          selectedYear === y && styles.yearItemActive,
                          isElderlyMode && { minWidth: 80, paddingVertical: 12 },
                        ]}
                        onPress={() => {
                          setSelectedYear(y);
                          setViewMode('calendar');
                        }}
                      >
                        <Text
                          style={[
                            styles.yearItemText,
                            selectedYear === y && styles.yearItemTextActive,
                            isElderlyMode && { fontSize: 18 },
                          ]}
                        >
                          {y}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : (
                <View style={{ height: 260 }}>
                  {/* Days of Week Header */}
                  <View style={styles.weekHeader}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                      <Text key={idx} style={[styles.weekDayText, isElderlyMode && { fontSize: 16 }]}>
                        {day}
                      </Text>
                    ))}
                  </View>

                  {/* Calendar Grid */}
                  <View style={styles.daysGrid}>
                    {/* Empty padding slots */}
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <View key={`empty-${i}`} style={styles.dayCell} />
                    ))}

                    {/* Day numbers */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNum = i + 1;
                      const isSelected = selectedDay === dayNum;
                      return (
                        <TouchableOpacity
                          key={dayNum}
                          style={[
                            styles.dayCell,
                            isSelected && styles.dayCellActive,
                            isElderlyMode && { height: 38 },
                          ]}
                          onPress={() => setSelectedDay(dayNum)}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              { fontSize: dayTextSize },
                              isSelected && styles.dayTextActive,
                            ]}
                          >
                            {dayNum}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { height: btnHeight }]}
                  onPress={onClose}
                >
                  <Text style={[styles.cancelBtnText, isElderlyMode && { fontSize: 17 }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmBtn, { height: btnHeight }]}
                  onPress={handleConfirm}
                >
                  <Text style={[styles.confirmBtnText, isElderlyMode && { fontSize: 18 }]}>Set Date</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalCardElderly: {
    maxWidth: 420,
    padding: 24,
    borderWidth: 2,
    borderColor: '#1E40AF',
  },
  header: {
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  title: {
    fontWeight: '800',
    color: '#1E40AF',
  },
  subtext: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D9488',
    marginTop: 4,
  },
  switcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  yearChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  yearChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navArrow: {
    padding: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  navArrowText: {
    fontSize: 16,
    color: '#1E40AF',
    fontWeight: '800',
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    minWidth: 90,
    textAlign: 'center',
  },
  selectPrompt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  yearScroll: {
    flex: 1,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  yearItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 70,
    alignItems: 'center',
  },
  yearItemActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  yearItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  yearItemTextActive: {
    color: '#FFFFFF',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  weekDayText: {
    width: 36,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%',
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 6,
  },
  dayCellActive: {
    backgroundColor: '#1E40AF',
    borderRadius: 18,
  },
  dayText: {
    fontWeight: '600',
    color: '#1E293B',
  },
  dayTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  confirmBtn: {
    flex: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    borderRadius: 10,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
