import { describe, expect, it } from "vitest";
import { buildVercelEnvPlan, formatVercelEnvPlan } from "../scripts/vercel-env-plan.mjs";

describe("Vercel env planner", () => {
  it("summarizes missing variables without printing values", () => {
    const plan = buildVercelEnvPlan({
      env: {
        NODE_ENV: "test",
        NEXT_PUBLIC_APP_URL: "https://posturelab.example",
        STRIPE_RESTRICTED_KEY: "rk_test_x",
      } as NodeJS.ProcessEnv,
    });

    const output = formatVercelEnvPlan(plan);

    expect(plan.ok).toBe(false);
    expect(plan.ready.map((item) => item.name)).toEqual(["NEXT_PUBLIC_APP_URL", "STRIPE_RESTRICTED_KEY"]);
    expect(output).toContain("Vercel env plan: NOT READY");
    expect(output).toContain("vercel env add STRIPE_RESTRICTED_KEY production preview development");
    expect(output).not.toContain("rk_test_x");
    expect(output).not.toContain("https://posturelab.example");
  });

  it("marks service keys and webhook secrets as sensitive", () => {
    const plan = buildVercelEnvPlan({ env: validEnv() });

    expect(plan.ok).toBe(true);
    expect(
      plan.ready
        .filter((item) => item.sensitive)
        .map((item) => item.name)
        .sort(),
    ).toEqual(["STRIPE_RESTRICTED_KEY", "STRIPE_WEBHOOK_SECRET", "SUPABASE_SERVICE_ROLE_KEY"]);
  });
});

function validEnv() {
  return {
    NODE_ENV: "test",
    NEXT_PUBLIC_APP_URL: "https://posturelab.example",
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
