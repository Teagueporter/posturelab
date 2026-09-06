import { pathToFileURL } from "node:url";
import { appTables, migrationPath } from "./check-supabase-schema.mjs";

export const supabaseProjectPlan = {
  projectName: "posturelab",
  organizationName: "teagueporter's projects",
  organizationId: "vercel_icfg_qqsgYASShKraJS8qi3PBxC9e",
  region: "us-west-1",
  quotedCost: "$0/month",
  migrationPath,
  storageBucket: "scan-images",
  redirectUrls: [
    "http://localhost:3000/auth/callback",
    "https://posturelab-six.vercel.app/auth/callback",
  ],
  requiredEnv: [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ],
};

export function buildSupabaseProjectPlan({
  plan = supabaseProjectPlan,
  tables = appTables,
} = {}) {
  return [
    "Supabase project setup plan",
    "",
    "Connector-verified target:",
    `- Project: ${plan.projectName}`,
    `- Organization: ${plan.organizationName}`,
    `- Organization ID: ${plan.organizationId}`,
    `- Suggested region: ${plan.region}`,
    `- Current quoted project cost: ${plan.quotedCost}`,
    "",
    "Approval phrase:",
    `Approve creating the Supabase project ${plan.projectName} in ${plan.organizationName} for ${plan.quotedCost}.`,
    "",
    "After the project exists:",
    `1. Apply ${plan.migrationPath}.`,
    `2. Confirm these app tables are present: ${tables.join(", ")}.`,
    `3. Confirm the ${plan.storageBucket} bucket exists and is private.`,
    `4. Add Auth redirect URLs: ${plan.redirectUrls.join(", ")}.`,
    `5. Add local env vars: ${plan.requiredEnv.join(", ")}.`,
    "6. Run npm run supabase:live-check.",
  ].join("\n");
}

async function main() {
  console.log(buildSupabaseProjectPlan());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
