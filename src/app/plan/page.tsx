import { PlanView } from "@/components/plan/PlanView";
import { hasStripeEnv, hasSupabaseServerEnv } from "@/lib/env";
import { getCurrentSubscription } from "@/lib/subscriptions";

export default async function PlanPage() {
  const subscription = await getCurrentSubscription();
  return <PlanView isPro={subscription.isPro} paywallEnabled={hasSupabaseServerEnv() && hasStripeEnv()} />;
}
