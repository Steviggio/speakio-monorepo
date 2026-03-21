import { apiClient } from './client';
import { unwrapApiData } from './utils';

export type PostItem = {
  _id: string;
  title: string;
  slug: string;
  content: string;
  author: {
    _id?: string;
    username?: string;
  } | null;
  language: string;
  tags?: string[];
  createdAt: string;
};

export type PostListResponse = {
  data: PostItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export async function apiGetPosts(params?: Record<string, string | number>) {
  const response = await apiClient.get('/posts', { params });
  return unwrapApiData<PostListResponse>(response.data);
}

export async function apiGetMyPosts() {
  const response = await apiClient.get('/posts/mine');
  return unwrapApiData<PostItem[]>(response.data);
}

export async function apiGetPost(slug: string) {
  const response = await apiClient.get(`/posts/by-slug/${slug}`);
  return unwrapApiData<PostItem>(response.data);
}

export type CreatePostInput = {
  title: string;
  content: string;
  language: string;
  tags?: string[];
  status: 'published' | 'draft';
};

export async function apiCreatePost(data: CreatePostInput) {
  const response = await apiClient.post('/posts', data);
  return unwrapApiData<PostItem>(response.data);
}

export async function apiDeletePost(id: string) {
  const response = await apiClient.delete(`/posts/${id}`);
  return unwrapApiData<{ deleted?: boolean } | Record<string, unknown>>(response.data);
}