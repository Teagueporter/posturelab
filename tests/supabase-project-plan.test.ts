import { describe, expect, it } from "vitest";
import { buildSupabaseProjectPlan, supabaseProjectPlan } from "../scripts/supabase-project-plan.mjs";

describe("Supabase project plan", () => {
  it("prints the connector-confirmed project target and approval phrase", () => {
    const output = buildSupabaseProjectPlan();

    expect(output).toContain("- Project: posturelab");
    expect(output).toContain("- Organization: teagueporter's projects");
    expect(output).toContain("- Current quoted project cost: $0/month");
    expect(output).toContain(
      "Approve creating the Supabase project posturelab in teagueporter's projects for $0/month.",
    );
  });

  it("includes migration, storage, redirect, and verification steps", () => {
    const output = buildSupabaseProjectPlan();

    expect(output).toContain("supabase/migrations/20260906052834_initial_production_schema.sql");
    expect(output).toContain("scan-images bucket exists and is private");
    expect(output).toContain("http://localhost:3000/auth/callback");
    expect(output).toContain("https://posturelab-six.vercel.app/auth/callback");
    expect(output).toContain("npm run supabase:live-check");
  });

  it("does not print Supabase key-shaped values", () => {
    const output = buildSupabaseProjectPlan();

    expect(supabaseProjectPlan.requiredEnv).toEqual([
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ]);
    expect(output).not.toMatch(/\b(?:sb_secret_|sb_publishable_|eyJ)[A-Za-z0-9._-]+/);
  });
});
