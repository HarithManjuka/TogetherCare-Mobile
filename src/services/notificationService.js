// src/services/notificationService.js
import client from '../api/client';

/**
 * Get all notifications for logged-in user
 */
export const getNotifications = async () => {
  const response = await client.get('/notifications');
  return response.data;
};

/**
 * Get unread notifications count
 */
export const getUnreadCount = async () => {
  const response = await client.get('/notifications/unread-count');
  return response.data;
};

/**
 * Mark a specific notification as read
 */
export const markAsRead = async (notificationId) => {
  const response = await client.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async () => {
  const response = await client.patch('/notifications/read-all');
  return response.data;
};
