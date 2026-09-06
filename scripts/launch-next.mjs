import { pathToFileURL } from "node:url";
import { checkStripeCli } from "./check-stripe-cli.mjs";
import { envWithLocalFile, missingEnvNames } from "./setup-check.mjs";
import { supabaseProjectPlan } from "./supabase-project-plan.mjs";

const supabaseEnvNames = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const stripeEnvNames = [
  "STRIPE_RESTRICTED_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRO_MONTHLY_PRICE_ID",
  "STRIPE_PRO_YEARLY_PRICE_ID",
];

export function buildLaunchNextActions({
  env = envWithLocalFile(),
  stripeCli = checkStripeCli(),
  supabasePlan = supabaseProjectPlan,
} = {}) {
  const missing = missingEnvNames(env);
  const missingSupabase = supabaseEnvNames.filter((name) => missing.includes(name));
  const missingStripe = stripeEnvNames.filter((name) => missing.includes(name));
  const actions = [];

  if (missingSupabase.length > 0) {
    const publicSupabaseReady = Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
    if (publicSupabaseReady) {
      actions.push({
        key: "supabase-config",
        title: "Finish Supabase configuration",
        detail: `Project URL and publishable key are set. Add Auth redirect URLs, fill ${missingSupabase.join(", ")}, then run npm run supabase:live-check.`,
        command: "Supabase Dashboard: Authentication > URL Configuration and Project Settings > API",
      });
    } else {
      actions.push({
        key: "supabase-project",
        title: "Create and configure Supabase",
        detail: `Approve project creation, apply ${supabasePlan.migrationPath}, add Auth redirect URLs, then fill ${missingSupabase.join(", ")}.`,
        command: `Approve creating the Supabase project ${supabasePlan.projectName} in ${supabasePlan.organizationName} for ${supabasePlan.quotedCost}.`,
      });
    }
  }

  if (!stripeCli.ok) {
    actions.push({
      key: "stripe-cli",
      title: "Authenticate Stripe CLI or use Dashboard setup",
      detail: stripeCli.detail,
      command: stripeCli.installed ? "stripe login" : "npm install",
    });
  }

  if (missingStripe.length > 0) {
    actions.push({
      key: "stripe-catalog",
      title: "Create Stripe billing objects",
      detail: `Create the Pro product, monthly/yearly prices, restricted runtime key, and webhook, then fill ${missingStripe.join(", ")}.`,
      command: "npm run stripe:catalog-plan && npm run stripe:key-plan && npm run stripe:webhook-plan",
    });
  }

  if (missing.length > 0) {
    actions.push({
      key: "vercel-env",
      title: "Add production and preview env vars to Vercel",
      detail: "After local env values exist, add them to Vercel with sensitivity flags and redeploy production.",
      command: "npm run vercel:env-plan && npm run vercel:env-check",
    });
  }

  actions.push({
    key: "final-gate",
    title: "Run the final launch gate",
    detail: "This should pass only after Supabase, Stripe, Vercel env vars, and production redeploy are complete.",
    command: "npm run launch:ready",
  });

  return {
    ready: actions.length === 1 && missing.length === 0 && stripeCli.ok,
    missing,
    actions,
  };
}

export function formatLaunchNextActions(plan) {
  const lines = [
    `Next launch actions: ${plan.ready ? "READY FOR FINAL GATE" : "BLOCKED"}`,
  ];

  plan.actions.forEach((action, index) => {
    lines.push(`${index + 1}. ${action.title}`);
    lines.push(`   ${action.detail}`);
    lines.push(`   ${action.command}`);
  });

  return lines.join("\n");
}

function main() {
  const plan = buildLaunchNextActions();
  console.log(formatLaunchNextActions(plan));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
