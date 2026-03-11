import axios from 'axios';


const API_URL = process.env.NEXT_PUBLIC_CLIENT_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => {
    const resBody = response.data;
    if (resBody && resBody.data !== undefined && resBody.meta === undefined) {

      response.data = resBody.data;
    }
    return response;
  },
  (error) => Promise.reject(error)
);
