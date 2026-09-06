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
    expect(output).toContain("PASS monthly: month recurring price active");
    expect(output).toContain("PASS yearly: year recurring price active");
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
});

function fakeStripeClient({ monthlyInterval = "month" } = {}) {
  return {
    prices: {
      async retrieve(priceId: string) {
        return {
          id: priceId,
          active: true,
          recurring: {
            interval: priceId === "price_monthly" ? monthlyInterval : "year",
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
