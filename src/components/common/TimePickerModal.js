// src/components/common/TimePickerModal.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

const HOURS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

const ITEM_HEIGHT = 44;

export default function TimePickerModal({
  visible,
  selectedDate = null,
  initialFromTime = null,
  initialToTime = null,
  onConfirm,
  onClose,
}) {
  const [activeTarget, setActiveTarget] = useState('from'); // 'from' | 'to'

  // From time states
  const [fromHour, setFromHour] = useState('9');
  const [fromMinute, setFromMinute] = useState('00');
  const [fromPeriod, setFromPeriod] = useState('AM');

  // To time states
  const [toHour, setToHour] = useState('11');
  const [toMinute, setToMinute] = useState('00');
  const [toPeriod, setToPeriod] = useState('AM');

  const [errorMessage, setErrorMessage] = useState(null);

  const hourScrollRef = useRef(null);
  const minuteScrollRef = useRef(null);

  // Initialize on open
  useEffect(() => {
    if (visible) {
      setErrorMessage(null);
      if (initialFromTime) {
        const clean = initialFromTime.replace(/\s+/g, '');
        const match = clean.match(/(\d{1,2}):(\d{2})(AM|PM)/i);
        if (match) {
          setFromHour(String(parseInt(match[1], 10)));
          setFromMinute(match[2]);
          setFromPeriod(match[3].toUpperCase());
        }
      }
      if (initialToTime) {
        const clean = initialToTime.replace(/\s+/g, '');
        const match = clean.match(/(\d{1,2}):(\d{2})(AM|PM)/i);
        if (match) {
          setToHour(String(parseInt(match[1], 10)));
          setToMinute(match[2]);
          setToPeriod(match[3].toUpperCase());
        }
      }
    }
  }, [visible, initialFromTime, initialToTime]);

  const currentHour = activeTarget === 'from' ? fromHour : toHour;
  const currentMinute = activeTarget === 'from' ? fromMinute : toMinute;
  const currentPeriod = activeTarget === 'from' ? fromPeriod : toPeriod;

  const setHour = (h) => {
    setErrorMessage(null);
    if (activeTarget === 'from') setFromHour(h);
    else setToHour(h);
  };

  const setMinute = (m) => {
    setErrorMessage(null);
    if (activeTarget === 'from') setFromMinute(m);
    else setToMinute(m);
  };

  const togglePeriod = () => {
    setErrorMessage(null);
    const next = currentPeriod === 'AM' ? 'PM' : 'AM';
    if (activeTarget === 'from') setFromPeriod(next);
    else setToPeriod(next);
  };

  const handleSetAllDay = () => {
    setErrorMessage(null);
    setFromHour('9');
    setFromMinute('00');
    setFromPeriod('AM');
    setToHour('5');
    setToMinute('00');
    setToPeriod('PM');
  };

  const convertToMinutes = (h12, m, period) => {
    let h = parseInt(h12, 10);
    if (period === 'AM' && h === 12) h = 0;
    if (period === 'PM' && h !== 12) h += 12;
    return h * 60 + parseInt(m, 10);
  };

  const isSelectedDateToday = () => {
    if (!selectedDate) return true;
    const todayStr = new Date().toISOString().split('T')[0];
    return selectedDate === todayStr;
  };

  const formattedFrom = `${fromHour.padStart(2, '0')} : ${fromMinute} ${fromPeriod}`;
  const formattedTo = `${toHour.padStart(2, '0')} : ${toMinute} ${toPeriod}`;

  const handleApply = () => {
    const fromMins = convertToMinutes(fromHour, fromMinute, fromPeriod);
    const toMins = convertToMinutes(toHour, toMinute, toPeriod);

    // Check if selecting past time today
    if (isSelectedDateToday()) {
      const now = new Date();
      const currentNowMinutes = now.getHours() * 60 + now.getMinutes();

      if (fromMins < currentNowMinutes) {
        setErrorMessage('Cannot select past time for today. Please pick a future time.');
        return;
      }
    }

    // Check if end time is after start time
    if (toMins <= fromMins) {
      setErrorMessage('End time (To) must be after start time (From).');
      return;
    }

    setErrorMessage(null);
    onConfirm({
      fromTime: formattedFrom,
      toTime: formattedTo,
    });
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
                <Text style={styles.title}>Set your time</Text>
                <Text style={styles.subtitle}>
                  Pick a time of the day, when you would like companionship or visits.
                </Text>
              </View>

              {/* Range Display Header: [ 9:45 AM ] -> [ 6:00 PM ] */}
              <View style={styles.rangeDisplayRow}>
                {/* Left Side: FROM Time */}
                <TouchableOpacity
                  style={[
                    styles.timeRangeBox,
                    activeTarget === 'from' && styles.timeRangeBoxActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setErrorMessage(null);
                    setActiveTarget('from');
                  }}
                >
                  <Text
                    style={[
                      styles.timeBigNumber,
                      activeTarget === 'from' ? styles.timeActiveColor : styles.timeInactiveColor,
                    ]}
                  >
                    {fromHour}:{fromMinute}{' '}
                    <Text
                      style={[
                        styles.periodSmall,
                        activeTarget === 'from' ? styles.timeActivePeriod : styles.timeInactivePeriod,
                      ]}
                    >
                      {fromPeriod}
                    </Text>
                  </Text>
                </TouchableOpacity>

                {/* Arrow */}
                <Text style={styles.rangeArrow}>→</Text>

                {/* Right Side: TO Time */}
                <TouchableOpacity
                  style={[
                    styles.timeRangeBox,
                    activeTarget === 'to' && styles.timeRangeBoxActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setErrorMessage(null);
                    setActiveTarget('to');
                  }}
                >
                  <Text
                    style={[
                      styles.timeBigNumber,
                      activeTarget === 'to' ? styles.timeActiveColor : styles.timeInactiveColor,
                    ]}
                  >
                    {toHour}:{toMinute}{' '}
                    <Text
                      style={[
                        styles.periodSmall,
                        activeTarget === 'to' ? styles.timeActivePeriod : styles.timeInactivePeriod,
                      ]}
                    >
                      {toPeriod}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Error Badge if validation fails */}
              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Sub-bar: Set All Day & AM/PM Switch */}
              <View style={styles.subBarRow}>
                <TouchableOpacity
                  style={styles.subBarBtn}
                  activeOpacity={0.7}
                  onPress={handleSetAllDay}
                >
                  <Text style={styles.subBarText}>Set Day (9AM - 5PM)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.periodToggleBadge}
                  activeOpacity={0.75}
                  onPress={togglePeriod}
                >
                  <Text style={styles.periodToggleText}>
                    Switch to {currentPeriod === 'AM' ? 'PM' : 'AM'}
                  </Text>
                </TouchableOpacity>
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
                      const isSelected = currentHour === h;
                      return (
                        <TouchableOpacity
                          key={`hour-${h}`}
                          style={styles.wheelItem}
                          onPress={() => setHour(h)}
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
                      const isSelected = currentMinute === m;
                      return (
                        <TouchableOpacity
                          key={`minute-${m}`}
                          style={styles.wheelItem}
                          onPress={() => setMinute(m)}
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

              {/* Bottom Actions: Apply & Close */}
              <View style={styles.bottomRow}>
                <TouchableOpacity
                  style={styles.applyBtn}
                  activeOpacity={0.85}
                  onPress={handleApply}
                >
                  <Text style={styles.applyBtnText}>CONFIRM TIME</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeBtn}
                  activeOpacity={0.7}
                  onPress={onClose}
                >
                  <Text style={styles.closeBtnText}>CLOSE</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#1A365D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A365D',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },

  // Range Display Row: 9:45 AM -> 6:00 PM
  rangeDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  timeRangeBox: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  timeRangeBoxActive: {
    borderBottomColor: '#1A365D',
    backgroundColor: '#EEF2FF',
  },
  timeBigNumber: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  timeActiveColor: {
    color: '#1A365D',
  },
  timeInactiveColor: {
    color: '#334155',
  },
  periodSmall: {
    fontSize: 15,
    fontWeight: '700',
  },
  timeActivePeriod: {
    color: '#3B82F6',
  },
  timeInactivePeriod: {
    color: '#94A3B8',
  },
  rangeArrow: {
    fontSize: 20,
    color: '#94A3B8',
    fontWeight: '600',
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
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    flex: 1,
  },

  // Sub-bar
  subBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 6,
    marginBottom: 14,
  },
  subBarBtn: {
    paddingVertical: 4,
  },
  subBarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  periodToggleBadge: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  periodToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A365D',
  },

  // Wheel Roller Columns
  wheelContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 190,
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 6,
  },
  selectionHighlight: {
    position: 'absolute',
    top: 73,
    left: 20,
    right: 20,
    height: ITEM_HEIGHT,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  wheelColumn: {
    flex: 1,
    height: '100%',
  },
  wheelScrollContent: {
    paddingVertical: 73,
    alignItems: 'center',
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  wheelItemText: {
    fontSize: 22,
    textAlign: 'center',
  },
  wheelItemTextSelected: {
    fontWeight: '800',
    color: '#1A365D',
    fontSize: 26,
  },
  wheelItemTextUnselected: {
    fontWeight: '500',
    color: '#CBD5E1',
    opacity: 0.7,
  },

  // Bottom Actions
  bottomRow: {
    width: '100%',
    alignItems: 'center',
    marginTop: 18,
    gap: 12,
  },
  applyBtn: {
    width: '100%',
    backgroundColor: '#1A365D',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A365D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  closeBtn: {
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.2,
  },
});
