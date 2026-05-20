import type { Tables } from './database.types';

export type UserProfile = Tables<'profiles'>;

export interface AuthUser {
  id: string;
  email: string;
  profile: UserProfile | null;
}
