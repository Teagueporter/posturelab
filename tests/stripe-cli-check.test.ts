import { describe, expect, it } from "vitest";
import { checkStripeCli, formatStripeCliCheck, parseStripeCliVersion, parseStripeWhoami } from "../scripts/check-stripe-cli.mjs";

describe("Stripe CLI checker", () => {
  it("passes when Stripe CLI returns authenticated account JSON", () => {
    const result = checkStripeCli({
      runStripe: nextRunStripe([
          "stripe version 1.50.10\n",
          JSON.stringify({
            account_id: "acct_123",
            account_name: "PostureLab",
            user_email: "owner@example.com",
          }),
        ]),
    });

    const output = formatStripeCliCheck(result);

    expect(result.ok).toBe(true);
    expect(result.installed).toBe(true);
    expect(result.version).toBe("1.50.10");
    expect(result.versionOk).toBe(true);
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

  it("reports unauthenticated Stripe CLI JSON without treating the CLI as missing", () => {
    const result = checkStripeCli({
      runStripe: nextRunStripe([
        "stripe version 1.50.10\n",
        () => {
        const error = new Error("Command failed: stripe whoami --format json") as Error & { stdout: string };
        error.stdout = JSON.stringify({
          authenticated: false,
          profile_name: "default",
        });
        throw error;
        },
      ]),
    });

    const output = formatStripeCliCheck(result);

    expect(result.ok).toBe(false);
    expect(result.installed).toBe(true);
    expect(result.version).toBe("1.50.10");
    expect(result.versionOk).toBe(true);
    expect(result.authenticated).toBe(false);
    expect(output).toContain("Stripe CLI is installed but not authenticated for profile default");
  });

  it("fails when Stripe CLI is older than the documented setup minimum", () => {
    const result = checkStripeCli({
      runStripe: nextRunStripe([
        "stripe version 1.42.0\n",
        JSON.stringify({
          authenticated: true,
          account_name: "PostureLab",
        }),
      ]),
    });

    const output = formatStripeCliCheck(result);

    expect(result.ok).toBe(false);
    expect(result.version).toBe("1.42.0");
    expect(result.versionOk).toBe(false);
    expect(output).toContain("Version: 1.42.0, expected 1.43.3+");
    expect(output).toContain("Stripe CLI must be 1.43.3+");
  });

  it("parses Stripe CLI version output", () => {
    expect(parseStripeCliVersion("stripe version 1.50.10\nChecking for new versions...")).toBe("1.50.10");
    expect(parseStripeCliVersion("no version here")).toBeNull();
  });

  it("parses Stripe whoami JSON after CLI preface text", () => {
    expect(parseStripeWhoami('Loading...\n{"account_id":"acct_123","account_name":"PostureLab"}')).toEqual({
      accountId: "acct_123",
      accountName: "PostureLab",
      userEmail: undefined,
      authenticated: undefined,
      profileName: undefined,
    });
  });
});

function nextRunStripe(outputs: Array<string | (() => string)>): () => string {
  return () => nextOutput(outputs);
}

function nextOutput(outputs: Array<string | (() => string)>): string {
  const output = outputs.shift();
  if (typeof output === "function") return output();
  return output ?? "";
}
