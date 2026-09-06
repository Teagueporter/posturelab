"use server";

import { redirect } from "next/navigation";
import { getAppUrl, hasStripeEnv, hasSupabaseServerEnv } from "@/lib/env";
import { createStripeClient } from "@/lib/stripe/server";
import { createSupabaseServerClient, createSupabaseServiceClient, getCurrentUser } from "@/lib/supabase/server";
import { actionLogContext, logActionDone, logActionError, logActionStart } from "@/lib/observability/logging";

export async function openCustomerPortal() {
  const context = actionLogContext("openCustomerPortal");
  logActionStart(context);
  if (!hasSupabaseServerEnv() || !hasStripeEnv()) {
    logActionDone(context, "blocked", { reason: "billing-missing-env" });
    redirect("/account?message=Billing%20is%20not%20configured%20yet");
  }

  const user = await getCurrentUser();
  if (!user) {
    logActionDone(context, "blocked", { reason: "missing-user" });
    redirect("/login?message=Sign%20in%20to%20manage%20billing");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase!
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    logActionError(context, error, { reason: "billing-account-read-failed" });
    redirect("/account?message=Unable%20to%20open%20billing%20portal");
  }

  if (!data?.stripe_customer_id) {
    logActionDone(context, "blocked", { reason: "missing-stripe-customer" });
    redirect("/pricing?message=No%20billing%20account%20found");
  }

  let portal: { url: string };
  try {
    portal = await createStripeClient().billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${getAppUrl()}/account`,
    });
  } catch (error) {
    logActionError(context, error, { reason: "portal-create-failed" });
    redirect("/account?message=Unable%20to%20open%20billing%20portal");
  }

  logActionDone(context, "redirect-portal");
  redirect(portal.url);
}

export async function deleteCloudAccount(formData: FormData) {
  const context = actionLogContext("deleteCloudAccount");
  logActionStart(context);
  if (String(formData.get("confirm") ?? "").trim() !== "DELETE") {
    logActionDone(context, "validation-failed", { reason: "delete-confirmation-mismatch" });
    redirect("/account?message=Type%20DELETE%20to%20confirm%20account%20deletion");
  }
  if (!hasSupabaseServerEnv()) {
    logActionDone(context, "blocked", { reason: "supabase-missing-env" });
    redirect("/account?message=Supabase%20is%20not%20configured%20yet");
  }

  const user = await getCurrentUser();
  if (!user) {
    logActionDone(context, "blocked", { reason: "missing-user" });
    redirect("/login?message=Sign%20in%20to%20delete%20your%20account");
  }

  try {
    const service = createSupabaseServiceClient();
    const { data: subscription, error: subscriptionError } = await service
      .from("subscriptions")
      .select("stripe_subscription_id,status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (subscriptionError) {
      throw new Error("Unable to read subscription before account deletion");
    }

    if (hasStripeEnv() && subscription?.stripe_subscription_id && subscription.status !== "canceled") {
      await createStripeClient().subscriptions.cancel(subscription.stripe_subscription_id);
    }

    const imagePaths = await listUserScanImagePaths(user.id);
    if (imagePaths.length > 0) {
      const { error: removeError } = await service.storage.from("scan-images").remove(imagePaths);
      if (removeError) {
        throw new Error("Unable to remove scan images before account deletion");
      }
    }

    const { error: deleteUserError } = await service.auth.admin.deleteUser(user.id);
    if (deleteUserError) {
      throw new Error("Unable to delete Supabase Auth user");
    }

    const supabase = await createSupabaseServerClient();
    await supabase?.auth.signOut();
    logActionDone(context, "account-deleted", { imageCount: imagePaths.length, stripeCancelAttempted: Boolean(subscription?.stripe_subscription_id) });
  } catch (error) {
    logActionError(context, error, { reason: "delete-account-failed" });
    redirect("/account?message=Unable%20to%20delete%20account");
  }
  redirect("/?message=Account%20deleted");
}

async function listUserScanImagePaths(userId: string) {
  const service = createSupabaseServiceClient();
  const { data: scanFolders, error: folderError } = await service.storage.from("scan-images").list(userId, { limit: 1000 });
  if (folderError) {
    throw new Error("Unable to list scan image folders before account deletion");
  }
  if (!scanFolders) return [];

  const nestedPaths = await Promise.all(
    scanFolders.map(async (folder) => {
      const { data: files, error: filesError } = await service.storage.from("scan-images").list(`${userId}/${folder.name}`, { limit: 20 });
      if (filesError) {
        throw new Error("Unable to list scan image files before account deletion");
      }
      return (files ?? []).map((file) => `${userId}/${folder.name}/${file.name}`);
    }),
  );

  return nestedPaths.flat();
}
