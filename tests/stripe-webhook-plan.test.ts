import { describe, expect, it } from "vitest";
import { buildStripeWebhookPlan, stripeWebhookEndpoint } from "../scripts/stripe-webhook-plan.mjs";
import { stripeWebhookEvents } from "@/lib/stripe/webhook-events";

describe("Stripe webhook plan", () => {
  it("prints the production endpoint and exact subscription events", () => {
    const output = buildStripeWebhookPlan();

    expect(stripeWebhookEndpoint).toBe("https://posturelab-six.vercel.app/api/stripe/webhook");
    for (const event of stripeWebhookEvents) {
      expect(output).toContain(`- ${event}`);
    }
    expect(output).toContain("stripe webhook_endpoints create");
    expect(output).toContain(stripeWebhookEvents.join(","));
    expect(output).toContain("STRIPE_WEBHOOK_SECRET");
  });

  it("does not print secret-shaped Stripe values", () => {
    const output = buildStripeWebhookPlan();

    expect(output).not.toMatch(/\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]+/);
    expect(output).not.toMatch(/\bwhsec_[A-Za-z0-9]+/);
  });
});
