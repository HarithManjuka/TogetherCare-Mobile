// src/services/socketService.js
import { io } from 'socket.io-client';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const DEFAULT_PORT = process.env.EXPO_PUBLIC_API_PORT || 5001;

/**
 * Resolves the Socket.io Server Base URL matching client.js
 */
const getSocketURL = () => {
  if (process.env.EXPO_PUBLIC_SOCKET_URL) {
    return process.env.EXPO_PUBLIC_SOCKET_URL;
  }
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/api\/?$/, '');
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.developer?.tool;
  const hostIP = hostUri ? hostUri.split(':')[0] : null;

  if (hostIP && hostIP !== 'localhost' && hostIP !== '127.0.0.1') {
    return `http://${hostIP}:${DEFAULT_PORT}`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_PORT}`;
  }

  return `http://localhost:${DEFAULT_PORT}`;
};

class SocketService {
  constructor() {
    this.socket = null;
    this.currentUserId = null;
    this.listeners = new Map();
  }

  /**
   * Connect to Socket.io server and register user
   */
  connect(token, userId) {
    if (this.socket && this.socket.connected) {
      if (userId && this.currentUserId !== userId) {
        this.currentUserId = userId;
        this.socket.emit('join', userId);
      }
      return this.socket;
    }

    const socketUrl = getSocketURL();
    console.log('[Socket] Connecting to:', socketUrl);

    this.currentUserId = userId;
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      auth: {
        token: token || '',
        userId: userId || '',
      },
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected with ID:', this.socket.id);
      if (this.currentUserId) {
        this.socket.emit('join', this.currentUserId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    // Reattach all registered custom listeners
    this.listeners.forEach((callbacks, eventName) => {
      callbacks.forEach((cb) => {
        this.socket.on(eventName, cb);
      });
    });

    return this.socket;
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if socket is currently connected
   */
  isConnected() {
    return !!(this.socket && this.socket.connected);
  }

  /**
   * Join a specific conversation thread room
   */
  joinThread(otherUserId) {
    if (!this.socket || !this.currentUserId || !otherUserId) return;
    const threadRoom = [this.currentUserId.toString(), otherUserId.toString()].sort().join('_');
    this.socket.emit('join_thread', threadRoom);
  }

  /**
   * Leave a conversation thread room
   */
  leaveThread(otherUserId) {
    if (!this.socket || !this.currentUserId || !otherUserId) return;
    const threadRoom = [this.currentUserId.toString(), otherUserId.toString()].sort().join('_');
    this.socket.emit('leave_thread', threadRoom);
  }

  /**
   * Send a real-time message over socket
   */
  sendMessage(payload, callback) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(
        'send_message',
        {
          ...payload,
          senderId: this.currentUserId,
        },
        callback
      );
    }
  }

  /**
   * Send typing status to recipient
   */
  sendTyping(recipientId, isTyping) {
    if (this.socket && this.socket.connected && this.currentUserId) {
      this.socket.emit('typing', {
        senderId: this.currentUserId,
        recipientId,
        isTyping,
      });
    }
  }

  /**
   * Notify server and other user that thread was read
   */
  sendReadThread(otherUserId) {
    if (this.socket && this.socket.connected && this.currentUserId) {
      this.socket.emit('read_thread', {
        senderId: this.currentUserId,
        otherUserId,
      });
    }
  }

  /**
   * Check online status of another user
   */
  checkOnline(userId, callback) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('check_online', userId, callback);
    }
  }

  /**
   * Subscribe to receive incoming messages
   */
  onReceiveMessage(callback) {
    return this._addListener('receive_message', callback);
  }

  /**
   * Subscribe to typing indicators
   */
  onUserTyping(callback) {
    return this._addListener('user_typing', callback);
  }

  /**
   * Subscribe to read receipts
   */
  onMessagesRead(callback) {
    return this._addListener('messages_read', callback);
  }

  /**
   * Subscribe to user status changes (online/offline)
   */
  onStatusChanged(callback) {
    return this._addListener('user_status_changed', callback);
  }

  _addListener(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(callback);

    if (this.socket) {
      this.socket.on(eventName, callback);
    }

    // Return un-subscriber
    return () => {
      const set = this.listeners.get(eventName);
      if (set) {
        set.delete(callback);
      }
      if (this.socket) {
        this.socket.off(eventName, callback);
      }
    };
  }
}

const socketService = new SocketService();
export default socketService;
