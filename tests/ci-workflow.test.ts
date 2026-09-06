import { readFileSync } from "node:fs";
import path from "node:path";
import packageJson from "@/../package.json";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(path.join(process.cwd(), ".github/workflows/ci.yml"), "utf8");

describe("CI workflow", () => {
  it("uses the package verification script", () => {
    expect(workflow).toContain("run: npm run verify");
  });

  it("keeps verify aligned with the local quality gate", () => {
    expect(packageJson.scripts.verify).toContain("npm test");
    expect(packageJson.scripts.verify).toContain("npm run lint");
    expect(packageJson.scripts.verify).toContain("npm run build");
    expect(packageJson.scripts.verify).toContain("npm run supabase:schema-check");
    expect(packageJson.scripts["supabase:live-check"]).toBe("node scripts/check-live-supabase.mjs");
    expect(packageJson.scripts["stripe:live-check"]).toBe("node scripts/check-live-stripe.mjs");
    expect(packageJson.scripts["smoke:ready"]).toBe("node scripts/smoke-production.mjs --require-live-services");
    expect(packageJson.scripts["launch:status"]).toBe("node scripts/launch-status.mjs");
    expect(packageJson.scripts["vercel:env-plan"]).toBe("node scripts/vercel-env-plan.mjs");
  });
});
