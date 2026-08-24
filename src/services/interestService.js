// src/services/interestService.js
import client from '../api/client';

/**
 * Fetch all available selectable interests with icons from database
 */
export const getInterests = async () => {
  const response = await client.get('/interests');
  return response.data;
};
