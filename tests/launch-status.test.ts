import { describe, expect, it } from "vitest";
import { buildLaunchStatus, formatLaunchStatus } from "../scripts/launch-status.mjs";

describe("launch status command", () => {
  it("summarizes missing env vars, schema checks, production smoke, and git state", async () => {
    const status = await buildLaunchStatus({
      env: {
        NODE_ENV: "test",
        NEXT_PUBLIC_APP_URL: "https://posturelab-six.vercel.app",
      } as NodeJS.ProcessEnv,
      fetchImpl: fakeSmokeFetch as typeof fetch,
      runGit: fakeGit,
    });

    expect(status.ok).toBe(false);
    expect(status.git.clean).toBe(true);
    expect(status.localEnvironment.missing).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(status.supabaseSchema.ok).toBe(true);
    expect(status.productionSmoke.ok).toBe(true);
    expect(formatLaunchStatus(status)).toContain("Launch status: NOT READY");
  });

  it("ignores the personal GitHub profile draft when summarizing app launch cleanliness", async () => {
    const status = await buildLaunchStatus({
      env: validEnv(),
      fetchImpl: fakeSmokeFetch as typeof fetch,
      runGit(args) {
        if (args.join(" ") === "branch --show-current") return "main\n";
        return "?? GITHUB_PROFILE_README_DRAFT.md\n";
      },
    });

    expect(status.git.clean).toBe(true);
  });
});

async function fakeSmokeFetch(input: string | URL) {
  const url = input.toString();
  if (url.endsWith("/api/health")) {
    return Response.json({
      ok: true,
      services: {
        supabase: "missing-env",
        stripe: "missing-env",
      },
    });
  }
  if (url.endsWith("/pricing")) {
    return new Response("Billing is not live yet Checkout not live yet");
  }
  return new Response("{}", { status: 400 });
}

function fakeGit(args: string[]) {
  if (args.join(" ") === "branch --show-current") return "main\n";
  return "";
}

function validEnv() {
  return {
    NEXT_PUBLIC_APP_URL: "https://posturelab-six.vercel.app",
    NODE_ENV: "test",
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
