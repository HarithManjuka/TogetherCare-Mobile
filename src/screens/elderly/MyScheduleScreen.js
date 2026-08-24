// src/screens/elderly/MyScheduleScreen.js
import React, { useMemo } from 'react';
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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMySchedule } from '../../hooks/useMySchedule';
import { useTheme } from '../../context/ThemeContext';
import CreateCompanionshipScreen from './CreateCompanionshipScreen';
import { getMyScheduleScreenStyles } from '../../styles/MyScheduleScreen.styles';

const TABS = [
  { key: 'requested', label: 'Requested' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'completed', label: 'Completed' },
];

export default function MyScheduleScreen({ onBack, onRequestNew }) {
  const { scale } = useTheme();
  const styles = useMemo(() => getMyScheduleScreenStyles(scale), [scale]);

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

  // Helper for status badge styling
  const renderStatusBadge = (status) => {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'pending':
        return (
          <View style={[styles.statusBadge, styles.statusPending]}>
            <Text style={styles.statusPendingText}>Awaiting Volunteer</Text>
          </View>
        );
      case 'accepted':
      case 'scheduled':
        return (
          <View style={[styles.statusBadge, styles.statusAccepted]}>
            <Text style={styles.statusAcceptedText}>Accepted</Text>
          </View>
        );
      case 'ongoing':
      case 'in_progress':
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
      default:
        return (
          <View style={[styles.statusBadge, styles.statusPending]}>
            <Text style={styles.statusPendingText}>{status}</Text>
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
      <View style={styles.tabsBar}>
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
      </View>

      {/* Tab Body Content */}
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

                  {renderStatusBadge(item.status)}
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
                        Communicate via {item.communicationMethod.replace('_', ' ')}
                      </Text>
                    </View>
                  )}
                </View>

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

                  {item.status === 'pending' && (
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
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

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
                    {selectedSchedule.communicationMethod || 'In-person'}
                  </Text>
                </View>

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
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
