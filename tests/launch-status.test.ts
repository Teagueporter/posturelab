import { describe, expect, it } from "vitest";
import { buildLaunchStatus, formatLaunchStatus, launchStatusExitCode } from "../scripts/launch-status.mjs";

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

  it("can include live Supabase and Stripe checks without printing secrets", async () => {
    const status = await buildLaunchStatus({
      env: validEnv(),
      fetchImpl: fakeLiveSmokeFetch as typeof fetch,
      runGit: fakeGit,
      includeLiveServices: true,
      liveSupabaseCheck: Promise.resolve({ ok: true, missing: [], invalid: [], tableChecks: [], storage: { ok: true, detail: "private" } }),
      liveStripeCheck: Promise.resolve({ ok: true, missing: [], invalid: [], priceChecks: [] }),
    });

    const output = formatLaunchStatus(status);

    expect(status.ok).toBe(true);
    expect(output).toContain("Live Supabase: pass");
    expect(output).toContain("Live Stripe: pass");
    expect(output).not.toContain("rk_test_example");
    expect(output).not.toContain("sb_secret_example");
  });

  it("can include Vercel env presence in the final readiness gate", async () => {
    const status = await buildLaunchStatus({
      env: validEnv(),
      fetchImpl: fakeLiveSmokeFetch as typeof fetch,
      runGit: fakeGit,
      includeLiveServices: true,
      includeVercelEnv: true,
      liveSupabaseCheck: Promise.resolve({ ok: true, missing: [], invalid: [], tableChecks: [], storage: { ok: true, detail: "private" } }),
      liveStripeCheck: Promise.resolve({ ok: true, missing: [], invalid: [], priceChecks: [] }),
      vercelEnvCheck: { ok: true, checks: [{ name: "NEXT_PUBLIC_APP_URL", present: true, configuredTargets: ["production", "preview", "development"], missingTargets: [], ok: true }] },
    });

    const output = formatLaunchStatus(status);

    expect(status.ok).toBe(true);
    expect(output).toContain("Vercel env: pass");
  });

  it("surfaces live service failures when requested", async () => {
    const status = await buildLaunchStatus({
      env: validEnv(),
      fetchImpl: fakeLiveSmokeFetch as typeof fetch,
      runGit: fakeGit,
      includeLiveServices: true,
      includeVercelEnv: true,
      liveSupabaseCheck: Promise.resolve({
        ok: false,
        missing: [],
        invalid: [],
        tableChecks: [{ table: "scans", ok: false, detail: "permission denied" }],
        storage: { ok: false, detail: "scan-images bucket is missing" },
      }),
      liveStripeCheck: Promise.resolve({
        ok: false,
        missing: [],
        invalid: [],
        priceChecks: [{ name: "monthly", ok: false, detail: "expected month interval" }],
      }),
      vercelEnvCheck: {
        ok: false,
        checks: [{ name: "STRIPE_RESTRICTED_KEY", present: false, configuredTargets: [], missingTargets: ["production", "preview", "development"], ok: false }],
      },
    });

    const output = formatLaunchStatus(status);

    expect(status.ok).toBe(false);
    expect(output).toContain("Live Supabase failures:");
    expect(output).toContain("scans: permission denied");
    expect(output).toContain("storage: scan-images bucket is missing");
    expect(output).toContain("monthly: expected month interval");
    expect(output).toContain("Vercel env failures:");
    expect(output).toContain("missing STRIPE_RESTRICTED_KEY");
  });

  it("keeps normal status informational but makes readiness gate fail when not ready", async () => {
    const status = await buildLaunchStatus({
      env: {
        NODE_ENV: "test",
        NEXT_PUBLIC_APP_URL: "https://posturelab-six.vercel.app",
      } as NodeJS.ProcessEnv,
      fetchImpl: fakeSmokeFetch as typeof fetch,
      runGit: fakeGit,
    });

    expect(status.ok).toBe(false);
    expect(launchStatusExitCode(status)).toBe(0);
    expect(launchStatusExitCode(status, { failOnNotReady: true })).toBe(1);
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

async function fakeLiveSmokeFetch(input: string | URL) {
  const url = input.toString();
  if (url.endsWith("/api/health")) {
    return Response.json({
      ok: true,
      services: {
        supabase: "configured",
        stripe: "configured",
      },
    });
  }
  if (url.endsWith("/pricing")) {
    return new Response("<form><button>Upgrade</button></form>");
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
