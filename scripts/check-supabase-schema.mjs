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
  expectContains(sql, "on storage.objects for select", failures);
  expectContains(sql, "on storage.objects for insert", failures);
  expectContains(sql, "on storage.objects for update", failures);
  expectContains(sql, "on storage.objects for delete", failures);
  expectContains(sql, "(storage.foldername(name))[1] = (select auth.uid())::text", failures);

  expectContains(sql, "create or replace function public.set_updated_at()", failures);
  expectContains(sql, "set search_path = ''", failures);

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
