import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  formatInvalidEnv,
  formatMissingEnv,
  invalidEnvMessages,
  missingEnvNames,
  readEnvFile,
  requiredEnvNames,
} from "../scripts/setup-check.mjs";

describe("production setup checker", () => {
  it("tracks every production environment variable required for launch", () => {
    expect(requiredEnvNames).toEqual([
      "NEXT_PUBLIC_APP_URL",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "STRIPE_RESTRICTED_KEY",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "STRIPE_PRO_MONTHLY_PRICE_ID",
      "STRIPE_PRO_YEARLY_PRICE_ID",
    ]);
  });

  it("reports only missing variables", () => {
    const envFixture: Record<string, string> = {
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      STRIPE_RESTRICTED_KEY: "rk_test_example",
    };

    const missing = missingEnvNames(envFixture as NodeJS.ProcessEnv);

    expect(missing).toEqual([
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "STRIPE_PRO_MONTHLY_PRICE_ID",
      "STRIPE_PRO_YEARLY_PRICE_ID",
    ]);
  });

  it("formats missing variables as a CLI-ready error", () => {
    expect(formatMissingEnv(["STRIPE_WEBHOOK_SECRET"])).toBe(
      "Missing production environment variables:\n- STRIPE_WEBHOOK_SECRET",
    );
  });

  it("accepts production-shaped environment values", () => {
    expect(invalidEnvMessages(validEnv())).toEqual([]);
  });

  it("reports malformed production values without printing secrets", () => {
    const invalid = invalidEnvMessages({
      ...validEnv(),
      NEXT_PUBLIC_APP_URL: "posturelab.com",
      NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
      STRIPE_RESTRICTED_KEY: "sk_live_secret",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "rk_live_wrong",
      STRIPE_WEBHOOK_SECRET: "secret",
      STRIPE_PRO_MONTHLY_PRICE_ID: "prod_monthly",
    } as NodeJS.ProcessEnv);

    expect(invalid).toEqual([
      "NEXT_PUBLIC_APP_URL must be an absolute http(s) URL.",
      "NEXT_PUBLIC_SUPABASE_URL must be an absolute Supabase project URL.",
      "STRIPE_RESTRICTED_KEY should use a Stripe restricted key that starts with rk_.",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_.",
      "STRIPE_WEBHOOK_SECRET must start with whsec_.",
      "STRIPE_PRO_MONTHLY_PRICE_ID must be a Stripe Price ID that starts with price_.",
    ]);
    expect(formatInvalidEnv(invalid)).not.toContain("sk_live_secret");
  });

  it("parses env files without printing values", () => {
    const filePath = path.join(mkdtempSync(path.join(tmpdir(), "posturelab-env-")), ".env.local");
    writeFileSync(filePath, 'NEXT_PUBLIC_APP_URL="https://posturelab.example"\nSTRIPE_WEBHOOK_SECRET=secret-value\n');
    const parsed = readEnvFile(filePath) as Record<string, string>;

    expect(parsed.NEXT_PUBLIC_APP_URL).toBe("https://posturelab.example");
    expect(parsed.STRIPE_WEBHOOK_SECRET).toBe("secret-value");
    expect(formatMissingEnv(["STRIPE_WEBHOOK_SECRET"])).not.toContain("secret-value");
  });
});

function validEnv() {
  const env: Partial<NodeJS.ProcessEnv> = {
    NEXT_PUBLIC_APP_URL: "https://posturelab.example",
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
    SUPABASE_SERVICE_ROLE_KEY: "sb_secret_example",
    STRIPE_RESTRICTED_KEY: "rk_live_example",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_example",
    STRIPE_WEBHOOK_SECRET: "whsec_example",
    STRIPE_PRO_MONTHLY_PRICE_ID: "price_monthly",
    STRIPE_PRO_YEARLY_PRICE_ID: "price_yearly",
  };

  return env as NodeJS.ProcessEnv;
}
