import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid', iconOutline: 'grid-outline' },
  { key: 'users', label: 'Users', icon: 'people', iconOutline: 'people-outline' },
  { key: 'alerts', label: 'Alerts', icon: 'shield-checkmark', iconOutline: 'shield-checkmark-outline' },
  { key: 'settings', label: 'Settings', icon: 'settings', iconOutline: 'settings-outline' },
];

/**
 * Mobile Responsive Admin Bottom Navigation Component
 */
export default function AdminBottomNav({ activeTab, onTabPress }) {
  const insets = useSafeAreaInsets();
  const ACTIVE_COLOR = '#1E40AF';
  const INACTIVE_COLOR = '#64748B';

  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 10);

  return (
    <View style={[styles.navContainer, { paddingBottom: bottomPadding }]}>
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
              <View style={[styles.iconPill, isActive && styles.iconPillActive]}>
                <Ionicons
                  name={isActive ? tab.icon : tab.iconOutline}
                  size={20}
                  color={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
                />
              </View>
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
  navContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 12,
    zIndex: 999,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
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
  },
  iconPillActive: {
    backgroundColor: '#DBEAFE',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeTabLabel: {
    fontWeight: '800',
    color: '#1E40AF',
  },
});