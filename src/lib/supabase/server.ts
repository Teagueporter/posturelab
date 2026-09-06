import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicEnv, getRequiredServerEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export async function createSupabaseServerClient() {
  const url = getPublicEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = getPublicEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components can read but not always write cookies; middleware refreshes sessions.
        }
      },
    },
  });
}

export function createSupabaseServiceClient() {
  return createSupabaseClient<Database>(
    getRequiredServerEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function ensureUserProfile(supabase: SupabaseServerClient) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: data.user.id,
      email: data.user.email ?? null,
      display_name: data.user.user_metadata?.full_name ? String(data.user.user_metadata.full_name) : null,
    },
    { onConflict: "id" },
  );
  if (profileError) {
    throw new Error("Unable to create user profile");
  }

  return data.user;
}
