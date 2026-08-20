import { describe, expect, it } from "vitest";
import { measurementTrend, measurementTargets } from "@/lib/interpretation/progress";
import type { ScanAnalysis } from "@/lib/measurements/types";

const target = measurementTargets[0];

describe("measurement trends", () => {
  it("requires at least three scans before trend claims", () => {
    const trend = measurementTrend([scan("2026-01-01", 14), scan("2026-01-08", 12)], target);
    expect(trend.status).toBe("not-enough-data");
  });

  it("marks decreasing target as improving when enough scans exist", () => {
    const trend = measurementTrend([scan("2026-01-15", 10), scan("2026-01-08", 12), scan("2026-01-01", 14)], target);
    expect(trend.status).toBe("improving");
    expect(trend.delta).toBe(-4);
  });
});

function scan(createdAt: string, value: number): ScanAnalysis {
  return {
    id: createdAt,
    createdAt,
    front: { landmarks: [] },
    leftSide: { landmarks: [] },
    rightSide: { landmarks: [] },
    back: { landmarks: [] },
    measurements: [{
      id: target.id,
      label: target.label,
      value,
      unit: "%",
      quality: "High",
      explanation: "",
      limitations: "",
      view: "leftSide",
      landmarks: [],
    }],
    quality: {
      overall: "High",
      trendReady: true,
      notes: [],
      views: {
        front: viewQuality("front"),
        leftSide: viewQuality("leftSide"),
        rightSide: viewQuality("rightSide"),
        back: viewQuality("back"),
      },
    },
  };
}

function viewQuality(view: "front" | "leftSide" | "rightSide" | "back") {
  return {
    view,
    quality: "High" as const,
    requiredVisible: true,
    fullBodyVisible: true,
    cropWarnings: [],
    lowConfidenceLandmarks: [],
    notes: [],
  };
}
