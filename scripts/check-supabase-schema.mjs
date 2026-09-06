import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const migrationPath = "supabase/migrations/20260906052834_initial_production_schema.sql";

export const appTables = [
  "profiles",
  "scans",
  "check_ins",
  "workout_completions",
  "weekly_reviews",
  "subscriptions",
  "stripe_webhook_events",
];

export const userOwnedTables = {
  profiles: "id",
  scans: "user_id",
  check_ins: "user_id",
  workout_completions: "user_id",
  weekly_reviews: "user_id",
  subscriptions: "user_id",
};

export const storagePolicyOperations = ["select", "insert", "update", "delete"];

export function checkSupabaseSchema(sql = readFileSync(migrationPath, "utf8")) {
  const failures = [];

  for (const table of appTables) {
    expectContains(sql, `alter table public.${table} enable row level security;`, failures);
  }

  for (const table of ["profiles", "scans", "check_ins", "workout_completions", "weekly_reviews", "subscriptions"]) {
    expectContains(sql, `on public.${table}`, failures);
    expectContains(sql, "to authenticated", failures);
    expectContains(sql, "(select auth.uid())", failures);
  }

  for (const [table, ownerColumn] of Object.entries(userOwnedTables)) {
    const policyBlocks = policyBlocksForTable(sql, `public.${table}`);
    if (policyBlocks.length === 0) {
      failures.push(`Missing authenticated RLS policies for public.${table}`);
      continue;
    }
    expectPolicyBlock(policyBlocks, table, "select", "using", `(select auth.uid()) = ${ownerColumn}`, failures);
    if (table !== "subscriptions") {
      expectPolicyBlock(policyBlocks, table, "insert", "with check", `(select auth.uid()) = ${ownerColumn}`, failures);
    }
    if (table === "profiles" || table === "scans") {
      expectPolicyBlock(policyBlocks, table, "update", "using", `(select auth.uid()) = ${ownerColumn}`, failures);
      expectPolicyBlock(policyBlocks, table, "update", "with check", `(select auth.uid()) = ${ownerColumn}`, failures);
    }
  }

  expectContains(sql, "create table if not exists public.stripe_webhook_events", failures);
  expectContains(sql, "id text primary key", failures);
  expectContains(sql, "check (status in ('processing', 'processed', 'failed'))", failures);
  for (const operation of ["select", "insert", "update", "delete"]) {
    expectNotContains(sql, `on public.stripe_webhook_events for ${operation}`, failures);
  }

  expectContains(sql, "grant usage on schema public to authenticated;", failures);
  expectContains(sql, "grant select, insert, update on public.profiles to authenticated;", failures);
  expectContains(sql, "grant select, insert, update, delete on public.scans to authenticated;", failures);
  expectContains(sql, "grant select, insert, update, delete on public.check_ins to authenticated;", failures);
  expectContains(sql, "grant select, insert, update, delete on public.workout_completions to authenticated;", failures);
  expectContains(sql, "grant select, insert, update, delete on public.weekly_reviews to authenticated;", failures);
  expectContains(sql, "grant select on public.subscriptions to authenticated;", failures);
  expectNotContains(sql, " to anon;", failures);

  expectContains(sql, "'scan-images'", failures);
  expectContains(sql, "false,\n  10485760", failures);
  expectContains(sql, "array['image/jpeg', 'image/png', 'image/webp']", failures);
  for (const operation of storagePolicyOperations) {
    expectContains(sql, `on storage.objects for ${operation}`, failures);
  }
  expectContains(sql, "(storage.foldername(name))[1] = (select auth.uid())::text", failures);
  expectStoragePolicyCoverage(sql, failures);

  expectContains(sql, "create or replace function public.set_updated_at()", failures);
  expectContains(sql, "set search_path = ''", failures);
  expectNotContains(sql.toLowerCase(), "security definer", failures);
  expectNotContains(sql, "auth.role()", failures);

  return failures;
}

export function formatSchemaFailures(failures) {
  return ["Supabase schema check failed:", ...failures.map((failure) => `- ${failure}`)].join("\n");
}

function expectContains(sql, needle, failures) {
  if (!sql.includes(needle)) {
    failures.push(`Missing required SQL: ${needle}`);
  }
}

function expectNotContains(sql, needle, failures) {
  if (sql.includes(needle)) {
    failures.push(`Forbidden SQL found: ${needle}`);
  }
}

function policyBlocksForTable(sql, tableName) {
  return Array.from(sql.matchAll(/create policy[\s\S]*?;\s*(?=\n|$)/gi), (match) => match[0])
    .filter((block) => block.includes(`on ${tableName}`));
}

function expectPolicyBlock(blocks, table, operation, clause, predicate, failures) {
  const matchingBlock = blocks.find((block) => block.includes(` for ${operation}`) || block.includes(" for all"));
  if (!matchingBlock) {
    failures.push(`Missing ${operation} policy for public.${table}`);
    return;
  }
  if (!matchingBlock.includes("to authenticated")) {
    failures.push(`Missing authenticated target on ${operation} policy for public.${table}`);
  }
  if (!matchingBlock.includes(clause)) {
    failures.push(`Missing ${clause} clause on ${operation} policy for public.${table}`);
  }
  if (!matchingBlock.includes(predicate)) {
    failures.push(`Missing ownership predicate on ${operation} policy for public.${table}: ${predicate}`);
  }
}

function expectStoragePolicyCoverage(sql, failures) {
  const storageBlocks = policyBlocksForTable(sql, "storage.objects");
  for (const operation of storagePolicyOperations) {
    const matchingBlock = storageBlocks.find((block) => block.includes(` for ${operation}`));
    if (!matchingBlock) {
      failures.push(`Missing ${operation} storage policy for scan-images`);
      continue;
    }
    if (!matchingBlock.includes("to authenticated")) {
      failures.push(`Missing authenticated target on ${operation} storage policy`);
    }
    if (!matchingBlock.includes("bucket_id = 'scan-images'")) {
      failures.push(`Missing scan-images bucket guard on ${operation} storage policy`);
    }
    if (!matchingBlock.includes("(storage.foldername(name))[1] = (select auth.uid())::text")) {
      failures.push(`Missing user folder guard on ${operation} storage policy`);
    }
    if ((operation === "insert" || operation === "update") && !matchingBlock.includes("with check")) {
      failures.push(`Missing with check on ${operation} storage policy`);
    }
  }
}

function main() {
  const failures = checkSupabaseSchema();
  if (failures.length === 0) {
    console.log("Supabase schema check passed.");
    return;
  }

  console.error(formatSchemaFailures(failures));
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
