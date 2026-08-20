import { describe, expect, it } from "vitest";
import { scanSetupProtocol } from "@/lib/pose/setup-protocol";

describe("scan setup protocol", () => {
  it("covers repeatability-critical setup risks", () => {
    const text = scanSetupProtocol.map((item) => `${item.title} ${item.detail} ${item.prevents.join(" ")}`).join(" ").toLowerCase();
    expect(scanSetupProtocol.length).toBeGreaterThanOrEqual(6);
    expect(text).toContain("camera");
    expect(text).toContain("level");
    expect(text).toContain("hips");
    expect(text).toContain("natural posture");
    expect(text).toContain("45 degree");
    expect(text).toContain("same");
  });

  it("keeps each setup item actionable", () => {
    for (const item of scanSetupProtocol) {
      expect(item.title).toBeTruthy();
      expect(item.detail.length).toBeGreaterThan(20);
      expect(item.prevents.length).toBeGreaterThanOrEqual(2);
    }
  });
});
