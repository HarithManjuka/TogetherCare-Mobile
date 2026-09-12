// src/hooks/useMySchedule.js
import React, { useState, useMemo } from 'react';
import { Alert, Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import * as companionshipService from '../services/companionshipService';

export const SCHEDULE_QUERY_KEY = ['mySchedule'];

export const useMySchedule = ({ initialTab = 'upcoming' } = {}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);

  // Query cached schedule data (with deduplication & background stale refresh)
  const {
    data: schedule = [],
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery({
    queryKey: SCHEDULE_QUERY_KEY,
    queryFn: async () => {
      const response = await companionshipService.getMyRequests();
      return response?.data || response?.requests || (Array.isArray(response) ? response : []);
    },
  });

  // Mutation to cancel a request and immediately invalidate/refresh the cache
  const cancelMutation = useMutation({
    mutationFn: (requestId) => companionshipService.cancelRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY });
    },
  });

  // Mutation to delete a request and immediately invalidate/refresh the cache
  const deleteMutation = useMutation({
    mutationFn: (requestId) => companionshipService.deleteRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY });
    },
  });

  // Helper to categorize schedules
  const categorized = useMemo(() => {
    const requested = [];
    const upcoming = [];
    const ongoing = [];
    const completed = [];

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const schedulesList = Array.isArray(schedule) ? schedule : [];

    schedulesList.forEach((item) => {
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
  }, [schedule]);

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

  // Delete Request Handler
  const handleDeleteRequest = (scheduleItem) => {
    const requestId = typeof scheduleItem === 'string' ? scheduleItem : scheduleItem?._id;
    const performDelete = async () => {
      try {
        await deleteMutation.mutateAsync(requestId);
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
          window.alert('Request Deleted\n\nYour companionship request has been deleted.');
        } else {
          Alert.alert('Request Deleted', 'Your companionship request has been deleted.');
        }
        setSelectedSchedule(null);
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
    const requestId = typeof scheduleItem === 'string' ? scheduleItem : scheduleItem?._id;
    const performCancel = async () => {
      try {
        await cancelMutation.mutateAsync(requestId);
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
          window.alert('Request Cancelled\n\nYour request has been cancelled.');
        } else {
          Alert.alert('Request Cancelled', 'Your request has been cancelled.');
        }
        setSelectedSchedule(null);
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
    schedule,
    schedules: schedule,
    isLoading,
    isRefreshing: isRefetching,
    refreshing: isRefetching,
    error: error ? error.message : null,
    fetchError: error ? error.message : null,
    refreshSchedule: refetch,
    onRefresh: refetch,
    cancelRequest: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
    activeTab,
    setActiveTab,
    currentList,
    categorized,
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
};

