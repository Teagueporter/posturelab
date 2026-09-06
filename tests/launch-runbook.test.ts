import { describe, expect, it } from "vitest";
import { buildLaunchRunbook } from "../scripts/launch-runbook.mjs";

describe("launch runbook", () => {
  it("orders setup from local preflight through final launch gates", () => {
    const output = buildLaunchRunbook();

    expect(output.indexOf("1. Local preflight")).toBeLessThan(output.indexOf("2. Supabase"));
    expect(output.indexOf("2. Supabase")).toBeLessThan(output.indexOf("3. Stripe"));
    expect(output.indexOf("3. Stripe")).toBeLessThan(output.indexOf("4. Vercel"));
    expect(output.indexOf("4. Vercel")).toBeLessThan(output.indexOf("5. Final gates"));
  });

  it("includes the approval gate and required service checks", () => {
    const output = buildLaunchRunbook();

    expect(output).toContain(
      "Approval required before creation: Approve creating the Supabase project posturelab in teagueporter's projects for $0/month.",
    );
    expect(output).toContain("npm run supabase:migration-plan");
    expect(output).toContain("npm run supabase:live-check");
    expect(output).toContain("npm run stripe:live-check");
    expect(output).toContain("npm run vercel:env-check");
    expect(output).toContain("npm run vercel:deployment-check");
    expect(output).toContain("npm run launch:ready");
  });

  it("does not print secret-shaped values", () => {
    const output = buildLaunchRunbook();

    expect(output).not.toMatch(/\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]+/);
    expect(output).not.toMatch(/\bwhsec_[A-Za-z0-9]+/);
    expect(output).not.toMatch(/\b(?:sb_secret_|sb_publishable_|eyJ)[A-Za-z0-9._-]+/);
  });
});
