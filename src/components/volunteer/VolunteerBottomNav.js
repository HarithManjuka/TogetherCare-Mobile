// src/components/volunteer/VolunteerBottomNav.js
import React from 'react';
import AppBottomNav from '../common/AppBottomNav';

/**
 * Volunteer Role Adapter for Unified Bottom Navigation
 * Features professional, lightweight vector icons matching the Admin navigation design system.
 */
export default function VolunteerBottomNav({ activeTab, onSelectTab, requestBadgeCount = 2 }) {
  const tabs = [
    {
      key: 'home',
      label: 'Home',
      icon: 'grid',
      iconOutline: 'grid-outline',
    },
    {
      key: 'request',
      label: 'Request',
      icon: 'clipboard',
      iconOutline: 'clipboard-outline',
      badge: requestBadgeCount,
    },
    {
      key: 'schedule',
      label: 'Schedule',
      icon: 'calendar',
      iconOutline: 'calendar-outline',
    },
    {
      key: 'history',
      label: 'History',
      icon: 'time',
      iconOutline: 'time-outline',
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
    />
  );
}
