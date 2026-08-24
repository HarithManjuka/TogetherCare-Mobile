// src/services/companionshipService.js
import client from '../api/client';

/**
 * Fetch upcoming companionship visits for the logged-in user
 */
export const getUpcomingVisits = async () => {
  const response = await client.get('/companionship/upcoming');
  return response.data;
};

/**
 * Fetch all companionship requests/schedules for the user
 */
export const getMyRequests = async () => {
  const response = await client.get('/companionship/my-requests');
  return response.data;
};

/**
 * Create a new companionship request
 * @param {Object} requestData
 */
export const createRequest = async (requestData) => {
  const response = await client.post('/companionship/create', requestData);
  return response.data;
};

/**
 * Update an existing companionship request
 * @param {string} id
 * @param {Object} requestData
 */
export const updateRequest = async (id, requestData) => {
  const response = await client.put(`/companionship/${id}`, requestData);
  return response.data;
};

/**
 * Delete a pending companionship request
 * @param {string} id
 */
export const deleteRequest = async (id) => {
  const response = await client.delete(`/companionship/${id}`);
  return response.data;
};

/**
 * Cancel a companionship request
 * @param {string} id
 */
export const cancelRequest = async (id) => {
  const response = await client.put(`/companionship/${id}/cancel`);
  return response.data;
};


