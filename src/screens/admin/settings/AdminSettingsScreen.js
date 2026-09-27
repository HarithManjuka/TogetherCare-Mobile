// src/screens/admin/settings/AdminSettingsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import AppHeader from '../../../components/common/AppHeader';
import LogoutModal from '../../../components/common/LogoutModal';

export default function AdminSettingsScreen({
  onNavigateScreen,
  onNavigateTab,
}) {
  const { user, logout } = useAuth();
  const { uiScale, cycleUiScale } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const initials = `${user?.firstName?.[0] || 'A'}${user?.lastName?.[0] || 'D'}`.toUpperCase();

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (err) {
      console.error('Logout error from Admin Settings:', err);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header with Menu & Profile */}
      <AppHeader
        onProfilePress={() => onNavigateScreen('profile')}
        onNotificationPress={() => onNavigateTab && onNavigateTab('alerts')}
        onNavigateTab={onNavigateTab}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Admin Profile Overview Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </View>

          <View style={styles.profileDetails}>
            <View style={styles.nameBadgeRow}>
              <Text style={styles.adminName}>
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'System Admin'}
              </Text>
            </View>
            <Text style={styles.adminEmail}>{user?.email || 'admin@togethercare.org'}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#1E40AF" />
                <Text style={styles.roleBadgeText}>SUPER ADMIN</Text>
              </View>
              <View style={styles.idBadge}>
                <Text style={styles.idBadgeText}>{user?.customId || 'ADM-0001'}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => onNavigateScreen('profile')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <Ionicons name="pencil" size={16} color="#1E40AF" />
          </TouchableOpacity>
        </View>

        {/* Administration Navigation Modules */}
        <Text style={styles.sectionHeader}>Admin Modules & Diagnostics</Text>
        <View style={styles.menuCard}>
          <SettingsMenuItem
            icon="person-outline"
            iconColor="#1E40AF"
            iconBg="#EFF6FF"
            title="Admin Profile"
            subtitle="Edit profile details, photo, and preferences"
            badge="Editable"
            badgeColor="#1E40AF"
            onPress={() => onNavigateScreen('profile')}
          />
          <Divider />
          <SettingsMenuItem
            icon="pulse-outline"
            iconColor="#16A34A"
            iconBg="#F0FDF4"
            title="System Health"
            subtitle="API & Database metrics, server uptime"
            badge="Live Ping"
            badgeColor="#16A34A"
            onPress={() => onNavigateScreen('health')}
          />
          <Divider />
          <SettingsMenuItem
            icon="bar-chart-outline"
            iconColor="#D97706"
            iconBg="#FEF3C7"
            title="Analytics"
            subtitle="Usage, service stats & demographics"
            badge="Stats"
            badgeColor="#D97706"
            onPress={() => onNavigateScreen('analytics')}
          />
          <Divider />
          <SettingsMenuItem
            icon="id-card-outline"
            iconColor="#7C3AED"
            iconBg="#F5F3FF"
            title="Account Details"
            subtitle="Full identity & credentials without edit options"
            badge="Read-Only"
            badgeColor="#7C3AED"
            highlight
            onPress={() => onNavigateScreen('account')}
          />
        </View>

        {/* System & Accessibility Options */}
        <Text style={styles.sectionHeader}>System Preferences</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={cycleUiScale}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="text-outline" size={20} color="#334155" />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuItemTitle}>Accessibility & Font Zoom</Text>
              <Text style={styles.menuItemSubtitle}>
                Current scale: {uiScale === 1.0 ? 'Standard (1.0x)' : uiScale === 1.15 ? 'Large (1.15x)' : 'Extra Large (1.3x)'}
              </Text>
            </View>
            <View style={styles.scaleBadge}>
              <Text style={styles.scaleBadgeText}>{uiScale === 1.0 ? 'A' : uiScale === 1.15 ? 'A+' : 'A++'}</Text>
            </View>
          </TouchableOpacity>
          <Divider />
          <View style={styles.menuItem}>
            <View style={[styles.menuIconCircle, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="information-circle-outline" size={20} color="#334155" />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuItemTitle}>System Build</Text>
              <Text style={styles.menuItemSubtitle}>TogetherCare Admin v1.4.0 Production</Text>
            </View>
            <View style={styles.versionBadge}>
              <Text style={styles.versionBadgeText}>STABLE</Text>
            </View>
          </View>
        </View>

        {/* Logout Action */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Sign out of admin account"
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Sign Out Administrator</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Confirmation Modal */}
      <LogoutModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        isLoggingOut={isLoggingOut}
      />
    </View>
  );
}

function SettingsMenuItem({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  badge,
  badgeColor,
  onPress,
  highlight,
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, highlight && styles.menuItemHighlight]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={[styles.menuIconCircle, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.menuTextWrap}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[styles.menuItemTitle, highlight && styles.highlightTitle]}>
            {title}
          </Text>
          {badge && (
            <View style={[styles.itemBadge, { backgroundColor: `${badgeColor}18` }]}>
              <Text style={[styles.itemBadgeText, { color: badgeColor }]}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarSection: {
    marginRight: 14,
  },
  avatarImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#1E40AF',
  },
  avatarPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  profileDetails: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  adminEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  roleBadgeText: {
    color: '#1E40AF',
    fontSize: 10,
    fontWeight: '800',
  },
  idBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  idBadgeText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
  },
  editProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 6,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  menuItemHighlight: {
    backgroundColor: '#FAFAFF',
  },
  menuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextWrap: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  highlightTitle: {
    color: '#1E40AF',
  },
  menuItemSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  itemBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itemBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  scaleBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  scaleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E40AF',
  },
  versionBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  versionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 66,
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
});
