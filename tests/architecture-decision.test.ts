import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const adrPath = path.join(process.cwd(), "docs/adr/0001-web-first-supabase-stripe-vercel.md");

describe("architecture decision records", () => {
  it("records the web-first Supabase Stripe Vercel stack decision", () => {
    expect(existsSync(adrPath)).toBe(true);
    const adr = readFileSync(adrPath, "utf8");

    expect(adr).toContain("Status: Accepted");
    expect(adr).toContain("web-first Next.js app on Vercel");
    expect(adr).toContain("Supabase for Auth/Postgres/private Storage");
    expect(adr).toContain("Stripe Billing for subscriptions");
    expect(adr).toContain("Base44 remains useful for rapid app prototypes");
    expect(adr).toContain("iOS can come later");
    expect(adr).toContain("npm run launch:ready");
  });
});
