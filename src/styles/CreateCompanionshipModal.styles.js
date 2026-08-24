// src/styles/CreateCompanionshipModal.styles.js
import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../constants/theme';

export const getCreateCompanionshipStyles = (scale = 1.0) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      maxHeight: '92%',
      paddingTop: 16,
      paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 22,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
    },
    stepMainTitle: {
      fontSize: Math.round(19 * scale),
      fontWeight: '900',
      color: '#000000',
      letterSpacing: -0.2,
    },
    closeBtn: {
      padding: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      paddingHorizontal: 22,
      paddingTop: 14,
      paddingBottom: 24,
    },

    // Step Sections
    stepSection: {
      marginBottom: Math.round(20 * scale),
    },
    stepTitle: {
      fontSize: Math.round(18 * scale),
      fontWeight: '900',
      color: '#000000',
      marginBottom: Math.round(12 * scale),
      letterSpacing: -0.2,
    },

    // Step 1: Activity Cards Grid
    activityGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Math.round(12 * scale),
      justifyContent: 'flex-start',
    },
    activityCard: {
      width: '22%',
      aspectRatio: 0.95,
      backgroundColor: '#E2E8F0',
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 6,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    activityCardSelected: {
      backgroundColor: '#EFF6FF',
      borderColor: COLORS.primary,
      transform: [{ scale: 1.03 }],
    },
    activityIconContainer: {
      height: Math.round(38 * scale),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
    },
    activityName: {
      fontSize: Math.round(11 * scale),
      fontWeight: '900',
      color: '#000000',
      textAlign: 'center',
      letterSpacing: 0.2,
      textTransform: 'uppercase',
    },
    activityNameSelected: {
      color: COLORS.primary,
    },

    // Step 2: Date & Time
    dateRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: Math.round(16 * scale),
    },
    datePill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#CBD5E1',
      paddingVertical: Math.round(10 * scale),
      paddingHorizontal: 12,
      borderRadius: 20,
      gap: 6,
    },
    datePillSelected: {
      backgroundColor: COLORS.primary,
    },
    datePillText: {
      fontSize: Math.round(14 * scale),
      fontWeight: '800',
      color: '#1E293B',
    },
    datePillTextSelected: {
      color: '#FFFFFF',
    },

    // Time Slots Container
    timeColumnsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: Math.round(12 * scale),
    },
    timeColumn: {
      flex: 1,
    },
    timeColumnLabel: {
      fontSize: Math.round(15 * scale),
      fontWeight: '800',
      color: '#000000',
      textAlign: 'center',
      marginBottom: 8,
    },
    timeOptionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#CBD5E1',
      borderRadius: 8,
      paddingVertical: Math.round(12 * scale),
      paddingHorizontal: 8,
      marginBottom: 10,
      gap: 8,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    timeOptionCardSelected: {
      backgroundColor: '#EFF6FF',
      borderColor: COLORS.primary,
    },
    timeCheckbox: {
      width: Math.round(20 * scale),
      height: Math.round(20 * scale),
      borderRadius: 4,
      backgroundColor: '#FFFFFF',
      borderWidth: 1.5,
      borderColor: '#94A3B8',
      justifyContent: 'center',
      alignItems: 'center',
    },
    timeCheckboxSelected: {
      backgroundColor: '#000000',
      borderColor: '#000000',
    },
    timeText: {
      fontSize: Math.round(14 * scale),
      fontWeight: '800',
      color: '#000000',
    },
    timeTextSelected: {
      color: COLORS.primary,
    },

    // Set Time Button
    setTimeCenterWrap: {
      alignItems: 'center',
      marginTop: 2,
      marginBottom: Math.round(14 * scale),
    },
    setTimePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#CBD5E1',
      paddingVertical: Math.round(8 * scale),
      paddingHorizontal: Math.round(20 * scale),
      borderRadius: 20,
      gap: 6,
    },
    setTimePillText: {
      fontSize: Math.round(13 * scale),
      fontWeight: '800',
      color: '#1E293B',
    },

    dividerLine: {
      height: 1.5,
      backgroundColor: '#000000',
      marginVertical: Math.round(14 * scale),
    },

    // Step 3: Communication Method
    commMethodsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      marginVertical: Math.round(8 * scale),
    },
    commCircleBtn: {
      width: Math.round(64 * scale),
      height: Math.round(64 * scale),
      borderRadius: Math.round(32 * scale),
      backgroundColor: '#CBD5E1',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2.5,
      borderColor: 'transparent',
    },
    commCircleBtnSelected: {
      backgroundColor: '#EFF6FF',
      borderColor: COLORS.primary,
      transform: [{ scale: 1.05 }],
    },

    // Sticky Bottom Action
    bottomBar: {
      paddingHorizontal: 22,
      paddingTop: 12,
      backgroundColor: '#D1D5DB',
      borderTopWidth: 1,
      borderTopColor: '#E2E8F0',
    },
    confirmBtn: {
      backgroundColor: '#4B5563',
      paddingVertical: Math.round(15 * scale),
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    confirmBtnText: {
      color: '#FFFFFF',
      fontSize: Math.round(17 * scale),
      fontWeight: '800',
      letterSpacing: 0.3,
    },
  });
