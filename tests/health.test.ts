import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { healthHeaders, healthPayload } from "@/app/api/health/route";

const originalEnv = { ...process.env };

describe("health endpoint helpers", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.STRIPE_RESTRICTED_KEY;
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
    delete process.env.STRIPE_PRO_YEARLY_PRICE_ID;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("reports app health without exposing secret values", () => {
    expect(healthPayload(new Date("2026-09-06T12:00:00.000Z"))).toEqual({
      ok: true,
      checkedAt: "2026-09-06T12:00:00.000Z",
      services: {
        supabase: "missing-env",
        stripe: "missing-env",
      },
    });
  });

  it("reports configured services when required env vars are present", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_example";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_example";
    process.env.STRIPE_RESTRICTED_KEY = "rk_test_example";
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_example";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_example";
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID = "price_monthly";
    process.env.STRIPE_PRO_YEARLY_PRICE_ID = "price_yearly";

    const payload = healthPayload(new Date("2026-09-06T12:00:00.000Z"));
    expect(payload.services).toEqual({
      supabase: "configured",
      stripe: "configured",
    });
    expect(JSON.stringify(payload)).not.toContain("sb_secret_example");
    expect(JSON.stringify(payload)).not.toContain("rk_test_example");
    expect(JSON.stringify(payload)).not.toContain("whsec_example");
  });

  it("prevents shared caching", () => {
    expect(healthHeaders()).toEqual({
      "Cache-Control": "no-store, max-age=0",
    });
  });
});
