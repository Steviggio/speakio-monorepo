import { apiClient } from './client';

export const apiGetPosts = async (params?: Record<string, string | number>) => {
  const response = await apiClient.get('/posts', { params });
  return response.data;
};

export const apiGetPost = async (slug: string) => {
  const response = await apiClient.get(`/posts/by-slug/${slug}`);
  return response.data;
};

export const apiGetMyPosts = async () => {
  const response = await apiClient.get('/posts/mine');
  return response.data;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiCreatePost = async (data: any) => {
  const response = await apiClient.post('/posts', data);
  return response.data;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiUpdatePost = async (id: string, data: any) => {
  const response = await apiClient.patch(`/posts/${id}`, data);
  return response.data;
};

export const apiDeletePost = async (id: string) => {
  const response = await apiClient.delete(`/posts/${id}`);
  return response.data;
};
