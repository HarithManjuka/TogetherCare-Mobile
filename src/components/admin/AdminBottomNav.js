// src/components/admin/AdminBottomNav.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid', iconOutline: 'grid' },
  { key: 'users', label: 'Users', icon: 'person', iconOutline: 'person' },
  { key: 'alerts', label: 'Safety Alert', icon: 'notifications', iconOutline: 'notifications' },
  { key: 'settings', label: 'Settings', icon: 'settings', iconOutline: 'settings' },
];

export default function AdminBottomNav({ activeTab, onTabPress }) {
  const ACTIVE_COLOR = '#2563EB'; // Primary Blue
  const INACTIVE_COLOR = '#9CA3AF'; // Slate Gray

  return (
    <View style={styles.wrapper}>
      <View style={styles.navBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              activeOpacity={0.7}
              onPress={() => onTabPress(tab.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              {/* Active Pill Capsule Background Indicator */}
              <View style={[styles.iconPill, isActive && styles.iconPillActive]}>
                <Ionicons
                  name={isActive ? tab.icon : tab.iconOutline}
                  size={20}
                  color={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
                />
              </View>

              {/* Bottom Label */}
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR },
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
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 8,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  iconPill: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  iconPillActive: {
    backgroundColor: '#E8EDFB', // Soft light-blue pill highlight
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  activeTabLabel: {
    fontWeight: '700',
  },
});