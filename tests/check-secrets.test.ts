import { describe, expect, it } from "vitest";
import { findSecretsInText } from "../scripts/check-secrets.mjs";

const join = (...parts: string[]) => parts.join("");

describe("secret scanner", () => {
  it("detects Stripe and Supabase secret-shaped values", () => {
    const text = [
      join("sk_", "live_", "abcdefghijklmnopqrstuvwxyz123456"),
      join("rk_", "test_", "abcdefghijklmnopqrstuvwxyz123456"),
      join("whsec_", "abcdefghijklmnopqrstuvwxyz123456"),
      join("sb_", "secret_", "abcdefghijklmnopqrstuvwxyz123456"),
    ].join("\n");

    expect(findSecretsInText(text, "fixture.txt").map((finding) => finding.name)).toEqual([
      "Stripe secret key",
      "Stripe restricted key",
      "Stripe webhook secret",
      "Supabase secret key",
    ]);
  });

  it("does not flag documented placeholder prefixes or short test fixtures", () => {
    const text = [
      "STRIPE_RESTRICTED_KEY=rk_...",
      "STRIPE_WEBHOOK_SECRET=whsec_...",
      "SUPABASE_SERVICE_ROLE_KEY=...",
      "rk_test_example",
      "whsec_example",
      "sb_secret_example",
    ].join("\n");

    expect(findSecretsInText(text, "fixture.txt")).toEqual([]);
  });
});
