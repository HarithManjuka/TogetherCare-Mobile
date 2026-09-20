// src/services/dependentService.js
import client from '../api/client';

/**
 * Get all linked elderly dependents for the logged-in caregiver / family member
 */
export const getDependents = async () => {
  const response = await client.get('/caregiver/dependents');
  return response.data;
};

/**
 * Add and link a new elderly dependent profile
 */
export const addDependent = async (dependentData) => {
  const response = await client.post('/caregiver/dependents', dependentData);
  return response.data;
};

/**
 * Get unlinked elderly profiles available to link
 */
export const getUnlinkedElderly = async () => {
  const response = await client.get('/caregiver/dependents/unlinked');
  return response.data;
};

/**
 * Link an existing elderly profile to caregiver / family member
 */
export const linkDependent = async (elderlyId) => {
  const response = await client.post('/caregiver/dependents/link', { elderlyId });
  return response.data;
};

/**
 * Unlink an elderly dependent from caregiver / family member
 */
export const unlinkDependent = async (elderlyId) => {
  const response = await client.post('/caregiver/dependents/unlink', { elderlyId });
  return response.data;
};

/**
 * Get activities, companionship visits, and tasks for a specific senior (Sprint 3)
 */
export const getDependentActivities = async (elderlyId) => {
  const response = await client.get(`/caregiver/dependents/${elderlyId}/activities`);
  return response.data;
};

/**
 * Get all upcoming care visits across all linked seniors (US-404)
 */
export const getUpcomingCareVisits = async () => {
  const response = await client.get('/caregiver/dependents/upcoming-visits');
  return response.data;
};
