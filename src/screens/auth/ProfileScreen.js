// src/screens/auth/ProfileScreen.js
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useProfile } from '../../hooks/useProfile';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/theme';
import { getProfileScreenStyles } from '../../styles/ProfileScreen.styles';

export default function ProfileScreen({ onBack, onClose }) {
  const {
    user,
    userDisplayName,
    userCity,
    userAgeDisplay,
    isVerified,
    refreshing,
    uploadingImage,
    onRefresh,
    // Profile photo modal & actions
    showImageActionsModal,
    setShowImageActionsModal,
    handlePickImage,
    handleDeleteImage,
    // Personal Details modal & actions
    showEditModal,
    setShowEditModal,
    editFirstName,
    setEditFirstName,
    editLastName,
    setEditLastName,
    editPhone,
    setEditPhone,
    editAge,
    setEditAge,
    editAddress,
    setEditAddress,
    updatingDetails,
    openEditModal,
    handleSavePersonalDetails,
    // Interests modal & actions
    showInterestsModal,
    setShowInterestsModal,
    selectedInterests,
    dbInterests,
    loadingInterests,
    updatingInterests,
    toggleInterestSelection,
    handleSaveInterests,
    renderInterestIcon,
    // Navigation & Session actions
    handleVerifyAccountPress,
    handleLogout,
  } = useProfile();

  const {
    sizeMode,
    setSizeMode,
    scale,
    isLarge,
    availableDisplaySizes = [],
  } = useTheme();

  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);

  const styles = useMemo(() => getProfileScreenStyles(scale), [scale]);

  // Current size object
  const currentSizeObj =
    availableDisplaySizes.find((s) => s.code === sizeMode) || {
      code: 'standard',
      label: 'Standard',
      sublabel: '100% Regular scale',
    };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Top Header with Circular Back & Close buttons */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.circleButton}
          activeOpacity={0.7}
          onPress={onBack || onClose}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={Math.round(22 * scale)} color="#000000" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.closeButton}
          activeOpacity={0.7}
          onPress={onClose || onBack}
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={Math.round(26 * scale)} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Avatar & Display Name */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            activeOpacity={0.85}
            onPress={() => setShowImageActionsModal(true)}
          >
            {uploadingImage ? (
              <View style={styles.avatarPlaceholder}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : user?.profilePicture ? (
              <Image
                source={{ uri: user.profilePicture }}
                style={styles.avatarImage}
                key={user.profilePicture}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={Math.round(80 * scale)} color="#000000" />
              </View>
            )}

            {/* Camera / Edit Badge */}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={Math.round(16 * scale)} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <Text style={styles.userTitle}>
            {user?.firstName ? `Mr.${user.firstName}` : 'Mr.Austin'}
          </Text>

          {/* User Role Display Tag under Name */}
          <View style={styles.roleContainer}>
            <View style={styles.roleBadge}>
              <Ionicons
                name={
                  user?.role === 'volunteer'
                    ? 'hand-left-outline'
                    : user?.role === 'caregiver'
                    ? 'medkit-outline'
                    : user?.role === 'admin'
                    ? 'shield-outline'
                    : 'heart-circle-outline'
                }
                size={Math.round(14 * scale)}
                color={COLORS.primary}
              />
              <Text style={styles.roleText}>
                {user?.role
                  ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                  : 'Elderly'}
              </Text>
            </View>
          </View>
        </View>

        {/* Badges Row: Verified / Pending Shield & Rating */}
        <View style={styles.badgesRow}>
          {/* Verified / Pending Badge */}
          <View style={styles.badgeCol}>
            <View style={styles.badgeIconBox}>
              {isVerified ? (
                <MaterialCommunityIcons
                  name="shield-check"
                  size={Math.round(46 * scale)}
                  color="#16A34A"
                />
              ) : (
                <MaterialCommunityIcons
                  name="shield-alert-outline"
                  size={Math.round(46 * scale)}
                  color="#D97706"
                />
              )}
            </View>
            <Text
              style={[
                styles.badgeLabel,
                isVerified ? { color: '#16A34A' } : { color: '#D97706' },
              ]}
            >
              {isVerified ? 'Verified' : 'Pending'}
            </Text>
          </View>

          {/* Rating Badge from Review Table in Database */}
          <View style={styles.badgeCol}>
            <View style={styles.badgeIconBox}>
              <MaterialCommunityIcons
                name="star-circle-outline"
                size={Math.round(48 * scale)}
                color="#000000"
              />
            </View>
            <Text style={styles.badgeLabel}>
              {user?.totalReviews && user.totalReviews > 0
                ? `${user.averageRating}★`
                : '0.0★'}
            </Text>
          </View>
        </View>

        {/* Horizontal Divider 1 */}
        <View style={styles.dividerLine} />

        {/* Personal Details Section */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <TouchableOpacity
              style={styles.editIconBtn}
              activeOpacity={0.7}
              onPress={openEditModal}
              accessibilityLabel="Edit Personal Details"
            >
              <MaterialCommunityIcons
                name="square-edit-outline"
                size={Math.round(24 * scale)}
                color="#000000"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.detailsContent}>
            <Text style={styles.detailLine}>
              <Text style={styles.detailBold}>Name - </Text>
              {userDisplayName}
            </Text>

            <Text style={styles.detailLine}>
              <Text style={styles.detailBold}>Mobile - </Text>
              {user?.phone || '07XXXXXXXX'}
            </Text>

            <Text style={styles.detailLine}>
              <Text style={styles.detailBold}>Email - </Text>
              {user?.email || 'user@togethercare.com'}
            </Text>

            <Text style={styles.detailLine}>
              <Text style={styles.detailBold}>Age- </Text>
              {userAgeDisplay}
            </Text>

            <Text style={styles.detailLine}>
              <Text style={styles.detailBold}>Address- </Text>
              {userCity}
            </Text>
          </View>
        </View>

        {/* Horizontal Divider 2 */}
        <View style={styles.dividerLine} />

        {/* Interests Section */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <TouchableOpacity
              style={styles.editIconBtn}
              activeOpacity={0.7}
              onPress={() => setShowInterestsModal(true)}
              accessibilityLabel="Edit Interests"
            >
              <MaterialCommunityIcons
                name="square-edit-outline"
                size={Math.round(24 * scale)}
                color="#000000"
              />
            </TouchableOpacity>
          </View>

          {/* Interests Circles Row */}
          <View style={styles.interestsRow}>
            {(user?.interests && user.interests.length > 0
              ? user.interests
              : ['Play', 'Walk', 'Chat']
            ).map((interestName, idx) => (
              <View key={idx} style={styles.interestItem}>
                <View style={styles.interestCircle}>
                  {renderInterestIcon(interestName, false, Math.round(28 * scale), '#000000')}
                </View>
                <Text style={styles.interestLabel}>{interestName}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Horizontal Divider 3 */}
        <View style={styles.dividerLine} />

        {/* Preferences & Accessibility Section */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Preferences</Text>
          </View>

          <View style={styles.preferencesContainer}>
            {/* Display & Text Size Dropdown Selector */}
            <View style={styles.dropdownCard}>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                activeOpacity={0.8}
                onPress={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
                accessibilityLabel="Select Display & Text Size"
              >
                <View style={styles.dropdownTriggerLeft}>
                  <View style={styles.dropdownIconBox}>
                    <Ionicons name="text-outline" size={Math.round(20 * scale)} color={COLORS.primary} />
                  </View>
                  <View style={styles.dropdownTextWrap}>
                    <Text style={styles.dropdownTitleText}>Display & Text Size</Text>
                    <Text style={styles.dropdownSubtitleText}>
                      {currentSizeObj.label} — {currentSizeObj.sublabel}
                    </Text>
                  </View>
                </View>
                <View style={styles.dropdownChevronBox}>
                  <Ionicons
                    name={isSizeDropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={Math.round(20 * scale)}
                    color={COLORS.textSecondary}
                  />
                </View>
              </TouchableOpacity>

              {/* Display Size Dropdown Menu Items */}
              {isSizeDropdownOpen && (
                <View style={styles.dropdownMenuContainer}>
                  {availableDisplaySizes.map((sizeItem) => {
                    const isSelected = sizeMode === sizeItem.code;
                    return (
                      <TouchableOpacity
                        key={sizeItem.code}
                        style={[
                          styles.dropdownOptionItem,
                          isSelected && styles.dropdownOptionItemActive,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => {
                          setSizeMode(sizeItem.code);
                          setIsSizeDropdownOpen(false);
                        }}
                      >
                        <View style={styles.dropdownOptionLeft}>
                          <Ionicons
                            name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                            size={Math.round(18 * scale)}
                            color={isSelected ? COLORS.primary : '#94A3B8'}
                          />
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextActive,
                            ]}
                          >
                            {sizeItem.label}
                          </Text>
                          <Text
                            style={[
                              styles.dropdownOptionSubtext,
                              isSelected && styles.dropdownOptionSubtextActive,
                            ]}
                          >
                            ({sizeItem.sublabel})
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={Math.round(18 * scale)} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Horizontal Divider 4 */}
        <View style={styles.dividerLine} />

        {/* Verify Account Option (Menu Row) */}
        <View style={styles.menuBlock}>
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={handleVerifyAccountPress}
            accessibilityLabel="Verify Account"
          >
            <Text style={styles.menuItemText}>Verify Account</Text>
            <View style={styles.menuItemIconBox}>
              <Ionicons name="chevron-forward" size={Math.round(22 * scale)} color="#000000" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.85}
          onPress={handleLogout}
          accessibilityRole="button"
          accessibilityLabel="Log Out"
        >
          <Ionicons name="log-out-outline" size={Math.round(22 * scale)} color={COLORS.danger} />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 1. Modal: Image Actions */}
      <Modal
        visible={showImageActionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageActionsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowImageActionsModal(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.sheetTitle}>Profile Photo</Text>

            <TouchableOpacity style={styles.sheetBtn} onPress={() => handlePickImage(true)}>
              <Ionicons name="camera-outline" size={22} color={COLORS.primary} />
              <Text style={styles.sheetBtnText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetBtn} onPress={() => handlePickImage(false)}>
              <Ionicons name="images-outline" size={22} color={COLORS.primary} />
              <Text style={styles.sheetBtnText}>Choose from Gallery</Text>
            </TouchableOpacity>

            {Boolean(user?.profilePicture) && (
              <TouchableOpacity
                style={[styles.sheetBtn, { borderTopWidth: 1, borderTopColor: '#F1F5F9' }]}
                onPress={handleDeleteImage}
              >
                <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
                <Text style={[styles.sheetBtnText, { color: COLORS.danger }]}>
                  Remove Current Photo
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.sheetCancelBtn}
              onPress={() => setShowImageActionsModal(false)}
            >
              <Text style={styles.sheetCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 2. Modal: Edit Personal Details */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Personal Details</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editFirstName}
                  onChangeText={setEditFirstName}
                  placeholder="First Name"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editLastName}
                  onChangeText={setEditLastName}
                  placeholder="Last Name"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Mobile Phone</Text>
                <TextInput
                  style={styles.textInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="07XXXXXXXX"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Age (Years)</Text>
                <TextInput
                  style={styles.textInput}
                  value={editAge}
                  onChangeText={setEditAge}
                  placeholder="70"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Address / City</Text>
                <TextInput
                  style={styles.textInput}
                  value={editAddress}
                  onChangeText={setEditAddress}
                  placeholder="City or Address"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Email Address (Cannot be changed)</Text>
                <View style={[styles.textInput, styles.readOnlyInput]}>
                  <Text style={styles.readOnlyText}>{user?.email || ''}</Text>
                  <Ionicons name="lock-closed" size={16} color="#94A3B8" />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSavePersonalDetails}
                disabled={updatingDetails}
              >
                {updatingDetails ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. Modal: Edit Interests */}
      <Modal
        visible={showInterestsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInterestsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Interests</Text>
              <TouchableOpacity onPress={() => setShowInterestsModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.interestsHint}>
              Select the activities you enjoy to receive tailored companionship requests.
            </Text>

            {loadingInterests ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={{ marginTop: 8, color: COLORS.textSecondary }}>Loading available interests...</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                <View style={styles.interestsGrid}>
                  {dbInterests.map((item) => {
                    const isSelected = selectedInterests.includes(item.name);
                    return (
                      <TouchableOpacity
                        key={item._id || item.name}
                        style={[
                          styles.interestChoicePill,
                          isSelected && styles.interestChoicePillSelected,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => toggleInterestSelection(item.name)}
                      >
                        <View style={styles.pillIconBox}>
                          {renderInterestIcon(item.name, isSelected, Math.round(18 * scale))}
                        </View>
                        <Text
                          style={[
                            styles.interestChoiceText,
                            isSelected && styles.interestChoiceTextSelected,
                          ]}
                        >
                          {item.name}
                        </Text>
                        {isSelected ? (
                          <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowInterestsModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveInterests}
                disabled={updatingInterests}
              >
                {updatingInterests ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Interests</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
