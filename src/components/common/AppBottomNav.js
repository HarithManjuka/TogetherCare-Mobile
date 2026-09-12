// src/components/common/AppBottomNav.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Unified Production-Grade Bottom Navigation Component for TogetherCare
 * Standardizes navigation bar styling across Admin, Volunteer, Elderly & Caregiver roles.
 *
 * Props:
 * - tabs: Array of tab objects:
 *     [{ key: 'home', label: 'Home', icon: 'home', iconOutline: 'home-outline', badge?: number }]
 * - activeTab: string (current active tab key)
 * - onTabPress: function(tabKey: string)
 * - activeColor?: string (optional active theme color, defaults to '#1E40AF')
 * - activePillColor?: string (optional active pill background, defaults to '#DBEAFE')
 * - inactiveColor?: string (optional inactive color, defaults to '#64748B')
 * - scale?: number (theme font/icon scale factor)
 */
export default function AppBottomNav({
  tabs = [],
  activeTab,
  onTabPress,
  activeColor = '#1E40AF',
  activePillColor = '#DBEAFE',
  inactiveColor = '#64748B',
  scale = 1.0,
}) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);

  return (
    <View style={[styles.navContainer, { paddingBottom: bottomPadding }]}>
      <View style={styles.navBar}>
        {tabs.map((tab) => {
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
              onPress={() => onTabPress(tabKey)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label} tab`}
            >
              <View style={[styles.iconPill, isActive && { backgroundColor: activePillColor }]}>
                <Ionicons
                  name={iconName}
                  size={Math.round(20 * scale)}
                  color={isActive ? activeColor : inactiveColor}
                />
                {badgeCount && badgeCount > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {badgeCount > 9 ? '9+' : badgeCount}
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
  iconPill: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 3,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  tabLabel: {
    fontWeight: '600',
  },
  activeTabLabel: {
    fontWeight: '800',
  },
});
