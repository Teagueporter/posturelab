import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getAppUrl, hasStripeEnv, hasSupabaseBrowserEnv, hasSupabaseServerEnv } from "@/lib/env";

const originalEnv = { ...process.env };

describe("environment gates", () => {
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

  it("requires both public Supabase variables for browser clients", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    expect(hasSupabaseBrowserEnv()).toBe(false);

    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_example";
    expect(hasSupabaseBrowserEnv()).toBe(true);
  });

  it("requires the Supabase service role key for server-only operations", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_example";
    expect(hasSupabaseServerEnv()).toBe(false);

    process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_example";
    expect(hasSupabaseServerEnv()).toBe(true);
  });

  it("does not enable Stripe until every billing variable is configured", () => {
    process.env.STRIPE_RESTRICTED_KEY = "rk_test_example";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_example";
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID = "price_monthly";
    process.env.STRIPE_PRO_YEARLY_PRICE_ID = "price_yearly";
    expect(hasStripeEnv()).toBe(false);

    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_example";
    expect(hasStripeEnv()).toBe(true);
  });

  it("normalizes the app URL for callback and Stripe redirect construction", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://posturelab.example/";
    expect(getAppUrl()).toBe("https://posturelab.example");
  });
});
