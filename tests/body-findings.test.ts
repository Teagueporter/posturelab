import { describe, expect, it } from "vitest";
import { buildBodyFindings, evidenceTakeaways } from "@/lib/interpretation/body-findings";
import type { ScanAnalysis } from "@/lib/measurements/types";

describe("body findings", () => {
  it("combines side-view neck measures into one forward-head finding", () => {
    const findings = buildBodyFindings(scan());
    const forwardHead = findings.find((finding) => finding.id === "forward_head");

    expect(forwardHead?.severity).toBe("high");
    expect(forwardHead?.title).toContain("Forward head");
    expect(forwardHead?.measurementIds).toContain("leftSide_neck_lean");
    expect(forwardHead?.measurementIds).toContain("rightSide_neck_lean");
  });

  it("keeps a rounded shoulder and upper-back proxy visible", () => {
    const findings = buildBodyFindings(scan());
    const roundedUpperBack = findings.find((finding) => finding.id === "rounded_upper_back");

    expect(roundedUpperBack?.severity).toBe("moderate");
    expect(roundedUpperBack?.title).toContain("Rounded shoulders");
    expect(roundedUpperBack?.exercises).toContain("Pec doorway stretch");
  });

  it("links evidence-backed training takeaways to sources", () => {
    expect(evidenceTakeaways.length).toBeGreaterThanOrEqual(3);
    for (const takeaway of evidenceTakeaways) {
      expect(takeaway.url).toMatch(/^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\//);
    }
  });
});

function scan(): ScanAnalysis {
  return {
    id: "scan",
    createdAt: "2026-01-01T00:00:00.000Z",
    front: { landmarks: [] },
    leftSide: { landmarks: [] },
    rightSide: { landmarks: [] },
    back: { landmarks: [] },
    measurements: [
      m("leftSide_ear_over_shoulder_offset", 11.5, "%"),
      m("rightSide_ear_over_shoulder_offset", 15.9, "%"),
      m("leftSide_neck_lean", 14.3, "deg"),
      m("rightSide_neck_lean", 21.5, "deg"),
      m("leftSide_craniovertebral_angle_proxy", 75.7, "deg"),
      m("rightSide_craniovertebral_angle_proxy", 68.5, "deg"),
      m("leftSide_shoulder_over_hip_offset", 4.2, "%"),
      m("rightSide_shoulder_over_hip_offset", 5.3, "%"),
      m("front_shoulder_tilt", 2.1, "deg"),
      m("back_shoulder_tilt", 0.8, "deg"),
      m("front_shoulder_hip_tilt_difference", 1.1, "deg"),
      m("back_shoulder_hip_tilt_difference", 0.4, "deg"),
      m("front_trunk_lean", 1, "deg"),
      m("back_trunk_lean", 0.1, "deg"),
      m("leftSide_trunk_lean", 2, "deg"),
      m("rightSide_trunk_lean", 5.3, "deg"),
    ],
    quality: {
      overall: "High",
      trendReady: true,
      notes: [],
      views: {
        front: view("front"),
        leftSide: view("leftSide"),
        rightSide: view("rightSide"),
        back: view("back"),
      },
    },
  };
}

function m(id: string, value: number, unit: "deg" | "%") {
  return {
    id,
    label: id,
    value,
    unit,
    quality: "High" as const,
    explanation: "",
    limitations: "",
    view: id.startsWith("leftSide") ? "leftSide" as const : id.startsWith("rightSide") ? "rightSide" as const : id.startsWith("back") ? "back" as const : "front" as const,
    landmarks: [],
  };
}

function view(viewName: "front" | "leftSide" | "rightSide" | "back") {
  return {
    view: viewName,
    quality: "High" as const,
    requiredVisible: true,
    fullBodyVisible: true,
    cropWarnings: [],
    lowConfidenceLandmarks: [],
    notes: [],
  };
}
