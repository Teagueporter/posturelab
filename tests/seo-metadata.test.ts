import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

describe("SEO metadata routes", () => {
  it("publishes a sitemap for public product pages only", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toEqual([
      "http://localhost:3000",
      "http://localhost:3000/scan",
      "http://localhost:3000/plan",
      "http://localhost:3000/report",
      "http://localhost:3000/measurements",
      "http://localhost:3000/pricing",
      "http://localhost:3000/privacy",
      "http://localhost:3000/terms",
    ]);
    expect(urls.some((url) => url.includes("/results/"))).toBe(false);
    expect(urls.some((url) => url.includes("/account"))).toBe(false);
  });

  it("keeps account, auth, API, and scan-result pages out of robots indexing", () => {
    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/account", "/api/", "/auth/", "/history", "/lab", "/login", "/results/"],
      },
      sitemap: "http://localhost:3000/sitemap.xml",
    });
  });
});
