import { describe, expect, it } from "vitest";
import { appTables, checkSupabaseSchema, formatSchemaFailures, migrationPath } from "../scripts/check-supabase-schema.mjs";

describe("Supabase schema checker script", () => {
  it("points at the production migration", () => {
    expect(migrationPath).toBe("supabase/migrations/20260906052834_initial_production_schema.sql");
  });

  it("passes the current production migration", () => {
    expect(checkSupabaseSchema()).toEqual([]);
  });

  it("tracks every app table that must have RLS enabled", () => {
    expect(appTables).toEqual([
      "profiles",
      "scans",
      "check_ins",
      "workout_completions",
      "weekly_reviews",
      "subscriptions",
      "stripe_webhook_events",
    ]);
  });

  it("reports missing RLS, storage, and webhook protections", () => {
    const failures = checkSupabaseSchema("create table public.scans (id uuid);");

    expect(failures).toEqual(expect.arrayContaining([
      "Missing required SQL: alter table public.scans enable row level security;",
      "Missing required SQL: create table if not exists public.stripe_webhook_events",
      "Missing required SQL: 'scan-images'",
    ]));
    expect(formatSchemaFailures(failures)).toContain("Supabase schema check failed:");
  });
});
