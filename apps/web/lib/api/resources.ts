import { apiClient } from './client';

export const apiGetResources = async (params?: Record<string, string | number>) => {
  const response = await apiClient.get('/resources', { params });
  return response.data;
};

export const apiGetResource = async (id: string) => {
  const response = await apiClient.get(`/resources/${id}`);
  return response.data;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiCreateResource = async (data: any) => {
  const response = await apiClient.post('/resources', data);
  return response.data;
};

export const apiVote = async (resourceId: string, type: 'positive' | 'negative') => {
  const response = await apiClient.post('/votes', { resourceId, type });
  return response.data;
};

export const apiGetMyVote = async (resourceId: string) => {
  const response = await apiClient.get(`/votes/${resourceId}/me`);
  return response.data;
};
