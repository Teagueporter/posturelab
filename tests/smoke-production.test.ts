import { describe, expect, it } from "vitest";
import {
  formatSmokeResult,
  normalizeBaseUrl,
  pricingPageMatchesBillingState,
  runProductionSmokeChecks,
} from "../scripts/smoke-production.mjs";

describe("production smoke checker", () => {
  it("normalizes the production base URL", () => {
    expect(normalizeBaseUrl("https://posturelab-six.vercel.app/")).toBe("https://posturelab-six.vercel.app");
  });

  it("rejects non-http smoke URLs", () => {
    expect(() => normalizeBaseUrl("ftp://example.com")).toThrow("Production smoke URL must be http(s).");
  });

  it("expects disabled pricing checkout controls while billing env is missing", () => {
    expect(pricingPageMatchesBillingState("Billing is not live yet Checkout not live yet", true)).toBe(true);
    expect(pricingPageMatchesBillingState("Billing is not live yet <button>Upgrade</button>", true)).toBe(false);
  });

  it("expects live pricing controls once billing is configured", () => {
    expect(pricingPageMatchesBillingState("<form><button>Upgrade</button></form>", false)).toBe(true);
    expect(pricingPageMatchesBillingState("Checkout not live yet", false)).toBe(false);
  });

  it("checks health, pricing, and webhook behavior without exposing secrets", async () => {
    const calls: string[] = [];
    const fetchImpl = async (input: string | URL, init?: RequestInit) => {
      const url = input.toString();
      calls.push(`${init?.method ?? "GET"} ${url}`);

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
        return new Response("Billing is not live yet Checkout not live yet", {
          status: 200,
          headers: { "content-type": "text/html" },
        });
      }

      return Response.json({ error: "Missing Stripe signature" }, { status: 400 });
    };

    const result = await runProductionSmokeChecks({
      baseUrl: "https://posturelab-six.vercel.app/",
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(result.ok).toBe(true);
    expect(result.results).toHaveLength(3);
    expect(calls).toEqual([
      "GET https://posturelab-six.vercel.app/api/health",
      "GET https://posturelab-six.vercel.app/pricing",
      "POST https://posturelab-six.vercel.app/api/stripe/webhook",
    ]);
    expect(formatSmokeResult(result)).toContain("Production smoke checks for https://posturelab-six.vercel.app: PASS");
    expect(JSON.stringify(result)).not.toContain("rk_");
    expect(JSON.stringify(result)).not.toContain("whsec_");
  });

  it("can require live Supabase and Stripe services for launch readiness", async () => {
    const result = await runProductionSmokeChecks({
      baseUrl: "https://posturelab-six.vercel.app/",
      fetchImpl: liveServicesFetch as typeof fetch,
      requireLiveServices: true,
    });

    expect(result.ok).toBe(true);
    expect(result.results.map((check) => check.name)).toEqual([
      "health endpoint",
      "live service configuration",
      "pricing checkout state",
      "unsigned webhook rejection",
    ]);
    expect(formatSmokeResult(result)).toContain("PASS live service configuration");
  });

  it("fails launch readiness when production services are still missing", async () => {
    const result = await runProductionSmokeChecks({
      baseUrl: "https://posturelab-six.vercel.app/",
      fetchImpl: missingServicesFetch as typeof fetch,
      requireLiveServices: true,
    });

    expect(result.ok).toBe(false);
    expect(result.results.find((check) => check.name === "live service configuration")?.ok).toBe(false);
    expect(result.results.find((check) => check.name === "pricing checkout state")?.ok).toBe(false);
  });
});

async function liveServicesFetch(input: string | URL) {
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
    return new Response("<form><button>Upgrade</button></form>", {
      status: 200,
      headers: { "content-type": "text/html" },
    });
  }

  return Response.json({ error: "Missing Stripe signature" }, { status: 400 });
}

async function missingServicesFetch(input: string | URL) {
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
    return new Response("Billing is not live yet Checkout not live yet", {
      status: 200,
      headers: { "content-type": "text/html" },
    });
  }

  return Response.json({ error: "Missing Stripe signature" }, { status: 400 });
}
