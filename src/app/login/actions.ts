"use server";

import { redirect } from "next/navigation";
import { getAppUrl } from "@/lib/env";
import { safeNextPath } from "@/lib/auth/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { actionLogContext, logActionDone, logActionStart } from "@/lib/observability/logging";

export async function signInWithEmail(formData: FormData) {
  const context = actionLogContext("signInWithEmail");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeNextPath(formData.get("next"));
  logActionStart(context, { emailProvided: Boolean(email), next });
  if (!email) {
    logActionDone(context, "validation-failed", { reason: "missing-email" });
    redirect(`/login?message=Enter%20an%20email%20address&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    logActionDone(context, "blocked", { reason: "supabase-missing-env" });
    redirect(`/login?message=Supabase%20is%20not%20configured%20yet&next=${encodeURIComponent(next)}`);
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    logActionDone(context, "provider-error", { reason: "otp-error" });
    redirect(`/login?message=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }
  logActionDone(context, "otp-sent", { next });
  redirect(`/login?message=Check%20your%20email%20for%20a%20sign-in%20link&next=${encodeURIComponent(next)}`);
}

export async function signOut() {
  const context = actionLogContext("signOut");
  logActionStart(context);
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  logActionDone(context, "signed-out", { supabaseConfigured: Boolean(supabase) });
  redirect("/");
}
