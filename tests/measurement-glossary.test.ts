import { describe, expect, it } from "vitest";
import { analyzeScan } from "@/lib/measurements/analyze";
import { glossaryForMeasurement, measurementGlossary } from "@/lib/measurements/glossary";
import { POSE } from "@/lib/pose/landmarks";
import type { Landmark } from "@/lib/pose/types";

describe("measurement glossary", () => {
  it("covers every measurement currently produced by analysis", () => {
    const scan = analyzeScan({
      front: pose(),
      leftSide: pose(),
      rightSide: pose(),
      back: pose(),
    });
    const missing = scan.measurements.filter((measurement) => !glossaryForMeasurement(measurement.id)).map((measurement) => measurement.id);
    expect(missing).toEqual([]);
  });

  it("explains the reference direction for every active measurement", () => {
    const scan = analyzeScan({
      front: pose(),
      leftSide: pose(),
      rightSide: pose(),
      back: pose(),
    });
    for (const measurement of scan.measurements) {
      expect(glossaryForMeasurement(measurement.id)?.reference).toBeTruthy();
    }
  });

  it("keeps kyphosis-related proxy wording bounded", () => {
    const kyphosisProxy = measurementGlossary.find((entry) => entry.id === "ear_over_shoulder_offset");
    expect(kyphosisProxy?.means).toContain("proxy");
    expect(kyphosisProxy?.doesNotMean).toContain("does not diagnose kyphosis");
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
