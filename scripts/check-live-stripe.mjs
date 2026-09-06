import { pathToFileURL } from "node:url";
import Stripe from "stripe";
import { envWithLocalFile, invalidEnvMessages } from "./setup-check.mjs";

export const requiredStripeLiveEnv = [
  "STRIPE_RESTRICTED_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRO_MONTHLY_PRICE_ID",
  "STRIPE_PRO_YEARLY_PRICE_ID",
];

export const expectedStripePrices = [
  { name: "monthly", envName: "STRIPE_PRO_MONTHLY_PRICE_ID", interval: "month" },
  { name: "yearly", envName: "STRIPE_PRO_YEARLY_PRICE_ID", interval: "year" },
];

export async function checkLiveStripe({
  env = envWithLocalFile(),
  stripe = createLiveStripeClient(env),
  prices = expectedStripePrices,
} = {}) {
  const missing = requiredStripeLiveEnv.filter((name) => !env[name]);
  const invalid = invalidEnvMessages(env).filter((message) => message.startsWith("STRIPE_") || message.startsWith("NEXT_PUBLIC_STRIPE_"));

  if (missing.length > 0 || invalid.length > 0) {
    return {
      ok: false,
      missing,
      invalid,
      priceChecks: [],
    };
  }

  const priceChecks = [];
  for (const price of prices) {
    priceChecks.push(await checkStripePrice(stripe, env[price.envName], price));
  }

  return {
    ok: priceChecks.every((check) => check.ok),
    missing,
    invalid,
    priceChecks,
  };
}

export function formatLiveStripeCheck(result) {
  const lines = [`Live Stripe check: ${result.ok ? "PASS" : "FAIL"}`];

  if (result.missing.length > 0) {
    lines.push("Missing Stripe env vars:");
    lines.push(...result.missing.map((name) => `- ${name}`));
  }

  if (result.invalid.length > 0) {
    lines.push("Invalid Stripe env vars:");
    lines.push(...result.invalid.map((message) => `- ${message}`));
  }

  if (result.priceChecks.length > 0) {
    lines.push("Prices:");
    lines.push(...result.priceChecks.map((check) => `- ${check.ok ? "PASS" : "FAIL"} ${check.name}: ${check.detail}`));
  }

  return lines.join("\n");
}

function createLiveStripeClient(env) {
  if (!env.STRIPE_RESTRICTED_KEY) return null;

  return new Stripe(env.STRIPE_RESTRICTED_KEY, {
    apiVersion: "2026-08-26.dahlia",
    typescript: true,
  });
}

async function checkStripePrice(stripe, priceId, expected) {
  if (!stripe) {
    return {
      name: expected.name,
      ok: false,
      detail: "Stripe client unavailable",
    };
  }

  try {
    const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
    const recurringInterval = price.recurring?.interval ?? null;
    const productActive = typeof price.product === "object" && price.product ? price.product.active !== false : true;
    const ok = price.active === true && recurringInterval === expected.interval && productActive;

    return {
      name: expected.name,
      ok,
      detail: ok ? `${expected.interval} recurring price active` : priceFailureDetail(price.active, recurringInterval, expected.interval, productActive),
    };
  } catch (error) {
    return {
      name: expected.name,
      ok: false,
      detail: safeError(error),
    };
  }
}

function priceFailureDetail(priceActive, actualInterval, expectedInterval, productActive) {
  const failures = [];
  if (priceActive !== true) failures.push("price inactive");
  if (actualInterval !== expectedInterval) failures.push(`expected ${expectedInterval} interval`);
  if (!productActive) failures.push("product inactive");
  return failures.join(", ") || "price check failed";
}

function safeError(error) {
  if (error instanceof Error && error.message) return error.message;
  return "Stripe request failed";
}

async function main() {
  const result = await checkLiveStripe();
  const output = formatLiveStripeCheck(result);

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
