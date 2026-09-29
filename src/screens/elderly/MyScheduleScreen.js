// src/screens/elderly/MyScheduleScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMySchedule } from '../../hooks/useMySchedule';
import { useTheme } from '../../context/ThemeContext';
import CreateCompanionshipScreen from './CreateCompanionshipScreen';
import { getMyScheduleScreenStyles } from '../../styles/MyScheduleScreen.styles';
import { getVisitLiveStatus, getVisitTimeWindow } from '../../utils/scheduleTimeHelper';

const TABS = [
  { key: 'requested', label: 'Requested' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'completed', label: 'Completed' },
];

export default function MyScheduleScreen({ onBack, onRequestNew, onStartChat }) {
  const { scale } = useTheme();
  const styles = useMemo(() => getMyScheduleScreenStyles(scale), [scale]);

  const [commSwitcherSchedule, setCommSwitcherSchedule] = useState(null);
  const [videoCallTarget, setVideoCallTarget] = useState(null);
  const [videoMuted, setVideoMuted] = useState(false);
  const [videoCamOff, setVideoCamOff] = useState(false);
  const [videoCallSeconds, setVideoCallSeconds] = useState(0);

  // Video call duration timer
  useEffect(() => {
    let interval = null;
    if (videoCallTarget) {
      setVideoCallSeconds(0);
      interval = setInterval(() => {
        setVideoCallSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setVideoCallSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [videoCallTarget]);

  const formatCallTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const {
    activeTab,
    setActiveTab,
    currentList,
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
    handleStartVisit,
    handleCompleteVisit,
    handleCancelRequest,
    handleDeleteRequest,
    counts,
  } = useMySchedule();

  // If user is editing a pending request, render CreateCompanionshipScreen with editingRequest
  if (editingRequest) {
    return (
      <CreateCompanionshipScreen
        editingRequest={editingRequest}
        onBack={() => setEditingRequest(null)}
        onClose={() => setEditingRequest(null)}
        onSuccess={() => {
          setEditingRequest(null);
          onRefresh();
        }}
      />
    );
  }

  const COMMUNICATION_OPTIONS = [
    {
      key: 'call',
      label: 'Phone Call',
      description: 'Call volunteer directly via mobile',
      icon: 'call',
      iconFamily: 'ionicons',
      color: '#0284C7',
      actionName: 'Call Volunteer',
    },
    {
      key: 'chat',
      label: 'In-App Chat',
      description: 'Send messages in TogetherCare chat',
      icon: 'chatbubbles',
      iconFamily: 'ionicons',
      color: '#10B981',
      actionName: 'Chat with Volunteer',
    },
    {
      key: 'video',
      label: 'Video Call',
      description: 'Face-to-face video interaction',
      icon: 'videocam',
      iconFamily: 'ionicons',
      color: '#8B5CF6',
      actionName: 'Start Video Call',
    },
    {
      key: 'in_person',
      label: 'In-Person / Location',
      description: 'Meet volunteer at designated address',
      icon: 'location',
      iconFamily: 'ionicons',
      color: '#F59E0B',
      actionName: 'View Meeting Location',
    },
  ];

  const getCommMethodDetails = (methodRaw) => {
    const norm = (methodRaw || 'in_person').toLowerCase().trim();
    if (norm.includes('call') || norm.includes('phone') || norm.includes('voice')) {
      return COMMUNICATION_OPTIONS[0]; // Phone Call
    }
    if (norm.includes('chat') || norm.includes('message') || norm.includes('sms')) {
      return COMMUNICATION_OPTIONS[1]; // Chat
    }
    if (norm.includes('video')) {
      return COMMUNICATION_OPTIONS[2]; // Video Call
    }
    return COMMUNICATION_OPTIONS[3]; // In-Person
  };

  const handleDirectCommunicate = (scheduleItem, overrideMethod) => {
    if (!scheduleItem) return;
    const volunteer = scheduleItem.volunteer;
    const volunteerName = volunteer
      ? `${volunteer.firstName || ''} ${volunteer.lastName || ''}`.trim()
      : scheduleItem.companionName || 'Volunteer';

    const methodKey = overrideMethod || scheduleItem.communicationMethod || 'in_person';
    const methodDetails = getCommMethodDetails(methodKey);

    switch (methodDetails.key) {
      case 'call': {
        const phone = volunteer?.phone;
        if (phone) {
          const cleanPhone = phone.replace(/[^0-9+]/g, '');
          Linking.openURL(`tel:${cleanPhone}`).catch(() => {
            Alert.alert('Unable to Call', `Could not open dialer for ${phone}`);
          });
        } else {
          Alert.alert(
            'Phone Not Available',
            `${volunteerName} does not have a public phone number registered. You can use In-App Chat to message them.`
          );
        }
        break;
      }

      case 'chat': {
        if (volunteer && onStartChat) {
          const chatUserObj = {
            _id: volunteer._id || volunteer.id,
            id: volunteer._id || volunteer.id,
            firstName: volunteer.firstName || volunteerName,
            lastName: volunteer.lastName || '',
            name: volunteerName,
            email: volunteer.email,
            phone: volunteer.phone,
            role: 'volunteer',
          };
          onStartChat(chatUserObj);
        } else if (volunteer?.phone) {
          const cleanPhone = volunteer.phone.replace(/[^0-9+]/g, '');
          Linking.openURL(`sms:${cleanPhone}`).catch(() => {
            Alert.alert('Notice', `Unable to launch SMS messaging for ${volunteerName}.`);
          });
        } else {
          Alert.alert('Notice', `Messaging with ${volunteerName} will be available once the visit starts.`);
        }
        break;
      }

      case 'video': {
        setVideoCallTarget({
          name: volunteerName,
          phone: volunteer?.phone || '',
          activity: scheduleItem.activityType,
        });
        break;
      }

      case 'in_person':
      default: {
        const locationQuery = scheduleItem.location || 'Home Address';
        Alert.alert(
          'In-Person Visit',
          `Meeting with ${volunteerName} in person.\n\nLocation: ${locationQuery}\nScheduled Time: ${scheduleItem.timeSlot || 'Scheduled time'}`
        );
        break;
      }
    }
  };

  // Helper for status badge styling
  const renderStatusBadge = (item) => {
    const liveStatus = typeof item === 'object' ? getVisitLiveStatus(item) : (item || 'pending').toLowerCase();
    switch (liveStatus) {
      case 'pending':
        return (
          <View style={[styles.statusBadge, styles.statusPending]}>
            <Text style={styles.statusPendingText}>Awaiting Volunteer</Text>
          </View>
        );
      case 'accepted':
      case 'scheduled':
      case 'upcoming':
        return (
          <View style={[styles.statusBadge, styles.statusAccepted]}>
            <Text style={styles.statusAcceptedText}>Upcoming</Text>
          </View>
        );
      case 'ongoing':
      case 'in_progress':
      case 'arrived':
        return (
          <View style={[styles.statusBadge, styles.statusOngoing]}>
            <Text style={styles.statusOngoingText}>In Progress</Text>
          </View>
        );
      case 'completed':
        return (
          <View style={[styles.statusBadge, styles.statusCompleted]}>
            <Text style={styles.statusCompletedText}>Completed</Text>
          </View>
        );
      case 'cancelled':
        return (
          <View style={[styles.statusBadge, styles.statusCancelled]}>
            <Text style={styles.statusCancelledText}>Cancelled</Text>
          </View>
        );
      case 'expired':
      case 'outdated':
        return (
          <View style={[styles.statusBadge, styles.statusExpired]}>
            <Text style={styles.statusExpiredText}>Expired</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.statusBadge, styles.statusPending]}>
            <Text style={styles.statusPendingText}>{liveStatus}</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1A365D" />

      {/* WhatsApp-Style Top Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={Math.round(24 * scale)} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Care Schedule</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={onRefresh}
            activeOpacity={0.7}
            accessibilityLabel="Refresh"
          >
            <Ionicons name="refresh" size={Math.round(22 * scale)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* WhatsApp-Style Navigation Tabs Bar */}
      <View style={styles.tabsBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsBarScrollContent}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const badgeCount = counts[tab.key] || 0;

            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabItem}
                activeOpacity={0.8}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>

                {badgeCount > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{badgeCount}</Text>
                  </View>
                )}

                {/* Active Tab Underline Indicator */}
                {isActive && <View style={styles.tabActiveIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tab Body Content with clean light background */}
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1A365D']}
              tintColor="#1A365D"
            />
          }
        >
        {isLoading ? (
          <View style={{ paddingVertical: 50, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#1A365D" />
            <Text style={{ marginTop: 12, fontSize: 14, color: '#64748B', fontWeight: '700' }}>
              Loading your schedule...
            </Text>
          </View>
        ) : currentList.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name={
                  activeTab === 'requested'
                    ? 'paper-plane-outline'
                    : activeTab === 'upcoming'
                    ? 'calendar-outline'
                    : activeTab === 'ongoing'
                    ? 'time-outline'
                    : 'checkmark-circle-outline'
                }
                size={Math.round(38 * scale)}
                color="#1A365D"
              />
            </View>

            <Text style={styles.emptyTitle}>
              {activeTab === 'requested'
                ? 'No Pending Requests'
                : activeTab === 'upcoming'
                ? 'No Upcoming Visits'
                : activeTab === 'ongoing'
                ? 'No Ongoing Visits Right Now'
                : 'No Completed Visits Yet'}
            </Text>

            <Text style={styles.emptySubtitle}>
              {activeTab === 'requested'
                ? 'When you request companionship, pending requests will be listed here.'
                : activeTab === 'upcoming'
                ? 'Visits accepted by volunteers will appear here ready for you.'
                : activeTab === 'ongoing'
                ? 'Visits in progress today will appear here.'
                : 'Your past completed companionship visits will be kept here.'}
            </Text>

            {onRequestNew && (
              <TouchableOpacity
                style={styles.emptyActionBtn}
                activeOpacity={0.85}
                onPress={onRequestNew}
              >
                <Text style={styles.emptyActionBtnText}>+ Request Companionship</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          /* List of Cards */
          currentList.map((item) => {
            const dateInfo = formatScheduleDate(item.scheduledDate, item.timeSlot);
            const volunteerName = item.volunteer
              ? `${item.volunteer.firstName || ''} ${item.volunteer.lastName || ''}`.trim()
              : item.companionName || 'Awaiting Volunteer';
            const liveStatus = getVisitLiveStatus(item);
            const timeWindow = getVisitTimeWindow(item);
            const canStart = timeWindow.isEarlyStartAllowed;
            const commDetails = getCommMethodDetails(item.communicationMethod);
            const hasVolunteer = !!item.volunteer;
            const showCommActions = hasVolunteer && (liveStatus === 'upcoming' || liveStatus === 'accepted' || liveStatus === 'scheduled' || liveStatus === 'ongoing' || liveStatus === 'in_progress' || liveStatus === 'arrived');

            return (
              <View key={item._id} style={styles.card}>
                {/* Header: Activity + Status */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardActivityRow}>
                    <View style={styles.activityIconBox}>
                      {renderActivityIcon(item.activityType, Math.round(22 * scale))}
                    </View>
                    <View style={styles.activityTitleWrap}>
                      <Text style={styles.activityTitle}>{item.activityType}</Text>
                      <Text style={styles.companionSubtitle}>
                        {item.volunteer ? `Volunteer: ${volunteerName}` : 'Status: Awaiting volunteer'}
                      </Text>
                    </View>
                  </View>

                  {renderStatusBadge(item)}
                </View>

                {/* Details Box: Date, Time & Comm Method */}
                <View style={styles.cardDetailsBox}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color="#1A365D" />
                    <Text style={styles.detailText}>{dateInfo.date}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color="#1A365D" />
                    <Text style={styles.detailText}>{dateInfo.time}</Text>
                  </View>

                  {item.communicationMethod && (
                    <View style={styles.commBadge}>
                      {renderCommIcon(item.communicationMethod, 14)}
                      <Text style={styles.commBadgeText}>
                        Preferred: {commDetails.label}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Communication Action Strip (for Ongoing and Upcoming visits with Volunteer) */}
                {showCommActions && (
                  <View style={styles.commActionStrip}>
                    <TouchableOpacity
                      style={[styles.primaryCommBtn, { backgroundColor: commDetails.color }]}
                      activeOpacity={0.8}
                      onPress={() => handleDirectCommunicate(item)}
                    >
                      <Ionicons name={commDetails.icon} size={16} color="#FFFFFF" />
                      <Text style={styles.primaryCommBtnText}>{commDetails.actionName}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.switchMethodBtn}
                      activeOpacity={0.8}
                      onPress={() => setCommSwitcherSchedule(item)}
                    >
                      <Ionicons name="swap-horizontal" size={14} color="#334155" />
                      <Text style={styles.switchMethodBtnText}>Switch</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Footer Action Buttons */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.detailsBtn}
                    activeOpacity={0.8}
                    onPress={() => setSelectedSchedule(item)}
                  >
                    <Ionicons name="information-circle-outline" size={16} color="#1A365D" />
                    <Text style={styles.detailsBtnText}>Details</Text>
                  </TouchableOpacity>

                  {liveStatus === 'pending' && (
                    <View style={styles.actionButtonsGroup}>
                      <TouchableOpacity
                        style={styles.editBtn}
                        activeOpacity={0.8}
                        onPress={() => setEditingRequest(item)}
                      >
                        <Ionicons name="pencil" size={14} color="#0284C7" />
                        <Text style={styles.editBtnText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteBtn}
                        activeOpacity={0.8}
                        onPress={() => handleDeleteRequest(item)}
                      >
                        <Ionicons name="trash-outline" size={14} color="#DC2626" />
                        <Text style={styles.deleteBtnText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {(liveStatus === 'upcoming' || liveStatus === 'accepted' || liveStatus === 'scheduled') && (
                    <View style={styles.actionButtonsGroup}>
                      <TouchableOpacity
                        style={[
                          styles.startVisitBtn,
                          !canStart && styles.startVisitBtnDisabled,
                        ]}
                        activeOpacity={canStart ? 0.8 : 1}
                        onPress={canStart ? () => handleStartVisit(item) : undefined}
                        disabled={!canStart}
                        pointerEvents={canStart ? 'auto' : 'none'}
                      >
                        <Ionicons name="play" size={14} color={canStart ? "#1D4ED8" : "#94A3B8"} />
                        <Text style={[styles.startVisitBtnText, !canStart && styles.startVisitBtnTextDisabled]}>
                          Start Visit
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.cancelBtn}
                        activeOpacity={0.8}
                        onPress={() => handleCancelRequest(item)}
                      >
                        <Ionicons name="close-circle-outline" size={14} color="#DC2626" />
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {(liveStatus === 'ongoing' || liveStatus === 'in_progress' || liveStatus === 'arrived') && (
                    <View style={styles.actionButtonsGroup}>
                      <TouchableOpacity
                        style={styles.completeVisitBtn}
                        activeOpacity={0.8}
                        onPress={() => handleCompleteVisit(item)}
                      >
                        <Ionicons name="checkmark-circle" size={14} color="#047857" />
                        <Text style={styles.completeVisitBtnText}>Mark Completed</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
        </ScrollView>
      </View>

      {/* Schedule Detail Sheet Modal */}
      <Modal
        visible={!!selectedSchedule}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSchedule(null)}
      >
        <View style={styles.modalBackdrop}>
          {selectedSchedule && (
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Visit Details</Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedSchedule(null)}
                >
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Activity</Text>
                  <Text style={styles.modalValue}>{selectedSchedule.activityType}</Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Scheduled Date & Time</Text>
                  <Text style={styles.modalValue}>
                    {formatScheduleDate(selectedSchedule.scheduledDate, selectedSchedule.timeSlot).fullDate} (
                    {selectedSchedule.timeSlot})
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Status</Text>
                  <Text style={[styles.modalValue, { textTransform: 'capitalize' }]}>
                    {selectedSchedule.status}
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Companion / Volunteer</Text>
                  <Text style={styles.modalValue}>
                    {selectedSchedule.volunteer
                      ? `${selectedSchedule.volunteer.firstName || ''} ${selectedSchedule.volunteer.lastName || ''}`.trim()
                      : selectedSchedule.companionName || 'Awaiting volunteer acceptance'}
                  </Text>
                </View>

                {selectedSchedule.volunteer?.phone ? (
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Volunteer Phone</Text>
                    <Text style={styles.modalValue}>{selectedSchedule.volunteer.phone}</Text>
                  </View>
                ) : null}

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Communication Method</Text>
                  <Text style={[styles.modalValue, { textTransform: 'capitalize' }]}>
                    {getCommMethodDetails(selectedSchedule.communicationMethod).label}
                  </Text>
                </View>

                {/* Quick Direct Communication Bar in Details Modal */}
                {selectedSchedule.volunteer && (selectedSchedule.status === 'accepted' || selectedSchedule.status === 'scheduled' || selectedSchedule.status === 'upcoming' || selectedSchedule.status === 'ongoing' || selectedSchedule.status === 'in_progress' || selectedSchedule.status === 'arrived') && (() => {
                  const detailComm = getCommMethodDetails(selectedSchedule.communicationMethod);
                  return (
                    <View style={{ marginTop: 4, marginBottom: 12 }}>
                      <Text style={[styles.modalLabel, { marginBottom: 8 }]}>Direct Communication</Text>
                      <View style={styles.commActionStrip}>
                        <TouchableOpacity
                          style={[styles.primaryCommBtn, { backgroundColor: detailComm.color }]}
                          activeOpacity={0.8}
                          onPress={() => {
                            const target = selectedSchedule;
                            setSelectedSchedule(null);
                            handleDirectCommunicate(target);
                          }}
                        >
                          <Ionicons name={detailComm.icon} size={16} color="#FFFFFF" />
                          <Text style={styles.primaryCommBtnText}>{detailComm.actionName}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.switchMethodBtn}
                          activeOpacity={0.8}
                          onPress={() => {
                            const target = selectedSchedule;
                            setSelectedSchedule(null);
                            setCommSwitcherSchedule(target);
                          }}
                        >
                          <Ionicons name="swap-horizontal" size={14} color="#334155" />
                          <Text style={styles.switchMethodBtnText}>Switch</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })()}

                {selectedSchedule.notes ? (
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Notes</Text>
                    <View style={styles.modalNotesBox}>
                      <Text style={{ fontSize: 14, color: '#334155' }}>
                        {selectedSchedule.notes}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {/* Modal Edit/Delete Actions for Pending Requests */}
                {selectedSchedule.status === 'pending' && (
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
                    <TouchableOpacity
                      style={[styles.editBtn, { flex: 1, paddingVertical: 12 }]}
                      activeOpacity={0.8}
                      onPress={() => {
                        const target = selectedSchedule;
                        setSelectedSchedule(null);
                        setEditingRequest(target);
                      }}
                    >
                      <Ionicons name="pencil" size={16} color="#0284C7" />
                      <Text style={[styles.editBtnText, { fontSize: 14 }]}>Edit Request</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.deleteBtn, { flex: 1, paddingVertical: 12 }]}
                      activeOpacity={0.8}
                      onPress={() => {
                        const target = selectedSchedule;
                        setSelectedSchedule(null);
                        handleDeleteRequest(target);
                      }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#DC2626" />
                      <Text style={[styles.deleteBtnText, { fontSize: 14 }]}>Delete Request</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Modal Start/Cancel Actions for Upcoming Visits */}
                {(selectedSchedule.status === 'accepted' || selectedSchedule.status === 'scheduled') && (() => {
                  const modalTimeWindow = getVisitTimeWindow(selectedSchedule);
                  const modalCanStart = modalTimeWindow.isEarlyStartAllowed;
                  return (
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
                      <TouchableOpacity
                        style={[
                          styles.startVisitBtn,
                          { flex: 1, paddingVertical: 12 },
                          !modalCanStart && styles.startVisitBtnDisabled,
                        ]}
                        activeOpacity={modalCanStart ? 0.8 : 1}
                        onPress={modalCanStart ? () => {
                          const target = selectedSchedule;
                          handleStartVisit(target);
                        } : undefined}
                        disabled={!modalCanStart}
                        pointerEvents={modalCanStart ? 'auto' : 'none'}
                      >
                        <Ionicons name="play" size={16} color={modalCanStart ? "#1D4ED8" : "#94A3B8"} />
                        <Text style={[styles.startVisitBtnText, { fontSize: 14 }, !modalCanStart && styles.startVisitBtnTextDisabled]}>
                          Start Visit
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.cancelBtn, { flex: 1, paddingVertical: 12 }]}
                        activeOpacity={0.8}
                        onPress={() => {
                          const target = selectedSchedule;
                          handleCancelRequest(target);
                        }}
                      >
                        <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                        <Text style={[styles.cancelBtnText, { fontSize: 14 }]}>Cancel Visit</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })()}

                {/* Modal Complete Action for Ongoing Visits */}
                {(selectedSchedule.status === 'ongoing' || selectedSchedule.status === 'in_progress' || selectedSchedule.status === 'arrived') && (
                  <View style={{ marginTop: 18 }}>
                    <TouchableOpacity
                      style={[styles.completeVisitBtn, { paddingVertical: 14 }]}
                      activeOpacity={0.8}
                      onPress={() => {
                        const target = selectedSchedule;
                        handleCompleteVisit(target);
                      }}
                    >
                      <Ionicons name="checkmark-circle" size={18} color="#047857" style={{ marginRight: 6 }} />
                      <Text style={[styles.completeVisitBtnText, { fontSize: 15 }]}>Mark Visit as Completed</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* Communication Method Switcher Modal */}
      <Modal
        visible={!!commSwitcherSchedule}
        transparent
        animationType="slide"
        onRequestClose={() => setCommSwitcherSchedule(null)}
      >
        <View style={styles.modalBackdrop}>
          {commSwitcherSchedule && (
            <View style={styles.commModalSheet}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Choose Communication Method</Text>
                  <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2, fontWeight: '600' }}>
                    Connect now with{' '}
                    {commSwitcherSchedule.volunteer
                      ? `${commSwitcherSchedule.volunteer.firstName || ''} ${commSwitcherSchedule.volunteer.lastName || ''}`.trim()
                      : 'volunteer'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setCommSwitcherSchedule(null)}
                >
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>
                {COMMUNICATION_OPTIONS.map((option) => {
                  const isCurrent = (commSwitcherSchedule.communicationMethod || 'in_person')
                    .toLowerCase()
                    .includes(option.key);

                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.commOptionItem,
                        isCurrent && styles.commOptionItemActive,
                      ]}
                      activeOpacity={0.75}
                      onPress={() => {
                        const targetSchedule = commSwitcherSchedule;
                        setCommSwitcherSchedule(null);
                        handleDirectCommunicate(targetSchedule, option.key);
                      }}
                    >
                      <View
                        style={[
                          styles.commOptionIconCircle,
                          { backgroundColor: `${option.color}20` },
                        ]}
                      >
                        <Ionicons name={option.icon} size={24} color={option.color} />
                      </View>

                      <View style={styles.commOptionTextWrap}>
                        <Text style={styles.commOptionTitle}>{option.label}</Text>
                        <Text style={styles.commOptionSubtitle}>{option.description}</Text>
                      </View>

                      {isCurrent ? (
                        <View style={styles.commActivePill}>
                          <Text style={styles.commActivePillText}>Default</Text>
                        </View>
                      ) : (
                        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* Video Calling Screen Modal */}
      <Modal
        visible={!!videoCallTarget}
        animationType="slide"
        onRequestClose={() => setVideoCallTarget(null)}
      >
        <SafeAreaView style={styles.videoBackdrop}>
          <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

          {/* Top Info Header */}
          <View style={styles.videoTopHeader}>
            <View style={styles.videoHeaderBadge}>
              <Text style={styles.videoHeaderBadgeText}>
                {videoCallTarget?.activity || 'TogetherCare Live Session'}
              </Text>
            </View>
            <Text style={styles.videoCallStatus}>
              {videoCallSeconds > 0 ? `In call • ${formatCallTimer(videoCallSeconds)}` : 'Connecting...'}
            </Text>
          </View>

          {/* Center Avatar & Name */}
          <View style={styles.videoCenterContent}>
            <View style={styles.videoAvatarOuter}>
              <Ionicons
                name={videoCamOff ? 'videocam-off' : 'person'}
                size={Math.round(58 * scale)}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.videoCallerName}>{videoCallTarget?.name || 'Volunteer'}</Text>
            {videoCallTarget?.phone ? (
              <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600' }}>
                {videoCallTarget.phone}
              </Text>
            ) : null}
          </View>

          {/* Bottom Call Controls */}
          <View style={styles.videoControlsContainer}>
            {/* Audio Mute Button */}
            <TouchableOpacity
              style={[
                styles.videoControlBtn,
                videoMuted && { backgroundColor: '#EF4444' },
              ]}
              activeOpacity={0.8}
              onPress={() => setVideoMuted(!videoMuted)}
            >
              <Ionicons
                name={videoMuted ? 'mic-off' : 'mic'}
                size={26}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            {/* End Call Button */}
            <TouchableOpacity
              style={styles.videoEndBtn}
              activeOpacity={0.8}
              onPress={() => setVideoCallTarget(null)}
            >
              <Ionicons name="call" size={30} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>

            {/* Video Camera Toggle */}
            <TouchableOpacity
              style={[
                styles.videoControlBtn,
                videoCamOff && { backgroundColor: '#EF4444' },
              ]}
              activeOpacity={0.8}
              onPress={() => setVideoCamOff(!videoCamOff)}
            >
              <Ionicons
                name={videoCamOff ? 'videocam-off' : 'videocam'}
                size={26}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
