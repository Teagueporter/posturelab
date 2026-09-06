import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const requiredManagedDependencies = [
  "@supabase/ssr",
  "@supabase/supabase-js",
  "stripe",
  "@vercel/analytics",
  "@vercel/speed-insights",
];

export const requiredManagedFiles = [
  "src/lib/supabase/browser.ts",
  "src/lib/supabase/server.ts",
  "src/lib/supabase/middleware.ts",
  "src/lib/storage/cloud.ts",
  "src/lib/stripe/server.ts",
  "src/app/api/stripe/webhook/route.ts",
  "supabase/migrations/20260906052834_initial_production_schema.sql",
];

export const disallowedDependencies = [
  "firebase",
  "next-auth",
  "auth.js",
  "passport",
  "prisma",
  "typeorm",
  "sequelize",
  "mongoose",
  "bull",
  "agenda",
];

export function managedServiceMessages({ cwd = process.cwd() } = {}) {
  const packageJson = readJson(`${cwd}/package.json`);
  const allDependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  const messages = [];

  for (const dependency of requiredManagedDependencies) {
    if (!allDependencies[dependency]) {
      messages.push(`Missing managed-service dependency: ${dependency}`);
    }
  }

  for (const dependency of disallowedDependencies) {
    if (allDependencies[dependency]) {
      messages.push(`Unexpected custom/substitute infrastructure dependency: ${dependency}`);
    }
  }

  for (const filePath of requiredManagedFiles) {
    if (!existsSync(`${cwd}/${filePath}`)) {
      messages.push(`Missing managed-service integration file: ${filePath}`);
    }
  }

  const stripeServer = readIfExists(`${cwd}/src/lib/stripe/server.ts`);
  if (!stripeServer.includes("new Stripe(") || !stripeServer.includes("STRIPE_RESTRICTED_KEY")) {
    messages.push("Stripe runtime must use the official Stripe client with STRIPE_RESTRICTED_KEY.");
  }

  const checkoutAction = readIfExists(`${cwd}/src/app/pricing/actions.ts`);
  if (!checkoutAction.includes("checkout.sessions.create") || !checkoutAction.includes('mode: "subscription"')) {
    messages.push("Billing must use Stripe subscription Checkout Sessions.");
  }
  if (checkoutAction.includes("payment_method_types")) {
    messages.push("Stripe Checkout must use dynamic payment methods, not hardcoded payment_method_types.");
  }

  const accountActions = readIfExists(`${cwd}/src/app/account/actions.ts`);
  if (!accountActions.includes("billingPortal.sessions.create")) {
    messages.push("Billing self-service must use the Stripe Customer Portal.");
  }

  const migration = readIfExists(`${cwd}/supabase/migrations/20260906052834_initial_production_schema.sql`);
  if (!migration.includes("enable row level security")) {
    messages.push("Supabase public tables must be protected by RLS.");
  }
  if (!migration.includes("'scan-images'") || !migration.includes("storage.objects")) {
    messages.push("Scan photo storage must use Supabase private Storage policies.");
  }
  if (!migration.includes("stripe_webhook_events")) {
    messages.push("Stripe webhook dedupe must stay in Supabase Postgres.");
  }

  const layout = readIfExists(`${cwd}/src/app/layout.tsx`);
  if (!layout.includes("@vercel/analytics/next") || !layout.includes("@vercel/speed-insights/next")) {
    messages.push("Launch observability must use Vercel Web Analytics and Speed Insights.");
  }

  return messages;
}

export function formatManagedServiceMessages(messages) {
  return ["Managed service boundary check failed:", ...messages.map((message) => `- ${message}`)].join("\n");
}

function main() {
  const messages = managedServiceMessages();
  if (messages.length > 0) {
    console.error(formatManagedServiceMessages(messages));
    process.exit(1);
  }

  console.log("Managed service boundary check: PASS");
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function readIfExists(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
