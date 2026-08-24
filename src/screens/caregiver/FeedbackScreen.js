// src/screens/caregiver/FeedbackScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import client from '../../api/client';
import { COLORS, SIZES } from '../../constants/theme';

export default function FeedbackScreen({ requestId, onBack, onSubmitSuccess }) {
  const [request, setRequest] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      try {
        const res = await client.get(`/help-requests/${requestId}`);
        if (res.data?.success) {
          setRequest(res.data.data);
        }
      } catch (error) {
        console.error('Fetch Feedback Request Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequestDetails();
  }, [requestId]);

  const handleSubmit = async () => {
    if (!rating || rating < 1 || rating > 5) {
      Alert.alert('Selection Required', 'Please select a rating (1-5 stars).');
      return;
    }

    try {
      setSubmitting(true);
      const res = await client.post(`/help-requests/${requestId}/feedback`, {
        rating,
        feedback: feedback.trim(),
      });

      if (res.data?.success) {
        Alert.alert('Thank you! 💖', 'Your feedback builds intergenerational trust in our locality.');
        onSubmitSuccess();
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Feedback Submit Error:', error);
      Alert.alert('Error', 'Server error while submitting rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text style={styles.loadingText}>Loading review form...</Text>
      </View>
    );
  }

  const volunteerName = request?.volunteerId
    ? `${request.volunteerId.firstName} ${request.volunteerId.lastName || ''}`.trim()
    : 'Volunteer';

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-back-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rate Visit</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.reviewPromptBox}>
            <Icon name="ribbon-outline" size={48} color={COLORS.secondary} style={{ marginBottom: 12 }} />
            <Text style={styles.mainPrompt}>How was the visit?</Text>
            <Text style={styles.subPrompt}>
              Your feedback for {volunteerName} helps ensure caregiver security and volunteer quality.
            </Text>
          </View>

          {/* Star selector */}
          <Text style={styles.label}>Rate Volunteer</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => {
              const isSelected = star <= rating;
              return (
                <TouchableOpacity
                  key={star}
                  style={styles.starTouch}
                  onPress={() => setRating(star)}
                >
                  <Icon
                    name={isSelected ? 'star' : 'star-outline'}
                    size={40}
                    color={isSelected ? '#F59E0B' : '#CBD5E1'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.ratingDescriptor}>
            {rating === 5
              ? 'Excellent - Volunteer went above and beyond!'
              : rating === 4
              ? 'Great - Volunteer was friendly and reliable.'
              : rating === 3
              ? 'Good - The visit met expectations.'
              : rating === 2
              ? 'Fair - Minor issues during visit.'
              : 'Poor - Very unsatisfied with the service.'}
          </Text>

          {/* Feedback comments */}
          <Text style={styles.label}>Add Comments (Optional)</Text>
          <TextInput
            style={styles.feedbackInput}
            value={feedback}
            onChangeText={setFeedback}
            placeholder="Share details about the visit or specific things they did well..."
            multiline
            numberOfLines={4}
          />

          {/* Submit button */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.disabledBtn]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Submit & Complete</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: COLORS.textSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
  scrollContainer: { padding: 20, alignItems: 'center', paddingBottom: 60 },
  reviewPromptBox: { alignItems: 'center', marginVertical: 15, paddingHorizontal: 10 },
  mainPrompt: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary },
  subPrompt: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, alignSelf: 'flex-start', marginTop: 25, marginBottom: 10 },
  starsContainer: { flexDirection: 'row', gap: 8, marginVertical: 10 },
  starTouch: { padding: 4 },
  ratingDescriptor: { fontSize: 13, fontWeight: '600', color: COLORS.secondary, marginTop: 4, textAlign: 'center' },
  feedbackInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
    backgroundColor: '#F8FAFC',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: COLORS.secondary,
    width: '100%',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 35,
    height: SIZES.standardButtonHeight,
  },
  disabledBtn: { opacity: 0.6 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
