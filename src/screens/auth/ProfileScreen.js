// src/screens/auth/ProfileScreen.js
import React from 'react';
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
import { COLORS } from '../../constants/theme';
import styles from '../../styles/ProfileScreen.styles';

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
    // Auth actions
    logout,
  } = useProfile();

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
          <Ionicons name="chevron-back" size={22} color="#000000" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.closeButton}
          activeOpacity={0.7}
          onPress={onClose || onBack}
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={26} color="#000000" />
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
                <Ionicons name="person" size={80} color="#000000" />
              </View>
            )}

            {/* Camera / Edit Badge */}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <Text style={styles.userTitle}>
            {user?.firstName ? `Mr.${user.firstName}` : 'Mr.Austin'}
          </Text>
        </View>

        {/* Badges Row: Verified / Pending Shield & Rating */}
        <View style={styles.badgesRow}>
          {/* Verified / Pending Badge */}
          <View style={styles.badgeCol}>
            <View style={styles.badgeIconBox}>
              {isVerified ? (
                <MaterialCommunityIcons name="shield-check" size={46} color="#16A34A" />
              ) : (
                <MaterialCommunityIcons name="shield-alert-outline" size={46} color="#D97706" />
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
              <MaterialCommunityIcons name="star-circle-outline" size={48} color="#000000" />
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
              <MaterialCommunityIcons name="square-edit-outline" size={24} color="#000000" />
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
              <MaterialCommunityIcons name="square-edit-outline" size={24} color="#000000" />
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
                  {renderInterestIcon(interestName, false, 28, '#000000')}
                </View>
                <Text style={styles.interestLabel}>{interestName}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Horizontal Divider 3 */}
        <View style={styles.dividerLine} />

        {/* Account & Preferences Menu */}
        <View style={styles.menuBlock}>
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => {
              Alert.alert('Account', 'Sign out of your account?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: logout },
              ]);
            }}
          >
            <Text style={styles.menuItemText}>Account</Text>
            <Ionicons name="chevron-forward" size={20} color="#000000" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Preferences', 'Notification & App preferences will be available in the next release.')}
          >
            <Text style={styles.menuItemText}>Preferences</Text>
            <Ionicons name="chevron-forward" size={20} color="#000000" />
          </TouchableOpacity>
        </View>
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
                          {renderInterestIcon(item.name, isSelected, 18)}
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
