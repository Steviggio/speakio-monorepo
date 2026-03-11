export interface Post {
  _id: string;
  title: string;
  slug: string;
  content: string;
  author: string | { _id: string; username: string; avatarUrl?: string };
  language: string;
  tags: string[];
  status: 'draft' | 'published';
  coverImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
