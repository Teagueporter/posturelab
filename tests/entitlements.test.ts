import { describe, expect, it } from "vitest";
import { hasReachedFreeScanLimit } from "@/lib/billing/entitlements";
import { parseBillingInterval, plans } from "@/lib/billing/plans";

describe("hasReachedFreeScanLimit", () => {
  it("does not block when the paywall is disabled", () => {
    expect(hasReachedFreeScanLimit({ localScanCount: 4, paywallEnabled: false })).toBe(false);
  });

  it("does not block pro users", () => {
    expect(hasReachedFreeScanLimit({ cloudScanCount: 3, isPro: true, localScanCount: 3, paywallEnabled: true })).toBe(false);
  });

  it("blocks free users once either local or cloud scan count reaches the free limit", () => {
    expect(hasReachedFreeScanLimit({ cloudScanCount: 1, localScanCount: 0, paywallEnabled: true })).toBe(true);
    expect(hasReachedFreeScanLimit({ cloudScanCount: 0, localScanCount: 1, paywallEnabled: true })).toBe(true);
  });
});

describe("parseBillingInterval", () => {
  it("accepts only supported paid plan intervals", () => {
    expect(parseBillingInterval("monthly")).toBe("monthly");
    expect(parseBillingInterval("yearly")).toBe("yearly");
  });

  it("rejects malformed interval values instead of defaulting to a paid plan", () => {
    expect(parseBillingInterval("weekly")).toBeNull();
    expect(parseBillingInterval("")).toBeNull();
    expect(parseBillingInterval(null)).toBeNull();
  });
});

describe("pricing plans", () => {
  it("describes the free/pro product boundary in user-facing terms", () => {
    const freePlan = plans.find((plan) => plan.id === "free");
    const proPlans = plans.filter((plan) => plan.id === "pro");

    expect(freePlan?.features).toContain("1 saved scan");
    expect(freePlan?.limits).toEqual(expect.arrayContaining(["No weekly progress review", "No report export"]));
    expect(proPlans).toHaveLength(2);
    for (const plan of proPlans) {
      expect(plan.features).toEqual(expect.arrayContaining(["Unlimited scans", "Weekly progress reviews", "Exportable reports"]));
      expect(plan.audience.length).toBeGreaterThan(20);
      expect(plan.limits.join(" ")).toContain("Photo-based tracking only");
    }
  });
});
