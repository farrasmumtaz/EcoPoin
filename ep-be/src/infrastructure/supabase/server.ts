import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { getServerEnv } from "@/config/env";

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } = getServerEnv();
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, options, value } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });
}
