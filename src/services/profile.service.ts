import { createClient } from '@/lib/supabase/client';
import type { TablesInsert } from '@/types/database.types';
import type { UserProfile } from '@/types/user.types';
export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as UserProfile | null;
}

export async function upsertUserProfile(payload: {
  id: string;
  full_name: string;
  phone?: string;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('profiles').upsert({
    id: payload.id,
    full_name: payload.full_name,
    phone: payload.phone ?? null,
  } satisfies TablesInsert<'profiles'>);

  if (error) throw new Error(error.message);
}
