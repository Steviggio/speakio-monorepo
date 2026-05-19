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

// Fetches comments for a given target type (Resource or Post) and ID.
export async function apiGetComments(
  targetType: CommentTargetType,
  targetId: string,
): Promise<CommentItem[]> {
  const response = await apiClient.get('/comments', {
    params: { targetType, targetId },
  });
  return unwrapApiData<CommentItem[]>(response.data);
}

// Posts a new comment on a resource or blog post.
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

// Deletes a comment owned by the current user.
export async function apiDeleteComment(
  id: string,
): Promise<{ deleted?: boolean } | Record<string, unknown>> {
  const response = await apiClient.delete(`/comments/${id}`);
  return unwrapApiData<{ deleted?: boolean } | Record<string, unknown>>(response.data);
}

// Adds or removes a resource from the user's favorites list.
export async function apiToggleFavorite(
  resourceId: string,
): Promise<ToggleFavoriteResponse> {
  const response = await apiClient.post(`/favorites/${resourceId}`);
  return unwrapApiData<ToggleFavoriteResponse>(response.data);
}

// Returns the full list of the current user's favorited resources.
export async function apiGetFavorites(): Promise<ResourceItem[]> {
  const response = await apiClient.get('/favorites');
  return unwrapApiData<ResourceItem[]>(response.data);
}