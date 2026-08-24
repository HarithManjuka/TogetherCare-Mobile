// src/screens/elderly/CreateCompanionshipScreen.js
import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { useCreateCompanionship } from '../../hooks/useCreateCompanionship';
import { useTheme } from '../../context/ThemeContext';
import FutureDatePickerModal from '../../components/common/FutureDatePickerModal';
import TimePickerModal from '../../components/common/TimePickerModal';
import { getCreateCompanionshipScreenStyles } from '../../styles/CreateCompanionshipScreen.styles';

export default function CreateCompanionshipScreen({
  onBack,
  onClose,
  onSuccess,
}) {
  const { scale } = useTheme();
  const styles = useMemo(() => getCreateCompanionshipScreenStyles(scale), [scale]);

  const {
    activities,
    loadingActivities,
    selectedActivity,
    setSelectedActivity,
    dateOption,
    selectedDate,
    isCalendarOpen,
    setIsCalendarOpen,
    isTimePickerOpen,
    setIsTimePickerOpen,
    fromTime,
    setFromTime,
    toTime,
    setToTime,
    communicationMethod,
    setCommunicationMethod,
    submitting,
    handleSelectDateOption,
    handleCustomDateConfirm,
    handleCustomTimeConfirm,
    renderActivityIcon,
    handleSubmit,
  } = useCreateCompanionship({ onClose: onClose || onBack, onSuccess });

  // Time slot options (dynamically includes custom selected time)
  const baseFromOptions = ['09 : 00 AM', '02 : 00 PM'];
  const baseToOptions = ['11 : 00 AM', '04 : 00 PM'];

  const fromTimeOptions = useMemo(() => {
    if (fromTime && !baseFromOptions.includes(fromTime)) {
      return [...baseFromOptions, fromTime];
    }
    return baseFromOptions;
  }, [fromTime]);

  const toTimeOptions = useMemo(() => {
    if (toTime && !baseToOptions.includes(toTime)) {
      return [...baseToOptions, toTime];
    }
    return baseToOptions;
  }, [toTime]);

  // Check if a time slot option has already passed for today
  const isTimeSlotInPast = (timeStr) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedDate !== todayStr) return false;

    const match = timeStr.replace(/\s+/g, '').match(/(\d{1,2}):(\d{2})(AM|PM)/i);
    if (!match) return false;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'AM' && h === 12) h = 0;
    if (period === 'PM' && h !== 12) h += 12;

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    return (h * 60 + m) < currentMins;
  };

  // Format custom date button label
  const formatCustomPillLabel = () => {
    if (dateOption === 'custom' && selectedDate) {
      try {
        const parts = selectedDate.split('-');
        return `${parts[1]}/${parts[2]}`;
      } catch (e) {
        return 'Set Date';
      }
    }
    return 'Set Date';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.circleButton}
          activeOpacity={0.7}
          onPress={onBack || onClose}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={Math.round(22 * scale)} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.topTitleWrap}>
          <Text style={styles.topBarTitle}>STEP 1: Choose Activity</Text>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          activeOpacity={0.7}
          onPress={onClose || onBack}
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={Math.round(24 * scale)} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* STEP 1: Choose Activity */}
        <View style={styles.stepSection}>
          {loadingActivities ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={COLORS.secondary} />
            </View>
          ) : (
            <View style={styles.activityGrid}>
              {activities.map((item) => {
                const isSelected =
                  selectedActivity.toLowerCase() === item.name.toLowerCase();
                return (
                  <TouchableOpacity
                    key={item._id || item.name}
                    style={[
                      styles.activityCard,
                      isSelected && styles.activityCardSelected,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedActivity(item.name)}
                    accessibilityLabel={item.name}
                  >
                    <View style={styles.activityIconContainer}>
                      {renderActivityIcon(item, isSelected, Math.round(28 * scale))}
                    </View>
                    <Text
                      style={[
                        styles.activityName,
                        isSelected && styles.activityNameSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* STEP 2: Select Date & Time */}
        <View style={styles.stepSection}>
          <Text style={styles.stepTitle}>STEP 2: Select Date & Time</Text>

          {/* Date Pills */}
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={[
                styles.datePill,
                dateOption === 'today' && styles.datePillSelected,
              ]}
              activeOpacity={0.8}
              onPress={() => handleSelectDateOption('today')}
            >
              <Text
                style={[
                  styles.datePillText,
                  dateOption === 'today' && styles.datePillTextSelected,
                ]}
              >
                Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.datePill,
                dateOption === 'tomorrow' && styles.datePillSelected,
              ]}
              activeOpacity={0.8}
              onPress={() => handleSelectDateOption('tomorrow')}
            >
              <Text
                style={[
                  styles.datePillText,
                  dateOption === 'tomorrow' && styles.datePillTextSelected,
                ]}
              >
                Tomorrow
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.datePill,
                dateOption === 'custom' && styles.datePillSelected,
              ]}
              activeOpacity={0.8}
              onPress={() => handleSelectDateOption('custom')}
            >
              <Ionicons
                name="calendar-outline"
                size={Math.round(16 * scale)}
                color={dateOption === 'custom' ? '#FFFFFF' : '#1E293B'}
              />
              <Text
                style={[
                  styles.datePillText,
                  dateOption === 'custom' && styles.datePillTextSelected,
                ]}
              >
                {formatCustomPillLabel()}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Time Slots: From & To */}
          <View style={styles.timeColumnsRow}>
            {/* From Column */}
            <View style={styles.timeColumn}>
              <Text style={styles.timeColumnLabel}>From</Text>
              {fromTimeOptions.map((time) => {
                const isSelected = fromTime === time;
                const isPast = isTimeSlotInPast(time);
                return (
                  <TouchableOpacity
                    key={`from-${time}`}
                    style={[
                      styles.timeOptionCard,
                      isSelected && styles.timeOptionCardSelected,
                      isPast && styles.timeOptionCardDisabled,
                    ]}
                    disabled={isPast}
                    activeOpacity={0.75}
                    onPress={() => setFromTime(isSelected ? null : time)}
                  >
                    <View
                      style={[
                        styles.timeCheckbox,
                        isSelected && styles.timeCheckboxSelected,
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.timeText,
                        isSelected && styles.timeTextSelected,
                        isPast && { color: '#94A3B8', textDecorationLine: 'line-through' },
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* To Column */}
            <View style={styles.timeColumn}>
              <Text style={styles.timeColumnLabel}>To</Text>
              {toTimeOptions.map((time) => {
                const isSelected = toTime === time;
                const isPast = isTimeSlotInPast(time);
                return (
                  <TouchableOpacity
                    key={`to-${time}`}
                    style={[
                      styles.timeOptionCard,
                      isSelected && styles.timeOptionCardSelected,
                      isPast && styles.timeOptionCardDisabled,
                    ]}
                    disabled={isPast}
                    activeOpacity={0.75}
                    onPress={() => setToTime(isSelected ? null : time)}
                  >
                    <View
                      style={[
                        styles.timeCheckbox,
                        isSelected && styles.timeCheckboxSelected,
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.timeText,
                        isSelected && styles.timeTextSelected,
                        isPast && { color: '#94A3B8', textDecorationLine: 'line-through' },
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Set Time Center Pill */}
          <View style={styles.setTimeCenterWrap}>
            <TouchableOpacity
              style={styles.setTimePill}
              activeOpacity={0.8}
              onPress={() => setIsTimePickerOpen(true)}
            >
              <Ionicons name="time-outline" size={Math.round(16 * scale)} color="#1A365D" />
              <Text style={styles.setTimePillText}>
                {fromTime && toTime ? `Set Time (${fromTime} - ${toTime})` : 'Set Time'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider Line */}
        <View style={styles.dividerLine} />

        {/* STEP 3: Select Communication Method */}
        <View style={styles.stepSection}>
          <Text style={styles.stepTitle}>STEP 3: Select Communication Method</Text>

          <View style={styles.commMethodsRow}>
            {/* 1. Phone Call */}
            <TouchableOpacity
              style={[
                styles.commCircleBtn,
                communicationMethod === 'call' && styles.commCircleBtnSelected,
              ]}
              activeOpacity={0.8}
              onPress={() => setCommunicationMethod('call')}
              accessibilityLabel="Phone Call"
            >
              <Ionicons
                name="call"
                size={Math.round(26 * scale)}
                color={communicationMethod === 'call' ? '#1A365D' : '#64748B'}
              />
            </TouchableOpacity>

            {/* 2. Chat / SMS (Default Selected) */}
            <TouchableOpacity
              style={[
                styles.commCircleBtn,
                communicationMethod === 'chat' && styles.commCircleBtnSelected,
              ]}
              activeOpacity={0.8}
              onPress={() => setCommunicationMethod('chat')}
              accessibilityLabel="Chat Message"
            >
              <Ionicons
                name="chatbubble-outline"
                size={Math.round(28 * scale)}
                color={communicationMethod === 'chat' ? '#1A365D' : '#64748B'}
              />
            </TouchableOpacity>

            {/* 3. Video Call */}
            <TouchableOpacity
              style={[
                styles.commCircleBtn,
                communicationMethod === 'video' && styles.commCircleBtnSelected,
              ]}
              activeOpacity={0.8}
              onPress={() => setCommunicationMethod('video')}
              accessibilityLabel="Video Call"
            >
              <Ionicons
                name="videocam-outline"
                size={Math.round(30 * scale)}
                color={communicationMethod === 'video' ? '#1A365D' : '#64748B'}
              />
            </TouchableOpacity>

            {/* 4. In Person / Meeting */}
            <TouchableOpacity
              style={[
                styles.commCircleBtn,
                communicationMethod === 'in_person' && styles.commCircleBtnSelected,
              ]}
              activeOpacity={0.8}
              onPress={() => setCommunicationMethod('in_person')}
              accessibilityLabel="In-Person Meeting"
            >
              <MaterialCommunityIcons
                name="account-group"
                size={Math.round(30 * scale)}
                color={communicationMethod === 'in_person' ? '#1A365D' : '#64748B'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.confirmBtn}
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmBtnText}>Confirm Request</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Custom Future Date Picker Modal (Prevents past dates) */}
      <FutureDatePickerModal
        visible={isCalendarOpen}
        initialDate={selectedDate}
        onConfirm={handleCustomDateConfirm}
        onClose={() => setIsCalendarOpen(false)}
      />

      {/* Custom 00:00 AM/PM Time Picker Modal (Prevents past times for today) */}
      <TimePickerModal
        visible={isTimePickerOpen}
        selectedDate={selectedDate}
        initialFromTime={fromTime}
        initialToTime={toTime}
        onConfirm={handleCustomTimeConfirm}
        onClose={() => setIsTimePickerOpen(false)}
      />
    </SafeAreaView>
  );
}
