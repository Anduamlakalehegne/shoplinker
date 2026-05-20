'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '@/services/profile.service';

export const PROFILE_QUERY_KEY = 'profile';

export function useProfile() {
  return useQuery({
    queryKey: [PROFILE_QUERY_KEY],
    queryFn: getUserProfile,
    staleTime: 1000 * 60 * 5,
  });
}
