import { pathToFileURL } from "node:url";
import { stripeWebhookEvents } from "../src/lib/stripe/webhook-events.ts";

export const stripeWebhookEndpoint = "https://posturelab-six.vercel.app/api/stripe/webhook";

export function buildStripeWebhookPlan({
  endpoint = stripeWebhookEndpoint,
  events = stripeWebhookEvents,
} = {}) {
  return [
    "Stripe webhook setup plan",
    "",
    `Endpoint: ${endpoint}`,
    "",
    "Subscribe to these events:",
    ...events.map((event) => `- ${event}`),
    "",
    "Stripe CLI command:",
    `stripe webhook_endpoints create --url ${quoteShell(endpoint)} --enabled-events ${events.join(",")}`,
    "",
    "Copy the returned signing secret to STRIPE_WEBHOOK_SECRET.",
    "Then run: npm run stripe:live-check",
  ].join("\n");
}

function quoteShell(value) {
  return JSON.stringify(value);
}

async function main() {
  console.log(buildStripeWebhookPlan());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
