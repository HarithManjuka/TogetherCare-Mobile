// src/styles/CreateCompanionshipScreen.styles.js
import { StyleSheet, Platform, StatusBar } from 'react-native';
import { COLORS } from '../constants/theme';

export const getCreateCompanionshipScreenStyles = (scale = 1.0) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
    },
    topTitleWrap: {
      flex: 1,
      alignItems: 'center',
    },
    topBarTitle: {
      fontSize: Math.round(18 * scale),
      fontWeight: '800',
      color: '#0F172A',
      letterSpacing: -0.2,
    },
    circleButton: {
      width: Math.round(40 * scale),
      height: Math.round(40 * scale),
      borderRadius: Math.round(20 * scale),
      borderWidth: 1.5,
      borderColor: '#E2E8F0',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F8FAFC',
    },
    closeButton: {
      width: Math.round(40 * scale),
      height: Math.round(40 * scale),
      borderRadius: Math.round(20 * scale),
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F1F5F9',
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 40,
    },

    // Step Sections
    stepSection: {
      marginBottom: Math.round(24 * scale),
    },
    stepTitle: {
      fontSize: Math.round(17 * scale),
      fontWeight: '800',
      color: '#1A365D',
      marginBottom: Math.round(14 * scale),
      letterSpacing: -0.2,
    },

    // Step 1: Activity Cards Grid
    activityGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Math.round(10 * scale),
      justifyContent: 'space-between',
    },
    activityCard: {
      width: '23%',
      aspectRatio: 0.95,
      backgroundColor: '#F8FAFC',
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 6,
      borderWidth: 1.5,
      borderColor: '#E2E8F0',
      ...Platform.select({
        ios: {
          shadowColor: '#1A365D',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 3,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    activityCardSelected: {
      backgroundColor: '#EEF2FF',
      borderColor: '#1A365D',
      borderWidth: 2,
      transform: [{ scale: 1.02 }],
    },
    activityIconContainer: {
      height: Math.round(36 * scale),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    activityName: {
      fontSize: Math.round(11 * scale),
      fontWeight: '800',
      color: '#0F172A',
      textAlign: 'center',
      letterSpacing: 0.2,
      textTransform: 'uppercase',
    },
    activityNameSelected: {
      color: '#1A365D',
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
      backgroundColor: '#F8FAFC',
      paddingVertical: Math.round(11 * scale),
      paddingHorizontal: 10,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: '#E2E8F0',
      gap: 6,
    },
    datePillSelected: {
      backgroundColor: '#1A365D',
      borderColor: '#1A365D',
    },
    datePillText: {
      fontSize: Math.round(14 * scale),
      fontWeight: '700',
      color: '#0F172A',
    },
    datePillTextSelected: {
      color: '#FFFFFF',
      fontWeight: '800',
    },

    // Time Slots Container
    timeColumnsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 14,
      marginBottom: Math.round(12 * scale),
    },
    timeColumn: {
      flex: 1,
    },
    timeColumnLabel: {
      fontSize: Math.round(14 * scale),
      fontWeight: '800',
      color: '#475569',
      textAlign: 'center',
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    timeOptionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F8FAFC',
      borderRadius: 12,
      paddingVertical: Math.round(12 * scale),
      paddingHorizontal: 8,
      marginBottom: 10,
      gap: 8,
      borderWidth: 1.5,
      borderColor: '#E2E8F0',
    },
    timeOptionCardSelected: {
      backgroundColor: '#EEF2FF',
      borderColor: '#1A365D',
      borderWidth: 2,
    },
    timeOptionCardDisabled: {
      opacity: 0.35,
      backgroundColor: '#F1F5F9',
    },
    timeCheckbox: {
      width: Math.round(20 * scale),
      height: Math.round(20 * scale),
      borderRadius: 6,
      backgroundColor: '#FFFFFF',
      borderWidth: 1.5,
      borderColor: '#CBD5E1',
      justifyContent: 'center',
      alignItems: 'center',
    },
    timeCheckboxSelected: {
      backgroundColor: '#1A365D',
      borderColor: '#1A365D',
    },
    timeText: {
      fontSize: Math.round(14 * scale),
      fontWeight: '700',
      color: '#0F172A',
    },
    timeTextSelected: {
      color: '#1A365D',
      fontWeight: '800',
    },

    // Set Time Button
    setTimeCenterWrap: {
      alignItems: 'center',
      marginTop: 4,
      marginBottom: Math.round(10 * scale),
    },
    setTimePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#EEF2FF',
      paddingVertical: Math.round(10 * scale),
      paddingHorizontal: Math.round(20 * scale),
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: '#C7D2FE',
      gap: 6,
    },
    setTimePillText: {
      fontSize: Math.round(13 * scale),
      fontWeight: '800',
      color: '#1A365D',
    },

    dividerLine: {
      height: 1,
      backgroundColor: '#E2E8F0',
      marginVertical: Math.round(16 * scale),
    },

    // Step 3: Communication Method
    commMethodsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      marginVertical: Math.round(10 * scale),
    },
    commCircleBtn: {
      width: Math.round(62 * scale),
      height: Math.round(62 * scale),
      borderRadius: Math.round(31 * scale),
      backgroundColor: '#F8FAFC',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#E2E8F0',
      ...Platform.select({
        ios: {
          shadowColor: '#1A365D',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    commCircleBtnSelected: {
      backgroundColor: '#EEF2FF',
      borderColor: '#1A365D',
      borderWidth: 2.5,
      transform: [{ scale: 1.05 }],
    },

    // Sticky Bottom Action Bar
    bottomBar: {
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: Platform.OS === 'ios' ? 26 : 16,
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#E2E8F0',
    },
    confirmBtn: {
      backgroundColor: '#1A365D',
      paddingVertical: Math.round(16 * scale),
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#1A365D',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    confirmBtnText: {
      color: '#FFFFFF',
      fontSize: Math.round(17 * scale),
      fontWeight: '800',
      letterSpacing: 0.3,
    },
  });
