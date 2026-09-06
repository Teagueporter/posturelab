import { describe, expect, it } from "vitest";
import {
  appTables,
  checkSupabaseSchema,
  formatSchemaFailures,
  migrationPath,
  storagePolicyOperations,
  userOwnedTables,
} from "../scripts/check-supabase-schema.mjs";

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
    expect(Object.keys(userOwnedTables)).toEqual([
      "profiles",
      "scans",
      "check_ins",
      "workout_completions",
      "weekly_reviews",
      "subscriptions",
    ]);
    expect(storagePolicyOperations).toEqual(["select", "insert", "update", "delete"]);
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

  it("reports missing ownership predicates and storage guards", () => {
    const failures = checkSupabaseSchema(`
      alter table public.profiles enable row level security;
      alter table public.scans enable row level security;
      alter table public.check_ins enable row level security;
      alter table public.workout_completions enable row level security;
      alter table public.weekly_reviews enable row level security;
      alter table public.subscriptions enable row level security;
      alter table public.stripe_webhook_events enable row level security;
      create policy "bad scans" on public.scans for select to authenticated using (true);
      create policy "bad upload" on storage.objects for insert to authenticated with check (bucket_id = 'scan-images');
      create table if not exists public.stripe_webhook_events (id text primary key, status text check (status in ('processing', 'processed', 'failed')));
      grant usage on schema public to authenticated;
      grant select, insert, update on public.profiles to authenticated;
      grant select, insert, update, delete on public.scans to authenticated;
      grant select, insert, update, delete on public.check_ins to authenticated;
      grant select, insert, update, delete on public.workout_completions to authenticated;
      grant select, insert, update, delete on public.weekly_reviews to authenticated;
      grant select on public.subscriptions to authenticated;
      'scan-images'
      false,
        10485760
      array['image/jpeg', 'image/png', 'image/webp']
      create or replace function public.set_updated_at()
      set search_path = ''
    `);

    expect(failures).toEqual(expect.arrayContaining([
      "Missing ownership predicate on select policy for public.scans: (select auth.uid()) = user_id",
      "Missing user folder guard on insert storage policy",
    ]));
  });
});
