import { LanguageCode } from './enums';

// Core user model shared between frontend and backend, includes auth, profile, and onboarding state.
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
  isOnboardingCompleted: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Safe user projection excluding the password hash, used in API responses.
export type UserWithoutPassword = Omit<User, 'passwordHash'>;
