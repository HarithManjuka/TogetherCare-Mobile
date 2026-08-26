// src/screens/caregiver/CaregiverDashboard.js
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../constants/theme';
import CaregiverDashboardHome from './CaregiverDashboardHome';
import AddDependentScreen from './AddDependentScreen';
import RequestHelpScreen from './RequestHelpScreen';
import VolunteerSelectionScreen from './VolunteerSelectionScreen';
import VolunteerProfileReviewScreen from './VolunteerProfileReviewScreen';
import LiveTrackingScreen from './LiveTrackingScreen';
import FeedbackScreen from './FeedbackScreen';
import ProfileScreen from '../auth/ProfileScreen';
import client from '../../api/client';

export default function CaregiverDashboard() {
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home' | 'add-dependent' | 'request-help' | 'volunteer-selection' | 'volunteer-profile' | 'live-tracking' | 'feedback'
  const [activeRequestId, setActiveRequestId] = useState(null);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  const handleViewRequest = async (requestId) => {
    try {
      const res = await client.get(`/help-requests/${requestId}`);
      if (res.data?.success) {
        const req = res.data.data;
        setActiveRequestId(requestId);

        if (req.status === 'searching' || req.status === 'matched') {
          setCurrentScreen('volunteer-selection');
        } else if (req.status === 'confirmed' || req.status === 'arrived') {
          setCurrentScreen('live-tracking');
        } else if (req.status === 'completed' && req.rating === null) {
          setCurrentScreen('feedback');
        } else {
          triggerRefresh();
        }
      }
    } catch (error) {
      console.error('Navigate to request view error:', error);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'add-dependent':
        return (
          <AddDependentScreen
            onBack={() => setCurrentScreen('home')}
            onSuccess={() => {
              setCurrentScreen('home');
              triggerRefresh();
            }}
          />
        );
      case 'request-help':
        return (
          <RequestHelpScreen
            onBack={() => setCurrentScreen('home')}
            onSubmitSuccess={(request) => {
              setActiveRequestId(request._id);
              if (request.status === 'confirmed') {
                setCurrentScreen('live-tracking');
              } else {
                setCurrentScreen('volunteer-selection');
              }
            }}
          />
        );
      case 'volunteer-selection':
        return (
          <VolunteerSelectionScreen
            requestId={activeRequestId}
            refreshTrigger={refreshTrigger}
            onSelectVolunteer={(volunteerId) => {
              setSelectedVolunteerId(volunteerId);
              setCurrentScreen('volunteer-profile');
            }}
            onCancel={() => {
              setCurrentScreen('home');
              triggerRefresh();
            }}
          />
        );
      case 'volunteer-profile':
        return (
          <VolunteerProfileReviewScreen
            requestId={activeRequestId}
            selectedVolunteerId={selectedVolunteerId}
            onBack={() => {
              triggerRefresh();
              setCurrentScreen('volunteer-selection');
            }}
            onApproveSuccess={() => {
              setCurrentScreen('live-tracking');
            }}
          />
        );
      case 'live-tracking':
        return (
          <LiveTrackingScreen
            requestId={activeRequestId}
            onBack={() => {
              setCurrentScreen('home');
              triggerRefresh();
            }}
            onTripCompleted={() => {
              setCurrentScreen('feedback');
            }}
          />
        );
      case 'feedback':
        return (
          <FeedbackScreen
            requestId={activeRequestId}
            onBack={() => {
              setCurrentScreen('home');
              triggerRefresh();
            }}
            onSubmitSuccess={() => {
              setCurrentScreen('home');
              triggerRefresh();
            }}
          />
        );
      case 'profile':
        return (
          <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            <View style={styles.profileNavHeader}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentScreen('home')}>
                <Icon name="arrow-back" size={20} color="#0F172A" />
                <Text style={styles.backBtnText}>Dashboard</Text>
              </TouchableOpacity>
              <Text style={styles.profileHeaderTitle}>User Profile</Text>
              <View style={{ width: 90 }} />
            </View>
            <ProfileScreen />
          </SafeAreaView>
        );
      case 'home':
      default:
        return (
          <CaregiverDashboardHome
            onAddDependent={() => setCurrentScreen('add-dependent')}
            onRequestHelp={() => setCurrentScreen('request-help')}
            onViewRequest={handleViewRequest}
            onViewProfile={() => setCurrentScreen('profile')}
            refreshTrigger={refreshTrigger}
          />
        );
    }
  };

  return <View style={styles.container}>{renderScreen()}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  profileNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 14 : 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  profileHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
});