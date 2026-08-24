import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import * as activityService from '../services/activityService';
import * as companionshipService from '../services/companionshipService';

const FALLBACK_ACTIVITIES = [
  { name: 'Grocery', icon: 'cart-outline', iconFamily: 'MaterialCommunityIcons' },
  { name: 'Medicine', icon: 'medical-bag', iconFamily: 'MaterialCommunityIcons' },
  { name: 'Tech', icon: 'laptop', iconFamily: 'MaterialCommunityIcons' },
  { name: 'Work', icon: 'wrench', iconFamily: 'MaterialCommunityIcons' },
  { name: 'Walk', icon: 'walking', iconFamily: 'FontAwesome5' },
  { name: 'Chat', icon: 'coffee', iconFamily: 'FontAwesome5' },
  { name: 'Game', icon: 'chess-pawn', iconFamily: 'FontAwesome5' },
  { name: 'Reading', icon: 'book-open-page-variant-outline', iconFamily: 'MaterialCommunityIcons' },
];

export function useCreateCompanionship({ onClose, onSuccess }) {
  const [activities, setActivities] = useState(FALLBACK_ACTIVITIES);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState('Grocery');

  // Date Selection: 'today' | 'tomorrow' | 'custom'
  const [dateOption, setDateOption] = useState('today');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Time Selection
  const [fromTime, setFromTime] = useState('09 : 00 AM');
  const [toTime, setToTime] = useState('11 : 00 AM');
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  // Communication Method: Default to 'chat' (message)
  const [communicationMethod, setCommunicationMethod] = useState('chat');

  const [submitting, setSubmitting] = useState(false);

  // Cross-platform alert / notification helper
  const notifyUser = (title, message, onOk) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
      window.alert(`${title}\n\n${message}`);
      if (onOk) onOk();
    } else {
      Alert.alert(title, message, [
        {
          text: 'OK',
          onPress: () => {
            if (onOk) onOk();
          },
        },
      ]);
    }
  };

  // Fetch activities from backend database
  const loadActivities = useCallback(async () => {
    try {
      setLoadingActivities(true);
      const res = await activityService.getActivities();
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        setActivities(res.data);
      }
    } catch (err) {
      console.log('Error loading activities:', err.message);
    } finally {
      setLoadingActivities(false);
    }
  }, []);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Handle Date quick buttons
  const handleSelectDateOption = (option) => {
    setDateOption(option);
    const d = new Date();
    if (option === 'today') {
      setSelectedDate(d.toISOString().split('T')[0]);
    } else if (option === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      setSelectedDate(d.toISOString().split('T')[0]);
    } else if (option === 'custom') {
      setIsCalendarOpen(true);
    }
  };

  const handleCustomDateConfirm = (dateString) => {
    setSelectedDate(dateString);
    setDateOption('custom');
    setIsCalendarOpen(false);
  };

  const handleCustomTimeConfirm = ({ fromTime: customFrom, toTime: customTo }) => {
    if (customFrom) setFromTime(customFrom);
    if (customTo) setToTime(customTo);
    setIsTimePickerOpen(false);
  };

  // Render Icon helper for activities
  const renderActivityIcon = (item, isSelected, size = 28) => {
    const iconColor = isSelected ? COLORS.secondary : COLORS.primary;
    const family = item.iconFamily || 'MaterialCommunityIcons';
    const iconName = item.icon || 'account-heart-outline';

    if (family === 'FontAwesome5') {
      return <FontAwesome5 name={iconName} size={size} color={iconColor} />;
    }
    if (family === 'Ionicons') {
      return <Ionicons name={iconName} size={size} color={iconColor} />;
    }
    return <MaterialCommunityIcons name={iconName} size={size} color={iconColor} />;
  };

  const convertToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const match = timeStr.replace(/\s+/g, '').match(/(\d{1,2}):(\d{2})(AM|PM)/i);
    if (!match) return 0;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'AM' && h === 12) h = 0;
    if (period === 'PM' && h !== 12) h += 12;
    return h * 60 + m;
  };

  // Submit Companionship Request
  const handleSubmit = async () => {
    const activeActivity = selectedActivity || 'Grocery';
    const todayStr = new Date().toISOString().split('T')[0];
    const activeDate = selectedDate || todayStr;

    // Disallow past dates
    if (activeDate < todayStr) {
      notifyUser('Invalid Date', 'You cannot schedule a companionship request for a past date.');
      return;
    }

    const activeFromTime = fromTime || '09 : 00 AM';
    const activeToTime = toTime || '11 : 00 AM';

    // Disallow past time if date is today
    if (activeDate === todayStr) {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const startMins = convertToMinutes(activeFromTime);
      if (startMins < currentMins) {
        notifyUser(
          'Invalid Time',
          'Selected time has already passed for today. Please pick a future time slot or use "Set Time".'
        );
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        activityType: activeActivity,
        scheduledDate: activeDate,
        startTime: activeFromTime.replace(/\s+/g, ' '),
        endTime: activeToTime.replace(/\s+/g, ' '),
        timeSlot: `${activeFromTime} - ${activeToTime}`,
        communicationMethod: communicationMethod || 'chat',
        notes: `Companionship for ${activeActivity} via ${communicationMethod || 'chat'}`,
      };

      console.log('Submitting companionship payload:', payload);
      const res = await companionshipService.createRequest(payload);

      if (res?.success) {
        notifyUser(
          'Request Sent Successfully',
          `Your companionship request for ${activeActivity} on ${activeDate} (${activeFromTime} - ${activeToTime}) has been sent.`,
          () => {
            if (onSuccess) onSuccess(res.data);
            if (onClose) onClose();
          }
        );
      } else {
        notifyUser(
          'Request Failed',
          res?.message || 'Unable to create companionship request.',
          () => {
            if (onClose) onClose();
          }
        );
      }
    } catch (err) {
      console.error('Error creating companionship request:', err);
      notifyUser(
        'Request Failed',
        err.message || 'Failed to submit companionship request.',
        () => {
          if (onClose) onClose();
        }
      );
    } finally {
      setSubmitting(false);
    }
  };

  return {
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
  };
}

