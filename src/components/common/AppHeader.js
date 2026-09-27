// src/components/common/AppHeader.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import styles, { HEADER_BG_COLOR } from '../../styles/AppHeader.styles';
import SideMenuDrawer from './SideMenuDrawer';

export default function AppHeader({
  onNotificationPress,
  onProfilePress,
  onNavigateTab,
  hasUnreadNotifications = false,
  showLeftAction = false,
  onLeftActionPress,
  showMenu = true,
}) {
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { uiScale, cycleUiScale } = useTheme();

  // Top padding accommodating device status bar insets safely
  const topPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  );

  // Determine user initials fallback
  const initials = `${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || ''}`.toUpperCase();

  // Label showing current accessibility zoom scale
  const scaleLabel = uiScale === 1.0 ? 'A' : uiScale === 1.15 ? 'A+' : 'A++';

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Light content ensures white clock, Wi-Fi, battery icons blend with dark blue bar */}
      <StatusBar barStyle="light-content" backgroundColor={HEADER_BG_COLOR} />

      <View style={styles.contentRow}>
        {/* Left Side: Optional Back or Hamburger Menu Button */}
        <View style={styles.leftPlaceholder}>
          {showLeftAction ? (
            <TouchableOpacity onPress={onLeftActionPress} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : showMenu ? (
            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              style={styles.hamburgerBtn}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Open navigation side menu"
            >
              <Ionicons name="menu-outline" size={23} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Center: Brand Name */}
        <View style={styles.centerTitleContainer}>
          <Text style={styles.brandTitle}>TogetherCare</Text>
        </View>

        {/* Right Actions */}
        <View style={styles.rightActionsGroup}>
          {/* Visual Access Feature: Only for Elderly Role */}
          {user?.role === 'elderly' && (
            <TouchableOpacity
              style={styles.fontScalePill}
              onPress={cycleUiScale}
              activeOpacity={0.8}
            >
              <Text style={styles.fontScaleText}>{scaleLabel}</Text>
            </TouchableOpacity>
          )}

          {/* Notification Icon */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onNotificationPress}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
            {hasUnreadNotifications && <View style={styles.notificationBadge} />}
          </TouchableOpacity>

          {/* User Profile Avatar Link */}
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={onProfilePress}
            activeOpacity={0.8}
          >
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Slide-out Left Drawer Panel */}
      <SideMenuDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onNavigateTab={onNavigateTab}
        onOpenProfile={onProfilePress}
      />
    </View>
  );
}
