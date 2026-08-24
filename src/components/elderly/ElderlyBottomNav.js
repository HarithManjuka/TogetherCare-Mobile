// src/components/elderly/ElderlyBottomNav.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function ElderlyBottomNav({
  activeTab,
  onSelectTab,
  requestBadgeCount = 0,
  msgBadgeCount = 0,
}) {
  const { scale } = useTheme();

  const tabs = [
    {
      id: 'home',
      label: 'Home',
      iconActive: 'home',
      iconInactive: 'home-outline',
      iconType: 'Ionicons',
    },
    {
      id: 'requests',
      label: 'Requests',
      iconActive: 'hand-left',
      iconInactive: 'hand-left-outline',
      iconType: 'Ionicons',
      badge: requestBadgeCount,
    },
    {
      id: 'schedule',
      label: 'Schedule',
      iconActive: 'calendar',
      iconInactive: 'calendar-outline',
      iconType: 'Ionicons',
    },
    {
      id: 'messages',
      label: 'Msg',
      iconActive: 'chatbubble-ellipses',
      iconInactive: 'chatbubble-ellipses-outline',
      iconType: 'Ionicons',
      badge: msgBadgeCount,
    },
    {
      id: 'settings',
      label: 'Settings',
      iconActive: 'settings',
      iconInactive: 'settings-outline',
      iconType: 'Ionicons',
    },
  ];

  return (
    <View style={styles.navContainer}>
      <View style={styles.navInner}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabButton}
              onPress={() => onSelectTab(tab.id)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label} tab`}
            >
              <View style={styles.iconWrapper}>
                <Ionicons
                  name={isActive ? tab.iconActive : tab.iconInactive}
                  size={Math.round(24 * scale)}
                  color={isActive ? '#1A365D' : '#64748B'}
                />
                {tab.badge && tab.badge > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  { fontSize: Math.round(11 * scale) },
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
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
    shadowColor: '#1A365D',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
  },
  navInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  iconWrapper: {
    width: 34,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  tabLabel: {
    marginTop: 3,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  tabLabelActive: {
    color: '#1A365D',
    fontWeight: '800',
  },
  tabLabelInactive: {
    color: '#64748B',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#1A365D',
  },
});
