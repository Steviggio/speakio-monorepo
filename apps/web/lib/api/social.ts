import { apiClient } from './client';
import { unwrapApiData } from './utils';
import type { ResourceItem } from './resources';

export type CommentTargetType = 'Resource' | 'Post';

export type CommentItem = {
  _id: string;
  content: string;
  targetType: CommentTargetType;
  targetId: string;
  createdAt: string;
  updatedAt?: string;
  author?: {
    _id?: string;
    username?: string;
    avatarUrl?: string | null;
  } | null;
};

export type ToggleFavoriteResponse =
  | {
    action: 'added' | 'removed';
    resourceId?: string;
  }
  | Record<string, unknown>;

export async function apiGetComments(
  targetType: CommentTargetType,
  targetId: string,
): Promise<CommentItem[]> {
  const response = await apiClient.get('/comments', {
    params: { targetType, targetId },
  });
  return unwrapApiData<CommentItem[]>(response.data);
}

export async function apiCreateComment(
  targetType: CommentTargetType,
  targetId: string,
  content: string,
): Promise<CommentItem> {
  const response = await apiClient.post('/comments', {
    targetType,
    targetId,
    content,
  });
  return unwrapApiData<CommentItem>(response.data);
}

export async function apiDeleteComment(
  id: string,
): Promise<{ deleted?: boolean } | Record<string, unknown>> {
  const response = await apiClient.delete(`/comments/${id}`);
  return unwrapApiData<{ deleted?: boolean } | Record<string, unknown>>(response.data);
}

export async function apiToggleFavorite(
  resourceId: string,
): Promise<ToggleFavoriteResponse> {
  const response = await apiClient.post(`/favorites/${resourceId}`);
  return unwrapApiData<ToggleFavoriteResponse>(response.data);
}

export async function apiGetFavorites(): Promise<ResourceItem[]> {
  const response = await apiClient.get('/favorites');
  return unwrapApiData<ResourceItem[]>(response.data);
}