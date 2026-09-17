// src/components/common/SideMenuDrawer.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  ScrollView,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import LogoutModal from './LogoutModal';
import CareCircleModal from '../elderly/CareCircleModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(Math.round(SCREEN_WIDTH * 0.60), 260);

export default function SideMenuDrawer({
  visible,
  onClose,
  onNavigateTab,
  onOpenProfile,
}) {
  const { user, logout } = useAuth();
  const { uiScale, cycleUiScale } = useTheme();

  // Animation values
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Modals state inside Drawer
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'account' | 'health' | 'analytics' | 'guidelines' | 'emergency' | 'circle'

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -DRAWER_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose && onClose();
    });
  };

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (err) {
      console.error('Drawer Logout Error:', err);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
      handleClose();
    }
  };

  const handleItemPress = (action) => {
    handleClose();
    setTimeout(() => {
      action();
    }, 220);
  };

  const role = user?.role || 'volunteer';
  const initials = `${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || ''}`.toUpperCase();

  // Role based menu items
  const renderMenuItems = () => {
    if (role === 'admin') {
      return (
        <>
          <DrawerItem
            icon="settings-outline"
            title="System Settings"
            subtitle="Platform Configuration"
            onPress={() =>
              handleItemPress(() => {
                if (onNavigateTab) onNavigateTab('settings', 'menu');
                else if (onOpenProfile) onOpenProfile();
              })
            }
          />
          <DrawerItem
            icon="pulse-outline"
            title="System Health"
            subtitle="API & Database Metrics"
            onPress={() =>
              handleItemPress(() => {
                if (onNavigateTab) onNavigateTab('settings', 'health');
                else setActiveModal('health');
              })
            }
          />
          <DrawerItem
            icon="bar-chart-outline"
            title="Analytics"
            subtitle="Usage & Service Stats"
            onPress={() =>
              handleItemPress(() => {
                if (onNavigateTab) onNavigateTab('settings', 'analytics');
                else setActiveModal('analytics');
              })
            }
          />
          <DrawerItem
            icon="people-outline"
            title="User Management"
            subtitle="Roles, Approvals & Safety"
            onPress={() =>
              handleItemPress(() => {
                if (onNavigateTab) onNavigateTab('users');
              })
            }
          />
          <DrawerItem
            icon="id-card-outline"
            title="Account Details"
            subtitle="Full Identity & Credentials"
            onPress={() =>
              handleItemPress(() => {
                if (onNavigateTab) onNavigateTab('settings', 'account');
                else setActiveModal('account');
              })
            }
            highlight
          />
        </>
      );
    }

    if (role === 'volunteer') {
      return (
        <>
          <DrawerItem
            icon="shield-checkmark-outline"
            title="Volunteer Guidelines"
            subtitle="Safety Rules & Best Practices"
            onPress={() => setActiveModal('guidelines')}
          />
          <DrawerItem
            icon="time-outline"
            title="Availability & Radius"
            subtitle="Manage Working Hours"
            onPress={() =>
              handleItemPress(() => {
                if (onNavigateTab) onNavigateTab('home');
              })
            }
          />
          <DrawerItem
            icon="heart-circle-outline"
            title="Community Impact"
            subtitle="Visits & Appreciation"
            onPress={() => setActiveModal('analytics')}
          />
          <DrawerItem
            icon="id-card-outline"
            title="Account Details"
            subtitle="Full Identity & Verification"
            onPress={() => setActiveModal('account')}
            highlight
          />
        </>
      );
    }

    if (role === 'elderly') {
      return (
        <>
          <DrawerItem
            icon="call-outline"
            title="Emergency Helplines"
            subtitle="1990 Suwa Seriya & Police"
            onPress={() => setActiveModal('emergency')}
          />
          <DrawerItem
            icon="people-outline"
            title="My Care Circle"
            subtitle="Family & Trusted Volunteers"
            onPress={() => setActiveModal('circle')}
          />
          <DrawerItem
            icon="text-outline"
            title="Accessibility & Font Zoom"
            subtitle={`Current Zoom: ${uiScale === 1.0 ? 'Standard' : uiScale === 1.15 ? 'Large (A+)' : 'Extra Large (A++)'}`}
            onPress={() => {
              cycleUiScale && cycleUiScale();
            }}
          />
          <DrawerItem
            icon="id-card-outline"
            title="Account Details"
            subtitle="Full Identity & Emergency Data"
            onPress={() => setActiveModal('account')}
            highlight
          />
        </>
      );
    }

    // Caregiver Role
    return (
      <>
        <DrawerItem
          icon="people-circle-outline"
          title="Manage Dependents"
          subtitle="Assigned Seniors"
          onPress={() =>
            handleItemPress(() => {
              if (onNavigateTab) onNavigateTab('dependents');
            })
          }
        />
        <DrawerItem
          icon="calendar-outline"
          title="Care Schedules"
          subtitle="Upcoming Visits & Trips"
          onPress={() =>
            handleItemPress(() => {
              if (onNavigateTab) onNavigateTab('requests');
            })
          }
        />
        <DrawerItem
          icon="medical-outline"
          title="Emergency Protocols"
          subtitle="First Aid & Doctor Helplines"
          onPress={() => setActiveModal('emergency')}
        />
        <DrawerItem
          icon="id-card-outline"
          title="Account Details"
          subtitle="Full Identity & Credentials"
          onPress={() => setActiveModal('account')}
          highlight
        />
      </>
    );
  };

  if (!visible && activeModal === null && !showLogoutModal) {
    return null;
  }

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={handleClose}
      >
        <View style={styles.modalRoot}>
          {/* Semi-transparent Backdrop with Fade */}
          <Animated.View
            pointerEvents="none"
            style={[styles.backdrop, { opacity: fadeAnim }]}
          />

          <View style={styles.drawerRow}>
            {/* Slide-out Left Drawer */}
            <Animated.View
              style={[
                styles.drawerContainer,
                {
                  width: DRAWER_WIDTH,
                  transform: [{ translateX }],
                },
              ]}
            >
              {/* Drawer Top Header Banner */}
              <View style={styles.drawerHeaderBanner}>
                <View style={styles.headerBrandRow}>
                  <View style={styles.brandIconBox}>
                    <Ionicons name="heart" size={20} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.brandTitle}>TogetherCare</Text>
                    <Text style={styles.brandTagline}>Community Care System</Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleClose}
                    style={styles.closeBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {/* Role Pill */}
                <View style={styles.roleBadgeContainer}>
                  <View style={styles.roleDot} />
                  <Text style={styles.roleBadgeText}>
                    {role.toUpperCase()} ACCESS PANEL
                  </Text>
                </View>
              </View>

              {/* Menu List */}
              <ScrollView
                style={styles.menuScroll}
                contentContainerStyle={styles.menuScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.sectionLabel}>QUICK NAVIGATION</Text>
                {renderMenuItems()}
              </ScrollView>

              {/* Bottom Profile & Logout Footer Panel */}
              <View style={styles.bottomUserPanel}>
                <TouchableOpacity
                  style={styles.userInfoRow}
                  activeOpacity={0.7}
                  onPress={() =>
                    handleItemPress(() => {
                      if (onOpenProfile) onOpenProfile();
                      else if (onNavigateTab) onNavigateTab(role === 'admin' ? 'settings' : 'profile', 'profile');
                    })
                  }
                >
                  <View style={styles.bottomAvatarWrap}>
                    {user?.profilePicture ? (
                      <Image
                        source={{ uri: user.profilePicture }}
                        style={styles.bottomAvatarImg}
                      />
                    ) : (
                      <Text style={styles.bottomAvatarInitials}>{initials}</Text>
                    )}
                  </View>
                  <View style={styles.userNameBlock}>
                    <Text style={styles.userNameText} numberOfLines={1}>
                      {user?.firstName} {user?.lastName || ''}
                    </Text>
                    <Text style={styles.userRoleText} numberOfLines={1}>
                      {user?.email || role}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </TouchableOpacity>

                {/* Action Buttons Row: View Profile & Logout */}
                <View style={styles.panelActionsRow}>
                  <TouchableOpacity
                    style={styles.viewProfileBtn}
                    onPress={() =>
                      handleItemPress(() => {
                        if (onOpenProfile) onOpenProfile();
                        else if (onNavigateTab) onNavigateTab(role === 'admin' ? 'settings' : 'profile', 'profile');
                      })
                    }
                    activeOpacity={0.8}
                  >
                    <Ionicons name="person-outline" size={15} color="#1E40AF" />
                    <Text style={styles.viewProfileBtnText}>View Profile</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.drawerLogoutBtn}
                    onPress={() => setShowLogoutModal(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="log-out-outline" size={15} color="#DC2626" />
                    <Text style={styles.drawerLogoutBtnText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

            {/* Outside touchable area (remaining right half of screen) */}
            <TouchableWithoutFeedback onPress={handleClose} accessibilityRole="button" accessibilityLabel="Close side menu">
              <View style={styles.outsideTouchArea} />
            </TouchableWithoutFeedback>
          </View>
        </View>
      </Modal>

      {/* --- Detail Modals Triggered From Side Menu --- */}

      {/* 1. Comprehensive Account Details Modal */}
      <Modal
        visible={activeModal === 'account'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="id-card" size={22} color="#1E40AF" />
                <Text style={styles.detailModalTitle}>Account Details</Text>
              </View>
              <TouchableOpacity
                onPress={() => setActiveModal(null)}
                style={styles.modalCloseIconBtn}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
              <DetailRow label="User Custom ID" value={user?.customId || user?._id?.substring(0, 8)?.toUpperCase() || 'USR-2026'} isHighlight />
              <DetailRow label="Full Legal Name" value={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Not specified'} />
              <DetailRow label="Email Address" value={user?.email || 'Not specified'} />
              <DetailRow label="Phone Number" value={user?.phone || 'Not provided'} />
              <DetailRow label="System Role" value={role.toUpperCase()} />
              <DetailRow label="Account Status" value={user?.accountStatus || (user?.isEmailVerified ? 'Active & Verified' : 'Active')} />
              <DetailRow label="Registered Date" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB') : 'August 2026'} />
              <DetailRow label="City & District" value={user?.address?.city ? `${user.address.city}, ${user.address.district || 'Colombo'}` : 'Colombo, Western'} />
              {user?.dateOfBirth && (
                <DetailRow label="Date of Birth" value={new Date(user.dateOfBirth).toLocaleDateString('en-GB')} />
              )}
              {role === 'volunteer' && (
                <>
                  <DetailRow label="Verification Badge" value={(user?.verificationBadgeStatus || 'unverified').toUpperCase()} />
                  <DetailRow label="ID Document Type" value={user?.volunteerIdType || 'NIC / Student ID'} />
                </>
              )}
              {role === 'caregiver' && (
                <>
                  <DetailRow label="Caregiver Category" value={user?.caregiverType === 'formal_caregiver' ? 'Formal Caregiver' : 'Family Relative'} />
                  <DetailRow label="Organization" value={user?.organizationName || 'TogetherCare Family Support'} />
                </>
              )}
              {role === 'elderly' && (
                <>
                  <DetailRow label="Emergency Contact" value={user?.emergencyContact?.name || 'Not provided'} />
                  <DetailRow label="Emergency Phone" value={user?.emergencyContact?.phone || 'Not provided'} />
                </>
              )}
              {role === 'admin' && (
                <DetailRow label="Security Clearance" value="Super Administrator (Full System Control)" isHighlight />
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2. System Health Diagnostics Modal (Admin) */}
      <Modal
        visible={activeModal === 'health'}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="pulse" size={22} color="#16A34A" />
                <Text style={styles.detailModalTitle}>System Health</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.healthStatsBox}>
              <HealthItem label="API Backend Server" status="Operational" latency="34ms" isGood />
              <HealthItem label="MongoDB Database" status="Connected" latency="18ms" isGood />
              <HealthItem label="Push Notification Dispatcher" status="Active" latency="12ms" isGood />
              <HealthItem label="Live Location & WebSocket" status="Online" latency="24ms" isGood />
              <HealthItem label="System Server Uptime" status="99.98%" latency="Colombo Region" isGood />
            </View>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.modalDoneBtnText}>Close Diagnostics</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3. Analytics & Impact Modal */}
      <Modal
        visible={activeModal === 'analytics'}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="bar-chart" size={22} color="#1E40AF" />
                <Text style={styles.detailModalTitle}>Platform Analytics</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.analyticsGrid}>
              <AnalyticsBox title="98.6%" subtitle="Fulfillment Rate" color="#16A34A" />
              <AnalyticsBox title="4.9 ★" subtitle="Community Rating" color="#F59E0B" />
              <AnalyticsBox title="12 mins" subtitle="Avg Response Time" color="#0284C7" />
              <AnalyticsBox title="240+" subtitle="Visits This Week" color="#8B5CF6" />
            </View>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.modalDoneBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 4. Emergency Contacts Modal (Elderly / Caregiver) */}
      <Modal
        visible={activeModal === 'emergency'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="alert-circle" size={22} color="#DC2626" />
                <Text style={styles.detailModalTitle}>Emergency Helplines</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12, paddingVertical: 10 }}>
              <HelplineRow name="Suwa Seriya Ambulance" number="1990" icon="medical" color="#DC2626" />
              <HelplineRow name="Sri Lanka Police Emergency" number="119" icon="shield" color="#1E40AF" />
              <HelplineRow name="Elder Support National Line" number="1933" icon="heart" color="#D97706" />
              <HelplineRow name="TogetherCare 24/7 Dispatch" number="011 234 5678" icon="call" color="#16A34A" />
            </View>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.modalDoneBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 5. Volunteer Safety Guidelines Modal */}
      <Modal
        visible={activeModal === 'guidelines'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="book" size={22} color="#1E40AF" />
                <Text style={styles.detailModalTitle}>Volunteer Guidelines</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.ruleItem}>1. Always verify identity using your digital ID badge upon arriving at an elder's residence.</Text>
              <Text style={styles.ruleItem}>2. Confirm receipt and payment details transparently during grocery/pharmacy runs.</Text>
              <Text style={styles.ruleItem}>3. In medical emergencies, immediately contact Suwa Seriya 1990 before updating the app.</Text>
              <Text style={styles.ruleItem}>4. Respect elderly privacy and maintain strict confidentiality of medical records.</Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.modalDoneBtnText}>Understood</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 6. Dynamic My Care Circle Modal (Elderly) - Fetched from backend database */}
      <CareCircleModal
        visible={activeModal === 'circle'}
        onClose={() => setActiveModal(null)}
        scale={uiScale}
      />

      {/* Safe Sign Out Modal */}
      <LogoutModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        isLoggingOut={isLoggingOut}
      />
    </>
  );
}

