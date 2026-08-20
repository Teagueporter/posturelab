import type { MeasurementQuality } from "@/lib/measurements/types";
import type { Landmark } from "@/lib/pose/types";

export function landmarkConfidence(landmark?: Landmark): number {
  if (!landmark) return 0;
  const scores = [landmark.visibility, landmark.presence].filter(
    (score): score is number => typeof score === "number",
  );
  return scores.length ? Math.min(...scores) : 1;
}

export function qualityForLandmarks(landmarks: Landmark[], indexes: number[]): MeasurementQuality {
  const min = Math.min(...indexes.map((index) => landmarkConfidence(landmarks[index])));
  if (min >= 0.82) return "High";
  if (min >= 0.62) return "Medium";
  if (min >= 0.45) return "Low";
  return "Unavailable";
}

export function hasRequiredLandmarks(landmarks: Landmark[], indexes: number[], threshold = 0.45) {
  return indexes.every((index) => landmarkConfidence(landmarks[index]) >= threshold);
}
