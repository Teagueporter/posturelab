import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import packageJson from "@/../package.json";

describe("Vercel observability", () => {
  it("mounts managed Web Analytics and Speed Insights globally", () => {
    const layoutSource = readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8");

    expect(layoutSource).toContain('import { Analytics } from "@vercel/analytics/next";');
    expect(layoutSource).toContain('import { SpeedInsights } from "@vercel/speed-insights/next";');
    expect(layoutSource).toContain("<Analytics />");
    expect(layoutSource).toContain("<SpeedInsights />");
  });

  it("uses official Vercel packages instead of custom analytics tables", () => {
    expect(packageJson.dependencies).toMatchObject({
      "@vercel/analytics": "^1.3.1",
      "@vercel/speed-insights": "^0.0.8",
    });
  });
});
