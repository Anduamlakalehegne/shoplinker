import type { User } from '@supabase/supabase-js';

/** Resolve a display name from Supabase auth metadata. */
export function getUserDisplayName(user: User): string {
  const metadata = user.user_metadata as Record<string, string | undefined>;
  const fullName = metadata?.full_name?.trim();
  if (fullName) return fullName;

  const firstName = metadata?.first_name?.trim();
  if (firstName) return firstName;

  const emailPrefix = user.email?.split('@')[0];
  return emailPrefix ?? 'User';
}

/** Two-letter initials for avatar fallback. */
export function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
