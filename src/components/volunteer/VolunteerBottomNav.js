import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';

export default function VolunteerBottomNav({ activeTab, onSelectTab, requestBadgeCount = 2 }) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);

  const tabs = [
    {
      id: 'home',
      label: 'Home',
      iconActive: 'home',
      iconInactive: 'home-outline',
    },
    {
      id: 'request',
      label: 'Request',
      iconActive: 'document-text',
      iconInactive: 'document-text-outline',
      badge: requestBadgeCount,
    },
    {
      id: 'schedule',
      label: 'Schedule',
      iconActive: 'calendar',
      iconInactive: 'calendar-outline',
    },
    {
      id: 'history',
      label: 'History',
      iconActive: 'folder-open',
      iconInactive: 'folder-outline',
    },
    {
      id: 'profile',
      label: 'Profile',
      iconActive: 'person-circle',
      iconInactive: 'person-circle-outline',
    },
  ];

  return (
    <View style={[styles.navContainer, { paddingBottom: bottomPadding }]}>
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
                  size={24}
                  color={isActive ? '#1E40AF' : '#64748B'}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
  },
  navInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  iconWrapper: {
    width: 32,
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
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  tabLabelActive: {
    color: '#1E40AF',
    fontWeight: '800',
  },
  tabLabelInactive: {
    color: '#64748B',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#1E40AF',
  },
});
