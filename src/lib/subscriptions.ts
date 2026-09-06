import type Stripe from "stripe";
import { createSupabaseServiceClient, createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { isProStatus } from "@/lib/billing/plans";

export type SubscriptionState = {
  status: string;
  isPro: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
};

export async function getCurrentSubscription(): Promise<SubscriptionState> {
  const user = await getCurrentUser();
  if (!user) return freeSubscription();

  const supabase = await createSupabaseServerClient();
  if (!supabase) return freeSubscription();

  const { data } = await supabase
    .from("subscriptions")
    .select("status,current_period_end,cancel_at_period_end,stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    status: data?.status ?? "free",
    isPro: isProStatus(data?.status),
    currentPeriodEnd: data?.current_period_end ?? null,
    cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
    stripeCustomerId: data?.stripe_customer_id ?? null,
  };
}

export async function getCurrentUserScanCount() {
  const user = await getCurrentUser();
  if (!user) return 0;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("scans")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) return 0;
  return count ?? 0;
}

export async function upsertSubscriptionFromStripe(subscription: Stripe.Subscription) {
  const supabase = createSupabaseServiceClient();
  const customerId = getCustomerId(subscription.customer);
  const existing = customerId
    ? await supabase.from("subscriptions").select("user_id").eq("stripe_customer_id", customerId).maybeSingle()
    : { data: null };
  const userId = subscription.metadata.user_id ?? existing.data?.user_id;

  if (!userId) return;

  const item = subscription.items.data[0];
  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      price_id: item?.price.id ?? null,
      current_period_end: item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
    },
    { onConflict: "user_id" },
  );
}

function freeSubscription(): SubscriptionState {
  return {
    status: "free",
    isPro: false,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    stripeCustomerId: null,
  };
}

function getCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}
