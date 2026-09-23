// src/components/common/AppBottomNav.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Role-based default tab configurations for TogetherCare
 */
export const ROLE_TABS = {
  admin: [
    { key: 'dashboard', label: 'Dashboard', icon: 'grid', iconOutline: 'grid-outline' },
    { key: 'users', label: 'Users', icon: 'people', iconOutline: 'people-outline' },
    { key: 'alerts', label: 'Alerts', icon: 'shield-checkmark', iconOutline: 'shield-checkmark-outline' },
    { key: 'settings', label: 'Settings', icon: 'settings', iconOutline: 'settings-outline' },
  ],
  elderly: [
    { key: 'home', label: 'Home', icon: 'home', iconOutline: 'home-outline' },
    { key: 'requests', label: 'Requests', icon: 'heart', iconOutline: 'heart-outline' },
    { key: 'schedule', label: 'Schedule', icon: 'calendar', iconOutline: 'calendar-outline' },
    { key: 'messages', label: 'Msg', icon: 'chatbubbles', iconOutline: 'chatbubbles-outline' },
    { key: 'profile', label: 'Profile', icon: 'person', iconOutline: 'person-outline' },
  ],
  volunteer: [
    { key: 'home', label: 'Home', icon: 'grid', iconOutline: 'grid-outline' },
    { key: 'request', label: 'Request', icon: 'clipboard', iconOutline: 'clipboard-outline' },
    { key: 'schedule', label: 'Schedule', icon: 'calendar', iconOutline: 'calendar-outline' },
    { key: 'messages', label: 'Chat', icon: 'chatbubbles', iconOutline: 'chatbubbles-outline' },
    { key: 'profile', label: 'Profile', icon: 'person', iconOutline: 'person-outline' },
  ],
  caregiver: [
    { key: 'home', label: 'Dashboard', icon: 'grid', iconOutline: 'grid-outline' },
    { key: 'assignments', label: 'Tasks', icon: 'briefcase', iconOutline: 'briefcase-outline' },
    { key: 'requests', label: 'Visits', icon: 'calendar', iconOutline: 'calendar-outline' },
    { key: 'messages', label: 'Chat', icon: 'chatbubbles', iconOutline: 'chatbubbles-outline' },
    { key: 'profile', label: 'Profile', icon: 'person', iconOutline: 'person-outline' },
  ],
  family_member: [
    { key: 'home', label: 'Dashboard', icon: 'grid', iconOutline: 'grid-outline' },
    { key: 'dependents', label: 'Dependents', icon: 'people', iconOutline: 'people-outline' },
    { key: 'requests', label: 'Visits', icon: 'calendar', iconOutline: 'calendar-outline' },
    { key: 'messages', label: 'Chat', icon: 'chatbubbles', iconOutline: 'chatbubbles-outline' },
    { key: 'profile', label: 'Profile', icon: 'person', iconOutline: 'person-outline' },
  ],
};

/**
 * Unified Production-Grade Bottom Navigation Component for TogetherCare
 * Standardizes navigation bar styling across Admin, Volunteer, Elderly & Caregiver roles.
 *
 * Props:
 * - role?: string ('admin' | 'elderly' | 'volunteer' | 'caregiver' | 'family_member')
 * - tabs?: Array of tab objects (overrides role defaults if provided)
 * - activeTab: string (current active tab key)
 * - onTabPress / onSelectTab: function(tabKey: string)
 * - requestBadgeCount?: number
 * - msgBadgeCount?: number
 * - activeColor?: string (defaults to '#1E40AF')
 * - activePillColor?: string (defaults to '#DBEAFE')
 * - inactiveColor?: string (defaults to '#64748B')
 * - scale?: number (theme font/icon scale factor)
 */
export default function AppBottomNav({
  role,
  tabs,
  activeTab,
  onTabPress,
  onSelectTab,
  requestBadgeCount,
  msgBadgeCount,
  activeColor = '#1E40AF',
  activePillColor = '#DBEAFE',
  inactiveColor = '#64748B',
  scale = 1.0,
}) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);

  const rawTabs = tabs && tabs.length > 0 ? tabs : (role && ROLE_TABS[role]) ? ROLE_TABS[role] : [];

  const finalTabs = rawTabs.map((tab) => {
    if ((tab.key === 'requests' || tab.key === 'request') && requestBadgeCount !== undefined) {
      return { ...tab, badge: requestBadgeCount };
    }
    if (
      (tab.key === 'messages' || tab.key === 'msg' || tab.key === 'chat') &&
      msgBadgeCount !== undefined
    ) {
      return { ...tab, badge: msgBadgeCount };
    }
    return tab;
  });

  const handlePress = onTabPress || onSelectTab || (() => {});

  return (
    <View style={[styles.navContainer, { paddingBottom: bottomPadding }]}>
      <View style={styles.navBar}>
        {finalTabs.map((tab) => {
          const tabKey = tab.key || tab.id;
          const isActive = activeTab === tabKey;
          const iconName = isActive
            ? tab.icon || tab.iconActive
            : tab.iconOutline || tab.iconInactive || tab.icon;
          const badgeCount = tab.badge;

          return (
            <TouchableOpacity
              key={tabKey}
              style={styles.tabButton}
              activeOpacity={0.7}
              onPress={() => handlePress(tabKey)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label} tab`}
            >
              <View style={styles.iconPillWrapper}>
                <View style={[styles.iconPill, isActive && { backgroundColor: activePillColor }]}>
                  <Ionicons
                    name={iconName}
                    size={Math.round(20 * scale)}
                    color={isActive ? activeColor : inactiveColor}
                  />
                </View>
                {badgeCount && badgeCount > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  { fontSize: Math.round(11 * scale), color: isActive ? activeColor : inactiveColor },
                  isActive && styles.activeTabLabel,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 12,
    zIndex: 999,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  iconPill: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 12,
  },
  tabLabel: {
    fontWeight: '600',
  },
  activeTabLabel: {
    fontWeight: '800',
  },
});
