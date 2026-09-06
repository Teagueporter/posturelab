import { describe, expect, it } from "vitest";
import { buildLaunchNextActions, formatLaunchNextActions } from "../scripts/launch-next.mjs";

describe("launch next actions", () => {
  it("prioritizes Supabase approval before Stripe and Vercel env setup", () => {
    const plan = buildLaunchNextActions({
      env: { NODE_ENV: "test", NEXT_PUBLIC_APP_URL: "https://posturelab-six.vercel.app" } as NodeJS.ProcessEnv,
      stripeCli: {
        ok: false,
        installed: true,
        authenticated: false,
        version: "1.50.10",
        versionOk: true,
        account: {},
        detail: "Stripe CLI is installed but not authenticated for profile default",
      },
    });

    const output = formatLaunchNextActions(plan);

    expect(plan.ready).toBe(false);
    expect(plan.actions.map((action) => action.key)).toEqual([
      "supabase-project",
      "stripe-cli",
      "stripe-catalog",
      "vercel-env",
      "final-gate",
    ]);
    expect(output).toContain(
      "Approve creating the Supabase project posturelab in teagueporter's projects for $0/month.",
    );
    expect(output).toContain("stripe login");
    expect(output).not.toMatch(/\b(?:rk_|sk_|whsec_|sb_secret_|sb_publishable_|price_)[A-Za-z0-9._-]+/);
  });

  it("collapses to the final gate when local setup blockers are cleared", () => {
    const plan = buildLaunchNextActions({
      env: validEnv(),
      stripeCli: {
        ok: true,
        installed: true,
        authenticated: true,
        version: "1.50.10",
        versionOk: true,
        account: {},
        detail: "authenticated",
      },
    });

    expect(plan.ready).toBe(true);
    expect(plan.actions.map((action) => action.key)).toEqual(["final-gate"]);
    expect(formatLaunchNextActions(plan)).toContain("READY FOR FINAL GATE");
  });
});

function validEnv() {
  return {
    NODE_ENV: "test",
    NEXT_PUBLIC_APP_URL: "https://posturelab-six.vercel.app",
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
    SUPABASE_SERVICE_ROLE_KEY: "sb_secret_example",
    STRIPE_RESTRICTED_KEY: "rk_test_example",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_example",
    STRIPE_WEBHOOK_SECRET: "whsec_example",
    STRIPE_PRO_MONTHLY_PRICE_ID: "price_monthly",
    STRIPE_PRO_YEARLY_PRICE_ID: "price_yearly",
  } as NodeJS.ProcessEnv;
}
