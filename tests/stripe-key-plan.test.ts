import { describe, expect, it } from "vitest";
import { buildStripeKeyPlan, stripeRestrictedKeyPermissions } from "../scripts/stripe-key-plan.mjs";

describe("Stripe restricted key plan", () => {
  it("prints least-privilege permissions for the runtime Stripe key", () => {
    const output = buildStripeKeyPlan();

    expect(output).toContain("Create a restricted key, not a broad secret key");
    expect(output).toContain("STRIPE_RESTRICTED_KEY");
    expect(stripeRestrictedKeyPermissions.map((permission) => permission.resource)).toEqual([
      "Customers",
      "Checkout Sessions",
      "Customer Portal Sessions",
      "Subscriptions",
      "Prices",
      "Products",
    ]);
    expect(output).toContain("Prices: read");
    expect(output).toContain("Products: read");
    expect(output).toContain("npm run stripe:live-check");
  });

  it("does not print Stripe secret-shaped values", () => {
    const output = buildStripeKeyPlan();

    expect(output).not.toMatch(/\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]+/);
    expect(output).not.toMatch(/\bwhsec_[A-Za-z0-9]+/);
  });
});
