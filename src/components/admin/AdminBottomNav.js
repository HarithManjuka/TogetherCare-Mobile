// src/components/admin/AdminBottomNav.js
import React from 'react';
import AppBottomNav from '../common/AppBottomNav';

const ADMIN_TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid', iconOutline: 'grid-outline' },
  { key: 'users', label: 'Users', icon: 'people', iconOutline: 'people-outline' },
  { key: 'alerts', label: 'Alerts', icon: 'shield-checkmark', iconOutline: 'shield-checkmark-outline' },
  { key: 'settings', label: 'Settings', icon: 'settings', iconOutline: 'settings-outline' },
];

/**
 * Admin Role Adapter for Unified Bottom Navigation
 */
export default function AdminBottomNav({ activeTab, onTabPress }) {
  return (
    <AppBottomNav
      tabs={ADMIN_TABS}
      activeTab={activeTab}
      onTabPress={onTabPress}
      activeColor="#1E40AF"
      activePillColor="#DBEAFE"
    />
  );
}