// Single Drawer Item Component
function DrawerItem({ icon, title, subtitle, onPress, highlight }) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, highlight && styles.menuItemHighlight]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={[styles.menuIconCircle, highlight && styles.menuIconCircleHighlight]}>
        <Ionicons name={icon} size={19} color={highlight ? '#1E40AF' : '#334155'} />
      </View>
      <View style={styles.menuTextWrap}>
        <Text style={[styles.menuItemTitle, highlight && styles.menuItemTitleHighlight]}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.menuItemSubtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={15} color="#94A3B8" />
    </TouchableOpacity>
  );
}

// Modal Detail Row Component
function DetailRow({ label, value, isHighlight }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, isHighlight && styles.detailValueHighlight]}>
        {value}
      </Text>
    </View>
  );
}

// System Health Item
function HealthItem({ label, status, latency }) {
  return (
    <View style={styles.healthRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.healthLabel}>{label}</Text>
        <Text style={styles.healthLatency}>{latency}</Text>
      </View>
      <View style={styles.healthBadge}>
        <View style={styles.healthDot} />
        <Text style={styles.healthBadgeText}>{status}</Text>
      </View>
    </View>
  );
}

// Analytics Box
function AnalyticsBox({ title, subtitle, color }) {
  return (
    <View style={styles.analyticsBox}>
      <Text style={[styles.analyticsTitle, { color }]}>{title}</Text>
      <Text style={styles.analyticsSubtitle}>{subtitle}</Text>
    </View>
  );
}

