// src/services/messageService.js
import client from '../api/client';

/**
 * Get all conversations for the logged-in user
 */
export const getConversations = async () => {
  const response = await client.get('/messages/conversations');
  return response.data;
};

/**
 * Get message thread with a specific user
 */
export const getMessages = async (otherUserId) => {
  const response = await client.get(`/messages/${otherUserId}`);
  return response.data;
};

/**
 * Send a text or voice message (US-403 & US-411)
 */
export const sendMessage = async (payloadOrRecipient, maybeText, maybeType = 'text') => {
  let body = {};
  if (typeof payloadOrRecipient === 'object' && payloadOrRecipient !== null) {
    body = payloadOrRecipient;
    // Map text to content if content not provided
    if (body.text && !body.content) body.content = body.text;
  } else {
    body = {
      recipientId: payloadOrRecipient,
      content: maybeText,
      messageType: maybeType,
    };
  }

  const response = await client.post('/messages', body);
  return response.data;
};

/**
 * Convenience helper to send voice message (US-411)
 */
export const sendVoiceMessage = async (recipientId, audioUrl, durationSeconds = 3, relatedSeniorId = null) => {
  const body = {
    recipientId,
    content: `Voice note (${durationSeconds}s)`,
    messageType: 'voice',
    audioUrl,
    durationSeconds,
  };
  if (relatedSeniorId) {
    body.relatedSeniorId = relatedSeniorId;
  }
  const response = await client.post('/messages', body);
  return response.data;
};

/**
 * Mark a message thread as read
 */
export const markThreadRead = async (otherUserId) => {
  const response = await client.patch(`/messages/${otherUserId}/read`);
  return response.data;
};

/**
 * Search registered user by mobile phone number
 * @param {string} phone - Sri Lankan mobile number (e.g. 0771234567, +94771234567)
 */
export const searchContactByPhone = async (phone) => {
  const response = await client.get('/messages/contacts/search', {
    params: { phone },
  });
  return response.data;
};

/**
 * Add a contact by mobile number or user ID
 * @param {Object|string} payload - { phone, nickname } or phone string
 */
export const addContact = async (payload) => {
  const body = typeof payload === 'string' ? { phone: payload } : payload;
  const response = await client.post('/messages/contacts', body);
  return response.data;
};

/**
 * Get all contacts for the logged-in user
 */
export const getContacts = async () => {
  const response = await client.get('/messages/contacts');
  return response.data;
};

/**
 * Remove a contact from contacts list
 * @param {string} contactUserId
 */
export const removeContact = async (contactUserId) => {
  const response = await client.delete(`/messages/contacts/${contactUserId}`);
  return response.data;
};
