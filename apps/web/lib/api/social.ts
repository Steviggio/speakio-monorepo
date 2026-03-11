import { apiClient } from './client';

export const apiGetComments = async (targetType: 'Resource' | 'Post', targetId: string) => {
  const response = await apiClient.get('/comments', { params: { targetType, targetId } });
  return response.data;
};

export const apiCreateComment = async (targetType: 'Resource' | 'Post', targetId: string, content: string) => {
  const response = await apiClient.post('/comments', { targetType, targetId, content });
  return response.data;
};

export const apiDeleteComment = async (id: string) => {
  const response = await apiClient.delete(`/comments/${id}`);
  return response.data;
};

export const apiToggleFavorite = async (resourceId: string) => {
  const response = await apiClient.post(`/favorites/${resourceId}`);
  return response.data;
};

export const apiGetFavorites = async () => {
  const response = await apiClient.get('/favorites');
  return response.data;
};
