import { ScanWizard } from "@/components/scan/ScanWizard";
import { hasStripeEnv, hasSupabaseServerEnv } from "@/lib/env";
import { getCurrentSubscription, getCurrentUserScanCount } from "@/lib/subscriptions";

export default async function ScanPage() {
  const [subscription, cloudScanCount] = await Promise.all([getCurrentSubscription(), getCurrentUserScanCount()]);
  return <ScanWizard cloudScanCount={cloudScanCount} isPro={subscription.isPro} paywallEnabled={hasSupabaseServerEnv() && hasStripeEnv()} />;
}
