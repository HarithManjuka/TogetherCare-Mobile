// src/components/elderly/CreateCompanionshipModal.js
import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useCreateCompanionship } from '../../hooks/useCreateCompanionship';
import { useTheme } from '../../context/ThemeContext';
import CalendarDatePickerModal from '../common/CalendarDatePickerModal';
import { getCreateCompanionshipStyles } from '../../styles/CreateCompanionshipModal.styles';

export default function CreateCompanionshipModal({
  visible,
  onClose,
  onSuccess,
}) {
  const { scale } = useTheme();
  const styles = useMemo(() => getCreateCompanionshipStyles(scale), [scale]);

  const {
    activities,
    loadingActivities,
    selectedActivity,
    setSelectedActivity,
    dateOption,
    selectedDate,
    isCalendarOpen,
    setIsCalendarOpen,
    fromTime,
    setFromTime,
    toTime,
    setToTime,
    communicationMethod,
    setCommunicationMethod,
    submitting,
    handleSelectDateOption,
    handleCustomDateConfirm,
    renderActivityIcon,
    handleSubmit,
  } = useCreateCompanionship({ onClose, onSuccess });

  // Time slot options
  const fromTimeOptions = ['09 : 00 AM', '02 : 00 PM'];
  const toTimeOptions = ['11 : 00 AM', '04 : 00 PM'];

  // Format date display for custom pill
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
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.stepMainTitle}>STEP 1: Choose Activity</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close modal"
            >
              <Ionicons name="close" size={Math.round(26 * scale)} color="#000000" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* STEP 1: Activity Grid */}
            <View style={styles.stepSection}>
              {loadingActivities ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#1E40AF" />
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
                    return (
                      <TouchableOpacity
                        key={`from-${time}`}
                        style={[
                          styles.timeOptionCard,
                          isSelected && styles.timeOptionCardSelected,
                        ]}
                        activeOpacity={0.75}
                        onPress={() => setFromTime(time)}
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
                    return (
                      <TouchableOpacity
                        key={`to-${time}`}
                        style={[
                          styles.timeOptionCard,
                          isSelected && styles.timeOptionCardSelected,
                        ]}
                        activeOpacity={0.75}
                        onPress={() => setToTime(time)}
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
                  onPress={() => {
                    // Quick swap or alternate times
                    if (fromTime === '09 : 00 AM') {
                      setFromTime('02 : 00 PM');
                      setToTime('04 : 00 PM');
                    } else {
                      setFromTime('09 : 00 AM');
                      setToTime('11 : 00 AM');
                    }
                  }}
                >
                  <Ionicons name="time-outline" size={Math.round(16 * scale)} color="#1E293B" />
                  <Text style={styles.setTimePillText}>Set Time</Text>
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
                    color={communicationMethod === 'call' ? '#1E40AF' : '#000000'}
                  />
                </TouchableOpacity>

                {/* 2. Chat / SMS */}
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
                    color={communicationMethod === 'chat' ? '#1E40AF' : '#000000'}
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
                    color={communicationMethod === 'video' ? '#1E40AF' : '#000000'}
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
                    color={communicationMethod === 'in_person' ? '#1E40AF' : '#000000'}
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
        </View>
      </View>

      {/* Calendar Modal */}
      <CalendarDatePickerModal
        visible={isCalendarOpen}
        initialDate={selectedDate}
        isElderlyMode={false}
        onConfirm={handleCustomDateConfirm}
        onClose={() => setIsCalendarOpen(false)}
      />
    </Modal>
  );
}
