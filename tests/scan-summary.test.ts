import { describe, expect, it } from "vitest";
import { buildTrackingScore, buildWeeklyProgressReview, weeklyReviewStartKey } from "@/lib/interpretation/scan-summary";
import type { ScanAnalysis } from "@/lib/measurements/types";

describe("scan summary", () => {
  it("builds a bounded tracking score from scan measurements", () => {
    const score = buildTrackingScore(scan("2026-01-01T00:00:00.000Z", 12));
    expect(score.total).toBeGreaterThan(0);
    expect(score.total).toBeLessThanOrEqual(100);
    expect(score.parts.map((part) => part.label)).toContain("Head position");
    expect(score.summary).toContain("not a diagnosis");
  });

  it("keeps weekly review in baseline mode until enough scans exist", () => {
    const review = buildWeeklyProgressReview({
      scans: [scan("2026-01-07T00:00:00.000Z", 12), scan("2026-01-01T00:00:00.000Z", 14)],
      checkIns: [],
      completions: [],
      routineCount: 6,
      today: new Date("2026-01-07T12:00:00.000Z"),
    });
    expect(review.status).toBe("baseline");
    expect(review.bullets.join(" ")).toContain("1 more comparable scan");
  });

  it("uses the same seven-day window start for weekly review persistence", () => {
    expect(weeklyReviewStartKey(new Date("2026-01-07T12:00:00.000Z"))).toBe("2026-01-01");
  });
});

function scan(createdAt: string, headOffset: number): ScanAnalysis {
  return {
    id: createdAt,
    createdAt,
    front: { landmarks: [] },
    leftSide: { landmarks: [] },
    rightSide: { landmarks: [] },
    back: { landmarks: [] },
    measurements: [
      m("leftSide_ear_over_shoulder_offset", headOffset, "%"),
      m("rightSide_ear_over_shoulder_offset", headOffset, "%"),
      m("leftSide_neck_lean", 18, "deg"),
      m("rightSide_neck_lean", 18, "deg"),
      m("leftSide_shoulder_over_hip_offset", 5, "%"),
      m("rightSide_shoulder_over_hip_offset", 5, "%"),
      m("front_trunk_lean", 2, "deg"),
      m("back_trunk_lean", 2, "deg"),
      m("front_shoulder_tilt", 1, "deg"),
      m("back_shoulder_tilt", 1, "deg"),
      m("front_shoulder_hip_tilt_difference", 2, "deg"),
      m("back_shoulder_hip_tilt_difference", 2, "deg"),
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
