import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("public repository metadata", () => {
  it("documents private security reporting without asking users to post sensitive data publicly", () => {
    const security = source("SECURITY.md");

    expect(security).toContain("Do not open a public GitHub issue");
    expect(security).toContain("teagueporter5@gmail.com");
    expect(security).toContain("Do not send real Stripe keys");
    expect(security).toContain("Supabase row-level security");
    expect(security).toContain("webhook verification");
  });

  it("documents support and medical boundaries", () => {
    const support = source("SUPPORT.md");

    expect(support).toContain("not medical software");
    expect(support).toContain("Product Support");
    expect(support).toContain("Medical Boundary");
    expect(support).toContain("licensed clinician");
  });

  it("keeps repository metadata files present", () => {
    expect(existsSync(path.join(process.cwd(), "SECURITY.md"))).toBe(true);
    expect(existsSync(path.join(process.cwd(), "SUPPORT.md"))).toBe(true);
  });
});

function source(filePath: string) {
  return readFileSync(path.join(process.cwd(), filePath), "utf8");
}
