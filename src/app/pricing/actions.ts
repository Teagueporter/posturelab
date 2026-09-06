"use server";

import Stripe from "stripe";
import { redirect } from "next/navigation";
import { getAppUrl, hasStripeEnv, hasSupabaseServerEnv } from "@/lib/env";
import { parseBillingInterval } from "@/lib/billing/plans";
import { getStripePriceId, createStripeClient } from "@/lib/stripe/server";
import { createSupabaseServiceClient, getCurrentUser } from "@/lib/supabase/server";
import { actionLogContext, logActionDone, logActionError, logActionStart } from "@/lib/observability/logging";

type CheckoutParams = Stripe.Checkout.SessionCreateParams & {
  integration_identifier: string;
};

export async function startProCheckout(formData: FormData) {
  const context = actionLogContext("startProCheckout");
  logActionStart(context);
  if (!hasSupabaseServerEnv()) {
    logActionDone(context, "blocked", { reason: "supabase-missing-env" });
    redirect("/pricing?message=Supabase%20is%20not%20configured%20yet");
  }
  if (!hasStripeEnv()) {
    logActionDone(context, "blocked", { reason: "stripe-missing-env" });
    redirect("/pricing?message=Stripe%20is%20not%20configured%20yet");
  }

  const interval = parseBillingInterval(formData.get("interval"));
  if (!interval) {
    logActionDone(context, "validation-failed", { reason: "invalid-interval" });
    redirect("/pricing?message=Choose%20a%20valid%20billing%20interval");
  }
  const user = await getCurrentUser();
  if (!user?.email) {
    logActionDone(context, "blocked", { interval, reason: "missing-user" });
    redirect("/login?message=Sign%20in%20before%20upgrading&next=%2Fpricing");
  }

  const supabase = createSupabaseServiceClient();
  const stripe = createStripeClient();
  const appUrl = getAppUrl();

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let customerId = existing?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await supabase.from("subscriptions").upsert(
      {
        user_id: user.id,
        stripe_customer_id: customerId,
        status: "free",
      },
      { onConflict: "user_id" },
    );
  }

  const checkoutParams: CheckoutParams = {
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: getStripePriceId(interval), quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${appUrl}/account?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    metadata: { user_id: user.id, plan: "pro", interval },
    subscription_data: {
      metadata: { user_id: user.id, plan: "pro", interval },
    },
    integration_identifier: "posturelab_web_hzqmrnpa",
  };

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create(checkoutParams);
  } catch (error) {
    logActionError(context, error, { interval, reason: "checkout-create-failed" });
    redirect("/pricing?message=Unable%20to%20start%20checkout");
  }
  if (!session.url) {
    logActionDone(context, "provider-error", { interval, reason: "missing-checkout-url" });
    redirect("/pricing?message=Unable%20to%20start%20checkout");
  }
  logActionDone(context, "redirect-checkout", { interval });
  redirect(session.url);
}
