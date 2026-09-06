import Stripe from "stripe";
import { getRequiredServerEnv } from "@/lib/env";
import { stripeApiVersion } from "@/lib/stripe/config";

export function createStripeClient() {
  return new Stripe(getRequiredServerEnv("STRIPE_RESTRICTED_KEY"), {
    apiVersion: stripeApiVersion,
    typescript: true,
  });
}

export function getStripePriceId(interval: "monthly" | "yearly") {
  return getRequiredServerEnv(interval === "monthly" ? "STRIPE_PRO_MONTHLY_PRICE_ID" : "STRIPE_PRO_YEARLY_PRICE_ID");
}
