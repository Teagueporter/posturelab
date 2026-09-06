import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.join(process.cwd(), "supabase/migrations/20260906052834_initial_production_schema.sql"),
  "utf8",
);

describe("Supabase production schema", () => {
  it("keeps every public app table protected by RLS", () => {
    for (const table of [
      "profiles",
      "scans",
      "check_ins",
      "workout_completions",
      "weekly_reviews",
      "subscriptions",
      "stripe_webhook_events",
    ]) {
      expect(migration).toContain(`alter table public.${table} enable row level security;`);
    }
  });

  it("deduplicates Stripe webhooks by event id without exposing user policies", () => {
    expect(migration).toContain("create table if not exists public.stripe_webhook_events");
    expect(migration).toContain("id text primary key");
    expect(migration).toContain("check (status in ('processing', 'processed', 'failed'))");
    expect(migration).not.toContain("on public.stripe_webhook_events for select");
    expect(migration).not.toContain("on public.stripe_webhook_events for insert");
    expect(migration).not.toContain("on public.stripe_webhook_events for update");
    expect(migration).not.toContain("on public.stripe_webhook_events for delete");
  });

  it("exposes only authenticated app tables through the Data API", () => {
    expect(migration).toContain("grant usage on schema public to authenticated;");
    expect(migration).toContain("grant select, insert, update on public.profiles to authenticated;");
    expect(migration).toContain("grant select, insert, update, delete on public.scans to authenticated;");
    expect(migration).toContain("grant select, insert, update, delete on public.check_ins to authenticated;");
    expect(migration).toContain("grant select, insert, update, delete on public.workout_completions to authenticated;");
    expect(migration).toContain("grant select, insert, update, delete on public.weekly_reviews to authenticated;");
    expect(migration).toContain("grant select on public.subscriptions to authenticated;");
    expect(migration).not.toContain(" to anon;");
  });

  it("keeps scan photo storage private and scoped to the user's folder", () => {
    expect(migration).toContain("'scan-images'");
    expect(migration).toContain("false,\n  10485760");
    expect(migration).toContain("array['image/jpeg', 'image/png', 'image/webp']");
    expect(migration).toContain("drop policy if exists \"Users can read their own scan images\" on storage.objects;");
    expect(migration).toContain("(storage.foldername(name))[1] = (select auth.uid())::text");
  });

  it("sets a fixed search path on trigger functions for Supabase advisors", () => {
    expect(migration).toContain("create or replace function public.set_updated_at()");
    expect(migration).toContain("set search_path = ''");
  });
});
