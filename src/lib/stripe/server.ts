import Stripe from "stripe";
import { getRequiredServerEnv } from "@/lib/env";

export function createStripeClient() {
  return new Stripe(getRequiredServerEnv("STRIPE_RESTRICTED_KEY"), {
    apiVersion: "2026-08-26.dahlia",
    typescript: true,
  });
}

export function getStripePriceId(interval: "monthly" | "yearly") {
  return getRequiredServerEnv(interval === "monthly" ? "STRIPE_PRO_MONTHLY_PRICE_ID" : "STRIPE_PRO_YEARLY_PRICE_ID");
}
