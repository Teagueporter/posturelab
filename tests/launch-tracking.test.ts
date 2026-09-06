import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const tracker = source("LAUNCH_TRACKER.md");

describe("launch tracking", () => {
  it("keeps launch tasks in a committed tracker", () => {
    expect(tracker).toContain("## Supabase");
    expect(tracker).toContain("## Stripe");
    expect(tracker).toContain("## Vercel");
    expect(tracker).toContain("## Connector Status");
    expect(tracker).toContain("403 Resource not accessible by integration");
    expect(tracker).toContain("Re-verified with the Supabase connector");
    expect(tracker).toContain("project cost `$0/month`");
    expect(tracker).toContain("no Stripe MCP create/list tools were exposed");
  });

  it("keeps GitHub issue templates for each external launch track", () => {
    for (const template of ["supabase-launch.md", "stripe-launch.md", "vercel-launch.md"]) {
      expect(existsSync(path.join(process.cwd(), ".github/ISSUE_TEMPLATE", template))).toBe(true);
    }
  });

  it("links the launch tracker from the README", () => {
    expect(source("README.md")).toContain("LAUNCH_TRACKER.md");
  });
});

function source(filePath: string) {
  return readFileSync(path.join(process.cwd(), filePath), "utf8");
}
