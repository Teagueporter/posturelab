import type { MeasurementQuality, ScanQualityReport, ViewQualityReport } from "@/lib/measurements/types";
import { LANDMARK_NAMES, POSE } from "@/lib/pose/landmarks";
import { landmarkConfidence } from "@/lib/pose/quality";
import type { PoseResult } from "@/lib/pose/types";

type ViewName = "front" | "leftSide" | "rightSide" | "back";

const required = [POSE.LEFT_EAR, POSE.RIGHT_EAR, POSE.LEFT_SHOULDER, POSE.RIGHT_SHOULDER, POSE.LEFT_HIP, POSE.RIGHT_HIP];

export function assessScanQuality(input: Record<ViewName, PoseResult>): ScanQualityReport {
  const views = {
    front: assessViewQuality("front", input.front),
    leftSide: assessViewQuality("leftSide", input.leftSide),
    rightSide: assessViewQuality("rightSide", input.rightSide),
    back: assessViewQuality("back", input.back),
  };
  const qualities = Object.values(views).map((view) => view.quality);
  const overall = minQuality(qualities);
  const trendReady = Object.values(views).every((view) => view.requiredVisible && view.quality !== "Unavailable");
  const notes = [
    ...new Set(Object.values(views).flatMap((view) => view.notes)),
  ];

  return { overall, views, trendReady, notes };
}

export function assessViewQuality(view: ViewName, pose: PoseResult): ViewQualityReport {
  const landmarks = pose.landmarks;
  const requiredVisible = required.every((index) => landmarkConfidence(landmarks[index]) >= 0.62);
  const fullBodyVisible = requiredVisible;
  const lowConfidenceLandmarks = required
    .filter((index) => landmarkConfidence(landmarks[index]) < 0.62)
    .map((index) => LANDMARK_NAMES[index] ?? `landmark_${index}`);
  const cropWarnings = cropWarningsFor(landmarks, view);
  const quality = qualityFor(requiredVisible, fullBodyVisible, lowConfidenceLandmarks.length, cropWarnings.length);
  const notes = notesFor(view, requiredVisible, fullBodyVisible, cropWarnings, lowConfidenceLandmarks);

  return {
    view,
    quality,
    requiredVisible,
    fullBodyVisible,
    cropWarnings,
    lowConfidenceLandmarks,
    notes,
  };
}

function cropWarningsFor(landmarks: PoseResult["landmarks"], view: ViewName) {
  const warnings: string[] = [];
  const points = required.map((index) => landmarks[index]).filter(Boolean);
  if (points.some((point) => point.y > 0.92)) warnings.push("Hips are too close to the bottom edge.");
  if (points.some((point) => point.y < 0.04)) warnings.push("Head is too close to the top edge.");
  if (points.some((point) => point.x < 0.04)) warnings.push(`${labelFor(view)} is too close to the left edge.`);
  if (points.some((point) => point.x > 0.96)) warnings.push(`${labelFor(view)} is too close to the right edge.`);
  return warnings;
}

function qualityFor(requiredVisible: boolean, _fullBodyVisible: boolean, lowConfidenceCount: number, cropWarningCount: number): MeasurementQuality {
  if (!requiredVisible) return "Unavailable";
  if (lowConfidenceCount === 0 && cropWarningCount === 0) return "High";
  if (cropWarningCount <= 1) return "Medium";
  return "Low";
}

function notesFor(view: ViewName, requiredVisible: boolean, fullBodyVisible: boolean, cropWarnings: string[], lowConfidenceLandmarks: string[]) {
  const notes: string[] = [];
  if (!requiredVisible) notes.push(`${labelFor(view)} is missing core head/shoulder/hip landmarks.`);
  if (!fullBodyVisible) notes.push(`${labelFor(view)} is not upper-body trend ready; head, shoulders, and hips need clearer capture.`);
  if (cropWarnings.length) notes.push(...cropWarnings);
  if (lowConfidenceLandmarks.length) notes.push(`Low confidence: ${lowConfidenceLandmarks.join(", ")}.`);
  return notes;
}

function minQuality(qualities: MeasurementQuality[]): MeasurementQuality {
  const order: MeasurementQuality[] = ["Unavailable", "Low", "Medium", "High"];
  return qualities.reduce((lowest, current) => order.indexOf(current) < order.indexOf(lowest) ? current : lowest, "High" as MeasurementQuality);
}

function labelFor(view: ViewName) {
  return view === "leftSide" ? "Left side view" : view === "rightSide" ? "Right side view" : `${view[0].toUpperCase()}${view.slice(1)} view`;
}
