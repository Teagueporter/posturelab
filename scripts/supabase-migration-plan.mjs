import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { appTables, checkSupabaseSchema, migrationPath, storagePolicyOperations } from "./check-supabase-schema.mjs";
import { supabaseProjectPlan } from "./supabase-project-plan.mjs";

export function buildSupabaseMigrationPlan({
  sql = readFileSync(migrationPath, "utf8"),
  projectPlan = supabaseProjectPlan,
} = {}) {
  const failures = checkSupabaseSchema(sql);
  const storagePolicyCount = storagePolicyOperations.filter((operation) =>
    sql.includes(`on storage.objects for ${operation}`),
  ).length;

  return {
    ok: failures.length === 0,
    migrationPath,
    projectName: projectPlan.projectName,
    organizationId: projectPlan.organizationId,
    region: projectPlan.region,
    tableCount: appTables.length,
    tables: appTables,
    storageBucket: projectPlan.storageBucket,
    storagePolicyCount,
    failures,
  };
}

export function formatSupabaseMigrationPlan(plan) {
  const lines = [
    `Supabase migration plan: ${plan.ok ? "READY" : "NOT READY"}`,
    `- Migration: ${plan.migrationPath}`,
    `- Target project name: ${plan.projectName}`,
    `- Target organization ID: ${plan.organizationId}`,
    `- Target region: ${plan.region}`,
    `- Tables: ${plan.tableCount} (${plan.tables.join(", ")})`,
    `- Storage bucket: ${plan.storageBucket}`,
    `- Storage policies: ${plan.storagePolicyCount}`,
    "",
    "After the Supabase project exists, apply the migration SQL through the Supabase connector against that project ID.",
    "Then run: npm run supabase:live-check",
  ];

  if (plan.failures.length > 0) {
    lines.push("", "Migration failures:");
    lines.push(...plan.failures.map((failure) => `- ${failure}`));
  }

  return lines.join("\n");
}

async function main() {
  const plan = buildSupabaseMigrationPlan();
  const output = formatSupabaseMigrationPlan(plan);

  if (plan.ok) {
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
