import { pathToFileURL } from "node:url";
import { supabaseProjectPlan } from "./supabase-project-plan.mjs";
import { stripeCatalogItems } from "./stripe-catalog-plan.mjs";
import { requiredEnvNames } from "./setup-check.mjs";

export function buildLaunchRunbook({
  supabasePlan = supabaseProjectPlan,
  stripeItems = stripeCatalogItems,
  envNames = requiredEnvNames,
  productionUrl = "https://posturelab-six.vercel.app",
} = {}) {
  const stripeEnvNames = stripeItems.map((item) => item.priceEnvName);

  return [
    "PostureLab launch runbook",
    "",
    "1. Local preflight",
    "- Run npm run verify.",
    "- Run npm run smoke:prod to confirm the current production shell still responds.",
    "",
    "2. Supabase",
    "- Run npm run supabase:project-plan.",
    `- Approval required before creation: Approve creating the Supabase project ${supabasePlan.projectName} in ${supabasePlan.organizationName} for ${supabasePlan.quotedCost}.`,
    `- Apply ${supabasePlan.migrationPath}.`,
    `- Add Auth redirect URLs: ${supabasePlan.redirectUrls.join(", ")}.`,
    "- Fill local Supabase env vars, then run npm run supabase:live-check.",
    "",
    "3. Stripe",
    "- Run npm run stripe:catalog-plan.",
    `- Create recurring prices for env vars: ${stripeEnvNames.join(", ")}.`,
    "- Create the restricted runtime key and webhook signing secret.",
    `- Create the webhook endpoint: ${productionUrl}/api/stripe/webhook.`,
    "- Fill local Stripe env vars, then run npm run stripe:live-check.",
    "",
    "4. Vercel",
    `- Required env vars: ${envNames.join(", ")}.`,
    "- Run npm run vercel:env-plan and add each value through Vercel prompts.",
    "- Run npm run vercel:env-check after Vercel env vars are added.",
    "- Redeploy production.",
    "",
    "5. Final gates",
    "- Run npm run smoke:ready.",
    "- Run npm run launch:ready.",
    `- Confirm ${productionUrl}/api/health reports Supabase and Stripe as configured.`,
  ].join("\n");
}

async function main() {
  console.log(buildLaunchRunbook());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
