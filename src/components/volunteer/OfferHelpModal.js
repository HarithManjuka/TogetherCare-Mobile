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

  const SRI_LANKA_DISTRICT_COORDS = {
    Colombo: { lat: 6.9271, lng: 79.8612, province: 'Western' },
    Gampaha: { lat: 7.0840, lng: 79.9943, province: 'Western' },
    Kalutara: { lat: 6.5854, lng: 79.9607, province: 'Western' },
    Kandy: { lat: 7.2906, lng: 80.6337, province: 'Central' },
    Matale: { lat: 7.4675, lng: 80.6234, province: 'Central' },
    'Nuwara Eliya': { lat: 6.9497, lng: 80.7891, province: 'Central' },
    Galle: { lat: 6.0535, lng: 80.2210, province: 'Southern' },
    Matara: { lat: 5.9549, lng: 80.5550, province: 'Southern' },
    Hambantota: { lat: 6.1429, lng: 81.1212, province: 'Southern' },
    Jaffna: { lat: 9.6615, lng: 80.0255, province: 'Northern' },
    Kilinochchi: { lat: 9.3803, lng: 80.3770, province: 'Northern' },
    Mannar: { lat: 8.9810, lng: 79.9044, province: 'Northern' },
    Vavuniya: { lat: 8.7542, lng: 80.4982, province: 'Northern' },
    Mullaitivu: { lat: 9.2671, lng: 80.8143, province: 'Northern' },
    Batticaloa: { lat: 7.7310, lng: 81.6747, province: 'Eastern' },
    Ampara: { lat: 7.2975, lng: 81.6820, province: 'Eastern' },
    Trincomalee: { lat: 8.5874, lng: 81.2152, province: 'Eastern' },
    Kurunegala: { lat: 7.4863, lng: 80.3623, province: 'North Western' },
    Puttalam: { lat: 8.0362, lng: 79.8283, province: 'North Western' },
    Anuradhapura: { lat: 8.3114, lng: 80.4037, province: 'North Central' },
    Polonnaruwa: { lat: 7.9403, lng: 81.0188, province: 'North Central' },
    Badulla: { lat: 6.9934, lng: 81.0550, province: 'Uva' },
    Monaragala: { lat: 6.8728, lng: 81.3507, province: 'Uva' },
    Ratnapura: { lat: 6.7056, lng: 80.3847, province: 'Sabaragamuwa' },
    Kegalle: { lat: 7.2513, lng: 80.3464, province: 'Sabaragamuwa' },
  };

  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const getTodayDateString = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // 3. Form States
  const [selectedServices, setSelectedServices] = useState([]);
  const [availableDate, setAvailableDate] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [startTime, setStartTime] = useState('02:00 PM');
  const [endTime, setEndTime] = useState('04:00 PM');
  const [timeMode, setTimeMode] = useState('chips'); // 'chips' | 'manual'
  const [manualStartInput, setManualStartInput] = useState('02:00 PM');
  const [manualEndInput, setManualEndInput] = useState('04:00 PM');
  const [locationMode, setLocationMode] = useState('manual'); // 'manual' | 'map'
  const [serviceArea, setServiceArea] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('Colombo');
  const [radius, setRadius] = useState('Within 5 km');
  const [capacity, setCapacity] = useState(2);
  const [specialSkills, setSpecialSkills] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const formatMinutesTo12Hour = (totalMins) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  };

  const handleAdjustStartTime = (deltaMins) => {
    let currentMins = parseTimeToMinutes(startTime) || 840;
    currentMins = Math.max(0, Math.min(23 * 60 + 59, currentMins + deltaMins));
    const formatted = formatMinutesTo12Hour(currentMins);
    setStartTime(formatted);
    setManualStartInput(formatted);
  };

  const handleAdjustEndTime = (deltaMins) => {
    let currentMins = parseTimeToMinutes(endTime) || 960;
    currentMins = Math.max(0, Math.min(23 * 60 + 59, currentMins + deltaMins));
    const formatted = formatMinutesTo12Hour(currentMins);
    setEndTime(formatted);
    setManualEndInput(formatted);
  };

  const handleToggleStartPeriod = () => {
    const currentMins = parseTimeToMinutes(startTime) || 840;
    const newMins = currentMins >= 12 * 60 ? currentMins - 12 * 60 : currentMins + 12 * 60;
    const formatted = formatMinutesTo12Hour(newMins);
    setStartTime(formatted);
    setManualStartInput(formatted);
  };

  const handleToggleEndPeriod = () => {
    const currentMins = parseTimeToMinutes(endTime) || 960;
    const newMins = currentMins >= 12 * 60 ? currentMins - 12 * 60 : currentMins + 12 * 60;
    const formatted = formatMinutesTo12Hour(newMins);
    setEndTime(formatted);
    setManualEndInput(formatted);
  };

  const timeOptions = [
    '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM',
    '07:00 PM', '08:00 PM',
  ];

  const radiusOptions = ['Within 2 km', 'Within 5 km', 'Within 10 km', 'Within 15 km'];
  const capacityOptions = [1, 2, 3, 4, 5];

  const todayStr = getTodayDateString();
  const isSelectedDateToday = availableDate === todayStr;
  const now = new Date();
  const currentMinutesNow = now.getHours() * 60 + now.getMinutes();

  const isStartTimeDisabled = (t) => {
    if (!isSelectedDateToday) return false;
    const tMin = parseTimeToMinutes(t);
    return tMin <= currentMinutesNow;
  };

  const isEndTimeDisabled = (t) => {
    const tMin = parseTimeToMinutes(t);
    const startMin = parseTimeToMinutes(startTime);
    if (tMin <= startMin) return true;
    if (isSelectedDateToday && tMin <= currentMinutesNow) return true;
    return false;
  };

  // Auto-adjust start & end time when today is selected and start time is in the past
  useEffect(() => {
    if (isSelectedDateToday) {
      const curStartMin = parseTimeToMinutes(startTime);
      if (curStartMin <= currentMinutesNow) {
        const nextValidStart = timeOptions.find((t) => parseTimeToMinutes(t) > currentMinutesNow);
        if (nextValidStart) {
          setStartTime(nextValidStart);
          const nextStartMin = parseTimeToMinutes(nextValidStart);
          const nextValidEnd = timeOptions.find((t) => parseTimeToMinutes(t) >= nextStartMin + 60);
          if (nextValidEnd) {
            setEndTime(nextValidEnd);
          }
        }
      }
    }
  }, [availableDate, isSelectedDateToday]);

  // Reset or initialize on open
  useEffect(() => {
    if (visible) {
      if (initialData) {
        setSelectedServices(initialData.services || []);
        setAvailableDate(initialData.date || '');
        setStartTime(initialData.startTime || '02:00 PM');
        setEndTime(initialData.endTime || '04:00 PM');
        setServiceArea(initialData.serviceArea || currentUser?.address?.city || 'Colombo 03');
        setSelectedDistrict(initialData.serviceArea?.includes('Kandy') ? 'Kandy' : 'Colombo');
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
        const defaultLoc = currentUser?.address?.city
          ? `${currentUser.address.city}, ${currentUser.address.district || 'Colombo'}`
          : 'Colombo 03';
        setServiceArea(defaultLoc);
        setSelectedDistrict(currentUser?.address?.district || 'Colombo');
        setRadius('Within 5 km');
        setCapacity(2);
        setSpecialSkills('');
      }
      setLocationMode('manual');
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

  const handleSelectDistrict = (distName) => {
    setSelectedDistrict(distName);
    const coords = SRI_LANKA_DISTRICT_COORDS[distName];
    setServiceArea(`${distName}, ${coords?.province || 'Sri Lanka'}`);
    if (fieldErrors.serviceArea) {
      setFieldErrors((prev) => ({ ...prev, serviceArea: false }));
    }
  };

  const handleUseRegisteredAddress = () => {
    if (currentUser?.address) {
      const addr = currentUser.address;
      const reg = [addr.streetAddress, addr.city, addr.district].filter(Boolean).join(', ');
      setServiceArea(reg || 'Colombo');
      if (addr.district && SRI_LANKA_DISTRICT_COORDS[addr.district]) {
        setSelectedDistrict(addr.district);
      }
    } else {
      setServiceArea('Colombo 03');
      setSelectedDistrict('Colombo');
    }
    if (fieldErrors.serviceArea) {
      setFieldErrors((prev) => ({ ...prev, serviceArea: false }));
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
      if (availableDate < todayStr) {
        Alert.alert('Invalid Date', 'Available date cannot be in the past. Please select today or an upcoming date.');
        return;
      }
    }

    // 3. Time validation (Cannot pick previous time if today)
    if (isSelectedDateToday && parseTimeToMinutes(startTime) <= currentMinutesNow) {
      Alert.alert(
        'Invalid Start Time',
        'The selected start time has already passed today. Please pick an upcoming time slot.'
      );
      return;
    }

    if (parseTimeToMinutes(endTime) <= parseTimeToMinutes(startTime)) {
      Alert.alert('Invalid Time Range', 'End time must be after the start time.');
      return;
    }

    // 4. Location check
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
      id: initialData ? (initialData._id || initialData.id) : undefined,
      _id: initialData ? (initialData._id || initialData.id) : undefined,
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

              {/* Time Mode Toggle: Quick Slots vs Manual Time Input */}
              <View style={styles.timeModeToggleRow}>
                <TouchableOpacity
                  style={[styles.timeModeBtn, timeMode === 'chips' && styles.timeModeBtnActive]}
                  onPress={() => setTimeMode('chips')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="flash-outline"
                    size={13}
                    color={timeMode === 'chips' ? '#1E40AF' : '#64748B'}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.timeModeBtnText, timeMode === 'chips' && styles.timeModeBtnTextActive]}>
                    Quick Slots
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.timeModeBtn, timeMode === 'manual' && styles.timeModeBtnActive]}
                  onPress={() => setTimeMode('manual')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="keypad-outline"
                    size={13}
                    color={timeMode === 'manual' ? '#1E40AF' : '#64748B'}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.timeModeBtnText, timeMode === 'manual' && styles.timeModeBtnTextActive]}>
                    Enter Time Manually
                  </Text>
                </TouchableOpacity>
              </View>

              {timeMode === 'manual' ? (
                /* MANUAL TIME INPUT CARDS */
                <View style={styles.manualTimeBox}>
                  {/* Start Time Manual */}
                  <View style={styles.manualTimeCard}>
                    <View style={styles.manualTimeCardHeader}>
                      <Text style={styles.subFieldLabel}>Start Time (Manual)</Text>
                      <TouchableOpacity
                        style={styles.periodToggleBtn}
                        onPress={handleToggleStartPeriod}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="swap-vertical" size={12} color="#1E40AF" style={{ marginRight: 2 }} />
                        <Text style={styles.periodToggleText}>{startTime.includes('PM') ? 'PM ➔ AM' : 'AM ➔ PM'}</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.manualInputRow}>
                      <Ionicons name="time-outline" size={17} color="#64748B" style={{ marginRight: 6 }} />
                      <TextInput
                        style={styles.manualTimeInput}
                        value={manualStartInput}
                        onChangeText={(val) => {
                          setManualStartInput(val);
                          const p = parseTimeToMinutes(val);
                          if (p > 0) setStartTime(val.trim());
                        }}
                        placeholder="e.g. 09:30 AM"
                        placeholderTextColor="#94A3B8"
                        autoCapitalize="characters"
                      />
                      <TouchableOpacity
                        style={styles.bumpBtn}
                        onPress={() => handleAdjustStartTime(-15)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.bumpBtnText}>-15m</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.bumpBtn}
                        onPress={() => handleAdjustStartTime(+15)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.bumpBtnText}>+15m</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.bumpBtn}
                        onPress={() => handleAdjustStartTime(+60)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.bumpBtnText}>+1h</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* End Time Manual */}
                  <View style={styles.manualTimeCard}>
                    <View style={styles.manualTimeCardHeader}>
                      <Text style={styles.subFieldLabel}>End Time (Manual)</Text>
                      <TouchableOpacity
                        style={styles.periodToggleBtn}
                        onPress={handleToggleEndPeriod}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="swap-vertical" size={12} color="#1E40AF" style={{ marginRight: 2 }} />
                        <Text style={styles.periodToggleText}>{endTime.includes('PM') ? 'PM ➔ AM' : 'AM ➔ PM'}</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.manualInputRow}>
                      <Ionicons name="time-outline" size={17} color="#64748B" style={{ marginRight: 6 }} />
                      <TextInput
                        style={styles.manualTimeInput}
                        value={manualEndInput}
                        onChangeText={(val) => {
                          setManualEndInput(val);
                          const p = parseTimeToMinutes(val);
                          if (p > 0) setEndTime(val.trim());
                        }}
                        placeholder="e.g. 11:45 AM"
                        placeholderTextColor="#94A3B8"
                        autoCapitalize="characters"
                      />
                      <TouchableOpacity
                        style={styles.bumpBtn}
                        onPress={() => handleAdjustEndTime(-15)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.bumpBtnText}>-15m</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.bumpBtn}
                        onPress={() => handleAdjustEndTime(+15)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.bumpBtnText}>+15m</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.bumpBtn}
                        onPress={() => handleAdjustEndTime(+60)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.bumpBtnText}>+1h</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                /* Time Range Chips Selector */
                <View style={styles.timeRangeContainer}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.subFieldLabel}>Start Time</Text>
                      {isSelectedDateToday && (
                        <Text style={{ fontSize: 10, color: '#D97706', fontWeight: '700' }}>
                          Upcoming only
                        </Text>
                      )}
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.timeChipsRow}>
                        {timeOptions.map((t) => {
                          const disabled = isStartTimeDisabled(t);
                          return (
                            <TouchableOpacity
                              key={`start-${t}`}
                              disabled={disabled}
                              style={[
                                styles.timeChip,
                                startTime === t && styles.timeChipActive,
                                disabled && styles.timeChipDisabled,
                              ]}
                              onPress={() => {
                                if (!disabled) {
                                  setStartTime(t);
                                  setManualStartInput(t);
                                }
                              }}
                            >
                              <Text
                                style={[
                                  styles.timeChipText,
                                  startTime === t && styles.timeChipTextActive,
                                  disabled && styles.timeChipTextDisabled,
                                ]}
                              >
                                {t}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.subFieldLabel}>End Time</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.timeChipsRow}>
                        {timeOptions.map((t) => {
                          const disabled = isEndTimeDisabled(t);
                          return (
                            <TouchableOpacity
                              key={`end-${t}`}
                              disabled={disabled}
                              style={[
                                styles.timeChip,
                                endTime === t && styles.timeChipActive,
                                disabled && styles.timeChipDisabled,
                              ]}
                              onPress={() => {
                                if (!disabled) {
                                  setEndTime(t);
                                  setManualEndInput(t);
                                }
                              }}
                            >
                              <Text
                                style={[
                                  styles.timeChipText,
                                  endTime === t && styles.timeChipTextActive,
                                  disabled && styles.timeChipTextDisabled,
                                ]}
                              >
                                {t}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                </View>
              )}

              {/* Time Preview / Validation Banner */}
              {isSelectedDateToday && parseTimeToMinutes(startTime) <= currentMinutesNow ? (
                <View style={styles.timeWarningBadge}>
                  <Ionicons name="warning" size={14} color="#DC2626" />
                  <Text style={styles.timeWarningText}>
                    Selected start time ({startTime}) has already passed today. Please pick an upcoming time.
                  </Text>
                </View>
              ) : parseTimeToMinutes(endTime) <= parseTimeToMinutes(startTime) ? (
                <View style={styles.timeWarningBadge}>
                  <Ionicons name="alert-circle" size={14} color="#D97706" />
                  <Text style={styles.timeWarningText}>
                    End time must be after {startTime}.
                  </Text>
                </View>
              ) : (
                <View style={styles.timePreviewBadge}>
                  <Ionicons name="time" size={14} color="#1E40AF" />
                  <Text style={styles.timePreviewText}>
                    Slot: {availableDate || 'Selected Date'} from {startTime} to {endTime}
                  </Text>
                </View>
              )}
            </View>

            {/* Field 4: Service Area / Radius (Manual & Map Pickers) */}
            <View style={styles.fieldBlock}>
              <View style={styles.serviceAreaHeaderRow}>
                <Text style={styles.fieldLabel}>
                  Service Area & Radius <Text style={styles.reqStar}>*</Text>
                </Text>

                {/* Segmented Picker: Manual vs Map */}
                <View style={styles.modeTabs}>
                  <TouchableOpacity
                    style={[styles.modeTab, locationMode === 'manual' && styles.modeTabActive]}
                    onPress={() => setLocationMode('manual')}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="create-outline"
                      size={13}
                      color={locationMode === 'manual' ? '#FFFFFF' : '#1E40AF'}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.modeTabText,
                        locationMode === 'manual' && styles.modeTabTextActive,
                      ]}
                    >
                      Manual
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modeTab, locationMode === 'map' && styles.modeTabActive]}
                    onPress={() => setLocationMode('map')}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="map-outline"
                      size={13}
                      color={locationMode === 'map' ? '#FFFFFF' : '#1E40AF'}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.modeTabText,
                        locationMode === 'map' && styles.modeTabTextActive,
                      ]}
                    >
                      Map
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {locationMode === 'manual' ? (
                /* --- A. MANUAL INPUT MODE --- */
                <View style={styles.manualLocationBox}>
                  <TextInput
                    style={[
                      styles.textInput,
                      fieldErrors.serviceArea && styles.inputError,
                    ]}
                    placeholder="Base Location (e.g. Colombo 03, Wellawatte, Kandy)"
                    placeholderTextColor="#94A3B8"
                    value={serviceArea}
                    onChangeText={setServiceArea}
                  />

                  {/* Quick District / Location Suggestions */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                    <View style={styles.quickLocRow}>
                      <TouchableOpacity
                        style={styles.useMyLocChip}
                        onPress={handleUseRegisteredAddress}
                      >
                        <Ionicons name="navigate" size={12} color="#1D4ED8" />
                        <Text style={styles.useMyLocChipText}>My Address</Text>
                      </TouchableOpacity>

                      {['Colombo 03', 'Kandy', 'Gampaha', 'Galle', 'Kalutara', 'Kurunegala'].map((loc) => (
                        <TouchableOpacity
                          key={loc}
                          style={[
                            styles.quickLocChip,
                            serviceArea.toLowerCase().includes(loc.toLowerCase()) && styles.quickLocChipActive,
                          ]}
                          onPress={() => setServiceArea(loc)}
                        >
                          <Text
                            style={[
                              styles.quickLocChipText,
                              serviceArea.toLowerCase().includes(loc.toLowerCase()) && styles.quickLocChipTextActive,
                            ]}
                          >
                            {loc}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              ) : (
                /* --- B. MAP / DISTRICT PICKER MODE --- */
                <View style={styles.mapPickerCard}>
                  {/* District Quick Grid */}
                  <Text style={styles.mapPickerLabel}>Select District / Area Hub:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                    <View style={styles.quickLocRow}>
                      <TouchableOpacity
                        style={styles.useMyLocChip}
                        onPress={handleUseRegisteredAddress}
                      >
                        <Ionicons name="navigate" size={12} color="#1D4ED8" />
                        <Text style={styles.useMyLocChipText}>My District</Text>
                      </TouchableOpacity>

                      {Object.keys(SRI_LANKA_DISTRICT_COORDS).slice(0, 10).map((dist) => (
                        <TouchableOpacity
                          key={dist}
                          style={[
                            styles.districtChip,
                            selectedDistrict === dist && styles.districtChipActive,
                          ]}
                          onPress={() => handleSelectDistrict(dist)}
                        >
                          <Text
                            style={[
                              styles.districtChipText,
                              selectedDistrict === dist && styles.districtChipTextActive,
                            ]}
                          >
                            {dist}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  {/* Interactive Map Visualizer */}
                  {(() => {
                    const coords = SRI_LANKA_DISTRICT_COORDS[selectedDistrict] || SRI_LANKA_DISTRICT_COORDS.Colombo;
                    const lat = coords.lat;
                    const lng = coords.lng;

                    return (
                      <View style={styles.mapCanvasWrapper}>
                        {Platform.OS === 'web' ? (
                          <iframe
                            title="Service Area Location Map"
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${(lng - 0.04).toFixed(4)}%2C${(lat - 0.03).toFixed(4)}%2C${(lng + 0.04).toFixed(4)}%2C${(lat + 0.03).toFixed(4)}&layer=mapnik&marker=${lat.toFixed(4)}%2C${lng.toFixed(4)}`}
                            style={{
                              width: '100%',
                              height: 180,
                              borderRadius: 12,
                              border: 'none',
                            }}
                          />
                        ) : (
                          <View style={styles.nativeMapCanvas}>
                            <Ionicons name="location" size={32} color="#DC2626" />
                            <Text style={styles.nativeMapTitle}>{selectedDistrict} Service Area</Text>
                            <Text style={styles.nativeMapSub}>
                              GPS: {lat.toFixed(4)}° N, {lng.toFixed(4)}° E · {radius}
                            </Text>
                          </View>
                        )}

                        <View style={styles.mapSelectedBar}>
                          <Ionicons name="checkmark-circle" size={15} color="#10B981" />
                          <Text style={styles.mapSelectedBarText}>
                            Selected: <Text style={{ fontWeight: '800' }}>{serviceArea || selectedDistrict}</Text> ({radius})
                          </Text>
                        </View>
                      </View>
                    );
                  })()}
                </View>
              )}

              {/* Radius Chips for Coverage */}
              <Text style={[styles.subFieldLabel, { marginTop: 10 }]}>Coverage Radius:</Text>
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
        initialDate={availableDate || todayStr}
        minDate={new Date()}
        title="📅 Select Available Date"
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

  // Manual Time Input Styles
  timeModeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 10,
  },
  timeModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeModeBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  timeModeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  timeModeBtnTextActive: {
    color: '#1E40AF',
    fontWeight: '800',
  },
  manualTimeBox: {
    gap: 10,
    marginBottom: 8,
  },
  manualTimeCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
  },
  manualTimeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  periodToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  periodToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E40AF',
  },
  manualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manualTimeInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 6,
  },
  bumpBtn: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 7,
    marginLeft: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bumpBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3730A3',
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

  // Time Validation Styles
  timeChipDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.45,
  },
  timeChipTextDisabled: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  timeWarningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  timeWarningText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
    flex: 1,
  },

  // Location Manual / Map Mode Styles
  serviceAreaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modeTabActive: {
    backgroundColor: '#1E40AF',
  },
  modeTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
  manualLocationBox: {
    marginBottom: 4,
  },
  quickLocRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  useMyLocChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#93C5FD',
    gap: 4,
  },
  useMyLocChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  quickLocChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  quickLocChipActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  quickLocChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  quickLocChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  mapPickerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  mapPickerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  districtChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  districtChipActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  districtChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  districtChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  mapCanvasWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  nativeMapCanvas: {
    height: 160,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  nativeMapTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 4,
  },
  nativeMapSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  mapSelectedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0FDF4',
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0',
    gap: 6,
  },
  mapSelectedBarText: {
    fontSize: 12,
    color: '#166534',
    flex: 1,
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
