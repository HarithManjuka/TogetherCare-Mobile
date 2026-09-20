// src/services/caregiverService.js
import client from '../api/client';

/**
 * Get available care assignments for caregivers (Sprint 3)
 */
export const getAvailableAssignments = async () => {
  const response = await client.get('/help-requests/caregiver/assignments');
  return response.data;
};

/**
 * Accept a care assignment with schedule conflict prevention (US-402)
 */
export const acceptAssignment = async (assignmentId, assignmentType = 'help_request') => {
  const response = await client.post(`/help-requests/caregiver/assignments/${assignmentId}/accept`, {
    assignmentType,
  });
  return response.data;
};

export const acceptCaregiverAssignment = acceptAssignment;

/**
 * Get completed visits and stats for caregiver (Sprint 3)
 */
export const getCompletedVisits = async () => {
  const response = await client.get('/help-requests/caregiver/visits/completed');
  return response.data;
};

/**
 * Add a professional certification (Sprint 1)
 */
export const addCertification = async (certificationData) => {
  const response = await client.post('/auth/certifications', certificationData);
  return response.data;
};

/**
 * Delete a professional certification
 */
export const deleteCertification = async (certId) => {
  const response = await client.delete(`/auth/certifications/${certId}`);
  return response.data;
};
