import { describe, expect, it } from "vitest";
import { analyzeScan } from "@/lib/measurements/analyze";
import { buildMarkdownReport } from "@/lib/report/report";
import { POSE } from "@/lib/pose/landmarks";
import type { Landmark } from "@/lib/pose/types";

describe("markdown report", () => {
  it("includes measurement, routine, protocol, evidence, and non-diagnosis language", () => {
    const scan = analyzeScan({
      id: "scan-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      front: pose(),
      leftSide: pose(),
      rightSide: pose(),
      back: pose(),
    });
    const report = buildMarkdownReport([scan], [{
      id: "checkin-1",
      date: "2026-01-01",
      discomfort: 2,
      postureControl: 6,
      energy: 7,
      redFlags: false,
      notes: "Felt fine.",
      createdAt: "2026-01-01T00:00:00.000Z",
    }]);
    expect(report).toContain("does not diagnose kyphosis");
    expect(report).toContain("## Subjective Check-Ins");
    expect(report).toContain("## Key Measurements");
    expect(report).toContain("## 12-Week Routine");
    expect(report).toContain("## Experiment Protocol");
    expect(report).toContain("## Evidence Notes");
  });
});

function pose() {
  const landmarks = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.95, presence: 0.95 })) as Landmark[];
  landmarks[POSE.LEFT_EYE] = { x: 0.43, y: 0.18, visibility: 0.95, presence: 0.95 };
  landmarks[POSE.RIGHT_EYE] = { x: 0.57, y: 0.18, visibility: 0.95, presence: 0.95 };
  landmarks[POSE.LEFT_EAR] = { x: 0.4, y: 0.2, visibility: 0.95, presence: 0.95 };
  landmarks[POSE.RIGHT_EAR] = { x: 0.6, y: 0.2, visibility: 0.95, presence: 0.95 };
  landmarks[POSE.LEFT_SHOULDER] = { x: 0.35, y: 0.35, visibility: 0.95, presence: 0.95 };
  landmarks[POSE.RIGHT_SHOULDER] = { x: 0.65, y: 0.35, visibility: 0.95, presence: 0.95 };
  landmarks[POSE.LEFT_HIP] = { x: 0.4, y: 0.6, visibility: 0.95, presence: 0.95 };
  landmarks[POSE.RIGHT_HIP] = { x: 0.6, y: 0.6, visibility: 0.95, presence: 0.95 };
  landmarks[POSE.LEFT_KNEE] = { x: 0.42, y: 0.78, visibility: 0.95, presence: 0.95 };
  landmarks[POSE.RIGHT_KNEE] = { x: 0.58, y: 0.78, visibility: 0.95, presence: 0.95 };
  landmarks[POSE.LEFT_ANKLE] = { x: 0.42, y: 0.9, visibility: 0.95, presence: 0.95 };
  landmarks[POSE.RIGHT_ANKLE] = { x: 0.58, y: 0.9, visibility: 0.95, presence: 0.95 };
  return { landmarks };
}
