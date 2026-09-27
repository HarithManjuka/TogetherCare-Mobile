// src/services/volunteerOfferService.js
import client from '../api/client';

/**
 * Fetch all available volunteer companionship offers
 * @param {Object} [params] - { service, location }
 */
export const getAllOffers = async (params = {}) => {
  const response = await client.get('/volunteer-offers', { params });
  return response.data;
};

/**
 * Accept a volunteer companionship offer
 * @param {string} id - Volunteer Offer ID
 */
export const acceptOffer = async (id) => {
  const response = await client.post(`/volunteer-offers/${id}/accept`);
  return response.data;
};

/**
 * Fetch offers created by logged in volunteer
 */
export const getMyOffers = async () => {
  const response = await client.get('/volunteer-offers/my-offers');
  return response.data;
};
