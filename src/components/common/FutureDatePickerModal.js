// src/components/common/FutureDatePickerModal.js
import React, { useState, useEffect } from 'react';
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

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_HEADER = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function FutureDatePickerModal({
  visible,
  initialDate,
  onConfirm,
  onClose,
}) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'year'

  useEffect(() => {
    if (visible) {
      if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
        const [y, m, d] = initialDate.split('-').map(Number);
        const parsed = new Date(y, m - 1, d);
        // If parsed is in the past, reset to today
        if (parsed < new Date(currentYear, currentMonth, currentDay)) {
          setSelectedYear(currentYear);
          setSelectedMonth(currentMonth);
          setSelectedDay(currentDay);
        } else {
          setSelectedYear(y);
          setSelectedMonth(m - 1);
          setSelectedDay(d);
        }
      } else {
        setSelectedYear(currentYear);
        setSelectedMonth(currentMonth);
        setSelectedDay(currentDay);
      }
    }
  }, [visible, initialDate]);

  // Compute total days in month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay();

  const isCurrentMonthAndYear =
    selectedYear === currentYear && selectedMonth === currentMonth;

  const isPrevMonthDisabled =
    selectedYear === currentYear && selectedMonth <= currentMonth;

  const handleConfirm = () => {
    const mStr = String(selectedMonth + 1).padStart(2, '0');
    const dStr = String(selectedDay).padStart(2, '0');
    const dateString = `${selectedYear}-${mStr}-${dStr}`;
    onConfirm(dateString);
  };

  // Generate future years list (current year to +3 years)
  const yearsList = [];
  for (let y = currentYear; y <= currentYear + 3; y++) {
    yearsList.push(y);
  }

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
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <Ionicons name="calendar-outline" size={22} color={COLORS.primary} />
                  <Text style={styles.title}>Select Scheduled Date</Text>
                </View>
                <Text style={styles.subtext}>
                  {MONTH_NAMES[selectedMonth]} {selectedDay}, {selectedYear}
                </Text>
              </View>

              {/* View Switcher Bar */}
              <View style={styles.switcherRow}>
                <TouchableOpacity
                  style={styles.yearChip}
                  onPress={() => setViewMode(viewMode === 'year' ? 'calendar' : 'year')}
                >
                  <Text style={styles.yearChipText}>
                    Year: <Text style={{ fontWeight: '800', color: COLORS.primary }}>{selectedYear}</Text> ▾
                  </Text>
                </TouchableOpacity>

                {viewMode === 'calendar' && (
                  <View style={styles.monthNav}>
                    <TouchableOpacity
                      style={[styles.navArrow, isPrevMonthDisabled && styles.navArrowDisabled]}
                      disabled={isPrevMonthDisabled}
                      onPress={() => {
                        if (selectedMonth === 0) {
                          if (selectedYear > currentYear) {
                            setSelectedMonth(11);
                            setSelectedYear(selectedYear - 1);
                          }
                        } else {
                          setSelectedMonth(selectedMonth - 1);
                        }
                      }}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={18}
                        color={isPrevMonthDisabled ? '#CBD5E1' : COLORS.textPrimary}
                      />
                    </TouchableOpacity>

                    <Text style={styles.monthLabel}>
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
                      <Ionicons name="chevron-forward" size={18} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Body: Year Grid vs Month Calendar */}
              {viewMode === 'year' ? (
                <View style={{ height: 230 }}>
                  <Text style={styles.selectPrompt}>Select year:</Text>
                  <ScrollView contentContainerStyle={styles.yearGrid}>
                    {yearsList.map((y) => (
                      <TouchableOpacity
                        key={y}
                        style={[
                          styles.yearButton,
                          selectedYear === y && styles.yearButtonActive,
                        ]}
                        onPress={() => {
                          setSelectedYear(y);
                          if (y === currentYear && selectedMonth < currentMonth) {
                            setSelectedMonth(currentMonth);
                          }
                          setViewMode('calendar');
                        }}
                      >
                        <Text
                          style={[
                            styles.yearButtonText,
                            selectedYear === y && styles.yearButtonTextActive,
                          ]}
                        >
                          {y}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : (
                <View style={styles.calendarContainer}>
                  {/* Days Header (Su, Mo, Tu...) */}
                  <View style={styles.daysHeaderRow}>
                    {DAYS_HEADER.map((d, index) => (
                      <Text
                        key={d}
                        style={[
                          styles.dayHeaderCell,
                          (index === 0 || index === 6) && { color: COLORS.accent },
                        ]}
                      >
                        {d}
                      </Text>
                    ))}
                  </View>

                  {/* Days Grid */}
                  <View style={styles.daysGrid}>
                    {/* Empty offset days for start of month */}
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <View key={`empty-${i}`} style={styles.dayCellEmpty} />
                    ))}

                    {/* Actual month days */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNumber = i + 1;
                      const isPastDay =
                        isCurrentMonthAndYear && dayNumber < currentDay;
                      const isSelected =
                        selectedDay === dayNumber && !isPastDay;
                      const isToday =
                        isCurrentMonthAndYear && dayNumber === currentDay;

                      return (
                        <TouchableOpacity
                          key={`day-${dayNumber}`}
                          style={[
                            styles.dayCell,
                            isSelected && styles.dayCellSelected,
                            isToday && !isSelected && styles.dayCellToday,
                            isPastDay && styles.dayCellDisabled,
                          ]}
                          disabled={isPastDay}
                          activeOpacity={0.7}
                          onPress={() => setSelectedDay(dayNumber)}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              isSelected && styles.dayTextSelected,
                              isToday && !isSelected && styles.dayTextToday,
                              isPastDay && styles.dayTextDisabled,
                            ]}
                          >
                            {dayNumber}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Bottom Actions */}
              <View style={styles.footerRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                  <Text style={styles.confirmBtnText}>Apply Date</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#1A365D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  header: {
    marginBottom: 14,
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  subtext: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  switcherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  yearChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  yearChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navArrow: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navArrowDisabled: {
    opacity: 0.4,
    backgroundColor: '#F1F5F9',
  },
  monthLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    minWidth: 78,
    textAlign: 'center',
  },
  selectPrompt: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  yearButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minWidth: 85,
    alignItems: 'center',
  },
  yearButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  yearButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  yearButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  calendarContainer: {
    marginBottom: 12,
  },
  daysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  dayHeaderCell: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: `${100 / 7}%`,
    height: 38,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 19,
    marginVertical: 1,
  },
  dayCellSelected: {
    backgroundColor: COLORS.primary,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  dayCellDisabled: {
    opacity: 0.25,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  dayTextToday: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  dayTextDisabled: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
