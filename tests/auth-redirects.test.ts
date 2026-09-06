import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { safeNextPath } from "@/lib/auth/redirects";

describe("auth redirect helpers", () => {
  it("allows internal app paths with query strings and hashes", () => {
    expect(safeNextPath("/pricing?checkout=retry#plans")).toBe("/pricing?checkout=retry#plans");
  });

  it("falls back for external URLs and protocol-relative URLs", () => {
    expect(safeNextPath("https://example.com/pricing")).toBe("/account");
    expect(safeNextPath("//example.com/pricing")).toBe("/account");
  });

  it("falls back for empty, non-string, or backslash paths", () => {
    expect(safeNextPath("")).toBe("/account");
    expect(safeNextPath(null)).toBe("/account");
    expect(safeNextPath("/\\example.com")).toBe("/account");
  });

  it("supports a custom fallback", () => {
    expect(safeNextPath("https://example.com", "/pricing")).toBe("/pricing");
  });

  it("does not present auth forms as live before Supabase is configured", () => {
    const loginPage = source("src/app/login/page.tsx");
    const accountPage = source("src/app/account/page.tsx");

    expect(loginPage).toContain("const authReady = hasSupabaseBrowserEnv()");
    expect(loginPage).toContain("Sign-in is not live yet");
    expect(loginPage).toContain("{authReady ? (");
    expect(accountPage).toContain("Cloud accounts are not live yet");
    expect(accountPage).toContain("Start local scan");
  });
});

function source(filePath: string) {
  return readFileSync(path.join(process.cwd(), filePath), "utf8");
}
