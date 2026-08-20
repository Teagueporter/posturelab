import { describe, expect, it } from "vitest";
import { measureFullBody } from "@/lib/measurements/full-body";
import { POSE } from "@/lib/pose/landmarks";
import type { Landmark } from "@/lib/pose/types";

describe("full body measurements", () => {
  it("calculates lower-body and whole-body metrics with low ankle quality surfaced", () => {
    const landmarks = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.95, presence: 0.95 })) as Landmark[];
    landmarks[POSE.LEFT_SHOULDER] = { x: 0.35, y: 0.3, visibility: 0.95, presence: 0.95 };
    landmarks[POSE.RIGHT_SHOULDER] = { x: 0.65, y: 0.3, visibility: 0.95, presence: 0.95 };
    landmarks[POSE.LEFT_HIP] = { x: 0.4, y: 0.6, visibility: 0.95, presence: 0.95 };
    landmarks[POSE.RIGHT_HIP] = { x: 0.6, y: 0.6, visibility: 0.95, presence: 0.95 };
    landmarks[POSE.LEFT_KNEE] = { x: 0.42, y: 0.78, visibility: 0.95, presence: 0.95 };
    landmarks[POSE.RIGHT_KNEE] = { x: 0.58, y: 0.8, visibility: 0.95, presence: 0.95 };
    landmarks[POSE.LEFT_ANKLE] = { x: 0.38, y: 0.95, visibility: 0.4, presence: 0.4 };
    landmarks[POSE.RIGHT_ANKLE] = { x: 0.62, y: 0.95, visibility: 0.4, presence: 0.4 };

    const measurements = measureFullBody(landmarks, "front");
    expect(measurements.find((m) => m.id === "front_knee_line_tilt")?.value).toBe(7.1);
    expect(measurements.find((m) => m.id === "front_stance_width")?.value).toBe(120);
    expect(measurements.find((m) => m.id === "front_whole_body_lean")?.quality).toBe("Unavailable");
  });
});
