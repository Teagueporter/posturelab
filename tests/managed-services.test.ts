import { describe, expect, it } from "vitest";
import {
  disallowedDependencies,
  managedServiceMessages,
  requiredManagedDependencies,
  requiredManagedFiles,
} from "@/../scripts/check-managed-services.mjs";

describe("managed service boundary", () => {
  it("keeps Supabase Stripe and Vercel as the production backbone", () => {
    expect(managedServiceMessages()).toEqual([]);
  });

  it("documents the managed services that should not be replaced casually", () => {
    expect(requiredManagedDependencies).toEqual(
      expect.arrayContaining([
        "@supabase/ssr",
        "@supabase/supabase-js",
        "stripe",
        "@vercel/analytics",
        "@vercel/speed-insights",
      ]),
    );
    expect(requiredManagedFiles).toEqual(
      expect.arrayContaining([
        "src/lib/supabase/server.ts",
        "src/lib/stripe/server.ts",
        "src/app/api/stripe/webhook/route.ts",
      ]),
    );
    expect(disallowedDependencies).toEqual(expect.arrayContaining(["firebase", "next-auth", "prisma"]));
  });
});
