// src/services/volunteerService.js
import client from '../api/client';

/**
 * Fetch offers created by the logged-in volunteer
 */
export const getMyOffers = async () => {
  const response = await client.get('/volunteer-offers/my-offers');
  return response.data;
};

/**
 * Create / Post a new availability offer
 * @param {Object} offerData
 */
export const createOffer = async (offerData) => {
  const response = await client.post('/volunteer-offers', offerData);
  return response.data;
};

/**
 * Update an existing availability offer
 * @param {string} id
 * @param {Object} offerData
 */
export const updateOffer = async (id, offerData) => {
  const response = await client.put(`/volunteer-offers/${id}`, offerData);
  return response.data;
};

/**
 * Delete an availability offer
 * @param {string} id
 */
export const deleteOffer = async (id) => {
  const response = await client.delete(`/volunteer-offers/${id}`);
  return response.data;
};

/**
 * Fetch available nearby community requests looking for volunteers
 * @param {string} [category]
 */
export const getAvailableRequests = async (category = 'all') => {
  const response = await client.get('/volunteer-offers/available-requests', {
    params: { category: category !== 'all' ? category : undefined },
  });
  return response.data;
};

/**
 * Accept / Claim a community help request
 * @param {string} requestId
 */
export const acceptRequest = async (requestId) => {
  const response = await client.post(`/volunteer-offers/requests/${requestId}/accept`);
  return response.data;
};

/**
 * Fetch logged-in volunteer's scheduled / confirmed visits
 */
export const getMySchedule = async () => {
  const response = await client.get('/volunteer-offers/my-schedule');
  return response.data;
};

/**
 * Update task status (arrived / completed / cancelled)
 * @param {string} taskId
 * @param {string} status
 */
export const updateTaskStatus = async (taskId, status) => {
  const response = await client.put(`/volunteer-offers/tasks/${taskId}/status`, { status });
  return response.data;
};

/**
 * Fetch completed tasks history and feedback reviews
 */
export const getMyHistory = async () => {
  const response = await client.get('/volunteer-offers/my-history');
  return response.data;
};

/**
 * Fetch volunteer dashboard impact stats
 */
export const getMyStats = async () => {
  const response = await client.get('/volunteer-offers/my-stats');
  return response.data;
};

/**
 * Fetch pending direct visit requests sent specifically to this volunteer
 */
export const getDirectRequests = async () => {
  const response = await client.get('/volunteer-offers/direct-requests');
  return response.data;
};

/**
 * Accept a direct visit request sent by a family member
 * @param {string} requestId
 */
export const acceptDirectRequest = async (requestId) => {
  const response = await client.post(`/help-requests/${requestId}/volunteer-accept`);
  return response.data;
};

/**
 * Decline a direct visit request sent by a family member
 * @param {string} requestId
 */
export const declineDirectRequest = async (requestId) => {
  const response = await client.post(`/help-requests/${requestId}/volunteer-decline`);
  return response.data;
};

/**
 * Volunteer starts trip and consents to share live location
 * @param {string} requestId
 * @param {Object} [locationData]
 */
export const startTrip = async (requestId, locationData = {}) => {
  const response = await client.post(`/help-requests/${requestId}/start-trip`, locationData);
  return response.data;
};

/**
 * Update volunteer live location during active trip
 * @param {string} requestId
 * @param {Object} coords
 */
export const updateLocation = async (requestId, coords) => {
  const response = await client.put(`/help-requests/${requestId}/location`, coords);
  return response.data;
};

