import { describe, expect, it } from "vitest";
import { evidenceNotes } from "@/lib/interpretation/rules";

describe("evidence boundaries", () => {
  it("gives every evidence note source type, strength, and claim boundary", () => {
    for (const source of evidenceNotes) {
      expect(source.type).toBeTruthy();
      expect(source.strength).toBeTruthy();
      expect(source.claimBoundary).toBeTruthy();
      expect(source.url).toMatch(/^https:\/\//);
    }
  });

  it("keeps hyperkyphosis exercise evidence cautious", () => {
    const kyphosisEvidence = evidenceNotes.find((source) => source.label.toLowerCase().includes("hyperkyphotic"));
    expect(kyphosisEvidence?.strength).toBe("limited");
    expect(kyphosisEvidence?.claimBoundary).toContain("does not justify diagnosing kyphosis");
  });
});
