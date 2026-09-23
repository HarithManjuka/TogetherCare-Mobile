// src/components/elderly/ElderlyBottomNav.js
import React from 'react';
import AppBottomNav from '../common/AppBottomNav';
import { useTheme } from '../../context/ThemeContext';

/**
 * Elderly & Caregiver Role Adapter for Unified Bottom Navigation
 * Features professional vector icons and dedicated Profile tab matching app design standards.
 */
export default function ElderlyBottomNav({
  activeTab,
  onSelectTab,
  requestBadgeCount = 0,
  msgBadgeCount = 0,
}) {
  const { scale } = useTheme();

  const tabs = [
    {
      key: 'home',
      label: 'Home',
      icon: 'home',
      iconOutline: 'home-outline',
    },
    {
      key: 'requests',
      label: 'Requests',
      icon: 'heart',
      iconOutline: 'heart-outline',
      badge: requestBadgeCount,
    },
    {
      key: 'schedule',
      label: 'Schedule',
      icon: 'calendar',
      iconOutline: 'calendar-outline',
    },
    {
      key: 'messages',
      label: 'Msg',
      icon: 'chatbubbles',
      iconOutline: 'chatbubbles-outline',
      badge: msgBadgeCount,
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: 'person',
      iconOutline: 'person-outline',
    },
  ];

  return (
    <AppBottomNav
      tabs={tabs}
      activeTab={activeTab}
      onTabPress={onSelectTab}
      activeColor="#1E40AF"
      activePillColor="#DBEAFE"
      scale={scale}
    />
  );
}
