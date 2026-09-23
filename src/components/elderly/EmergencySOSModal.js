// src/components/elderly/EmergencySOSModal.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Vibration,
  Animated,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import * as emergencyService from '../../services/emergencyService';

const EMERGENCY_HOTLINES = [
  {
    id: 'ambulance',
    name: '1990 Suwa Seriya',
    subtitle: 'Free 24/7 National Ambulance',
    phone: '1990',
    icon: 'ambulance',
    iconType: 'fa5',
    color: '#DC2626',
    bgColor: '#FEE2E2',
  },
  {
    id: 'police',
    name: '119 Police Emergency',
    subtitle: 'National Police Dispatch',
    phone: '119',
    icon: 'shield-alert',
    iconType: 'mc',
    color: '#1D4ED8',
    bgColor: '#DBEAFE',
  },
  {
    id: 'fire',
    name: '110 Fire & Rescue',
    subtitle: 'Fire & Emergency Services',
    phone: '110',
    icon: 'fire-truck',
    iconType: 'mc',
    color: '#EA580C',
    bgColor: '#FFEDD5',
  },
];

export default function EmergencySOSModal({
  visible,
  onClose,
  user,
  activeAlert,
  onAlertStatusChange,
  scale = 1.0,
}) {
  const [stage, setStage] = useState('countdown'); // 'countdown' | 'active'
  const [countdown, setCountdown] = useState(5);
  const [selectedType, setSelectedType] = useState('general');
  const [loading, setLoading] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(activeAlert || null);
  const [careCircle, setCareCircle] = useState([]);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);

  // Sync active alert prop & fetch care circle contacts
  useEffect(() => {
    if (activeAlert) {
      setCurrentAlert(activeAlert);
      setStage('active');
    } else if (visible && stage !== 'active') {
      setStage('countdown');
      setCountdown(5);
    }

    if (visible) {
      emergencyService
        .getCareCircle()
        .then((res) => {
          if (res?.data && Array.isArray(res.data)) {
            setCareCircle(res.data);
          }
        })
        .catch((err) => {
          console.error('Error loading Care Circle in SOS Modal:', err);
        });
    }
  }, [activeAlert, visible]);

  // Pulsating animation loop for active SOS or countdown
  useEffect(() => {
    if (visible) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    }
  }, [visible, pulseAnim]);

  // Handle 5-second countdown timer
  useEffect(() => {
    if (visible && stage === 'countdown') {
      if (Platform.OS !== 'web') {
        Vibration.vibrate([0, 200, 100, 200]);
      }

      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            triggerSOSBroadcast();
            return 0;
          }
          if (Platform.OS !== 'web') {
            Vibration.vibrate(150);
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [visible, stage, selectedType]);

  // Trigger SOS to backend
  const triggerSOSBroadcast = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setLoading(true);

    try {
      if (Platform.OS !== 'web') {
        Vibration.vibrate([0, 500, 200, 500, 200, 500]);
      }

      const res = await emergencyService.triggerSOS({
        emergencyType: selectedType,
        location: user?.address || 'Current Location',
      });

      const alertData = res?.data || {
        _id: 'temp-alert',
        status: 'active',
        emergencyType: selectedType,
        triggeredAt: new Date(),
      };

      setCurrentAlert(alertData);
      setStage('active');
      if (onAlertStatusChange) {
        onAlertStatusChange(alertData);
      }
    } catch (err) {
      console.error('Trigger SOS Error in Modal:', err);
      // Fallback: Proceed to active UI anyway so senior can call hotlines
      setStage('active');
      Alert.alert(
        'Emergency Alert Notice',
        'Emergency broadcast mode is active. Please call the emergency hotlines directly below for immediate assistance.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Resolve / Cancel SOS
  const handleResolveSOS = () => {
    Alert.alert(
      'Resolve Emergency SOS?',
      'Are you safe and would you like to cancel the active emergency alert?',
      [
        { text: 'Keep Active', style: 'cancel' },
        {
          text: 'I Am Safe - Resolve SOS',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              if (currentAlert?._id && currentAlert._id !== 'temp-alert') {
                await emergencyService.resolveSOS(currentAlert._id, {
                  status: 'resolved',
                  resolutionNotes: 'Senior resolved alert via app',
                });
              } else {
                await emergencyService.resolveSOS(null, {
                  status: 'resolved',
                });
              }
              setCurrentAlert(null);
              setStage('countdown');
              if (onAlertStatusChange) {
                onAlertStatusChange(null);
              }
              onClose();
              Alert.alert('SOS Resolved', 'Emergency alert has been cleared. Stay safe!');
            } catch (err) {
              console.error('Resolve SOS Error:', err);
              setCurrentAlert(null);
              setStage('countdown');
              if (onAlertStatusChange) {
                onAlertStatusChange(null);
              }
              onClose();
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Phone Call Hotline
  const handleCall = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('Phone Number Unavailable', 'No valid phone number is registered.');
      return;
    }
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    const url = `tel:${cleanNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Calling Not Supported', `Please dial ${cleanNumber} on your device.`);
        }
      })
      .catch(() => {
        Linking.openURL(url);
      });
  };

  // Send Emergency SMS
  const handleSendSMS = (targetPhone) => {
    const contactPhone = targetPhone || user?.emergencyContact?.phone;
    const seniorName = `${user?.firstName || 'Senior'} ${user?.lastName || ''}`.trim();
    const address = user?.address ? `My address: ${user.address}.` : '';
    const body = `🚨 EMERGENCY SOS ALERT! I (${seniorName}) need urgent help! ${address} Please check on me or call emergency services immediately.`;

    const smsUrl = Platform.select({
      ios: `sms:${contactPhone || ''}&body=${encodeURIComponent(body)}`,
      android: `sms:${contactPhone || ''}?body=${encodeURIComponent(body)}`,
      default: `sms:${contactPhone || ''}?body=${encodeURIComponent(body)}`,
    });

    Linking.openURL(smsUrl).catch(() => {
      Alert.alert('SMS Dispatch', `Please send the following message to your contact:\n\n"${body}"`);
    });
  };

  const emergencyContact = user?.emergencyContact || {};
  const hasEmergencyContact = !!emergencyContact?.phone;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (stage === 'countdown') {
          if (timerRef.current) clearInterval(timerRef.current);
          onClose();
        } else {
          handleResolveSOS();
        }
      }}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { transform: [{ scale: Math.min(1.05, scale) }] }]}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerTitleGroup}>
              <Ionicons name="warning" size={24} color="#DC2626" />
              <Text style={styles.headerTitle}>Emergency SOS</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                if (stage === 'countdown') {
                  if (timerRef.current) clearInterval(timerRef.current);
                  onClose();
                } else {
                  handleResolveSOS();
                }
              }}
              style={styles.closeBtn}
              accessibilityLabel="Close SOS"
            >
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* STAGE 1: COUNTDOWN SCREEN */}
          {stage === 'countdown' ? (
            <View style={styles.stageContent}>
              <Text style={styles.countdownTitle}>Broadcasting Emergency in</Text>

              {/* Pulsating Countdown Ring */}
              <Animated.View
                style={[
                  styles.pulseCircle,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <View style={styles.innerCircle}>
                  <Text style={styles.countdownNumber}>{countdown}</Text>
                  <Text style={styles.countdownSeconds}>seconds</Text>
                </View>
              </Animated.View>

              <Text style={styles.countdownSub}>
                Tap "Send SOS Immediately" to broadcast right away, or tap "Cancel" to abort.
              </Text>

              {/* Emergency Category Selector */}
              <View style={styles.typeSelectorRow}>
                {[
                  { id: 'general', label: 'Urgent Help', icon: 'hand-left-outline' },
                  { id: 'medical', label: 'Medical', icon: 'medkit-outline' },
                  { id: 'fall', label: 'Fall / Injury', icon: 'body-outline' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.typePill,
                      selectedType === item.id && styles.typePillActive,
                    ]}
                    onPress={() => setSelectedType(item.id)}
                  >
                    <Ionicons
                      name={item.icon}
                      size={16}
                      color={selectedType === item.id ? '#FFFFFF' : '#475569'}
                    />
                    <Text
                      style={[
                        styles.typePillText,
                        selectedType === item.id && styles.typePillTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Immediate Action Buttons */}
              <TouchableOpacity
                style={styles.immediateSosBtn}
                onPress={triggerSOSBroadcast}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="flash" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.immediateSosText}>Send SOS Immediately</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  if (timerRef.current) clearInterval(timerRef.current);
                  onClose();
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel (Accidental Press)</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* STAGE 2: ACTIVE SOS BROADCAST SCREEN */
            <ScrollView
              style={styles.activeScroll}
              contentContainerStyle={styles.activeScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Active Emergency Banner */}
              <View style={styles.activeAlertBanner}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <Ionicons name="radio" size={28} color="#FFFFFF" />
                </Animated.View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activeAlertTitle}>EMERGENCY SOS BROADCAST ACTIVE</Text>
                  <Text style={styles.activeAlertSub}>
                    Help signal broadcasted. Call hotlines directly below.
                  </Text>
                </View>
              </View>

              {/* Care Circle Emergency Contacts Section */}
              <View style={styles.contactSection}>
                <Text style={styles.sectionHeading}>
                  👤 Your Care Circle ({careCircle.length > 0 ? `${careCircle.length} Contacts` : 'Emergency Contact'})
                </Text>
                {careCircle && careCircle.length > 0 ? (
                  careCircle.map((contact) => (
                    <View
                      key={contact._id || contact.phone}
                      style={[styles.contactCard, { marginBottom: 8 }, contact.isPrimary && styles.contactCardPrimary]}
                    >
                      <View style={styles.contactInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.contactName}>{contact.name}</Text>
                          {contact.isPrimary && (
                            <View style={styles.primaryPill}>
                              <Ionicons name="star" size={10} color="#B45309" />
                              <Text style={styles.primaryPillText}>PRIMARY</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.contactRelation}>
                          {contact.relation} • {contact.phone}
                        </Text>
                      </View>
                      <View style={styles.contactActions}>
                        <TouchableOpacity
                          style={styles.contactCallBtn}
                          onPress={() => handleCall(contact.phone)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="call" size={16} color="#FFFFFF" />
                          <Text style={styles.contactBtnText}>Call</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.contactSmsBtn}
                          onPress={() => handleSendSMS(contact.phone)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="chatbubble" size={16} color="#FFFFFF" />
                          <Text style={styles.contactBtnText}>SMS</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                ) : hasEmergencyContact ? (
                  <View style={styles.contactCard}>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{emergencyContact.name || 'Emergency Contact'}</Text>
                      <Text style={styles.contactRelation}>
                        {emergencyContact.relation ? `(${emergencyContact.relation})` : ''} • {emergencyContact.phone}
                      </Text>
                    </View>
                    <View style={styles.contactActions}>
                      <TouchableOpacity
                        style={styles.contactCallBtn}
                        onPress={() => handleCall(emergencyContact.phone)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="call" size={18} color="#FFFFFF" />
                        <Text style={styles.contactBtnText}>Call</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.contactSmsBtn}
                        onPress={() => handleSendSMS(emergencyContact.phone)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="chatbubble" size={18} color="#FFFFFF" />
                        <Text style={styles.contactBtnText}>SMS</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.noContactCard}>
                    <Ionicons name="alert-circle-outline" size={22} color="#EAB308" />
                    <Text style={styles.noContactText}>
                      No Care Circle emergency contacts configured yet. Please dial the emergency hotlines below.
                    </Text>
                  </View>
                )}
              </View>

              {/* National Emergency Hotlines (1-Tap Call) */}
              <View style={styles.hotlinesSection}>
                <Text style={styles.sectionHeading}>🚨 National Emergency Hotlines (1-Tap Call)</Text>
                {EMERGENCY_HOTLINES.map((hotline) => (
                  <TouchableOpacity
                    key={hotline.id}
                    style={[styles.hotlineCard, { borderColor: hotline.color }]}
                    onPress={() => handleCall(hotline.phone)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.hotlineIconBox, { backgroundColor: hotline.bgColor }]}>
                      {hotline.iconType === 'fa5' ? (
                        <FontAwesome5 name={hotline.icon} size={22} color={hotline.color} />
                      ) : (
                        <MaterialCommunityIcons name={hotline.icon} size={26} color={hotline.color} />
                      )}
                    </View>
                    <View style={styles.hotlineDetails}>
                      <Text style={styles.hotlineName}>{hotline.name}</Text>
                      <Text style={styles.hotlineSubtitle}>{hotline.subtitle}</Text>
                    </View>
                    <View style={[styles.hotlineCallPill, { backgroundColor: hotline.color }]}>
                      <Ionicons name="call" size={16} color="#FFFFFF" />
                      <Text style={styles.hotlineCallText}>Dial {hotline.phone}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* User Address / Location Details */}
              {user?.address ? (
                <View style={styles.locationCard}>
                  <Ionicons name="location" size={20} color={COLORS.primary} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.locationLabel}>Registered Address (Read to Responder):</Text>
                    <Text style={styles.locationText}>{user.address}</Text>
                  </View>
                </View>
              ) : null}

              {/* Resolve / Deactivate SOS */}
              <TouchableOpacity
                style={styles.resolveSosBtn}
                onPress={handleResolveSOS}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.resolveSosText}>I Am Safe / Cancel SOS</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#DC2626',
    ...Platform.select({
      ios: {
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFF1F2',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  stageContent: {
    padding: 24,
    alignItems: 'center',
  },
  countdownTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 16,
    textAlign: 'center',
  },
  pulseCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  innerCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  countdownNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 52,
  },
  countdownSeconds: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FEE2E2',
    textTransform: 'uppercase',
  },
  countdownSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
    lineHeight: 18,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  typePillActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  typePillTextActive: {
    color: '#FFFFFF',
  },
  immediateSosBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 15,
    borderRadius: 14,
    marginBottom: 10,
    elevation: 3,
  },
  immediateSosText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  cancelBtn: {
    paddingVertical: 10,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textDecorationLine: 'underline',
  },
  activeScroll: {
    maxHeight: 540,
  },
  activeScrollContent: {
    padding: 16,
    gap: 14,
  },
  activeAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#DC2626',
    padding: 14,
    borderRadius: 14,
  },
  activeAlertTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  activeAlertSub: {
    fontSize: 11,
    color: '#FEE2E2',
    marginTop: 2,
    fontWeight: '500',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  contactSection: {
    marginTop: 2,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  contactCardPrimary: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  primaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  primaryPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
  },
  contactRelation: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  contactCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16A34A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  contactSmsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  noContactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEFCE8',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  noContactText: {
    flex: 1,
    fontSize: 12,
    color: '#854D0E',
    fontWeight: '500',
  },
  hotlinesSection: {
    gap: 8,
  },
  hotlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    elevation: 1,
  },
  hotlineIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  hotlineDetails: {
    flex: 1,
  },
  hotlineName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  hotlineSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  hotlineCallPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  hotlineCallText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#14532D',
    marginTop: 2,
  },
  resolveSosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 6,
    elevation: 2,
  },
  resolveSosText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
