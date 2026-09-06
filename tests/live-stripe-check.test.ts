import { describe, expect, it } from "vitest";
import { checkLiveStripe, formatLiveStripeCheck } from "../scripts/check-live-stripe.mjs";

describe("live Stripe checker", () => {
  it("fails safely when live Stripe env vars are missing", async () => {
    const result = await checkLiveStripe({
      env: { NODE_ENV: "test" } as NodeJS.ProcessEnv,
      stripe: fakeStripeClient() as never,
    });

    expect(result.ok).toBe(false);
    expect(result.missing).toEqual([
      "STRIPE_RESTRICTED_KEY",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "STRIPE_PRO_MONTHLY_PRICE_ID",
      "STRIPE_PRO_YEARLY_PRICE_ID",
    ]);
    expect(formatLiveStripeCheck(result)).toContain("Live Stripe check: FAIL");
  });

  it("checks monthly and yearly recurring prices without printing secrets", async () => {
    const result = await checkLiveStripe({
      env: validEnv(),
      stripe: fakeStripeClient() as never,
    });

    const output = formatLiveStripeCheck(result);

    expect(result.ok).toBe(true);
    expect(result.priceChecks.map((check) => check.name)).toEqual(["monthly", "yearly"]);
    expect(output).toContain("PASS monthly: month recurring USD 4.99 price active");
    expect(output).toContain("PASS yearly: year recurring USD 29.00 price active");
    expect(output).not.toContain("rk_test_example");
    expect(output).not.toContain("price_monthly");
  });

  it("fails when a configured price interval does not match the app plan", async () => {
    const result = await checkLiveStripe({
      env: validEnv(),
      stripe: fakeStripeClient({ monthlyInterval: "year" }) as never,
    });

    expect(result.ok).toBe(false);
    expect(result.priceChecks[0]?.detail).toContain("expected month interval");
  });

  it("fails when a configured price does not match the app catalog amount or lookup key", async () => {
    const result = await checkLiveStripe({
      env: validEnv(),
      stripe: fakeStripeClient({ monthlyAmount: 999, monthlyLookupKey: "wrong_lookup" }) as never,
    });

    expect(result.ok).toBe(false);
    expect(result.priceChecks[0]?.detail).toContain("expected USD 4.99");
    expect(result.priceChecks[0]?.detail).toContain("expected posture_pro_monthly lookup key");
  });
});

function fakeStripeClient({ monthlyAmount = 499, monthlyInterval = "month", monthlyLookupKey = "posture_pro_monthly" } = {}) {
  return {
    prices: {
      async retrieve(priceId: string) {
        const monthly = priceId === "price_monthly";
        return {
          id: priceId,
          active: true,
          unit_amount: monthly ? monthlyAmount : 2900,
          currency: "usd",
          lookup_key: monthly ? monthlyLookupKey : "posture_pro_yearly",
          recurring: {
            interval: monthly ? monthlyInterval : "year",
          },
          product: {
            active: true,
          },
        };
      },
    },
  };
}

function validEnv() {
  return {
    NODE_ENV: "test",
    STRIPE_RESTRICTED_KEY: "rk_test_example",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_example",
    STRIPE_WEBHOOK_SECRET: "whsec_example",
    STRIPE_PRO_MONTHLY_PRICE_ID: "price_monthly",
    STRIPE_PRO_YEARLY_PRICE_ID: "price_yearly",
  } as NodeJS.ProcessEnv;
}
