import { describe, expect, it } from "vitest";
import { checkStripeCli, formatStripeCliCheck, parseStripeWhoami } from "../scripts/check-stripe-cli.mjs";

describe("Stripe CLI checker", () => {
  it("passes when Stripe CLI returns authenticated account JSON", () => {
    const result = checkStripeCli({
      runStripe: () =>
        JSON.stringify({
          account_id: "acct_123",
          account_name: "PostureLab",
          user_email: "owner@example.com",
        }),
    });

    const output = formatStripeCliCheck(result);

    expect(result.ok).toBe(true);
    expect(result.installed).toBe(true);
    expect(result.authenticated).toBe(true);
    expect(output).toContain("Stripe CLI check: PASS");
    expect(output).toContain("authenticated as PostureLab");
    expect(output).not.toContain("owner@example.com");
  });

  it("fails clearly when Stripe CLI is not installed", () => {
    const result = checkStripeCli({
      runStripe: () => {
        const error = new Error("spawnSync stripe ENOENT") as NodeJS.ErrnoException;
        error.code = "ENOENT";
        throw error;
      },
    });

    const output = formatStripeCliCheck(result);

    expect(result.ok).toBe(false);
    expect(result.installed).toBe(false);
    expect(output).toContain("Stripe CLI is not installed or not on PATH");
    expect(output).toContain("use the Stripe Dashboard");
  });

  it("parses Stripe whoami JSON after CLI preface text", () => {
    expect(parseStripeWhoami('Loading...\n{"account_id":"acct_123","account_name":"PostureLab"}')).toEqual({
      accountId: "acct_123",
      accountName: "PostureLab",
      userEmail: undefined,
    });
  });
});
