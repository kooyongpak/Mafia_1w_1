import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import type { CurrentUserSnapshot } from "../types";

const mapUser = (user: User, role?: 'influencer' | 'advertiser' | null) => ({
  id: user.id,
  email: user.email,
  appMetadata: user.app_metadata ?? {},
  userMetadata: user.user_metadata ?? {},
  role,
});

export const loadCurrentUser = async (): Promise<CurrentUserSnapshot> => {
  const supabase = await createSupabaseServerClient();
  const result = await supabase.auth.getUser();
  const user = result.data.user;

  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single<{ role: 'influencer' | 'advertiser' | null }>();

    const role = userData?.role ?? null;

    return {
      status: "authenticated",
      user: mapUser(user, role),
    };
  }

  return { status: "unauthenticated", user: null };
};
