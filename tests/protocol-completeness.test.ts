import { describe, expect, it } from "vitest";
import { decisionRules, protocolPhases } from "@/lib/interpretation/rules";

describe("self-experiment protocol", () => {
  it("defines actionable phases with criteria", () => {
    expect(protocolPhases.length).toBeGreaterThanOrEqual(4);
    for (const phase of protocolPhases) {
      expect(phase.name).toBeTruthy();
      expect(phase.timing).toBeTruthy();
      expect(phase.actions.length).toBeGreaterThanOrEqual(3);
      expect(phase.successCriteria.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("defines decision rules with trigger, action, and rationale", () => {
    expect(decisionRules.length).toBeGreaterThanOrEqual(4);
    for (const rule of decisionRules) {
      expect(rule.trigger).toBeTruthy();
      expect(rule.action).toBeTruthy();
      expect(rule.rationale).toBeTruthy();
    }
  });
});
