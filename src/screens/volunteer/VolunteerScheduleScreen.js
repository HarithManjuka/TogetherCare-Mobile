// src/screens/volunteer/VolunteerScheduleScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function VolunteerScheduleScreen({ onNavigateTab }) {
  const [selectedDay, setSelectedDay] = useState('Today');
  const [tasks, setTasks] = useState([
    {
      id: 'sch-1',
      day: 'Today',
      time: '10:30 AM - 11:15 AM',
      taskType: 'Grocery pickup & Delivery',
      elderName: 'Mrs. Perera',
      address: 'No. 42, Galle Road, Colombo 03',
      phone: '077 123 4567',
      status: 'pending', // 'pending' | 'completed'
      urgency: 'High',
    },
    {
      id: 'sch-2',
      day: 'Today',
      time: '03:00 PM - 03:45 PM',
      taskType: 'Pharmacy Medicine Drop',
      elderName: 'Mr. Fernando',
      address: 'No. 88, Duplication Road, Colombo 04',
      phone: '075 555 1234',
      status: 'pending',
      urgency: 'Medium',
    },
    {
      id: 'sch-3',
      day: 'Tomorrow',
      time: '09:00 AM - 10:30 AM',
      taskType: 'Morning Walk & Companionship',
      elderName: 'Mrs. Jayasinghe',
      address: 'No. 105, Havelock Road, Colombo 05',
      phone: '076 333 4444',
      status: 'pending',
      urgency: 'Normal',
    },
    {
      id: 'sch-4',
      day: 'Thursday',
      time: '02:00 PM - 04:00 PM',
      taskType: 'Clinic Escort & Wheelchair Assist',
      elderName: 'Mr. De Silva',
      address: 'No. 7, Ward Place, Colombo 07',
      phone: '078 888 9999',
      status: 'pending',
      urgency: 'High',
    },
  ]);

  const days = ['Today', 'Tomorrow', 'Thursday', 'Friday', 'Saturday'];

  const filteredTasks = tasks.filter((t) => t.day === selectedDay);

  const handleMarkCompleted = (taskId) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'completed' } : t))
    );
    Alert.alert(
      '🎉 Task Completed!',
      'Great job! 1.5 hours have been logged toward your monthly volunteer total.',
      [
        { text: 'OK' },
        { text: 'View History', onPress: () => onNavigateTab('history') },
      ]
    );
  };

  const handleCall = (name, phone) => {
    Alert.alert(`Call ${name}`, `Initiating call to ${phone}...`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Schedule</Text>
        <Text style={styles.headerSubtitle}>
          Upcoming volunteer commitments & visits
        </Text>
      </View>

      {/* Days Filter Strip */}
      <View style={styles.dayStripContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayStrip}
        >
          {days.map((day) => {
            const isSelected = selectedDay === day;
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayCard, isSelected && styles.dayCardActive]}
                onPress={() => setSelectedDay(day)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.dayTextActive,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {selectedDay === 'Today' ? "Today's Timeline" : `${selectedDay}'s Commitments`}
          </Text>
          <Text style={styles.taskCountBadge}>
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
          </Text>
        </View>

        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No visits scheduled for {selectedDay}</Text>
            <Text style={styles.emptySubtitle}>
              You can accept nearby requests from the Requests tab anytime.
            </Text>
            <TouchableOpacity
              style={styles.browseRequestsBtn}
              onPress={() => onNavigateTab('request')}
            >
              <Text style={styles.browseRequestsBtnText}>Browse Available Requests</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredTasks.map((item) => {
            const isCompleted = item.status === 'completed';
            return (
              <View
                key={item.id}
                style={[
                  styles.timelineCard,
                  isCompleted && styles.timelineCardCompleted,
                ]}
              >
                {/* Time & urgency */}
                <View style={styles.cardHeader}>
                  <View style={styles.timeBadge}>
                    <Ionicons name="time-outline" size={15} color="#1E40AF" />
                    <Text style={styles.timeText}>{item.time}</Text>
                  </View>
                  <View
                    style={[
                      styles.urgencyPill,
                      item.urgency === 'High' ? styles.urgencyHigh : styles.urgencyNormal,
                    ]}
                  >
                    <Text
                      style={[
                        styles.urgencyText,
                        item.urgency === 'High'
                          ? styles.urgencyTextHigh
                          : styles.urgencyTextNormal,
                      ]}
                    >
                      {item.urgency} Priority
                    </Text>
                  </View>
                </View>

                {/* Task Details */}
                <Text style={styles.taskTitle}>{item.taskType}</Text>
                <Text style={styles.elderName}>👤 {item.elderName}</Text>
                <Text style={styles.addressText}>📍 {item.address}</Text>

                {/* Actions */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => handleCall(item.elderName, item.phone)}
                  >
                    <Ionicons name="call-outline" size={16} color="#1E40AF" />
                    <Text style={styles.callButtonText}>Call Senior</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.completeButton,
                      isCompleted && styles.completeButtonDone,
                    ]}
                    onPress={() => handleMarkCompleted(item.id)}
                    disabled={isCompleted}
                  >
                    <Ionicons
                      name={isCompleted ? 'checkmark-circle' : 'checkmark-done-outline'}
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text style={styles.completeButtonText}>
                      {isCompleted ? 'Completed' : 'Mark Completed'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  dayStripContainer: {
    marginVertical: 8,
  },
  dayStrip: {
    paddingHorizontal: 20,
    gap: 8,
  },
  dayCard: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  dayCardActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  dayTextActive: {
    color: '#FFFFFF',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  taskCountBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  timelineCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineCardCompleted: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E40AF',
  },
  urgencyPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgencyHigh: {
    backgroundColor: '#FEE2E2',
  },
  urgencyNormal: {
    backgroundColor: '#F1F5F9',
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  urgencyTextHigh: {
    color: '#DC2626',
  },
  urgencyTextNormal: {
    color: '#475569',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  elderName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  callButton: {
    flex: 1,
    height: 40,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  callButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  completeButton: {
    flex: 1.2,
    height: 40,
    backgroundColor: '#1E40AF',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  completeButtonDone: {
    backgroundColor: '#16A34A',
  },
  completeButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  browseRequestsBtn: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseRequestsBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
