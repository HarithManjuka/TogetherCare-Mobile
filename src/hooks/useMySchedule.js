// src/hooks/useMySchedule.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert, Platform } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import * as companionshipService from '../services/companionshipService';

export function useMySchedule({ initialTab = 'upcoming' } = {}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'requested' | 'upcoming' | 'ongoing' | 'completed'
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // Fetch all user schedules & requests
  const fetchSchedules = useCallback(async () => {
    try {
      setFetchError(null);
      const res = await companionshipService.getMyRequests();
      if (res?.success && Array.isArray(res.data)) {
        setSchedules(res.data);
      } else {
        setSchedules([]);
      }
    } catch (err) {
      console.log('Error fetching schedules:', err.message);
      setFetchError('Unable to load schedule from database. Pull down to refresh.');
      setSchedules([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedules();
  };

  // Helper to categorize schedules
  const categorized = useMemo(() => {
    const requested = [];
    const upcoming = [];
    const ongoing = [];
    const completed = [];

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    schedules.forEach((item) => {
      const status = (item.status || 'pending').toLowerCase();
      const schedDate = item.scheduledDate
        ? new Date(item.scheduledDate).toISOString().split('T')[0]
        : '';

      if (status === 'pending') {
        requested.push(item);
      } else if (status === 'completed' || status === 'cancelled') {
        completed.push(item);
      } else if (status === 'ongoing' || status === 'in_progress') {
        ongoing.push(item);
      } else if (status === 'accepted' || status === 'scheduled') {
        // If scheduled for today, can be ongoing or upcoming
        if (schedDate === todayStr) {
          upcoming.push(item);
        } else {
          upcoming.push(item);
        }
      } else {
        requested.push(item);
      }
    });

    return { requested, upcoming, ongoing, completed };
  }, [schedules]);

  // Current list based on active tab
  const currentList = useMemo(() => {
    switch (activeTab) {
      case 'requested':
        return categorized.requested;
      case 'upcoming':
        return categorized.upcoming;
      case 'ongoing':
        return categorized.ongoing;
      case 'completed':
        return categorized.completed;
      default:
        return categorized.upcoming;
    }
  }, [activeTab, categorized]);

  // Format date helper
  const formatScheduleDate = (dateString, timeSlot) => {
    if (!dateString) return { date: 'Date TBD', time: timeSlot || '' };
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return { date: 'Date TBD', time: timeSlot || '' };

    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const day = d.getDate();
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const year = d.getFullYear();

    return {
      date: `${weekday}, ${month} ${day}`,
      fullDate: `${month} ${day}, ${year}`,
      time: timeSlot || d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
  };

  // Activity Icon renderer
  const renderActivityIcon = (activityType, size = 24) => {
    const type = activityType?.toLowerCase() || '';
    switch (type) {
      case 'walk':
      case 'walking':
        return <FontAwesome5 name="walking" size={size} color={COLORS.primary} />;
      case 'chat':
      case 'coffee':
        return <FontAwesome5 name="coffee" size={size} color={COLORS.primary} />;
      case 'grocery':
      case 'groceries':
      case 'shopping':
        return <MaterialCommunityIcons name="cart-outline" size={size} color={COLORS.primary} />;
      case 'medicine':
      case 'medical':
        return <MaterialCommunityIcons name="medical-bag" size={size} color="#DC2626" />;
      case 'reading':
        return <Ionicons name="book-outline" size={size} color={COLORS.primary} />;
      case 'tech':
        return <MaterialCommunityIcons name="laptop" size={size} color={COLORS.primary} />;
      case 'work':
        return <MaterialCommunityIcons name="wrench" size={size} color={COLORS.primary} />;
      case 'game':
        return <FontAwesome5 name="chess-pawn" size={size} color={COLORS.primary} />;
      default:
        return <MaterialCommunityIcons name="account-heart-outline" size={size} color={COLORS.primary} />;
    }
  };

  // Communication Method Icon
  const renderCommIcon = (method, size = 18) => {
    switch (method?.toLowerCase()) {
      case 'call':
        return <Ionicons name="call" size={size} color="#2563EB" />;
      case 'chat':
        return <Ionicons name="chatbubble-ellipses" size={size} color="#0D9488" />;
      case 'video':
        return <Ionicons name="videocam" size={size} color="#7C3AED" />;
      case 'in_person':
      default:
        return <MaterialCommunityIcons name="account-group" size={size} color="#EA580C" />;
    }
  };

  const [editingRequest, setEditingRequest] = useState(null);

  // Delete Request Handler
  const handleDeleteRequest = (scheduleItem) => {
    const performDelete = async () => {
      try {
        const res = await companionshipService.deleteRequest(scheduleItem._id);
        if (res?.success) {
          if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
            window.alert('Request Deleted\n\nYour companionship request has been deleted.');
          } else {
            Alert.alert('Request Deleted', 'Your companionship request has been deleted.');
          }
          fetchSchedules();
          setSelectedSchedule(null);
        }
      } catch (err) {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
          window.alert(`Error\n\n${err.message || 'Failed to delete request.'}`);
        } else {
          Alert.alert('Error', err.message || 'Failed to delete request.');
        }
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
      if (window.confirm('Are you sure you want to delete this companionship request? This action cannot be undone.')) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Request',
        'Are you sure you want to permanently delete this companionship request?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes, Delete', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  };

  // Cancel Request Handler
  const handleCancelRequest = (scheduleItem) => {
    const performCancel = async () => {
      try {
        const res = await companionshipService.cancelRequest(scheduleItem._id);
        if (res?.success) {
          if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
            window.alert('Request Cancelled\n\nYour request has been cancelled.');
          } else {
            Alert.alert('Request Cancelled', 'Your request has been cancelled.');
          }
          fetchSchedules();
          setSelectedSchedule(null);
        }
      } catch (err) {
        Alert.alert('Error', err.message || 'Failed to cancel request.');
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
      if (window.confirm('Are you sure you want to cancel this companionship request?')) {
        performCancel();
      }
    } else {
      Alert.alert(
        'Cancel Request',
        'Are you sure you want to cancel this request?',
        [
          { text: 'Keep Request', style: 'cancel' },
          { text: 'Yes, Cancel', style: 'destructive', onPress: performCancel },
        ]
      );
    }
  };

  return {
    activeTab,
    setActiveTab,
    schedules,
    currentList,
    categorized,
    isLoading,
    refreshing,
    fetchError,
    onRefresh,
    selectedSchedule,
    setSelectedSchedule,
    editingRequest,
    setEditingRequest,
    formatScheduleDate,
    renderActivityIcon,
    renderCommIcon,
    handleCancelRequest,
    handleDeleteRequest,
    counts: {
      requested: categorized.requested.length,
      upcoming: categorized.upcoming.length,
      ongoing: categorized.ongoing.length,
      completed: categorized.completed.length,
    },
  };
}
