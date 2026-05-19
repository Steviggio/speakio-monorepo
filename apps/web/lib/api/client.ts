import axios from 'axios';

const API_URL =
  process.env.NEXT_PUBLIC_CLIENT_API_URL?.trim() || 'http://localhost:3001/api';

// Pre-configured Axios instance pointing to the NestJS API with credentials support.
export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  },
);