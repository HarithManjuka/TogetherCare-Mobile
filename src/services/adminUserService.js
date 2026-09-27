// src/services/adminUserService.js
import client from '../api/client';

export const getAdminUsers = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await client.get(`/admin/users?${query}`);
  return res.data;
};

export const getAdminUserDetails = async (userId) => {
  const res = await client.get(`/admin/users/${userId}`);
  return res.data;
};

export const createAdminUser = async (userData) => {
  const res = await client.post('/admin/users', userData);
  return res.data;
};

export const updateAdminUserDetails = async (userId, updateData) => {
  const res = await client.put(`/admin/users/${userId}`, updateData);
  return res.data;
};

export const banUser = async (userId, { banType, duration, reason }) => {
  const res = await client.post(`/admin/users/${userId}/ban`, { banType, duration, reason });
  return res.data;
};

export const unbanUser = async (userId) => {
  const res = await client.post(`/admin/users/${userId}/unban`);
  return res.data;
};

export const updateVerificationStatus = async (userId, status, note = '') => {
  const res = await client.patch(`/auth/users/${userId}/verification`, { status, note });
  return res.data;
};
