// src/services/emergencyService.js
import client from '../api/client';

/**
 * Trigger Emergency SOS alert for the logged-in senior
 * @param {Object} data - { emergencyType, location, coordinates }
 */
export const triggerSOS = async (data = {}) => {
  const response = await client.post('/emergency/sos', data);
  return response.data;
};

/**
 * Get active SOS alert for the logged in user or linked dependent
 */
export const getActiveSOS = async () => {
  const response = await client.get('/emergency/active');
  return response.data;
};

/**
 * Resolve / Deactivate the emergency SOS alert
 * @param {string} [id] - Optional alert ID
 * @param {Object} [data] - { resolutionNotes, status }
 */
export const resolveSOS = async (id, data = {}) => {
  if (id) {
    const response = await client.post(`/emergency/${id}/resolve`, data);
    return response.data;
  }
  const response = await client.post('/emergency/resolve', data);
  return response.data;
};

/**
 * Get emergency alert history
 */
export const getEmergencyHistory = async () => {
  const response = await client.get('/emergency/history');
  return response.data;
};

// ==========================================
// CARE CIRCLE / EMERGENCY CONTACTS METHODS
// ==========================================

/**
 * Fetch all Care Circle emergency contacts for the user from backend
 */
export const getCareCircle = async () => {
  const response = await client.get('/emergency/care-circle');
  return response.data;
};

/**
 * Add a new emergency contact to Care Circle
 * @param {Object} contactData - { name, relation, phone, isPrimary, notes }
 */
export const addCareCircleContact = async (contactData) => {
  const response = await client.post('/emergency/care-circle', contactData);
  return response.data;
};

/**
 * Update a Care Circle contact
 * @param {string} id - Contact ID
 * @param {Object} contactData - { name, relation, phone, isPrimary, notes }
 */
export const updateCareCircleContact = async (id, contactData) => {
  const response = await client.put(`/emergency/care-circle/${id}`, contactData);
  return response.data;
};

/**
 * Delete a Care Circle contact
 * @param {string} id - Contact ID
 */
export const deleteCareCircleContact = async (id) => {
  const response = await client.delete(`/emergency/care-circle/${id}`);
  return response.data;
};

/**
 * Set a contact as primary emergency contact
 * @param {string} id - Contact ID
 */
export const setPrimaryCareCircleContact = async (id) => {
  const response = await client.patch(`/emergency/care-circle/${id}/primary`);
  return response.data;
};
