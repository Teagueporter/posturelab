import { describe, expect, it } from "vitest";
import { measureFront } from "@/lib/measurements/front";
import { POSE } from "@/lib/pose/landmarks";
import type { Landmark } from "@/lib/pose/types";

describe("front measurements", () => {
  it("calculates shoulder tilt and normalized head offset", () => {
    const landmarks = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.95, presence: 0.95 })) as Landmark[];
    landmarks[POSE.LEFT_EYE] = { x: 0.48, y: 0.2, visibility: 0.95, presence: 0.95 };
    landmarks[POSE.RIGHT_EYE] = { x: 0.58, y: 0.2, visibility: 0.95, presence: 0.95 };
    landmarks[POSE.LEFT_SHOULDER] = { x: 0.3, y: 0.3, visibility: 0.95, presence: 0.95 };
    landmarks[POSE.RIGHT_SHOULDER] = { x: 0.7, y: 0.34, visibility: 0.95, presence: 0.95 };
    landmarks[POSE.LEFT_HIP] = { x: 0.35, y: 0.65, visibility: 0.95, presence: 0.95 };
    landmarks[POSE.RIGHT_HIP] = { x: 0.65, y: 0.65, visibility: 0.95, presence: 0.95 };
    const measurements = measureFront(landmarks);
    expect(measurements.find((m) => m.id === "front_shoulder_tilt")?.value).toBe(5.7);
    expect(measurements.find((m) => m.id === "front_head_lateral_offset")?.value).toBe(7.5);
    expect(measurements.find((m) => m.id === "front_shoulder_hip_tilt_difference")?.value).toBe(5.7);
  });
});