// Helpline Row
function HelplineRow({ name, number, icon, color }) {
  return (
    <View style={styles.helplineCard}>
      <View style={[styles.helplineIconWrap, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.helplineName}>{name}</Text>
        <Text style={[styles.helplineNumber, { color }]}>{number}</Text>
      </View>
    </View>
  );
}

// Care Circle Item
function CareCircleItem({ name, role, status, icon }) {
  return (
    <View style={styles.careCircleRow}>
      <View style={styles.careCircleIcon}>
        <Ionicons name={icon} size={20} color="#1E40AF" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.careCircleName}>{name}</Text>
        <Text style={styles.careCircleRole}>{role}</Text>
      </View>
      <View style={styles.careCircleBadge}>
        <Text style={styles.careCircleBadgeText}>{status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  drawerRow: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerContainer: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 16,
    zIndex: 1000,
  },
  outsideTouchArea: {
    flex: 1,
    height: '100%',
  },
  drawerHeaderBanner: {
    backgroundColor: '#1E3A8A',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 46,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  headerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 10,
    color: '#BFDBFE',
    fontWeight: '500',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
    gap: 6,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  menuScroll: {
    flex: 1,
  },
  menuScrollContent: {
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginHorizontal: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 3,
    backgroundColor: '#FFFFFF',
  },
  menuItemHighlight: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  menuIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  menuIconCircleHighlight: {
    backgroundColor: '#DBEAFE',
  },
  menuTextWrap: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  menuItemTitleHighlight: {
    color: '#1E40AF',
    fontWeight: '800',
  },
  menuItemSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  bottomUserPanel: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    backgroundColor: '#F8FAFC',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  bottomAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  bottomAvatarImg: {
    width: '100%',
    height: '100%',
  },
  bottomAvatarInitials: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userNameBlock: {
    flex: 1,
  },
  userNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  userRoleText: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  panelActionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  viewProfileBtn: {
    flex: 1.15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 4,
  },
  viewProfileBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
  },
  drawerLogoutBtn: {
    flex: 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 4,
  },
  drawerLogoutBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  detailModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseIconBtn: {
    padding: 4,
  },
  detailRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  detailValueHighlight: {
    color: '#1E40AF',
  },
  modalDoneBtn: {
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  modalDoneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  healthStatsBox: {
    gap: 10,
    paddingVertical: 10,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  healthLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  healthLatency: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  healthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  healthBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 12,
  },
  analyticsBox: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  analyticsTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  analyticsSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  helplineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  helplineIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helplineName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  helplineNumber: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 1,
  },
  ruleItem: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 10,
  },
  careCircleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  careCircleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  careCircleName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  careCircleRole: {
    fontSize: 11,
    color: '#64748B',
  },
  careCircleBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  careCircleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
});
