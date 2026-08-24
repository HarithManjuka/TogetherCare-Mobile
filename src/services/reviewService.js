// src/services/reviewService.js
import client from '../api/client';

/**
 * Fetch reviews and calculated ratings for a user
 * @param {string} userId
 */
export const getUserReviews = async (userId) => {
  if (!userId) return { success: false, data: { totalReviews: 0, averageRating: 0 } };
  const response = await client.get(`/reviews/user/${userId}`);
  return response.data;
};

/**
 * Create a new review and rating
 * @param {Object} reviewData { recipientId, rating, comment, activityType }
 */
export const createReview = async (reviewData) => {
  const response = await client.post('/reviews', reviewData);
  return response.data;
};
