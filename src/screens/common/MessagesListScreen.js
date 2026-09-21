// src/screens/common/MessagesListScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import * as messageService from '../../services/messageService';
import socketService from '../../services/socketService';

export default function MessagesListScreen({ onSelectConversation, onBack }) {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'contacts'
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());

  // Add Contact Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [searchingPhone, setSearchingPhone] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [addingContact, setAddingContact] = useState(false);

  // Initialize socket connection & listeners
  useEffect(() => {
    if (user?._id) {
      socketService.connect(token, user._id);

      const unsubMsg = socketService.onReceiveMessage((newMsg) => {
        // Update conversation list when a message arrives
        fetchConversations(false);
      });

      const unsubStatus = socketService.onStatusChanged(({ userId, status }) => {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          if (status === 'online') next.add(userId);
          else next.delete(userId);
          return next;
        });
      });

      return () => {
        unsubMsg();
        unsubStatus();
      };
    }
  }, [user?._id, token]);

  const fetchConversations = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await messageService.getConversations();
      if (res?.success) {
        setConversations(res.data || []);
      }
    } catch (err) {
      console.error('Fetch Conversations Error:', err);
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchContacts = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await messageService.getContacts();
      if (res?.success) {
        setContacts(res.data || []);
      }
    } catch (err) {
      console.error('Fetch Contacts Error:', err);
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAllData = () => {
    fetchConversations(false);
    fetchContacts(false);
  };

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([fetchConversations(false), fetchContacts(false)]).finally(() => {
      setLoading(false);
    });
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  // Search User by Phone Number
  const handleSearchPhone = async () => {
    setSearchError('');
    setFoundUser(null);
    const cleanPhone = phoneInput.trim();

    if (!cleanPhone || cleanPhone.length < 7) {
      setSearchError('Please enter a valid mobile number (e.g. 0771234567)');
      return;
    }

    try {
      setSearchingPhone(true);
      const res = await messageService.searchContactByPhone(cleanPhone);
      if (res?.success && res.data) {
        setFoundUser(res.data);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || 'No user registered with this mobile number.';
      setSearchError(msg);
    } finally {
      setSearchingPhone(false);
    }
  };

  // Add Contact Handler
  const handleAddContact = async () => {
    if (!foundUser) return;
    try {
      setAddingContact(true);
      const res = await messageService.addContact({
        contactUserId: foundUser._id,
        nickname: nicknameInput.trim(),
      });

      if (res?.success) {
        Alert.alert('Contact Added', `${foundUser.firstName} was added to your contacts!`);
        setAddModalVisible(false);
        setPhoneInput('');
        setNicknameInput('');
        setFoundUser(null);
        fetchContacts(false);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to add contact.';
      Alert.alert('Error', msg);
    } finally {
      setAddingContact(false);
    }
  };

  // Remove Contact Handler
  const handleRemoveContact = (contact) => {
    const doDelete = async () => {
      try {
        await messageService.removeContact(contact._id);
        fetchContacts(false);
      } catch (err) {
        console.error('Delete Contact Error:', err);
        Alert.alert('Error', 'Failed to remove contact.');
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(`Remove ${contact.firstName} from your contacts?`)) {
        doDelete();
      }
      return;
    }

    Alert.alert(
      'Remove Contact?',
      `Are you sure you want to remove ${contact.firstName} from your contacts list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doDelete },
      ]
    );
  };

  // Start Chat directly from search or contact
  const handleStartChatWithUser = (targetUser) => {
    setAddModalVisible(false);
    if (onSelectConversation) {
      onSelectConversation(targetUser);
    }
  };

  // Filtered lists based on search bar
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const name = `${c.otherUser?.firstName || ''} ${c.otherUser?.lastName || ''}`.toLowerCase();
    const phone = (c.otherUser?.phone || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    return name.includes(q) || phone.includes(q);
  });

  const filteredContacts = contacts.filter((c) => {
    if (!searchQuery.trim()) return true;
    const name = `${c.firstName || ''} ${c.lastName || ''} ${c.nickname || ''}`.toLowerCase();
    const phone = (c.phone || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    return name.includes(q) || phone.includes(q);
  });

  const formatMsgTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const totalUnreadCount = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSubtitle}>Real-time coordination & chat</Text>
        </View>

        {/* Add Contact Button */}
        <TouchableOpacity
          style={styles.addContactBtn}
          onPress={() => {
            setSearchError('');
            setFoundUser(null);
            setPhoneInput('');
            setNicknameInput('');
            setAddModalVisible(true);
          }}
        >
          <Ionicons name="person-add" size={18} color="#FFFFFF" />
          <Text style={styles.addContactBtnText}>Add Contact</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search-outline" size={18} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or mobile number..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Segmented Tabs: Chats vs Contacts */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'chats' && styles.tabButtonActive]}
          onPress={() => setActiveTab('chats')}
        >
          <Ionicons
            name="chatbubbles"
            size={18}
            color={activeTab === 'chats' ? COLORS.primary : '#64748B'}
          />
          <Text
            style={[styles.tabButtonText, activeTab === 'chats' && styles.tabButtonTextActive]}
          >
            Chats
          </Text>
          {totalUnreadCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{totalUnreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'contacts' && styles.tabButtonActive]}
          onPress={() => setActiveTab('contacts')}
        >
          <Ionicons
            name="people"
            size={18}
            color={activeTab === 'contacts' ? COLORS.primary : '#64748B'}
          />
          <Text
            style={[styles.tabButtonText, activeTab === 'contacts' && styles.tabButtonTextActive]}
          >
            Contacts ({contacts.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      {loading && !refreshing ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        >
          {/* ================= CHATS TAB ================= */}
          {activeTab === 'chats' && (
            <>
              {filteredConversations.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="chatbubbles-outline" size={54} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>No Conversations Yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Add a contact using their mobile number or select a contact from your Contacts tab to start a real-time chat.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyAddBtn}
                    onPress={() => setAddModalVisible(true)}
                  >
                    <Ionicons name="person-add" size={16} color="#FFFFFF" />
                    <Text style={styles.emptyAddBtnText}>Add Contact with Mobile Number</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                filteredConversations.map((convo) => {
                  const otherUser = convo.otherUser;
                  const lastMsg = convo.lastMessage;
                  const isOnline = onlineUserIds.has(otherUser._id?.toString());
                  const initials = `${otherUser.firstName?.[0] || 'U'}${
                    otherUser.lastName?.[0] || ''
                  }`.toUpperCase();

                  return (
                    <TouchableOpacity
                      key={otherUser._id}
                      style={styles.convoCard}
                      activeOpacity={0.7}
                      onPress={() =>
                        onSelectConversation &&
                        onSelectConversation(otherUser, convo.relatedSenior)
                      }
                    >
                      {/* Avatar */}
                      <View style={styles.avatarWrap}>
                        {otherUser.profilePicture ? (
                          <Image
                            source={{ uri: otherUser.profilePicture }}
                            style={styles.avatarImg}
                          />
                        ) : (
                          <View style={styles.avatarInitialsCircle}>
                            <Text style={styles.avatarInitialsText}>{initials}</Text>
                          </View>
                        )}
                        {/* Online Indicator */}
                        <View
                          style={[
                            styles.onlineDot,
                            { backgroundColor: isOnline ? '#16A34A' : '#94A3B8' },
                          ]}
                        />
                      </View>

                      {/* Details */}
                      <View style={styles.convoDetails}>
                        <View style={styles.convoTopRow}>
                          <Text style={styles.convoName} numberOfLines={1}>
                            {otherUser.firstName} {otherUser.lastName || ''}
                          </Text>
                          <Text style={styles.convoTime}>
                            {formatMsgTime(lastMsg?.createdAt)}
                          </Text>
                        </View>

                        <View style={styles.roleRow}>
                          <View style={styles.rolePill}>
                            <Text style={styles.rolePillText}>
                              {otherUser.role === 'caregiver'
                                ? 'Caregiver'
                                : otherUser.role === 'volunteer'
                                ? 'Volunteer'
                                : 'Senior User'}
                            </Text>
                          </View>
                          {convo.relatedSenior && (
                            <Text style={styles.relatedSeniorText} numberOfLines={1}>
                              • For {convo.relatedSenior.firstName}
                            </Text>
                          )}
                        </View>

                        {/* Last message snippet & unread badge */}
                        <View style={styles.convoBottomRow}>
                          <Text
                            style={[
                              styles.convoLastMsg,
                              convo.unreadCount > 0 && styles.convoLastMsgUnread,
                            ]}
                            numberOfLines={1}
                          >
                            {lastMsg?.messageType === 'voice'
                              ? `🎤 Voice note (${lastMsg?.audioDuration || 3}s)`
                              : lastMsg?.text || 'Tap to chat'}
                          </Text>

                          {convo.unreadCount > 0 && (
                            <View style={styles.unreadBadge}>
                              <Text style={styles.unreadBadgeText}>
                                {convo.unreadCount}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </>
          )}

          {/* ================= CONTACTS TAB ================= */}
          {activeTab === 'contacts' && (
            <>
              {filteredContacts.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="people-outline" size={54} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>No Contacts Found</Text>
                  <Text style={styles.emptySubtitle}>
                    Add family members, caregivers, or volunteers using their Sri Lankan mobile number to chat with them.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyAddBtn}
                    onPress={() => setAddModalVisible(true)}
                  >
                    <Ionicons name="person-add" size={16} color="#FFFFFF" />
                    <Text style={styles.emptyAddBtnText}>+ Add New Contact</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                filteredContacts.map((contact) => {
                  const initials = `${contact.firstName?.[0] || 'U'}${
                    contact.lastName?.[0] || ''
                  }`.toUpperCase();

                  return (
                    <View key={contact._id} style={styles.contactCard}>
                      {/* Avatar */}
                      <View style={styles.avatarWrap}>
                        {contact.profilePicture ? (
                          <Image
                            source={{ uri: contact.profilePicture }}
                            style={styles.avatarImg}
                          />
                        ) : (
                          <View style={styles.avatarInitialsCircle}>
                            <Text style={styles.avatarInitialsText}>{initials}</Text>
                          </View>
                        )}
                      </View>

                      {/* Contact Info */}
                      <View style={styles.contactInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.contactName} numberOfLines={1}>
                            {contact.firstName} {contact.lastName || ''}
                          </Text>
                          {contact.nickname ? (
                            <Text style={styles.nicknameTag}>({contact.nickname})</Text>
                          ) : null}
                        </View>

                        <Text style={styles.contactPhone}>📞 {contact.phone}</Text>

                        <View style={styles.roleRow}>
                          <View style={styles.rolePill}>
                            <Text style={styles.rolePillText}>
                              {contact.role === 'caregiver'
                                ? 'Caregiver'
                                : contact.role === 'volunteer'
                                ? 'Volunteer'
                                : 'Senior User'}
                            </Text>
                          </View>
                          {contact.isLinkedDependent && (
                            <View style={[styles.rolePill, { backgroundColor: '#FEF3C7' }]}>
                              <Text style={[styles.rolePillText, { color: '#B45309' }]}>
                                Dependent
                              </Text>
                            </View>
                          )}
                          {contact.isLinkedCaregiver && (
                            <View style={[styles.rolePill, { backgroundColor: '#E0E7FF' }]}>
                              <Text style={[styles.rolePillText, { color: '#3730A3' }]}>
                                My Caregiver
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Actions: Chat & Remove */}
                      <View style={styles.contactActions}>
                        <TouchableOpacity
                          style={styles.chatActionBtn}
                          onPress={() => handleStartChatWithUser(contact)}
                        >
                          <Ionicons name="chatbubble-ellipses" size={16} color="#FFFFFF" />
                          <Text style={styles.chatActionBtnText}>Chat</Text>
                        </TouchableOpacity>

                        {contact.isSavedContact && (
                          <TouchableOpacity
                            style={styles.removeContactBtn}
                            onPress={() => handleRemoveContact(contact)}
                          >
                            <Ionicons name="trash-outline" size={16} color="#DC2626" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* ================= ADD CONTACT MODAL ================= */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.modalIconCircle}>
                  <Ionicons name="person-add" size={20} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Add New Contact</Text>
                  <Text style={styles.modalSubtitle}>Connect using mobile number</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Sri Lankan Mobile Number *</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.phonePrefixBox}>
                  <Text style={styles.phonePrefixText}>🇱🇰 +94</Text>
                </View>
                <TextInput
                  style={styles.phoneTextInput}
                  placeholder="e.g. 077 123 4567"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={phoneInput}
                  onChangeText={(val) => {
                    setPhoneInput(val);
                    setFoundUser(null);
                    setSearchError('');
                  }}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.searchUserBtn,
                  (!phoneInput.trim() || searchingPhone) && styles.btnDisabled,
                ]}
                onPress={handleSearchPhone}
                disabled={!phoneInput.trim() || searchingPhone}
              >
                {searchingPhone ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="search" size={16} color="#FFFFFF" />
                    <Text style={styles.searchUserBtnText}>Find User</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Search Error */}
              {Boolean(searchError) && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#DC2626" />
                  <Text style={styles.errorText}>{searchError}</Text>
                </View>
              )}

              {/* Found User Profile Card */}
              {foundUser && (
                <View style={styles.foundUserCard}>
                  <View style={styles.foundUserHeader}>
                    <View style={styles.foundUserAvatar}>
                      <Text style={styles.foundUserInitials}>
                        {foundUser.firstName?.[0]?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.foundUserName}>
                        {foundUser.firstName} {foundUser.lastName || ''}
                      </Text>
                      <Text style={styles.foundUserPhone}>📞 {foundUser.phone}</Text>
                      <View style={styles.rolePill}>
                        <Text style={styles.rolePillText}>
                          {foundUser.role === 'caregiver'
                            ? 'Caregiver'
                            : foundUser.role === 'volunteer'
                            ? 'Volunteer'
                            : 'Senior User'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Nickname Input */}
                  <Text style={styles.nicknameLabel}>Nickname / Relation (Optional)</Text>
                  <TextInput
                    style={styles.nicknameInput}
                    placeholder="e.g. Sister, Primary Caregiver, Volunteer Dan"
                    placeholderTextColor="#94A3B8"
                    value={nicknameInput}
                    onChangeText={setNicknameInput}
                  />

                  {/* Add & Chat Action Buttons */}
                  <View style={styles.foundActionsRow}>
                    <TouchableOpacity
                      style={styles.saveContactBtn}
                      onPress={handleAddContact}
                      disabled={addingContact}
                    >
                      {addingContact ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="person-add" size={16} color="#FFFFFF" />
                          <Text style={styles.saveContactBtnText}>Save Contact</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.chatNowBtn}
                      onPress={() => handleStartChatWithUser(foundUser)}
                    >
                      <Ionicons name="chatbubbles" size={16} color={COLORS.primary} />
                      <Text style={styles.chatNowBtnText}>Chat Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setAddModalVisible(false)}
            >
              <Text style={styles.modalCancelBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  addContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  addContactBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#EFF6FF',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  tabBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 13,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 18,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  // Conversation Card
  convoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarInitialsCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  avatarInitialsText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  convoDetails: {
    flex: 1,
  },
  convoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convoName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  convoTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  rolePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  relatedSeniorText: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
  },
  convoBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  convoLastMsg: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
    marginRight: 8,
  },
  convoLastMsgUnread: {
    color: '#0F172A',
    fontWeight: '700',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  // Contact Card
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  nicknameTag: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  contactPhone: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.secondary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  chatActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  removeContactBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },
  // Add Contact Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  modalIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  phonePrefixBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  phonePrefixText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  phoneTextInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
  },
  searchUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 11,
    borderRadius: 12,
    marginBottom: 10,
  },
  searchUserBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  foundUserCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    marginTop: 6,
    marginBottom: 14,
  },
  foundUserHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  foundUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  foundUserInitials: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
  },
  foundUserName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  foundUserPhone: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  nicknameLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: 12,
    marginBottom: 4,
  },
  nicknameInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 12,
  },
  foundActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  saveContactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveContactBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  chatNowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 10,
    borderRadius: 10,
  },
  chatNowBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  modalCancelBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
});
