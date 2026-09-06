import { ReportView } from "@/components/report/ReportView";
import { hasStripeEnv, hasSupabaseServerEnv } from "@/lib/env";
import { getCurrentSubscription } from "@/lib/subscriptions";

export default async function ReportPage() {
  const subscription = await getCurrentSubscription();
  return <ReportView isPro={subscription.isPro} paywallEnabled={hasSupabaseServerEnv() && hasStripeEnv()} />;
}
