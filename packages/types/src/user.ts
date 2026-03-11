import { LanguageCode } from './enums';

export interface User {
  _id: string;
  email: string;
  username: string;
  passwordHash?: string;
  googleId?: string;
  bio?: string;
  avatarUrl?: string;
  role: 'USER' | 'ADMIN';
  locale: LanguageCode;
  learningLanguages: LanguageCode[];
  favoriteResources: string[];
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type UserWithoutPassword = Omit<User, 'passwordHash'>;
