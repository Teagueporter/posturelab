import { describe, expect, it } from "vitest";
import { assessScanQuality, assessViewQuality } from "@/lib/pose/scan-quality";
import { POSE } from "@/lib/pose/landmarks";
import type { PoseResult } from "@/lib/pose/types";

describe("scan quality", () => {
  it("keeps upper-body scans trend ready when ankles are cropped", () => {
    const pose = poseWith({ ankleY: 1.08, ankleVisibility: 0.2 });
    const quality = assessViewQuality("front", pose);
    expect(quality.requiredVisible).toBe(true);
    expect(quality.fullBodyVisible).toBe(true);
    expect(quality.cropWarnings).not.toContain("One or both ankles appear outside the frame.");
    expect(quality.quality).toBe("High");
  });

  it("requires all views to have upper-body landmarks for trend readiness", () => {
    const good = poseWith({ ankleY: 0.9, ankleVisibility: 0.95 });
    const bad = poseWith({ ankleY: 0.9, ankleVisibility: 0.95, shoulderVisibility: 0.2 });
    const report = assessScanQuality({ front: good, leftSide: good, rightSide: good, back: bad });
    expect(report.trendReady).toBe(false);
    expect(report.overall).toBe("Unavailable");
  });
});

function poseWith({ ankleY, ankleVisibility, shoulderVisibility = 0.95 }: { ankleY: number; ankleVisibility: number; shoulderVisibility?: number }): PoseResult {
  const landmarks = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.95, presence: 0.95 }));
  landmarks[POSE.LEFT_EAR] = { x: 0.45, y: 0.2, visibility: 0.95, presence: 0.95 };
  landmarks[POSE.RIGHT_EAR] = { x: 0.55, y: 0.2, visibility: 0.95, presence: 0.95 };
  landmarks[POSE.LEFT_SHOULDER] = { x: 0.35, y: 0.35, visibility: shoulderVisibility, presence: shoulderVisibility };
  landmarks[POSE.RIGHT_SHOULDER] = { x: 0.65, y: 0.35, visibility: shoulderVisibility, presence: shoulderVisibility };
  landmarks[POSE.LEFT_HIP] = { x: 0.4, y: 0.6, visibility: 0.95, presence: 0.95 };
  landmarks[POSE.RIGHT_HIP] = { x: 0.6, y: 0.6, visibility: 0.95, presence: 0.95 };
  landmarks[POSE.LEFT_KNEE] = { x: 0.42, y: 0.78, visibility: 0.95, presence: 0.95 };
  landmarks[POSE.RIGHT_KNEE] = { x: 0.58, y: 0.78, visibility: 0.95, presence: 0.95 };
  landmarks[POSE.LEFT_ANKLE] = { x: 0.42, y: ankleY, visibility: ankleVisibility, presence: ankleVisibility };
  landmarks[POSE.RIGHT_ANKLE] = { x: 0.58, y: ankleY, visibility: ankleVisibility, presence: ankleVisibility };
  return { landmarks };
}
