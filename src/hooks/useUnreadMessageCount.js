// src/hooks/useUnreadMessageCount.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as messageService from '../services/messageService';
import socketService from '../services/socketService';

/**
 * Hook to monitor and update total unread messages count in real-time
 * across Caregiver, Elderly, and Volunteer screens.
 *
 * @param {string|null} activeChatUserId - ID of currently active chat user (if any)
 */
export function useUnreadMessageCount(activeChatUserId = null) {
  const { user, token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await messageService.getConversations();
      if (res?.success && Array.isArray(res.data)) {
        const total = res.data.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        setUnreadCount(total);
      }
    } catch (err) {
      // Silently catch network/auth errors
    }
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) return;

    // Ensure socket is connected and registered for real-time notifications
    socketService.connect(token, user._id);

    // Initial fetch of unread count
    fetchUnread();

    // Listen for incoming messages in real-time
    const unsubMsg = socketService.onReceiveMessage((newMsg) => {
      const senderId =
        newMsg?.sender?._id?.toString() || newMsg?.sender?.toString();
      const myId = user._id?.toString();

      // Ignore messages sent by oneself
      if (senderId === myId) return;

      // If user is currently in active chat with the sender, it will be marked read in the screen
      if (activeChatUserId && senderId === activeChatUserId.toString()) {
        return;
      }

      // Re-fetch conversation list to get authoritative unread count
      fetchUnread();
    });

    // Listen for thread read receipts / read events
    const unsubRead = socketService.onMessagesRead(() => {
      fetchUnread();
    });

    return () => {
      unsubMsg();
      unsubRead();
    };
  }, [user?._id, token, activeChatUserId, fetchUnread]);

  return {
    unreadCount,
    setUnreadCount,
    refreshUnread: fetchUnread,
  };
}

export default useUnreadMessageCount;
