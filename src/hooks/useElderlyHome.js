// src/hooks/useElderlyHome.js
import React, { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import * as companionshipService from '../services/companionshipService';
import { COLORS } from '../constants/theme';

export function useElderlyHome() {
  const { user, refreshProfile } = useAuth();

  // Schedules / Upcoming visits loaded from companionshipService
  const [upcomingVisits, setUpcomingVisits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Visit details modal & Profile screen state
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showProfileScreen, setShowProfileScreen] = useState(false);

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

  // Fetch upcoming visits
  const fetchUpcomingVisits = useCallback(async () => {
    setFetchError(null);
    try {
      const response = await companionshipService.getUpcomingVisits();
      if (response?.success && Array.isArray(response.data)) {
        setUpcomingVisits(response.data);
      } else {
        setUpcomingVisits([]);
      }
    } catch (error) {
      console.log('Error fetching upcoming visits:', error.message);
      setFetchError('Unable to load visits from database. Pull down to refresh.');
      setUpcomingVisits([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
    fetchUpcomingVisits();
  }, [refreshProfile, fetchUpcomingVisits]);

  const onRefresh = () => {
    setRefreshing(true);
    refreshProfile();
    fetchUpcomingVisits();
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
      case 'shopping':
        return <MaterialCommunityIcons name="cart-outline" size={26} color={COLORS.secondary} />;
      case 'medical':
      case 'doctor':
        return <MaterialCommunityIcons name="medical-bag" size={26} color={COLORS.danger} />;
      case 'reading':
      case 'book':
        return <Ionicons name="book-outline" size={24} color={COLORS.secondary} />;
      default:
        return <MaterialCommunityIcons name="account-heart-outline" size={26} color={COLORS.secondary} />;
    }
  };

  // Generic handler for future form pages
  const handleActionPress = (featureName) => {
    Alert.alert(
      featureName,
      `You selected ${featureName}. This feature form will open in the next phase.`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  return {
    user,
    firstName,
    greeting: getGreeting(),
    upcomingVisits,
    isLoading,
    refreshing,
    fetchError,
    onRefresh,
    selectedVisit,
    setSelectedVisit,
    showProfileScreen,
    setShowProfileScreen,
    formatScheduleDate,
    renderActivityIcon,
    handleActionPress,
    refreshProfile,
  };
}
