import { apiClient } from "./client";
import { unwrapApiData } from "./utils";
import type { User } from "@repo/types";

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

export async function apiLogin(data: LoginPayload): Promise<LoginResponse> {
  const response = await apiClient.post("/auth/login", data);
  return unwrapApiData<LoginResponse>(response.data);
}

export async function apiRegister(
  data: RegisterPayload,
): Promise<LoginResponse> {
  const response = await apiClient.post("/auth/register", data);
  return unwrapApiData<LoginResponse>(response.data);
}

export async function apiGetProfile(): Promise<User> {
  const response = await apiClient.get("/users/me");
  return unwrapApiData<User>(response.data);
}

export async function apiForgotPassword(
  email: string,
): Promise<{ message?: string }> {
  const response = await apiClient.post("/auth/forgot-password", { email });
  return unwrapApiData<{ message?: string }>(response.data);
}

export async function apiResetPassword(
  token: string,
  newPassword: string,
): Promise<{ message?: string }> {
  const response = await apiClient.post("/auth/reset-password", {
    token,
    newPassword,
  });
  return unwrapApiData<{ message?: string }>(response.data);
}
