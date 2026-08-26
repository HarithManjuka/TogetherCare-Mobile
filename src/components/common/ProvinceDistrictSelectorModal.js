// src/components/common/ProvinceDistrictSelectorModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SRI_LANKA_PROVINCES, SRI_LANKA_DISTRICTS } from '../../constants/locations';

/**
 * Interactive Sri Lanka Province & District Selection Modal
 */
export default function ProvinceDistrictSelectorModal({
  visible,
  currentProvince,
  currentDistrict,
  onConfirm,
  onClose,
}) {
  const [selectedProvince, setSelectedProvince] = useState(currentProvince || 'Western');
  const [selectedDistrict, setSelectedDistrict] = useState(currentDistrict || 'Colombo');

  useEffect(() => {
    if (visible) {
      setSelectedProvince(currentProvince || 'Western');
      setSelectedDistrict(currentDistrict || 'Colombo');
    }
  }, [visible, currentProvince, currentDistrict]);

  if (!visible) return null;

  const handleProvinceSelect = (prov) => {
    setSelectedProvince(prov);
    const districts = SRI_LANKA_DISTRICTS[prov] || [];
    if (districts.length > 0) {
      setSelectedDistrict(districts[0]);
    }
  };

  const handleConfirm = () => {
    onConfirm({ province: selectedProvince, district: selectedDistrict });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalCard}>
              <View style={styles.header}>
                <Ionicons name="map-outline" size={22} color="#1E40AF" style={{ marginRight: 6 }} />
                <Text style={styles.title}>Select Province & District</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                {/* 1. Province Selection */}
                <Text style={styles.sectionTitle}>1. Choose Province</Text>
                <View style={styles.chipGrid}>
                  {SRI_LANKA_PROVINCES.map((prov) => {
                    const isSelected = selectedProvince === prov;
                    return (
                      <TouchableOpacity
                        key={prov}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => handleProvinceSelect(prov)}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {prov}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 2. District Selection */}
                <Text style={styles.sectionTitle}>2. Choose District ({selectedProvince})</Text>
                <View style={styles.chipGrid}>
                  {(SRI_LANKA_DISTRICTS[selectedProvince] || []).map((dist) => {
                    const isSelected = selectedDistrict === dist;
                    return (
                      <TouchableOpacity
                        key={dist}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => setSelectedDistrict(dist)}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {dist}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                  <Text style={styles.confirmBtnText}>Apply Location</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E40AF',
    marginTop: 10,
    marginBottom: 8,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  confirmBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1E40AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
