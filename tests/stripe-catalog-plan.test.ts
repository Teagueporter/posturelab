import { describe, expect, it } from "vitest";
import { buildStripeCatalogPlan, stripeCatalogItems, stripeProduct } from "../scripts/stripe-catalog-plan.mjs";

describe("Stripe catalog plan", () => {
  it("prints one Pro product with monthly and yearly price commands", () => {
    const output = buildStripeCatalogPlan();

    expect(stripeProduct.name).toBe("Posture Pro");
    expect(output.match(/stripe products create/g)?.length).toBe(1);
    expect(output).toContain('stripe products create --name "Posture Pro"');
    expect(output).toContain("Use the returned product id in place of prod_REPLACE_PRO for both prices.");
    expect(output).toContain("--product prod_REPLACE_PRO --currency usd --unit-amount 499 --recurring interval=month --lookup-key posture_pro_monthly");
    expect(output).toContain("--product prod_REPLACE_PRO --currency usd --unit-amount 2900 --recurring interval=year --lookup-key posture_pro_yearly");
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
