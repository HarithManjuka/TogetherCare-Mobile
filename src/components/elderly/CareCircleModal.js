// src/components/elderly/CareCircleModal.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Switch,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import * as emergencyService from '../../services/emergencyService';

const RELATION_OPTIONS = [
  'Daughter',
  'Son',
  'Spouse',
  'Neighbor',
  'Doctor',
  'Caregiver',
  'Family Member',
  'Friend',
];

export default function CareCircleModal({
  visible,
  onClose,
  scale = 1.0,
  onContactsUpdated,
}) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form modal state (Add / Edit)
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('Daughter');
  const [customRelation, setCustomRelation] = useState('');
  const [phone, setPhone] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [notes, setNotes] = useState('');

  const fetchContacts = async () => {
    try {
      const res = await emergencyService.getCareCircle();
      if (res?.data) {
        setContacts(res.data);
        if (onContactsUpdated) {
          onContactsUpdated(res.data);
        }
      }
    } catch (err) {
      console.error('Fetch Care Circle Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchContacts();
    }
  }, [visible]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchContacts();
  };

  const openAddForm = () => {
    setEditingId(null);
    setName('');
    setRelation('Daughter');
    setCustomRelation('');
    setPhone('');
    setIsPrimary(contacts.length === 0);
    setNotes('');
    setFormVisible(true);
  };

  const openEditForm = (item) => {
    setEditingId(item._id);
    setName(item.name || '');
    if (RELATION_OPTIONS.includes(item.relation)) {
      setRelation(item.relation);
      setCustomRelation('');
    } else {
      setRelation('Other');
      setCustomRelation(item.relation || '');
    }
    setPhone(item.phone || '');
    setIsPrimary(!!item.isPrimary);
    setNotes(item.notes || '');
    setFormVisible(true);
  };

  const handleSaveContact = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter the contact name.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Missing Phone', 'Please enter a valid phone number.');
      return;
    }

    const finalRelation = relation === 'Other' ? customRelation.trim() || 'Family Member' : relation;
    const payload = {
      name: name.trim(),
      relation: finalRelation,
      phone: phone.trim(),
      isPrimary,
      notes: notes.trim(),
    };

    setSubmitting(true);
    try {
      if (editingId) {
        await emergencyService.updateCareCircleContact(editingId, payload);
        Alert.alert('Success', 'Contact updated successfully.');
      } else {
        await emergencyService.addCareCircleContact(payload);
        Alert.alert('Success', `${payload.name} added to your Care Circle.`);
      }
      setFormVisible(false);
      fetchContacts();
    } catch (err) {
      console.error('Save Care Circle Contact Error:', err);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save contact.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContact = (contact) => {
    Alert.alert(
      'Remove Contact?',
      `Are you sure you want to remove ${contact.name} from your Care Circle?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await emergencyService.deleteCareCircleContact(contact._id);
              fetchContacts();
            } catch (err) {
              console.error('Delete Contact Error:', err);
              Alert.alert('Error', 'Failed to remove contact.');
            }
          },
        },
      ]
    );
  };

  const handleSetPrimary = async (contact) => {
    try {
      await emergencyService.setPrimaryCareCircleContact(contact._id);
      fetchContacts();
      Alert.alert('Primary Updated', `${contact.name} is now your primary emergency contact.`);
    } catch (err) {
      console.error('Set Primary Error:', err);
      Alert.alert('Error', 'Failed to update primary contact.');
    }
  };

  const handleCall = (phoneNumber) => {
    if (!phoneNumber) return;
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    const url = `tel:${cleanNumber}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Calling Failed', `Please dial ${cleanNumber} directly.`);
    });
  };

  const handleSMS = (phoneNumber, contactName) => {
    if (!phoneNumber) return;
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    const body = `Hi ${contactName}, I am reaching out through TogetherCare.`;
    const smsUrl = Platform.select({
      ios: `sms:${cleanNumber}&body=${encodeURIComponent(body)}`,
      android: `sms:${cleanNumber}?body=${encodeURIComponent(body)}`,
      default: `sms:${cleanNumber}?body=${encodeURIComponent(body)}`,
    });
    Linking.openURL(smsUrl).catch(() => {
      Alert.alert('SMS Failed', `Please message ${cleanNumber} directly.`);
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.headerIconCircle}>
                <Ionicons name="people" size={22} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.headerTitle}>My Care Circle</Text>
                <Text style={styles.headerSub}>Emergency Contacts & Family</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Add Contact Button */}
          <TouchableOpacity
            style={styles.addBtn}
            onPress={openAddForm}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add Emergency Contact</Text>
          </TouchableOpacity>

          {/* Contact List */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
            }
          >
            {loading && !refreshing ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading Care Circle...</Text>
              </View>
            ) : contacts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="person-add-outline" size={48} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Emergency Contacts Added</Text>
                <Text style={styles.emptySub}>
                  Add family members, neighbors, or caregivers so you can reach them in 1 tap during an emergency.
                </Text>
                <TouchableOpacity style={styles.emptyAddBtn} onPress={openAddForm}>
                  <Text style={styles.emptyAddBtnText}>+ Add Contact Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              contacts.map((item) => (
                <View
                  key={item._id}
                  style={[styles.contactCard, item.isPrimary && styles.contactCardPrimary]}
                >
                  <View style={styles.contactTopRow}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarInitials}>
                        {item.name ? item.name[0].toUpperCase() : 'C'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.contactName}>{item.name}</Text>
                        {item.isPrimary && (
                          <View style={styles.primaryPill}>
                            <Ionicons name="star" size={10} color="#B45309" />
                            <Text style={styles.primaryPillText}>PRIMARY</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.contactRelation}>{item.relation} • {item.phone}</Text>
                      {item.notes ? <Text style={styles.contactNotes}>📝 {item.notes}</Text> : null}
                    </View>

                    {/* Edit & Delete Actions */}
                    <View style={styles.rowActions}>
                      <TouchableOpacity onPress={() => openEditForm(item)} style={styles.iconBtn}>
                        <Ionicons name="create-outline" size={18} color="#475569" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteContact(item)} style={styles.iconBtn}>
                        <Ionicons name="trash-outline" size={18} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* 1-Tap Call, SMS & Set Primary */}
                  <View style={styles.contactBottomRow}>
                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() => handleCall(item.phone)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="call" size={15} color="#FFFFFF" />
                      <Text style={styles.btnActionText}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.smsBtn}
                      onPress={() => handleSMS(item.phone, item.name)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="chatbubble" size={15} color="#FFFFFF" />
                      <Text style={styles.btnActionText}>SMS</Text>
                    </TouchableOpacity>

                    {!item.isPrimary && (
                      <TouchableOpacity
                        style={styles.makePrimaryBtn}
                        onPress={() => handleSetPrimary(item)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="star-outline" size={14} color="#1E40AF" />
                        <Text style={styles.makePrimaryText}>Make Primary</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Footer Done Button */}
          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ADD / EDIT CONTACT MODAL */}
      <Modal
        visible={formVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFormVisible(false)}
      >
        <View style={styles.formOverlay}>
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {editingId ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
              </Text>
              <TouchableOpacity onPress={() => setFormVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Name */}
              <Text style={styles.inputLabel}>Contact Full Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Kasun Perera"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />

              {/* Relationship */}
              <Text style={styles.inputLabel}>Relationship</Text>
              <View style={styles.pillContainer}>
                {RELATION_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.relPill, relation === opt && styles.relPillActive]}
                    onPress={() => setRelation(opt)}
                  >
                    <Text style={[styles.relPillText, relation === opt && styles.relPillTextActive]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {relation === 'Other' && (
                <TextInput
                  style={[styles.textInput, { marginTop: 8 }]}
                  placeholder="Specify relationship (e.g. Cousin)"
                  placeholderTextColor="#94A3B8"
                  value={customRelation}
                  onChangeText={setCustomRelation}
                />
              )}

              {/* Phone */}
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 0771234567"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              {/* Notes */}
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, { height: 60 }]}
                placeholder="e.g. Lives nearby, key holder"
                placeholderTextColor="#94A3B8"
                multiline
                value={notes}
                onChangeText={setNotes}
              />

              {/* Primary Switch */}
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Set as Primary Emergency Contact</Text>
                  <Text style={styles.switchSub}>Dialed first during Emergency SOS</Text>
                </View>
                <Switch
                  value={isPrimary}
                  onValueChange={setIsPrimary}
                  trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                  thumbColor={isPrimary ? '#1E40AF' : '#F1F5F9'}
                />
              </View>

              {/* Submit Buttons */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSaveContact}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {editingId ? 'Update Contact' : 'Save Emergency Contact'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
  },
  closeBtn: {
    padding: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 14,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollList: {
    maxHeight: 380,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 8,
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  emptyBox: {
    paddingVertical: 36,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  emptyAddBtn: {
    marginTop: 16,
    backgroundColor: '#EEF2FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  emptyAddBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  contactCardPrimary: {
    borderColor: '#93C5FD',
    backgroundColor: '#F8FAFC',
  },
  contactTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  avatarInitials: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  primaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  primaryPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
  },
  contactRelation: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  contactNotes: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    padding: 6,
  },
  contactBottomRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16A34A',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  smsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  btnActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  makePrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  makePrimaryText: {
    color: '#1E40AF',
    fontSize: 11,
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  formOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  formCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  relPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  relPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  relPillText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  relPillTextActive: {
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  switchSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
