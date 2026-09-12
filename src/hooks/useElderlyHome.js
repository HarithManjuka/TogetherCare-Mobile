// src/hooks/useElderlyHome.js
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import * as activityService from '../services/activityService';
import * as companionshipService from '../services/companionshipService';
import { COLORS } from '../constants/theme';

export const ELDERLY_HOME_KEYS = {
  activities: ['elderly', 'activities'],
  requests: ['elderly', 'activeRequests'],
  upcomingVisits: ['elderly', 'upcomingVisits'],
};

export const useElderlyHome = () => {
  const queryClient = useQueryClient();
  const { user, refreshProfile } = useAuth();

  // Visit details modal, Profile screen, Create Companionship screen & Schedule screen state
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showProfileScreen, setShowProfileScreen] = useState(false);
  const [showCreateScreen, setShowCreateScreen] = useState(false);
  const [showScheduleScreen, setShowScheduleScreen] = useState(false);

  // Parallel, deduplicated query for activities
  const activitiesQuery = useQuery({
    queryKey: ELDERLY_HOME_KEYS.activities,
    queryFn: async () => {
      const res = await activityService.getAllActivities();
      return res?.data || res?.activities || (Array.isArray(res) ? res : []);
    },
  });

  // Parallel, deduplicated query for active requests
  const requestsQuery = useQuery({
    queryKey: ELDERLY_HOME_KEYS.requests,
    queryFn: async () => {
      const res = await companionshipService.getMyRequests();
      return res?.data || res?.requests || (Array.isArray(res) ? res : []);
    },
  });

  // Parallel, deduplicated query for upcoming visits
  const upcomingVisitsQuery = useQuery({
    queryKey: ELDERLY_HOME_KEYS.upcomingVisits,
    queryFn: async () => {
      const res = await companionshipService.getUpcomingVisits();
      return res?.data || res?.visits || (Array.isArray(res) ? res : []);
    },
  });

  const refreshAll = async () => {
    await Promise.all([
      activitiesQuery.refetch(),
      requestsQuery.refetch(),
      upcomingVisitsQuery.refetch(),
    ]);
  };

  // Dynamic time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Only the first name in greeting message
  const firstName = user?.firstName || '';

  // Format database date & time dynamically
  const formatScheduleDate = (dateString, timeSlot) => {
    if (!dateString) return { date: '', time: timeSlot || '' };
    const d = new Date(dateString);
    if (isNaN(d.getTime())) {
      return { date: '', time: timeSlot || '' };
    }
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const day = d.getDate();
    return {
      date: `${month} ${day}`,
      time: timeSlot || d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
  };

  // Activity Icon mapping based on database activityType field
  const renderActivityIcon = (activityType) => {
    switch (activityType?.toLowerCase()) {
      case 'walk':
      case 'walking':
      case 'stroll':
        return <FontAwesome5 name="walking" size={26} color={COLORS.primary} />;
      case 'coffee':
      case 'tea':
      case 'chat':
        return <FontAwesome5 name="coffee" size={22} color={COLORS.primary} />;
      case 'groceries':
      case 'grocery':
      case 'shopping':
        return <MaterialCommunityIcons name="cart-outline" size={26} color={COLORS.secondary} />;
      case 'medical':
      case 'medicine':
      case 'doctor':
        return <MaterialCommunityIcons name="medical-bag" size={26} color={COLORS.danger} />;
      case 'reading':
      case 'book':
        return <Ionicons name="book-outline" size={24} color={COLORS.secondary} />;
      case 'tech':
        return <MaterialCommunityIcons name="laptop" size={26} color={COLORS.primary} />;
      case 'work':
        return <MaterialCommunityIcons name="wrench" size={26} color={COLORS.secondary} />;
      case 'game':
        return <FontAwesome5 name="chess-pawn" size={24} color={COLORS.primary} />;
      default:
        return <MaterialCommunityIcons name="account-heart-outline" size={26} color={COLORS.secondary} />;
    }
  };

  // Handler for action cards
  const handleActionPress = (featureName) => {
    if (featureName === 'Request Help' || featureName === 'Companionship') {
      setShowCreateScreen(true);
      return;
    }
    if (
      featureName === 'Schedule' ||
      featureName === 'My Schedule' ||
      featureName === 'My Schedules' ||
      featureName === 'View Schedule'
    ) {
      setShowScheduleScreen(true);
      return;
    }

    Alert.alert(
      featureName,
      `You selected ${featureName}.`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleRequestCreated = () => {
    queryClient.invalidateQueries({ queryKey: ELDERLY_HOME_KEYS.requests });
    queryClient.invalidateQueries({ queryKey: ELDERLY_HOME_KEYS.upcomingVisits });
  };

  const onRefresh = async () => {
    if (refreshProfile) {
      await refreshProfile();
    }
    await refreshAll();
  };

  return {
    activities: activitiesQuery.data || [],
    activeRequests: requestsQuery.data || [],
    upcomingVisits: upcomingVisitsQuery.data || [],
    isLoading: activitiesQuery.isLoading || requestsQuery.isLoading || upcomingVisitsQuery.isLoading,
    isRefreshing: activitiesQuery.isRefetching || requestsQuery.isRefetching || upcomingVisitsQuery.isRefetching,
    refreshing: activitiesQuery.isRefetching || requestsQuery.isRefetching || upcomingVisitsQuery.isRefetching,
    error: activitiesQuery.error?.message || requestsQuery.error?.message || upcomingVisitsQuery.error?.message || null,
    fetchError: activitiesQuery.error?.message || requestsQuery.error?.message || upcomingVisitsQuery.error?.message || null,
    refreshAll,
    onRefresh,
    user,
    firstName,
    greeting: getGreeting(),
    selectedVisit,
    setSelectedVisit,
    showProfileScreen,
    setShowProfileScreen,
    showCreateScreen,
    setShowCreateScreen,
    showScheduleScreen,
    setShowScheduleScreen,
    handleRequestCreated,
    formatScheduleDate,
    renderActivityIcon,
    handleActionPress,
    refreshProfile,
  };
};


