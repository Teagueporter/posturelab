import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/env";
import { safeNextPath } from "@/lib/auth/redirects";
import { createSupabaseServerClient, ensureUserProfile } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));
  const supabase = await createSupabaseServerClient();

  if (!code || !supabase) {
    return NextResponse.redirect(`${getAppUrl()}/login?message=Unable%20to%20finish%20sign%20in`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${getAppUrl()}/login?message=Unable%20to%20finish%20sign%20in`);
  }

  try {
    const user = await ensureUserProfile(supabase);
    if (!user) {
      return NextResponse.redirect(`${getAppUrl()}/login?message=Unable%20to%20finish%20sign%20in`);
    }
  } catch {
    return NextResponse.redirect(`${getAppUrl()}/login?message=Unable%20to%20finish%20sign%20in`);
  }

  redirect(next);
}
