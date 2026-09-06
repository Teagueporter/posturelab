import { readFileSync } from "node:fs";
import path from "node:path";
import packageJson from "@/../package.json";
import { describe, expect, it } from "vitest";

const config = readFileSync(path.join(process.cwd(), "supabase/config.toml"), "utf8");

describe("Supabase local project config", () => {
  it("matches the local app callback URL", () => {
    expect(config).toContain('site_url = "http://localhost:3000"');
    expect(config).toContain('additional_redirect_urls = ["http://localhost:3000/auth/callback"]');
  });

  it("does not require a seed file for migration resets", () => {
    expect(config).toContain("[db.seed]");
    expect(config).toContain("enabled = false");
  });

  it("exposes local Supabase helpers through package scripts", () => {
    expect(packageJson.scripts["supabase:start"]).toBe("supabase start");
    expect(packageJson.scripts["supabase:reset"]).toBe("supabase db reset --local");
    expect(packageJson.scripts["supabase:lint"]).toBe("supabase db lint --local --fail-on warning");
    expect(packageJson.scripts["supabase:schema-check"]).toBe("node scripts/check-supabase-schema.mjs");
    expect(packageJson.scripts["supabase:status"]).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(packageJson.scripts["supabase:status"]).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    expect(packageJson.scripts["supabase:status"]).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});
