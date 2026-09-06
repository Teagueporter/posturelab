"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database";

export function createSupabaseBrowserClient() {
  const url = getPublicEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = getPublicEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) return null;
  return createBrowserClient<Database>(url, key);
}
