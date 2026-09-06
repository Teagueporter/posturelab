import { describe, expect, it } from "vitest";
import { buildSupabaseMigrationPlan, formatSupabaseMigrationPlan } from "../scripts/supabase-migration-plan.mjs";

describe("Supabase migration plan", () => {
  it("summarizes the checked migration and post-approval apply path", () => {
    const plan = buildSupabaseMigrationPlan();
    const output = formatSupabaseMigrationPlan(plan);

    expect(plan.ok).toBe(true);
    expect(plan.tableCount).toBe(7);
    expect(plan.storagePolicyCount).toBe(4);
    expect(output).toContain("Supabase migration plan: READY");
    expect(output).toContain("supabase/migrations/20260906052834_initial_production_schema.sql");
    expect(output).toContain("scan-images");
    expect(output).toContain("apply the migration SQL through the Supabase connector");
    expect(output).toContain("npm run supabase:live-check");
  });

  it("reports schema failures before live apply", () => {
    const plan = buildSupabaseMigrationPlan({ sql: "create table public.profiles (id uuid primary key);" });
    const output = formatSupabaseMigrationPlan(plan);

    expect(plan.ok).toBe(false);
    expect(output).toContain("Supabase migration plan: NOT READY");
    expect(output).toContain("Migration failures:");
    expect(output).toContain("Missing required SQL");
  });
});
