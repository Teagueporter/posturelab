import { pathToFileURL } from "node:url";

export const defaultProductionUrl = "https://posturelab-six.vercel.app";

export async function runProductionSmokeChecks({
  baseUrl = process.env.NEXT_PUBLIC_APP_URL || defaultProductionUrl,
  fetchImpl = globalThis.fetch,
  requireLiveServices = false,
} = {}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required.");
  }

  const appUrl = normalizeBaseUrl(baseUrl);
  const results = [];

  const healthResponse = await fetchImpl(`${appUrl}/api/health`, {
    headers: { accept: "application/json" },
  });
  const health = await readJson(healthResponse);
  results.push({
    name: "health endpoint",
    ok: healthResponse.ok && health?.ok === true,
    detail: health ? `supabase=${health.services?.supabase ?? "unknown"} stripe=${health.services?.stripe ?? "unknown"}` : "invalid json",
  });

  const servicesConfigured = health?.services?.supabase === "configured" && health?.services?.stripe === "configured";
  if (requireLiveServices) {
    results.push({
      name: "live service configuration",
      ok: servicesConfigured,
      detail: servicesConfigured ? "supabase and stripe configured" : "supabase and stripe must both be configured",
    });
  }

  const pricingResponse = await fetchImpl(`${appUrl}/pricing`, {
    headers: { accept: "text/html" },
  });
  const pricingHtml = await pricingResponse.text();
  const billingMissing = requireLiveServices
    ? false
    : health?.services?.supabase === "missing-env" || health?.services?.stripe === "missing-env";
  results.push({
    name: "pricing checkout state",
    ok: pricingResponse.ok && pricingPageMatchesBillingState(pricingHtml, billingMissing),
    detail: billingMissing ? "expects disabled checkout copy" : "expects checkout form availability",
  });

  const webhookResponse = await fetchImpl(`${appUrl}/api/stripe/webhook`, {
    method: "POST",
  });
  results.push({
    name: "unsigned webhook rejection",
    ok: webhookResponse.status === 400,
    detail: `status=${webhookResponse.status}`,
  });

  return {
    appUrl,
    ok: results.every((result) => result.ok),
    results,
  };
}

export function normalizeBaseUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Production smoke URL must be http(s).");
  }
  return url.toString().replace(/\/$/, "");
}

export function pricingPageMatchesBillingState(html, billingMissing) {
  if (billingMissing) {
    return html.includes("Billing is not live yet") && html.includes("Checkout not live yet") && !html.includes(">Upgrade</button>");
  }

  return !html.includes("Checkout not live yet");
}

export function formatSmokeResult(result) {
  return [
    `Production smoke checks for ${result.appUrl}: ${result.ok ? "PASS" : "FAIL"}`,
    ...result.results.map((check) => `- ${check.ok ? "PASS" : "FAIL"} ${check.name}: ${check.detail}`),
  ].join("\n");
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function main() {
  const result = await runProductionSmokeChecks({
    requireLiveServices: process.argv.includes("--require-live-services"),
  });
  const output = formatSmokeResult(result);

  if (result.ok) {
    console.log(output);
    return;
  }

  console.error(output);
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
