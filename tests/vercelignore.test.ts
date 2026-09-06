import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const vercelIgnore = readFileSync(path.join(process.cwd(), ".vercelignore"), "utf8")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

describe("Vercel deployment ignore rules", () => {
  it("excludes local-only and development artifacts from deployment uploads", () => {
    expect(vercelIgnore).toEqual(
      expect.arrayContaining([
        ".git/",
        ".github/",
        ".next/",
        "coverage/",
        "node_modules/",
        "tests/",
        "fleet-manager/",
        "supabase/.temp/",
        "GITHUB_OVERHAUL_AGENT_PROMPT.md",
        "GITHUB_PROFILE_README_DRAFT.md",
      ]),
    );
  });

  it("does not exclude runtime-critical project paths", () => {
    expect(vercelIgnore).not.toContain("src/");
    expect(vercelIgnore).not.toContain("package.json");
    expect(vercelIgnore).not.toContain("package-lock.json");
    expect(vercelIgnore).not.toContain("next.config.ts");
    expect(vercelIgnore).not.toContain("supabase/");
  });
});
