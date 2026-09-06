import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(filePath: string) {
  return readFileSync(path.join(process.cwd(), filePath), "utf8");
}

describe("photo privacy onboarding", () => {
  it("explains photo storage before scan capture starts", () => {
    const scanWizard = source("src/components/scan/ScanWizard.tsx");

    expect(scanWizard).toContain("Photos stay on this device unless you sign in and cloud sync is configured.");
    expect(scanWizard).toContain('href="/privacy"');
    expect(scanWizard).toContain("you can delete cloud data from Account");
  });

  it("documents local-only scans and cloud photo export behavior in the privacy draft", () => {
    const privacyPage = source("src/app/privacy/page.tsx");

    expect(privacyPage).toContain("scans are kept in this browser&apos;s local storage");
    expect(privacyPage).toContain("Local-only scans are not sent to Supabase");
    expect(privacyPage).toContain("short-lived signed links for stored scan photos");
    expect(privacyPage).toContain("Payment details are handled by Stripe");
    expect(privacyPage).toContain("raw card numbers");
  });

  it("discloses Vercel analytics without treating posture data as analytics input", () => {
    const privacyPage = source("src/app/privacy/page.tsx");

    expect(privacyPage).toContain("Vercel Web Analytics and Speed Insights");
    expect(privacyPage).toContain("should not receive posture photos");
    expect(privacyPage).toContain("not used to generate posture findings");
  });

  it("keeps terms clear about wellness scope, billing, and acceptable use", () => {
    const termsPage = source("src/app/terms/page.tsx");

    expect(termsPage).toContain("diagnose, treat, cure, or prevent medical conditions");
    expect(termsPage).toContain("Paid subscriptions are managed by Stripe");
    expect(termsPage).toContain("Cloud sync, data export, account deletion, paid entitlements, and subscription state");
    expect(termsPage).toContain("should receive legal review before charging users");
  });
});
