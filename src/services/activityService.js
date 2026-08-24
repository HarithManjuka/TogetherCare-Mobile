// src/services/activityService.js
import client from '../api/client';

/**
 * Fetch all available activities from database table
 */
export const getActivities = async () => {
  const response = await client.get('/activities');
  return response.data;
};
