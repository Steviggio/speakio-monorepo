import { apiClient } from './client';

export const apiGetUserProfile = async (id: string) => {
  const response = await apiClient.get(`/users/${id}/profile`);
  return response.data;
};


export const apiUpdateProfile = async (data: Record<string, any>) => {
  const response = await apiClient.patch('/users/me', data);
  return response.data;
};

export const apiUploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post('/users/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
