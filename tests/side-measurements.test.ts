import { describe, expect, it } from "vitest";
import { measureSide } from "@/lib/measurements/side";
import { POSE } from "@/lib/pose/landmarks";
import type { Landmark } from "@/lib/pose/types";

describe("side measurements", () => {
  it("calculates ear over shoulder offset", () => {
    const landmarks = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.95, presence: 0.95 })) as Landmark[];
    landmarks[POSE.LEFT_EAR] = { x: 0.56, y: 0.2, visibility: 0.95, presence: 0.95 };
    landmarks[POSE.RIGHT_EAR] = { x: 0.56, y: 0.2, visibility: 0.95, presence: 0.95 };
    landmarks[POSE.LEFT_SHOULDER] = { x: 0.5, y: 0.35, visibility: 0.95, presence: 0.95 };
    landmarks[POSE.RIGHT_SHOULDER] = { x: 0.5, y: 0.35, visibility: 0.95, presence: 0.95 };
    landmarks[POSE.LEFT_HIP] = { x: 0.5, y: 0.65, visibility: 0.95, presence: 0.95 };
    landmarks[POSE.RIGHT_HIP] = { x: 0.5, y: 0.65, visibility: 0.95, presence: 0.95 };
    const measurements = measureSide(landmarks);
    expect(measurements.find((m) => m.id === "leftSide_ear_over_shoulder_offset")?.value).toBe(20);
    expect(measurements.find((m) => m.id === "leftSide_ear_over_hip_offset")?.value).toBe(20);
    expect(measurements.find((m) => m.id === "leftSide_neck_lean")?.value).toBe(21.8);
    expect(measurements.find((m) => m.id === "leftSide_craniovertebral_angle_proxy")?.value).toBe(68.2);
    expect(measurements.find((m) => m.id === "leftSide_gaze_angle_proxy")?.quality).toBe("High");
  });
});
