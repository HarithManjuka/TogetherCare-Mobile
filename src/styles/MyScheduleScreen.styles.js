// src/styles/MyScheduleScreen.styles.js
import { StyleSheet, Platform, StatusBar } from 'react-native';
import { COLORS } from '../constants/theme';

export const getMyScheduleScreenStyles = (scale = 1.0) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#1A365D',
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    container: {
      flex: 1,
      backgroundColor: '#F8FAFC',
    },

    // WhatsApp-Style Top App Header
    headerBar: {
      backgroundColor: '#1A365D',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    backButton: {
      padding: 6,
      borderRadius: 20,
    },
    headerTitle: {
      fontSize: Math.round(20 * scale),
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.2,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    headerActionBtn: {
      padding: 8,
      borderRadius: 20,
    },

    // WhatsApp-Style Tabs Bar
    tabsBar: {
      backgroundColor: '#1A365D',
      flexDirection: 'row',
      justifyContent: 'space-around',
      borderBottomWidth: 1,
      borderBottomColor: '#2A4365',
    },
    tabItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      position: 'relative',
      gap: 5,
    },
    tabText: {
      fontSize: Math.round(12 * scale),
      fontWeight: '800',
      color: '#94A3B8',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    tabTextActive: {
      color: '#FFFFFF',
      fontWeight: '900',
    },
    tabBadge: {
      backgroundColor: '#38BDF8',
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 1,
      minWidth: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabBadgeText: {
      fontSize: Math.round(10 * scale),
      fontWeight: '900',
      color: '#0F172A',
    },
    tabActiveIndicator: {
      position: 'absolute',
      bottom: 0,
      left: 8,
      right: 8,
      height: 3.5,
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 3,
      borderTopRightRadius: 3,
    },

    // List Content Container
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 40,
    },

    // Schedule Cards
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 18,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      ...Platform.select({
        ios: {
          shadowColor: '#1A365D',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    cardActivityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    activityIconBox: {
      width: Math.round(44 * scale),
      height: Math.round(44 * scale),
      borderRadius: Math.round(22 * scale),
      backgroundColor: '#EEF2FF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#C7D2FE',
    },
    activityTitleWrap: {
      flex: 1,
    },
    activityTitle: {
      fontSize: Math.round(17 * scale),
      fontWeight: '800',
      color: '#0F172A',
      letterSpacing: -0.2,
    },
    companionSubtitle: {
      fontSize: Math.round(13 * scale),
      color: '#64748B',
      marginTop: 2,
      fontWeight: '600',
    },

    // Status Badges
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusPending: {
      backgroundColor: '#FEF3C7',
    },
    statusPendingText: {
      color: '#B45309',
      fontSize: Math.round(11 * scale),
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    statusAccepted: {
      backgroundColor: '#DCFCE7',
    },
    statusAcceptedText: {
      color: '#15803D',
      fontSize: Math.round(11 * scale),
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    statusOngoing: {
      backgroundColor: '#DBEAFE',
    },
    statusOngoingText: {
      color: '#1D4ED8',
      fontSize: Math.round(11 * scale),
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    statusCompleted: {
      backgroundColor: '#F1F5F9',
    },
    statusCompletedText: {
      color: '#475569',
      fontSize: Math.round(11 * scale),
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    statusCancelled: {
      backgroundColor: '#FEE2E2',
    },
    statusCancelledText: {
      color: '#B91C1C',
      fontSize: Math.round(11 * scale),
      fontWeight: '800',
      textTransform: 'uppercase',
    },

    // Card Details Row
    cardDetailsBox: {
      backgroundColor: '#F8FAFC',
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      gap: 6,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    detailText: {
      fontSize: Math.round(14 * scale),
      color: '#1E293B',
      fontWeight: '700',
    },

    // Comm Method Badge
    commBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      marginTop: 2,
    },
    commBadgeText: {
      fontSize: Math.round(12 * scale),
      color: '#334155',
      fontWeight: '700',
      textTransform: 'capitalize',
    },

    // Card Actions
    cardActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: '#F1F5F9',
      gap: 8,
    },
    actionButtonsGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    detailsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: '#EEF2FF',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#C7D2FE',
    },
    detailsBtnText: {
      fontSize: Math.round(12 * scale),
      fontWeight: '800',
      color: '#1A365D',
    },
    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: '#F0F9FF',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#BAE6FD',
    },
    editBtnText: {
      fontSize: Math.round(12 * scale),
      fontWeight: '800',
      color: '#0284C7',
    },
    deleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: '#FEF2F2',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#FECACA',
    },
    deleteBtnText: {
      fontSize: Math.round(12 * scale),
      fontWeight: '800',
      color: '#DC2626',
    },
    cancelBtn: {
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: '#FEF2F2',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#FECACA',
    },
    cancelBtnText: {
      fontSize: Math.round(12 * scale),
      fontWeight: '800',
      color: '#DC2626',
    },

    // Empty State
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 30,
    },
    emptyIconCircle: {
      width: Math.round(80 * scale),
      height: Math.round(80 * scale),
      borderRadius: Math.round(40 * scale),
      backgroundColor: '#EEF2FF',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#C7D2FE',
    },
    emptyTitle: {
      fontSize: Math.round(18 * scale),
      fontWeight: '800',
      color: '#1A365D',
      marginBottom: 6,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: Math.round(14 * scale),
      color: '#64748B',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    emptyActionBtn: {
      backgroundColor: '#1A365D',
      paddingVertical: 12,
      paddingHorizontal: 22,
      borderRadius: 14,
      shadowColor: '#1A365D',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 3,
    },
    emptyActionBtnText: {
      color: '#FFFFFF',
      fontSize: Math.round(14 * scale),
      fontWeight: '800',
    },

    // Modal Details Sheet
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 22,
      paddingTop: 20,
      paddingBottom: Platform.OS === 'ios' ? 34 : 24,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
      paddingBottom: 12,
    },
    modalTitle: {
      fontSize: Math.round(19 * scale),
      fontWeight: '900',
      color: '#1A365D',
    },
    modalCloseBtn: {
      padding: 4,
    },
    modalRow: {
      marginBottom: 12,
    },
    modalLabel: {
      fontSize: Math.round(12 * scale),
      fontWeight: '800',
      color: '#64748B',
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    modalValue: {
      fontSize: Math.round(15 * scale),
      fontWeight: '700',
      color: '#0F172A',
    },
    modalNotesBox: {
      backgroundColor: '#F8FAFC',
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      marginTop: 4,
    },
  });
