// src/screens/caregiver/CaregiverDashboard.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import CaregiverDashboardHome from './CaregiverDashboardHome';
import AddDependentScreen from './AddDependentScreen';
import DependentManagementScreen from './DependentManagementScreen';
import UpcomingVisitsScreen from './UpcomingVisitsScreen';
import SeniorActivitiesScreen from './SeniorActivitiesScreen';
import CaregiverAssignmentsScreen from './CaregiverAssignmentsScreen';
import CaregiverChatScreen from './CaregiverChatScreen';
import RequestHelpScreen from './RequestHelpScreen';
import VolunteerSelectionScreen from './VolunteerSelectionScreen';
import VolunteerProfileReviewScreen from './VolunteerProfileReviewScreen';
import LiveTrackingScreen from './LiveTrackingScreen';
import FeedbackScreen from './FeedbackScreen';
import ProfileScreen from '../auth/ProfileScreen';
import AppBottomNav from '../../components/common/AppBottomNav';
import AppHeader from '../../components/common/AppHeader';
import client from '../../api/client';

export default function CaregiverDashboard() {
  const { user } = useAuth();
  const isFamilyMember = user?.caregiverType === 'family_member';

  const [currentScreen, setCurrentScreen] = useState('home');
  const [activeRequestId, setActiveRequestId] = useState(null);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Selected chat partner for CaregiverChatScreen (US-403)
  const [chatPartner, setChatPartner] = useState(null);
  const [chatSenior, setChatSenior] = useState(null);

  // Selected senior for SeniorActivitiesScreen (Sprint 3)
  const [monitoredSenior, setMonitoredSenior] = useState(null);

  // Handle mobile hardware/system Back button navigation
  useEffect(() => {
    const onBackPress = () => {
      if (currentScreen !== 'home') {
        setCurrentScreen('home');
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [currentScreen]);

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

  const handleOpenChat = (partner, senior) => {
    setChatPartner(partner);
    setChatSenior(senior);
    setCurrentScreen('chat');
  };

  const handleMonitorSenior = (senior) => {
    setMonitoredSenior(senior);
    setCurrentScreen('activities');
  };

  const getActiveTab = () => {
    switch (currentScreen) {
      case 'dependents':
      case 'add-dependent':
        return 'dependents';
      case 'assignments':
        return 'assignments';
      case 'upcoming-visits':
      case 'request-help':
      case 'volunteer-selection':
      case 'volunteer-profile':
      case 'live-tracking':
      case 'feedback':
        return 'requests';
      case 'chat':
        return 'messages';
      case 'profile':
        return 'profile';
      case 'home':
      default:
        return 'home';
    }
  };

  const handleSelectTab = (tabKey) => {
    switch (tabKey) {
      case 'dependents':
        setCurrentScreen('dependents');
        break;
      case 'assignments':
        setCurrentScreen('assignments');
        break;
      case 'requests':
        setCurrentScreen('upcoming-visits');
        break;
      case 'messages':
        setCurrentScreen('chat');
        break;
      case 'profile':
        setCurrentScreen('profile');
        break;
      case 'home':
      default:
        setCurrentScreen('home');
        break;
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dependents':
        return (
          <DependentManagementScreen
            onBack={() => setCurrentScreen('home')}
            onAddDependent={() => setCurrentScreen('add-dependent')}
            onRequestHelpForSenior={(senior) => {
              setCurrentScreen('request-help');
            }}
            onMonitorSenior={handleMonitorSenior}
          />
        );
      case 'add-dependent':
        return (
          <AddDependentScreen
            onBack={() => setCurrentScreen('dependents')}
            onSuccess={() => {
              setCurrentScreen('dependents');
              triggerRefresh();
            }}
          />
        );
      case 'upcoming-visits':
        return (
          <UpcomingVisitsScreen
            onBack={() => setCurrentScreen('home')}
            onOpenChat={handleOpenChat}
            onTrackVisit={(reqId) => {
              setActiveRequestId(reqId);
              setCurrentScreen('live-tracking');
            }}
          />
        );
      case 'assignments':
        return (
          <CaregiverAssignmentsScreen
            onBack={() => setCurrentScreen('home')}
            onViewCompletedVisits={() => setCurrentScreen('home')}
          />
        );
      case 'activities':
        return (
          <SeniorActivitiesScreen
            senior={monitoredSenior}
            onBack={() => setCurrentScreen('dependents')}
            onRequestHelp={() => setCurrentScreen('request-help')}
          />
        );
      case 'chat':
        return (
          <CaregiverChatScreen
            otherUser={
              chatPartner || {
                _id: user?.linkedElderlyProfiles?.[0] || user?.linkedCaregiverId || 'general',
                firstName: 'Community',
                lastName: 'Coordinator',
                role: 'caregiver',
                phone: '0771234567',
              }
            }
            relatedSenior={chatSenior}
            onBack={() => setCurrentScreen('home')}
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
              triggerRefresh();
              setCurrentScreen('upcoming-visits');
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
        return <ProfileScreen />;
      case 'home':
      default:
        return (
          <CaregiverDashboardHome
            onAddDependent={() => setCurrentScreen('add-dependent')}
            onRequestHelp={() => setCurrentScreen('request-help')}
            onViewRequest={handleViewRequest}
            onViewProfile={() => setCurrentScreen('profile')}
            onManageDependents={() => setCurrentScreen('dependents')}
            onViewUpcomingVisits={() => setCurrentScreen('upcoming-visits')}
            onViewAssignments={() => setCurrentScreen('assignments')}
            onViewActivities={handleMonitorSenior}
            refreshTrigger={refreshTrigger}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {currentScreen !== 'profile' && (
        <AppHeader
          onProfilePress={() => setCurrentScreen('profile')}
          onNavigateTab={handleSelectTab}
        />
      )}
      <View style={styles.screenArea}>{renderScreen()}</View>
      <AppBottomNav
        role={isFamilyMember ? 'family_member' : 'caregiver'}
        activeTab={getActiveTab()}
        onTabPress={handleSelectTab}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenArea: {
    flex: 1,
  },
});