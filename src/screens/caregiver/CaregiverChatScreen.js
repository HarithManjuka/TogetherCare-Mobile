// src/screens/caregiver/CaregiverChatScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import * as messageService from '../../services/messageService';
import socketService from '../../services/socketService';

export default function CaregiverChatScreen({ otherUser, relatedSenior, onBack }) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);

  // Voice recording states (US-411)
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [playingMessageId, setPlayingMessageId] = useState(null);

  const timerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const scrollViewRef = useRef(null);

  const fetchThread = async (markRead = true) => {
    try {
      if (!otherUser?._id) return;
      const res = await messageService.getMessages(otherUser._id);
      if (res?.success) {
        setMessages(res.data || []);
      }
    } catch (err) {
      console.error('Fetch Messages Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Socket setup & real-time listeners
  useEffect(() => {
    if (!otherUser?._id || !user?._id) return;

    // Connect socket
    socketService.connect(token, user._id);
    socketService.joinThread(otherUser._id);

    // Initial fetch
    fetchThread();

    // Check if other user is online
    socketService.checkOnline(otherUser._id, ({ isOnline }) => {
      setIsOtherUserOnline(!!isOnline);
    });

    // 1. Listen for real-time incoming messages
    const unsubMsg = socketService.onReceiveMessage((newMsg) => {
      const isFromOther =
        newMsg.sender?._id?.toString() === otherUser._id?.toString() ||
        newMsg.sender?.toString() === otherUser._id?.toString();
      const isFromMe =
        newMsg.sender?._id?.toString() === user._id?.toString() ||
        newMsg.sender?.toString() === user._id?.toString();
      const isToOther =
        newMsg.recipient?._id?.toString() === otherUser._id?.toString() ||
        newMsg.recipient?.toString() === otherUser._id?.toString();

      if ((isFromOther && isToOther) || (isFromMe && isToOther) || (isFromOther && !isFromMe)) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m._id?.toString() === newMsg._id?.toString())) {
            return prev;
          }
          return [...prev, newMsg];
        });

        // Mark as read in real time
        if (isFromOther) {
          socketService.sendReadThread(otherUser._id);
        }
      }
    });

    // 2. Listen for typing indicators
    const unsubTyping = socketService.onUserTyping(({ senderId, isTyping }) => {
      if (senderId?.toString() === otherUser._id?.toString()) {
        setIsOtherUserTyping(!!isTyping);
      }
    });

    // 3. Listen for read receipts
    const unsubRead = socketService.onMessagesRead(({ readBy }) => {
      if (readBy?.toString() === otherUser._id?.toString()) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.sender?._id?.toString() === user._id?.toString()) {
              return { ...m, isRead: true };
            }
            return m;
          })
        );
      }
    });

    // 4. Listen for user online status changes
    const unsubStatus = socketService.onStatusChanged(({ userId, status }) => {
      if (userId?.toString() === otherUser._id?.toString()) {
        setIsOtherUserOnline(status === 'online');
      }
    });

    // Background safety poll (10 seconds) in case of socket reconnection
    const interval = setInterval(() => {
      fetchThread(false);
    }, 10000);

    return () => {
      socketService.leaveThread(otherUser._id);
      unsubMsg();
      unsubTyping();
      unsubRead();
      unsubStatus();
      clearInterval(interval);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [otherUser?._id, user?._id]);

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  // Voice recording timer (US-411)
  useEffect(() => {
    if (isRecording) {
      setRecordDuration(0);
      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Handle typing indicator emission
  const handleInputChange = (text) => {
    setInputText(text);

    if (otherUser?._id) {
      socketService.sendTyping(otherUser._id, true);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketService.sendTyping(otherUser._id, false);
      }, 2000);
    }
  };

  const handleSendText = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText.trim();
    setInputText('');

    if (otherUser?._id) {
      socketService.sendTyping(otherUser._id, false);
    }

    try {
      setSending(true);
      const res = await messageService.sendMessage({
        recipientId: otherUser._id,
        relatedSeniorId: relatedSenior?._id || null,
        messageType: 'text',
        text: textToSend,
      });

      if (res?.success) {
        setMessages((prev) => {
          if (prev.some((m) => m._id?.toString() === res.data?._id?.toString())) {
            return prev;
          }
          return [...prev, res.data];
        });
      }
    } catch (err) {
      console.error('Send Text Error:', err);
      Alert.alert('Error', 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleCancelRecording = () => {
    setIsRecording(false);
    setRecordDuration(0);
  };

  const handleSendVoiceMessage = async () => {
    const duration = recordDuration || 3;
    setIsRecording(false);

    try {
      setSending(true);
      const res = await messageService.sendMessage({
        recipientId: otherUser._id,
        relatedSeniorId: relatedSenior?._id || null,
        messageType: 'voice',
        text: `🎤 Voice note (${duration}s)`,
        audioUrl: 'https://togethercare.app/audio/memo-sample.mp3',
        audioDuration: duration,
      });

      if (res?.success) {
        setMessages((prev) => {
          if (prev.some((m) => m._id?.toString() === res.data?._id?.toString())) {
            return prev;
          }
          return [...prev, res.data];
        });
      }
    } catch (err) {
      console.error('Send Voice Error:', err);
      Alert.alert('Error', 'Failed to send voice message.');
    } finally {
      setSending(false);
    }
  };

  const handleTogglePlayVoice = (msgId) => {
    if (playingMessageId === msgId) {
      setPlayingMessageId(null);
    } else {
      setPlayingMessageId(msgId);
      setTimeout(() => {
        setPlayingMessageId(null);
      }, 3500);
    }
  };

  const handleCallUser = () => {
    const phone = otherUser?.phone;
    if (phone) {
      const cleanNumber = phone.replace(/[^0-9+]/g, '');
      Linking.openURL(`tel:${cleanNumber}`).catch(() => {
        Alert.alert('Simulating Call', `Calling ${otherUser.firstName} at ${phone}...`);
      });
    } else {
      Alert.alert('Notice', 'No phone number available for this user.');
    }
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatMsgTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.headerName}>
              {otherUser?.firstName} {otherUser?.lastName || ''}
            </Text>
            <View
              style={[
                styles.headerOnlineDot,
                { backgroundColor: isOtherUserOnline ? '#16A34A' : '#94A3B8' },
              ]}
            />
          </View>

          {isOtherUserTyping ? (
            <Text style={styles.typingText}>typing...</Text>
          ) : (
            <Text style={styles.headerRole}>
              {otherUser?.role === 'caregiver'
                ? 'Caregiver'
                : otherUser?.role === 'volunteer'
                ? 'Volunteer'
                : 'Senior User'}
              {relatedSenior ? ` • For ${relatedSenior.firstName}` : ''}
              {isOtherUserOnline ? ' • Online' : ''}
            </Text>
          )}
        </View>

        <TouchableOpacity style={styles.callBtn} onPress={handleCallUser}>
          <Icon name="call" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        {/* Messages List */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.secondary} />
            <Text style={styles.loadingText}>Loading conversation...</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.messagesScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.securityPill}>
              <Icon name="lock-closed" size={12} color="#64748B" />
              <Text style={styles.securityText}>
                End-to-end coordinated care messaging (US-403)
              </Text>
            </View>

            {messages.length === 0 ? (
              <View style={styles.emptyBox}>
                <Icon name="chatbubbles-outline" size={44} color="#94A3B8" />
                <Text style={styles.emptyText}>No messages yet.</Text>
                <Text style={styles.emptySub}>
                  Send a text message or a voice note (US-411) to begin coordination.
                </Text>
              </View>
            ) : (
              messages.map((msg) => {
                const senderIdStr = msg.sender?._id?.toString() || msg.sender?.toString();
                const myIdStr = user?._id?.toString();
                const isMine = senderIdStr === myIdStr;
                const isVoice = msg.messageType === 'voice';
                const isPlaying = playingMessageId === msg._id;

                return (
                  <View
                    key={msg._id}
                    style={[
                      styles.msgWrapper,
                      isMine ? styles.myMsgWrapper : styles.theirMsgWrapper,
                    ]}
                  >
                    <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
                      {isVoice ? (
                        /* Voice Message Bubble (US-411) */
                        <View style={styles.voiceBubbleRow}>
                          <TouchableOpacity
                            style={[
                              styles.playBtn,
                              isMine ? styles.myPlayBtn : styles.theirPlayBtn,
                            ]}
                            onPress={() => handleTogglePlayVoice(msg._id)}
                          >
                            <Icon
                              name={isPlaying ? 'pause' : 'play'}
                              size={18}
                              color={isMine ? COLORS.primary : '#FFFFFF'}
                            />
                          </TouchableOpacity>

                          <View style={{ flex: 1 }}>
                            {/* Simulated Audio Waveform */}
                            <View style={styles.waveRow}>
                              {[4, 12, 8, 16, 10, 18, 14, 20, 8, 12, 6, 14, 10].map((h, i) => (
                                <View
                                  key={i}
                                  style={[
                                    styles.waveBar,
                                    { height: isPlaying ? ((i % 3) + 1) * 6 : h },
                                    isMine ? styles.myWaveBar : styles.theirWaveBar,
                                  ]}
                                />
                              ))}
                            </View>
                            <Text
                              style={[
                                styles.voiceDurationText,
                                isMine && { color: '#EFF6FF' },
                              ]}
                            >
                              {isPlaying
                                ? 'Playing audio...'
                                : `Voice Note • ${formatSeconds(msg.audioDuration || 3)}`}
                            </Text>
                          </View>
                        </View>
                      ) : (
                        /* Text Message Bubble */
                        <Text
                          style={[
                            styles.msgText,
                            isMine ? styles.myMsgText : styles.theirMsgText,
                          ]}
                        >
                          {msg.text}
                        </Text>
                      )}

                      {/* Timestamp & read status */}
                      <View style={styles.msgFooter}>
                        <Text
                          style={[
                            styles.msgTime,
                            isMine ? styles.myMsgTime : styles.theirMsgTime,
                          ]}
                        >
                          {formatMsgTime(msg.createdAt)}
                        </Text>
                        {isMine && (
                          <Icon
                            name={msg.isRead ? 'checkmark-done' : 'checkmark'}
                            size={14}
                            color={msg.isRead ? '#93C5FD' : '#CBD5E1'}
                          />
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Voice Recording Drawer (US-411) */}
        {isRecording && (
          <View style={styles.recordingDrawer}>
            <View style={styles.recordingHeader}>
              <View style={styles.redRecordingDot} />
              <Text style={styles.recordingTimerText}>
                Recording Voice Note: {formatSeconds(recordDuration)}
              </Text>
            </View>
            <View style={styles.recordingActions}>
              <TouchableOpacity style={styles.cancelRecBtn} onPress={handleCancelRecording}>
                <Icon name="trash-outline" size={20} color="#DC2626" />
                <Text style={styles.cancelRecText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sendRecBtn} onPress={handleSendVoiceMessage}>
                <Icon name="send" size={18} color="#FFFFFF" />
                <Text style={styles.sendRecText}>Send Voice Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Input Bar */}
        {!isRecording && (
          <View style={styles.inputContainer}>
            {/* Mic button for voice messaging (US-411) */}
            <TouchableOpacity style={styles.micBtn} onPress={handleStartRecording}>
              <Icon name="mic" size={22} color={COLORS.secondary} />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              placeholder="Type message..."
              placeholderTextColor="#94A3B8"
              value={inputText}
              onChangeText={handleInputChange}
              multiline
            />

            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!inputText.trim() || sending) && styles.sendBtnDisabled,
              ]}
              onPress={handleSendText}
              disabled={!inputText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Icon name="send" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1, marginLeft: 12 },
  headerName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  headerOnlineDot: { width: 8, height: 8, borderRadius: 4 },
  typingText: { fontSize: 12, fontStyle: 'italic', color: COLORS.secondary, fontWeight: '600' },
  headerRole: { fontSize: 12, color: COLORS.textSecondary },
  callBtn: {
    padding: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
  },
  messagesScroll: { padding: 16, paddingBottom: 20 },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  securityText: { fontSize: 11, color: '#64748B' },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#334155', marginTop: 10 },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 30,
  },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748B' },
  msgWrapper: { marginBottom: 10, maxWidth: '80%' },
  myMsgWrapper: { alignSelf: 'flex-end' },
  theirMsgWrapper: { alignSelf: 'flex-start' },
  bubble: { borderRadius: 14, padding: 12 },
  myBubble: { backgroundColor: COLORS.primary, borderBottomRightRadius: 2 },
  theirBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 2,
  },
  msgText: { fontSize: 14, lineHeight: 20 },
  myMsgText: { color: '#FFFFFF' },
  theirMsgText: { color: '#0F172A' },
  msgFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  msgTime: { fontSize: 10 },
  myMsgTime: { color: '#BFDBFE' },
  theirMsgTime: { color: '#94A3B8' },
  // Voice Bubble
  voiceBubbleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myPlayBtn: { backgroundColor: '#FFFFFF' },
  theirPlayBtn: { backgroundColor: COLORS.secondary },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 22 },
  waveBar: { width: 3, borderRadius: 2 },
  myWaveBar: { backgroundColor: '#BFDBFE' },
  theirWaveBar: { backgroundColor: COLORS.secondary },
  voiceDurationText: { fontSize: 11, color: '#64748B', marginTop: 2 },
  // Recording Drawer
  recordingDrawer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
  },
  recordingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  redRecordingDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#DC2626' },
  recordingTimerText: { fontSize: 15, fontWeight: 'bold', color: '#DC2626' },
  recordingActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cancelRecBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    flex: 1,
    justifyContent: 'center',
  },
  cancelRecText: { color: '#DC2626', fontWeight: 'bold' },
  sendRecBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.secondary,
    flex: 1.5,
    justifyContent: 'center',
  },
  sendRecText: { color: '#FFFFFF', fontWeight: 'bold' },
  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#CBD5E1' },
});
