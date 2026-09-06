import { describe, expect, it } from "vitest";
import { buildStripeCatalogPlan, stripeCatalogItems } from "../scripts/stripe-catalog-plan.mjs";

describe("Stripe catalog plan", () => {
  it("prints monthly and yearly product and price commands", () => {
    const output = buildStripeCatalogPlan();

    expect(output).toContain('stripe products create --name "Posture Pro Monthly"');
    expect(output).toContain("--unit-amount 499 --recurring interval=month --lookup-key posture_pro_monthly");
    expect(output).toContain('stripe products create --name "Posture Pro Yearly"');
    expect(output).toContain("--unit-amount 2900 --recurring interval=year --lookup-key posture_pro_yearly");
  });

  it("maps prices to the app env vars", () => {
    expect(stripeCatalogItems.map((item) => item.priceEnvName)).toEqual([
      "STRIPE_PRO_MONTHLY_PRICE_ID",
      "STRIPE_PRO_YEARLY_PRICE_ID",
    ]);

    const output = buildStripeCatalogPlan();
    expect(output).toContain("Copy the returned price id to STRIPE_PRO_MONTHLY_PRICE_ID.");
    expect(output).toContain("Copy the returned price id to STRIPE_PRO_YEARLY_PRICE_ID.");
  });

  it("does not print secret-shaped Stripe values", () => {
    const output = buildStripeCatalogPlan();

    expect(output).not.toMatch(/\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]+/);
    expect(output).not.toContain("STRIPE_RESTRICTED_KEY=");
  });
});
