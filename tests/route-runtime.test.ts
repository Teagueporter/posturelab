import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function routeSource(routePath: string) {
  return readFileSync(path.join(process.cwd(), routePath), "utf8");
}

describe("server route runtime contracts", () => {
  it("keeps Stripe webhook processing on the Node.js runtime", () => {
    expect(routeSource("src/app/api/stripe/webhook/route.ts")).toContain('export const runtime = "nodejs";');
  });

  it("keeps account export on the Node.js runtime", () => {
    expect(routeSource("src/app/api/account/export/route.ts")).toContain('export const runtime = "nodejs";');
  });
});
