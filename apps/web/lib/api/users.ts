import { apiClient } from './client';

// Fetches a public user profile by ID.
export const apiGetUserProfile = async (id: string) => {
  const response = await apiClient.get(`/users/${id}/profile`);
  return response.data;
};


// Updates the current user's profile fields (username, bio, etc.).
export const apiUpdateProfile = async (data: Record<string, any>) => {
  const response = await apiClient.patch('/users/me', data);
  return response.data;
};

// Uploads a new avatar image for the current user.
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
