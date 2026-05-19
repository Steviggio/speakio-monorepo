import { apiClient } from './client';
import { unwrapApiData } from './utils';
import type { User } from '@repo/types';

export type LoginResponse = {
  access_token: string;
  user: User;
};

export type RegisterPayload = {
  email: string;
  username: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

// Authenticates a user by email/password and returns a JWT + user object.
export async function apiLogin(data: LoginPayload): Promise<LoginResponse> {
  const response = await apiClient.post('/auth/login', data);
  return unwrapApiData<LoginResponse>(response.data);
}

// Registers a new user and returns a JWT + user object.
export async function apiRegister(data: RegisterPayload): Promise<LoginResponse> {
  const response = await apiClient.post('/auth/register', data);
  return unwrapApiData<LoginResponse>(response.data);
}

// Fetches the currently authenticated user's profile.
export async function apiGetProfile(): Promise<User> {
  const response = await apiClient.get('/users/me');
  return unwrapApiData<User>(response.data);
}

// Triggers a password-reset email for the given address.
export async function apiForgotPassword(email: string): Promise<{ message?: string }> {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return unwrapApiData<{ message?: string }>(response.data);
}

// Resets the password using a one-time token and the new password.
export async function apiResetPassword(token: string, newPassword: string): Promise<{ message?: string }> {
  const response = await apiClient.post('/auth/reset-password', {
    token,
    newPassword,
  });
  return unwrapApiData<{ message?: string }>(response.data);
}