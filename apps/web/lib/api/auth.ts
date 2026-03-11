import { apiClient } from './client';

export const apiLogin = async (data: Record<string, string>) => {
  const response = await apiClient.post('/auth/login', data);
  return response.data;
};

export const apiRegister = async (data: Record<string, string>) => {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
};

export const apiGetProfile = async () => {
  // We'll update this once the users/me endpoint is implemented
  const response = await apiClient.get('/users/me');
  return response.data;
};

export const apiForgotPassword = async (data: Record<string, string>) => {
  const response = await apiClient.post('/auth/forgot-password', data);
  return response.data;
};

export const apiResetPassword = async (data: Record<string, string>) => {
  const response = await apiClient.post('/auth/reset-password', data);
  return response.data;
};
