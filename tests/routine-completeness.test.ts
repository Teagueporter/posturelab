import { describe, expect, it } from "vitest";
import { routine } from "@/lib/interpretation/rules";

describe("routine completeness", () => {
  it("keeps every routine item actionable and safety bounded", () => {
    expect(routine.length).toBeGreaterThan(0);
    for (const item of routine) {
      expect(item.name).toBeTruthy();
      expect(item.dosage).toBeTruthy();
      expect(item.reason).toBeTruthy();
      expect(item.setup).toBeTruthy();
      expect(item.steps.length).toBeGreaterThanOrEqual(3);
      expect(item.cues.length).toBeGreaterThanOrEqual(3);
      expect(item.levels).toHaveLength(3);
      for (const level of item.levels) {
        expect(level.name).toBeTruthy();
        expect(level.prescription).toBeTruthy();
        expect(level.whenToUse).toBeTruthy();
      }
      expect(item.progression).toBeTruthy();
      expect(item.stopIf).toBeTruthy();
      expect(item.targetMeasurements.length).toBeGreaterThan(0);
    }
  });
});
